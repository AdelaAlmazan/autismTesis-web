import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { db, auth as primaryAuth } from "../firebase";

import {
  addDoc,
  collection,
  getDocs,
  doc,
  query,
  where,
  setDoc,
} from "firebase/firestore";

import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";

import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  getAuth as getAuthClient,
} from "firebase/auth";

import { initializeApp, getApps, getApp } from "firebase/app";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Button } from "../components/ui/button";
import { Plus, Trash2 } from "lucide-react";

/* ------------------------- Auth secundaria ------------------------- */
function useSecondaryAuth() {
  const [secondaryAuth, setSecondaryAuth] = useState(null);
  useEffect(() => {
    const cfg = primaryAuth?.app?.options;
    if (!cfg) return;

    const app = getApps().some((a) => a.name === "SecondaryApp")
      ? getApp("SecondaryApp")
      : initializeApp(cfg, "SecondaryApp");

    setSecondaryAuth(getAuthClient(app));
  }, []);
  return secondaryAuth;
}

/* ============================ Componente =========================== */
export default function AddUser() {
  const navigate = useNavigate();
  const secondaryAuth = useSecondaryAuth();

  const [step, setStep] = useState("choose"); // "choose" | "patient" | "therapist"
  const [currentUser, setCurrentUser] = useState(null);

  // ---- Paciente
  const [p_name, setPName] = useState("");
  const [p_birth, setPBirth] = useState("");
  const [p_autism, setPAutism] = useState("nivel 1");
  const [p_interests, setPInterests] = useState("");
  const [p_sensitivity, setPSensitivity] = useState("");
  const [p_therapist, setPTherapist] = useState("");
  const [p_therapistName, setPTherapistName] = useState("");
  const [p_photoFile, setPPhotoFile] = useState(null);
  const [p_photoPreview, setPPhotoPreview] = useState(null);

  // ---- Terapeuta
  const [t_name, setTName] = useState("");
  const [t_email, setTEmail] = useState("");
  const [t_password, setTPassword] = useState("");
  const [t_birth, setTBirth] = useState("");

  const [therapists, setTherapists] = useState([]);
  const [loading, setLoading] = useState(false);

  // sesión y catálogo de terapeutas
  useEffect(() => {
    const unsub = onAuthStateChanged(primaryAuth, async (u) => {
      setCurrentUser(u || null);

      const qUsers = query(
        collection(db, "users"),
        where("role", "in", ["user", "terapeuta", "User", "Terapeuta"])
      );
      const snap = await getDocs(qUsers);
      const list = snap.docs.map((d) => ({ uid: d.id, ...(d.data() || {}) }));
      setTherapists(list);
    });
    return () => unsub();
  }, []);

  // util edad
  const calculateAge = (birth) => {
    if (!birth) return null;
    const b = new Date(birth);
    const t = new Date();
    let age = t.getFullYear() - b.getFullYear();
    const m = t.getMonth() - b.getMonth();
    if (m < 0 || (m === 0 && t.getDate() < b.getDate())) age--;
    return age;
  };
  const p_agePreview = useMemo(() => calculateAge(p_birth), [p_birth]);

  const onPhotoChange = (e) => {
    const f = e.target.files?.[0];
    setPPhotoFile(f || null);
    if (f) {
      const r = new FileReader();
      r.onloadend = () => setPPhotoPreview(r.result);
      r.readAsDataURL(f);
    } else setPPhotoPreview(null);
  };

  /* -------------------------- Guardar paciente -------------------------- */
  const handleSavePatient = async () => {
    if (!currentUser) return alert("Debes iniciar sesión.");
    if (!p_name || !p_birth || !p_autism || !p_therapist)
      return alert("Completa los campos obligatorios (incluye Terapeuta).");

    const age = calculateAge(p_birth);
    if (age === null || age < 0) return alert("Fecha de nacimiento inválida.");

    try {
      setLoading(true);

      let photoURL = "";
      if (p_photoFile) {
        const storage = getStorage();
        const ref = storageRef(
          storage,
          `patients_photos/${currentUser.uid}_${Date.now()}`
        );
        await uploadBytes(ref, p_photoFile);
        photoURL = await getDownloadURL(ref);
      }

      await addDoc(collection(db, "patients"), {
        name: p_name,
        birthDate: p_birth,
        age,
        autismLevel: p_autism,
        interests: p_interests,
        sensitivity: p_sensitivity,
        photoURL,
        createdBy: currentUser.uid,
        assignedTo: p_therapist,
        createdAt: new Date().toISOString(),
      });

      alert("✅ Paciente creado y ligado al terapeuta.");
      navigate("/dashboard");
    } catch (e) {
      console.error(e);
      alert("Error al guardar paciente: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  /* -------------------------- Guardar terapeuta ------------------------- */
  const handleSaveTherapist = async () => {
    if (!t_name || !t_email || !t_password)
      return alert("Nombre, correo y contraseña son obligatorios.");

    if (!secondaryAuth)
      return alert("Auth secundaria no disponible. Intenta nuevamente.");

    try {
      setLoading(true);

      const cred = await createUserWithEmailAndPassword(
        secondaryAuth,
        t_email,
        t_password
      );
      const newUser = cred.user;

      await setDoc(doc(db, "users", newUser.uid), {
        name: t_name,
        email: t_email,
        role: "user", // o "terapeuta"
        birthDate: t_birth || null,
        createdAt: new Date().toISOString(),
      });

      alert("✅ Terapeuta creado correctamente.");
      navigate("/dashboard");
    } catch (e) {
      console.error(e);
      alert("Error al crear terapeuta: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  /* --------------------------------- UI --------------------------------- */
  return (
    <div
      className="min-h-screen relative"
      style={{
        backgroundImage:
          "url('./images/forest-bg.png'), radial-gradient(1200px 600px at 50% 10%, rgba(16,185,129,.15), rgba(0,0,0,.8))",
        backgroundSize: "cover, auto",
        backgroundPosition: "center, center",
      }}
    >
      <div className="absolute inset-0 bg-black/45" />

      <div className="relative max-w-6xl mx-auto py-10 px-4">
        {/* Flecha regresar */}
        <button
          onClick={() => (step === "choose" ? navigate(-1) : setStep("choose"))}
          className="group absolute -left-1 top-8 md:left-4 md:top-8 z-10"
          title="Regresar"
        >
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-orange-200 shadow hover:bg-orange-300 transition">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M15 18l-6-6 6-6" stroke="#7A4B00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </button>

        {/* Marco negro */}
        <div className="rounded-[28px] bg-black/70 shadow-[0_20px_60px_rgba(0,0,0,.6)] p-3 md:p-6">
          {/* Panel glassy */}
          <div className="rounded-[22px] bg-slate-800/70 backdrop-blur-md border border-white/10 p-6 md:p-10 min-h-[70vh]">
            {/* STEP: Elegir rol */}
            {step === "choose" && (
              <>
                <h1 className="text-4xl md:text-5xl font-light tracking-wide text-white/95 mb-2">
                  Crear usuario:
                </h1>
                <p className="text-white/80 mb-10">Selecciona un rol:</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 place-items-center py-6">
                  {/* Paciente */}
                  <button
                    onClick={() => setStep("patient")}
                    className="relative w-full max-w-sm rounded-2xl bg-white/10 hover:bg-white/20 border border-white/10 p-10 text-white text-center shadow-xl transition"
                  >
                    <div className="mx-auto mb-6 w-40 h-40 rounded-full bg-white/15 flex items-center justify-center">
                      <svg viewBox="0 0 24 24" className="w-24 h-24" fill="none" stroke="white" strokeWidth="1.5">
                        <circle cx="12" cy="8" r="4" />
                        <path d="M4 20c0-3.314 3.582-6 8-6s8 2.686 8 6" />
                      </svg>
                    </div>
                    <Plus className="absolute right-10 bottom-12 w-7 h-7 bg-white text-slate-800 rounded-full p-1" />
                    <div className="text-xl font-medium">Paciente</div>
                  </button>

                  {/* Terapeuta */}
                  <button
                    onClick={() => setStep("therapist")}
                    className="relative w-full max-w-sm rounded-2xl bg-white/10 hover:bg-white/20 border border-white/10 p-10 text-white text-center shadow-xl transition"
                  >
                    <div className="mx-auto mb-6 w-40 h-40 rounded-full bg-white/15 flex items-center justify-center">
                      <svg viewBox="0 0 24 24" className="w-24 h-24" fill="none" stroke="white" strokeWidth="1.5">
                        <circle cx="12" cy="8" r="4" />
                        <path d="M4 20c0-3.314 3.582-6 8-6s8 2.686 8 6" />
                      </svg>
                    </div>
                    <Plus className="absolute right-10 bottom-12 w-7 h-7 bg-white text-slate-800 rounded-full p-1" />
                    <div className="text-xl font-medium">Terapeuta</div>
                  </button>
                </div>
              </>
            )}

            {/* STEP: Crear paciente */}
            {step === "patient" && (
              <>
                <h1 className="text-4xl md:text-5xl font-light tracking-wide text-white/95 mb-8">
                  Crear paciente
                </h1>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  {/* Izquierda */}
                  <div className="space-y-6">
                    <div>
                      <label className="block text-white/90 mb-1">Nombre(s) y apellido(s):</label>
                      <span className="block text-xs text-white/60 -mt-1 mb-2">*Campo obligatorio</span>
                      <Input
                        value={p_name}
                        onChange={(e) => setPName(e.target.value)}
                        className="h-11 rounded-2xl bg-white/85 text-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block text-white/90 mb-1">Fecha de nacimiento:</label>
                      <span className="block text-xs text-white/60 -mt-1 mb-2">*Campo obligatorio</span>
                      <Input
                        type="date"
                        value={p_birth}
                        onChange={(e) => setPBirth(e.target.value)}
                        max={new Date().toISOString().split("T")[0]}
                        className="h-11 rounded-2xl bg-white/85 text-slate-800"
                      />
                      {p_agePreview !== null && (
                        <p className="text-xs text-white/80 mt-1">Edad: {p_agePreview} años</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-white/90 mb-1">Nivel de autismo:</label>
                      <span className="block text-xs text-white/60 -mt-1 mb-2">*Campo obligatorio</span>
                      <select
                        value={p_autism}
                        onChange={(e) => setPAutism(e.target.value)}
                        className="w-full h-11 rounded-2xl bg-white/85 text-slate-800 px-4 outline-none"
                      >
                        <option value="nivel 1">Nivel 1</option>
                        <option value="nivel 2">Nivel 2</option>
                        <option value="nivel 3">Nivel 3</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-white/90 mb-1">Terapeuta:</label>
                      <span className="block text-xs text-white/60 -mt-1 mb-2">*Campo obligatorio</span>
                      <div className="relative">
                        <select
                          value={p_therapist}
                          onChange={(e) => {
                            setPTherapist(e.target.value);
                            const found = therapists.find((t) => t.uid === e.target.value);
                            setPTherapistName(found?.name || "");
                          }}
                          className="w-full h-11 rounded-2xl bg-white/85 text-slate-800 px-4 outline-none pr-10"
                        >
                          <option value="">Selecciona un terapeuta</option>
                          {therapists.map((t) => (
                            <option key={t.uid} value={t.uid}>
                              {t.name || t.email}
                            </option>
                          ))}
                        </select>
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">⌄</span>
                      </div>
                    </div>
                  </div>

                  {/* Derecha */}
                  <div className="space-y-6">
                    <div>
                      <label className="block text-white/90 mb-1">Interéses:</label>
                      <Input
                        value={p_interests}
                        onChange={(e) => setPInterests(e.target.value)}
                        className="h-11 rounded-2xl bg-white/85 text-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block text-white/90 mb-1">Sensibilidad sensorial:</label>
                      <Textarea
                        value={p_sensitivity}
                        onChange={(e) => setPSensitivity(e.target.value)}
                        className="min-h-[88px] rounded-2xl bg-white/85 text-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block text-white/90 mb-2">Añadir fotografía del paciente</label>
                      <div className="rounded-2xl bg-white/85 overflow-hidden flex items-center gap-3 p-3">
                        <div className="w-48 h-28 rounded-xl overflow-hidden bg-slate-200/70 flex items-center justify-center">
                          {p_photoPreview ? (
                            <img src={p_photoPreview} alt="Vista previa" className="w-full h-full object-cover" />
                          ) : (
                            <div className="flex flex-col items-center justify-center text-slate-500">
                              <Plus className="w-10 h-10" />
                              <span className="text-sm">Añadir fotografía del paciente</span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 flex items-center gap-3">
                          <Input type="file" accept="image/*" onChange={onPhotoChange} className="w-full" />
                          {p_photoPreview && (
                            <button
                              type="button"
                              onClick={() => {
                                setPPhotoFile(null);
                                setPPhotoPreview(null);
                              }}
                              className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-white shadow hover:bg-slate-100"
                              title="Eliminar foto"
                            >
                              <Trash2 className="w-5 h-5 text-slate-600" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Guardar */}
                  <div className="md:col-span-2 pt-2">
                    <div className="flex justify-center">
                      <Button
                        onClick={handleSavePatient}
                        disabled={loading}
                        className="w-full md:w-[520px] h-12 rounded-2xl text-lg font-semibold bg-lime-600 hover:bg-lime-700 shadow-lg"
                      >
                        {loading ? "Guardando..." : "Guardar"}
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* STEP: Crear terapeuta */}
            {step === "therapist" && (
              <>
                <h1 className="text-4xl md:text-5xl font-light tracking-wide text-white/95 mb-8">
                  Crear terapeuta:
                </h1>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-6">
                    <div>
                      <label className="block text-white/90 mb-1">Nombre(s) y Apellido(s):</label>
                      <span className="block text-xs text-white/60 -mt-1 mb-2">*Campo obligatorio</span>
                      <Input
                        value={t_name}
                        onChange={(e) => setTName(e.target.value)}
                        className="h-11 rounded-2xl bg-white/85 text-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block text-white/90 mb-1">Correo electrónico:</label>
                      <span className="block text-xs text-white/60 -mt-1 mb-2">*Campo obligatorio</span>
                      <Input
                        value={t_email}
                        onChange={(e) => setTEmail(e.target.value)}
                        type="email"
                        className="h-11 rounded-2xl bg-white/85 text-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block text-white/90 mb-1">Contraseña:</label>
                      <span className="block text-xs text-white/60 -mt-1 mb-2">*Campo obligatorio</span>
                      <Input
                        value={t_password}
                        onChange={(e) => setTPassword(e.target.value)}
                        type="password"
                        className="h-11 rounded-2xl bg-white/85 text-slate-800"
                      />
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-white/90 mb-1">Fecha de nacimiento:</label>
                      <span className="block text-xs text-white/60 -mt-1 mb-2">*Campo obligatorio</span>
                      <Input
                        type="date"
                        value={t_birth}
                        onChange={(e) => setTBirth(e.target.value)}
                        max={new Date().toISOString().split("T")[0]}
                        className="h-11 rounded-2xl bg-white/85 text-slate-800"
                      />
                    </div>
                  </div>

                  <div className="md:col-span-2 pt-2">
                    <div className="flex justify-center">
                      <Button
                        onClick={handleSaveTherapist}
                        disabled={loading || !secondaryAuth}
                        className="w-full md:w-[520px] h-12 rounded-2xl text-lg font-semibold bg-lime-600 hover:bg-lime-700 shadow-lg"
                      >
                        {loading ? "Guardando..." : "Guardar"}
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
