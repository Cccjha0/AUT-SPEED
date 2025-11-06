import { ErrorMessage } from './ErrorMessage';
import { apiUrl } from '../lib/config';

interface HealthResponse {
  status: string;
  timestamp?: string;
}

export default async function HealthStatus() {
  let data: HealthResponse | null = null;
  let errorMessage: string | null = null;

  try {
    const res = await fetch(apiUrl('/health'), {
      cache: 'no-store'
    });

    if (!res.ok) {
      errorMessage = `Health check failed (${res.status})`;
    } else {
      data = (await res.json()) as HealthResponse;
    }
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : 'Unable to reach API';
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
      {data?.timestamp ? (
        <p className="text-muted">Last checked: {new Date(data.timestamp).toLocaleString()}</p>
      ) : null}
    </section>
  );
}
