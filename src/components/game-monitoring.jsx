"use client";

import { useState, useEffect } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { db, auth } from "../firebase";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Send, Plus } from "lucide-react";

// Patient = { id: string, name: string }
// Session = { id: string, name: string, date?: { seconds: number }, config?: { scenariosPerEmotion?: number, complexityLevel?: number, allowedAttempts?: number } }

export default function GameMonitoring() {
  const [patients, setPatients] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState("");
  const [selectedSession, setSelectedSession] = useState("");
  const [notes, setNotes] = useState("");
  const [sessionNotes, setSessionNotes] = useState([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) return;
      const q = query(collection(db, "patients"), where("createdBy", "==", user.uid));
      const snapshot = await getDocs(q);
      const loaded = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setPatients(loaded);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchSessions = async () => {
      if (!selectedPatient) return;
      const q = query(collection(db, "sessions"), where("patientId", "==", selectedPatient));
      const snapshot = await getDocs(q);
      const loaded = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((session) => session.patientId);
      setSessions(loaded);
      setSelectedSession(""); // reset al cambiar de paciente
    };
    fetchSessions();
  }, [selectedPatient]);

  const handleSendNote = () => {
    if (notes.trim() === "") return;
    const now = new Date();
    const timestamp = `${now.getHours().toString().padStart(2, "0")}:${now
      .getMinutes()
      .toString()
      .padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`;
    setSessionNotes((prev) => [...prev, { text: notes, timestamp }]);
    setNotes("");
  };

  const formatSessionDate = (seconds) => {
    if (!seconds) return "";
    return new Date(seconds * 1000).toLocaleDateString("es-MX", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Panel izquierdo: video + info */}
      <Card className="overflow-hidden border-white/10 bg-white/10 backdrop-blur-md text-white">
        <CardHeader className="pb-0">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <CardTitle className="text-white/95">Sesión de Juego</CardTitle>

              <Select value={selectedPatient} onValueChange={setSelectedPatient}>
                <SelectTrigger className="w-[220px] rounded-2xl bg-white/20 border-white/20 text-white placeholder:text-white/70">
                  <SelectValue placeholder="Seleccionar paciente" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 text-white border-white/10">
                  {patients.length === 0 ? (
                    <SelectItem value="none" disabled>
                      No hay pacientes
                    </SelectItem>
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
                  <SelectTrigger className="w-[320px] rounded-2xl bg-white/20 border-white/20 text-white placeholder:text-white/70">
                    <SelectValue placeholder="Seleccionar sesión" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 text-white border-white/10">
                    {sessions.length === 0 ? (
                      <SelectItem value="none" disabled>
                        No hay sesiones
                      </SelectItem>
                    ) : (
                      sessions.map((session) => (
                        <SelectItem key={session.id} value={session.id}>
                          {session.name
                            ? `${session.name} - ${formatSessionDate(session.date?.seconds)}`
                            : session.date?.seconds
                            ? formatSessionDate(session.date.seconds)
                            : "Sesión sin nombre ni fecha"}
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
          <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-white/10 bg-black/30">
            <img
              src="/placeholder.svg?height=400&width=600"
              alt="Juego de conciencia emocional"
              className="object-cover w-full h-full opacity-90"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white p-2 text-sm">
              {selectedPatient && selectedSession
                ? `Sesión activa: ${
                    patients.find((p) => p.id === selectedPatient)?.name || "Paciente"
                  } - ${sessions.find((s) => s.id === selectedSession)?.name || "Sin nombre"}`
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
                      <Badge className="mr-1 bg-emerald-500 hover:bg-emerald-600">
                        {s.name || "Sin nombre"}
                      </Badge>
                      <Badge variant="outline" className="border-white/30 text-white">
                        {formatSessionDate(s.date?.seconds) || "Sin fecha"}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge className="bg-white/15 text-white">Escenarios: {s.config?.scenariosPerEmotion ?? "-"}</Badge>
                      <Badge className="bg-white/15 text-white">Complejidad: {s.config?.complexityLevel ?? "-"}%</Badge>
                      <Badge className="bg-white/15 text-white">Intentos: {s.config?.allowedAttempts ?? "-"}</Badge>
                    </div>
                  </div>
                ))}
            </div>
          )}

          <div className="mt-4">
            <Tabs defaultValue="stats" className="text-white">
              <TabsList className="w-full bg-white/10 border border-white/10 rounded-2xl">
                <TabsTrigger value="stats" className="text-white data-[state=active]:bg-white/20 rounded-xl">
                  Estadísticas
                </TabsTrigger>
                <TabsTrigger value="attempts" className="text-white data-[state=active]:bg-white/20 rounded-xl">
                  Intentos por Emoción
                </TabsTrigger>
              </TabsList>

              <TabsContent value="stats" className="pt-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className="border border-white/10 rounded-2xl p-3 text-center bg-white/10">
                    <div className="text-sm font-medium text-white/80">Emoción Actual</div>
                    <div className="text-lg text-white">Feliz</div>
                  </div>
                  <div className="border border-white/10 rounded-2xl p-3 text-center bg-white/10">
                    <div className="text-sm font-medium text-white/80">Tiempo</div>
                    <div className="text-lg text-white">12:45</div>
                  </div>
                  <div className="border border-white/10 rounded-2xl p-3 text-center bg-white/10">
                    <div className="text-sm font-medium text-white/80">Aciertos</div>
                    <div className="text-lg text-white">8/10</div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="attempts" className="pt-4">
                <div className="text-sm text-white/80">Intentos por emoción (mock)</div>
              </TabsContent>
            </Tabs>
          </div>
        </CardContent>
      </Card>

      {/* Panel derecho: notas */}
      <Card className="border-white/10 bg-white/10 backdrop-blur-md text-white">
        <CardHeader>
          <CardTitle className="text-white/95">Notas y Sugerencias</CardTitle>
          {selectedSession && (
            <CardDescription className="text-white/70">
              {sessions.find((s) => s.id === selectedSession)?.name || "Sesión sin nombre"}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border border-white/10 rounded-2xl p-4 h-[300px] overflow-y-auto space-y-3 bg-white/5">
            {sessionNotes.length > 0 ? (
              sessionNotes.map((note, index) => (
                <div key={index} className="border-b border-white/10 pb-2 last:border-0">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-white/60">{note.timestamp}</span>
                  </div>
                  <p className="text-sm mt-1">{note.text}</p>
                </div>
              ))
            ) : (
              <p className="text-white/60 text-center">No hay notas para esta sesión</p>
            )}
          </div>

          <div className="space-y-2">
            <Textarea
              placeholder="Escriba sus notas o sugerencias durante la sesión..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[100px] rounded-2xl bg-white/20 border-white/20 text-white placeholder:text-white/70"
              disabled={!selectedSession}
            />
            <Button
              onClick={handleSendNote}
              className="w-full rounded-2xl bg-lime-600 hover:bg-lime-700"
              disabled={!selectedSession || notes.trim() === ""}
            >
              <Send className="mr-2 h-4 w-4" />
              Enviar Nota
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
