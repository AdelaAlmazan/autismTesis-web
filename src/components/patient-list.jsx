import { useEffect, useState } from "react"
import { collection, query, where, getDocs } from "firebase/firestore"
import { onAuthStateChanged } from "firebase/auth"
import { db, auth } from "../firebase"
import PatientDetails from "./patient-details"

export default function PatientList() {
  const [patients, setPatients] = useState([])
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        console.warn("⚠️ Usuario no autenticado")
        setLoading(false)
        return
      }

      try {
        const q = query(collection(db, "patients"), where("createdBy", "==", user.uid))
        const querySnapshot = await getDocs(q)
        const loadedPatients = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        console.log("✅ Pacientes cargados:", loadedPatients)
        setPatients(loadedPatients)
      } catch (error) {
        console.error("❌ Error al cargar pacientes:", error)
      } finally {
        setLoading(false)
      }
    })

    return () => unsubscribe()
  }, [])

  if (loading) return <p className="text-center">Cargando pacientes...</p>

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Mis Pacientes</h2>
        {patients.length === 0 ? (
          <p>No hay pacientes registrados.</p>
        ) : (
          patients.map((patient) => (
            <div
              key={patient.id}
              className={`p-4 border rounded cursor-pointer ${
                selectedPatient?.id === patient.id ? "bg-blue-100" : ""
              }`}
              onClick={() => setSelectedPatient(patient)}
            >
              <div className="flex items-center space-x-4">
                <img
                  src={patient.photoURL || "/placeholder.svg"}
                  alt={patient.name}
                  className="w-16 h-16 rounded-full object-cover"
                />
                <div>
                  <h3 className="font-semibold">{patient.name}</h3>
                  <p className="text-sm text-gray-600">
                    {patient.age} años | Nivel: {patient.autismLevel || "N/E"}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="md:col-span-2">
        {selectedPatient ? (
         <PatientDetails patient={selectedPatient} />
        ) : (
          <div className="flex justify-center items-center h-full border rounded p-4 text-gray-500">
            Selecciona un paciente para ver los detalles
          </div>
        )}
      </div>
    </div>
  )
}