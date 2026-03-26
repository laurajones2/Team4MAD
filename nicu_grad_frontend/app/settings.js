import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ScrollView, ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { BASE_URL } from '../constants/API';

export const DISPLAY_NAME_KEY = '@nicu_display_name';
export const SERVER_URL_KEY = '@nicu_server_url';

export async function getDisplayName() {
  try {
    const name = await AsyncStorage.getItem(DISPLAY_NAME_KEY);
    return name || 'Nurse';
  } catch {
    return 'Nurse';
  }
}

export default function SettingsScreen() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState('');
  const [serverUrl, setServerUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [name, url] = await Promise.all([
          AsyncStorage.getItem(DISPLAY_NAME_KEY),
          AsyncStorage.getItem(SERVER_URL_KEY),
        ]);
        setDisplayName(name || '');
        setServerUrl(url || BASE_URL);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSave = async () => {
    if (!displayName.trim()) {
      Alert.alert('Required', 'Please enter your display name.');
      return;
    }
    setSaving(true);
    try {
      await Promise.all([
        AsyncStorage.setItem(DISPLAY_NAME_KEY, displayName.trim()),
        AsyncStorage.setItem(SERVER_URL_KEY, serverUrl.trim() || BASE_URL),
      ]);
      Alert.alert('Saved', 'Settings updated.');
    } catch {
      Alert.alert('Error', 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0984e3" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
        <TouchableOpacity onPress={handleSave} disabled={saving}>
          <Text style={[styles.saveButton, saving && styles.saveButtonDisabled]}>
            {saving ? 'Saving…' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your Profile</Text>
        <Text style={styles.label}>Display Name</Text>
        <Text style={styles.hint}>
          This name appears on every log entry — e.g. "Fed by Sarah"
        </Text>
        <TextInput
          style={styles.input}
          value={displayName}
          onChangeText={setDisplayName}
          placeholder="e.g. Sarah, Mike, Nurse Amy"
          returnKeyType="done"
          maxLength={40}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Server (Advanced)</Text>
        <Text style={styles.label}>Backend URL</Text>
        <Text style={styles.hint}>
          Only change this if the server address has moved.
        </Text>
        <TextInput
          style={styles.input}
          value={serverUrl}
          onChangeText={setServerUrl}
          placeholder={BASE_URL}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          returnKeyType="done"
        />
      </View>

      <TouchableOpacity style={styles.saveFullButton} onPress={handleSave} disabled={saving}>
        <Text style={styles.saveFullButtonText}>{saving ? 'Saving…' : 'Save Settings'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    padding: 20,
    backgroundColor: '#f7f9fc',
    flexGrow: 1,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 28,
  },
  backButton: {
    color: '#007AFF',
    fontSize: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  saveButton: {
    color: '#34C759',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonDisabled: {
    color: '#aaa',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0984e3',
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  hint: {
    fontSize: 12,
    color: '#888',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    fontSize: 15,
    backgroundColor: '#fafafa',
  },
  saveFullButton: {
    backgroundColor: '#0984e3',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  saveFullButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
