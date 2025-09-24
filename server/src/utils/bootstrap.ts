import prisma from './prisma';

const DEMO_EMAIL = process.env.DEMO_EMAIL || 'demo@local';

export async function bootstrapDemoData() {
  // Create a demo user if not present
  const user = await prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    update: {},
    create: {
      email: DEMO_EMAIL,
      passwordHash: 'mock',
      name: 'Demo User',
    },
  });

  // Settings
  await prisma.settings.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      autoSaveRate: 3.5,
      weeklyTopUp: 500,
      minThreshold: 100,
      roundUpsEnabled: true,
    },
  });

  // Treasury
  await prisma.treasury.upsert({
    where: { userId: user.id },
    update: {},
    create: { userId: user.id, balance: 0 },
  });

  // Investment NAVs
  await prisma.investmentNav.upsert({
    where: { risk: 'high' },
    update: {},
    create: { risk: 'high', currentNav: 100 },
  });
  await prisma.investmentNav.upsert({
    where: { risk: 'low' },
    update: {},
    create: { risk: 'low', currentNav: 100 },
  });

  return user;
}
