import { useRouter } from 'expo-router'; // 👈 1. Importar el router
import React from 'react'; // 👈 Importar React
import { Button, StyleSheet, Text, View } from 'react-native'; // 👈 Importar Button

export default function ProfileScreen() {
  const router = useRouter(); // 👈 2. Inicializar el router

  const handleTestLink = () => {
    // 👇 ¡Tu ID de prueba está correcto!
    const testCardId = "ci9deQgO0sgPBR3spODa"; 

    // 3. Ahora 'router' sí existe
    router.push(`/card/${testCardId}`);
  };

  return (
    <View style={styles.container}>
      <Text>Pantalla de Perfil</Text>

      {/* 4. Añadir el botón para llamar a la función */}
      <View style={styles.buttonContainer}>
        <Button 
          title="Probar Link (Simular Clic de Amigo)"
          onPress={handleTestLink}
          color="#A020F0"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  buttonContainer: {
    marginTop: 30,
    width: '80%',
  }
});