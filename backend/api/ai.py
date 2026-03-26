from __future__ import annotations

import hashlib
import os
import re
from typing import Any, Dict, Literal, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from auth_mongodb import verify_firebase_token
from core.redis_setup import RedisCache
from services.ai.context_builder import ContextBuilder
from services.ai.llm_client import LLMClient
from services.ai.rag_service import RAGService


router = APIRouter(prefix="/ai", tags=["ai"])

context_builder = ContextBuilder()
rag_service = RAGService()
llm_client = LLMClient()
CACHE_TTL_SECONDS = int(os.getenv("AI_CACHE_TTL_SECONDS", "900"))


class StrategyAnalysisRequest(BaseModel):
    backtest_id: Optional[str] = None
    paper_session_id: Optional[str] = None
    focus_question: str = Field(
        default="Explain strengths, weaknesses, risk structure, and stability using available metrics."
    )


class PaperSessionAnalysisRequest(BaseModel):
    backtest_id: Optional[str] = None
    focus_question: str = Field(
        default="Review behavioral patterns, execution drift, and risk discipline from this paper session."
    )


class ControlledChatRequest(BaseModel):
    message: str = Field(min_length=1)
    strategy_id: Optional[str] = None
    backtest_id: Optional[str] = None
    paper_session_id: Optional[str] = None
    task_type: Literal["summary", "metric_explanation"] = "summary"
    history: Optional[list[dict[str, str]]] = None


def _cache_key(endpoint: str, model: str, analysis_version: str, context_hash: str) -> str:
    return f"ai:analysis:{endpoint}:{model}:{analysis_version}:{context_hash}"


def _question_hash(question: str) -> str:
    return hashlib.sha256(question.encode("utf-8")).hexdigest()[:12]

def _history_hash(history: Optional[list[dict[str, str]]]) -> str:
    if not history:
        return "nohist"
    compact = []
    for turn in history[-8:]:
        role = str(turn.get("role", "")).strip().lower()
        content = str(turn.get("content", "")).strip()
        if role in {"user", "assistant"} and content:
            compact.append(f"{role}:{content}")
    if not compact:
        return "nohist"
    digest = hashlib.sha256("||".join(compact).encode("utf-8")).hexdigest()
    return digest[:12]


def _attach_meta(payload: Dict[str, Any], endpoint: str, model: str, from_cache: bool) -> Dict[str, Any]:
    response = dict(payload)
    response["meta"] = {
        "endpoint": endpoint,
        "model": model,
        "cached": from_cache,
        "rag_index_version": rag_service.index_version,
    }
    return response


def _infer_task_type(message: str, requested: str) -> str:
    if requested == "metric_explanation":
        return requested
    lower = (message or "").lower()
    if re.search(r"\b(sharpe|calmar|drawdown|volatility|expectancy|profit factor|win rate|cagr)\b", lower):
        return "metric_explanation"
    return requested


def _is_portfolio_query(message: str) -> bool:
    lower = (message or "").lower()
    has_strategy_term = bool(re.search(r"\bstrategy|strategies\b", lower))
    has_comparison_term = bool(
        re.search(r"\b(best|top|rank|compare|most profitable|highest|lowest|from all|all created)\b", lower)
    )
    has_paper_session_term = bool(re.search(r"\bpaper\s*trading|paper session\b", lower))
    return (has_strategy_term and has_comparison_term) or (has_paper_session_term and has_comparison_term)


def _portfolio_basis(message: str) -> str:
    lower = (message or "").lower()
    return "paper" if re.search(r"\bpaper\s*trading|paper session\b", lower) else "backtest"


def _latest_user_messages(history: Optional[list[dict[str, str]]], max_items: int = 4) -> list[str]:
    if not history:
        return []
    messages: list[str] = []
    for turn in history:
        if str(turn.get("role", "")).lower() == "user":
            content = str(turn.get("content", "")).strip()
            if content:
                messages.append(content)
    return messages[-max_items:]


def _is_followup_portfolio_query(message: str, history: Optional[list[dict[str, str]]]) -> bool:
    lower = (message or "").lower()
    if re.search(r"\b(among those|among them|which one|best among|from those|from them)\b", lower):
        for prev in reversed(_latest_user_messages(history)):
            if _is_portfolio_query(prev):
                return True
    return False


