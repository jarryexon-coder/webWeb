// src/screens/parlay/ParlayHistoryScreen.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../context/ThemeContext';
import { useParlay } from '../../context/ParlayContext';

export const ParlayHistoryScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const { parlayHistory } = useParlay();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'won': return '#4CAF50';
      case 'lost': return '#F44336';
      case 'cashed': return '#FF9800';
      default: return theme.secondaryText;
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.ticketCard, { backgroundColor: theme.card }]}
      onPress={() => navigation.navigate('ParlayDetails', { parlayId: item.id })}
    >
      <View style={styles.ticketHeader}>
        <View>
          <Text style={[styles.ticketType, { color: theme.primary }]}>
            {item.type.replace('_', ' ')} • {item.sport}
          </Text>
          <Text style={[styles.ticketDate, { color: theme.secondaryText }]}>
            {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>

      <View style={styles.ticketBody}>
        <Text style={[styles.legCount, { color: theme.text }]}>
          {item.legs.length} Legs
        </Text>
        <View style={styles.legs}>
          {item.legs.slice(0, 2).map((leg, i) => (
            <Text key={i} style={[styles.leg, { color: theme.secondaryText }]}>
              • {leg.player || 'Spread'}: {leg.market}
            </Text>
          ))}
        </View>
      </View>

      <View style={styles.ticketFooter}>
        <View>
          <Text style={[styles.footerLabel, { color: theme.secondaryText }]}>
            Stake
          </Text>
          <Text style={[styles.footerValue, { color: theme.text }]}>
            ${item.stake.toFixed(2)}
          </Text>
        </View>
        <View>
          <Text style={[styles.footerLabel, { color: theme.secondaryText }]}>
            Odds
          </Text>
          <Text style={[styles.footerValue, { color: theme.primary }]}>
            {item.odds > 0 ? `+${item.odds}` : item.odds}
          </Text>
        </View>
        <View>
          <Text style={[styles.footerLabel, { color: theme.secondaryText }]}>
            Payout
          </Text>
          <Text style={[styles.footerValue, { color: '#4CAF50' }]}>
            ${item.payout.toFixed(2)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.card }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          Parlay History
        </Text>
        <View style={{ width: 24 }} />
      </View>

      {parlayHistory.length === 0 ? (
        <View style={styles.emptyState}>
          <Icon name="document-text-outline" size={64} color={theme.border} />
          <Text style={[styles.emptyTitle, { color: theme.text }]}>
            No Parlay History
          </Text>
          <Text style={[styles.emptyText, { color: theme.secondaryText }]}>
            Your saved parlays will appear here
          </Text>
          <TouchableOpacity
            style={[styles.buildButton, { backgroundColor: theme.primary }]}
            onPress={() => navigation.navigate('ParlayArchitect')}
          >
            <Text style={styles.buildButtonText}>Build a Parlay</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={parlayHistory}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  list: {
    padding: 16,
  },
  ticketCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  ticketType: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'capitalize',
  },
  ticketDate: {
    fontSize: 12,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  ticketBody: {
    marginBottom: 12,
  },
  legCount: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  legs: {
    marginLeft: 8,
  },
  leg: {
    fontSize: 12,
    marginBottom: 2,
  },
  ticketFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  footerLabel: {
    fontSize: 11,
    marginBottom: 2,
  },
  footerValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  buildButton: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  buildButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
