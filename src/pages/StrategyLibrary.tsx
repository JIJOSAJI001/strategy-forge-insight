import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StrategyCard } from "@/components/dashboard/StrategyCard";
import { 
  Search, 
  Filter, 
  Star, 
  TrendingUp, 
  Download,
  Plus,
  Grid3X3,
  List
} from "lucide-react";

const strategies = [
  {
    id: "1",
    name: "RSI Mean Reversion",
    description: "Classic mean reversion strategy using RSI indicator with dynamic position sizing",
    category: "Mean Reversion",
    difficulty: "Beginner",
    rating: 4.5,
    performance: 18.7,
    sharpe: 2.1,
    maxDrawdown: -8.2,
    winRate: 67.3,
    author: "TradingEdge Team",
    downloads: 1247,
    lastUpdated: "2 days ago",
    tags: ["RSI", "Mean Reversion", "Stocks"],
    status: "running" as const
  },
  {
    id: "2", 
    name: "Bollinger Band Breakout",
    description: "Momentum strategy that trades breakouts from Bollinger Bands with volume confirmation",
    category: "Momentum",
    difficulty: "Intermediate",
    rating: 4.2,
    performance: 24.1,
    sharpe: 1.8,
    maxDrawdown: -12.5,
    winRate: 59.2,
    author: "QuantMaster",
    downloads: 892,
    lastUpdated: "1 week ago",
    tags: ["Bollinger Bands", "Breakout", "Volume"],
    status: "paused" as const
  },
  {
    id: "3",
    name: "MACD Trend Following",
    description: "Long-term trend following strategy using MACD crossovers with trend filters",
    category: "Trend Following", 
    difficulty: "Advanced",
    rating: 3.9,
    performance: 31.4,
    sharpe: 1.6,
    maxDrawdown: -15.8,
    winRate: 52.7,
    author: "AlgoTrader Pro",
    downloads: 654,
    lastUpdated: "3 days ago",
    tags: ["MACD", "Trend", "Long-term"],
    status: "backtesting" as const
  },
  {
    id: "4",
    name: "Pairs Trading Arbitrage",
    description: "Market neutral strategy trading statistical arbitrage between correlated assets",
    category: "Arbitrage",
    difficulty: "Expert",
    rating: 4.7,
    performance: 14.2,
    sharpe: 2.8,
    maxDrawdown: -4.1,
    winRate: 71.8,
    author: "HedgeFund Alpha",
    downloads: 423,
    lastUpdated: "5 days ago",
    tags: ["Pairs Trading", "Market Neutral", "Statistical Arbitrage"],
    status: "paper-trading" as const
  },
  {
    id: "5",
    name: "Volatility Breakout",
    description: "Intraday strategy capturing volatility breakouts using ATR and volume spikes",
    category: "Volatility",
    difficulty: "Intermediate",
    rating: 4.0,
    performance: 22.8,
    sharpe: 1.9,
    maxDrawdown: -11.3,
    winRate: 61.5,
    author: "VolatilityKing",
    downloads: 789,
    lastUpdated: "1 day ago",
    tags: ["ATR", "Volatility", "Intraday"],
    status: "running" as const
  },
  {
    id: "6",
    name: "AI Sentiment Strategy",
    description: "ML-powered strategy using sentiment analysis and social media signals",
    category: "AI/ML",
    difficulty: "Expert",
    rating: 4.3,
    performance: 19.6,
    sharpe: 2.2,
    maxDrawdown: -9.7,
    winRate: 64.1,
    author: "AI Innovations",
    downloads: 1156,
    lastUpdated: "6 hours ago",
    tags: ["AI", "Sentiment", "Social Media", "ML"],
    status: "running" as const
  }
];

const categories = ["All", "Mean Reversion", "Momentum", "Trend Following", "Arbitrage", "Volatility", "AI/ML"];
const difficulties = ["All", "Beginner", "Intermediate", "Advanced", "Expert"];

