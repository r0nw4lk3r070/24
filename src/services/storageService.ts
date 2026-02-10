import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@expo_messenger_app';

interface StorageData {
    [key: string]: unknown;
    timestamp: number;
}

export const storeData = async (data: Record<string, unknown>): Promise<void> => {
    try {
        const existingData = await AsyncStorage.getItem(STORAGE_KEY);
        const newData = existingData ? JSON.parse(existingData) : {};
        const timestamp = Date.now();
        newData[timestamp] = { ...data, timestamp };
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
    } catch (error) {
        console.error('Error storing data', error);
    }
};

export const retrieveData = async (): Promise<Record<string, unknown>> => {
    try {
        const jsonValue = await AsyncStorage.getItem(STORAGE_KEY);
        return jsonValue != null ? JSON.parse(jsonValue) : {};
    } catch (error) {
        console.error('Error retrieving data', error);
        return {};
    }
};

export const cleanupOldMessages = async (): Promise<void> => {
    try {
        const jsonValue = await AsyncStorage.getItem(STORAGE_KEY);
        if (jsonValue) {
            const data = JSON.parse(jsonValue);
            const currentTime = Date.now();
            const newData = Object.fromEntries(
                Object.entries(data).filter(([_, value]) => {
                    const val = value as StorageData;
                    return currentTime - val.timestamp < 24 * 60 * 60 * 1000;
                })
            );
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
        }
    } catch (error) {
        console.error('Error cleaning up old messages', error);
    }
};