import * as Location from 'expo-location';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebaseConfig';

// =======================
// Tipos
// =======================
interface FoundCard {
  id: string;
  cardId: string;
  location: { latitude: number; longitude: number };
  userId: string;
}

interface QuestCard {
  id: string;
  cardId: string;
  location: { latitude: number; longitude: number };
  status: 'locked' | 'completed';
}

// =======================
// Importación dinámica del mapa
// =======================
let MapView: any = View;
let Marker: any = View;
let RegionType: any = null;

if (Platform.OS !== 'web') {
  const maps = require('react-native-maps');
  MapView = maps.default;
  Marker = maps.Marker;
  RegionType = maps.Region;
}

export default function MapScreen() {
  const [region, setRegion] = useState<typeof RegionType | undefined>(undefined);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const { user } = useAuth();

  const [foundCards, setFoundCards] = useState<FoundCard[]>([]);
  const [questCards, setQuestCards] = useState<QuestCard[]>([]);

  // =======================
  // Ubicación
  // =======================
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        setErrorMsg('Permiso de ubicación denegado');

        if (Platform.OS !== 'web') {
          setRegion({
            latitude: 19.432608,
            longitude: -99.133209,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          });
        }
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      });
    })();
  }, []);

  // =======================
  // Pines Morados
  // =======================
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'found_cards'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const cards: FoundCard[] = [];
        querySnapshot.forEach((doc) =>
          cards.push({ id: doc.id, ...doc.data() } as FoundCard)
        );
        setFoundCards(cards);
      },
      (error) => console.error('Error al escuchar found_cards:', error)
    );

    return () => unsubscribe();
  }, [user]);

  // =======================
  // Pines Grises
  // =======================
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'quest_cards'),
      where('questOwnerId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const cards: QuestCard[] = [];
        querySnapshot.forEach((doc) =>
          cards.push({ id: doc.id, ...doc.data() } as QuestCard)
        );
        setQuestCards(cards);
      },
      (error) => console.error('Error al escuchar quest_cards:', error)
    );

    return () => unsubscribe();
  }, [user]);

  // =======================
  // Render Web
  // =======================
  if (Platform.OS === 'web') {
    return (
      <View style={styles.container}>
        <Text style={styles.webText}>El mapa interactivo solo está disponible en la app móvil.</Text>
        <Text style={styles.webDescription}>
          Tu sitio web está funcionando, pero esta función es exclusiva para iOS y Android.
        </Text>
      </View>
    );
  }

  // =======================
  // Render nativo
  // =======================
  if (errorMsg && !region) {
    return (
      <View style={styles.container}>
        <Text>{errorMsg}</Text>
      </View>
    );
  }

  if (!region) {
    return (
      <View style={styles.container}>
        <Text>Obteniendo ubicación...</Text>
      </View>
    );
  }

  return (
    <MapView style={styles.map} region={region} showsUserLocation={true}>
      {/* Pines Morados */}
      {foundCards.map((card) => (
        <Marker
          key={card.id}
          coordinate={card.location}
          title={card.cardId}
          description="¡La encontraste!"
          pinColor="purple"
        />
      ))}

      {/* Pines Grises */}
      {questCards.map((card) => (
        <Marker
          key={card.id}
          coordinate={card.location}
          title={`${card.cardId} (Misión)`}
          description="Ve a esta ubicación para escanear la carta."
          pinColor="grey"
        />
      ))}
    </MapView>
  );
}

// =======================
// Estilos
// =======================
const styles = StyleSheet.create({
  map: { flex: 1 },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  webText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  webDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});
