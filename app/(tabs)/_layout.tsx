import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#A020F0',
      }}>
      <Tabs.Screen
        name="index" // Mapa
        options={{
          title: 'Mapa',
          tabBarIcon: ({ color }) => (
            <Ionicons name="map" size={28} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="scan" // Escanear
        options={{
          title: 'Escanear',
          tabBarIcon: ({ color }) => (
            <Ionicons name="camera" size={28} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="deck"
        options={{
          title: 'Mazo',
          tabBarIcon: ({ color }) => (
            <Ionicons name="albums" size={28} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="contacts" 
        options={{
          title: 'Contactos',
          tabBarIcon: ({ color }) => (
            <Ionicons name="people" size={28} color={color} /> 
          ),
        }}
      />
    </Tabs>
  );
}