import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

interface Props {
  daysRemaining: number;
  rumors: any[];
  impactPlayers: string[];
  onPress: () => void;
}

export const TradeDeadlineBanner = ({ daysRemaining, rumors, impactPlayers, onPress }: Props) => {
  const getUrgencyColor = () => {
    if (daysRemaining <= 7) return 'bg-red-100 dark:bg-red-900/30 border-red-500';
    if (daysRemaining <= 14) return 'bg-orange-100 dark:bg-orange-900/30 border-orange-500';
    return 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-500';
  };

  return (
    <TouchableOpacity 
      className={`mx-4 my-2 p-3 rounded-lg border-l-4 ${getUrgencyColor()}`}
      onPress={onPress}
    >
      <View className="flex-row justify-between items-center">
        <Text className="font-bold text-gray-900 dark:text-white">
          ⏰ Trade Deadline: {daysRemaining} days
        </Text>
        <Text className="text-xs text-gray-600 dark:text-gray-400">
          March 7, 2026
        </Text>
      </View>
      
      <Text className="text-sm text-gray-700 dark:text-gray-300 mt-1">
        🔥 Impact players: {impactPlayers.join(', ')}
      </Text>
      
      {rumors.length > 0 && (
        <Text className="text-xs text-gray-600 dark:text-gray-400 mt-1">
          📰 Latest: {rumors[0].player} - {rumors[0].rumor}
        </Text>
      )}
    </TouchableOpacity>
  );
};
