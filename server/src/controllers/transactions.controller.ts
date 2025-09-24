import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export async function listTransactions(_req: Request, res: Response) {
  try {
    const email = process.env.DEMO_EMAIL || 'demo@local';
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ error: 'Demo user not found' });
    const txs = await prisma.transaction.findMany({
      where: { userId: user.id },
      orderBy: { occurredAt: 'desc' },
      take: 100,
    });
    const arr = txs.map((t) => ({
      transactionId: String(t.id),
      amount: t.amount,
      type: t.type as 'credit' | 'debit',
      date: t.occurredAt.toLocaleString('en-IN'),
    }));
    return res.json(arr);
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'Failed to list transactions' });
  }
}

export async function credit(req: Request, res: Response) {
  try {
    const { amount, description } = req.body || {};
    const num = Number(amount);
    if (!Number.isFinite(num) || num <= 0) {
      return res.status(400).json({ error: 'amount must be a positive number' });
    }
    const email = process.env.DEMO_EMAIL || 'demo@local';
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ error: 'Demo user not found' });

    const settings = await prisma.settings.findUnique({ where: { userId: user.id } });
    const rate = Math.max(0, Math.min(100, settings?.autoSaveRate ?? 0));

    const tx = await prisma.transaction.create({
      data: { userId: user.id, type: 'credit', amount: num, description },
    });

    let saved = 0;
    if (num >= (settings?.minThreshold ?? 0) && rate > 0) {
      saved = Math.round((num * rate) / 100);
      await prisma.$transaction([
        prisma.treasuryEntry.create({
          data: {
            userId: user.id,
            transactionId: tx.id,
            kind: 'save',
            amount: saved,
            description: `Auto-saved ${rate}% of ₹${num}`,
          },
        }),
        prisma.treasury.update({
          where: { userId: user.id },
          data: { balance: { increment: saved } },
        }),
      ]);
    }

    const treasury = await prisma.treasury.findUnique({ where: { userId: user.id } });
    return res.json({ ok: true, message: 'Payment credited', transaction: tx, saved, treasuryBalance: treasury?.balance ?? 0 });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'Failed to credit' });
  }
}

export async function debit(req: Request, res: Response) {
  try {
    const { amount, description } = req.body || {};
    const num = Number(amount);
    if (!Number.isFinite(num) || num <= 0) {
      return res.status(400).json({ error: 'amount must be a positive number' });
    }
    const email = process.env.DEMO_EMAIL || 'demo@local';
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ error: 'Demo user not found' });
    const tx = await prisma.transaction.create({ data: { userId: user.id, type: 'debit', amount: num, description } });
    return res.json({ ok: true, transaction: tx });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'Failed to record debit' });
  }
}

export async function batchCredits(req: Request, res: Response) {
  try {
    const { amounts } = req.body || {};
    if (!Array.isArray(amounts) || amounts.length === 0) {
      return res.status(400).json({ error: 'amounts must be a non-empty array of numbers' });
    }
    const email = process.env.DEMO_EMAIL || 'demo@local';
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ error: 'Demo user not found' });
    const settings = await prisma.settings.findUnique({ where: { userId: user.id } });
    const rate = Math.max(0, Math.min(100, settings?.autoSaveRate ?? 0));

    for (const a of amounts) {
      const num = Number(a);
      if (!Number.isFinite(num) || num <= 0) continue;
      const tx = await prisma.transaction.create({ data: { userId: user.id, type: 'credit', amount: num, description: 'Batch credit' } });
      if (num >= (settings?.minThreshold ?? 0) && rate > 0) {
        const saved = Math.round((num * rate) / 100);
        await prisma.$transaction([
          prisma.treasuryEntry.create({ data: { userId: user.id, transactionId: tx.id, kind: 'save', amount: saved, description: `Auto-saved ${rate}% of ₹${num}` } }),
          prisma.treasury.update({ where: { userId: user.id }, data: { balance: { increment: saved } } }),
        ]);
      }
    }
    const treasury = await prisma.treasury.findUnique({ where: { userId: user.id } });
    return res.json({ ok: true, treasuryBalance: treasury?.balance ?? 0 });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'Failed to process batch' });
  }
}
