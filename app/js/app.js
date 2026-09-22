/* Study Lab: repaso espaciado, gotchas, cheatsheets y simulacros.
   El material vive en data/seed.js. El avance personal vive en localStorage.
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

/* ---------- Estado ---------- */
const vacio = () => ({
  tarjetas: {},          // id -> {ease, intervalo, due, reps, lapses, vista}
  gotchasPropios: [],
  gotchasOcultos: [],
  snippetsPropios: [],
  tarjetasPropias: [],
  historial: {},         // fecha -> {vistas, buenas}
  examenes: [],
  tema: "noche"
});

let S = cargar();

function cargar() {
  try {
    const raw = localStorage.getItem(CLAVE);
    return raw ? Object.assign(vacio(), JSON.parse(raw)) : vacio();
  } catch (e) {
    console.warn("No se pudo leer el avance guardado", e);
    return vacio();
  }
}
function guardar() {
  try { localStorage.setItem(CLAVE, JSON.stringify(S)); }
  catch (e) { aviso("No se pudo guardar el avance"); }
}

/* ---------- Datos combinados ---------- */
const todasTarjetas = () => [...SEED.tarjetas, ...S.tarjetasPropias];
const todosGotchas = () => [...SEED.gotchas.filter(g => !S.gotchasOcultos.includes(g.id)), ...S.gotchasPropios];
const todosSnippets = () => [...SEED.snippets, ...S.snippetsPropios];
const cursoNombre = (id) => (SEED.cursos.find(c => c.id === id) || {}).nombre || id;

/* ---------- SM-2 ---------- */
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
const vence = (id) => {
  const p = prog(id);
  return !p.vista || !p.due || new Date(p.due) <= new Date();
};
function cola(curso) {
  const due = todasTarjetas().filter(c => (!curso || c.curso === curso) && vence(c.id));
  due.sort((a, b) => {
    const pa = prog(a.id), pb = prog(b.id);
    if (pa.vista !== pb.vista) return pa.vista ? -1 : 1;
    return new Date(pa.due || 0) - new Date(pb.due || 0);
  });
  return due;
}

/* ---------- Avisos y modal ---------- */
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
    const etiqueta = `<label class="form-label" for="f-${c.k}">${esc(c.lbl)}</label>`;
    if (c.tipo === "textarea") return etiqueta + `<textarea class="field ${c.mono ? "mono" : ""}" id="f-${c.k}">${esc(c.val || "")}</textarea>`;
    if (c.tipo === "select") return etiqueta + `<select class="field" id="f-${c.k}">${c.ops.map(o =>
      `<option value="${esc(o)}"${o === c.val ? " selected" : ""}>${esc(o)}</option>`).join("")}</select>`;
    return etiqueta + `<input class="field" id="f-${c.k}" value="${esc(c.val || "")}">`;
  }).join("");
  $("#veil").classList.remove("hidden");
  $("#f-" + campos[0].k).focus();
  $("#modal-guardar").onclick = () => {
    const datos = {};
    campos.forEach(c => { datos[c.k] = $("#f-" + c.k).value.trim(); });
    alGuardar(datos);
    cerrarModal();
  };
  $("#modal-cancelar").onclick = cerrarModal;
}
const cerrarModal = () => $("#veil").classList.add("hidden");

/* ---------- Navegacion ---------- */
let vista = "panel";
const pintores = {};
function ir(v) {
  vista = v;
  $$(".nav-item").forEach(b => b.setAttribute("aria-current", b.dataset.view === v ? "page" : "false"));
  $$(".view").forEach(s => s.classList.add("hidden"));
  $("#view-" + v).classList.remove("hidden");
  pintores[v]();
  document.querySelector(".main").scrollIntoView({ block: "start" });
}

