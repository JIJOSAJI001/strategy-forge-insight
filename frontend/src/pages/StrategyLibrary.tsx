import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { StrategyCard } from "@/components/dashboard/StrategyCard";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import {
  Search,
  Filter,
  Star,
  TrendingUp,
  Download,
  Plus,
  Grid3X3,
  List,
  Upload,
  Eye
} from "lucide-react";

// Strategy interface matching the backend response
interface Strategy {
  id: string;
  title: string;
  description: string;
  performance: number;
  sharpe: number;
  drawdown: number;
  winrate: number;
  tags: string[];
  downloads: number;
  rating: number;
  category?: string;
  difficulty?: string;
  author?: string;
  lastUpdated?: string;
  status?: string;
}

const categories = ["All", "Mean Reversion", "Momentum", "Trend Following", "Arbitrage", "Volatility", "AI/ML"];
const difficulties = ["All", "Beginner", "Intermediate", "Advanced", "Expert"];

export default function StrategyLibrary() {
  const navigate = useNavigate();
  const { user, getToken } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedDifficulty, setSelectedDifficulty] = useState("All");
  const [sortBy, setSortBy] = useState("rating");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewStrategy, setPreviewStrategy] = useState<Strategy | null>(null);

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  // Fetch strategies from the backend
  useEffect(() => {
    const fetchStrategies = async () => {
      try {
        setLoading(true);

        // **OPTIMIZED: Use cached token from AuthContext**
        const token = getToken ? await getToken() : null;
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        };

        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`${API_BASE_URL}/api/strategies`, {
          headers
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setStrategies(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching strategies:', err);
        setError('Failed to load strategies. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchStrategies();
  }, [getToken, API_BASE_URL]);

  // Handle button actions
  const handleUseStrategy = (strategyId: string) => {
    navigate(`/backtesting?strategy=${strategyId}`);
  };

  const handlePreview = (strategy: Strategy) => {
    setPreviewStrategy(strategy);
  };

  const filteredStrategies = strategies
    .filter(strategy => {
      const matchesSearch = strategy.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
          return new Date(b.lastUpdated || '').getTime() - new Date(a.lastUpdated || '').getTime();
        default:
          return 0;
      }
    });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Strategy Library</h1>
            <p className="text-muted-foreground">Discover and deploy proven trading strategies</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-3">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-full"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                  <div className="h-3 bg-muted rounded w-2/3"></div>
                  <div className="h-3 bg-muted rounded w-1/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Strategy Library</h1>
            <p className="text-muted-foreground">Discover and deploy proven trading strategies</p>
          </div>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={() => window.location.reload()}>
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Strategy Library</h1>
          <p className="text-muted-foreground">Discover and deploy proven trading strategies</p>
        </div>
        <div className="flex gap-3">
          <Button variant="trading" size="sm" onClick={() => navigate('/drag-drop-strategy-builder')}>
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
                    <CardTitle className="text-lg font-semibold">{strategy.title}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">{strategy.description}</p>
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-medium">{strategy.rating}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  {strategy.category && <Badge variant="outline">{strategy.category}</Badge>}
                  {strategy.difficulty && (
                    <Badge variant={
                      strategy.difficulty === "Beginner" ? "secondary" :
                        strategy.difficulty === "Intermediate" ? "default" :
                          strategy.difficulty === "Advanced" ? "secondary" : "outline"
                    }>
                      {strategy.difficulty}
                    </Badge>
                  )}
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
                    <p className="text-sm font-medium text-danger">{strategy.drawdown}%</p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Win Rate</span>
                    <p className="text-sm font-medium">{strategy.winrate}%</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1 mb-4">
                  {strategy.tags.slice(0, 3).map((tag, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}ooo
                  {strategy.tags.length > 3 && (
                    <Badge variant="secondary" className="text-xs">
                      +{strategy.tags.length - 3}
                    </Badge>
                  )}
                </div>
                <div className="flex justify-between items-center text-xs text-muted-foreground mb-4">
                  <span>By {strategy.author || 'Unknown'}</span>
                  <span>{strategy.downloads} downloads</span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="trading"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleUseStrategy(strategy.id)}
                  >
                    Use Strategy
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePreview(strategy)}
                  >
                    <Eye className="h-4 w-4" />
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
                      <h3 className="text-lg font-semibold">{strategy.title}</h3>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-medium">{strategy.rating}</span>
                      </div>
                      {strategy.category && <Badge variant="outline">{strategy.category}</Badge>}
                      {strategy.difficulty && <Badge variant="secondary">{strategy.difficulty}</Badge>}
                    </div>
                    <p className="text-muted-foreground mb-3">{strategy.description}</p>
                    <div className="flex items-center gap-6 text-sm">
                      <div className="flex items-center gap-1">
                        <TrendingUp className="h-4 w-4 text-success" />
                        <span className="text-success font-medium">+{strategy.performance}%</span>
                      </div>
                      <span>Sharpe: {strategy.sharpe}</span>
                      <span>Max DD: <span className="text-danger">{strategy.drawdown}%</span></span>
                      <span>Win Rate: {strategy.winrate}%</span>
                      <span>{strategy.downloads} downloads</span>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-6">
                    <Button
                      variant="trading"
                      size="sm"
                      onClick={() => handleUseStrategy(strategy.id)}
                    >
                      Use Strategy
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePreview(strategy)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Preview
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Preview Modal */}
      <Dialog open={!!previewStrategy} onOpenChange={() => setPreviewStrategy(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">{previewStrategy?.title}</DialogTitle>
            <DialogDescription>{previewStrategy?.description}</DialogDescription>
          </DialogHeader>
          {previewStrategy && (
            <div className="space-y-6 mt-4">
              <div className="flex gap-2">
                {previewStrategy.category && <Badge>{previewStrategy.category}</Badge>}
                {previewStrategy.difficulty && <Badge variant="outline">{previewStrategy.difficulty}</Badge>}
                <div className="flex items-center gap-1 ml-auto">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium">{previewStrategy.rating}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-muted rounded-lg">
                  <div className="text-sm text-muted-foreground mb-1">Performance</div>
                  <div className="text-xl font-bold text-success">+{previewStrategy.performance}%</div>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <div className="text-sm text-muted-foreground mb-1">Sharpe Ratio</div>
                  <div className="text-xl font-bold">{previewStrategy.sharpe}</div>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <div className="text-sm text-muted-foreground mb-1">Max Drawdown</div>
                  <div className="text-xl font-bold text-danger">{previewStrategy.drawdown}%</div>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <div className="text-sm text-muted-foreground mb-1">Win Rate</div>
                  <div className="text-xl font-bold">{previewStrategy.winrate}%</div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Tags</h4>
                <div className="flex flex-wrap gap-2">
                  {previewStrategy.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary">{tag}</Badge>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <div className="text-sm text-muted-foreground">
                  <div>Author: {previewStrategy.author || 'Unknown'}</div>
                  <div>Downloads: {previewStrategy.downloads}</div>
                  <div>Last Updated: {previewStrategy.lastUpdated || 'N/A'}</div>
                </div>
                <Button
                  variant="trading"
                  onClick={() => {
                    setPreviewStrategy(null);
                    handleUseStrategy(previewStrategy.id);
                  }}
                >
                  Use This Strategy
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}