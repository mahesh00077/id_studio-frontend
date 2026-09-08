import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import {
  FaSchool,
  FaUsers,
  FaUserGraduate,
  FaIdCard,
  FaCreditCard,
  FaChartLine,
  FaSync
} from 'react-icons/fa';
import toast from 'react-hot-toast';

function Dashboard() {
  const { isOwner } = useAuth();
  const [stats, setStats] = useState({
    total_schools: 0,
    total_users: 0,
    total_students: 0,
    total_cards: 0,
    total_credits: 0
  });
  const [loading, setLoading] = useState(true);
  const [recentActivities, setRecentActivities] = useState([]);

  useEffect(() => {
    fetchStats();
    fetchRecentActivities();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const response = await api.get('/owner/platform/stats');
      console.log('Stats response:', response.data);
      setStats({
        total_schools: response.data.total_schools || 0,
        total_users: response.data.total_users || 0,
        total_students: response.data.total_students || 0,
        total_cards: response.data.total_cards || 0,
        total_credits: response.data.total_credits || 0
      });
    } catch (error) {
      console.error('Fetch stats error:', error);
      toast.error('Failed to fetch statistics');
      // Set default values on error
      setStats({
        total_schools: 0,
        total_users: 0,
        total_students: 0,
        total_cards: 0,
        total_credits: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentActivities = async () => {
    try {
      const response = await api.get('/owner/platform/audit-logs?limit=5');
      setRecentActivities(response.data || []);
    } catch (error) {
      console.error('Fetch activities error:', error);
    }
  };

  const statsCards = [
    { label: 'Total Schools', value: stats.total_schools, icon: FaSchool, color: 'primary' },
    { label: 'Total Users', value: stats.total_users, icon: FaUsers, color: 'success' },
    { label: 'Total Students', value: stats.total_students, icon: FaUserGraduate, color: 'info' },
    { label: 'ID Cards Generated', value: stats.total_cards, icon: FaIdCard, color: 'warning' },
    { label: 'Total Credits', value: stats.total_credits, icon: FaCreditCard, color: 'danger' },
  ];

  const getActionIcon = (action) => {
    if (!action) return <FaChartLine className="text-secondary" />;
    if (action.includes('SCHOOL')) return <FaSchool className="text-primary" />;
    if (action.includes('USER')) return <FaUsers className="text-success" />;
    if (action.includes('CREDIT')) return <FaCreditCard className="text-warning" />;
    if (action.includes('CARD')) return <FaIdCard className="text-info" />;
    return <FaChartLine className="text-secondary" />;
  };

  const getActionColor = (action) => {
    if (!action) return 'text-secondary';
    if (action.includes('CREATED')) return 'text-success';
    if (action.includes('UPDATED')) return 'text-primary';
    if (action.includes('DELETED')) return 'text-danger';
    if (action.includes('STATUS')) return 'text-warning';
    return 'text-secondary';
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
          <h2 className="mb-1">Dashboard</h2>
          <p className="text-muted">Welcome back! Here's what's happening with your platform.</p>
        </div>
        <div>
          <button className="btn btn-outline-secondary me-2" onClick={fetchStats}>
            <FaSync className="me-1" />
            Refresh
          </button>
          {isOwner && (
            <button className="btn btn-primary" onClick={() => window.location.href = '/schools/new'}>
              <FaSchool className="me-2" />
              Add School
            </button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="row g-4 mb-4">
        {statsCards.map((stat, index) => (
          <div key={index} className="col-md-6 col-xl-3">
            <div className="stat-card">
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

      <div className="row g-4">
        {/* Recent Activities */}
        <div className="col-md-7">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <div>
                <FaChartLine className="me-2" />
                Recent Activities
              </div>
              <button className="btn btn-sm btn-outline-secondary" onClick={fetchRecentActivities}>
                <FaSync className="me-1" />
                Refresh
              </button>
            </div>
            <div className="card-body">
              {recentActivities.length > 0 ? (
                <ul className="list-group list-group-flush">
                  {recentActivities.map((activity, index) => (
                    <li key={index} className="list-group-item d-flex justify-content-between align-items-center">
                      <div>
                        <span className={`me-2 ${getActionColor(activity.action)}`}>
                          {getActionIcon(activity.action)}
                        </span>
                        <span>{activity.action ? activity.action.replace(/_/g, ' ') : 'Unknown'}</span>
                        {activity.details && (
                          <span className="text-muted ms-2 small">
                            {typeof activity.details === 'string' ? 
                              activity.details.substring(0, 50) : 
                              JSON.stringify(activity.details).substring(0, 50)}
                          </span>
                        )}
                      </div>
                      <small className="text-muted">
                        {activity.created_at ? new Date(activity.created_at).toLocaleDateString() : 'N/A'}
                      </small>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-center py-4 text-muted">
                  <p>No recent activities</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="col-md-5">
          <div className="card">
            <div className="card-header">
              <FaSchool className="me-2" />
              Quick Actions
            </div>
            <div className="card-body">
              <div className="d-grid gap-2">
                <button 
                  className="btn btn-primary"
                  onClick={() => window.location.href = '/schools/new'}
                >
                  <FaSchool className="me-2" />
                  Create School
                </button>
                <button 
                  className="btn btn-success"
                  onClick={() => window.location.href = '/users'}
                >
                  <FaUsers className="me-2" />
                  Add User
                </button>
                <button 
                  className="btn btn-warning text-white"
                  onClick={() => window.location.href = '/credits'}
                >
                  <FaCreditCard className="me-2" />
                  Add Credits
                </button>
                <button 
                  className="btn btn-info text-white"
                  onClick={() => window.location.href = '/id-cards'}
                >
                  <FaIdCard className="me-2" />
                  View ID Cards
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;