def _looks_like_new_strategy_description(message: str) -> bool:
    lower = (message or "").lower().strip()
    if len(lower) < 5:
        return False
    indicator_pattern = r"\b(ema|sma|rsi|macd|bollinger|atr|adx|stochastic)\b"
    rule_pattern = r"\b(cross|crosses|above|below|greater than|less than|entry|exit|stop loss|take profit)\b"
    has_indicator = bool(re.search(indicator_pattern, lower))
    has_rule = bool(re.search(rule_pattern, lower))
    has_numbers = bool(re.search(r"\b\d+\b", lower))
    # Idea-only input usually is short, formula-like, and not a question about saved reports.
    mentions_saved_reports = bool(re.search(r"\b(backtest|paper trading|report|strategy id)\b", lower))
    is_question = lower.endswith("?")
    return has_indicator and (has_rule or has_numbers) and not mentions_saved_reports and not is_question


def _is_new_strategy_preamble(message: str) -> bool:
    lower = (message or "").lower()
    return bool(
        re.search(
            r"\b(i will give|new strategy|analy[sz]e the given details|i will share details|here are strategy details)\b",
            lower,
        )
    )


def _is_reference_query(message: str) -> bool:
    lower = (message or "").lower()
    return bool(re.search(r"\b(above mentioned|that strategy|this strategy|the above strategy|mentioned strategy)\b", lower))


def _is_public_list_query(message: str) -> bool:
    lower = (message or "").lower()
    has_list_verb = bool(re.search(r"\b(list|show|give)\b", lower))
    has_strategy = bool(re.search(r"\b(strategy|strategies)\b", lower))
    has_public = bool(re.search(r"\b(public|publicly accessible|accessible)\b", lower))
    return has_list_verb and has_strategy and has_public


def _is_all_strategy_list_query(message: str) -> bool:
    lower = (message or "").lower()
    return bool(
        re.search(
            r"\b(list|show|give)\b.*\b(all|created|every)\b.*\b(strategy|strategies)\b",
            lower,
        )
    ) or bool(re.search(r"\b(more strategies|list those as well|list those|those as well)\b", lower))


def _is_bearish_selection_query(message: str, history: Optional[list[dict[str, str]]]) -> bool:
    lower = (message or "").lower()
    direct = bool(re.search(r"\bbearish\b", lower) and re.search(r"\bstrategy|strategies\b", lower))
    if direct:
        return True
    if re.search(r"\bfrom above listed strategies\b", lower):
        for prev in reversed(_latest_user_messages(history)):
            if "strategy" in prev.lower():
                return True
    return False


def _is_followup_inventory_query(message: str, history: Optional[list[dict[str, str]]]) -> bool:
    lower = (message or "").lower()
    if not re.search(r"\b(more strategies|list those as well|list those|those as well|show remaining)\b", lower):
        return False
    for prev in reversed(_latest_user_messages(history)):
        if _is_public_list_query(prev) or _is_all_strategy_list_query(prev):
            return True
    return False


def _extract_last_strategy_hint(history: Optional[list[dict[str, str]]]) -> Optional[str]:
    if not history:
        return None
    for turn in reversed(history):
        content = str(turn.get("content", "")).strip()
        if not content:
            continue
        quoted = re.findall(r"'([^']{3,80})'", content)
        if quoted:
            return quoted[-1]
        # fallback: look for "strategy <name>" style mention
        mention = re.search(r"strategy(?: named| is|:)?\s+([A-Za-z0-9 _-]{3,80})", content, flags=re.IGNORECASE)
        if mention:
            return mention.group(1).strip()
    return None


def _build_local_chat_payload(
    *,
    summary: str,
    context: Dict[str, Any],
    confidence_level: Literal["low", "medium", "high"] = "medium",
    flags: Optional[list[str]] = None,
) -> Dict[str, Any]:
    return {
        "summary": summary,
        "strengths": [],
        "weaknesses": [],
        "risk_structure": [],
        "stability_assessment": "",
        "caveats": [],
        "evidence": [],
        "confidence_level": confidence_level,
        "data_sufficiency_flags": flags or [],
        "analysis_version": context.get("analysis_version", "unknown"),
        "context_hash": context.get("context_hash", ""),
    }


@router.post("/analyze-strategy/{strategy_id}")
async def analyze_strategy(
    strategy_id: str,
    request: StrategyAnalysisRequest,
    user: Dict[str, Any] = Depends(verify_firebase_token),
):
    try:
        context = await context_builder.build_strategy_context(
            strategy_id=strategy_id,
            user_id=user.get("uid", ""),
            backtest_id=request.backtest_id,
            paper_session_id=request.paper_session_id,
        )
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc))
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to build strategy context: {exc}")

    model = llm_client.resolve_model("summary")
    endpoint_key = f"analyze-strategy-{_question_hash(request.focus_question)}"
    key = _cache_key(endpoint_key, model, context["analysis_version"], context["context_hash"])
    cached = await RedisCache.get(key)
    if cached:
        return _attach_meta(cached, "analyze-strategy", model, from_cache=True)

    rag_chunks = rag_service.retrieve(request.focus_question, top_k=4)
    analysis, model_used = await llm_client.generate_analysis(
        task_type="summary",
        question=request.focus_question,
        context_payload=context,
        rag_chunks=rag_chunks,
        prompt_name="strategy_analysis.txt",
    )
    await RedisCache.set(key, analysis, ttl=CACHE_TTL_SECONDS)
    return _attach_meta(analysis, "analyze-strategy", model_used, from_cache=False)


