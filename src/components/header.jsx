// src/components/header.jsx
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import {
  LogOut,
  Menu,
  UserPlus,
  Trees,
  Users,
  ActivitySquare,
  Settings2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userName, setUserName] = useState("");
  const [userRole, setUserRole] = useState("");

  // Altura del header y espacio extra inferior
  const HEADER_H = 72;     // px
  const SPACER_EXTRA = 16; // px

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) return;
      const ref = doc(db, "users", user.uid);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data();
        setIsAdmin(data.role === "admin");
        setUserName(data.name || "");
        setUserRole(data.role || "");
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.error(e);
    } finally {
      navigate("/");
    }
  };

  const handleAddUser = () => navigate("/add-user");

  const isActive = (path) =>
    location.pathname === path || location.pathname.startsWith(path + "/");

  const navClasses = (active) =>
    [
      "inline-flex items-center gap-2 px-3 py-2 rounded-2xl text-sm font-medium transition",
      active
        ? "bg-white/15 text-white ring-1 ring-emerald-300/40"
        : "text-white/80 hover:text-white hover:bg-white/10",
    ].join(" ");

  const navItems = useMemo(
    () => [
      { to: "/dashboard", label: "Pacientes", icon: Users },
      { to: "/monitoring", label: "Monitoreo en Tiempo Real", icon: ActivitySquare },
      { to: "/configuration", label: "Sesiones", icon: Settings2 },
    ],
    []
  );

  return (
    <>
      {/* Header fijo */}
      <header
        className="fixed top-0 left-0 right-0 z-50"
        style={{ ["--header-h"]: `${HEADER_H}px` }}
      >
        <div
          className="border-b border-white/10 bg-gradient-to-b from-black/60 to-black/30 backdrop-blur-md"
          style={{ height: "var(--header-h)" }}
        >
          <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-4 text-white">
            {/* Izquierda: menú móvil + marca */}
            <div className="flex items-center gap-2">
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
                  {/* Brand */}
                  <div className="flex items-center gap-2 px-1 pt-2 pb-4">
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-400/20 ring-1 ring-emerald-300/40">
                      <Trees className="h-5 w-5 text-emerald-300" />
                    </span>
                    <span className="text-lg font-semibold tracking-wide">
                      EMOBOSQUE
                    </span>
                  </div>

                  {/* Usuario (móvil) */}
                  {userName && (
                    <div className="px-1 pb-3 text-sm">
                      <div className="font-semibold">{userName}</div>
                      <div className="text-white/70 capitalize">{userRole}</div>
                    </div>
                  )}

                  {/* Nav móvil */}
                  <nav className="flex flex-col gap-2 pt-1">
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

                    {/* Botón oscuro con letras claras (móvil) */}
                    {isAdmin && (
                      <Button
                        size="sm"
                        onClick={() => {
                          setOpen(false);
                          handleAddUser();
                        }}
                        className="mt-2 justify-start gap-2 rounded-2xl bg-slate-900/80 text-white border border-white/15 hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/40"
                      >
                        <UserPlus className="h-4 w-4" />
                        Agregar Usuario
                      </Button>
                    )}
                  </nav>

                  {/* Logout móvil */}
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

            {/* Nav desktop */}
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

              {/* Botón oscuro con letras claras (desktop) */}
              {isAdmin && (
                <Button
                  size="sm"
                  onClick={handleAddUser}
                  className="ml-2 flex items-center gap-2 rounded-2xl bg-slate-900/80 text-white border border-white/15 hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/40"
                  title="Agregar usuario"
                >
                  <UserPlus className="h-4 w-4" />
                  <span className="hidden xl:inline">Agregar Usuario</span>
                </Button>
              )}
            </nav>

            {/* Usuario + Logout */}
            <div className="flex items-center gap-3">
              {userName && (
                <div className="hidden md:flex flex-col text-right text-sm leading-tight">
                  <span className="font-semibold">{userName}</span>
                  <span className="text-white/70 capitalize">{userRole}</span>
                </div>
              )}
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

      {/* Spacer inferior que empuja el contenido bajo el header */}
      <div aria-hidden="true" style={{ height: `${HEADER_H + SPACER_EXTRA}px` }} />
    </>
  );
}
