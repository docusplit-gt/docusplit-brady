import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Carga las variables de entorno del proceso actual
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    server: {
      port: 3000,
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
    },
    define: {
      // Reemplaza process.env.API_KEY por el valor de VITE_API_KEY en tiempo de compilación
      'process.env.API_KEY': JSON.stringify(env.VITE_API_KEY || env.API_KEY || "")
    }
  };
});