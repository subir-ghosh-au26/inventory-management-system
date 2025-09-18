import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../api/axiosInstance';

const initialState = {
    officeBoys: [],
    isLoading: false,
    isError: false,
    message: '',
};

// Async Thunk to fetch office boy users
export const getOfficeBoys = createAsyncThunk('users/getOfficeBoys', async (_, thunkAPI) => {
    try {
        const response = await axiosInstance.get('/users/office-boys');
        return response.data;
    } catch (error) {
        const message =
            (error.response?.data?.message) || error.message || error.toString();
        return thunkAPI.rejectWithValue(message);
    }
});

// Async Thunk to create a new office boy user
export const createOfficeBoy = createAsyncThunk('users/createOfficeBoy', async (userData, thunkAPI) => {
    try {
        const response = await axiosInstance.post('/users/office-boys', userData);
        // After successfully creating a user, refetch the list
        thunkAPI.dispatch(getOfficeBoys());
        return response.data;
    } catch (error) {
        const message =
            (error.response?.data?.message) || error.message || error.toString();
        return thunkAPI.rejectWithValue(message);
    }
});

export const updateUser = createAsyncThunk('users/updateUser', async (userData, thunkAPI) => {
    try {
        const { id, ...fields } = userData;
        await axiosInstance.put(`/users/office-boys/${id}`, fields);
        thunkAPI.dispatch(getOfficeBoys());
        toast.success('User updated successfully!');
    } catch (error) {
        const message = error.response?.data?.message || 'Failed to update user.';
        toast.error(message);
        return thunkAPI.rejectWithValue(message);
    }
});

export const userSlice = createSlice({
    name: 'users',
    initialState,
    reducers: {
        reset: (state) => initialState, // Optional: A reducer to reset state
    },
    extraReducers: (builder) => {
        builder
            // Get Office Boys
            .addCase(getOfficeBoys.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(getOfficeBoys.fulfilled, (state, action) => {
                state.isLoading = false;
                state.officeBoys = action.payload;
            })
            .addCase(getOfficeBoys.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            // Create Office Boy
            .addCase(createOfficeBoy.pending, (state) => {
                state.isLoading = true; // Can use a more granular loading state if needed
            })
            .addCase(createOfficeBoy.fulfilled, (state) => {
                state.isLoading = false;
                // The list is refetched by the thunk, no need to manually push
            })
            .addCase(createOfficeBoy.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            });
    },
});

export const { reset } = userSlice.actions;
export default userSlice.reducer;