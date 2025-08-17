// src/components/session-management.jsx
// src/components/session-management.jsx

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Switch } from "./ui/switch"
import { Slider } from "./ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd"
import { Checkbox } from "./ui/checkbox"
import { Save, AlertCircle, Edit, Trash2, Clock, Calendar, Plus, PlayCircle, RotateCcw } from "lucide-react"
import { Badge } from "./ui/badge"
import { Separator } from "./ui/separator"
import { Alert, AlertDescription, AlertTitle } from "./ui/alert"
import { db, auth } from "../firebase"
import { onAuthStateChanged } from "firebase/auth"
import { collection, getDocs, query, where, addDoc, doc, deleteDoc, updateDoc, getDoc } from "firebase/firestore"

// Función simple para formatear fechas
const formatDate = (date) => {
  const options = { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit', 
    minute: '2-digit'
  };
  return new Date(date).toLocaleDateString('es-ES', options);
};

const allEmotions = [
  { id: "happy", name: "Feliz", color: "bg-green-100", selected: true },
  { id: "sad", name: "Triste", color: "bg-blue-100", selected: true },
  { id: "angry", name: "Asustado", color: "bg-red-100", selected: true },
]

export default function SessionManagement() {
  const [patients, setPatients] = useState([])
  const [loadingPatients, setLoadingPatients] = useState(true)
  const [selectedPatient, setSelectedPatient] = useState("")
  const [patientInfo, setPatientInfo] = useState(null)

  // Estado para epul historial de sesiones
  const [sessionHistory, setSessionHistory] = useState([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [selectedSessionId, setSelectedSessionId] = useState(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null)
  const [sessionNote, setSessionNote] = useState("")
  const [sessionName, setSessionName] = useState("") // Nuevo estado para el nombre de la sesión

  // Estado para la configuración de sesión
  const [isEditingExistingSession, setIsEditingExistingSession] = useState(false)
  const [intrudersEnabled, setIntrudersEnabled] = useState(false)
  const [intrudersCount, setIntrudersCount] = useState(3)
  const [scenariosPerEmotion, setScenariosPerEmotion] = useState(5)
  const [allowedAttempts, setAllowedAttempts] = useState(3)
  const [emotions, setEmotions] = useState(allEmotions)
  const [selectedEmotions, setSelectedEmotions] = useState(allEmotions.filter((e) => e.selected))
  const [complexityLevel, setComplexityLevel] = useState([50])
  const [partialReinforcer, setPartialReinforcer] = useState("star")
  const [customFinalReinforcer, setCustomFinalReinforcer] = useState("")
  const [instructionsVolume, setInstructionsVolume] = useState([75])
  const [backgroundVolume, setBackgroundVolume] = useState([50])
  const [guideType, setGuideType] = useState("both")

  // Modo de vista actual
  const [viewMode, setViewMode] = useState("history") // "history" o "config"

  useEffect(() => {
    setSelectedEmotions(emotions.filter((e) => e.selected))
  }, [emotions])

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) return
      try {
        const q = query(collection(db, "patients"), where("createdBy", "==", user.uid))
        const snapshot = await getDocs(q)
        const loaded = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        setPatients(loaded)
      } catch (err) {
        console.error("Error al cargar pacientes:", err)
      } finally {
        setLoadingPatients(false)
      }
    })
    return () => unsubscribe()
  }, [])

  useEffect(() => {
    const found = patients.find(p => p.id === selectedPatient)
    setPatientInfo(found || null)
    
    // Resetear el estado de sesión al cambiar de paciente
    setSelectedSessionId(null)
    setIsEditingExistingSession(false)
    
    // Cargar el historial de sesiones cuando cambia el paciente seleccionado
    if (selectedPatient) {
      loadSessionHistory(selectedPatient)
    } else {
      setSessionHistory([])
    }
  }, [selectedPatient, patients])

  const loadSessionHistory = async (patientId) => {
    setLoadingHistory(true)
    try {
      const sessionsRef = collection(db, "sessions")
      const q = query(sessionsRef, where("patientId", "==", patientId))
      const snapshot = await getDocs(q)
      const sessions = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date?.toDate() || new Date()
      }))
      
      // Ordenar por fecha (más reciente primero)
      sessions.sort((a, b) => b.date - a.date)
      setSessionHistory(sessions)
    } catch (err) {
      console.error("Error al cargar el historial de sesiones:", err)
    } finally {
      setLoadingHistory(false)
    }
  }

  const loadSessionConfig = async (sessionId) => {
    if (!sessionId) return;
    
    try {
      const sessionRef = doc(db, "sessions", sessionId);
      const sessionDoc = await getDoc(sessionRef);
      
      if (sessionDoc.exists()) {
        const sessionData = sessionDoc.data();
        
        // Cargar los valores de la configuración
        setIntrudersEnabled(sessionData.config.intrudersEnabled);
        setIntrudersCount(sessionData.config.intrudersCount);
        setScenariosPerEmotion(sessionData.config.scenariosPerEmotion);
        setAllowedAttempts(sessionData.config.allowedAttempts);
        setComplexityLevel([sessionData.config.complexityLevel]);
        setPartialReinforcer(sessionData.config.partialReinforcer || "star");
        setCustomFinalReinforcer(sessionData.config.customFinalReinforcer || "");
        setInstructionsVolume([sessionData.config.instructionsVolume || 75]);
        setBackgroundVolume([sessionData.config.backgroundVolume || 50]);
        setGuideType(sessionData.config.guideType || "both");
        setSessionNote(sessionData.notes || "");
        // Cargar el nombre de la sesión
        setSessionName(sessionData.name || "");
        
        // Configurar las emociones
        const selectedEmotionIds = sessionData.config.emotions || [];
        const updatedEmotions = allEmotions.map(emotion => ({
          ...emotion,
          selected: selectedEmotionIds.includes(emotion.id)
        }));
        
        setEmotions(updatedEmotions);
        
        // Cambiar al modo de configuración
        setViewMode("config");
        setIsEditingExistingSession(true);
      }
    } catch (err) {
      console.error("Error al cargar la configuración de la sesión:", err);
      alert("Error al cargar la configuración de la sesión");
    }
  };

  const handleEmotionSelection = (id, isSelected) => {
    const updatedEmotions = emotions.map((emotion) =>
      emotion.id === id ? { ...emotion, selected: isSelected } : emotion
    )
    setEmotions(updatedEmotions)
  }

  const handleDragEnd = (result) => {
    if (!result.destination) return
    const items = Array.from(selectedEmotions)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    const nonSelected = emotions.filter(e => !e.selected)
    const newEmotions = [...nonSelected, ...items]
    setEmotions(newEmotions)
    setSelectedEmotions(items)
  }

  const handleSaveConfiguration = async () => {
    if (!selectedPatient) {
      alert("Por favor, seleccione un paciente primero")
      return
    }

    // Validar que haya un nombre para la sesión
    if (!sessionName.trim()) {
      alert("Por favor, ingrese un nombre para la sesión")
      return
    }

    try {
      // Crear un objeto con la configuración actual
      const sessionConfig = {
        name: sessionName.trim(), // Añadir el nombre de la sesión
        patientId: selectedPatient,
        patientName: patientInfo?.name,
        date: new Date(),
        config: {
          intrudersEnabled,
          intrudersCount,
          scenariosPerEmotion,
          allowedAttempts,
          emotions: selectedEmotions.map(e => e.id),
          complexityLevel: complexityLevel[0],
          partialReinforcer,
          customFinalReinforcer,
          instructionsVolume: instructionsVolume[0],
          backgroundVolume: backgroundVolume[0],
          guideType
        },
        notes: sessionNote,
        completed: false
      }

      if (isEditingExistingSession && selectedSessionId) {
        // Actualizar una sesión existente
        const sessionRef = doc(db, "sessions", selectedSessionId);
        await updateDoc(sessionRef, {
          name: sessionName.trim(), // Actualizar el nombre
          config: sessionConfig.config,
          notes: sessionNote,
          lastEdited: new Date()
        });
        alert("Configuración actualizada exitosamente");
      } else {
        // Crear una nueva sesión
        await addDoc(collection(db, "sessions"), sessionConfig);
        alert("Configuración guardada exitosamente");
      }
      
      // Recargar el historial de sesiones y volver a la vista de historial
      loadSessionHistory(selectedPatient);
      setViewMode("history");
      setIsEditingExistingSession(false);
      setSelectedSessionId(null);
      
    } catch (err) {
      console.error("Error al guardar la configuración:", err)
      alert("Error al guardar la configuración")
    }
  }

  const startNewSession = () => {
    // Reiniciar todos los valores a su estado predeterminado
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
    setSessionName(""); // Limpiar el nombre de la sesión
    
    setSelectedSessionId(null);
    setIsEditingExistingSession(false);
    setViewMode("config");
  }

  const handleEditSession = (sessionId) => {
    setSelectedSessionId(sessionId);
    loadSessionConfig(sessionId);
  }

  const confirmDeleteSession = (sessionId) => {
    setShowDeleteConfirm(sessionId);
  }

  const cancelDeleteSession = () => {
    setShowDeleteConfirm(null);
  }

  const deleteSession = async () => {
    if (!showDeleteConfirm) return;
    
    try {
      const sessionRef = doc(db, "sessions", showDeleteConfirm);
      await deleteDoc(sessionRef);
      
      // Eliminar la sesión del historial local
      setSessionHistory(prev => prev.filter(session => session.id !== showDeleteConfirm));
      
      setShowDeleteConfirm(null);
      alert("Sesión eliminada correctamente");
    } catch (err) {
      console.error("Error al eliminar la sesión:", err);
      alert("Error al eliminar la sesión");
    }
  }

  const renderHistoryView = () => {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Historial de Sesiones</h3>
          <div className="flex space-x-2">
            <Badge variant="outline" className="flex items-center">
              <Clock className="mr-1 h-3 w-3" /> 
              {sessionHistory.length} sesiones
            </Badge>
            {selectedPatient && (
              <Button onClick={startNewSession} size="sm" className="flex items-center">
                <Plus className="mr-1 h-4 w-4" />
                Nueva Sesión
              </Button>
            )}
          </div>
        </div>

        {!selectedPatient ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Seleccione un paciente</AlertTitle>
            <AlertDescription>
              Para ver el historial de sesiones o crear una nueva, primero debe seleccionar un paciente.
            </AlertDescription>
          </Alert>
        ) : loadingHistory ? (
          <div className="text-center py-8">
            <p>Cargando historial...</p>
          </div>
        ) : sessionHistory.length === 0 ? (
          <div className="space-y-4">
            <Alert>
              <Calendar className="h-4 w-4" />
              <AlertTitle>Sin sesiones</AlertTitle>
              <AlertDescription>
                Este paciente aún no tiene sesiones registradas.
              </AlertDescription>
            </Alert>
            <div className="text-center">
              <Button onClick={startNewSession} className="flex items-center mx-auto">
                <Plus className="mr-2 h-4 w-4" />
                Crear primera sesión
              </Button>
            </div>
          </div>
        ) : (
          <div className="border rounded-md">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted">
                    <th className="py-3 px-4 text-left">Nombre</th>
                    <th className="py-3 px-4 text-left">Fecha</th>
                    <th className="py-3 px-4 text-left">Detalles</th>
                    <th className="py-3 px-4 text-left">Estado</th>
                    <th className="py-3 px-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {sessionHistory.map((session) => (
                    <tr key={session.id} className="border-b">
                      {showDeleteConfirm === session.id ? (
                        // Confirmación de eliminación
                        <td colSpan={5} className="py-3 px-4">
                          <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>¿Eliminar esta sesión?</AlertTitle>
                            <AlertDescription>
                              Esta acción no se puede deshacer. Se eliminarán todos los datos de la sesión.
                            </AlertDescription>
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
                        // Modo visualización
                        <>
                          <td className="py-3 px-4 font-medium">
                            {session.name || "Sin nombre"}
                          </td>
                          <td className="py-3 px-4">
                            {formatDate(session.date)}
                          </td>
                          <td className="py-3 px-4">
                            <div className="space-y-1">
                              <div className="flex flex-wrap gap-1">
                                <Badge variant="outline">
                                  {session.config.scenariosPerEmotion} escenarios
                                </Badge>
                                <Badge variant="outline">
                                  Complejidad: {session.config.complexityLevel}%
                                </Badge>
                              </div>
                              {session.notes && (
                                <p className="text-xs text-muted-foreground line-clamp-1">
                                  {session.notes}
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <Badge variant={session.completed ? "success" : "secondary"}>
                              {session.completed ? "Completada" : "Pendiente"}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex justify-end space-x-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleEditSession(session.id)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              {!session.completed && (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="bg-green-50 hover:bg-green-100 text-green-600"
                                >
                                  <PlayCircle className="h-4 w-4" />
                                </Button>
                              )}
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="text-destructive hover:bg-destructive/10"
                                onClick={() => confirmDeleteSession(session.id)}
                              >
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
  }

  const renderConfigView = () => {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">
            {isEditingExistingSession ? 'Editar Sesión' : 'Nueva Sesión'}
          </h3>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
              setViewMode("history");
              setIsEditingExistingSession(false);
            }}
            className="flex items-center"
          >
            <RotateCcw className="mr-1 h-4 w-4" />
            Volver al Historial
          </Button>
        </div>

        {/* Nombre de la sesión - añadido antes de las pestañas */}
        <div className="space-y-2">
          <Label htmlFor="session-name" className="text-base font-medium">Nombre de la Sesión</Label>
          <Input
            id="session-name"
            value={sessionName}
            onChange={(e) => setSessionName(e.target.value)}
            placeholder="Ingrese un nombre para esta sesión"
            className="mb-2"
            required
          />
        </div>

        <Tabs defaultValue="personalization" className="w-full">
          <TabsList className="grid grid-cols-2 md:grid-cols-5 mb-4">
            <TabsTrigger value="personalization">Personalización</TabsTrigger>
            <TabsTrigger value="game">Configuración del Juego</TabsTrigger>
            <TabsTrigger value="reinforcers">Reforzadores</TabsTrigger>
            <TabsTrigger value="sounds">Sonidos</TabsTrigger>
            <TabsTrigger value="guide">Guía</TabsTrigger>
          </TabsList>

          <TabsContent value="reinforcers" className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label className="text-base">Reforzador Parcial (emoji)</Label>
                <Input
                  type="text"
                  value={partialReinforcer}
                  onChange={(e) => setPartialReinforcer(e.target.value)}
                  placeholder="🌟, 🎉, 👍, etc."
                />
              </div>

              <Separator />

              <div>
                <Label className="text-base">Reforzador Final (YouTube link)</Label>
                <Input
                  type="url"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={customFinalReinforcer}
                  onChange={(e) => setCustomFinalReinforcer(e.target.value)}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="sounds" className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label>Volumen del Guía</Label>
                <Slider value={instructionsVolume} onValueChange={setInstructionsVolume} max={100} step={1} />
                <p className="text-sm text-muted-foreground">Nivel actual: {instructionsVolume[0]}%</p>
              </div>

              <div>
                <Label>Volumen del Juego</Label>
                <Slider value={backgroundVolume} onValueChange={setBackgroundVolume} max={100} step={1} />
                <p className="text-sm text-muted-foreground">Nivel actual: {backgroundVolume[0]}%</p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="guide" className="space-y-6">
            <div className="space-y-2">
              <Label className="text-base">Tipo de Guía</Label>
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2">
                  <Checkbox checked={guideType === "auditory" || guideType === "both"} onCheckedChange={(v) => setGuideType(v ? (guideType === "written" ? "both" : "auditory") : "written")} />
                  <span>Auditivo</span>
                </label>
                <label className="flex items-center gap-2">
                  <Checkbox checked={guideType === "written" || guideType === "both"} onCheckedChange={(v) => setGuideType(v ? (guideType === "auditory" ? "both" : "written") : "auditory")} />
                  <span>Escrito</span>
                </label>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="personalization" className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="intruders-switch" className="text-base">
                    Intrusos en el Juego
                  </Label>
                  <p className="text-sm text-muted-foreground">Habilitar elementos distractores durante el juego</p>
                </div>
                <Switch id="intruders-switch" checked={intrudersEnabled} onCheckedChange={setIntrudersEnabled} />
              </div>

              {intrudersEnabled && (
                <div className="pl-6 border-l-2 border-muted space-y-4">
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
                        className="w-20"
                      />
                      <span className="text-sm text-muted-foreground">
                        Número de elementos distractores que aparecerán
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="scenarios-count">Número de Escenarios por Emoción</Label>
                <div className="flex items-center gap-4">
                  <Input
                    id="scenarios-count"
                    type="number"
                    min={1}
                    max={10}
                    value={scenariosPerEmotion}
                    onChange={(e) => setScenariosPerEmotion(Number.parseInt(e.target.value))}
                    className="w-20"
                  />
                  <span className="text-sm text-muted-foreground">
                    Cantidad de escenarios que se mostrarán para cada emoción
                  </span>
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
                    className="w-20"
                  />
                  <span className="text-sm text-muted-foreground">
                    Número de intentos que tendrá el paciente para cada escenario
                  </span>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="game" className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label className="text-base mb-2 block">Selecciona las Emociones</Label>
                <p className="text-sm text-muted-foreground mb-4">Elige qué emociones incluir en el juego</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-6">
                  {emotions.map((emotion) => (
                    <div key={emotion.id} className={`flex items-center space-x-2 p-3 border rounded-md ${emotion.color}`}>
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
                    <AlertDescription>Debes seleccionar al menos una emoción para el juego.</AlertDescription>
                  </Alert>
                ) : (
                  <>
                    <Label className="text-base mb-2 block">Ordena las Emociones Seleccionadas</Label>
                    <p className="text-sm text-muted-foreground mb-4">
                      Arrastra para reordenar las emociones según el orden en que deseas que aparezcan
                    </p>

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
                                    className={`flex items-center justify-between p-3 rounded-md border ${emotion.color}`}
                                  >
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium">{index + 1}.</span>
                                      <span>{emotion.name}</span>
                                    </div>
                                    <Badge variant="outline">
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

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="complexity" className="text-base">
                  Nivel de Complejidad
                </Label>
                <div className="pt-4 pb-2">
                  <Slider
                    id="complexity"
                    value={complexityLevel}
                    onValueChange={setComplexityLevel}
                    max={100}
                    step={1}
                  />
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>1</span>
                  <span>2</span>
                  <span>3</span>
                  <span>4</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">Nivel actual: {complexityLevel[0]}%</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="space-y-4 mt-6 border-t pt-6">
          <div>
            <Label htmlFor="session-notes">Notas de la Sesión</Label>
            <Input
              id="session-notes"
              value={sessionNote}
              onChange={(e) => setSessionNote(e.target.value)}
              placeholder="Agregar notas o comentarios sobre esta sesión..."
              className="mt-1"
            />
          </div>

          <div className="flex justify-end space-x-3">
            <Button 
              variant="outline" 
              onClick={() => {
                setViewMode("history");
                setIsEditingExistingSession(false);
              }}
            >
              Cancelar
            </Button>
            <Button onClick={handleSaveConfiguration}>
              <Save className="mr-2 h-4 w-4" />
              {isEditingExistingSession ? 'Actualizar Sesión' : 'Guardar Sesión'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Gestión de Sesiones</CardTitle>
          <CardDescription>Configure y administre las sesiones de terapia de conciencia emocional</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 mb-6">
            <Label htmlFor="patient">Seleccionar Paciente</Label>
            <Select value={selectedPatient} onValueChange={setSelectedPatient}>
              <SelectTrigger id="patient">
                <SelectValue placeholder="Seleccionar paciente" />
              </SelectTrigger>
              <SelectContent>
                {loadingPatients ? (
                  <SelectItem value="loading">Cargando...</SelectItem>
                ) : patients.length === 0 ? (
                  <SelectItem value="none">No hay pacientes</SelectItem>
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
              <div className="p-4 mt-2 border rounded bg-muted">
                <p className="text-sm">📌 <strong>Nombre:</strong> {patientInfo.name}</p>
                <p className="text-sm">🎂 <strong>Edad:</strong> {patientInfo.age} años</p>
                <p className="text-sm">🧠 <strong>Nivel de Autismo:</strong> {patientInfo.autismLevel || 'No especificado'}</p>
              </div>
            )}
          </div>

          {viewMode === "history" ? renderHistoryView() : renderConfigView()}
        </CardContent>
      </Card>
    </div>
  )
}