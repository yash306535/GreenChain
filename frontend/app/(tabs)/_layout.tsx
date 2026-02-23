import React from 'react';
import { Tabs } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#22c55e',
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, focused }) => (
            <MaterialIcons 
              name={focused ? 'dashboard' : 'dashboard'} 
              color={color} 
              size={24} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="emissions"
        options={{
          title: 'Emissions',
          tabBarIcon: ({ color, focused }) => (
            <MaterialIcons 
              name={focused ? 'eco' : 'eco'} 
              color={color} 
              size={24} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="insights"
        options={{
          title: 'Insights',
          tabBarIcon: ({ color, focused }) => (
            <MaterialIcons 
              name={focused ? 'smart-toy' : 'smart-toy'} 
              color={color} 
              size={24} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'Map',
          tabBarIcon: ({ color, focused }) => (
            <MaterialIcons 
              name={focused ? 'map' : 'map'} 
              color={color} 
              size={24} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: 'Analytics',
          tabBarIcon: ({ color, focused }) => (
            <MaterialIcons 
              name={focused ? 'analytics' : 'analytics'} 
              color={color} 
              size={24} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="score"
        options={{
          title: 'Score',
          tabBarIcon: ({ color, focused }) => (
            <MaterialIcons 
              name={focused ? 'star' : 'star'} 
              color={color} 
              size={24} 
            />
          ),
        }}
      />
    </Tabs>
  );
}