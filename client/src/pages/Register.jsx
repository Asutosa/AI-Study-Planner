import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

function Register() {
  const { register, user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
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
      await register(form);
      navigate('/login', {
        replace: true,
        state: { message: 'Registration successful. Please log in.' },
      });
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
        <h1>Create your account</h1>
        <p className="muted">Start organizing your learning today.</p>
        <form onSubmit={handleSubmit}>
          <label htmlFor="name">Name</label>
          <input
            id="name"
            name="name"
            type="text"
            value={form.name}
            onChange={handleChange}
            required
            autoComplete="name"
          />
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
            minLength="6"
            autoComplete="new-password"
          />
          {error && <p className="form-error">{error}</p>}
          <button type="submit" disabled={submitting}>
            {submitting ? 'Creating account...' : 'Register'}
          </button>
        </form>
        <p className="switch-link">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </section>
    </main>
  );
}

export default Register;
