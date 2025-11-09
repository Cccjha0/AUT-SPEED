import { AuthGate } from '../../components/AuthGate';
import { AnalysisWorkspaceClient } from '../../components/AnalysisWorkspaceClient';

export default function AnalysisPage() {
  return (
    <AuthGate roles={['analyst']}>
      <AnalysisWorkspaceClient />
    </AuthGate>
  );
}
