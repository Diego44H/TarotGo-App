import * as Location from 'expo-location';
import React, { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import { db } from '../../firebaseConfig';
// 👇 ¡Importamos 'query' y 'where' para filtrar!
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext'; // 👈 1. IMPORTAR EL HOOK DE AUTH

interface FoundCard {
  id: string;
  cardId: string;
  location: { latitude: number; longitude: number };
  userId: string;
}

export default function MapScreen() {

  const [region, setRegion] = useState<Region | undefined>(undefined);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [foundCards, setFoundCards] = useState<FoundCard[]>([]);
  const { user } = useAuth(); // 👈 2. OBTENER EL USUARIO

  // 1. useEffect para la ubicación (igual que antes)
  useEffect(() => {
    (async () => {
      // ... (código de permisos de ubicación igual que antes)
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

  // 2. useEffect para escuchar las cartas (¡MODIFICADO!)
  useEffect(() => {
    // 👈 3. Si no hay usuario, no hacer nada (evita errores)
    if (!user) {
      return; 
    }

    // 👈 4. Crear una consulta (query) filtrada
    const cardsCollection = collection(db, "found_cards");
    const q = query(cardsCollection, where("userId", "==", user.uid)); // Filtra por el ID del usuario actual

    // Usamos 'q' (la consulta) en lugar de 'cardsCollection'
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const cardsData: FoundCard[] = [];
      querySnapshot.forEach((doc) => {
        cardsData.push({ id: doc.id, ...doc.data() } as FoundCard);
      });
      
      setFoundCards(cardsData);
      console.log("Cartas PROPIAS cargadas en el mapa:", cardsData.length);
      
    }, (error) => {
      console.error("Error al escuchar 'found_cards' propias:", error);
      setErrorMsg("No se pudieron cargar tus cartas en el mapa.");
    });

    return () => unsubscribe();
    
  }, [user]); // 👈 5. RE-EJECUTAR si el 'user' cambia

  // --- Renderizado (igual que antes) ---
  if (errorMsg && !region) { /* ... */ }
  if (!region) { /* ... */ }

  return (
    <MapView
      style={styles.map}
      region={region}
      showsUserLocation={true}
    >
      {/* Esto ahora solo muestra los pines del usuario actual */}
      {foundCards.map(card => (
        <Marker
          key={card.id}
          coordinate={card.location}
          title={card.cardId}
          description={`Encontrada por: Ti`} // Cambiado
          pinColor="purple"
        />
      ))}
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: { flex: 1 },
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});