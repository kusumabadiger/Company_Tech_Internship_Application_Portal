import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import apiRouter from './server/routes';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getCandidatePorts() {
  const preferredPort = Number(process.env.PORT || 3000);
  const ports = [preferredPort];
  for (let offset = 1; offset <= 20; offset += 1) {
    ports.push(preferredPort + offset);
  }
  return ports.filter((port, index, arr) => Number.isFinite(port) && arr.indexOf(port) === index);
}

async function listenWithFallback(app: ReturnType<typeof express>, ports: number[]) {
  for (const port of ports) {
    try {
      await new Promise<void>((resolve, reject) => {
        const server = app.listen(port, () => {
          console.log(`[Company Tech System] Server running on port ${port} (${process.env.NODE_ENV === 'production' ? 'production' : 'development'})`);
          resolve();
        });

        server.on('error', (error: NodeJS.ErrnoException) => {
          if (error.code === 'EADDRINUSE') {
            server.close();
            reject(error);
            return;
          }
          reject(error);
        });
      });
      return port;
    } catch (error: any) {
      if (error?.code !== 'EADDRINUSE') {
        throw error;
      }
      console.warn(`[Company Tech System] Port ${port} is busy. Trying ${port + 1} instead.`);
    }
  }

  throw new Error('No available port found for the Company Tech application.');
}

async function startServer() {
  const app = express();

  // Body parsers with support for PDF/resume uploads up to 10MB
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Mount API endpoints
  app.use('/api', apiRouter);

  // Development vs Production static/vite handling
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: { port: Number(process.env.VITE_HMR_PORT || 24679) } },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  await listenWithFallback(app, getCandidatePorts());
}

startServer().catch((err) => {
  console.error('Fatal error starting Company Tech server:', err);
  process.exit(1);
});
