"use client"

import { useEffect, useState } from "react"
import { onAuthStateChanged } from "firebase/auth"
import { auth } from "../firebase"
import { Button } from "./ui/button"
import { Textarea } from "./ui/textarea"
import { Pencil, PlusCircle, Trash2 } from "lucide-react"
import { db } from "../firebase"
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  getDocs,
  orderBy,
  serverTimestamp
} from "firebase/firestore"

export default function SuggestionsList({ patientId, refreshTrigger }) {
  const [suggestions, setSuggestions] = useState([])
  const [newSuggestion, setNewSuggestion] = useState("")
  const [editingId, setEditingId] = useState(null)
  const [editingText, setEditingText] = useState("")
  const [userId, setUserId] = useState(null)

  useEffect(() => {
  
    const fetchUserAndSuggestions = async () => {
      try {
        const user = await new Promise(resolve => {
          const unsub = onAuthStateChanged(auth, (u) => {
            unsub()
            resolve(u)
          })
        })

        if (!user) return
        setUserId(user.uid)

        console.log("🧪 Buscando anotaciones para:", {
          patientId,
          user: user?.uid,
        })
        

        const q = query(
          collection(db, "annotations"),
          where("patientId", "==", patientId),
          where("createdBy", "==", user.uid),
          orderBy("createdAt", "desc")
        )
        const snapshot = await getDocs(q)
        const loaded = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        setSuggestions(loaded)
      } catch (error) {
        console.error("Error al cargar anotaciones del usuario:", error)
      }
    }

    if (patientId) fetchUserAndSuggestions()
  }, [patientId, refreshTrigger])

  const handleAddSuggestion = async () => {
    if (newSuggestion.trim() === "" || !userId) return

    try {
      const docRef = await addDoc(collection(db, "annotations"), {
        createdBy: userId,
        text: newSuggestion,
        patientId,
        createdAt: serverTimestamp()
      })

      setSuggestions(prev => [
        {
          id: docRef.id,
          text: newSuggestion,
          createdAt: new Date()
        },
        ...prev
      ])
      setNewSuggestion("")
    } catch (error) {
      console.error("Error al guardar anotación:", error)
    }
  }

  const handleEdit = (id, text) => {
    setEditingId(id)
    setEditingText(text)
  }

  const handleSaveEdit = async (id) => {
    try {
      const ref = doc(db, "annotations", id)
      await updateDoc(ref, {
        text: editingText,
        createdAt: serverTimestamp()
      })

      setSuggestions(prev => prev.map(s =>
        s.id === id ? { ...s, text: editingText, createdAt: new Date() } : s
      ))

      setEditingId(null)
      setEditingText("")
    } catch (err) {
      console.error("Error al actualizar anotación:", err)
    }
  }

  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, "annotations", id))
      setSuggestions(prev => prev.filter(s => s.id !== id))
    } catch (err) {
      console.error("Error al eliminar anotación:", err)
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-md font-medium">Agregar Nueva Sugerencia</h3>
        <Textarea
          placeholder="Escriba una nueva sugerencia para este paciente..."
          value={newSuggestion}
          onChange={(e) => setNewSuggestion(e.target.value)}
          className="min-h-[100px]"
        />
        <Button onClick={handleAddSuggestion} className="w-full sm:w-auto">
          <PlusCircle className="mr-2 h-4 w-4" />
          Agregar Sugerencia
        </Button>
      </div>

      <div className="space-y-4">
        <h3 className="text-md font-medium">Anotaciones Anteriores</h3>
        {suggestions.length > 0 ? (
          <div className="space-y-3">
            {suggestions.map((suggestion) => (
              <div key={suggestion.id} className="border rounded-lg p-3 bg-muted/20">
                {editingId === suggestion.id ? (
                  <>
                    <Textarea
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      className="mb-2"
                    />
                    <div className="flex gap-2">
                      <Button onClick={() => handleSaveEdit(suggestion.id)} size="sm">Guardar</Button>
                      <Button variant="secondary" onClick={() => setEditingId(null)} size="sm">Cancelar</Button>
                    </div>
                  </>
                ) : (
                  <>
                    <p>{suggestion.text}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Fecha: {suggestion.createdAt instanceof Object && typeof suggestion.createdAt.toDate === 'function' ? suggestion.createdAt.toDate().toLocaleString() : suggestion.createdAt?.toLocaleString?.() || "---"}
                    </p>
                    <div className="flex gap-2 mt-2">
                      <Button onClick={() => handleEdit(suggestion.id, suggestion.text)} size="sm" variant="outline">
                        <Pencil className="w-4 h-4 mr-1" /> Editar
                      </Button>
                      <Button onClick={() => handleDelete(suggestion.id)} size="sm" variant="destructive">
                        <Trash2 className="w-4 h-4 mr-1" /> Eliminar
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">No hay anotaciones para este paciente.</p>
        )}
      </div>
    </div>
  )
}
