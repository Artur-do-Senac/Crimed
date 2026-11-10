/* ============================================================================
   CRIMED · app.js
   Componentes compartilhados (guarda de acesso, encaminhamento, avaliação,
   LGPD) e os controladores das páginas pública, de acesso e de perfil.
   ========================================================================= */
(function (global) {
  "use strict";

  var App = {};
  var U;

  /* ====================================================== GUARDA DE SESSÃO */
  /**
   * Quem pode abrir cada página. Paciente nunca entra na área do
   * profissional e o profissional nunca entra na área do paciente.
   */
  var ROTAS = {
    "dashboard.html": ["paciente"],
    "agendar.html": ["paciente"],
    "consultas.html": ["paciente"],
    "perfil.html": ["paciente"],
    "prontuarios.html": ["paciente", "medico", "admin"],
    "teleconsulta.html": ["paciente", "medico"],
    "medico.html": ["medico", "admin"],
    "admin.html": ["admin", "medico"],
  };
  App.rotas = ROTAS;

  function paginaAtual() {
    return location.pathname.split("/").pop() || "index.html";
  }

  /** Página permitida para o papel? (usada também para validar ?destino=) */
  App.podeAcessar = function (papel, pagina) {
    var nome = String(pagina || "").split("?")[0].split("#")[0];
    var regra = ROTAS[nome];
    return !regra || regra.indexOf(papel) >= 0;
  };

  App.exigirSessao = function (papeis) {
    var s = global.DB.sessao();
    var pagina = paginaAtual();
    papeis = papeis || ROTAS[pagina];
    if (!s) {
      document.documentElement.style.visibility = "hidden";
      location.replace("acesso.html?destino=" + encodeURIComponent(pagina + location.search));
      return null;
    }
    if (papeis && papeis.indexOf(s.papel) < 0) {
      document.documentElement.style.visibility = "hidden";
      UI.flash(
        s.papel === "paciente"
          ? "Esta área é exclusiva dos profissionais de saúde."
          : "Esta área é exclusiva dos pacientes. Você está conectado(a) como " + s.papelLabel + ".",
        "warn"
      );
      location.replace(s.home || "index.html");
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
      '<a class="btn btn-ghost btn-sm" href="sobre.html">Saiba mais</a>' +
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

  /* ================================================= AGENDAMENTO (paciente) */
  /* O agendamento agora é uma página própria (agendar.html) e é sempre com
     clínico geral. Os antigos botões [data-act=agendar] levam até ela. */
  App.abrirAgendamento = function (motivo) {
    location.href = "agendar.html" + (motivo ? "?motivo=" + encodeURIComponent(motivo) : "");
  };

  /* ================================================= ENCAMINHAMENTO (médico) */
  var enc = { pacienteId: "", paciente: "", esp: "", medicoId: "", data: "", hora: "", onDone: null };

  App.montarEncaminhamento = function () {
    if (document.getElementById("modal-encaminhar")) return;
    var el = document.createElement("div");
    el.className = "modal";
    el.id = "modal-encaminhar";
    el.innerHTML =
      '<div class="modal-box modal-box-lg">' +
      '<button class="modal-close" data-close-modal aria-label="Fechar">' + Icon.svg("close") + "</button>" +
      '<div class="modal-head"><h3>' + Icon.svg("arrow-up-right") + "Encaminhar para especialista</h3>" +
      '<p id="enc-sub">O paciente não agenda especialistas sozinho: o clínico geral marca a consulta.</p></div>' +

      '<div class="field"><label for="enc-esp">Especialidade</label>' +
      '<select id="enc-esp"><option value="">Selecione…</option>' +
      global.DB.especialidadesEncaminhamento()
        .map(function (e) { return '<option value="' + U.esc(e) + '">' + U.esc(e) + "</option>"; })
        .join("") +
      "</select></div>" +

      '<div class="field"><label>Profissional</label><div id="enc-medicos" class="enc-medicos">' +
      '<p class="small muted">Escolha a especialidade primeiro.</p></div></div>' +

      '<div class="field-row">' +
      '<div class="field"><label for="enc-data">Data</label><input type="date" id="enc-data" /></div>' +
      '<div class="field"><label for="enc-prioridade">Prioridade</label>' +
      '<select id="enc-prioridade"><option>Normal</option><option>Prioritária</option><option>Urgente</option></select></div>' +
      "</div>" +
      '<div class="field"><label>Horário</label><div class="chip-group" id="enc-horas">' +
      '<p class="small muted">Escolha profissional e data.</p></div></div>' +
      '<div class="field"><label for="enc-motivo">Justificativa clínica</label>' +
      '<textarea id="enc-motivo" rows="2" placeholder="Ex.: HAS de difícil controle, solicitar avaliação cardiológica"></textarea></div>' +

      '<div class="modal-foot">' +
      '<button class="btn btn-ghost" data-close-modal>Cancelar</button>' +
      '<button class="btn btn-primary" id="enc-confirmar">' + Icon.svg("check") + "Confirmar encaminhamento</button>" +
      "</div></div>";
    document.body.appendChild(el);

    var selEsp = document.getElementById("enc-esp");
    var inData = document.getElementById("enc-data");
    inData.min = global.DB.dayOffset(1);

    selEsp.addEventListener("change", function () {
      enc.esp = selEsp.value;
      enc.medicoId = "";
      enc.hora = "";
      renderEncMedicos();
      renderEncHoras();
    });
    inData.addEventListener("change", function () {
      enc.data = inData.value;
      enc.hora = "";
      renderEncHoras();
    });
    document.getElementById("enc-confirmar").addEventListener("click", confirmarEncaminhamento);
  };

  function renderEncMedicos() {
    var host = document.getElementById("enc-medicos");
    var lista = global.DB.medicosPorEspecialidade(enc.esp);
    if (!enc.esp) {
      host.innerHTML = '<p class="small muted">Escolha a especialidade primeiro.</p>';
      return;
    }
    host.innerHTML = lista
      .map(function (m) {
        var u = global.DB.unidade(m.unidade);
        return (
          '<button type="button" class="doc-pick" data-med="' + m.id + '">' +
          '<div class="avatar avatar-doc">' + U.iniciais(m.nome) + "</div>" +
          '<div class="doc-pick-info"><strong>' + U.esc(m.nome) + "</strong>" +
          "<span>" + U.esc(m.crm) + " · " + U.esc(u ? u.nome : "") + "</span></div></button>"
        );
      })
      .join("");
    host.onclick = function (ev) {
      var b = ev.target.closest("[data-med]");
      if (!b) return;
      U.qsa(".doc-pick", host).forEach(function (d) { d.classList.remove("is-active"); });
      b.classList.add("is-active");
      enc.medicoId = b.getAttribute("data-med");
      enc.hora = "";
      renderEncHoras();
    };
    if (lista.length === 1) host.querySelector("[data-med]").click();
  }

  function renderEncHoras() {
    var host = document.getElementById("enc-horas");
    if (!enc.medicoId || !enc.data) {
      host.innerHTML = '<p class="small muted">Escolha profissional e data.</p>';
      return;
    }
    var livres = global.DB.horariosLivres(enc.medicoId, enc.data);
    if (!livres.length) {
      host.innerHTML = '<p class="small muted">Sem horários livres nesta data. Tente outro dia.</p>';
      return;
    }
    host.innerHTML = livres
      .map(function (h) { return '<button type="button" class="chip" data-hora="' + h + '">' + h + "</button>"; })
      .join("");
    host.onclick = function (ev) {
      var b = ev.target.closest("[data-hora]");
      if (!b) return;
      U.qsa(".chip", host).forEach(function (c) { c.classList.remove("is-active"); });
      b.classList.add("is-active");
      enc.hora = b.getAttribute("data-hora");
    };
  }

  function confirmarEncaminhamento() {
    if (!enc.esp) return UI.toast("Escolha a especialidade.", "warn");
    if (!enc.medicoId) return UI.toast("Escolha o profissional.", "warn");
    if (!enc.data) return UI.toast("Escolha a data.", "warn");
    if (!enc.hora) return UI.toast("Escolha um horário livre.", "warn");
    var nova = global.DB.encaminhar({
      pacienteId: enc.pacienteId,
      paciente: enc.paciente,
      medicoId: enc.medicoId,
      data: enc.data,
      hora: enc.hora,
      motivo: document.getElementById("enc-motivo").value.trim() || "Encaminhamento para " + enc.esp,
      prioridade: document.getElementById("enc-prioridade").value,
    });
    if (!nova) return UI.toast("Não foi possível registrar o encaminhamento.", "error");
    UI.modal.close("modal-encaminhar");
    UI.toast(
      U.esc(enc.paciente) + " foi encaminhado(a) para " + U.esc(nova.especialidade) + " com " +
        U.esc(nova.medico) + " em " + U.fmtData(nova.data) + " às " + nova.hora + ". O paciente foi avisado.",
      "success",
      "Encaminhamento registrado"
    );
    if (typeof enc.onDone === "function") enc.onDone(nova);
  }

  /**
   * Abre o formulário de encaminhamento.
   * @param {{pacienteId:string, paciente:string, motivo?:string, onDone?:Function}} dados
   */
  App.abrirEncaminhamento = function (dados) {
    var s = global.DB.sessao();
    if (!s || s.papel !== "medico") {
      return UI.toast("Somente o clínico geral pode encaminhar para especialistas.", "warn");
    }
    App.montarEncaminhamento();
    enc = {
      pacienteId: dados.pacienteId,
      paciente: dados.paciente,
      esp: "",
      medicoId: "",
      data: global.DB.dayOffset(3),
      hora: "",
      onDone: dados.onDone,
    };
    document.getElementById("enc-sub").innerHTML =
      "Paciente: <strong>" + U.esc(dados.paciente) + "</strong> · a consulta já fica marcada e o paciente recebe o aviso.";
    document.getElementById("enc-esp").value = "";
    document.getElementById("enc-data").value = enc.data;
    document.getElementById("enc-motivo").value = dados.motivo || "";
    document.getElementById("enc-prioridade").value = "Normal";
    renderEncMedicos();
    renderEncHoras();
    UI.modal.open("modal-encaminhar");
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

  /* ================================================= HELPERS DE FORMULÁRIO */
  function campo(form, nome) {
    return form.querySelector('.field[data-campo="' + nome + '"]');
  }
  function setErro(form, nome, msg) {
    var f = campo(form, nome);
    if (!f) return UI.toast(msg, "warn");
    f.classList.add("has-error");
    var e = f.querySelector(".field-error");
    if (e) e.innerHTML = msg;
    var ok = f.querySelector(".field-ok");
    if (ok) ok.hidden = true;
    var input = f.querySelector("input, select, textarea");
    if (input) {
      input.setAttribute("aria-invalid", "true");
      try { input.focus({ preventScroll: true }); } catch (x) { input.focus(); }
      f.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }
  function limparErro(f) {
    if (!f) return;
    f.classList.remove("has-error");
    var input = f.querySelector("[aria-invalid]");
    if (input) input.removeAttribute("aria-invalid");
  }
  function limparErros(form) {
    U.qsa(".field.has-error", form).forEach(limparErro);
  }
  /* digitar em um campo com erro já limpa o aviso */
  function ligarLimpeza(root) {
    root.addEventListener("input", function (e) {
      limparErro(e.target.closest && e.target.closest(".field"));
    });
    root.addEventListener("change", function (e) {
      limparErro(e.target.closest && e.target.closest(".field"));
    });
  }

  /* máscaras: lidas na hora da digitação, então podem ser ligadas/desligadas */
  function ligarMascaras() {
    document.addEventListener("input", function (e) {
      var i = e.target;
      var m = i.getAttribute && i.getAttribute("data-mask");
      if (m === "cpf") {
        var v = i.value.replace(/\D/g, "").slice(0, 11);
        i.value = v
          .replace(/(\d{3})(\d)/, "$1.$2")
          .replace(/(\d{3})(\d)/, "$1.$2")
          .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
      } else if (m === "tel") {
        var t = i.value.replace(/\D/g, "").slice(0, 11);
        i.value = t
          .replace(/^(\d{2})(\d)/, "($1) $2")
          .replace(/(\d)(\d{4})$/, "$1-$2");
      }
    });
  }

  function destinoPara(usuario) {
    var d = U.param("destino");
    if (d && /^[a-z]+\.html/i.test(d) && App.podeAcessar(usuario.papel, d)) return d;
    return usuario.home || "index.html";
  }

  /* ======================================================== PÁGINA: ACESSO */
  App.paginaAcesso = function () {
    var ativa = global.DB.sessao();
    if (ativa && !U.param("saiu")) {
      location.replace(destinoPara(ativa));
      return;
    }
    if (U.param("saiu")) {
      global.DB.sair();
      UI.toast("Você saiu da sua conta com segurança.", "info");
    }

    var formLogin = document.getElementById("form-login");
    var formCad = document.getElementById("form-cadastro");
    var modoEquipe = false;
    var modoGov = false;

    ligarLimpeza(formLogin);
    ligarLimpeza(formCad);

    /* UBS */
    var sel = document.getElementById("c-ubs");
    global.DB.unidades.forEach(function (u) {
      var o = document.createElement("option");
      o.value = u.id;
      o.textContent = u.nome + " — " + u.bairro;
      sel.appendChild(o);
    });
    document.getElementById("c-nasc").max = global.DB.hoje();

    /* — abas — */
    function mostrarAba(alvo) {
      U.qsa("[data-aba]").forEach(function (x) {
        x.classList.toggle("is-active", x.getAttribute("data-aba") === alvo);
      });
      U.qsa(".auth-form").forEach(function (f) {
        f.classList.toggle("is-active", f.id === "form-" + alvo);
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    U.qsa("[data-aba], [data-ir]").forEach(function (b) {
      b.addEventListener("click", function () {
        var alvo = b.getAttribute("data-aba") || b.getAttribute("data-ir");
        if (alvo === "cadastro" && modoEquipe) alternarEquipe(false);
        mostrarAba(alvo);
      });
    });
    if (location.hash === "#cadastro") mostrarAba("cadastro");

    /* — acesso da equipe (profissionais e gestores) — */
    var inUsuario = document.getElementById("login-usuario");
    function alternarEquipe(on) {
      modoEquipe = on;
      formLogin.classList.toggle("modo-equipe", on);
      document.getElementById("btn-equipe").setAttribute("aria-pressed", on ? "true" : "false");
      document.getElementById("btn-equipe-txt").textContent = on
        ? "Sou paciente"
        : "Sou profissional da rede ou gestor";
      document.getElementById("login-titulo").textContent = on ? "Acesso da equipe" : "Entrar";
      document.getElementById("login-sub").textContent = on
        ? "Para médicos, enfermeiros e gestores da rede municipal."
        : "Use sua conta gov.br ou o seu CPF e senha.";
      document.getElementById("login-usuario-label").textContent = on ? "Usuário institucional ou CPF" : "CPF";
      if (on) {
        inUsuario.removeAttribute("data-mask");
        inUsuario.setAttribute("inputmode", "text");
        inUsuario.placeholder = "nome.sobrenome";
      } else {
        inUsuario.setAttribute("data-mask", "cpf");
        inUsuario.setAttribute("inputmode", "numeric");
        inUsuario.placeholder = "000.000.000-00";
      }
      inUsuario.value = "";
      limparErros(formLogin);
    }
    document.getElementById("btn-equipe").addEventListener("click", function () {
      alternarEquipe(!modoEquipe);
      inUsuario.focus();
    });

    /* — contas de demonstração — */
    U.qsa("[data-demo]").forEach(function (b) {
      b.addEventListener("click", function () {
        alternarEquipe(b.getAttribute("data-equipe") === "1");
        inUsuario.value = b.getAttribute("data-demo");
        document.getElementById("login-senha").value = "demo1234";
        formLogin.querySelector('[type="submit"]').focus();
      });
    });

    /* — login — */
    formLogin.addEventListener("submit", function (e) {
      e.preventDefault();
      limparErros(formLogin);
      var r = global.DB.autenticar(inUsuario.value, document.getElementById("login-senha").value);
      if (!r.ok) {
        setErro(formLogin, r.campo, r.erro);
        if (r.naoEncontrado && !modoEquipe) {
          var e1 = campo(formLogin, "usuario").querySelector(".field-error");
          e1.innerHTML =
            r.erro.replace("Toque em “Criar conta”.", "") +
            ' <button type="button" class="link-btn" data-ir-cad>Criar conta</button>';
          e1.querySelector("[data-ir-cad]").addEventListener("click", function () {
            document.getElementById("c-cpf").value = inUsuario.value;
            mostrarAba("cadastro");
            validarCpfAoVivo();
          });
        }
        return;
      }
      entrarCom(r.usuario, formLogin.querySelector('[type="submit"]'));
    });

    function entrarCom(usuario, btn) {
      if (btn) btn.classList.add("is-loading");
      global.DB.iniciarSessao(usuario);
      UI.flash("Bem-vindo(a), <strong>" + U.esc(U.primeiroNome(usuario.nome)) + "</strong>!", "success");
      setTimeout(function () {
        location.href = destinoPara(usuario);
      }, 450);
    }

    /* — CPF validado enquanto a pessoa digita — */
    var inCpf = document.getElementById("c-cpf");
    function validarCpfAoVivo() {
      var f = campo(formCad, "cpf");
      var ok = f.querySelector(".field-ok");
      var dig = global.DB.soDigitos(inCpf.value);
      ok.hidden = true;
      limparErro(f);
      if (dig.length < 11) return;
      if (!global.DB.validarCPF(dig)) {
        f.classList.add("has-error");
        f.querySelector(".field-error").textContent = "CPF inválido. Confira os números.";
        return;
      }
      if (global.DB.cpfCadastrado(dig) && !modoGov) {
        f.classList.add("has-error");
        f.querySelector(".field-error").innerHTML =
          'Já existe uma conta com este CPF. <button type="button" class="link-btn" data-ir-login>Entrar</button>';
        f.querySelector("[data-ir-login]").addEventListener("click", function () {
          alternarEquipe(false);
          inUsuario.value = inCpf.value;
          mostrarAba("login");
          document.getElementById("login-senha").focus();
        });
        return;
      }
      ok.hidden = false;
    }
    inCpf.addEventListener("input", function () {
      setTimeout(validarCpfAoVivo, 0);
    });

    /* — cadastro — */
    formCad.addEventListener("submit", function (e) {
      e.preventDefault();
      limparErros(formCad);
      var dados = {
        nome: document.getElementById("c-nome").value,
        cpf: inCpf.value,
        nascimento: document.getElementById("c-nasc").value,
        telefone: document.getElementById("c-tel").value,
        email: document.getElementById("c-email").value,
        unidade: sel.value,
        senha: document.getElementById("c-senha").value,
        confirmacao: document.getElementById("c-senha2").value,
        origemGov: modoGov,
      };
      var email = dados.email.trim();
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return setErro(formCad, "email", "E-mail inválido.");
      }
      dados.simular = true;
      var v = global.DB.cadastrar(dados);
      if (!v.ok) return setErro(formCad, v.campo, v.erro);
      if (!document.getElementById("c-termos").checked) {
        return setErro(formCad, "termos", "Para continuar, marque que você concorda.");
      }
      dados.simular = false;
      var r = global.DB.cadastrar(dados);
      if (!r.ok) return setErro(formCad, r.campo, r.erro);
      UI.confete({ quantidade: 70 });
      UI.flash("Conta criada! Bem-vindo(a), <strong>" + U.esc(U.primeiroNome(r.usuario.nome)) + "</strong>.", "success");
      global.DB.iniciarSessao(r.usuario);
      formCad.querySelector('[type="submit"]').classList.add("is-loading");
      setTimeout(function () { location.href = "dashboard.html"; }, 700);
    });

    /* — gov.br (simulado) — */
    var govCpf = document.getElementById("gov-cpf");
    var modalGov = document.getElementById("modal-govbr");
    function govPasso(n) {
      U.qsa("[data-gov-passo]", modalGov).forEach(function (p) {
        p.hidden = p.getAttribute("data-gov-passo") !== String(n);
      });
    }
    ligarLimpeza(modalGov);
    U.qsa("[data-act=govbr]").forEach(function (b) {
      b.addEventListener("click", function () {
        govPasso(1);
        govCpf.value = "";
        limparErros(modalGov);
        UI.modal.open("modal-govbr");
      });
    });
    document.getElementById("gov-continuar").addEventListener("click", function () {
      if (!global.DB.validarCPF(govCpf.value)) {
        return setErro(modalGov, "govcpf", "Digite um CPF válido.");
      }
      govPasso(2);
    });
    govCpf.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        document.getElementById("gov-continuar").click();
      }
    });
    document.getElementById("gov-autorizar").addEventListener("click", function () {
      var btn = this;
      btn.classList.add("is-loading");
      setTimeout(function () {
        btn.classList.remove("is-loading");
        UI.modal.close("modal-govbr");
        var conta = global.DB.buscarConta(govCpf.value);
        if (conta) {
          entrarCom(conta, null);
          return;
        }
        /* primeira vez: completa o cadastro sem precisar criar senha */
        modoGov = true;
        formCad.classList.add("modo-gov");
        document.getElementById("cad-gov-aviso").hidden = false;
        inCpf.value = global.DB.formatarCPF(govCpf.value);
        inCpf.readOnly = true;
        validarCpfAoVivo();
        mostrarAba("cadastro");
        UI.toast("CPF confirmado pelo gov.br. Faltam só alguns dados.", "success");
        setTimeout(function () { document.getElementById("c-nome").focus(); }, 300);
      }, 700);
    });

    /* — esqueci a senha (simulado) — */
    var modalEsq = document.getElementById("modal-esqueci");
    ligarLimpeza(modalEsq);
    document.getElementById("esq-enviar").addEventListener("click", function () {
      var v = document.getElementById("esq-cpf").value;
      if (!global.DB.validarCPF(v)) return setErro(modalEsq, "esqcpf", "Digite um CPF válido.");
      var conta = global.DB.buscarConta(v);
      if (!conta) return setErro(modalEsq, "esqcpf", "Não há conta com este CPF.");
      var fim = global.DB.soDigitos(conta.telefone || "").slice(-4) || "****";
      UI.modal.close("modal-esqueci");
      UI.toast(
        "Enviamos um código por SMS para o celular terminado em <strong>" + fim + "</strong> (simulação).",
        "success",
        "Código enviado"
      );
    });
  };

  /* ======================================================== PÁGINA: PERFIL */
  App.paginaPerfil = function () {
    var sessao = App.exigirSessao(["paciente"]);
    if (!sessao) return;

    function montarShell() {
      UI.shell.montar({ page: "perfil", titulo: "Meu perfil", sub: "Seus dados e preferências" });
    }
    montarShell();

    var selUbs = document.getElementById("p-unidade");
    if (selUbs && !selUbs.options.length) {
      global.DB.unidades.forEach(function (u) {
        var o = document.createElement("option");
        o.value = u.id;
        o.textContent = u.nome;
        selUbs.appendChild(o);
      });
    }

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
      var un = global.DB.unidade(perfil.unidade);
      var ubs = document.getElementById("perfil-ubs");
      if (ubs) ubs.textContent = un ? un.nome : "—";
      var cpfTxt = document.getElementById("perfil-cpf");
      if (cpfTxt) cpfTxt.textContent = "CPF " + (perfil.cpf || "—");
      var gov = document.getElementById("perfil-gov");
      if (gov) gov.hidden = perfil.origem !== "gov.br";
      U.qsa("#perfil-avatar").forEach(function (a) { a.textContent = U.iniciais(perfil.nome); });
    }
    preencher();

    var form = document.getElementById("form-perfil");
    if (form) {
      ligarLimpeza(form);
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        limparErros(form);
        var nome = document.getElementById("p-nome").value.trim();
        if (nome.split(/\s+/).length < 2) return setErro(form, "nome", "Digite nome e sobrenome.");
        var tel = global.DB.soDigitos(document.getElementById("p-telefone").value);
        if (tel.length < 10) return setErro(form, "telefone", "Informe o celular com DDD.");
        ["nome", "email", "telefone", "nascimento", "endereco"].forEach(function (k) {
          var el = document.getElementById("p-" + k);
          if (el) perfil[k] = el.value.trim();
        });
        perfil.tipoSanguineo = document.getElementById("p-sangue").value;
        perfil.alergias = document.getElementById("p-alergias").value;
        perfil.condicoes = document.getElementById("p-condicoes").value;
        perfil.unidade = document.getElementById("p-unidade").value;
        global.DB.salvarPerfil(perfil);
        UI.toast("Seus dados foram salvos.", "success");
        preencher();
        montarShell();
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
        UI.toast("Arquivo com os seus dados gerado (art. 18, LGPD).", "success");
      });
    }

    var btnApagar = document.getElementById("lgpd-apagar");
    if (btnApagar) {
      btnApagar.addEventListener("click", function () {
        UI.confirmar({
          titulo: "Restaurar a demonstração",
          texto:
            "Isso apaga contas criadas, consultas, exames e receitas guardados neste navegador e volta a base original do protótipo. Você precisará entrar de novo.",
          confirmar: "Apagar e restaurar",
          danger: true,
        }).then(function (ok) {
          if (!ok) return;
          global.DB.reset();
          UI.flash("Dados apagados e demonstração restaurada.", "success");
          location.href = "acesso.html";
        });
      });
    }

    U.qsa("[data-consent]").forEach(function (sw) {
      sw.addEventListener("change", function () {
        UI.toast(
          "Consentimento “" + sw.getAttribute("data-consent") + "” " +
            (sw.checked ? "concedido" : "revogado") + ".",
          sw.checked ? "success" : "warn"
        );
      });
    });
  };

  /* ================================================================== BOOT */
  function init() {
    U = UI.u;
    var page = document.body.getAttribute("data-page");
    ligarMascaras();

    /* botões globais */
    document.addEventListener("click", function (e) {
      var b = e.target.closest ? e.target.closest("[data-act=agendar]") : null;
      if (b && b.tagName !== "A") {
        e.preventDefault();
        App.abrirAgendamento(b.getAttribute("data-motivo") || "");
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
