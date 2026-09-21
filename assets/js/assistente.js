/* ============================================================================
   CRIMED · assistente.js
   "Cris" — assistente virtual de triagem. Percorre a árvore de decisão
   definida em data.js (DB.triagem), classifica o risco e encaminha para o
   agendamento da especialidade indicada.
   ========================================================================= */
(function (global) {
  "use strict";

  var U = null;
  var raiz, corpo, opcoes, aberta = false, iniciada = false;

  function montar() {
    var host = document.getElementById("cris-root");
    if (!host || document.getElementById("cris-panel")) return;

    host.innerHTML =
      '<button class="fab" id="cris-fab" aria-label="Abrir assistente virtual Cris">' +
      '<span class="fab-label">Falar com a Cris</span>' +
      Icon.svg("message-dots") +
      "</button>" +
      '<section class="cris" id="cris-panel" aria-label="Assistente virtual Cris">' +
      '<header class="cris-head">' +
      '<div class="avatar">CR</div>' +
      "<div><strong>Cris</strong>" +
      '<span><span class="dot" style="background:#88C570"></span> Assistente de triagem</span></div>' +
      '<button id="cris-fechar" aria-label="Fechar assistente">' + Icon.svg("close") + "</button>" +
      "</header>" +
      '<div class="cris-body" id="cris-body"></div>' +
      '<div class="cris-opts" id="cris-opts"></div>' +
      "</section>";

    raiz = document.getElementById("cris-panel");
    corpo = document.getElementById("cris-body");
    opcoes = document.getElementById("cris-opts");

    document.getElementById("cris-fab").addEventListener("click", alternar);
    document.getElementById("cris-fechar").addEventListener("click", fechar);
  }

  function balao(html, mine) {
    var d = document.createElement("div");
    d.className = "cris-msg" + (mine ? " cris-msg-me" : "");
    d.innerHTML =
      (mine ? "" : '<div class="avatar">CR</div>') +
      '<div class="cris-bubble">' + html + "</div>";
    corpo.appendChild(d);
    corpo.scrollTop = corpo.scrollHeight;
    return d;
  }

  function digitando() {
    var d = document.createElement("div");
    d.className = "cris-msg";
    d.id = "cris-digitando";
    d.innerHTML =
      '<div class="avatar">CR</div>' +
      '<div class="cris-bubble cris-typing"><i></i><i></i><i></i></div>';
    corpo.appendChild(d);
    corpo.scrollTop = corpo.scrollHeight;
    return d;
  }

  function ir(chave, respostaUsuario) {
    var no = global.DB.triagem[chave];
    if (!no) return;

    if (respostaUsuario) balao(UI.u.esc(respostaUsuario), true);
    opcoes.innerHTML = "";

    var t = digitando();
    var espera = document.documentElement.getAttribute("data-motion") === "off" ? 60 : 620;

    setTimeout(function () {
      t.remove();
      var risco = no.risco
        ? '<span class="cris-risk risk-' + no.risco + '">' +
          Icon.svg(no.risco === "vermelho" ? "alert-triangle" : no.risco === "amarelo" ? "alert-circle" : "check-circle", "ico-sm") +
          (no.risco === "vermelho" ? "Risco alto" : no.risco === "amarelo" ? "Prioridade" : "Baixa gravidade") +
          "</span><br>"
        : "";
      balao(risco + no.texto);

      /* ação: agendar especialidade sugerida */
      if (no.acao) {
        var b = document.createElement("button");
        b.className = "btn btn-primary btn-sm mt-2";
        b.innerHTML = Icon.svg("calendar-plus") + UI.u.esc(no.acao.label);
        b.addEventListener("click", function () {
          var destino = "consultas.html?agendar=1&esp=" + encodeURIComponent(no.acao.especialidade);
          if (global.DB.sessao()) location.href = destino;
          else location.href = "acesso.html?destino=" + encodeURIComponent(destino);
        });
        corpo.lastChild.querySelector(".cris-bubble").appendChild(b);
      }

      if (no.link) {
        var a = document.createElement("a");
        a.className = "btn btn-outline btn-sm mt-2";
        a.href = no.link.href;
        a.innerHTML = Icon.svg("arrow-right") + UI.u.esc(no.link.label);
        corpo.lastChild.querySelector(".cris-bubble").appendChild(a);
      }

      corpo.scrollTop = corpo.scrollHeight;

      (no.opcoes || []).forEach(function (op) {
        var b = document.createElement("button");
        b.className = "cris-opt";
        b.textContent = op.label;
        b.addEventListener("click", function () {
          ir(op.proximo, op.label);
        });
        opcoes.appendChild(b);
      });
    }, espera);
  }

  function abrir() {
    montar();
    raiz.classList.add("is-open");
    aberta = true;
    if (!iniciada) {
      iniciada = true;
      ir("inicio");
    }
  }
  function fechar() {
    if (raiz) raiz.classList.remove("is-open");
    aberta = false;
  }
  function alternar() {
    aberta ? fechar() : abrir();
  }

  function init() {
    U = global.UI ? global.UI.u : null;
    montar();
    document.addEventListener("click", function (e) {
      var b = e.target.closest ? e.target.closest("[data-act=abrir-cris]") : null;
      if (b) {
        e.preventDefault();
        abrir();
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  global.Cris = { abrir: abrir, fechar: fechar };
})(window);
