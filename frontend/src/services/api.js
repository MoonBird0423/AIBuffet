import axios from 'axios';

const API_URL = process.env.NODE_ENV === 'production' 
  ? '/api' 
  : 'http://localhost:8080/api';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

export const getExample = async () => {
  try {
    const response = await apiClient.get('/example');
    return response.data;
  } catch (error) {
    console.error('Error fetching data:', error);
    throw error;
  }
};

export const queryModels = async (params) => {
  try {
    const response = await apiClient.get('/model/query', { params });
    return response.data;
  } catch (error) {
    console.error('Error querying models:', error);
    throw error;
  }
};

export default apiClient;
