import { ErrorMessage } from './ErrorMessage';
import { getJSON } from '../lib/http';

interface HealthResponse {
  status: string;
  message?: string;
  timestamp?: string;
}

export default async function HealthStatus() {
  let data: HealthResponse | null = null;
  let errorMessage: string | null = null;

  try {
    data = await getJSON<HealthResponse>('/api/health', { cache: 'no-store' });
  } catch (error) {
    const message =
      typeof error === 'object' && error && 'message' in error
        ? String((error as { message?: string }).message ?? 'Unable to reach API')
        : 'Unable to reach API';
    errorMessage = message;
  }

  if (errorMessage) {
    return (
      <section className="card">
        <h2>Backend Health</h2>
        <ErrorMessage message={errorMessage} />
      </section>
    );
  }

  return (
    <section className="card">
      <h2>Backend Health</h2>
      <p className="success-state">Status: {data?.status ?? 'unknown'}</p>
      {data?.message ? <p>{data.message}</p> : null}
      {data?.timestamp ? (
        <p className="text-muted">Last checked: {new Date(data.timestamp).toLocaleString()}</p>
      ) : null}
    </section>
  );
}
