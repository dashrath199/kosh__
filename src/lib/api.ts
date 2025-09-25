// Prefer explicit backend URL in dev to avoid proxy issues; allow override via VITE_API_BASE.
// In production, default to relative so it can run behind the same origin.
const API_BASE = 'http://localhost:4000';

export async function register(payload: { fullName: string; email: string; mobile: string; password: string }) {
  // Backend expects: { fullName, email, mobile, password }
  const body = { fullName: payload.fullName, email: payload.email, mobile: payload.mobile, password: payload.password };
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/api/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch (e: any) {
    throw new Error('Network error: could not reach API');
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || err.error || `Register failed (${res.status})`);
  }
  return res.json();
}

export async function login(payload: { identifier: string; password: string }) {
  // Backend expects: { email, password } (compat with TS AuthController)
  const body = { email: payload.identifier, password: payload.password };
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch (e: any) {
    throw new Error('Network error: could not reach API');
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || err.error || `Login failed (${res.status})`);
  }
  return res.json();
}

export async function health() {
  // Simple health check to verify dev proxy/backend
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/api/health`);
  } catch (e: any) {
    throw new Error('Network error: could not reach API');
  }
  if (!res.ok) {
    const errTxt = await res.text().catch(() => '');
    throw new Error(`Health check failed (${res.status}) ${errTxt}`);
  }
  return res.json();
}

export async function seedDev() {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/api/auth/seed-dev`, { method: 'POST' });
  } catch (e: any) {
    throw new Error('Network error: could not reach API');
  }
  if (!res.ok) {
    const errTxt = await res.text().catch(() => '');
    throw new Error(`Seeding failed (${res.status}) ${errTxt}`);
  }
  return res.json();
}

export async function getDashboard() {
  const res = await fetch(`${API_BASE}/api/dashboard`);
  if (!res.ok) {
    const errTxt = await res.text().catch(() => '');
    throw new Error(`Failed to load dashboard (${res.status}) ${errTxt}`);
  }
  return res.json();
}

// --- New endpoints ---
export async function linkBank(accountNumber: string) {
  const res = await fetch(`${API_BASE}/api/bank/link`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accountNumber }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Failed to link bank (${res.status})`);
  }
  return res.json();
}

export async function getBank() {
  const res = await fetch(`${API_BASE}/api/bank`);
  if (!res.ok) throw new Error(`Failed to fetch bank (${res.status})`);
  return res.json();
}

export async function credit(amount: number) {
  const res = await fetch(`${API_BASE}/api/transactions/credit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Failed to credit (${res.status})`);
  }
  return res.json();
}

export async function debit(amount: number) {
  const res = await fetch(`${API_BASE}/api/transactions/debit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Failed to debit (${res.status})`);
  }
  return res.json();
}

export async function batchCredits(amounts: number[]) {
  const res = await fetch(`${API_BASE}/api/transactions/batch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amounts }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Failed to batch credit (${res.status})`);
  }
  return res.json();
}

export async function getTransactions() {
  const res = await fetch(`${API_BASE}/api/transactions`);
  if (!res.ok) throw new Error(`Failed to fetch transactions (${res.status})`);
  return res.json();
}

export async function getInvestments() {
  const res = await fetch(`${API_BASE}/api/investments`);
  if (!res.ok) throw new Error(`Failed to fetch investments (${res.status})`);
  return res.json();
}

export async function invest(amount: number, risk: 'high' | 'low') {
  const res = await fetch(`${API_BASE}/api/investments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount, risk }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Failed to invest (${res.status})`);
  }
  return res.json();
}

export async function liquidate(amount: number) {
  const res = await fetch(`${API_BASE}/api/investments/liquidate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Failed to liquidate (${res.status})`);
  }
  return res.json();
}

export async function growInvestments(risk: 'high' | 'low', ratePct: number) {
  const res = await fetch(`${API_BASE}/api/investments/grow`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ risk, ratePct }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Failed to grow NAV (${res.status})`);
  }
  return res.json();
}

// Mock settings endpoints
export interface Settings {
  id: number;
  userId: number;
  autoSaveRate: number;
  minThreshold: number;
  roundUpsEnabled: boolean;
  riskTolerance: string;
  investmentGoal: string | null;
  autoInvest: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  lowBalanceAlert: boolean;
  weeklyReport: boolean;
  twoFactorAuth: boolean;
  biometricAuth: boolean;
  currency: string;
  language: string;
  theme: string;
  weeklyTopUp: number;
  monthlyGoal: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  id: number;
  email: string;
  name: string | null;
  phoneNumber: string | null;
  dateOfBirth: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  postalCode: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DataExportResponse {
  message: string;
  format: 'json' | 'csv' | 'sql';
  requestedAt: string;
  downloadUrl?: string;
}

export async function getSettings(): Promise<Settings> {
  const res = await fetch(`${API_BASE}/api/settings`);
  if (!res.ok) throw new Error(`Failed to fetch settings (${res.status})`);
  return res.json();
}

export async function updateSettings(payload: Partial<Settings>): Promise<Settings> {
  const res = await fetch(`${API_BASE}/api/settings`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Failed to update settings (${res.status})`);
  }
  return res.json();
}

export async function getUserProfile(): Promise<UserProfile> {
  const res = await fetch(`${API_BASE}/api/users/profile`);
  if (!res.ok) throw new Error(`Failed to fetch profile (${res.status})`);
  return res.json();
}

export async function updateUserProfile(payload: Partial<UserProfile>): Promise<UserProfile> {
  const res = await fetch(`${API_BASE}/api/users/profile`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Failed to update profile (${res.status})`);
  }
  return res.json();
}

export async function requestDataExport(format: 'json' | 'csv' | 'sql'): Promise<DataExportResponse> {
  const res = await fetch(`${API_BASE}/api/users/export`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ format }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Failed to request data export (${res.status})`);
  }
  return res.json();
}
