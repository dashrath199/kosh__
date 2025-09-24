import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useEffect, useState } from "react";
import { getDashboard } from "@/lib/api";

import { 
  TrendingUp, 
  DollarSign, 
  Target, 
  Plus, 
  ArrowUpRight,
  Wallet,
  PiggyBank,
  Settings
} from "lucide-react";

type Goal = { name: string; current: number; target: number; progress: number };
type Activity = { type: 'save' | 'invest' | 'goal'; amount: number; description: string; time: string };

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [treasuryBalance, setTreasuryBalance] = useState(0);
  const [investedAmount, setInvestedAmount] = useState(0);
  const [savingsThisMonth, setSavingsThisMonth] = useState(0);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [recentActivity, setRecentActivity] = useState<Activity[]>([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await getDashboard();
        if (!mounted) return;
        setTreasuryBalance(data.treasuryBalance ?? 0);
        setInvestedAmount(data.investedAmount ?? 0);
        setSavingsThisMonth(data.savingsThisMonth ?? 0);
        setGoals(data.goals ?? []);
        setRecentActivity(data.recentActivity ?? []);
        setError(null);
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.message || 'Failed to load dashboard');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false };
  }, []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Welcome back, Rajesh! 👋</h1>
          <p className="text-muted-foreground">Here's how your money is growing</p>
        </div>
        <Button variant="primary" className="gap-2">
          <Plus className="h-4 w-4" />
          New Goal
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-card shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Treasury Balance</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{treasuryBalance.toLocaleString('en-IN')}</div>

            <p className="text-xs text-success flex items-center gap-1">
              <ArrowUpRight className="h-3 w-3" />
              +12% from last month
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Invested Amount</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">₹{investedAmount.toLocaleString('en-IN')}</div>

            <p className="text-xs text-success flex items-center gap-1">
              <ArrowUpRight className="h-3 w-3" />
              +8.2% growth
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month's Savings</CardTitle>
            <PiggyBank className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{savingsThisMonth.toLocaleString('en-IN')}</div>

            <p className="text-xs text-muted-foreground">3.5% of sales saved</p>
          </CardContent>
        </Card>
      </div>

      {/* Goals Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Active Goals
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {(goals.length ? goals : [
              { name: 'Emergency Fund', current: 30000, target: 50000, progress: 60 },
              { name: 'New Equipment', current: 25000, target: 100000, progress: 25 },
              { name: "Child's Education", current: 75000, target: 500000, progress: 15 },
            ]).map((g, idx) => (
              <div key={idx} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{g.name}</span>
                  <span className="text-primary font-medium">{g.progress}% complete</span>
                </div>
                <Progress value={g.progress} className="h-2" />
                <div className="text-xs text-muted-foreground">₹{g.current.toLocaleString('en-IN')} of ₹{g.target.toLocaleString('en-IN')}</div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-success" />
              Savings Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-secondary rounded-lg">
              <div>
                <div className="font-medium">Auto-Save Rate</div>
                <div className="text-sm text-muted-foreground">From UPI sales</div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-primary">3.5%</div>
                <Button variant="outline" size="sm" className="mt-2">
                  <Settings className="h-3 w-3 mr-1" />
                  Adjust
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Round-ups</span>
                <span className="text-sm font-medium text-success">Active</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Weekly top-up</span>
                <span className="text-sm font-medium">₹500</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Minimum save threshold</span>
                <span className="text-sm font-medium">₹100</span>
              </div>
            </div>

            <Button variant="outline" className="w-full">
              Modify Settings
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {(recentActivity.length ? recentActivity : [
              { type: 'save', amount: 175, description: 'Auto-saved from UPI sale', time: '2 minutes ago' },
              { type: 'invest', amount: 2500, description: 'Invested in Emergency Fund', time: '1 hour ago' },
              { type: 'save', amount: 85, description: 'Round-up savings', time: '3 hours ago' },
              { type: 'goal', amount: 5000, description: 'Emergency Fund milestone reached', time: 'Yesterday' },
            ]).map((activity, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${
                    activity.type === 'save' ? 'bg-primary/10 text-primary' :
                    activity.type === 'invest' ? 'bg-success/10 text-success' :
                    'bg-warning/10 text-warning'
                  }`}>
                    {activity.type === 'save' && <PiggyBank className="h-4 w-4" />}
                    {activity.type === 'invest' && <TrendingUp className="h-4 w-4" />}
                    {activity.type === 'goal' && <Target className="h-4 w-4" />}
                  </div>
                  <div>
                    <div className="font-medium">{activity.description}</div>
                    <div className="text-xs text-muted-foreground">{activity.time}</div>
                  </div>
                </div>
                <div className="font-bold text-success">₹{activity.amount.toLocaleString('en-IN')}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;