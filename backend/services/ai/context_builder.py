from __future__ import annotations

import hashlib
import json
import os
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple

from bson import ObjectId

from db.mongo import MongoDB


CANONICAL_METRICS_DEFAULTS: Dict[str, Any] = {
    "net_pnl": 0.0,
    "total_return_pct": 0.0,
    "cagr_pct": 0.0,
    "sharpe_ratio": 0.0,
    "calmar_ratio": 0.0,
    "max_drawdown_pct": 0.0,
    "drawdown_duration_days": 0,
    "volatility_annual_pct": 0.0,
    "expectancy": 0.0,
    "profit_factor": 0.0,
    "trade_count": 0,
    "win_rate_pct": 0.0,
    "avg_win_pct": 0.0,
    "avg_loss_pct": 0.0,
}


class ContextBuilder:
    """
    Builds deterministic, canonical AI context from persisted reports.
    The LLM consumes this output only; it never queries Mongo directly.
    """

    def __init__(self) -> None:
        self.engine_version = os.getenv("AI_ENGINE_VERSION", "1")
        self.prompt_version = os.getenv("AI_PROMPT_VERSION", "1")
        self.rag_index_version = os.getenv("AI_RAG_INDEX_VERSION", "1")
        self.metric_schema_version = os.getenv("AI_METRIC_SCHEMA_VERSION", "1")

    async def build_strategy_context(
        self,
        strategy_id: str,
        user_id: str,
        backtest_id: Optional[str] = None,
        paper_session_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        strategy = await self._get_strategy(strategy_id)
        self._assert_strategy_access(strategy, user_id)

        backtest = await self._get_backtest(user_id, backtest_id=backtest_id, strategy_id=strategy_id)
        paper_session = await self._get_paper_session(
            user_id,
            paper_session_id=paper_session_id,
            strategy_id=strategy_id,
        )

        backtest_metrics, backtest_aux = self._normalize_backtest_metrics(backtest)
        paper_metrics, paper_aux = self._normalize_paper_metrics(paper_session)
        divergence = self._compute_divergence(backtest_aux, paper_aux, backtest_metrics, paper_metrics)

        confidence_level, data_flags = self._build_confidence(
            trade_count=int(backtest_metrics["trade_count"] or paper_metrics["trade_count"]),
            duration_days=int(backtest_aux.get("duration_days", 0) or paper_aux.get("duration_days", 0)),
            strategy_tests_present=False,
        )

        report_updated_at = {
            "strategy": self._pick_first(
                strategy.get("updatedAt"),
                strategy.get("updated_at"),
                strategy.get("createdAt"),
                strategy.get("created_at"),
                "unknown",
            ),
            "backtest": self._pick_first(
                (backtest or {}).get("updated_at"),
                (backtest or {}).get("created_at"),
                "unknown",
            ),
            "paper_session": self._pick_first(
                (paper_session or {}).get("updated_at"),
                (paper_session or {}).get("created_at"),
                "unknown",
            ),
        }

        version_fields = self._build_version_fields(
            strategy_id=strategy_id,
            strategy_version=self._pick_first(
                strategy.get("updatedAt"),
                strategy.get("updated_at"),
                strategy.get("createdAt"),
                strategy.get("created_at"),
                "v0",
            ),
            backtest_id=str((backtest or {}).get("_id", "")),
            paper_session_id=str((paper_session or {}).get("_id", "")),
            report_updated_at=report_updated_at,
        )

        payload = {
            "strategy": self._strategy_summary(strategy),
            "backtest_metrics": backtest_metrics,
            "paper_metrics": paper_metrics,
            "divergence": divergence,
            "confidence": {
                "level": confidence_level,
                "flags": data_flags,
                "max_confidence": confidence_level,
            },
            "execution_assumptions": self.build_execution_context(),
            "versions": version_fields,
        }
        context_hash = self.compute_context_hash(payload)
        analysis_version = version_fields["analysis_version"]

        return {
            **payload,
            "context_hash": context_hash,
            "analysis_version": analysis_version,
            "context_text": self.to_formatted_text(payload),
        }

    async def build_backtest_context(self, backtest_id: str, user_id: str) -> Dict[str, Any]:
        backtest = await self._get_backtest(user_id=user_id, backtest_id=backtest_id)
        if not backtest:
            raise ValueError("Backtest not found")

        backtest_metrics, backtest_aux = self._normalize_backtest_metrics(backtest)
        confidence_level, data_flags = self._build_confidence(
            trade_count=int(backtest_metrics["trade_count"]),
            duration_days=int(backtest_aux.get("duration_days", 0)),
            strategy_tests_present=False,
        )

        version_fields = self._build_version_fields(
            strategy_id=str(backtest.get("strategy_id", "")),
            strategy_version="unknown",
            backtest_id=str(backtest.get("_id", "")),
            paper_session_id="",
            report_updated_at={
                "strategy": "unknown",
                "backtest": self._pick_first(
                    backtest.get("updated_at"),
                    backtest.get("created_at"),
                    "unknown",
                ),
                "paper_session": "unknown",
            },
        )

        payload = {
            "strategy": {"strategy_id": str(backtest.get("strategy_id", "")), "name": backtest.get("strategy_name", "Unknown")},
            "backtest_metrics": backtest_metrics,
            "paper_metrics": dict(CANONICAL_METRICS_DEFAULTS),
            "divergence": {"tag": "aligned", "evidence": []},
            "confidence": {"level": confidence_level, "flags": data_flags, "max_confidence": confidence_level},
            "execution_assumptions": self.build_execution_context(),
            "versions": version_fields,
        }
        context_hash = self.compute_context_hash(payload)
        return {
            **payload,
            "context_hash": context_hash,
            "analysis_version": version_fields["analysis_version"],
            "context_text": self.to_formatted_text(payload),
        }

    async def build_strategy_test_context(self, test_id: str) -> Dict[str, Any]:
        # strategy_tests pipeline is not implemented yet in this repo.
        payload = {
            "strategy_test_id": test_id,
            "available": False,
            "note": "strategy_tests collection not implemented in current backend",
        }
        return payload

    async def build_paper_trade_context(
        self,
        session_id: str,
        user_id: str,
        backtest_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        session = await self._get_paper_session(user_id=user_id, paper_session_id=session_id)
        if not session:
            raise ValueError("Paper trading session not found")

        strategy_id = str(session.get("strategy_id") or "")
        strategy = await self._get_strategy(strategy_id) if strategy_id else None
        if strategy:
            self._assert_strategy_access(strategy, user_id)

        backtest = await self._get_backtest(user_id=user_id, backtest_id=backtest_id, strategy_id=strategy_id or None)
        backtest_metrics, backtest_aux = self._normalize_backtest_metrics(backtest)
        paper_metrics, paper_aux = self._normalize_paper_metrics(session)
        divergence = self._compute_divergence(backtest_aux, paper_aux, backtest_metrics, paper_metrics)

        confidence_level, data_flags = self._build_confidence(
            trade_count=int(paper_metrics["trade_count"]),
            duration_days=int(paper_aux.get("duration_days", 0)),
            strategy_tests_present=False,
        )
        if not backtest:
            data_flags.append("missing_backtest_comparison")

        version_fields = self._build_version_fields(
            strategy_id=strategy_id,
            strategy_version=self._pick_first(
                (strategy or {}).get("updatedAt"),
                (strategy or {}).get("updated_at"),
                (strategy or {}).get("createdAt"),
                (strategy or {}).get("created_at"),
                "unknown",
            ),
            backtest_id=str((backtest or {}).get("_id", "")),
            paper_session_id=str(session.get("_id", "")),
            report_updated_at={
                "strategy": self._pick_first(
                    (strategy or {}).get("updatedAt"),
                    (strategy or {}).get("updated_at"),
                    "unknown",
                ),
                "backtest": self._pick_first(
                    (backtest or {}).get("updated_at"),
                    (backtest or {}).get("created_at"),
                    "unknown",
                ),
                "paper_session": self._pick_first(
                    session.get("updated_at"),
                    session.get("created_at"),
                    "unknown",
                ),
            },
        )

        payload = {
            "strategy": self._strategy_summary(strategy) if strategy else {"strategy_id": strategy_id, "name": "Unknown"},
            "backtest_metrics": backtest_metrics,
            "paper_metrics": paper_metrics,
            "divergence": divergence,
            "confidence": {"level": confidence_level, "flags": data_flags, "max_confidence": confidence_level},
            "execution_assumptions": self.build_execution_context(),
            "versions": version_fields,
        }
        context_hash = self.compute_context_hash(payload)
        return {
            **payload,
            "context_hash": context_hash,
            "analysis_version": version_fields["analysis_version"],
            "context_text": self.to_formatted_text(payload),
        }

    def build_execution_context(self) -> Dict[str, Any]:
        return {
            "read_only_analysis": True,
            "no_prediction": True,
            "no_trade_advice": True,
            "no_parameter_suggestions": True,
            "source_scope": [
                "strategies",
                "backtests",
                "paper_trading_sessions",
                "platform_metric_definitions",
            ],
        }

    def build_generic_chat_context(self) -> Dict[str, Any]:
        version_fields = self._build_version_fields(
            strategy_id="",
            strategy_version="unknown",
            backtest_id="",
            paper_session_id="",
            report_updated_at={"strategy": "unknown", "backtest": "unknown", "paper_session": "unknown"},
        )
        payload = {
            "strategy": {"strategy_id": "", "name": "General AI Session"},
            "backtest_metrics": dict(CANONICAL_METRICS_DEFAULTS),
            "paper_metrics": dict(CANONICAL_METRICS_DEFAULTS),
            "divergence": {"tag": "aligned", "evidence": []},
            "confidence": {"level": "low", "flags": ["no_report_context"], "max_confidence": "low"},
            "execution_assumptions": self.build_execution_context(),
            "versions": version_fields,
        }
        context_hash = self.compute_context_hash(payload)
        return {
            **payload,
            "context_hash": context_hash,
            "analysis_version": version_fields["analysis_version"],
            "context_text": self.to_formatted_text(payload),
        }

    async def build_recent_user_context(self, user_id: str) -> Dict[str, Any]:
        """
        Best-effort context for chat when no explicit IDs are provided.
        Prefers latest backtest-linked strategy context, then backtest-only, then generic.
        """
        backtests = MongoDB.get_collection("backtests")
        latest_backtest = await backtests.find_one({"user_id": user_id}, sort=[("created_at", -1)])
        if not latest_backtest:
            return self.build_generic_chat_context()

        strategy_id = str(latest_backtest.get("strategy_id") or "")
        backtest_id = str(latest_backtest.get("_id") or "")

        session_id = None
        if strategy_id:
            sessions = MongoDB.get_collection("paper_trading_sessions")
            latest_matching_session = await sessions.find_one(
                {"user_id": user_id, "strategy_id": strategy_id},
                sort=[("created_at", -1)],
            )
            if latest_matching_session:
                session_id = str(latest_matching_session.get("_id"))

        if strategy_id:
            try:
                return await self.build_strategy_context(
                    strategy_id=strategy_id,
                    user_id=user_id,
                    backtest_id=backtest_id,
                    paper_session_id=session_id,
                )
            except Exception:
                # Fall back to backtest-only context if strategy lookup/access fails.
                pass

        return await self.build_backtest_context(backtest_id=backtest_id, user_id=user_id)

    async def build_context_from_message(self, user_id: str, message: str) -> Dict[str, Any]:
        """
        Resolve the best context directly from a free-form user message.
        Falls back to latest user context when no explicit strategy is recognized.
        """
        strategy_id = await self._resolve_strategy_id_from_message(user_id=user_id, message=message)
        if strategy_id:
            backtest = await self._get_backtest(user_id=user_id, strategy_id=strategy_id)
            session = await self._get_paper_session(user_id=user_id, strategy_id=strategy_id)
            return await self.build_strategy_context(
                strategy_id=strategy_id,
                user_id=user_id,
                backtest_id=str(backtest.get("_id")) if backtest else None,
                paper_session_id=str(session.get("_id")) if session else None,
            )
        return await self.build_recent_user_context(user_id=user_id)

    async def build_context_from_message_with_fallback(
        self,
        user_id: str,
        message: str,
        prefer_recent_fallback: bool = True,
    ) -> Dict[str, Any]:
        """
        Like build_context_from_message, but allows caller to disable recent-report fallback
        when user is describing a new strategy idea rather than asking about saved reports.
        """
        strategy_id = await self._resolve_strategy_id_from_message(user_id=user_id, message=message)
        if strategy_id:
            backtest = await self._get_backtest(user_id=user_id, strategy_id=strategy_id)
            session = await self._get_paper_session(user_id=user_id, strategy_id=strategy_id)
            return await self.build_strategy_context(
                strategy_id=strategy_id,
                user_id=user_id,
                backtest_id=str(backtest.get("_id")) if backtest else None,
                paper_session_id=str(session.get("_id")) if session else None,
            )
        if prefer_recent_fallback:
            return await self.build_recent_user_context(user_id=user_id)
        return self.build_generic_chat_context()

    async def build_context_for_strategy_name(
        self,
        user_id: str,
        strategy_name_hint: str,
        prefer_recent_fallback: bool = True,
    ) -> Dict[str, Any]:
        """
        Resolve strategy context from a strategy name hint.
        """
        strategy_id = await self._resolve_strategy_id_from_message(user_id=user_id, message=strategy_name_hint)
        if strategy_id:
            backtest = await self._get_backtest(user_id=user_id, strategy_id=strategy_id)
            session = await self._get_paper_session(user_id=user_id, strategy_id=strategy_id)
            return await self.build_strategy_context(
                strategy_id=strategy_id,
                user_id=user_id,
                backtest_id=str(backtest.get("_id")) if backtest else None,
                paper_session_id=str(session.get("_id")) if session else None,
            )
        if prefer_recent_fallback:
            return await self.build_recent_user_context(user_id=user_id)
        return self.build_generic_chat_context()

    async def list_strategies(
        self,
        user_id: str,
        include_public_only: bool = False,
    ) -> List[Dict[str, Any]]:
        """
        Returns merged strategy inventory from both collections.
        If include_public_only=True, returns only public strategies.
        """
        records: List[Dict[str, Any]] = []
        seen = set()

        defs = MongoDB.get_collection("drag_drop_strategies")
        base = MongoDB.get_collection("strategies")

        defs_query: Dict[str, Any]
        base_query: Dict[str, Any]
        if include_public_only:
            defs_query = {"visibility": "public"}
            base_query = {
                "$or": [
                    {"visibility": "public"},
                    {"isPublic": True},
                    {"is_public": True},
                ]
            }
        else:
            defs_query = {
                "$or": [
                    {"ownerId": user_id},
                    {"visibility": "public"},
                    {"userId": user_id},
                    {"user_id": user_id},
                ]
            }
            base_query = {
                "$or": [
                    {"author": user_id},
                    {"visibility": "public"},
                    {"userId": user_id},
                    {"user_id": user_id},
                    {"isPublic": True},
                    {"is_public": True},
                ]
            }

        async for doc in defs.find(defs_query).limit(500):
            sid = str(doc.get("_id"))
            if sid in seen:
                continue
            seen.add(sid)
            visibility = self._normalize_visibility(doc)
            if include_public_only and visibility != "public":
                continue
            records.append(
                {
                    "strategy_id": sid,
                    "name": self._strategy_display_name(doc),
                    "source": "drag_drop_strategies",
                    "visibility": visibility,
                }
            )

        async for doc in base.find(base_query).limit(500):
            sid = str(doc.get("_id"))
            if sid in seen:
                continue
            seen.add(sid)
            visibility = self._normalize_visibility(doc)
            if include_public_only and visibility != "public":
                continue
            records.append(
                {
                    "strategy_id": sid,
                    "name": self._strategy_display_name(doc),
                    "source": "strategies",
                    "visibility": visibility,
                }
            )

        records.sort(key=lambda row: row["name"].lower())
        return records

    async def build_portfolio_context(self, user_id: str, basis: str = "backtest") -> Dict[str, Any]:
        """
        Build cross-strategy comparison context for ranking-style questions.
        basis: "backtest" | "paper"
        """
        strategies = await self._list_user_strategies(user_id=user_id)

        ranked: List[Dict[str, Any]] = []
        latest_timestamps: List[Any] = []
        for strategy in strategies:
            strategy_id = str(strategy.get("_id"))
            backtest = await self._get_backtest(user_id=user_id, strategy_id=strategy_id)
            paper = await self._get_paper_session(user_id=user_id, strategy_id=strategy_id)
            backtest_metrics, backtest_aux = self._normalize_backtest_metrics(backtest)
            paper_metrics, paper_aux = self._normalize_paper_metrics(paper)
            divergence = self._compute_divergence(backtest_aux, paper_aux, backtest_metrics, paper_metrics)

            latest_timestamps.append(self._pick_first((backtest or {}).get("created_at"), (backtest or {}).get("updated_at")))
            latest_timestamps.append(self._pick_first((paper or {}).get("created_at"), (paper or {}).get("updated_at")))
            latest_timestamps.append(
                self._pick_first(strategy.get("updatedAt"), strategy.get("updated_at"), strategy.get("createdAt"), strategy.get("created_at"))
            )

            if basis == "paper":
                has_signal = bool(paper and paper_metrics.get("trade_count", 0) > 0)
                score = float(paper_metrics.get("total_return_pct", 0.0)) if has_signal else float("-inf")
            else:
                has_signal = bool(backtest and backtest_metrics.get("trade_count", 0) > 0)
                score = float(backtest_metrics.get("total_return_pct", 0.0)) if has_signal else float("-inf")

            ranked.append(
                {
                    "strategy_id": strategy_id,
                    "name": self._strategy_display_name(strategy),
                    "score": score,
                    "has_backtest": bool(backtest),
                    "has_paper_session": bool(paper),
                    "backtest_total_return_pct": float(backtest_metrics.get("total_return_pct", 0.0)),
                    "paper_total_return_pct": float(paper_metrics.get("total_return_pct", 0.0)),
                    "backtest_trade_count": int(backtest_metrics.get("trade_count", 0)),
                    "paper_trade_count": int(paper_metrics.get("trade_count", 0)),
                    "max_drawdown_pct": float(backtest_metrics.get("max_drawdown_pct", 0.0)),
                    "sharpe_ratio": float(backtest_metrics.get("sharpe_ratio", 0.0)),
                    "divergence_tag": divergence.get("tag", "aligned"),
                    "backtest_id": str((backtest or {}).get("_id", "")),
                    "paper_session_id": str((paper or {}).get("_id", "")),
                }
            )

        ranked.sort(
            key=lambda item: (
                item.get("score", float("-inf")),
                item.get("backtest_total_return_pct", 0.0),
                -item.get("max_drawdown_pct", 0.0),
            ),
            reverse=True,
        )

        best = ranked[0] if ranked else None
        best_strategy_id = str(best.get("strategy_id")) if best else ""
        best_backtest = await self._get_backtest(user_id=user_id, strategy_id=best_strategy_id) if best_strategy_id else None
        best_paper = await self._get_paper_session(user_id=user_id, strategy_id=best_strategy_id) if best_strategy_id else None
        best_backtest_metrics, best_backtest_aux = self._normalize_backtest_metrics(best_backtest)
        best_paper_metrics, best_paper_aux = self._normalize_paper_metrics(best_paper)
        best_divergence = self._compute_divergence(
            best_backtest_aux,
            best_paper_aux,
            best_backtest_metrics,
            best_paper_metrics,
        )

        strategy_count = len(ranked)
        comparable_count = sum(1 for row in ranked if row.get("score", float("-inf")) != float("-inf"))
        confidence_level, data_flags = self._build_confidence(
            trade_count=int(best_backtest_metrics.get("trade_count") or best_paper_metrics.get("trade_count") or 0),
            duration_days=int(best_backtest_aux.get("duration_days", 0) or best_paper_aux.get("duration_days", 0)),
            strategy_tests_present=False,
        )
        if strategy_count < 2:
            data_flags.append("single_strategy_available")
        if comparable_count < 1:
            data_flags.append("no_comparable_reports")
            confidence_level = "low"
        elif comparable_count < 2:
            data_flags.append("limited_comparison_set")

        report_updated_at = {
            "strategy": self._pick_latest_timestamp(latest_timestamps) or "unknown",
            "backtest": self._pick_latest_timestamp(latest_timestamps) or "unknown",
            "paper_session": self._pick_latest_timestamp(latest_timestamps) or "unknown",
        }
        version_fields = self._build_version_fields(
            strategy_id=f"portfolio:{user_id}",
            strategy_version=f"count:{strategy_count}",
            backtest_id=str((best_backtest or {}).get("_id", "")),
            paper_session_id=str((best_paper or {}).get("_id", "")),
            report_updated_at=report_updated_at,
        )

        payload = {
            "strategy": {
                "strategy_id": best_strategy_id,
                "name": best.get("name", "No strategy found") if best else "No strategy found",
                "scope": "portfolio_comparison",
            },
            "backtest_metrics": best_backtest_metrics,
            "paper_metrics": best_paper_metrics,
            "divergence": best_divergence,
            "confidence": {
                "level": confidence_level,
                "flags": sorted(list(set(data_flags))),
                "max_confidence": confidence_level,
            },
            "portfolio": {
                "ranking_basis": basis,
                "strategy_count": strategy_count,
                "comparable_count": comparable_count,
                "best_strategy": best,
                "ranked_strategies": ranked[:12],
            },
            "execution_assumptions": self.build_execution_context(),
            "versions": version_fields,
        }
        context_hash = self.compute_context_hash(payload)
        return {
            **payload,
            "context_hash": context_hash,
            "analysis_version": version_fields["analysis_version"],
            "context_text": self.to_formatted_text(payload),
        }

    @staticmethod
    def compute_context_hash(payload: Dict[str, Any]) -> str:
        canonical = json.dumps(payload, sort_keys=True, separators=(",", ":"), default=str)
        return hashlib.sha256(canonical.encode("utf-8")).hexdigest()

    @staticmethod
    def to_formatted_text(payload: Dict[str, Any]) -> str:
        return json.dumps(payload, sort_keys=True, indent=2, default=str)

    def _build_version_fields(
        self,
        strategy_id: str,
        strategy_version: str,
        backtest_id: str,
        paper_session_id: str,
        report_updated_at: Dict[str, Any],
    ) -> Dict[str, Any]:
        analysis_version = (
            f"v{self.engine_version}:{self.prompt_version}:{self.metric_schema_version}"
        )
        return {
            "strategy_id": strategy_id,
            "strategy_version": strategy_version,
            "backtest_id": backtest_id,
            "paper_session_id": paper_session_id,
            "report_updated_at": report_updated_at,
            "engine_version": self.engine_version,
            "prompt_version": self.prompt_version,
            "rag_index_version": self.rag_index_version,
            "metric_schema_version": self.metric_schema_version,
            "analysis_version": analysis_version,
        }

    @staticmethod
    def _strategy_summary(strategy: Optional[Dict[str, Any]]) -> Dict[str, Any]:
        strategy = strategy or {}
        return {
            "strategy_id": str(strategy.get("_id", "")),
            "name": strategy.get("name") or strategy.get("title") or "Unnamed Strategy",
            "description": strategy.get("description", ""),
            "timeframe": strategy.get("timeframe", ""),
            "entry_logic": strategy.get("conditions") or strategy.get("entry_logic") or [],
            "exit_logic": strategy.get("conditions") or strategy.get("exit_logic") or [],
            "risk_rules": strategy.get("riskManagement") or strategy.get("risk_rules") or {},
            "execution_assumptions": {
                "symbol_specific": strategy.get("symbol", "mixed"),
                "data_source": "persisted_reports_only",
            },
        }

    async def _get_strategy(self, strategy_id: str) -> Optional[Dict[str, Any]]:
        if not strategy_id:
            return None
        strategy_object_id = self._safe_object_id(strategy_id)
        if not strategy_object_id:
            return None

        defs = MongoDB.get_collection("drag_drop_strategies")
        strategy = await defs.find_one({"_id": strategy_object_id})
        if strategy:
            return strategy

        base = MongoDB.get_collection("strategies")
        return await base.find_one({"_id": strategy_object_id})

    async def _list_user_strategies(self, user_id: str) -> List[Dict[str, Any]]:
        query = {
            "$or": [
                {"ownerId": user_id},
                {"userId": user_id},
                {"user_id": user_id},
                {"author": user_id},
            ]
        }
        results: List[Dict[str, Any]] = []
        seen_ids = set()

        defs = MongoDB.get_collection("drag_drop_strategies")
        async for doc in defs.find(query):
            sid = str(doc.get("_id"))
            if sid not in seen_ids:
                seen_ids.add(sid)
                results.append(doc)

        base = MongoDB.get_collection("strategies")
        async for doc in base.find(query):
            sid = str(doc.get("_id"))
            if sid not in seen_ids:
                seen_ids.add(sid)
                results.append(doc)

        # Fallback: if no user-owned strategy found, include public strategies for comparison context.
        if not results:
            async for doc in defs.find({"visibility": "public"}).limit(50):
                sid = str(doc.get("_id"))
                if sid not in seen_ids:
                    seen_ids.add(sid)
                    results.append(doc)
        return results

    async def _resolve_strategy_id_from_message(self, user_id: str, message: str) -> Optional[str]:
        text = (message or "").strip().lower()
        if not text:
            return None

        # If user includes a 24-char Mongo ObjectId in message, use it directly when accessible.
        object_id_match = None
        for token in text.split():
            token_clean = token.strip(".,:;()[]{}<>\"'")
            if len(token_clean) == 24 and all(c in "0123456789abcdef" for c in token_clean):
                object_id_match = token_clean
                break
        if object_id_match:
            strategy = await self._get_strategy(object_id_match)
            if strategy:
                try:
                    self._assert_strategy_access(strategy, user_id)
                    return object_id_match
                except Exception:
                    pass

        candidates: List[Dict[str, Any]] = []
        defs = MongoDB.get_collection("drag_drop_strategies")
        base = MongoDB.get_collection("strategies")

        async for doc in defs.find(
            {"$or": [{"ownerId": user_id}, {"visibility": "public"}, {"userId": user_id}, {"user_id": user_id}]},
            {"name": 1, "title": 1},
        ).limit(200):
            candidates.append(doc)
        async for doc in base.find(
            {"$or": [{"author": user_id}, {"visibility": "public"}, {"userId": user_id}, {"user_id": user_id}]},
            {"name": 1, "title": 1},
        ).limit(200):
            candidates.append(doc)

        best_match_id: Optional[str] = None
        best_score = 0
        for candidate in candidates:
            name = str(candidate.get("name") or candidate.get("title") or "").strip().lower()
            if len(name) < 3:
                continue
            score = 0
            if name in text:
                score = len(name)
            else:
                name_words = [word for word in name.split() if len(word) > 2]
                overlap = sum(1 for word in name_words if word in text)
                if overlap >= 2:
                    score = overlap * 3
            if score > best_score:
                best_score = score
                best_match_id = str(candidate.get("_id"))
        return best_match_id if best_score > 0 else None

    async def _get_backtest(
        self,
        user_id: str,
        backtest_id: Optional[str] = None,
        strategy_id: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        collection = MongoDB.get_collection("backtests")
        query: Dict[str, Any] = {"user_id": user_id}
        if backtest_id:
            object_id = self._safe_object_id(backtest_id)
            if not object_id:
                return None
            query["_id"] = object_id
            return await collection.find_one(query)

        if strategy_id:
            query["strategy_id"] = strategy_id
        return await collection.find_one(query, sort=[("created_at", -1)])

    async def _get_paper_session(
        self,
        user_id: str,
        paper_session_id: Optional[str] = None,
        strategy_id: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        collection = MongoDB.get_collection("paper_trading_sessions")
        query: Dict[str, Any] = {"user_id": user_id}
        if paper_session_id:
            object_id = self._safe_object_id(paper_session_id)
            if not object_id:
                return None
            query["_id"] = object_id
            return await collection.find_one(query)

        if strategy_id:
            query["strategy_id"] = strategy_id
        return await collection.find_one(query, sort=[("created_at", -1)])

    @staticmethod
    def _assert_strategy_access(strategy: Optional[Dict[str, Any]], user_id: str) -> None:
        if not strategy:
            raise ValueError("Strategy not found")

        is_owner = (
            strategy.get("ownerId") == user_id
            or strategy.get("userId") == user_id
            or strategy.get("user_id") == user_id
            or strategy.get("author") == user_id
        )
        is_public = (
            strategy.get("visibility") == "public"
            or bool(strategy.get("isPublic"))
            or bool(strategy.get("is_public"))
        )
        legacy_public = (
            not strategy.get("ownerId")
            and not strategy.get("userId")
            and not strategy.get("user_id")
            and not strategy.get("author")
        )
        if not (is_owner or is_public or legacy_public):
            raise PermissionError("Access denied to strategy context")

    @staticmethod
    def _strategy_display_name(strategy: Dict[str, Any]) -> str:
        return str(strategy.get("name") or strategy.get("title") or "Unnamed Strategy")

    @staticmethod
    def _normalize_visibility(strategy: Dict[str, Any]) -> str:
        if str(strategy.get("visibility", "")).lower() == "public":
            return "public"
        if bool(strategy.get("isPublic")) or bool(strategy.get("is_public")):
            return "public"
        return "private"

    def _normalize_backtest_metrics(
        self,
        backtest: Optional[Dict[str, Any]],
    ) -> Tuple[Dict[str, Any], Dict[str, Any]]:
        if not backtest:
            return dict(CANONICAL_METRICS_DEFAULTS), {"duration_days": 0, "trades_per_day": 0.0}

        metrics = backtest.get("metrics", {})

        total_return_pct = self._as_percent(
            self._pick_first(metrics.get("total_return"), metrics.get("total_return_pct"), 0.0)
        )
        trade_count = int(self._pick_first(metrics.get("total_trades"), metrics.get("trade_count"), 0) or 0)
        win_rate_pct = self._as_percent(self._pick_first(metrics.get("win_rate"), metrics.get("winrate"), 0.0))
        avg_win_pct = self._as_percent(self._pick_first(metrics.get("avg_win"), metrics.get("avg_win_pct"), 0.0))
        avg_loss_pct = abs(self._as_percent(self._pick_first(metrics.get("avg_loss"), metrics.get("avg_loss_pct"), 0.0)))

        start_date = self._parse_dt(self._pick_first(backtest.get("start_date"), backtest.get("startDate")))
        end_date = self._parse_dt(self._pick_first(backtest.get("end_date"), backtest.get("endDate")))
        duration_days = max((end_date - start_date).days, 0) if start_date and end_date else 0
        trades_per_day = (trade_count / duration_days) if duration_days > 0 else 0.0

        initial_balance = self._to_float(
            self._pick_first(backtest.get("initial_balance"), backtest.get("initialBalance"), 0.0)
        )
        net_pnl = self._to_float(
            self._pick_first(metrics.get("net_pnl"), backtest.get("net_pnl"), initial_balance * total_return_pct / 100.0)
        )

        canonical = dict(CANONICAL_METRICS_DEFAULTS)
        canonical.update(
            {
                "net_pnl": round(net_pnl, 6),
                "total_return_pct": round(total_return_pct, 6),
                "cagr_pct": round(self._as_percent(self._pick_first(metrics.get("cagr"), metrics.get("cagr_pct"), 0.0)), 6),
                "sharpe_ratio": round(self._to_float(self._pick_first(metrics.get("sharpe_ratio"), metrics.get("sharpe"), 0.0)), 6),
                "calmar_ratio": round(self._to_float(self._pick_first(metrics.get("calmar_ratio"), metrics.get("calmar"), 0.0)), 6),
                "max_drawdown_pct": round(abs(self._as_percent(self._pick_first(metrics.get("max_drawdown"), metrics.get("max_drawdown_pct"), 0.0))), 6),
                "drawdown_duration_days": int(self._pick_first(metrics.get("drawdown_duration_days"), 0) or 0),
                "volatility_annual_pct": round(self._as_percent(self._pick_first(metrics.get("volatility"), metrics.get("volatility_annual_pct"), 0.0)), 6),
                "expectancy": round(self._to_float(self._pick_first(metrics.get("expectancy"), 0.0)), 6),
                "profit_factor": round(self._to_float(self._pick_first(metrics.get("profit_factor"), 0.0)), 6),
                "trade_count": trade_count,
                "win_rate_pct": round(win_rate_pct, 6),
                "avg_win_pct": round(avg_win_pct, 6),
                "avg_loss_pct": round(avg_loss_pct, 6),
            }
        )
        return canonical, {"duration_days": duration_days, "trades_per_day": round(trades_per_day, 6)}

    def _normalize_paper_metrics(
        self,
        session: Optional[Dict[str, Any]],
    ) -> Tuple[Dict[str, Any], Dict[str, Any]]:
        if not session:
            return dict(CANONICAL_METRICS_DEFAULTS), {"duration_days": 0, "trades_per_day": 0.0}

        initial_balance = self._to_float(
            self._pick_first(session.get("initial_balance"), session.get("initialBalance"), 0.0)
        )
        final_balance = self._to_float(
            self._pick_first(session.get("final_balance"), session.get("finalBalance"), initial_balance)
        )
        trades: List[Dict[str, Any]] = list(self._pick_first(session.get("trades"), []))
        realized = [self._to_float(trade.get("realizedPnL", 0.0)) for trade in trades]
        returns = []
        for trade in trades:
            if trade.get("return") is not None:
                returns.append(self._as_percent(self._to_float(trade.get("return"))))
            elif initial_balance > 0:
                returns.append((self._to_float(trade.get("realizedPnL", 0.0)) / initial_balance) * 100.0)

        gross_profit = sum(value for value in realized if value > 0)
        gross_loss = abs(sum(value for value in realized if value < 0))
        trade_count = len(trades)
        winning = sum(1 for value in realized if value > 0)
        win_rate_pct = (winning / trade_count) * 100.0 if trade_count > 0 else 0.0

        avg_win_pct = 0.0
        avg_loss_pct = 0.0
        wins = [value for value in returns if value > 0]
        losses = [abs(value) for value in returns if value < 0]
        if wins:
            avg_win_pct = sum(wins) / len(wins)
        if losses:
            avg_loss_pct = sum(losses) / len(losses)

        max_drawdown_pct = self._paper_max_drawdown_pct(initial_balance, realized)
        total_return_pct = ((final_balance - initial_balance) / initial_balance) * 100.0 if initial_balance > 0 else 0.0
        expectancy = sum(returns) / len(returns) if returns else 0.0

        start_date = self._parse_dt(self._pick_first(session.get("start_date"), session.get("startDate")))
        end_date = self._parse_dt(self._pick_first(session.get("end_date"), session.get("endDate")))
        duration_days = max((end_date - start_date).days, 0) if start_date and end_date else 0
        trades_per_day = (trade_count / duration_days) if duration_days > 0 else 0.0

        cagr_pct = 0.0
        if duration_days > 0 and initial_balance > 0 and final_balance > 0:
            years = duration_days / 365.25
            if years > 0:
                cagr_pct = ((final_balance / initial_balance) ** (1.0 / years) - 1.0) * 100.0

        volatility_annual_pct = 0.0
        if len(returns) > 1:
            mean = sum(returns) / len(returns)
            variance = sum((x - mean) ** 2 for x in returns) / max(len(returns) - 1, 1)
            volatility_annual_pct = (variance ** 0.5) * (252.0 ** 0.5)

        calmar_ratio = (cagr_pct / max_drawdown_pct) if max_drawdown_pct > 0 else 0.0
        profit_factor = (gross_profit / gross_loss) if gross_loss > 0 else (gross_profit if gross_profit > 0 else 0.0)

        canonical = dict(CANONICAL_METRICS_DEFAULTS)
        canonical.update(
            {
                "net_pnl": round(final_balance - initial_balance, 6),
                "total_return_pct": round(total_return_pct, 6),
                "cagr_pct": round(cagr_pct, 6),
                "sharpe_ratio": 0.0,
                "calmar_ratio": round(calmar_ratio, 6),
                "max_drawdown_pct": round(max_drawdown_pct, 6),
                "drawdown_duration_days": 0,
                "volatility_annual_pct": round(volatility_annual_pct, 6),
                "expectancy": round(expectancy, 6),
                "profit_factor": round(profit_factor, 6),
                "trade_count": trade_count,
                "win_rate_pct": round(win_rate_pct, 6),
                "avg_win_pct": round(avg_win_pct, 6),
                "avg_loss_pct": round(avg_loss_pct, 6),
            }
        )
        return canonical, {"duration_days": duration_days, "trades_per_day": round(trades_per_day, 6)}

    @staticmethod
    def _compute_divergence(
        backtest_aux: Dict[str, Any],
        paper_aux: Dict[str, Any],
        backtest_metrics: Dict[str, Any],
        paper_metrics: Dict[str, Any],
    ) -> Dict[str, Any]:
        pnl_delta_pct = paper_metrics["total_return_pct"] - backtest_metrics["total_return_pct"]
        win_rate_drift_pct_pts = paper_metrics["win_rate_pct"] - backtest_metrics["win_rate_pct"]
        drawdown_expansion_pct_pts = paper_metrics["max_drawdown_pct"] - backtest_metrics["max_drawdown_pct"]
        backtest_tpd = float(backtest_aux.get("trades_per_day", 0.0))
        paper_tpd = float(paper_aux.get("trades_per_day", 0.0))
        trade_frequency_change = (paper_tpd / backtest_tpd) if backtest_tpd > 0 else 0.0

        max_abs_delta = max(abs(pnl_delta_pct), abs(win_rate_drift_pct_pts), abs(drawdown_expansion_pct_pts))
        if max_abs_delta <= 5.0:
            tag = "aligned"
        elif max_abs_delta <= 15.0:
            tag = "moderate_drift"
        else:
            tag = "high_drift"

        evidence = [
            {"metric": "pnl_delta_pct", "value": round(pnl_delta_pct, 6), "source": "computed"},
            {"metric": "win_rate_drift_pct_pts", "value": round(win_rate_drift_pct_pts, 6), "source": "computed"},
            {"metric": "drawdown_expansion_pct_pts", "value": round(drawdown_expansion_pct_pts, 6), "source": "computed"},
            {"metric": "trade_frequency_change", "value": round(trade_frequency_change, 6), "source": "computed"},
        ]

        return {
            "tag": tag,
            "features": {
                "pnl_delta_pct": round(pnl_delta_pct, 6),
                "win_rate_drift_pct_pts": round(win_rate_drift_pct_pts, 6),
                "drawdown_expansion_pct_pts": round(drawdown_expansion_pct_pts, 6),
                "trade_frequency_change": round(trade_frequency_change, 6),
            },
            "evidence": evidence,
        }

    @staticmethod
    def _build_confidence(
        trade_count: int,
        duration_days: int,
        strategy_tests_present: bool,
    ) -> Tuple[str, List[str]]:
        flags: List[str] = []
        if trade_count < 30:
            flags.append("low_trade_count")
        if duration_days < 30:
            flags.append("short_test_window")
        if not strategy_tests_present:
            flags.append("missing_strategy_tests")

        if trade_count < 30 or duration_days < 30:
            return "low", flags
        if trade_count < 100 or duration_days < 180:
            return "medium", flags
        return "high", flags

    @staticmethod
    def _paper_max_drawdown_pct(initial_balance: float, realized_pnl: List[float]) -> float:
        if initial_balance <= 0:
            return 0.0

        balance = initial_balance
        peak = initial_balance
        max_drawdown = 0.0
        for pnl in realized_pnl:
            balance += pnl
            if balance > peak:
                peak = balance
            if peak > 0:
                drawdown = ((peak - balance) / peak) * 100.0
                if drawdown > max_drawdown:
                    max_drawdown = drawdown
        return max_drawdown

    @staticmethod
    def _pick_first(*values: Any) -> Any:
        for value in values:
            if value is not None:
                return value
        return None

    @staticmethod
    def _pick_latest_timestamp(values: List[Any]) -> Optional[str]:
        latest = None
        latest_dt = None
        for value in values:
            if not value:
                continue
            dt = ContextBuilder._parse_dt(value)
            if dt is None:
                continue
            if dt.tzinfo is not None:
                dt = dt.replace(tzinfo=None)
            if latest_dt is None or dt > latest_dt:
                latest_dt = dt
                latest = value
        if latest is None and values:
            for value in values:
                if value:
                    return str(value)
        return str(latest) if latest is not None else None

    @staticmethod
    def _to_float(value: Any) -> float:
        try:
            return float(value)
        except (TypeError, ValueError):
            return 0.0

    @classmethod
    def _as_percent(cls, value: Any) -> float:
        number = cls._to_float(value)
        # Heuristic: ratios in [-1, 1] are normalized to percentage units.
        if -1.0 <= number <= 1.0 and number != 0.0:
            return number * 100.0
        return number

    @staticmethod
    def _parse_dt(value: Any) -> Optional[datetime]:
        if not value:
            return None
        if isinstance(value, datetime):
            return value
        if isinstance(value, str):
            safe = value.replace("Z", "+00:00")
            try:
                return datetime.fromisoformat(safe)
            except ValueError:
                return None
        return None

    @staticmethod
    def _safe_object_id(value: str) -> Optional[ObjectId]:
        try:
            return ObjectId(value)
        except Exception:
            return None
