"use client"

import { Link, useLocation, useNavigate } from "react-router-dom"
import { Button } from "./ui/button"
import { LogOut, Menu } from "lucide-react"
import { useState } from "react"
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet"

export default function DashboardHeader() {
  const location = useLocation()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  const handleLogout = () => {
    // In a real app, you would handle logout logic here
    navigate("/")
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
                <Link
                  to="/dashboard"
                  className={`px-4 py-2 text-sm font-medium rounded-md ${
                    location.pathname === "/dashboard" ? "bg-primary/10 text-primary" : ""
                  }`}
                  onClick={() => setOpen(false)}
                >
                  Pacientes
                </Link>
                <Link
                  to="/monitoring"
                  className={`px-4 py-2 text-sm font-medium rounded-md ${
                    location.pathname === "/monitoring" ? "bg-primary/10 text-primary" : ""
                  }`}
                  onClick={() => setOpen(false)}
                >
                  Monitoreo en Tiempo Real
                </Link>
                <Link
                  to="/configuration"
                  className={`px-4 py-2 text-sm font-medium rounded-md ${
                    location.pathname === "/configuration" ? "bg-primary/10 text-primary" : ""
                  }`}
                  onClick={() => setOpen(false)}
                >
                  Configuración
                </Link>
              </nav>
            </SheetContent>
          </Sheet>
          <Link to="/dashboard" className="font-bold text-xl">
            EMOBOSQUE
          </Link>
        </div>
        <nav className="hidden md:flex items-center gap-6">
          <Link
            to="/dashboard"
            className={`px-4 py-2 text-sm font-medium rounded-md ${
              location.pathname === "/dashboard" ? "bg-primary/10 text-primary" : ""
            }`}
          >
            Pacientes
          </Link>
          <Link
            to="/monitoring"
            className={`px-4 py-2 text-sm font-medium rounded-md ${
              location.pathname === "/monitoring" ? "bg-primary/10 text-primary" : ""
            }`}
          >
            Monitoreo en Tiempo Real
          </Link>
          <Link
            to="/configuration"
            className={`px-4 py-2 text-sm font-medium rounded-md ${
              location.pathname === "/configuration" ? "bg-primary/10 text-primary" : ""
            }`}
          >
            Configuración
          </Link>
        </nav>
        <Button variant="ghost" size="icon" onClick={handleLogout}>
          <LogOut className="h-5 w-5" />
          <span className="sr-only">Cerrar sesión</span>
        </Button>
      </div>
    </header>
  )
}

