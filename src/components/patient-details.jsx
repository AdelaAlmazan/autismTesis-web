import { useEffect, useState } from "react"
import { Card, CardContent } from "./ui/card"
import { collection, query, where, getDocs, orderBy, limit } from "firebase/firestore"
import { db } from "../firebase"

export default function PatientDetails({ patient }) {
  const [weeklyData, setWeeklyData] = useState({
    alegria: 0,
    enojo: 0,
    tristeza: 0
  })

  const [monthlyData, setMonthlyData] = useState({
    anterior: {
      alegria: 0,
      enojo: 0,
      tristeza: 0
    },
    actual: {
      alegria: 0,
      enojo: 0,
      tristeza: 0
    }
  })

  const [userSelections, setUserSelections] = useState({
    alegria: [],
    enojo: [],
    tristeza: []
  })

  const [loading, setLoading] = useState(true)
  const [hasData, setHasData] = useState(false)

  useEffect(() => {
    async function loadPatientData() {
      if (!patient?.id) return

      setLoading(true)

      try {
        const weeklyPerformanceQuery = query(
          collection(db, "sessions"),
          where("patientId", "==", patient.id),
          orderBy("date", "desc"),
          limit(7)
        )

        const weeklySnapshot = await getDocs(weeklyPerformanceQuery)

        const currentMonthQuery = query(
          collection(db, "sessions"),
          where("patientId", "==", patient.id),
          where("month", "==", new Date().getMonth()),
          where("year", "==", new Date().getFullYear())
        )

        const currentMonthSnapshot = await getDocs(currentMonthQuery)

        const lastMonth = new Date().getMonth() === 0 ? 11 : new Date().getMonth() - 1
        const lastMonthYear = new Date().getMonth() === 0 ? new Date().getFullYear() - 1 : new Date().getFullYear()

        const previousMonthQuery = query(
          collection(db, "sessions"),
          where("patientId", "==", patient.id),
          where("month", "==", lastMonth),
          where("year", "==", lastMonthYear)
        )

        const previousMonthSnapshot = await getDocs(previousMonthQuery)

        if (!weeklySnapshot.empty) {
          const weeklySessionsData = weeklySnapshot.docs.map(doc => doc.data())
          const processedWeeklyData = processEmotionData(weeklySessionsData)
          setWeeklyData(processedWeeklyData)
        }

        if (!currentMonthSnapshot.empty) {
          const currentMonthData = currentMonthSnapshot.docs.map(doc => doc.data())
          const processedCurrentMonthData = processEmotionData(currentMonthData)

          setMonthlyData(prev => ({
            ...prev,
            actual: processedCurrentMonthData
          }))
        }

        if (!previousMonthSnapshot.empty) {
          const previousMonthData = previousMonthSnapshot.docs.map(doc => doc.data())
          const processedPreviousMonthData = processEmotionData(previousMonthData)

          setMonthlyData(prev => ({
            ...prev,
            anterior: processedPreviousMonthData
          }))
        }

        const userSelectionsQuery = query(
          collection(db, "selections"),
          where("patientId", "==", patient.id),
          orderBy("date", "desc"),
          limit(20)
        )

        const userSelectionsSnapshot = await getDocs(userSelectionsQuery)

        if (!userSelectionsSnapshot.empty) {
          const selectionsData = userSelectionsSnapshot.docs.map(doc => doc.data())

          const groupedSelections = {
            alegria: [],
            enojo: [],
            tristeza: []
          }

          selectionsData.forEach(selection => {
            if (selection.emotion === "happy") {
              groupedSelections.alegria.push(selection)
            } else if (selection.emotion === "angry") {
              groupedSelections.enojo.push(selection)
            } else if (selection.emotion === "sad") {
              groupedSelections.tristeza.push(selection)
            }
          })

          setUserSelections(groupedSelections)
        }

        const hasWeekly = !weeklySnapshot.empty
        const hasMonthly = !currentMonthSnapshot.empty || !previousMonthSnapshot.empty
        const hasSelections = !userSelectionsSnapshot.empty
        setHasData(hasWeekly || hasMonthly || hasSelections)

      } catch (error) {
        console.error("Error al cargar datos del paciente:", error)
      } finally {
        setLoading(false)
      }
    }

    loadPatientData()
  }, [patient?.id])

  function processEmotionData(sessionsData) {
    const emotions = {
      alegria: { total: 0, success: 0 },
      enojo: { total: 0, success: 0 },
      tristeza: { total: 0, success: 0 }
    }

    sessionsData.forEach(session => {
      if (session.emotions) {
        if (session.emotions.happy) {
          emotions.alegria.total += session.emotions.happy.attempts || 0
          emotions.alegria.success += session.emotions.happy.success || 0
        }

        if (session.emotions.angry) {
          emotions.enojo.total += session.emotions.angry.attempts || 0
          emotions.enojo.success += session.emotions.angry.success || 0
        }

        if (session.emotions.sad) {
          emotions.tristeza.total += session.emotions.sad.attempts || 0
          emotions.tristeza.success += session.emotions.sad.success || 0
        }
      }
    })

    return {
      alegria: emotions.alegria.total > 0 ? Math.round((emotions.alegria.success / emotions.alegria.total) * 100) : 0,
      enojo: emotions.enojo.total > 0 ? Math.round((emotions.enojo.success / emotions.enojo.total) * 100) : 0,
      tristeza: emotions.tristeza.total > 0 ? Math.round((emotions.tristeza.success / emotions.tristeza.total) * 100) : 0
    }
  }

  function generateSuggestions() {
    const suggestions = []

    Object.keys(monthlyData.anterior).forEach(emotion => {
      const previousValue = monthlyData.anterior[emotion]
      const currentValue = monthlyData.actual[emotion]

      if (currentValue < previousValue) {
        suggestions.push(`Trabajar más en la emoción "${emotion}" ya que bajó el desempeño.`)
      } else if (currentValue < 50) {
        suggestions.push(`Trabajar más emoción "${emotion}".`)
      }
    })

    if (suggestions.length === 0) {
      suggestions.push("Continuar con el trabajo actual, buen progreso.")
    }

    return suggestions
  }

  if (!patient) {
    return <div className="text-center p-4">Seleccione un paciente para ver sus detalles</div>
  }

  if (loading) {
    return <div className="text-center p-4">Cargando datos del paciente...</div>
  }

  if (!hasData) {
    return (
      <div className="p-6 bg-gray-100 min-h-screen flex items-center justify-center">
        <div className="bg-white p-6 rounded shadow text-center max-w-md">
          <p className="text-lg mb-4">No hay datos disponibles del paciente aún.</p>
          <a
            href="/configuration"
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
          >
            Comenzar una sesión
          </a>
        </div>
      </div>
    )
  }

  const suggestions = generateSuggestions()


  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Reporte de usuarios</h1>
        
        <div className="flex justify-between mb-4">
          <div className="text-lg">Sesiones semanales: 03</div>
          <div className="text-lg">Sesiones mensuales: 10</div>
          <button className="bg-gray-300 px-3 py-1 rounded">Ver notas</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left column - Weekly performance */}
          <Card className="col-span-1">
            <CardContent className="p-4">
              <div className="mb-6">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <span className="inline-block w-6 h-6 bg-gray-300 rounded-full text-center">
                    ℹ️
                  </span>
                  Desempeño semanal:
                </h2>
                
                <div className="space-y-4 mt-4">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span>Alegría:</span>
                      <span>{weeklyData.alegria}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-4">
                      <div 
                        className="bg-yellow-400 h-4 rounded-full" 
                        style={{width: `${weeklyData.alegria}%`}}
                      ></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-1">
                      <span>Enojo:</span>
                      <span>{weeklyData.enojo}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-4">
                      <div 
                        className="bg-red-500 h-4 rounded-full" 
                        style={{width: `${weeklyData.enojo}%`}}
                      ></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-1">
                      <span>Tristeza:</span>
                      <span>{weeklyData.tristeza}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-4">
                      <div 
                        className="bg-blue-500 h-4 rounded-full" 
                        style={{width: `${weeklyData.tristeza}%`}}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <span className="inline-block w-6 h-6 bg-gray-300 rounded-full text-center">
                    ℹ️
                  </span>
                  Selecciones del usuario:
                </h2>
                
                {/* User selection graph placeholders */}
                <div className="space-y-6 mt-4">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span>Alegría:</span>
                    </div>
                    <div className="h-24 w-full bg-gray-100 relative">
                      {/* Simplified bar chart representation */}
                      <div className="absolute bottom-0 left-1/4 w-6 h-12 bg-yellow-400"></div>
                      <div className="absolute bottom-0 left-2/4 w-6 h-16 bg-red-500"></div>
                      <div className="absolute bottom-0 left-3/4 w-6 h-8 bg-blue-500"></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-1">
                      <span>Enojo:</span>
                    </div>
                    <div className="h-24 w-full bg-gray-100 relative">
                      {/* Simplified bar chart representation */}
                      <div className="absolute bottom-0 left-1/4 w-6 h-4 bg-yellow-400"></div>
                      <div className="absolute bottom-0 left-2/4 w-6 h-16 bg-red-500"></div>
                      <div className="absolute bottom-0 left-3/4 w-6 h-8 bg-blue-500"></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-1">
                      <span>Tristeza:</span>
                    </div>
                    <div className="h-24 w-full bg-gray-100 relative">
                      {/* Simplified bar chart representation */}
                      <div className="absolute bottom-0 left-1/4 w-6 h-2 bg-yellow-400"></div>
                      <div className="absolute bottom-0 left-2/4 w-6 h-6 bg-red-500"></div>
                      <div className="absolute bottom-0 left-3/4 w-6 h-20 bg-blue-500"></div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Right column - Monthly report and suggestions */}
          <Card className="col-span-1">
            <CardContent className="p-4 space-y-6">
              <div>
                <h2 className="text-lg font-bold mb-4">Reporte mensual:</h2>
                
                <div className="mb-6">
                  <h3 className="font-medium mb-2">Mes anterior:</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span>Alegría:</span>
                        <span>{monthlyData.anterior.alegria}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-4">
                        <div 
                          className="bg-yellow-400 h-4 rounded-full" 
                          style={{width: `${monthlyData.anterior.alegria}%`}}
                        ></div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-1">
                        <span>Enojo:</span>
                        <span>{monthlyData.anterior.enojo}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-4">
                        <div 
                          className="bg-red-500 h-4 rounded-full" 
                          style={{width: `${monthlyData.anterior.enojo}%`}}
                        ></div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-1">
                        <span>Tristeza:</span>
                        <span>{monthlyData.anterior.tristeza}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-4">
                        <div 
                          className="bg-blue-500 h-4 rounded-full" 
                          style={{width: `${monthlyData.anterior.tristeza}%`}}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium mb-2">Mes actual:</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span>Alegría:</span>
                        <span>{monthlyData.actual.alegria}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-4">
                        <div 
                          className="bg-yellow-400 h-4 rounded-full" 
                          style={{width: `${monthlyData.actual.alegria}%`}}
                        ></div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-1">
                        <span>Enojo:</span>
                        <span>{monthlyData.actual.enojo}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-4">
                        <div 
                          className="bg-red-500 h-4 rounded-full" 
                          style={{width: `${monthlyData.actual.enojo}%`}}
                        ></div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-1">
                        <span>Tristeza:</span>
                        <span>{monthlyData.actual.tristeza}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-4">
                        <div 
                          className="bg-blue-500 h-4 rounded-full" 
                          style={{width: `${monthlyData.actual.tristeza}%`}}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h2 className="text-lg font-bold mb-4">Sugerencias:</h2>
                <ul className="list-disc pl-5 space-y-2">
                  {suggestions.map((suggestion, index) => (
                    <li key={index}>{suggestion}</li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}