import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export async function getSettings(_req: Request, res: Response) {
  try {
    const email = process.env.DEMO_EMAIL || 'demo@local';
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ error: 'Demo user not found' });
    const s = await prisma.settings.findUnique({ where: { userId: user.id } });
    return res.json(s || {});
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'Failed to load settings' });
  }
}

export async function updateSettings(req: Request, res: Response) {
  try {
    const email = process.env.DEMO_EMAIL || 'demo@local';
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ error: 'Demo user not found' });
    const incoming = req.body as Partial<{ autoSaveRate: number; weeklyTopUp: number; minThreshold: number; roundUpsEnabled: boolean }>;
    const data: any = {};
    if (typeof incoming.autoSaveRate === 'number') data.autoSaveRate = Math.max(0, Math.min(100, incoming.autoSaveRate));
    if (typeof incoming.weeklyTopUp === 'number' && incoming.weeklyTopUp >= 0) data.weeklyTopUp = incoming.weeklyTopUp;
    if (typeof incoming.minThreshold === 'number' && incoming.minThreshold >= 0) data.minThreshold = incoming.minThreshold;
    if (typeof incoming.roundUpsEnabled === 'boolean') data.roundUpsEnabled = incoming.roundUpsEnabled;

    const updated = await prisma.settings.upsert({
      where: { userId: user.id },
      update: data,
      create: { userId: user.id, autoSaveRate: data.autoSaveRate ?? 3.5, weeklyTopUp: data.weeklyTopUp ?? 500, minThreshold: data.minThreshold ?? 100, roundUpsEnabled: data.roundUpsEnabled ?? true },
    });
    return res.json({ ok: true, settings: updated });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'Failed to update settings' });
  }
}
