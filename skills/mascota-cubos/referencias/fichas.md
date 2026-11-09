# Fichas de mascota

Una ficha describe la mascota sin pintar píxel a píxel. El constructor (`motor/fichas/constructor.js`) pinta una skin de 64×64 con las proporciones clásicas de los juegos de bloques y le añade caras, poses y accesorios en 3D.

```jsonc
{
  "tipo": "humano",                       // o "animal"
  "piel": "#F2C29A",                      // animal: color del pelaje
  "pelo": { "color": "#4A2F1E", "estilo": "corto" },   // corto | largo | calvo | coleta | dos_coletas | mono | puntas (solo humano)
  "animal": { "orejas": "gato", "hocico": "#FFF1E2", "nariz": "#E8798A", "cola": true, "rayas": "#D07A3A", "bigotes": true },
  "ojos": "#1B1B22", "boca": "#B4604F", "mejillas": true,
  "torso": { "color": "#FFFFFF", "manga": "corta", "capucha": false,
             "dibujo": ["........", "..R..R.."], "leyenda": { "R": "#C8343A" } },   // filas de 8 desde la fila 3 del pecho
  "piernas": { "color": "#2B2E3A", "largo": true },
  "zapatos": { "color": "#1B1B20", "suela": "#F2F2F2" },
  "accesorios": ["gorro_chef", "gorra:#E23B3B", "sombrero:#E6C677:#B5452F", "gafas:#1B1B22", "auriculares:#8A4FFF",
                 "cinta:#FF7A1A", "delantal:#FFFFFF", "peto:#3B5BA5", "pajarita:#C8343A", "casco", "corona"],
  "cubos": [ { "parte": "cabeza", "pos": [0, 10, 0], "tam": [2, 2, 2], "color": "#hex", "giro": [0, 0, 0] } ],
  "retoques": [ { "parte": "cabeza", "cara": "frente", "filas": ["", "", "", "", "........", ".....XX."], "leyenda": { "X": "#hex" } } ]
}
```

- `animal.orejas`: `gato`, `perro`, `oso` o `conejo`.
- `torso.manga`: `corta`, `larga` o `sin`.
- `piernas.largo: false` es pantalón corto.
- `torso.bajo: false` quita el dobladillo de la camiseta en 3D (la capa exterior de las filas 10–11); `peto` ya lo quita solo.
- Accesorios:
  - `sombrero:paja:cinta` es un sombrero de ala ancha (paja por defecto).
  - `peto:color` es un peto con tirantes; ponlo junto con `piernas` del mismo color.
- `cubos` añade bloques 3D sueltos. Unidades: 1 = 1 píxel de skin.
  - En la cabeza, y va de 0 a 8 (la parte de arriba está en 8,5 con la capa exterior), con x y z centrados en 0.
  - Las partes son `cabeza`, `tronco`, `brazoD`, `brazoI`, `piernaD` y `piernaI`; las de brazos y piernas cuelgan desde la articulación.
  - Sirven para orejas raras, cuernos, antenas, mochilas, flores en el pelo…
- Con objetos altos o anchos en la cabeza (sombreros, orejas de conejo), las poses `saluda` y `senala_arriba` pueden atravesarlos con la mano: mira la hoja y elige otras poses.

## De una foto o un dibujo a una ficha
1. Mira la imagen y saca 5–8 colores: piel o pelaje, pelo, ropa de arriba, ropa de abajo, zapatos y un detalle.
2. Elige `tipo`, estilo de pelo y accesorios. Lo que no exista, hazlo con `retoques` (píxeles a mano) o con un módulo propio.
3. Pocos detalles y bien puestos: en una cara de 8×8, cada píxel cuenta. Ojos de una fila; nada de píxeles sueltos que parezcan manchas.
4. Saca la hoja (`node hoja.js`), mírala y ajusta.

## Retoques a mano
`parte`:
- `cabeza` y `sombrero` (la capa exterior de la cabeza).
- `cuerpo` y `chaqueta` (la capa exterior del cuerpo).
- `brazoD`/`mangaD` y `brazoI`/`mangaI`.
- `piernaD`/`pantD` y `piernaI`/`pantI`.

`cara`: `frente`, `detras`, `der` (su derecha, a tu izquierda), `izq`, `arriba` o `abajo`.

Tamaños: cabeza 8×8 por cara; cuerpo 8×12 (frente y espalda) y 4×12 (lados); brazos y piernas 4×12.

En las filas:
- `.` deja el píxel como estaba.
- Un espacio lo deja transparente (útil en las capas exteriores).
- Cualquier otra letra se busca en `leyenda`. También valen las letras de la ficha: `S` piel, `H` pelo, `C` torso, `K` piernas, `N` ojos, `M` boca, `W` blanco.

## Caras de la cabeza (filas 3–7 de la cara frontal)
Cada pose usa una expresión: feliz, sorpresa, guiño, risa, agobio, piensa o decidido. El constructor las genera solas. En un módulo propio, pásalas como `caras: { nombre: lienzo }` (mira `skin.variante()`).

## Skin PNG
`{"skin": "skin.png"}` acepta skins de 64×64 (dos capas) o de 64×32 (formato antiguo; brazo y pierna izquierdos se copian de los derechos). Con una skin solo hay una cara. Si se quieren expresiones, conviértela en módulo propio.

## Módulo propio
Úsalo solo si la ficha no llega. Va en la carpeta del proyecto y el plan lo carga con `"personaje": {"modulo": "mia.js", "funcion": "crear", "ficha": {...}}`. La función recibe `THREE` y la configuración `personaje`, así que la ficha sigue en el plan:

```js
import { crearMascota } from '../fichas/constructor.js';
export function crear(THREE, P) {
  const pj = crearMascota(THREE, P.ficha);
  const ala = new THREE.Mesh(new THREE.BoxGeometry(15, 0.8, 15), new THREE.MeshLambertMaterial({ color: '#E6C677' }));
  ala.position.set(0, 8.4, 0); pj.partes.cabeza.add(ala);
  return pj;
}
```
`pj.partes` tiene `cabeza`, `tronco`, `cuerpo`, `cuello`, `brazoD`/`brazoI` (con `.hombro` y `.codo`) y `piernaD`/`piernaI`.
