"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { LogOut, Menu } from "lucide-react"
import { useState } from "react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

export default function DashboardHeader() {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)

  const handleLogout = () => {
    // In a real app, you would handle logout logic here
    router.push("/")
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
                  href="/dashboard"
                  className={`px-4 py-2 text-sm font-medium rounded-md ${
                    pathname === "/dashboard" ? "bg-primary/10 text-primary" : ""
                  }`}
                  onClick={() => setOpen(false)}
                >
                  Pacientes
                </Link>
                <Link
                  href="/dashboard/monitoring"
                  className={`px-4 py-2 text-sm font-medium rounded-md ${
                    pathname === "/dashboard/monitoring" ? "bg-primary/10 text-primary" : ""
                  }`}
                  onClick={() => setOpen(false)}
                >
                  Monitoreo en Tiempo Real
                </Link>
                <Link
                  href="/dashboard/configuration"
                  className={`px-4 py-2 text-sm font-medium rounded-md ${
                    pathname === "/dashboard/configuration" ? "bg-primary/10 text-primary" : ""
                  }`}
                  onClick={() => setOpen(false)}
                >
                  Configuración
                </Link>
              </nav>
            </SheetContent>
          </Sheet>
          <Link href="/dashboard" className="font-bold text-xl">
            EMOBOSQUE
          </Link>
        </div>
        <nav className="hidden md:flex items-center gap-6">
          <Link
            href="/dashboard"
            className={`px-4 py-2 text-sm font-medium rounded-md ${
              pathname === "/dashboard" ? "bg-primary/10 text-primary" : ""
            }`}
          >
            Pacientes
          </Link>
          <Link
            href="/dashboard/monitoring"
            className={`px-4 py-2 text-sm font-medium rounded-md ${
              pathname === "/dashboard/monitoring" ? "bg-primary/10 text-primary" : ""
            }`}
          >
            Monitoreo en Tiempo Real
          </Link>
          <Link
            href="/dashboard/configuration"
            className={`px-4 py-2 text-sm font-medium rounded-md ${
              pathname === "/dashboard/configuration" ? "bg-primary/10 text-primary" : ""
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

