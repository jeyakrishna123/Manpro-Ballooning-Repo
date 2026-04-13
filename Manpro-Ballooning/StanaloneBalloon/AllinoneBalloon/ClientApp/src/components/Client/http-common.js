import axios from "axios";
import useStore from "../Store/store";

const config = {
    ENVIRONMENT: process.env.REACT_APP_ENV,
    BASE_URL: process.env.REACT_APP_SERVER,
    console: process.env.REACT_APP_CONSOLE === "true",
};

export const instance = axios.create({
    baseURL: config.BASE_URL,
    headers: {
        'Accept': 'application/json',
        "Content-type": "application/json"
    }
});

// Single interceptor that dynamically gets the latest token on every request
instance.interceptors.request.use(config => {
    const state = useStore.getState();
    if (state.user && state.user.length > 0) {
        const token = state.user[0].jwtToken;
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
    }
    return config;
}, error => {
    return Promise.reject(error);
});

let isRefreshing = false;
let failedQueue = [];

function processQueue(error, token = null) {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
}

async function tryRefreshToken() {
    const BASE_URL = process.env.REACT_APP_SERVER || '';
    const res = await axios.post(BASE_URL + '/api/users/refresh-token', {}, { withCredentials: true });
    if (res.status === 200 && res.data && res.data.User) {
        const newUser = res.data.User;
        // Update store and sessionStorage with new token
        const state = useStore.getState();
        useStore.setState({ user: [newUser], roles: res.data.Roles || state.roles });
        sessionStorage.setItem('user', JSON.stringify([newUser]));
        sessionStorage.setItem('roles', JSON.stringify(res.data.Roles || state.roles));
        return newUser.jwtToken;
    }
    throw new Error('Refresh failed');
}

// Global axios response interceptor — catches 401 on ALL axios calls
axios.interceptors.response.use(
    response => response,
    async error => {
        const originalRequest = error.config;
        // Skip refresh for login/refresh-token endpoints or already-retried requests
        if (
            !error.response ||
            error.response.status !== 401 ||
            originalRequest._retry ||
            (originalRequest.url && (
                originalRequest.url.includes('/api/users/login') ||
                originalRequest.url.includes('/api/users/refresh-token')
            ))
        ) {
            return Promise.reject(error);
        }

        if (isRefreshing) {
            // Queue the request until the token refresh completes
            return new Promise((resolve, reject) => {
                failedQueue.push({ resolve, reject });
            }).then(token => {
                originalRequest.headers['Authorization'] = 'Bearer ' + token;
                return axios(originalRequest);
            }).catch(err => Promise.reject(err));
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
            const newToken = await tryRefreshToken();
            processQueue(null, newToken);
            originalRequest.headers['Authorization'] = 'Bearer ' + newToken;
            return axios(originalRequest);
        } catch (refreshError) {
            processQueue(refreshError, null);
            // Refresh failed — clear session and redirect to login
            sessionStorage.removeItem('user');
            sessionStorage.removeItem('roles');
            useStore.setState({ user: [] });
            window.location.assign('/login');
            return Promise.reject(refreshError);
        } finally {
            isRefreshing = false;
        }
    }
);
