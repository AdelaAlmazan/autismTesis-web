import { useNavigate } from "react-router-dom"
import PatientList from "../components/patient-list"
import { Button } from "../components/ui/button"
import Header from "../components/header" // ✅ Asegúrate que la ruta sea correcta

export default function DashboardPage() {
  const navigate = useNavigate()

  const handleAddPatient = () => {
    navigate("/add-patient")
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header /> {/* ✅ Encabezado fijo de la app */}
      <main className="flex-1 p-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Panel de Pacientes</h1>
          <Button onClick={handleAddPatient}>+ Agregar Paciente</Button>
        </div>
        <PatientList />
      </main>
    </div>
  )
}

