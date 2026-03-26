import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, ActivityIndicator, RefreshControl,
} from 'react-native';
import { Link, useFocusEffect } from 'expo-router';
import { BASE_URL } from '../constants/API';

const tools = [
  { label: 'Feeding', route: '/feeding', icon: '🍼' },
  { label: 'Diaper', route: '/diaper', icon: '👶' },
  { label: 'Medication', route: '/medication', icon: '💊' },
  { label: 'Growth', route: '/growth', icon: '📈' },
  { label: 'Vitals', route: '/vitals', icon: '❤️' },
  { label: 'Sleep', route: '/sleep', icon: '😴' },
  { label: 'Health Events', route: '/health-events', icon: '📋' },
];

function timeAgo(dateStr) {
  if (!dateStr) return null;
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ${mins % 60}m ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function urgencyColor(dateStr, warnMinutes, alertMinutes) {
  if (!dateStr) return '#aaa';
  const mins = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
  if (mins >= alertMinutes) return '#e74c3c';
  if (mins >= warnMinutes) return '#f39c12';
  return '#27ae60';
}

function StatusCard({ title, value, sub, color }) {
  return (
    <View style={[styles.statusCard, { borderLeftColor: color }]}>
      <Text style={styles.statusCardTitle}>{title}</Text>
      <Text style={[styles.statusCardValue, { color }]}>{value || '—'}</Text>
      {sub ? <Text style={styles.statusCardSub}>{sub}</Text> : null}
    </View>
  );
}

export default function HomeScreen() {
  const [lastFeeding, setLastFeeding] = useState(null);
  const [lastDiaper, setLastDiaper] = useState(null);
  const [lastSleep, setLastSleep] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      const [feedRes, diaperRes, sleepRes] = await Promise.all([
        fetch(`${BASE_URL}/feeding`),
        fetch(`${BASE_URL}/diaper`),
        fetch(`${BASE_URL}/sleep`),
      ]);
      if (feedRes.ok) {
        const data = await feedRes.json();
        setLastFeeding(data[0] || null);
      }
      if (diaperRes.ok) {
        const data = await diaperRes.json();
        setLastDiaper(data[0] || null);
      }
      if (sleepRes.ok) {
        const data = await sleepRes.json();
        setLastSleep(data[0] || null);
      }
    } catch {
      // Offline — dashboard shows last cached state
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchStatus();
    }, [fetchStatus])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchStatus();
  };

  const feedingAge = lastFeeding?.measuredAt;
  const diaperAge = lastDiaper?.measuredAt;
  const sleepAge = lastSleep?.sleepDate;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.scrollContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Text style={styles.appTitle}>NICU Grad Tracker</Text>

      {/* Status Cards */}
      <Text style={styles.sectionHeader}>Current Status</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#0984e3" style={{ marginVertical: 20 }} />
      ) : (
        <View style={styles.cardsContainer}>
          <StatusCard
            title="Last Feeding"
            value={feedingAge ? timeAgo(feedingAge) : 'No data'}
            sub={
              lastFeeding
                ? [
                    lastFeeding.method,
                    lastFeeding.volume ? `${lastFeeding.volume}ml` : null,
                    lastFeeding.loggedBy ? `by ${lastFeeding.loggedBy}` : null,
                  ]
                    .filter(Boolean)
                    .join(' · ')
                : null
            }
            color={feedingAge ? urgencyColor(feedingAge, 180, 240) : '#aaa'}
          />
          <StatusCard
            title="Last Diaper"
            value={diaperAge ? timeAgo(diaperAge) : 'No data'}
            sub={
              lastDiaper
                ? [
                    lastDiaper.wetCount > 0 ? `${lastDiaper.wetCount} wet` : null,
                    lastDiaper.dirtyCount > 0 ? `${lastDiaper.dirtyCount} dirty` : null,
                    lastDiaper.loggedBy ? `by ${lastDiaper.loggedBy}` : null,
                  ]
                    .filter(Boolean)
                    .join(' · ')
                : null
            }
            color={diaperAge ? urgencyColor(diaperAge, 240, 360) : '#aaa'}
          />
          <StatusCard
            title="Last Sleep"
            value={sleepAge ? timeAgo(sleepAge) : 'No data'}
            sub={
              lastSleep
                ? [
                    lastSleep.durationMinutes
                      ? `${Math.floor(lastSleep.durationMinutes / 60)}h ${lastSleep.durationMinutes % 60}m`
                      : null,
                    lastSleep.quality,
                    lastSleep.loggedBy ? `by ${lastSleep.loggedBy}` : null,
                  ]
                    .filter(Boolean)
                    .join(' · ')
                : null
            }
            color={sleepAge ? urgencyColor(sleepAge, 240, 480) : '#aaa'}
          />
        </View>
      )}

      {/* Quick access tiles */}
      <Text style={styles.sectionHeader}>Log Entry</Text>
      <View style={styles.tileContainer}>
        {tools.map((tool) => (
          <Link key={tool.route} href={tool.route} asChild>
            <TouchableOpacity style={styles.tile}>
              <Text style={styles.tileIcon}>{tool.icon}</Text>
              <Text style={styles.tileText}>{tool.label}</Text>
            </TouchableOpacity>
          </Link>
        ))}
      </View>

      <Link href="/settings" asChild>
        <TouchableOpacity style={styles.settingsButton}>
          <Text style={styles.settingsText}>⚙ Settings</Text>
        </TouchableOpacity>
      </Link>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f0f4f8',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  appTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#0984e3',
    paddingTop: 56,
    paddingBottom: 8,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: '#555',
    marginTop: 20,
    marginBottom: 8,
    paddingHorizontal: 20,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  cardsContainer: {
    paddingHorizontal: 16,
    gap: 10,
  },
  statusCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 5,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  statusCardTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  statusCardValue: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  statusCardSub: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
  tileContainer: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  tile: {
    width: '47%',
    paddingVertical: 18,
    backgroundColor: '#fff',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  tileIcon: {
    fontSize: 26,
    marginBottom: 6,
  },
  tileText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    color: '#2d3436',
  },
  settingsButton: {
    margin: 20,
    padding: 16,
    backgroundColor: '#0984e3',
    borderRadius: 12,
    alignItems: 'center',
  },
  settingsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
