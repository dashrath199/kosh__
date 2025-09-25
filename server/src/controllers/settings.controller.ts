import { Request, Response } from 'express';
import prisma from '../utils/prisma';

function resolveUserId(req: Request) {
  const demoEmail = process.env.DEMO_EMAIL || 'demo@local';
  return prisma.user.findUnique({ where: { email: demoEmail } });
}

export async function getSettings(req: Request, res: Response) {
  try {
    const user = await resolveUserId(req);
    if (!user) return res.status(404).json({ error: 'Demo user not found' });

    const settings = await prisma.settings.findUnique({ where: { userId: user.id } });
    if (!settings) {
      const created = await prisma.settings.create({
        data: {
          userId: user.id,
        },
      });
      return res.json(created);
    }
    return res.json(settings);
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'Failed to load settings' });
  }
}

export async function updateSettings(req: Request, res: Response) {
  try {
    const user = await resolveUserId(req);
    if (!user) return res.status(404).json({ error: 'Demo user not found' });

    const incoming = req.body as Record<string, unknown>;
    const data: any = {};

    if (typeof incoming.autoSaveRate === 'number') data.autoSaveRate = Math.max(0, Math.min(100, incoming.autoSaveRate));
    if (typeof incoming.minThreshold === 'number' && incoming.minThreshold >= 0) data.minThreshold = incoming.minThreshold;
    if (typeof incoming.roundUpsEnabled === 'boolean') data.roundUpsEnabled = incoming.roundUpsEnabled;
    if (typeof incoming.weeklyTopUp === 'number' && incoming.weeklyTopUp >= 0) data.weeklyTopUp = incoming.weeklyTopUp;
    if (incoming.monthlyGoal === null || typeof incoming.monthlyGoal === 'number') data.monthlyGoal = incoming.monthlyGoal;

    if (typeof incoming.riskTolerance === 'string') data.riskTolerance = incoming.riskTolerance;
    if (incoming.investmentGoal === null || typeof incoming.investmentGoal === 'string') data.investmentGoal = incoming.investmentGoal;
    if (typeof incoming.autoInvest === 'boolean') data.autoInvest = incoming.autoInvest;

    if (typeof incoming.emailNotifications === 'boolean') data.emailNotifications = incoming.emailNotifications;
    if (typeof incoming.pushNotifications === 'boolean') data.pushNotifications = incoming.pushNotifications;
    if (typeof incoming.lowBalanceAlert === 'boolean') data.lowBalanceAlert = incoming.lowBalanceAlert;
    if (typeof incoming.weeklyReport === 'boolean') data.weeklyReport = incoming.weeklyReport;

    if (typeof incoming.twoFactorAuth === 'boolean') data.twoFactorAuth = incoming.twoFactorAuth;
    if (typeof incoming.biometricAuth === 'boolean') data.biometricAuth = incoming.biometricAuth;

    if (typeof incoming.currency === 'string') data.currency = incoming.currency;
    if (typeof incoming.language === 'string') data.language = incoming.language;
    if (typeof incoming.theme === 'string') data.theme = incoming.theme;

    const updated = await prisma.settings.upsert({
      where: { userId: user.id },
      update: data,
      create: {
        userId: user.id,
        autoSaveRate: data.autoSaveRate ?? 3.5,
        minThreshold: data.minThreshold ?? 100,
        roundUpsEnabled: data.roundUpsEnabled ?? true,
        weeklyTopUp: data.weeklyTopUp ?? 500,
        monthlyGoal: data.monthlyGoal ?? null,
        riskTolerance: data.riskTolerance ?? 'moderate',
        investmentGoal: data.investmentGoal ?? null,
        autoInvest: data.autoInvest ?? true,
        emailNotifications: data.emailNotifications ?? true,
        pushNotifications: data.pushNotifications ?? true,
        lowBalanceAlert: data.lowBalanceAlert ?? true,
        weeklyReport: data.weeklyReport ?? true,
        twoFactorAuth: data.twoFactorAuth ?? false,
        biometricAuth: data.biometricAuth ?? true,
        currency: data.currency ?? 'INR',
        language: data.language ?? 'en',
        theme: data.theme ?? 'system',
      },
    });

    return res.json(updated);
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'Failed to update settings' });
  }
}
