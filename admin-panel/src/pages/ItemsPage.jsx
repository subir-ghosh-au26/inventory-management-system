import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { getItems, createItem, updateItem, deleteItem, addStock } from '../features/items/itemSlice';
import { getCategories } from '../features/categories/categorySlice';
import { QRCodeSVG as QRCode } from 'qrcode.react';
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button,
    Modal, Box, TextField, Typography, CircularProgress, IconButton, Dialog, DialogActions,
    DialogContent, DialogContentText, DialogTitle, MenuItem, Select, InputLabel, FormControl, Pagination
} from '@mui/material';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import SearchIcon from '@mui/icons-material/Search';
import QrCodeIcon from '@mui/icons-material/QrCode';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PrintIcon from '@mui/icons-material/Print';
import HistoryIcon from '@mui/icons-material/History';

// Reusable style object for all modals
const style = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 450,
    bgcolor: 'background.paper',
    border: '2px solid #000',
    boxShadow: 24,
    p: 4,
    maxHeight: '90vh',
    overflowY: 'auto',
};

const ItemsPage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { items, isLoading } = useSelector((state) => state.items);
    const { categories } = useSelector((state) => state.categories);

    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(1);

    // Modal Visibility States
    const [addModalOpen, setAddModalOpen] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [stockModalOpen, setStockModalOpen] = useState(false);
    const [qrModalOpen, setQrModalOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

    // Data Management States
    const [currentItem, setCurrentItem] = useState(null);
    const [quantityToAdd, setQuantityToAdd] = useState(1);
    const [newItem, setNewItem] = useState({
        sku: '', name: '', category_id: '', quantity: 0,
        low_stock_threshold: 10, unit_of_measurement: '', description: ''
    });

    // Effect for handling pagination changes
    useEffect(() => {
        dispatch(getItems({ page, search: searchTerm }));
    }, [page, dispatch]);

    // Initial data fetch for categories
    useEffect(() => {
        dispatch(getCategories());
    }, [dispatch]);

    const handlePageChange = (event, value) => {
        setPage(value);
    };
    // --- Generic Handlers for Modals and Forms ---
    const handleOpenModal = (modalSetter, item = null) => {
        setCurrentItem(item);
        if (modalSetter === setAddModalOpen) {
            setNewItem({ sku: '', name: '', category_id: '', quantity: 0, low_stock_threshold: 10, unit_of_measurement: '', description: '' });
        }
        if (modalSetter === setStockModalOpen) {
            setQuantityToAdd(1);
        }
        modalSetter(true);
    };

    const handleViewHistory = (item) => {
        // This navigates to the transactions page and adds a URL parameter
        navigate(`/transactions?itemId=${item.id}&itemName=${encodeURIComponent(item.name)}`);
    };

    const handleCloseAll = () => {
        setAddModalOpen(false);
        setEditModalOpen(false);
        setStockModalOpen(false);
        setQrModalOpen(false);
        setDeleteDialogOpen(false);
        setCurrentItem(null);
    };

    const handleFormChange = (e, formSetter) => {
        formSetter(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = (e, action, data) => {
        e.preventDefault();
        dispatch(action(data));
        handleCloseAll();
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h4">Inventory Items</Typography>
                <Button variant="contained" onClick={() => handleOpenModal(setAddModalOpen)}>Add New Item</Button>
            </Box>
            <Paper sx={{ p: 2, mb: 2, display: 'flex', alignItems: 'center' }}>
                <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                <TextField
                    fullWidth
                    variant="standard"
                    placeholder="Search by Item Name or SKU..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{ disableUnderline: true }}
                />
            </Paper>

            {/* --- Modals & Dialogs --- */}
            {/* ADD ITEM MODAL */}
            <Modal open={addModalOpen} onClose={handleCloseAll}>
                <Box sx={style} component="form" onSubmit={(e) => handleSubmit(e, createItem, newItem)}>
                    <Typography variant="h6">Add a New Item</Typography>
                    <TextField margin="normal" required fullWidth label="SKU" name="sku" value={newItem.sku} onChange={(e) => handleFormChange(e, setNewItem)} />
                    <TextField margin="normal" required fullWidth label="Item Name" name="name" value={newItem.name} onChange={(e) => handleFormChange(e, setNewItem)} />
                    <FormControl fullWidth margin="normal" required>
                        <InputLabel>Category</InputLabel>
                        <Select name="category_id" value={newItem.category_id} label="Category" onChange={(e) => handleFormChange(e, setNewItem)}>
                            {categories.map((cat) => <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>)}
                        </Select>
                    </FormControl>
                    <TextField margin="normal" required fullWidth label="Initial Quantity" name="quantity" type="number" inputProps={{ min: 0 }} value={newItem.quantity} onChange={(e) => handleFormChange(e, setNewItem)} />
                    <TextField margin="normal" required fullWidth label="Low Stock Threshold" name="low_stock_threshold" type="number" inputProps={{ min: 0 }} value={newItem.low_stock_threshold} onChange={(e) => handleFormChange(e, setNewItem)} />
                    <TextField margin="normal" required fullWidth label="Unit (e.g., pcs, box)" name="unit_of_measurement" value={newItem.unit_of_measurement} onChange={(e) => handleFormChange(e, setNewItem)} />
                    <Button type="submit" variant="contained" sx={{ mt: 2 }}>Create Item</Button>
                </Box>
            </Modal>

            {currentItem && <>
                <Modal open={editModalOpen} onClose={handleCloseAll}>
                    <Box sx={style} component="form" onSubmit={(e) => handleSubmit(e, updateItem, currentItem)}>
                        <Typography variant="h6">Edit Item</Typography>
                        <TextField margin="normal" required fullWidth label="Item Name" name="name" value={currentItem.name} onChange={(e) => handleFormChange(e, setCurrentItem)} />
                        <FormControl fullWidth margin="normal" required>
                            <InputLabel>Category</InputLabel>
                            <Select name="category_id" value={currentItem.category_id} label="Category" onChange={(e) => handleFormChange(e, setCurrentItem)}>
                                {categories.map((cat) => <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>)}
                            </Select>
                        </FormControl>
                        <TextField margin="normal" required fullWidth label="Low Stock Threshold" name="low_stock_threshold" type="number" inputProps={{ min: 0 }} value={currentItem.low_stock_threshold} onChange={(e) => handleFormChange(e, setCurrentItem)} />
                        <TextField margin="normal" required fullWidth label="Unit" name="unit_of_measurement" value={currentItem.unit_of_measurement} onChange={(e) => handleFormChange(e, setCurrentItem)} />
                        <Button type="submit" variant="contained" sx={{ mt: 2 }}>Save Changes</Button>
                    </Box>
                </Modal>

                <Modal open={stockModalOpen} onClose={handleCloseAll}>
                    <Box sx={style} component="form" onSubmit={(e) => handleSubmit(e, addStock, { itemId: currentItem.id, quantity: quantityToAdd })}>
                        <Typography variant="h6">Add Stock for "{currentItem.name}"</Typography>
                        <TextField margin="normal" required fullWidth label="Quantity to Add" type="number" value={quantityToAdd} onChange={(e) => setQuantityToAdd(e.target.value)} autoFocus inputProps={{ min: 1 }} />
                        <Button type="submit" variant="contained" sx={{ mt: 2 }}>Add Stock</Button>
                    </Box>
                </Modal>

                <Modal open={qrModalOpen} onClose={handleCloseAll}>
                    <Box sx={style} className="printable-area">
                        <Typography variant="h6" component="h2" align="center">{currentItem.name}</Typography>
                        <Typography variant="body2" align="center" gutterBottom>SKU: {currentItem.sku}</Typography>
                        <Box sx={{ textAlign: 'center', my: 2 }}>
                            <QRCode value={currentItem.sku} size={256} marginSize={true} />
                        </Box>
                        <Button onClick={handlePrint} variant="contained" startIcon={<PrintIcon />} fullWidth className="no-print">Print QR Code</Button>
                    </Box>
                </Modal>

                <Dialog open={deleteDialogOpen} onClose={handleCloseAll}>
                    <DialogTitle>Confirm Deletion</DialogTitle>
                    <DialogContent><DialogContentText>Are you sure you want to delete "{currentItem.name}"?</DialogContentText></DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseAll}>Cancel</Button>
                        <Button onClick={() => handleSubmit({ preventDefault: () => { } }, deleteItem, currentItem.id)} color="error">Delete</Button>
                    </DialogActions>
                </Dialog>
            </>}

            {/* --- TABLE --- */}
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>SKU</TableCell><TableCell>Name</TableCell><TableCell>Category</TableCell>
                            <TableCell align="right">Current Quantity</TableCell><TableCell align="center">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {isLoading ? <TableRow><TableCell colSpan={5} align="center"><CircularProgress /></TableCell></TableRow> :
                            items.map((item) => (
                                <TableRow key={item.id} hover sx={{ backgroundColor: item.current_quantity <= item.low_stock_threshold ? '#ebabb5ff' : 'inherit' }}>
                                    <TableCell>{item.sku}</TableCell>
                                    <TableCell>{item.name}</TableCell>
                                    <TableCell>{item.category_name || 'N/A'}</TableCell>
                                    <TableCell align="right">{item.current_quantity}</TableCell>
                                    <TableCell align="center">
                                        <IconButton size="small" title="Add Stock" onClick={() => handleOpenModal(setStockModalOpen, item)}><AddShoppingCartIcon fontSize="small" /></IconButton>
                                        <IconButton size="small" title="View History" onClick={() => handleViewHistory(item)}>
                                            <HistoryIcon fontSize="small" />
                                        </IconButton>
                                        <IconButton size="small" title="Generate QR" onClick={() => handleOpenModal(setQrModalOpen, item)}><QrCodeIcon fontSize="small" /></IconButton>
                                        <IconButton size="small" title="Edit" onClick={() => handleOpenModal(setEditModalOpen, item)}><EditIcon fontSize="small" /></IconButton>
                                        <IconButton size="small" title="Delete" onClick={() => handleOpenModal(setDeleteDialogOpen, item)}><DeleteIcon fontSize="small" color="error" /></IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                    </TableBody>
                </Table>
            </TableContainer>
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2, p: 2 }}>
                <Pagination
                    count={Pagination.totalPages || 0}
                    page={page}
                    onChange={handlePageChange}
                    color="primary"
                />
            </Box>
        </Box>
    );
};

export default ItemsPage;