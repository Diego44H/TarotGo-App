import * as Location from 'expo-location';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebaseConfig';

// Tipo para nuestras cartas encontradas (Pines Morados)
interface FoundCard {
  id: string;
  cardId: string;
  location: { latitude: number; longitude: number };
  userId: string;
}

// Tipo para nuestras cartas de misión (Pines Grises)
interface QuestCard {
  id: string;
  cardId: string;
  location: { latitude: number; longitude: number };
  status: 'locked' | 'completed';
}

export default function MapScreen() {
  
  const [region, setRegion] = useState<Region | undefined>(undefined);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const { user } = useAuth();
  
  // --- 👇 ESTADOS SEPARADOS PARA CADA TIPO DE PIN ---
  const [foundCards, setFoundCards] = useState<FoundCard[]>([]);
  const [questCards, setQuestCards] = useState<QuestCard[]>([]); // ¡Nuevo estado!

  // 1. useEffect para la ubicación (igual que antes)
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permiso de ubicación denegado');
        setRegion({ latitude: 19.432608, longitude: -99.133209, latitudeDelta: 0.0922, longitudeDelta: 0.0421 });
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

  // 2. useEffect para PINES MORADOS ('found_cards')
  useEffect(() => {
    if (!user) return; 

    const q = query(collection(db, "found_cards"), where("userId", "==", user.uid)); 
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const cardsData: FoundCard[] = [];
      querySnapshot.forEach((doc) => {
        cardsData.push({ id: doc.id, ...doc.data() } as FoundCard);
      });
      setFoundCards(cardsData); // Guardar pines morados
    }, (error) => {
      console.error("Error al escuchar 'found_cards':", error);
      setErrorMsg("No se pudieron cargar tus cartas.");
    });
    return () => unsubscribe();
  }, [user]);

  // --- 👇 ¡NUEVO! ---
  // 3. useEffect para PINES GRISES ('quest_cards')
  useEffect(() => {
    if (!user) return;

    // Filtramos por el 'questOwnerId' que sea el nuestro
    const q = query(collection(db, "quest_cards"), where("questOwnerId", "==", user.uid));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const cardsData: QuestCard[] = [];
      querySnapshot.forEach((doc) => {
        cardsData.push({ id: doc.id, ...doc.data() } as QuestCard);
      });
      setQuestCards(cardsData); // Guardar pines grises
      console.log("Misiones cargadas en el mapa:", cardsData.length);
    }, (error) => {
      console.error("Error al escuchar 'quest_cards':", error);
      setErrorMsg("No se pudieron cargar las misiones.");
    });
    return () => unsubscribe();
  }, [user]);

  // --- Renderizado ---
  if (errorMsg && !region) { /* ... (error) ... */ }
  if (!region) { /* ... (cargando) ... */ }

  return (
    <MapView
      style={styles.map}
      region={region}
      showsUserLocation={true}
    >
      {/* 1. Dibujar los PINES MORADOS (encontrados) */}
      {foundCards.map(card => (
        <Marker
          key={card.id}
          coordinate={card.location}
          title={card.cardId}
          description="¡La encontraste!"
          pinColor="purple"
        />
      ))}

      {/* 2. Dibujar los PINES GRISES (misiones) */}
      {questCards.map(card => (
        <Marker
          key={card.id}
          coordinate={card.location}
          title={`${card.cardId} (Misión)`}
          description="Ve a esta ubicación para escanear la carta."
          pinColor="grey" // ¡Color gris!
        />
      ))}
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: { flex: 1 },
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});