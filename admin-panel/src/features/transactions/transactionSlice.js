import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../api/axiosInstance';

const initialState = { logs: [], pagination: {}, isLoading: false };

export const getLogs = createAsyncThunk('transactions/getLogs', async (params, thunkAPI) => {
    try {
        const response = await axiosInstance.get('/transactions', { params });
        return response.data;
    } catch (error) {
        return thunkAPI.rejectWithValue('Failed to fetch logs.');
    }
});

export const transactionSlice = createSlice({
    name: 'transactions',
    initialState,
    extraReducers: (builder) => {
        builder
            .addCase(getLogs.pending, (state) => { state.isLoading = true; })
            .addCase(getLogs.fulfilled, (state, action) => {
                state.isLoading = false;
                state.logs = action.payload.logs;
                state.pagination = { totalPages: action.payload.totalPages, currentPage: action.payload.currentPage };
            })
            .addCase(getLogs.rejected, (state) => { state.isLoading = false; });
    },
});
export default transactionSlice.reducer;