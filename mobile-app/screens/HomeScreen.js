import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Button, Title } from 'react-native-paper';

// The 'navigation' prop is passed to every screen in the navigator
const HomeScreen = ({ navigation }) => {

    const handlePress = (action) => {
        // Navigate to the Scanner screen and pass the action type as a parameter
        navigation.navigate('Scanner', { action: action });
    };

    return (
        <View style={styles.container}>
            <Title style={styles.title}>Select an Action</Title>

            <Button
                icon="qrcode-scan"
                mode="contained"
                onPress={() => handlePress('distribute')}
                style={styles.button}
                contentStyle={styles.buttonContent}
            >
                Scan to Distribute Item
            </Button>

            <Button
                icon="keyboard-return"
                mode="contained"
                onPress={() => handlePress('return')}
                style={styles.button}
                contentStyle={styles.buttonContent}
            >
                Scan to Process Return
            </Button>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#f5f5f5',
    },
    title: {
        marginBottom: 40,
    },
    button: {
        width: '100%',
        marginVertical: 10,
        paddingVertical: 8,
    },
    buttonContent: {
        height: 50,
    },
});

export default HomeScreen;