/* ---------- Panel ---------- */
function racha() {
  let n = 0;
  for (let i = 0; i < 400; i++) {
    const f = new Date(Date.now() - i * DIA).toISOString().slice(0, 10);
    const h = S.historial[f];
    if (h && h.vistas > 0) n++;
    else if (i > 0) break;
  }
  return n;
}
pintores.panel = function () {
  const cs = todasTarjetas();
  const pendientes = cola("");
  const nuevas = cs.filter(c => !prog(c.id).vista).length;
  const dominadas = cs.filter(c => prog(c.id).intervalo >= 7).length;
  const pct = cs.length ? Math.round(dominadas / cs.length * 100) : 0;
  const h = S.historial[HOY()] || { vistas: 0, buenas: 0 };

  $("#today-line").innerHTML = pendientes.length
    ? `<em>${pendientes.length}</em> ${pendientes.length === 1 ? "tarjeta lista" : "tarjetas listas"} para repasar`
    : "Nada pendiente por hoy";
  $("#today-note").textContent = pendientes.length
    ? `${cs.length} tarjetas en total, ${dominadas} ya dominadas. Cinco minutos alcanzan para bajar la cola.`
    : `${dominadas} de ${cs.length} tarjetas dominadas. Las proximas vuelven solas cuando toque.`;
  $("#btn-repasar").classList.toggle("hidden", pendientes.length === 0);

  $("#fig-dominio").innerHTML = `${pct}<span class="figure-unit">%</span>`;
  $("#fig-nuevas").textContent = nuevas;
  $("#fig-hoy").textContent = h.vistas;
  $("#fig-acierto").innerHTML = `${h.vistas ? Math.round(h.buenas / h.vistas * 100) : 0}<span class="figure-unit">%</span>`;
  $("#streak").textContent = racha();
  const cuenta = $("#count-due");
  cuenta.textContent = pendientes.length;
  cuenta.dataset.cero = pendientes.length ? "0" : "1";

  // Constancia: 8 columnas de semanas, filas de lunes a domingo
  const dias = ["L", "M", "M", "J", "V", "S", "D"];
  const hoyDow = (new Date().getDay() + 6) % 7;
  const total = 7 * 8;
  const desde = new Date(Date.now() - (total - 1 - (6 - hoyDow)) * DIA);
  let celdas = "";
  for (let fila = 0; fila < 7; fila++) {
    celdas += `<span class="heat-day">${dias[fila]}</span>`;
    for (let col = 0; col < 8; col++) {
      const d = new Date(desde.getTime() + (col * 7 + fila) * DIA);
      const f = d.toISOString().slice(0, 10);
      const futuro = d > new Date();
      const v = (S.historial[f] || {}).vistas || 0;
      const n = v === 0 ? 0 : v < 5 ? 1 : v < 15 ? 2 : v < 30 ? 3 : 4;
      celdas += `<span class="heat-cell" data-n="${futuro ? 0 : n}" ${f === HOY() ? 'data-hoy="1"' : ""}
        title="${f}: ${v} repasos"></span>`;
    }
  }
  $("#heat").innerHTML = celdas;
  const mes = (d) => d.toLocaleDateString("es", { month: "long" });
  const m1 = mes(desde), m2 = mes(new Date());
  $("#heat-rango").textContent = m1 === m2 ? m1 : `${m1} a ${m2}`;

  // Dominio por tema
  const temas = {};
  cs.forEach(c => {
    const t = temas[c.tema] = temas[c.tema] || { tot: 0, dom: 0 };
    t.tot++; if (prog(c.id).intervalo >= 7) t.dom++;
  });
  $("#temas").innerHTML = Object.entries(temas).sort((a, b) => b[1].tot - a[1].tot).map(([n, t]) => `
    <div class="rows-row">
      <span class="rows-name">${esc(n)}</span>
      <span class="rows-val">${t.dom}/${t.tot}</span>
      <span class="meter"><i style="width:${Math.round(t.dom / t.tot * 100)}%"></i></span>
    </div>`).join("");

  // Cursos agrupados por ruta
  const rutas = {};
  SEED.cursos.forEach(c => (rutas[c.ruta] = rutas[c.ruta] || []).push(c));
  $("#cursos").innerHTML = Object.entries(rutas).map(([ruta, cursos]) => `
    <h3 class="t-label ruta-title">${esc(ruta)}</h3>
    <div class="rows">${cursos.map(c => {
      const propias = cs.filter(x => x.curso === c.id);
      const dom = propias.filter(x => prog(x.id).intervalo >= 7).length;
      const p = propias.length ? Math.round(dom / propias.length * 100) : 0;
      return `<div class="rows-row">
        <span class="rows-name">${c.id} ${esc(c.nombre)}</span>
        <span class="rows-val">${propias.length ? p + "%" : "sin tarjetas"}</span>
        <span class="meter" data-tono="ember"><i style="width:${p}%"></i></span>
      </div>`;
    }).join("")}</div>`).join("");
};

