import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { List, Text, ActivityIndicator, Divider } from 'react-native-paper';
import { getMyHistory } from '../api/inventory';

const HistoryScreen = () => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchHistory = async () => {
        try {
            const response = await getMyHistory();
            setHistory(response.data);
        } catch (error) {
            console.error("Failed to fetch history", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchHistory();
    };

    if (loading) {
        return <ActivityIndicator animating={true} size="large" style={{ flex: 1 }} />;
    }

    const renderItem = ({ item }) => {
        const isPositive = item.quantity_change > 0;
        return (
            <List.Item
                title={item.item_name}
                description={`${item.transaction_type} • ${new Date(item.created_at).toLocaleString()}`}
                right={() => (
                    <Text style={[styles.quantity, { color: isPositive ? 'green' : 'red' }]}>
                        {isPositive ? `+${item.quantity_change}` : item.quantity_change}
                    </Text>
                )}
            />
        );
    };

    return (
        <FlatList
            data={history}
            renderItem={renderItem}
            keyExtractor={(item) => item.id.toString()}
            ItemSeparatorComponent={Divider}
            ListEmptyComponent={<Text style={styles.emptyText}>No transactions found.</Text>}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
        />
    );
};

const styles = StyleSheet.create({
    quantity: {
        fontSize: 16,
        fontWeight: 'bold',
        alignSelf: 'center',
        marginRight: 10,
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 50,
        fontSize: 16,
    }
});

export default HistoryScreen;