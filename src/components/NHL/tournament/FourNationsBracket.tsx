import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

export const FourNationsBracket = ({ games }) => {
  // Tournament bracket for Feb 15-20, 2026
  return (
    <View className="p-4 bg-white dark:bg-gray-900 rounded-xl">
      <Text className="text-lg font-bold mb-4">🏆 4 Nations Face-Off Bracket</Text>
      
      {/* Round Robin */}
      <View className="mb-6">
        <Text className="font-bold text-blue-600 mb-2">Round Robin</Text>
        {games.filter(g => !g.note?.includes('Championship')).map((game, i) => (
          <View key={i} className="flex-row py-2 border-b border-gray-100">
            <Text className="flex-1">{game.away_team} vs {game.home_team}</Text>
            <Text className="text-gray-500">{game.time} ET</Text>
          </View>
        ))}
      </View>

      {/* Championship */}
      <View>
        <Text className="font-bold text-yellow-600 mb-2">Championship Game</Text>
        {games.filter(g => g.note?.includes('Championship')).map((game, i) => (
          <View key={i} className="flex-row py-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-2">
            <Text className="flex-1 font-bold">{game.away_team} vs {game.home_team}</Text>
            <Text className="text-yellow-800 dark:text-yellow-300">🏆 Final</Text>
          </View>
        ))}
      </View>
    </View>
  );
};
