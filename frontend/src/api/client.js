import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8000',
    withCredentials: true,
    withXSRFToken: true,
    headers: {
        Accept: 'application/json',
    },
});

export async function bootstrapGuestSession() {
    await api.get('/sanctum/csrf-cookie');

    const response = await api.post('/api/guest-session');

    return response.data;
}

export default api;