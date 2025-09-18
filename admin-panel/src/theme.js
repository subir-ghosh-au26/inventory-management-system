import { createTheme } from '@mui/material/styles';

// Create a theme instance.
const theme = createTheme({
    palette: {
        // You can switch to 'dark' for a dark mode
        mode: 'light',
        primary: {
            main: '#3f51b5', // A professional indigo
        },
        secondary: {
            main: '#f50057', // A vibrant pink accent
        },
        background: {
            default: '#f4f6f8', // A very light grey for the main background
            paper: '#ffffff',   // White for cards, tables, etc.
        },
    },
    typography: {
        fontFamily: '"Poppins", "Roboto", "Helvetica", "Arial", sans-serif',
        h4: {
            fontWeight: 600,
        },
        h5: {
            fontWeight: 600,
        },
        h6: {
            fontWeight: 600,
        },
    },
    // Overriding default component styles
    components: {
        MuiPaper: {
            styleOverrides: {
                root: {
                    borderRadius: 12, // More rounded corners for Paper
                    boxShadow: 'rgba(149, 157, 165, 0.2) 0px 8px 24px', // A softer, modern shadow
                },
            },
        },
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: 8,
                    textTransform: 'none', // Buttons will use normal case, not UPPERCASE
                    fontWeight: 600,
                },
            },
        },
        MuiAppBar: {
            styleOverrides: {
                root: {
                    // Frosted glass effect
                    backgroundColor: 'rgba(255, 255, 255, 0.7)',
                    backdropFilter: 'blur(10px)',
                    boxShadow: 'none',
                    borderBottom: '1px solid rgba(0, 0, 0, 0.12)'
                }
            }
        },
        MuiDrawer: {
            styleOverrides: {
                paper: {
                    // Frosted glass effect for the sidebar
                    backgroundColor: 'rgba(255, 255, 255, 0.7)',
                    backdropFilter: 'blur(10px)',
                    borderRight: '1px solid rgba(0, 0, 0, 0.12)',
                }
            }
        }
    },
});

export default theme;