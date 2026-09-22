# Sistema visual del Study Lab

Este documento manda sobre la apariencia de la app. Si un archivo de `app/` contradice
lo que dice aqui, el que esta mal es el archivo de `app/`.

La guia de fondo es [Impeccable](https://github.com/pbakaus/impeccable) (Apache-2.0), un
lenguaje de diseno para agentes. De ahi salen el piso de calidad, la lista de patrones
prohibidos y el criterio de verificacion. Las decisiones concretas de abajo son de este
producto, no de la guia.

## Modo y escena

**Modo Operate**: el visitante viene a completar una tarea, no a ser persuadido. Manda la
escaneabilidad, la densidad estable y la consistencia. La marca vive en los detalles finos,
no en efectos.

**Escena de uso**: de 19:00 a 22:00, en casa, solo, con luz baja, sobre una laptop, durante
un sprint de 22 dias. De ahi sale el tema noche por defecto, con negros calidos en vez del
azul oscuro tipico de dashboards. El tema dia existe compuesto aparte, no invertido.

## Color

Definido en OKLCH, en `tokens.css`. Roles, no swatches sueltos:

| Rol | Token | Uso |
|---|---|---|
| Lienzo | `--canvas` | fondo de ventana |
| Hundido | `--sunken` | barra lateral, bloques de codigo |
| Panel | `--surface` | tarjetas y paneles |
| Relieve | `--surface-raise` | controles sobre panel |
| Regla | `--rule`, `--rule-soft` | hairlines, la separacion por defecto |
| Texto | `--text`, `--text-2`, `--text-3` | tres niveles, tintados al mismo hue calido |
| Accion | `--ember` | la unica accion principal de cada pantalla, y la marca |
| Medicion | `--signal` | datos, foco, seleccion |
| Semanticos | `--ok`, `--warn`, `--danger` | siempre con texto o forma, nunca solo color |

Reglas:

- **Ember es escaso.** Si aparece en todos lados deja de senalar la accion. En una pantalla
  hay un solo boton `btn-key`.
- **Nada de gris puro.** Todo neutro esta tintado desde el mismo hue calido; el texto
  secundario se deriva del fondo, no de un gris generico.
- **El color nunca es el unico codigo.** Las calificaciones de repaso llevan etiqueta, las
  respuestas del examen llevan letra y las correctas llevan tambien el cambio de estado.
- Contraste minimo: texto 4.5:1, texto grande y controles 3:1, en ambos temas.

## Tipografia

Tres familias auto-hospedadas en `fonts/`, subconjuntos latin y latin-ext, 187 KB en total.
Nada de fuentes del sistema como voz de display.

| Rol | Familia | Donde |
|---|---|---|
| Display | Bricolage Grotesque 600/700 | titulares, preguntas de tarjeta, nombres |
| Texto | Instrument Sans 400/500/600 | interfaz y lectura |
| Datos | JetBrains Mono 400/500 | cifras, codigo, intervalos, fechas |

- Toda cifra comparable va en mono con `tabular-nums`: las columnas no bailan al cambiar.
- Escala de roles fija (`--t-display` a `--t-label`), sin valores sueltos.
- Medida de lectura de 68ch como tope (`--measure`).
- Las etiquetas en versalitas llevan `0.09em` de tracking; los titulares, tracking negativo.

## Espacio y forma

- Escala base 4 (`--s1` a `--s16`). Los pasos intermedios importan: un sistema de solo 8
  obliga a redondear mal.
- Ritmo por contraste: grupos apretados, separaciones generosas. Mas aire arriba de un
  titulo que abajo.
- Radios de 6 a 20 px segun el tamano del elemento.
- Profundidad con desplazamiento mas desenfoque suave (`--e1`, `--e2`). Nunca un halo plano
  sin offset, nunca sombra dura de bloque.

## Movimiento

Un solo momento autoral: **la respuesta de la tarjeta se descubre con una cortina** desde
arriba (`clip-path`), 320 ms, `cubic-bezier(0.16, 1, 0.3, 1)`. Los cuatro botones de
calificacion entran escalonados 40 ms, con tope de 120 ms.

Todo lo demas es retroalimentacion: 120 ms para hover y foco, 200 ms para cambios de estado.
Nada de rebote ni elastico. Con `prefers-reduced-motion` todo se apaga.

## Superficies del navegador

Lo que no se dibuja tambien lleva el diseno, y es la senal mas barata de que una pagina
fue construida y no ensamblada: seleccion de texto, cursor de escritura, barra de scroll,
anillo de foco, `accent-color` y `color-scheme`. Todo tomado de la paleta en `base.css`.

## Iconos

Set propio en `icons.svg`, rejilla de 24, trazo 1.6, extremos redondeados, un solo peso.
Se usan con `<use href="../ui/icons.svg#ic-nombre">` y heredan `currentColor`.

**Prohibido**: emoji o glifos unicode como iconos, y mezclar sets.

## Patrones prohibidos en este producto

Sacados del piso de calidad de Impeccable, con la decision que tomamos en cada caso:

| Patron | Que hicimos |
|---|---|
| Numeros de seccion (01 / 02 / 03) decorativos | Fuera de la navegacion. Solo quedan donde el orden informa: cola de repaso y preguntas del examen |
| Rejilla de tarjetas iguales como estructura de pagina | El panel usa una frase dominante, cifras separadas por hairlines y listas con reglas |
| La plantilla de metrica heroica | Las cifras viven en una fila de hairlines, no en cuatro tarjetas con sombra |
| Tarjetas dentro de tarjetas | Ninguna. Las listas se separan con reglas de 1px |
| Barra de color al costado de tarjetas o filas | Ninguna. El gotcha se marca con su icono, no con un borde ambar |
| Etiqueta o kicker encima de un titular | Ninguna. El titular se sostiene solo |
| Texto con gradiente, vidrio esmerilado decorativo | Ninguno. El enfasis es peso y tamano |
| Fuente del sistema como voz de display | Tres familias auto-hospedadas |
| Emoji como iconografia | Set propio dibujado |
| Anillos de progreso decorativos | El unico medidor es una barra de 3px atada a un dato real |

## Verificacion

Antes de dar por cerrado un cambio visual, con la app corriendo:

1. Contraste en ambos temas, incluidos estados deshabilitado y de foco.
2. Prueba de entrecerrar los ojos: se distingue el elemento primario, el secundario y los
   grupos, en ese orden.
3. Estados reales: vacio, cargando, error, contenido largo, lista de un solo elemento.
4. Anchos de 1400, 1100, 760 y 430 px. Sin scroll horizontal, sin texto cortado.
5. Teclado completo: foco visible y orden igual al visual.
6. Movimiento con `prefers-reduced-motion` activado.

## Estructura de archivos

```
ui/
├── DESIGN.md        este documento
├── tokens.css       valores. Nadie mas define colores, tamanos ni tiempos
├── base.css         reset, roles tipograficos, superficies del navegador
├── components.css   componentes de la app
├── icons.svg        sprite de iconos
├── icons/           iconos de la PWA (png, ico)
└── fonts/           woff2 auto-hospedados y fonts.css
```
