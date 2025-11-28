import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig, loadEnv } from "vite"

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  
  const env = loadEnv(mode, process.cwd(), ['VITE_', 'OPENAIP_'])

  return {
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      }
    },
    define: {
      'import.meta.env.OPENAIP_URL': JSON.stringify(env.OPENAIP_URL),
      'import.meta.env.OPENAIP_API_KEY': JSON.stringify(env.OPENAIP_API_KEY)
    }
  }
})
