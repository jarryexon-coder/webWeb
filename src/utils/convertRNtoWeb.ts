// src/utils/convertRNtoWeb.ts
import React from 'react';

/**
 * Converts React Native style objects to Material-UI sx props
 */
export const convertStyles = (rnStyles: any) => {
  const sx: any = {};
  
  if (!rnStyles) return sx;
  
  Object.keys(rnStyles).forEach((key) => {
    const value = rnStyles[key];
    
    // Convert common React Native style properties
    switch (key) {
      case 'flex':
        sx.flex = value;
        break;
      case 'flexDirection':
        sx.flexDirection = value;
        break;
      case 'justifyContent':
        sx.justifyContent = value;
        break;
      case 'alignItems':
        sx.alignItems = value;
        break;
      case 'backgroundColor':
        sx.bgcolor = value;
        break;
      case 'color':
        sx.color = value;
        break;
      case 'fontSize':
        sx.fontSize = value;
        break;
      case 'fontWeight':
        sx.fontWeight = value;
        break;
      case 'margin':
        sx.m = value;
        break;
      case 'marginTop':
        sx.mt = value;
        break;
      case 'marginBottom':
        sx.mb = value;
        break;
      case 'padding':
        sx.p = value;
        break;
      case 'paddingHorizontal':
        sx.px = value;
        break;
      case 'paddingVertical':
        sx.py = value;
        break;
      case 'borderRadius':
        sx.borderRadius = value;
        break;
      default:
        // Keep other properties as-is
        sx[key] = value;
    }
  });
  
  return sx;
};

/**
 * Maps React Native components to Material-UI components
 */
export const RNtoWebMap = {
  View: 'Box',
  Text: 'Typography',
  TouchableOpacity: 'Button',
  ScrollView: 'Box', // With overflow: 'auto'
  FlatList: 'Grid', // With mapping
  Image: 'Box', // component="img"
  TextInput: 'TextField',
  Switch: 'Switch',
  ActivityIndicator: 'CircularProgress',
};