/* ---------- Repaso ---------- */
let actual = null, mostrada = false, filtro = "";
pintores.repaso = function () {
  const sel = $("#filtro-curso");
  if (!sel.options.length) {
    const cursos = [...new Set(todasTarjetas().map(c => c.curso))];
    sel.innerHTML = `<option value="">Todos los cursos</option>` +
      cursos.map(id => `<option value="${id}">${id} ${esc(cursoNombre(id))}</option>`).join("");
    sel.onchange = () => { filtro = sel.value; actual = null; pintores.repaso(); };
  }
  const q = cola(filtro);
  $("#repaso-vacio").classList.toggle("hidden", q.length > 0);
  $("#study").classList.toggle("hidden", q.length === 0);
  if (!q.length) { $("#repaso-sub").textContent = "Cola vacia"; return; }

  if (!actual || !q.some(c => c.id === actual.id)) actual = q[0];
  const p = prog(actual.id);
  mostrada = false;
  $("#repaso-sub").textContent = `${q.length} en cola · ${cursoNombre(actual.curso)}`;
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
      <span>${esc(c.frente.slice(0, 54))}</span>
    </div>`).join("");
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
  const pendientes = cola("").length;
  const cuenta = $("#count-due");
  cuenta.textContent = pendientes;
  cuenta.dataset.cero = pendientes ? "0" : "1";
}

/* ---------- Gotchas ---------- */
pintores.gotchas = function () {
  const f = ($("#buscar-gotcha").value || "").toLowerCase();
  const lista = todosGotchas().filter(g =>
    !f || (g.titulo + g.texto + (g.tags || []).join(" ")).toLowerCase().includes(f));
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
    S.tarjetasPropias.push({ id: "u" + Date.now(), curso: g.curso || "1.1", tema: "Gotchas", frente: g.titulo, reverso: g.texto });
    guardar(); aviso("Tarjeta creada, ya esta en la cola");
  });
};
function editarGotcha(g) {
  modal(g ? "Editar gotcha" : "Nuevo gotcha", [
    { k: "titulo", lbl: "Titulo", val: g?.titulo },
    { k: "texto", lbl: "Detalle", tipo: "textarea", val: g?.texto },
    { k: "curso", lbl: "Curso", tipo: "select", ops: SEED.cursos.map(c => c.id), val: g?.curso || "1.1" },
    { k: "tags", lbl: "Etiquetas separadas por coma", val: (g?.tags || []).join(", ") }
  ], (d) => {
    const obj = {
      id: g?.id || "u" + Date.now(), titulo: d.titulo, texto: d.texto, curso: d.curso,
      tags: d.tags ? d.tags.split(",").map(t => t.trim()).filter(Boolean) : []
    };
    const i = S.gotchasPropios.findIndex(x => x.id === obj.id);
    if (i >= 0) S.gotchasPropios[i] = obj;
    else {
      S.gotchasPropios.push(obj);
      if (g && SEED.gotchas.some(x => x.id === g.id) && !S.gotchasOcultos.includes(g.id)) S.gotchasOcultos.push(g.id);
    }
    guardar(); pintores.gotchas(); aviso("Guardado");
  });
}

/* ---------- Cheatsheets ---------- */
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

/* ---------- Simulacro ---------- */
let sim = null;
const LETRAS = ["A", "B", "C", "D", "E"];
pintores.examen = function () {
  const ex = SEED.examenes[0];
  if (!sim) {
    $("#examen-sub").textContent = `${ex.nombre}: ${ex.preguntasReales} preguntas en ${ex.minutos} minutos. Aqui practicas con ${ex.preguntas.length}.`;
    const hist = S.examenes.slice(-5).reverse();
    $("#examen-body").innerHTML = `
      <div class="panel-pair">
        <section>
          <div class="block-title"><h2 class="t-title">Pesos reales por tema</h2></div>
          <div class="rows">${ex.temas.map(t => `
            <div class="rows-row">
              <span class="rows-name">${esc(t.nombre)}</span>
              <span class="rows-val">${t.peso}%</span>
              <span class="meter" data-tono="ember"><i style="width:${t.peso * 4}%"></i></span>
            </div>`).join("")}</div>
        </section>
        <section>
          <div class="block-title"><h2 class="t-title">Intentos</h2></div>
          ${hist.length ? `<div class="rows">${hist.map(h => `
            <div class="rows-row"><span class="rows-name t-num">${h.fecha}</span>
            <span class="rows-val">${h.score}%</span></div>`).join("")}</div>`
            : `<p class="t-hint">Todavia no hiciste ninguno. El umbral tipico de aprobacion esta cerca del 70%.</p>`}
        </section>
      </div>`;
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
  return `<section style="margin-top:var(--s10);padding-top:var(--s6);border-top:1px solid var(--rule-soft)">
    <div class="score-line">
      <span class="score-val">${sim.score}<span class="figure-unit">%</span></span>
      <p class="t-hint" style="margin:0">${sim.score >= 70
        ? "Por encima del umbral tipico de aprobacion. Repasa igual los temas flojos."
        : "Por debajo del umbral tipico. Los temas de abajo son los que hay que repasar."}</p>
    </div>
    <div class="rows">${Object.entries(porTema).map(([n, t]) => `
      <div class="rows-row"><span class="rows-name">${esc(n)}</span>
      <span class="rows-val">${t.ok}/${t.tot}</span>
      <span class="meter" data-tono="${t.ok === t.tot ? "ok" : "ember"}"><i style="width:${Math.round(t.ok / t.tot * 100)}%"></i></span>
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
  guardar();
  pintores.examen();
}

/* ---------- Respaldo ---------- */
function exportar() {
  const blob = new Blob([JSON.stringify(S, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `study-lab-${HOY()}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
  aviso("Respaldo descargado");
}
function importar(file) {
  const fr = new FileReader();
  fr.onload = () => {
    try {
      S = Object.assign(vacio(), JSON.parse(fr.result));
      guardar(); aplicarTema(); ir(vista); aviso("Datos importados");
    } catch { aviso("El archivo no es valido"); }
  };
  fr.readAsText(file);
}

/* ---------- Tema ---------- */
function aplicarTema() {
  const dia = S.tema === "dia";
  document.documentElement.dataset.tema = dia ? "dia" : "noche";
  $("#tema-txt").textContent = dia ? "Tema noche" : "Tema dia";
  $("#btn-tema").querySelector("use").setAttribute("href", `../ui/icons.svg#${dia ? "ic-noche" : "ic-dia"}`);
  document.querySelector('meta[name="theme-color"]').content = dia ? "#f7f2ec" : "#221a16";
}

/* ---------- Enlaces ---------- */
$$(".nav-item").forEach(b => b.onclick = () => ir(b.dataset.view));
$("#btn-repasar").onclick = () => ir("repaso");
$("#btn-mostrar").onclick = mostrar;
$$(".grade").forEach(b => b.onclick = () => calificar(+b.dataset.g));
$("#btn-adelantar").onclick = () => {
  todasTarjetas().filter(c => !vence(c.id))
    .sort((a, b) => new Date(prog(a.id).due) - new Date(prog(b.id).due))
    .slice(0, 10)
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
$("#btn-tema").onclick = () => { S.tema = S.tema === "dia" ? "noche" : "dia"; guardar(); aplicarTema(); };
$("#veil").onclick = (e) => { if (e.target.id === "veil") cerrarModal(); };

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !$("#veil").classList.contains("hidden")) return cerrarModal();
  if (e.target.matches("input, textarea, select")) return;
  if (vista !== "repaso" || !$("#veil").classList.contains("hidden")) return;
  if (e.code === "Space" || e.key === "Enter") { e.preventDefault(); mostrada ? calificar(4) : mostrar(); }
  else if (["1", "2", "3", "4"].includes(e.key)) calificar([0, 3, 4, 5][+e.key - 1]);
});

aplicarTema();
ir("panel");

/* Instalacion como app de escritorio */
let promptInstalar = null;
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  promptInstalar = e;
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
window.addEventListener("appinstalled", () => {
  $("#btn-instalar").classList.add("hidden");
  aviso("App instalada");
});

if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
  navigator.serviceWorker.register("sw.js", { scope: "/" }).catch(() => {});
}
})();
