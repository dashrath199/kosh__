import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export async function getBank(_req: Request, res: Response) {
  try {
    const email = process.env.DEMO_EMAIL || 'demo@local';
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ linked: false, error: 'Demo user not found' });
    const bank = await prisma.userBank.findFirst({ where: { userId: user.id, status: 'linked' }, orderBy: { linkedAt: 'desc' } });
    if (!bank) return res.json({ linked: false });
    return res.json({ linked: true, accountNumber: bank.accountNumber, linkedAt: bank.linkedAt });
  } catch (e: any) {
    return res.status(500).json({ linked: false, error: e?.message || 'Failed to fetch bank' });
  }
}

export async function linkBank(req: Request, res: Response) {
  try {
    const { accountNumber } = req.body || {};
    const acct = String(accountNumber || '').trim();
    if (acct.length < 6) {
      return res.status(400).json({ error: 'accountNumber must be at least 6 digits' });
    }
    const email = process.env.DEMO_EMAIL || 'demo@local';
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ error: 'Demo user not found' });
    const bank = await prisma.userBank.create({
      data: { userId: user.id, provider: 'mock', accountNumber: acct, status: 'linked' },
    });
    return res.json({ ok: true, bank: { linked: true, accountNumber: bank.accountNumber, linkedAt: bank.linkedAt } });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'Failed to link bank' });
  }
}
