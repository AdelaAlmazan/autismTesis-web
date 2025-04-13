// src/components/session-configuration.jsx

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
import { Save, AlertCircle } from "lucide-react"
import { Badge } from "./ui/badge"
import { Separator } from "./ui/separator"
import { Alert, AlertDescription, AlertTitle } from "./ui/alert"
import { db, auth } from "../firebase"
import { onAuthStateChanged } from "firebase/auth"
import { collection, getDocs, query, where } from "firebase/firestore"

const allEmotions = [
  { id: "happy", name: "Feliz", color: "bg-green-100", selected: true },
  { id: "sad", name: "Triste", color: "bg-blue-100", selected: true },
  { id: "angry", name: "Enojado", color: "bg-red-100", selected: true },
]

export default function SessionConfiguration() {
  const [patients, setPatients] = useState([])
  const [loadingPatients, setLoadingPatients] = useState(true)
  const [selectedPatient, setSelectedPatient] = useState("")
  const [patientInfo, setPatientInfo] = useState(null)

  const [intrudersEnabled, setIntrudersEnabled] = useState(false)
  const [intrudersCount, setIntrudersCount] = useState(3)
  const [scenariosPerEmotion, setScenariosPerEmotion] = useState(5)
  const [allowedAttempts, setAllowedAttempts] = useState(3)

  const [emotions, setEmotions] = useState(allEmotions)
  const [selectedEmotions, setSelectedEmotions] = useState(allEmotions.filter((e) => e.selected))
  const [complexityLevel, setComplexityLevel] = useState([50])

  const [partialReinforcer, setPartialReinforcer] = useState("star")
  const [customPartialReinforcer, setCustomPartialReinforcer] = useState("")
  const [showCustomPartialInput, setShowCustomPartialInput] = useState(false)
  const [finalReinforcerType, setFinalReinforcerType] = useState("visual")
  const [visualReinforcer, setVisualReinforcer] = useState("confetti")
  const [soundReinforcer, setSoundReinforcer] = useState("applause")
  const [customFinalReinforcer, setCustomFinalReinforcer] = useState("")
  const [showCustomFinalInput, setShowCustomFinalInput] = useState(false)

  const [instructionsVolume, setInstructionsVolume] = useState([75])
  const [backgroundVolume, setBackgroundVolume] = useState([50])
  const [guideType, setGuideType] = useState("both")

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
  }, [selectedPatient, patients])

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

  const handleSaveConfiguration = () => {
    alert("Configuración guardada exitosamente")
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Configuración de Sesión de Juego</CardTitle>
          <CardDescription>Configure los parámetros para la sesión de terapia de conciencia emocional</CardDescription>
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

          {/* Aquí puedes seguir manteniendo las pestañas de configuración: */}
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
        <span>Fácil</span>
        <span>Medio</span>
        <span>Difícil</span>
      </div>
      <p className="text-sm text-muted-foreground mt-2">Nivel actual: {complexityLevel[0]}%</p>
    </div>
  </div>
</TabsContent>

          </Tabs>

          <div className="flex justify-end mt-6">
            <Button onClick={handleSaveConfiguration}>
              <Save className="mr-2 h-4 w-4" />
              Guardar Configuración
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
