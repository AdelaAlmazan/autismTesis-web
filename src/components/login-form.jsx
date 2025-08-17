"use client";

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";

import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { LockKeyhole, User } from "lucide-react";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/dashboard");
    } catch (error) {
      alert("Error al iniciar sesión: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-center"
      style={{
        backgroundImage:
          "linear-gradient(to bottom, rgba(0,0,0,.25), rgba(0,0,0,.35)), url(/images/forest-bg.png)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <h1 className="text-center text-5xl sm:text-6xl md:text-7xl font-extrabold text-white drop-shadow-[0_6px_18px_rgba(0,0,0,0.45)] mb-6">
        ¡Bienvenido!
      </h1>

      <div className="w-full max-w-xl rounded-2xl border border-white/10 bg-black/40 backdrop-blur-md shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
        <div className="p-6 sm:p-8">
          <p className="text-lg sm:text-xl text-white/90 font-medium mb-6">
            Ingresa los datos del usuario:
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Label htmlFor="email" className="text-white/90 font-semibold tracking-wide">
                Correo electrónico
              </Label>
              <div className="relative mt-2">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white/50" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Jess52.25@gmail.com"
                  className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:bg-white/15 focus:border-white/40"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="password" className="text-white/90 font-semibold tracking-wide">
                Contraseña
              </Label>
              <div className="relative mt-2">
                <LockKeyhole className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white/50" />
                <Input
                  id="password"
                  type="password"
                  className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:bg-white/15 focus:border-white/40"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <button
                type="button"
                onClick={() => navigate("/reset-password")}
                className="mt-2 text-sm font-semibold text-white/80 hover:text-white underline underline-offset-4"
              >
                Cambiar contraseña
              </button>
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-lg font-extrabold rounded-xl bg-lime-600 hover:bg-lime-700 active:bg-lime-800 shadow-[0_8px_20px_rgba(132,204,22,0.35)]"
              disabled={isLoading}
            >
              {isLoading ? "Iniciando..." : "Comenzar"}
            </Button>
          </form>
        </div>
      </div>

      <p className="mt-6 text-center text-white/80">
        Sistema de Gestión de Terapia para Conciencia Emocional
      </p>
    </div>
  );
}
