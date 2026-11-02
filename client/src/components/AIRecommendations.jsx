import { useState } from 'react';
import { getAIRecommendation } from '../services/api';

function AIRecommendations({ token }) {
  const [recommendation, setRecommendation] = useState('');
  const [structuredRecommendation, setStructuredRecommendation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRecommendationRequest = async () => {
    setError('');
    setLoading(true);

    try {
      const response = await getAIRecommendation(token);
      setRecommendation(response.recommendation);
      setStructuredRecommendation(response.structuredRecommendation || null);
    } catch (requestError) {
      setRecommendation('');
      setStructuredRecommendation(null);
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
      {structuredRecommendation ? (
        <div className="recommendation-content">
          <div className="recommendation-summary">
            <span className="recommendation-label">AI summary</span>
            <p>{structuredRecommendation.summary}</p>
          </div>

          <div className="recommendation-focus">
            <div>
              <span className="recommendation-label">Focus task</span>
              <h3>{structuredRecommendation.focusTask}</h3>
            </div>
            <p>{structuredRecommendation.reason}</p>
          </div>

          <div className="recommendation-sections">
            <section className="recommendation-section">
              <h3>Learning resources</h3>
              {structuredRecommendation.resources?.length ? (
                <ul className="recommendation-resource-list">
                  {structuredRecommendation.resources.map((resource) => (
                    <li key={`${resource.title}-${resource.url || 'resource'}`}>
                      <div>
                        {resource.url ? (
                          <a
                            href={resource.url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {resource.title}
                          </a>
                        ) : (
                          <strong>{resource.title}</strong>
                        )}
                        <p>{resource.reason}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="recommendation-muted">No specific resources were suggested.</p>
              )}
            </section>

            <section className="recommendation-section">
              <h3>Study strategy</h3>
              <ol className="recommendation-strategy-list">
                {structuredRecommendation.strategy?.map((step) => {
                  const trimmedStep = step.step.trim();
                  const stepTitle = /^\d+$/.test(trimmedStep)
                    ? ''
                    : trimmedStep.replace(/^\d+(?:\s*[.)\-:]\s*|\s+)/, '');

                  return (
                    <li key={step.step}>
                      {stepTitle && <strong>{stepTitle}</strong>}
                      <p>{step.description}</p>
                    </li>
                  );
                })}
              </ol>
            </section>
          </div>

          <div className="recommendation-meta">
            <div>
              <span className="recommendation-label">Estimated time</span>
              <strong>{structuredRecommendation.estimatedTime}</strong>
            </div>
            <div>
              <span className="recommendation-label">Quick hint</span>
              <p>{structuredRecommendation.quickHint}</p>
            </div>
          </div>

          <div className="recommendation-technique">
            <span className="recommendation-label">Study technique</span>
            <h3>{structuredRecommendation.studyTechnique.name}</h3>
            <p>{structuredRecommendation.studyTechnique.instructions}</p>
          </div>
        </div>
      ) : (
        recommendation && <p className="recommendation-text">{recommendation}</p>
      )}
    </section>
  );
}

export default AIRecommendations;
