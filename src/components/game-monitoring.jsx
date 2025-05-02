// src/pages/AddUser.jsx

"use client"

import { useState, useEffect } from "react"
import { collection, getDocs, query, where } from "firebase/firestore"
import { onAuthStateChanged } from "firebase/auth"
import { db, auth } from "../firebase"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { Clock, Calendar, Send } from "lucide-react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"

// Patient = { id: string, name: string }
// Session = { id: string, name: string, date?: { seconds: number }, config?: { scenariosPerEmotion?: number, complexityLevel?: number, allowedAttempts?: number } }

export default function GameMonitoring() {
  const [patients, setPatients] = useState([])
  const [sessions, setSessions] = useState([])
  const [selectedPatient, setSelectedPatient] = useState("")
  const [selectedSession, setSelectedSession] = useState("")
  const [notes, setNotes] = useState("")
  const [sessionNotes, setSessionNotes] = useState([])

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) return
      const q = query(collection(db, "patients"), where("createdBy", "==", user.uid))
      const snapshot = await getDocs(q)
      const loaded = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      setPatients(loaded)
    })
    return () => unsubscribe()
  }, [])

  useEffect(() => {
    const fetchSessions = async () => {
      if (!selectedPatient) return
      const q = query(collection(db, "sessions"), where("patientId", "==", selectedPatient))
      const snapshot = await getDocs(q)
      const loaded = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(session => session.patientId)
      setSessions(loaded)
      setSelectedSession("") // reset session selection when patient changes
    }
    fetchSessions()
  }, [selectedPatient])

  const handleSendNote = () => {
    if (notes.trim() === "") return
    const now = new Date()
    const timestamp = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`
    setSessionNotes([...sessionNotes, { text: notes, timestamp }])
    setNotes("")
  }

  // Función para formatear la fecha de una sesión
  const formatSessionDate = (seconds) => {
    if (!seconds) return "";
    return new Date(seconds * 1000).toLocaleDateString("es-MX", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="overflow-hidden">
        <CardHeader className="pb-0">
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <CardTitle>Sesión de Juego</CardTitle>
              <Select value={selectedPatient} onValueChange={setSelectedPatient}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Seleccionar paciente" />
                </SelectTrigger>
                <SelectContent>
                  {patients.length === 0 ? (
                    <SelectItem value="none" disabled>No hay pacientes</SelectItem>
                  ) : (
                    patients.map((patient) => (
                      <SelectItem key={patient.id} value={patient.id}>
                        {patient.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {selectedPatient && (
              <div className="flex justify-end">
                <Select value={selectedSession} onValueChange={setSelectedSession}>
                  <SelectTrigger className="w-[300px]">
                    <SelectValue placeholder="Seleccionar sesión" />
                  </SelectTrigger>
                  <SelectContent>
                    {sessions.length === 0 ? (
                      <SelectItem value="none" disabled>No hay sesiones</SelectItem>
                    ) : (
                      sessions.map((session) => (
                        <SelectItem key={session.id} value={session.id}>
                          {session.name ? 
                            `${session.name} - ${formatSessionDate(session.date?.seconds)}` : 
                            (session.date?.seconds ? 
                              formatSessionDate(session.date.seconds) : 
                              "Sesión sin nombre ni fecha")}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-4">
          <div className="relative aspect-video w-full overflow-hidden rounded-lg border bg-muted">
            <img
              src="/placeholder.svg?height=400&width=600"
              alt="Juego de conciencia emocional"
              className="object-cover w-full h-full"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white p-2 text-sm">
              {selectedPatient && selectedSession 
                ? `Sesión activa: ${patients.find(p => p.id === selectedPatient)?.name || "Paciente"} - ${sessions.find(s => s.id === selectedSession)?.name || "Sin nombre"}`
                : "Seleccione un paciente y una sesión para iniciar"}
            </div>
          </div>

          {selectedSession && (
            <div className="space-y-2 mt-4">
              {sessions
                .filter((s) => s.id === selectedSession)
                .map((s) => (
                  <div key={s.id} className="space-y-1">
                    <div className="mb-2">
                      <Badge className="mr-1">{s.name || "Sin nombre"}</Badge>
                      <Badge variant="outline">{formatSessionDate(s.date?.seconds) || "Sin fecha"}</Badge>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      <Badge>Escenarios: {s.config?.scenariosPerEmotion ?? "-"}</Badge>
                      <Badge>Complejidad: {s.config?.complexityLevel ?? "-"}%</Badge>
                      <Badge>Intentos: {s.config?.allowedAttempts ?? "-"}</Badge>
                    </div>
                  </div>
                ))}
            </div>
          )}

          <div className="mt-4">
            <Tabs defaultValue="stats">
              <TabsList className="w-full">
                <TabsTrigger value="stats">Estadísticas</TabsTrigger>
                <TabsTrigger value="attempts">Intentos por Emoción</TabsTrigger>
              </TabsList>

              <TabsContent value="stats" className="pt-4">
                <div className="grid grid-cols-3 gap-2">
                  <div className="border rounded p-2 text-center">
                    <div className="text-sm font-medium">Emoción Actual</div>
                    <div className="text-lg">Feliz</div>
                  </div>
                  <div className="border rounded p-2 text-center">
                    <div className="text-sm font-medium">Tiempo</div>
                    <div className="text-lg">12:45</div>
                  </div>
                  <div className="border rounded p-2 text-center">
                    <div className="text-sm font-medium">Aciertos</div>
                    <div className="text-lg">8/10</div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="attempts" className="pt-4">
                <div className="text-sm text-muted-foreground">Intentos por emoción (mock)</div>
              </TabsContent>
            </Tabs>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notas y Sugerencias</CardTitle>
          {selectedSession && (
            <CardDescription>
              {sessions.find(s => s.id === selectedSession)?.name || "Sesión sin nombre"}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border rounded-lg p-4 h-[300px] overflow-y-auto space-y-3">
            {sessionNotes.length > 0 ? (
              sessionNotes.map((note, index) => (
                <div key={index} className="border-b pb-2 last:border-0">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">{note.timestamp}</span>
                  </div>
                  <p className="text-sm mt-1">{note.text}</p>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-center">No hay notas para esta sesión</p>
            )}
          </div>

          <div className="space-y-2">
            <Textarea
              placeholder="Escriba sus notas o sugerencias durante la sesión..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[100px]"
              disabled={!selectedSession}
            />
            <Button onClick={handleSendNote} className="w-full" disabled={!selectedSession || notes.trim() === ""}>
              <Send className="mr-2 h-4 w-4" />
              Enviar Nota
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}