import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate, Outlet } from 'react-router-dom';

const PrivateRoute = () => {
    const { token } = useSelector((state) => state.auth);
    // If token exists, render the child route (Outlet). Otherwise, redirect to login.
    return token ? <Outlet /> : <Navigate to="/login" replace />;
};

export default PrivateRoute;