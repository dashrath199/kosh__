import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Target, Plus } from "lucide-react";
import { getDashboard } from "@/lib/api";

 type Goal = { name: string; current: number; target: number; progress: number };

const Goals = () => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [newGoalOpen, setNewGoalOpen] = useState(false);
  const [newGoalName, setNewGoalName] = useState("");
  const [newGoalTarget, setNewGoalTarget] = useState<string>("");
  const [newGoalCurrent, setNewGoalCurrent] = useState<string>("");

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await getDashboard();
        if (!mounted) return;
        setGoals(data.goals ?? []);
      } catch {
        // ignore
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false };
  }, []);

  const resetNewGoalForm = () => {
    setNewGoalName("");
    setNewGoalTarget("");
    setNewGoalCurrent("");
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Goals</h2>
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
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Active Goals
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {loading ? (
            <div className="text-muted-foreground text-sm">Loading goals...</div>
          ) : (
            (goals.length ? goals : [
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
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Goals;
