import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getTransactions, credit } from "@/lib/api";
import { IndianRupee, PlusCircle } from "lucide-react";

interface Txn {
  transactionId: string;
  amount: number;
  type: 'credit' | 'debit';
  date: string;
}

const Transactions = () => {
  const [txns, setTxns] = useState<Txn[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [amount, setAmount] = useState(10000);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getTransactions();
      setTxns(data || []);
    } catch (e: any) {
      setError(e?.message || 'Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onCredit = async () => {
    setSubmitting(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await credit(amount);
      setSuccessMsg(res?.message || 'Payment credited');
      await load();
    } catch (e: any) {
      setError(e?.message || 'Failed to credit');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IndianRupee className="h-5 w-5 text-primary" />
            Receive Payment (Mock)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-3">
            <Input
              type="number"
              min={1}
              step={100}
              value={amount}
              onChange={(e) => setAmount(parseInt(e.target.value || '0', 10))}
              className="max-w-[200px]"
            />
            <Button onClick={onCredit} disabled={submitting || amount <= 0} className="gap-2">
              <PlusCircle className="h-4 w-4" />
              {submitting ? 'Processing...' : 'Receive Payment'}
            </Button>
          </div>
          {error && <div className="text-sm text-destructive">{error}</div>}
          {successMsg && <div className="text-sm text-success">{successMsg}</div>}
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Credits Received</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-sm text-muted-foreground">Loading...</div>
          ) : txns.length === 0 ? (
            <div className="text-sm text-muted-foreground">No transactions yet. Use the button above to simulate one.</div>
          ) : (
            <div className="space-y-3">
              {txns.map((t) => (
                <div key={t.transactionId} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                  <div>
                    <div className="font-medium">{t.type === 'credit' ? 'Credit' : 'Debit'} • {t.transactionId}</div>
                    <div className="text-xs text-muted-foreground">{t.date}</div>
                  </div>
                  <div className="font-bold text-success">₹{t.amount.toLocaleString('en-IN')}</div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Transactions;
