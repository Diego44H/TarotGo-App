import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Button, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebaseConfig';

// Tipo para la carta ENCONTRADA
interface FoundCard {
  cardId: string;
  location: { latitude: number; longitude: number };
  userId: string;
  timestamp: any;
}

// Tipo para la carta ESTÁTICA
interface TarotCard {
  nombre: string;
  numero: number;
  descripcion: string;
}

export default function CardDetailScreen() {
  // 1. Obtenemos el [id] del link (ej. "xyz123")
  const { id } = useLocalSearchParams<{ id: string }>();
  
  const [foundCard, setFoundCard] = useState<FoundCard | null>(null);
  const [tarotCard, setTarotCard] = useState<TarotCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFoundByMe, setIsFoundByMe] = useState(false);
  
  const { user } = useAuth(); // Para ver si la carta es nuestra
  const router = useRouter(); // Para volver al mapa

  useEffect(() => {
    if (!id) return; // Si no hay ID, no hacer nada

    const fetchCardData = async () => {
      try {
        // --- 2. Buscar la CARTA ENCONTRADA (de 'found_cards') ---
        const foundCardRef = doc(db, 'found_cards', id);
        const foundCardSnap = await getDoc(foundCardRef);

        if (!foundCardSnap.exists()) {
          setError("Esta carta ya no existe o el link es incorrecto.");
          setLoading(false);
          return;
        }

        const foundData = foundCardSnap.data() as FoundCard;
        setFoundCard(foundData);
        
        // Verificamos si esta carta la encontré yo
        if (user && foundData.userId === user.uid) {
          setIsFoundByMe(true);
        }

        // --- 3. Buscar la CARTA ESTÁTICA (de 'cards') ---
        // Usamos el 'cardId' (ej. "el_mago") de la carta encontrada
        const tarotCardRef = doc(db, 'cards', foundData.cardId);
        const tarotCardSnap = await getDoc(tarotCardRef);

        if (tarotCardSnap.exists()) {
          setTarotCard(tarotCardSnap.data() as TarotCard);
        } else {
          setError("Datos de la carta no encontrados.");
        }

      } catch (err) {
        console.error("Error al cargar carta del link:", err);
        setError("No se pudo cargar la carta.");
      } finally {
        setLoading(false);
      }
    };

    fetchCardData();
  }, [id, user]); // Se ejecuta si cambia el 'id' o el 'user'

  // --- Renderizado ---
  if (loading) {
    return <View style={styles.container}><ActivityIndicator size="large" color="#A020F0" /></View>;
  }

  if (error) {
    return <View style={styles.container}><Text style={styles.errorText}>{error}</Text></View>;
  }

  if (!foundCard || !tarotCard) {
    return <View style={styles.container}><Text>No se encontraron datos.</Text></View>;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{tarotCard.nombre}</Text>
      
      {/* 4. Lógica de "Bloqueado" (tu idea original) */}
      {isFoundByMe ? (
        <>
          <Text style={styles.description}>{tarotCard.descripcion}</Text>
          <Text style={styles.info}>¡Esta carta ya está en tu mazo!</Text>
        </>
      ) : (
        <>
          <Text style={styles.description}>
            Un amigo te ha compartido la carta "{tarotCard.nombre}".
          </Text>
          <Text style={styles.lockedInfo}>
            Para desbloquearla en tu mazo, ¡debes escanear el QR tú mismo!
          </Text>
          {/* Aquí podríamos añadir un botón para "Ver en el Mapa" */}
        </>
      )}

      <Button title="Volver al Mapa" onPress={() => router.replace('/(tabs)')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    marginBottom: 15,
  },
  info: {
    fontSize: 16,
    color: '#A020F0',
    fontWeight: 'bold',
    marginBottom: 30,
  },
  lockedInfo: {
    fontSize: 16,
    color: '#c0392b', // Rojo
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
  },
  errorText: {
    color: 'red',
    fontSize: 16,
  },
});