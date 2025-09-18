import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

const Loader = () => {
    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                height: 'calc(100vh - 128px)', // Full height minus header/footer
            }}
        >
            <CircularProgress />
            <Typography sx={{ mt: 2 }}>Loading Page...</Typography>
        </Box>
    );
};

export default Loader;