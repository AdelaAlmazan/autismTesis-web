import { useNavigate } from "react-router-dom"
import { Button } from "../components/ui/button"
import Header from "../components/header"
import PatientList from "../components/patient-list"

export default function DashboardPage() {
  const navigate = useNavigate()
  const handleAddPatient = () => navigate("/add-patient")

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      {/* Fondo tipo bosque con glass overlay */}
      <main className="flex-1 p-0">
        <div
          className="relative min-h-[calc(100vh-64px)] bg-gradient-to-b from-emerald-900 to-teal-900"
          style={{
            backgroundImage: "url('./images/forest-bg.png')", // opcional
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="absolute inset-0 bg-emerald-950/60 backdrop-blur-[2px]" />

          <div className="relative z-10 max-w-7xl mx-auto px-6 py-6">
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-3xl font-bold text-white/90">Pacientes</h1>
              <Button onClick={handleAddPatient} className="shadow-lg">
                + Agregar Paciente
              </Button>
            </div>

            <PatientList />
          </div>
        </div>
      </main>
    </div>
  )
}
