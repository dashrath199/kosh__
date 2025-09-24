import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { linkBank, getBank } from "@/lib/api";
import { CheckCircle2, Link as LinkIcon } from "lucide-react";

const BankLink = () => {
  const [accountNumber, setAccountNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [linked, setLinked] = useState(false);
  const [linkedInfo, setLinkedInfo] = useState<{ accountNumber: string; linkedAt: string } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await getBank();
        if (data?.linked) {
          setLinked(true);
          setLinkedInfo({ accountNumber: data.accountNumber, linkedAt: data.linkedAt });
        }
      } catch {}
    })();
  }, []);

  const onLink = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await linkBank(accountNumber.trim());
      setLinked(true);
      setLinkedInfo({ accountNumber: res?.bank?.accountNumber, linkedAt: res?.bank?.linkedAt });
    } catch (e: any) {
      setError(e?.message || "Failed to link bank");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto">
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LinkIcon className="h-5 w-5 text-primary" />
            Link Bank Account
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {linked ? (
            <div className="p-4 rounded-lg bg-success/10 text-success flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5" />
              <div>
                <div className="font-medium">Bank account successfully linked</div>
                <div className="text-sm">Account: ••••{linkedInfo?.accountNumber?.slice(-4)} | Linked at: {new Date(linkedInfo?.linkedAt || '').toLocaleString()}</div>
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="acct">Bank Account Number</Label>
                <Input
                  id="acct"
                  type="text"
                  placeholder="Enter account number"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                />
              </div>
              {error && <div className="text-sm text-destructive">{error}</div>}
              <Button onClick={onLink} disabled={loading || accountNumber.trim().length < 6} className="w-full">
                {loading ? "Linking..." : "Link Account"}
              </Button>
              <div className="text-xs text-muted-foreground">
                This is a mock flow for demo purposes. No real bank connection happens.
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BankLink;
