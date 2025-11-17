import { addDoc, collection, getDocs, query, serverTimestamp, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Button, FlatList, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebaseConfig';

interface PhoneContact {
  id: string; 
  name: string;
}
interface UnlockedCard {
  cardId: string; 
  nombre: string;
}
interface Props {
  isVisible: boolean;
  contact: PhoneContact | null;
  onClose: () => void; 
  onCardAssigned: () => void; 
}

export default function AssignCardModal({ isVisible, contact, onClose, onCardAssigned }: Props) {
  
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [unlockedCards, setUnlockedCards] = useState<UnlockedCard[]>([]);

  useEffect(() => {
    if (!user || !isVisible) {
      if (!isVisible) setUnlockedCards([]); 
      return;
    }
    
    setLoading(true);
    const fetchUnlockedCards = async () => {
      try {
        // Primero, traemos TODAS las cartas (para los nombres)
        const cardsSnap = await getDocs(collection(db, "cards"));
        const cardsMap = new Map<string, string>(); // Map<cardId, nombre>
        cardsSnap.forEach(doc => {
          cardsMap.set(doc.id, doc.data().nombre);
        });

        // Segundo, traemos las que SÍ TENEMOS
        const foundQuery = query(collection(db, "found_cards"), where("userId", "==", user.uid));
        const foundSnap = await getDocs(foundQuery);
        
        const myCards: UnlockedCard[] = [];
        foundSnap.forEach(doc => {
          const cardId = doc.data().cardId;
          const cardName = cardsMap.get(cardId);
          if (cardName) {
            myCards.push({ cardId: cardId, nombre: cardName });
          }
        });
        
        setUnlockedCards(myCards);
      } catch (e) {
        console.error("Error cargando mazo para modal:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchUnlockedCards();
  }, [user, isVisible]); // Se re-ejecuta cada vez que el modal se hace visible

  // 2. Función para ASIGNAR la carta
  const handleAssignCard = async (card: UnlockedCard) => {
    if (!user || !contact) return;

    try {
      // Crear el nuevo documento de asignación
      await addDoc(collection(db, "contact_assignments"), {
        userId: user.uid,
        contactId: contact.id,
        contactName: contact.name, // Guardamos el nombre para referencia
        assignedCardId: card.cardId,
        timestamp: serverTimestamp()
      });
      
      onCardAssigned(); // Avisar que se asignó (para cerrar el modal)
      
    } catch (e) {
      console.error("Error al asignar carta:", e);
      onClose(); // Cerrar aunque haya error
    }
  };
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        <View style={styles.modalContainer}>
          <Text style={styles.title}>Asignar a {contact?.name}</Text>
          <Text style={styles.subtitle}>Elige una carta de tu mazo:</Text>

          {loading ? (
            <ActivityIndicator size="large" color="#A020F0" />
          ) : (
            <FlatList
              data={unlockedCards}
              keyExtractor={(item) => item.cardId}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={styles.cardItem} 
                  onPress={() => handleAssignCard(item)}>
                  <Text style={styles.cardName}>{item.nombre}</Text>
                </TouchableOpacity>
              )}/>
          )}
          <Button title="Cancelar" onPress={onClose} color="#777" />
        </View>
      </View>
    </Modal>
  );
}

// --- Estilos ---
const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)', // Fondo oscuro semitransparente
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: 'white',
    height: '60%', // Ocupa el 60% de la pantalla
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 15,
  },
  cardItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  cardName: {
    fontSize: 18,
    color: '#A020F0',
  }
});