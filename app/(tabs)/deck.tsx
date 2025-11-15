import { collection, getDocs, onSnapshot, query, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Button, FlatList, Share, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebaseConfig';

// Tipo para las cartas estáticas
interface TarotCard {
  id: string;
  nombre: string;
  numero: number;
  descripcion: string;
}

// 👈 Tipo modificado
interface MergedCard extends TarotCard {
  found: boolean;
  foundCardDocId: string | null;
}

export default function DeckScreen() {
  const [mergedCards, setMergedCards] = useState<MergedCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const fetchAndMergeCards = async () => {
      try {
        // 1. Obtener TODAS las cartas
        const cardsSnapshot = await getDocs(collection(db, "cards"));
        const allCards: TarotCard[] = cardsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as TarotCard[];

        // 2. Escuchar las cartas encontradas
        const foundCardsQuery = query(collection(db, "found_cards"), where("userId", "==", user.uid));

        const unsubscribe = onSnapshot(foundCardsQuery, (foundSnapshot) => {

          // 👈 Map modificado => Map<cardId, foundCardDocId>
          const foundCardsMap = new Map<string, string>();
          foundSnapshot.forEach(doc => {
            foundCardsMap.set(doc.data().cardId, doc.id);
          });

          // 👈 Fusión modificada
          const mergedData = allCards.map(card => ({
            ...card,
            found: foundCardsMap.has(card.id),
            foundCardDocId: foundCardsMap.get(card.id) || null,
          }));

          setMergedCards(mergedData);
          setLoading(false);
          setError(null);

        }, (err) => {
          console.error("Error escuchando found_cards:", err);
          setError("No se pudieron cargar las cartas encontradas.");
          setLoading(false);
        });

        return unsubscribe;

      } catch (e) {
        console.error("Error en FETCH:", e);
        setError("No se pudieron cargar las cartas.");
        setLoading(false);
      }
    };

    fetchAndMergeCards();

  }, [user]);


  // 👈 Función compartir
  const handleShare = async (card: MergedCard) => {
    if (!card.foundCardDocId) return;

    // Este es el link que queremos compartir
    const deepLink = `https://tarotgoapp.vercel.app/card/${card.foundCardDocId}`;

    try {
      // Usamos la API Share
      await Share.share({
        // 'message' es el texto que se enviará
        message: `¡Encontré una carta! Ábrela en TarotGo: ${deepLink}`,
        // 'title' es para el diálogo de Android
        title: `¡Te comparto la carta ${card.nombre}!`
      });
    } catch (error) {
      Alert.alert("Error", "No se pudo compartir la carta.");
    }
  };


  // Renderizado
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

  return (
    <FlatList
      data={mergedCards}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <View style={[styles.cardItem, !item.found && styles.cardItemLocked]}>
          <Text style={[styles.cardTitle, !item.found && styles.cardTextLocked]}>
            {item.nombre} {item.found ? "✅" : "(Bloqueada)"}
          </Text>

          <Text style={[styles.cardDescription, !item.found && styles.cardTextLocked]}>
            {item.found ? item.descripcion : "Escanea esta carta para desbloquearla."}
          </Text>

          {/* 👈 Botón agregar */}
          {item.found && (
            <View style={styles.shareButton}>
              <Button 
                title="Compartir"
                onPress={() => handleShare(item)}
                color="#A020F0"
              />
            </View>
          )}
        </View>
      )}
      contentContainerStyle={styles.listContainer}
    />
  );
}


// --- Estilos ---
const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  listContainer: {
    padding: 16,
  },
  cardItem: {
    backgroundColor: '#fff',
    padding: 20,
    marginVertical: 8,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 2,
    borderColor: '#A020F0',
  },
  cardItemLocked: {
    backgroundColor: '#e0e0e0',
    borderColor: '#999',
    shadowOpacity: 0.05,
    elevation: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  cardDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  cardTextLocked: {
    color: '#777',
  },
  errorText: {
    color: 'red',
    fontSize: 16,
  },
  shareButton: {
    marginTop: 10,
    alignSelf: 'flex-start',
  }
});
