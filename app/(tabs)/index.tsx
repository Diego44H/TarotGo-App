import * as Location from 'expo-location'; // Importamos expo-location
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';

export default function MapScreen() {
  
  // Estado para guardar la región del mapa (que será la ubicación del usuario)
  const [region, setRegion] = useState<Region | undefined>(undefined);
  // Estado para mensajes de error
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Este 'useEffect' se ejecuta una vez cuando el componente se carga
  useEffect(() => {
    (async () => {
      
      // 1. Pedir  al usuario
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permiso de ubicación denegado');
        // Si lo deniegan, centramos el mapa en una ubicación por defecto
        setRegion({
          latitude: 19.432608,
          longitude: -99.133209,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        });
        return;
      }

      // 2. Obtener la ubicación actual
      let location = await Location.getCurrentPositionAsync({});
      
      // 3. Actualizar el estado de la región para centrar el mapa
      setRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.0922, // Zoom inicial
        longitudeDelta: 0.0421, // Zoom inicial
      });
    })();
  }, []); // El array vacío [] asegura que esto solo se ejecute una vez

  // --- Renderizado ---

  // Si hay un error, mostramos el error
  if (errorMsg) {
    return (
      <View style={styles.container}>
        <Text>{errorMsg}</Text>
      </View>
    );
  }

  // Si todavía no hemos cargado la ubicación, mostramos un 'Cargando...'
  if (!region) {
    return (
      <View style={styles.container}>
        <Text>Obteniendo ubicación...</Text>
      </View>
    );
  }

  // Si todo está bien, mostramos el mapa centrado
  return (
    <MapView
      style={styles.map}
      region={region} // Usamos 'region' en lugar de 'initialRegion'
      showsUserLocation={true} // Muestra el punto azul de la ubicación del usuario
    >
      {/* Aquí es donde luego leeremos de Firestore
        para poner los marcadores de las cartas encontradas 
      */}
      <Marker
        coordinate={{ latitude: region.latitude, longitude: region.longitude }}
        title="Tu Ubicación"
      />
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
  container: { // Estilo para las pantallas de carga/error
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});