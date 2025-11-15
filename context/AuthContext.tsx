import { User, onAuthStateChanged, signInAnonymously } from 'firebase/auth'; // 👈 Importar signInAnonymously
import React, { ReactNode, createContext, useContext, useEffect, useState } from 'react';
import { auth } from '../firebaseConfig'; // Importamos el auth

// (La interfaz y la creación del contexto son iguales)
interface AuthContextType {
  user: User | null;
  loading: boolean;
}
const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
});

// (El Proveedor cambia)
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // --- 1. Usuario ya está logueado (normal o anónimo) ---
        setUser(user);
        console.log("Usuario ya logueado:", user.uid);
        setLoading(false);
      } else {
        // --- 2. No hay usuario, ¡creamos uno anónimo! ---
        try {
          const userCredential = await signInAnonymously(auth);
          setUser(userCredential.user);
          console.log("Nuevo usuario anónimo creado:", userCredential.user.uid);
        } catch (error) {
          console.error("Error al iniciar sesión anónima:", error);
          // Aquí podríamos mostrar un error fatal
        } finally {
          setLoading(false);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

// (El Hook 'useAuth' es el mismo)
export const useAuth = () => {
  return useContext(AuthContext);
};