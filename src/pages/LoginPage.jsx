import LoginForm from "../components/login-form"

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-b from-blue-50 to-white">
      <div className="w-full max-w-md">
        <LoginForm />
      </div>
    </main>
  )
}

