import { collection, getDocs } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { db } from '../../firebaseConfig'; // Importamos nuestra conexión a Firestore

// Definimos un tipo para nuestros datos de Carta (buena práctica con TypeScript)
interface TarotCard {
  id: string;
  nombre: string;
  numero: number;
  descripcion: string;
}

export default function DeckScreen() {
  // Estado para guardar las cartas que vienen de Firebase
  const [cards, setCards] = useState<TarotCard[]>([]);
  // Estado para saber si estamos cargando los datos
  const [loading, setLoading] = useState(true);
  // Estado para cualquier error
  const [error, setError] = useState<string | null>(null);

  // useEffect para cargar los datos cuando la pantalla se abre
  useEffect(() => {
    const fetchCards = async () => {
      try {
        // 1. Apuntamos a la colección 'cards'
        const querySnapshot = await getDocs(collection(db, "cards"));
        
        // 2. Mapeamos los resultados y los guardamos en un array
        const cardsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as TarotCard[]; // Le decimos que los datos son de tipo TarotCard

        setCards(cardsData); // Guardamos los datos en el estado
      } catch (e) {
        console.error("Error al obtener las cartas:", e);
        setError("No se pudieron cargar las cartas.");
      } finally {
        setLoading(false); // Terminamos de cargar (ya sea con éxito o error)
      }
    };

    fetchCards();
  }, []); // El [] asegura que solo se ejecute una vez

  // --- Renderizado ---

  // Si está cargando, mostramos un indicador
  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#A020F0" />
      </View>
    );
  }

  // Si hubo un error
  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  // Si todo salió bien, mostramos la lista de cartas
  return (
    <FlatList
      data={cards} // Los datos que cargamos
      keyExtractor={(item) => item.id} // El ID único para cada item
      renderItem={({ item }) => (
        <View style={styles.cardItem}>
          <Text style={styles.cardTitle}>{item.nombre} (Arcano {item.numero})</Text>
          <Text style={styles.cardDescription}>{item.descripcion}</Text>
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
  errorText: {
    color: 'red',
    fontSize: 16,
  }
});