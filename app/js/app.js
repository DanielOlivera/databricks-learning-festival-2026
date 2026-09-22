/* Study Lab: cursos, cuadernos, repaso espaciado, gotchas y simulacros.
   Material en data/seed.js. Avance en localStorage. Cuadernos en IndexedDB.
   La capa visual vive en ../ui: aqui no se escriben colores ni tamanos. */
(() => {
"use strict";

const CLAVE = "dbx-study-lab-v1";
const DIA = 86400000;
const HOY = () => new Date().toISOString().slice(0, 10);
const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const icono = (n, clase = "i") => `<svg class="${clase}" aria-hidden="true"><use href="../ui/icons.svg#${n}"></use></svg>`;

/* ================= Estado ================= */
const vacio = () => ({
  tarjetas: {},          // idTarjeta -> {ease, intervalo, due, reps, lapses, vista}
  lecciones: {},         // cursoId -> { n: {hecha, fecha} }
  gotchasPropios: [], gotchasOcultos: [], snippetsPropios: [], tarjetasPropias: [],
  historial: {},         // fecha -> {vistas, buenas}
  examenes: [],
  ultimo: null,          // {curso, leccion} para "seguir donde quede"
  tema: "dia"
});
let S = cargar();

function cargar() {
  try {
    const raw = localStorage.getItem(CLAVE);
    return raw ? Object.assign(vacio(), JSON.parse(raw)) : vacio();
  } catch (e) { console.warn("No se pudo leer el avance", e); return vacio(); }
}
function guardar() {
  try { localStorage.setItem(CLAVE, JSON.stringify(S)); }
  catch (e) { aviso("No se pudo guardar el avance"); }
}

/* ================= Cuadernos en IndexedDB ================= */
const DB = { conn: null };
function db() {
  if (DB.conn) return DB.conn;
  DB.conn = new Promise((ok, fail) => {
    const req = indexedDB.open("study-lab", 1);
    req.onupgradeneeded = () => req.result.createObjectStore("notas");
    req.onsuccess = () => ok(req.result);
    req.onerror = () => fail(req.error);
  });
  return DB.conn;
}
async function leerNota(clave) {
  try {
    const d = await db();
    return await new Promise((ok) => {
      const r = d.transaction("notas").objectStore("notas").get(clave);
      r.onsuccess = () => ok(r.result || null);
      r.onerror = () => ok(null);
    });
  } catch { return null; }
}
async function escribirNota(clave, valor) {
  const d = await db();
  return new Promise((ok, fail) => {
    const tx = d.transaction("notas", "readwrite");
    tx.objectStore("notas").put(valor, clave);
    tx.oncomplete = ok; tx.onerror = () => fail(tx.error);
  });
}
async function clavesNotas() {
  try {
    const d = await db();
    return await new Promise((ok) => {
      const r = d.transaction("notas").objectStore("notas").getAllKeys();
      r.onsuccess = () => ok(r.result || []);
      r.onerror = () => ok([]);
    });
  } catch { return []; }
}
let NOTAS_CON_TEXTO = new Set();
async function refrescarClaves() { NOTAS_CON_TEXTO = new Set(await clavesNotas()); }

/* ================= Datos combinados ================= */
const todasTarjetas = () => [...SEED.tarjetas, ...S.tarjetasPropias];
const todosGotchas = () => [...SEED.gotchas.filter(g => !S.gotchasOcultos.includes(g.id)), ...S.gotchasPropios];
const todosSnippets = () => [...SEED.snippets, ...S.snippetsPropios];
const curso = (id) => SEED.cursos.find(c => c.id === id);
const estadoLeccion = (cid, n) => (S.lecciones[cid] || {})[n] || {};
function vistasCurso(cid) {
  const c = curso(cid);
  return Object.values(S.lecciones[cid] || {}).filter(l => l.hecha).length;
}

/* ================= SM-2 ================= */
function prog(id) {
  return S.tarjetas[id] || { ease: 2.5, intervalo: 0, due: null, reps: 0, lapses: 0, vista: false };
}
function proximo(p, grado) {
  const n = { ...p };
  if (grado < 3) {
    n.reps = 0; n.intervalo = 0; n.lapses = (n.lapses || 0) + 1;
    n.ease = Math.max(1.3, n.ease - 0.2);
    n.due = new Date(Date.now() + 10 * 60000).toISOString();
  } else {
    n.reps = (n.reps || 0) + 1;
    n.ease = Math.max(1.3, n.ease + (0.1 - (5 - grado) * (0.08 + (5 - grado) * 0.02)));
    if (n.reps === 1) n.intervalo = grado === 5 ? 3 : 1;
    else if (n.reps === 2) n.intervalo = grado === 5 ? 7 : 4;
    else n.intervalo = Math.round(n.intervalo * n.ease * (grado === 3 ? 0.8 : 1));
    n.intervalo = Math.max(1, n.intervalo);
    n.due = new Date(Date.now() + n.intervalo * DIA).toISOString();
  }
  n.vista = true;
  return n;
}
function cuando(p, grado) {
  const n = proximo(p, grado);
  if (grado < 3) return "10 min";
  if (n.intervalo === 1) return "1 dia";
  if (n.intervalo < 30) return n.intervalo + " dias";
  return Math.round(n.intervalo / 30) + " meses";
}
const vence = (id) => { const p = prog(id); return !p.vista || !p.due || new Date(p.due) <= new Date(); };
function cola(cursoId) {
  const due = todasTarjetas().filter(c => (!cursoId || c.curso === cursoId) && vence(c.id));
  due.sort((a, b) => {
    const pa = prog(a.id), pb = prog(b.id);
    if (pa.vista !== pb.vista) return pa.vista ? -1 : 1;
    return new Date(pa.due || 0) - new Date(pb.due || 0);
  });
  return due;
}
function racha() {
  let n = 0;
  for (let i = 0; i < 400; i++) {
    const f = new Date(Date.now() - i * DIA).toISOString().slice(0, 10);
    if ((S.historial[f] || {}).vistas > 0) n++;
    else if (i > 0) break;
  }
  return n;
}

/* ================= Avisos y modal ================= */
let tAviso;
function aviso(msg) {
  $("#notice-txt").textContent = msg;
  const n = $("#notice");
  n.classList.remove("hidden");
  clearTimeout(tAviso);
  tAviso = setTimeout(() => n.classList.add("hidden"), 2400);
}
function modal(titulo, campos, alGuardar) {
  $("#modal-tit").textContent = titulo;
  $("#modal-campos").innerHTML = campos.map(c => {
    const lbl = `<label class="form-label" for="f-${c.k}">${esc(c.lbl)}</label>`;
    if (c.tipo === "textarea") return lbl + `<textarea class="field ${c.mono ? "mono" : ""}" id="f-${c.k}">${esc(c.val || "")}</textarea>`;
    if (c.tipo === "select") return lbl + `<select class="field" id="f-${c.k}">${c.ops.map(o =>
      `<option value="${esc(o)}"${o === c.val ? " selected" : ""}>${esc(o)}</option>`).join("")}</select>`;
    return lbl + `<input class="field" id="f-${c.k}" value="${esc(c.val || "")}">`;
  }).join("");
  $("#veil").classList.remove("hidden");
  $("#f-" + campos[0].k).focus();
  $("#modal-guardar").onclick = () => {
    const datos = {};
    campos.forEach(c => { datos[c.k] = $("#f-" + c.k).value.trim(); });
    alGuardar(datos); cerrarModal();
  };
  $("#modal-cancelar").onclick = cerrarModal;
}
const cerrarModal = () => $("#veil").classList.add("hidden");

/* ================= Navegacion ================= */
let vista = "cursos", cursoActual = null, leccionActual = null;
const pintores = {};
function ir(v, opciones = {}) {
  vista = v;
  const raiz = { curso: "cursos", cuaderno: "cursos" }[v] || v;
  $$(".nav-item").forEach(b => b.setAttribute("aria-current", b.dataset.view === raiz ? "page" : "false"));
  $$(".view").forEach(s => { s.classList.add("hidden"); s.classList.remove("entra"); });
  const seccion = $("#view-" + v);
  seccion.classList.remove("hidden");
  pintores[v](opciones);
  void seccion.offsetWidth;          // reinicia la animacion de entrada
  seccion.classList.add("entra");
  window.scrollTo({ top: 0 });
}

/* ================= Cursos ================= */
pintores.cursos = function () {
  const cs = todasTarjetas();
  const pendientes = cola("");
  const dominadas = cs.filter(c => prog(c.id).intervalo >= 7).length;
  const totalLecc = SEED.cursos.reduce((a, c) => a + c.lecciones, 0);
  const vistas = SEED.cursos.reduce((a, c) => a + vistasCurso(c.id), 0);
  const h = S.historial[HOY()] || { vistas: 0, buenas: 0 };

  $("#hero-line").innerHTML = pendientes.length
    ? `<em>${pendientes.length}</em> tarjetas te esperan`
    : `Vas <em>${Math.round(vistas / totalLecc * 100)}%</em> del festival`;
  $("#hero-note").textContent = `${vistas} de ${totalLecc} lecciones vistas en las tres rutas. ` +
    (pendientes.length ? "Baja la cola de repaso y sigue con la leccion del dia." : "Nada pendiente de repaso: sigue avanzando en las lecciones.");
  $("#btn-repasar").classList.toggle("hidden", pendientes.length === 0);
  const ult = S.ultimo && curso(S.ultimo.curso);
  $("#btn-seguir").classList.toggle("hidden", !ult);
  if (ult) $("#btn-seguir").textContent = `Seguir en ${S.ultimo.curso}`;

  $("#stats").innerHTML = [
    ["accion", vistas + "/" + totalLecc, "Lecciones vistas"],
    ["dato", pendientes.length, "Repaso pendiente"],
    ["ok", dominadas + "/" + cs.length, "Tarjetas dominadas"],
    ["", h.vistas, "Repasadas hoy"]
  ].map(([tono, val, key]) =>
    `<div class="stat"><span class="stat-val"${tono ? ` data-tono="${tono}"` : ""}>${val}</span>
     <span class="stat-key">${key}</span></div>`).join("");

  const rutas = {};
  SEED.cursos.forEach(c => (rutas[c.ruta] = rutas[c.ruta] || []).push(c));
  $("#rutas").innerHTML = Object.entries(rutas).map(([ruta, cursos], i) => {
    const lecc = cursos.reduce((a, c) => a + c.lecciones, 0);
    const hechas = cursos.reduce((a, c) => a + vistasCurso(c.id), 0);
    return `<section class="ruta">
      <div class="ruta-head">
        <span class="ruta-marca" data-ruta="${i}"></span>
        <h2 class="t-title">${esc(ruta)}</h2>
        <span class="ruta-cuenta">${hechas} de ${lecc} lecciones</span>
      </div>
      <div class="cursos-grid">${cursos.map(c => {
        const v = vistasCurso(c.id);
        const pct = Math.round(v / c.lecciones * 100);
        const tarjetas = todasTarjetas().filter(t => t.curso === c.id).length;
        return `<button class="curso-card" data-curso="${c.id}">
          <span class="curso-id">${c.id}</span>
          <span class="curso-nombre">${esc(c.nombre)}</span>
          <span class="meter" data-tono="${pct === 100 ? "" : "accion"}"><i style="width:${pct}%"></i></span>
          <span class="curso-pie">
            <span>${v}/${c.lecciones} lecciones</span>
            <span>${tarjetas ? tarjetas + " tarjetas" : "sin tarjetas"}</span>
          </span>
        </button>`;
      }).join("")}</div>
    </section>`;
  }).join("");
  $$("#rutas [data-curso]").forEach(b => b.onclick = () => ir("curso", { curso: b.dataset.curso }));

  $("#streak").textContent = racha();
  const cuenta = $("#count-due");
  cuenta.textContent = pendientes.length;
  cuenta.dataset.cero = pendientes.length ? "0" : "1";
};

/* ================= Curso ================= */
pintores.curso = function ({ curso: cid } = {}) {
  cursoActual = cid || cursoActual;
  const c = curso(cursoActual);
  const v = vistasCurso(c.id);
  $("#curso-nombre").textContent = `${c.id} ${c.nombre}`;
  $("#curso-sub").textContent = `${c.ruta} · ${v} de ${c.lecciones} lecciones vistas`;
  $("#curso-link").href = c.url;
  $("#curso-meter").style.width = Math.round(v / c.lecciones * 100) + "%";

  const temario = c.temario.length ? c.temario
    : Array.from({ length: c.lecciones }, (_, i) => ({ n: i + 1, titulo: `Leccion ${i + 1}`, tipo: "", url: c.url }));
  $("#curso-nota").textContent = c.temario.length ? ""
    : "Los titulos reales de este curso se llenan cuando lo empieces; el cuaderno de cada leccion ya funciona.";

  $("#lecciones").innerHTML = temario.map(l => {
    const e = estadoLeccion(c.id, l.n);
    const conNota = NOTAS_CON_TEXTO.has(`${c.id}:${l.n}`);
    return `<button class="leccion" data-n="${l.n}" data-hecha="${e.hecha ? 1 : 0}">
      <span class="leccion-n">${e.hecha ? "" : String(l.n).padStart(2, "0")}${e.hecha ? icono("ic-listo") : ""}</span>
      <span>
        <span class="leccion-txt">${esc(l.titulo)}</span>
        ${l.tipo ? `<span class="leccion-tipo" style="margin-left:var(--s3)">${esc(l.tipo)}</span>` : ""}
      </span>
      <span class="leccion-marcas">
        ${conNota ? `<span class="nota-marca">${icono("ic-cuaderno")} con notas</span>` : ""}
        ${icono("ic-flecha")}
      </span>
    </button>`;
  }).join("");
  $$("#lecciones .leccion").forEach(b => b.onclick = () => ir("cuaderno", { curso: c.id, leccion: +b.dataset.n }));
};

/* ================= Cuaderno ================= */
let guardarTimer = null, notaClave = null;
pintores.cuaderno = async function ({ curso: cid, leccion } = {}) {
  cursoActual = cid || cursoActual;
  leccionActual = leccion || leccionActual;
  const c = curso(cursoActual);
  const l = (c.temario.find(x => x.n === leccionActual)) || { n: leccionActual, titulo: `Leccion ${leccionActual}`, url: c.url, tipo: "" };
  notaClave = `${c.id}:${l.n}`;
  S.ultimo = { curso: c.id, leccion: l.n };
  guardar();

  $("#nota-titulo").textContent = l.titulo;
  $("#nota-sub").textContent = `${c.id} ${c.nombre}${l.tipo ? " · " + l.tipo : ""}`;
  $("#volver-curso-txt").textContent = `Volver a ${c.id}`;
  const link = $("#nota-link");
  link.href = l.url; link.classList.remove("hidden");
  marcarBotonHecha();

  const nota = await leerNota(notaClave);
  const canvas = $("#canvas");
  canvas.innerHTML = nota ? nota.html : "";
  $("#guardado").textContent = nota ? "Guardado " + hace(nota.ts) : "Sin notas todavia";
};
function marcarBotonHecha() {
  const e = estadoLeccion(cursoActual, leccionActual);
  const b = $("#btn-hecha");
  b.textContent = e.hecha ? "Vista" : "Marcar como vista";
  b.classList.toggle("btn-key", !e.hecha);
  b.classList.toggle("btn-quiet", !!e.hecha);
}
function hace(ts) {
  const m = Math.round((Date.now() - ts) / 60000);
  if (m < 1) return "recien";
  if (m < 60) return `hace ${m} min`;
  const h = Math.round(m / 60);
  return h < 24 ? `hace ${h} h` : `el ${new Date(ts).toISOString().slice(0, 10)}`;
}
function programarGuardado() {
  $("#guardado").textContent = "Escribiendo";
  clearTimeout(guardarTimer);
  guardarTimer = setTimeout(async () => {
    const html = $("#canvas").innerHTML;
    await escribirNota(notaClave, { html, ts: Date.now() });
    NOTAS_CON_TEXTO.add(notaClave);
    $("#guardado").textContent = "Guardado recien";
  }, 700);
}
function comprimirImagen(file, max = 1400) {
  return new Promise((ok) => {
    const fr = new FileReader();
    fr.onload = () => {
      const img = new Image();
      img.onload = () => {
        const escala = Math.min(1, max / Math.max(img.width, img.height));
        const cv = document.createElement("canvas");
        cv.width = Math.round(img.width * escala);
        cv.height = Math.round(img.height * escala);
        cv.getContext("2d").drawImage(img, 0, 0, cv.width, cv.height);
        ok(cv.toDataURL("image/jpeg", 0.82));
      };
      img.src = fr.result;
    };
    fr.readAsDataURL(file);
  });
}
async function insertarImagen(file) {
  const src = await comprimirImagen(file);
  document.execCommand("insertHTML", false, `<img src="${src}" alt="">`);
  programarGuardado();
}

/* ================= Repaso ================= */
let actual = null, mostrada = false, filtro = "";
pintores.repaso = function () {
  const sel = $("#filtro-curso");
  if (!sel.options.length) {
    const cursos = [...new Set(todasTarjetas().map(c => c.curso))];
    sel.innerHTML = `<option value="">Todos los cursos</option>` +
      cursos.map(id => `<option value="${id}">${id} ${esc(curso(id).nombre)}</option>`).join("");
    sel.onchange = () => { filtro = sel.value; actual = null; pintores.repaso(); };
  }
  const q = cola(filtro);
  $("#repaso-vacio").classList.toggle("hidden", q.length > 0);
  $("#study").classList.toggle("hidden", q.length === 0);
  if (!q.length) { $("#repaso-sub").textContent = "Cola vacia"; return; }

  if (!actual || !q.some(c => c.id === actual.id)) actual = q[0];
  const p = prog(actual.id);
  mostrada = false;
  $("#repaso-sub").textContent = `${q.length} en cola · ${curso(actual.curso).nombre}`;
  $("#card-tema").textContent = actual.tema || "";
  $("#card-estado").textContent = p.vista ? `repaso ${p.reps} · ease ${p.ease.toFixed(2)}` : "nueva";
  $("#card-q").textContent = actual.frente;
  $("#card-a").textContent = actual.reverso;
  $("#card-a").classList.add("hidden");
  $("#grades").classList.add("hidden");
  $("#btn-mostrar").classList.remove("hidden");
  [0, 3, 4, 5].forEach(g => { $("#when-" + g).textContent = cuando(p, g); });
  $("#queue").innerHTML = q.slice(0, 12).map((c, i) => `
    <div class="queue-item" data-act="${c.id === actual.id ? 1 : 0}">
      <span class="queue-n">${String(i + 1).padStart(2, "0")}</span>
      <span>${esc(c.frente.slice(0, 54))}</span></div>`).join("");
};
function mostrar() {
  if (!actual || mostrada) return;
  mostrada = true;
  $("#card-a").classList.remove("hidden");
  $("#grades").classList.remove("hidden");
  $("#btn-mostrar").classList.add("hidden");
}
function calificar(g) {
  if (!actual || !mostrada) return;
  S.tarjetas[actual.id] = proximo(prog(actual.id), g);
  const f = HOY();
  const h = S.historial[f] = S.historial[f] || { vistas: 0, buenas: 0 };
  h.vistas++; if (g >= 3) h.buenas++;
  guardar();
  actual = null;
  pintores.repaso();
  const pend = cola("").length;
  const cuenta = $("#count-due");
  cuenta.textContent = pend;
  cuenta.dataset.cero = pend ? "0" : "1";
  $("#streak").textContent = racha();
}

/* ================= Gotchas ================= */
pintores.gotchas = function () {
  const f = ($("#buscar-gotcha").value || "").toLowerCase();
  const lista = todosGotchas().filter(g => !f || (g.titulo + g.texto + (g.tags || []).join(" ")).toLowerCase().includes(f));
  $("#notes").innerHTML = lista.map(g => `
    <article class="note">
      <div class="note-head">${icono("ic-gotcha")}<h3 class="note-title">${esc(g.titulo)}</h3></div>
      <p class="note-body">${esc(g.texto)}</p>
      <div class="chips">${(g.tags || []).map(t => `<span class="chip">${esc(t)}</span>`).join("")}
        <span class="chip">${esc(g.curso || "general")}</span></div>
      <div class="note-acts">
        <button class="act" data-ed="${g.id}">${icono("ic-editar")} Editar</button>
        <button class="act" data-del="${g.id}">${icono("ic-quitar")} Quitar</button>
        <button class="act" data-card="${g.id}">${icono("ic-tarjeta-mas")} A tarjeta</button>
      </div>
    </article>`).join("") || `<p class="t-hint">Sin resultados para esa busqueda.</p>`;

  $$("#notes [data-del]").forEach(b => b.onclick = () => {
    const id = b.dataset.del;
    S.gotchasPropios = S.gotchasPropios.filter(x => x.id !== id);
    if (!S.gotchasOcultos.includes(id)) S.gotchasOcultos.push(id);
    guardar(); pintores.gotchas(); aviso("Gotcha quitado");
  });
  $$("#notes [data-ed]").forEach(b => b.onclick = () => editarGotcha(todosGotchas().find(g => g.id === b.dataset.ed)));
  $$("#notes [data-card]").forEach(b => b.onclick = () => {
    const g = todosGotchas().find(x => x.id === b.dataset.card);
    crearTarjeta(g.titulo, g.texto, g.curso || "1.1", "Gotchas");
  });
};
function editarGotcha(g) {
  modal(g ? "Editar gotcha" : "Nuevo gotcha", [
    { k: "titulo", lbl: "Titulo", val: g?.titulo },
    { k: "texto", lbl: "Detalle", tipo: "textarea", val: g?.texto },
    { k: "curso", lbl: "Curso", tipo: "select", ops: SEED.cursos.map(c => c.id), val: g?.curso || "1.1" },
    { k: "tags", lbl: "Etiquetas separadas por coma", val: (g?.tags || []).join(", ") }
  ], (d) => {
    const obj = { id: g?.id || "u" + Date.now(), titulo: d.titulo, texto: d.texto, curso: d.curso,
      tags: d.tags ? d.tags.split(",").map(t => t.trim()).filter(Boolean) : [] };
    const i = S.gotchasPropios.findIndex(x => x.id === obj.id);
    if (i >= 0) S.gotchasPropios[i] = obj;
    else {
      S.gotchasPropios.push(obj);
      if (g && SEED.gotchas.some(x => x.id === g.id) && !S.gotchasOcultos.includes(g.id)) S.gotchasOcultos.push(g.id);
    }
    guardar(); pintores.gotchas(); aviso("Guardado");
  });
}
function crearTarjeta(frente, reverso, cursoId, tema) {
  modal("Nueva tarjeta", [
    { k: "frente", lbl: "Pregunta", val: frente },
    { k: "reverso", lbl: "Respuesta", tipo: "textarea", val: reverso },
    { k: "curso", lbl: "Curso", tipo: "select", ops: SEED.cursos.map(c => c.id), val: cursoId },
    { k: "tema", lbl: "Tema", val: tema || "Notas" }
  ], (d) => {
    S.tarjetasPropias.push({ id: "u" + Date.now(), curso: d.curso, tema: d.tema, frente: d.frente, reverso: d.reverso });
    guardar();
    const pend = cola("").length;
    $("#count-due").textContent = pend;
    $("#count-due").dataset.cero = pend ? "0" : "1";
    aviso("Tarjeta creada, ya esta en la cola");
  });
}

/* ================= Cheatsheets ================= */
pintores.snippets = function () {
  const f = ($("#buscar-snippet").value || "").toLowerCase();
  const lista = todosSnippets().filter(s => !f || (s.titulo + s.codigo).toLowerCase().includes(f));
  $("#sheets").innerHTML = lista.map(s => `
    <article class="sheet">
      <div class="sheet-head">
        <span><span class="sheet-name">${esc(s.titulo)}</span><span class="sheet-lang">${esc(s.lenguaje)}</span></span>
        <button class="act" data-copy="${s.id}">${icono("ic-copiar")} Copiar</button>
      </div>
      <pre><code>${esc(s.codigo)}</code></pre>
    </article>`).join("") || `<p class="t-hint">Sin resultados para esa busqueda.</p>`;
  $$("#sheets [data-copy]").forEach(b => b.onclick = async () => {
    const s = todosSnippets().find(x => x.id === b.dataset.copy);
    try { await navigator.clipboard.writeText(s.codigo); aviso("Copiado al portapapeles"); }
    catch { aviso("El navegador bloqueo el portapapeles"); }
  });
};

/* ================= Simulacro ================= */
let sim = null;
const LETRAS = ["A", "B", "C", "D", "E"];
pintores.examen = function () {
  const ex = SEED.examenes[0];
  if (!sim) {
    $("#examen-sub").textContent = `${ex.nombre}: ${ex.preguntasReales} preguntas en ${ex.minutos} minutos. Aqui practicas con ${ex.preguntas.length}.`;
    const hist = S.examenes.slice(-5).reverse();
    $("#examen-body").innerHTML = `
      <div class="stats" style="margin-top:0">${ex.temas.map(t =>
        `<div class="stat"><span class="stat-val" data-tono="accion">${t.peso}<span style="font-size:1rem">%</span></span>
         <span class="stat-key">${esc(t.nombre)}</span></div>`).join("")}</div>
      ${hist.length ? `<h2 class="t-title" style="margin-bottom:var(--s4)">Intentos</h2>
        <div class="rows">${hist.map(h => `<div class="rows-row"><span>${h.fecha}</span>
        <span class="rows-val">${h.score}%</span></div>`).join("")}</div>`
        : `<p class="t-hint">Todavia no hiciste ninguno. El umbral tipico de aprobacion esta cerca del 70%.</p>`}`;
    return;
  }
  const { preguntas, respuestas, enviado } = sim;
  $("#examen-body").innerHTML = `<div class="quiz">` + preguntas.map((p, i) => {
    const r = respuestas[i];
    return `<section class="q">
      <div class="q-meta"><span class="t-label t-num">${String(i + 1).padStart(2, "0")} / ${preguntas.length}</span>
        <span class="t-meta">${esc(p.tema)}</span></div>
      <p class="q-text">${esc(p.texto)}</p>
      <div class="opts">${p.opciones.map((o, j) => {
        let estado = "";
        if (enviado) { if (j === p.correcta) estado = "ok"; else if (j === r) estado = "mal"; }
        else if (j === r) estado = "sel";
        return `<button class="opt" data-estado="${estado}" data-p="${i}" data-o="${j}"${enviado ? " disabled" : ""}>
          <span class="opt-key">${LETRAS[j]}</span><span>${esc(o)}</span></button>`;
      }).join("")}</div>
      ${enviado ? `<p class="why">${esc(p.explicacion)}</p>` : ""}
    </section>`;
  }).join("") + `</div>` + (enviado ? resultado() :
    `<button class="btn btn-key" id="btn-enviar" style="margin-top:var(--s6)">Calificar simulacro</button>`);

  if (!enviado) {
    $$("#examen-body .opt").forEach(b => b.onclick = () => { sim.respuestas[+b.dataset.p] = +b.dataset.o; pintores.examen(); });
    $("#btn-enviar").onclick = calificarExamen;
  } else {
    $("#btn-otro").onclick = () => { sim = null; pintores.examen(); };
  }
};
function resultado() {
  const porTema = {};
  sim.preguntas.forEach((p, i) => {
    const t = porTema[p.tema] = porTema[p.tema] || { tot: 0, ok: 0 };
    t.tot++; if (sim.respuestas[i] === p.correcta) t.ok++;
  });
  return `<section style="margin-top:var(--s10)">
    <div class="score-line">
      <span class="score-val">${sim.score}%</span>
      <p class="t-hint" style="margin:0">${sim.score >= 70
        ? "Por encima del umbral tipico de aprobacion. Repasa igual los temas flojos."
        : "Por debajo del umbral tipico. Los temas de abajo son los que hay que repasar."}</p>
    </div>
    <div class="rows">${Object.entries(porTema).map(([n, t]) => `
      <div class="rows-row"><span>${esc(n)}</span><span class="rows-val">${t.ok}/${t.tot}</span>
      <span class="meter" data-tono="${t.ok === t.tot ? "" : "accion"}"><i style="width:${Math.round(t.ok / t.tot * 100)}%"></i></span>
      </div>`).join("")}</div>
    <button class="btn" id="btn-otro" style="margin-top:var(--s6)">Otro simulacro</button>
  </section>`;
}
function calificarExamen() {
  let ok = 0;
  sim.preguntas.forEach((p, i) => { if (sim.respuestas[i] === p.correcta) ok++; });
  sim.score = Math.round(ok / sim.preguntas.length * 100);
  sim.enviado = true;
  S.examenes.push({ fecha: HOY(), score: sim.score });
  guardar(); pintores.examen();
}

/* ================= Respaldo ================= */
async function exportar() {
  const notas = {};
  for (const k of await clavesNotas()) notas[k] = await leerNota(k);
  const blob = new Blob([JSON.stringify({ ...S, _notas: notas }, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `study-lab-${HOY()}.json`;
  a.click(); URL.revokeObjectURL(a.href);
  aviso("Respaldo descargado, cuadernos incluidos");
}
function importar(file) {
  const fr = new FileReader();
  fr.onload = async () => {
    try {
      const datos = JSON.parse(fr.result);
      const notas = datos._notas || {};
      delete datos._notas;
      S = Object.assign(vacio(), datos);
      guardar();
      for (const [k, v] of Object.entries(notas)) await escribirNota(k, v);
      await refrescarClaves();
      aplicarTema(); ir("cursos"); aviso("Datos importados");
    } catch { aviso("El archivo no es valido"); }
  };
  fr.readAsText(file);
}

/* ================= Tema ================= */
function aplicarTema() {
  const noche = S.tema === "noche";
  document.documentElement.dataset.tema = noche ? "noche" : "dia";
  document.querySelector('meta[name="theme-color"]').content = noche ? "#130918" : "#ece2d0";
}

/* ================= Enlaces ================= */
$$(".nav-item").forEach(b => b.onclick = () => ir(b.dataset.view));
$$("[data-volver]").forEach(b => b.onclick = () => ir(b.dataset.volver));
$("#volver-curso").onclick = () => ir("curso", { curso: cursoActual });
$("#btn-repasar").onclick = () => ir("repaso");
$("#btn-seguir").onclick = () => S.ultimo && ir("cuaderno", { curso: S.ultimo.curso, leccion: S.ultimo.leccion });
$("#btn-mostrar").onclick = mostrar;
$$(".grade").forEach(b => b.onclick = () => calificar(+b.dataset.g));
$("#btn-adelantar").onclick = () => {
  todasTarjetas().filter(c => !vence(c.id))
    .sort((a, b) => new Date(prog(a.id).due) - new Date(prog(b.id).due)).slice(0, 10)
    .forEach(c => { S.tarjetas[c.id].due = new Date().toISOString(); });
  guardar(); pintores.repaso(); aviso("10 tarjetas adelantadas");
};
$("#btn-nuevo-gotcha").onclick = () => editarGotcha(null);
$("#buscar-gotcha").oninput = pintores.gotchas;
$("#buscar-snippet").oninput = pintores.snippets;
$("#btn-nuevo-snippet").onclick = () => modal("Nuevo snippet", [
  { k: "titulo", lbl: "Titulo" },
  { k: "lenguaje", lbl: "Lenguaje", tipo: "select", ops: ["sql", "python", "bash"] },
  { k: "codigo", lbl: "Codigo", tipo: "textarea", mono: true }
], (d) => {
  S.snippetsPropios.push({ id: "u" + Date.now(), curso: "1.1", titulo: d.titulo, lenguaje: d.lenguaje, codigo: d.codigo });
  guardar(); pintores.snippets(); aviso("Snippet guardado");
});
$("#btn-examen").onclick = () => {
  sim = { preguntas: [...SEED.examenes[0].preguntas].sort(() => Math.random() - 0.5), respuestas: {}, enviado: false, score: 0 };
  pintores.examen();
};
$("#btn-export").onclick = exportar;
$("#btn-import").onclick = () => $("#file-import").click();
$("#file-import").onchange = (e) => e.target.files[0] && importar(e.target.files[0]);
$("#btn-tema").onclick = () => { S.tema = S.tema === "noche" ? "dia" : "noche"; guardar(); aplicarTema(); };
$("#veil").onclick = (e) => { if (e.target.id === "veil") cerrarModal(); };

/* --- Cuaderno: barra, imagenes y guardado --- */
$$("#barra [data-cmd]").forEach(b => b.onclick = () => {
  $("#canvas").focus();
  document.execCommand(b.dataset.cmd, false, null);
  programarGuardado();
});
$$("#barra [data-bloque]").forEach(b => b.onclick = () => {
  $("#canvas").focus();
  document.execCommand("formatBlock", false, b.dataset.bloque);
  programarGuardado();
});
$("#btn-linea").onclick = () => { $("#canvas").focus(); document.execCommand("insertHorizontalRule"); programarGuardado(); };
$("#btn-imagen").onclick = () => $("#file-img").click();
$("#file-img").onchange = (e) => { if (e.target.files[0]) { $("#canvas").focus(); insertarImagen(e.target.files[0]); } e.target.value = ""; };
$("#btn-a-tarjeta").onclick = () => {
  const txt = String(window.getSelection() || "").trim();
  if (!txt) return aviso("Selecciona primero el texto de la respuesta");
  const l = (curso(cursoActual).temario.find(x => x.n === leccionActual) || {}).titulo || `Leccion ${leccionActual}`;
  crearTarjeta("", txt, cursoActual, l.slice(0, 40));
};
$("#btn-hecha").onclick = () => {
  const cid = cursoActual, n = leccionActual;
  S.lecciones[cid] = S.lecciones[cid] || {};
  const e = S.lecciones[cid][n];
  if (e && e.hecha) delete S.lecciones[cid][n];
  else S.lecciones[cid][n] = { hecha: true, fecha: HOY() };
  guardar(); marcarBotonHecha();
  aviso(S.lecciones[cid][n] ? "Leccion marcada como vista" : "Marca quitada");
};
const canvas = $("#canvas");
canvas.addEventListener("input", programarGuardado);
canvas.addEventListener("paste", (e) => {
  const item = [...(e.clipboardData?.items || [])].find(i => i.type.startsWith("image/"));
  if (item) { e.preventDefault(); insertarImagen(item.getAsFile()); return; }
  e.preventDefault();
  document.execCommand("insertText", false, e.clipboardData.getData("text/plain"));
  programarGuardado();
});
canvas.addEventListener("dragover", (e) => e.preventDefault());
canvas.addEventListener("drop", (e) => {
  const f = [...(e.dataTransfer?.files || [])].find(f => f.type.startsWith("image/"));
  if (f) { e.preventDefault(); insertarImagen(f); }
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !$("#veil").classList.contains("hidden")) return cerrarModal();
  if (e.target.matches("input, textarea, select") || e.target.id === "canvas") return;
  if (vista !== "repaso" || !$("#veil").classList.contains("hidden")) return;
  if (e.code === "Space" || e.key === "Enter") { e.preventDefault(); mostrada ? calificar(4) : mostrar(); }
  else if (["1", "2", "3", "4"].includes(e.key)) calificar([0, 3, 4, 5][+e.key - 1]);
});

/* ================= Arranque ================= */
aplicarTema();
refrescarClaves().then(() => ir("cursos"));

let promptInstalar = null;
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault(); promptInstalar = e;
  $("#btn-instalar").classList.remove("hidden");
});
$("#btn-instalar").onclick = async () => {
  if (!promptInstalar) return;
  promptInstalar.prompt();
  const { outcome } = await promptInstalar.userChoice;
  promptInstalar = null;
  $("#btn-instalar").classList.add("hidden");
  aviso(outcome === "accepted" ? "Instalada: busca el icono en el escritorio" : "Instalacion cancelada");
};
window.addEventListener("appinstalled", () => { $("#btn-instalar").classList.add("hidden"); aviso("App instalada"); });

if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
  navigator.serviceWorker.register("sw.js", { scope: "/" }).catch(() => {});
}
})();
