import { useEffect, useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Badge } from "./ui/badge"
import EmotionPerformanceChart from "./emotion-performance-chart"
import MonthlyPerformanceChart from "./monthly-performance-chart"
import SuggestionsList from "./suggestions-list"

export default function PatientDetails({ patient }) {
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    setRefreshKey((prev) => prev + 1)
  }, [patient?.id])

  if (!patient) {
    return <div>Paciente no encontrado</div>
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">{patient.name}</h2>
      <p className="text-muted-foreground">
        {patient.age} años | Nivel de autismo: {patient.autismLevel || "No especificado"}
      </p>

      <Tabs key={patient.id} defaultValue="weekly" className="w-full">
        <TabsList className="grid grid-cols-4 mb-4">
          <TabsTrigger value="weekly">Desempeño Semanal</TabsTrigger>
          <TabsTrigger value="monthly">Desempeño Mensual</TabsTrigger>
          <TabsTrigger value="suggestions">Anotaciones</TabsTrigger>
          <TabsTrigger value="history">Historial</TabsTrigger>
        </TabsList>

        <TabsContent value="weekly">
          <Card>
            <CardHeader>
              <CardTitle>Desempeño Semanal por Emoción</CardTitle>
            </CardHeader>
            <CardContent>
              {["Feliz", "Triste", "Enojado"].map((emotion) => (
                <div key={emotion} className="space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                    <h3 className="text-md font-medium">{emotion}</h3>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className="bg-muted">Intentos totales: --</Badge>
                      <Badge variant="outline" className="bg-muted">Intentos exitosos: --</Badge>
                      <Badge variant="outline" className="bg-muted">Promedio: --</Badge>
                    </div>
                  </div>
                  <EmotionPerformanceChart emotion={emotion} patientId={patient.id} />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monthly">
          <Card>
            <CardHeader>
              <CardTitle>Desempeño Mensual</CardTitle>
            </CardHeader>
            <CardContent>
              <MonthlyPerformanceChart patientId={patient.id} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="suggestions">
          <Card>
            <CardHeader>
              <CardTitle>Anotaciones</CardTitle>
            </CardHeader>
            <CardContent>
              <SuggestionsList patientId={patient.id} refreshTrigger={refreshKey} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Historial de Sesiones</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border-b pb-2">
                  <h3 className="font-medium">10/03/2025</h3>
                  <p className="text-sm text-muted-foreground">Duración: 45 minutos</p>
                  <div className="flex flex-wrap gap-2 my-2">
                    <Badge variant="outline" className="bg-green-50">Feliz: 8 intentos</Badge>
                    <Badge variant="outline" className="bg-blue-50">Triste: 10 intentos</Badge>
                    <Badge variant="outline" className="bg-red-50">Enojado: 7 intentos</Badge>
                  </div>
                  <p className="text-sm mt-1">
                    Reconocimiento de emociones básicas. Progreso notable en identificar "feliz".
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
