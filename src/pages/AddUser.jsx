// src/pages/AddUser.jsx

import { useState } from "react"
import { doc, setDoc } from "firebase/firestore"
import { createUserWithEmailAndPassword, getAuth } from "firebase/auth"
import { db } from "../firebase"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../components/ui/card"
import { Input } from "../components/ui/input"
import { Button } from "../components/ui/button"
import { Label } from "../components/ui/label"
import { useNavigate } from "react-router-dom"

export default function AddUser() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState("user")
  const navigate = useNavigate()
  const auth = getAuth()

  const handleAddUser = async () => {
    try {
      if (!name || !email || !password) return alert("Todos los campos son obligatorios")

      // 1. Crear el usuario en Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const user = userCredential.user

      // 2. Guardar la información adicional en Firestore
      await setDoc(doc(db, "users", user.uid), {
        name,
        email,
        role,
        createdAt: new Date().toISOString(),
      })

      alert("✅ Usuario agregado exitosamente")
      navigate("/dashboard")
    } catch (err) {
      console.error("Error al agregar usuario:", err)
      alert("Error al agregar usuario: " + err.message)
    }
  }

  return (
    <div className="max-w-md mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Agregar Nuevo Usuario</CardTitle>
          <CardDescription>Rellena los datos del nuevo usuario</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Nombre</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre completo" />
          </div>
          <div>
            <Label>Email</Label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="correo@ejemplo.com" />
          </div>
          <div>
            <Label>Contraseña</Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Contraseña" />
          </div>
          <div>
            <Label>Rol</Label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full border rounded p-2 text-sm"
            >
              <option value="user">Terapeuta</option>
              <option value="admin">Administrador</option>
            </select>
          </div>
          <div className="pt-4">
            <Button onClick={handleAddUser}>Guardar Usuario</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
