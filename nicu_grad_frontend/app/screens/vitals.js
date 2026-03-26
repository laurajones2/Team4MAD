import React, { useState, useCallback } from 'react';
import {
  View, Text, TextInput, FlatList, StyleSheet,
  TouchableOpacity, ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../../constants/API';
import { DISPLAY_NAME_KEY } from '../settings';

const VitalsScreen = () => {
  const [temp, setTemp] = useState('');
  const [hr, setHr] = useState('');
  const [br, setBr] = useState('');
  const [spo2, setSpo2] = useState('');
  const [note, setNote] = useState('');
  const [loggedBy, setLoggedByState] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [vitals, setVitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const fetchVitals = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/vitals`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setVitals(data);
    } catch {
      Alert.alert('Error', 'Failed to load vitals.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      AsyncStorage.getItem(DISPLAY_NAME_KEY).then(name => {
        if (name) setLoggedByState(name);
      });
      fetchVitals();
    }, [fetchVitals])
  );

  const latestVital = vitals[0] || null;
  const allFieldsFilled = temp && hr && br && spo2;

  const logVital = async () => {
    if (!allFieldsFilled) return;
    setSaving(true);
    try {
      const res = await fetch(`${BASE_URL}/vitals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          temp: parseFloat(temp),
          hr: parseInt(hr),
          br: parseInt(br),
          spo2: parseInt(spo2),
          note: note.trim() || '',
          loggedBy: loggedBy || null,
          measuredAt: new Date().toISOString(),
        }),
      });
      if (!res.ok) throw new Error('Failed to save');
      setTemp(''); setHr(''); setBr(''); setSpo2(''); setNote('');
      await fetchVitals();
    } catch {
      Alert.alert('Error', 'Failed to save vitals.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <TouchableOpacity style={styles.backArrow} onPress={() => router.back()}>
        <MaterialCommunityIcons name="arrow-left" size={26} color="#0984e3" />
      </TouchableOpacity>

      <Text style={styles.header}>Vitals</Text>

      {showHistory ? (
        <>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Vitals History</Text>
            {loading ? (
              <ActivityIndicator size="small" color="#0984e3" />
            ) : vitals.length === 0 ? (
              <Text style={styles.noVitals}>No vitals logged yet.</Text>
            ) : (
              vitals.map((entry, index) => (
                <View key={index} style={styles.vitalEntryCard}>
                  <Text style={styles.entryTimestamp}>
                    {new Date(entry.measuredAt).toLocaleString()}
                  </Text>
                  <Text><Text style={styles.entryLabel}>Temp:</Text> {entry.temp}°F</Text>
                  <Text><Text style={styles.entryLabel}>HR:</Text> {entry.hr} bpm</Text>
                  <Text><Text style={styles.entryLabel}>BR:</Text> {entry.br}/min</Text>
                  <Text><Text style={styles.entryLabel}>O2:</Text> {entry.spo2}%</Text>
                  {entry.note ? (
                    <Text><Text style={styles.entryLabel}>Note:</Text> {entry.note}</Text>
                  ) : null}
                  {entry.loggedBy ? (
                    <Text style={styles.entryBy}>by {entry.loggedBy}</Text>
                  ) : null}
                </View>
              ))
            )}
          </View>

          <TouchableOpacity style={styles.backArrow} onPress={() => setShowHistory(false)}>
            <MaterialCommunityIcons name="arrow-left" size={26} color="#0984e3" />
          </TouchableOpacity>
        </>
      ) : (
        <>
          {/* Most recent summary */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Most Recent Entry</Text>
            {loading ? (
              <ActivityIndicator size="small" color="#0984e3" />
            ) : latestVital ? (
              <>
                <VitalRow icon="thermometer" label="Temp" value={`${latestVital.temp}°F`} />
                <VitalRow icon="heart-pulse" label="HR" value={`${latestVital.hr} bpm`} />
                <VitalRow icon="lungs" label="BR" value={`${latestVital.br}/min`} />
                <VitalRow icon="water-percent" label="O2" value={`${latestVital.spo2}%`} />
                {latestVital.note ? (
                  <Text style={styles.note}>Note: {latestVital.note}</Text>
                ) : null}
                {latestVital.loggedBy ? (
                  <Text style={styles.loggedByText}>by {latestVital.loggedBy}</Text>
                ) : null}
                <Text style={styles.time}>
                  {new Date(latestVital.measuredAt).toLocaleString()}
                </Text>
              </>
            ) : (
              <Text style={styles.noVitals}>No vitals logged yet.</Text>
            )}
          </View>

          <Text style={styles.sectionTitle}>Add New Vitals</Text>
          <View style={styles.inputCard}>
            <VitalInput icon="thermometer" label="Temperature (°F)" value={temp} onChange={setTemp} keyboardType="numeric" />
            <VitalInput icon="heart-pulse" label="Heart Rate (bpm)" value={hr} onChange={setHr} keyboardType="numeric" />
            <VitalInput icon="lungs" label="Breathing Rate (/min)" value={br} onChange={setBr} keyboardType="numeric" />
            <VitalInput icon="water-percent" label="Oxygen Saturation (%)" value={spo2} onChange={setSpo2} keyboardType="numeric" />
            <TextInput
              style={styles.noteInput}
              placeholder="Notes (optional)"
              value={note}
              onChangeText={setNote}
            />
            <TouchableOpacity
              style={[styles.button, { backgroundColor: allFieldsFilled && !saving ? '#00B894' : '#B2BEC3' }]}
              onPress={logVital}
              disabled={!allFieldsFilled || saving}
            >
              <Text style={styles.buttonText}>{saving ? 'Saving…' : 'Add Vitals Entry'}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.seeAllButton} onPress={() => setShowHistory(true)}>
            <Text style={styles.seeAllButtonText}>See Past Vitals</Text>
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
};

const VitalRow = ({ icon, label, value }) => (
  <View style={styles.row}>
    <MaterialCommunityIcons name={icon} size={20} color="#0984e3" />
    <Text style={styles.label}>{label}:</Text>
    <Text style={styles.value}>{value}</Text>
  </View>
);

const VitalInput = ({ icon, label, value, onChange, keyboardType }) => (
  <View style={styles.inputRow}>
    <MaterialCommunityIcons name={icon} size={22} color="#0984e3" style={{ marginRight: 8 }} />
    <TextInput
      style={styles.input}
      value={value}
      onChangeText={onChange}
      keyboardType={keyboardType}
      placeholder={label}
      placeholderTextColor="#b2bec3"
    />
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafd',
    padding: 16,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    marginTop: 0,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    shadowColor: '#636e72',
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
    marginBottom: 20,
    alignItems: 'center',
    marginTop: 1,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  label: {
    marginLeft: 8,
    fontWeight: 'bold',
    color: '#636e72',
  },
  value: {
    marginLeft: 5,
    fontSize: 15,
    color: '#222',
  },
  note: {
    marginTop: 5,
    fontStyle: 'italic',
    color: '#636e72',
  },
  loggedByText: {
    marginTop: 4,
    fontSize: 12,
    color: '#888',
    fontStyle: 'italic',
  },
  time: {
    marginTop: 6,
    color: '#b2bec3',
    fontSize: 13,
    textAlign: 'right',
  },
  noVitals: {
    color: '#636e72',
    marginBottom: 6,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    marginTop: 8,
    color: '#0984e3',
  },
  inputCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 18,
    shadowColor: '#636e72',
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  input: {
    flex: 1,
    borderBottomWidth: 1,
    borderColor: '#dfe6e9',
    padding: 6,
    fontSize: 15,
  },
  noteInput: {
    borderWidth: 1,
    borderColor: '#dfe6e9',
    borderRadius: 10,
    padding: 8,
    marginTop: 6,
    backgroundColor: '#fff',
    fontSize: 14,
    minHeight: 36,
    marginBottom: 10,
  },
  button: {
    marginVertical: 10,
    padding: 13,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  seeAllButton: {
    backgroundColor: '#0984e3',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginVertical: 14,
  },
  seeAllButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 17,
  },
  vitalEntryCard: {
    backgroundColor: '#f1f2f6',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    width: '100%',
  },
  entryTimestamp: {
    fontSize: 13,
    color: '#636e72',
    marginBottom: 6,
    fontStyle: 'italic',
  },
  entryLabel: {
    fontWeight: 'bold',
    color: '#2d3436',
  },
  entryBy: {
    fontSize: 12,
    color: '#888',
    fontStyle: 'italic',
    marginTop: 4,
  },
  backArrow: {
    position: 'absolute',
    top: 14,
    left: 14,
    padding: 4,
    zIndex: 10,
    marginBottom: 30,
  },
});

export default VitalsScreen;
