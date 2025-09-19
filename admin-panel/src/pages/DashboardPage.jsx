import React, { useState, useEffect } from 'react';
import { Typography, Grid, Card, CardContent, CircularProgress, Box, Alert, Paper, List, ListItem, ListItemText, Divider, ListItemAvatar, Avatar } from '@mui/material';
import { Pie, Line } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title } from 'chart.js';
import axiosInstance from '../api/axiosInstance';
import StatCard from '../components/StatCard';
// Icons for Stat Cards and Activity Feed
import AllInboxIcon from '@mui/icons-material/AllInbox';
import InventoryIcon from '@mui/icons-material/Inventory';
import WarningIcon from '@mui/icons-material/Warning';
import CategoryIcon from '@mui/icons-material/Category';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';

// Register all necessary Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title);




const DashboardPage = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // State for new components
    const [activity, setActivity] = useState([]);
    const [lowStockItems, setLowStockItems] = useState([]);
    const [categoryChartData, setCategoryChartData] = useState(null);
    const [trendsChartData, setTrendsChartData] = useState(null);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true);
                const [statsRes, activityRes, categoryRes, trendsRes, lowStockRes] = await Promise.all([
                    axiosInstance.get('/dashboard/stats'),
                    axiosInstance.get('/dashboard/recent-activity'),
                    axiosInstance.get('/dashboard/stock-by-category'),
                    axiosInstance.get('/dashboard/distribution-trends'),
                    axiosInstance.get('/dashboard/low-stock-items'),
                ]);

                // Set data for all components
                setStats(statsRes.data);
                setActivity(activityRes.data);
                setLowStockItems(lowStockRes.data);

                // Format data for Pie Chart
                setCategoryChartData({
                    labels: categoryRes.data.map(c => c.name),
                    datasets: [{
                        data: categoryRes.data.map(c => c.item_count),
                        backgroundColor: ['#3f51b5', '#f50057', '#ffc107', '#4caf50', '#9c27b0', '#00bcd4'],
                    }],
                });

                // Format data for Line Chart
                setTrendsChartData({
                    labels: trendsRes.data.map(d => new Date(d.distribution_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
                    datasets: [{
                        label: 'Items Distributed',
                        data: trendsRes.data.map(d => d.total_distributed),
                        borderColor: 'rgb(255, 99, 132)',
                        backgroundColor: 'rgba(255, 99, 132, 0.5)',
                        tension: 0.1,
                    }],
                });

            } catch (err) {
                setError('Failed to fetch dashboard data. Please try again later.');
            } finally {
                setLoading(false);
            }
        };
        fetchDashboardData();
    }, []);

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
    if (error) return <Alert severity="error">{error}</Alert>;

    const getActivityIcon = (log) => {
        if (log.transaction_type === 'STOCK_IN' || log.transaction_type === 'RETURN') {
            return <Avatar sx={{ bgcolor: 'success.light' }}><ArrowUpwardIcon /></Avatar>;
        }
        return <Avatar sx={{ bgcolor: 'error.light' }}><ArrowDownwardIcon /></Avatar>;
    };

    return (
        <Box>
            <Typography variant="h4" gutterBottom>Dashboard Overview</Typography>
            <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard title="Total Stock (All Items)" value={stats?.totalStockCount || 0} icon={<AllInboxIcon />} />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard title="Distinct Item Types" value={stats?.distinctItemCount || 0} icon={<InventoryIcon />} color="secondary.main" />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard title="Items Low on Stock" value={stats?.lowStockItemCount || 0} icon={<WarningIcon />} color={stats?.lowStockItemCount > 0 ? "error.main" : "success.main"} />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard title="Total Categories" value={stats?.categoryCount || 0} icon={<CategoryIcon />} color="info.main" />
                </Grid>
            </Grid>

            <Grid container spacing={2}>
                {/* Left Column */}
                <Grid item xs={12} lg={8}>
                    <Grid container spacing={3}>
                        <Grid item xs={12}>
                            <Paper sx={{ p: 2, height: '400px' }}>
                                <Typography variant="h6" gutterBottom>Distribution Trends (Last 30 Days)</Typography>
                                {trendsChartData && <Line options={{ responsive: true, maintainAspectRatio: false }} data={trendsChartData} />}
                            </Paper>
                        </Grid>
                        <Grid item xs={12}>
                            <Paper sx={{ p: 2 }}>
                                <Typography variant="h6" gutterBottom>Recent Distribution Activity</Typography>
                                <List>
                                    {activity.length > 0 ? activity.map((log, index) => (
                                        <React.Fragment key={log.id}>
                                            <ListItem>
                                                <ListItemAvatar>{getActivityIcon(log)}</ListItemAvatar>
                                                <ListItemText
                                                    primary={
                                                        <Typography component="span" variant="body1">
                                                            <Box component="span" sx={{ fontWeight: 'bold' }}>{log.item_name}</Box>
                                                            {` (${Math.abs(log.quantity_change)})`}
                                                        </Typography>
                                                    }
                                                    secondary={
                                                        <>
                                                            <Typography component="span" variant="body2" color="text.secondary">
                                                                {log.transaction_type === 'DISTRIBUTION' ? 'Distributed to ' : 'Returned from '}
                                                                <Box component="span" sx={{ fontWeight: 'bold' }}>{log.details?.distributed_to || log.details?.returned_from || 'N/A'}</Box>
                                                            </Typography>
                                                            <br />
                                                            {`by ${log.user_name} on ${new Date(log.created_at).toLocaleDateString()}`}
                                                        </>
                                                    }
                                                />
                                            </ListItem>
                                            {index < activity.length - 1 && <Divider variant="inset" component="li" />}
                                        </React.Fragment>
                                    )) : <Typography sx={{ p: 2 }}>No recent distribution or return activity.</Typography>}
                                </List>
                            </Paper>
                        </Grid>
                    </Grid>
                </Grid>

                {/* Right Column */}
                <Grid item xs={12} lg={4}>
                    <Grid container spacing={3}>
                        <Grid item xs={12}>
                            <Paper sx={{ p: 2, height: '400px' }}>
                                <Typography variant="h6" gutterBottom>Stock Levels by Category</Typography>
                                {categoryChartData && <Pie options={{ responsive: true, maintainAspectRatio: false }} data={categoryChartData} />}
                            </Paper>
                        </Grid>
                        <Grid item xs={12}>
                            <Paper sx={{ p: 2 }}>
                                <Typography variant="h6" gutterBottom>Low Stock Items</Typography>
                                {/* ... Low Stock Items List JSX ... */}
                            </Paper>
                        </Grid>
                    </Grid>
                </Grid>
            </Grid>
        </Box>
    );
};

export default DashboardPage;