import { useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { authApi } from '@/api/services';
import { Logo } from '@/components/Logo';
import { Button, Input, Modal } from '@/components/ui';
import { env } from '@/config/env';
import { userFromToken } from '@/lib/jwt';
import { homeForRole, useAuthStore } from '@/store/auth.store';
import { toast } from '@/store/toast.store';

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-brand via-brand-700 to-night p-4">
      <div className="pointer-events-none absolute -left-24 -top-24 h-96 w-96 rounded-full bg-mint/40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-16 h-[28rem] w-[28rem] rounded-full bg-auction/40 blur-3xl" />
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 w-full max-w-md">
        <div className="mb-6 flex justify-center"><Logo light className="text-4xl" /></div>
        {children}
      </motion.div>
    </div>
  );
}

export default function Login() {
  const nav = useNavigate();
  const loc = useLocation();
  const { token, user, setSession } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [forgot, setForgot] = useState(false);
  const [fEmail, setFEmail] = useState('');

  const login = useMutation({
    mutationFn: () => authApi.login(email.trim(), password),
    onSuccess: (res) => {
      const u = res.user ?? userFromToken(res.token);
      if (!u) return toast.error('Respuesta de login inválida', 'No se pudo leer el usuario del token.');
      setSession(res.token, u);
      const from = (loc.state as { from?: string } | null)?.from;
      nav(from && from !== '/login' ? from : homeForRole(u.role), { replace: true });
    },
    onError: (e: Error) => toast.error('No se pudo iniciar sesión', e.message),
  });
  const reset = useMutation({
    mutationFn: () => authApi.forgotPassword(fEmail.trim()),
    onSuccess: () => { toast.success('Revisa tu correo', 'Si existe una cuenta, enviamos instrucciones.'); setForgot(false); },
    onError: (e: Error) => toast.error('No se pudo enviar', e.message),
  });

  if (token && user) return <Navigate to={homeForRole(user.role)} replace />;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const er: typeof errors = {};
    if (!/^\S+@\S+\.\S+$/.test(email) && email.length < 3) er.email = 'Ingresa tu correo o usuario';
    if (password.length < 4) er.password = 'Ingresa tu contraseña';
    setErrors(er);
    if (!Object.keys(er).length) login.mutate();
  };

  return (
    <AuthShell>
      <form onSubmit={submit} className="glass space-y-4 rounded-3xl p-8 text-white" noValidate>
        <div>
          <h1 className="text-h1">Bienvenido</h1>
          <p className="text-sm text-white/80">Ingresa para pujar en tiempo real.</p>
        </div>
        <Input glass label="Correo o usuario" name="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} />
        <Input glass label="Contraseña" name="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} error={errors.password} />
        <div className="text-right text-sm"><button type="button" onClick={() => setForgot(true)} className="text-white/90 underline underline-offset-2 hover:text-white">¿Olvidaste tu contraseña?</button></div>
        <Button type="submit" variant="accent" size="lg" full loading={login.isPending}>Iniciar sesión</Button>
        <p className="text-center text-sm text-white/80">¿Aún no tienes cuenta? <Link to="/register" className="font-semibold text-white underline">Regístrate</Link></p>
        {env.USE_MOCKS && <p className="rounded-lg bg-black/20 p-2 text-center text-xs text-white/80">Modo demo: cualquier correo y contraseña. Si el correo contiene “vendedor” entras como Vendedor.</p>}
      </form>

      <Modal open={forgot} onClose={() => setForgot(false)} title="Recuperar contraseña">
        <form onSubmit={(e) => { e.preventDefault(); if (fEmail) reset.mutate(); }} className="space-y-4">
          <Input label="Correo registrado" type="email" value={fEmail} onChange={(e) => setFEmail(e.target.value)} autoFocus />
          <div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={() => setForgot(false)}>Cancelar</Button><Button type="submit" loading={reset.isPending} disabled={!fEmail}>Enviar enlace</Button></div>
        </form>
      </Modal>
    </AuthShell>
  );
}
