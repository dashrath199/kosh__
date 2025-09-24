import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getInvestments, growInvestments } from "@/lib/api";
import { LineChart as LineChartIcon } from "lucide-react";

interface Investment {
  fundName: string;
  units: number;
  investmentAmount: number;
  nav: number;
  date: string;
}

const Investments = () => {
  const [list, setList] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getInvestments();
      setList(data || []);
    } catch (e: any) {
      setError(e?.message || 'Failed to load investments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const totals = useMemo(() => {
    const totalInvested = list.reduce((s, i) => s + i.investmentAmount, 0);
    const currentValue = list.reduce((s, i) => s + i.units * i.nav, 0);
    const profit = currentValue - totalInvested;
    return { totalInvested, currentValue, profit };
  }, [list]);

  const onGrow = async (risk: 'high' | 'low', ratePct: number) => {
    try {
      await growInvestments(risk, ratePct);
      await load();
    } catch {
      // noop
    }
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-card bg-gradient-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LineChartIcon className="h-5 w-5 text-primary" />
            Mutual Fund Investments (Mock)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div>
              <div className="text-sm text-muted-foreground">Total Invested</div>
              <div className="text-2xl font-bold">₹{totals.totalInvested.toLocaleString('en-IN')}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Current Value</div>
              <div className="text-2xl font-bold text-success">₹{totals.currentValue.toLocaleString('en-IN')}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Profit</div>
              <div className={`text-2xl font-bold ${totals.profit >= 0 ? 'text-success' : 'text-destructive'}`}>₹{totals.profit.toLocaleString('en-IN')}</div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => onGrow('high', 1)}>Grow High Risk +1%</Button>
            <Button variant="outline" size="sm" onClick={() => onGrow('low', 0.3)}>Grow Low Risk +0.3%</Button>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Recent Investments</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-sm text-muted-foreground">Loading...</div>
          ) : list.length === 0 ? (
            <div className="text-sm text-muted-foreground">No investments yet. Trigger a payment in Transactions to auto-invest.</div>
          ) : (
            <div className="space-y-3">
              {list.map((inv, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                  <div>
                    <div className="font-medium">{inv.fundName}</div>
                    <div className="text-xs text-muted-foreground">{inv.date} • NAV ₹{inv.nav}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{inv.units} units</div>
                    <div className="text-xs text-muted-foreground">₹{inv.investmentAmount.toLocaleString('en-IN')}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Investments;
