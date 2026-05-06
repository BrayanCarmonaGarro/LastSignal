import AsyncStorage from '@react-native-async-storage/async-storage';

export async function readStorage<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export async function writeStorage<T>(key: string, value: T): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

export async function removeStorage(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(key);
  } catch {}
}
