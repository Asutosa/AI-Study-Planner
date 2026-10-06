import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

function Login() {
  const { login, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleChange = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await login(form);
      navigate('/', { replace: true });
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="auth-layout">
      <section className="auth-card">
        <p className="eyebrow">AI Study Planner</p>
        <h1>Welcome back</h1>
        <p className="muted">Log in to continue your study journey.</p>
        {location.state?.message && (
          <p className="success-message">{location.state.message}</p>
        )}
        <form onSubmit={handleSubmit}>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            required
            autoComplete="email"
          />
          <label htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            required
            autoComplete="current-password"
          />
          {error && <p className="form-error">{error}</p>}
          <button type="submit" disabled={submitting}>
            {submitting ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <p className="switch-link">
          Don&apos;t have an account? <Link to="/register">Register</Link>
        </p>
      </section>
    </main>
  );
}

export default Login;
