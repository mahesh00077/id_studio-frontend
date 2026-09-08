import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Branding from '../common/Branding';
import { FaUser, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';
import { Card, Form, Button, Alert } from 'react-bootstrap';
import toast from 'react-hot-toast';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    
    const result = await login(email, password);
    
    if (result.success) {
      // Redirect based on role
      const role = result.role || result.user?.role;
      console.log('✅ Login successful, role:', role);
      
      if (role === 'OWNER') {
        navigate('/dashboard');
      } else if (role === 'SCHOOL_ADMIN') {
        navigate('/admin/dashboard');
      } else if (role === 'SCHOOL_STAFF') {
        navigate('/staff/dashboard');
      } else {
        navigate('/dashboard');
      }
    } else {
      setError(result.error || 'Login failed');
    }
    setLoading(false);
  };

  return (
    <div className="login-page">
      <Card className="login-card shadow-lg">
        <Card.Body>
          <div className="text-center mb-4">
            <Branding size="lg" className="justify-content-center" />
            <p className="text-muted">Welcome back! Please login to your account.</p>
          </div>

          {error && <Alert variant="danger">{error}</Alert>}

          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Email Address</Form.Label>
              <div className="input-group">
                <span className="input-group-text">
                  <FaUser />
                </span>
                <Form.Control
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Password</Form.Label>
              <div className="input-group">
                <span className="input-group-text">
                  <FaLock />
                </span>
                <Form.Control
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </Form.Group>

            <Button
              type="submit"
              variant="primary"
              className="w-100"
              disabled={loading}
              size="lg"
            >
              {loading ? 'Logging in...' : 'Login'}
            </Button>
          </Form>

          
        </Card.Body>
      </Card>
    </div>
  );
}

export default Login;