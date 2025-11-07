import 'dotenv/config';
import { createApp } from './bootstrap';

async function bootstrap() {
  const app = await createApp();

  const port = process.env.PORT ?? 3001;

  await new Promise<void>((resolve, reject) => {
    const server = app.listen(port, () => resolve());
    server.on('error', reject);
  });

  // eslint-disable-next-line no-console
  console.log('Backend running at http://localhost:' + port + '/api/health');
}

bootstrap();
