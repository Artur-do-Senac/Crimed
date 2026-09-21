/* ============================================================================
   CRIMED · teleconsulta.js
   Sala virtual de atendimento. Usa a câmera e o microfone reais do
   dispositivo (getUserMedia) e o compartilhamento de tela (getDisplayMedia).
   O vídeo do outro participante é simulado — este é um protótipo sem
   servidor de sinalização WebRTC.
   ========================================================================= */
(function (global) {
  "use strict";

  var U;
  var stream = null;
  var streamTela = null;
  var consulta = null;
  var sessao = null;
  var ehMedico = false;
  var contraparte = { nome: "", sub: "", iniciais: "" };
  var inicio = 0;
  var relogio = null;
  var roteiro = null;
  var estado = { mic: true, cam: true, tela: false };

  /* ==================================================== MÍDIA DO USUÁRIO */
  function pedirMidia(comVideo) {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      return Promise.reject(new Error("sem-suporte"));
    }
    return navigator.mediaDevices.getUserMedia({
      video: comVideo ? { width: { ideal: 1280 }, height: { ideal: 720 } } : false,
      audio: true,
    });
  }

  function aplicarStream(video) {
    if (!stream) return;
    video.srcObject = stream;
    video.play().catch(function () {});
  }

  function marcarCheck(id, ok, texto) {
    var el = document.getElementById(id);
    if (!el) return;
    el.classList.toggle("is-bad", !ok);
    if (texto) {
      var span = el.childNodes[el.childNodes.length - 1];
      el.innerHTML = Icon.svg(ok ? "check-circle" : "alert-circle") + " " + texto;
    }
  }

  function testarMidia() {
    var btn = document.getElementById("btn-testar");
    btn.classList.add("is-loading");

    pedirMidia(true)
      .then(function (s) {
        stream = s;
        btn.classList.remove("is-loading");
        var v = document.getElementById("prep-video");
        aplicarStream(v);
        document.getElementById("prep-video-off").style.display = "none";
        marcarCheck("chk-camera", true, "Câmera ativa");
        marcarCheck("chk-mic", true, "Microfone ativo");
        UI.toast("Câmera e microfone funcionando. Você já pode entrar.", "success");
      })
      .catch(function (err) {
        btn.classList.remove("is-loading");
        /* tenta só áudio */
        pedirMidia(false)
          .then(function (s) {
            stream = s;
            estado.cam = false;
            marcarCheck("chk-camera", false, "Sem câmera");
            marcarCheck("chk-mic", true, "Microfone ativo");
            UI.toast("Só o microfone está disponível. Você pode entrar em modo áudio.", "warn");
          })
          .catch(function () {
            estado.cam = false;
            estado.mic = false;
            marcarCheck("chk-camera", false, "Sem câmera");
            marcarCheck("chk-mic", false, "Sem microfone");
            UI.toast(
              err && err.name === "NotAllowedError"
                ? "Permissão negada. Libere câmera e microfone no cadeado da barra de endereço."
                : "Não encontramos câmera ou microfone. Você ainda pode entrar e usar o chat.",
              "warn",
              "Mídia indisponível"
            );
          });
      });
  }

  /* =============================================================== ENTRAR */
  function entrar() {
    var prep = document.getElementById("call-prep");
    prep.style.transition = "opacity .4s";
    prep.style.opacity = "0";
    setTimeout(function () { prep.remove(); }, 400);

    document.getElementById("badge-live").classList.remove("hidden");
    document.getElementById("call-remote").classList.remove("hidden");
    document.getElementById("call-self").classList.remove("hidden");
    document.getElementById("call-controls").classList.remove("hidden");

    var self = document.getElementById("self-video");
    if (stream) {
      aplicarStream(self);
      var temVideo = stream.getVideoTracks().length > 0;
      estado.cam = temVideo;
      document.getElementById("self-off").style.display = temVideo ? "none" : "grid";
      atualizarBotoes();
    } else {
      document.getElementById("self-off").style.display = "grid";
      estado.cam = false;
      estado.mic = false;
      atualizarBotoes();
    }

    inicio = Date.now();
    document.getElementById("call-status-texto").textContent = "Em atendimento ·";
    relogio = setInterval(tick, 1000);
    tick();

    /* o status só muda ao encerrar: se a pessoa sair da página no meio da
       chamada, a consulta continua agendada em vez de ficar presa em
       "Em andamento" */
    iniciarRoteiro();
  }

  function tick() {
    var s = Math.floor((Date.now() - inicio) / 1000);
    document.getElementById("call-timer").textContent =
      U.pad(Math.floor(s / 60)) + ":" + U.pad(s % 60);
  }

  /* ============================================================ CONTROLES */
  function atualizarBotoes() {
    var m = document.getElementById("ctl-mic");
    var c = document.getElementById("ctl-cam");
    var t = document.getElementById("ctl-tela");
    m.classList.toggle("is-off", !estado.mic);
    m.innerHTML = Icon.svg(estado.mic ? "mic" : "mic-off");
    c.classList.toggle("is-off", !estado.cam);
    c.innerHTML = Icon.svg(estado.cam ? "video" : "video-off");
    t.classList.toggle("is-off", estado.tela);
    document.getElementById("self-off").style.display = estado.cam ? "none" : "grid";
  }

  function alternarMic() {
    if (!stream || !stream.getAudioTracks().length) {
      return UI.toast("Nenhum microfone disponível nesta sessão.", "warn");
    }
    estado.mic = !estado.mic;
    stream.getAudioTracks().forEach(function (t) { t.enabled = estado.mic; });
    atualizarBotoes();
    UI.toast(estado.mic ? "Microfone ligado." : "Microfone desligado.", "info");
  }

  function alternarCam() {
    if (!stream || !stream.getVideoTracks().length) {
      /* tenta ligar a câmera agora */
      return pedirMidia(true)
        .then(function (s) {
          if (stream) stream.getTracks().forEach(function (t) { t.stop(); });
          stream = s;
          estado.cam = true;
          estado.mic = true;
          aplicarStream(document.getElementById("self-video"));
          atualizarBotoes();
          UI.toast("Câmera ligada.", "success");
        })
        .catch(function () {
          UI.toast("Não foi possível acessar a câmera.", "warn");
        });
    }
    estado.cam = !estado.cam;
    stream.getVideoTracks().forEach(function (t) { t.enabled = estado.cam; });
    atualizarBotoes();
    UI.toast(estado.cam ? "Câmera ligada." : "Câmera desligada.", "info");
  }

  function alternarTela() {
    if (estado.tela) return pararTela();
    if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
      return UI.toast("Seu navegador não permite compartilhar a tela.", "warn");
    }
    navigator.mediaDevices
      .getDisplayMedia({ video: true, audio: false })
      .then(function (s) {
        streamTela = s;
        estado.tela = true;
        var stage = document.getElementById("call-stage");
        var v = document.createElement("video");
        v.id = "tela-video";
        v.autoplay = true;
        v.playsInline = true;
        v.muted = true;
        v.srcObject = s;
        v.style.cssText =
          "position:absolute;inset:0;width:100%;height:100%;object-fit:contain;background:#05120c;z-index:2";
        stage.appendChild(v);
        atualizarBotoes();
        mensagemSistema("Você começou a compartilhar sua tela.");
        UI.toast("Compartilhando sua tela com o profissional.", "success");
        s.getVideoTracks()[0].addEventListener("ended", pararTela);
      })
      .catch(function () {
        UI.toast("Compartilhamento de tela cancelado.", "info");
      });
  }

  function pararTela() {
    if (streamTela) streamTela.getTracks().forEach(function (t) { t.stop(); });
    streamTela = null;
    estado.tela = false;
    var v = document.getElementById("tela-video");
    if (v) v.remove();
    atualizarBotoes();
    mensagemSistema("O compartilhamento de tela foi encerrado.");
  }

  /* ================================================================ CHAT */
  function balao(texto, tipo, autor) {
    var body = document.getElementById("chat-body");
    var d = document.createElement("div");
    d.className = "chat-msg chat-msg-" + tipo;
    var hora = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    d.innerHTML =
      (autor ? "<strong>" + U.esc(autor) + "</strong>" : "") +
      U.esc(texto) +
      (tipo === "sys" ? "" : "<small>" + hora + "</small>");
    body.appendChild(d);
    body.scrollTop = body.scrollHeight;
  }
  function mensagemSistema(t) {
    balao(t, "sys");
  }

  function enviarMensagem(e) {
    e.preventDefault();
    var input = document.getElementById("chat-input");
    var texto = input.value.trim();
    if (!texto) return;
    balao(texto, "me");
    input.value = "";
    setTimeout(function () {
      balao(respostaAutomatica(texto), "them", contraparte.nome);
    }, 900 + Math.random() * 900);
  }

  function respostaAutomatica(texto) {
    var t = texto.toLowerCase();
    if (ehMedico) {
      return "Certo, doutora. Anotei aqui.";
    }
    if (/receita|remédio|medicamento/.test(t))
      return "Vou emitir a receita digital ao final da consulta — ela aparece direto no seu prontuário.";
    if (/exame|resultado/.test(t))
      return "Já estou vendo seus exames aqui na tela, pode ficar tranquilo.";
    if (/dor|dói|doendo/.test(t))
      return "Entendi. Essa dor aparece em algum horário específico do dia?";
    if (/obrigad/.test(t)) return "Imagina! Estou aqui para ajudar.";
    if (/\?$/.test(t)) return "Boa pergunta. Vou te explicar com calma agora no áudio.";
    return "Certo, entendi. Pode continuar.";
  }

  /* ================================= ROTEIRO SIMULADO DA OUTRA PESSOA ==== */
  function iniciarRoteiro() {
    var falas = ehMedico
      ? [
          [1500, "Boa tarde, doutora! Está me ouvindo bem?"],
          [7000, "Vim para o retorno, trouxe o resultado dos exames."],
          [16000, "A pressão tem ficado por volta de 13 por 8 em casa."],
        ]
      : [
          [1500, "Boa tarde! Estou te ouvindo bem. Como você está se sentindo?"],
          [8000, "Já estou com seu prontuário aberto aqui, vi os exames recentes."],
          [18000, "Vou te passar as orientações e emitir a receita ao final, tudo bem?"],
        ];

    mensagemSistema(
      "Conexão segura estabelecida · criptografia ponta a ponta · esta consulta não está sendo gravada."
    );

    roteiro = falas.map(function (f) {
      return setTimeout(function () {
        balao(f[1], "them", contraparte.nome);
        if (!document.querySelector('[data-cpane="chat"].is-active')) {
          UI.toast("Nova mensagem de " + contraparte.nome, "info");
        }
      }, f[0]);
    });
  }

  /* ============================================================= ENCERRAR */
  function encerrar() {
    UI.confirmar({
      titulo: "Encerrar teleconsulta",
      texto: "A chamada será finalizada e o registro clínico ficará salvo no prontuário.",
      confirmar: "Encerrar chamada",
      danger: true,
    }).then(function (ok) {
      if (!ok) return;
      finalizar();
    });
  }

  function finalizar() {
    if (relogio) clearInterval(relogio);
    (roteiro || []).forEach(clearTimeout);
    if (stream) stream.getTracks().forEach(function (t) { t.stop(); });
    if (streamTela) streamTela.getTracks().forEach(function (t) { t.stop(); });

    var minutos = Math.max(1, Math.round((Date.now() - inicio) / 60000));

    if (consulta) {
      var patch = { status: "Realizada" };
      var an = document.getElementById("nota-anamnese").value.trim();
      var av = document.getElementById("nota-avaliacao").value.trim();
      var cd = document.getElementById("nota-conduta").value.trim();
      if (an) patch.anamnese = an;
      if (av) patch.resumo = av;
      if (cd) patch.conduta = cd;
      if (!consulta.resumo && !av) {
        patch.resumo = "Atendimento realizado por teleconsulta. Registro clínico em elaboração.";
      }
      global.DB.atualizarConsulta(consulta.id, patch);
      global.DB.notificar({
        tipo: "consulta",
        titulo: "Teleconsulta concluída",
        texto:
          consulta.especialidade + " com " + consulta.medico +
          " — registro disponível no seu prontuário.",
        link: "prontuarios.html",
      });
    }

    document.getElementById("fim-resumo").innerHTML =
      "Duração de <strong>" + minutos + " minuto" + (minutos > 1 ? "s" : "") +
      "</strong> com " + U.esc(contraparte.nome) + ".";

    document.getElementById("fim-corpo").innerHTML =
      '<div class="resumo-box">' +
      '<div class="resumo-linha"><span>Registro clínico</span><b>Salvo no prontuário</b></div>' +
      '<div class="resumo-linha"><span>Gravação de vídeo</span><b>Não realizada</b></div>' +
      '<div class="resumo-linha"><span>Deslocamento evitado</span><b>≈ 14 km</b></div>' +
      "</div>" +
      '<p class="small muted mt-3 center">' +
      "Se precisar de algo, você pode enviar uma mensagem pelo portal ou agendar um retorno." +
      "</p>";

    UI.modal.open("modal-fim");
    UI.confete({ quantidade: 80 });

    document.getElementById("fim-avaliar").onclick = function () {
      UI.modal.close("modal-fim");
      global.App.abrirAvaliacao();
    };
  }

  /* ============================================================ INICIAR */
  function init() {
    U = UI.u;
    sessao = global.App.exigirSessao();
    if (!sessao) return;

    ehMedico = sessao.papel === "medico" || U.param("papel") === "medico";

    /* consulta escolhida, ou a próxima confirmada do paciente */
    var id = U.param("consulta");
    if (id) consulta = global.DB.consulta(id);
    if (!consulta) {
      consulta = global.DB.consultas()
        .filter(function (c) { return c.status === "Confirmada" || c.status === "Em andamento"; })
        .sort(function (a, b) {
          return new Date(a.data + "T" + a.hora) - new Date(b.data + "T" + b.hora);
        })[0];
    }

    var perfil = global.DB.perfil();
    document.getElementById("voltar-link").href = ehMedico ? "medico.html" : "dashboard.html";

    if (ehMedico) {
      contraparte = {
        nome: perfil.nome,
        sub: (consulta ? consulta.especialidade : "Atendimento") + " · Paciente",
        iniciais: U.iniciais(perfil.nome),
      };
      document.getElementById("prep-titulo").textContent = "Pronta para atender";
      document.getElementById("prep-sub").textContent =
        "Verifique câmera e microfone. O prontuário do paciente já está aberto na aba “Dados”.";
      document.getElementById("self-tag").textContent = "Você (profissional)";
    } else {
      var med = consulta ? global.DB.medico(consulta.medicoId) : null;
      contraparte = {
        nome: consulta ? consulta.medico : "Profissional de plantão",
        sub: consulta
          ? consulta.especialidade + " · " + (med ? med.crm : "")
          : "Rede municipal de saúde",
        iniciais: U.iniciais(consulta ? consulta.medico : "Rede"),
      };
      document.getElementById("tab-notas").classList.add("hidden");
    }

    document.getElementById("remote-iniciais").textContent = contraparte.iniciais;
    document.getElementById("remote-nome").textContent = contraparte.nome;
    document.getElementById("remote-sub").textContent = contraparte.sub;

    var badge = document.getElementById("prep-consulta-badge");
    badge.innerHTML = consulta
      ? Icon.svg("calendar-check") +
        consulta.especialidade + " · " + U.fmtData(consulta.data) + " às " + consulta.hora
      : Icon.svg("alert-circle") + "Sala de demonstração";

    renderInfo();
    renderNotas();

    /* eventos */
    document.getElementById("btn-testar").addEventListener("click", testarMidia);
    document.getElementById("btn-entrar").addEventListener("click", function () {
      if (!stream) {
        /* tenta obter mídia na hora de entrar */
        pedirMidia(true)
          .then(function (s) { stream = s; entrar(); })
          .catch(function () {
            pedirMidia(false)
              .then(function (s) { stream = s; estado.cam = false; entrar(); })
              .catch(function () {
                UI.toast("Entrando sem câmera e sem microfone — use o chat para conversar.", "warn");
                entrar();
              });
          });
        return;
      }
      entrar();
    });

    document.getElementById("ctl-mic").addEventListener("click", alternarMic);
    document.getElementById("ctl-cam").addEventListener("click", alternarCam);
    document.getElementById("ctl-tela").addEventListener("click", alternarTela);
    document.getElementById("ctl-sair").addEventListener("click", encerrar);
    document.getElementById("ctl-chat").addEventListener("click", function () {
      trocarPainel("chat");
      document.getElementById("chat-input").focus();
    });
    document.getElementById("chat-form").addEventListener("submit", enviarMensagem);

    U.qsa("[data-cpane]").forEach(function (b) {
      if (b.tagName !== "BUTTON") return;
      b.addEventListener("click", function () {
        trocarPainel(b.getAttribute("data-cpane"));
      });
    });

    document.getElementById("btn-salvar-nota").addEventListener("click", salvarNota);

    /* libera a mídia ao sair da página */
    addEventListener("beforeunload", function () {
      if (stream) stream.getTracks().forEach(function (t) { t.stop(); });
      if (streamTela) streamTela.getTracks().forEach(function (t) { t.stop(); });
    });

    if (location.protocol === "file:") {
      UI.toast(
        "Abra o sistema por um servidor (ou pelo GitHub Pages) para o navegador liberar a câmera.",
        "warn",
        "Câmera bloqueada em file://"
      );
    }
  }

  function trocarPainel(nome) {
    U.qsa(".call-side-tab").forEach(function (t) {
      t.classList.toggle("is-active", t.getAttribute("data-cpane") === nome);
    });
    U.qsa(".call-pane").forEach(function (p) {
      p.classList.toggle("is-active", p.getAttribute("data-cpane") === nome);
    });
  }

  function renderInfo() {
    var perfil = global.DB.perfil();
    var un = consulta ? global.DB.unidade(consulta.unidade) : null;
    var itens = ehMedico
      ? [
          ["Paciente", perfil.nome],
          ["Idade", idade(perfil.nascimento) + " anos"],
          ["Cartão SUS", perfil.cns || "—"],
          ["Alergias", perfil.alergias || "Nenhuma registrada"],
          ["Condições", perfil.condicoes || "Nenhuma registrada"],
          ["Tipo sanguíneo", perfil.tipoSanguineo || "—"],
          ["Motivo da consulta", consulta ? consulta.motivo : "—"],
          ["Unidade", un ? un.nome : "—"],
        ]
      : [
          ["Profissional", contraparte.nome],
          ["Especialidade", consulta ? consulta.especialidade : "—"],
          ["Registro", consulta && global.DB.medico(consulta.medicoId) ? global.DB.medico(consulta.medicoId).crm : "—"],
          ["Data e hora", consulta ? U.fmtData(consulta.data) + " · " + consulta.hora : "—"],
          ["Unidade", un ? un.nome : "—"],
          ["Modalidade", "Teleconsulta por vídeo"],
          ["Gravação", "Desativada"],
        ];

    var hist = global.DB.consultas()
      .filter(function (c) { return c.status === "Realizada"; })
      .slice(0, 3);

    document.getElementById("info-body").innerHTML =
      itens
        .map(function (i) {
          return '<div class="call-info-item"><span>' + U.esc(i[0]) + "</span><strong>" + U.esc(i[1]) + "</strong></div>";
        })
        .join("") +
      (ehMedico && hist.length
        ? '<div class="call-info-item"><span>Atendimentos anteriores</span></div>' +
          hist
            .map(function (c) {
              return (
                '<div class="call-info-item"><span>' + U.fmtData(c.data) + " · " + U.esc(c.especialidade) +
                "</span><strong style='font-size:var(--t-sm);font-weight:500'>" +
                U.esc((c.resumo || "—").slice(0, 110)) + "</strong></div>"
              );
            })
            .join("")
        : "");
  }

  function idade(nasc) {
    if (!nasc) return "—";
    var d = new Date(nasc + "T12:00:00");
    var a = new Date().getFullYear() - d.getFullYear();
    var m = new Date().getMonth() - d.getMonth();
    if (m < 0 || (m === 0 && new Date().getDate() < d.getDate())) a--;
    return a;
  }

  function renderNotas() {
    var host = document.getElementById("notas-header");
    if (!host) return;
    if (!ehMedico) {
      host.innerHTML =
        '<p class="small" style="color:rgba(255,255,255,.55);margin-bottom:.75rem">' +
        "Este espaço é preenchido pelo profissional durante o atendimento. " +
        "Ao encerrar, o registro fica disponível no seu prontuário.</p>";
      U.qsa(".call-note").forEach(function (t) {
        t.readOnly = true;
        t.placeholder = "Preenchido pelo profissional…";
      });
      document.getElementById("btn-salvar-nota").classList.add("hidden");
      return;
    }
    host.innerHTML =
      '<p class="small" style="color:rgba(255,255,255,.55);margin-bottom:.75rem">' +
      "Registro clínico de <strong style='color:#fff'>" + U.esc(global.DB.perfil().nome) +
      "</strong> — salvo no prontuário eletrônico.</p>";
    if (consulta) {
      document.getElementById("nota-anamnese").value = consulta.anamnese || "";
      document.getElementById("nota-avaliacao").value = consulta.resumo || "";
      document.getElementById("nota-conduta").value = consulta.conduta || "";
    }
  }

  function salvarNota() {
    if (!consulta) return UI.toast("Nenhuma consulta vinculada a esta sala.", "warn");
    global.DB.atualizarConsulta(consulta.id, {
      anamnese: document.getElementById("nota-anamnese").value.trim(),
      resumo: document.getElementById("nota-avaliacao").value.trim(),
      conduta: document.getElementById("nota-conduta").value.trim(),
    });
    UI.toast("Registro salvo no prontuário eletrônico.", "success");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})(window);
