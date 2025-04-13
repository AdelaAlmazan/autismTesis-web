import { useState } from "react";
import { auth, db } from "../firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await setDoc(doc(db, "users", user.uid), {
        email: user.email,
        role: "therapist",
        createdAt: new Date().toISOString()
      });

      alert("✅ Cuenta creada correctamente");
    } catch (error) {
      alert("❌ Error: " + error.message);
    }
  };

  return (
    <form onSubmit={handleRegister}>
      <input type="email" placeholder="Correo" value={email} onChange={(e) => setEmail(e.target.value)} required />
      <input type="password" placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} required />
      <button type="submit">Registrar</button>
    </form>
  );
}

export default Register;
