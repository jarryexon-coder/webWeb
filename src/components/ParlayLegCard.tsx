// Reusable component for displaying parlay legs
import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ParlayLegCardProps {
  market: string;
  odds: number;
  probability: number;
  sport?: string;
}

export const ParlayLegCard: React.FC<ParlayLegCardProps> = ({
  market,
  odds,
  probability,
  sport
}) => {
  const formatOdds = (odds: number) => odds > 0 ? `+${odds}` : `${odds}`;
  
  return (
    <View className="flex-row justify-between items-center py-2 border-b border-gray-100">
      <View className="flex-1">
        <Text className="text-sm font-medium text-gray-900">{market}</Text>
        <View className="flex-row items-center mt-0.5">
          {sport && (
            <>
              <Ionicons name="basketball" size={12} color="#6B7280" />
              <Text className="text-xs text-gray-500 ml-1">{sport}</Text>
            </>
          )}
          <Text className="text-xs text-gray-500 ml-2">
            {(probability * 100).toFixed(0)}% implied
          </Text>
        </View>
      </View>
      <View className="bg-blue-50 px-3 py-1 rounded-full">
        <Text className="text-sm font-bold text-blue-700">
          {formatOdds(odds)}
        </Text>
      </View>
    </View>
  );
};
