
import React, { useState, useRef, useEffect, useCallback } from "react";
import { Send, Bot, User, Sparkles, Wand2, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { aiService, type AIAnalysisResponse } from "@/services/ai.service";

interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
}

const AIAssistant = () => {
    const { user, getToken } = useAuth();
    const [messages, setMessages] = useState<Message[]>([
        {
            id: "1",
            role: "assistant",
            content: "Ask me naturally. I can compare strategies, explain failures, and use your latest reports automatically.",
            timestamp: new Date(),
        },
    ]);
    const [strategies, setStrategies] = useState<Array<{ id: string; name: string }>>([]);
    const [paperSessions, setPaperSessions] = useState<Array<{ id: string; label: string }>>([]);
    const [selectedStrategyId, setSelectedStrategyId] = useState<string>("none");
    const [selectedSessionId, setSelectedSessionId] = useState<string>("none");
    const [taskType, setTaskType] = useState<"summary" | "metric_explanation">("summary");
    const [inputValue, setInputValue] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const scrollAreaRef = useRef<HTMLDivElement>(null);

    const toMessage = (role: "user" | "assistant", content: string): Message => ({
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        role,
        content,
        timestamp: new Date(),
    });

    const formatAnalysis = (analysis: AIAnalysisResponse, question: string): string => {
        const q = question.toLowerCase();
        const isWhy = /\b(why|reason|fail|failed)\b/.test(q);
        const isRanking = /\b(best|top|most profitable|rank|compare|all strategies|from all)\b/.test(q);
        const isOneLine = /\b(one line|one-line|single line|in one sentence)\b/.test(q);
        const lines: string[] = [];
        const summary = analysis.summary.trim();

        if (isOneLine) {
            const firstSentence = summary.split(/(?<=[.!?])\s+/)[0] || summary;
            return firstSentence;
        }

        if (analysis.meta?.model === "policy-refusal") {
            return `${summary}\n\nTry this instead: ask me to rank strategies by historical backtest or paper-trading results.`;
        }

        lines.push(summary);

        const reasons = analysis.weaknesses.length > 0 ? analysis.weaknesses : analysis.risk_structure;
        if (isWhy) {
            if (reasons.length > 0) {
                lines.push("", "Main reasons:");
                reasons.slice(0, 4).forEach((item, idx) => {
                    lines.push(`${idx + 1}. ${item}`);
                });
            }
        } else if (!isRanking) {
            if (analysis.strengths.length > 0) {
                lines.push("", "What is working:", ...analysis.strengths.slice(0, 3).map((item) => `- ${item}`));
            }
            if (analysis.weaknesses.length > 0) {
                lines.push("", "What is hurting performance:", ...analysis.weaknesses.slice(0, 3).map((item) => `- ${item}`));
            }
        }

        if (analysis.evidence.length > 0 && !isRanking) {
            lines.push("", "Data points used:");
            analysis.evidence.slice(0, 4).forEach((item) => {
                const value = Number.isFinite(item.value) ? item.value.toFixed(2) : item.value;
                lines.push(`- ${item.metric}: ${value} (${item.source})`);
            });
        }

        if (analysis.caveats.length > 0 && !isRanking) {
            lines.push("", "Caveats:");
            analysis.caveats.slice(0, 2).forEach((item) => lines.push(`- ${item}`));
        }

        lines.push("", `Confidence: ${analysis.confidence_level.toUpperCase()}`);
        return lines.join("\n");
    };

    const loadContextOptions = useCallback(async () => {
        if (!user) return;
        const token = await getToken();
        if (!token) return;

        try {
            const apiBase = import.meta.env.VITE_API_URL || "http://localhost:8000";
            const [strategiesRes, sessionsRes] = await Promise.all([
                fetch(`${apiBase}/api/strategies`, {
                    headers: { Authorization: `Bearer ${token}` },
                }),
                fetch(`${apiBase}/api/retail/backtest/paper-trading/history?limit=20`, {
                    headers: { Authorization: `Bearer ${token}` },
                }),
            ]);

            if (strategiesRes.ok) {
                const strategiesData = await strategiesRes.json();
                const mapped = (Array.isArray(strategiesData) ? strategiesData : [])
                    .map((item: any) => ({
                        id: item._id || item.id,
                        name: item.name || item.title || "Unnamed strategy",
                    }))
                    .filter((item: any) => Boolean(item.id));
                setStrategies(mapped);
            }

            if (sessionsRes.ok) {
                const sessionsData = await sessionsRes.json();
                const mapped = (Array.isArray(sessionsData) ? sessionsData : [])
                    .map((item: any) => ({
                        id: item._id || item.id,
                        label: `${item.symbol || "UNKNOWN"} - ${item.created_at ? new Date(item.created_at).toLocaleDateString() : "no-date"}`,
                    }))
                    .filter((item: any) => Boolean(item.id));
                setPaperSessions(mapped);
            }
        } catch (error) {
            console.error("Failed to load AI context options", error);
        }
    }, [user, getToken]);

    useEffect(() => {
        loadContextOptions();
    }, [loadContextOptions]);

    const handleSendMessage = async () => {
        if (!inputValue.trim()) return;

        const userMessage = inputValue;
        setMessages((prev) => [...prev, toMessage("user", userMessage)]);
        setInputValue("");
        setIsTyping(true);

        try {
            const token = await getToken();
            if (!token) {
                throw new Error("You are not authenticated.");
            }

            const analysis = await aiService.chat(token, userMessage, {
                strategyId: selectedStrategyId !== "none" ? selectedStrategyId : undefined,
                paperSessionId: selectedSessionId !== "none" ? selectedSessionId : undefined,
                taskType,
                history: messages.slice(-8).map((m) => ({ role: m.role, content: m.content })),
            });
            setMessages((prev) => [...prev, toMessage("assistant", formatAnalysis(analysis, userMessage))]);
        } catch (error: any) {
            const detail = error?.message || "AI request failed.";
            setMessages((prev) => [
                ...prev,
                toMessage("assistant", `I could not complete the request.\n\n${detail}`),
            ]);
        } finally {
            setIsTyping(false);
        }
    };

    const handleAnalyzeStrategy = async () => {
        if (selectedStrategyId === "none") return;
        const focus = inputValue.trim() || "Explain strengths, weaknesses, risk structure, and stability using available metrics.";
        setMessages((prev) => [...prev, toMessage("user", `Analyze selected strategy.\n\nFocus: ${focus}`)]);
        setIsTyping(true);

        try {
            const token = await getToken();
            if (!token) throw new Error("You are not authenticated.");
            const analysis = await aiService.analyzeStrategy(token, selectedStrategyId, { focusQuestion: focus });
            setMessages((prev) => [...prev, toMessage("assistant", formatAnalysis(analysis, focus))]);
        } catch (error: any) {
            setMessages((prev) => [...prev, toMessage("assistant", `Strategy analysis failed.\n\n${error?.message || "Unknown error."}`)]);
        } finally {
            setIsTyping(false);
        }
    };

    const handleAnalyzePaperSession = async () => {
        if (selectedSessionId === "none") return;
        const focus = inputValue.trim() || "Review behavioral patterns, execution drift, and risk discipline from this paper session.";
        setMessages((prev) => [...prev, toMessage("user", `Analyze selected paper session.\n\nFocus: ${focus}`)]);
        setIsTyping(true);

        try {
            const token = await getToken();
            if (!token) throw new Error("You are not authenticated.");
            const analysis = await aiService.analyzePaperSession(token, selectedSessionId, { focusQuestion: focus });
            setMessages((prev) => [...prev, toMessage("assistant", formatAnalysis(analysis, focus))]);
        } catch (error: any) {
            setMessages((prev) => [...prev, toMessage("assistant", `Paper session analysis failed.\n\n${error?.message || "Unknown error."}`)]);
        } finally {
            setIsTyping(false);
        }
    };

    useEffect(() => {
        // Scroll to bottom when messages change
        if (scrollAreaRef.current) {
            const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
            if (scrollContainer) {
                scrollContainer.scrollTop = scrollContainer.scrollHeight;
            }
        }
    }, [messages, isTyping]);

    return (
        <div className="container mx-auto p-6 max-w-4xl h-[calc(100vh-2rem)] flex flex-col">
            <div className="mb-6">
                <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                    <Sparkles className="h-8 w-8 text-primary" />
                    AI Research Assistant
                </h1>
                <p className="text-muted-foreground">
                    Ask freely. Mention a strategy by name and the assistant will automatically use matching reports.
                </p>
            </div>

            <Card className="flex-1 flex flex-col overflow-hidden border-2 shadow-lg">
                <CardHeader className="border-b bg-card/50 px-6 py-4">
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10 border-2 border-primary/20">
                                <AvatarImage src="/ai-avatar.png" />
                                <AvatarFallback className="bg-primary/10 text-primary">
                                    <Bot className="h-6 w-6" />
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <CardTitle className="text-lg">Strategy Forge AI</CardTitle>
                                <CardDescription className="flex items-center gap-2">
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                    </span>
                                    Live Analysis (free-form)
                                </CardDescription>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                            <Select value={taskType} onValueChange={(value) => setTaskType(value as "summary" | "metric_explanation")}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Task mode" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="summary">Auto Mode</SelectItem>
                                    <SelectItem value="metric_explanation">Force Metric Mode</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select value={selectedStrategyId} onValueChange={setSelectedStrategyId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select strategy context" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">No strategy context</SelectItem>
                                    {strategies.map((strategy) => (
                                        <SelectItem key={strategy.id} value={strategy.id}>
                                            {strategy.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Select value={selectedSessionId} onValueChange={setSelectedSessionId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select paper session" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">No paper-session context</SelectItem>
                                    {paperSessions.map((session) => (
                                        <SelectItem key={session.id} value={session.id}>
                                            {session.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleAnalyzeStrategy}
                                disabled={isTyping || selectedStrategyId === "none"}
                            >
                                <Wand2 className="h-4 w-4 mr-2" />
                                Analyze Strategy
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleAnalyzePaperSession}
                                disabled={isTyping || selectedSessionId === "none"}
                            >
                                <Activity className="h-4 w-4 mr-2" />
                                Analyze Paper Session
                            </Button>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="flex-1 p-0 overflow-hidden relative">
                    <ScrollArea className="h-full px-6 py-6" ref={scrollAreaRef}>
                        <div className="space-y-6 pb-4">
                            {messages.map((message) => (
                                <div
                                    key={message.id}
                                    className={`flex w-full ${message.role === "user" ? "justify-end" : "justify-start"
                                        }`}
                                >
                                    <div
                                        className={`flex gap-3 max-w-[80%] ${message.role === "user" ? "flex-row-reverse" : "flex-row"
                                            }`}
                                    >
                                        <Avatar className={`h-8 w-8 mt-1 border ${message.role === 'user' ? 'border-blue-500/20' : 'border-primary/20'}`}>
                                            <AvatarFallback className={message.role === 'user' ? 'bg-blue-500/10 text-blue-500' : 'bg-primary/10 text-primary'}>
                                                {message.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                                            </AvatarFallback>
                                        </Avatar>

                                        <div
                                            className={`rounded-2xl px-4 py-3 shadow-sm ${message.role === "user"
                                                    ? "bg-blue-600 text-white rounded-tr-sm"
                                                    : "bg-muted rounded-tl-sm"
                                                }`}
                                        >
                                            <p className="text-sm leading-relaxed">{message.content}</p>
                                            <span className={`text-[10px] block mt-1 opacity-70 ${message.role === 'user' ? 'text-blue-100' : 'text-muted-foreground'}`}>
                                                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {isTyping && (
                                <div className="flex justify-start w-full">
                                    <div className="flex gap-3 max-w-[80%]">
                                        <Avatar className="h-8 w-8 mt-1 border border-primary/20">
                                            <AvatarFallback className="bg-primary/10 text-primary">
                                                <Bot className="h-4 w-4" />
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                                            <div className="flex gap-1 h-5 items-center">
                                                <span className="w-1.5 h-1.5 bg-foreground/40 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                                <span className="w-1.5 h-1.5 bg-foreground/40 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                                <span className="w-1.5 h-1.5 bg-foreground/40 rounded-full animate-bounce"></span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </CardContent>

                <CardFooter className="p-4 border-t bg-card/30">
                    <form
                        className="flex w-full gap-2 items-center"
                        onSubmit={(e) => {
                            e.preventDefault();
                            handleSendMessage();
                        }}
                    >
                        <Input
                            placeholder='Example: "Why did my RSI Mean Reversion strategy fail last week?"'
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            className="flex-1 bg-background/50 border-muted-foreground/20 focus-visible:ring-primary/30"
                            disabled={isTyping}
                        />
                        <Button
                            type="submit"
                            size="icon"
                            disabled={!inputValue.trim() || isTyping}
                            className="bg-primary hover:bg-primary/90 shadow-sm transition-all duration-200"
                        >
                            <Send className="h-4 w-4" />
                        </Button>
                    </form>
                </CardFooter>
            </Card>
        </div>
    );
};

export default AIAssistant;

