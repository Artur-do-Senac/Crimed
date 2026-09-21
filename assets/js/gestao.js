/* ============================================================================
   CRIMED · gestao.js
   Painel do profissional de saúde (agenda, fila, produtividade) e painel
   administrativo da Secretaria de Saúde (indicadores e relatórios).
   ========================================================================= */
(function (global) {
  "use strict";

  var U;
  var M = global.DB ? global.DB.metricas : null;

  function kpiTile(t) {
    return (
      '<div class="kpi"><div class="kpi-top">' +
      '<span class="kpi-label">' + t.label + "</span>" +
      '<span class="icon-bubble icon-bubble-sm ' + (t.cls || "bub-brand") + '">' + Icon.svg(t.ico) + "</span>" +
      "</div>" +
      '<div class="kpi-value" data-count="' + t.valor + '"' +
      (t.sufixo ? ' data-suffix="' + t.sufixo + '"' : "") +
      (t.dec ? ' data-dec="' + t.dec + '"' : "") + ">0</div>" +
      '<div class="kpi-foot ' + (t.tendClasse || "") + '">' +
      (t.tendIco ? Icon.svg(t.tendIco, "ico-sm") : "") + t.foot + "</div></div>"
    );
  }

  /* ######################################################################## */
  /* ####################### PAINEL DO PROFISSIONAL ######################### */
  /* ######################################################################## */
  function paginaMedico() {
    var sessao = global.App.exigirSessao(["medico", "admin"]);
    if (!sessao) return;

    var ehAdmin = sessao.papel === "admin";
    UI.shell.montar({
      page: "medico",
      titulo: ehAdmin ? "Operação e Fila" : "Agenda do Dia",
      sub: ehAdmin
        ? "Visão operacional das unidades em tempo real"
        : sessao.especialidade + " · " + (global.DB.unidade(sessao.unidade) || {}).nome,
    });

    var rotulo = document.getElementById("agenda-data");
    if (rotulo) {
      rotulo.innerHTML =
        Icon.svg("calendar") + U.diaSemana(global.DB.hoje()) + ", " + U.fmtData(global.DB.hoje());
    }

    renderKpis();
    renderAgenda();
    renderFila();
    renderProdutividade();
    renderPendencias();

    /* ------------------------------------------------------------- KPIs */
    function renderKpis() {
      var host = document.getElementById("kpis-medico");
      if (!host) return;
      var fila = global.DB.fila();
      var hoje = global.DB.consultas().filter(function (c) {
        return c.data === global.DB.hoje();
      });
      var esperaMedia = fila.length
        ? Math.round(fila.reduce(function (a, f) { return a + f.espera; }, 0) / fila.length)
        : 0;

      host.innerHTML = [
        kpiTile({
          label: "Agendados hoje", valor: hoje.length + 7, ico: "calendar-check",
          cls: "bub-brand", foot: "na sua agenda",
        }),
        kpiTile({
          label: "Na fila agora", valor: fila.length, ico: "users",
          cls: "bub-warn", foot: "aguardando atendimento",
        }),
        kpiTile({
          label: "Espera média", valor: esperaMedia, sufixo: " min", ico: "hourglass",
          cls: "bub-accent", foot: "tempo até ser chamado",
        }),
        kpiTile({
          label: "Sua avaliação", valor: 4.9, dec: 1, ico: "star",
          cls: "bub-brand", foot: "2.210 atendimentos", tendClasse: "trend-up", tendIco: "trending-up",
        }),
      ].join("");
      U.qsa("[data-count]", host).forEach(UI.countUp);
    }

    /* ----------------------------------------------------------- agenda */
    function renderAgenda() {
      var host = document.getElementById("agenda-dia");
      if (!host) return;

      var reais = global.DB.consultas().filter(function (c) {
        return c.data === global.DB.hoje() && c.status !== "Cancelada";
      });

      /* completa a agenda com pacientes fictícios da rede */
      var extras = [
        { hora: "08:00", paciente: "Sebastião Crispim", motivo: "Renovação de receita — hipertensão", status: "Realizada" },
        { hora: "08:40", paciente: "Luana Colombo", motivo: "Resultado de exame laboratorial", status: "Realizada" },
        { hora: "09:20", paciente: "Maria Aparecida Búrigo", motivo: "Tontura e pressão alta", status: "Realizada" },
        { hora: "10:00", paciente: "João Pedro Damiani", motivo: "Febre há 24h (acompanhado)", status: "Realizada" },
        { hora: "13:30", paciente: "Rosane Milanez", motivo: "Retorno — diabetes tipo 2", status: "Confirmada" },
        { hora: "15:00", paciente: "Antônio Zanette", motivo: "Dor lombar persistente", status: "Confirmada" },
        { hora: "15:40", paciente: "Cleusa Fernandes", motivo: "Primeira consulta — rede", status: "Confirmada" },
      ];

      var lista = reais
        .map(function (c) {
          return {
            hora: c.hora, paciente: c.paciente || global.DB.perfil().nome,
            motivo: c.motivo, status: c.status, id: c.id, destaque: true,
          };
        })
        .concat(extras)
        .sort(function (a, b) { return a.hora.localeCompare(b.hora); });

      host.innerHTML = lista
        .map(function (a) {
          var pode = a.status === "Confirmada" || a.status === "Em andamento";
          return (
            '<div class="consulta-item' + (a.destaque ? " is-hoje" : "") + '">' +
            '<div class="center" style="min-width:56px">' +
            '<div class="bold mono" style="font-size:var(--t-md)">' + U.esc(a.hora) + "</div>" +
            '<div class="tiny mute-2">' + (pode ? "hoje" : "feito") + "</div></div>" +
            '<div class="avatar">' + U.iniciais(a.paciente) + "</div>" +
            '<div class="consulta-main"><h4>' + U.esc(a.paciente) +
            (a.destaque ? '<span class="badge badge-brand">' + Icon.svg("star") + "Seu paciente</span>" : "") +
            "</h4>" +
            '<p class="small muted">' + U.esc(a.motivo || "—") + "</p></div>" +
            '<div class="consulta-actions">' +
            (pode
              ? '<button class="btn btn-primary btn-sm" data-atender="' + (a.id || "") + '">' +
                Icon.svg("video") + "Atender</button>"
              : '<span class="badge badge-realizada">' + Icon.svg("check-circle") + "Atendido</span>") +
            '<button class="btn btn-ghost btn-sm" data-ver="' + U.esc(a.paciente) + '" data-tip="Ver prontuário">' +
            Icon.svg("file-medical") + "</button>" +
            "</div></div>"
          );
        })
        .join("");

      U.qsa("[data-atender]", host).forEach(function (b) {
        b.addEventListener("click", function () {
          var id = b.getAttribute("data-atender");
          location.href = "teleconsulta.html?papel=medico" + (id ? "&consulta=" + id : "");
        });
      });
      U.qsa("[data-ver]", host).forEach(function (b) {
        b.addEventListener("click", function () { abrirPaciente(b.getAttribute("data-ver")); });
      });
    }

    /* -------------------------------------------------------------- fila */
    function renderFila() {
      var host = document.getElementById("fila-espera");
      if (!host) return;
      var fila = global.DB.fila().sort(function (a, b) {
        var ordem = { Vermelho: 0, Amarelo: 1, Verde: 2, Azul: 3 };
        if (ordem[a.risco] !== ordem[b.risco]) return ordem[a.risco] - ordem[b.risco];
        return b.espera - a.espera;
      });

      var cont = document.getElementById("fila-contador");
      if (cont) cont.textContent = fila.length + " aguardando";

      if (!fila.length) {
        host.innerHTML =
          '<div class="empty"><div class="icon-bubble icon-bubble-lg">' + Icon.svg("check-circle") +
          "</div><h4>Fila vazia</h4><p>Nenhum paciente aguardando atendimento no momento.</p></div>";
        return;
      }

      host.innerHTML = fila
        .map(function (f) {
          var un = global.DB.unidade(f.unidade);
          return (
            '<div class="fila-item risco-' + f.risco + '">' +
            '<div class="avatar avatar-sm">' + U.iniciais(f.paciente) + "</div>" +
            '<div class="fila-main"><strong>' + U.esc(f.paciente) + '<span class="tiny mute-2"> · ' +
            f.idade + " anos</span></strong>" +
            "<p>" + U.esc(f.motivo) + "</p>" +
            '<span class="tiny mute-2">' + U.esc(un ? un.nome : "") + "</span></div>" +
            '<div class="center"><div class="badge badge-outline">' + Icon.svg("clock") + f.espera + " min</div>" +
            '<div class="tiny bold mt-1" style="color:' +
            ({ Vermelho: "#d94f5c", Amarelo: "#e8a34e", Verde: "var(--green-500)", Azul: "var(--blue-500)" }[f.risco]) +
            '">Risco ' + f.risco + "</div></div>" +
            '<button class="btn btn-soft btn-sm" data-chamar="' + f.id + '">' +
            Icon.svg("video") + "Chamar</button></div>"
          );
        })
        .join("");

      U.qsa("[data-chamar]", host).forEach(function (b) {
        b.addEventListener("click", function () {
          var f = global.DB.fila().filter(function (x) { return x.id === b.getAttribute("data-chamar"); })[0];
          UI.toast("Chamando " + f.paciente + " para a sala virtual…", "info");
          setTimeout(function () {
            location.href =
              "teleconsulta.html?papel=medico" + (f.consultaId ? "&consulta=" + f.consultaId : "");
          }, 1100);
        });
      });
    }

    /* ------------------------------------------------------ produtividade */
    function renderProdutividade() {
      var host = document.getElementById("grafico-produtividade");
      if (!host || !global.Chart) return;
      global.Chart.linha(host, {
        labels: M.labels,
        sufixo: " consultas",
        series: [
          { nome: "Teleconsultas", dados: [41, 52, 63, 71, 84, 96, 108, 121, 134], cor: "#208049" },
          { nome: "Presenciais", dados: [96, 92, 88, 81, 76, 70, 64, 59, 52], cor: "#2098FB" },
        ],
      });
    }

    /* --------------------------------------------------------- pendências */
    function renderPendencias() {
      var host = document.getElementById("pendencias");
      if (!host) return;
      var itens = [
        { ico: "file-text", cls: "bub-warn", t: "3 prontuários sem conduta registrada", s: "Atendimentos de ontem" },
        { ico: "flask", cls: "bub-accent", t: "5 resultados de exame para avaliar", s: "Laboratório Municipal" },
        { ico: "pill", cls: "bub-brand", t: "2 pedidos de renovação de receita", s: "Uso contínuo" },
        { ico: "message", cls: "bub-brand", t: "4 mensagens de pacientes", s: "Via portal" },
      ];
      host.innerHTML = itens
        .map(function (i) {
          return (
            '<div class="exame-item">' +
            '<div class="icon-bubble icon-bubble-sm ' + i.cls + '">' + Icon.svg(i.ico) + "</div>" +
            '<div style="flex:1;min-width:160px"><strong class="small">' + i.t + "</strong>" +
            '<p class="tiny mute-2">' + i.s + "</p></div>" +
            '<button class="btn btn-ghost btn-sm" data-pend="' + U.esc(i.t) + '">' +
            Icon.svg("chevron-right") + "</button></div>"
          );
        })
        .join("");
      U.qsa("[data-pend]", host).forEach(function (b) {
        b.addEventListener("click", function () {
          UI.toast("Abrindo: " + b.getAttribute("data-pend") + ".", "info");
        });
      });
    }

    /* ------------------------------------------------ prontuário rápido */
    function abrirPaciente(nome) {
      var p = global.DB.perfil();
      var ehTitular = nome === p.nome;
      document.getElementById("pac-nome").textContent = nome;
      document.getElementById("pac-sub").textContent = ehTitular
        ? "Prontuário completo disponível na rede municipal"
        : "Paciente da rede municipal · dados de demonstração";

      var consultas = ehTitular
        ? global.DB.consultas().filter(function (c) { return c.status === "Realizada"; })
        : [];

      document.getElementById("pac-corpo").innerHTML =
        '<div class="resumo-box mb-3">' +
        '<div class="resumo-linha"><span>Alergias</span><b>' +
        U.esc(ehTitular ? p.alergias || "Nenhuma" : "Não informado") + "</b></div>" +
        '<div class="resumo-linha"><span>Condições</span><b>' +
        U.esc(ehTitular ? p.condicoes || "Nenhuma" : "Não informado") + "</b></div>" +
        '<div class="resumo-linha"><span>Tipo sanguíneo</span><b>' +
        U.esc(ehTitular ? p.tipoSanguineo || "—" : "—") + "</b></div></div>" +
        (consultas.length
          ? '<h4 class="mb-2">Atendimentos anteriores</h4>' +
            consultas
              .map(function (c) {
                return (
                  '<div class="pront-section"><h5>' + Icon.svg("calendar") +
                  U.fmtData(c.data) + " · " + U.esc(c.especialidade) + "</h5>" +
                  "<p>" + U.esc(c.resumo || "Sem registro.") + "</p></div>"
                );
              })
              .join("")
          : '<p class="small muted">Sem histórico clínico registrado no protótipo.</p>');

      document.getElementById("pac-atender").onclick = function () {
        location.href = "teleconsulta.html?papel=medico";
      };
      UI.modal.open("modal-paciente");
    }
  }

  /* ######################################################################## */
  /* ####################### PAINEL ADMINISTRATIVO ######################### */
  /* ######################################################################## */
  function paginaAdmin() {
    var sessao = global.App.exigirSessao(["admin", "medico"]);
    if (!sessao) return;

    UI.shell.montar({
      page: "admin",
      titulo: "Painel de Indicadores",
      sub: "Secretaria Municipal de Saúde de Criciúma · dados do programa PTSE-001",
      acoes:
        '<button class="btn btn-outline btn-sm" id="btn-atualizar">' +
        Icon.svg("refresh") + "Atualizar</button>",
    });

    var periodo = 9;

    renderKpis();
    renderMigracao();
    renderSatisfacao();
    renderEspecialidades();
    renderEspera();
    renderUnidades();
    renderMetas();
    renderTabela();

    U.qsa("#seg-periodo button").forEach(function (b) {
      b.addEventListener("click", function () {
        U.qsa("#seg-periodo button").forEach(function (x) { x.classList.remove("is-active"); });
        b.classList.add("is-active");
        periodo = parseInt(b.getAttribute("data-periodo"), 10);
        renderMigracao();
        renderEspera();
      });
    });

    var btnAtualizar = document.getElementById("btn-atualizar");
    if (btnAtualizar) {
      btnAtualizar.addEventListener("click", function () {
        btnAtualizar.classList.add("is-loading");
        setTimeout(function () {
          btnAtualizar.classList.remove("is-loading");
          renderMigracao();
          renderSatisfacao();
          renderEspecialidades();
          renderEspera();
          renderUnidades();
          UI.toast("Indicadores atualizados com os dados mais recentes.", "success");
        }, 800);
      });
    }

    document.getElementById("btn-csv").addEventListener("click", exportarCsv);
    document.getElementById("btn-relatorio").addEventListener("click", relatorioGerencial);

    /* -------------------------------------------------------------- KPIs */
    function renderKpis() {
      var host = document.getElementById("kpis-admin");
      var k = M.kpis;
      host.innerHTML = [
        kpiTile({ label: "Teleconsultas", valor: k.teleconsultas, ico: "video", cls: "bub-brand",
          foot: "+11,4% vs. mês anterior", tendClasse: "trend-up", tendIco: "trending-up" }),
        kpiTile({ label: "Espera média", valor: k.esperaDias, sufixo: " dias", ico: "hourglass", cls: "bub-accent",
          foot: "−66% desde o início", tendClasse: "trend-up", tendIco: "trending-down" }),
        kpiTile({ label: "Satisfação", valor: k.satisfacao, sufixo: "%", ico: "award", cls: "bub-brand",
          foot: "meta do projeto: 85%", tendClasse: "trend-up", tendIco: "trending-up" }),
        kpiTile({ label: "Absenteísmo", valor: k.faltas, dec: 1, sufixo: "%", ico: "user", cls: "bub-warn",
          foot: "faltas em consultas marcadas", tendClasse: "trend-up", tendIco: "trending-down" }),
        kpiTile({ label: "Deslocamento evitado", valor: k.economiaKm, sufixo: " km", ico: "map-pin",
          cls: "bub-brand", foot: "≈ 5,8 t de CO₂ não emitidas" }),
        kpiTile({ label: "Unidades ativas", valor: k.unidadesAtivas, ico: "building", cls: "bub-accent",
          foot: "de 10 UBS do município" }),
        kpiTile({ label: "Profissionais", valor: k.profissionais, ico: "stethoscope", cls: "bub-brand",
          foot: "habilitados na plataforma" }),
        kpiTile({ label: "Pacientes cadastrados", valor: k.pacientes, ico: "users", cls: "bub-accent",
          foot: "com Cartão SUS vinculado" }),
      ].join("");
      U.qsa("[data-count]", host).forEach(UI.countUp);
    }

    function corte(arr) {
      return arr.slice(arr.length - periodo);
    }

    function renderMigracao() {
      global.Chart.linha(document.getElementById("grafico-migracao"), {
        labels: corte(M.labels),
        series: [
          { nome: "Teleconsultas", dados: corte(M.teleconsultas), cor: "#208049" },
          { nome: "Presenciais (baixa complexidade)", dados: corte(M.presenciais), cor: "#2098FB" },
        ],
      });
    }

    function renderSatisfacao() {
      global.Chart.gauge(document.getElementById("grafico-satisfacao"), {
        valor: M.kpis.satisfacao,
        rotulo: M.kpis.satisfacao + "%",
        legenda: "avaliações positivas",
      });
      var a = M.avaliacoes;
      var total = a.cinco + a.quatro + a.tres + a.dois + a.um;
      var linhas = [
        ["5 estrelas", a.cinco], ["4 estrelas", a.quatro], ["3 estrelas", a.tres],
        ["2 estrelas", a.dois], ["1 estrela", a.um],
      ];
      document.getElementById("satisfacao-detalhe").innerHTML = linhas
        .map(function (l) {
          var pct = Math.round((l[1] / total) * 100);
          return (
            '<div class="hbar" style="margin-bottom:.5rem">' +
            '<div class="hbar-label"><span class="tiny">' + l[0] + "</span>" +
            '<b class="tiny">' + pct + "%</b></div>" +
            '<div class="hbar-track"><div class="hbar-fill" style="width:' + pct +
            "%;background:" + (pct > 40 ? "var(--brand)" : pct > 10 ? "var(--green-300)" : "var(--ink-300)") +
            '"></div></div></div>'
          );
        })
        .join("") +
        '<p class="tiny mute-2 center mt-2">' + U.num(total) + " avaliações recebidas</p>";
    }

    function renderEspecialidades() {
      global.Chart.donut(document.getElementById("grafico-especialidades"), {
        dados: M.especialidades.map(function (e) { return { nome: e.nome, valor: e.valor }; }),
        centroLabel: "teleconsultas",
      });
    }

    function renderEspera() {
      global.Chart.barras(document.getElementById("grafico-espera"), {
        labels: corte(M.labels),
        sufixo: " dias",
        series: [{ nome: "Dias de espera", dados: corte(M.esperaDias), cor: "#D98324" }],
      });
    }

    function renderUnidades() {
      global.Chart.barrasH(document.getElementById("grafico-unidades"), {
        dados: global.DB.unidades.map(function (u, i) {
          return {
            nome: u.nome.replace("UBS ", ""),
            valor: u.teleconsultas,
            cor: i < 3 ? "#208049" : i < 6 ? "#4FB173" : "#88C570",
          };
        }),
      });
    }

    function renderMetas() {
      var metas = [
        { t: "Satisfação acima de 85%", atual: 93, alvo: 85, unidade: "%", ok: true },
        { t: "Espera máxima de 10 dias", atual: 7, alvo: 10, unidade: " dias", ok: true, inverso: true },
        { t: "10 UBS integradas", atual: 10, alvo: 10, unidade: " UBS", ok: true },
        { t: "Absenteísmo abaixo de 8%", atual: 6.4, alvo: 8, unidade: "%", ok: true, inverso: true },
        { t: "Zero incidentes de privacidade", atual: 0, alvo: 0, unidade: "", ok: true },
        { t: "Orçamento dentro do teto", atual: 287, alvo: 313.5, unidade: " mil", ok: true, inverso: true },
      ];
      document.getElementById("metas").innerHTML = metas
        .map(function (m) {
          var pct = m.inverso
            ? Math.min(100, Math.round(((m.alvo - m.atual) / (m.alvo || 1)) * 100) + 40)
            : Math.min(100, Math.round((m.atual / (m.alvo || 1)) * 100));
          return (
            '<div class="exame-item" style="border:none;padding:.6rem 0">' +
            '<div class="icon-bubble icon-bubble-sm ' + (m.ok ? "bub-brand" : "bub-warn") + '">' +
            Icon.svg(m.ok ? "check" : "alert-circle") + "</div>" +
            '<div style="flex:1;min-width:170px"><strong class="small">' + m.t + "</strong>" +
            '<div class="progress mt-1" style="height:6px"><div class="hbar-fill" style="width:' + pct +
            '%;background:' + (m.ok ? "var(--brand)" : "var(--warn)") + ';height:100%"></div></div></div>' +
            '<span class="badge ' + (m.ok ? "badge-ok" : "badge-warn") + '">' +
            m.atual + m.unidade + "</span></div>"
          );
        })
        .join("");
    }

    function dadosTabela() {
      return global.DB.unidades.map(function (u, i) {
        var absent = (4.2 + ((i * 7) % 9) * 0.45).toFixed(1);
        var sat = 88 + ((i * 3) % 10);
        return {
          nome: u.nome, bairro: u.bairro, equipes: u.equipes,
          tele: u.teleconsultas, absent: absent, sat: sat,
          situacao: sat >= 92 ? "Ótima" : sat >= 89 ? "Boa" : "Atenção",
        };
      });
    }

    function renderTabela() {
      var tb = document.getElementById("tabela-unidades");
      tb.innerHTML = dadosTabela()
        .map(function (d) {
          var cls = d.situacao === "Ótima" ? "badge-ok" : d.situacao === "Boa" ? "badge-info" : "badge-warn";
          return (
            '<tr><td class="td-strong">' + U.esc(d.nome) + "</td>" +
            "<td>" + U.esc(d.bairro) + "</td><td>" + d.equipes + "</td>" +
            "<td>" + U.num(d.tele) + "</td><td>" + d.absent + "%</td><td>" + d.sat + "%</td>" +
            '<td><span class="badge ' + cls + '">' + d.situacao + "</span></td></tr>"
          );
        })
        .join("");
    }

    function exportarCsv() {
      var linhas = [["Unidade", "Bairro", "Equipes", "Teleconsultas", "Absenteismo (%)", "Satisfacao (%)", "Situacao"]];
      dadosTabela().forEach(function (d) {
        linhas.push([d.nome, d.bairro, d.equipes, d.tele, d.absent, d.sat, d.situacao]);
      });
      var csv = "﻿" + linhas.map(function (l) { return l.join(";"); }).join("\n");
      var blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      var a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "crimed-indicadores-unidades.csv";
      document.body.appendChild(a);
      a.click();
      a.remove();
      UI.toast("Arquivo CSV gerado — pronto para abrir no Excel.", "success");
    }

    function relatorioGerencial() {
      var w = window.open("", "_blank", "width=900,height=700");
      if (!w) return UI.toast("Permita pop-ups para gerar o relatório.", "warn");
      var k = M.kpis;
      var hoje = new Date().toLocaleDateString("pt-BR");
      w.document.write(
        "<!doctype html><html lang='pt-BR'><head><meta charset='utf-8'>" +
        "<title>Relatório Gerencial — CRIMED</title><style>" +
        "body{font-family:'Segoe UI',Arial,sans-serif;color:#1a1a1a;padding:36px;max-width:860px;margin:auto;line-height:1.6}" +
        "header{border-bottom:3px solid #208049;padding-bottom:14px;margin-bottom:24px}" +
        "h1{color:#013D00;font-size:22px;margin:0}h1 small{display:block;font-size:11px;color:#666;text-transform:uppercase;letter-spacing:.12em;margin-top:3px}" +
        "h2{font-size:13px;text-transform:uppercase;letter-spacing:.07em;color:#208049;margin:26px 0 8px}" +
        ".grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:8px}" +
        ".k{border:1px solid #e0e6e1;border-radius:8px;padding:10px 12px}" +
        ".k b{display:block;font-size:20px;color:#013D00}.k span{font-size:10px;color:#666;text-transform:uppercase;letter-spacing:.06em}" +
        "table{width:100%;border-collapse:collapse;font-size:12px;margin-top:6px}" +
        "th,td{text-align:left;padding:6px 8px;border-bottom:1px solid #e6ebe7}th{background:#f0f4f1;font-size:10px;text-transform:uppercase}" +
        "footer{margin-top:30px;border-top:1px solid #e6ebe7;padding-top:10px;font-size:10px;color:#888;text-align:center}" +
        "@media print{body{padding:0}}</style></head><body>" +
        "<header><h1>Relatório Gerencial<small>CRIMED · Programa Tele-Saúde Expandido (PTSE-001)</small></h1></header>" +
        "<p><b>Emitido em:</b> " + hoje + " &nbsp;·&nbsp; <b>Responsável:</b> Secretaria Municipal de Saúde de Criciúma</p>" +
        "<h2>Indicadores consolidados</h2><div class='grid'>" +
        [["Teleconsultas", U.num(k.teleconsultas)], ["Espera média", k.esperaDias + " dias"],
         ["Satisfação", k.satisfacao + "%"], ["Absenteísmo", k.faltas + "%"],
         ["Deslocamento evitado", U.num(k.economiaKm) + " km"], ["Unidades ativas", k.unidadesAtivas],
         ["Profissionais", k.profissionais], ["Pacientes", U.num(k.pacientes)]]
          .map(function (i) { return "<div class='k'><b>" + i[1] + "</b><span>" + i[0] + "</span></div>"; })
          .join("") +
        "</div><h2>Operação por unidade</h2>" +
        "<table><thead><tr><th>Unidade</th><th>Bairro</th><th>Equipes</th><th>Teleconsultas</th>" +
        "<th>Absenteísmo</th><th>Satisfação</th><th>Situação</th></tr></thead><tbody>" +
        dadosTabela()
          .map(function (d) {
            return "<tr><td>" + d.nome + "</td><td>" + d.bairro + "</td><td>" + d.equipes +
              "</td><td>" + U.num(d.tele) + "</td><td>" + d.absent + "%</td><td>" + d.sat +
              "%</td><td>" + d.situacao + "</td></tr>";
          })
          .join("") +
        "</tbody></table>" +
        "<h2>Evolução do atendimento</h2><table><thead><tr><th>Mês</th><th>Teleconsultas</th>" +
        "<th>Presenciais</th><th>Canceladas</th><th>Espera (dias)</th><th>Satisfação</th></tr></thead><tbody>" +
        M.labels
          .map(function (l, i) {
            return "<tr><td>" + l + "</td><td>" + M.teleconsultas[i] + "</td><td>" + M.presenciais[i] +
              "</td><td>" + M.canceladas[i] + "</td><td>" + M.esperaDias[i] + "</td><td>" +
              M.satisfacao[i] + "%</td></tr>";
          })
          .join("") +
        "</tbody></table>" +
        "<footer>Documento gerado automaticamente pelo painel CRIMED · Protótipo acadêmico com dados simulados</footer>" +
        "<script>window.onload=function(){window.print()}<\/script></body></html>"
      );
      w.document.close();
      UI.toast("Relatório gerado — pronto para imprimir ou salvar em PDF.", "success");
    }
  }

  /* ================================================================== BOOT */
  function init() {
    U = UI.u;
    M = global.DB.metricas;
    var page = document.body.getAttribute("data-page");
    if (page === "medico") paginaMedico();
    if (page === "admin") paginaAdmin();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})(window);
