// Simple in-memory store for mock mode
// NOTE: This resets on server restart. For persistence, switch to DB.

export type Transaction = {
  id: string;
  type: 'credit' | 'debit';
  amount: number; // in INR for mock
  description?: string;
  occurredAt: string; // ISO string
};

export type Settings = {
  autoSaveRate: number; // percentage 0-100
  weeklyTopUp: number; // INR
  minThreshold: number; // INR minimum tx amount to apply auto-save
  roundUpsEnabled: boolean;
};

export type TreasuryEntry = {
  id: string;
  transactionId: string | null; // null for manual top-ups
  amount: number; // INR added to treasury
  createdAt: string; // ISO
  description?: string;
  kind: 'save' | 'invest' | 'liquidate';
  risk?: 'high' | 'low';
  units?: number; // for invest entries
  navAtInvest?: number; // NAV at time of investment
};

function genId(prefix: string = 'id') {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}

export const mockDB = {
  treasuryBalance: 0,
  investedAmount: 0,
  transactions: [] as Transaction[],
  treasuryEntries: [] as TreasuryEntry[],
  navs: { high: 100, low: 100 },
  settings: {
    autoSaveRate: 3.5,
    weeklyTopUp: 500,
    minThreshold: 100,
    roundUpsEnabled: true,
  } as Settings,
};

export function addTransaction(tx: Omit<Transaction, 'id'>): Transaction {
  const created: Transaction = { id: genId('tx'), ...tx };
  mockDB.transactions.unshift(created);
  return created;
}

export function addTreasuryEntry(entry: Omit<TreasuryEntry, 'id' | 'createdAt'>): TreasuryEntry {
  const created: TreasuryEntry = { id: genId('tr'), createdAt: new Date().toISOString(), ...entry };
  mockDB.treasuryEntries.unshift(created);
  // Only modify treasuryBalance for 'save' and 'liquidate'.
  if (created.kind === 'save' || created.kind === 'liquidate') {
    mockDB.treasuryBalance += created.amount;
  }
  return created;
}

export function processIncomingCredit(amount: number, description?: string) {
  // Record transaction
  const tx = addTransaction({ type: 'credit', amount, description, occurredAt: new Date().toISOString() });
  // Apply auto-save
  const rate = Math.max(0, Math.min(100, mockDB.settings.autoSaveRate));
  if (amount >= mockDB.settings.minThreshold && rate > 0) {
    const saveAmt = Math.round((amount * rate) / 100);
    addTreasuryEntry({ transactionId: tx.id, amount: saveAmt, description: `Auto-saved ${rate}% of ₹${amount}`, kind: 'save' });
  }
  return tx;
}

export function invest(amount: number, risk: 'high' | 'low') {
  if (!Number.isFinite(amount) || amount <= 0) throw new Error('Invalid amount');
  if (amount > mockDB.treasuryBalance) throw new Error('Insufficient treasury balance');
  // Move funds
  mockDB.treasuryBalance -= amount;
  mockDB.investedAmount += amount;
  // Log invest activity (does not change treasury, tracked via investedAmount change)
  const currentNav = risk === 'high' ? mockDB.navs.high : mockDB.navs.low;
  const units = parseFloat((amount / currentNav).toFixed(2));
  addTreasuryEntry({ transactionId: null, amount: amount, description: `Invested ₹${amount} to ${risk === 'high' ? 'High' : 'Low'} Risk` , kind: 'invest', risk, units, navAtInvest: currentNav });
  return { investedAmount: mockDB.investedAmount, treasuryBalance: mockDB.treasuryBalance };
}

export function liquidate(amount: number) {
  if (!Number.isFinite(amount) || amount <= 0) throw new Error('Invalid amount');
  if (amount > mockDB.investedAmount) throw new Error('Insufficient invested amount');
  mockDB.investedAmount -= amount;
  // Log liquidation as treasury increase (without affecting savings metrics)
  addTreasuryEntry({ transactionId: null, amount: amount, description: `Liquidated ₹${amount} from investments` , kind: 'liquidate' });
  return { investedAmount: mockDB.investedAmount, treasuryBalance: mockDB.treasuryBalance };
}

export function growNav(risk: 'high' | 'low', ratePct: number) {
  const factor = 1 + (ratePct / 100);
  if (risk === 'high') {
    mockDB.navs.high = parseFloat((mockDB.navs.high * factor).toFixed(2));
  } else {
    mockDB.navs.low = parseFloat((mockDB.navs.low * factor).toFixed(2));
  }
  return { high: mockDB.navs.high, low: mockDB.navs.low };
}
