import { Stack } from 'expo-router';
import React from 'react';
import { ActivityIndicator, View } from 'react-native'; // Para la pantalla de carga
import { AuthProvider, useAuth } from '../context/AuthContext';

// Este componente decide si mostrar 'cargando' o la app
const RootLayout = () => {
  const { loading } = useAuth(); // Solo necesitamos saber si está cargando

  // Si estamos autenticando (creando el usuario anónimo),
  // mostramos un indicador de carga.
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#A020F0" />
      </View>
    );
  }

  // Una vez cargado, solo mostramos las pestañas (tabs)
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
};

// El layout principal que envuelve todo en el AuthProvider
export default function AppLayout() {
  return (
    <AuthProvider>
      <RootLayout />
    </AuthProvider>
  );
}
