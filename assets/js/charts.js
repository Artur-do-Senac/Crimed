/* ============================================================================
   CRIMED · charts.js
   Motor de gráficos SVG próprio — animado, responsivo, com tooltip e sem
   nenhuma biblioteca externa. Todos os gráficos respeitam o tema e o modo de
   movimento reduzido.
   ========================================================================= */
(function (global) {
  "use strict";

  var NS = "http://www.w3.org/2000/svg";
  var PALETA = ["#208049", "#2098FB", "#88C570", "#B13B4E", "#D98324", "#0A5478", "#4FB173"];

  function el(tag, attrs, parent) {
    var n = document.createElementNS(NS, tag);
    for (var k in attrs) {
      if (attrs[k] != null) n.setAttribute(k, attrs[k]);
    }
    if (parent) parent.appendChild(n);
    return n;
  }

  function semMovimento() {
    return document.documentElement.getAttribute("data-motion") === "off";
  }

  function criarSvg(host, w, h) {
    host.innerHTML = "";
    host.classList.add("chart-host");
    var svg = el("svg", {
      viewBox: "0 0 " + w + " " + h,
      preserveAspectRatio: "xMidYMid meet",
      role: "img",
      class: "chart-svg",
    });
    host.appendChild(svg);
    return svg;
  }

  function tooltip(host) {
    var t = host.querySelector(".chart-tip");
    if (!t) {
      t = document.createElement("div");
      t.className = "chart-tip";
      host.appendChild(t);
    }
    return t;
  }

  function mostrarTip(host, html, xPct, yPct) {
    var t = tooltip(host);
    t.innerHTML = html;
    t.style.left = xPct + "%";
    t.style.top = yPct + "%";
    t.classList.add("is-on");
  }
  function esconderTip(host) {
    var t = host.querySelector(".chart-tip");
    if (t) t.classList.remove("is-on");
  }

  /**
   * Aplica uma animação de entrada mantendo o estado final já no elemento.
   * Se a animação não rodar, o gráfico continua legível.
   */
  function entrar(el, nome, dur, atraso) {
    if (semMovimento()) return;
    /* fill-mode "backwards": segura o quadro inicial durante o atraso e, ao
       terminar, devolve o elemento ao próprio style — que já é o estado final */
    el.style.animation =
      nome + " " + dur + " " + (atraso || "0s") + " cubic-bezier(.16,1,.3,1) backwards";
  }

  /** Desenha o traço de um caminho SVG sem escondê-lo caso a animação falhe. */
  function desenhar(path, dur, atraso) {
    var len;
    try {
      len = path.getTotalLength();
    } catch (e) {
      return;
    }
    path.style.strokeDasharray = len;
    path.style.strokeDashoffset = 0;
    path.style.setProperty("--dash", len);
    entrar(path, "dash-in", dur || "1.4s", atraso);
  }

  function niceMax(v) {
    if (v <= 0) return 10;
    var mag = Math.pow(10, Math.floor(Math.log10(v)));
    var n = v / mag;
    var step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
    return step * mag;
  }

  function fmt(n) {
    return Number(n).toLocaleString("pt-BR");
  }

  /* ======================================================= LINHA / ÁREA */
  /**
   * @param {HTMLElement} host
   * @param {{labels:string[], series:{nome:string,dados:number[],cor?:string,area?:boolean}[],
   *          sufixo?:string, altura?:number}} cfg
   */
  function linha(host, cfg) {
    if (!host) return;
    var W = 660, H = cfg.altura || 280;
    var m = { t: 22, r: 18, b: 34, l: 46 };
    var svg = criarSvg(host, W, H);
    var iw = W - m.l - m.r, ih = H - m.t - m.b;

    var todos = [];
    cfg.series.forEach(function (s) { todos = todos.concat(s.dados); });
    var max = niceMax(Math.max.apply(null, todos) * 1.08);
    var passos = 4;

    /* grade + eixo Y */
    for (var g = 0; g <= passos; g++) {
      var y = m.t + (ih / passos) * g;
      el("line", {
        x1: m.l, y1: y, x2: W - m.r, y2: y,
        class: "chart-grid",
      }, svg);
      var val = Math.round(max - (max / passos) * g);
      var tx = el("text", { x: m.l - 10, y: y + 4, class: "chart-axis", "text-anchor": "end" }, svg);
      tx.textContent = val >= 1000 ? (val / 1000).toFixed(val % 1000 ? 1 : 0) + "k" : val;
    }

    /* eixo X */
    var n = cfg.labels.length;
    var px = function (i) { return m.l + (iw / Math.max(1, n - 1)) * i; };
    var py = function (v) { return m.t + ih - (v / max) * ih; };

    cfg.labels.forEach(function (lb, i) {
      var t = el("text", { x: px(i), y: H - 10, class: "chart-axis", "text-anchor": "middle" }, svg);
      t.textContent = lb;
    });

    cfg.series.forEach(function (s, si) {
      var cor = s.cor || PALETA[si % PALETA.length];
      var d = "", da = "";
      s.dados.forEach(function (v, i) {
        d += (i ? " L" : "M") + px(i).toFixed(1) + " " + py(v).toFixed(1);
      });
      if (s.area !== false) {
        da = d + " L" + px(n - 1).toFixed(1) + " " + (m.t + ih) + " L" + px(0).toFixed(1) + " " + (m.t + ih) + " Z";
        var gid = "grad-" + Math.random().toString(36).slice(2, 8);
        var defs = el("defs", {}, svg);
        var lg = el("linearGradient", { id: gid, x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
        el("stop", { offset: "0%", "stop-color": cor, "stop-opacity": 0.28 }, lg);
        el("stop", { offset: "100%", "stop-color": cor, "stop-opacity": 0.02 }, lg);
        var area = el("path", { d: da, fill: "url(#" + gid + ")", stroke: "none" }, svg);
        entrar(area, "fade-in-soft", "0.8s", si * 0.18 + 0.5 + "s");
      }

      var path = el("path", {
        d: d, fill: "none", stroke: cor, "stroke-width": 2.6,
        "stroke-linecap": "round", "stroke-linejoin": "round",
      }, svg);
      desenhar(path, "1.4s", si * 0.18 + "s");

      /* pontos + interação */
      s.dados.forEach(function (v, i) {
        var c = el("circle", {
          cx: px(i), cy: py(v), r: 4.5, fill: "var(--surface)",
          stroke: cor, "stroke-width": 2.4, class: "chart-dot",
        }, svg);
        var hit = el("circle", { cx: px(i), cy: py(v), r: 16, fill: "transparent", class: "chart-hit" }, svg);
        var mostrar = function () {
          c.setAttribute("r", 6.5);
          mostrarTip(
            host,
            "<strong>" + cfg.labels[i] + "</strong>" +
              '<span style="color:' + cor + '">● </span>' + s.nome + ": <b>" + fmt(v) + (cfg.sufixo || "") + "</b>",
            (px(i) / W) * 100,
            (py(v) / H) * 100
          );
        };
        hit.addEventListener("mouseenter", mostrar);
        hit.addEventListener("focus", mostrar);
        hit.addEventListener("mouseleave", function () {
          c.setAttribute("r", 4.5);
          esconderTip(host);
        });
      });
    });

    legenda(host, cfg.series.map(function (s, i) {
      return { nome: s.nome, cor: s.cor || PALETA[i % PALETA.length] };
    }));
  }

  /* ============================================================== BARRAS */
  function barras(host, cfg) {
    if (!host) return;
    var W = 660, H = cfg.altura || 280;
    var m = { t: 22, r: 18, b: 40, l: 46 };
    var svg = criarSvg(host, W, H);
    var iw = W - m.l - m.r, ih = H - m.t - m.b;
    var series = cfg.series;
    var todos = [];
    series.forEach(function (s) { todos = todos.concat(s.dados); });
    var max = niceMax(Math.max.apply(null, todos) * 1.1);
    var n = cfg.labels.length;
    var grupoW = iw / n;
    var barW = Math.min(26, (grupoW * 0.62) / series.length);
    var gap = 4;

    for (var g = 0; g <= 4; g++) {
      var y = m.t + (ih / 4) * g;
      el("line", { x1: m.l, y1: y, x2: W - m.r, y2: y, class: "chart-grid" }, svg);
      var t = el("text", { x: m.l - 10, y: y + 4, class: "chart-axis", "text-anchor": "end" }, svg);
      var val = Math.round(max - (max / 4) * g);
      t.textContent = val >= 1000 ? (val / 1000).toFixed(val % 1000 ? 1 : 0) + "k" : val;
    }

    cfg.labels.forEach(function (lb, i) {
      var cx = m.l + grupoW * i + grupoW / 2;
      var tt = el("text", { x: cx, y: H - 14, class: "chart-axis", "text-anchor": "middle" }, svg);
      tt.textContent = lb;

      series.forEach(function (s, si) {
        var v = s.dados[i];
        var cor = s.cor || PALETA[si % PALETA.length];
        var h = (v / max) * ih;
        var totalW = series.length * barW + (series.length - 1) * gap;
        var x = cx - totalW / 2 + si * (barW + gap);
        var y0 = m.t + ih - h;
        var r = el("rect", {
          x: x, y: y0, width: barW, height: Math.max(2, h),
          rx: Math.min(5, barW / 2), fill: cor, class: "chart-bar",
        }, svg);
        r.style.transformOrigin = "center " + (m.t + ih) + "px";
        entrar(r, "grow-y", "0.8s", i * 0.05 + si * 0.08 + "s");
        r.addEventListener("mouseenter", function () {
          r.style.filter = "brightness(1.15)";
          mostrarTip(
            host,
            "<strong>" + lb + "</strong><span style='color:" + cor + "'>● </span>" +
              s.nome + ": <b>" + fmt(v) + (cfg.sufixo || "") + "</b>",
            ((x + barW / 2) / W) * 100,
            (y0 / H) * 100
          );
        });
        r.addEventListener("mouseleave", function () {
          r.style.filter = "";
          esconderTip(host);
        });
      });
    });

    legenda(host, series.map(function (s, i) {
      return { nome: s.nome, cor: s.cor || PALETA[i % PALETA.length] };
    }));
  }

  /* ==================================================== BARRAS HORIZONTAIS */
  function barrasH(host, cfg) {
    if (!host) return;
    host.innerHTML = "";
    host.classList.add("hbars");
    var max = Math.max.apply(null, cfg.dados.map(function (d) { return d.valor; }));
    cfg.dados.forEach(function (d, i) {
      var cor = d.cor || PALETA[i % PALETA.length];
      var pct = (d.valor / max) * 100;
      var linha = document.createElement("div");
      linha.className = "hbar";
      linha.innerHTML =
        '<div class="hbar-label"><span>' + d.nome + "</span><b>" + fmt(d.valor) + (cfg.sufixo || "") + "</b></div>" +
        '<div class="hbar-track"><div class="hbar-fill" style="background:' + cor + '"></div></div>';
      host.appendChild(linha);
      var fill = linha.querySelector(".hbar-fill");
      fill.style.width = pct + "%";
      entrar(fill, "grow-w", "1s", i * 0.09 + "s");
    });
  }

  /* =============================================================== ROSCA */
  function donut(host, cfg) {
    if (!host) return;
    var S = 240;
    var svg = criarSvg(host, S, S);
    var cx = S / 2, cy = S / 2, r = 88, w = 26;
    var total = cfg.dados.reduce(function (a, d) { return a + d.valor; }, 0);
    var circ = 2 * Math.PI * r;
    var offset = 0;

    el("circle", {
      cx: cx, cy: cy, r: r, fill: "none",
      stroke: "var(--surface-3)", "stroke-width": w,
    }, svg);

    cfg.dados.forEach(function (d, i) {
      var cor = d.cor || PALETA[i % PALETA.length];
      var frac = d.valor / total;
      var dash = frac * circ;
      var arco = el("circle", {
        cx: cx, cy: cy, r: r, fill: "none", stroke: cor, "stroke-width": w,
        "stroke-dasharray": dash + " " + (circ - dash),
        "stroke-dashoffset": -offset,
        transform: "rotate(-90 " + cx + " " + cy + ")",
        "stroke-linecap": "butt",
        class: "chart-arc",
      }, svg);
      entrar(arco, "fade-in-soft", "0.5s", i * 0.12 + 0.2 + "s");
      arco.addEventListener("mouseenter", function () {
        arco.setAttribute("stroke-width", w + 8);
        mostrarTip(
          host,
          "<strong>" + d.nome + "</strong><b>" + fmt(d.valor) + "</b> · " + Math.round(frac * 100) + "%",
          50, 50
        );
      });
      arco.addEventListener("mouseleave", function () {
        arco.setAttribute("stroke-width", w);
        esconderTip(host);
      });
      offset += dash;
    });

    var centro = el("text", { x: cx, y: cy - 4, class: "chart-center-value", "text-anchor": "middle" }, svg);
    centro.textContent = cfg.centroValor || fmt(total);
    var sub = el("text", { x: cx, y: cy + 20, class: "chart-center-label", "text-anchor": "middle" }, svg);
    sub.textContent = cfg.centroLabel || "total";

    legenda(host, cfg.dados.map(function (d, i) {
      return {
        nome: d.nome,
        cor: d.cor || PALETA[i % PALETA.length],
        valor: Math.round((d.valor / total) * 100) + "%",
      };
    }));
  }

  /* =============================================================== GAUGE */
  function gauge(host, cfg) {
    if (!host) return;
    var W = 240, H = 150;
    var svg = criarSvg(host, W, H);
    var cx = W / 2, cy = 122, r = 92, w = 20;
    var valor = Math.max(0, Math.min(100, cfg.valor));

    function ponto(pct) {
      var ang = Math.PI * (1 - pct / 100);
      return [cx + r * Math.cos(ang), cy - r * Math.sin(ang)];
    }
    function arcoD(pct) {
      var a = ponto(0), b = ponto(pct);
      return "M" + a[0] + " " + a[1] + " A" + r + " " + r + " 0 " + (pct > 50 ? 1 : 0) + " 1 " + b[0] + " " + b[1];
    }

    el("path", {
      d: arcoD(100), fill: "none", stroke: "var(--surface-3)",
      "stroke-width": w, "stroke-linecap": "round",
    }, svg);

    var defs = el("defs", {}, svg);
    var gid = "g-gauge-" + Math.random().toString(36).slice(2, 7);
    var lg = el("linearGradient", { id: gid, x1: 0, y1: 0, x2: 1, y2: 0 }, defs);
    el("stop", { offset: "0%", "stop-color": cfg.corA || "#D98324" }, lg);
    el("stop", { offset: "100%", "stop-color": cfg.corB || "#208049" }, lg);

    var arco = el("path", {
      d: arcoD(valor), fill: "none", stroke: "url(#" + gid + ")",
      "stroke-width": w, "stroke-linecap": "round",
    }, svg);
    desenhar(arco, "1.3s", "0.2s");

    var v = el("text", { x: cx, y: cy - 24, class: "chart-center-value", "text-anchor": "middle" }, svg);
    v.textContent = cfg.rotulo || valor + "%";
    var l = el("text", { x: cx, y: cy + 2, class: "chart-center-label", "text-anchor": "middle" }, svg);
    l.textContent = cfg.legenda || "";
  }

  /* =========================================================== SPARKLINE */
  function sparkline(host, dados, cor) {
    if (!host) return;
    var W = 120, H = 34;
    var svg = criarSvg(host, W, H);
    host.classList.add("spark");
    var max = Math.max.apply(null, dados), min = Math.min.apply(null, dados);
    var range = max - min || 1;
    var d = "";
    dados.forEach(function (v, i) {
      var x = (i / (dados.length - 1)) * (W - 4) + 2;
      var y = H - 4 - ((v - min) / range) * (H - 10);
      d += (i ? " L" : "M") + x.toFixed(1) + " " + y.toFixed(1);
    });
    var p = el("path", {
      d: d, fill: "none", stroke: cor || "var(--brand)", "stroke-width": 2,
      "stroke-linecap": "round", "stroke-linejoin": "round",
    }, svg);
    desenhar(p, "1.1s", "0.1s");
  }

  /* ============================================================= LEGENDA */
  function legenda(host, itens) {
    var old = host.parentNode && host.parentNode.querySelector(".chart-legend");
    if (old) old.remove();
    var l = document.createElement("div");
    l.className = "chart-legend";
    l.innerHTML = itens
      .map(function (i) {
        return (
          '<span class="chart-legend-item"><i style="background:' + i.cor + '"></i>' +
          i.nome + (i.valor ? " <b>" + i.valor + "</b>" : "") + "</span>"
        );
      })
      .join("");
    if (host.parentNode) host.parentNode.appendChild(l);
  }

  /* ========================================================== ELETRO (ECG) */
  /** Linha de eletrocardiograma animada — usada como elemento visual. */
  function ecg(host) {
    if (!host) return;
    var W = 300, H = 70;
    var svg = criarSvg(host, W, H);
    var d = "M0 35 L40 35 L48 35 L54 12 L60 58 L66 28 L72 35 L110 35 L118 35 L124 12 L130 58 L136 28 L142 35 L180 35 L188 35 L194 12 L200 58 L206 28 L212 35 L250 35 L258 35 L264 12 L270 58 L276 28 L282 35 L300 35";
    var p = el("path", {
      d: d, fill: "none", stroke: "currentColor", "stroke-width": 2,
      "stroke-linecap": "round", "stroke-linejoin": "round",
    }, svg);
    if (!semMovimento()) {
      var len = p.getTotalLength();
      p.style.strokeDasharray = len;
      p.style.strokeDashoffset = len;
      p.style.animation = "dash-draw 2.6s linear infinite";
    }
  }

  global.Chart = {
    linha: linha,
    barras: barras,
    barrasH: barrasH,
    donut: donut,
    gauge: gauge,
    sparkline: sparkline,
    ecg: ecg,
    paleta: PALETA,
  };
})(window);
