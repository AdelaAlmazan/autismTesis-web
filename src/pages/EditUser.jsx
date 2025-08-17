// src/pages/EditUser.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { db, auth as primaryAuth } from "../firebase";

import {
  doc,
  getDoc,
  updateDoc,
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";

import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";

import { onAuthStateChanged } from "firebase/auth";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Button } from "../components/ui/button";
import { Trash2 } from "lucide-react";

export default function EditUser() {
  const { id } = useParams();                 // <-- id del paciente
  const navigate = useNavigate();

  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Campos del paciente
  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [autismLevel, setAutismLevel] = useState("nivel 1");
  const [interests, setInterests] = useState("");
  const [sensitivity, setSensitivity] = useState("");
  const [photoURL, setPhotoURL] = useState("");
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  // Terapeuta asignado
  const [assignedTo, setAssignedTo] = useState("");
  const [therapists, setTherapists] = useState([]);

  // Sesión + cargar paciente y catálogo de terapeutas
  useEffect(() => {
    const unsub = onAuthStateChanged(primaryAuth, async (u) => {
      setCurrentUser(u || null);

      // catálogo de terapeutas
      const qUsers = query(
        collection(db, "users"),
        where("role", "in", ["user", "terapeuta", "User", "Terapeuta"])
      );
      const snap = await getDocs(qUsers);
      const list = snap.docs.map((d) => ({ uid: d.id, ...(d.data() || {}) }));
      setTherapists(list);

      // paciente
      const ref = doc(db, "patients", id);
      const p = await getDoc(ref);
      if (!p.exists()) {
        alert("Paciente no encontrado");
        navigate("/dashboard");
        return;
      }
      const data = p.data();
      setName(data.name || "");
      setBirthDate(data.birthDate || "");
      setAutismLevel(data.autismLevel || "nivel 1");
      setInterests(data.interests || "");
      setSensitivity(data.sensitivity || "");
      setPhotoURL(data.photoURL || "");
      setAssignedTo(data.assignedTo || "");
      setLoading(false);
    });

    return () => unsub();
  }, [id, navigate]);

  // edad preview
  const agePreview = useMemo(() => {
    if (!birthDate) return null;
    const b = new Date(birthDate);
    const t = new Date();
    let age = t.getFullYear() - b.getFullYear();
    const m = t.getMonth() - b.getMonth();
    if (m < 0 || (m === 0 && t.getDate() < b.getDate())) age--;
    return age >= 0 ? age : null;
  }, [birthDate]);

  // cambiar foto
  const onPhotoChange = (e) => {
    const f = e.target.files?.[0];
    setPhotoFile(f || null);
    if (f) {
      const r = new FileReader();
      r.onloadend = () => setPhotoPreview(r.result);
      r.readAsDataURL(f);
    } else {
      setPhotoPreview(null);
    }
  };

  // eliminar foto (solo de la UI y el campo; borrar en storage si quieres)
  const removePhoto = async () => {
    try {
      if (photoURL) {
        // intenta eliminar del storage (si tienes reglas/paths consistentes)
        const storage = getStorage();
        try {
          await deleteObject(storageRef(storage, photoURL));
        } catch {
          // si photoURL es https completo, deleteObject necesita ref exacta;
          // si falla, al menos vaciamos el campo en Firestore al guardar.
        }
      }
    } finally {
      setPhotoURL("");
      setPhotoFile(null);
      setPhotoPreview(null);
    }
  };

  // guardar cambios
  const handleSave = async () => {
    if (!name || !birthDate || !autismLevel || !assignedTo) {
      return alert("Completa los campos obligatorios.");
    }

    try {
      setSaving(true);

      let newPhotoURL = photoURL;
      if (photoFile) {
        const storage = getStorage();
        const ref = storageRef(
          storage,
          `patients_photos/${currentUser?.uid || "system"}_${Date.now()}`
        );
        await uploadBytes(ref, photoFile);
        newPhotoURL = await getDownloadURL(ref);
      }

      const ref = doc(db, "patients", id);
      await updateDoc(ref, {
        name,
        birthDate,
        autismLevel,
        interests,
        sensitivity,
        assignedTo,
        photoURL: newPhotoURL, // si se borró, será ""
        updatedAt: new Date().toISOString(),
      });

      alert("✅ Datos actualizados");
      navigate("/dashboard");
    } catch (e) {
      console.error(e);
      alert("Error al guardar: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center text-white/90 bg-slate-900">
        Cargando...
      </div>
    );
  }

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
          onClick={() => navigate(-1)}
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
          <div className="rounded-[22px] bg-slate-800/70 backdrop-blur-md border border-white/10 p-6 md:p-10">
            <h1 className="text-4xl md:text-5xl font-light tracking-wide text-white/95 mb-2">
              Modificar datos
            </h1>
            <p className="text-white/80 font-semibold mb-8">Paciente</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              {/* Columna izquierda */}
              <div className="space-y-6">
                <div>
                  <label className="block text-white/90 mb-1">Nombre(s) y apellido(s):</label>
                  <span className="block text-xs text-white/60 -mt-1 mb-2">*Campo obligatorio</span>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-11 rounded-2xl bg-white/85 text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-white/90 mb-1">Terapeuta:</label>
                  <span className="block text-xs text-white/60 -mt-1 mb-2">*Campo obligatorio</span>
                  <div className="relative">
                    <select
                      value={assignedTo}
                      onChange={(e) => setAssignedTo(e.target.value)}
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

                <div>
                  <label className="block text-white/90 mb-1">Fecha de nacimiento:</label>
                  <span className="block text-xs text-white/60 -mt-1 mb-2">*Campo obligatorio</span>
                  <Input
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    max={new Date().toISOString().split("T")[0]}
                    className="h-11 rounded-2xl bg-white/85 text-slate-800"
                  />
                  {agePreview !== null && (
                    <p className="text-xs text-white/80 mt-1">Edad: {agePreview} años</p>
                  )}
                </div>

                <div>
                  <label className="block text-white/90 mb-1">Nivel de autismo:</label>
                  <span className="block text-xs text-white/60 -mt-1 mb-2">*Campo obligatorio</span>
                  <select
                    value={autismLevel}
                    onChange={(e) => setAutismLevel(e.target.value)}
                    className="w-full h-11 rounded-2xl bg-white/85 text-slate-800 px-4 outline-none"
                  >
                    <option value="nivel 1">Nivel 1</option>
                    <option value="nivel 2">Nivel 2</option>
                    <option value="nivel 3">Nivel 3</option>
                  </select>
                </div>
              </div>

              {/* Columna derecha */}
              <div className="space-y-6">
                <div>
                  <label className="block text-white/90 mb-1">Interéses:</label>
                  <Input
                    value={interests}
                    onChange={(e) => setInterests(e.target.value)}
                    className="h-11 rounded-2xl bg-white/85 text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-white/90 mb-1">Sensibilidad sensorial:</label>
                  <Textarea
                    value={sensitivity}
                    onChange={(e) => setSensitivity(e.target.value)}
                    className="min-h-[88px] rounded-2xl bg-white/85 text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-white/90 mb-2">Fotografía</label>
                  <div className="rounded-2xl bg-white/85 overflow-hidden flex items-center gap-3 p-3">
                    <div className="w-48 h-28 rounded-xl overflow-hidden bg-slate-200/70 flex items-center justify-center">
                      {(photoPreview || photoURL) ? (
                        <img
                          src={photoPreview || photoURL}
                          alt="Foto del paciente"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-sm text-slate-600">Sin fotografía</span>
                      )}
                    </div>
                    <div className="flex-1 flex items-center gap-3">
                      <Input type="file" accept="image/*" onChange={onPhotoChange} className="w-full" />
                      {(photoPreview || photoURL) && (
                        <button
                          type="button"
                          onClick={removePhoto}
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
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full md:w-[520px] h-12 rounded-2xl text-lg font-semibold bg-lime-600 hover:bg-lime-700 shadow-lg"
                  >
                    {saving ? "Guardando..." : "Guardar"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div> 
    </div>
  );
}
