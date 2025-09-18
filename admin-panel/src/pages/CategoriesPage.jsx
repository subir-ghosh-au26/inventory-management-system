import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../features/categories/categorySlice';
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button,
    Modal, Box, TextField, Typography, CircularProgress, IconButton, Dialog,
    DialogActions, DialogContent, DialogContentText, DialogTitle
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { toast, ToastContainer } from 'react-toastify';

const style = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 400,
    bgcolor: 'background.paper',
    border: '2px solid #000',
    boxShadow: 24,
    p: 4,
    maxHeight: '90vh',
    overflowY: 'auto',
};

const CategoriesPage = () => {
    const dispatch = useDispatch();
    const { categories, isLoading } = useSelector((state) => state.categories);

    const [addModalOpen, setAddModalOpen] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

    const [newCategoryName, setNewCategoryName] = useState('');
    const [currentCategory, setCurrentCategory] = useState(null); // For edit and delete

    useEffect(() => {
        dispatch(getCategories());
    }, [dispatch]);

    // Handlers for Add Modal
    const handleAddModalOpen = () => { setNewCategoryName(''); setAddModalOpen(true); };
    const handleAddModalClose = () => setAddModalOpen(false);
    const handleAddCategory = (e) => {
        e.preventDefault();
        dispatch(createCategory({ name: newCategoryName })).then(action => {
            if (createCategory.fulfilled.match(action)) toast.success('Category created!');
            else toast.error(action.payload || 'Failed to create category.');
        });
        handleAddModalClose();
    };

    // Handlers for Edit Modal
    const handleEditModalOpen = (category) => { setCurrentCategory(category); setEditModalOpen(true); };
    const handleEditModalClose = () => setEditModalOpen(false);
    const handleUpdateCategory = (e) => {
        e.preventDefault();
        dispatch(updateCategory(currentCategory)).then(action => {
            if (updateCategory.fulfilled.match(action)) toast.success('Category updated!');
            else toast.error(action.payload || 'Failed to update category.');
        });
        handleEditModalClose();
    };

    // Handlers for Delete Dialog
    const handleDeleteDialogOpen = (category) => { setCurrentCategory(category); setDeleteDialogOpen(true); };
    const handleDeleteDialogClose = () => setDeleteDialogOpen(false);
    const confirmDeleteCategory = () => {
        dispatch(deleteCategory(currentCategory.id)).then(action => {
            if (deleteCategory.fulfilled.match(action)) toast.success('Category deleted!');
            else toast.error(action.payload || 'Failed to delete category.');
        });
        handleDeleteDialogClose();
    };

    return (
        <Box>
            <ToastContainer />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h4">Categories</Typography>
                <Button variant="contained" onClick={handleAddModalOpen}>Add New Category</Button>
            </Box>

            {/* Add Modal */}
            <Modal open={addModalOpen} onClose={handleAddModalClose}>
                <Box sx={style} component="form" onSubmit={handleAddCategory}>
                    <Typography variant="h6">Add New Category</Typography>
                    <TextField margin="normal" required fullWidth label="Category Name" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} autoFocus />
                    <Button type="submit" variant="contained" sx={{ mt: 2 }}>Create</Button>
                </Box>
            </Modal>

            {/* Edit Modal */}
            {currentCategory && (
                <Modal open={editModalOpen} onClose={handleEditModalClose}>
                    <Box sx={style} component="form" onSubmit={handleUpdateCategory}>
                        <Typography variant="h6">Edit Category</Typography>
                        <TextField margin="normal" required fullWidth label="Category Name" value={currentCategory.name} onChange={(e) => setCurrentCategory({ ...currentCategory, name: e.target.value })} autoFocus />
                        <Button type="submit" variant="contained" sx={{ mt: 2 }}>Save Changes</Button>
                    </Box>
                </Modal>
            )}

            {/* Delete Dialog */}
            <Dialog open={deleteDialogOpen} onClose={handleDeleteDialogClose}>
                <DialogTitle>Confirm Deletion</DialogTitle>
                <DialogContent>
                    <DialogContentText>Are you sure you want to delete the category "{currentCategory?.name}"? Items using this category will become uncategorized.</DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleDeleteDialogClose}>Cancel</Button>
                    <Button onClick={confirmDeleteCategory} color="error">Delete</Button>
                </DialogActions>
            </Dialog>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow><TableCell>Name</TableCell><TableCell align="right">Actions</TableCell></TableRow>
                    </TableHead>
                    <TableBody>
                        {categories.map((cat) => (
                            <TableRow key={cat.id}>
                                <TableCell>{cat.name}</TableCell>
                                <TableCell align="right">
                                    <IconButton onClick={() => handleEditModalOpen(cat)}><EditIcon /></IconButton>
                                    <IconButton onClick={() => handleDeleteDialogOpen(cat)}><DeleteIcon color="error" /></IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};

export default CategoriesPage;