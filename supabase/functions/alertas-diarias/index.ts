// Edge Function «alertas-diarias» (Rioja Abierta)
// Envía con Brevo a cada usuario con alertas activas las licitaciones en plazo NUEVAS desde su último envío
// cuya idoneidad (función SQL public.idoneidad) supera su mínimo. Si no hay nada, no envía.
//
// Solo la invoca el cron (pg_cron + pg_net → public.alertas_lanzar), con la cabecera x-cron-secret = secreto
// «alertas_cron_secret» de Vault. verify_jwt = false porque la autenticación es ese secreto.
// Cuerpo JSON opcional:
//   dry_run (por defecto true)  · solo_hora_madrid (p. ej. 9: no hace nada si en Madrid es otra hora)
//   solo_email · desde_horas · forzar · max_envios
//   prueba_destino: envía el contenido del usuario `solo_email` SOLO a una dirección de la lista de pruebas,
//                   sin marcar el envío como hecho para ese usuario.
import { createClient } from 'npm:@supabase/supabase-js@2'

const WEB = 'https://rioja-abierta.vercel.app'
const REMITENTE = { email: 'carlost.agent@gmail.com', name: 'Rioja Abierta' }
const PRUEBAS = ['torrecam@gmail.com']
const MAX_ITEMS = 15
const TOPE = 250 // Brevo gratis: 300 emails/día

type Item = { id: string; puntuacion: number; objeto: string; organismo: string | null; presupuesto_base: number | null; fecha_fin_ofertas: string | null; tipo: string | null; motivos: string[] | null }
type Dest = { user_id: string; email: string; empresa: string | null; umbral: number; token_baja: string; ultima_alerta_at: string | null; total: number; items: Item[] }

