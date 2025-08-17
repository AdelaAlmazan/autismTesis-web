import { useEffect, useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { db, auth } from "../firebase";
import PatientDetails from "./patient-details";
import { Play, Settings, Pencil } from "lucide-react";

export default function PatientList() {
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        const q = query(collection(db, "patients"), where("createdBy", "==", user.uid));
        const snapshot = await getDocs(q);
        const loaded = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        setPatients(loaded);
      } catch (e) {
        console.error("Error al cargar pacientes:", e);
      } finally {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const goToEdit = (patient) => {
    // Navega a la pantalla de edición y pasa también el paciente por state (opcional)
    navigate(`/patients/${patient.id}/edit`, { state: { patient } });
  };

  if (loading) return <p className="text-center text-white/90">Cargando pacientes...</p>;

  return (
    <div className="flex flex-col md:flex-row gap-6">
      {/* Lateral izquierdo */}
      <aside className="w-full md:w-[420px]">
        <div className="rounded-2xl bg-white/10 border border-white/10 shadow-2xl p-4">
          <h2 className="text-2xl font-semibold text-white mb-3">Mis pacientes</h2>

          <div className="max-h-[560px] overflow-y-auto pr-2 space-y-3 custom-scroll">
            {patients.length === 0 ? (
              <p className="text-white/80">No hay pacientes registrados.</p>
            ) : (
              patients.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPatient(p)}
                  className={`group w-full text-left rounded-xl border transition
                    border-white/10 bg-white/10 hover:bg-white/20
                    ${selectedPatient?.id === p.id ? "ring-2 ring-emerald-300/70" : ""}`}
                >
                  <div className="flex gap-4 p-3 items-center">
                    <img
                      src={p.photoURL || "/placeholder.svg"}
                      alt={p.name || "Paciente"}
                      className="w-24 h-16 rounded-xl object-cover bg-black/20"
                    />

                    <div className="flex-1 text-white">
                      <p className="text-sm">
                        <span className="font-semibold">Nombre: </span>
                        {p.name || "—"}
                      </p>
                      <p className="text-sm">
                        <span className="font-semibold">Edad: </span>
                        {p.age ?? "—"} {typeof p.age === "number" ? "años" : ""}
                      </p>
                      <p className="text-xs opacity-90 line-clamp-1">
                        <span className="font-semibold">Sensibilidad sensorial: </span>
                        {/* en tus docs a veces es "sensitivity" y a veces "sensorySensitivity" */}
                        {p.sensitivity || p.sensorySensitivity || "NA"}
                      </p>
                      <p className="text-xs opacity-90 line-clamp-1">
                        <span className="font-semibold">Intereses: </span>
                        {p.interests || "—"}
                      </p>
                      <p className="text-xs">
                        <span className="font-semibold">Nivel de autismo: </span>
                        {p.autismLevel ?? "N/E"}
                      </p>
                    </div>

                    {/* Acciones */}
                    <div className="flex flex-col gap-2 pl-2">
                      <span
                        title="Iniciar sesión/actividad"
                        className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-white/20 bg-white/10 hover:bg-white/20"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Play className="w-5 h-5 text-white" />
                      </span>
                      <span
                        title="Configuración"
                        className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-white/20 bg-white/10 hover:bg-white/20"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Settings className="w-5 h-5 text-white" />
                      </span>
                    </div>

                    {/* Editar (lapicito) */}
                    <button
                      type="button"
                      title="Editar paciente"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation(); // evita seleccionar la tarjeta
                        goToEdit(p);
                      }}
                      className="ml-2 inline-flex items-center justify-center w-9 h-9 rounded-full border border-white/20 bg-white/10 hover:bg-white/20 focus:outline-none"
                    >
                      <Pencil className="w-5 h-5 text-white" />
                    </button>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </aside>

      {/* Panel derecho */}
      <section className="flex-1">
        <div className="rounded-2xl bg-gray-100/90 min-h-[560px] shadow-xl border border-gray-200 p-6 flex items-center justify-center">
          {selectedPatient ? (
            <div className="w-full">
              <PatientDetails patient={selectedPatient} />
            </div>
          ) : (
            <div className="text-center text-gray-600">
              {/* Placeholder de robot (SVG sencillo) */}
              <svg
                viewBox="0 0 256 256"
                className="mx-auto mb-4 w-40 h-40"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect x="56" y="64" width="144" height="112" rx="16" fill="#CBD5E1" />
                <circle cx="104" cy="120" r="12" fill="#334155" />
                <circle cx="152" cy="120" r="12" fill="#334155" />
                <rect x="112" y="144" width="32" height="12" rx="6" fill="#334155" />
                <rect x="88" y="40" width="80" height="24" rx="8" fill="#94A3B8" />
                <rect x="32" y="96" width="16" height="48" rx="8" fill="#94A3B8" />
                <rect x="208" y="96" width="16" height="48" rx="8" fill="#94A3B8" />
              </svg>
              <p className="text-base">Selecciona un paciente para ver su avance</p>
            </div>
          )}
        </div>
      </section>

      {/* Estilos para el scrollbar del panel izquierdo */}
      <style>{`
        .custom-scroll::-webkit-scrollbar { width: 10px; }
        .custom-scroll::-webkit-scrollbar-track { background: transparent; }
        .custom-scroll::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.18);
          border-radius: 9999px;
          border: 2px solid rgba(0,0,0,0);
          background-clip: padding-box;
        }
        .custom-scroll { scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.18) transparent; }
      `}</style>
    </div>
  );
}
