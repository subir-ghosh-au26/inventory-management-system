import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { login } from '../features/auth/authSlice';
import {
    Button, TextField, Container, Typography, Box,
    CircularProgress, Alert, IconButton, InputAdornment, Paper
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import InventoryIcon from '@mui/icons-material/Inventory'; // An icon for the top

const LoginPage = () => {
    const [formData, setFormData] = useState({ username: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);
    const { username, password } = formData;
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { user, isLoading, isError, message } = useSelector((state) => state.auth);

    useEffect(() => {
        // Add the class to the body when the component mounts
        document.body.classList.add('login-background');
        // Remove the class when the component unmounts
        return () => {
            document.body.classList.remove('login-background');
        };
    }, []);

    useEffect(() => {
        if (user) {
            navigate('/');
        }
    }, [user, navigate]);

    const onChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
    const onSubmit = (e) => { e.preventDefault(); dispatch(login(formData)); };
    const handleClickShowPassword = () => setShowPassword(!showPassword);
    const handleMouseDownPassword = (e) => e.preventDefault();

    return (
        // The main container will now be a Box to fill the screen
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '100vh',
            }}

        >
            <Typography component="h1" variant="h4" sx={{ mb: 2 }} color='#651cecff'>
                Inventory Management
            </Typography>
            {/* We use Paper for the glassmorphism effect */}
            <Paper
                elevation={6}
                sx={{
                    p: 4,
                    width: '100%',
                    maxWidth: '400px',
                    borderRadius: 4,
                    // --- THE GLASSMORPHISM EFFECT ---
                    backgroundColor: 'rgba(255, 255, 255, 0.5)', // Semi-transparent background
                    backdropFilter: 'blur(10px)',                // The blur effect
                    border: '1px solid rgba(255, 255, 255, 0.2)', // A subtle border
                    boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)', // A modern shadow
                }}
            >
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <InventoryIcon sx={{ fontSize: 40, mb: 1, color: 'primary.main' }} />
                    <Typography component="h1" variant="h5" sx={{ mb: 2 }} color='black'>
                        Admin Login
                    </Typography>

                    <Box component="form" onSubmit={onSubmit} noValidate sx={{ width: '100%' }}>
                        {isError && <Alert severity="error" sx={{ mb: 2 }}>{message}</Alert>}
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            label="Username"
                            name="username"
                            autoComplete="username"
                            autoFocus
                            value={username}
                            onChange={onChange}
                        />
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            name="password"
                            label="Password"
                            type={showPassword ? 'text' : 'password'}
                            autoComplete="current-password"
                            value={password}
                            onChange={onChange}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            onClick={handleClickShowPassword}
                                            onMouseDown={handleMouseDownPassword}
                                            edge="end"
                                        >
                                            {showPassword ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                        />
                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            size="large"
                            sx={{ mt: 3, mb: 2 }}
                            disabled={isLoading}
                        >
                            {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
                        </Button>
                    </Box>
                </Box>
            </Paper>
        </Box>
    );
};

export default LoginPage;