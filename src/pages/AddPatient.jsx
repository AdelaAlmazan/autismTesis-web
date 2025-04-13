import { useState, useEffect, useMemo } from "react"
import { auth, db } from "../firebase"
import { addDoc, collection } from "firebase/firestore"
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { onAuthStateChanged } from "firebase/auth"

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "../components/ui/card"
import { Label } from "../components/ui/label"
import { Input } from "../components/ui/input"
import { Button } from "../components/ui/button"
import { Textarea } from "../components/ui/textarea"

export default function AddPatient() {
  const [name, setName] = useState("")
  const [birthDate, setBirthDate] = useState("")
  const [sensitivity, setSensitivity] = useState("")
  const [interests, setInterests] = useState("")
  const [autismLevel, setAutismLevel] = useState("nivel 1")
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
    })
    return () => unsubscribe()
  }, [])

  const calculateAge = (birthDateString) => {
    const birth = new Date(birthDateString)
    const today = new Date()
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birth.getDate())
    ) {
      age--
    }
    return age
  }

  const previewAge = useMemo(() => {
    if (!birthDate) return null
    const age = calculateAge(birthDate)
    return age >= 0 ? age : null
  }, [birthDate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!user) return alert("Debes iniciar sesión.")
    if (!birthDate) return alert("Selecciona una fecha de nacimiento válida.")

    const age = calculateAge(birthDate)
    if (age < 0) return alert("La fecha de nacimiento no puede ser en el futuro.")

    try {
      setIsLoading(true)

      let photoURL = ""
      if (photoFile) {
        const storage = getStorage()
        const fileRef = ref(storage, `patients_photos/${user.uid}_${Date.now()}`)
        await uploadBytes(fileRef, photoFile)
        photoURL = await getDownloadURL(fileRef)
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
        createdAt: new Date().toISOString(),
      })

      alert("✅ Paciente registrado correctamente")

      setName("")
      setBirthDate("")
      setSensitivity("")
      setInterests("")
      setAutismLevel("nivel 1")
      setPhotoFile(null)
      setPhotoPreview(null)
    } catch (error) {
      alert("❌ Error al guardar: " + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePhotoChange = (e) => {
    const file = e.target.files[0]
    setPhotoFile(file)
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => setPhotoPreview(reader.result)
      reader.readAsDataURL(file)
    } else {
      setPhotoPreview(null)
    }
  }

  return (
    <Card className="max-w-4xl mx-auto mt-10 shadow-lg">
      <CardHeader className="text-center">
        <CardTitle>Alta de Paciente</CardTitle>
        <CardDescription>Formulario con diseño tipo credencial</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-6">
          <div className="w-full md:w-1/3 flex flex-col items-center gap-4">
            <div className="w-[200px] h-[250px] bg-gray-100 border border-gray-300 rounded-lg overflow-hidden">
              {photoPreview ? (
                <img
                  src={photoPreview}
                  alt="Vista previa"
                  className="object-cover w-full h-full"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-sm text-gray-500 px-4 text-center">
                  Vista previa de foto
                </div>
              )}
            </div>
            <Input
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="w-full"
            />
          </div>

          <div className="w-full md:w-2/3 space-y-4">
            <div>
              <Label>Nombre completo</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div>
              <Label>Fecha de nacimiento</Label>
              <Input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                required
                max={new Date().toISOString().split("T")[0]}
              />
              {previewAge !== null && (
                <p className="text-sm text-gray-500 mt-1">Edad: {previewAge} años</p>
              )}
            </div>

            <div>
              <Label>Sensibilidad sensorial</Label>
              <Textarea value={sensitivity} onChange={(e) => setSensitivity(e.target.value)} />
            </div>
            <div>
              <Label>Intereses</Label>
              <Textarea value={interests} onChange={(e) => setInterests(e.target.value)} />
            </div>
            <div>
              <Label>Nivel de autismo</Label>
              <select
                value={autismLevel}
                onChange={(e) => setAutismLevel(e.target.value)}
                className="w-full border border-gray-300 rounded-md p-2"
              >
                <option value="nivel 1">Nivel 1</option>
                <option value="nivel 2">Nivel 2</option>
                <option value="nivel 3">Nivel 3</option>
              </select>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Guardando..." : "Registrar Paciente"}
            </Button>
          </div>
        </form>
      </CardContent>
      <CardFooter className="text-center justify-center text-sm text-muted-foreground">
        EmoBosque · Registro pacientes
      </CardFooter>
    </Card>
  )
}
