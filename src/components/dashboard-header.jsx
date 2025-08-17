"use client";

import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useMemo } from "react";
import { Button } from "./ui/button";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import {
  Menu,
  LogOut,
  Trees,
  Users,
  ActivitySquare,
  Settings2,
} from "lucide-react";

export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    // Aquí iría tu lógica real de logout; por ahora solo navegamos
    navigate("/");
  };

  // Marca activo también para rutas hijas (/patients/:id/edit)
  const isActive = (path) =>
    location.pathname === path || location.pathname.startsWith(path + "/");

  // Estilos base/activos para ítems de navegación
  const navClasses = (active) =>
    [
      "inline-flex items-center gap-2 px-3 py-2 rounded-2xl text-sm font-medium transition",
      active
        ? "bg-white/15 text-white ring-1 ring-emerald-300/40"
        : "text-white/80 hover:text-white hover:bg-white/10",
    ].join(" ");

  const navItems = useMemo(
    () => [
      {
        to: "/dashboard",
        label: "Pacientes",
        icon: Users,
      },
      {
        to: "/monitoring",
        label: "Monitoreo en Tiempo Real",
        icon: ActivitySquare,
      },
      {
        to: "/configuration",
        label: "Sesiones",
        icon: Settings2,
      },
    ],
    []
  );

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      {/* Capa glassy */}
      <div className="h-16 border-b border-white/10 bg-gradient-to-b from-black/60 to-black/30 backdrop-blur-md">
        <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-4 text-white">
          {/* Izquierda: menú móvil + marca */}
          <div className="flex items-center gap-2">
            {/* Mobile menu */}
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden text-white hover:bg-white/10"
                  aria-label="Abrir menú"
                >
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>

              <SheetContent
                side="left"
                className="w-72 bg-slate-900/95 text-white border-white/10"
              >
                <div className="flex items-center gap-2 px-1 pt-2 pb-4">
                  <Trees className="h-6 w-6 text-emerald-300" />
                  <span className="text-lg font-semibold tracking-wide">
                    EMOBOSQUE
                  </span>
                </div>

                <nav className="flex flex-col gap-2 pt-2">
                  {navItems.map(({ to, label, icon: Icon }) => {
                    const active = isActive(to);
                    return (
                      <Link
                        key={to}
                        to={to}
                        className={navClasses(active)}
                        aria-current={active ? "page" : undefined}
                        onClick={() => setOpen(false)}
                      >
                        <Icon className="h-5 w-5" />
                        <span>{label}</span>
                      </Link>
                    );
                  })}
                </nav>

                <div className="mt-6 border-t border-white/10 pt-4">
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-white hover:bg-white/10"
                    onClick={() => {
                      setOpen(false);
                      handleLogout();
                    }}
                  >
                    <LogOut className="mr-2 h-5 w-5" />
                    Cerrar sesión
                  </Button>
                </div>
              </SheetContent>
            </Sheet>

            {/* Marca / logo */}
            <Link to="/dashboard" className="group flex items-center gap-2">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-400/20 ring-1 ring-emerald-300/40">
                <Trees className="h-5 w-5 text-emerald-300" />
              </span>
              <span className="hidden sm:inline-block bg-gradient-to-r from-emerald-300 to-lime-200 bg-clip-text text-lg font-semibold tracking-wide text-transparent">
                EMOBOSQUE
              </span>
            </Link>
          </div>

          {/* Centro/Derecha: navegación desktop */}
          <nav className="hidden md:flex items-center gap-2">
            {navItems.map(({ to, label, icon: Icon }) => {
              const active = isActive(to);
              return (
                <Link
                  key={to}
                  to={to}
                  className={navClasses(active)}
                  aria-current={active ? "page" : undefined}
                >
                  <Icon className="h-4 w-4" />
                  <span>{label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Acciones */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="text-white hover:bg-white/10"
              aria-label="Cerrar sesión"
              title="Cerrar sesión"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
