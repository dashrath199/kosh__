import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, Shield, TrendingUp, Target, Smartphone } from "lucide-react";
import heroImage from "@/assets/hero-illustration.jpg";

interface HeroProps {
  onGetStarted?: () => void;
}

const Hero = ({ onGetStarted }: HeroProps) => {
  return (
    <section className="relative overflow-hidden bg-gradient-hero min-h-screen flex items-center">
      <div className="container mx-auto px-4 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Hero Content */}
          <div className="text-white space-y-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 text-sm">
                <Shield className="h-4 w-4" />
                <span>Secure & Regulated</span>
              </div>
              
              <h1 className="text-5xl lg:text-6xl font-bold leading-tight">
                Grow Your Business Money 
                <span className="text-transparent bg-gradient-to-r from-white to-green-300 bg-clip-text">
                  {" "}Automatically
                </span>
              </h1>
              
              <p className="text-xl text-white/90 leading-relaxed max-w-lg">
                Turn every UPI sale into smart savings and investments. Built for Indian merchants who want their money to grow while they focus on business.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button variant="hero" size="lg" className="group" onClick={onGetStarted}>
                Start Growing Money
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button variant="outline-hero" size="lg">
                Watch Demo
              </Button>
            </div>

            {/* Key Features */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-8">
              <div className="flex items-center gap-3">
                <div className="bg-white/10 p-2 rounded-lg">
                  <Smartphone className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-semibold">Auto-Save</div>
                  <div className="text-sm text-white/80">From UPI sales</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="bg-white/10 p-2 rounded-lg">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-semibold">Smart Invest</div>
                  <div className="text-sm text-white/80">Goal-based funds</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="bg-white/10 p-2 rounded-lg">
                  <Target className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-semibold">Track Goals</div>
                  <div className="text-sm text-white/80">Business growth</div>
                </div>
              </div>
            </div>
          </div>

          {/* Hero Image */}
          <div className="relative">
            <div className="relative z-10">
              <img 
                src={heroImage} 
                alt="Kosh - Smart financial assistant for merchants" 
                className="w-full max-w-lg mx-auto rounded-2xl shadow-2xl"
              />
            </div>
            
            {/* Floating cards */}
            <Card className="absolute -top-4 -left-4 bg-gradient-card p-4 shadow-card">
              <div className="text-sm text-muted-foreground">Today's Growth</div>
              <div className="text-2xl font-bold text-success">+₹2,450</div>
            </Card>
            
            <Card className="absolute -bottom-4 -right-4 bg-gradient-card p-4 shadow-card">
              <div className="text-sm text-muted-foreground">Savings Rate</div>
              <div className="text-2xl font-bold text-primary">3.5%</div>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;