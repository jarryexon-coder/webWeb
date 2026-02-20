// frontend/components/AIParlaySuggestions.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../context/ThemeContext';
import { useParlaySuggestions } from '../hooks/useParlaySuggestions';

interface AIParlaySuggestionsProps {
  sport: string;
  onSelectSuggestion: (legs: any[]) => void;
  limit?: number;
}

export const AIParlaySuggestions: React.FC<AIParlaySuggestionsProps> = ({
  sport,
  onSelectSuggestion,
  limit = 6
}) => {
  const { theme } = useTheme();
  const { suggestions, loading, refresh, lastUpdated } = useParlaySuggestions(sport, limit);

  const getConfidenceColor = (level: string) => {
    switch (level) {
      case 'high': return '#4CAF50';
      case 'medium': return '#FF9800';
      case 'low': return '#F44336';
      default: return theme.primary;
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.card }]}>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Icon name="robot" size={24} color={theme.primary} />
            <Text style={[styles.title, { color: theme.text }]}>
              AI Parlay Suggestions
            </Text>
          </View>
        </View>
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loaderText, { color: theme.secondaryText }]}>
            Analyzing matchups...
          </Text>
        </View>
      </View>
    );
  }

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.card }]}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Icon name="robot" size={24} color={theme.primary} />
          <Text style={[styles.title, { color: theme.text }]}>
            AI Parlay Suggestions
          </Text>
        </View>
        {lastUpdated && (
          <Text style={[styles.updateTime, { color: theme.secondaryText }]}>
            Updated {lastUpdated.toLocaleTimeString()}
          </Text>
        )}
        <TouchableOpacity onPress={refresh}>
          <Icon name="refresh" size={20} color={theme.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {suggestions.map((suggestion) => (
          <TouchableOpacity
            key={suggestion.id}
            style={[styles.card, { backgroundColor: theme.background }]}
            onPress={() => onSelectSuggestion(suggestion.legs)}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.cardIcon}>{suggestion.icon || '🎯'}</Text>
              <View style={[
                styles.confidenceBadge,
                { backgroundColor: getConfidenceColor(suggestion.confidence_level) }
              ]}>
                <Text style={styles.confidenceText}>
                  {suggestion.confidence}%
                </Text>
              </View>
            </View>

            <Text style={[styles.cardTitle, { color: theme.text }]}>
              {suggestion.name}
            </Text>

            <View style={styles.legsContainer}>
              {suggestion.legs?.slice(0, 2).map((leg, index) => (
                <Text key={index} style={[styles.legText, { color: theme.secondaryText }]}>
                  • {leg.player}: {leg.market} {leg.prediction} {leg.line}
                </Text>
              ))}
              {suggestion.legs?.length > 2 && (
                <Text style={[styles.moreText, { color: theme.secondaryText }]}>
                  +{suggestion.legs.length - 2} more
                </Text>
              )}
            </View>

            <View style={styles.footer}>
              <View>
                <Text style={[styles.oddsLabel, { color: theme.secondaryText }]}>
                  Odds
                </Text>
                <Text style={[styles.oddsValue, { color: theme.primary }]}>
                  +{suggestion.total_odds}
                </Text>
              </View>
              {suggestion.expected_value && (
                <View>
                  <Text style={[styles.evLabel, { color: theme.secondaryText }]}>
                    EV
                  </Text>
                  <Text style={[styles.evValue, { color: '#4CAF50' }]}>
                    {suggestion.expected_value}
                  </Text>
                </View>
              )}
              {suggestion.correlation_score && (
                <View>
                  <Text style={[styles.corrLabel, { color: theme.secondaryText }]}>
                    Corr
                  </Text>
                  <Text style={[styles.corrValue, { color: '#FFD700' }]}>
                    {Math.round(suggestion.correlation_score * 100)}%
                  </Text>
                </View>
              )}
            </View>

            {suggestion.analysis && (
              <Text style={[styles.analysis, { color: theme.secondaryText }]}>
                {suggestion.analysis.substring(0, 60)}...
              </Text>
            )}

            <TouchableOpacity
              style={[styles.useButton, { backgroundColor: theme.primary + '20' }]}
              onPress={() => onSelectSuggestion(suggestion.legs)}
            >
              <Text style={[styles.useButtonText, { color: theme.primary }]}>
                Use This Parlay
              </Text>
            </TouchableOpacity>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  updateTime: {
    fontSize: 11,
  },
  loaderContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  loaderText: {
    marginTop: 12,
    fontSize: 14,
  },
  card: {
    width: 280,
    padding: 16,
    marginRight: 12,
    borderRadius: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardIcon: {
    fontSize: 24,
  },
  confidenceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  confidenceText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  legsContainer: {
    marginBottom: 12,
  },
  legText: {
    fontSize: 12,
    marginBottom: 2,
  },
  moreText: {
    fontSize: 11,
    marginTop: 2,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  oddsLabel: {
    fontSize: 11,
    marginBottom: 2,
  },
  oddsValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  evLabel: {
    fontSize: 11,
    marginBottom: 2,
  },
  evValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  corrLabel: {
    fontSize: 11,
    marginBottom: 2,
  },
  corrValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  analysis: {
    fontSize: 11,
    marginBottom: 12,
    fontStyle: 'italic',
  },
  useButton: {
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  useButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
