import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, TouchableOpacity, ScrollView, Alert, StyleSheet } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../../constants/API';
import { DISPLAY_NAME_KEY } from '../settings';

export default function FeedingTrackerScreen() {
  const navigation = useNavigation();
  const [loggedBy, setLoggedByState] = useState('');

  useEffect(() => {
    AsyncStorage.getItem(DISPLAY_NAME_KEY).then(name => {
      if (name) setLoggedByState(name);
    });
  }, []);

  const [feedingMethod, setFeedingMethod] = useState('breast');
  const [breastSide, setBreastSide] = useState('left');
  const [duration, setDuration] = useState('');
  const [volume, setVolume] = useState('');
  const [pumpedQty, setPumpedQty] = useState('');
  const [preWeight, setPreWeight] = useState('');
  const [postWeight, setPostWeight] = useState('');
  const [feedEndTime, setFeedEndTime] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [intervalHours, setIntervalHours] = useState('3');

  const intakeAmount = postWeight && preWeight
    ? (parseFloat(postWeight) - parseFloat(preWeight)).toFixed(2)
    : '';

    const handleSave = async () => {
        if (!feedingMethod || !feedEndTime) {
          Alert.alert('Missing Info', 'Feeding method and end time are required.');
          return;
        }
      
        const measuredAt = feedEndTime.toISOString();
      
        const payload = {
            method: feedingMethod,
            side: feedingMethod === 'breast' ? breastSide : null,
            duration: duration ? parseFloat(duration) : null,
            volume: (feedingMethod === 'pumping' ? pumpedQty : volume) ? parseFloat(feedingMethod === 'pumping' ? pumpedQty : volume) : null,
            weightBeforeG: feedingMethod === 'breast' && preWeight ? parseFloat(preWeight) : null,
            weightAfterG: feedingMethod === 'breast' && postWeight ? parseFloat(postWeight) : null,
            intakeG: feedingMethod === 'breast' && intakeAmount ? parseFloat(intakeAmount) : null,
            loggedBy: loggedBy || null,
            measuredAt,
          };
          
      
        console.log('Sending payload to backend:', payload);
      
        try {
          const response = await fetch(`${BASE_URL}/feeding`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
      
          if (!response.ok) {
            const errorText = await response.text();
            console.error('Server returned:', response.status, errorText);
            throw new Error(`Server error: ${response.status}`);
          }
      
          Alert.alert('Success', 'Feeding entry saved!');
          clearForm();
        } catch (error) {
          console.error('Save error:', error);
          Alert.alert('Error', 'Failed to save feeding entry. Please try again.');
        }
      };
      

  const clearForm = () => {
    setDuration('');
    setVolume('');
    setPumpedQty('');
    setPreWeight('');
    setPostWeight('');
  };

  const handleCancel = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('/');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={handleCancel}>
          <Text style={styles.cancelButton}>Cancel</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Feeding Tracker</Text>

        <TouchableOpacity onPress={handleSave}>
          <Text style={styles.saveButton}>Save</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.label}>Feeding Method:</Text>
      <View style={styles.row}>
        {['breast', 'bottle', 'pumping', 'tube'].map(method => (
          <TouchableOpacity key={method} onPress={() => setFeedingMethod(method)}>
            <Text style={[styles.methodButton, feedingMethod === method && styles.active]}>
              {method}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {feedingMethod === 'breast' && (
  <>
    <Text style={styles.label}>Side:</Text>
    <View style={styles.row}>
      {['left', 'right'].map(side => (
        <TouchableOpacity key={side} onPress={() => setBreastSide(side)}>
          <Text style={[styles.methodButton, breastSide === side && styles.active]}>
            {side}
          </Text>
        </TouchableOpacity>
      ))}
    </View>

    <Text style={styles.label}>Duration (min):</Text>
    <TextInput
      style={styles.input}
      keyboardType="numeric"
      value={duration}
      onChangeText={setDuration}
    />

    <Text style={styles.label}>Pre-feed Weight (g):</Text>
    <TextInput
      style={styles.input}
      keyboardType="numeric"
      value={preWeight}
      onChangeText={setPreWeight}
    />
    <Text style={styles.label}>Post-feed Weight (g):</Text>
    <TextInput
      style={styles.input}
      keyboardType="numeric"
      value={postWeight}
      onChangeText={setPostWeight}
    />

    {intakeAmount && (
      <Text style={{ marginTop: 10 }}>Estimated Intake: {intakeAmount} g</Text>
    )}
  </>
)}



      {feedingMethod === 'bottle' || feedingMethod === 'tube' ? (
        <>
          <Text style={styles.label}>Volume Given (ml):</Text>
          <TextInput style={styles.input} keyboardType="numeric" value={volume} onChangeText={setVolume} />
        </>
      ) : null}

      {feedingMethod === 'pumping' && (
        <>
          <Text style={styles.label}>Duration (min):</Text>
          <TextInput style={styles.input} keyboardType="numeric" value={duration} onChangeText={setDuration} />
          <Text style={styles.label}>Quantity Pumped (ml):</Text>
          <TextInput style={styles.input} keyboardType="numeric" value={pumpedQty} onChangeText={setPumpedQty} />
        </>
      )}

      {/* <Text style={styles.label}>Pre-feed Weight (g):</Text>
      <TextInput style={styles.input} keyboardType="numeric" value={preWeight} onChangeText={setPreWeight} />
      <Text style={styles.label}>Post-feed Weight (g):</Text>
      <TextInput style={styles.input} keyboardType="numeric" value={postWeight} onChangeText={setPostWeight} /> */}

      {intakeAmount && (
        <Text style={{ marginTop: 10 }}>Estimated Intake: {intakeAmount} g</Text>
      )}

      <TouchableOpacity onPress={() => setShowTimePicker(true)}>
        <Text style={styles.timeText}>
          Feed End Time: {feedEndTime.toLocaleTimeString()}
        </Text>
      </TouchableOpacity>
      {showTimePicker && (
        <DateTimePicker
          value={feedEndTime}
          mode="time"
          display="default"
          onChange={(e, date) => {
            setShowTimePicker(false);
            if (date) setFeedEndTime(date);
          }}
        />
      )}
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
  methodButton: {
    padding: 8,
    backgroundColor: '#eee',
    borderRadius: 8,
    marginRight: 8,
    marginTop: 4,
  },
  active: {
    backgroundColor: '#d0f0c0',
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  timeText: {
    marginTop: 12,
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
});
