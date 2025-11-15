const { initializeApp } = require("firebase/app");
const { getFirestore, collection, doc, setDoc } = require("firebase/firestore");
const fs = require('fs'); // Módulo 'fs' para leer archivos del sistema

// --- IMPORTANTE: Copia tu firebaseConfig aquí ---
// (No podemos usar process.env aquí porque es un script de Node, no de Expo)
const firebaseConfig = {
    apiKey: "AIzaSyDTrDrSHN0d_rv0L8l219GhvE81EpOr2wA",
    authDomain: "tarotgo-abd97.firebaseapp.com",
    projectId: "tarotgo-abd97",
    storageBucket: "tarotgo-abd97.firebasestorage.app",
    messagingSenderId: "543987820494",
    appId: "1:543987820494:web:fe91d0fba3a794d1cead9f"
};

// Cargar los datos del JSON
const tarotData = require('./tarot-data.json');

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Función para subir los datos
const uploadData = async () => {
    console.log("Empezando la subida de cartas...");

    // Vamos a la colección 'cards'
    const cardsCollection = collection(db, 'cards');

    // Iteramos sobre cada carta en nuestro archivo JSON
    for (const carta of tarotData.arcanos_mayores) {

        // Usamos el 'id' de la carta como ID del documento en Firestore
        const docRef = doc(cardsCollection, carta.id);

        try {
            // Usamos setDoc para crear o sobrescribir el documento
            await setDoc(docRef, carta);
            console.log(`Carta "${carta.nombre}" subida correctamente.`);
        } catch (error) {
            console.error(`Error subiendo "${carta.nombre}":`, error);
        }
    }

    console.log("¡Subida de datos completada!");
    process.exit(0); // Terminar el script
};

// Ejecutar la función
uploadData();