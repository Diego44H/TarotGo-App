import * as Contacts from 'expo-contacts';
import { collection, deleteDoc, doc, onSnapshot, query, where } from 'firebase/firestore';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Button, FlatList, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebaseConfig';
import AssignCardModal from '../components/AssignCardModal';

// --- Tipos ---
interface PhoneContact {
  id: string;
  name: string;
  phoneNumber: string | null;
}

interface Assignment {
  docId: string;
  contactId: string;
  assignedCardId: string;
}

interface TarotCard {
  id: string;
  nombre: string;
}

interface MergedContact extends PhoneContact {
  assignment: {
    docId: string;
    cardName: string;
  } | null;
}

export default function ContactsScreen() {

  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [phoneContacts, setPhoneContacts] = useState<PhoneContact[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [allTarotCards, setAllTarotCards] = useState<Map<string, TarotCard>>(new Map());

  // --- Modal ---
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedContact, setSelectedContact] = useState<PhoneContact | null>(null);

  useEffect(() => {
    const loadPhoneContacts = async () => {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permiso denegado.');
        setLoading(false);
        return;
      }
      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.Name, Contacts.Fields.PhoneNumbers],
      });
      const formatted: PhoneContact[] = data.map(c => ({
        id: c.id!,
        name: c.name!,
        phoneNumber: c.phoneNumbers?.[0]?.number ?? null
      }));
      setPhoneContacts(formatted);
    };
    loadPhoneContacts();
  }, []);

  // --- 2. Cargar todas las cartas ---
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "cards"), (snapshot) => {
      const cardsMap = new Map<string, TarotCard>();
      snapshot.forEach(docu => {
        cardsMap.set(docu.id, { id: docu.id, ...docu.data() } as TarotCard);
      });
      setAllTarotCards(cardsMap);
    });
    return () => unsub();
  }, []);

  // --- 3. Cargar asignaciones del usuario ---
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "contact_assignments"),
      where("userId", "==", user.uid)
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const userAssignments: Assignment[] = snapshot.docs.map(docu => ({
        docId: docu.id,
        contactId: docu.data().contactId,
        assignedCardId: docu.data().assignedCardId
      }));

      setAssignments(userAssignments);
      setLoading(false);
    });

    return () => unsub();
  }, [user]);

  // --- 4. Fusionar datos ---
  const mergedContacts: MergedContact[] = useMemo(() => {
    const map = new Map<string, Assignment>();
    assignments.forEach(a => map.set(a.contactId, a));

    return phoneContacts.map(contact => {
      const assignment = map.get(contact.id);
      let cardAssignment = null;

      if (assignment) {
        const card = allTarotCards.get(assignment.assignedCardId);
        if (card) {
          cardAssignment = {
            docId: assignment.docId,
            cardName: card.nombre,
          };
        }
      }

      return {
        ...contact,
        assignment: cardAssignment
      };
    });
  }, [phoneContacts, assignments, allTarotCards]);

  // --- 5. Botones ---
  const handleAssignPress = (contact: PhoneContact) => {
    setSelectedContact(contact);
    setModalVisible(true);
  };

  const handleChangePress = (contact: MergedContact) => {
    setSelectedContact(contact);
    setModalVisible(true);
  };

  const handleRemovePress = async (assignmentDocId: string) => {
    Alert.alert(
      "Quitar Asignación",
      "¿Seguro que deseas quitar esta carta?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Quitar",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDoc(doc(db, "contact_assignments", assignmentDocId));
            } catch (e) {
              Alert.alert("Error", "No se pudo quitar.");
            }
          }
        }
      ]
    );
  };

  const handleCardAssigned = () => {
    setModalVisible(false);
    setSelectedContact(null);
    Alert.alert("¡Listo!", "Carta asignada con éxito.");
  };

  // --- Render ---
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#A020F0" />
      </View>
    );
  }

  if (errorMsg) {
    return (
      <View style={{ padding: 20 }}>
        <Text style={{ color: "red" }}>{errorMsg}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList<MergedContact>
        data={mergedContacts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        renderItem={({ item }) => (
          <View style={styles.contactItem}>
            <Text style={styles.contactName}>{item.name}</Text>
            {item.phoneNumber && (
              <Text style={styles.contactPhone}>{item.phoneNumber}</Text>
            )}

            <View style={styles.buttonContainer}>
              {item.assignment ? (
                <View>
                  <View style={styles.assignmentBox}>
                    <Text style={styles.assignmentText}>
                      Asignada: {item.assignment.cardName}
                    </Text>
                  </View>

                  <View style={styles.buttonRow}>
                    <Button
                      title="Cambiar"
                      onPress={() => handleChangePress(item)}
                      color="#A020F0"
                    />
                    <Button
                      title="Quitar"
                      onPress={() => handleRemovePress(item.assignment!.docId)}
                      color="#777"
                    />
                  </View>
                </View>
              ) : (
                <Button
                  title="Asignar Carta"
                  onPress={() => handleAssignPress(item)}
                  color="#A020F0"
                />
              )}
            </View>
          </View>
        )}
      />

      {/* Modal */}
      <AssignCardModal
        isVisible={modalVisible}
        contact={selectedContact}
        onClose={() => setModalVisible(false)}
        onCardAssigned={handleCardAssigned}
      />
    </View>
  );
}

// --- Estilos ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContainer: {
    padding: 16,
  },
  contactItem: {
    backgroundColor: "#fff",
    padding: 15,
    marginVertical: 8,
    borderRadius: 10,
  },
  contactName: {
    fontSize: 16,
    fontWeight: "bold",
  },
  contactPhone: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  buttonContainer: {
    marginTop: 10,
  },
  assignmentBox: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#f0e6f7",
    borderRadius: 5,
    alignSelf: "flex-start",
  },
  assignmentText: {
    color: "#A020F0",
    fontWeight: "bold",
  },
  buttonRow: {
    flexDirection: "row",
    marginTop: 10,
    gap: 10,
  },
});
