import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { addDoc, collection, getDoc, getDocs, doc } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { onAuthStateChanged } from "firebase/auth";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Button } from "../components/ui/button";
import { Trash2 } from "lucide-react";

export default function AddPatient() {
  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [sensitivity, setSensitivity] = useState("");
  const [interests, setInterests] = useState("");
  const [autismLevel, setAutismLevel] = useState("nivel 1");
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [therapists, setTherapists] = useState([]);
  const [assignedTherapist, setAssignedTherapist] = useState("");
  const [assignedTherapistName, setAssignedTherapistName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (!currentUser) return;

      const userDoc = await getDoc(doc(db, "users", currentUser.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();

        // ⚠️ Cambia a: const isUserAdmin = data.role === "admin";
        const isUserAdmin = true;
        setIsAdmin(isUserAdmin);

        if (isUserAdmin) {
          const snapshot = await getDocs(collection(db, "users"));
          const userList = snapshot.docs.map((d) => ({
            uid: d.id,
            name: d.data().name || d.data().email || "Usuario sin nombre",
          }));
          setTherapists(userList);
        } else {
          setAssignedTherapist(currentUser.uid);
          setAssignedTherapistName(data.name || "Usuario actual");
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const calculateAge = (birthDateString) => {
    const birth = new Date(birthDateString);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };

  const previewAge = useMemo(() => {
    if (!birthDate) return null;
    const age = calculateAge(birthDate);
    return age >= 0 ? age : null;
  }, [birthDate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return alert("Debes iniciar sesión.");
    if (!birthDate) return alert("Selecciona una fecha de nacimiento válida.");

    const age = calculateAge(birthDate);
    if (age < 0) return alert("La fecha de nacimiento no puede ser en el futuro.");
    if (isAdmin && !assignedTherapist) return alert("Selecciona un terapeuta para asignar.");

    try {
      setIsLoading(true);

      let photoURL = "";
      if (photoFile) {
        const storage = getStorage();
        const fileRef = ref(storage, `patients_photos/${user.uid}_${Date.now()}`);
        await uploadBytes(fileRef, photoFile);
        photoURL = await getDownloadURL(fileRef);
      }

      await addDoc(collection(db, "patients"), {
        name,
        birthDate,
        age,
        sensitivity,
        interests,
        autismLevel,
        photoURL,
        createdBy: user.uid,
        assignedTo: isAdmin ? assignedTherapist : user.uid,
        createdAt: new Date().toISOString(),
      });

      alert("✅ Paciente registrado correctamente");

      setName("");
      setBirthDate("");
      setSensitivity("");
      setInterests("");
      setAutismLevel("nivel 1");
      setPhotoFile(null);
      setPhotoPreview(null);
      setAssignedTherapist("");
    } catch (error) {
      alert("❌ Error al guardar: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    setPhotoFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPhotoPreview(reader.result);
      reader.readAsDataURL(file);
    } else {
      setPhotoPreview(null);
    }
  };

  const clearPhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
  };

  return (
    <div
      className="min-h-screen relative"
      style={{
        backgroundImage: "url('./images/forest-bg.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="absolute inset-0 bg-black/40" />

      {/* Contenedor negro exterior (marco) */}
      <div className="relative max-w-6xl mx-auto py-10 px-4">
        {/* Flecha regresar */}
        <button
          onClick={() => navigate(-1)}
          className="group absolute -left-1 top-8 md:left-4 md:top-8 z-10"
          title="Regresar"
        >
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-orange-200 shadow hover:bg-orange-300 transition">
            {/* flecha simple */}
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M15 18l-6-6 6-6" stroke="#7A4B00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </button>

        <div className="rounded-[28px] bg-black/70 shadow-[0_20px_60px_rgba(0,0,0,.6)] p-3 md:p-6">
          {/* Panel glassy interno */}
          <div className="rounded-[22px] bg-slate-800/70 backdrop-blur-md border border-white/10 p-6 md:p-10">
            {/* Título grande con el nombre */}
            <h1 className="text-4xl md:text-5xl font-light tracking-wide text-white/95 mb-2">
              {name?.trim() ? name : "Nuevo Paciente"}
            </h1>
            <p className="text-white/80 font-semibold mb-8">Paciente</p>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Columna izquierda */}
              <div className="space-y-6">
                <div>
                  <label className="block text-white/90 mb-1">Nombre(s) y apellido(s):</label>
                  <span className="block text-xs text-white/60 -mt-1 mb-2">*Campo obligatorio</span>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="h-11 rounded-2xl bg-white/85 text-slate-800 placeholder-slate-500"
                    placeholder="Nombre completo"
                  />
                </div>

                <div>
                  <label className="block text-white/90 mb-1">Fecha de nacimiento:</label>
                  <span className="block text-xs text-white/60 -mt-1 mb-2">*Campo obligatorio</span>
                  <Input
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    required
                    max={new Date().toISOString().split("T")[0]}
                    className="h-11 rounded-2xl bg-white/85 text-slate-800"
                  />
                  {previewAge !== null && (
                    <p className="text-xs text-white/80 mt-1">Edad: {previewAge} años</p>
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
                    placeholder="(Opcional)"
                  />
                </div>

                <div>
                  <label className="block text-white/90 mb-1">Sensibilidad sensorial:</label>
                  <Textarea
                    value={sensitivity}
                    onChange={(e) => setSensitivity(e.target.value)}
                    className="min-h-[88px] rounded-2xl bg-white/85 text-slate-800"
                    placeholder="(Opcional)"
                  />
                </div>

                {/* Foto */}
                <div>
                  <label className="block text-white/90 mb-2">Foto</label>
                  <div className="rounded-2xl bg-white/85 overflow-hidden flex items-center gap-3 p-3">
                    <div className="w-48 h-28 rounded-xl overflow-hidden bg-slate-200/70 flex items-center justify-center">
                      {photoPreview ? (
                        <img src={photoPreview} alt="Vista previa" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xs text-slate-600 px-2 text-center">Vista previa</span>
                      )}
                    </div>

                    <div className="flex-1 flex items-center gap-3">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoChange}
                        className="w-full"
                      />
                      {photoPreview && (
                        <button
                          type="button"
                          onClick={clearPhoto}
                          className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-white shadow hover:bg-slate-100"
                          title="Eliminar foto"
                        >
                          <Trash2 className="w-5 h-5 text-slate-600" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Asignación (si admin) */}
                {isAdmin ? (
                  <div>
                    <label className="block text-white/90 mb-1">Asignar a terapeuta</label>
                    <select
                      value={assignedTherapist}
                      onChange={(e) => setAssignedTherapist(e.target.value)}
                      className="w-full h-11 rounded-2xl bg-white/85 text-slate-800 px-4"
                      required
                    >
                      <option value="">Selecciona un usuario</option>
                      {therapists.map((t) => (
                        <option key={t.uid} value={t.uid}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <p className="text-sm text-white/80">
                    Terapeuta asignado: <strong>{assignedTherapistName}</strong>
                  </p>
                )}
              </div>

              {/* Botón Guardar centrado */}
              <div className="md:col-span-2 pt-2">
                <div className="flex justify-center">
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full md:w-[520px] h-12 rounded-2xl text-lg font-semibold bg-lime-600 hover:bg-lime-700 shadow-lg"
                  >
                    {isLoading ? "Guardando..." : "Guardar"}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
