/* ============================================================================
   CRIMED · paciente.js
   Controladores das telas do paciente: painel, consultas, prontuário, exames
   e receitas digitais.
   ========================================================================= */
(function (global) {
  "use strict";

  var P = {};
  var U;

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

  function contagem(c) {
    var ms = momento(c).getTime() - Date.now();
    if (ms <= 0) return "agora";
    var min = Math.floor(ms / 60000);
    if (min < 60) return "em " + min + " min";
    var h = Math.floor(min / 60);
    if (h < 24) return "em " + h + "h" + (min % 60 ? " " + (min % 60) + "min" : "");
    return U.quando(c.data);
  }

  function badgeStatus(status) {
    var mapa = {
      Confirmada: { cls: "badge-confirmada", ico: "calendar-check" },
      Realizada: { cls: "badge-realizada", ico: "check-circle" },
      Cancelada: { cls: "badge-cancelada", ico: "x-circle" },
      "Em andamento": { cls: "badge-warn", ico: "video" },
    };
    var m = mapa[status] || mapa.Realizada;
    return '<span class="badge ' + m.cls + '">' + Icon.svg(m.ico) + U.esc(status) + "</span>";
  }

  /* ===================================================== AÇÕES DE CONSULTA */
  P.entrarSala = function (id) {
    location.href = "teleconsulta.html?consulta=" + id;
  };

  P.cancelar = function (id) {
    var c = global.DB.consulta(id);
    if (!c) return;
    UI.confirmar({
      titulo: "Cancelar teleconsulta",
      texto:
        "<strong>" + U.esc(c.especialidade) + "</strong> com " + U.esc(c.medico) +
        " em " + U.fmtData(c.data) + " às " + U.esc(c.hora) + ".<br>" +
        "O horário será devolvido à agenda da unidade e outro paciente poderá usá-lo.",
      confirmar: "Cancelar consulta",
      cancelar: "Manter",
      danger: true,
    }).then(function (ok) {
      if (!ok) return;
      global.DB.atualizarConsulta(id, { status: "Cancelada" });
      global.DB.notificar({
        tipo: "consulta",
        titulo: "Teleconsulta cancelada",
        texto: c.especialidade + " com " + c.medico + " em " + U.fmtData(c.data) + ".",
        link: "consultas.html",
      });
      UI.toast("Consulta cancelada. O horário voltou para a agenda da unidade.", "warn");
      UI.shell.atualizarBadge();
      P.recarregar();
    });
  };

  P.remarcar = function (id) {
    var c = global.DB.consulta(id);
    if (!c) return;
    global.DB.atualizarConsulta(id, { status: "Cancelada" });
    UI.toast("Escolha o novo horário — a consulta anterior foi liberada.", "info");
    P.recarregar();
    global.App.abrirAgendamento(c.especialidade);
  };

  /* ==================================================== CARTÃO DE CONSULTA */
  function cartaoConsulta(c, compacto) {
    var un = global.DB.unidade(c.unidade);
    var hoje = U.diasAte(c.data) === 0;
    var aberta = c.status === "Confirmada" && janelaSala(c);
    var acoes = "";

    if (c.status === "Confirmada") {
      acoes =
        '<button class="btn ' + (aberta ? "btn-primary pulse" : "btn-outline") +
        ' btn-sm" data-entrar="' + c.id + '">' + Icon.svg("video") +
        (aberta ? "Entrar agora" : "Sala virtual") + "</button>" +
        '<button class="btn btn-ghost btn-sm" data-remarcar="' + c.id + '" data-tip="Remarcar">' +
        Icon.svg("refresh") + "</button>" +
        '<button class="btn btn-ghost btn-sm" data-cancelar="' + c.id + '" data-tip="Cancelar" style="color:var(--danger)">' +
        Icon.svg("trash") + "</button>";
    } else if (c.status === "Realizada") {
      acoes =
        '<a class="btn btn-outline btn-sm" href="prontuarios.html?consulta=' + c.id + '">' +
        Icon.svg("file-medical") + "Ver prontuário</a>";
    } else {
      acoes =
        '<button class="btn btn-outline btn-sm" data-act="agendar" data-esp="' + U.esc(c.especialidade) + '">' +
        Icon.svg("calendar-plus") + "Reagendar</button>";
    }

    return (
      '<article class="consulta-item' + (hoje && c.status === "Confirmada" ? " is-hoje" : "") + '">' +
      '<div class="avatar avatar-doc avatar-lg" style="width:3.2rem;height:3.2rem;font-size:var(--t-sm)">' +
      U.iniciais(c.medico) + "</div>" +
      '<div class="consulta-main">' +
      "<h4>" + U.esc(c.medico) + badgeStatus(c.status) +
      (hoje && c.status === "Confirmada"
        ? '<span class="countdown">' + Icon.svg("clock", "ico-sm") + contagem(c) + "</span>"
        : "") +
      "</h4>" +
      '<div class="consulta-meta">' +
      "<span>" + Icon.svg("stethoscope") + U.esc(c.especialidade) + "</span>" +
      "<span>" + Icon.svg("calendar") + U.fmtData(c.data) + " às " + U.esc(c.hora) + "</span>" +
      (compacto ? "" : "<span>" + Icon.svg("building") + U.esc(un ? un.nome : "—") + "</span>") +
      "</div>" +
      (c.motivo && !compacto
        ? '<p class="small muted mt-1">' + Icon.svg("message", "ico-sm") + " " + U.esc(c.motivo) + "</p>"
        : "") +
      "</div>" +
      '<div class="consulta-actions">' + acoes + "</div>" +
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

  /* ====================================================== PÁGINA: PAINEL */
  P.paginaDashboard = function () {
    var sessao = global.App.exigirSessao(["paciente"]);
    if (!sessao) return;

    var perfil = global.DB.perfil();
    UI.shell.montar({
      page: "dashboard",
      titulo: "Olá, " + perfil.nome.split(" ")[0] + " 👋",
      sub: U.diaSemana(global.DB.hoje()) + ", " + U.fmtDataLonga(global.DB.hoje()),
    });

    P.recarregar = renderDashboard;
    renderDashboard();

    /* o relógio da próxima consulta atualiza sozinho */
    setInterval(function () {
      var alvo = document.getElementById("proxima-consulta");
      if (alvo && alvo.getAttribute("data-live") === "1") renderProxima();
    }, 30000);

    document.addEventListener("click", function (e) {
      if (e.target.closest && e.target.closest("[data-act=campanha]")) {
        UI.toast(
          "Vacinação contra Influenza disponível nas 10 UBS de Criciúma, de segunda a sexta, das 8h às 17h.",
          "info",
          "Campanha de vacinação"
        );
      }
    });

    function renderDashboard() {
      renderProxima();
      renderKpis();
      renderHistorico();
      renderJornada();
    }

    function renderProxima() {
      var host = document.getElementById("proxima-consulta");
      if (!host) return;
      var futuras = global.DB.consultas()
        .filter(function (c) { return c.status === "Confirmada" && U.diasAte(c.data) >= 0; })
        .sort(function (a, b) { return momento(a) - momento(b); });

      if (!futuras.length) {
        host.setAttribute("data-live", "0");
        host.innerHTML =
          '<div class="empty"><div class="icon-bubble icon-bubble-lg">' + Icon.svg("calendar") +
          "</div><h4>Nenhuma consulta agendada</h4>" +
          "<p>Quando você marcar uma teleconsulta, ela aparece aqui com um lembrete e o botão de entrada na sala.</p>" +
          '<button class="btn btn-primary mt-3" data-act="agendar">' + Icon.svg("calendar-plus") +
          "Agendar minha consulta</button></div>";
        return;
      }

      host.setAttribute("data-live", "1");
      var c = futuras[0];
      var un = global.DB.unidade(c.unidade);
      var med = global.DB.medico(c.medicoId) || {};
      var aberta = janelaSala(c);
      var hoje = U.diasAte(c.data) === 0;

      host.innerHTML =
        '<div class="row mb-3" style="gap:1rem;align-items:flex-start;flex-wrap:wrap">' +
        '<div class="avatar avatar-doc avatar-lg">' + U.iniciais(c.medico) + "</div>" +
        '<div style="flex:1;min-width:200px">' +
        "<h3>" + U.esc(c.medico) + "</h3>" +
        '<p class="muted">' + U.esc(c.especialidade) + " · " + U.esc(med.crm || "") + "</p>" +
        '<div class="row mt-2" style="gap:.4rem;flex-wrap:wrap">' +
        badgeStatus(c.status) +
        '<span class="badge badge-outline">' + Icon.svg("building") + U.esc(un ? un.nome : "—") + "</span>" +
        "</div></div>" +
        '<div class="center" style="min-width:140px">' +
        '<div class="kpi-label">' + (hoje ? "Começa" : "Acontece") + "</div>" +
        '<div class="kpi-value" style="font-size:var(--t-2xl);color:var(--brand)">' +
        (hoje ? contagem(c) : U.quando(c.data)) + "</div>" +
        '<div class="small muted">' + U.fmtData(c.data) + " · " + U.esc(c.hora) + "</div>" +
        "</div></div>" +

        (c.motivo
          ? '<div class="resumo-box mb-3"><div class="resumo-linha"><span>Motivo informado</span><b>' +
            U.esc(c.motivo) + "</b></div></div>"
          : "") +

        '<div class="row" style="gap:.6rem;flex-wrap:wrap">' +
        '<button class="btn ' + (aberta ? "btn-primary pulse" : "btn-primary") + '" data-entrar="' + c.id + '">' +
        Icon.svg("video") + (aberta ? "Entrar na sala agora" : "Abrir sala virtual") + "</button>" +
        '<button class="btn btn-outline" data-remarcar="' + c.id + '">' + Icon.svg("refresh") + "Remarcar</button>" +
        '<button class="btn btn-ghost" data-cancelar="' + c.id + '" style="color:var(--danger)">' +
        Icon.svg("trash") + "Cancelar</button>" +
        "</div>" +

        '<p class="small muted mt-3">' + Icon.svg("info", "ico-sm") +
        " A sala abre 15 minutos antes do horário marcado. Você recebe um lembrete por WhatsApp e e-mail." +
        "</p>" +

        (futuras.length > 1
          ? '<hr class="divider"><div class="small muted mb-2"><strong>Também agendadas</strong></div>' +
            futuras.slice(1).map(function (x) { return cartaoConsulta(x, true); }).join("")
          : "");

      ligarAcoesConsulta(host);
    }

    function renderKpis() {
      var host = document.getElementById("kpis-paciente");
      if (!host) return;
      var cs = global.DB.consultas();
      var realizadas = cs.filter(function (c) { return c.status === "Realizada"; }).length;
      var agendadas = cs.filter(function (c) { return c.status === "Confirmada"; }).length;
      var exames = global.DB.exames();
      var disponiveis = exames.filter(function (e) { return e.status === "Disponível"; }).length;
      var receitasAtivas = global.DB.receitas().filter(function (r) {
        return U.diasAte(r.validade) >= 0;
      }).length;
      /* estimativa: 14 km por deslocamento evitado (ida e volta média em Criciúma) */
      var km = realizadas * 14;

      var tiles = [
        { label: "Consultas realizadas", valor: realizadas, ico: "check-circle", cls: "bub-brand", foot: "no seu histórico" },
        { label: "Agendadas", valor: agendadas, ico: "calendar-check", cls: "bub-accent", foot: "próximos atendimentos" },
        { label: "Exames liberados", valor: disponiveis, ico: "flask", cls: "bub-warn", foot: "de " + exames.length + " solicitados" },
        { label: "Km que você não andou", valor: km, ico: "map-pin", cls: "bub-brand", foot: "deslocamentos evitados" },
      ];

      host.innerHTML = tiles
        .map(function (t) {
          return (
            '<div class="kpi"><div class="kpi-top">' +
            '<span class="kpi-label">' + t.label + "</span>" +
            '<span class="icon-bubble icon-bubble-sm ' + t.cls + '">' + Icon.svg(t.ico) + "</span></div>" +
            '<div class="kpi-value" data-count="' + t.valor + '">0</div>' +
            '<div class="kpi-foot">' + t.foot + "</div></div>"
          );
        })
        .join("");
      U.qsa("[data-count]", host).forEach(UI.countUp);
    }

    function renderHistorico() {
      var tb = document.getElementById("historico-tbody");
      if (!tb) return;
      var lista = global.DB.consultas()
        .filter(function (c) { return c.status !== "Confirmada"; })
        .sort(function (a, b) { return momento(b) - momento(a); })
        .slice(0, 5);

      if (!lista.length) {
        tb.innerHTML = '<tr><td colspan="5" class="table-empty">Nenhum atendimento registrado ainda.</td></tr>';
        return;
      }
      tb.innerHTML = lista
        .map(function (c) {
          return (
            "<tr><td>" + U.fmtData(c.data) + "</td>" +
            '<td class="td-strong">' + U.esc(c.medico) + "</td>" +
            "<td>" + U.esc(c.especialidade) + "</td>" +
            "<td>" + badgeStatus(c.status) + "</td>" +
            '<td>' + (c.status === "Realizada"
              ? '<a class="btn btn-ghost btn-sm" href="prontuarios.html?consulta=' + c.id + '">' +
                Icon.svg("eye") + "Abrir</a>"
              : '<span class="small mute-2">—</span>') + "</td></tr>"
          );
        })
        .join("");
    }

    function renderJornada() {
      var host = document.getElementById("jornada-saude");
      if (!host) return;
      var lista = global.DB.consultas()
        .sort(function (a, b) { return momento(b) - momento(a); })
        .slice(0, 5);

      host.innerHTML =
        '<div class="timeline">' +
        lista
          .map(function (c) {
            var futuro = U.diasAte(c.data) > 0;
            return (
              '<div class="timeline-item' + (futuro ? " is-future" : c.status === "Realizada" ? " is-done" : "") + '">' +
              '<div class="timeline-date">' + U.fmtData(c.data) + " · " + U.quando(c.data) + "</div>" +
              "<h5>" + U.esc(c.especialidade) + "</h5>" +
              '<p class="small muted">' + U.esc(c.medico) + " — " + U.esc(c.status) + "</p></div>"
            );
          })
          .join("") +
        "</div>";
    }
  };

  /* =================================================== PÁGINA: CONSULTAS */
  P.paginaConsultas = function () {
    var sessao = global.App.exigirSessao(["paciente"]);
    if (!sessao) return;

    UI.shell.montar({
      page: "consultas",
      titulo: "Minhas Consultas",
      sub: "Agendamentos, histórico e agenda do mês",
    });

    var filtro = "Todas";
    var busca = "";

    P.recarregar = function () {
      renderLista();
      renderCalendario();
    };

    U.qsa("#filtros-consulta .pill-tab").forEach(function (b) {
      b.addEventListener("click", function () {
        U.qsa("#filtros-consulta .pill-tab").forEach(function (x) { x.classList.remove("is-active"); });
        b.classList.add("is-active");
        filtro = b.getAttribute("data-filtro");
        renderLista();
      });
    });

    var campoBusca = document.getElementById("busca-consulta");
    if (campoBusca) {
      campoBusca.addEventListener("input", UI.u.debounce(function () {
        busca = campoBusca.value.toLowerCase();
        renderLista();
      }, 200));
    }

    function renderLista() {
      var host = document.getElementById("lista-consultas");
      if (!host) return;
      var lista = global.DB.consultas()
        .filter(function (c) { return filtro === "Todas" || c.status === filtro; })
        .filter(function (c) {
          if (!busca) return true;
          return (c.medico + " " + c.especialidade + " " + (c.motivo || "")).toLowerCase().indexOf(busca) >= 0;
        })
        .sort(function (a, b) {
          /* futuras primeiro (mais próximas no topo), depois passadas */
          var fa = U.diasAte(a.data) >= 0 && a.status === "Confirmada";
          var fb = U.diasAte(b.data) >= 0 && b.status === "Confirmada";
          if (fa !== fb) return fa ? -1 : 1;
          return fa ? momento(a) - momento(b) : momento(b) - momento(a);
        });

      if (!lista.length) {
        host.innerHTML =
          '<div class="empty"><div class="icon-bubble icon-bubble-lg">' + Icon.svg("search") +
          "</div><h4>Nada por aqui</h4><p>Nenhuma consulta corresponde a este filtro.</p>" +
          '<button class="btn btn-primary mt-3" data-act="agendar">' + Icon.svg("calendar-plus") +
          "Agendar teleconsulta</button></div>";
        return;
      }
      host.innerHTML = lista.map(function (c) { return cartaoConsulta(c); }).join("");
      ligarAcoesConsulta(host);
    }

    function renderCalendario() {
      var host = document.getElementById("calendario");
      if (!host) return;
      var hoje = new Date();
      var ano = hoje.getFullYear();
      var mes = hoje.getMonth();
      var primeiro = new Date(ano, mes, 1);
      var dias = new Date(ano, mes + 1, 0).getDate();
      var inicio = primeiro.getDay();

      var nomeMes = primeiro.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
      var rotulo = document.getElementById("calendario-mes");
      if (rotulo) rotulo.textContent = nomeMes.charAt(0).toUpperCase() + nomeMes.slice(1);

      var porDia = {};
      global.DB.consultas().forEach(function (c) {
        var d = new Date(c.data + "T12:00:00");
        if (d.getMonth() === mes && d.getFullYear() === ano) {
          (porDia[d.getDate()] = porDia[d.getDate()] || []).push(c);
        }
      });

      var html =
        '<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:.4rem">' +
        ["D", "S", "T", "Q", "Q", "S", "S"]
          .map(function (d) {
            return '<div class="center tiny bold mute-2" style="padding:.3rem 0">' + d + "</div>";
          })
          .join("");

      for (var i = 0; i < inicio; i++) html += "<div></div>";

      for (var dia = 1; dia <= dias; dia++) {
        var cs = porDia[dia] || [];
        var ehHoje = dia === hoje.getDate();
        var temConfirmada = cs.some(function (c) { return c.status === "Confirmada"; });
        var cor = temConfirmada
          ? "var(--brand)"
          : cs.length
          ? "var(--ink-300)"
          : "transparent";
        html +=
          '<div style="position:relative;aspect-ratio:1;display:grid;place-items:center;border-radius:var(--r-sm);' +
          "font-size:var(--t-sm);font-weight:" + (ehHoje ? "800" : "500") + ";" +
          (ehHoje ? "background:var(--brand-soft);color:var(--brand-strong);" : "") +
          (cs.length ? "cursor:pointer;" : "") +
          '" ' + (cs.length ? 'data-tip="' + U.esc(cs.map(function (c) { return c.especialidade; }).join(", ")) + '"' : "") + ">" +
          dia +
          (cs.length
            ? '<span style="position:absolute;bottom:14%;width:5px;height:5px;border-radius:50%;background:' + cor + '"></span>'
            : "") +
          "</div>";
      }
      html += "</div>";
      host.innerHTML = html;
    }

    renderLista();
    renderCalendario();

    /* atalho vindo da assistente Cris ou do menu rápido */
    if (U.param("agendar")) {
      setTimeout(function () {
        global.App.abrirAgendamento(U.param("esp") || "");
      }, 300);
    }
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
      var p = global.DB.perfil();

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
              : '<button class="btn btn-outline btn-sm" data-act="agendar" data-esp="' +
                U.esc(r.especialidade) + '">' + Icon.svg("refresh") + "Solicitar renovação</button>") +
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
