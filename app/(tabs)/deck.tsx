import { collection, getDocs, onSnapshot, query, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebaseConfig';

interface TarotCard {
  id: string; 
  nombre: string;
  numero: number;
  descripcion: string;
}

interface MergedCard extends TarotCard {
  found: boolean;
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
        const cardsSnapshot = await getDocs(collection(db, "cards"));
        const allCards: TarotCard[] = cardsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as TarotCard[];
        const foundCardsQuery = query(collection(db, "found_cards"), where("userId", "==", user.uid));
        const unsubscribe = onSnapshot(foundCardsQuery, (foundSnapshot) => {
          const foundCardsSet = new Set<string>();
          foundSnapshot.forEach(doc => {
            foundCardsSet.add(doc.data().cardId); 
          });
          const mergedData = allCards.map(card => ({
            ...card,
            found: foundCardsSet.has(card.id),
          }));

          setMergedCards(mergedData);
          setLoading(false);
          setError(null);
        });
        return unsubscribe;

      } catch (e) { }
    };
    fetchAndMergeCards();
  }, [user]);

  if (loading) { /* ... (cargando) ... */ }
  if (error) { /* ... (error) ... */ }

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
        </View>
      )}
      contentContainerStyle={styles.listContainer}
    />
  );
}

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
});