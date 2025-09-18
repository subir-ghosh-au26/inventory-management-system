import React, { createContext, useState, useMemo, useContext } from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';

// This is the context that will be provided to the components
export const ThemeModeContext = createContext({
    toggleThemeMode: () => { },
});

// This is a custom hook to easily access the context
export const useThemeMode = () => useContext(ThemeModeContext);

// This component will wrap our app and provide the theme logic
export const ThemeModeProvider = ({ children }) => {
    // Get the saved mode from localStorage or default to 'light'
    const [mode, setMode] = useState(localStorage.getItem('themeMode') || 'light');

    const themeMode = useMemo(
        () => ({
            toggleThemeMode: () => {
                setMode((prevMode) => {
                    const newMode = prevMode === 'light' ? 'dark' : 'light';
                    // Save the new mode to localStorage
                    localStorage.setItem('themeMode', newMode);
                    return newMode;
                });
            },
        }),
        [],
    );

    // Create the MUI theme based on the current mode
    const theme = useMemo(
        () =>
            createTheme({
                palette: {
                    mode, // This is the key that switches between light and dark palettes
                    ...(mode === 'light'
                        ? {
                            // Palette values for light mode
                            primary: { main: '#3f51b5' },
                            secondary: { main: '#f50057' },
                            background: { default: '#f4f6f8', paper: '#ffffff' },
                        }
                        : {
                            // Palette values for dark mode
                            primary: { main: '#90caf9' }, // A lighter blue for dark mode
                            secondary: { main: '#f48fb1' }, // A lighter pink
                            background: { default: '#121212', paper: '#1e1e1e' },
                            text: { primary: '#fff', secondary: '#b0bec5' },
                        }),
                },

                components: {
                    MuiAppBar: {
                        styleOverrides: {
                            root: {
                                backgroundColor: mode === 'light' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(30, 30, 30, 0.7)',
                                backdropFilter: 'blur(10px)',
                                boxShadow: 'none',
                            }
                        }
                    },
                    MuiDrawer: {
                        styleOverrides: {
                            paper: {
                                backgroundColor: mode === 'light' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(30, 30, 30, 0.7)',
                                backdropFilter: 'blur(10px)',
                            }
                        }
                    },

                }
            }),
        [mode],
    );

    return (
        <ThemeModeContext.Provider value={themeMode}>
            <ThemeProvider theme={theme}>{children}</ThemeProvider>
        </ThemeModeContext.Provider>
    );
};