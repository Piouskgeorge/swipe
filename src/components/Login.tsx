import { useState } from 'react';

interface LoginProps {
  onLogin: (user: any, token: string) => void;
}

// Login component now works with any email - backend handles user creation automatically

function Login({ onLogin }: LoginProps) {
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    
    try {
      // Use backend API - it now accepts any email
      const response = await fetch('http://localhost:5001/api/auth/check-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('User check response:', data);
        setStep('otp');
        setError('');
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Server error. Please try again.');
      }
    } catch (error) {
      console.error('Network error:', error);
      setError('Network error. Please check your connection and try again.');
    }
    
    setLoading(false);
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) return;

    setLoading(true);

    try {
      // Use backend API for OTP verification
      const response = await fetch('http://localhost:5001/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, otp }),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        // Check if user needs to upload resume
        if (data.user.needsResumeUpload) {
          console.log('User needs to upload resume first');
        }
        
        onLogin(data.user, data.token);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Invalid OTP');
      }
    } catch (error) {
      console.error('Network error:', error);
      setError('Network error. Please check your connection and try again.');
    }
    
    setLoading(false);
  };



  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '24px',
        boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)',
        padding: '48px',
        width: '100%',
        maxWidth: '480px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Background decoration */}
        <div style={{
          position: 'absolute',
          top: '-50%',
          right: '-20%',
          width: '200px',
          height: '200px',
          background: 'linear-gradient(45deg, #667eea20, #764ba220)',
          borderRadius: '50%',
          zIndex: 0
        }}></div>
        
        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <div style={{
              width: '80px',
              height: '80px',
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              borderRadius: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px',
              fontSize: '32px'
            }}>
              🎯
            </div>
            <h1 style={{
              fontSize: '32px',
              fontWeight: '700',
              color: '#1a202c',
              margin: '0 0 8px',
              letterSpacing: '-0.025em'
            }}>
              Interview Assistant
            </h1>
            <p style={{
              fontSize: '16px',
              color: '#718096',
              margin: 0,
              fontWeight: '400'
            }}>
              {step === 'email' ? 'Enter your email to continue' : 'Enter the verification code'}
            </p>
          </div>

          {error && (
            <div style={{
              background: '#fed7d7',
              border: '1px solid #feb2b2',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '24px',
              color: '#c53030',
              fontSize: '14px',
              lineHeight: '1.5'
            }}>
              {error}
            </div>
          )}

          {step === 'email' ? (
            <>
              {/* Welcome message */}
              <div style={{
                background: '#f0fff4',
                borderRadius: '16px',
                padding: '20px',
                marginBottom: '32px',
                border: '1px solid #9ae6b4'
              }}>
                <p style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#276749',
                  margin: '0 0 8px',
                  textAlign: 'center'
                }}>
                  ✨ Any Email Works!
                </p>
                <p style={{
                  fontSize: '13px',
                  color: '#2d3748',
                  margin: 0,
                  textAlign: 'center',
                  lineHeight: '1.5'
                }}>
                  Enter any email address to get started. New users are automatically created, and interviewers get special access with emails like interviewer@company.com
                </p>
              </div>

              <form onSubmit={handleEmailSubmit} style={{ marginBottom: '24px' }}>
                <div style={{ marginBottom: '24px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#4a5568',
                    marginBottom: '8px'
                  }}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your work email"
                    required
                    style={{
                      width: '100%',
                      padding: '16px',
                      border: '2px solid #e2e8f0',
                      borderRadius: '12px',
                      fontSize: '16px',
                      transition: 'all 0.2s',
                      outline: 'none',
                      background: 'white'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#667eea';
                      e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e2e8f0';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !email}
                  style={{
                    width: '100%',
                    padding: '16px',
                    background: loading || !email ? '#a0aec0' : 'linear-gradient(135deg, #667eea, #764ba2)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: loading || !email ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  {loading ? (
                    <>
                      <div style={{
                        width: '16px',
                        height: '16px',
                        border: '2px solid transparent',
                        borderTop: '2px solid white',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                      }}></div>
                      Sending Code...
                    </>
                  ) : (
                    <>
                      Send Verification Code
                      <span>→</span>
                    </>
                  )}
                </button>
              </form>
            </>
          ) : (
            <>
              <div style={{
                background: '#f0f4ff',
                borderRadius: '16px',
                padding: '20px',
                marginBottom: '32px',
                textAlign: 'center',
                border: '1px solid #c3d4fe'
              }}>
                <div style={{ fontSize: '24px', marginBottom: '8px' }}>📧</div>
                <p style={{
                  fontSize: '14px',
                  color: '#4c51bf',
                  margin: '0',
                  lineHeight: '1.5'
                }}>
                  We've sent a verification code to<br />
                  <strong>{email}</strong>
                </p>
              </div>

              <form onSubmit={handleOtpSubmit} style={{ marginBottom: '24px' }}>
                <div style={{ marginBottom: '24px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#4a5568',
                    marginBottom: '8px'
                  }}>
                    Verification Code
                  </label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="Enter 6-digit code (999999)"
                    maxLength={6}
                    required
                    style={{
                      width: '100%',
                      padding: '16px',
                      border: '2px solid #e2e8f0',
                      borderRadius: '12px',
                      fontSize: '18px',
                      fontFamily: 'monospace',
                      textAlign: 'center',
                      letterSpacing: '4px',
                      transition: 'all 0.2s',
                      outline: 'none',
                      background: 'white'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#667eea';
                      e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e2e8f0';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                  <p style={{
                    fontSize: '12px',
                    color: '#718096',
                    margin: '8px 0 0',
                    textAlign: 'center'
                  }}>
                    Default OTP for demo: <strong>999999</strong>
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading || !otp}
                  style={{
                    width: '100%',
                    padding: '16px',
                    background: loading || !otp ? '#a0aec0' : 'linear-gradient(135deg, #667eea, #764ba2)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: loading || !otp ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  {loading ? (
                    <>
                      <div style={{
                        width: '16px',
                        height: '16px',
                        border: '2px solid transparent',
                        borderTop: '2px solid white',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                      }}></div>
                      Verifying...
                    </>
                  ) : (
                    <>
                      Verify & Continue
                      <span>✓</span>
                    </>
                  )}
                </button>
              </form>

              <button
                type="button"
                onClick={() => {
                  setStep('email');
                  setOtp('');
                  setError('');
                }}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'transparent',
                  color: '#667eea',
                  border: '2px solid #e2e8f0',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = '#f0f4ff';
                  e.currentTarget.style.borderColor = '#667eea';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.borderColor = '#e2e8f0';
                }}
              >
                ← Back to Email
              </button>
            </>
          )}
        </div>
      </div>

      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
}

export default Login;