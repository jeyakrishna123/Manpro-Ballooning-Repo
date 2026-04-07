import React, { createContext, useContext, useState } from 'react';
import useStore from "../Store/store";
// Create a Context for Authentication
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    let state = useStore.getState();
    const user = state.user;
    const isAuth = user.length > 0 ? true : false;
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    setIsAuthenticated(isAuth)
    return (
        <AuthContext.Provider value={{ isAuth }}>
            {children}
        </AuthContext.Provider>
    );
};

// Hook to use the AuthContext
export const useAuth = () => {
    return useContext(AuthContext);
};
