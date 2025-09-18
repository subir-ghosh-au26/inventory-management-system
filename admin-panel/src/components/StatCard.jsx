import React from 'react';
import { Paper, Box, Avatar, Typography } from '@mui/material';

const StatCard = ({ title, value, icon, color }) => {
    return (
        <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar sx={{ bgcolor: color || 'primary.main', width: 56, height: 56, mr: 2 }}>
                    {icon}
                </Avatar>
                <Box>
                    <Typography color="text.secondary">{title}</Typography>
                    <Typography variant="h4" component="div">
                        {value}
                    </Typography>
                </Box>
            </Box>
        </Paper>
    );
};

export default React.memo(StatCard);