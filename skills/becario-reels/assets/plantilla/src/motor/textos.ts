// Textos fijos de las escenas (los que no vienen del plan) en varios idiomas, y el formato de los números.
// El plan elige el idioma con "idioma" (es, en, pt, fr, it, de) y puede cambiar cualquier texto con "textos".
import { PLAN } from "./actual";

export type Textos = {
  comenta: string; // verbo por defecto de la escena cta
  seguir: string; // botón de la tarjeta de perfil (cta "perfil")
  siguiendo: string;
  mensaje: string; // botón de mensaje de la tarjeta de perfil (cta "perfil")
  privado: string; // etiqueta del mensaje privado que se envía
  pensaras: string; // cabecera de la escena objecion
  escribeIdea: string; // campo vacío del chat
  asistente: string; // título por defecto de la ventana de chat
  saludo: string; // saludo por defecto del chat
  escribiendo: string; // respuesta por defecto del chat
  respondiendo: string; // respuesta por defecto del chat cuando lleva "codigo" propio
  hecho: string; // etiqueta por defecto de la escena editor
};

const BASE: Record<string, Textos & { miles: string; decimal: string; enlaces: string[] }> = {
  es: {
    comenta: "Comenta",
    seguir: "Seguir",
    siguiendo: "Siguiendo",
    mensaje: "Mensaje",
    privado: "por privado",
    pensaras: "¿Pensarás que…",
    escribeIdea: "Escribe tu idea…",
    asistente: "Asistente IA",
    saludo: "¿Qué hacemos hoy?",
    escribiendo: "Escribiendo el reel",
    respondiendo: "Respondiendo",
    hecho: "hecho con código",
    miles: ".",
    decimal: ",",
    enlaces: ["a", "al", "de", "del", "el", "la", "los", "las", "lo", "en", "y", "e", "o", "u", "que", "con", "un", "una", "unos", "unas", "por", "para", "sin", "sobre", "su", "sus", "tu", "tus", "mi", "mis", "te", "se", "me", "le", "les", "no", "si", "como", "pero", "más"],
  },
  en: {
    comenta: "Comment",
    seguir: "Follow",
    siguiendo: "Following",
    mensaje: "Message",
    privado: "by DM",
    pensaras: "You might think…",
    escribeIdea: "Type your idea…",
    asistente: "AI assistant",
    saludo: "What are we making today?",
    escribiendo: "Writing the reel",
    respondiendo: "Answering",
    hecho: "made with code",
    miles: ",",
    decimal: ".",
    enlaces: ["a", "an", "the", "of", "to", "in", "on", "at", "and", "or", "but", "for", "with", "by", "from", "your", "my", "his", "her", "its", "our", "their", "that", "this", "is", "as", "if", "than"],
  },
  pt: {
    comenta: "Comenta",
    seguir: "Seguir",
    siguiendo: "Seguindo",
    mensaje: "Mensagem",
    privado: "por mensagem",
    pensaras: "Vai pensar que…",
    escribeIdea: "Escreve a tua ideia…",
    asistente: "Assistente IA",
    saludo: "O que vamos fazer hoje?",
    escribiendo: "A escrever o reel",
    respondiendo: "A responder",
    hecho: "feito com código",
    miles: ".",
    decimal: ",",
    enlaces: ["a", "o", "as", "os", "de", "do", "da", "dos", "das", "em", "no", "na", "nos", "nas", "e", "ou", "que", "com", "um", "uma", "por", "para", "sem", "seu", "sua", "teu", "tua", "meu", "minha", "se", "não", "mas", "como"],
  },
  fr: {
    comenta: "Commente",
    seguir: "Suivre",
    siguiendo: "Abonné",
    mensaje: "Message",
    privado: "en privé",
    pensaras: "Tu vas penser que…",
    escribeIdea: "Écris ton idée…",
    asistente: "Assistant IA",
    saludo: "On fait quoi aujourd'hui ?",
    escribiendo: "J'écris le reel",
    respondiendo: "Je réponds",
    hecho: "fait avec du code",
    miles: " ",
    decimal: ",",
    enlaces: ["à", "au", "aux", "de", "du", "des", "le", "la", "les", "l", "un", "une", "et", "ou", "en", "que", "qui", "avec", "pour", "par", "sans", "sur", "ton", "ta", "tes", "mon", "ma", "mes", "son", "sa", "ses", "se", "ne", "pas", "mais", "comme"],
  },
  it: {
    comenta: "Commenta",
    seguir: "Segui",
    siguiendo: "Segui già",
    mensaje: "Messaggio",
    privado: "in privato",
    pensaras: "Penserai che…",
    escribeIdea: "Scrivi la tua idea…",
    asistente: "Assistente IA",
    saludo: "Cosa facciamo oggi?",
    escribiendo: "Sto scrivendo il reel",
    respondiendo: "Sto rispondendo",
    hecho: "fatto con il codice",
    miles: ".",
    decimal: ",",
    enlaces: ["a", "al", "allo", "alla", "ai", "di", "del", "della", "dei", "il", "lo", "la", "i", "gli", "le", "un", "una", "in", "nel", "nella", "e", "o", "che", "con", "per", "su", "tuo", "tua", "mio", "mia", "si", "non", "ma", "come"],
  },
  de: {
    comenta: "Kommentiere",
    seguir: "Folgen",
    siguiendo: "Gefolgt",
    mensaje: "Nachricht",
    privado: "per DM",
    pensaras: "Du denkst jetzt…",
    escribeIdea: "Schreib deine Idee…",
    asistente: "KI-Assistent",
    saludo: "Was machen wir heute?",
    escribiendo: "Ich schreibe das Reel",
    respondiendo: "Ich antworte",
    hecho: "mit Code gemacht",
    miles: ".",
    decimal: ",",
    enlaces: ["der", "die", "das", "den", "dem", "des", "ein", "eine", "einen", "einem", "und", "oder", "aber", "mit", "für", "von", "zu", "zum", "zur", "in", "im", "an", "am", "auf", "aus", "dein", "deine", "mein", "meine", "sein", "seine", "ist", "nicht", "wie", "als"],
  },
};

export const IDIOMAS = Object.keys(BASE);
/** Idioma del reel (por defecto, español). Si el plan pide uno que no existe, el resumen lo avisa y se usa el español. */
export const IDIOMA = PLAN.idioma && BASE[PLAN.idioma] ? PLAN.idioma : "es";
const base = BASE[IDIOMA];

/** Textos fijos del idioma del reel, con los cambios de "textos" del plan encima. */
export const TX: Textos = { ...base, ...((PLAN.textos ?? {}) as Partial<Textos>) };
export const CLAVES_TEXTOS = Object.keys(BASE.es).filter((k) => !["miles", "decimal", "enlaces"].includes(k));

/** Palabras de enlace del idioma («de», «la», «que»…): nunca cierran una línea de subtítulos. */
export const ENLACES = new Set(base.enlaces);

/** Número con el separador de miles y de decimales del idioma del reel (1.500 en español, 1,500 en inglés). */
export const numero = (n: number, decimales = 0) => {
  const [ent, dec] = Math.abs(n).toFixed(decimales).split(".");
  const conMiles = ent.replace(/\B(?=(\d{3})+(?!\d))/g, base.miles);
  return `${n < 0 ? "-" : ""}${conMiles}${dec ? `${base.decimal}${dec}` : ""}`;
};
