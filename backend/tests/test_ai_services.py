import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parents[1]))

from services.ai.context_builder import ContextBuilder
from services.ai.llm_client import LLMClient


def _base_context() -> dict:
    builder = ContextBuilder()
    payload = {
        "strategy": {"strategy_id": "abc", "name": "Demo"},
        "backtest_metrics": {
            "total_return_pct": 12.5,
            "max_drawdown_pct": 8.0,
            "trade_count": 120,
            "sharpe_ratio": 1.4,
            "profit_factor": 1.6,
        },
        "paper_metrics": {
            "total_return_pct": 9.2,
            "max_drawdown_pct": 10.0,
            "trade_count": 90,
        },
        "divergence": {"tag": "moderate_drift", "features": {"pnl_delta_pct": -3.3}},
        "confidence": {"level": "medium", "flags": ["missing_strategy_tests"], "max_confidence": "medium"},
        "analysis_version": "v1:1:1",
        "context_hash": "hash123",
        "execution_assumptions": builder.build_execution_context(),
    }
    return payload


def test_context_hash_is_deterministic():
    builder = ContextBuilder()
    payload = _base_context()

    first = builder.compute_context_hash(payload)
    second = builder.compute_context_hash(payload)

    assert first == second
    assert len(first) == 64


def test_guardrail_detection_blocks_advice():
    assert LLMClient.contains_policy_violation("Should I buy this stock tomorrow?")
    assert LLMClient.contains_policy_violation("Which strategy might be best for the next two years?")
    assert not LLMClient.contains_policy_violation("Explain why drawdown expanded in paper trading.")


def test_confidence_is_capped_by_context():
    client = LLMClient()
    response = client._coerce_and_validate(
        {
            "summary": "test",
            "strengths": ["a"],
            "weaknesses": ["b"],
            "risk_structure": ["c"],
            "stability_assessment": "d",
            "caveats": ["e"],
            "evidence": [{"metric": "x", "value": 1.0, "source": "test"}],
            "confidence_level": "high",
            "analysis_version": "wrong",
            "context_hash": "wrong",
        },
        _base_context(),
    )

    assert response["confidence_level"] == "medium"
    assert response["analysis_version"] == "v1:1:1"
    assert response["context_hash"] == "hash123"
