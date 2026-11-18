"use client";
import Link from "next/link";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { AlertCircle, CheckCircle2, KeyRound, Loader2, Mail, Wand2 } from "lucide-react";
import { cambiarClave, enlaceMagico, entrar, recuperar, registrar, type EstadoForm } from "@/lib/acciones-auth";

function Enviar({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn btn-primario w-full justify-center py-3 disabled:opacity-70">
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
      {children}
    </button>
  );
}

export function Aviso({ estado }: { estado: EstadoForm }) {
  if (!estado?.error && !estado?.ok) return null;
  const ok = !!estado.ok;
  return (
    <div role={ok ? "status" : "alert"} className={`flex items-start gap-2 rounded-xl px-3.5 py-3 text-sm ${ok ? "bg-vid-50 text-vid-700" : "bg-vino-50 text-vino-800"}`}>
      {ok ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> : <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />}
      <span>{estado.ok ?? estado.error}</span>
    </div>
  );
}

function Campo({ label, ...p }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      <input className="input mt-1.5 w-full" {...p} />
    </label>
  );
}

export function FormEntrar({ next, error }: { next: string; error?: string }) {
  const [modo, setModo] = useState<"clave" | "enlace">("clave");
  const [e1, a1] = useActionState(entrar, error === "enlace" ? { error: "El enlace no es válido o ha caducado. Vuelve a pedirlo." } : undefined);
  const [e2, a2] = useActionState(enlaceMagico, undefined);
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-1 rounded-xl bg-stone-100 p-1 text-sm font-medium" role="tablist">
        {([["clave", "Contraseña", KeyRound], ["enlace", "Enlace mágico", Wand2]] as const).map(([v, t, I]) => (
          <button key={v} type="button" role="tab" aria-selected={modo === v} onClick={() => setModo(v)}
            className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 transition ${modo === v ? "bg-surface text-vino-800 shadow-sm" : "text-stone-500 hover:text-stone-800"}`}>
            <I className="h-4 w-4" /> {t}
          </button>
        ))}
      </div>
      {modo === "clave" ? (
        <form action={a1} className="space-y-4">
          <input type="hidden" name="next" value={next} />
          <Campo label="Correo" name="email" type="email" autoComplete="email" required defaultValue={e1?.email} />
          <div>
            <Campo label="Contraseña" name="password" type="password" autoComplete="current-password" required />
            <Link href="/recuperar" className="mt-1.5 inline-block text-xs enlace">¿Has olvidado la contraseña?</Link>
          </div>
          <Aviso estado={e1} />
          <Enviar>Entrar</Enviar>
        </form>
      ) : (
        <form action={a2} className="space-y-4">
          <input type="hidden" name="next" value={next} />
          <Campo label="Correo" name="email" type="email" autoComplete="email" required defaultValue={e2?.email} />
          <p className="text-xs text-stone-500">Te enviamos un enlace de un solo uso para entrar sin contraseña.</p>
          <Aviso estado={e2} />
          <Enviar><Mail className="h-4 w-4" /> Enviarme el enlace</Enviar>
        </form>
      )}
    </div>
  );
}

export function FormRegistro() {
  const [e, a] = useActionState(registrar, undefined);
  if (e?.ok) return <Aviso estado={e} />;
  return (
    <form action={a} className="space-y-4">
      <Campo label="Correo de trabajo" name="email" type="email" autoComplete="email" required defaultValue={e?.email} />
      <Campo label="Contraseña" name="password" type="password" autoComplete="new-password" minLength={8} required placeholder="Mínimo 8 caracteres" />
      <Campo label="Repite la contraseña" name="repetir" type="password" autoComplete="new-password" minLength={8} required />
      <label className="flex items-start gap-2.5 text-sm text-stone-600">
        <input type="checkbox" name="acepto" required className="mt-0.5 h-4 w-4 accent-[var(--color-vino-600)]" />
        <span>Acepto la <Link href="/privacidad" className="enlace">política de privacidad</Link>. Solo guardamos tu correo y tu perfil de empresa.</span>
      </label>
      <Aviso estado={e} />
      <Enviar>Crear cuenta gratis</Enviar>
    </form>
  );
}

export function FormRecuperar() {
  const [e, a] = useActionState(recuperar, undefined);
  return (
    <form action={a} className="space-y-4">
      <Campo label="Correo" name="email" type="email" autoComplete="email" required defaultValue={e?.email} />
      <Aviso estado={e} />
      <Enviar>Enviar enlace de recuperación</Enviar>
    </form>
  );
}

export function FormClave() {
  const [e, a] = useActionState(cambiarClave, undefined);
  return (
    <form action={a} className="space-y-4">
      <Campo label="Nueva contraseña" name="password" type="password" autoComplete="new-password" minLength={8} required />
      <Campo label="Repite la contraseña" name="repetir" type="password" autoComplete="new-password" minLength={8} required />
      <Aviso estado={e} />
      <Enviar>Guardar contraseña</Enviar>
      {e?.ok && <Link href="/mi" className="btn btn-secundario w-full justify-center">Ir a mi panel</Link>}
    </form>
  );
}
