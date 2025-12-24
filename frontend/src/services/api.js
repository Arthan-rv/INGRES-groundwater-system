const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

const handleResponse = async (res) => {
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    const error = payload?.error || 'Unexpected error';
    throw new Error(error);
  }
  return payload;
};

const request = async (path, { method = 'GET', data, token, isFormData = false } = {}) => {
  const headers = {};

  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const body =
    data && !isFormData
      ? JSON.stringify(data)
      : isFormData
      ? data
      : undefined;

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body
  });

  return handleResponse(response);
};

export const login = (credentials) => request('/api/auth/login', { method: 'POST', data: credentials });

export const guestLogin = () => request('/api/auth/guest', { method: 'POST' });

export const logout = (token) => request('/api/auth/logout', { method: 'POST', token });

export const fetchMe = (token) => request('/api/auth/me', { token });

export const fetchOverview = (token) => request('/api/data/overview', { token });

export const fetchRecords = (token) => request('/api/data/groundwater', { token });

// Map data endpoint
export const fetchMapData = (token) => request('/api/data/map', { token });

// Single well data
export const fetchWell = (id, token) => request(`/api/data/well/${id}`, { token });

// Wells by district
export const fetchWellsByDistrict = (district, token) => request(`/api/data/district/${district}`, { token });

// Wells by region
export const fetchWellsByRegion = (region, token) => request(`/api/data/region/${region}`, { token });

export const uploadCsv = (file, token) => {
  const formData = new FormData();
  formData.append('file', file);
  return request('/api/admin/upload-csv', {
    method: 'POST',
    data: formData,
    token,
    isFormData: true
  });
};

// Reload data from files (Admin only)
export const reloadData = (token) => request('/api/admin/reload-data', { method: 'POST', token });

// Chatbot with language support
export const askChatbot = (message, token, language = null) =>
  request('/api/chatbot', {
    method: 'POST',
    data: { message, language },
    token
  });
