import { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import Header from './Header';
import Sidebar from './Sidebar';
import Dashboard from '../pages/Dashboard';
import MedicalRecords from '../pages/MedicalRecords';
import Appointments from '../pages/Appointments';
import MedicalServices from '../pages/MedicalServices';
import AccessManagement from '../pages/AccessManagement';
import Login from '../pages/Login';
import NotFound from '../pages/NotFound';
import FaceLoginPage from '../pages/FaceLoginPage';
import RegisterFacePage from '../pages/RegisterFacePage';

const Layout = () => {
    const { isAuthenticated } = useUser();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    if (!isAuthenticated) {
        return <Login />;
    }

    return (
        <div className="flex h-screen bg-gray-100">
            <Sidebar isOpen={isSidebarOpen} onToggle={() => setIsSidebarOpen(!isSidebarOpen)} />
            
            {/* Contenido principal */}
            <div className="flex flex-col flex-1 overflow-hidden md:ml-64">
                <Header onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />
                <main className="bg-essalud-totalBG flex-1 overflow-y-auto p-4 md:p-6">
                    <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/face-login" element={<FaceLoginPage />} />
                        <Route path="/face-register" element={<RegisterFacePage />} />
                        <Route path="/medical-records/*" element={<MedicalRecords />} />
                        <Route path="/appointments/*" element={<Appointments />} />
                        <Route path="/medical-services/*" element={<MedicalServices />} />
                        <Route path="/access-management/*" element={<AccessManagement />} />
                        <Route path="/login" element={<Navigate to="/" replace />} />
                        <Route path="*" element={<NotFound />} />
                    </Routes>
                </main>
            </div>
        </div>
    );
};

export default Layout;