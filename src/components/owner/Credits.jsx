import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { FaHistory, FaSync, FaPlus } from 'react-icons/fa';
import toast from 'react-hot-toast';

function Credits() {
  const { isOwner, isSchoolAdmin, school } = useAuth();
  const [schools, setSchools] = useState([]);
  const [selectedSchool, setSelectedSchool] = useState('');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  // Live balance fetched from the API. The `school` object in AuthContext is
  // a snapshot taken at login, so its credit_balance goes stale after
  // generating cards or credit changes — never display it directly.
  const [liveBalance, setLiveBalance] = useState(null);

  useEffect(() => {
    if (isOwner) {
      fetchSchools();
    } else if (isSchoolAdmin && school?.id) {
      setSelectedSchool(school.id);
      fetchHistory(school.id);
      fetchBalance();
    }
  }, [isOwner, isSchoolAdmin, school]);

  // Always read the balance from the live endpoint, never from the stale
  // AuthContext snapshot.
  const fetchBalance = async () => {
    try {
      const endpoint = isSchoolAdmin ? '/school-admin/credits/balance' : '/school-staff/credits/balance';
      const response = await api.get(endpoint);
      setLiveBalance(Number(response.data?.balance ?? response.data?.credit_balance ?? 0));
    } catch (error) {
      console.error('Fetch balance error:', error);
      // Fall back to the context value only if the API fails.
      setLiveBalance(school?.credit_balance ?? 0);
    }
  };

  const fetchSchools = async () => {
    try {
      const response = await api.get('/owner/schools');
      setSchools(response.data);
      if (response.data.length > 0) {
        setSelectedSchool(response.data[0].id);
        fetchHistory(response.data[0].id);
      }
    } catch (error) {
      console.error('Fetch schools error:', error);
      toast.error('Failed to fetch schools');
    }
  };

  const fetchHistory = async (schoolId) => {
    if (!schoolId) return;
    
    setLoadingHistory(true);
    try {
      let endpoint;
      if (isOwner) {
        endpoint = `/owner/schools/${schoolId}/credits/history`;
      } else if (isSchoolAdmin) {
        endpoint = `/school-admin/credits/history`;
      } else {
        endpoint = `/school-staff/credits/history`;
      }
      
      const response = await api.get(endpoint);
      setHistory(response.data || []);
    } catch (error) {
      console.error('Fetch history error:', error);
      // Don't show error for empty history
      setHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleSchoolChange = (e) => {
    const schoolId = e.target.value;
    setSelectedSchool(schoolId);
    fetchHistory(schoolId);
  };

  const handleAddCredits = async (e) => {
    e.preventDefault();
    if (!selectedSchool || !amount || amount <= 0) {
      toast.error('Please select a school and enter a valid amount');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post(`/owner/schools/${selectedSchool}/credits`, {
        amount: parseInt(amount),
        reason: reason || 'Added by admin'
      });
      
      if (response.data.success) {
        toast.success(`Added ${amount} credits successfully`);
        setAmount('');
        setReason('');
        fetchSchools();
        fetchHistory(selectedSchool);
        // Keep the displayed balance in sync for non-owner roles too.
        if (!isOwner) fetchBalance();
      }
    } catch (error) {
      console.error('Add credits error:', error);
      toast.error(error.response?.data?.error || 'Failed to add credits');
    } finally {
      setLoading(false);
    }
  };

  const selectedSchoolData = schools.find(s => s.id === selectedSchool);

  // Format date
  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleString();
  };

  // Get type badge
  const getTypeBadge = (type) => {
    const colors = {
      'CREDIT': 'bg-success',
      'DEBIT': 'bg-danger'
    };
    return <span className={`badge ${colors[type] || 'bg-secondary'}`}>{type}</span>;
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1">Credit Management</h2>
          <p className="text-muted">
            {isOwner ? 'Manage school credits and view transactions' : 'View credit history'}
          </p>
        </div>
        <button className="btn btn-outline-secondary" onClick={() => {
          if (isOwner && selectedSchool) {
            fetchHistory(selectedSchool);
          } else if (isSchoolAdmin && school?.id) {
            fetchHistory(school.id);
          }
        }}>
          <FaSync className="me-1" />
          Refresh
        </button>
      </div>

      {/* Add Credits - Only for Owner */}
      {isOwner && (
        <div className="card mb-4">
          <div className="card-header">
            <FaPlus className="me-2" />
            Add Credits
          </div>
          <div className="card-body">
            <form onSubmit={handleAddCredits}>
              <div className="row">
                <div className="col-md-4 mb-3">
                  <label className="form-label">Select School</label>
                  <select
                    className="form-select"
                    value={selectedSchool}
                    onChange={handleSchoolChange}
                    required
                  >
                    <option value="">Choose a school...</option>
                    {schools.map((school) => (
                      <option key={school.id} value={school.id}>
                        {school.name} (Credits: {school.credit_balance || 0})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-3 mb-3">
                  <label className="form-label">Amount</label>
                  <input
                    type="number"
                    className="form-control"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    min="1"
                    required
                    placeholder="Enter amount"
                  />
                </div>
                <div className="col-md-3 mb-3">
                  <label className="form-label">Reason</label>
                  <input
                    type="text"
                    className="form-control"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Reason (optional)"
                  />
                </div>
                <div className="col-md-2 mb-3 d-flex align-items-end">
                  <button
                    type="submit"
                    className="btn btn-primary w-100"
                    disabled={loading || !selectedSchool}
                  >
                    {loading ? 'Adding...' : 'Add Credits'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Credit History */}
      <div className="card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <div>
            <FaHistory className="me-2" />
            Credit History
            {selectedSchoolData && (
              <span className="ms-2 text-muted">
                {selectedSchoolData.name}
              </span>
            )}
            {isSchoolAdmin && school && (
              <span className="ms-2 text-muted">
                {school.name}
              </span>
            )}
          </div>
          {selectedSchoolData && (
            <span className="badge bg-info">
              Balance: {selectedSchoolData.credit_balance || 0}
            </span>
          )}
          {isSchoolAdmin && school && (
            <span className="badge bg-info">
              Balance: {liveBalance ?? school.credit_balance ?? 0}
            </span>
          )}
        </div>
        <div className="card-body">
          {loadingHistory ? (
            <div className="text-center py-3">
              <div className="spinner-border spinner-border-sm text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <span className="ms-2">Loading history...</span>
            </div>
          ) : history.length > 0 ? (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Type</th>
                    <th>Reason</th>
                    <th>By</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((transaction) => (
                    <tr key={transaction.id}>
                      <td>{formatDate(transaction.created_at)}</td>
                      <td>
                        <span className={transaction.type === 'CREDIT' ? 'text-success' : 'text-danger'}>
                          {transaction.type === 'CREDIT' ? '+' : '-'}{transaction.amount}
                        </span>
                      </td>
                      <td>{getTypeBadge(transaction.type)}</td>
                      <td>{transaction.reason || '-'}</td>
                      <td>{transaction.created_by_email || 'System'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-4 text-muted">
              <FaHistory size={32} className="mb-2" />
              <p>No credit transactions found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Credits;