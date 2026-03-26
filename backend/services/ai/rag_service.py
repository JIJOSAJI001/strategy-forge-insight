from __future__ import annotations

import math
import os
import re
from typing import Any, Dict, List, Tuple

import numpy as np

try:
    import faiss  # type: ignore

    FAISS_AVAILABLE = True
except Exception:
    FAISS_AVAILABLE = False


DEFAULT_RAG_DOCS: List[Dict[str, str]] = [
    {
        "id": "metric_sharpe",
        "category": "metric_definition",
        "text": "Sharpe ratio measures excess return per unit of volatility. Higher is generally better for risk-adjusted performance.",
    },
    {
        "id": "metric_expectancy",
        "category": "metric_definition",
        "text": "Expectancy estimates average outcome per trade. Positive expectancy suggests net edge over many trades.",
    },
    {
        "id": "metric_drawdown",
        "category": "metric_definition",
        "text": "Maximum drawdown is the largest peak-to-trough decline in equity during a test window.",
    },
    {
        "id": "metric_profit_factor",
        "category": "metric_definition",
        "text": "Profit factor is gross profit divided by gross loss. Values above one indicate profitable aggregate trades.",
    },
    {
        "id": "risk_guideline_1",
        "category": "risk_guideline",
        "text": "Low trade count or short test duration reduces confidence and should be disclosed as a caveat.",
    },
    {
        "id": "risk_guideline_2",
        "category": "risk_guideline",
        "text": "Divergence between backtest and paper trading metrics indicates execution drift or regime mismatch risk.",
    },
    {
        "id": "platform_rule_read_only",
        "category": "platform_rule",
        "text": "Assistant is read-only and must not alter strategy execution logic or data persistence.",
    },
    {
        "id": "platform_rule_no_advice",
        "category": "platform_rule",
        "text": "Assistant must not provide buy, sell, hold advice, price forecasts, or parameter optimization instructions.",
    },
    {
        "id": "limitations",
        "category": "limitations",
        "text": "Assistant explains existing results only and does not predict markets or generate signals.",
    },
]


class RAGService:
    """
    Lightweight FAISS retrieval for metric definitions and platform rules.
    It intentionally excludes live market data and strategy report data.
    """

    def __init__(self, docs: List[Dict[str, str]] | None = None, dim: int = 256) -> None:
        self.docs = docs or list(DEFAULT_RAG_DOCS)
        self.dim = dim
        self.index_version = os.getenv("AI_RAG_INDEX_VERSION", "1")

        self._embeddings = np.vstack([self._embed(doc["text"]) for doc in self.docs]).astype("float32")
        self._index = None
        if FAISS_AVAILABLE and len(self.docs) > 0:
            self._index = faiss.IndexFlatIP(self.dim)
            self._index.add(self._embeddings)

    def retrieve(self, query: str, top_k: int = 4) -> List[Dict[str, Any]]:
        if not query.strip():
            return []
        k = max(1, min(top_k, len(self.docs)))

        if self._index is not None:
            q = np.array([self._embed(query)], dtype="float32")
            scores, indices = self._index.search(q, k)
            results: List[Dict[str, Any]] = []
            for score, idx in zip(scores[0].tolist(), indices[0].tolist()):
                if idx < 0:
                    continue
                doc = self.docs[idx]
                results.append(
                    {
                        "id": doc["id"],
                        "category": doc["category"],
                        "text": doc["text"],
                        "score": round(float(score), 6),
                    }
                )
            return results

        # fallback lexical scoring when FAISS is not available
        query_tokens = set(self._tokenize(query))
        scored: List[Tuple[float, Dict[str, str]]] = []
        for doc in self.docs:
            doc_tokens = set(self._tokenize(doc["text"]))
            overlap = len(query_tokens.intersection(doc_tokens))
            denom = max(len(query_tokens.union(doc_tokens)), 1)
            score = overlap / denom
            scored.append((score, doc))
        scored.sort(key=lambda item: item[0], reverse=True)
        return [
            {
                "id": item[1]["id"],
                "category": item[1]["category"],
                "text": item[1]["text"],
                "score": round(float(item[0]), 6),
            }
            for item in scored[:k]
        ]

    def _embed(self, text: str) -> np.ndarray:
        vec = np.zeros(self.dim, dtype=np.float32)
        tokens = self._tokenize(text)
        for token in tokens:
            idx = hash(token) % self.dim
            vec[idx] += 1.0
        norm = np.linalg.norm(vec)
        if norm > 0:
            vec = vec / norm
        return vec.astype("float32")

    @staticmethod
    def _tokenize(text: str) -> List[str]:
        return re.findall(r"[a-zA-Z0-9_]+", text.lower())

