"use client";
import Link from "next/link";
import { forceCenter, forceCollide, forceLink, forceManyBody, forceSimulation, type SimulationNodeDatum } from "d3-force";
import { useMemo, useRef, useState } from "react";

type Arista = { organismo_id: string; organismo: string; empresa_id: string; empresa: string; nif: string | null; contratos: number; importe: number };
type Nodo = SimulationNodeDatum & { id: string; nombre: string; tipo: "org" | "emp"; total: number; nif?: string | null; x: number; y: number };

function radioCon(n: { tipo: "org" | "emp"; total: number }, max: number) {
  const base = n.tipo === "org" ? 7 : 3;
  return base + Math.sqrt(n.total / (max || 1)) * (n.tipo === "org" ? 22 : 12);
}

const fmt = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", notation: "compact", maximumFractionDigits: 1 });

export function Grafo({ aristas, destacada }: { aristas: Arista[]; destacada?: string }) {
  const W = 1100;
  const H = 720;
  const { nodos, enlaces } = useMemo(() => {
    const m = new Map<string, Nodo>();
    for (const a of aristas) {
      const o = m.get("o" + a.organismo_id) ?? { id: "o" + a.organismo_id, nombre: a.organismo, tipo: "org" as const, total: 0, x: 0, y: 0 };
      o.total += a.importe;
      m.set(o.id, o);
      const e = m.get("e" + a.empresa_id) ?? { id: "e" + a.empresa_id, nombre: a.empresa, tipo: "emp" as const, total: 0, nif: a.nif, x: 0, y: 0 };
      e.total += a.importe;
      m.set(e.id, e);
    }
    const nodos = [...m.values()];
    const maxT = Math.max(1, ...nodos.map((n) => n.total));
    const enlaces = aristas.map((a) => ({ source: "o" + a.organismo_id, target: "e" + a.empresa_id, importe: a.importe, contratos: a.contratos }));
    const sim = forceSimulation(nodos)
      .force("link", forceLink<Nodo, (typeof enlaces)[number]>(enlaces as never).id((d) => d.id).distance(60).strength(0.4))
      .force("charge", forceManyBody().strength(-60))
      .force("center", forceCenter(W / 2, H / 2))
      .force("collide", forceCollide<Nodo>().radius((d) => radioCon(d, maxT) + 2))
      .stop();
    for (let i = 0; i < 320; i++) sim.tick();
    return { nodos, enlaces: enlaces as unknown as { source: Nodo; target: Nodo; importe: number; contratos: number }[] };
  }, [aristas]);

  const maxTotal = Math.max(1, ...nodos.map((n) => n.total));
  const radio = (n: Nodo) => radioCon(n, maxTotal);

  const [, setVersion] = useState(0);
  const [sel, setSel] = useState<string | null>(destacada ? "e" + destacada : null);
  const [vista, setVista] = useState({ k: 1, x: 0, y: 0 });
  const arrastre = useRef<{ nodo?: Nodo; px: number; py: number; moved: boolean } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const vecinos = useMemo(() => {
    if (!sel) return null;
    const s = new Set<string>([sel]);
    for (const l of enlaces) {
      if (l.source.id === sel) s.add(l.target.id);
      if (l.target.id === sel) s.add(l.source.id);
    }
    return s;
  }, [sel, enlaces]);

  const aCoords = (e: React.PointerEvent) => {
    const r = svgRef.current!.getBoundingClientRect();
    const sx = ((e.clientX - r.left) / r.width) * W;
    const sy = ((e.clientY - r.top) / r.height) * H;
    return { x: (sx - vista.x) / vista.k, y: (sy - vista.y) / vista.k, sx, sy };
  };

  const nodoSel = nodos.find((n) => n.id === sel);
  const conexiones = nodoSel
    ? enlaces.filter((l) => l.source.id === sel || l.target.id === sel).map((l) => ({ otro: l.source.id === sel ? l.target : l.source, importe: l.importe, contratos: l.contratos })).sort((a, b) => b.importe - a.importe)
    : [];

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      <div className="card overflow-hidden">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          className="h-[560px] w-full cursor-grab touch-none bg-stone-50 active:cursor-grabbing sm:h-[680px]"
          onWheel={(e) => {
            const r = svgRef.current!.getBoundingClientRect();
            const sx = ((e.clientX - r.left) / r.width) * W;
            const sy = ((e.clientY - r.top) / r.height) * H;
            const k = Math.min(6, Math.max(0.4, vista.k * (e.deltaY < 0 ? 1.15 : 1 / 1.15)));
            setVista({ k, x: sx - ((sx - vista.x) / vista.k) * k, y: sy - ((sy - vista.y) / vista.k) * k });
          }}
          onPointerDown={(e) => {
            const c = aCoords(e);
            (e.target as Element).setPointerCapture?.(e.pointerId);
            const id = (e.target as Element).getAttribute("data-id");
            arrastre.current = { nodo: nodos.find((n) => n.id === id), px: c.sx, py: c.sy, moved: false };
          }}
          onPointerMove={(e) => {
            const a = arrastre.current;
            if (!a) return;
            const c = aCoords(e);
            if (Math.abs(c.sx - a.px) + Math.abs(c.sy - a.py) > 3) a.moved = true;
            if (a.nodo) {
              a.nodo.x = c.x;
              a.nodo.y = c.y;
              setVersion((v) => v + 1);
            } else if (a.moved) {
              setVista((v) => ({ ...v, x: v.x + (c.sx - a.px), y: v.y + (c.sy - a.py) }));
              a.px = c.sx;
              a.py = c.sy;
            }
          }}
          onPointerUp={() => {
            const a = arrastre.current;
            if (a && !a.moved) setSel(a.nodo ? (a.nodo.id === sel ? null : a.nodo.id) : null);
            arrastre.current = null;
          }}
        >
          <g transform={`translate(${vista.x},${vista.y}) scale(${vista.k})`}>
            {enlaces.map((l, i) => {
              const on = !vecinos || (vecinos.has(l.source.id) && vecinos.has(l.target.id) && (l.source.id === sel || l.target.id === sel));
              return <line key={i} x1={l.source.x} y1={l.source.y} x2={l.target.x} y2={l.target.y} stroke={on && vecinos ? "#ab4466" : "#a8a29e"} strokeOpacity={on ? (vecinos ? 0.8 : 0.35) : 0.06} strokeWidth={vecinos && on ? 1.6 : 0.8} />;
            })}
            {nodos.map((n) => {
              const on = !vecinos || vecinos.has(n.id);
              const r = radio(n);
              return (
                <g key={n.id} opacity={on ? 1 : 0.15}>
                  <circle data-id={n.id} cx={n.x} cy={n.y} r={r} fill={n.tipo === "org" ? "#772541" : "#5d8a3c"} stroke="white" strokeWidth={1.5} className="cursor-pointer">
                    <title>{`${n.nombre} · ${fmt.format(n.total)}`}</title>
                  </circle>
                  {(n.tipo === "org" || (vecinos && on)) && (
                    <text x={n.x} y={n.y - r - 4} textAnchor="middle" className="pointer-events-none fill-stone-700 text-[10px]" style={{ paintOrder: "stroke", stroke: "white", strokeWidth: 3 }}>
                      {n.nombre.length > 34 ? n.nombre.slice(0, 32) + "…" : n.nombre}
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        </svg>
        <div className="flex gap-5 border-t border-stone-100 px-4 py-2 text-xs text-stone-500">
          <span className="flex items-center gap-1.5"><span className="inline-block h-3 w-3 rounded-full bg-vino-700" /> Organismo</span>
          <span className="flex items-center gap-1.5"><span className="inline-block h-3 w-3 rounded-full bg-vid-500" /> Empresa</span>
          <span>Tamaño proporcional al importe adjudicado</span>
        </div>
      </div>
      <aside className="card p-5 text-sm">
        {!nodoSel ? (
          <p className="text-stone-500">Haz clic en un nodo para ver sus conexiones.</p>
        ) : (
          <>
            <div className="text-xs font-medium tracking-wide text-stone-500 uppercase">{nodoSel.tipo === "org" ? "Organismo" : "Empresa"}</div>
            <h3 className="mt-1 font-semibold">{nodoSel.nombre}</h3>
            <p className="mt-1 text-stone-600">{fmt.format(nodoSel.total)} en {conexiones.length} relaciones</p>
            <Link className="mt-2 inline-block enlace" href={nodoSel.tipo === "org" ? `/organismos/${nodoSel.id.slice(1)}` : nodoSel.nif ? `/empresas/${encodeURIComponent(nodoSel.nif)}` : `/empresas/${nodoSel.id.slice(1)}`}>Abrir ficha →</Link>
            <ul className="mt-4 max-h-[480px] space-y-2 overflow-auto">
              {conexiones.map((c) => (
                <li key={c.otro.id} className="flex justify-between gap-2">
                  <button className="min-w-0 truncate text-left hover:text-vino-700" onClick={() => setSel(c.otro.id)} title={c.otro.nombre}>{c.otro.nombre}</button>
                  <span className="shrink-0 tabular-nums text-stone-600">{fmt.format(c.importe)}</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </aside>
    </div>
  );
}
