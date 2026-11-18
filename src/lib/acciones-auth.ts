"use server";
import { redirect } from "next/navigation";
import { destinoSeguro, origen, supabaseServidor } from "./supabase";

export type EstadoForm = { error?: string; ok?: string; email?: string } | undefined;

function traducir(msg: string | undefined) {
  const m = (msg ?? "").toLowerCase();
  if (m.includes("invalid login")) return "Correo o contraseña incorrectos.";
  if (m.includes("not confirmed")) return "Aún no has confirmado tu correo. Revisa tu bandeja (y el spam) o pide otro enlace.";
  if (m.includes("already registered") || m.includes("already been registered")) return "Ya existe una cuenta con ese correo. Prueba a entrar o recupera la contraseña.";
  if (m.includes("rate limit") || m.includes("too many")) return "Se ha alcanzado el límite de correos por hora. Inténtalo de nuevo más tarde.";
  if (m.includes("password") && (m.includes("weak") || m.includes("least") || m.includes("short"))) return "La contraseña es demasiado débil: usa al menos 8 caracteres.";
  if (m.includes("same") && m.includes("password")) return "La nueva contraseña debe ser distinta de la anterior.";
  if (m.includes("signups not allowed")) return "El registro está desactivado temporalmente.";
  if (m.includes("email") && m.includes("invalid")) return "El correo no parece válido.";
  return "No se ha podido completar la operación. Inténtalo de nuevo.";
}

const correo = (f: FormData) => String(f.get("email") ?? "").trim().toLowerCase();

export async function entrar(_: EstadoForm, f: FormData): Promise<EstadoForm> {
  const email = correo(f);
  const password = String(f.get("password") ?? "");
  if (!email || !password) return { error: "Escribe tu correo y tu contraseña.", email };
  const sb = await supabaseServidor();
  const { error } = await sb.auth.signInWithPassword({ email, password });
  if (error) return { error: traducir(error.message), email };
  redirect(destinoSeguro(f.get("next")));
}

export async function enlaceMagico(_: EstadoForm, f: FormData): Promise<EstadoForm> {
  const email = correo(f);
  if (!email) return { error: "Escribe tu correo.", email };
  const sb = await supabaseServidor();
  const next = destinoSeguro(f.get("next"));
  const { error } = await sb.auth.signInWithOtp({ email, options: { shouldCreateUser: false, emailRedirectTo: `${await origen()}/auth/callback?next=${encodeURIComponent(next)}` } });
  if (error && !error.message.toLowerCase().includes("signups not allowed")) return { error: traducir(error.message), email };
  return { ok: "Si hay una cuenta con ese correo, te hemos enviado un enlace para entrar sin contraseña.", email };
}

export async function registrar(_: EstadoForm, f: FormData): Promise<EstadoForm> {
  const email = correo(f);
  const password = String(f.get("password") ?? "");
  const repetir = String(f.get("repetir") ?? "");
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { error: "El correo no parece válido.", email };
  if (password.length < 8) return { error: "La contraseña debe tener al menos 8 caracteres.", email };
  if (password !== repetir) return { error: "Las contraseñas no coinciden.", email };
  if (!f.get("acepto")) return { error: "Debes aceptar la política de privacidad.", email };
  const sb = await supabaseServidor();
  const { data, error } = await sb.auth.signUp({ email, password, options: { emailRedirectTo: `${await origen()}/auth/callback?next=/mi/bienvenida` } });
  if (error) return { error: traducir(error.message), email };
  if (data.session) redirect("/mi/bienvenida");
  return { ok: "¡Casi está! Te hemos enviado un correo para confirmar la cuenta. Abre el enlace y configura tu perfil.", email };
}

export async function recuperar(_: EstadoForm, f: FormData): Promise<EstadoForm> {
  const email = correo(f);
  if (!email) return { error: "Escribe tu correo.", email };
  const sb = await supabaseServidor();
  const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: `${await origen()}/auth/callback?next=/mi/clave` });
  if (error) return { error: traducir(error.message), email };
  return { ok: "Si el correo está registrado, recibirás un enlace para crear una contraseña nueva.", email };
}

export async function cambiarClave(_: EstadoForm, f: FormData): Promise<EstadoForm> {
  const password = String(f.get("password") ?? "");
  if (password.length < 8) return { error: "La contraseña debe tener al menos 8 caracteres." };
  if (password !== String(f.get("repetir") ?? "")) return { error: "Las contraseñas no coinciden." };
  const sb = await supabaseServidor();
  const { error } = await sb.auth.updateUser({ password });
  if (error) return { error: traducir(error.message) };
  return { ok: "Contraseña actualizada." };
}

export async function salir() {
  const sb = await supabaseServidor();
  await sb.auth.signOut();
  redirect("/");
}
