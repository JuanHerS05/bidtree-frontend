import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Check, ShoppingBag, Store } from 'lucide-react';
import clsx from 'clsx';
import { authApi } from '@/api/services';
import { Button, Input } from '@/components/ui';
import type { Role, UserDTO } from '@/lib/types';
import { toast } from '@/store/toast.store';
import { AuthShell } from './Login';

// Reducimos a 2 pasos
const STEPS = ['Perfil', 'Seguridad'];
type Form = Omit<UserDTO, 'documento' | 'telefono'> & { confirm: string };

function validate(step: number, f: Form): Partial<Record<keyof Form, string>> {
  const e: Partial<Record<keyof Form, string>> = {};
  if (step === 0) {
    if (f.name.trim().length < 3) e.name = 'Ingresa tu nombre completo';
    if (!/^\S+@\S+\.\S+$/.test(f.email)) e.email = 'Correo no válido';
  }
  if (step === 1) {
    if (f.password.length < 8 || !/[A-Za-z]/.test(f.password) || !/\d/.test(f.password)) e.password = 'Mínimo 8 caracteres con letras y números';
    if (f.confirm !== f.password) e.confirm = 'Las contraseñas no coinciden';
  }
  return e;
}

export default function Register() {
  const nav = useNavigate();
  const [step, setStep] = useState(0);
  
  // Estado inicial sin documento ni teléfono
  const [f, setF] = useState<Form>({ name: '', email: '', password: '', confirm: '', rol: 'BUYER' });
  const [errors, setErrors] = useState<Partial<Record<keyof Form, string>>>({});
  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement>) => setF((p) => ({ ...p, [k]: e.target.value }));

  const m = useMutation({
    mutationFn: () => { 
      const { confirm: _c, ...dto } = f; 
      // Enviamos el payload limpio
      return authApi.register({ ...dto, name: dto.name.trim(), email: dto.email.trim() }); 
    },
    onSuccess: () => { toast.success('¡Cuenta creada!', 'Ya puedes iniciar sesión.'); nav('/login'); },
    onError: (e: Error) => toast.error('No se pudo registrar', e.message),
  });

  const next = () => {
    const er = validate(step, f);
    setErrors(er);
    if (Object.keys(er).length) return;
    step < STEPS.length - 1 ? setStep(step + 1) : m.mutate();
  };

  return (
    <AuthShell>
      <form onSubmit={(e) => { e.preventDefault(); next(); }} className="glass space-y-5 rounded-3xl p-8 text-white" noValidate>
        <h1 className="text-h2">Crea tu cuenta</h1>
        <ol className="flex items-center gap-2" aria-label="Progreso">
          {STEPS.map((s, i) => (
            <li key={s} className="flex flex-1 items-center gap-2">
              <span className={clsx('flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold', i < step ? 'bg-mint text-white' : i === step ? 'bg-auction text-white' : 'bg-white/20 text-white/70')}>
                {i < step ? <Check className="h-4 w-4" /> : i + 1}
              </span>
              <span className={clsx('hidden text-xs sm:block', i === step ? 'font-semibold' : 'text-white/70')}>{s}</span>
              {i < STEPS.length - 1 && <span className="h-px flex-1 bg-white/25" />}
            </li>
          ))}
        </ol>

        {/* PASO 0: Nombre y Email */}
        {step === 0 && (<>
          <Input glass label="Nombre completo" value={f.name} onChange={set('name')} error={errors.name} autoFocus />
          <Input glass label="Correo electrónico" type="email" value={f.email} onChange={set('email')} error={errors.email} />
        </>)}
        
        {/* PASO 1: Contraseña y Rol */}
        {step === 1 && (<>
          <Input glass label="Contraseña" type="password" autoComplete="new-password" value={f.password} onChange={set('password')} error={errors.password} autoFocus />
          <Input glass label="Confirmar contraseña" type="password" autoComplete="new-password" value={f.confirm} onChange={set('confirm')} error={errors.confirm} />
          <fieldset>
            <legend className="mb-1 text-sm font-medium text-white/90">Quiero usar BidTree como</legend>
            <div className="grid grid-cols-2 gap-3">
              {([['BUYER', 'Comprador', ShoppingBag], ['SELLER', 'Vendedor', Store]] as [Role, string, typeof Store][]).map(([r, label, Icon]) => (
                <button type="button" key={r} onClick={() => setF((p) => ({ ...p, rol: r }))} aria-pressed={f.rol === r}
                  className={clsx('flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-sm font-semibold transition', f.rol === r ? 'border-auction bg-auction/30' : 'border-white/30 bg-white/5 hover:bg-white/15')}>
                  <Icon className="h-4 w-4" />{label}
                </button>
              ))}
            </div>
          </fieldset>
        </>)}

        <div className="flex justify-between gap-3 pt-1">
          <Button type="button" variant="ghost" className="text-white hover:bg-white/10" disabled={step === 0} onClick={() => setStep(step - 1)}>Atrás</Button>
          <Button type="submit" variant="accent" loading={m.isPending}>{step === STEPS.length - 1 ? 'Crear cuenta' : 'Continuar'}</Button>
        </div>
        <p className="text-center text-sm text-white/80">¿Ya tienes cuenta? <Link to="/login" className="font-semibold text-white underline">Inicia sesión</Link></p>
      </form>
    </AuthShell>
  );
}