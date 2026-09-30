import { CampusNavigationProvider } from '@/hooks/useCampusNavigation';
import { usePageMeta } from '@/hooks/usePageMeta';
import { CctvSocDashboard } from '@/components/safety/CctvSocDashboard';
import { OfflineMeshStatus } from '@/components/safety/OfflineMeshStatus';

export default function OperationsPage() {
    usePageMeta(
        'C3S SOC — SOS & Surveillance Operations',
        'Live campus CCTV monitoring, SOS incident triage, emergency alerts, and responder dispatch for MITS Gwalior.'
    );

    return (
        <CampusNavigationProvider>
            <main className="relative min-h-screen overflow-hidden bg-neutral-950">
                <div className="absolute right-5 top-5 z-50"><OfflineMeshStatus /></div>
                <CctvSocDashboard />
            </main>
        </CampusNavigationProvider>
    );
}