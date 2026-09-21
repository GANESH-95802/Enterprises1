import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { FiMail, FiLock, FiUser, FiUserPlus } from 'react-icons/fi';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const newErrors = {};
    if (!form.name) newErrors.name = 'Name is required';
    else if (form.name.length < 2) newErrors.name = 'Name must be at least 2 characters';
    if (!form.email) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) newErrors.email = 'Invalid email format';
    if (!form.password) newErrors.password = 'Password is required';
    else if (form.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
    else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(form.password)) newErrors.password = 'Password must contain uppercase, lowercase, and number';
    if (form.confirmPassword !== form.password) newErrors.confirmPassword = 'Passwords do not match';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
      toast.success('Account created successfully!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">AI</div>
        <h1>Create Account</h1>
        <p>Join the AI Enterprise Hub</p>
        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <div className="input-with-icon">
              <FiUser />
              <input
                type="text"
                className="form-input"
                placeholder="John Doe"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                aria-label="Full name"
              />
            </div>
            {errors.name && <div className="form-error">{errors.name}</div>}
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <div className="input-with-icon">
              <FiMail />
              <input
                type="email"
                className="form-input"
                placeholder="you@company.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                aria-label="Email"
              />
            </div>
            {errors.email && <div className="form-error">{errors.email}</div>}
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="input-with-icon">
              <FiLock />
              <input
                type="password"
                className="form-input"
                placeholder="Min 8 chars, upper, lower, number"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                aria-label="Password"
              />
            </div>
            {errors.password && <div className="form-error">{errors.password}</div>}
          </div>
          <div className="form-group">
            <label className="form-label">Confirm Password</label>
            <div className="input-with-icon">
              <FiLock />
              <input
                type="password"
                className="form-input"
                placeholder="Re-enter password"
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                aria-label="Confirm password"
              />
            </div>
            {errors.confirmPassword && <div className="form-error">{errors.confirmPassword}</div>}
          </div>
          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? 'Creating account...' : <><FiUserPlus /> Register</>}
          </button>
        </form>
        <div className="auth-footer">
          Already have an account? <Link to="/login">Sign In</Link>
        </div>
      </div>
    </div>
  );
}