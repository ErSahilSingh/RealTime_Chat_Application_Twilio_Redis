import { useState } from 'react';
import { authAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import './Auth.css';

const Login = () => {
  const [mobileNumber, setMobileNumber] = useState('');
  const [otp, setOTP] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await authAPI.sendOTP(mobileNumber);
      if (res.data.success) {
        setOtpSent(true);
        // In development, OTP is returned
        if (res.data.otp) {
          alert(`Development Mode - OTP: ${res.data.otp}`);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await authAPI.verifyOTP(mobileNumber, otp);
      if (res.data.success) {
        login(res.data.token, res.data.user);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="login-icon">💬</div>
          <h1>Chat App</h1>
          <p>Connect with friends in real-time</p>
        </div>

        {error && (
          <div className="error-message">
            ⚠️ {error}
          </div>
        )}

        {!otpSent ? (
          <form onSubmit={handleSendOTP} className="login-form">
            <div className="form-group">
              <label>Mobile Number</label>
              <input
                type="tel"
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
                placeholder="+1234567890"
                required
                disabled={loading}
              />
              <small>Enter number in E.164 format (e.g., +1234567890)</small>
            </div>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Sending...' : 'Send OTP'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOTP} className="login-form">
            <div className="form-group">
              <label>Enter OTP</label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOTP(e.target.value)}
                placeholder="6-digit code"
                maxLength="6"
                required
                disabled={loading}
                autoFocus
              />
              <small>Check backend console for OTP in development mode</small>
            </div>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Verifying...' : 'Verify & Login'}
            </button>
            <button
              type="button"
              onClick={() => {
                setOtpSent(false);
                setOTP('');
                setError('');
              }}
              className="btn-secondary"
            >
              Change Number
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Login;
