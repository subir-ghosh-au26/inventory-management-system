import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import axiosInstance from '../api/axiosInstance';
import { logout } from '../features/auth/authSlice';
import { getLowStockItems } from '../features/items/itemSlice';
import {
    AppBar, Toolbar, Typography, Button, Box, Drawer, List,
    ListItem, ListItemButton, ListItemIcon, ListItemText, CssBaseline, Popover, Divider
} from '@mui/material';
import Footer from './Footer';
import { useTheme } from '@mui/material/styles';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import { useThemeMode } from '../themeContext.jsx';
import DashboardIcon from '@mui/icons-material/Dashboard';
import InventoryIcon from '@mui/icons-material/Inventory';
import PeopleIcon from '@mui/icons-material/People';
import CategoryIcon from '@mui/icons-material/Category';
import { Badge, IconButton, Tooltip } from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import ReceiptIcon from '@mui/icons-material/Receipt';
import AssessmentRoundedIcon from '@mui/icons-material/AssessmentRounded';

const drawerWidth = 240;

const Layout = () => {
    const theme = useTheme();
    const { toggleThemeMode } = useThemeMode();
    const navigate = useNavigate();
    const location = useLocation();
    const [lowStockCount, setLowStockCount] = useState(0);
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.auth);
    const { lowStockItems } = useSelector((state) => state.items);
    const [anchorEl, setAnchorEl] = useState(null);

    const onLogout = () => {
        dispatch(logout());
        navigate('/login');
    };

    const handleNotificationClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleNotificationClose = () => {
        setAnchorEl(null);
    };

    const open = Boolean(anchorEl);
    const id = open ? 'low-stock-popover' : undefined;


    useEffect(() => {
        dispatch(getLowStockItems());
    }, [location, dispatch]);



    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await axiosInstance.get('/dashboard/stats');
                setLowStockCount(res.data.lowStockItemCount);
            } catch (error) {
                console.error("Could not fetch stats for notification bell.", error);
            }
        };
        fetchStats();
    }, [location]);

    const menuItems = [
        { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
        { text: 'Items', icon: <InventoryIcon />, path: '/items' },
        { text: 'Users', icon: <PeopleIcon />, path: '/users' },
        { text: 'Categories', icon: <CategoryIcon />, path: '/categories' },
        { text: 'Transaction', icon: <ReceiptIcon />, path: '/transactions' },
        { text: 'Report', icon: <AssessmentRoundedIcon />, path: '/reports' },
    ];

    return (
        <Box sx={{ display: 'flex' }}>
            <CssBaseline />
            <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1, color: 'text.primary' }}>
                <Toolbar>
                    <Typography variant="h4" noWrap component="div" sx={{ flexGrow: 1 }}>
                        Inventory Management
                    </Typography>
                    <Typography sx={{ mr: 2 }}>Welcome, {user?.fullName || 'Admin'}</Typography>
                    <Tooltip title="Low Stock Items">
                        <IconButton color="inherit" onClick={handleNotificationClick}>
                            <Badge badgeContent={lowStockItems.length} color="error">
                                <NotificationsIcon />
                            </Badge>
                        </IconButton>
                    </Tooltip>
                    <IconButton sx={{ ml: 1 }} onClick={toggleThemeMode}>
                        {theme.palette.mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
                    </IconButton>
                    <Button color="inherit" onClick={onLogout} style={{ border: '2px solid black' }}>Logout</Button>
                </Toolbar>
            </AppBar>

            <Popover
                id={id}
                open={open}
                anchorEl={anchorEl}
                onClose={handleNotificationClose}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                }}
            >
                <Box sx={{ width: 360, p: 1 }}>
                    <Typography sx={{ p: 1, fontWeight: 'bold' }}>Low Stock Items</Typography>
                    <Divider />
                    {lowStockItems.length > 0 ? (
                        <List>
                            {lowStockItems.map((item) => (
                                <ListItem key={item.id}>
                                    <ListItemText
                                        primary={item.name}
                                        secondary={`In Stock: ${item.current_quantity} (Threshold: ${item.low_stock_threshold})`}
                                    />
                                </ListItem>
                            ))}
                        </List>
                    ) : (
                        <Typography sx={{ p: 2 }}>No items are low on stock.</Typography>
                    )}
                </Box>
            </Popover>

            <Drawer variant="permanent" sx={{ width: drawerWidth, flexShrink: 0, [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' }, }}>
                <Toolbar />
                <Box sx={{ overflow: 'auto' }}>
                    <List>
                        {menuItems.map((item) => (
                            <ListItem key={item.text} disablePadding>
                                <ListItemButton
                                    onClick={() => navigate(item.path)}
                                    selected={location.pathname === item.path}
                                    sx={{
                                        // Custom styles for the selected item
                                        '&.Mui-selected': {
                                            // A gradient background for a modern look
                                            background: `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                                            color: 'white',
                                            boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.2)',
                                            borderRadius: 2,
                                            '&:hover': {
                                                background: `linear-gradient(90deg, ${theme.palette.primary.dark} 0%, ${theme.palette.secondary.dark} 100%)`,
                                            },
                                            '& .MuiListItemIcon-root': {
                                                color: 'white',
                                            },
                                        },
                                        margin: '4px 8px', // Add some space around the items
                                        borderRadius: 2,
                                    }}
                                >
                                    <ListItemIcon>{item.icon}</ListItemIcon>
                                    <ListItemText primary={item.text} />
                                </ListItemButton>
                            </ListItem>
                        ))}
                    </List>
                </Box>
            </Drawer>
            <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
                <Toolbar />
                <Outlet />
                <Footer />
            </Box>

        </Box>
    );
};

export default Layout;