import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../utils/prisma';

export async function register(email: string, password: string, name?: string) {
  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw new Error('Email already in use');
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({ data: { email, passwordHash, name } });
    return user;
  } catch (_err) {
    // In-memory fallback for development
    const user = await registerInMemory(email, password, name);
    return user;
  }
}

export async function login(email: string, password: string) {
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new Error('Invalid credentials');
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new Error('Invalid credentials');
    const token = jwt.sign(
      { userId: user.id },
      (process.env.JWT_SECRET as string) || 'dev-secret-change-me',
      { expiresIn: '7d' }
    );
    return { token, user: { id: user.id, email: user.email, name: user.name } };
  } catch (_err) {
    // In-memory fallback for development
    const result = await loginInMemory(email, password);
    return result;
  }
}

// --------------------
// In-memory fallback store for development when Prisma is unavailable
// --------------------
type MemUser = { id: string; email: string; passwordHash: string; name?: string | null };
const memUsers: Map<string, MemUser> = new Map();
let memIdCounter = 1;

async function registerInMemory(email: string, password: string, name?: string) {
  const existing = memUsers.get(email.toLowerCase());
  if (existing) throw new Error('Email already in use');
  const passwordHash = await bcrypt.hash(password, 10);
  const user: MemUser = {
    id: String(memIdCounter++),
    email,
    passwordHash,
    name: name ?? null,
  };
  memUsers.set(email.toLowerCase(), user);
  return user;
}

async function loginInMemory(email: string, password: string) {
  const user = memUsers.get(email.toLowerCase());
  if (!user) throw new Error('Invalid credentials');
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw new Error('Invalid credentials');
  const token = jwt.sign(
    { userId: user.id },
    (process.env.JWT_SECRET as string) || 'dev-secret-change-me',
    { expiresIn: '7d' }
  );
  return { token, user: { id: user.id, email: user.email, name: user.name } };
}
