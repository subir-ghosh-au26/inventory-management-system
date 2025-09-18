import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../api/axiosInstance';

const initialState = {
    categories: [],
    isLoading: false,
    isError: false,
    message: '',
};

export const getCategories = createAsyncThunk('categories/getAll', async (_, thunkAPI) => {
    try {
        const response = await axiosInstance.get('/categories');
        return response.data;
    } catch (error) {
        return thunkAPI.rejectWithValue('Failed to fetch categories.');
    }
});

export const createCategory = createAsyncThunk('categories/create', async (categoryData, thunkAPI) => {
    try {
        const response = await axiosInstance.post('/categories', categoryData);
        thunkAPI.dispatch(getCategories()); // Refresh list after creation
        return response.data;
    } catch (error) {
        return thunkAPI.rejectWithValue(error.response.data.message);
    }
});

export const updateCategory = createAsyncThunk('categories/update', async (categoryData, thunkAPI) => {
    try {
        const { id, name } = categoryData;
        const response = await axiosInstance.put(`/categories/${id}`, { name });
        thunkAPI.dispatch(getCategories()); // Refresh list after update
        return response.data;
    } catch (error) {
        return thunkAPI.rejectWithValue(error.response.data.message);
    }
});

export const deleteCategory = createAsyncThunk('categories/delete', async (categoryId, thunkAPI) => {
    try {
        await axiosInstance.delete(`/categories/${categoryId}`);
        thunkAPI.dispatch(getCategories()); // Refresh list after deletion
        return categoryId;
    } catch (error) {
        return thunkAPI.rejectWithValue(error.response.data.message);
    }
});

export const categorySlice = createSlice({
    name: 'categories',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            // getCategories
            .addCase(getCategories.pending, (state) => { state.isLoading = true; })
            .addCase(getCategories.fulfilled, (state, action) => {
                state.isLoading = false;
                state.categories = action.payload;
            })
            // createCategory, updateCategory, deleteCategory all share similar loading/error states
            .addMatcher(
                (action) => [createCategory.pending, updateCategory.pending, deleteCategory.pending].includes(action.type),
                (state) => {
                    state.isLoading = true; // Use a more granular loading state if needed
                }
            )
            .addMatcher(
                (action) => [createCategory.fulfilled, updateCategory.fulfilled, deleteCategory.fulfilled].includes(action.type),
                (state) => {
                    state.isLoading = false;
                    state.isError = false;
                    state.message = '';
                }
            )
            .addMatcher(
                (action) => [createCategory.rejected, updateCategory.rejected, deleteCategory.rejected, getCategories.rejected].includes(action.type),
                (state, action) => {
                    state.isLoading = false;
                    state.isError = true;
                    state.message = action.payload;
                }
            );
    },
});

export default categorySlice.reducer;