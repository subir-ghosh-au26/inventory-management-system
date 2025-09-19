import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../api/axiosInstance';
import { toast } from 'react-toastify';

const initialState = {
    items: [],
    lowStockItems: [],
    pagination: {},
    isLoading: false,
    isError: false,
    message: '',
};

// Async Thunks for all CRUD operations
export const getItems = createAsyncThunk('items/getAll', async (params = {}, thunkAPI) => {
    try {
        // The 'params' object can now contain { page, limit, search }
        // Axios will automatically format this into a query string
        const response = await axiosInstance.get('/items', { params });
        return response.data;
    } catch (error) {
        return thunkAPI.rejectWithValue('Failed to fetch items.');
    }
});

export const createItem = createAsyncThunk('items/create', async (itemData, thunkAPI) => {
    try {
        await axiosInstance.post('/items', itemData);
        thunkAPI.dispatch(getItems()); // Refetch list after creation
        toast.success(`Item "${itemData.name}" created successfully!`);
    } catch (error) {
        const message = error.response?.data?.message || 'Failed to create item.';
        toast.error(message);
        return thunkAPI.rejectWithValue(message);
    }
});

export const updateItem = createAsyncThunk('items/update', async (itemData, thunkAPI) => {
    try {
        const { id, ...fields } = itemData;
        await axiosInstance.put(`/items/${id}`, fields);
        thunkAPI.dispatch(getItems()); // Refetch list
        toast.success(`Item "${itemData.name}" updated successfully!`);
    } catch (error) {
        const message = error.response?.data?.message || 'Failed to update item.';
        toast.error(message);
        return thunkAPI.rejectWithValue(message);
    }
});

export const deleteItem = createAsyncThunk('items/delete', async (itemId, thunkAPI) => {
    try {
        await axiosInstance.delete(`/items/${itemId}`);
        thunkAPI.dispatch(getItems()); // Refetch list
        toast.success('Item deleted successfully!');
    } catch (error) {
        const message = error.response?.data?.message || 'Failed to delete item.';
        toast.error(message);
        return thunkAPI.rejectWithValue(message);
    }
});

export const addStock = createAsyncThunk('items/addStock', async ({ itemId, quantity }, thunkAPI) => {
    try {
        await axiosInstance.post('/transactions/stock-in', { itemId, quantity });
        thunkAPI.dispatch(getItems()); // Refetch list
        toast.success('Stock added successfully!');
    } catch (error) {
        const message = error.response?.data?.message || 'Failed to add stock.';
        toast.error(message);
        return thunkAPI.rejectWithValue(message);
    }
});

export const getLowStockItems = createAsyncThunk('items/getLowStock', async (_, thunkAPI) => {
    try {
        const response = await axiosInstance.get('/dashboard/low-stock-items');
        return response.data;
    } catch (error) {

        return thunkAPI.rejectWithValue('Failed to fetch low stock items.');
    }
});


export const itemSlice = createSlice({
    name: 'items',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(getItems.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(getItems.fulfilled, (state, action) => {
                state.isLoading = false;
                state.items = action.payload.items;
                state.pagination = {
                    totalPages: action.payload.totalPages,
                    currentPage: action.payload.currentPage,
                    totalItems: action.payload.totalItems,
                };
            })
            .addCase(getItems.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            .addCase(getLowStockItems.fulfilled, (state, action) => {
                state.lowStockItems = action.payload;
            });
    },
});

export default itemSlice.reducer;