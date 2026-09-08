import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import {
  FaUserGraduate,
  FaIdCard,
  FaCreditCard,
  FaSchool,
  FaChartLine,
  FaSync,
  FaPlus
} from 'react-icons/fa';
import toast from 'react-hot-toast';
import AdBanner from '../ads/AdBanner';
import SidebarAdCard from '../ads/SidebarAdCard';
import { useAdvertisements } from '../ads/useAdvertisements';

// Banner + optional sidebar ad card for the school admin dashboard.
function DashboardAds() {
  const { ads, dismiss } = useAdvertisements('DASHBOARD');
  const { ads: sidebarAds } = useAdvertisements('SIDEBAR');
  const banner = ads[0] || null;

  return (
    <>
      <AdBanner ad={banner} onDismiss={dismiss} />
      {sidebarAds[0] && (
        <div className="d-md-none mb-4">
          <SidebarAdCard ad={sidebarAds[0]} onDismiss={dismiss} />
        </div>
      )}
    </>
  );
}

function Dashboard() {
  const { school, user } = useAuth();
  const [stats, setStats] = useState({
    // total_students: 0,
    total_id_cards: 0,
    available_credits: 0,
    total_staff: 0
  });
  const [loading, setLoading] = useState(true);
  const [recentCards, setRecentCards] = useState([]);
  const [creditHistory, setCreditHistory] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      console.log('📊 Fetching School Admin dashboard for school:', school?.id);
      
      // Fetch dashboard stats
      const response = await api.get('/school-admin/dashboard');
      console.log('📊 Dashboard response:', response.data);
      
      setStats({
        // total_students: response.data.stats?.total_students || 0,
        total_id_cards: response.data.stats?.total_id_cards || 0,
        available_credits: response.data.stats?.available_credits || 0,
        total_staff: response.data.stats?.total_staff || 0
      });
      setRecentCards(response.data.recentCards || []);

      // Fetch credit history
      const creditResponse = await api.get('/school-admin/credits/history?limit=5');
      setCreditHistory(creditResponse.data || []);
    } catch (error) {
      console.error('❌ Fetch dashboard error:', error);
      // Set default values on error
      setStats({
        // total_students: 0,
        total_id_cards: 0,
        available_credits: 0,
        total_staff: 0
      });
      setRecentCards([]);
      setCreditHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    // { 
    //   label: 'Total Students', 
    //   value: stats.total_students, 
    //   icon: FaUserGraduate, 
    //   color: 'primary',
    //   link: '/admin/students'
    // },
    { 
      label: 'ID Cards Generated', 
      value: stats.total_id_cards, 
      icon: FaIdCard, 
      color: 'success',
      link: '/admin/id-cards'
    },
    { 
      label: 'Available Credits', 
      value: stats.available_credits, 
      icon: FaCreditCard, 
      color: 'warning',
      link: '/credits'
    }
  ];

  const getCreditTypeBadge = (type) => {
    const colors = {
      'CREDIT': 'bg-success',
      'DEBIT': 'bg-danger'
    };
    return <span className={`badge ${colors[type] || 'bg-secondary'}`}>{type}</span>;
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-2 text-muted">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1">School Dashboard</h2>
          <p className="text-muted">
            <FaSchool className="me-1" />
            {school?.name || 'School'} - Overview
          </p>
        </div>
        <div>
          <button className="btn btn-outline-secondary me-2" onClick={fetchDashboardData}>
            <FaSync className="me-1" />
            Refresh
          </button>
          <button 
            className="btn btn-primary"
            onClick={() => window.location.href = '/admin/id-cards/generate'}
          >
            <FaPlus className="me-2" />
            Generate ID Card
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="row g-4 mb-4">
        {statCards.map((stat, index) => (
          <div key={index} className="col-md-4">
            <div 
              className="stat-card cursor-pointer" 
              style={{ cursor: 'pointer' }}
              onClick={() => window.location.href = stat.link}
            >
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <div className="stat-number">{stat.value}</div>
                  <div className="stat-label">{stat.label}</div>
                </div>
                <div className={`stat-icon bg-${stat.color} bg-opacity-10 text-${stat.color}`}>
                  <stat.icon />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Advertisement Banner - primary location */}
      <DashboardAds />

      <div className="row g-4">
        {/* Recent ID Cards */}
        <div className="col-md-7">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <div>
                <FaIdCard className="me-2" />
                Recent ID Cards
              </div>
              {recentCards.length > 0 && (
                <button 
                  className="btn btn-sm btn-outline-primary"
                  onClick={() => window.location.href = '/admin/id-cards'}
                >
                  View All
                </button>
              )}
            </div>
            <div className="card-body">
              {recentCards.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Student</th>
                        <th>Card Number</th>
                        <th>Generated</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentCards.slice(0, 5).map((card) => (
                        <tr key={card.id}>
                          <td>
                            <strong>{card.student_name}</strong>
                          </td>
                          <td>
                            <code className="small">{card.card_number}</code>
                          </td>
                          <td>{new Date(card.generated_at).toLocaleDateString()}</td>
                          <td>
                            <span className={`badge ${card.status === 'ACTIVE' ? 'bg-success' : 'bg-secondary'}`}>
                              {card.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-4 text-muted">
                  <FaIdCard size={32} className="mb-2" />
                  <p>No ID cards generated yet</p>
                  <button 
                    className="btn btn-primary btn-sm"
                    onClick={() => window.location.href = '/admin/id-cards/generate'}
                  >
                    Generate ID Card
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Credit History */}
        <div className="col-md-5">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <div>
                <FaCreditCard className="me-2" />
                Credit History
              </div>
              <button 
                className="btn btn-sm btn-outline-secondary"
                onClick={() => window.location.href = '/credits'}
              >
                View All
              </button>
            </div>
            <div className="card-body">
              {creditHistory.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-sm">
                    <thead>
                      <tr>
                        <th>Amount</th>
                        <th>Type</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {creditHistory.slice(0, 5).map((transaction) => (
                        <tr key={transaction.id}>
                          <td>
                            <span className={transaction.type === 'CREDIT' ? 'text-success' : 'text-danger'}>
                              {transaction.type === 'CREDIT' ? '+' : '-'}{transaction.amount}
                            </span>
                          </td>
                          <td>{getCreditTypeBadge(transaction.type)}</td>
                          <td>{new Date(transaction.created_at).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-3 text-muted">
                  <p>No credit transactions yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;