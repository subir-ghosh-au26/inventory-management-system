import React, { useState, useEffect } from 'react';
import { Text, View, StyleSheet, Button } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useIsFocused } from '@react-navigation/native';

const ScannerScreen = ({ navigation, route }) => {
    const [permission, requestPermission] = useCameraPermissions();
    const [scanned, setScanned] = useState(false);

    const { action } = route.params;
    const isFocused = useIsFocused();


    useEffect(() => {

        if (isFocused) {
            setScanned(false);
        }
    }, [isFocused]);

    // The handler function logic remains the same
    const handleBarcodeScanned = ({ type, data }) => {
        setScanned(true);
        navigation.navigate('Form', { sku: data, action: action });
    };


    if (!permission) {
        // Camera permissions are still loading
        return <View />;
    }

    if (!permission.granted) {
        // Camera permissions are not granted yet
        return (
            <View style={styles.permissionContainer}>
                <Text style={{ textAlign: 'center' }}>We need your permission to show the camera</Text>
                <Button onPress={requestPermission} title="Grant Permission" />
            </View>
        );
    }


    return (
        <View style={styles.container}>
            <CameraView
                onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
                barcodeScannerSettings={{
                    barcodeTypes: ["qr"],
                }}
                style={StyleSheet.absoluteFillObject}
            />
            <View style={styles.overlay}>
                <Text style={styles.text}>Scan the item's QR code</Text>
                <View style={styles.scannerBox} />
            </View>

            {scanned && (
                <View style={styles.scanAgainButton}>
                    <Button title={'Tap to Scan Again'} onPress={() => setScanned(false)} />
                </View>
            )}
        </View>
    );
};


const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
    },
    permissionContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    text: {
        fontSize: 18,
        color: 'white',
        backgroundColor: 'rgba(0,0,0,0.6)',
        padding: 10,
        borderRadius: 5,
        marginBottom: 20,
    },
    scannerBox: {
        width: 250,
        height: 250,
        borderWidth: 2,
        borderColor: 'white',
        borderRadius: 10,
    },
    scanAgainButton: {
        position: 'absolute',
        bottom: 50,
        left: 20,
        right: 20,
    },
});

export default ScannerScreen;