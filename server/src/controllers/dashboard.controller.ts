import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export async function summary(_req: Request, res: Response) {
  try {
    const email = process.env.DEMO_EMAIL || 'demo@local';
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ error: 'Demo user not found' });

    const treasury = await prisma.treasury.findUnique({ where: { userId: user.id } });
    const treasuryBalance = treasury?.balance ?? 0;

    const investedAmountAgg = await prisma.investmentPosition.aggregate({
      where: { userId: user.id },
      _sum: { amount: true },
    });
    const investedAmount = investedAmountAgg._sum.amount ?? 0;

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const monthSaves = await prisma.treasuryEntry.aggregate({
      where: {
        userId: user.id,
        kind: 'save',
        createdAt: { gte: monthStart, lt: nextMonthStart },
      },
      _sum: { amount: true },
    });
    const savingsThisMonth = monthSaves._sum.amount ?? 0;

    const entries = await prisma.treasuryEntry.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
    const recentActivity = entries.map((e: any) => ({
      type: e.kind === 'save' ? 'save' : 'invest',
      amount: e.amount,
      description: e.description || (e.kind === 'save' ? 'Auto-saved' : 'Investment activity'),
      time: e.createdAt.toLocaleString('en-IN'),
    }));

    const goals: Array<{ name: string; current: number; target: number; progress: number }> = [];
    return res.json({ treasuryBalance, investedAmount, savingsThisMonth, goals, recentActivity });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'Failed to load dashboard' });
  }
}
