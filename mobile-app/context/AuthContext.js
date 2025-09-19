import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from '../api/inventory';


export const AuthContext = createContext();


export const AuthProvider = ({ children }) => {
    const [userToken, setUserToken] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const API_BASE_URL = 'http://10.117.10.26:5000/api';

    const login = async (username, password) => {
        try {
            const response = await axios.post(`${API_BASE_URL}/auth/login`, {
                username,
                password,
            });
            const token = response.data.token;
            setUserToken(token);
            await AsyncStorage.setItem('userToken', token);
            apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        } catch (e) {
            console.error('Login error', e);
            throw new Error('Invalid credentials');
        }
    };

    const logout = async () => {
        setUserToken(null);
        // Remove the token from storage
        await AsyncStorage.removeItem('userToken');
        delete apiClient.defaults.headers.common['Authorization'];
    };

    const isLoggedIn = async () => {
        try {
            setIsLoading(true);
            let token = await AsyncStorage.getItem('userToken');
            setUserToken(token);
            if (token) {
                apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            }
            setIsLoading(false);
        } catch (e) {
            console.log(`isLoggedIn error ${e}`);
        }
    };

    // Check if the user is already logged in when the app starts
    useEffect(() => {
        isLoggedIn();
    }, []);

    return (
        <AuthContext.Provider value={{ login, logout, isLoading, userToken }}>
            {children}
        </AuthContext.Provider>
    );
};