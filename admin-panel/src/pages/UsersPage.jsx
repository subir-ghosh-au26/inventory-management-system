import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { getOfficeBoys, createOfficeBoy, updateUser } from '../features/users/userSlice';
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button,
    Modal, Box, TextField, Typography, CircularProgress, IconButton, Dialog, DialogActions,
    DialogContent, DialogContentText, DialogTitle, Switch, FormControlLabel, Tooltip
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import BlockIcon from '@mui/icons-material/Block';
import { toast } from 'react-toastify';

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

const UsersPage = () => {
    const dispatch = useDispatch();
    const { officeBoys, isLoading } = useSelector((state) => state.users);

    const [addModalOpen, setAddModalOpen] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [newUser, setNewUser] = useState({ fullName: '', username: '', password: '' });
    const [editUser, setEditUser] = useState({ fullName: '', username: '', password: '' });

    useEffect(() => { dispatch(getOfficeBoys()); }, [dispatch]);

    // --- Handlers ---
    const handleOpenModal = (modalSetter, user = null) => {
        setCurrentUser(user);
        if (modalSetter === setAddModalOpen) setNewUser({ fullName: '', username: '', password: '' });
        if (modalSetter === setEditModalOpen) setEditUser({ fullName: user.full_name, username: user.username, password: '' });
        modalSetter(true);
    };

    const handleCloseAll = () => {
        setAddModalOpen(false);
        setEditModalOpen(false);
        setDeactivateDialogOpen(false);
    };

    const handleSubmit = (e, action, data) => {
        e.preventDefault();
        dispatch(action(data));
        handleCloseAll();
    };

    const handleDeactivate = () => {
        dispatch(updateUser({ id: currentUser.id, isActive: false }));
        handleCloseAll();
    };

    const handleStatusChange = (user) => {
        const newStatus = !user.is_active;
        dispatch(updateUser({ id: user.id, isActive: newStatus }));
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h4">User Management</Typography>
                <Button variant="contained" onClick={() => handleOpenModal(setAddModalOpen)}>Create Office Boy</Button>
            </Box>

            {/* ADD MODAL */}
            <Modal open={addModalOpen} onClose={handleCloseAll}>
                <Box sx={style} component="form" onSubmit={(e) => handleSubmit(e, createOfficeBoy, newUser)}>
                    <Typography variant="h6">Create New User</Typography>
                    <TextField margin="normal" required fullWidth label="Full Name" name="fullName" value={newUser.fullName} onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })} />
                    <TextField margin="normal" required fullWidth label="Username" name="username" value={newUser.username} onChange={(e) => setNewUser({ ...newUser, username: e.target.value })} />
                    <TextField margin="normal" required fullWidth label="Password" name="password" type="password" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} />
                    <Button type="submit" variant="contained" sx={{ mt: 2 }}>Create</Button>
                </Box>
            </Modal>

            {/* EDIT MODAL */}
            {currentUser && <Modal open={editModalOpen} onClose={handleCloseAll}>
                <Box sx={style} component="form" onSubmit={(e) => handleSubmit(e, updateUser, { id: currentUser.id, ...editUser })}>
                    <Typography variant="h6">Edit User</Typography>
                    <TextField margin="normal" required fullWidth label="Full Name" value={editUser.fullName} onChange={(e) => setEditUser({ ...editUser, fullName: e.target.value })} />
                    <TextField margin="normal" required fullWidth label="Username" value={editUser.username} onChange={(e) => setEditUser({ ...editUser, username: e.target.value })} />
                    <TextField margin="normal" fullWidth label="New Password (optional)" type="password" helperText="Leave blank to keep current password" onChange={(e) => setEditUser({ ...editUser, password: e.target.value })} />
                    <Button type="submit" variant="contained" sx={{ mt: 2 }}>Save Changes</Button>
                </Box>
            </Modal>}

            {/* DEACTIVATE DIALOG */}
            {currentUser && <Dialog open={deactivateDialogOpen} onClose={handleCloseAll}>
                <DialogTitle>Confirm Deactivation</DialogTitle>
                <DialogContent><DialogContentText>Are you sure you want to deactivate user "{currentUser.full_name}"?</DialogContentText></DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseAll}>Cancel</Button>
                    <Button onClick={handleDeactivate} color="error">Deactivate</Button>
                </DialogActions>
            </Dialog>}

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Full Name</TableCell><TableCell>Username</TableCell>
                            <TableCell align="center">Status</TableCell><TableCell align="center">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {officeBoys.map((user) => (
                            <TableRow key={user.id} hover>
                                <TableCell>{user.full_name}</TableCell>
                                <TableCell>{user.username}</TableCell>
                                <TableCell align="center">
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={user.is_active}
                                                onChange={() => handleStatusChange(user)}
                                                color="success"
                                            />
                                        }
                                        label={user.is_active ? 'Active' : 'Inactive'}
                                    />
                                </TableCell>
                                <TableCell align="center">
                                    <Tooltip title="Edit User"><IconButton onClick={() => handleOpenModal(setEditModalOpen, user)}><EditIcon /></IconButton></Tooltip>
                                    {user.is_active && <Tooltip title="Deactivate User"><IconButton onClick={() => handleOpenModal(setDeactivateDialogOpen, user)}><BlockIcon color="error" /></IconButton></Tooltip>}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};
export default UsersPage;