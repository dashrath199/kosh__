import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import router from './routes';
import prisma from './utils/prisma';

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api', router);

// Environment and DB diagnostics
if (!process.env.JWT_SECRET) {
  console.warn('[WARN] JWT_SECRET is not set. Auth token signing will fail. Set JWT_SECRET in your environment.');
}

prisma.$connect()
  .then(() => {
    console.log('[OK] Database connection established');
  })
  .catch((err) => {
    console.error('[ERROR] Database connection failed:', err?.message || err);
  });

// Global error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ message: 'Internal Server Error' });
});

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 4000;
app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
