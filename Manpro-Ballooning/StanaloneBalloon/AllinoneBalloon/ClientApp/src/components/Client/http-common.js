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
