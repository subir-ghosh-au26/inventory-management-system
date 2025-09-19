import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Button, TextInput, Text, Title, ActivityIndicator, HelperText } from 'react-native-paper';
import { getItemBySku, distributeItem, returnItem } from '../api/inventory';
import { Picker } from '@react-native-picker/picker';
import Toast from 'react-native-toast-message';

const FormScreen = ({ route, navigation }) => {
    const { sku, action } = route.params;

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [item, setItem] = useState(null); // To store fetched item details

    // Form fields state
    const [quantity, setQuantity] = useState('1');
    const [distributedTo, setDistributedTo] = useState('');
    const [returnedFrom, setReturnedFrom] = useState('');
    const [returnReason, setReturnReason] = useState('Unused / Surplus');
    const [notes, setNotes] = useState('');

    // Fetch item details when the screen loads
    useEffect(() => {
        // Set the screen title dynamically
        navigation.setOptions({ title: action === 'distribute' ? 'Distribute Item' : 'Process Return' });

        const fetchItem = async () => {
            try {
                const response = await getItemBySku(sku);
                setItem(response.data);
            } catch (error) {
                Alert.alert('Error', 'Item not found. Please scan a valid QR code.');
                navigation.goBack(); // Go back if item not found
            } finally {
                setLoading(false);
            }
        };
        fetchItem();
    }, [sku]);

    const handleSubmit = async () => {
        if (!quantity || parseInt(quantity) <= 0) {
            Alert.alert('Invalid Input', 'Please enter a valid quantity.');
            return;
        }

        if ((action === 'distribute' && !distributedTo.trim()) || (action === 'return' && !returnedFrom.trim())) {
            Alert.alert('Invalid Input', 'The "Distribute To / Returned From " field cannot be empty.');
            return; // Stop the function here
        }

        setSubmitting(true);
        try {
            if (action === 'distribute') {
                const data = {
                    itemId: item.id,
                    quantity: parseInt(quantity),
                    details: { distributed_to: distributedTo, notes: notes },
                };
                await distributeItem(data);
                Toast.show({
                    type: 'success',
                    text1: 'Success',
                    text2: 'Item distributed successfully!'
                });
            } else { // action is 'return'
                const data = {
                    itemId: item.id,
                    quantity: parseInt(quantity),
                    details: { returned_from: returnedFrom, reason: returnReason, notes: notes },
                };
                await returnItem(data);
                Toast.show({
                    type: 'success',
                    text1: 'Success',
                    text2: 'Item return processed successfully!'
                });
            }
            navigation.navigate('Home'); // Go back to home screen on success
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'An unexpected error occurred.';
            Toast.show({
                type: 'error',
                text1: 'Submission Failed',
                text2: errorMessage
            });
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return <ActivityIndicator animating={true} size="large" style={{ flex: 1 }} />;
    }

    return (
        <View style={styles.container}>
            <Title>Item: {item?.name}</Title>
            <Text>SKU: {item?.sku}</Text>
            <HelperText type="info" visible={action === 'distribute'}>
                Available Stock: {item?.current_quantity}
            </HelperText>

            <TextInput
                label={action === 'distribute' ? 'Quantity to Distribute' : 'Quantity to Return'}
                value={quantity}
                onChangeText={setQuantity}
                keyboardType="number-pad"
                style={styles.input}
            />

            {action === 'distribute' ? (
                <TextInput label="Distribute To (e.g., Department, Person)" value={distributedTo} onChangeText={setDistributedTo} style={styles.input} />
            ) : (
                <>
                    <TextInput label="Returned From (e.g., Department, Person)" value={returnedFrom} onChangeText={setReturnedFrom} style={styles.input} />
                    <Text style={styles.pickerLabel}>Reason for Return</Text>
                    <View style={styles.pickerContainer}>
                        <Picker selectedValue={returnReason} onValueChange={(itemValue) => setReturnReason(itemValue)}>
                            <Picker.Item label="Unused / Surplus" value="Unused / Surplus" />
                            <Picker.Item label="Damaged / Faulty" value="Damaged / Faulty" />
                            <Picker.Item label="Other" value="Other" />
                        </Picker>
                    </View>
                </>
            )}

            <TextInput label="Notes (Optional)" value={notes} onChangeText={setNotes} style={styles.input} multiline />

            <Button mode="contained" onPress={handleSubmit} style={styles.button} loading={submitting} disabled={submitting}>
                Submit
            </Button>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20 },
    input: { marginBottom: 15 },
    button: { marginTop: 20, paddingVertical: 8 },
    pickerLabel: { color: '#6200ee', fontSize: 12, marginLeft: 10, marginTop: 10 },
    pickerContainer: { borderWidth: 1, borderColor: 'gray', borderRadius: 4, marginBottom: 15 },
});

export default FormScreen;