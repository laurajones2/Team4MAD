import React, { useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Alert, ActivityIndicator,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { BASE_URL } from '../../constants/API';

export default function HealthEventsScreen() {
  const router = useRouter();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/health-events`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setEvents(data);
    } catch {
      Alert.alert('Error', 'Failed to load health events.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchEvents();
    }, [fetchEvents])
  );

  const handleSave = async () => {
    if (!title.trim() || !description.trim()) {
      Alert.alert('Required', 'Title and description are required.');
      return;
    }
    setSaving(true);
    try {
      const tagList = tags
        .split(',')
        .map(t => t.trim())
        .filter(Boolean);
      const res = await fetch(`${BASE_URL}/health-events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          tags: tagList,
          recordedAt: new Date().toISOString(),
        }),
      });
      if (!res.ok) throw new Error('Failed to save');
      setTitle('');
      setDescription('');
      setTags('');
      setShowForm(false);
      await fetchEvents();
    } catch {
      Alert.alert('Error', 'Failed to save health event.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id) => {
    Alert.alert(
      'Delete Event',
      'Remove this health event?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await fetch(`${BASE_URL}/health-events/${id}`, { method: 'DELETE' });
              setEvents(prev => prev.filter(e => e.id !== id));
            } catch {
              Alert.alert('Error', 'Failed to delete event.');
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Health Events</Text>
        <TouchableOpacity onPress={() => setShowForm(v => !v)}>
          <Text style={styles.addButton}>{showForm ? 'Cancel' : '+ Add'}</Text>
        </TouchableOpacity>
      </View>

      {showForm && (
        <View style={styles.formCard}>
          <Text style={styles.label}>Title *</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Bradycardia episode"
            returnKeyType="next"
          />
          <Text style={styles.label}>Description *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="What happened? Duration, severity, response…"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
          <Text style={styles.label}>Tags (comma-separated)</Text>
          <TextInput
            style={styles.input}
            value={tags}
            onChangeText={setTags}
            placeholder="e.g. bradycardia, oxygen, nursing"
            autoCapitalize="none"
          />
          <TouchableOpacity
            style={[styles.saveButton, saving && { opacity: 0.6 }]}
            onPress={handleSave}
            disabled={saving}
          >
            <Text style={styles.saveButtonText}>{saving ? 'Saving…' : 'Save Event'}</Text>
          </TouchableOpacity>
        </View>
      )}

      {loading ? (
        <ActivityIndicator size="large" color="#0984e3" style={{ marginTop: 40 }} />
      ) : events.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📋</Text>
          <Text style={styles.emptyText}>No health events recorded yet.</Text>
          <Text style={styles.emptyHint}>Tap "+ Add" to record a significant event.</Text>
        </View>
      ) : (
        events.map(event => (
          <View key={event.id} style={styles.eventCard}>
            <View style={styles.eventHeader}>
              <Text style={styles.eventTitle}>{event.title}</Text>
              <TouchableOpacity onPress={() => handleDelete(event.id)}>
                <Text style={styles.deleteText}>✕</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.eventDate}>
              {new Date(event.recordedAt).toLocaleString()}
            </Text>
            <Text style={styles.eventDescription}>{event.description}</Text>
            {event.tags && event.tags.length > 0 && (
              <View style={styles.tagsRow}>
                {event.tags.map((tag, i) => (
                  <View key={i} style={styles.tag}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#f7f9fc',
    flexGrow: 1,
    paddingBottom: 40,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingTop: 40,
  },
  backButton: {
    color: '#007AFF',
    fontSize: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  addButton: {
    color: '#0984e3',
    fontSize: 16,
    fontWeight: '600',
  },
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    backgroundColor: '#fafafa',
  },
  textArea: {
    minHeight: 90,
  },
  saveButton: {
    backgroundColor: '#0984e3',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 16,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    color: '#636e72',
  },
  emptyHint: {
    fontSize: 13,
    color: '#b2bec3',
    marginTop: 4,
  },
  eventCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2d3436',
    flex: 1,
    marginRight: 8,
  },
  deleteText: {
    color: '#e74c3c',
    fontSize: 18,
    fontWeight: 'bold',
  },
  eventDate: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
    marginBottom: 8,
  },
  eventDescription: {
    fontSize: 14,
    color: '#444',
    lineHeight: 20,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
    gap: 6,
  },
  tag: {
    backgroundColor: '#e3f2fd',
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 12,
    color: '#0984e3',
    fontWeight: '500',
  },
});
