import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  serverTimestamp,
  where
} from 'firebase/firestore';
import React, { useState } from 'react';
import { Alert, Button, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebaseConfig';

export default function ScanScreen() {

  const [permission, requestPermission] = useCameraPermissions();
  const [isScanned, setIsScanned] = useState(false);
  const { user } = useAuth();

  // -------------------------------------------------------------------------
  // 🟣 LÓGICA COMPLETA DEL ESCÁNER (MISIÓN + NUEVA CARTA + YA EN MAZO)
  // -------------------------------------------------------------------------
  const handleBarCodeScanned = async ({ type, data }: { type: string; data: string }) => {

    if (isScanned) return;
    setIsScanned(true);

    if (!user) {
      Alert.alert("Error", "No se pudo identificar al usuario. Reinicia la app.");
      setIsScanned(false);
      return;
    }

    try {
      // ---------------------------------------------------------------------
      // 1️⃣ ¿YA TENGO ESTA CARTA EN MI MAZO?
      // ---------------------------------------------------------------------
      const foundQuery = query(
        collection(db, "found_cards"),
        where("userId", "==", user.uid),
        where("cardId", "==", data)
      );
      const foundSnap = await getDocs(foundQuery);

      if (!foundSnap.empty) {
        Alert.alert("¡Acción no válida!", "Ya tienes esta carta en tu mazo.");
        setIsScanned(false);
        return;
      }

      // ---------------------------------------------------------------------
      // 2️⃣ ¿ES UNA MISIÓN QUE ESTOY COMPLETANDO?
      // ---------------------------------------------------------------------
      const questQuery = query(
        collection(db, "quest_cards"),
        where("questOwnerId", "==", user.uid),
        where("cardId", "==", data),
        where("status", "==", "locked")
      );
      const questSnap = await getDocs(questQuery);

      let successMessage = "";

      if (!questSnap.empty) {
        // ES UNA MISIÓN
        const questDoc = questSnap.docs[0];

        // Borramos misión → ya no es pin gris
        await deleteDoc(doc(db, "quest_cards", questDoc.id));

        successMessage = `¡Misión completada!\nLa carta "${data}" se ha desbloqueado.`;
      } else {
        // ---------------------------------------------------------------------
        // 3️⃣ ES UNA CARTA NUEVA
        // ---------------------------------------------------------------------
        successMessage = `¡Carta encontrada!\nHas guardado la carta "${data}".`;
      }

      // ---------------------------------------------------------------------
      // 4️⃣ OBTENER UBICACIÓN Y GUARDAR found_cards
      // ---------------------------------------------------------------------
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        throw new Error("No tienes permisos de ubicación.");
      }

      let location = await Location.getCurrentPositionAsync({});

      const newCardData = {
        userId: user.uid,
        cardId: data,
        location: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        },
        timestamp: serverTimestamp(),
      };

      await addDoc(collection(db, "found_cards"), newCardData);

      Alert.alert("¡Éxito!", successMessage);

    } catch (error) {
      console.error("Error al escanear:", error);
      Alert.alert("Error", "No se pudo procesar el escaneo.");
    } finally {
      // Resetear el escáner
      setIsScanned(false);
    }
  };

  // -------------------------------------------------------------------------
  // Permisos de cámara
  // -------------------------------------------------------------------------
  if (!permission) {
    return (
      <View style={styles.container}>
        <Text>Solicitando permiso de cámara...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text>No se pudo acceder a la cámara. Activa el permiso.</Text>
        <Button title="Dar permiso" onPress={requestPermission} />
      </View>
    );
  }

  // -------------------------------------------------------------------------
  // RENDER
  // -------------------------------------------------------------------------
  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing="back"
        onBarcodeScanned={handleBarCodeScanned}
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
      />
      <View style={styles.infoBox}>
        <Text style={styles.infoText}>Apunta la cámara al QR de una carta</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  camera: {
    flex: 1,
    width: '100%',
  },
  infoBox: {
    position: 'absolute',
    bottom: 50,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 16,
    borderRadius: 10,
    alignSelf: 'center',
  },
  infoText: {
    color: 'white',
    fontSize: 16,
  }
});
