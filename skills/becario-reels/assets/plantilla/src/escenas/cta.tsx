// Escena "cta": la llamada a la acción final.
//  - modo "palabra" (por defecto): "Comenta PALABRA" con la palabra escribiéndose letra a letra, un texto a mano
//    debajo, un sobre que sale volando hacia los mensajes, confeti e iconos que saltan por turnos.
//  - modo "perfil": tarjeta de perfil en la que se pulsa «Seguir» y luego «Mensaje», y sale el mensaje privado
//    con la palabra (para el final de TikTok: «sígueme y escríbeme PALABRA por privado»).
// Las dos siguen moviéndose hasta el final para que la pantalla no se quede quieta.
import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, spring, staticFile, useCurrentFrame } from "remotion";
import { BORDE, C, SOMBRA, SUAVE } from "../motor/actual";
import { pesoTexto } from "../motor/fuentes";
import { FPS } from "../motor/constantes";
import { F, alfa } from "../motor/estilos";
import { bump, lerp, useFlota, usePop } from "../motor/anim";
import { Confeti, Icono, Onda } from "../piezas/basicas";
import { TX } from "../motor/textos";
import type { DefEscena, PropsEscena } from "../tipos";
import { arr, iconos, reglas, txt } from "./util";

const Cta: React.FC<PropsEscena> = (props) => (txt(props.p, "modo") === "perfil" ? <Perfil {...props} /> : <Palabra {...props} />);

const Palabra: React.FC<PropsEscena> = ({ p, b }) => {
  const f = useCurrentFrame();
  const [bPalabra, bTexto, bIconos] = b;
  const palabra = txt(p, "palabra", "INFO").toUpperCase();
  const verbo = txt(p, "verbo", TX.comenta);
  const lineas = txt(p, "texto")
    .split("/")
    .map((l) => l.trim())
    .filter(Boolean);
  const icos = (arr<string>(p, "iconos").length ? arr<string>(p, "iconos") : ["message-circle", "send", "gift", "list-checks", "check"]).slice(0, 5);
  const caja = spring({ frame: f, fps: FPS, config: { damping: 13, stiffness: 150, mass: 0.7 } });
  const fl = useFlota(0.9, 5, 16);
  const tam = palabra.length <= 6 ? 92 : palabra.length <= 9 ? 74 : 58;
  const ciclo = (f - bPalabra - 14) % 22;
  const barrido = f > bPalabra + 14 && ciclo < 12 ? ciclo / 12 : -1;
  const sobre = lerp(f, bTexto - 8, bTexto + 8, 0, 1, Easing.inOut(Easing.cubic));
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: 120, top: 300 + (1 - caja) * 180 + fl, width: 840, height: 340, borderRadius: 44, background: C.tarjeta, boxShadow: SOMBRA, border: BORDE, opacity: Math.min(1, caja * 1.6), transform: `scale(${0.9 + 0.1 * caja})` }}>
        <div style={{ position: "absolute", top: 40, left: 0, right: 0, textAlign: "center", fontFamily: F.titulo, fontSize: 76, color: C.tarjetaTexto, letterSpacing: -1.5 }}>{verbo}</div>
        <div
          style={{
            position: "absolute",
            left: 70,
            right: 70,
            top: 156,
            height: 136,
            borderRadius: 68,
            background: C.acento,
            boxShadow: SUAVE ? `0 16px 34px ${alfa(C.acento, 0.35)}` : `6px 7px 0 ${C.borde}`,
            border: SUAVE ? undefined : `4px solid ${C.borde}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 4,
            overflow: "hidden",
            transform: `rotate(-2deg) scale(${1 + 0.06 * bump(f, bPalabra + 10, 10)})`,
          }}
        >
          <span style={{ fontFamily: F.mano, fontWeight: 700, fontSize: tam, color: C.acentoTexto, marginRight: 10 }}>«</span>
          {palabra.split("").map((l, k) => {
            const q = spring({ frame: f - bPalabra - k * 2, fps: FPS, config: { damping: 10, stiffness: 300, mass: 0.4 } });
            return (
              <span key={k} style={{ display: "inline-block", fontFamily: F.titulo, fontSize: tam, color: C.acentoTexto, letterSpacing: 2, transform: `translateY(${(1 - q) * -40}px) scale(${q})`, opacity: f >= bPalabra + k * 2 ? 1 : 0 }}>
                {l === " " ? " " : l}
              </span>
            );
          })}
          <span style={{ fontFamily: F.mano, fontWeight: 700, fontSize: tam, color: C.acentoTexto, marginLeft: 10 }}>»</span>
          {barrido >= 0 && <div style={{ position: "absolute", top: -20, bottom: -20, left: `${-30 + barrido * 140}%`, width: "22%", background: "linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.55), rgba(255,255,255,0))", transform: "skewX(-20deg)" }} />}
        </div>
      </div>
      {sobre > 0 && sobre < 1 && (
        <div style={{ position: "absolute", left: 830 + sobre * 170, top: 470 - sobre * 260 - Math.sin(sobre * Math.PI) * 60, transform: `rotate(${sobre * 25 - 8}deg) scale(${1 - 0.45 * sobre})`, opacity: Math.min(1, sobre * 6) * (1 - Math.max(0, sobre - 0.75) * 4) }}>
          <Icono nombre="mail" tam={110} color={C.texto} />
        </div>
      )}
      <div style={{ position: "absolute", top: 700, left: 0, right: 0, textAlign: "center", fontFamily: F.mano, fontWeight: 700, fontSize: 72, color: C.acento, lineHeight: 1.15, transform: "rotate(-3deg)" }}>
        {lineas.map((l, k) => {
          const t0 = bTexto + k * 14;
          const m = lerp(f, t0 - 4, t0 + 12, 0, 1, Easing.inOut(Easing.quad));
          return (
            <div key={k} style={{ clipPath: `inset(-20% ${100 - m * 100}% -20% -5%)` }}>
              {l}
            </div>
          );
        })}
      </div>
      <div style={{ position: "absolute", top: 715 + Math.max(1, lineas.length) * 84, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 34 }}>
        {icos.map((nombre, k) => {
          const q = usePop(bIconos + k * 3, { damping: 9, stiffness: 240, mass: 0.5 });
          const fase = (f - bIconos - 18 - k * 5) % 26;
          const salto = f > bIconos + 18 && fase >= 0 && fase < 9 ? Math.sin((fase / 9) * Math.PI) * 26 : 0;
          const oscuro = k % 2 === 1;
          return (
            <div key={k} style={{ width: 104, height: 104, borderRadius: 30, background: oscuro ? C.oscuro : C.tarjeta, boxShadow: SOMBRA, border: BORDE, display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${q}) translateY(${-salto}px)` }}>
              <Icono nombre={nombre} tam={54} color={oscuro ? C.oscuroTexto : C.acento} />
            </div>
          );
        })}
      </div>
      <Confeti desde={bTexto + 6} x={540} y={470} n={60} fuerza={1.25} />
    </AbsoluteFill>
  );
};


