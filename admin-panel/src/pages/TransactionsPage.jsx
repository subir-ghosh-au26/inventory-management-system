import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import { getLogs } from '../features/transactions/transactionSlice';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Paper, Typography, Box, Pagination } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

const TransactionsPage = () => {
    const dispatch = useDispatch();
    const { logs, pagination, isLoading } = useSelector((state) => state.transactions);

    const [searchParams, setSearchParams] = useSearchParams();
    const itemIdFromUrl = searchParams.get('itemId');
    const itemNameFromUrl = searchParams.get('itemName');

    // State for controlled components
    const [page, setPage] = useState(parseInt(searchParams.get('page')) || 1);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        // When a search is performed, reset to page 1
        setPage(1);
        const delayDebounceFn = setTimeout(() => {
            const params = { search: searchTerm, page: 1 };
            if (itemIdFromUrl) params.itemId = itemIdFromUrl;
            dispatch(getLogs(params));
        }, 500); // 500ms delay

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm, itemIdFromUrl, dispatch]);

    // Effect for pagination
    useEffect(() => {
        const params = { page, search: searchTerm };
        if (itemIdFromUrl) params.itemId = itemIdFromUrl;
        dispatch(getLogs(params));
    }, [page, dispatch]);

    const handlePageChange = (event, value) => {
        setPage(value);
        const currentParams = Object.fromEntries(searchParams.entries());
        setSearchParams({ ...currentParams, page: value });
    };

    const getQuantityColor = (log) => {
        if (log.transaction_type === 'STOCK_IN' || log.transaction_type === 'RETURN') return 'success.main';
        if (log.transaction_type === 'DISTRIBUTION') return 'error.main';
        return 'text.primary';
    };

    return (
        <Paper sx={{ p: 2 }}>
            <Typography variant="h4" gutterBottom>
                {itemNameFromUrl ? `Transaction History for "${itemNameFromUrl}"` : "Transaction Log"}
            </Typography>
            {/* --- NEW SEARCH BAR --- */}
            {!itemIdFromUrl && ( // Only show the search bar if we're not already filtering by a specific item
                <Paper sx={{ p: 1, mb: 2, display: 'flex', alignItems: 'center' }}>
                    <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    <TextField
                        fullWidth
                        variant="standard"
                        placeholder="Search by Item Name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        InputProps={{ disableUnderline: true }}
                    />
                </Paper>
            )}
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
                                <TableCell>{log.details ? (log.details.distributed_to || log.details.note || log.details.returned_from) : 'N/A'}</TableCell>
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