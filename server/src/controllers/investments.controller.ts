import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export async function createInvestment(req: Request, res: Response) {
  try {
    const { amount, risk } = req.body || {};
    const num = Number(amount);
    if (!Number.isFinite(num) || num <= 0) {
      return res.status(400).json({ error: 'amount must be a positive number' });
    }
    const r: 'high' | 'low' = risk === 'high' ? 'high' : 'low';
    const email = process.env.DEMO_EMAIL || 'demo@local';
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ error: 'Demo user not found' });

    const treasury = await prisma.treasury.findUnique({ where: { userId: user.id } });
    const available = treasury?.balance ?? 0;
    if (num > available) return res.status(400).json({ error: 'Insufficient treasury balance' });

    const navRow = await prisma.investmentNav.findUnique({ where: { risk: r } });
    const currentNav = navRow?.currentNav ?? 100;
    const units = parseFloat((num / currentNav).toFixed(2));

    await prisma.$transaction([
      prisma.investmentPosition.create({
        data: { userId: user.id, risk: r, units, amount: num, navAtInvest: currentNav },
      }),
      prisma.treasuryEntry.create({
        data: {
          userId: user.id,
          kind: 'invest',
          amount: num,
          description: `Invested ₹${num} to ${r === 'high' ? 'High' : 'Low'} Risk`,
          risk: r,
          units,
          navAtInvest: currentNav,
        },
      }),
      prisma.treasury.update({ where: { userId: user.id }, data: { balance: { decrement: num } } }),
    ]);

    const investedAgg = await prisma.investmentPosition.aggregate({ where: { userId: user.id }, _sum: { amount: true } });
    const investedAmount = investedAgg._sum.amount ?? 0;
    const afterTreasury = await prisma.treasury.findUnique({ where: { userId: user.id } });
    return res.json({ ok: true, investedAmount, treasuryBalance: afterTreasury?.balance ?? 0 });
  } catch (e: any) {
    return res.status(400).json({ error: e?.message || 'Investment failed' });
  }
}

export async function getInvestmentsSummary(_req: Request, res: Response) {
  try {
    const email = process.env.DEMO_EMAIL || 'demo@local';
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ error: 'Demo user not found' });
    const navs = await prisma.investmentNav.findMany();
    const navMap = new Map(navs.map((n: any) => [n.risk, n.currentNav] as const));
    const positions = await prisma.investmentPosition.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'desc' } });
    const list = positions.map((p: any) => ({
      fundName: p.risk === 'high' ? 'High Risk Fund' : 'Low Risk Fund',
      units: p.units,
      investmentAmount: p.amount,
      nav: navMap.get(p.risk) ?? 100,
      date: p.createdAt.toLocaleString('en-IN'),
    }));
    return res.json(list);
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'Failed to load investments' });
  }
}

export async function createLiquidation(req: Request, res: Response) {
  try {
    const { amount } = req.body || {};
    const num = Number(amount);
    if (!Number.isFinite(num) || num <= 0) {
      return res.status(400).json({ error: 'amount must be a positive number' });
    }
    const email = process.env.DEMO_EMAIL || 'demo@local';
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ error: 'Demo user not found' });

    // Reduce positions starting from most recent
    let remaining = num;
    const positions = await prisma.investmentPosition.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'desc' } });
    for (const p of positions) {
      if (remaining <= 0) break;
      if (p.amount <= remaining) {
        // remove whole position
        await prisma.investmentPosition.delete({ where: { id: p.id } });
        remaining -= p.amount;
      } else {
        const newAmount = p.amount - remaining;
        const ratio = newAmount / p.amount;
        const newUnits = parseFloat((p.units * ratio).toFixed(2));
        await prisma.investmentPosition.update({ where: { id: p.id }, data: { amount: newAmount, units: newUnits } });
        remaining = 0;
      }
    }
    if (remaining > 0) return res.status(400).json({ error: 'Insufficient invested amount' });

    await prisma.$transaction([
      prisma.treasuryEntry.create({ data: { userId: user.id, kind: 'liquidate', amount: num, description: `Liquidated ₹${num} from investments` } }),
      prisma.treasury.update({ where: { userId: user.id }, data: { balance: { increment: num } } }),
    ]);

    const investedAgg = await prisma.investmentPosition.aggregate({ where: { userId: user.id }, _sum: { amount: true } });
    const investedAmount = investedAgg._sum.amount ?? 0;
    const afterTreasury = await prisma.treasury.findUnique({ where: { userId: user.id } });
    return res.json({ ok: true, investedAmount, treasuryBalance: afterTreasury?.balance ?? 0 });
  } catch (e: any) {
    return res.status(400).json({ error: e?.message || 'Liquidation failed' });
  }
}

export async function grow(req: Request, res: Response) {
  try {
    const { risk, ratePct } = req.body || {};
    const r: 'high' | 'low' = risk === 'high' ? 'high' : 'low';
    const rate = Number(ratePct);
    if (!Number.isFinite(rate)) {
      return res.status(400).json({ error: 'ratePct must be a number' });
    }
    const nav = await prisma.investmentNav.findUnique({ where: { risk: r } });
    const current = nav?.currentNav ?? 100;
    const next = parseFloat((current * (1 + rate / 100)).toFixed(2));
    await prisma.investmentNav.upsert({ where: { risk: r }, update: { currentNav: next }, create: { risk: r, currentNav: next } });
    const navs = await prisma.investmentNav.findMany();
    return res.json({ ok: true, navs });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'Failed to grow NAV' });
  }
}
