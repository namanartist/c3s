import { useParams } from 'react-router-dom';
import { CampusNavigationProvider } from '@/hooks/useCampusNavigation';
import { usePageMeta } from '@/hooks/usePageMeta';
import { GateKeeperDashboard } from '@/components/safety/GateKeeperDashboard';
import type { GateId } from '@/types/gate';

export default function GateKeeperPage() {
  const { gateId } = useParams<{ gateId?: string }>();
  usePageMeta(
    'C3S Gate Operations & Daily QR',
    'Official Gate Keeper dashboard for MITS Gwalior. Daily rotating cryptographic QR tokens, student check-in/out validation, and campus occupancy tracking.'
  );

  const formattedGateId = (gateId?.toUpperCase() as GateId) || 'GATE-MAIN';

  return (
    <CampusNavigationProvider>
      <main className="min-h-screen bg-[#080d1a]">
        <GateKeeperDashboard initialGateId={formattedGateId} />
      </main>
    </CampusNavigationProvider>
  );
}
