import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { credit, getBank, getDashboard, getSettings } from "@/lib/api";
import { CheckCircle2, IndianRupee } from "lucide-react";

interface Props {
  onGoToDashboard?: () => void;
}

const GetPayment = ({ onGoToDashboard }: Props) => {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [linked, setLinked] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [latestBalance, setLatestBalance] = useState<number | null>(null);
  const [autoSaveRate, setAutoSaveRate] = useState<number>(3.5);

  useEffect(() => {
    (async () => {
      try {
        const bank = await getBank();
        setLinked(!!bank?.linked);
      } catch {}
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const s = await getSettings();
        if (typeof s?.autoSaveRate === 'number') setAutoSaveRate(s.autoSaveRate);
      } catch {}
    })();
  }, []);

  const estimatedSave = useMemo(() => {
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0) return 0;
    return Math.round((amt * Math.max(0, Math.min(100, autoSaveRate))) / 100);
  }, [amount, autoSaveRate]);

  const handlePay = async () => {
    setError(null);
    setSuccess(null);
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0) {
      setError("Enter a valid amount");
      return;
    }
    setLoading(true);
    try {
      await credit(amt);
      const d = await getDashboard();
      setLatestBalance(d?.treasuryBalance ?? null);
      setSuccess(`Payment of ₹${amt.toLocaleString('en-IN')} processed`);
      setAmount("");
    } catch (e: any) {
      setError(e?.message || "Failed to process payment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto">
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IndianRupee className="h-5 w-5 text-primary" />
            Get Payment (Paid from customer)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!linked && (
            <div className="text-sm text-muted-foreground">
              Please link a bank account first from the Bank tab to enable payments.
            </div>
          )}
          <div className="text-sm text-muted-foreground">
            Auto-save rate: <span className="font-medium text-foreground">{autoSaveRate}%</span>
          </div>
          <div className="space-y-2">
            <Label htmlFor="pay-amount">Amount (₹)</Label>
            <Input
              id="pay-amount"
              type="number"
              min={1}
              step={1}
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={!linked}
            />
          </div>
          {estimatedSave > 0 && (
            <div className="text-xs text-muted-foreground">Estimated auto-save to Treasury: ₹{estimatedSave.toLocaleString('en-IN')}</div>
          )}
          {error && <div className="text-sm text-destructive">{error}</div>}
          {success && (
            <div className="p-3 rounded-lg bg-success/10 text-success flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              <div>
                <div className="font-medium">{success}</div>
                {latestBalance !== null && (
                  <div className="text-xs">Treasury Balance: ₹{latestBalance.toLocaleString('en-IN')}</div>
                )}
              </div>
            </div>
          )}
          <Button className="w-full" onClick={handlePay} disabled={loading || !linked}>
            {loading ? "Processing..." : "Receive Payment"}
          </Button>
          {success && (
            <Button variant="ghost" className="w-full" onClick={onGoToDashboard}>
              Go to Dashboard
            </Button>
          )}
          <div className="text-xs text-muted-foreground">
            This is a mock payment. It triggers a credit and applies your auto-save rate to Treasury.
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GetPayment;
