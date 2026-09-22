# Sistema visual del Study Lab

Este documento manda sobre la apariencia de la app. Si un archivo de `app/` contradice
lo que dice aqui, el que esta mal es el archivo de `app/`.

Dos referencias visuales, ambas pedidas por el usuario:

- **[arcraiders.com](https://arcraiders.com/es)**: la paleta y la voz tipografica. Crema,
  tinta violeta casi negra, dorado para la accion, neones planos y Barlow condensada en
  mayusculas para los titulares.
- **[brilliant.org](https://brilliant.org)**: la estructura de plataforma educativa.
  Catalogo de cursos en tarjetas amplias, esquinas muy redondeadas, progreso siempre a la
  vista, tema claro por defecto.

El metodo de trabajo y el piso de calidad vienen de
[Impeccable](https://github.com/pbakaus/impeccable) (Apache-2.0).

## Modo y escena

**Modo Operate**: el visitante viene a completar una tarea, no a ser persuadido. Manda la
escaneabilidad, la densidad estable y la consistencia. La marca vive en los detalles finos,
no en efectos.

**Escena de uso**: de 19:00 a 22:00, en casa, sobre una laptop, durante un sprint de 22
dias. **El tema claro es el de entrada**, sobre papel crema en vez de blanco. El tema noche
usa el violeta casi negro de Arc y esta compuesto aparte, no invertido.

El interruptor de tema es un sol y una luna, arriba a la derecha, en la barra superior:
donde lo busca cualquiera.

## Color

Definido en `tokens.css`. Crudos de marca tomados de Arc Raiders:

| Crudo | Valor | Donde |
|---|---|---|
| Crema | `#ece2d0` | papel del tema claro |
| Tinta | `#130918` | texto, bloques de contraste, lienzo del tema noche |
| Dorado | `#f1aa1c` | **la accion**: botones principales |
| Neon rojo | `#e8271f` | error, ruta 1 |
| Neon ambar | `#f2b01e` | advertencia y gotchas |
| Neon verde | `#2fb84f` | acierto, leccion vista, ruta 2 |
| Neon cian | `#3fbcdf` | datos y medicion, ruta 3 |
| Neon azul | `#2f4bc7` | foco y seleccion |

Roles: `--canvas`, `--sunken`, `--surface`, `--surface-raise`, `--contraste`, `--rule`,
`--text` en tres niveles, `--accion`, `--foco`, `--ok`, `--warn`, `--danger`, `--dato`, y
un `-wash` por cada estado para fondos suaves.

Reglas:

- **El dorado es solo para la accion.** Un boton dorado por pantalla. Si aparece en todo,
  deja de senalar nada.
- **Los neones son codigo, no decoracion.** Cada ruta tiene el suyo, cada estado el suyo.
  La unica excepcion es la franja de cinco neones, que es la firma de la marca.
- **El color nunca es el unico codigo**: las lecciones vistas llevan ademas la palomita, las
  respuestas del examen llevan letra, las calificaciones llevan etiqueta.
- Contraste minimo: texto 4.5:1, texto grande y controles 3:1, en ambos temas.

## Tipografia

Tres familias auto-hospedadas en `fonts/`, subconjuntos latin y latin-ext.

| Rol | Familia | Donde |
|---|---|---|
| Display | Barlow Condensed 700, en mayusculas | titulares, nombres de curso, preguntas |
| Texto | Barlow 400/500/600 | interfaz, lectura y cuadernos |
| Datos | JetBrains Mono 400 | cifras, codigo, intervalos, fechas |

- El display siempre va en mayusculas y condensado: es la voz de Arc Raiders.
- Toda cifra comparable va en mono con `tabular-nums`.
- Escala de roles fija, de `--t-hero` a `--t-label`. Medida de lectura de 70ch.

## Espacio y forma

- Escala base 4 (`--s1` a `--s16`). Los pasos intermedios importan: un sistema de solo 8
  obliga a redondear mal.
- Ritmo por contraste: grupos apretados, separaciones generosas. Mas aire arriba de un
  titulo que abajo.
- Radios amplios, de 8 a 28 px, y pildoras para botones y chips: la forma amable de una
  plataforma educativa.
- Profundidad con desplazamiento mas desenfoque suave (`--e1`, `--e2`). Nunca un halo plano
  sin offset, nunca sombra dura de bloque.

## Movimiento

Un solo momento autoral: **la respuesta de la tarjeta se descubre con una cortina** desde
arriba (`clip-path`), 320 ms, `cubic-bezier(0.16, 1, 0.3, 1)`. Los cuatro botones de
calificacion entran escalonados 40 ms, con tope de 120 ms. Las tarjetas de curso se elevan
3 px al pasar el cursor; el interruptor de tema desliza su pastilla.

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
| Rejilla de tarjetas iguales como relleno | Solo el catalogo usa tarjetas, porque cada una es un curso real con su progreso. El resto son listas con reglas |
| La plantilla de metrica heroica | El titular es una frase, no un numero suelto. Las cifras van en bloques planos sin sombra |
| Tarjetas dentro de tarjetas | Ninguna. Las listas se separan con reglas de 1px |
| Barra de color al costado de tarjetas o filas | Ninguna. El gotcha se marca con su icono, no con un borde ambar |
| Etiqueta o kicker encima de un titular | Ninguna. El titular se sostiene solo |
| Texto con gradiente, vidrio esmerilado decorativo | Ninguno. El enfasis es peso y tamano |
| Fuente del sistema como voz de display | Tres familias auto-hospedadas |
| Emoji como iconografia | Set propio dibujado |
| Anillos de progreso decorativos | Los medidores son barras atadas a un dato real: lecciones vistas o aciertos |

## Verificacion

Antes de dar por cerrado un cambio visual, con la app corriendo:

1. Contraste en ambos temas, incluidos estados deshabilitado y de foco.
2. Prueba de entrecerrar los ojos: se distingue el elemento primario, el secundario y los
   grupos, en ese orden.
3. Estados reales: vacio, cargando, error, contenido largo, lista de un solo elemento.
4. Anchos de 1400, 1100, 760 y 430 px. Sin scroll horizontal, sin texto cortado.
5. Teclado completo: foco visible y orden igual al visual.
6. Movimiento con `prefers-reduced-motion` activado.

## Alcance de la plataforma

Aqui solo entra el contenido de los cursos: lecciones, cuadernos, tarjetas, gotchas
tecnicos, snippets y simulacros. Lo administrativo (inscripciones, cuentas, vouchers,
fechas del festival) vive en `01_plan/plan-estudio.md`, no en la app.

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
