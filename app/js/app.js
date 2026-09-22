/* Databricks Study Lab: repaso espaciado, gotchas, cheatsheets y simulacros.
   El material vive en data/seed.js. El avance personal vive en localStorage. */
(() => {
"use strict";

const CLAVE = "dbx-study-lab-v1";
const HOY = () => new Date().toISOString().slice(0, 10);
const DIA = 86400000;
const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

/* ---------- Estado ---------- */
const vacio = () => ({
  tarjetas: {},        // id -> {ease, intervalo, due, reps, lapses, vista}
  gotchasPropios: [],
  gotchasOcultos: [],
  snippetsPropios: [],
  tarjetasPropias: [],
  historial: {},       // fecha -> {vistas, buenas}
  examenes: [],
  tema: "oscuro"
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
  catch (e) { toast("No se pudo guardar el avance"); }
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
    n.due = new Date(Date.now() + 10 * 60000).toISOString(); // 10 minutos
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
function etiquetaIntervalo(p, grado) {
  const n = proximo(p, grado);
  if (grado < 3) return "10 min";
  return n.intervalo === 1 ? "1 día" : n.intervalo < 30 ? n.intervalo + " días" : Math.round(n.intervalo / 30) + " meses";
}
const vence = (id) => {
  const p = prog(id);
  return !p.vista || !p.due || new Date(p.due) <= new Date();
};
function cola(curso) {
  const cs = todasTarjetas().filter(c => !curso || c.curso === curso);
  const due = cs.filter(c => vence(c.id));
  due.sort((a, b) => {
    const pa = prog(a.id), pb = prog(b.id);
    if (pa.vista !== pb.vista) return pa.vista ? -1 : 1;    // primero repasos, luego nuevas
    return new Date(pa.due || 0) - new Date(pb.due || 0);
  });
  return due;
}

/* ---------- Utilidades de interfaz ---------- */
let tToast;
function toast(msg) {
  const t = $("#toast");
  t.textContent = msg; t.classList.remove("hidden");
  clearTimeout(tToast); tToast = setTimeout(() => t.classList.add("hidden"), 2200);
}
function modal(titulo, campos, alGuardar) {
  $("#modal-tit").textContent = titulo;
  $("#modal-campos").innerHTML = campos.map(c => c.tipo === "textarea"
    ? `<label>${esc(c.lbl)}</label><textarea id="f-${c.k}" class="${c.mono ? "mono" : ""}">${esc(c.val || "")}</textarea>`
    : c.tipo === "select"
      ? `<label>${esc(c.lbl)}</label><select id="f-${c.k}">${c.ops.map(o => `<option value="${esc(o)}" ${o === c.val ? "selected" : ""}>${esc(o)}</option>`).join("")}</select>`
      : `<label>${esc(c.lbl)}</label><input id="f-${c.k}" value="${esc(c.val || "")}">`).join("");
  $("#modal").classList.remove("hidden");
  $("#modal-guardar").onclick = () => {
    const datos = {};
    campos.forEach(c => { datos[c.k] = $("#f-" + c.k).value.trim(); });
    alGuardar(datos);
    $("#modal").classList.add("hidden");
  };
  $("#modal-cancelar").onclick = () => $("#modal").classList.add("hidden");
}

/* ---------- Navegación ---------- */
let vista = "panel";
function ir(v) {
  vista = v;
  $$("#nav button").forEach(b => b.classList.toggle("active", b.dataset.view === v));
  $$(".view").forEach(s => s.classList.add("hidden"));
  $("#view-" + v).classList.remove("hidden");
  ({ panel: pintarPanel, repaso: pintarRepaso, gotchas: pintarGotchas, snippets: pintarSnippets, examen: pintarExamen }[v])();
}

/* ---------- Panel ---------- */
function racha() {
  let n = 0;
  for (let i = 0; ; i++) {
    const f = new Date(Date.now() - i * DIA).toISOString().slice(0, 10);
    const h = S.historial[f];
    if (h && h.vistas > 0) n++;
    else if (i > 0) break;          // el día de hoy sin repasos no corta la racha previa
    else if (i === 0) continue;
  }
  return n;
}
function pintarPanel() {
  const cs = todasTarjetas();
  const due = cs.filter(c => vence(c.id) && prog(c.id).vista).length;
  const nuevas = cs.filter(c => !prog(c.id).vista).length;
  const dominadas = cs.filter(c => prog(c.id).intervalo >= 7).length;
  const pct = cs.length ? Math.round(dominadas / cs.length * 100) : 0;
  const h = S.historial[HOY()] || { vistas: 0, buenas: 0 };

  $("#val-due").textContent = due;
  $("#val-nuevas").textContent = nuevas;
  $("#val-hoy").textContent = h.vistas;
  $("#val-acierto").textContent = "acierto " + (h.vistas ? Math.round(h.buenas / h.vistas * 100) : 0) + "%";
  $("#val-dominio").textContent = pct + "%";
  $(".ring-fg").style.strokeDashoffset = 327 - 327 * pct / 100;
  $("#streak").textContent = racha();
  $("#panel-sub").textContent = `${cs.length} tarjetas · ${todosGotchas().length} gotchas · ${todosSnippets().length} snippets`;
  const pill = $("#pill-due");
  pill.textContent = due + nuevas;
  pill.dataset.cero = due + nuevas ? "0" : "1";

  // Mapa de constancia de las últimas 8 semanas
  const celdas = [];
  for (let i = 55; i >= 0; i--) {
    const f = new Date(Date.now() - i * DIA).toISOString().slice(0, 10);
    const v = (S.historial[f] || {}).vistas || 0;
    const n = v === 0 ? 0 : v < 5 ? 1 : v < 15 ? 2 : v < 30 ? 3 : 4;
    celdas.push(`<i data-n="${n}" ${i === 0 ? 'data-hoy="1"' : ""} title="${f}: ${v} repasos"></i>`);
  }
  $("#heat").innerHTML = celdas.join("");

  // Dominio por tema
  const temas = {};
  cs.forEach(c => {
    const t = temas[c.tema] = temas[c.tema] || { tot: 0, dom: 0 };
    t.tot++; if (prog(c.id).intervalo >= 7) t.dom++;
  });
  $("#temas").innerHTML = Object.entries(temas).sort((a, b) => b[1].tot - a[1].tot).map(([n, t]) => `
    <div class="tema"><div class="tema-top"><span>${esc(n)}</span><span>${t.dom}/${t.tot}</span></div>
    <div class="bar"><i style="width:${Math.round(t.dom / t.tot * 100)}%"></i></div></div>`).join("");

  // Cursos
  $("#cursos").innerHTML = SEED.cursos.map(c => {
    const propias = cs.filter(x => x.curso === c.id);
    const dom = propias.filter(x => prog(x.id).intervalo >= 7).length;
    const p = propias.length ? Math.round(dom / propias.length * 100) : 0;
    return `<div class="curso"><b>${c.id} ${esc(c.nombre)}</b>
      <small>${propias.length ? `${propias.length} tarjetas · dominio ${p}%` : "sin tarjetas todavía"}</small>
      <div class="bar"><i style="width:${p}%"></i></div></div>`;
  }).join("");
}

/* ---------- Repaso ---------- */
let actual = null, mostrada = false, filtro = "";
function pintarRepaso() {
  const sel = $("#filtro-curso");
  if (!sel.options.length) {
    const cursos = [...new Set(todasTarjetas().map(c => c.curso))];
    sel.innerHTML = `<option value="">Todos los cursos</option>` +
      cursos.map(id => `<option value="${id}">${id} ${esc(cursoNombre(id))}</option>`).join("");
    sel.onchange = () => { filtro = sel.value; actual = null; pintarRepaso(); };
  }
  const q = cola(filtro);
  $("#repaso-vacio").classList.toggle("hidden", q.length > 0);
  $(".flash-wrap").classList.toggle("hidden", q.length === 0);
  if (!q.length) { $("#repaso-sub").textContent = "Cola vacía"; return; }

  if (!actual || !q.find(c => c.id === actual.id)) actual = q[0];
  const p = prog(actual.id);
  mostrada = false;
  $("#repaso-sub").textContent = `${q.length} en cola · ${cursoNombre(actual.curso)}`;
  $("#flash-tema").textContent = actual.tema || "";
  $("#flash-estado").textContent = p.vista ? `repaso ${p.reps} · ease ${p.ease.toFixed(2)}` : "nueva";
  $("#flash-q").textContent = actual.frente;
  $("#flash-a").textContent = actual.reverso;
  $("#flash-a").classList.add("hidden");
  $("#grades").classList.add("hidden");
  $("#btn-mostrar").classList.remove("hidden");
  [0, 3, 4, 5].forEach(g => { $("#lbl-g" + g).textContent = etiquetaIntervalo(p, g); });
  $("#queue").innerHTML = q.slice(0, 12).map((c, i) =>
    `<div class="${c.id === actual.id ? "act" : ""}">${i + 1}. ${esc(c.frente.slice(0, 52))}</div>`).join("");
}
function mostrar() {
  if (!actual || mostrada) return;
  mostrada = true;
  $("#flash-a").classList.remove("hidden");
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
  pintarRepaso();
  $("#pill-due").textContent = cola("").length;
}

/* ---------- Gotchas ---------- */
function pintarGotchas() {
  const f = ($("#buscar-gotcha").value || "").toLowerCase();
  const lista = todosGotchas().filter(g =>
    !f || (g.titulo + g.texto + (g.tags || []).join(" ")).toLowerCase().includes(f));
  $("#gotchas").innerHTML = lista.map(g => `
    <div class="gotcha">
      <h4>${esc(g.titulo)}</h4>
      <p>${esc(g.texto)}</p>
      <div class="tags">${(g.tags || []).map(t => `<span class="tag">${esc(t)}</span>`).join("")}
        <span class="tag">${esc(g.curso || "general")}</span></div>
      <div class="acciones">
        <button data-ed="${g.id}">Editar</button>
        <button data-del="${g.id}">Quitar</button>
        <button data-card="${g.id}">Convertir en tarjeta</button>
      </div>
    </div>`).join("") || `<p class="hint">Sin resultados.</p>`;

  $$("#gotchas [data-del]").forEach(b => b.onclick = () => {
    const id = b.dataset.del;
    S.gotchasPropios = S.gotchasPropios.filter(x => x.id !== id);
    if (!S.gotchasOcultos.includes(id)) S.gotchasOcultos.push(id);
    guardar(); pintarGotchas(); toast("Gotcha quitado");
  });
  $$("#gotchas [data-ed]").forEach(b => b.onclick = () => editarGotcha(todosGotchas().find(g => g.id === b.dataset.ed)));
  $$("#gotchas [data-card]").forEach(b => b.onclick = () => {
    const g = todosGotchas().find(x => x.id === b.dataset.card);
    S.tarjetasPropias.push({ id: "u" + Date.now(), curso: g.curso || "1.1", tema: "Gotchas", frente: g.titulo, reverso: g.texto });
    guardar(); toast("Tarjeta creada, entra a la cola de repaso");
  });
}
function editarGotcha(g) {
  const nuevo = !g;
  modal(nuevo ? "Nuevo gotcha" : "Editar gotcha", [
    { k: "titulo", lbl: "Título", val: g?.titulo },
    { k: "texto", lbl: "Detalle", tipo: "textarea", val: g?.texto },
    { k: "curso", lbl: "Curso", tipo: "select", ops: SEED.cursos.map(c => c.id), val: g?.curso || "1.1" },
    { k: "tags", lbl: "Etiquetas separadas por coma", val: (g?.tags || []).join(", ") }
  ], (d) => {
    const obj = { id: g?.id || "u" + Date.now(), titulo: d.titulo, texto: d.texto, curso: d.curso, tags: d.tags ? d.tags.split(",").map(t => t.trim()).filter(Boolean) : [] };
    const i = S.gotchasPropios.findIndex(x => x.id === obj.id);
    if (i >= 0) S.gotchasPropios[i] = obj;
    else {
      S.gotchasPropios.push(obj);
      if (g && SEED.gotchas.find(x => x.id === g.id) && !S.gotchasOcultos.includes(g.id)) S.gotchasOcultos.push(g.id);
    }
    guardar(); pintarGotchas(); toast("Guardado");
  });
}

/* ---------- Snippets ---------- */
function pintarSnippets() {
  const f = ($("#buscar-snippet").value || "").toLowerCase();
  const lista = todosSnippets().filter(s => !f || (s.titulo + s.codigo).toLowerCase().includes(f));
  $("#snippets").innerHTML = lista.map(s => `
    <div class="snippet">
      <div class="snippet-head">
        <span><b>${esc(s.titulo)}</b><span class="lang">${esc(s.lenguaje)}</span></span>
        <button class="ghost" data-copy="${s.id}">Copiar</button>
      </div>
      <pre><code>${esc(s.codigo)}</code></pre>
    </div>`).join("") || `<p class="hint">Sin resultados.</p>`;
  $$("#snippets [data-copy]").forEach(b => b.onclick = async () => {
    const s = todosSnippets().find(x => x.id === b.dataset.copy);
    try { await navigator.clipboard.writeText(s.codigo); toast("Copiado"); }
    catch { toast("El navegador bloqueó el portapapeles"); }
  });
}

/* ---------- Examen ---------- */
let sim = null;
function pintarExamen() {
  const ex = SEED.examenes[0];
  const hist = S.examenes.slice(-5).reverse();
  if (!sim) {
    $("#examen-sub").textContent = `${ex.nombre}: ${ex.preguntasReales} preguntas en ${ex.minutos} minutos. Aquí practicas con ${ex.preguntas.length}.`;
    $("#examen-body").innerHTML = `
      <div class="card"><h2>Pesos reales por tema</h2>
      ${ex.temas.map(t => `<div class="tema"><div class="tema-top"><span>${esc(t.nombre)}</span><span>${t.peso}%</span></div>
        <div class="bar"><i style="width:${t.peso * 4}%"></i></div></div>`).join("")}</div>
      ${hist.length ? `<div class="card" style="margin-top:14px"><h2>Intentos anteriores</h2>
        ${hist.map(h => `<div class="tema-top"><span>${h.fecha}</span><span>${h.score}%</span></div>`).join("")}</div>` : ""}`;
    return;
  }
  const { preguntas, respuestas, enviado } = sim;
  $("#examen-body").innerHTML = preguntas.map((p, i) => {
    const r = respuestas[i];
    return `<div class="pregunta">
      <div class="num">Pregunta ${i + 1} de ${preguntas.length} · ${esc(p.tema)}</div>
      <div class="txt">${esc(p.texto)}</div>
      <div class="ops">${p.opciones.map((o, j) => {
        let cls = "op";
        if (enviado) { if (j === p.correcta) cls += " ok"; else if (j === r) cls += " mal"; }
        else if (j === r) cls += " sel";
        return `<button class="${cls}" data-p="${i}" data-o="${j}" ${enviado ? "disabled" : ""}>${esc(o)}</button>`;
      }).join("")}</div>
      ${enviado ? `<div class="explica">${esc(p.explicacion)}</div>` : ""}
    </div>`;
  }).join("") + (enviado ? resultadoHtml() : `<button class="primary" id="btn-enviar">Calificar simulacro</button>`);

  if (!enviado) {
    $$("#examen-body .op").forEach(b => b.onclick = () => {
      sim.respuestas[+b.dataset.p] = +b.dataset.o;
      pintarExamen();
    });
    $("#btn-enviar").onclick = calificarExamen;
  } else {
    $("#btn-reiniciar").onclick = () => { sim = null; pintarExamen(); };
  }
}
function resultadoHtml() {
  const porTema = {};
  sim.preguntas.forEach((p, i) => {
    const t = porTema[p.tema] = porTema[p.tema] || { tot: 0, ok: 0 };
    t.tot++; if (sim.respuestas[i] === p.correcta) t.ok++;
  });
  return `<div class="card resultado">
    <div class="score">${sim.score}%</div>
    <p class="hint">${sim.score >= 70 ? "Por encima del umbral típico de aprobación." : "Por debajo del umbral típico: repasa los temas flojos."}</p>
    <div style="text-align:left;margin-top:18px">
      ${Object.entries(porTema).map(([n, t]) => `<div class="tema"><div class="tema-top"><span>${esc(n)}</span><span>${t.ok}/${t.tot}</span></div>
      <div class="bar"><i style="width:${Math.round(t.ok / t.tot * 100)}%"></i></div></div>`).join("")}
    </div>
    <button class="primary" id="btn-reiniciar" style="margin-top:18px">Otro simulacro</button>
  </div>`;
}
function calificarExamen() {
  let ok = 0;
  sim.preguntas.forEach((p, i) => { if (sim.respuestas[i] === p.correcta) ok++; });
  sim.score = Math.round(ok / sim.preguntas.length * 100);
  sim.enviado = true;
  S.examenes.push({ fecha: HOY(), score: sim.score });
  guardar();
  pintarExamen();
}
function empezarExamen() {
  const ex = SEED.examenes[0];
  const preguntas = [...ex.preguntas].sort(() => Math.random() - 0.5);
  sim = { preguntas, respuestas: {}, enviado: false, score: 0 };
  pintarExamen();
}

/* ---------- Exportar e importar ---------- */
function exportar() {
  const blob = new Blob([JSON.stringify(S, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `study-lab-${HOY()}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
  toast("Respaldo descargado");
}
function importar(file) {
  const fr = new FileReader();
  fr.onload = () => {
    try {
      S = Object.assign(vacio(), JSON.parse(fr.result));
      guardar(); aplicarTema(); ir(vista); toast("Datos importados");
    } catch { toast("El archivo no es válido"); }
  };
  fr.readAsText(file);
}

/* ---------- Tema ---------- */
function aplicarTema() {
  document.documentElement.dataset.tema = S.tema === "claro" ? "claro" : "oscuro";
  $("#btn-tema").textContent = S.tema === "claro" ? "Tema oscuro" : "Tema claro";
}

/* ---------- Arranque ---------- */
$$("#nav button").forEach(b => b.onclick = () => ir(b.dataset.view));
$("#btn-mostrar").onclick = mostrar;
$$("#grades .g").forEach(b => b.onclick = () => calificar(+b.dataset.g));
$("#btn-repasar-ya").onclick = () => ir("repaso");
$("#btn-nuevo-gotcha").onclick = () => editarGotcha(null);
$("#buscar-gotcha").oninput = pintarGotchas;
$("#buscar-snippet").oninput = pintarSnippets;
$("#btn-nuevo-snippet").onclick = () => modal("Nuevo snippet", [
  { k: "titulo", lbl: "Título" },
  { k: "lenguaje", lbl: "Lenguaje", tipo: "select", ops: ["sql", "python", "bash"] },
  { k: "codigo", lbl: "Código", tipo: "textarea", mono: true }
], (d) => {
  S.snippetsPropios.push({ id: "u" + Date.now(), curso: "1.1", titulo: d.titulo, lenguaje: d.lenguaje, codigo: d.codigo });
  guardar(); pintarSnippets(); toast("Snippet guardado");
});
$("#btn-examen").onclick = empezarExamen;
$("#btn-export").onclick = exportar;
$("#btn-import").onclick = () => $("#file-import").click();
$("#file-import").onchange = (e) => e.target.files[0] && importar(e.target.files[0]);
$("#btn-tema").onclick = () => { S.tema = S.tema === "claro" ? "oscuro" : "claro"; guardar(); aplicarTema(); };
$("#btn-adelantar").onclick = () => {
  const futuras = todasTarjetas().filter(c => !vence(c.id))
    .sort((a, b) => new Date(prog(a.id).due) - new Date(prog(b.id).due)).slice(0, 10);
  futuras.forEach(c => { S.tarjetas[c.id].due = new Date().toISOString(); });
  guardar(); pintarRepaso(); toast("10 tarjetas adelantadas");
};

document.addEventListener("keydown", (e) => {
  if (e.target.matches("input, textarea, select")) return;
  if (vista !== "repaso") return;
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
  toast(outcome === "accepted" ? "Instalada: busca el icono en el escritorio" : "Instalacion cancelada");
};
window.addEventListener("appinstalled", () => {
  $("#btn-instalar").classList.add("hidden");
  toast("App instalada");
});

if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
  navigator.serviceWorker.register("sw.js").catch(() => {});
}
})();
