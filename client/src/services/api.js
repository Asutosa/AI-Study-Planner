const API_BASE_URL = 'http://localhost:5000';

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || 'Something went wrong. Please try again.');
  }

  return data;
}

export function registerUser(userData) {
  return request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData),
  });
}

export function loginUser(credentials) {
  return request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });
}

export function getCurrentUser(token) {
  return request('/api/auth/me', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

function taskHeaders(token) {
  return {
    Authorization: `Bearer ${token}`,
  };
}

export function getTasks(token) {
  return request('/api/tasks', {
    headers: taskHeaders(token),
  });
}

export function createTask(token, taskData) {
  return request('/api/tasks', {
    method: 'POST',
    headers: taskHeaders(token),
    body: JSON.stringify(taskData),
  });
}

export function updateTask(token, taskId, taskData) {
  return request(`/api/tasks/${taskId}`, {
    method: 'PUT',
    headers: taskHeaders(token),
    body: JSON.stringify(taskData),
  });
}

export function deleteTask(token, taskId) {
  return request(`/api/tasks/${taskId}`, {
    method: 'DELETE',
    headers: taskHeaders(token),
  });
}

export function getAIRecommendation(token) {
  return request('/api/ai/recommendations', {
    method: 'POST',
    headers: taskHeaders(token),
  });
}
