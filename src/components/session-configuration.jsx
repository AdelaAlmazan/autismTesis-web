"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";
import { Slider } from "./ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Checkbox } from "./ui/checkbox";
import { Save, AlertCircle, Edit, Trash2, Clock, Calendar, Plus, PlayCircle, RotateCcw } from "lucide-react";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { db, auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs, query, where, addDoc, doc, deleteDoc, updateDoc, getDoc } from "firebase/firestore";

// Formato de fecha
const formatDate = (date) => {
  const options = { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" };
  return new Date(date).toLocaleDateString("es-ES", options);
};

const allEmotions = [
  { id: "happy", name: "Feliz", color: "bg-white/10 border-white/10", selected: true },
  { id: "sad", name: "Triste", color: "bg-white/10 border-white/10", selected: true },
  { id: "angry", name: "Asustado", color: "bg-white/10 border-white/10", selected: true },
];

export default function SessionManagement() {
  const [patients, setPatients] = useState([]);
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState("");
  const [patientInfo, setPatientInfo] = useState(null);

  // Historial
  const [sessionHistory, setSessionHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [sessionNote, setSessionNote] = useState("");
  const [sessionName, setSessionName] = useState("");

  // Config
  const [isEditingExistingSession, setIsEditingExistingSession] = useState(false);
  const [intrudersEnabled, setIntrudersEnabled] = useState(false);
  const [intrudersCount, setIntrudersCount] = useState(3);
  const [scenariosPerEmotion, setScenariosPerEmotion] = useState(5);
  const [allowedAttempts, setAllowedAttempts] = useState(3);
  const [emotions, setEmotions] = useState(allEmotions);
  const [selectedEmotions, setSelectedEmotions] = useState(allEmotions.filter((e) => e.selected));
  const [complexityLevel, setComplexityLevel] = useState([50]);
  const [partialReinforcer, setPartialReinforcer] = useState("star");
  const [customFinalReinforcer, setCustomFinalReinforcer] = useState("");
  const [instructionsVolume, setInstructionsVolume] = useState([75]);
  const [backgroundVolume, setBackgroundVolume] = useState([50]);
  const [guideType, setGuideType] = useState("both");

  // Vista
  const [viewMode, setViewMode] = useState("history"); // "history" | "config"

  useEffect(() => {
    setSelectedEmotions(emotions.filter((e) => e.selected));
  }, [emotions]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) return;
      try {
        const q = query(collection(db, "patients"), where("createdBy", "==", user.uid));
        const snapshot = await getDocs(q);
        const loaded = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setPatients(loaded);
      } catch (err) {
        console.error("Error al cargar pacientes:", err);
      } finally {
        setLoadingPatients(false);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const found = patients.find((p) => p.id === selectedPatient);
    setPatientInfo(found || null);
    setSelectedSessionId(null);
    setIsEditingExistingSession(false);

    if (selectedPatient) loadSessionHistory(selectedPatient);
    else setSessionHistory([]);
  }, [selectedPatient, patients]);

  const loadSessionHistory = async (patientId) => {
    setLoadingHistory(true);
    try {
      const sessionsRef = collection(db, "sessions");
      const q = query(sessionsRef, where("patientId", "==", patientId));
      const snapshot = await getDocs(q);
      const sessions = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date?.toDate() || new Date(),
      }));
      sessions.sort((a, b) => b.date - a.date);
      setSessionHistory(sessions);
    } catch (err) {
      console.error("Error al cargar historial:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const loadSessionConfig = async (sessionId) => {
    if (!sessionId) return;
    try {
      const sessionRef = doc(db, "sessions", sessionId);
      const sessionDoc = await getDoc(sessionRef);
      if (sessionDoc.exists()) {
        const s = sessionDoc.data();
        setIntrudersEnabled(!!s.config.intrudersEnabled);
        setIntrudersCount(s.config.intrudersCount ?? 3);
        setScenariosPerEmotion(s.config.scenariosPerEmotion ?? 5);
        setAllowedAttempts(s.config.allowedAttempts ?? 3);
        setComplexityLevel([s.config.complexityLevel ?? 50]);
        setPartialReinforcer(s.config.partialReinforcer || "star");
        setCustomFinalReinforcer(s.config.customFinalReinforcer || "");
        setInstructionsVolume([s.config.instructionsVolume ?? 75]);
        setBackgroundVolume([s.config.backgroundVolume ?? 50]);
        setGuideType(s.config.guideType || "both");
        setSessionNote(s.notes || "");
        setSessionName(s.name || "");

        const selectedIds = s.config.emotions || [];
        const updated = allEmotions.map((e) => ({ ...e, selected: selectedIds.includes(e.id) }));
        setEmotions(updated);

        setViewMode("config");
        setIsEditingExistingSession(true);
      }
    } catch (err) {
      console.error("Error al cargar configuración:", err);
      alert("Error al cargar la configuración de la sesión");
    }
  };

  const handleEmotionSelection = (id, isSelected) => {
    const updated = emotions.map((e) => (e.id === id ? { ...e, selected: isSelected } : e));
    setEmotions(updated);
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const items = Array.from(selectedEmotions);
    const [reordered] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reordered);

    const nonSelected = emotions.filter((e) => !e.selected);
    setEmotions([...nonSelected, ...items]);
    setSelectedEmotions(items);
  };

  const handleSaveConfiguration = async () => {
    if (!selectedPatient) return alert("Seleccione un paciente");
    if (!sessionName.trim()) return alert("Ingrese un nombre para la sesión");

    try {
      const sessionConfig = {
        name: sessionName.trim(),
        patientId: selectedPatient,
        patientName: patientInfo?.name,
        date: new Date(),
        config: {
          intrudersEnabled,
          intrudersCount,
          scenariosPerEmotion,
          allowedAttempts,
          emotions: selectedEmotions.map((e) => e.id),
          complexityLevel: complexityLevel[0],
          partialReinforcer,
          customFinalReinforcer,
          instructionsVolume: instructionsVolume[0],
          backgroundVolume: backgroundVolume[0],
          guideType,
        },
        notes: sessionNote,
        completed: false,
      };

      if (isEditingExistingSession && selectedSessionId) {
        const ref = doc(db, "sessions", selectedSessionId);
        await updateDoc(ref, {
          name: sessionName.trim(),
          config: sessionConfig.config,
          notes: sessionNote,
          lastEdited: new Date(),
        });
        alert("Configuración actualizada");
      } else {
        await addDoc(collection(db, "sessions"), sessionConfig);
        alert("Configuración guardada");
      }

      loadSessionHistory(selectedPatient);
      setViewMode("history");
      setIsEditingExistingSession(false);
      setSelectedSessionId(null);
    } catch (err) {
      console.error("Error al guardar:", err);
      alert("Error al guardar la configuración");
    }
  };

  const startNewSession = () => {
    setIntrudersEnabled(false);
    setIntrudersCount(3);
    setScenariosPerEmotion(5);
    setAllowedAttempts(3);
    setEmotions(allEmotions);
    setComplexityLevel([50]);
    setPartialReinforcer("star");
    setCustomFinalReinforcer("");
    setInstructionsVolume([75]);
    setBackgroundVolume([50]);
    setGuideType("both");
    setSessionNote("");
    setSessionName("");
    setSelectedSessionId(null);
    setIsEditingExistingSession(false);
    setViewMode("config");
  };

  const handleEditSession = (sessionId) => {
    setSelectedSessionId(sessionId);
    loadSessionConfig(sessionId);
  };

  const confirmDeleteSession = (sessionId) => setShowDeleteConfirm(sessionId);
  const cancelDeleteSession = () => setShowDeleteConfirm(null);

  const deleteSession = async () => {
    if (!showDeleteConfirm) return;
    try {
      const ref = doc(db, "sessions", showDeleteConfirm);
      await deleteDoc(ref);
      setSessionHistory((prev) => prev.filter((s) => s.id !== showDeleteConfirm));
      setShowDeleteConfirm(null);
      alert("Sesión eliminada");
    } catch (err) {
      console.error("Error al eliminar:", err);
      alert("Error al eliminar la sesión");
    }
  };

  /* ===================== Vistas ===================== */

  const renderHistoryView = () => (
    <div className="space-y-6 text-white">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-medium">Historial de Sesiones</h3>
        <div className="flex space-x-2">
          <Badge variant="outline" className="flex items-center border-white/30 text-white">
            <Clock className="mr-1 h-3 w-3" />
            {sessionHistory.length} sesiones
          </Badge>
          {selectedPatient && (
            <Button onClick={startNewSession} size="sm" className="rounded-2xl bg-lime-600 hover:bg-lime-700">
              <Plus className="mr-1 h-4 w-4" />
              Nueva Sesión
            </Button>
          )}
        </div>
      </div>

      {!selectedPatient ? (
        <Alert className="bg-white/10 border-white/20 text-white">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Seleccione un paciente</AlertTitle>
          <AlertDescription>Para ver el historial o crear una nueva sesión, seleccione un paciente.</AlertDescription>
        </Alert>
      ) : loadingHistory ? (
        <div className="text-center py-8">Cargando historial...</div>
      ) : sessionHistory.length === 0 ? (
        <div className="space-y-4">
          <Alert className="bg-white/10 border-white/20 text-white">
            <Calendar className="h-4 w-4" />
            <AlertTitle>Sin sesiones</AlertTitle>
            <AlertDescription>Este paciente aún no tiene sesiones registradas.</AlertDescription>
          </Alert>
          <div className="text-center">
            <Button onClick={startNewSession} className="rounded-2xl bg-lime-600 hover:bg-lime-700">
              <Plus className="mr-2 h-4 w-4" />
              Crear primera sesión
            </Button>
          </div>
        </div>
      ) : (
        <div className="border border-white/10 rounded-2xl overflow-hidden bg-white/5">
          <div className="overflow-x-auto">
            <table className="w-full text-white/90">
              <thead>
                <tr className="border-b border-white/10 bg-white/10">
                  <th className="py-3 px-4 text-left">Nombre</th>
                  <th className="py-3 px-4 text-left">Fecha</th>
                  <th className="py-3 px-4 text-left">Detalles</th>
                  <th className="py-3 px-4 text-left">Estado</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {sessionHistory.map((session) => (
                  <tr key={session.id} className="border-b border-white/10">
                    {showDeleteConfirm === session.id ? (
                      <td colSpan={5} className="py-3 px-4">
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertTitle>¿Eliminar esta sesión?</AlertTitle>
                          <AlertDescription>Esta acción no se puede deshacer.</AlertDescription>
                        </Alert>
                        <div className="flex justify-end space-x-2 mt-4">
                          <Button variant="outline" size="sm" onClick={cancelDeleteSession}>
                            Cancelar
                          </Button>
                          <Button variant="destructive" size="sm" onClick={deleteSession}>
                            Eliminar
                          </Button>
                        </div>
                      </td>
                    ) : (
                      <>
                        <td className="py-3 px-4 font-medium">{session.name || "Sin nombre"}</td>
                        <td className="py-3 px-4">{formatDate(session.date)}</td>
                        <td className="py-3 px-4">
                          <div className="space-y-1">
                            <div className="flex flex-wrap gap-2">
                              <Badge variant="outline" className="border-white/30 text-white">
                                {session.config.scenariosPerEmotion} escenarios
                              </Badge>
                              <Badge variant="outline" className="border-white/30 text-white">
                                Complejidad: {session.config.complexityLevel}%
                              </Badge>
                            </div>
                            {session.notes && (
                              <p className="text-xs text-white/70 line-clamp-1">{session.notes}</p>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <Badge className={session.completed ? "bg-emerald-600" : "bg-white/20 text-white"}>
                            {session.completed ? "Completada" : "Pendiente"}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex justify-end space-x-2">
                            <Button variant="outline" size="sm" className="border-white/30 text-white"
                              onClick={() => handleEditSession(session.id)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            {!session.completed && (
                              <Button variant="outline" size="sm" className="bg-emerald-500/15 text-emerald-300 border-emerald-400/30">
                                <PlayCircle className="h-4 w-4" />
                              </Button>
                            )}
                            <Button variant="outline" size="sm" className="text-red-300 border-red-300/30 hover:bg-red-500/10"
                              onClick={() => confirmDeleteSession(session.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );

  const renderConfigView = () => (
    <div className="space-y-6 text-white">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-medium">{isEditingExistingSession ? "Editar Sesión" : "Nueva Sesión"}</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setViewMode("history");
            setIsEditingExistingSession(false);
          }}
          className="flex items-center border-white/30 text-white"
        >
          <RotateCcw className="mr-1 h-4 w-4" />
          Volver al Historial
        </Button>
      </div>

      {/* Nombre */}
      <div className="space-y-2">
        <Label htmlFor="session-name" className="text-base font-medium">Nombre de la Sesión</Label>
        <Input
          id="session-name"
          value={sessionName}
          onChange={(e) => setSessionName(e.target.value)}
          placeholder="Ingrese un nombre para esta sesión"
          className="rounded-2xl bg-white/85 text-slate-800"
          required
        />
      </div>

      <Tabs defaultValue="personalization" className="w-full">
        <TabsList className="grid grid-cols-2 md:grid-cols-5 mb-4 bg-white/10 border border-white/10 rounded-2xl">
          <TabsTrigger value="personalization" className="text-white data-[state=active]:bg-white/20 rounded-xl">Personalización</TabsTrigger>
          <TabsTrigger value="game" className="text-white data-[state=active]:bg-white/20 rounded-xl">Juego</TabsTrigger>
          <TabsTrigger value="reinforcers" className="text-white data-[state=active]:bg-white/20 rounded-xl">Reforzadores</TabsTrigger>
          <TabsTrigger value="sounds" className="text-white data-[state=active]:bg-white/20 rounded-xl">Sonidos</TabsTrigger>
          <TabsTrigger value="guide" className="text-white data-[state=active]:bg-white/20 rounded-xl">Guía</TabsTrigger>
        </TabsList>

        {/* Reforzadores */}
        <TabsContent value="reinforcers" className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label className="text-base">Reforzador Parcial (emoji)</Label>
              <Input
                type="text"
                value={partialReinforcer}
                onChange={(e) => setPartialReinforcer(e.target.value)}
                placeholder="🌟, 🎉, 👍, etc."
                className="rounded-2xl bg-white/85 text-slate-800"
              />
            </div>
            <Separator className="bg-white/10" />
            <div>
              <Label className="text-base">Reforzador Final (YouTube link)</Label>
              <Input
                type="url"
                placeholder="https://www.youtube.com/watch?v=..."
                value={customFinalReinforcer}
                onChange={(e) => setCustomFinalReinforcer(e.target.value)}
                className="rounded-2xl bg-white/85 text-slate-800"
              />
            </div>
          </div>
        </TabsContent>

        {/* Sonidos */}
        <TabsContent value="sounds" className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label>Volumen del Guía</Label>
              <Slider value={instructionsVolume} onValueChange={setInstructionsVolume} max={100} step={1} />
              <p className="text-sm text-white/80">Nivel actual: {instructionsVolume[0]}%</p>
            </div>
            <div>
              <Label>Volumen del Juego</Label>
              <Slider value={backgroundVolume} onValueChange={setBackgroundVolume} max={100} step={1} />
              <p className="text-sm text-white/80">Nivel actual: {backgroundVolume[0]}%</p>
            </div>
          </div>
        </TabsContent>

        {/* Guía */}
        <TabsContent value="guide" className="space-y-6">
          <div className="space-y-2">
            <Label className="text-base">Tipo de Guía</Label>
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2">
                <Checkbox
                  checked={guideType === "auditory" || guideType === "both"}
                  onCheckedChange={(v) => setGuideType(v ? (guideType === "written" ? "both" : "auditory") : "written")}
                />
                <span>Auditivo</span>
              </label>
              <label className="flex items-center gap-2">
                <Checkbox
                  checked={guideType === "written" || guideType === "both"}
                  onCheckedChange={(v) => setGuideType(v ? (guideType === "auditory" ? "both" : "written") : "auditory")}
                />
                <span>Escrito</span>
              </label>
            </div>
          </div>
        </TabsContent>

        {/* Personalización */}
        <TabsContent value="personalization" className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="intruders-switch" className="text-base">Intrusos en el Juego</Label>
                <p className="text-sm text-white/80">Habilitar elementos distractores</p>
              </div>
              <Switch id="intruders-switch" checked={intrudersEnabled} onCheckedChange={setIntrudersEnabled} />
            </div>

            {intrudersEnabled && (
              <div className="pl-6 border-l-2 border-white/20 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="intruders-count">Cantidad de Intrusos</Label>
                  <div className="flex items-center gap-4">
                    <Input
                      id="intruders-count"
                      type="number"
                      min={1}
                      max={10}
                      value={intrudersCount}
                      onChange={(e) => setIntrudersCount(Number.parseInt(e.target.value))}
                      className="w-24 rounded-2xl bg-white/85 text-slate-800"
                    />
                    <span className="text-sm text-white/80">Número de distractores</span>
                  </div>
                </div>
              </div>
            )}

            <Separator className="bg-white/10" />

            <div className="space-y-2">
              <Label htmlFor="scenarios-count">Escenarios por Emoción</Label>
              <div className="flex items-center gap-4">
                <Input
                  id="scenarios-count"
                  type="number"
                  min={1}
                  max={10}
                  value={scenariosPerEmotion}
                  onChange={(e) => setScenariosPerEmotion(Number.parseInt(e.target.value))}
                  className="w-24 rounded-2xl bg-white/85 text-slate-800"
                />
                <span className="text-sm text-white/80">Por cada emoción seleccionada</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="attempts-count">Intentos Permitidos</Label>
              <div className="flex items-center gap-4">
                <Input
                  id="attempts-count"
                  type="number"
                  min={1}
                  max={5}
                  value={allowedAttempts}
                  onChange={(e) => setAllowedAttempts(Number.parseInt(e.target.value))}
                  className="w-24 rounded-2xl bg-white/85 text-slate-800"
                />
                <span className="text-sm text-white/80">Por escenario</span>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Juego */}
        <TabsContent value="game" className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label className="text-base mb-2 block">Selecciona las Emociones</Label>
              <p className="text-sm text-white/80 mb-4">Elige qué emociones incluir</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-6">
                {emotions.map((emotion) => (
                  <div
                    key={emotion.id}
                    className={`flex items-center space-x-2 p-3 rounded-md border ${emotion.color} text-white`}
                  >
                    <Checkbox
                      id={`emotion-${emotion.id}`}
                      checked={emotion.selected}
                      onCheckedChange={(checked) => handleEmotionSelection(emotion.id, checked === true)}
                    />
                    <Label htmlFor={`emotion-${emotion.id}`} className="flex-1 cursor-pointer">
                      {emotion.name}
                    </Label>
                  </div>
                ))}
              </div>

              {selectedEmotions.length === 0 ? (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Atención</AlertTitle>
                  <AlertDescription>Debes seleccionar al menos una emoción.</AlertDescription>
                </Alert>
              ) : (
                <>
                  <Label className="text-base mb-2 block">Ordena las Emociones Seleccionadas</Label>
                  <p className="text-sm text-white/80 mb-4">Arrastra para definir el orden</p>

                  <DragDropContext onDragEnd={handleDragEnd}>
                    <Droppable droppableId="emotions">
                      {(provided) => (
                        <ul {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                          {selectedEmotions.map((emotion, index) => (
                            <Draggable key={emotion.id} draggableId={emotion.id} index={index}>
                              {(provided) => (
                                <li
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className="flex items-center justify-between p-3 rounded-md border border-white/10 bg-white/10 text-white"
                                >
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">{index + 1}.</span>
                                    <span>{emotion.name}</span>
                                  </div>
                                  <Badge variant="outline" className="border-white/30 text-white">
                                    {index === 0
                                      ? "Primera"
                                      : index === selectedEmotions.length - 1
                                      ? "Última"
                                      : `Posición ${index + 1}`}
                                  </Badge>
                                </li>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </ul>
                      )}
                    </Droppable>
                  </DragDropContext>
                </>
              )}
            </div>

            <Separator className="bg-white/10" />

            <div className="space-y-2">
              <Label htmlFor="complexity" className="text-base">Nivel de Complejidad</Label>
              <div className="pt-3 pb-1">
                <Slider id="complexity" value={complexityLevel} onValueChange={setComplexityLevel} max={100} step={1} />
              </div>
              <div className="flex justify-between text-sm text-white/70">
                <span>1</span>
                <span>2</span>
                <span>3</span>
                <span>4</span>
              </div>
              <p className="text-sm text-white/80 mt-2">Nivel actual: {complexityLevel[0]}%</p>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <div className="space-y-4 mt-6 border-t border-white/10 pt-6">
        <div>
          <Label htmlFor="session-notes">Notas de la Sesión</Label>
          <Input
            id="session-notes"
            value={sessionNote}
            onChange={(e) => setSessionNote(e.target.value)}
            placeholder="Agregar notas o comentarios..."
            className="mt-1 rounded-2xl bg-white/85 text-slate-800"
          />
        </div>

        <div className="flex justify-end space-x-3">
          <Button
            variant="outline"
            onClick={() => {
              setViewMode("history");
              setIsEditingExistingSession(false);
            }}
            className="border-white/30 text-white"
          >
            Cancelar
          </Button>
          <Button onClick={handleSaveConfiguration} className="bg-lime-600 hover:bg-lime-700 rounded-2xl">
            <Save className="mr-2 h-4 w-4" />
            {isEditingExistingSession ? "Actualizar Sesión" : "Guardar Sesión"}
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <Card className="border-white/10 bg-white/10 backdrop-blur-md text-white rounded-[22px]">
        <CardHeader>
          <CardTitle className="text-white/95">Gestión de Sesiones</CardTitle>
          <CardDescription className="text-white/70">
            Configure y administre las sesiones de terapia de conciencia emocional
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 mb-6">
            <Label htmlFor="patient">Seleccionar Paciente</Label>
            <Select value={selectedPatient} onValueChange={setSelectedPatient}>
              <SelectTrigger id="patient" className="rounded-2xl bg-white/20 border-white/20 text-white">
                <SelectValue placeholder="Seleccionar paciente" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 text-white border-white/10">
                {loadingPatients ? (
                  <SelectItem value="loading" disabled>
                    Cargando...
                  </SelectItem>
                ) : patients.length === 0 ? (
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

            {patientInfo && (
              <div className="p-4 mt-2 border border-white/10 rounded-2xl bg-white/10 text-white">
                <p className="text-sm">
                  📌 <strong>Nombre:</strong> {patientInfo.name}
                </p>
                <p className="text-sm">
                  🎂 <strong>Edad:</strong> {patientInfo.age} años
                </p>
                <p className="text-sm">
                  🧠 <strong>Nivel de Autismo:</strong> {patientInfo.autismLevel || "No especificado"}
                </p>
              </div>
            )}
          </div>

          {viewMode === "history" ? renderHistoryView() : renderConfigView()}
        </CardContent>
      </Card>
    </div>
  );
}