@router.post("/analyze-paper-session/{session_id}")
async def analyze_paper_session(
    session_id: str,
    request: PaperSessionAnalysisRequest,
    user: Dict[str, Any] = Depends(verify_firebase_token),
):
    try:
        context = await context_builder.build_paper_trade_context(
            session_id=session_id,
            user_id=user.get("uid", ""),
            backtest_id=request.backtest_id,
        )
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc))
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to build paper-session context: {exc}")

    model = llm_client.resolve_model("summary")
    endpoint_key = f"analyze-paper-session-{_question_hash(request.focus_question)}"
    key = _cache_key(endpoint_key, model, context["analysis_version"], context["context_hash"])
    cached = await RedisCache.get(key)
    if cached:
        return _attach_meta(cached, "analyze-paper-session", model, from_cache=True)

    rag_chunks = rag_service.retrieve(request.focus_question, top_k=4)
    analysis, model_used = await llm_client.generate_analysis(
        task_type="summary",
        question=request.focus_question,
        context_payload=context,
        rag_chunks=rag_chunks,
        prompt_name="paper_trading_coach.txt",
    )
    await RedisCache.set(key, analysis, ttl=CACHE_TTL_SECONDS)
    return _attach_meta(analysis, "analyze-paper-session", model_used, from_cache=False)


