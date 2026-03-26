from __future__ import annotations

import json
import os
import re
from pathlib import Path
from typing import Any, Dict, List, Literal, Optional, Tuple

from pydantic import BaseModel, Field, ValidationError

try:
    from openai import AsyncOpenAI  # type: ignore
except Exception:
    AsyncOpenAI = None


class EvidenceItem(BaseModel):
    metric: str
    value: float
    source: str


class AnalysisResponseContract(BaseModel):
    summary: str
    strengths: List[str] = Field(default_factory=list)
    weaknesses: List[str] = Field(default_factory=list)
    risk_structure: List[str] = Field(default_factory=list)
    stability_assessment: str = ""
    caveats: List[str] = Field(default_factory=list)
    evidence: List[EvidenceItem] = Field(default_factory=list)
    confidence_level: Literal["low", "medium", "high"] = "low"
    data_sufficiency_flags: List[str] = Field(default_factory=list)
    analysis_version: str
    context_hash: str


class ChatTurn(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class LLMClient:
    """
    OpenRouter client with strict guardrails and validated fallback output.
    """

    APPROVED_MODELS = {
        "summary": "kwaipilot/kat-coder-pro-v1",
        "metric_explanation": "openrouter/ctl-large",
    }

    def __init__(self) -> None:
        self.prompt_dir = Path(__file__).parent / "prompts"
        self.system_prompt = self._read_prompt("system.txt")
        self.temperature = float(os.getenv("AI_TEMPERATURE", "0.15"))
        self.max_tokens = int(os.getenv("AI_MAX_TOKENS", "1000"))

        self.api_key = os.getenv("OPENROUTER_API_KEY", "").strip()
        self.client = None
        if self.api_key and AsyncOpenAI is not None:
            self.client = AsyncOpenAI(
                base_url="https://openrouter.ai/api/v1",
                api_key=self.api_key,
            )

    @classmethod
    def resolve_model(cls, task_type: str) -> str:
        if task_type == "metric_explanation":
            configured = os.getenv("OPENROUTER_MODEL_METRIC", cls.APPROVED_MODELS["metric_explanation"]).strip()
            return configured if configured in cls.APPROVED_MODELS.values() else cls.APPROVED_MODELS["metric_explanation"]

        configured = os.getenv("OPENROUTER_MODEL_SUMMARY", cls.APPROVED_MODELS["summary"]).strip()
        return configured if configured in cls.APPROVED_MODELS.values() else cls.APPROVED_MODELS["summary"]

    @staticmethod
    def contains_policy_violation(user_text: str) -> bool:
        lowered = user_text.lower()
        blocked_patterns = [
            r"\b(buy|sell|hold)\b",
            r"\b(entry|exit)\s+(price|point|level)\b",
            r"\b(price\s*target|target\s*price)\b",
            r"\b(predict|forecast|tomorrow|next week)\b",
            r"\b(next|coming|future)\b.{0,20}\b(year|years|month|months|quarter|quarters)\b",
            r"\bin\s+\d+\s+(day|days|week|weeks|month|months|year|years)\b",
            r"\b(long[-\s]?term)\b",
            r"\b(will|would|might)\b.{0,40}\b(best|profitable|profit|return)\b",
            r"\b(best parameters?|optimi[sz]e settings?)\b",
            r"\b(signal|call)\b",
        ]
        return any(re.search(pattern, lowered) for pattern in blocked_patterns)

    async def generate_analysis(
        self,
        *,
        task_type: str,
        question: str,
        context_payload: Dict[str, Any],
        rag_chunks: List[Dict[str, Any]],
        prompt_name: str,
        history: Optional[List[Dict[str, str]]] = None,
    ) -> Tuple[Dict[str, Any], str]:
        if self.contains_policy_violation(question):
            return self._policy_refusal(context_payload), "policy-refusal"

        model = self.resolve_model(task_type)
        if self.client is None:
            return self._fallback_response(context_payload, reason="openrouter_unavailable"), "local-fallback"

        task_prompt = self._read_prompt(prompt_name)
        prompt = self._compose_prompt(task_prompt, question, context_payload, rag_chunks, history or [])

        last_error = "unknown_error"
        for _ in range(3):
            try:
                completion = await self.client.chat.completions.create(
                    model=model,
                    temperature=self.temperature,
                    max_tokens=self.max_tokens,
                    messages=[
                        {"role": "system", "content": self.system_prompt},
                        {"role": "user", "content": prompt},
                    ],
                )
                content = (completion.choices[0].message.content or "").strip()
                parsed = self._extract_json(content)
                return self._coerce_and_validate(parsed, context_payload), model
            except Exception as exc:
                last_error = str(exc)
                # If metric model is invalid/unavailable, retry once with approved summary model.
                if (
                    task_type == "metric_explanation"
                    and model != self.APPROVED_MODELS["summary"]
                    and ("not a valid model ID" in last_error or "No endpoints found" in last_error)
                ):
                    model = self.APPROVED_MODELS["summary"]
                    continue

        return self._fallback_response(context_payload, reason=f"openrouter_error:{last_error}"), model

    def _compose_prompt(
        self,
        task_prompt: str,
        question: str,
        context_payload: Dict[str, Any],
        rag_chunks: List[Dict[str, Any]],
        history: List[Dict[str, str]],
    ) -> str:
        rag_text = json.dumps(rag_chunks, indent=2, default=str)
        context_text = json.dumps(context_payload, indent=2, sort_keys=True, default=str)
        safe_history: List[ChatTurn] = []
        for turn in history[-8:]:
            role = str(turn.get("role", "")).strip().lower()
            content = str(turn.get("content", "")).strip()
            if role in {"user", "assistant"} and content:
                safe_history.append(ChatTurn(role=role, content=content))
        history_text = json.dumps([turn.model_dump() for turn in safe_history], indent=2)
        return (
            f"{task_prompt}\n\n"
            "Return JSON only. Do not include markdown fences.\n"
            "Required schema fields:\n"
            "{summary, strengths[], weaknesses[], risk_structure[], stability_assessment, caveats[], "
            "evidence[{metric, value, source}], confidence_level, data_sufficiency_flags[], analysis_version, context_hash}\n\n"
            f"Recent conversation turns:\n{history_text}\n\n"
            f"User question:\n{question}\n\n"
            f"RAG references:\n{rag_text}\n\n"
            f"Context payload:\n{context_text}"
        )

    @staticmethod
    def _extract_json(text: str) -> Dict[str, Any]:
        if not text:
            return {}
        try:
            loaded = json.loads(text)
            return loaded if isinstance(loaded, dict) else {}
        except Exception:
            pass

        fenced = re.search(r"```(?:json)?\s*(\{.*\})\s*```", text, flags=re.DOTALL)
        if fenced:
            try:
                return json.loads(fenced.group(1))
            except Exception:
                pass

        match = re.search(r"\{.*\}", text, flags=re.DOTALL)
        if match:
            try:
                return json.loads(match.group(0))
            except Exception:
                return {}
        return {}

    def _coerce_and_validate(self, raw: Dict[str, Any], context_payload: Dict[str, Any]) -> Dict[str, Any]:
        evidence = raw.get("evidence")
        if not isinstance(evidence, list):
            evidence = self._evidence_from_context(context_payload)

        normalized: Dict[str, Any] = {
            "summary": self._as_text(raw.get("summary")) or self._default_summary(context_payload),
            "strengths": self._as_text_list(raw.get("strengths")) or self._default_strengths(context_payload),
            "weaknesses": self._as_text_list(raw.get("weaknesses")) or self._default_weaknesses(context_payload),
            "risk_structure": self._as_text_list(raw.get("risk_structure")) or self._default_risk_structure(context_payload),
            "stability_assessment": self._as_text(raw.get("stability_assessment")) or self._default_stability(context_payload),
            "caveats": self._as_text_list(raw.get("caveats")) or self._default_caveats(context_payload),
            "evidence": self._normalize_evidence(evidence),
            "confidence_level": self._cap_confidence(raw.get("confidence_level"), context_payload),
            "data_sufficiency_flags": self._as_text_list(raw.get("data_sufficiency_flags"))
            or list(context_payload.get("confidence", {}).get("flags", [])),
            "analysis_version": context_payload.get("analysis_version", raw.get("analysis_version", "unknown")),
            "context_hash": context_payload.get("context_hash", raw.get("context_hash", "")),
        }
        try:
            return AnalysisResponseContract(**normalized).model_dump()
        except ValidationError:
            return self._fallback_response(context_payload, reason="schema_validation_failed")

    def _fallback_response(self, context_payload: Dict[str, Any], reason: str) -> Dict[str, Any]:
        response = {
            "summary": f"Generated deterministic fallback analysis ({reason}).",
            "strengths": self._default_strengths(context_payload),
            "weaknesses": self._default_weaknesses(context_payload),
            "risk_structure": self._default_risk_structure(context_payload),
            "stability_assessment": self._default_stability(context_payload),
            "caveats": self._default_caveats(context_payload),
            "evidence": self._evidence_from_context(context_payload),
            "confidence_level": self._cap_confidence(None, context_payload),
            "data_sufficiency_flags": list(context_payload.get("confidence", {}).get("flags", [])),
            "analysis_version": context_payload.get("analysis_version", "unknown"),
            "context_hash": context_payload.get("context_hash", ""),
        }
        return AnalysisResponseContract(**response).model_dump()

    def _policy_refusal(self, context_payload: Dict[str, Any]) -> Dict[str, Any]:
        response = {
            "summary": "I cannot provide trading advice, predictions, or optimization instructions. I can explain observed metrics and risk behavior from your reports.",
            "strengths": [],
            "weaknesses": [],
            "risk_structure": ["Request exceeded policy guardrails for advisory or predictive output."],
            "stability_assessment": "No analytical output generated due to policy restriction.",
            "caveats": ["Use report-driven, measurable questions to continue."],
            "evidence": self._evidence_from_context(context_payload),
            "confidence_level": "low",
            "data_sufficiency_flags": list(context_payload.get("confidence", {}).get("flags", [])),
            "analysis_version": context_payload.get("analysis_version", "unknown"),
            "context_hash": context_payload.get("context_hash", ""),
        }
        return AnalysisResponseContract(**response).model_dump()

    @staticmethod
    def _cap_confidence(value: Any, context_payload: Dict[str, Any]) -> str:
        requested = str(value or "").lower()
        allowed = str(context_payload.get("confidence", {}).get("max_confidence", "low")).lower()
        order = {"low": 0, "medium": 1, "high": 2}
        if requested not in order:
            requested = allowed if allowed in order else "low"
        if allowed not in order:
            allowed = "low"
        return requested if order[requested] <= order[allowed] else allowed

    @staticmethod
    def _evidence_from_context(context_payload: Dict[str, Any]) -> List[Dict[str, Any]]:
        backtest = context_payload.get("backtest_metrics", {})
        paper = context_payload.get("paper_metrics", {})
        divergence = context_payload.get("divergence", {}).get("features", {})
        return [
            {"metric": "backtest_total_return_pct", "value": float(backtest.get("total_return_pct", 0.0)), "source": "backtests"},
            {"metric": "backtest_max_drawdown_pct", "value": float(backtest.get("max_drawdown_pct", 0.0)), "source": "backtests"},
            {"metric": "paper_total_return_pct", "value": float(paper.get("total_return_pct", 0.0)), "source": "paper_trading_sessions"},
            {"metric": "pnl_delta_pct", "value": float(divergence.get("pnl_delta_pct", 0.0)), "source": "computed"},
        ]

    @staticmethod
    def _default_summary(context_payload: Dict[str, Any]) -> str:
        divergence = context_payload.get("divergence", {}).get("tag", "aligned")
        confidence = context_payload.get("confidence", {}).get("level", "low")
        return f"Report-grounded analysis prepared with {confidence} confidence and divergence classified as {divergence}."

    @staticmethod
    def _default_strengths(context_payload: Dict[str, Any]) -> List[str]:
        backtest = context_payload.get("backtest_metrics", {})
        strengths: List[str] = []
        if float(backtest.get("sharpe_ratio", 0.0)) >= 1.0:
            strengths.append("Backtest Sharpe ratio indicates acceptable risk-adjusted return quality.")
        if float(backtest.get("profit_factor", 0.0)) > 1.2:
            strengths.append("Profit factor is above 1.2, indicating favorable gross profit-to-loss structure.")
        if not strengths:
            strengths.append("Available reports were ingested successfully for deterministic analysis.")
        return strengths

    @staticmethod
    def _default_weaknesses(context_payload: Dict[str, Any]) -> List[str]:
        backtest = context_payload.get("backtest_metrics", {})
        weaknesses: List[str] = []
        if float(backtest.get("max_drawdown_pct", 0.0)) > 20.0:
            weaknesses.append("Historical drawdown exceeds 20%, indicating elevated downside concentration.")
        if int(backtest.get("trade_count", 0)) < 30:
            weaknesses.append("Trade count is low, reducing statistical reliability.")
        if not weaknesses:
            weaknesses.append("No severe structural weakness detected from available summary metrics.")
        return weaknesses

    @staticmethod
    def _default_risk_structure(context_payload: Dict[str, Any]) -> List[str]:
        divergence_tag = context_payload.get("divergence", {}).get("tag", "aligned")
        return [
            f"Cross-report divergence state: {divergence_tag}.",
            "Risk interpretation is metric-based and excludes predictive assumptions.",
        ]

    @staticmethod
    def _default_stability(context_payload: Dict[str, Any]) -> str:
        return f"Stability is currently assessed as {context_payload.get('divergence', {}).get('tag', 'aligned')} based on backtest-paper comparison."

    @staticmethod
    def _default_caveats(context_payload: Dict[str, Any]) -> List[str]:
        flags = list(context_payload.get("confidence", {}).get("flags", []))
        if not flags:
            return ["No major data sufficiency caveats were detected."]
        return [f"Data sufficiency flag: {flag}." for flag in flags]

    @staticmethod
    def _normalize_evidence(items: Any) -> List[Dict[str, Any]]:
        normalized: List[Dict[str, Any]] = []
        if isinstance(items, list):
            for item in items:
                if not isinstance(item, dict):
                    continue
                raw_value = item.get("value", 0.0)
                try:
                    numeric_value = float(raw_value)
                except (TypeError, ValueError):
                    numeric_value = 0.0
                normalized.append(
                    {
                        "metric": str(item.get("metric", "unknown")),
                        "value": numeric_value,
                        "source": str(item.get("source", "computed")),
                    }
                )
        return normalized

    @staticmethod
    def _as_text(value: Any) -> str:
        return value.strip() if isinstance(value, str) else ""

    @staticmethod
    def _as_text_list(value: Any) -> List[str]:
        if not isinstance(value, list):
            return []
        return [str(item).strip() for item in value if str(item).strip()]

    def _read_prompt(self, name: str) -> str:
        path = self.prompt_dir / name
        if path.exists():
            return path.read_text(encoding="utf-8")
        if name == "system.txt":
            return (
                "You are a read-only analytics assistant for strategy reports. "
                "Never provide buy/sell advice, predictions, or parameter recommendations. "
                "Ground all statements in provided metrics and report context."
            )
        return "Use only provided context and return strict JSON."
