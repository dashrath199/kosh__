import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useEffect, useState } from "react";
import { getDashboard, getSettings, updateSettings, credit, debit as debitApi, batchCredits as batchCreditsApi, invest as investApi } from "@/lib/api";
import { invest as _unused, liquidate as liquidateApi } from "@/lib/api";

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
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Goal = { name: string; current: number; target: number; progress: number };
type Activity = { type: 'save' | 'invest' | 'goal'; amount: number; description: string; time: string };
type User = { name: string; email: string; phone: string };

interface DashboardProps {
  user?: User | null;
}

const Dashboard = ({ user }: DashboardProps) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [treasuryBalance, setTreasuryBalance] = useState(0);
  const [investedAmount, setInvestedAmount] = useState(0);
  const [savingsThisMonth, setSavingsThisMonth] = useState(0);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [recentActivity, setRecentActivity] = useState<Activity[]>([]);
  const [newGoalOpen, setNewGoalOpen] = useState(false);
  const [newGoalName, setNewGoalName] = useState("");
  const [newGoalTarget, setNewGoalTarget] = useState<string>("");
  const [newGoalCurrent, setNewGoalCurrent] = useState<string>("");
  const [autoSaveRate, setAutoSaveRate] = useState<number>(3.5);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [pendingRate, setPendingRate] = useState<string>("3.5");
  const [weeklyTopUp, setWeeklyTopUp] = useState<number>(500);
  const [modifyOpen, setModifyOpen] = useState(false);
  const [pendingWeeklyTopUp, setPendingWeeklyTopUp] = useState<string>("500");
  const [simulateOpen, setSimulateOpen] = useState(false);
  const [simulateAmount, setSimulateAmount] = useState<string>("");
  const [simulateDebitOpen, setSimulateDebitOpen] = useState(false);
  const [simulateDebitAmount, setSimulateDebitAmount] = useState<string>("");
  const [simulateBatchOpen, setSimulateBatchOpen] = useState(false);
  const [simulateBatchAmounts, setSimulateBatchAmounts] = useState<string>("");
  const [investOpen, setInvestOpen] = useState(false);
  const [investAmount, setInvestAmount] = useState<string>("");
  const [investRisk, setInvestRisk] = useState<'high' | 'low'>('low');
  const [liquidateOpen, setLiquidateOpen] = useState(false);
  const [liquidateAmount, setLiquidateAmount] = useState<string>("");

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

  // Load settings from backend mock
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const s = await getSettings();
        if (!mounted) return;
        if (typeof s.autoSaveRate === 'number') setAutoSaveRate(s.autoSaveRate);
        if (typeof s.weeklyTopUp === 'number') setWeeklyTopUp(s.weeklyTopUp);
      } catch {
        // ignore in mock if endpoint not available
      }
    })();
    return () => { mounted = false };
  }, []);

  const resetNewGoalForm = () => {
    setNewGoalName("");
    setNewGoalTarget("");
    setNewGoalCurrent("");
  };

  const handleInvest = async () => {
    const amt = Number(investAmount);
    if (!Number.isFinite(amt) || amt <= 0) return;
    if (amt > treasuryBalance) return;
    try {
      await investApi(amt, investRisk);
      await refreshDashboard();
      setInvestOpen(false);
      setInvestAmount("");
    } catch {}
  };

  const handleLiquidate = async () => {
    const amt = Number(liquidateAmount);
    if (!Number.isFinite(amt) || amt <= 0) return;
    if (amt > investedAmount) return;
    try {
      await liquidateApi(amt);
      await refreshDashboard();
      setLiquidateOpen(false);
      setLiquidateAmount("");
    } catch {}
  };

  const handleSimulateDebit = async () => {
    const amt = Number(simulateDebitAmount);
    if (!Number.isFinite(amt) || amt <= 0) return;
    try {
      await debitApi(amt);
      await refreshDashboard();
      setSimulateDebitOpen(false);
      setSimulateDebitAmount("");
    } catch {}
  };

  const handleSimulateBatch = async () => {
    const nums = simulateBatchAmounts
      .split(',')
      .map((s) => Number(s.trim()))
      .filter((n) => Number.isFinite(n) && n > 0);
    if (!nums.length) return;
    try {
      await batchCreditsApi(nums);
      await refreshDashboard();
      setSimulateBatchOpen(false);
      setSimulateBatchAmounts("");
    } catch {}
  };

  const handleSaveRate = () => {
    const parsed = Number(pendingRate);
    if (!Number.isFinite(parsed)) return;
    const clamped = Math.max(0, Math.min(100, parsed));
    setAutoSaveRate(clamped);
    // Persist to backend mock (fire and forget)
    updateSettings({ autoSaveRate: clamped }).catch(() => {});
    setAdjustOpen(false);
  };

  const handleSaveModifySettings = () => {
    const parsedRate = Number(pendingRate);
    const parsedWeekly = Number(pendingWeeklyTopUp);
    if (Number.isFinite(parsedRate)) {
      const clampedRate = Math.max(0, Math.min(100, parsedRate));
      setAutoSaveRate(clampedRate);
    }
    if (Number.isFinite(parsedWeekly) && parsedWeekly >= 0) {
      setWeeklyTopUp(parsedWeekly);
    }
    // Persist to backend mock (fire and forget)
    updateSettings({ autoSaveRate, weeklyTopUp }).catch(() => {});
    setModifyOpen(false);
  };

  const refreshDashboard = async () => {
    try {
      const data = await getDashboard();
      setTreasuryBalance(data.treasuryBalance ?? 0);
      setInvestedAmount(data.investedAmount ?? 0);
      setSavingsThisMonth(data.savingsThisMonth ?? 0);
      setGoals(data.goals ?? []);
      setRecentActivity(data.recentActivity ?? []);
    } catch (e) {
      // ignore for simulate helper
    }
  };

  const handleSimulateCredit = async () => {
    const amt = Number(simulateAmount);
    if (!Number.isFinite(amt) || amt <= 0) return;
    try {
      await credit(amt);
      await refreshDashboard();
      setSimulateOpen(false);
      setSimulateAmount("");
    } catch (e) {
      // optionally surface error via toast later
    }
  };

  const handleAddGoal = () => {
    const name = newGoalName.trim();
    const target = Number(newGoalTarget);
    const current = Number(newGoalCurrent || 0);

    if (!name) return;
    if (!Number.isFinite(target) || target <= 0) return;
    const safeCurrent = Number.isFinite(current) && current >= 0 ? current : 0;
    const progress = Math.max(0, Math.min(100, Math.round((safeCurrent / target) * 100)));

    setGoals((prev) => [
      ...prev,
      { name, current: safeCurrent, target, progress },
    ]);
    setNewGoalOpen(false);
    resetNewGoalForm();
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Welcome back{user?.name ? `, ${user.name}` : ''}! 👋</h1>
          <p className="text-muted-foreground">Here's how your money is growing</p>
        </div>
        <Dialog open={newGoalOpen} onOpenChange={setNewGoalOpen}>
          <DialogTrigger asChild>
            <Button variant="primary" className="gap-2">
              <Plus className="h-4 w-4" />
              New Goal
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create a new goal</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="goal-name">Goal name</Label>
                <Input
                  id="goal-name"
                  placeholder="e.g. Emergency Fund"
                  value={newGoalName}
                  onChange={(e) => setNewGoalName(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="goal-target">Target amount (₹)</Label>
                  <Input
                    id="goal-target"
                    type="number"
                    min={0}
                    placeholder="50000"
                    value={newGoalTarget}
                    onChange={(e) => setNewGoalTarget(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="goal-current">Current amount (₹)</Label>
                  <Input
                    id="goal-current"
                    type="number"
                    min={0}
                    placeholder="0"
                    value={newGoalCurrent}
                    onChange={(e) => setNewGoalCurrent(e.target.value)}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setNewGoalOpen(false); resetNewGoalForm(); }}>Cancel</Button>
              <Button onClick={handleAddGoal}>Add Goal</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        {/* Simulate incoming credit (mock) */}
        <Dialog open={simulateOpen} onOpenChange={setSimulateOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="gap-2">
              Simulate Credit
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Simulate Incoming Credit</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="sim-amount">Amount (₹)</Label>
                <Input
                  id="sim-amount"
                  type="number"
                  min={1}
                  step={1}
                  placeholder="1000"
                  value={simulateAmount}
                  onChange={(e) => setSimulateAmount(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSimulateOpen(false)}>Cancel</Button>
              <Button onClick={handleSimulateCredit}>Create Credit</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        {/* Simulate debit (mock) */}
        <Dialog open={simulateDebitOpen} onOpenChange={setSimulateDebitOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="gap-2">
              Simulate Debit
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Simulate Debit</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="sim-debit-amount">Amount (₹)</Label>
                <Input
                  id="sim-debit-amount"
                  type="number"
                  min={1}
                  step={1}
                  placeholder="500"
                  value={simulateDebitAmount}
                  onChange={(e) => setSimulateDebitAmount(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSimulateDebitOpen(false)}>Cancel</Button>
              <Button onClick={handleSimulateDebit}>Create Debit</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        {/* Simulate batch credits (mock) */}
        <Dialog open={simulateBatchOpen} onOpenChange={setSimulateBatchOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="gap-2">
              Simulate Batch
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Simulate Batch Credits</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="sim-batch-amounts">Amounts (comma separated)</Label>
                <Input
                  id="sim-batch-amounts"
                  type="text"
                  placeholder="1000, 2500, 320"
                  value={simulateBatchAmounts}
                  onChange={(e) => setSimulateBatchAmounts(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">Example: 1200, 850, 990</p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSimulateBatchOpen(false)}>Cancel</Button>
              <Button onClick={handleSimulateBatch}>Create Batch</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        {/* Invest dialog */}
        <Dialog open={investOpen} onOpenChange={setInvestOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invest from Treasury</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-1">
              <div className="text-sm text-muted-foreground">Available: ₹{treasuryBalance.toLocaleString('en-IN')}</div>
              <div className="grid grid-cols-2 gap-2">
                <Button variant={investRisk === 'high' ? 'primary' : 'outline'} onClick={() => setInvestRisk('high')}>High Risk (High Profit)</Button>
                <Button variant={investRisk === 'low' ? 'primary' : 'outline'} onClick={() => setInvestRisk('low')}>Low Risk (Less Profit)</Button>
              </div>
              <div className="space-y-2">
                <Label htmlFor="invest-amount">Amount to invest (₹)</Label>
                <Input
                  id="invest-amount"
                  type="number"
                  min={1}
                  step={1}
                  placeholder="Enter amount"
                  value={investAmount}
                  onChange={(e) => setInvestAmount(e.target.value)}
                />
                <div className="text-xs text-muted-foreground">
                  {(() => { const amt = Number(investAmount); return amt > treasuryBalance ? 'Amount exceeds available treasury' : ''; })()}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setInvestAmount(String(treasuryBalance))}>Max</Button>
                  <Button size="sm" variant="outline" onClick={() => setInvestAmount(String(Math.max(0, Math.floor(treasuryBalance / 2))))}>Half</Button>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setInvestOpen(false)}>Cancel</Button>
              <Button onClick={handleInvest} disabled={!investAmount || Number(investAmount) <= 0 || Number(investAmount) > treasuryBalance || treasuryBalance <= 0}>Invest</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-card shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Treasury Balance</CardTitle>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => { setInvestOpen(true); setInvestAmount(String(treasuryBalance)); setInvestRisk('low'); }} disabled={treasuryBalance <= 0}>
                Invest
              </Button>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{treasuryBalance.toLocaleString('en-IN')}</div>

            <p className="text-xs text-success flex items-center gap-1">
              <ArrowUpRight className="h-3 w-3" />
              +12% from last month
            </p>
          </CardContent>
        </Card>
        {/* Liquidate dialog */}
        <Dialog open={liquidateOpen} onOpenChange={setLiquidateOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Liquidate to Treasury</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-1">
              <div className="text-sm text-muted-foreground">Invested available: ₹{investedAmount.toLocaleString('en-IN')}</div>
              <div className="space-y-2">
                <Label htmlFor="liq-amount">Amount to liquidate (₹)</Label>
                <Input
                  id="liq-amount"
                  type="number"
                  min={1}
                  step={1}
                  placeholder="Enter amount"
                  value={liquidateAmount}
                  onChange={(e) => setLiquidateAmount(e.target.value)}
                />
                <div className="text-xs text-muted-foreground">
                  {(() => { const amt = Number(liquidateAmount); return amt > investedAmount ? 'Amount exceeds invested funds' : ''; })()}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setLiquidateAmount(String(investedAmount))}>Max</Button>
                  <Button size="sm" variant="outline" onClick={() => setLiquidateAmount(String(Math.max(0, Math.floor(investedAmount / 2))))}>Half</Button>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setLiquidateOpen(false)}>Cancel</Button>
              <Button onClick={handleLiquidate} disabled={!liquidateAmount || Number(liquidateAmount) <= 0 || Number(liquidateAmount) > investedAmount}>Liquidate</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Card className="bg-gradient-card shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Invested Amount</CardTitle>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => { setLiquidateOpen(true); setLiquidateAmount(String(investedAmount)); }} disabled={investedAmount <= 0}>
                Liquidate
              </Button>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </div>
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

            <p className="text-xs text-muted-foreground">{autoSaveRate}% of sales saved</p>
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
              { name: 'Emergency Fund', current: 3000, target: 50000, progress: 60 },
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
                <div className="text-2xl font-bold text-primary">{autoSaveRate}%</div>
                <Dialog open={adjustOpen} onOpenChange={(open) => { setAdjustOpen(open); if (open) { setPendingRate(String(autoSaveRate)); } }}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="mt-2">
                      <Settings className="h-3 w-3 mr-1" />
                      Adjust
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Adjust Auto-Save Rate</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3 py-1">
                      <div className="space-y-2">
                        <Label htmlFor="auto-rate">Auto-save percentage (%)</Label>
                        <Input
                          id="auto-rate"
                          type="number"
                          min={0}
                          max={100}
                          step={0.1}
                          placeholder="3.5"
                          value={pendingRate}
                          onChange={(e) => setPendingRate(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">0 to 100%</p>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setAdjustOpen(false)}>Cancel</Button>
                      <Button onClick={handleSaveRate}>Save</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Round-ups</span>
                <span className="text-sm font-medium text-success">Active</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Weekly top-up</span>
                <span className="text-sm font-medium">₹{weeklyTopUp.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Minimum save threshold</span>
                <span className="text-sm font-medium">₹100</span>
              </div>
            </div>

            <Dialog open={modifyOpen} onOpenChange={(open) => { setModifyOpen(open); if (open) { setPendingRate(String(autoSaveRate)); setPendingWeeklyTopUp(String(weeklyTopUp)); } }}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full">
                  Modify Settings
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Modify Savings Settings</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="space-y-2">
                    <Label htmlFor="modify-rate">Auto-save percentage (%)</Label>
                    <Input
                      id="modify-rate"
                      type="number"
                      min={0}
                      max={100}
                      step={0.1}
                      value={pendingRate}
                      onChange={(e) => setPendingRate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="modify-weekly">Weekly top-up (₹)</Label>
                    <Input
                      id="modify-weekly"
                      type="number"
                      min={0}
                      step={100}
                      value={pendingWeeklyTopUp}
                      onChange={(e) => setPendingWeeklyTopUp(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setModifyOpen(false)}>Cancel</Button>
                  <Button onClick={handleSaveModifySettings}>Save</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
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