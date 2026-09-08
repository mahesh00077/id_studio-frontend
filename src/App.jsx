import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useSearchParams } from 'react-router-dom';
import { Toaster, ToastBar, toast } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { BrandingProvider, useBranding } from './context/BrandingContext';
import Login from './components/auth/Login';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Layout from './components/common/Layout';
import OwnerRoute from './components/auth/OwnerRoute';

// Owner Components
import OwnerDashboard from './components/owner/Dashboard';
import Schools from './components/owner/Schools';
import SchoolForm from './components/owner/SchoolForm';
import Credits from './components/owner/Credits';
import Users from './components/owner/Users';
import IDCards from './components/owner/IDCards';
import Designs from './components/owner/Designs';
import BrandingSettings from './components/owner/BrandingSettings';
import Advertisements from './components/owner/Advertisements';
import StudentDetailsReport from './components/owner/StudentDetailsReport';
import ThemeApplier from './components/common/ThemeApplier';

// School Admin Components
import SchoolAdminDashboard from './components/school-admin/Dashboard';
import IDCardGenerator from './components/school-admin/IDCardGenerator';
import SchoolAdminStudents from './components/school-admin/Students';
import SchoolAdminStudentForm from './components/school-admin/StudentForm';
import SchoolAdminIDCards from './components/school-admin/IDCards';

// Common Components
import Profile from './components/common/Profile';

// School Staff Components
import SchoolStaffDashboard from './components/school-staff/Dashboard';

function App() {
  return (
    <BrandingProvider>
      <AuthProvider>
        <Router>
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#fff',
                color: '#333',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              },
            }}
          >
            {(t) => (
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <ToastBar toast={t} />
                <button
                  type="button"
                  aria-label="Close notification"
                  onClick={() => toast.dismiss(t.id)}
                  style={{
                    background: 'none',
                    border: 0,
                    cursor: 'pointer',
                    color: '#94a3b8',
                    fontSize: '18px',
                    lineHeight: 1,
                    padding: '2px 6px',
                    alignSelf: 'center',
                  }}
                  title="Close"
                >
                  ×
                </button>
              </div>
            )}
          </Toaster>
          <BrandingDocumentTitle />
          <ThemeApplier />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route index element={<RoleBasedRedirect />} />
              
              {/* Owner Routes */}
              <Route path="dashboard" element={<OwnerDashboard />} />
              <Route path="schools" element={<Schools />} />
              <Route path="schools/new" element={<SchoolForm />} />
              <Route path="schools/:id/edit" element={<SchoolForm />} />
              <Route path="credits" element={<Credits />} />
              <Route path="users" element={<Users />} />
              <Route path="id-cards" element={<IDCards />} />
              <Route path="reports/students" element={<OwnerRoute><StudentDetailsReport /></OwnerRoute>} />
              <Route path="designs" element={<Designs />} />
              <Route path="designs/demo" element={<DemoIDCardGenerator />} />
              <Route path="branding" element={<OwnerRoute><BrandingSettings /></OwnerRoute>} />
              <Route path="advertisements" element={<OwnerRoute><Advertisements /></OwnerRoute>} />
              
              {/* School Admin Routes */}
              <Route path="admin/dashboard" element={<SchoolAdminDashboard />} />
              <Route path="admin/students" element={<SchoolAdminStudents />} />
              <Route path="admin/students/new" element={<SchoolAdminStudentForm />} />
              <Route path="admin/students/:id/edit" element={<SchoolAdminStudentForm />} />
              <Route path="admin/id-cards" element={<SchoolAdminIDCards />} />
              <Route path="admin/id-cards/generate" element={<IDCardGenerator />} />
              
              {/* Shared Routes */}
              <Route path="profile" element={<Profile />} />
              
              {/* School Staff Routes */}
              <Route path="staff/dashboard" element={<SchoolStaffDashboard />} />
              <Route path="staff/id-cards/generate" element={<IDCardGenerator />} />
            </Route>
          </Routes>
        </Router>
      </AuthProvider>
    </BrandingProvider>
  );
}

// Keeps <title> and favicon <link> in sync with the configured branding.
// The favicon URL is a normal /uploads/... path so it needs no rebuild.
function BrandingDocumentTitle() {
  const { branding } = useBranding();
  useEffect(() => {
    document.title = branding.company_name || 'School ID Studio';
    if (branding.favicon_url) {
      let link = document.querySelector('link[rel="icon"]');
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.href = branding.favicon_url;
    }
  }, [branding.company_name, branding.favicon_url]);
  return null;
}

// Owner demo ID-card generator — same 4-step flow as the school-admin
// generator (select design → fields → photo → preview). Demo generation uses
// the credit-free owner endpoint: it creates/updates a student, saves the card
// and persists field changes, but never consumes any school's credits.
function DemoIDCardGenerator() {
  const [params] = useSearchParams();
  return <IDCardGenerator demo initialDesignId={params.get('design')} />;
}

// Role-based redirect component
function RoleBasedRedirect() {
  const { userRole, isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (userRole === 'OWNER') {
    return <Navigate to="/dashboard" replace />;
  } else if (userRole === 'SCHOOL_ADMIN') {
    return <Navigate to="/admin/dashboard" replace />;
  } else if (userRole === 'SCHOOL_STAFF') {
    return <Navigate to="/staff/dashboard" replace />;
  }
  
  return <Navigate to="/dashboard" replace />;
}

export default App;