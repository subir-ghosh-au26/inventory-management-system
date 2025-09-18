import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { getLogs } from '../features/transactions/transactionSlice';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography, Box, Pagination } from '@mui/material';

const TransactionsPage = () => {
    const dispatch = useDispatch();
    const { logs, pagination, isLoading } = useSelector((state) => state.transactions);
    const [page, setPage] = useState(1);

    useEffect(() => {
        dispatch(getLogs({ page }));
    }, [dispatch, page]);

    const handlePageChange = (event, value) => {
        setPage(value);
    };

    const getQuantityColor = (log) => {
        if (log.transaction_type === 'STOCK_IN' || log.transaction_type === 'RETURN') return 'success.main';
        if (log.transaction_type === 'DISTRIBUTION') return 'error.main';
        return 'text.primary';
    };

    return (
        <Paper sx={{ p: 2 }}>
            <Typography variant="h4" gutterBottom>Transaction Log</Typography>
            <TableContainer>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Date</TableCell><TableCell>Item</TableCell><TableCell>User</TableCell>
                            <TableCell>Type</TableCell><TableCell align="right">Quantity Change</TableCell>
                            <TableCell>Details</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {logs.map(log => (
                            <TableRow key={log.id}>
                                <TableCell>{new Date(log.created_at).toLocaleString()}</TableCell>
                                <TableCell>{log.item_name}</TableCell>
                                <TableCell>{log.user_name}</TableCell>
                                <TableCell>{log.transaction_type}</TableCell>
                                <TableCell align="right" sx={{ color: getQuantityColor(log), fontWeight: 'bold' }}>
                                    {log.quantity_change > 0 ? `+${log.quantity_change}` : log.quantity_change}
                                </TableCell>
                                <TableCell>{log.details ? (log.details.distributed_to || log.details.note) : 'N/A'}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                <Pagination count={pagination.totalPages || 1} page={page} onChange={handlePageChange} />
            </Box>
        </Paper>
    );
};
export default TransactionsPage;