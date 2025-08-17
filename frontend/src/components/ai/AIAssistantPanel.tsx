import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, Bot, User, Sparkles } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface AIAssistantPanelProps {
  isMinimized?: boolean;
  onToggleMinimize?: () => void;
}

export function AIAssistantPanel({ isMinimized = false, onToggleMinimize }: AIAssistantPanelProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Hi! I'm your AI trading assistant. I can help you analyze strategies, interpret results, and answer questions about your trading performance. What would you like to know?",
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState("");

  const handleSendMessage = () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: getAIResponse(input),
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiResponse]);
    }, 1000);
  };

  const getAIResponse = (query: string): string => {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes("sharpe") || lowerQuery.includes("ratio")) {
      return "Your current best performing strategy has a Sharpe ratio of 2.34, which is excellent! A Sharpe ratio above 2 is considered very good in trading. This indicates your strategy generates strong risk-adjusted returns.";
    }
    
    if (lowerQuery.includes("strategy") || lowerQuery.includes("performance")) {
      return "Based on your portfolio, the RSI Mean Reversion strategy is performing best with +8.2% returns in 24h. The Bollinger Bands strategy shows consistent performance in paper trading with +12.7% over 7 days. Would you like me to analyze what's driving these results?";
    }
    
    if (lowerQuery.includes("market") || lowerQuery.includes("condition")) {
      return "Current market analysis shows bullish momentum with moderate volatility. This environment typically favors trend-following strategies over mean reversion. Consider increasing allocation to momentum-based strategies.";
    }
    
    return "I can help you with strategy analysis, performance optimization, risk management, and market insights. Try asking about specific strategies, performance metrics, or market conditions.";
  };

  const suggestedQueries = [
    "Which strategy has the best Sharpe ratio?",
    "How is my portfolio performing today?",
    "What are current market conditions?",
    "Analyze my RSI strategy performance"
  ];

  if (isMinimized) {
    return (
      <Button
        onClick={onToggleMinimize}
        className="fixed bottom-4 right-4 h-12 w-12 rounded-full bg-primary shadow-lg hover:shadow-xl"
        size="icon"
      >
        <Bot className="h-6 w-6" />
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-4 right-4 w-96 h-[500px] shadow-xl border-primary/20 bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Assistant
          </CardTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onToggleMinimize}
            className="h-8 w-8 p-0"
          >
            ×
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col h-[calc(100%-5rem)] p-4">
        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {message.role === "assistant" && (
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      <Bot className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground"
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                </div>
                {message.role === "user" && (
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-muted">
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
        
        {messages.length <= 1 && (
          <div className="mb-4">
            <p className="text-xs text-muted-foreground mb-2">Try asking:</p>
            <div className="space-y-1">
              {suggestedQueries.map((query, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  size="sm"
                  className="h-auto p-2 text-xs text-left justify-start w-full"
                  onClick={() => setInput(query)}
                >
                  {query}
                </Button>
              ))}
            </div>
          </div>
        )}
        
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your strategies..."
            onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
            className="text-sm"
          />
          <Button 
            size="icon" 
            onClick={handleSendMessage}
            disabled={!input.trim()}
            variant="trading"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}