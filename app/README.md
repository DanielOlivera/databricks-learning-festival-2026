# Databricks Study Lab (PWA local)

App de estudio que corre solo en tu computadora. Sin cuentas, sin nube, sin internet.
Pensada para aprender por repeticion: lo que fallas vuelve enseguida, lo que dominas se espacia.

## Como abrirla

Doble clic en `estudiar.bat` (en la raiz del repo). Levanta un servidor local en
http://localhost:8765 y abre el navegador. Cierra la ventana negra para apagarla.

Tambien funciona abriendo `app/index.html` directo con doble clic, pero sin servidor
no se puede instalar como app ni cachear para uso offline.

## Instalarla como app de escritorio

Con la app abierta en Chrome: menu de tres puntos, **Enviar, guardar y compartir**,
**Instalar pagina como aplicacion**. Queda con su propio icono y ventana, como un .exe,
y se puede anclar a la barra de tareas. Al estar instalada funciona sin conexion.

## Modulos

| Modulo | Que hace |
|---|---|
| Panel | Dominio general, tarjetas para hoy, mapa de constancia de 8 semanas, racha, avance por tema y por curso |
| Repaso | Flashcards con algoritmo SM-2. Teclado: espacio muestra la respuesta, teclas 1 a 4 califican |
| Gotchas | Tablero de trampas con etiquetas y buscador. Cualquier gotcha se convierte en tarjeta con un clic |
| Cheatsheets | Snippets de SQL y Python con boton de copiar |
| Examen | Simulacro con los pesos reales del examen y resultado por tema |

## Como funciona la repeticion espaciada

Cada tarjeta guarda un factor de facilidad (ease) y un intervalo.

- **Otra vez**: vuelve en 10 minutos y baja el ease.
- **Dificil**: intervalo corto, ease casi igual.
- **Bien**: 1 dia, luego 4, luego intervalo por ease (aprox. 2.5x).
- **Facil**: 3 dias, luego 7, y crece mas rapido.

Una tarjeta cuenta como dominada cuando su intervalo llega a 7 dias o mas. Ese es el
porcentaje de Dominio del panel.

## Donde viven los datos

- **Material de estudio**: `app/data/seed.js`. Es texto plano y versionado en git.
  Para agregar tarjetas, gotchas, snippets o preguntas, se edita ese archivo.
- **Tu avance** (repeticiones, fechas, racha, notas propias): `localStorage` del navegador.
  No se sube a ningun lado. Usa **Exportar datos** para bajar un JSON de respaldo e
  **Importar datos** para restaurarlo en otra maquina o navegador.

Si cambias de navegador o limpias los datos del sitio, el avance se pierde: exporta cada tanto.

## Agregar contenido a mano

En `app/data/seed.js`, cada lista tiene la misma forma:

```js
tarjetas: [
  { id: "c201", curso: "1.2", tema: "Jobs", frente: "pregunta", reverso: "respuesta" }
]
```

Los ids deben ser unicos. Las tarjetas nuevas entran automaticamente a la cola de repaso.
