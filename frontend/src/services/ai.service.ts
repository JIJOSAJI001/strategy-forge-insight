const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export interface AIEvidenceItem {
  metric: string;
  value: number;
  source: string;
}

export interface AIAnalysisResponse {
  summary: string;
  strengths: string[];
  weaknesses: string[];
  risk_structure: string[];
  stability_assessment: string;
  caveats: string[];
  evidence: AIEvidenceItem[];
  confidence_level: "low" | "medium" | "high";
  data_sufficiency_flags: string[];
  analysis_version: string;
  context_hash: string;
  meta?: {
    endpoint: string;
    model: string;
    cached: boolean;
    rag_index_version: string;
  };
}

async function postAI<T>(endpoint: string, body: Record<string, any>, token: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`AI request failed (${response.status}): ${errorText}`);
  }

  return (await response.json()) as T;
}

export const aiService = {
  async chat(
    token: string,
    message: string,
    options?: {
      strategyId?: string;
      backtestId?: string;
      paperSessionId?: string;
      taskType?: "summary" | "metric_explanation";
      history?: Array<{ role: "user" | "assistant"; content: string }>;
    }
  ) {
    return postAI<AIAnalysisResponse>("/api/ai/chat", {
      message,
      strategy_id: options?.strategyId || null,
      backtest_id: options?.backtestId || null,
      paper_session_id: options?.paperSessionId || null,
      task_type: options?.taskType || "summary",
      history: options?.history || [],
    }, token);
  },

  async analyzeStrategy(
    token: string,
    strategyId: string,
    body?: {
      backtestId?: string;
      paperSessionId?: string;
      focusQuestion?: string;
    }
  ) {
    return postAI<AIAnalysisResponse>(`/api/ai/analyze-strategy/${strategyId}`, {
      backtest_id: body?.backtestId || null,
      paper_session_id: body?.paperSessionId || null,
      focus_question: body?.focusQuestion,
    }, token);
  },

  async analyzePaperSession(
    token: string,
    sessionId: string,
    body?: {
      backtestId?: string;
      focusQuestion?: string;
    }
  ) {
    return postAI<AIAnalysisResponse>(`/api/ai/analyze-paper-session/${sessionId}`, {
      backtest_id: body?.backtestId || null,
      focus_question: body?.focusQuestion,
    }, token);
  },
};
