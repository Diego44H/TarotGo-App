import { Ionicons } from '@expo/vector-icons'; // Importamos los iconos
import { Tabs } from 'expo-router';
import React from 'react';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#A020F0', // Color activo (morado)
      }}>
      <Tabs.Screen
        name="index" // Este es el archivo index.tsx
        options={{
          title: 'Mapa', // Título de la pestaña
          tabBarIcon: ({ color }) => (
            <Ionicons name="map" size={28} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="scan" // Corresponde a scan.tsx
        options={{
          title: 'Escanear',
          tabBarIcon: ({ color }) => (
            <Ionicons name="camera" size={28} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="deck" // Corresponde a deck.tsx
        options={{
          title: 'Mazo',
          tabBarIcon: ({ color }) => (
            <Ionicons name="albums" size={28} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile" // Corresponde a profile.tsx
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color }) => (
            <Ionicons name="person" size={28} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}