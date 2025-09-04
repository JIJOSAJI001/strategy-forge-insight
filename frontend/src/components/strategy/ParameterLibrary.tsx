import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, BarChart3, TrendingUp, TrendingDown, Target, Shield } from "lucide-react";
import { Parameter } from "@/pages/DragDropStrategyBuilder";
import DraggableParameter from "./DraggableParameter";

interface ParameterLibraryProps {
  parameters: Parameter[];
}

export default function ParameterLibrary({ parameters }: ParameterLibraryProps) {
  const [searchQuery, setSearchQuery] = useState("");

  // Group parameters by category
  const groupedParameters = parameters.reduce((acc, parameter) => {
    if (!acc[parameter.category]) {
      acc[parameter.category] = [];
    }
    acc[parameter.category].push(parameter);
    return acc;
  }, {} as Record<string, Parameter[]>);

  // Filter parameters based on search query
  const filteredParameters = parameters.filter(parameter =>
    parameter.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    parameter.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    parameter.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredGroupedParameters = filteredParameters.reduce((acc, parameter) => {
    if (!acc[parameter.category]) {
      acc[parameter.category] = [];
    }
    acc[parameter.category].push(parameter);
    return acc;
  }, {} as Record<string, Parameter[]>);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Momentum':
        return <BarChart3 className="h-4 w-4" />;
      case 'Trend':
        return <TrendingUp className="h-4 w-4" />;
      case 'Volatility':
        return <Target className="h-4 w-4" />;
      case 'Comparison':
        return <TrendingDown className="h-4 w-4" />;
      case 'Crossover':
        return <TrendingUp className="h-4 w-4" />;
      case 'Entry':
        return <TrendingUp className="h-4 w-4" />;
      case 'Exit':
        return <TrendingDown className="h-4 w-4" />;
      case 'Risk':
        return <Shield className="h-4 w-4" />;
      default:
        return <BarChart3 className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Momentum':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'Trend':
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200';
      case 'Volatility':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'Comparison':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'Crossover':
        return 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200';
      case 'Entry':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200';
      case 'Exit':
        return 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200';
      case 'Risk':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Parameter Library
        </CardTitle>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search parameters..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="indicators">Indicators</TabsTrigger>
            <TabsTrigger value="conditions">Conditions</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="space-y-4 mt-4">
            {Object.entries(filteredGroupedParameters).map(([category, params]) => (
              <div key={category} className="space-y-2">
                <div className="flex items-center gap-2">
                  {getCategoryIcon(category)}
                  <h3 className="font-medium text-sm">{category}</h3>
                  <Badge variant="outline" className={getCategoryColor(category)}>
                    {params.length}
                  </Badge>
                </div>
                <div className="space-y-2">
                  {params.map((parameter) => (
                    <DraggableParameter key={parameter.id} parameter={parameter} />
                  ))}
                </div>
              </div>
            ))}
          </TabsContent>
          
          <TabsContent value="indicators" className="space-y-4 mt-4">
            {Object.entries(filteredGroupedParameters)
              .filter(([category]) => 
                ['Momentum', 'Trend', 'Volatility'].includes(category)
              )
              .map(([category, params]) => (
                <div key={category} className="space-y-2">
                  <div className="flex items-center gap-2">
                    {getCategoryIcon(category)}
                    <h3 className="font-medium text-sm">{category}</h3>
                    <Badge variant="outline" className={getCategoryColor(category)}>
                      {params.length}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    {params.map((parameter) => (
                      <DraggableParameter key={parameter.id} parameter={parameter} />
                    ))}
                  </div>
                </div>
              ))}
          </TabsContent>
          
          <TabsContent value="conditions" className="space-y-4 mt-4">
            {Object.entries(filteredGroupedParameters)
              .filter(([category]) => 
                ['Comparison', 'Crossover', 'Entry', 'Exit', 'Risk'].includes(category)
              )
              .map(([category, params]) => (
                <div key={category} className="space-y-2">
                  <div className="flex items-center gap-2">
                    {getCategoryIcon(category)}
                    <h3 className="font-medium text-sm">{category}</h3>
                    <Badge variant="outline" className={getCategoryColor(category)}>
                      {params.length}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    {params.map((parameter) => (
                      <DraggableParameter key={parameter.id} parameter={parameter} />
                    ))}
                  </div>
                </div>
              ))}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
} 