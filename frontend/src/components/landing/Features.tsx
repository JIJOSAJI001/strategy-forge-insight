import { 
  BarChart3, 
  Code, 
  TrendingUp, 
  Zap, 
  Download, 
  Target, 
  BarChart, 
  Settings,
  FileText,
  GitCompare,
  Shield
} from "lucide-react";
export const Features = () => {
  const features = [
    {
      icon: BarChart3,
      title: "Strategy Backtesting",
      description: "Comprehensive backtesting engine with advanced analytics and performance metrics.",
      subFeatures: [
        {
          icon: Zap,
          title: "AI Parameter Optimization",
          description: "Automatically optimize strategy parameters using machine learning algorithms."
        },
        {
          icon: Download,
          title: "Backtest Export Options",
          description: "Export results in multiple formats including PDF, CSV, and interactive reports."
        },
        {
          icon: Target,
          title: "Risk Management Tools",
          description: "Built-in risk assessment and position sizing recommendations."
        }
      ]
    },
    {
      icon: Code,
      title: "Pine Script Visual Builder",
      description: "Drag-and-drop interface for creating complex trading strategies without coding.",
      subFeatures: [
        {
          icon: Settings,
          title: "Visual Strategy Editor",
          description: "Intuitive block-based programming for strategy creation."
        },
        {
          icon: FileText,
          title: "Template Library",
          description: "Pre-built strategy templates and components for quick deployment."
        },
        {
          icon: Zap,
          title: "Real-time Validation",
          description: "Instant syntax checking and strategy validation as you build."
        }
      ]
    },
    {
      icon: TrendingUp,
      title: "Built-in Strategy Comparison",
      description: "Compare multiple strategies side-by-side with comprehensive benchmarking tools.",
      subFeatures: [
        {
          icon: GitCompare,
          title: "Performance Benchmarking",
          description: "Compare strategies against market indices and peer strategies."
        },
        {
          icon: BarChart,
          title: "Advanced Analytics",
          description: "Deep dive into drawdowns, volatility, and correlation analysis."
        },
        {
          icon: Target,
          title: "Portfolio Optimization",
          description: "Optimize strategy weights for maximum risk-adjusted returns."
        }
      ]
    }
  ];

  return (
    <section className="py-20 bg-muted/30" id="features">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Core Features
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Everything you need to build, test, and optimize your trading strategies 
            with professional-grade tools and AI-powered insights from Growmore.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="group">
              <div className="bg-card rounded-xl p-8 border border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-lg">
                <div className="flex items-center space-x-4 mb-6">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-foreground">
                      {feature.title}
                    </h3>
                  </div>
                </div>
                
                <p className="text-muted-foreground mb-6">
                  {feature.description}
                </p>

                <div className="space-y-4">
                  {feature.subFeatures.map((subFeature, subIndex) => (
                    <div key={subIndex} className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-1">
                        <div className="w-6 h-6 bg-muted rounded-full flex items-center justify-center">
                          <subFeature.icon className="h-3 w-3 text-muted-foreground" />
                        </div>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-foreground">
                          {subFeature.title}
                        </h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          {subFeature.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Additional features grid */}
        <div className="mt-16 grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: Zap, title: "AI Assistant", description: "Get instant help with strategy development" },
            { icon: BarChart, title: "Real-time Data", description: "Live market data and news feeds" },
            { icon: Shield, title: "Secure Trading", description: "Bank-level security for your strategies" },
            { icon: Download, title: "Easy Export", description: "Export strategies to multiple platforms" }
          ].map((item, index) => (
            <div key={index} className="text-center p-6 bg-card rounded-lg border border-border/50">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <item.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}; 