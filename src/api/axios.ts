import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL
});

api.interceptors.request.use(
  config => config,
  error => Promise.reject(error)
);

api.interceptors.response.use(
  response => response,
  error => Promise.reject(error)
);

export default api;
