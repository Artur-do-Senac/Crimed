/* ============================================================================
   CRIMED · app.js
   Componentes compartilhados (wizard de agendamento, avaliação, LGPD) e os
   controladores das páginas pública, de acesso e de perfil.
   ========================================================================= */
(function (global) {
  "use strict";

  var App = {};
  var U;

  /* ====================================================== GUARDA DE SESSÃO */
  App.exigirSessao = function (papeis) {
    var s = global.DB.sessao();
    if (!s) {
      location.replace("acesso.html?destino=" + encodeURIComponent(location.pathname.split("/").pop() + location.search));
      return null;
    }
    if (papeis && papeis.indexOf(s.papel) < 0) {
      UI.toast("Seu perfil não tem acesso a esta área. Redirecionando…", "warn");
      setTimeout(function () { location.replace(s.home || "dashboard.html"); }, 1200);
      return null;
    }
    return s;
  };

  /* =============================================================== LGPD */
  App.barraLgpd = function () {
    var host = document.getElementById("lgpd-root");
    if (!host || global.DB.lgpdAceito()) return;

    host.innerHTML =
      '<div class="lgpd-bar" id="lgpd-bar" role="region" aria-label="Aviso de privacidade">' +
      '<div class="icon-bubble bub-brand">' + Icon.svg("lock") + "</div>" +
      '<div class="lgpd-text"><strong>Privacidade e proteção de dados</strong>' +
      "<p>Este portal usa apenas armazenamento local do seu navegador para manter sua " +
      "sessão de demonstração. Nenhum dado de saúde é enviado a servidores. " +
      "Tratamento conforme a Lei 13.709/2018 (LGPD).</p></div>" +
      '<div class="lgpd-actions">' +
      '<a class="btn btn-ghost btn-sm" href="perfil.html">Saiba mais</a>' +
      '<button class="btn btn-primary btn-sm" id="lgpd-ok">Entendi e concordo</button>' +
      "</div></div>";

    var bar = document.getElementById("lgpd-bar");
    setTimeout(function () { bar.classList.add("is-on"); }, 1400);
    document.getElementById("lgpd-ok").addEventListener("click", function () {
      global.DB.aceitarLgpd();
      bar.classList.remove("is-on");
      UI.toast("Consentimento registrado. Você pode revogá-lo no seu perfil.", "success");
    });
  };

  /* ================================================= WIZARD DE AGENDAMENTO */
  var wiz = { passo: 0, esp: "", medicoId: "", data: "", hora: "", motivo: "" };

  App.montarWizard = function () {
    if (document.getElementById("modal-agendar")) return;
    var el = document.createElement("div");
    el.className = "modal";
    el.id = "modal-agendar";
    el.innerHTML =
      '<div class="modal-box modal-box-lg">' +
      '<button class="modal-close" data-close-modal>' + Icon.svg("close") + "</button>" +
      '<div class="modal-head"><h3>' + Icon.svg("calendar-plus") + "Agendar teleconsulta</h3>" +
      '<p id="wiz-sub">Passo 1 de 4 · Escolha a especialidade</p></div>' +
      '<div class="wizard-steps">' +
      '<span class="wizard-step is-current"></span><span class="wizard-step"></span>' +
      '<span class="wizard-step"></span><span class="wizard-step"></span></div>' +

      /* passo 1 */
      '<div class="wizard-pane is-active" data-pane="0">' +
      '<div class="wizard-label">Do que você precisa?</div>' +
      '<div class="chip-group" id="wiz-esp"></div>' +
      '<p class="small muted mt-3">' +
      "Não sabe qual escolher? A assistente Cris ajuda na triagem pelo botão flutuante." +
      "</p></div>" +

      /* passo 2 */
      '<div class="wizard-pane" data-pane="1">' +
      '<div class="wizard-label">Profissionais disponíveis</div>' +
      '<div id="wiz-medicos"></div></div>' +

      /* passo 3 */
      '<div class="wizard-pane" data-pane="2">' +
      '<div class="field-row">' +
      '<div class="field"><label for="wiz-data">Data da consulta</label>' +
      '<input type="date" id="wiz-data" /></div>' +
      '<div class="field"><label>Unidade de referência</label>' +
      '<input type="text" id="wiz-unidade" readonly /></div></div>' +
      '<div class="wizard-label mt-2">Horários livres</div>' +
      '<div class="chip-group" id="wiz-horas"></div>' +
      '<div class="field mt-3"><label for="wiz-motivo">Motivo da consulta (opcional)</label>' +
      '<textarea id="wiz-motivo" rows="2" placeholder="Ex.: retorno para avaliar resultado de exame"></textarea></div>' +
      "</div>" +

      /* passo 4 */
      '<div class="wizard-pane" data-pane="3">' +
      '<div class="resumo-box" id="wiz-resumo"></div>' +
      '<label class="check mt-3"><input type="checkbox" id="wiz-lgpd" checked />' +
      "<span>Autorizo o acesso do profissional ao meu prontuário eletrônico durante o atendimento, " +
      "conforme a LGPD (Lei 13.709/2018).</span></label></div>" +

      '<div class="modal-foot">' +
      '<button class="btn btn-ghost" id="wiz-voltar">' + Icon.svg("arrow-left") + "Voltar</button>" +
      '<button class="btn btn-primary" id="wiz-avancar">Continuar' + Icon.svg("arrow-right") + "</button>" +
      "</div></div>";
    document.body.appendChild(el);

    /* especialidades */
    var espHost = document.getElementById("wiz-esp");
    espHost.innerHTML = global.DB.especialidades
      .map(function (e) {
        return '<button class="chip" data-esp="' + U.esc(e) + '">' + U.esc(e) + "</button>";
      })
      .join("");
    espHost.addEventListener("click", function (ev) {
      var b = ev.target.closest("[data-esp]");
      if (!b) return;
      U.qsa(".chip", espHost).forEach(function (c) { c.classList.remove("is-active"); });
      b.classList.add("is-active");
      wiz.esp = b.getAttribute("data-esp");
      wiz.medicoId = "";
    });

    document.getElementById("wiz-avancar").addEventListener("click", avancar);
    document.getElementById("wiz-voltar").addEventListener("click", voltar);

    var inputData = document.getElementById("wiz-data");
    inputData.min = global.DB.hoje();
    inputData.addEventListener("change", function () {
      wiz.data = inputData.value;
      renderHorarios();
    });
  };

  function irParaPasso(n) {
    wiz.passo = n;
    U.qsa("#modal-agendar .wizard-pane").forEach(function (p, i) {
      p.classList.toggle("is-active", i === n);
    });
    U.qsa("#modal-agendar .wizard-step").forEach(function (s, i) {
      s.classList.toggle("is-done", i < n);
      s.classList.toggle("is-current", i === n);
    });
    var subs = [
      "Passo 1 de 4 · Escolha a especialidade",
      "Passo 2 de 4 · Escolha o profissional",
      "Passo 3 de 4 · Data e horário",
      "Passo 4 de 4 · Confirmação",
    ];
    document.getElementById("wiz-sub").textContent = subs[n];
    document.getElementById("wiz-voltar").style.visibility = n === 0 ? "hidden" : "visible";
    var av = document.getElementById("wiz-avancar");
    av.innerHTML = n === 3 ? Icon.svg("check") + "Confirmar agendamento" : "Continuar" + Icon.svg("arrow-right");
  }

  function renderMedicos() {
    var host = document.getElementById("wiz-medicos");
    var lista = global.DB.medicosPorEspecialidade(wiz.esp);
    host.innerHTML = lista
      .map(function (m) {
        var u = global.DB.unidade(m.unidade);
        return (
          '<button class="doc-pick" data-med="' + m.id + '">' +
          '<div class="avatar avatar-doc">' + U.iniciais(m.nome) + "</div>" +
          '<div class="doc-pick-info"><strong>' + U.esc(m.nome) + "</strong>" +
          "<span>" + U.esc(m.crm) + " · " + U.esc(u ? u.nome : "") + "</span></div>" +
          '<span class="doc-pick-note">' + Icon.svg("star", "ico-sm") + m.nota.toFixed(1) + "</span></button>"
        );
      })
      .join("");
    host.onclick = function (ev) {
      var b = ev.target.closest("[data-med]");
      if (!b) return;
      U.qsa(".doc-pick", host).forEach(function (d) { d.classList.remove("is-active"); });
      b.classList.add("is-active");
      wiz.medicoId = b.getAttribute("data-med");
      var m = global.DB.medico(wiz.medicoId);
      var un = global.DB.unidade(m.unidade);
      document.getElementById("wiz-unidade").value = un ? un.nome : "—";
    };
  }

  function renderHorarios() {
    var host = document.getElementById("wiz-horas");
    var m = global.DB.medico(wiz.medicoId);
    if (!m || !wiz.data) {
      host.innerHTML = '<p class="small muted">Selecione uma data para ver os horários.</p>';
      return;
    }
    var ocupados = global.DB.consultas()
      .filter(function (c) {
        return c.medicoId === m.id && c.data === wiz.data && c.status === "Confirmada";
      })
      .map(function (c) { return c.hora; });

    host.innerHTML = m.horarios
      .map(function (h, i) {
        /* horários "ocupados" simulados de forma estável por data */
        var pseudo = (wiz.data.charCodeAt(9) + i * 7) % 5 === 0;
        var indisponivel = ocupados.indexOf(h) >= 0 || pseudo;
        return (
          '<button class="chip" data-hora="' + h + '"' + (indisponivel ? " disabled" : "") + ">" +
          h + "</button>"
        );
      })
      .join("");
    host.onclick = function (ev) {
      var b = ev.target.closest("[data-hora]");
      if (!b || b.disabled) return;
      U.qsa(".chip", host).forEach(function (c) { c.classList.remove("is-active"); });
      b.classList.add("is-active");
      wiz.hora = b.getAttribute("data-hora");
    };
  }

  function renderResumo() {
    var m = global.DB.medico(wiz.medicoId);
    var un = global.DB.unidade(m.unidade);
    wiz.motivo = document.getElementById("wiz-motivo").value.trim();
    document.getElementById("wiz-resumo").innerHTML =
      '<div class="resumo-linha"><span>Especialidade</span><b>' + U.esc(wiz.esp) + "</b></div>" +
      '<div class="resumo-linha"><span>Profissional</span><b>' + U.esc(m.nome) + "</b></div>" +
      '<div class="resumo-linha"><span>Unidade de referência</span><b>' + U.esc(un ? un.nome : "—") + "</b></div>" +
      '<div class="resumo-linha"><span>Data</span><b>' + U.fmtDataLonga(wiz.data) + "</b></div>" +
      '<div class="resumo-linha"><span>Horário</span><b>' + U.esc(wiz.hora) + "</b></div>" +
      '<div class="resumo-linha"><span>Modalidade</span><b>Teleconsulta por vídeo</b></div>' +
      (wiz.motivo ? '<div class="resumo-linha"><span>Motivo</span><b>' + U.esc(wiz.motivo) + "</b></div>" : "");
  }

  function avancar() {
    if (wiz.passo === 0) {
      if (!wiz.esp) return UI.toast("Escolha uma especialidade para continuar.", "warn");
      renderMedicos();
      return irParaPasso(1);
    }
    if (wiz.passo === 1) {
      if (!wiz.medicoId) return UI.toast("Escolha um profissional para continuar.", "warn");
      renderHorarios();
      return irParaPasso(2);
    }
    if (wiz.passo === 2) {
      if (!wiz.data) return UI.toast("Selecione a data da consulta.", "warn");
      if (!wiz.hora) return UI.toast("Selecione um horário disponível.", "warn");
      renderResumo();
      return irParaPasso(3);
    }
    if (wiz.passo === 3) {
      if (!document.getElementById("wiz-lgpd").checked) {
        return UI.toast("É necessário autorizar o acesso ao prontuário.", "warn");
      }
      confirmarAgendamento();
    }
  }

  function voltar() {
    if (wiz.passo > 0) irParaPasso(wiz.passo - 1);
  }

  function confirmarAgendamento() {
    var btn = document.getElementById("wiz-avancar");
    btn.classList.add("is-loading");

    setTimeout(function () {
      var m = global.DB.medico(wiz.medicoId);
      var perfil = global.DB.perfil();
      var nova = {
        id: Date.now(),
        medicoId: m.id,
        medico: m.nome,
        especialidade: m.especialidade,
        unidade: m.unidade,
        data: wiz.data,
        hora: wiz.hora,
        status: "Confirmada",
        motivo: wiz.motivo || "Consulta agendada pelo portal",
        resumo: "",
        conduta: "",
        anamnese: "",
        paciente: perfil.nome,
      };
      var lista = global.DB.consultas();
      lista.push(nova);
      global.DB.salvarConsultas(lista);

      global.DB.notificar({
        tipo: "consulta",
        titulo: "Teleconsulta agendada",
        texto:
          m.especialidade + " com " + m.nome + " em " + U.fmtData(wiz.data) + " às " + wiz.hora + ".",
        link: "consultas.html",
      });

      btn.classList.remove("is-loading");
      UI.modal.close("modal-agendar");
      UI.confete();
      UI.toast(
        "Sua teleconsulta de " + U.esc(m.especialidade) + " foi confirmada para " +
          U.fmtData(wiz.data) + " às " + wiz.hora + ".",
        "success",
        "Agendamento confirmado!"
      );
      UI.shell.atualizarBadge();

      /* reinicia o wizard */
      wiz = { passo: 0, esp: "", medicoId: "", data: "", hora: "", motivo: "" };
      U.qsa("#wiz-esp .chip").forEach(function (c) { c.classList.remove("is-active"); });
      document.getElementById("wiz-data").value = "";
      document.getElementById("wiz-motivo").value = "";
      irParaPasso(0);

      if (global.Paciente && global.Paciente.recarregar) global.Paciente.recarregar();
    }, 900);
  }

  App.abrirAgendamento = function (especialidade) {
    App.montarWizard();
    irParaPasso(0);
    if (especialidade) {
      var b = document.querySelector('#wiz-esp [data-esp="' + especialidade + '"]');
      if (b) {
        U.qsa("#wiz-esp .chip").forEach(function (c) { c.classList.remove("is-active"); });
        b.classList.add("is-active");
        wiz.esp = especialidade;
      }
    }
    UI.modal.open("modal-agendar");
  };

  /* ================================================== MODAL DE AVALIAÇÃO */
  App.montarAvaliacao = function () {
    if (document.getElementById("modal-avaliar")) return;
    var estrelas = "";
    for (var i = 1; i <= 5; i++) {
      estrelas += '<button type="button" data-nota="' + i + '" aria-label="' + i + ' estrelas">' + Icon.svg("star") + "</button>";
    }
    var el = document.createElement("div");
    el.className = "modal";
    el.id = "modal-avaliar";
    el.innerHTML =
      '<div class="modal-box">' +
      '<button class="modal-close" data-close-modal>' + Icon.svg("close") + "</button>" +
      '<div class="modal-head"><h3>' + Icon.svg("star") + "Avaliar atendimento</h3>" +
      "<p>Sua avaliação ajuda a melhorar o serviço para toda a população de Criciúma.</p></div>" +
      '<div class="center mb-2"><div class="stars" id="aval-estrelas">' + estrelas + "</div>" +
      '<p class="small muted mt-1" id="aval-legenda">Toque nas estrelas para avaliar</p></div>' +
      '<div class="field"><label>O que funcionou bem?</label>' +
      '<div class="chip-group" id="aval-tags">' +
      ['Atendimento rápido', 'Profissional atencioso', 'Fácil de usar', 'Qualidade do vídeo', 'Evitei deslocamento']
        .map(function (t) { return '<button type="button" class="chip">' + t + "</button>"; })
        .join("") +
      "</div></div>" +
      '<div class="field"><label for="aval-texto">Comentário (opcional)</label>' +
      '<textarea id="aval-texto" rows="3" placeholder="Conte como foi sua experiência…"></textarea></div>' +
      '<div class="modal-foot"><button class="btn btn-ghost" data-close-modal>Agora não</button>' +
      '<button class="btn btn-primary" id="aval-enviar">' + Icon.svg("send") + "Enviar avaliação</button></div></div>";
    document.body.appendChild(el);

    var nota = 0;
    var legendas = ["", "Muito ruim", "Ruim", "Regular", "Bom", "Excelente"];
    var host = document.getElementById("aval-estrelas");
    host.addEventListener("click", function (e) {
      var b = e.target.closest("[data-nota]");
      if (!b) return;
      nota = parseInt(b.getAttribute("data-nota"), 10);
      U.qsa("button", host).forEach(function (s, i) {
        s.classList.toggle("is-on", i < nota);
      });
      document.getElementById("aval-legenda").textContent = legendas[nota];
    });
    document.getElementById("aval-tags").addEventListener("click", function (e) {
      var c = e.target.closest(".chip");
      if (c) c.classList.toggle("is-active");
    });
    document.getElementById("aval-enviar").addEventListener("click", function () {
      if (!nota) return UI.toast("Escolha de 1 a 5 estrelas.", "warn");
      global.DB.salvarAvaliacao({
        nota: nota,
        texto: document.getElementById("aval-texto").value,
        quando: new Date().toISOString(),
      });
      UI.modal.close("modal-avaliar");
      if (nota >= 4) UI.confete({ quantidade: 80 });
      UI.toast("Obrigado! Sua avaliação foi registrada.", "success", "Avaliação enviada");
    });
  };

  App.abrirAvaliacao = function () {
    App.montarAvaliacao();
    UI.modal.open("modal-avaliar");
  };

  /* =========================================================== PÁGINA: HOME */
  App.paginaIndex = function () {
    App.barraLgpd();

    /* mapa das unidades */
    var mapa = document.getElementById("mapa-ubs");
    if (!mapa) return;

    global.DB.unidades.forEach(function (u, i) {
      var ping = document.createElement("span");
      ping.className = "map-ripple";
      ping.style.left = u.lat + "%";
      ping.style.top = u.lng + "%";
      ping.style.animationDelay = i * 0.3 + "s";
      mapa.appendChild(ping);

      var pin = document.createElement("button");
      pin.className = "map-pin";
      pin.style.left = u.lat + "%";
      pin.style.top = u.lng + "%";
      pin.setAttribute("aria-label", u.nome);
      pin.innerHTML = Icon.svg("map-pin") + "<small>" + U.esc(u.nome) + "</small>";

      function ativar() {
        U.qsa(".map-pin", mapa).forEach(function (p) { p.classList.remove("is-active"); });
        pin.classList.add("is-active");
        document.getElementById("ubs-nome").textContent = u.nome;
        document.getElementById("ubs-bairro").textContent = "Bairro " + u.bairro;
        var tele = document.getElementById("ubs-tele");
        var eq = document.getElementById("ubs-equipes");
        tele.dataset.counted = "";
        eq.dataset.counted = "";
        tele.setAttribute("data-count", u.teleconsultas);
        eq.setAttribute("data-count", u.equipes);
        UI.countUp(tele);
        UI.countUp(eq);
      }
      pin.addEventListener("mouseenter", ativar);
      pin.addEventListener("click", ativar);
      pin.addEventListener("focus", ativar);
      mapa.appendChild(pin);
    });
  };

  /* ======================================================== PÁGINA: ACESSO */
  App.paginaAcesso = function () {
    var papel = "paciente";

    U.qsa("[data-papel]").forEach(function (card) {
      card.addEventListener("click", function () {
        U.qsa("[data-papel]").forEach(function (c) { c.classList.remove("is-active"); });
        card.classList.add("is-active");
        papel = card.getAttribute("data-papel");
        var dicas = {
          paciente: { u: "072.418.339-55", nome: "Artur Seixas Pedro" },
          medico: { u: "helena.burigo", nome: "Dra. Helena Búrigo" },
          admin: { u: "gestao.saude", nome: "Gestão Municipal" },
        };
        document.getElementById("login-usuario").value = dicas[papel].u;
        document.getElementById("login-senha").value = "demo1234";
        document.getElementById("demo-nome").textContent = dicas[papel].nome;
      });
    });

    /* alternar login / cadastro */
    U.qsa("[data-aba]").forEach(function (b) {
      b.addEventListener("click", function () {
        var alvo = b.getAttribute("data-aba");
        U.qsa("[data-aba]").forEach(function (x) { x.classList.remove("is-active"); });
        b.classList.add("is-active");
        U.qsa(".auth-form").forEach(function (f) {
          f.classList.toggle("is-active", f.id === "form-" + alvo);
        });
      });
    });

    var formLogin = document.getElementById("form-login");
    if (formLogin) {
      formLogin.addEventListener("submit", function (e) {
        e.preventDefault();
        var btn = formLogin.querySelector('[type="submit"]');
        btn.classList.add("is-loading");
        setTimeout(function () {
          var u = global.DB.entrar(papel);
          var destino = U.param("destino") || u.home || "dashboard.html";
          UI.toast("Bem-vindo(a), " + u.nome.split(" ")[0] + "!", "success");
          location.href = destino;
        }, 750);
      });
    }

    var formCadastro = document.getElementById("form-cadastro");
    if (formCadastro) {
      formCadastro.addEventListener("submit", function (e) {
        e.preventDefault();
        var btn = formCadastro.querySelector('[type="submit"]');
        btn.classList.add("is-loading");
        setTimeout(function () {
          btn.classList.remove("is-loading");
          UI.confete({ quantidade: 70 });
          UI.toast("Cadastro criado! Agora é só entrar com seu CPF.", "success", "Tudo certo");
          U.qsa("[data-aba]").forEach(function (x) { x.classList.remove("is-active"); });
          document.querySelector('[data-aba="login"]').classList.add("is-active");
          U.qsa(".auth-form").forEach(function (f) {
            f.classList.toggle("is-active", f.id === "form-login");
          });
        }, 900);
      });
    }

    /* máscara simples de CPF */
    U.qsa("[data-mask=cpf]").forEach(function (i) {
      i.addEventListener("input", function () {
        var v = i.value.replace(/\D/g, "").slice(0, 11);
        i.value = v
          .replace(/(\d{3})(\d)/, "$1.$2")
          .replace(/(\d{3})(\d)/, "$1.$2")
          .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
      });
    });
    U.qsa("[data-mask=tel]").forEach(function (i) {
      i.addEventListener("input", function () {
        var v = i.value.replace(/\D/g, "").slice(0, 11);
        i.value = v.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{5})(\d)/, "$1-$2");
      });
    });
  };

  /* ======================================================== PÁGINA: PERFIL */
  App.paginaPerfil = function () {
    var sessao = App.exigirSessao();
    if (!sessao) return;

    UI.shell.montar({
      page: "perfil",
      titulo: "Meu Perfil",
      sub: "Dados cadastrais, saúde e privacidade",
    });

    var perfil = global.DB.perfil();
    function preencher() {
      perfil = global.DB.perfil();
      var campos = {
        "p-nome": perfil.nome,
        "p-cpf": perfil.cpf,
        "p-cns": perfil.cns,
        "p-email": perfil.email,
        "p-telefone": perfil.telefone,
        "p-nascimento": perfil.nascimento,
        "p-endereco": perfil.endereco,
        "p-sangue": perfil.tipoSanguineo,
        "p-alergias": perfil.alergias,
        "p-condicoes": perfil.condicoes,
        "p-unidade": perfil.unidade,
      };
      Object.keys(campos).forEach(function (id) {
        var el = document.getElementById(id);
        if (el) el.value = campos[id] || "";
      });
      var disp = document.getElementById("perfil-nome-display");
      if (disp) disp.textContent = perfil.nome;
      U.qsa("#perfil-avatar").forEach(function (a) { a.textContent = U.iniciais(perfil.nome); });
    }
    preencher();

    var form = document.getElementById("form-perfil");
    if (form) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        ["nome", "email", "telefone", "nascimento", "endereco"].forEach(function (k) {
          var el = document.getElementById("p-" + k);
          if (el) perfil[k] = el.value;
        });
        perfil.tipoSanguineo = document.getElementById("p-sangue").value;
        perfil.alergias = document.getElementById("p-alergias").value;
        perfil.condicoes = document.getElementById("p-condicoes").value;
        perfil.unidade = document.getElementById("p-unidade").value;
        global.DB.salvarPerfil(perfil);
        if (global.DB.sessao() && global.DB.sessao().papel === "paciente") {
          global.DB.entrar("paciente");
        }
        UI.toast("Perfil atualizado com sucesso.", "success");
        preencher();
        UI.shell.montar({ page: "perfil", titulo: "Meu Perfil", sub: "Dados cadastrais, saúde e privacidade" });
      });
    }

    /* — central de privacidade — */
    var btnExportar = document.getElementById("lgpd-exportar");
    if (btnExportar) {
      btnExportar.addEventListener("click", function () {
        var pacote = {
          geradoEm: new Date().toISOString(),
          origem: "CRIMED · Tele-Saúde Criciúma (protótipo)",
          perfil: global.DB.perfil(),
          consultas: global.DB.consultas(),
          exames: global.DB.exames(),
          receitas: global.DB.receitas(),
        };
        var blob = new Blob([JSON.stringify(pacote, null, 2)], { type: "application/json" });
        var a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "crimed-meus-dados.json";
        document.body.appendChild(a);
        a.click();
        a.remove();
        UI.toast("Portabilidade concluída — arquivo JSON gerado (art. 18, LGPD).", "success");
      });
    }

    var btnApagar = document.getElementById("lgpd-apagar");
    if (btnApagar) {
      btnApagar.addEventListener("click", function () {
        UI.confirmar({
          titulo: "Apagar meus dados de demonstração",
          texto:
            "Isso remove consultas, exames, receitas e preferências guardadas neste navegador e restaura a base original do protótipo.",
          confirmar: "Apagar e restaurar",
          danger: true,
        }).then(function (ok) {
          if (!ok) return;
          global.DB.reset();
          UI.toast("Dados apagados e base de demonstração restaurada.", "success");
          setTimeout(function () { location.reload(); }, 900);
        });
      });
    }

    U.qsa("[data-consent]").forEach(function (sw) {
      sw.addEventListener("change", function () {
        UI.toast(
          "Consentimento “" + sw.getAttribute("data-consent") + "” " +
            (sw.checked ? "concedido" : "revogado") + " e registrado no log de auditoria.",
          sw.checked ? "success" : "warn"
        );
      });
    });
  };

  /* ================================================================== BOOT */
  function init() {
    U = UI.u;
    var page = document.body.getAttribute("data-page");

    /* botões globais de agendamento */
    document.addEventListener("click", function (e) {
      var b = e.target.closest ? e.target.closest("[data-act=agendar]") : null;
      if (b) {
        e.preventDefault();
        App.abrirAgendamento(b.getAttribute("data-esp") || "");
      }
      var a = e.target.closest ? e.target.closest("[data-act=avaliar]") : null;
      if (a) {
        e.preventDefault();
        App.abrirAvaliacao();
      }
    });

    if (page === "index") App.paginaIndex();
    if (page === "acesso") App.paginaAcesso();
    if (page === "perfil") App.paginaPerfil();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  global.App = App;
})(window);
