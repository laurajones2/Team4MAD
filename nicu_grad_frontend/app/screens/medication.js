import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, Modal, Alert, ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { BASE_URL } from '../../constants/API';

const FREQUENCY_OPTIONS = ['Once daily', 'Twice daily', 'Every 8 hours', 'Every 6 hours', 'Custom'];

function hoursFromFrequency(frequency, customHours) {
  switch (frequency) {
    case 'Once daily': return 24;
    case 'Twice daily': return 12;
    case 'Every 8 hours': return 8;
    case 'Every 6 hours': return 6;
    case 'Custom': return parseInt(customHours) || 24;
    default: return 24;
  }
}

export default function MedicationPage() {
  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDosage, setNewDosage] = useState('');
  const [selectedFrequency, setSelectedFrequency] = useState('Once daily');
  const [customHours, setCustomHours] = useState('');

  const fetchMedications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/medication`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setMedications(data);
    } catch {
      Alert.alert('Error', 'Failed to load medications.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchMedications();
    }, [fetchMedications])
  );

  const addMedication = async () => {
    if (!newName.trim() || !newDosage.trim()) {
      Alert.alert('Required', 'Name and dosage are required.');
      return;
    }
    const hours = hoursFromFrequency(selectedFrequency, customHours);
    const nextDoseDue = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();

    setSaving(true);
    try {
      const res = await fetch(`${BASE_URL}/medication`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName.trim(),
          dosage: newDosage.trim(),
          givenAt: new Date().toISOString(),
          nextDoseDue,
        }),
      });
      if (!res.ok) throw new Error('Failed to save');
      setNewName('');
      setNewDosage('');
      setSelectedFrequency('Once daily');
      setCustomHours('');
      setModalVisible(false);
      await fetchMedications();
    } catch {
      Alert.alert('Error', 'Failed to save medication.');
    } finally {
      setSaving(false);
    }
  };

  const deleteMedication = (id) => {
    Alert.alert(
      'Delete Medication',
      'Remove this medication record?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await fetch(`${BASE_URL}/medication/${id}`, { method: 'DELETE' });
              setMedications(prev => prev.filter(m => m.id !== id));
            } catch {
              Alert.alert('Error', 'Failed to delete medication.');
            }
          },
        },
      ]
    );
  };

  const renderMedication = ({ item }) => {
    const nextDue = item.nextDoseDue ? new Date(item.nextDoseDue) : null;
    const givenAt = item.givenAt ? new Date(item.givenAt) : null;
    const isDue = nextDue && nextDue <= new Date();

    return (
      <View style={[styles.card, isDue && styles.cardDue]}>
        <View style={styles.cardContent}>
          <MaterialCommunityIcons name="pill" size={24} color="#0984e3" style={styles.icon} />
          <View style={styles.textContainer}>
            <Text style={styles.medName}>{item.name}</Text>
            <Text style={styles.details}>Dosage: {item.dosage}</Text>
            {givenAt && (
              <Text style={styles.details}>
                Given: {givenAt.toLocaleString()}
              </Text>
            )}
            {nextDue && (
              <Text style={[styles.details, isDue && styles.dueText]}>
                Next due: {nextDue.toLocaleString()}{isDue ? ' ⚠️' : ''}
              </Text>
            )}
          </View>
          <TouchableOpacity onPress={() => deleteMedication(item.id)} style={styles.deleteBtn}>
            <MaterialCommunityIcons name="trash-can-outline" size={22} color="#e74c3c" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Medication</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#0984e3" style={{ marginTop: 40 }} />
      ) : medications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="pill" size={48} color="#b2bec3" />
          <Text style={styles.emptyText}>No medications logged yet.</Text>
          <Text style={styles.emptyHint}>Tap + to add a medication record.</Text>
        </View>
      ) : (
        <FlatList
          data={medications}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderMedication}
          contentContainerStyle={styles.listContainer}
        />
      )}

      <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
        <MaterialCommunityIcons name="plus" size={30} color="#fff" />
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide">
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Add Medication</Text>

          <TextInput
            style={styles.input}
            placeholder="Medication name"
            value={newName}
            onChangeText={setNewName}
          />
          <TextInput
            style={styles.input}
            placeholder="Dosage (e.g. 5mg)"
            value={newDosage}
            onChangeText={setNewDosage}
          />

          <Text style={styles.label}>Frequency:</Text>
          <View style={styles.buttonGroup}>
            {FREQUENCY_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option}
                style={[styles.freqButton, selectedFrequency === option && styles.freqButtonSelected]}
                onPress={() => setSelectedFrequency(option)}
              >
                <Text style={[styles.freqText, selectedFrequency === option && styles.freqTextSelected]}>
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {selectedFrequency === 'Custom' && (
            <TextInput
              style={styles.input}
              placeholder="Interval in hours"
              keyboardType="numeric"
              value={customHours}
              onChangeText={setCustomHours}
            />
          )}

          <TouchableOpacity
            style={[styles.saveButton, saving && { opacity: 0.6 }]}
            onPress={addMedication}
            disabled={saving}
          >
            <Text style={styles.saveButtonText}>{saving ? 'Saving…' : 'Save'}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setModalVisible(false)} style={{ marginTop: 16 }}>
            <Text style={{ color: '#0984e3', textAlign: 'center', fontSize: 16 }}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6fafd',
    paddingTop: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    alignSelf: 'center',
    color: '#0984e3',
    marginBottom: 20,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: '#dfe6e9',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  cardDue: {
    backgroundColor: '#ffeaa7',
    borderWidth: 1,
    borderColor: '#f39c12',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  medName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2d3436',
  },
  details: {
    fontSize: 14,
    color: '#2d3436',
    marginTop: 2,
  },
  dueText: {
    color: '#e17055',
    fontWeight: '600',
  },
  deleteBtn: {
    padding: 4,
  },
  addButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    backgroundColor: '#0984e3',
    borderRadius: 30,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#636e72',
    marginTop: 12,
  },
  emptyHint: {
    fontSize: 13,
    color: '#b2bec3',
    marginTop: 4,
  },
  modalContent: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#fff',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 24,
    color: '#0984e3',
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 12,
    marginBottom: 12,
    borderRadius: 8,
    fontSize: 15,
  },
  label: {
    fontWeight: 'bold',
    marginBottom: 8,
    marginTop: 8,
    color: '#2d3436',
  },
  buttonGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  freqButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#0984e3',
  },
  freqButtonSelected: {
    backgroundColor: '#0984e3',
  },
  freqText: {
    color: '#0984e3',
  },
  freqTextSelected: {
    color: '#fff',
  },
  saveButton: {
    backgroundColor: '#0984e3',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
