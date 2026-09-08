import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { FaIdCard, FaCreditCard, FaSchool, FaSync, FaPlus } from 'react-icons/fa';
import toast from 'react-hot-toast';
import AdBanner from '../ads/AdBanner';
import SidebarAdCard from '../ads/SidebarAdCard';
import { useAdvertisements } from '../ads/useAdvertisements';

// Banner + optional sidebar ad card for the school staff dashboard.
function DashboardAds() {
  const { ads, dismiss } = useAdvertisements('DASHBOARD');
  const { ads: sidebarAds } = useAdvertisements('SIDEBAR');
  const banner = ads[0] || null;
  return (
    <>
      <AdBanner ad={banner} onDismiss={dismiss} />
      {sidebarAds[0] && (
        <div className="d-md-none">
          <SidebarAdCard ad={sidebarAds[0]} />
        </div>
      )}
    </>
  );
}

function Dashboard() {
  const { school } = useAuth();
  const [stats, setStats] = useState({
    available_credits: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const creditsRes = await api.get('/school-staff/credits/balance');
      setStats({
        available_credits: creditsRes.data.balance || 0
      });
    } catch (error) {
      console.error('Fetch stats error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1">Staff Dashboard</h2>
          <p className="text-muted">
            <FaSchool className="me-1" />
            {school?.name || 'School'} - Staff Overview
          </p>
        </div>
        <div>
          <button className="btn btn-outline-secondary me-2" onClick={fetchStats}>
            <FaSync className="me-1" />
            Refresh
          </button>
          <button 
            className="btn btn-primary"
            onClick={() => window.location.href = '/staff/id-cards/generate'}
          >
            <FaPlus className="me-2" />
            Generate ID Card
          </button>
        </div>
      </div>

      <div className="row g-4 mb-4">
        <div className="col-md-6">
          <div className="stat-card">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <div className="stat-number">{stats.available_credits}</div>
                <div className="stat-label">Available Credits</div>
              </div>
              <div className="stat-icon bg-warning bg-opacity-10 text-warning">
                <FaCreditCard />
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="stat-card">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <div className="stat-number">
                  <button 
                    className="btn btn-primary"
                    onClick={() => window.location.href = '/staff/id-cards/generate'}
                  >
                    <FaIdCard className="me-2" />
                    Generate ID Card
                  </button>
                </div>
                <div className="stat-label">Quick Action</div>
              </div>
              <div className="stat-icon bg-success bg-opacity-10 text-success">
                <FaIdCard />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Advertisement Banner - primary location */}
      <DashboardAds />

    </div>
  );
}

export default Dashboard;