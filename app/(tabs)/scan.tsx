import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location'; // Importamos la ubicación
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'; // Funciones de Firestore
import React, { useState } from 'react';
import { Alert, Button, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebaseConfig'; // Importamos la BD

export default function ScanScreen() {
  
  const [permission, requestPermission] = useCameraPermissions();
  const [isScanned, setIsScanned] = useState(false);
  const { user } = useAuth();

const handleBarCodeScanned = async ({ type, data }: { type: string, data: string }) => {
    
    if (isScanned) return; // Si ya escaneó, no hacer nada
    setIsScanned(true); // Bloquear nuevos escaneos
    
    // 1. VERIFICAR QUE TENEMOS UN USUARIO
    if (!user) {
      Alert.alert("Error", "No se ha podido identificar al usuario. Reinicia la app.");
      setIsScanned(false);
      return;
    }
    // (La línea "usuario_de_prueba_123" ya se fue)

    try {
      // 2. Obtener la ubicación actual
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert("Error", "No tienes permisos de ubicación para guardar la carta.");
        setIsScanned(false);
        return;
      }
      
      let location = await Location.getCurrentPositionAsync({});
      
      // 3. Preparar el nuevo documento (¡con el user.uid real!)
      const newCardData = {
        userId: user.uid,
        cardId: data, // "el_mago", "el_loco", etc.
        location: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        },
        timestamp: serverTimestamp() 
      };

      // 4. Guardar en la colección 'found_cards'
      const docRef = await addDoc(collection(db, "found_cards"), newCardData);
      
      console.log("Carta guardada con ID:", docRef.id);
      
      // 5. Confirmar al usuario
      Alert.alert(
        "¡Carta Encontrada!",
        `¡Has guardado la carta "${data}" en tu ubicación!`,
        [
          { text: "OK", onPress: () => setIsScanned(false) } // Permitir escanear de nuevo
        ]
      );

    } catch (error) {
      console.error("Error al guardar la carta:", error);
      Alert.alert("Error", "No se pudo guardar la carta en la base de datos.");
      setIsScanned(false); // Permitir reintentar
    }
  };
  
  // --- Renderizado (mismo código de permisos que antes) ---
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
        <Text>No se pudo acceder a la cámara. Por favor, activa el permiso.</Text>
        <Button title="Dar Permiso" onPress={requestPermission} />
      </View>
    );
  }

  // Cámara con el escáner activado
  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing="back"
        onBarcodeScanned={handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ["qr"],
        }}
      >
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>Apunta la cámara al QR de una carta</Text>
        </View>
      </CameraView>
    </View>
  );
}

// --- Estilos (mismo código de antes) ---
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