export default function StrategyLibrary() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedDifficulty, setSelectedDifficulty] = useState("All");
  const [sortBy, setSortBy] = useState("rating");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const filteredStrategies = strategies
    .filter(strategy => {
      const matchesSearch = strategy.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          strategy.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          strategy.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory = selectedCategory === "All" || strategy.category === selectedCategory;
      const matchesDifficulty = selectedDifficulty === "All" || strategy.difficulty === selectedDifficulty;
      return matchesSearch && matchesCategory && matchesDifficulty;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "rating":
          return b.rating - a.rating;
        case "performance":
          return b.performance - a.performance;
        case "downloads":
          return b.downloads - a.downloads;
        case "recent":
          return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime();
        default:
          return 0;
      }
    });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Strategy Library</h1>
          <p className="text-muted-foreground">Discover and deploy proven trading strategies</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Import Strategy
          </Button>
          <Button variant="trading" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Create New
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search strategies, tags, or authors..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Difficulty" />
                </SelectTrigger>
                <SelectContent>
                  {difficulties.map(difficulty => (
                    <SelectItem key={difficulty} value={difficulty}>{difficulty}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rating">Rating</SelectItem>
                  <SelectItem value="performance">Performance</SelectItem>
                  <SelectItem value="downloads">Downloads</SelectItem>
                  <SelectItem value="recent">Most Recent</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex border border-border rounded-lg p-1">
                <Button
                  variant={viewMode === "grid" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className="h-8 w-8 p-0"
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className="h-8 w-8 p-0"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className="flex justify-between items-center">
        <p className="text-muted-foreground">
          Showing {filteredStrategies.length} of {strategies.length} strategies
        </p>
        <div className="flex gap-2">
          {selectedCategory !== "All" && (
            <Badge variant="secondary" className="gap-1">
              {selectedCategory}
              <button onClick={() => setSelectedCategory("All")} className="ml-1 hover:text-foreground">×</button>
            </Badge>
          )}
          {selectedDifficulty !== "All" && (
            <Badge variant="secondary" className="gap-1">
              {selectedDifficulty}
              <button onClick={() => setSelectedDifficulty("All")} className="ml-1 hover:text-foreground">×</button>
            </Badge>
          )}
        </div>
      </div>

      {/* Strategy Grid/List */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredStrategies.map((strategy) => (
            <Card key={strategy.id} className="hover:shadow-lg transition-all duration-200 border border-border hover:border-primary/20">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg font-semibold">{strategy.name}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">{strategy.description}</p>
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-medium">{strategy.rating}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline">{strategy.category}</Badge>
                  <Badge variant={
                    strategy.difficulty === "Beginner" ? "secondary" :
                    strategy.difficulty === "Intermediate" ? "default" :
                    strategy.difficulty === "Advanced" ? "secondary" : "outline"
                  }>
                    {strategy.difficulty}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div>
                    <span className="text-xs text-muted-foreground">Performance</span>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3 text-success" />
                      <span className="text-sm font-medium text-success">+{strategy.performance}%</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Sharpe Ratio</span>
                    <p className="text-sm font-medium">{strategy.sharpe}</p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Max Drawdown</span>
                    <p className="text-sm font-medium text-danger">{strategy.maxDrawdown}%</p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Win Rate</span>
                    <p className="text-sm font-medium">{strategy.winRate}%</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1 mb-4">
                  {strategy.tags.slice(0, 3).map((tag, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {strategy.tags.length > 3 && (
                    <Badge variant="secondary" className="text-xs">
                      +{strategy.tags.length - 3}
                    </Badge>
                  )}
                </div>
                <div className="flex justify-between items-center text-xs text-muted-foreground mb-4">
                  <span>By {strategy.author}</span>
                  <span>{strategy.downloads} downloads</span>
                </div>
                <div className="flex gap-2">
                  <Button variant="trading" size="sm" className="flex-1">
                    Use Strategy
                  </Button>
                  <Button variant="outline" size="sm">
                    Preview
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredStrategies.map((strategy) => (
            <Card key={strategy.id} className="hover:shadow-md transition-all duration-200">
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{strategy.name}</h3>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-medium">{strategy.rating}</span>
                      </div>
                      <Badge variant="outline">{strategy.category}</Badge>
                      <Badge variant="secondary">{strategy.difficulty}</Badge>
                    </div>
                    <p className="text-muted-foreground mb-3">{strategy.description}</p>
                    <div className="flex items-center gap-6 text-sm">
                      <div className="flex items-center gap-1">
                        <TrendingUp className="h-4 w-4 text-success" />
                        <span className="text-success font-medium">+{strategy.performance}%</span>
                      </div>
                      <span>Sharpe: {strategy.sharpe}</span>
                      <span>Max DD: <span className="text-danger">{strategy.maxDrawdown}%</span></span>
                      <span>Win Rate: {strategy.winRate}%</span>
                      <span>{strategy.downloads} downloads</span>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-6">
                    <Button variant="trading" size="sm">
                      Use Strategy
                    </Button>
                    <Button variant="outline" size="sm">
                      Preview
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}