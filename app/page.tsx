'use client';

import { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [formData, setFormData] = useState({
    nombreGuarderia: '',
    cif: '',
    direccion: '',
    cp: '',
    emailContacto: '',
    telefono: '',
    password: '',
  });
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState('');

  const router = useRouter();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    setMensaje('');

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: formData.emailContacto,
      password: formData.password,
    });

    if (authError || !authData.user) {
      setMensaje(`❌ Error de autenticación: ${authError?.message}`);
      setCargando(false);
      return;
    }

    const userId = authData.user.id;

    const response = await fetch('/api/guarderias', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre: formData.nombreGuarderia,
        nif: formData.cif,
        direccion: formData.direccion,
        cp: formData.cp,
        email: formData.emailContacto,
        telefono: formData.telefono,
        userId,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      setMensaje(`❌ Error al guardar: ${result.error}`);
      setCargando(false);
      return;
    }

    setMensaje('✅ Cuenta creada. Redirigiendo al login...');
    setTimeout(() => {
      router.push('/login');
    }, 1500);

    setCargando(false);
  };

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-lg">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          Registro de Guardería
        </h1>
        <p className="text-gray-500 mb-6 text-sm">
          Rellena tus datos fiscales para activar tu cuenta
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la guardería</label>
            <input type="text" name="nombreGuarderia" value={formData.nombreGuarderia} onChange={handleChange} required placeholder="Ej: Guardería Los Pitufos S.L." className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-black" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">CIF / NIF</label>
            <input type="text" name="cif" value={formData.cif} onChange={handleChange} required placeholder="Ej: B12345678" maxLength={9} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-black" />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Dirección fiscal</label>
              <input type="text" name="direccion" value={formData.direccion} onChange={handleChange} required placeholder="Calle, número, ciudad" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-black" />
            </div>
            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">C.P.</label>
              <input type="text" name="cp" value={formData.cp} onChange={handleChange} required placeholder="41001" maxLength={5} minLength={5} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-black" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email (será tu usuario de acceso)</label>
            <input type="email" name="emailContacto" value={formData.emailContacto} onChange={handleChange} required placeholder="info@miguarderia.com" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-black" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
            <input type="tel" name="telefono" value={formData.telefono} onChange={handleChange} required placeholder="600 000 000" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-black" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
            <input type="password" name="password" value={formData.password} onChange={handleChange} required placeholder="Mínimo 6 caracteres" minLength={6} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-black" />
          </div>

          {mensaje && (
            <p className={`text-sm font-medium ${mensaje.startsWith('✅') ? 'text-green-600' : 'text-red-600'}`}>
              {mensaje}
            </p>
          )}

          <button type="submit" disabled={cargando} className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold py-2 px-4 rounded-lg transition-colors mt-2">
            {cargando ? 'Creando cuenta...' : 'Crear cuenta'}
          </button>
        </form>
      </div>
    </main>
  );
}