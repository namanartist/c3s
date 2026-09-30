import { Navigate } from 'react-router-dom';
import { useSessionStore } from '@/store/sessionStore';
import StudentDashboard from '@/pages/Student/StudentDashboard';
import StaffDashboard from '@/pages/Staff/StaffDashboard';
import AdminDashboard from '@/pages/Admin/AdminDashboard';
import { CampusNavigationProvider } from '@/hooks/useCampusNavigation';

export default function RoleDashboard() {
    const user = useSessionStore((state) => state.user);
    if (!user) return <Navigate to="/login" replace />;
    if (user.role === 'student') {
        return (
            <CampusNavigationProvider>
                <StudentDashboard />
            </CampusNavigationProvider>
        );
    }
    if (user.role === 'proctor') return <Navigate to="/proctor" replace />;
    if (user.role === 'gate_keeper') return <Navigate to="/gate" replace />;
    if (user.role === 'admin') return <AdminDashboard />;
    return <StaffDashboard role={user.role as 'faculty' | 'guard' | 'other'} />;
}