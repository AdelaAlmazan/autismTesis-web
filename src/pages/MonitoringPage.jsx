import Header from "../components/header"
import GameMonitoring from "../components/game-monitoring"

export default function MonitoringPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 p-6">
        <div className="flex flex-col space-y-4">
          <h1 className="text-2xl font-bold">Monitoreo en Tiempo Real</h1>
          <GameMonitoring />
        </div>
      </main>
    </div>
  )
}

