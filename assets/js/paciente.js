/* ============================================================================
   CRIMED · paciente.js
   Controladores das telas do paciente: início, agendamento (sempre com
   clínico geral), consultas, prontuário, exames e receitas digitais.
   ========================================================================= */
(function (global) {
  "use strict";

  var P = {};
  var U;

  var MESES_CURTOS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
  var DIAS_CURTOS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  /* ================================================================ UTIL */

  /** Data + hora da consulta como objeto Date. */
  function momento(c) {
    return new Date(c.data + "T" + (c.hora || "00:00") + ":00");
  }

  /** A sala abre 15 min antes e fecha 90 min depois do horário marcado. */
  function janelaSala(c) {
    var t = momento(c).getTime();
    var agora = Date.now();
    return agora >= t - 15 * 60000 && agora <= t + 90 * 60000;
  }

  /** A consulta ainda vai acontecer (ou está acontecendo agora)? */
  function ehFutura(c) {
    return c.status === "Confirmada" && momento(c).getTime() + 90 * 60000 >= Date.now();
  }

  function contagem(c) {
    var ms = momento(c).getTime() - Date.now();
    if (ms <= 0) return "agora";
    var min = Math.floor(ms / 60000);
    if (min < 60) return "em " + min + " min";
    var h = Math.floor(min / 60);
    if (h < 24) return "em " + h + "h" + (min % 60 ? " " + (min % 60) + "min" : "");
    return U.quando(c.data);
  }

  /** Nome da especialidade em linguagem do dia a dia. */
  function nomeEsp(esp) {
    return esp === "Clínica Médica" ? "Clínico geral" : esp;
  }

  function badgeStatus(c) {
    var status = c.status;
    if (status === "Confirmada" && !ehFutura(c)) status = "Não compareceu";
    var mapa = {
      Confirmada: { cls: "badge-confirmada", ico: "calendar-check", txt: "Marcada" },
      Realizada: { cls: "badge-realizada", ico: "check-circle", txt: "Realizada" },
      Cancelada: { cls: "badge-cancelada", ico: "x-circle", txt: "Cancelada" },
      "Em andamento": { cls: "badge-warn", ico: "video", txt: "Em andamento" },
      "Não compareceu": { cls: "badge-cancelada", ico: "alert-circle", txt: "Não realizada" },
    };
    var m = mapa[status] || mapa.Realizada;
    return '<span class="badge ' + m.cls + '">' + Icon.svg(m.ico) + U.esc(m.txt) + "</span>";
  }

  function blocoData(isoStr) {
    var d = new Date(isoStr + "T12:00:00");
    return (
      '<div class="cc-data" aria-hidden="true">' +
      '<span class="cc-sem">' + DIAS_CURTOS[d.getDay()] + "</span>" +
      '<span class="cc-dia">' + d.getDate() + "</span>" +
      '<span class="cc-mes">' + MESES_CURTOS[d.getMonth()] + "</span></div>"
    );
  }

  /* ===================================================== AÇÕES DE CONSULTA */
  P.entrarSala = function (id) {
    location.href = "teleconsulta.html?consulta=" + id;
  };

  P.cancelar = function (id) {
    var c = global.DB.consulta(id);
    if (!c) return;
    UI.confirmar({
      titulo: "Cancelar consulta?",
      texto:
        "<strong>" + U.esc(nomeEsp(c.especialidade)) + "</strong> com " + U.esc(c.medico) +
        " em " + U.fmtData(c.data) + " às " + U.esc(c.hora) + ".<br>" +
        "O horário fica livre para outra pessoa." +
        (c.encaminhadoPor
          ? "<br><br><strong>Atenção:</strong> esta consulta foi marcada por encaminhamento. Para marcar de novo, você precisará passar pelo clínico geral."
          : ""),
      confirmar: "Sim, cancelar",
      cancelar: "Não, manter",
      danger: true,
    }).then(function (ok) {
      if (!ok) return;
      global.DB.atualizarConsulta(id, { status: "Cancelada" });
      global.DB.notificar({
        tipo: "consulta",
        titulo: "Consulta cancelada",
        texto: nomeEsp(c.especialidade) + " com " + c.medico + " em " + U.fmtData(c.data) + ".",
        link: "consultas.html",
      });
      UI.toast("Consulta cancelada.", "warn");
      UI.shell.atualizarBadge();
      P.recarregar();
    });
  };

  P.remarcar = function (id) {
    location.href = "agendar.html?remarcar=" + id;
  };

  /* ==================================================== CARTÃO DE CONSULTA */
  function cartaoConsulta(c) {
    var futura = ehFutura(c);
    var aberta = futura && janelaSala(c);
    var hoje = U.diasAte(c.data) === 0;
    var acoes = "";

    if (futura) {
      acoes =
        '<button class="btn ' + (aberta ? "btn-primary pulse" : "btn-outline") + '" data-entrar="' + c.id + '">' +
        Icon.svg("video") + (aberta ? "Entrar na consulta" : "Sala da consulta") + "</button>" +
        (c.encaminhadoPor
          ? ""
          : '<button class="btn btn-ghost" data-remarcar="' + c.id + '">' + Icon.svg("refresh") + "Remarcar</button>") +
        '<button class="btn btn-ghost btn-perigo" data-cancelar="' + c.id + '">' + Icon.svg("x-circle") + "Cancelar</button>";
    } else if (c.status === "Realizada") {
      acoes =
        '<a class="btn btn-outline" href="prontuarios.html?consulta=' + c.id + '">' +
        Icon.svg("file-medical") + "Ver o que o médico registrou</a>";
    } else {
      acoes =
        '<a class="btn btn-outline" href="agendar.html">' + Icon.svg("calendar-plus") + "Agendar nova consulta</a>";
    }

    return (
      '<article class="cc' + (hoje && futura ? " is-hoje" : "") + (futura ? "" : " is-passada") + '">' +
      '<div class="cc-topo">' +
      blocoData(c.data) +
      '<div class="cc-info">' +
      '<div class="cc-tags">' + badgeStatus(c) +
      (c.encaminhadoPor ? '<span class="badge badge-info">' + Icon.svg("arrow-up-right") + "Encaminhamento</span>" : "") +
      "</div>" +
      "<h4>" + U.esc(nomeEsp(c.especialidade)) + "</h4>" +
      '<p class="cc-med">' + U.esc(c.medico) + "</p>" +
      '<p class="cc-meta">' + Icon.svg("clock", "ico-sm") + U.esc(c.hora) +
      (hoje && futura ? ' <b class="cc-cont">· ' + contagem(c) + "</b>" : "") +
      " · " + Icon.svg("video", "ico-sm") + "Por vídeo</p>" +
      (c.encaminhadoPor
        ? '<p class="cc-enc">Encaminhado por ' + U.esc(c.encaminhadoPor) + "</p>"
        : "") +
      "</div></div>" +
      '<div class="cc-acoes">' + acoes + "</div>" +
      "</article>"
    );
  }

  function ligarAcoesConsulta(root) {
    U.qsa("[data-entrar]", root).forEach(function (b) {
      b.addEventListener("click", function () { P.entrarSala(b.getAttribute("data-entrar")); });
    });
    U.qsa("[data-cancelar]", root).forEach(function (b) {
      b.addEventListener("click", function () { P.cancelar(Number(b.getAttribute("data-cancelar"))); });
    });
    U.qsa("[data-remarcar]", root).forEach(function (b) {
      b.addEventListener("click", function () { P.remarcar(Number(b.getAttribute("data-remarcar"))); });
    });
  }

  function futurasOrdenadas() {
    return global.DB.consultas()
      .filter(ehFutura)
      .sort(function (a, b) { return momento(a) - momento(b); });
  }

  /* ====================================================== PÁGINA: INÍCIO */
  P.paginaDashboard = function () {
    var sessao = global.App.exigirSessao(["paciente"]);
    if (!sessao) return;

    UI.shell.montar({
      page: "dashboard",
      titulo: "Início",
      sub: U.diaSemana(global.DB.hoje()) + ", " + U.fmtDataLonga(global.DB.hoje()).replace(/ de \d{4}$/, ""),
    });

    var saud = document.getElementById("pac-saudacao");
    if (saud) {
      var h = new Date().getHours();
      saud.textContent =
        (h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite") + ", " + U.primeiroNome(sessao.nome) + "!";
    }

    P.recarregar = renderProxima;
    renderProxima();

    /* o relógio da próxima consulta atualiza sozinho */
    setInterval(renderProxima, 30000);

    function renderProxima() {
      var host = document.getElementById("proxima-consulta");
      if (!host) return;
      var futuras = futurasOrdenadas();
      var cont = document.getElementById("pac-qtd-consultas");
      if (cont) cont.textContent = futuras.length ? futuras.length + (futuras.length > 1 ? " marcadas" : " marcada") : "";

      if (!futuras.length) {
        host.innerHTML =
          '<div class="pac-vazio">' + Icon.svg("calendar") +
          "<div><strong>Você não tem consulta marcada.</strong>" +
          "<p>Quando marcar, ela aparece aqui.</p></div></div>";
        return;
      }

      var c = futuras[0];
      var aberta = janelaSala(c);
      var hoje = U.diasAte(c.data) === 0;
      host.innerHTML =
        '<div class="prox' + (aberta ? " is-aberta" : "") + '">' +
        '<div class="prox-quando">' +
        '<span class="prox-rotulo">' + (hoje ? "Hoje" : U.diaSemana(c.data)) + "</span>" +
        '<strong class="prox-hora">' + U.esc(c.hora) + "</strong>" +
        '<span class="prox-data">' + (hoje ? contagem(c) : U.fmtDataLonga(c.data).replace(/ de \d{4}$/, "")) + "</span>" +
        "</div>" +
        '<div class="prox-info">' +
        "<h3>" + U.esc(nomeEsp(c.especialidade)) + "</h3>" +
        "<p>" + U.esc(c.medico) + "</p>" +
        (c.encaminhadoPor ? '<p class="cc-enc">Encaminhado por ' + U.esc(c.encaminhadoPor) + "</p>" : "") +
        "</div>" +
        '<button class="btn ' + (aberta ? "btn-primary pulse" : "btn-outline") + ' btn-block btn-lg" data-entrar="' + c.id + '">' +
        Icon.svg("video") + (aberta ? "Entrar na consulta agora" : "Ver sala da consulta") + "</button>" +
        (aberta ? "" : '<p class="prox-dica">' + Icon.svg("info", "ico-sm") + " A sala abre 15 minutos antes do horário.</p>") +
        "</div>" +
        (futuras.length > 1
          ? '<a class="prox-mais" href="consultas.html">+ ' + (futuras.length - 1) +
            (futuras.length - 1 > 1 ? " outras consultas marcadas" : " outra consulta marcada") +
            Icon.svg("chevron-right", "ico-sm") + "</a>"
          : "");

      ligarAcoesConsulta(host);
    }
  };

  /* =================================================== PÁGINA: CONSULTAS */
  P.paginaConsultas = function () {
    var sessao = global.App.exigirSessao(["paciente"]);
    if (!sessao) return;

    UI.shell.montar({ page: "consultas", titulo: "Minhas consultas" });

    var aba = U.param("aba") === "anteriores" ? "anteriores" : "proximas";

    P.recarregar = render;

    U.qsa("#abas-consulta [data-aba]").forEach(function (b) {
      b.addEventListener("click", function () {
        aba = b.getAttribute("data-aba");
        render();
      });
    });

    function render() {
      var todas = global.DB.consultas();
      var proximas = todas.filter(ehFutura).sort(function (a, b) { return momento(a) - momento(b); });
      var anteriores = todas
        .filter(function (c) { return !ehFutura(c); })
        .sort(function (a, b) { return momento(b) - momento(a); });

      U.qsa("#abas-consulta [data-aba]").forEach(function (b) {
        var ativo = b.getAttribute("data-aba") === aba;
        b.classList.toggle("is-active", ativo);
        b.setAttribute("aria-selected", ativo ? "true" : "false");
      });
      var n1 = document.getElementById("qtd-proximas");
      var n2 = document.getElementById("qtd-anteriores");
      if (n1) n1.textContent = proximas.length;
      if (n2) n2.textContent = anteriores.length;

      var host = document.getElementById("lista-consultas");
      var lista = aba === "proximas" ? proximas : anteriores;
      if (!lista.length) {
        host.innerHTML =
          '<div class="pac-vazio pac-vazio-grande">' + Icon.svg(aba === "proximas" ? "calendar" : "history") +
          "<div><strong>" + (aba === "proximas" ? "Nenhuma consulta marcada" : "Nenhuma consulta anterior") + "</strong>" +
          "<p>" + (aba === "proximas"
            ? "Toque em “Agendar consulta” para marcar com o clínico geral."
            : "Suas consultas já realizadas aparecem aqui.") + "</p></div></div>" +
          (aba === "proximas"
            ? '<a class="btn btn-primary btn-lg btn-block mt-2" href="agendar.html">' + Icon.svg("calendar-plus") + "Agendar consulta</a>"
            : "");
        return;
      }
      host.innerHTML = lista.map(cartaoConsulta).join("");
      ligarAcoesConsulta(host);
    }

    render();

    /* links antigos (?agendar=1) agora levam à página de agendamento */
    if (U.param("agendar")) location.replace("agendar.html");
  };

  /* ===================================================== PÁGINA: AGENDAR */
  var MOTIVOS = [
    { id: "rotina", label: "Consulta de rotina", desc: "Check-up ou acompanhamento", ico: "clipboard" },
    { id: "sintomas", label: "Estou com sintomas", desc: "Dor, febre, mal-estar…", ico: "activity" },
    { id: "receita", label: "Renovar receita", desc: "Remédio de uso contínuo", ico: "pill" },
    { id: "exame", label: "Mostrar resultado de exame", desc: "Levar o exame ao médico", ico: "flask" },
    { id: "outro", label: "Outro motivo", desc: "Conte no campo abaixo", ico: "message" },
  ];

  P.paginaAgendar = function () {
    var sessao = global.App.exigirSessao(["paciente"]);
    if (!sessao) return;
    UI.shell.montar({ page: "agendar", titulo: "Agendar consulta", sub: "Com clínico geral, por vídeo" });

    var perfil = global.DB.perfil();
    var st = { passo: 1, motivo: "", data: "", hora: "", medicoId: "" };
    var remarcando = null;

    /* — remarcação — */
    var idRem = U.param("remarcar");
    if (idRem) {
      var cr = global.DB.consulta(idRem);
      if (cr && ehFutura(cr) && !cr.encaminhadoPor) {
        remarcando = cr;
        var av = document.getElementById("ag-remarcar");
        av.hidden = false;
        av.innerHTML =
          Icon.svg("refresh") + "<span>Você está remarcando a consulta de <strong>" +
          U.fmtData(cr.data) + " às " + U.esc(cr.hora) + "</strong>. Ela só será cancelada quando você confirmar o novo horário.</span>";
        st.motivo = (MOTIVOS.filter(function (m) { return m.label === cr.motivo; })[0] || {}).id || "";
        if (!st.motivo && cr.motivo) {
          st.motivo = "outro";
          document.getElementById("ag-detalhe").value = cr.motivo;
        }
      }
    }

    /* — motivo pré-selecionado (vindo da Cris, por exemplo) — */
    var mParam = U.param("motivo");
    if (mParam && !st.motivo) {
      var achado = MOTIVOS.filter(function (m) { return m.label === mParam || m.id === mParam; })[0];
      if (achado) st.motivo = achado.id;
    }

    /* — passo 1: motivos — */
    var hostMot = document.getElementById("ag-motivos");
    hostMot.innerHTML = MOTIVOS.map(function (m) {
      return (
        '<button type="button" class="ag-motivo" role="radio" aria-checked="false" data-motivo="' + m.id + '">' +
        '<span class="ag-motivo-ico">' + Icon.svg(m.ico) + "</span>" +
        '<span class="ag-motivo-txt"><strong>' + m.label + "</strong><small>" + m.desc + "</small></span>" +
        '<span class="ag-radio" aria-hidden="true"></span></button>'
      );
    }).join("");
    hostMot.addEventListener("click", function (e) {
      var b = e.target.closest("[data-motivo]");
      if (!b) return;
      st.motivo = b.getAttribute("data-motivo");
      marcarMotivo();
      if (st.motivo === "outro" || st.motivo === "sintomas") {
        setTimeout(function () { document.getElementById("ag-detalhe").focus(); }, 50);
      }
    });
    function marcarMotivo() {
      U.qsa("[data-motivo]", hostMot).forEach(function (b) {
        var on = b.getAttribute("data-motivo") === st.motivo;
        b.classList.toggle("is-active", on);
        b.setAttribute("aria-checked", on ? "true" : "false");
      });
    }
    marcarMotivo();

    /* — passo 2: dias e horários — */
    var clinicos = global.DB.clinicosGerais().slice().sort(function (a, b) {
      /* o clínico da UBS do paciente vem primeiro */
      return (b.unidade === perfil.unidade) - (a.unidade === perfil.unidade);
    });

    /**
     * Horários livres do dia, cada um já com o clínico que vai atender.
     * Primeiro os clínicos da UBS do paciente; os das outras unidades só
     * entram quando a própria UBS tem poucas vagas naquele dia.
     */
    function vagasDoDia(data) {
      var mapa = {};
      var daUbs = clinicos.filter(function (m) { return m.unidade === perfil.unidade; });
      var outros = clinicos.filter(function (m) { return m.unidade !== perfil.unidade; });
      function somar(lista) {
        lista.forEach(function (m) {
          global.DB.horariosLivres(m.id, data).forEach(function (h) {
            if (!mapa[h]) mapa[h] = m.id;
          });
        });
      }
      somar(daUbs);
      if (Object.keys(mapa).length < 4) somar(outros);
      return Object.keys(mapa).sort().map(function (h) { return { hora: h, medicoId: mapa[h] }; });
    }

    var dias = [];
    for (var i = 0; dias.length < 12 && i < 30; i++) {
      var dt = global.DB.dayOffset(i);
      var dow = new Date(dt + "T12:00:00").getDay();
      if (dow === 0 || dow === 6) continue;
      var vagas = vagasDoDia(dt);
      if (i === 0 && !vagas.length) continue;
      dias.push({ data: dt, vagas: vagas });
    }

    var hostDias = document.getElementById("ag-dias");
    hostDias.innerHTML = dias.map(function (d) {
      var x = new Date(d.data + "T12:00:00");
      var rot = U.diasAte(d.data) === 0 ? "Hoje" : U.diasAte(d.data) === 1 ? "Amanhã" : DIAS_CURTOS[x.getDay()];
      return (
        '<button type="button" class="ag-dia" data-dia="' + d.data + '"' + (d.vagas.length ? "" : " disabled") + ">" +
        "<small>" + rot + "</small><strong>" + x.getDate() + "</strong><span>" + MESES_CURTOS[x.getMonth()] + "</span>" +
        '<em>' + (d.vagas.length ? d.vagas.length + " vagas" : "Lotado") + "</em></button>"
      );
    }).join("");
    hostDias.addEventListener("click", function (e) {
      var b = e.target.closest("[data-dia]");
      if (!b || b.disabled) return;
      st.data = b.getAttribute("data-dia");
      st.hora = "";
      st.medicoId = "";
      renderDias();
      renderHoras();
    });

    function renderDias() {
      U.qsa("[data-dia]", hostDias).forEach(function (b) {
        var on = b.getAttribute("data-dia") === st.data;
        b.classList.toggle("is-active", on);
        b.setAttribute("aria-pressed", on ? "true" : "false");
        if (on && b.scrollIntoView) b.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
      });
    }

    function renderHoras() {
      var host = document.getElementById("ag-horas");
      var tit = document.getElementById("ag-horas-titulo");
      if (!st.data) {
        tit.hidden = true;
        host.innerHTML = "";
        return;
      }
      tit.hidden = false;
      tit.textContent = "Horários de " + U.diaSemana(st.data).toLowerCase() + ", " + U.fmtData(st.data).slice(0, 5);
      var dia = dias.filter(function (d) { return d.data === st.data; })[0];
      var vagas = dia ? dia.vagas : [];
      var manha = vagas.filter(function (v) { return v.hora < "12:00"; });
      var tarde = vagas.filter(function (v) { return v.hora >= "12:00"; });
      function grupo(titulo, ico, lista) {
        if (!lista.length) return "";
        return (
          '<div class="ag-turno"><p class="ag-turno-tit">' + Icon.svg(ico, "ico-sm") + titulo + "</p>" +
          '<div class="ag-horas">' +
          lista.map(function (v) {
            return (
              '<button type="button" class="ag-hora' + (st.hora === v.hora ? " is-active" : "") +
              '" data-hora="' + v.hora + '" data-med="' + v.medicoId + '">' + v.hora + "</button>"
            );
          }).join("") +
          "</div></div>"
        );
      }
      host.innerHTML = grupo("Manhã", "sun", manha) + grupo("Tarde", "clock", tarde);
      host.onclick = function (e) {
        var b = e.target.closest("[data-hora]");
        if (!b) return;
        st.hora = b.getAttribute("data-hora");
        st.medicoId = b.getAttribute("data-med");
        U.qsa("[data-hora]", host).forEach(function (x) { x.classList.toggle("is-active", x === b); });
        var btn = document.getElementById("ag-avancar");
        if (btn && btn.scrollIntoView && innerWidth < 1024) btn.scrollIntoView({ behavior: "smooth", block: "end" });
      };
    }

    /* — passo 3: resumo — */
    function motivoTexto() {
      var m = MOTIVOS.filter(function (x) { return x.id === st.motivo; })[0];
      var det = document.getElementById("ag-detalhe").value.trim();
      if (!m) return det;
      if (m.id === "outro") return det || m.label;
      return m.label + (det ? " — " + det : "");
    }
    function renderResumo() {
      var m = global.DB.medico(st.medicoId);
      var un = global.DB.unidade(m.unidade);
      document.getElementById("ag-resumo").innerHTML =
        '<div class="ag-resumo-data">' + Icon.svg("calendar-check") +
        "<div><strong>" + U.diaSemana(st.data) + ", " + U.fmtDataLonga(st.data).replace(/ de \d{4}$/, "") + "</strong>" +
        "<span>às " + st.hora + "</span></div></div>" +
        '<div class="resumo-linha"><span>Médico(a)</span><b>' + U.esc(m.nome) + "</b></div>" +
        '<div class="resumo-linha"><span>Tipo</span><b>Clínico geral</b></div>' +
        '<div class="resumo-linha"><span>Como será</span><b>Por vídeo, no celular ou computador</b></div>' +
        '<div class="resumo-linha"><span>Unidade</span><b>' + U.esc(un ? un.nome : "—") + "</b></div>" +
        '<div class="resumo-linha"><span>Motivo</span><b>' + U.esc(motivoTexto()) + "</b></div>";
    }

    /* — navegação entre passos — */
    var TITULOS = ["", "Motivo", "Dia e horário", "Confirmar"];
    function irPara(n) {
      st.passo = n;
      U.qsa("[data-passo]").forEach(function (p) {
        p.hidden = Number(p.getAttribute("data-passo")) !== n;
      });
      U.qsa(".ag-step").forEach(function (s, i) {
        s.classList.toggle("is-done", i + 1 < n);
        s.classList.toggle("is-current", i + 1 === n);
      });
      var txt = document.getElementById("ag-passo-txt");
      if (txt) txt.textContent = n <= 3 ? "Passo " + n + " de 3 · " + TITULOS[n] : "";
      document.getElementById("ag-progresso").hidden = n > 3;
      document.getElementById("ag-acoes").hidden = n > 3;
      document.getElementById("ag-voltar").style.visibility = n === 1 ? "hidden" : "visible";
      var av = document.getElementById("ag-avancar");
      av.innerHTML = n === 3
        ? Icon.svg("check") + "Confirmar consulta"
        : "Continuar" + Icon.svg("arrow-right");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }

    document.getElementById("ag-avancar").addEventListener("click", function () {
      if (st.passo === 1) {
        if (!st.motivo) return UI.toast("Escolha o motivo da consulta.", "warn");
        if (st.motivo === "outro" && !document.getElementById("ag-detalhe").value.trim()) {
          document.getElementById("ag-detalhe").focus();
          return UI.toast("Conte em poucas palavras o motivo da consulta.", "warn");
        }
        if (!st.data) {
          var primeiro = dias.filter(function (d) { return d.vagas.length; })[0];
          if (primeiro) {
            st.data = primeiro.data;
          }
        }
        irPara(2);
        renderDias();
        renderHoras();
        return;
      }
      if (st.passo === 2) {
        if (!st.data) return UI.toast("Escolha o dia.", "warn");
        if (!st.hora) return UI.toast("Escolha um horário.", "warn");
        renderResumo();
        return irPara(3);
      }
      if (st.passo === 3) {
        if (!document.getElementById("ag-lgpd").checked) {
          return UI.toast("Marque a autorização para o médico ver seu prontuário.", "warn");
        }
        confirmar(this);
      }
    });
    document.getElementById("ag-voltar").addEventListener("click", function () {
      if (st.passo > 1) irPara(st.passo - 1);
    });

    function confirmar(btn) {
      btn.classList.add("is-loading");
      setTimeout(function () {
        var m = global.DB.medico(st.medicoId);
        var nova = {
          id: Date.now(),
          pacienteId: perfil.id,
          paciente: perfil.nome,
          medicoId: m.id,
          medico: m.nome,
          especialidade: m.especialidade,
          unidade: m.unidade,
          data: st.data,
          hora: st.hora,
          status: "Confirmada",
          motivo: motivoTexto() || "Consulta agendada pelo portal",
          resumo: "",
          conduta: "",
          anamnese: "",
        };
        var lista = global.DB.consultas();
        if (remarcando) {
          lista.forEach(function (c) {
            if (String(c.id) === String(remarcando.id)) c.status = "Cancelada";
          });
        }
        lista.push(nova);
        global.DB.salvarConsultas(lista);
        global.DB.notificar({
          tipo: "consulta",
          titulo: remarcando ? "Consulta remarcada" : "Consulta marcada",
          texto: "Clínico geral com " + m.nome + " em " + U.fmtData(st.data) + " às " + st.hora + ".",
          link: "consultas.html",
        });
        btn.classList.remove("is-loading");
        UI.shell.atualizarBadge();
        UI.confete();

        document.getElementById("ag-sucesso-txt").innerHTML =
          "<strong>" + U.diaSemana(st.data) + ", " + U.fmtDataLonga(st.data).replace(/ de \d{4}$/, "") +
          " às " + st.hora + "</strong><br>com " + U.esc(m.nome) + " (clínico geral)";
        irPara(4);
      }, 700);
    }

    irPara(1);
  };

  /* ================================================= PÁGINA: PRONTUÁRIOS */
  P.paginaProntuarios = function () {
    var sessao = global.App.exigirSessao();
    if (!sessao) return;

    var ehPaciente = sessao.papel === "paciente";
    UI.shell.montar({
      page: "prontuarios",
      titulo: ehPaciente ? "Prontuário e Exames" : "Prontuários",
      sub: ehPaciente
        ? "Seu histórico clínico completo"
        : "Registros clínicos dos pacientes atendidos",
    });

    renderResumo();
    renderProntuarios();
    renderExames();
    renderReceitas();

    /* abas */
    U.qsa("#tabs-prontuario .tab").forEach(function (b) {
      b.addEventListener("click", function () {
        mostrarAba(b.getAttribute("data-aba"));
      });
    });

    function mostrarAba(nome) {
      U.qsa("#tabs-prontuario .tab").forEach(function (t) {
        t.classList.toggle("is-active", t.getAttribute("data-aba") === nome);
      });
      U.qsa("[data-pane]").forEach(function (p) {
        p.hidden = p.getAttribute("data-pane") !== nome;
      });
      if (history.replaceState) history.replaceState(null, "", "#" + nome);
    }

    var hash = (location.hash || "").replace("#", "");
    if (hash === "exames" || hash === "receitas") mostrarAba(hash);

    var idConsulta = U.param("consulta");
    if (idConsulta) setTimeout(function () { abrirProntuario(idConsulta); }, 250);

    /* ---------------------------------------------------- resumo clínico */
    function renderResumo() {
      var host = document.getElementById("resumo-clinico");
      if (!host) return;
      var p = global.DB.perfil();
      var cs = global.DB.consultas().filter(function (c) { return c.status === "Realizada"; });
      var ultima = cs.sort(function (a, b) { return momento(b) - momento(a); })[0];

      var campos = [
        { l: "Paciente", v: p.nome, ico: "user" },
        { l: "Cartão SUS", v: p.cns || "—", ico: "credit-card" },
        { l: "Tipo sanguíneo", v: p.tipoSanguineo || "—", ico: "heart" },
        { l: "Alergias", v: p.alergias || "Nenhuma registrada", ico: "alert-triangle" },
        { l: "Condições", v: p.condicoes || "Nenhuma registrada", ico: "activity" },
        { l: "Último atendimento", v: ultima ? U.fmtData(ultima.data) : "—", ico: "history" },
      ];

      host.innerHTML =
        '<div class="row-between mb-3"><h3>' + Icon.svg("clipboard") + " Resumo clínico</h3>" +
        '<button class="btn btn-outline btn-sm" id="btn-imprimir-resumo">' +
        Icon.svg("print") + "Imprimir resumo</button></div>" +
        '<div class="auto-grid" style="--min:180px;--gap:1rem">' +
        campos
          .map(function (c) {
            return (
              '<div><div class="kpi-label">' + Icon.svg(c.ico, "ico-sm") + " " + c.l + "</div>" +
              '<div class="bold" style="font-family:var(--font-display);margin-top:.15rem">' +
              U.esc(c.v) + "</div></div>"
            );
          })
          .join("") +
        "</div>";

      document.getElementById("btn-imprimir-resumo").addEventListener("click", function () {
        imprimirResumo(p, cs);
      });
    }

    /* ------------------------------------------------ lista de prontuários */
    function renderProntuarios() {
      var host = document.getElementById("lista-prontuarios");
      if (!host) return;
      var lista = global.DB.consultas()
        .filter(function (c) { return c.status === "Realizada"; })
        .sort(function (a, b) { return momento(b) - momento(a); });

      if (!lista.length) {
        host.innerHTML =
          '<div class="empty"><div class="icon-bubble icon-bubble-lg">' + Icon.svg("file-text") +
          "</div><h4>Nenhum registro clínico</h4>" +
          "<p>Assim que uma teleconsulta for concluída, o registro do profissional aparece aqui.</p></div>";
        return;
      }

      host.innerHTML =
        '<div class="table-wrap"><table class="table"><thead><tr>' +
        "<th>Data</th><th>Profissional</th><th>Especialidade</th><th>Diagnóstico / resumo</th><th></th>" +
        "</tr></thead><tbody>" +
        lista
          .map(function (c) {
            return (
              "<tr><td>" + U.fmtData(c.data) + "</td>" +
              '<td class="td-strong">' + U.esc(c.medico) + "</td>" +
              "<td>" + U.esc(c.especialidade) + "</td>" +
              '<td style="max-width:320px">' +
              '<span class="small muted">' + U.esc((c.resumo || "Sem registro").slice(0, 92)) +
              ((c.resumo || "").length > 92 ? "…" : "") + "</span></td>" +
              '<td><button class="btn btn-outline btn-sm" data-pront="' + c.id + '">' +
              Icon.svg("eye") + "Abrir</button></td></tr>"
            );
          })
          .join("") +
        "</tbody></table></div>";

      U.qsa("[data-pront]", host).forEach(function (b) {
        b.addEventListener("click", function () { abrirProntuario(b.getAttribute("data-pront")); });
      });
    }

    function abrirProntuario(id) {
      var c = global.DB.consulta(id);
      if (!c) return;
      var un = global.DB.unidade(c.unidade);
      var med = global.DB.medico(c.medicoId) || {};
      var p = ehPaciente ? global.DB.perfil() : global.DB.pacienteDaConsulta(c);

      document.getElementById("pront-cabecalho").innerHTML =
        "Atendimento de <strong>" + U.esc(c.especialidade) + "</strong> realizado por " +
        U.esc(c.medico) + " (" + U.esc(med.crm || "") + ") em " + U.fmtDataLonga(c.data) +
        " às " + U.esc(c.hora) + " · " + U.esc(un ? un.nome : "");

      document.getElementById("pront-corpo").innerHTML =
        '<div class="pront-section"><h5>' + Icon.svg("user") + "Identificação</h5>" +
        "<p>" + U.esc(p.nome) + " · CNS " + U.esc(p.cns || "—") +
        " · Nascimento " + U.fmtData(p.nascimento) + "</p></div>" +

        '<div class="pront-section"><h5>' + Icon.svg("message") + "Queixa e anamnese</h5>" +
        "<p>" + U.esc(c.anamnese || c.motivo || "Não registrado.") + "</p></div>" +

        '<div class="pront-section"><h5>' + Icon.svg("stethoscope") + "Avaliação e hipótese diagnóstica</h5>" +
        "<p>" + U.esc(c.resumo || "Não registrado.") + "</p></div>" +

        '<div class="pront-section"><h5>' + Icon.svg("clipboard") + "Conduta e orientações</h5>" +
        "<p>" + U.esc(c.conduta || "Não registrado.") + "</p></div>" +

        '<div class="resumo-box"><div class="resumo-linha"><span>Assinado eletronicamente por</span><b>' +
        U.esc(c.medico) + "</b></div>" +
        '<div class="resumo-linha"><span>Registro profissional</span><b>' + U.esc(med.crm || "—") + "</b></div>" +
        '<div class="resumo-linha"><span>Modalidade</span><b>Teleconsulta (Resolução CFM 2.314/2022)</b></div></div>';

      document.getElementById("btn-imprimir-pront").onclick = function () {
        imprimirProntuario(c, p, med, un);
      };
      UI.modal.open("modal-prontuario");
    }

    /* ------------------------------------------------------------ exames */
    function renderExames() {
      var host = document.getElementById("lista-exames");
      if (!host) return;
      var lista = global.DB.exames().sort(function (a, b) {
        return new Date(b.data) - new Date(a.data);
      });

      host.innerHTML = lista
        .map(function (e) {
          var pronto = e.status === "Disponível";
          var alterado = (e.itens || []).some(function (i) { return !i.ok; });
          return (
            '<div class="exame-item">' +
            '<div class="icon-bubble ' + (pronto ? (alterado ? "bub-warn" : "bub-brand") : "bub-accent") + '">' +
            Icon.svg(e.tipo === "Imagem" ? "monitor" : "flask") + "</div>" +
            '<div style="flex:1;min-width:190px">' +
            "<strong>" + U.esc(e.nome) + "</strong>" +
            '<p class="small muted">' + U.esc(e.tipo) + " · " + U.fmtData(e.data) + " · " + U.esc(e.unidade) + "</p>" +
            '<p class="tiny mute-2">Solicitado por ' + U.esc(e.solicitante) + "</p></div>" +
            '<span class="badge ' + (pronto ? (alterado ? "badge-warn" : "badge-ok") : "badge-pendente") + '">' +
            Icon.svg(pronto ? "check-circle" : "hourglass") +
            (pronto ? (alterado ? "Requer atenção" : "Normal") : "Aguardando") + "</span>" +
            (pronto
              ? '<button class="btn btn-outline btn-sm" data-exame="' + e.id + '">' +
                Icon.svg("eye") + "Ver laudo</button>"
              : '<span class="small mute-2">Previsto para ' + U.fmtData(e.data) + "</span>") +
            "</div>"
          );
        })
        .join("");

      U.qsa("[data-exame]", host).forEach(function (b) {
        b.addEventListener("click", function () { abrirExame(b.getAttribute("data-exame")); });
      });
    }

    function abrirExame(id) {
      var e = global.DB.exames().filter(function (x) { return x.id === id; })[0];
      if (!e) return;
      document.getElementById("exame-titulo").textContent = e.nome;
      document.getElementById("exame-sub").textContent =
        U.fmtDataLonga(e.data) + " · " + e.unidade + " · solicitado por " + e.solicitante;

      document.getElementById("exame-corpo").innerHTML =
        (e.itens || [])
          .map(function (i) {
            return (
              '<div class="exame-ref"><span>' + U.esc(i.k) + "</span>" +
              '<span><b class="' + (i.ok ? "v-ok" : "v-alt") + '">' + U.esc(i.v) + "</b>" +
              '<span class="tiny mute-2"> (ref.: ' + U.esc(i.ref) + ")</span></span></div>"
            );
          })
          .join("") +
        '<div class="resumo-box mt-3"><strong class="small">Conclusão</strong>' +
        '<p class="small mt-1">' + U.esc(e.resultado) + "</p></div>";

      document.getElementById("btn-imprimir-exame").onclick = function () {
        imprimirExame(e, global.DB.perfil());
      };
      UI.modal.open("modal-exame");
    }

    /* ---------------------------------------------------------- receitas */
    function renderReceitas() {
      var host = document.getElementById("lista-receitas");
      if (!host) return;
      var lista = global.DB.receitas().sort(function (a, b) {
        return new Date(b.data) - new Date(a.data);
      });

      host.innerHTML = lista
        .map(function (r) {
          var valida = U.diasAte(r.validade) >= 0;
          return (
            '<article class="receita-card">' +
            '<div class="receita-head"><div><h4>' + U.esc(r.tipo) + "</h4>" +
            "<span>" + U.esc(r.medico) + " · " + U.esc(r.crm) + " · " + U.fmtData(r.data) + "</span></div>" +
            '<span class="badge ' + (valida ? "badge-ok" : "badge-cancelada") + '" style="background:rgba(255,255,255,.2);color:#fff">' +
            Icon.svg(valida ? "check-circle" : "x-circle") +
            (valida ? "Válida até " + U.fmtData(r.validade) : "Vencida em " + U.fmtData(r.validade)) +
            "</span></div>" +

            '<div class="receita-body">' +
            r.medicamentos
              .map(function (m) {
                return (
                  '<div class="med-item">' +
                  '<div class="icon-bubble icon-bubble-sm bub-warn">' + Icon.svg("pill") + "</div>" +
                  "<div><strong>" + U.esc(m.nome) + "</strong>" +
                  "<p>" + U.esc(m.posologia) + " · " + U.esc(m.duracao) + " · " + U.esc(m.qtd) + "</p></div></div>"
                );
              })
              .join("") +

            (r.observacao
              ? '<p class="small muted mt-2">' + Icon.svg("info", "ico-sm") + " " + U.esc(r.observacao) + "</p>"
              : "") +

            '<div class="qr-box mt-3">' +
            '<div class="qr-img" data-qr="' + U.esc(r.codigo) + '"></div>' +
            '<div style="flex:1;min-width:190px">' +
            '<div class="kpi-label">Código de validação</div>' +
            '<div class="qr-code-text mt-1">' + U.esc(r.codigo) + "</div>" +
            '<p class="tiny muted mt-2">A farmácia lê o QR Code ou digita o código para conferir ' +
            "autenticidade, profissional responsável e validade da receita.</p></div></div>" +

            '<div class="row mt-3" style="gap:.5rem;flex-wrap:wrap">' +
            '<button class="btn btn-primary btn-sm" data-imprimir-receita="' + U.esc(r.id) + '">' +
            Icon.svg("print") + "Imprimir receita</button>" +
            '<button class="btn btn-outline btn-sm" data-copiar="' + U.esc(r.codigo) + '">' +
            Icon.svg("copy") + "Copiar código</button>" +
            (valida
              ? ""
              : '<a class="btn btn-outline btn-sm" href="agendar.html?motivo=receita">' +
                Icon.svg("refresh") + "Pedir renovação ao clínico geral</a>") +
            "</div></div></article>"
          );
        })
        .join("");

      /* QR Codes reais */
      U.qsa("[data-qr]", host).forEach(function (box) {
        var codigo = box.getAttribute("data-qr");
        try {
          var qr = global.qrcode(0, "M");
          qr.addData("CRIMED|Criciuma-SC|receita|" + codigo);
          qr.make();
          box.innerHTML = qr.createSvgTag({ cellSize: 4, margin: 0, scalable: true });
        } catch (err) {
          box.innerHTML = '<div class="center tiny mute-2" style="padding:1rem">QR indisponível</div>';
        }
      });

      U.qsa("[data-copiar]", host).forEach(function (b) {
        b.addEventListener("click", function () {
          var txt = b.getAttribute("data-copiar");
          if (navigator.clipboard) {
            navigator.clipboard.writeText(txt).then(function () {
              UI.toast("Código copiado: " + txt, "success");
            });
          } else {
            UI.toast("Código: " + txt, "info");
          }
        });
      });

      U.qsa("[data-imprimir-receita]", host).forEach(function (b) {
        b.addEventListener("click", function () {
          var r = global.DB.receitas().filter(function (x) {
            return x.id === b.getAttribute("data-imprimir-receita");
          })[0];
          imprimirReceita(r, global.DB.perfil());
        });
      });
    }
  };

  /* ================================================== GERADOR DE IMPRESSÃO */
  var CSS_IMPRESSAO =
    "*{box-sizing:border-box}body{font-family:'Segoe UI',Arial,sans-serif;color:#1a1a1a;line-height:1.65;padding:36px;max-width:820px;margin:auto}" +
    "header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #208049;padding-bottom:14px;margin-bottom:22px}" +
    "h1{color:#013D00;font-size:21px;margin:0}h1 small{display:block;font-size:11px;color:#666;font-weight:500;letter-spacing:.12em;text-transform:uppercase;margin-top:2px}" +
    ".org{text-align:right;font-size:11px;color:#555;line-height:1.5}" +
    "h2{font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:#208049;margin:20px 0 6px;border-bottom:1px solid #e3e8e4;padding-bottom:4px}" +
    ".box{background:#f6f8f6;border:1px solid #e3e8e4;border-radius:8px;padding:12px 14px;margin-bottom:14px;font-size:13px}" +
    ".linha{display:flex;justify-content:space-between;gap:16px;padding:4px 0;font-size:13px;border-bottom:1px dashed #e0e5e1}" +
    ".linha:last-child{border-bottom:none}p{font-size:13px;margin:4px 0}" +
    ".assinatura{margin-top:56px;text-align:center}.assinatura div{width:300px;margin:0 auto;border-top:1px solid #333;padding-top:8px;font-size:12px}" +
    "footer{margin-top:28px;border-top:1px solid #e3e8e4;padding-top:10px;font-size:10px;color:#888;text-align:center}" +
    "table{width:100%;border-collapse:collapse;font-size:12px}th,td{text-align:left;padding:6px 8px;border-bottom:1px solid #e3e8e4}th{background:#f0f4f1;font-size:10px;text-transform:uppercase;letter-spacing:.06em;color:#555}" +
    "@media print{body{padding:0}}";

  function abrirImpressao(titulo, miolo) {
    var w = window.open("", "_blank", "width=860,height=700");
    if (!w) {
      UI.toast("Seu navegador bloqueou a janela de impressão. Permita pop-ups para este site.", "warn");
      return;
    }
    var hoje = new Date().toLocaleString("pt-BR");
    w.document.write(
      "<!doctype html><html lang='pt-BR'><head><meta charset='utf-8'><title>" + titulo +
      "</title><style>" + CSS_IMPRESSAO + "</style></head><body>" +
      "<header><h1>CRIMED<small>Tele-Saúde Criciúma</small></h1>" +
      "<div class='org'>Prefeitura Municipal de Criciúma<br>Secretaria Municipal de Saúde<br>" +
      "Documento gerado eletronicamente</div></header>" +
      miolo +
      "<footer>Documento emitido pelo portal CRIMED em " + hoje +
      " · Protótipo acadêmico sem validade legal · Programa Tele-Saúde Expandido (PTSE-001)</footer>" +
      "<script>window.onload=function(){window.print()}<\/script></body></html>"
    );
    w.document.close();
  }

  function imprimirProntuario(c, p, med, un) {
    abrirImpressao(
      "Prontuário — " + p.nome,
      "<h2>Identificação do paciente</h2><div class='box'>" +
      "<div class='linha'><span>Nome</span><b>" + U.esc(p.nome) + "</b></div>" +
      "<div class='linha'><span>CPF</span><b>" + U.esc(p.cpf) + "</b></div>" +
      "<div class='linha'><span>Cartão SUS</span><b>" + U.esc(p.cns || "—") + "</b></div>" +
      "<div class='linha'><span>Nascimento</span><b>" + U.fmtData(p.nascimento) + "</b></div></div>" +

      "<h2>Dados do atendimento</h2><div class='box'>" +
      "<div class='linha'><span>Data e hora</span><b>" + U.fmtData(c.data) + " às " + U.esc(c.hora) + "</b></div>" +
      "<div class='linha'><span>Profissional</span><b>" + U.esc(c.medico) + " — " + U.esc(med.crm || "") + "</b></div>" +
      "<div class='linha'><span>Especialidade</span><b>" + U.esc(c.especialidade) + "</b></div>" +
      "<div class='linha'><span>Unidade</span><b>" + U.esc(un ? un.nome : "—") + "</b></div>" +
      "<div class='linha'><span>Modalidade</span><b>Teleconsulta por vídeo</b></div></div>" +

      "<h2>Queixa e anamnese</h2><p>" + U.esc(c.anamnese || c.motivo || "Não registrado.") + "</p>" +
      "<h2>Avaliação e hipótese diagnóstica</h2><p>" + U.esc(c.resumo || "Não registrado.") + "</p>" +
      "<h2>Conduta e orientações</h2><p>" + U.esc(c.conduta || "Não registrado.") + "</p>" +

      "<div class='assinatura'><div><b>" + U.esc(c.medico) + "</b><br>" +
      U.esc(med.crm || "") + " · " + U.esc(c.especialidade) + "<br>" +
      "<span style='font-size:10px;color:#777'>Assinado eletronicamente</span></div></div>"
    );
  }

  function imprimirExame(e, p) {
    abrirImpressao(
      "Laudo — " + e.nome,
      "<h2>Paciente</h2><div class='box'>" +
      "<div class='linha'><span>Nome</span><b>" + U.esc(p.nome) + "</b></div>" +
      "<div class='linha'><span>Cartão SUS</span><b>" + U.esc(p.cns || "—") + "</b></div></div>" +
      "<h2>" + U.esc(e.nome) + "</h2><div class='box'>" +
      "<div class='linha'><span>Data da coleta</span><b>" + U.fmtData(e.data) + "</b></div>" +
      "<div class='linha'><span>Unidade</span><b>" + U.esc(e.unidade) + "</b></div>" +
      "<div class='linha'><span>Solicitante</span><b>" + U.esc(e.solicitante) + "</b></div></div>" +
      "<table><thead><tr><th>Parâmetro</th><th>Resultado</th><th>Referência</th></tr></thead><tbody>" +
      (e.itens || [])
        .map(function (i) {
          return "<tr><td>" + U.esc(i.k) + "</td><td><b>" + U.esc(i.v) + "</b></td><td>" + U.esc(i.ref) + "</td></tr>";
        })
        .join("") +
      "</tbody></table>" +
      "<h2>Conclusão</h2><p>" + U.esc(e.resultado) + "</p>" +
      "<div class='assinatura'><div><b>Laboratório Municipal de Criciúma</b><br>" +
      "<span style='font-size:10px;color:#777'>Laudo liberado eletronicamente</span></div></div>"
    );
  }

  function imprimirReceita(r, p) {
    if (!r) return;
    var qrSvg = "";
    try {
      var qr = global.qrcode(0, "M");
      qr.addData("CRIMED|Criciuma-SC|receita|" + r.codigo);
      qr.make();
      qrSvg = qr.createSvgTag({ cellSize: 3, margin: 0, scalable: false });
    } catch (e) {}

    abrirImpressao(
      "Receita — " + p.nome,
      "<h2>Receituário — " + U.esc(r.tipo) + "</h2><div class='box'>" +
      "<div class='linha'><span>Paciente</span><b>" + U.esc(p.nome) + "</b></div>" +
      "<div class='linha'><span>CPF</span><b>" + U.esc(p.cpf) + "</b></div>" +
      "<div class='linha'><span>Emitida em</span><b>" + U.fmtData(r.data) + "</b></div>" +
      "<div class='linha'><span>Válida até</span><b>" + U.fmtData(r.validade) + "</b></div></div>" +

      "<h2>Prescrição</h2>" +
      r.medicamentos
        .map(function (m, i) {
          return (
            "<p><b>" + (i + 1) + ". " + U.esc(m.nome) + "</b> — " + U.esc(m.qtd) + "<br>" +
            "<span style='color:#555'>" + U.esc(m.posologia) + " · " + U.esc(m.duracao) + "</span></p>"
          );
        })
        .join("") +
      (r.observacao ? "<h2>Observações</h2><p>" + U.esc(r.observacao) + "</p>" : "") +

      "<div class='box' style='display:flex;gap:16px;align-items:center;margin-top:20px'>" +
      "<div style='width:96px;height:96px'>" + qrSvg + "</div>" +
      "<div><b style='font-size:13px'>Código de validação</b><br>" +
      "<span style='font-family:monospace;font-size:15px;letter-spacing:.08em'>" + U.esc(r.codigo) + "</span>" +
      "<p style='font-size:11px;color:#666;margin-top:4px'>A farmácia confere a autenticidade desta " +
      "prescrição lendo o QR Code ou informando o código acima.</p></div></div>" +

      "<div class='assinatura'><div><b>" + U.esc(r.medico) + "</b><br>" + U.esc(r.crm) +
      " · " + U.esc(r.especialidade) + "<br>" +
      "<span style='font-size:10px;color:#777'>Assinado eletronicamente</span></div></div>"
    );
  }

  function imprimirResumo(p, consultas) {
    abrirImpressao(
      "Resumo clínico — " + p.nome,
      "<h2>Identificação</h2><div class='box'>" +
      "<div class='linha'><span>Nome</span><b>" + U.esc(p.nome) + "</b></div>" +
      "<div class='linha'><span>Cartão SUS</span><b>" + U.esc(p.cns || "—") + "</b></div>" +
      "<div class='linha'><span>Nascimento</span><b>" + U.fmtData(p.nascimento) + "</b></div>" +
      "<div class='linha'><span>Tipo sanguíneo</span><b>" + U.esc(p.tipoSanguineo || "—") + "</b></div>" +
      "<div class='linha'><span>Alergias</span><b>" + U.esc(p.alergias || "Nenhuma registrada") + "</b></div>" +
      "<div class='linha'><span>Condições</span><b>" + U.esc(p.condicoes || "Nenhuma registrada") + "</b></div></div>" +
      "<h2>Atendimentos realizados</h2>" +
      "<table><thead><tr><th>Data</th><th>Profissional</th><th>Especialidade</th><th>Resumo</th></tr></thead><tbody>" +
      consultas
        .map(function (c) {
          return (
            "<tr><td>" + U.fmtData(c.data) + "</td><td>" + U.esc(c.medico) + "</td>" +
            "<td>" + U.esc(c.especialidade) + "</td><td>" + U.esc(c.resumo || "—") + "</td></tr>"
          );
        })
        .join("") +
      "</tbody></table>"
    );
  }

  /* ============================================ AUDITORIA (tela de perfil) */
  function renderAuditoria() {
    var tb = document.getElementById("auditoria-tbody");
    if (!tb) return;
    var registros = [
      { q: "Dra. Helena Búrigo", u: "UBS Centro", m: "Teleconsulta — Clínica Médica", d: -2 },
      { q: "Laboratório Municipal", u: "Centro", m: "Liberação de resultado de exame", d: -12 },
      { q: "Dr. Fernando Silva", u: "UBS Próspera", m: "Preparação para teleconsulta", d: -14 },
      { q: "Dra. Vanessa Costa", u: "UBS Centro", m: "Teleconsulta — Neurologia", d: -18 },
      { q: "Você (titular)", u: "Portal do cidadão", m: "Consulta ao próprio prontuário", d: -18 },
      { q: "Dr. Carlos Mendes", u: "UBS Rio Maina", m: "Teleconsulta — Ortopedia", d: -46 },
    ];
    tb.innerHTML = registros
      .map(function (r) {
        return (
          "<tr><td>" + U.fmtData(global.DB.dayOffset(r.d)) + " · " +
          String(8 + (Math.abs(r.d) % 9)).padStart(2, "0") + ":" +
          String((Math.abs(r.d) * 7) % 60).padStart(2, "0") + "</td>" +
          '<td class="td-strong">' + U.esc(r.q) + "</td><td>" + U.esc(r.u) + "</td>" +
          "<td>" + U.esc(r.m) + "</td></tr>"
        );
      })
      .join("");
  }

  /* ================================================================== BOOT */
  function init() {
    U = UI.u;
    P.recarregar = function () {};
    var page = document.body.getAttribute("data-page");
    if (page === "dashboard") P.paginaDashboard();
    if (page === "consultas") P.paginaConsultas();
    if (page === "agendar") P.paginaAgendar();
    if (page === "prontuarios") P.paginaProntuarios();
    if (page === "perfil") renderAuditoria();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  global.Paciente = P;
})(window);
