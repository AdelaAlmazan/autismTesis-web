import Header from "../components/header"
import SessionConfiguration from "../components/session-configuration"

export default function ConfigurationPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 p-6">
        <div className="flex flex-col space-y-4">
          <h1 className="text-2xl font-bold">Configuración de Sesión</h1>
          <SessionConfiguration />
        </div>
      </main>
    </div>
  )
}

