"use client"

import { useState } from "react"
import { Button } from "./ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Textarea } from "./ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { Send } from "lucide-react"
import { Badge } from "./ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs"

export default function GameMonitoring() {
  const [selectedPatient, setSelectedPatient] = useState("")
  const [notes, setNotes] = useState("")
  const [sessionNotes, setSessionNotes] = useState([])

  const handleSendNote = () => {
    if (notes.trim() === "") return

    const now = new Date()
    const timestamp = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`

    setSessionNotes([...sessionNotes, { text: notes, timestamp }])
    setNotes("")
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="overflow-hidden">
        <CardHeader className="pb-0">
          <div className="flex justify-between items-center">
            <CardTitle>Sesión de Juego</CardTitle>
            <Select value={selectedPatient} onValueChange={setSelectedPatient}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Seleccionar paciente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="carlos">Carlos Rodríguez</SelectItem>
                <SelectItem value="ana">Ana Martínez</SelectItem>
                <SelectItem value="miguel">Miguel Sánchez</SelectItem>
                <SelectItem value="laura">Laura Gómez</SelectItem>
                <SelectItem value="daniel">Daniel López</SelectItem>
              </SelectContent>
            </Select>
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
              {selectedPatient
                ? `Sesión activa: ${
                    selectedPatient === "carlos"
                      ? "Carlos Rodríguez"
                      : selectedPatient === "ana"
                        ? "Ana Martínez"
                        : selectedPatient === "miguel"
                          ? "Miguel Sánchez"
                          : selectedPatient === "laura"
                            ? "Laura Gómez"
                            : "Daniel López"
                  }`
                : "Seleccione un paciente para iniciar la sesión"}
            </div>
          </div>

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
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b pb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      <span className="font-medium">Feliz</span>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="outline" className="bg-green-50">
                        Intentos: 5
                      </Badge>
                      <Badge variant="outline" className="bg-green-50">
                        Aciertos: 4
                      </Badge>
                      <Badge variant="outline" className="bg-green-50">
                        Promedio: 1.2
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-b pb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                      <span className="font-medium">Triste</span>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="outline" className="bg-blue-50">
                        Intentos: 8
                      </Badge>
                      <Badge variant="outline" className="bg-blue-50">
                        Aciertos: 5
                      </Badge>
                      <Badge variant="outline" className="bg-blue-50">
                        Promedio: 1.6
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <span className="font-medium">Enojado</span>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="outline" className="bg-red-50">
                        Intentos: 6
                      </Badge>
                      <Badge variant="outline" className="bg-red-50">
                        Aciertos: 3
                      </Badge>
                      <Badge variant="outline" className="bg-red-50">
                        Promedio: 2.0
                      </Badge>
                    </div>
                  </div>

                  <div className="mt-2 pt-2 border-t">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Total de intentos:</span>
                      <Badge>19</Badge>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notas y Sugerencias</CardTitle>
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
              disabled={!selectedPatient}
            />
            <Button onClick={handleSendNote} className="w-full" disabled={!selectedPatient || notes.trim() === ""}>
              <Send className="mr-2 h-4 w-4" />
              Enviar Nota
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

