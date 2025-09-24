import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: [/^http:\/\/localhost:\d+$/], credentials: true }));
app.use(express.json());

// In-memory store (demo only)
const users = new Map(); // key: email or phone, value: { name, email, phone, password }
const DB = {
  bank: { linked: false, accountNumber: null, linkedAt: null },
  transactions: /** @type {Array<{transactionId:string, amount:number, type:'credit'|'debit', date:string}>} */ ([]),
  investments: /** @type {Array<{fundName:string, units:number, investmentAmount:number, nav:number, date:string}>} */ ([]),
  recentActivity: /** @type {Array<{ type: 'save' | 'invest' | 'goal' | 'credit', amount: number, description: string, time: string }>} */ ([]),
  funds: {
    'HDFC Equity Fund': 213.4,
    'SBI Bluechip Fund': 68.9,
    'Kotak Flexicap Fund': 72.15,
  },
};

function nowISODate() {
  return new Date().toISOString().slice(0, 10);
}

function addActivity(type, amount, description) {
  DB.recentActivity.unshift({ type, amount, description, time: 'Just now' });
  // Keep recent activity manageable
  if (DB.recentActivity.length > 50) DB.recentActivity.pop();
}

// Health
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'kosh-server', time: new Date().toISOString() });
});

// --- Bank Linking ---
app.post('/api/bank/link', (req, res) => {
  const { accountNumber } = req.body || {};
  if (!accountNumber) {
    return res.status(400).json({ error: 'accountNumber is required' });
  }
  DB.bank = { linked: true, accountNumber: String(accountNumber), linkedAt: new Date().toISOString() };
  addActivity('save', 0, 'Bank account linked');
  return res.json({ message: 'Bank account successfully linked', bank: DB.bank });
});

app.get('/api/bank', (_req, res) => {
  return res.json(DB.bank);
});

// Register
app.post('/api/register', (req, res) => {
  const { fullName, email, mobile, password } = req.body || {};
  if (!fullName || !email || !mobile || !password) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  if (users.has(email) || users.has(mobile)) {
    return res.status(409).json({ error: 'User already exists' });
  }
  const user = { name: fullName, email, phone: mobile, password };
  users.set(email, user);
  users.set(mobile, user);
  return res.status(201).json({ message: 'Registered successfully', user: { name: user.name, email: user.email, phone: user.phone } });
});

// Login: accept email or phone with password
app.post('/api/login', (req, res) => {
  const { identifier, password } = req.body || {};
  if (!identifier || !password) {
    return res.status(400).json({ error: 'Missing identifier or password' });
  }
  const user = users.get(identifier);
  if (!user || user.password !== password) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  return res.json({ message: 'Login successful', user: { name: user.name, email: user.email, phone: user.phone }, token: 'demo-token' });
});

// --- Transactions & Auto-Invest ---
app.get('/api/transactions', (_req, res) => {
  return res.json(DB.transactions);
});

app.post('/api/transactions/credit', (req, res) => {
  const { amount } = req.body || {};
  const amt = Number(amount);
  if (!amt || amt <= 0) {
    return res.status(400).json({ error: 'amount must be > 0' });
  }
  const date = nowISODate();
  const transactionId = `TXN${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  const txn = { transactionId, amount: amt, type: 'credit', date };
  DB.transactions.unshift(txn);
  addActivity('credit', amt, `Received payment ₹${amt.toLocaleString('en-IN')}`);

  // Auto-invest full credited amount into a chosen fund
  const fundName = 'HDFC Equity Fund';
  const nav = DB.funds[fundName] ?? 200;
  const units = +(amt / nav).toFixed(2);
  const investment = { fundName, units, investmentAmount: amt, nav, date };
  DB.investments.unshift(investment);
  addActivity('invest', amt, `Invested ₹${amt.toLocaleString('en-IN')} in ${fundName} at NAV ₹${nav}`);

  return res.status(201).json({
    message: `₹${amt.toLocaleString('en-IN')} credited and auto-invested into ${fundName}`,
    transaction: txn,
    investment,
  });
});

app.get('/api/investments', (_req, res) => {
  return res.json(DB.investments);
});

// Dashboard data (now dynamic using DB plus some base numbers)
app.get('/api/dashboard', (_req, res) => {
  const BASE_TREASURY = 12540;
  const BASE_INVESTED = 45200;
  const BASE_SAVINGS = 8750;

  const investedNew = DB.investments.reduce((sum, inv) => sum + inv.investmentAmount, 0);
  const treasuryBalance = BASE_TREASURY; // For demo we keep this stable
  const investedAmount = BASE_INVESTED + investedNew;
  const savingsThisMonth = BASE_SAVINGS + Math.round(investedNew * 0.1);

  res.json({
    treasuryBalance,
    investedAmount,
    savingsThisMonth,
    growthRates: { treasury: 12, invested: 8.2 },
    goals: [
      { name: 'Emergency Fund', current: 30000, target: 50000, progress: 60 },
      { name: 'New Equipment', current: 25000, target: 100000, progress: 25 },
      { name: "Child's Education", current: 75000, target: 500000, progress: 15 }
    ],
    recentActivity: DB.recentActivity.length
      ? DB.recentActivity
      : [
          { type: 'save', amount: 175, description: 'Auto-saved from UPI sale', time: '2 minutes ago' },
          { type: 'invest', amount: 2500, description: 'Invested in Emergency Fund', time: '1 hour ago' },
          { type: 'save', amount: 85, description: 'Round-up savings', time: '3 hours ago' },
          { type: 'goal', amount: 5000, description: 'Emergency Fund milestone reached', time: 'Yesterday' }
        ],
  });
});

app.listen(PORT, () => {
  console.log(`Kosh server running on http://localhost:${PORT}`);
});
