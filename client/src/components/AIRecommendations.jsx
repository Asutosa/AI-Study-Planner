import { useState } from 'react';
import { getAIRecommendation } from '../services/api';

function AIRecommendations({ token }) {
  const [recommendation, setRecommendation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRecommendationRequest = async () => {
    setError('');
    setLoading(true);

    try {
      const response = await getAIRecommendation(token);
      setRecommendation(response.recommendation);
    } catch (requestError) {
      setRecommendation('');
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="planner-card recommendation-card">
      <div className="section-heading">
        <div>
          <h2>Study recommendation</h2>
          <p className="muted">Get guidance based on your pending tasks.</p>
        </div>
        <button
          type="button"
          onClick={handleRecommendationRequest}
          disabled={loading}
        >
          {loading ? 'Thinking...' : 'Get Study Recommendation'}
        </button>
      </div>
      {error && <p className="form-error">{error}</p>}
      {recommendation && (
        <p className="recommendation-text">{recommendation}</p>
      )}
    </section>
  );
}

export default AIRecommendations;
