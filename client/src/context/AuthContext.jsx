import { createContext, useState, useEffect, useContext } from "react";
import api from "../api";

const AuthContext = createContext(null);

//export context from this file
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const checkAuthStatus = async () => {
        try {
            const res = await api.get("/auth/me");
            setUser(res.data);
        } catch (err) {
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        checkAuthStatus();
    }, []);

    const login = async (email, password) => {
        const res = await api.post("/auth/login", { email, password });
        setUser(res.data);
        return res.data;
    };

    const register = async (email, password) => {
        const res = await api.post("/auth/register", { email, password });
        setUser(res.data);
        return res.data;
    };

    const logout = async () => {
        await api.post("/auth/logout");
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout, checkAuthStatus }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};
