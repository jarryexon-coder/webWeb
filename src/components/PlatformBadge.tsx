// Reusable platform badge component
import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PLATFORM_CONFIGS } from '../utils/platformMappings';

interface PlatformBadgeProps {
  platform: string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export const PlatformBadge: React.FC<PlatformBadgeProps> = ({
  platform,
  size = 'md',
  showIcon = true
}) => {
  const config = PLATFORM_CONFIGS[platform.toLowerCase()] || {
    name: platform,
    color: '#6366F1',
    icon: 'help-circle'
  };

  const sizeClasses = {
    sm: 'px-2 py-0.5',
    md: 'px-3 py-1',
    lg: 'px-4 py-2'
  };

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  return (
    <View 
      className={`flex-row items-center rounded-full ${sizeClasses[size]}`}
      style={{ backgroundColor: config.color + '20' }}
    >
      {showIcon && (
        <Ionicons 
          name={config.icon as any} 
          size={size === 'sm' ? 12 : 14} 
          color={config.color} 
          style={{ marginRight: 4 }}
        />
      )}
      <Text 
        className={`font-medium ${textSizes[size]}`}
        style={{ color: config.color }}
      >
        {config.name}
      </Text>
    </View>
  );
};
