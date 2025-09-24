import { Request, Response } from 'express';
import * as AuthService from '../services/auth.service';

export async function register(req: Request, res: Response) {
  try {
    console.log('[AUTH] register body:', req.body);
    const email = req.body?.email;
    const password = req.body?.password;
    const name = req.body.fullName;
    if (!email || !password) return res.status(400).json({ message: 'email and password are required' });
    const user = await AuthService.register(email, password, name);
    return res.status(201).json({ id: user.id, email: user.email, name: user.name });
  } catch (e: any) {
    return res.status(400).json({ message: e.message || 'Registration failed' });
  }
}

export async function login(req: Request, res: Response) {
  try {
    console.log('[AUTH] login body:', req.body);
    const email = req.body?.email ?? req.body?.identifier;
    const password = req.body?.password;
    if (!email || !password) return res.status(400).json({ message: 'email and password are required' });
    const result = await AuthService.login(email, password);
    return res.json(result);
  } catch (e: any) {
    return res.status(401).json({ message: e.message || 'Login failed' });
  }
}

// Development-only: seed a test user for quick sign-in
export async function seedDev(_req: Request, res: Response) {
  try {
    const email = 'test@example.com';
    const password = 'Test@1234';
    const name = 'Test User';

    try {
      await AuthService.register(email, password, name);
    } catch (e: any) {
      // If user exists, ignore
      if (!String(e?.message || '').toLowerCase().includes('already')) {
        throw e;
      }
    }

    const result = await AuthService.login(email, password);
    return res.json({
      message: 'Seeded test user. Use these credentials to sign in.',
      credentials: { email, password },
      ...result,
    });
  } catch (e: any) {
    return res.status(500).json({ message: e?.message || 'Failed to seed dev user' });
  }
}
