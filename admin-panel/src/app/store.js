import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import itemReducer from '../features/items/itemSlice';
import userReducer from '../features/users/userSlice';
import categoryReducer from '../features/categories/categorySlice';
import transactionReducer from '../features/transactions/transactionSlice';

export const store = configureStore({
    reducer: {
        auth: authReducer,
        items: itemReducer,
        users: userReducer,
        categories: categoryReducer,
        transactions: transactionReducer,
    },
});