# ui

Capa visual de todo el proyecto. La app de `app/` trae la logica y los datos; el aspecto se
decide aqui y solo aqui.

- **[DESIGN.md](DESIGN.md)**: el sistema. Modo, escena de uso, paleta, tipografia, espacio,
  movimiento, patrones prohibidos y como verificar un cambio. Leerlo antes de tocar CSS.
- **tokens.css**: los valores. Ningun componente inventa un color, un tamano ni un tiempo
  fuera de este archivo.
- **base.css**: reset, roles tipograficos y superficies del navegador (seleccion, cursor,
  scrollbar, anillo de foco).
- **components.css**: los componentes de la app.
- **icons.svg**: sprite propio, rejilla 24, trazo 1.6.
- **fonts/**: Bricolage Grotesque, Instrument Sans y JetBrains Mono en woff2, subconjuntos
  latin y latin-ext. Licencia SIL Open Font License 1.1.
- **icons/**: iconos de la PWA en png e ico.

## Como cambiar algo

1. Si es un valor (color, tamano, tiempo): `tokens.css`. Se propaga a todo.
2. Si es un componente: `components.css`, reutilizando tokens.
3. Si cambia una regla del sistema: primero `DESIGN.md`, despues el CSS.
4. Verificar con la lista de DESIGN.md, con la app corriendo, en los dos temas.

## Origen

El sistema esta construido siguiendo [Impeccable](https://github.com/pbakaus/impeccable)
(Apache-2.0), un lenguaje de diseno para agentes de codigo: de ahi salen el piso de calidad,
los patrones que se consideran defaults perezosos y el metodo de verificacion. Nada de ese
repositorio esta copiado aqui; las decisiones concretas son de este producto.

Vale la pena instalarlo como skill si se va a trabajar mas la interfaz:

    npx impeccable install
