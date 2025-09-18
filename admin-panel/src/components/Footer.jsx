import React from 'react';
import { Box, Container, Typography, Link, Paper } from '@mui/material';

const Footer = () => {
    return (
        <Paper
            component="footer"
            square
            variant="outlined"
            sx={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                py: 1,
                px: 2,
                backgroundColor: (theme) =>
                    theme.palette.mode === 'light'
                        ? theme.palette.grey[200]
                        : theme.palette.grey[800],
                zIndex: (theme) => theme.zIndex.appBar + 1,
            }}
        >
            <Container maxWidth="lg">
                <Typography variant="body2" color="text.secondary" align="center">
                    {'Copyright © '}
                    <Link color="inherit" href="#">
                        Subir Ghosh
                    </Link>{' '}
                    {new Date().getFullYear()}
                    {'.'}
                </Typography>
            </Container>
        </Paper>
    );
};

export default React.memo(Footer);