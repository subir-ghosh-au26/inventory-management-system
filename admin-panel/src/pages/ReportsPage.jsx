import React, { useState } from 'react';
import { Box, Button, Typography, Paper, Divider, TextField } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import axiosInstance from '../api/axiosInstance';
import { saveAs } from 'file-saver';
import { format } from 'date-fns';

const ReportsPage = () => {
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);

    const generateReport = async (endpoint, params = {}) => {
        try {
            const response = await axiosInstance.get(`/reports/${endpoint}`, {
                params,
                responseType: 'blob',
            });
            const date = new Date().toISOString().split('T')[0];
            saveAs(response.data, `${endpoint}-report-${date}.xlsx`);
        } catch (error) {
            toast.error(`Failed to generate ${endpoint} report.`);
        }
    };

    const handleTransactionReport = () => {
        const params = {};
        if (startDate) params.startDate = format(startDate, 'yyyy-MM-dd');
        if (endDate) params.endDate = format(endDate, 'yyyy-MM-dd');
        generateReport('transactions', params);
    };

    return (
        <Paper sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>Generate Reports</Typography>

            <Box sx={{ mb: 3 }}>
                <Typography variant="h6">Inventory Reports</Typography>
                <Button variant="contained" onClick={() => generateReport('stock')} sx={{ mr: 2 }}>Download Current Stock</Button>
                <Button variant="contained" color="warning" onClick={() => generateReport('low-stock')}>Download Low Stock Report</Button>
            </Box>

            <Divider sx={{ my: 3 }} />

            <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>Filtered Transaction Report</Typography>
                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                    <DatePicker label="Start Date" value={startDate} onChange={setStartDate} renderInput={(params) => <TextField {...params} />} />
                    <DatePicker label="End Date" value={endDate} onChange={setEndDate} renderInput={(params) => <TextField {...params} />} />
                </Box>
                <Button variant="contained" onClick={handleTransactionReport} disabled={!startDate || !endDate}>Download Transactions</Button>
            </Box>

            <Divider sx={{ my: 3 }} />

            <Box>
                <Typography variant="h6">Consumption Report</Typography>
                <Button variant="contained" onClick={() => generateReport('consumption')}>Download Consumption Report</Button>
            </Box>
        </Paper>
    );
};
export default ReportsPage;