// ------------------------------------------------------------------ modo "perfil"
const Perfil: React.FC<PropsEscena> = ({ p, b }) => {
  const f = useCurrentFrame();
  const [bSeguir, bMensaje, bTexto] = b;
  const usuario = txt(p, "usuario", "@tu_cuenta");
  const nombre = txt(p, "nombre");
  const bio = txt(p, "bio");
  const imagen = txt(p, "imagen");
  const palabra = txt(p, "palabra").toUpperCase();
  const lineas = txt(p, "texto")
    .split("/")
    .map((l) => l.trim())
    .filter(Boolean);
  const inicial = (usuario.replace(/^@/, "")[0] ?? "?").toUpperCase();
  const caja = spring({ frame: f, fps: FPS, config: { damping: 13, stiffness: 150, mass: 0.7 } });
  const fl = useFlota(0.4, 5, 17);
  const tamUsuario = usuario.length <= 13 ? 62 : usuario.length <= 17 ? 52 : 42;
  const Y = 250; // arriba de la tarjeta
  const BY = Y + 320; // arriba de los botones
  const seguido = f >= bSeguir;
  const abierto = f >= bMensaje;
  // el dedo va al botón «Seguir», lo pulsa, y luego al de «Mensaje»
  const xSeguir = 340,
    xMensaje = 730;
  const llegaA = lerp(f, bSeguir - 14, bSeguir - 2, 0, 1, Easing.out(Easing.cubic));
  const cruza = lerp(f, bMensaje - 12, bMensaje - 2, 0, 1, Easing.inOut(Easing.cubic));
  const dedoX = xSeguir + (1 - llegaA) * 300 + cruza * (xMensaje - xSeguir);
  const dedoY = BY + 70 + (1 - llegaA) * 260 + 10 * bump(f, bSeguir, 8) + 10 * bump(f, bMensaje, 8);
  const dedoOp = Math.min(llegaA * 3, 1) * interpolate(f, [bMensaje + 16, bMensaje + 26], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const pSeguir = 1 - 0.07 * bump(f, bSeguir, 8);
  const pMensaje = 1 - 0.07 * bump(f, bMensaje, 8);
  // burbuja del mensaje privado que sale del botón «Mensaje»
  const burbuja = spring({ frame: f - bMensaje - 3, fps: FPS, config: { damping: 12, stiffness: 200, mass: 0.6 } });
  const visto = f >= bMensaje + 22;
  const latido = 1 + 0.04 * Math.max(0, Math.sin(((f - bMensaje) / 26) * Math.PI * 2)) * (f > bMensaje + 30 ? 1 : 0);
  const boton = (activo: boolean, escala: number): React.CSSProperties => ({
    position: "absolute",
    top: BY,
    height: 140,
    borderRadius: 70,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
    fontFamily: F.titulo,
    fontSize: 54,
    border: SUAVE ? undefined : `4px solid ${C.borde}`,
    transform: `scale(${escala})`,
    background: activo ? C.acento : C.linea,
    color: activo ? C.acentoTexto : C.tarjetaTexto,
    boxShadow: activo ? (SUAVE ? `0 16px 34px ${alfa(C.acento, 0.35)}` : `6px 7px 0 ${C.borde}`) : "none",
  });
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: 70, top: Y + (1 - caja) * 160 + fl, width: 940, height: 520, borderRadius: 48, background: C.tarjeta, boxShadow: SOMBRA, border: BORDE, opacity: Math.min(1, caja * 1.6), transform: `scale(${0.9 + 0.1 * caja})` }}>
        <div style={{ position: "absolute", left: 50, top: 56, width: 196, height: 196, borderRadius: 98, overflow: "hidden", background: C.acento, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 0 8px ${alfa(C.acento, 0.25)}` }}>
          {imagen ? <Img src={staticFile(imagen)} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontFamily: F.titulo, fontSize: 112, color: C.acentoTexto, marginTop: -6 }}>{inicial}</span>}
        </div>
        <div style={{ position: "absolute", left: 280, right: 36, top: nombre ? 66 : 92, color: C.tarjetaTexto }}>
          {nombre && <div style={{ fontFamily: F.texto, fontWeight: 800, fontSize: 34, opacity: 0.75, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{nombre}</div>}
          <div style={{ fontFamily: F.titulo, fontSize: tamUsuario, letterSpacing: -1, whiteSpace: "nowrap" }}>{usuario}</div>
          {bio && <div style={{ fontFamily: F.texto, fontWeight: 600, fontSize: 36, lineHeight: 1.2, marginTop: 10, color: alfa(C.tarjetaTexto, 0.72) }}>{bio}</div>}
        </div>
      </div>
      {/* botones (fuera de la tarjeta para que no floten con ella y el dedo acierte) */}
      <div style={{ ...boton(!seguido, pSeguir), left: 120, width: 440, opacity: Math.min(1, caja * 1.6) }}>
        <Icono nombre={seguido ? "check" : "user-plus"} tam={58} color={seguido ? C.tarjetaTexto : C.acentoTexto} grosor={2.8} />
        {seguido ? TX.siguiendo : TX.seguir}
      </div>
      <div style={{ ...boton(seguido && !abierto, pMensaje), left: 590, width: 370, opacity: Math.min(1, caja * 1.6) }}>
        <Icono nombre="send" tam={54} color={seguido && !abierto ? C.acentoTexto : C.tarjetaTexto} grosor={2.8} />
        {TX.mensaje}
      </div>
      <Onda desde={bSeguir} x={xSeguir} y={BY + 70} r0={60} r1={300} />
      <Onda desde={bMensaje} x={xMensaje} y={BY + 70} r0={50} r1={260} />
      {dedoOp > 0 && (
        <div style={{ position: "absolute", left: dedoX - 30, top: dedoY, opacity: dedoOp }}>
          <Icono nombre="pointer" tam={120} color={C.texto} grosor={2} />
        </div>
      )}
      {/* corazones que suben sin parar tras seguir */}
      {seguido &&
        Array.from({ length: 6 }).map((_, k) => {
          const e0 = f - bSeguir - k * 7;
          if (e0 < 0) return null;
          const t = (e0 % 42) / 42;
          return (
            <div key={k} style={{ position: "absolute", left: 950 + Math.sin(t * 6 + k) * 18, top: Y + 480 - t * 440, opacity: (1 - t) * Math.min(1, t * 6), transform: `scale(${0.6 + 0.6 * t})` }}>
              <Icono nombre="heart" tam={52} color={k % 2 ? C.error : C.acento} grosor={2.6} />
            </div>
          );
        })}
      {/* el mensaje privado con la palabra */}
      {abierto && (
        <div style={{ position: "absolute", left: 0, right: 0, top: BY + 250 + (1 - burbuja) * 60, display: "flex", justifyContent: "center", opacity: Math.min(1, burbuja * 2), transform: `scale(${(0.7 + 0.3 * burbuja) * latido})` }}>
          <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 18, padding: "26px 44px", borderRadius: "56px 56px 14px 56px", background: C.oscuro, color: C.oscuroTexto, boxShadow: SOMBRA, border: BORDE }}>
            <span style={{ fontFamily: F.texto, fontWeight: pesoTexto(600), fontSize: 38, opacity: 0.75 }}>{TX.privado}</span>
            {palabra ? <span style={{ fontFamily: F.titulo, fontSize: palabra.length <= 8 ? 72 : 58, color: C.acento, letterSpacing: 2 }}>{palabra}</span> : <Icono nombre="message-circle" tam={64} color={C.acento} grosor={2.6} />}
            <Icono nombre={visto ? "check-check" : "check"} tam={46} color={visto ? C.acento : alfa(C.oscuroTexto, 0.6)} grosor={2.8} />
          </div>
        </div>
      )}
      <div style={{ position: "absolute", top: BY + 450, left: 0, right: 0, textAlign: "center", fontFamily: F.mano, fontWeight: 700, fontSize: 84, color: C.acento, lineHeight: 1.12, transform: "rotate(-3deg)" }}>
        {lineas.map((l, k) => {
          const t0 = bTexto + k * 14;
          const m = lerp(f, t0 - 4, t0 + 12, 0, 1, Easing.inOut(Easing.quad));
          return (
            <div key={k} style={{ clipPath: `inset(-20% ${100 - m * 100}% -20% -5%)` }}>
              {l}
            </div>
          );
        })}
      </div>
      <Confeti desde={bSeguir + 2} x={xSeguir} y={BY + 70} n={50} fuerza={1.1} />
    </AbsoluteFill>
  );
};

export const cta: DefEscena = {
  C: Cta,
  momentos: 3,
  // la tarjeta entra desde el primer fotograma
  alInicio: () => true,
  sonidos: (p) =>
    txt(p, "modo") === "perfil"
      ? [
          [0, "clic", 0.4],
          [0, "exito", 0.28],
          [1, "burbuja", 0.32],
        ]
      : [
          [0, "tecla", 0.3],
          [1, "exito", 0.3],
        ],
  validar: (p) =>
    txt(p, "modo") === "perfil"
      ? [
          ...reglas(p, [["usuario", "texto", { max: 24 }], ["nombre", "texto", { opcional: true, max: 26 }], ["bio", "texto", { opcional: true, max: 40 }], ["palabra", "texto", { opcional: true, max: 12 }], ["texto", "texto", { opcional: true, max: 50 }], ["imagen", "imagen", { opcional: true }]]),
          ...(p.enlace !== undefined ? ["«enlace» ya no existe: este final pide seguir y escribir por privado (pon la palabra en «palabra»)"] : []),
        ]
      : [
          ...(["", "palabra"].includes(txt(p, "modo")) ? [] : [`«modo» tiene que ser "palabra" (por defecto) o "perfil"`]),
          ...reglas(p, [["palabra", "texto", { max: 12 }], ["verbo", "texto", { opcional: true, max: 14 }], ["texto", "texto", { opcional: true, max: 50 }], ["iconos", "lista", { opcional: true, maxItems: 5 }]]),
          ...iconos(arr<string>(p, "iconos")),
        ],
};
