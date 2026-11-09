import React from "react";
import { registerRoot, Composition, AbsoluteFill, OffthreadVideo, Sequence, staticFile, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";

const Prueba = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const entrada = interpolate(f, [0, 15], [0, 1], { extrapolateRight: "clamp" });
  const barra = interpolate(f, [6, 36], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const sello = spring({ frame: f - 36, fps, config: { damping: 9 } });
  return (
    <AbsoluteFill style={{ background: "#2b3a55", justifyContent: "center", alignItems: "center", gap: 36,
      flexDirection: "column", fontFamily: "Segoe UI, Helvetica Neue, Arial, sans-serif" }}>
      <h1 style={{ color: "#fff", fontSize: 120, fontWeight: 800, opacity: entrada,
        transform: `translateY(${(1 - entrada) * 80}px)` }}>Editor IA</h1>
      <div style={{ width: 640, height: 18, borderRadius: 9, background: "rgba(255,255,255,.25)", overflow: "hidden" }}>
        <div style={{ width: `${barra * 100}%`, height: "100%", background: "#ffd166" }} />
      </div>
      <div style={{ color: "#2b3a55", background: "#ffd166", fontSize: 56, fontWeight: 800, padding: "18px 44px",
        borderRadius: 20, transform: `scale(${sello})` }}>listo ✓</div>
    </AbsoluteFill>
  );
};

// Montaje: el clip del usuario (copiado en public/) a pantalla completa y un titular al principio.
// Render: remotion-cli.js render src/index.jsx Montaje SALIDA.mp4 --props='{"video":"clip.mp4","duracion":12.4,"titular":"Mi gancho"}'
const Montaje = ({ video, titular }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const entra = spring({ frame: f, fps, config: { damping: 12 } });
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <OffthreadVideo src={staticFile(video)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      {titular ? (
        <Sequence durationInFrames={Math.round(2.5 * fps)}>
          <AbsoluteFill style={{ justifyContent: "flex-start", alignItems: "center", paddingTop: 260 }}>
            <div style={{ background: "#ffd166", color: "#1d2433", fontSize: 72, fontWeight: 800, padding: "18px 36px",
              borderRadius: 18, maxWidth: 900, textAlign: "center", transform: `scale(${entra})`,
              fontFamily: "Segoe UI, Helvetica Neue, Arial, sans-serif" }}>{titular}</div>
          </AbsoluteFill>
        </Sequence>
      ) : null}
    </AbsoluteFill>
  );
};

const Root = () => (
  <>
    <Composition id="Prueba" component={Prueba} durationInFrames={60} fps={30} width={1080} height={1920} />
    <Composition id="Montaje" component={Montaje} fps={30} width={1080} height={1920} durationInFrames={300}
      defaultProps={{ video: "clip.mp4", duracion: 10, titular: "" }}
      calculateMetadata={({ props }) => ({ durationInFrames: Math.max(1, Math.round(props.duracion * 30)) })} />
  </>
);

registerRoot(Root);
