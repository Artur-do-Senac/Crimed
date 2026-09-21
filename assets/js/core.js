/* ============================================================================
   CRIMED · core.js
   Utilitários de interface: toasts, modais, tema, acessibilidade, animações,
   shell do aplicativo (sidebar + topbar) e central de notificações.
   ========================================================================= */
(function (global) {
  "use strict";

  /* ==================================================================== UTIL */
  var U = {
    qs: function (sel, ctx) {
      return (ctx || document).querySelector(sel);
    },
    qsa: function (sel, ctx) {
      return Array.prototype.slice.call((ctx || document).querySelectorAll(sel));
    },
    on: function (el, ev, fn, opts) {
      if (el) el.addEventListener(ev, fn, opts);
    },
    esc: function (s) {
      return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
        return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
      });
    },
    pad: function (n) {
      return n < 10 ? "0" + n : "" + n;
    },

    /* — datas — */
    fmtData: function (isoStr) {
      if (!isoStr) return "—";
      var p = String(isoStr).split("-");
      return p.length === 3 ? p[2] + "/" + p[1] + "/" + p[0] : isoStr;
    },
    fmtDataLonga: function (isoStr) {
      if (!isoStr) return "—";
      var p = String(isoStr).split("-");
      var meses = [
        "janeiro", "fevereiro", "março", "abril", "maio", "junho",
        "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
      ];
      return parseInt(p[2], 10) + " de " + meses[parseInt(p[1], 10) - 1] + " de " + p[0];
    },
    diaSemana: function (isoStr) {
      var d = new Date(isoStr + "T12:00:00");
      return ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"][d.getDay()];
    },
    /** Diferença em dias entre hoje e uma data ISO (negativo = passado). */
    diasAte: function (isoStr) {
      var hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      var alvo = new Date(isoStr + "T00:00:00");
      return Math.round((alvo - hoje) / 86400000);
    },
    /** "hoje", "amanhã", "em 4 dias", "há 12 dias" */
    quando: function (isoStr) {
      var d = U.diasAte(isoStr);
      if (d === 0) return "hoje";
      if (d === 1) return "amanhã";
      if (d === -1) return "ontem";
      return d > 0 ? "em " + d + " dias" : "há " + Math.abs(d) + " dias";
    },
    iniciais: function (nome) {
      if (!nome) return "??";
      var partes = String(nome).replace(/^(Dr|Dra|Enf)\.?\s+/i, "").trim().split(/\s+/);
      var a = partes[0] ? partes[0][0] : "";
      var b = partes.length > 1 ? partes[partes.length - 1][0] : "";
      return (a + b).toUpperCase();
    },
    num: function (n) {
      return Number(n).toLocaleString("pt-BR");
    },
    /** Gera um código no formato XXXX-XXXX-XXXX. */
    codigo: function () {
      var c = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
      var out = [];
      for (var b = 0; b < 3; b++) {
        var s = "";
        for (var i = 0; i < 4; i++) s += c[Math.floor(Math.random() * c.length)];
        out.push(s);
      }
      return out.join("-");
    },
    debounce: function (fn, ms) {
      var t;
      return function () {
        var ctx = this, args = arguments;
        clearTimeout(t);
        t = setTimeout(function () {
          fn.apply(ctx, args);
        }, ms || 200);
      };
    },
    /** Query string helper. */
    param: function (name) {
      return new URLSearchParams(location.search).get(name);
    },
  };

  /* =================================================================== TOAST */
  function toast(message, type, title) {
    var box = document.getElementById("toast-container");
    if (!box) {
      box = document.createElement("div");
      box.id = "toast-container";
      document.body.appendChild(box);
    }
    type = type || "info";
    var icons = {
      success: "check-circle",
      error: "x-circle",
      warn: "alert-triangle",
      info: "info",
    };
    var dur = type === "error" ? 5200 : 4200;
    var el = document.createElement("div");
    el.className = "toast toast-" + type;
    el.setAttribute("role", "status");
    el.style.setProperty("--toast-dur", dur + "ms");
    el.innerHTML =
      (global.Icon ? global.Icon.svg(icons[type] || "info") : "") +
      "<div>" +
      (title ? "<strong>" + U.esc(title) + "</strong>" : "") +
      "<span>" + message + "</span>" +
      "</div>";
    box.appendChild(el);

    var kill = function () {
      el.classList.add("is-leaving");
      setTimeout(function () {
        el.remove();
      }, 300);
    };
    var timer = setTimeout(kill, dur);
    U.on(el, "click", function () {
      clearTimeout(timer);
      kill();
    });
    return el;
  }

  /* =================================================================== MODAL */
  var Modal = {
    open: function (id) {
      var m = typeof id === "string" ? document.getElementById(id) : id;
      if (!m) return;
      m.classList.add("is-open");
      document.body.classList.add("modal-open");
      var f = m.querySelector("input:not([type=hidden]), select, textarea, button");
      if (f) setTimeout(function () { try { f.focus(); } catch (e) {} }, 120);
      m.dispatchEvent(new CustomEvent("modal:open"));
    },
    close: function (id) {
      var m = typeof id === "string" ? document.getElementById(id) : id;
      if (!m) return;
      m.classList.remove("is-open");
      if (!document.querySelector(".modal.is-open")) {
        document.body.classList.remove("modal-open");
      }
      m.dispatchEvent(new CustomEvent("modal:close"));
    },
    closeAll: function () {
      U.qsa(".modal.is-open").forEach(function (m) {
        Modal.close(m);
      });
    },
  };

  /** Caixa de confirmação estilizada (substitui window.confirm). */
  function confirmar(opts) {
    opts = opts || {};
    return new Promise(function (resolve) {
      var id = "modal-confirm-" + Date.now();
      var el = document.createElement("div");
      el.className = "modal";
      el.id = id;
      el.innerHTML =
        '<div class="modal-box modal-box-sm">' +
        '<div class="modal-head"><h3>' +
        (global.Icon ? global.Icon.svg(opts.danger ? "alert-triangle" : "help-circle") : "") +
        U.esc(opts.titulo || "Confirmar ação") +
        "</h3>" +
        (opts.texto ? "<p>" + opts.texto + "</p>" : "") +
        "</div>" +
        '<div class="modal-foot">' +
        '<button class="btn btn-ghost" data-act="no">' + U.esc(opts.cancelar || "Voltar") + "</button>" +
        '<button class="btn ' + (opts.danger ? "btn-danger" : "btn-primary") + '" data-act="yes">' +
        U.esc(opts.confirmar || "Confirmar") + "</button>" +
        "</div></div>";
      document.body.appendChild(el);
      Modal.open(el);

      function done(v) {
        Modal.close(el);
        setTimeout(function () { el.remove(); }, 260);
        resolve(v);
      }
      el.querySelector('[data-act="yes"]').addEventListener("click", function () { done(true); });
      el.querySelector('[data-act="no"]').addEventListener("click", function () { done(false); });
      el.addEventListener("click", function (e) {
        if (e.target === el) done(false);
      });
    });
  }

  /* ============================================================ TEMA / A11Y */
  var PREFS_KEY = "crimed.prefs";
  var prefs = (function () {
    try {
      return JSON.parse(localStorage.getItem(PREFS_KEY)) || {};
    } catch (e) {
      return {};
    }
  })();

  function savePrefs() {
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
    } catch (e) {}
  }

  var A11y = {
    escalas: [100, 112, 126, 140],

    aplicar: function () {
      var r = document.documentElement;
      r.setAttribute("data-trocando", "");

      if (prefs.tema === "dark") r.setAttribute("data-theme", "dark");
      else r.removeAttribute("data-theme");

      if (prefs.contraste === "high") r.setAttribute("data-contrast", "high");
      else r.removeAttribute("data-contrast");

      if (prefs.motion === "off") r.setAttribute("data-motion", "off");
      else r.removeAttribute("data-motion");

      r.style.setProperty("--root-size", (prefs.fonte || 100) + "%");

      /* força o recálculo enquanto as transições ainda estão desligadas e só
         então as devolve (setTimeout em vez de rAF: continua disparando com a
         aba em segundo plano, sem risco de travar desligado) */
      void document.body.offsetWidth;
      setTimeout(function () {
        r.removeAttribute("data-trocando");
      }, 60);

      A11y.sincronizarBotoes();
    },

    sincronizarBotoes: function () {
      var mapa = {
        "[data-a11y=tema]": prefs.tema === "dark",
        "[data-a11y=contraste]": prefs.contraste === "high",
        "[data-a11y=motion]": prefs.motion === "off",
      };
      Object.keys(mapa).forEach(function (sel) {
        U.qsa(sel).forEach(function (b) {
          b.classList.toggle("is-active", !!mapa[sel]);
          b.setAttribute("aria-pressed", mapa[sel] ? "true" : "false");
        });
      });
      U.qsa("[data-a11y=tema] .a11y-tema-label").forEach(function (s) {
        s.textContent = prefs.tema === "dark" ? "Claro" : "Escuro";
      });
      U.qsa("[data-a11y=tema] use").forEach(function (u) {
        u.setAttribute("href", prefs.tema === "dark" ? "#i-sun" : "#i-moon");
      });
    },

    tema: function () {
      prefs.tema = prefs.tema === "dark" ? "light" : "dark";
      savePrefs();
      A11y.aplicar();
      toast(
        prefs.tema === "dark" ? "Modo escuro ativado." : "Modo claro ativado.",
        "info"
      );
    },

    contraste: function () {
      prefs.contraste = prefs.contraste === "high" ? "normal" : "high";
      savePrefs();
      A11y.aplicar();
      toast(
        prefs.contraste === "high"
          ? "Alto contraste ativado — cores simplificadas para maior legibilidade."
          : "Alto contraste desativado.",
        "info"
      );
    },

    motion: function () {
      prefs.motion = prefs.motion === "off" ? "on" : "off";
      savePrefs();
      A11y.aplicar();
      toast(
        prefs.motion === "off" ? "Animações reduzidas." : "Animações reativadas.",
        "info"
      );
    },

    fonte: function (dir) {
      var atual = prefs.fonte || 100;
      var i = A11y.escalas.indexOf(atual);
      if (i < 0) i = 0;
      if (dir === "reset") i = 0;
      else i = Math.min(A11y.escalas.length - 1, Math.max(0, i + dir));
      prefs.fonte = A11y.escalas[i];
      savePrefs();
      A11y.aplicar();
      toast("Tamanho do texto: " + prefs.fonte + "%", "info");
    },

    /** Carrega o plugin oficial VLibras (gov.br) sob demanda. */
    libras: function () {
      if (document.getElementById("vlibras-root")) {
        toast("O tradutor de Libras já está ativo — use o botão azul na lateral.", "info");
        return;
      }
      toast("Carregando o tradutor de Libras (VLibras/gov.br)…", "info");
      var root = document.createElement("div");
      root.id = "vlibras-root";
      root.innerHTML =
        '<div vw class="enabled"><div vw-access-button class="active"></div>' +
        '<div vw-plugin-wrapper><div class="vw-plugin-top-wrapper"></div></div></div>';
      document.body.appendChild(root);

      var s = document.createElement("script");
      s.src = "https://vlibras.gov.br/app/vlibras-plugin.js";
      s.onload = function () {
        try {
          new global.VLibras.Widget("https://vlibras.gov.br/app");
          toast("Tradutor de Libras ativo. Clique no ícone azul para abrir.", "success");
        } catch (e) {
          toast("Não foi possível iniciar o VLibras agora.", "warn");
        }
      };
      s.onerror = function () {
        root.remove();
        toast("O VLibras precisa de conexão com a internet para carregar.", "warn");
      };
      document.head.appendChild(s);
    },
  };

  /* ================================================================ REVEAL */
  function reveal(root) {
    var alvos = U.qsa(".reveal:not(.is-visible)", root);
    if (!alvos.length) return;
    if (!("IntersectionObserver" in global)) {
      alvos.forEach(function (el) { el.classList.add("is-visible"); });
      return;
    }
    var obs = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            e.target.classList.add("is-visible");
            obs.unobserve(e.target);
            if (e.target.hasAttribute("data-count")) countUp(e.target);
            U.qsa("[data-count]", e.target).forEach(countUp);
            U.qsa("[data-bar]", e.target).forEach(function (b) {
              b.style.width = b.getAttribute("data-bar") + "%";
            });
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    alvos.forEach(function (el) { obs.observe(el); });
  }

  /* ============================================================== CONTADOR */
  function countUp(el) {
    if (el.dataset.counted === "1") return;
    el.dataset.counted = "1";
    var alvo = parseFloat(el.getAttribute("data-count"));
    var dec = parseInt(el.getAttribute("data-dec") || "0", 10);
    var sufixo = el.getAttribute("data-suffix") || "";
    var prefixo = el.getAttribute("data-prefix") || "";
    var dur = parseInt(el.getAttribute("data-dur") || "1400", 10);

    function escrever(v) {
      el.textContent =
        prefixo +
        v.toLocaleString("pt-BR", { minimumFractionDigits: dec, maximumFractionDigits: dec }) +
        sufixo;
    }

    /* o valor final entra primeiro: se a animação não rodar (aba em segundo
       plano, movimento reduzido), o número correto continua visível */
    escrever(alvo);
    if (
      document.documentElement.getAttribute("data-motion") === "off" ||
      document.hidden
    ) {
      return;
    }

    var t0 = performance.now();
    function passo(t) {
      var p = Math.min(1, (t - t0) / dur);
      escrever(alvo * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(passo);
    }
    requestAnimationFrame(passo);
  }

  /* =============================================================== CONFETE */
  function confete(opts) {
    opts = opts || {};
    if (document.documentElement.getAttribute("data-motion") === "off") return;
    var cores = opts.cores || ["#208049", "#88C570", "#2098FB", "#DBF3D7", "#B13B4E", "#F0B429"];
    var canvas = document.createElement("canvas");
    canvas.style.cssText =
      "position:fixed;inset:0;pointer-events:none;z-index:990";
    canvas.width = innerWidth;
    canvas.height = innerHeight;
    document.body.appendChild(canvas);
    var ctx = canvas.getContext("2d");
    var N = opts.quantidade || 110;
    var ps = [];
    var ox = opts.x != null ? opts.x : innerWidth / 2;
    var oy = opts.y != null ? opts.y : innerHeight / 2.6;
    for (var i = 0; i < N; i++) {
      ps.push({
        x: ox,
        y: oy,
        vx: (Math.random() - 0.5) * 13,
        vy: Math.random() * -13 - 3,
        g: 0.28 + Math.random() * 0.14,
        s: 4 + Math.random() * 6,
        r: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.3,
        c: cores[(Math.random() * cores.length) | 0],
        life: 1,
      });
    }
    var frames = 0;
    (function loop() {
      frames++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      var vivos = 0;
      ps.forEach(function (p) {
        p.vy += p.g;
        p.vx *= 0.992;
        p.x += p.vx;
        p.y += p.vy;
        p.r += p.vr;
        if (frames > 70) p.life -= 0.022;
        if (p.life <= 0 || p.y > canvas.height + 40) return;
        vivos++;
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.translate(p.x, p.y);
        ctx.rotate(p.r);
        ctx.fillStyle = p.c;
        ctx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * 0.62);
        ctx.restore();
      });
      if (vivos > 0 && frames < 320) requestAnimationFrame(loop);
      else canvas.remove();
    })();
  }

  /* ========================================================== SHELL DO APP */
  var NAV = {
    paciente: [
      { secao: "Atendimento" },
      { id: "dashboard", label: "Início", ico: "home", href: "dashboard.html" },
      { id: "consultas", label: "Minhas Consultas", ico: "calendar", href: "consultas.html", pill: "consultasAtivas" },
      { id: "teleconsulta", label: "Sala de Teleconsulta", ico: "video", href: "teleconsulta.html" },
      { secao: "Meus dados" },
      { id: "prontuarios", label: "Prontuário e Exames", ico: "file-medical", href: "prontuarios.html" },
      { id: "perfil", label: "Meu Perfil e LGPD", ico: "user", href: "perfil.html" },
      { secao: "Município" },
      { id: "sobre", label: "O Projeto", ico: "book", href: "sobre.html" },
    ],
    medico: [
      { secao: "Atendimento" },
      { id: "medico", label: "Agenda do Dia", ico: "calendar-check", href: "medico.html" },
      { id: "teleconsulta", label: "Sala de Atendimento", ico: "video", href: "teleconsulta.html?papel=medico" },
      { secao: "Gestão clínica" },
      { id: "prontuarios", label: "Prontuários", ico: "file-medical", href: "prontuarios.html" },
      { id: "admin", label: "Indicadores", ico: "bar-chart", href: "admin.html" },
      { secao: "Município" },
      { id: "sobre", label: "O Projeto", ico: "book", href: "sobre.html" },
    ],
    admin: [
      { secao: "Gestão" },
      { id: "admin", label: "Painel de Indicadores", ico: "bar-chart", href: "admin.html" },
      { id: "medico", label: "Operação e Fila", ico: "users", href: "medico.html" },
      { secao: "Rede municipal" },
      { id: "prontuarios", label: "Auditoria de Prontuários", ico: "file-medical", href: "prontuarios.html" },
      { id: "sobre", label: "O Projeto", ico: "book", href: "sobre.html" },
    ],
  };

  var Shell = {
    /**
     * Monta a sidebar e a topbar das telas internas.
     * @param {{page:string, titulo:string, sub:string, acoes:string}} cfg
     */
    montar: function (cfg) {
      cfg = cfg || {};
      var usuario = global.DB ? (global.DB.sessao() || global.DB.perfil()) : {};
      var papel = usuario.papel || "paciente";
      var itens = NAV[papel] || NAV.paciente;
      var ativos = global.DB
        ? global.DB.consultas().filter(function (c) { return c.status === "Confirmada"; }).length
        : 0;

      /* — sidebar — */
      var host = U.qs("[data-shell=sidebar]");
      if (host) {
        var html =
          '<a class="sidebar-brand" href="index.html">' +
          '<span class="brand-mark">' + Icon.svg("logo") + "</span>" +
          "<span>CRIMED<small>Tele-Saúde Criciúma</small></span></a>" +
          '<nav class="side-nav" aria-label="Menu principal">';
        itens.forEach(function (it) {
          if (it.secao) {
            html += '<div class="side-section">' + U.esc(it.secao) + "</div>";
            return;
          }
          var pill = "";
          if (it.pill === "consultasAtivas" && ativos > 0) {
            pill = '<span class="side-pill">' + ativos + "</span>";
          }
          html +=
            '<a class="side-link' + (cfg.page === it.id ? " is-active" : "") + '" href="' + it.href + '">' +
            Icon.svg(it.ico) + "<span>" + U.esc(it.label) + "</span>" + pill + "</a>";
        });
        html +=
          "</nav>" +
          '<div class="sidebar-foot">' +
          '<div class="side-user"><div class="avatar' + (papel === "medico" ? " avatar-doc" : "") + '">' +
          U.iniciais(usuario.nome) + "</div>" +
          '<div class="side-user-info"><strong>' + U.esc(usuario.nome || "Visitante") + "</strong>" +
          "<span>" + U.esc(usuario.papelLabel || "Paciente") + "</span></div></div>" +
          '<button class="side-logout" data-act="sair">' + Icon.svg("log-out") + "Sair da conta</button>" +
          "</div>";
        host.className = "sidebar";
        host.innerHTML = html;
      }

      /* — topbar — */
      var top = U.qs("[data-shell=topbar]");
      if (top) {
        var naoLidas = global.DB ? global.DB.naoLidas() : 0;
        top.className = "app-topbar";
        top.innerHTML =
          '<div class="row" style="gap:.75rem">' +
          '<button class="icon-btn sidebar-toggle" data-act="menu" aria-label="Abrir menu">' + Icon.svg("menu") + "</button>" +
          "<div><h1>" + U.esc(cfg.titulo || "Painel") + "</h1>" +
          (cfg.sub ? '<div class="topbar-sub">' + cfg.sub + "</div>" : "") +
          "</div></div>" +
          '<div class="topbar-actions">' +
          (cfg.acoes || "") +
          '<button class="icon-btn" data-a11y="tema" data-tip="Alternar tema">' + Icon.svg("moon") + "</button>" +
          '<button class="icon-btn" data-act="notificacoes" data-tip="Notificações" aria-label="Notificações">' +
          Icon.svg("bell") +
          '<span class="count" data-count-notif data-count="' + naoLidas + '">' + naoLidas + "</span></button>" +
          '<div class="avatar' + (papel === "medico" ? " avatar-doc" : "") + ' presence" data-tip="' +
          U.esc(usuario.nome || "") + '">' + U.iniciais(usuario.nome) + "</div>" +
          "</div>";
      }

      Shell.drawerNotificacoes();
      Shell.ligarEventos();
      A11y.sincronizarBotoes();
      return usuario;
    },

    ligarEventos: function () {
      U.qsa("[data-act=sair]").forEach(function (b) {
        U.on(b, "click", function () {
          confirmar({
            titulo: "Sair da conta",
            texto: "Você voltará para a página inicial do portal.",
            confirmar: "Sair",
          }).then(function (ok) {
            if (ok) {
              if (global.DB) global.DB.sair();
              location.href = "index.html";
            }
          });
        });
      });

      var side = U.qs(".sidebar");
      var scrim = U.qs(".sidebar-scrim");
      U.qsa("[data-act=menu]").forEach(function (b) {
        U.on(b, "click", function () {
          if (side) side.classList.toggle("is-open");
          if (scrim) scrim.classList.toggle("is-open");
        });
      });
      U.on(scrim, "click", function () {
        if (side) side.classList.remove("is-open");
        scrim.classList.remove("is-open");
      });

      U.qsa("[data-act=notificacoes]").forEach(function (b) {
        U.on(b, "click", Shell.abrirNotificacoes);
      });
    },

    drawerNotificacoes: function () {
      if (document.getElementById("drawer-notif")) return;
      var el = document.createElement("aside");
      el.id = "drawer-notif";
      el.className = "drawer";
      el.setAttribute("aria-label", "Central de notificações");
      el.innerHTML =
        '<div class="drawer-head"><h3>' + Icon.svg("bell") + " Notificações</h3>" +
        '<button class="icon-btn" data-act="fechar-notif" aria-label="Fechar">' + Icon.svg("close") + "</button></div>" +
        '<div class="drawer-body" id="drawer-notif-body"></div>' +
        '<div class="drawer-foot"><button class="btn btn-outline btn-block btn-sm" data-act="ler-todas">' +
        Icon.svg("check") + "Marcar todas como lidas</button></div>";
      document.body.appendChild(el);

      U.on(el.querySelector("[data-act=fechar-notif]"), "click", Shell.fecharNotificacoes);
      U.on(el.querySelector("[data-act=ler-todas]"), "click", function () {
        var l = global.DB.notificacoes().map(function (n) {
          n.lida = true;
          return n;
        });
        global.DB.salvarNotificacoes(l);
        Shell.renderNotificacoes();
        Shell.atualizarBadge();
        toast("Todas as notificações foram marcadas como lidas.", "success");
      });
    },

    renderNotificacoes: function () {
      var body = document.getElementById("drawer-notif-body");
      if (!body || !global.DB) return;
      var lista = global.DB.notificacoes();
      if (!lista.length) {
        body.innerHTML =
          '<div class="empty"><div class="icon-bubble">' + Icon.svg("bell") +
          "</div><h4>Tudo em dia</h4><p>Você não tem notificações no momento.</p></div>";
        return;
      }
      var mapa = {
        consulta: { ico: "calendar-check", cls: "bub-brand" },
        exame: { ico: "flask", cls: "bub-accent" },
        receita: { ico: "pill", cls: "bub-warn" },
        campanha: { ico: "sparkles", cls: "bub-brand" },
        sistema: { ico: "info", cls: "bub-accent" },
      };
      body.innerHTML = lista
        .map(function (n) {
          var m = mapa[n.tipo] || mapa.sistema;
          return (
            '<a class="notif' + (n.lida ? "" : " is-unread") + '" href="' + n.link + '" data-notif="' + n.id + '">' +
            '<div class="icon-bubble icon-bubble-sm ' + m.cls + '">' + Icon.svg(m.ico) + "</div>" +
            '<div class="notif-body"><strong>' + U.esc(n.titulo) + "</strong><p>" + U.esc(n.texto) + "</p>" +
            '<span class="notif-time">' + U.esc(n.quando) + "</span></div></a>"
          );
        })
        .join("");
    },

    atualizarBadge: function () {
      var n = global.DB ? global.DB.naoLidas() : 0;
      U.qsa("[data-count-notif]").forEach(function (b) {
        b.textContent = n;
        b.setAttribute("data-count", n);
      });
    },

    abrirNotificacoes: function () {
      Shell.renderNotificacoes();
      var d = document.getElementById("drawer-notif");
      if (d) d.classList.add("is-open");
    },
    fecharNotificacoes: function () {
      var d = document.getElementById("drawer-notif");
      if (d) d.classList.remove("is-open");
    },
  };

  /* ======================================================= BARRA A11Y (HTML) */
  function barraA11y(opcoes) {
    opcoes = opcoes || {};
    return (
      '<div class="a11y-bar"><div class="a11y-inner">' +
      '<span class="a11y-gov">' + Icon.svg("building") +
      "Portal oficial da Prefeitura Municipal de Criciúma · Secretaria de Saúde</span>" +
      '<div class="a11y-tools">' +
      '<button class="a11y-btn" data-a11y="fonte-menos" data-tip="Diminuir texto">A−</button>' +
      '<button class="a11y-btn" data-a11y="fonte-mais" data-tip="Aumentar texto">A+</button>' +
      '<button class="a11y-btn" data-a11y="contraste">' + Icon.svg("contrast") + "Contraste</button>" +
      '<button class="a11y-btn" data-a11y="libras">' + Icon.svg("accessibility") + "Libras</button>" +
      '<span class="a11y-sep"></span>' +
      '<button class="a11y-btn" data-a11y="tema">' + Icon.svg("moon") +
      '<span class="a11y-tema-label">Escuro</span></button>' +
      (opcoes.acessar !== false
        ? '<a class="a11y-btn" href="acesso.html">' + Icon.svg("log-in") + "Acessar</a>"
        : "") +
      "</div></div></div>"
    );
  }

  function ligarA11y() {
    var acoes = {
      tema: A11y.tema,
      contraste: A11y.contraste,
      motion: A11y.motion,
      libras: A11y.libras,
      "fonte-mais": function () { A11y.fonte(1); },
      "fonte-menos": function () { A11y.fonte(-1); },
    };
    document.addEventListener("click", function (e) {
      var alvo = e.target.closest ? e.target.closest("[data-a11y]") : null;
      if (!alvo) return;
      var chave = alvo.getAttribute("data-a11y");
      if (acoes[chave]) {
        e.preventDefault();
        acoes[chave]();
      }
    });
  }

  /* ====================================================== COMPORTAMENTOS GERAIS */
  function ligarGlobais() {
    /* fechar modal: clique fora, botão [data-close] e ESC */
    document.addEventListener("click", function (e) {
      if (e.target.classList && e.target.classList.contains("modal")) {
        Modal.close(e.target);
      }
      var fechar = e.target.closest ? e.target.closest("[data-close-modal]") : null;
      if (fechar) {
        var alvo = fechar.getAttribute("data-close-modal");
        Modal.close(alvo || fechar.closest(".modal"));
      }
      var abrir = e.target.closest ? e.target.closest("[data-open-modal]") : null;
      if (abrir) {
        e.preventDefault();
        Modal.open(abrir.getAttribute("data-open-modal"));
      }
      /* dropdowns */
      var trig = e.target.closest ? e.target.closest("[data-dropdown]") : null;
      U.qsa(".dropdown-menu.is-open").forEach(function (m) {
        if (!trig || m !== document.getElementById(trig.getAttribute("data-dropdown"))) {
          m.classList.remove("is-open");
        }
      });
      if (trig) {
        var menu = document.getElementById(trig.getAttribute("data-dropdown"));
        if (menu) menu.classList.toggle("is-open");
      }
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        Modal.closeAll();
        Shell.fecharNotificacoes();
        U.qsa(".dropdown-menu.is-open").forEach(function (m) { m.classList.remove("is-open"); });
      }
    });

    /* acordeões */
    document.addEventListener("click", function (e) {
      var t = e.target.closest ? e.target.closest(".accordion-trigger") : null;
      if (!t) return;
      var item = t.closest(".accordion-item");
      var painel = item.querySelector(".accordion-panel");
      var aberto = item.classList.contains("is-open");
      var grupo = item.closest("[data-accordion-single]");
      if (grupo) {
        U.qsa(".accordion-item.is-open", grupo).forEach(function (o) {
          o.classList.remove("is-open");
          o.querySelector(".accordion-panel").style.maxHeight = null;
          o.querySelector(".accordion-trigger").setAttribute("aria-expanded", "false");
        });
      }
      if (!aberto) {
        item.classList.add("is-open");
        painel.style.maxHeight = painel.scrollHeight + "px";
        t.setAttribute("aria-expanded", "true");
      } else {
        item.classList.remove("is-open");
        painel.style.maxHeight = null;
        t.setAttribute("aria-expanded", "false");
      }
    });

    /* mostrar/ocultar senha */
    document.addEventListener("click", function (e) {
      var b = e.target.closest ? e.target.closest(".toggle-pass") : null;
      if (!b) return;
      var input = b.parentNode.querySelector("input");
      if (!input) return;
      var mostrar = input.type === "password";
      input.type = mostrar ? "text" : "password";
      b.innerHTML = Icon.svg(mostrar ? "eye-off" : "eye");
    });

    /* navbar com sombra ao rolar + barra de progresso */
    var nav = U.qs(".navbar");
    var prog = document.getElementById("scroll-progress");
    function aoRolar() {
      if (nav) nav.classList.toggle("is-stuck", scrollY > 8);
      if (prog) {
        var h = document.documentElement.scrollHeight - innerHeight;
        prog.style.width = (h > 0 ? (scrollY / h) * 100 : 0) + "%";
      }
    }
    addEventListener("scroll", aoRolar, { passive: true });
    aoRolar();

    /* menu mobile da landing */
    var toggle = U.qs(".nav-toggle");
    var links = U.qs(".nav-links");
    U.on(toggle, "click", function () {
      var aberto = links.classList.toggle("is-open");
      toggle.innerHTML = Icon.svg(aberto ? "close" : "menu");
      toggle.setAttribute("aria-expanded", aberto ? "true" : "false");
    });
    U.qsa(".nav-links a").forEach(function (a) {
      U.on(a, "click", function () {
        if (links) links.classList.remove("is-open");
        if (toggle) toggle.innerHTML = Icon.svg("menu");
      });
    });
  }

  /* ==================================================== REGISTRO DO SERVICE WORKER */
  function registrarSW() {
    if (!("serviceWorker" in navigator)) return;
    if (location.protocol === "file:") return;
    navigator.serviceWorker.register("sw.js").catch(function () {});
  }

  /* ================================================================== BOOT */
  function boot() {
    if (global.DB) global.DB.init();
    A11y.aplicar();
    ligarA11y();
    ligarGlobais();
    reveal();
    U.qsa("[data-count]").forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.top < innerHeight) countUp(el);
    });
    registrarSW();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }

  /* ================================================================ EXPORT */
  global.UI = {
    u: U,
    toast: toast,
    modal: Modal,
    confirmar: confirmar,
    a11y: A11y,
    reveal: reveal,
    countUp: countUp,
    confete: confete,
    shell: Shell,
    barraA11y: barraA11y,
    prefs: prefs,
  };
  /* atalhos usados no HTML */
  global.showToast = toast;
  global.openModal = Modal.open;
  global.closeModal = Modal.close;
})(window);
