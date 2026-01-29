"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import api from './api';
import { getStoredToken, setStoredToken, setStoredWorkspaceId } from './storage';

interface User {
    id: string;
    email: string;
    name: string;
    tenants?: {
        tenantId: string;
        role: string;
        tenant: {
            id: string;
            name: string;
            slug: string;
        };
    }[];
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<void>;
    signup: (name: string, email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    const checkAuth = useCallback(async () => {
        try {
            const token = getStoredToken();
            if (!token) {
                setUser(null);
                return;
            }

            const response = await api.get('/auth/me');
            const payload = response.data?.data ?? response.data;
            setUser(payload);
        } catch {
            setUser(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    const login = async (email: string, password: string) => {
        const response = await api.post('/auth/login', { email, password });
        const payload = response.data?.data ?? response.data;
        setStoredToken(payload?.token);
        setUser(payload?.user);
    };

    const signup = async (name: string, email: string, password: string) => {
        const response = await api.post('/auth/signup', { name, email, password });
        const payload = response.data?.data ?? response.data;
        setStoredToken(payload?.token);
        setStoredWorkspaceId(payload?.workspace?.id);
        setUser(payload?.user);
    };

    const logout = async () => {
        setStoredToken(undefined);
        setStoredWorkspaceId(undefined);
        setUser(null);
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                isAuthenticated: !!user,
                login,
                signup,
                logout,
                checkAuth,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
