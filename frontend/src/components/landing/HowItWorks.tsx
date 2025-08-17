import { 
  Play, 
  BarChart3, 
  TrendingUp, 
  ArrowRight,
  Code,
  Zap
} from "lucide-react";
export const HowItWorks = () => {
  const steps = [
    {
      icon: Code,
      title: "Build Your Strategy",
      description: "Use our visual Pine Script builder or write code directly. Choose from templates or start from scratch.",
      color: "from-blue-500 to-blue-600"
    },
    {
      icon: BarChart3,
      title: "Backtest & Optimize",
      description: "Run comprehensive backtests with historical data. Use AI to optimize parameters automatically.",
      color: "from-green-500 to-green-600"
    },
    {
      icon: TrendingUp,
      title: "Deploy & Monitor",
      description: "Deploy your strategy to live trading or paper trading. Monitor performance in real-time.",
      color: "from-purple-500 to-purple-600"
    }
  ];

  return (
    <section className="py-20 bg-background" id="how-it-works">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            How It Works
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Get started with Growmore in three simple steps. 
            From idea to execution, we've streamlined the entire process.
          </p>
        </div>

        <div className="relative">
          {/* Connection line */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-primary/20 via-primary/40 to-primary/20 transform -translate-y-1/2" />
          
          <div className="grid lg:grid-cols-3 gap-8 lg:gap-12">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                <div className="text-center">
                  {/* Step number */}
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-primary to-primary/80 text-white font-bold text-xl mb-6 relative z-10">
                    {index + 1}
                  </div>
                  
                  {/* Icon */}
                  <div className="mb-6">
                    <div className={`inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-r ${step.color} text-white shadow-lg`}>
                      <step.icon className="h-10 w-10" />
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold text-foreground">
                      {step.title}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
                
                {/* Arrow for mobile */}
                {index < steps.length - 1 && (
                  <div className="lg:hidden flex justify-center mt-8">
                    <ArrowRight className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Demo section */}
        <div className="mt-20 text-center">
          <div className="bg-card rounded-2xl p-8 border border-border/50">
            <div className="flex items-center justify-center space-x-3 mb-6">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <Play className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-2xl font-semibold text-foreground">
                See It In Action
              </h3>
            </div>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Watch a quick demo to see how easy it is to build, test, and deploy 
              your first trading strategy with Growmore.
            </p>
            <button className="inline-flex items-center space-x-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors">
              <Play className="h-4 w-4" />
              <span>Watch Demo</span>
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-16 grid md:grid-cols-3 gap-8">
          {[
            { number: "10,000+", label: "Strategies Built", icon: Code },
            { number: "95%", label: "Accuracy Rate", icon: TrendingUp },
            { number: "24/7", label: "AI Support", icon: Zap }
          ].map((stat, index) => (
            <div key={index} className="text-center">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <stat.icon className="h-5 w-5 text-primary" />
                <span className="text-3xl font-bold text-foreground">{stat.number}</span>
              </div>
              <p className="text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}; 