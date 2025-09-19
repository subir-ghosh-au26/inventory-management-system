import axios from 'axios';

const API_BASE_URL = 'http://10.117.10.26:5000/api';

export const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Fetches a single item by its SKU
export const getItemBySku = (sku) => {
    return apiClient.get(`/items/by-sku/${sku}`);
};

// Submits a distribution transaction
export const distributeItem = (data) => {
    return apiClient.post('/transactions/distribute', data);
};

// Submits a return transaction
export const returnItem = (data) => {
    return apiClient.post('/transactions/return', data);
};