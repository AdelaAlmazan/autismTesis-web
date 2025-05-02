import { Link, useLocation, useNavigate } from "react-router-dom"
import { Button } from "./ui/button"
import { LogOut, Menu, UserPlus } from "lucide-react"
import { useEffect, useState } from "react"
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet"
import { onAuthStateChanged } from "firebase/auth"
import { doc, getDoc } from "firebase/firestore"
import { auth, db } from "../firebase"

export default function Header() {
  const location = useLocation()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [userName, setUserName] = useState("")
  const [userRole, setUserRole] = useState("")

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const ref = doc(db, "users", user.uid)
        const snap = await getDoc(ref)
        if (snap.exists()) {
          const data = snap.data()
          setIsAdmin(data.role === "admin")
          setUserName(data.name)
          setUserRole(data.role)
        }
      }
    })
    return () => unsubscribe()
  }, [])

  const handleLogout = () => {
    navigate("/")
  }

  const handleAddUser = () => {
    navigate("/add-user")
  }

  return (
    <header className="sticky top-0 z-10 border-b bg-background">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64">
              <nav className="flex flex-col gap-4 pt-4">
                <Link to="/dashboard" className={`px-4 py-2 text-sm font-medium rounded-md ${location.pathname === "/dashboard" ? "bg-primary/10 text-primary" : ""}`} onClick={() => setOpen(false)}>
                  Pacientes
                </Link>
                <Link to="/monitoring" className={`px-4 py-2 text-sm font-medium rounded-md ${location.pathname === "/monitoring" ? "bg-primary/10 text-primary" : ""}`} onClick={() => setOpen(false)}>
                  Monitoreo en Tiempo Real
                </Link>
                <Link to="/configuration" className={`px-4 py-2 text-sm font-medium rounded-md ${location.pathname === "/configuration" ? "bg-primary/10 text-primary" : ""}`} onClick={() => setOpen(false)}>
                  Sesiones
                </Link>
              </nav>
            </SheetContent>
          </Sheet>
          <Link to="/dashboard" className="font-bold text-xl">EMOBOSQUE</Link>
        </div>

        <nav className="hidden md:flex items-center gap-6">
          <Link to="/dashboard" className={`px-4 py-2 text-sm font-medium rounded-md ${location.pathname === "/dashboard" ? "bg-primary/10 text-primary" : ""}`}>Pacientes</Link>
          <Link to="/monitoring" className={`px-4 py-2 text-sm font-medium rounded-md ${location.pathname === "/monitoring" ? "bg-primary/10 text-primary" : ""}`}>Monitoreo en Tiempo Real</Link>
          <Link to="/configuration" className={`px-4 py-2 text-sm font-medium rounded-md ${location.pathname === "/configuration" ? "bg-primary/10 text-primary" : ""}`}>Configuración</Link>

          {isAdmin && (
            <Button variant="outline" size="sm" onClick={handleAddUser} className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" /> Agregar Usuario
            </Button>
          )}
        </nav>

        <div className="flex items-center gap-4">
          {userName && (
            <div className="hidden md:flex flex-col text-right text-sm">
              <span className="font-semibold">{userName}</span>
              <span className="text-muted-foreground capitalize">{userRole}</span>
            </div>
          )}
          <Button variant="ghost" size="icon" onClick={handleLogout}>
            <LogOut className="h-5 w-5" />
            <span className="sr-only">Cerrar sesión</span>
          </Button>
        </div>
      </div>
    </header>
  )
}
