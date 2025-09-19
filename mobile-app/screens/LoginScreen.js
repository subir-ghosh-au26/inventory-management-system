import React, { useState, useContext } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Button, TextInput, Title } from 'react-native-paper';
import { AuthContext } from '../context/AuthContext';

const LoginScreen = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useContext(AuthContext);

    const handleLogin = async () => {
        setLoading(true);
        try {
            await login(username, password);
        } catch (error) {
            Alert.alert('Login Failed', error.message);
        }
        setLoading(false);
    };

    return (
        <View style={styles.container}>
            <Title style={styles.title}>Inventory Management Login</Title>
            <TextInput
                label="Username"
                value={username}
                onChangeText={setUsername}
                style={styles.input}
                autoCapitalize="none"
            />
            <TextInput
                label="Password"
                value={password}
                onChangeText={setPassword}
                style={styles.input}
                secureTextEntry
            />
            <Button
                mode="contained"
                onPress={handleLogin}
                style={styles.button}
                loading={loading}
                disabled={loading}
            >
                Login
            </Button>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#ddb4b4ff' },
    title: { textAlign: 'center', marginBottom: 30 },
    input: { marginBottom: 15 },
    button: { marginTop: 20, paddingVertical: 8 },
});

export default LoginScreen;