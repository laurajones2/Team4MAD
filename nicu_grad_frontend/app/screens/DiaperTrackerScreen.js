import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, StyleSheet, Alert
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../../constants/API';
import { DISPLAY_NAME_KEY } from '../settings';

export default function DiaperTrackerScreen() {
  const router = useRouter();
  const [loggedBy, setLoggedByState] = useState('');

  useEffect(() => {
    AsyncStorage.getItem(DISPLAY_NAME_KEY).then(name => {
      if (name) setLoggedByState(name);
    });
  }, []);

  const [wetCount, setWetCount] = useState('');
  const [dirtyCount, setDirtyCount] = useState('');
  const [diaperWeight, setDiaperWeight] = useState('');
  const [stoolNotes, setStoolNotes] = useState('');
  const [changeTime, setChangeTime] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);

  const clearForm = () => {
    setWetCount('');
    setDirtyCount('');
    setDiaperWeight('');
    setStoolNotes('');
  };

  const handleSave = async () => {
    if (!wetCount || !dirtyCount) {
      Alert.alert('Missing Info', 'Wet and dirty diaper counts are required.');
      return;
    }

    const payload = {
      wetCount: parseInt(wetCount),
      dirtyCount: parseInt(dirtyCount),
      diaperWeight: diaperWeight ? parseFloat(diaperWeight) : null,
      stoolNotes: stoolNotes.trim(),
      loggedBy: loggedBy || null,
      measuredAt: changeTime.toISOString(),
    };

    console.log('Saving diaper entry:', payload);

    try {
      const response = await fetch(`${BASE_URL}/diaper`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const err = await response.text();
        console.error('Server error:', err);
        throw new Error('Failed to save');
      }

      Alert.alert('Success', 'Diaper entry saved!');
      clearForm();
    } catch (err) {
      console.error('Save error:', err);
      Alert.alert('Error', 'Failed to save diaper entry');
    }
  };

  const handleCancel = () => {
    router.back(); // goes back in the navigation stack
  };
  

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={handleCancel}>
          <Text style={styles.cancelButton}>Cancel</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Diaper Tracker</Text>

        <TouchableOpacity onPress={handleSave}>
          <Text style={styles.saveButton}>Save</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.label}>Wet Diapers:</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        value={wetCount}
        onChangeText={setWetCount}
        placeholder="e.g., 2"
      />

      <Text style={styles.label}>Dirty Diapers:</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        value={dirtyCount}
        onChangeText={setDirtyCount}
        placeholder="e.g., 1"
      />

      <Text style={styles.label}>Diaper Weight (g):</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        value={diaperWeight}
        onChangeText={setDiaperWeight}
        placeholder="e.g., 135"
      />

      <Text style={styles.label}>Stool Frequency Notes:</Text>
      <TextInput
        style={styles.notesInput}
        value={stoolNotes}
        onChangeText={setStoolNotes}
        placeholder="Any stool observations"
        multiline
      />

      <TouchableOpacity onPress={() => setShowTimePicker(true)}>
        <Text style={styles.timeText}>
          Change Time: {changeTime.toLocaleTimeString()}
        </Text>
      </TouchableOpacity>
      {showTimePicker && (
        <DateTimePicker
          value={changeTime}
          mode="time"
          display="default"
          onChange={(e, date) => {
            setShowTimePicker(false);
            if (date) setChangeTime(date);
          }}
        />
      )}

      <TouchableOpacity onPress={() => router.push('/diaper/history')}>
        <Text style={{ color: '#007AFF', marginTop: 16, fontSize: 16 }}>
          View Diaper History →
        </Text>
      </TouchableOpacity> 

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
    flexGrow: 1,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  cancelButton: {
    color: '#007AFF',
    fontSize: 16,
  },
  saveButton: {
    color: '#34C759',
    fontSize: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  label: {
    marginTop: 12,
    fontSize: 14,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 8,
    marginTop: 4,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 8,
    marginTop: 4,
    height: 80,
    textAlignVertical: 'top',
  },
  timeText: {
    marginTop: 12,
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
});
