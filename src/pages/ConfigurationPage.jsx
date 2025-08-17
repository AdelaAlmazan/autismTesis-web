import Header from "../components/header"
import SessionManagement from "../components/session-configuration"

export default function ConfigurationPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 p-0">
        {/* Fondo bosque + overlay */}
        <div
          className="relative min-h-[calc(100vh-64px)]"
          style={{
            backgroundImage:
              "url('./images/forest-bg.png'), radial-gradient(1200px 600px at 50% 10%, rgba(16,185,129,.15), rgba(0,0,0,.85))",
            backgroundSize: "cover, auto",
            backgroundPosition: "center, center",
          }}
        >
          <div className="absolute inset-0 bg-black/45" />

          <div className="relative z-10 max-w-7xl mx-auto px-6 py-8">
            {/* Marco negro */}
            <div className="rounded-[28px] bg-black/70 shadow-[0_20px_60px_rgba(0,0,0,.6)] p-3 md:p-6">
              {/* Panel glassy interno */}
              <div className="rounded-[22px] bg-slate-800/70 backdrop-blur-md border border-white/10 p-6 md:p-8">
                <div className="mb-6">
                  <h1 className="text-3xl md:text-4xl font-light tracking-wide text-white/95">
                    Configuración de Sesión
                  </h1>
                </div>

                <SessionManagement />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