@router.post("/chat")
async def controlled_chat(
    request: ControlledChatRequest,
    user: Dict[str, Any] = Depends(verify_firebase_token),
):
    if _is_public_list_query(request.message):
        context = context_builder.build_generic_chat_context()
        strategies = await context_builder.list_strategies(
            user_id=user.get("uid", ""),
            include_public_only=True,
        )
        if not strategies:
            summary = "No publicly accessible strategies were found."
        else:
            lines = [f"{idx + 1}. {row['name']}" for idx, row in enumerate(strategies[:30])]
            summary = (
                f"Found {len(strategies)} publicly accessible strategies:\n" + "\n".join(lines)
            )
        payload = _build_local_chat_payload(
            summary=summary,
            context=context,
            confidence_level="high",
            flags=["inventory_query"],
        )
        return _attach_meta(payload, "chat", "local-inventory-public", from_cache=False)

    if _is_all_strategy_list_query(request.message) or _is_followup_inventory_query(
        request.message,
        request.history,
    ):
        context = context_builder.build_generic_chat_context()
        strategies = await context_builder.list_strategies(
            user_id=user.get("uid", ""),
            include_public_only=False,
        )
        if not strategies:
            summary = "No strategies were found for your account."
        else:
            lines = [
                f"{idx + 1}. {row['name']} ({row['visibility']})"
                for idx, row in enumerate(strategies[:40])
            ]
            summary = f"Found {len(strategies)} strategies:\n" + "\n".join(lines)
        payload = _build_local_chat_payload(
            summary=summary,
            context=context,
            confidence_level="high",
            flags=["inventory_query"],
        )
        return _attach_meta(payload, "chat", "local-inventory-all", from_cache=False)

    if _is_bearish_selection_query(request.message, request.history):
        context = await context_builder.build_portfolio_context(
            user_id=user.get("uid", ""),
            basis="backtest",
        )
        ranked = list(context.get("portfolio", {}).get("ranked_strategies", []))
        comparable = [row for row in ranked if row.get("score", float("-inf")) != float("-inf")]
        if not comparable:
            summary = "No comparable strategy reports were found to evaluate bearish robustness."
            payload = _build_local_chat_payload(
                summary=summary,
                context=context,
                confidence_level="low",
                flags=["no_comparable_reports", "bearish_query"],
            )
            return _attach_meta(payload, "chat", "local-bearish", from_cache=False)

        # Defensive ranking proxy: prioritize higher return, then lower drawdown.
        best = sorted(
            comparable,
            key=lambda row: (
                float(row.get("backtest_total_return_pct", -1e9)),
                -float(row.get("max_drawdown_pct", 1e9)),
            ),
            reverse=True,
        )[0]
        ret = float(best.get("backtest_total_return_pct", 0.0))
        dd = float(best.get("max_drawdown_pct", 0.0))
        if ret <= 0:
            summary = (
                f"No strategy shows strong bullish profitability in bearish-like stress. "
                f"The least-damaging candidate is '{best.get('name')}' with {ret:.2f}% return "
                f"and {dd:.2f}% max drawdown in available backtests."
            )
        else:
            summary = (
                f"Best bearish-resilient candidate from available reports is '{best.get('name')}' "
                f"with {ret:.2f}% backtest return and {dd:.2f}% max drawdown."
            )
        payload = _build_local_chat_payload(
            summary=summary,
            context=context,
            confidence_level=context.get("confidence", {}).get("level", "medium"),
            flags=list(context.get("confidence", {}).get("flags", [])) + ["bearish_query_proxy"],
        )
        return _attach_meta(payload, "chat", "local-bearish", from_cache=False)

    is_new_strategy_prompt = _is_new_strategy_preamble(request.message)
    if (
        is_new_strategy_prompt
        and not request.strategy_id
        and not request.backtest_id
        and not request.paper_session_id
    ):
        context = context_builder.build_generic_chat_context()
        guidance = {
            "summary": (
                "Sure. Share the strategy details and I will analyze it. "
                "For a data-grounded verdict, include timeframe, entry/exit rules, stop-loss/take-profit, "
                "and backtest or paper-trading metrics if available."
            ),
            "strengths": [],
            "weaknesses": [],
            "risk_structure": [],
            "stability_assessment": "Awaiting strategy details.",
            "caveats": [
                "No strategy details were provided yet.",
                "No report metrics available for evidence-based scoring.",
            ],
            "evidence": [],
            "confidence_level": "low",
            "data_sufficiency_flags": ["no_report_context", "awaiting_user_strategy_details"],
            "analysis_version": context["analysis_version"],
            "context_hash": context["context_hash"],
        }
        return _attach_meta(guidance, "chat", "local-guidance", from_cache=False)

    try:
        is_portfolio = _is_portfolio_query(request.message) or _is_followup_portfolio_query(
            request.message,
            request.history,
        )
        is_new_strategy_description = _looks_like_new_strategy_description(request.message)
        is_reference = _is_reference_query(request.message)

        if is_portfolio:
            context = await context_builder.build_portfolio_context(
                user_id=user.get("uid", ""),
                basis=_portfolio_basis(request.message),
            )
        elif is_reference:
            strategy_hint = _extract_last_strategy_hint(request.history)
            if strategy_hint:
                context = await context_builder.build_context_for_strategy_name(
                    user_id=user.get("uid", ""),
                    strategy_name_hint=strategy_hint,
                    prefer_recent_fallback=True,
                )
            else:
                context = await context_builder.build_recent_user_context(user_id=user.get("uid", ""))
        elif request.paper_session_id:
            context = await context_builder.build_paper_trade_context(
                session_id=request.paper_session_id,
                user_id=user.get("uid", ""),
                backtest_id=request.backtest_id,
            )
        elif request.strategy_id:
            context = await context_builder.build_strategy_context(
                strategy_id=request.strategy_id,
                user_id=user.get("uid", ""),
                backtest_id=request.backtest_id,
                paper_session_id=request.paper_session_id,
            )
        elif request.backtest_id:
            context = await context_builder.build_backtest_context(
                backtest_id=request.backtest_id,
                user_id=user.get("uid", ""),
            )
        else:
            context = await context_builder.build_context_from_message_with_fallback(
                user_id=user.get("uid", ""),
                message=request.message,
                prefer_recent_fallback=not (is_new_strategy_description or is_new_strategy_prompt),
            )
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc))
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to build chat context: {exc}")

    effective_task_type = _infer_task_type(request.message, request.task_type)
    model = llm_client.resolve_model(effective_task_type)
    endpoint_key = (
        f"chat-{_question_hash(f'{effective_task_type}:{request.message}')}"
        f"-{_history_hash(request.history)}"
    )
    key = _cache_key(endpoint_key, model, context["analysis_version"], context["context_hash"])
    cached = await RedisCache.get(key)
    if cached:
        return _attach_meta(cached, "chat", model, from_cache=True)

    prompt_name = "risk_analysis.txt" if effective_task_type == "metric_explanation" else "architecture_trace.txt"
    rag_chunks = rag_service.retrieve(request.message, top_k=4)
    analysis, model_used = await llm_client.generate_analysis(
        task_type=effective_task_type,
        question=request.message,
        context_payload=context,
        rag_chunks=rag_chunks,
        prompt_name=prompt_name,
        history=request.history or [],
    )
    await RedisCache.set(key, analysis, ttl=CACHE_TTL_SECONDS)
    return _attach_meta(analysis, "chat", model_used, from_cache=False)
