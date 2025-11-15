import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Button, StyleSheet, Text, View } from 'react-native';
import { db } from '../../firebaseConfig';
// Firestore
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  where
} from 'firebase/firestore';

import { useAuth } from '../../context/AuthContext';

// -------------------------------------
// TIPOS DE DATOS
// -------------------------------------
interface FoundCard {
  cardId: string;
  location: { latitude: number; longitude: number };
  userId: string;
}

interface TarotCard {
  nombre: string;
  numero: number;
  descripcion?: string;
}

interface QuestCard {
  questOwnerId: string;
  originalFoundCardId: string;
  cardId: string;
  location: { latitude: number; longitude: number };
  status: 'locked' | 'completed';
  timestamp: any;
}

// -------------------------------------
// COMPONENTE PRINCIPAL
// -------------------------------------
export default function CardDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>(); // ID del documento en found_cards
  const { user } = useAuth();
  const router = useRouter();

  // Estados para la carta
  const [foundCard, setFoundCard] = useState<FoundCard | null>(null);
  const [tarotCard, setTarotCard] = useState<TarotCard | null>(null);

  // Estados de control
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // NUEVA LÓGICA
  const [isFoundByMe, setIsFoundByMe] = useState(false);
  const [hasAcceptedQuest, setHasAcceptedQuest] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);

  // -------------------------------------
  // CARGA DE DATOS
  // -------------------------------------
  useEffect(() => {
    if (!id || !user) return;

    const fetchCardData = async () => {
      try {
        // 1. Buscar la carta encontrada
        const foundCardRef = doc(db, 'found_cards', id);
        const foundCardSnap = await getDoc(foundCardRef);

        if (!foundCardSnap.exists()) {
          setError("Este link es incorrecto o la carta ya no existe.");
          setLoading(false);
          return;
        }

        const foundData = foundCardSnap.data() as FoundCard;
        setFoundCard(foundData);

        // 2. Cargar la carta estática
        const tarotRef = doc(db, 'cards', foundData.cardId);
        const tarotSnap = await getDoc(tarotRef);

        if (tarotSnap.exists()) {
          setTarotCard(tarotSnap.data() as TarotCard);
        } else {
          setError("Datos de la carta no encontrados.");
        }

        // 3. Lógica de usuario
        if (foundData.userId === user.uid) {
          setIsFoundByMe(true); // Es mía
        } else {
          // Ver si ya acepté esta misión
          const questQuery = query(
            collection(db, 'quest_cards'),
            where('questOwnerId', '==', user.uid),
            where('originalFoundCardId', '==', id)
          );

          const questSnap = await getDocs(questQuery);

          if (!questSnap.empty) {
            setHasAcceptedQuest(true);
          }
        }

      } catch (err) {
        console.error("Error al cargar link:", err);
        setError("No se pudo cargar la carta.");
      } finally {
        setLoading(false);
      }
    };

    fetchCardData();
  }, [id, user]);

  // -------------------------------------
  // ACEPTAR MISIÓN
  // -------------------------------------
  const handleAcceptQuest = async () => {
    if (!user || !foundCard) return;

    setIsAccepting(true);

    try {
      const newQuest: Omit<QuestCard, 'timestamp'> = {
        questOwnerId: user.uid,
        originalFoundCardId: id!,
        cardId: foundCard.cardId,
        location: foundCard.location,
        status: 'locked'
      };

      await addDoc(collection(db, 'quest_cards'), {
        ...newQuest,
        timestamp: serverTimestamp()
      });

      Alert.alert(
        "¡Misión aceptada!",
        "La carta ha sido añadida a tu mapa como 'bloqueada'. Debes escanear el QR por ti mismo."
      );

      router.replace('/(tabs)');

    } catch (error) {
      console.error("Error al aceptar misión:", error);
      Alert.alert("Error", "No se pudo aceptar la misión.");
    } finally {
      setIsAccepting(false);
    }
  };

  // -------------------------------------
  // RENDERIZADO
  // -------------------------------------
  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#A020F0" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (!foundCard || !tarotCard) {
    return (
      <View style={styles.container}>
        <Text>No se encontraron datos de la carta.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>

      <Text style={styles.title}>{tarotCard.nombre}</Text>

      {/* OPCIÓN 1: Es mi carta */}
      {isFoundByMe && (
        <>
          <Text style={styles.info}>¡Esta carta ya está en tu mazo!</Text>
          <Text style={styles.description}>{tarotCard.descripcion}</Text>
        </>
      )}

      {/* OPCIÓN 2: Ya aceptaste la misión */}
      {!isFoundByMe && hasAcceptedQuest && (
        <>
          <Text style={styles.info}>Esta misión ya está en tu mapa.</Text>
          <Text style={styles.description}>Ve a escanear el QR para completarla.</Text>
        </>
      )}

      {/* OPCIÓN 3: No es mía y no he aceptado misión */}
      {!isFoundByMe && !hasAcceptedQuest && (
        <>
          <Text style={styles.description}>
            Un amigo te ha compartido la carta "{tarotCard.nombre}".
          </Text>

          <Text style={styles.lockedInfo}>
            ¿Quieres aceptar la misión y añadir esta carta bloqueada a tu mapa?
          </Text>

          <View style={styles.buttonContainer}>
            <Button
              title={isAccepting ? "Guardando..." : "Aceptar Misión"}
              onPress={handleAcceptQuest}
              disabled={isAccepting}
              color="#A020F0"
            />
          </View>
        </>
      )}

      <View style={styles.buttonContainer}>
        <Button 
          title="Volver al Mapa" 
          onPress={() => router.replace('/(tabs)')} 
          color="#555" 
        />
      </View>

    </View>
  );
}

// -------------------------------------
// ESTILOS
// -------------------------------------
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
    color: '#c0392b',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
  },
  errorText: {
    color: 'red',
    fontSize: 16,
  },
  buttonContainer: {
    width: '80%',
    marginVertical: 10,
  }
});