const json = (d: unknown, status = 200) => new Response(JSON.stringify(d, null, 2), { status, headers: { 'Content-Type': 'application/json; charset=utf-8' } })
const esc = (s: unknown) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!))
const horaMadrid = (d = new Date()) => +new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Madrid', hour: '2-digit', hourCycle: 'h23' }).format(d)
const euros = (n: number | null) => n == null ? 'Importe sin indicar' : new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)
const fecha = (s: string) => new Intl.DateTimeFormat('es-ES', { timeZone: 'Europe/Madrid', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(s))
const dias = (s: string | null) => s ? Math.floor((Date.parse(s) - Date.now()) / 86400000) : null
const plazo = (s: string | null) => { const d = dias(s); if (d === null || !s) return 'Sin fecha de cierre'; return `Cierra el ${fecha(s)} h · ${d <= 0 ? 'hoy' : d === 1 ? 'mañana' : `quedan ${d} días`}` }
const color = (p: number) => p >= 70 ? '#5d8a3c' : p >= 45 ? '#d89b2b' : '#a8a29e'
const tono = (p: number) => p >= 70 ? 'Muy idónea' : p >= 45 ? 'Encaje parcial' : 'Poco encaje'
const suavizar = (s: string) => (s.replace(/[^A-Za-zÁÉÍÓÚÑ]/g, '').length > 12 && s === s.toUpperCase()) ? s.charAt(0) + s.slice(1).toLowerCase() : s
const baja = (t: string) => `${WEB}/baja?t=${t}`
const asunto = (n: number) => `${n} ${n === 1 ? 'licitación nueva encaja' : 'licitaciones nuevas encajan'} con tu empresa · Rioja Abierta`

export function emailHtml(d: Dest) {
  const items = d.items.slice(0, MAX_ITEMS)
  const tarjetas = items.map((x) => {
    const urgente = (dias(x.fecha_fin_ofertas) ?? 99) <= 7
    const motivos = (x.motivos ?? []).filter((m) => m && m.length > 3).slice(0, 2)
    return `<tr><td style="padding:0 0 12px">
  <a href="${WEB}/licitaciones/${x.id}" style="display:block;text-decoration:none;color:inherit;background:#ffffff;border:1px solid #ece7e2;border-radius:18px;padding:16px 18px">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr>
      <td style="vertical-align:top">
        <div style="font-size:12px;color:#78716c;font-weight:600">${esc(x.organismo ?? 'Organismo sin indicar')}</div>
        <div style="font-size:16px;line-height:1.35;font-weight:700;color:#1c1917;margin:3px 0 8px">${esc(suavizar(x.objeto))}</div>
        <div style="font-size:13px;color:#44403c"><b style="color:#1c1917">${esc(euros(x.presupuesto_base))}</b>${x.tipo ? ` &nbsp;·&nbsp; ${esc(x.tipo)}` : ''}</div>
        <div style="font-size:13px;color:${urgente ? '#772541' : '#57534e'};margin-top:3px;${urgente ? 'font-weight:700' : ''}">⏳ ${esc(plazo(x.fecha_fin_ofertas))}</div>
        ${motivos.length ? `<div style="font-size:12px;color:#385726;margin-top:6px">✓ ${motivos.map(esc).join(' · ')}</div>` : ''}
      </td>
      <td style="vertical-align:top;text-align:right;width:70px;padding-left:10px">
        <div style="display:inline-block;min-width:52px;border-radius:14px;background:${color(x.puntuacion)};color:#ffffff;text-align:center;padding:8px 6px">
          <div style="font-size:22px;font-weight:800;line-height:1">${x.puntuacion}</div>
          <div style="font-size:9px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;margin-top:3px">/ 100</div>
        </div>
      </td>
    </tr></table>
  </a></td></tr>`
  }).join('')
  const mas = d.total > items.length ? `<p style="margin:0 0 12px;font-size:13px;color:#78716c;text-align:center">…y ${d.total - items.length} más en tu panel.</p>` : ''
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>Rioja Abierta</title></head>
<body style="margin:0;padding:0;background:#f7f3ef;font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1c1917">
<div style="display:none;max-height:0;overflow:hidden">${d.total} ${d.total === 1 ? 'licitación nueva' : 'licitaciones nuevas'} con idoneidad ≥ ${d.umbral}</div>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f7f3ef"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:580px">
  <tr><td style="background:linear-gradient(135deg,#8f2f50,#521d31);background-color:#772541;border-radius:24px;padding:24px 24px 22px;color:#ffffff">
    <div style="font-size:14px;font-weight:800;letter-spacing:-.01em">🍇 Rioja<span style="color:#f7c6d4">Abierta</span></div>
    <div style="font-size:26px;line-height:1.15;font-weight:800;margin-top:10px">${d.total} ${d.total === 1 ? 'licitación nueva' : 'licitaciones nuevas'} para ti</div>
    <div style="font-size:14px;opacity:.9;margin-top:6px">${d.empresa ? `${esc(d.empresa)} · ` : ''}En plazo, ordenadas por idoneidad (mínimo ${d.umbral})</div>
  </td></tr>
  <tr><td style="height:16px"></td></tr>
  <tr><td><table role="presentation" width="100%" cellspacing="0" cellpadding="0">${tarjetas}</table>${mas}</td></tr>
  <tr><td align="center" style="padding:6px 0 22px">
    <a href="${WEB}/mi/sugeridas" style="display:inline-block;background:#772541;color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;border-radius:999px;padding:13px 26px">Ver todas mis sugeridas</a>
  </td></tr>
  <tr><td style="font-size:12px;line-height:1.6;color:#78716c;text-align:center;padding:0 12px">
    Recibes este email porque tienes cuenta en Rioja Abierta con las alertas activadas.<br>
    Cambia la idoneidad mínima o los sectores en <a href="${WEB}/mi/perfil" style="color:#772541">tu perfil</a> · <a href="${baja(d.token_baja)}" style="color:#772541">Darte de baja con un clic</a><br>
    Rioja Abierta · datos abiertos de contratación pública de La Rioja
  </td></tr>
</table></td></tr></table></body></html>`
}

function emailTexto(d: Dest) {
  const l = d.items.slice(0, MAX_ITEMS).map((x) => `- [${x.puntuacion}] ${suavizar(x.objeto)}\n  ${x.organismo ?? ''} · ${euros(x.presupuesto_base)} · ${plazo(x.fecha_fin_ofertas)}\n  ${WEB}/licitaciones/${x.id}`)
  return `${d.total} licitaciones nuevas para ti (idoneidad ≥ ${d.umbral})\n\n${l.join('\n\n')}\n\nTodas tus sugeridas: ${WEB}/mi/sugeridas\nTu perfil: ${WEB}/mi/perfil\nDarte de baja: ${baja(d.token_baja)}\n`
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'Usa POST' }, 405)
  const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } })

  const secreto = req.headers.get('x-cron-secret') ?? ''
  const { data: valido, error: eSec } = secreto ? await sb.rpc('alertas_secreto_valido', { s: secreto }) : { data: false, error: null }
  if (eSec) return json({ error: 'No se pudo validar el secreto' }, 500)
  if (!valido) return json({ error: 'No autorizado' }, 401)

  const c = (await req.json().catch(() => ({}))) as Record<string, any>
  const dry = c.dry_run !== false
  const ahora = new Date()
  const apiKey = Deno.env.get('BREVO_API_KEY')
  if (c.solo_hora_madrid != null && horaMadrid(ahora) !== +c.solo_hora_madrid) {
    return json({ omitido: true, motivo: `En Madrid son las ${horaMadrid(ahora)} h; solo se envía a las ${c.solo_hora_madrid} h`, brevo_configurado: !!apiKey })
  }
  if (!dry && !apiKey) return json({ error: 'Falta el secreto BREVO_API_KEY. No se ha enviado nada.', brevo_configurado: false }, 500)
  const prueba = c.prueba_destino ? String(c.prueba_destino).toLowerCase() : null
  if (prueba && (!PRUEBAS.includes(prueba) || !c.solo_email)) return json({ error: 'prueba_destino no permitido (requiere solo_email y una dirección de la lista de pruebas)' }, 400)
  const tope = Math.max(1, Math.min(TOPE, +c.max_envios || TOPE))

  const { data, error } = await sb.rpc('alertas_preparar', {
    p_solo_email: c.solo_email ?? null, p_desde_horas: c.desde_horas != null ? Math.max(1, Math.min(24 * 30, +c.desde_horas)) : null,
    p_max: MAX_ITEMS, p_forzar: !!c.forzar || !!prueba,
  })
  if (error) return json({ error: 'Error preparando las alertas', detalle: error.message }, 500)
  const dests = (data ?? []) as Dest[]

  const resumen = { dry_run: dry, prueba_destino: prueba, hora_madrid: horaMadrid(ahora), brevo_configurado: !!apiKey, con_novedades: dests.length, enviados: 0, fallidos: 0, tope, detalle: [] as unknown[] }
  for (const d of dests) {
    const linea = { email: prueba ? `${d.email} → ${prueba}` : d.email, asunto: asunto(d.total), total: d.total, licitaciones: d.items.map((x) => ({ id: x.id, idoneidad: x.puntuacion, objeto: x.objeto.slice(0, 80) })) }
    if (dry) { resumen.detalle.push({ ...linea, html_bytes: emailHtml(d).length }); continue }
    if (resumen.enviados >= tope) { resumen.detalle.push({ ...linea, omitido: 'tope diario alcanzado' }); continue }
    const destino = prueba ?? d.email
    const r = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'api-key': apiKey!, 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        sender: REMITENTE, to: [{ email: destino }], subject: asunto(d.total) + (prueba ? ' [prueba]' : ''),
        htmlContent: emailHtml(d), textContent: emailTexto(d),
        headers: { 'List-Unsubscribe': `<${WEB}/api/baja?t=${d.token_baja}>, <mailto:${REMITENTE.email}?subject=Baja%20alertas>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' },
        tags: ['alertas-diarias'],
      }),
    }).catch((e) => ({ ok: false, status: 0, text: async () => String(e) }) as unknown as Response)
    const cuerpo = await r.text()
    const ids = d.items.map((x) => x.id)
    if (r.ok) {
      const { error: eReg } = await sb.rpc('alertas_registrar', { p_user: d.user_id, p_ids: prueba ? [] : ids, p_estado: 'enviada', p_detalle: { brevo: cuerpo.slice(0, 200), prueba_destino: prueba, total: d.total }, p_marcar: !prueba })
      resumen.enviados++; resumen.detalle.push({ ...linea, enviado: true, brevo: cuerpo.slice(0, 200), error_registro: eReg?.message })
    } else {
      await sb.rpc('alertas_registrar', { p_user: d.user_id, p_ids: ids, p_estado: 'error', p_detalle: { status: r.status, error: cuerpo.slice(0, 300) }, p_marcar: false })
      resumen.fallidos++; resumen.detalle.push({ ...linea, enviado: false, brevo_status: r.status, error: cuerpo.slice(0, 300) })
    }
  }
  return json(resumen)
})
