import { Button } from "@/components/ui/button";
import { AuthDialog } from "@/components/auth/AuthDialog";
import { TrendingUp, Zap, Shield } from "lucide-react";

export const Hero = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-primary text-primary-foreground hover:bg-primary/80">
                <Zap className="mr-1 h-3 w-3" />
                AI-Powered Trading
              </div>
              <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
                Supercharge Your{" "}
                <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  Trading Strategy
                </span>{" "}
                with AI
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl">
                Build, backtest, and optimize your trading strategies with advanced AI tools. 
                From Pine Script visual builder to intelligent parameter optimization, 
                everything you need to succeed in the markets with Growmore.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <AuthDialog
                trigger={
                  <Button size="lg" className="text-lg px-8 py-6">
                    Get Started Free
                  </Button>
                }
              />
              <Button variant="outline" size="lg" className="text-lg px-8 py-6">
                Watch Demo
              </Button>
            </div>

            {/* Trust indicators */}
            <div className="flex items-center space-x-8 pt-8">
              <div className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-green-500" />
                <span className="text-sm text-muted-foreground">Secure & Reliable</span>
              </div>
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-blue-500" />
                <span className="text-sm text-muted-foreground">Proven Results</span>
              </div>
            </div>
          </div>

          {/* Illustration */}
          <div className="relative">
            <div className="relative rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 p-8 border border-border/50">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent rounded-2xl" />
              <div className="relative space-y-4">
                {/* Dashboard mockup */}
                <div className="bg-card rounded-lg p-4 border border-border/50">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <div className="h-3 w-3 rounded-full bg-green-500" />
                      <span className="text-sm font-medium">Strategy Performance</span>
                    </div>
                    <div className="text-sm text-muted-foreground">+24.5%</div>
                  </div>
                  <div className="h-20 bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded flex items-center justify-center">
                    <TrendingUp className="h-8 w-8 text-primary" />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-card rounded-lg p-3 border border-border/50">
                    <div className="text-xs text-muted-foreground mb-1">Win Rate</div>
                    <div className="text-lg font-bold text-foreground">68%</div>
                  </div>
                  <div className="bg-card rounded-lg p-3 border border-border/50">
                    <div className="text-xs text-muted-foreground mb-1">Sharpe Ratio</div>
                    <div className="text-lg font-bold text-foreground">1.85</div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Floating elements */}
            <div className="absolute -top-4 -right-4 bg-primary/10 rounded-full p-3">
              <Zap className="h-6 w-6 text-primary" />
            </div>
            <div className="absolute -bottom-4 -left-4 bg-blue-500/10 rounded-full p-3">
              <TrendingUp className="h-6 w-6 text-blue-500" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}; 