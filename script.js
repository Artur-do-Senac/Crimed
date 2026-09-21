// --- SISTEMA DE TOAST NOTIFICATIONS ---
function showToast(message, type = "info") {
  const container = document.getElementById("toast-container");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `toast ${type}`;

  let icon = "fa-circle-info";
  if (type === "success") icon = "fa-circle-check";
  if (type === "error") icon = "fa-circle-exclamation";

  toast.innerHTML = `<i class="fa-solid ${icon}"></i> ${message}`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 3000);
}

// --- ANIMAÇÕES DE SCROLL (REVEAL) ---
function revealOnScroll() {
  const reveals = document.querySelectorAll(".reveal");
  for (let i = 0; i < reveals.length; i++) {
    const windowHeight = window.innerHeight;
    const elementTop = reveals[i].getBoundingClientRect().top;
    if (elementTop < windowHeight - 100) {
      reveals[i].classList.add("active");
    }
  }
}
window.addEventListener("scroll", revealOnScroll);

// --- TELA DE ACESSO (LOGIN / CADASTRO) ---
function switchTab(tabId) {
  document
    .querySelectorAll(".tab-btn")
    .forEach((btn) => btn.classList.remove("active"));
  document
    .querySelectorAll(".auth-form")
    .forEach((form) => form.classList.remove("active"));

  if (tabId === "login") {
    document.querySelectorAll(".tab-btn")[0].classList.add("active");
    document.getElementById("form-login").classList.add("active");
  } else {
    document.querySelectorAll(".tab-btn")[1].classList.add("active");
    document.getElementById("form-cadastro").classList.add("active");
  }
}

// --- CONTROLE DE MODAIS ---
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.style.display = "flex";
}
function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.style.display = "none";
}
window.onclick = function (event) {
  if (event.target.classList.contains("modal"))
    event.target.style.display = "none";
};

// --- BANCO DE DADOS LOCAL (LOCALSTORAGE) ---
const consultasIniciais = [
  {
    id: 1,
    medico: "Dra. Vanessa Costa",
    especialidade: "Neurologia",
    data: "2026-04-15",
    hora: "10:00",
    status: "Realizada",
    resumo:
      "Paciente apresenta reflexos normais. Queixa-se de enxaqueca esporádica. Receitada medicação analgésica e retorno em 6 meses.",
  },
  {
    id: 2,
    medico: "Dr. Fernando Silva",
    especialidade: "Cardiologia",
    data: "2026-06-10",
    hora: "14:30",
    status: "Confirmada",
    resumo: "",
  },
  {
    id: 3,
    medico: "Dr. Carlos Mendes",
    especialidade: "Ortopedia",
    data: "2026-02-02",
    hora: "09:00",
    status: "Realizada",
    resumo:
      "Avaliação de dor lombar. Fisioterapia recomendada (10 sessões). Postura de trabalho deve ser corrigida.",
  },
];

const perfilInicial = {
  nome: "Artur Silva",
  cpf: "123.456.789-00",
  nascimento: "1995-08-15",
  telefone: "(48) 99999-9999",
  email: "artur@telesaude.com.br",
  tipoSanguineo: "O+",
};

function initDB() {
  if (!localStorage.getItem("teleSaude_consultas")) {
    localStorage.setItem(
      "teleSaude_consultas",
      JSON.stringify(consultasIniciais),
    );
  }
  if (!localStorage.getItem("teleSaude_perfil")) {
    localStorage.setItem("teleSaude_perfil", JSON.stringify(perfilInicial));
  }
}

function getConsultas() {
  return JSON.parse(localStorage.getItem("teleSaude_consultas")) || [];
}
function saveConsultas(consultas) {
  localStorage.setItem("teleSaude_consultas", JSON.stringify(consultas));
}
function getPerfil() {
  return JSON.parse(localStorage.getItem("teleSaude_perfil")) || {};
}
function savePerfilDB(perfil) {
  localStorage.setItem("teleSaude_perfil", JSON.stringify(perfil));
}

function formatarData(dataISO) {
  const partes = dataISO.split("-");
  if (partes.length !== 3) return dataISO;
  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

// Atualiza o Avatar e Nome no Header baseado no Perfil
function atualizarAvatar() {
  const perfil = getPerfil();
  const iniciais = perfil.nome
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();
  const avatares = document.querySelectorAll(
    "#avatar-iniciais, #avatar-perfil",
  );
  avatares.forEach((av) => (av.innerText = iniciais));

  const headerNome = document.querySelector(".dash-header h2");
  if (headerNome && headerNome.innerText.includes("Olá")) {
    headerNome.innerText = `Olá, ${perfil.nome.split(" ")[0]}! 👋`;
  }
}

// --- RENDERS DAS PÁGINAS ---

// 1. Renderiza Dashboard Inicial (dashboard.html)
function renderDashboard() {
  const proximasContainer = document.getElementById(
    "proximas-consultas-container",
  );
  const historicoContainer = document.getElementById("historico-tbody");
  if (!proximasContainer || !historicoContainer) return;

  const consultas = getConsultas();
  const futuras = consultas.filter((c) => c.status === "Confirmada");
  const historico = consultas.filter((c) => c.status !== "Confirmada");

  const badge = document.getElementById("notif-badge");
  if (badge) badge.innerText = futuras.length;

  // Próximas Consultas
  proximasContainer.innerHTML = "";
  if (futuras.length === 0) {
    proximasContainer.innerHTML = `<p style="color: #888; padding: 20px;">Você não tem consultas agendadas.</p>`;
  } else {
    futuras.forEach((consulta) => {
      proximasContainer.innerHTML += `
        <div class="consultation-details">
          <div class="doc-info">
            <div class="doc-avatar"><i class="fa-solid fa-user-doctor"></i></div>
            <div><h4>${consulta.medico}</h4><p>${consulta.especialidade}</p></div>
          </div>
          <div class="time-info">
            <p><i class="fa-regular fa-calendar"></i> ${formatarData(consulta.data)}</p>
            <p><i class="fa-regular fa-clock"></i> ${consulta.hora}</p>
          </div>
          <div class="card-actions">
            <button class="btn-primary btn-sm hover-scale" onclick="entrarSala('${consulta.id}')"><i class="fa-solid fa-video"></i> Entrar</button>
            <button class="btn-secondary btn-sm hover-scale" onclick="cancelarConsulta(${consulta.id})" style="border-color: #ccc; color: #666;"><i class="fa-solid fa-xmark"></i> Cancelar</button>
          </div>
        </div>`;
    });
  }

  // Histórico (Apenas as 3 últimas na Home)
  historicoContainer.innerHTML = "";
  if (historico.length === 0) {
    historicoContainer.innerHTML = `<tr><td colspan="5" style="text-align:center;">Nenhum histórico encontrado.</td></tr>`;
  } else {
    historico
      .reverse()
      .slice(0, 3)
      .forEach((consulta) => {
        let statusStyle =
          consulta.status === "Cancelada"
            ? "color: var(--accent-red); font-weight: bold;"
            : "";
        let resumoTexto =
          consulta.status === "Cancelada"
            ? "Cancelada"
            : consulta.resumo || "Sem observações";
        historicoContainer.innerHTML += `
        <tr>
          <td>${formatarData(consulta.data)}</td>
          <td>${consulta.medico}</td>
          <td>${consulta.especialidade}</td>
          <td style="${statusStyle}">${resumoTexto}</td>
          <td><a href="prontuarios.html" class="link-action">Ver Completo</a></td>
        </tr>`;
      });
  }
}

// 2. Renderiza Página "Minhas Consultas" (consultas.html)
window.filtrarConsultas = function (filtro, btnElement) {
  const container = document.getElementById("pagina-consultas-container");
  if (!container) return;

  // Atualiza botões
  if (btnElement) {
    document
      .querySelectorAll(".card-header .tab-btn")
      .forEach((btn) => btn.classList.remove("active"));
    btnElement.classList.add("active");
  }

  const consultas = getConsultas();
  let filtradas = consultas;
  if (filtro !== "Todas") {
    filtradas = consultas.filter((c) => c.status === filtro);
  }

  container.innerHTML = "";
  if (filtradas.length === 0) {
    container.innerHTML = `<p style="color: #888; padding: 20px;">Nenhuma consulta encontrada.</p>`;
    return;
  }

  filtradas.reverse().forEach((c) => {
    let actionsHTML = "";
    if (c.status === "Confirmada") {
      actionsHTML = `
        <button class="btn-primary btn-sm hover-scale" onclick="entrarSala('${c.id}')"><i class="fa-solid fa-video"></i></button>
        <button class="btn-secondary btn-sm hover-scale" onclick="cancelarConsulta(${c.id}, true)" style="border-color: #ccc; color: #666;"><i class="fa-solid fa-xmark"></i></button>
      `;
    }

    container.innerHTML += `
      <div class="consulta-card">
        <div class="consulta-info">
          <h4>${c.medico} <span style="font-size: 14px; font-weight: normal; color: #666;">(${c.especialidade})</span></h4>
          <p><i class="fa-regular fa-calendar"></i> ${formatarData(c.data)} às ${c.hora}</p>
          <span class="consulta-status status-${c.status}">${c.status}</span>
        </div>
        <div class="card-actions">
          ${actionsHTML}
        </div>
      </div>
    `;
  });
};

// 3. Renderiza Página "Prontuários" (prontuarios.html)
function renderPaginaProntuarios() {
  const tbody = document.getElementById("pagina-prontuarios-tbody");
  if (!tbody) return;

  const consultas = getConsultas().filter((c) => c.status === "Realizada");
  tbody.innerHTML = "";

  if (consultas.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;">Nenhum prontuário finalizado.</td></tr>`;
    return;
  }

  consultas.reverse().forEach((c) => {
    tbody.innerHTML += `
      <tr>
        <td>${formatarData(c.data)}</td>
        <td>${c.medico}</td>
        <td>${c.especialidade}</td>
        <td><span class="status-badge status-Realizada">${c.status}</span></td>
        <td><button class="btn-secondary btn-sm hover-scale" onclick="abrirProntuario(${c.id})"><i class="fa-solid fa-eye"></i> Abrir Prontuário</button></td>
      </tr>
    `;
  });
}

// Abre o Modal do Prontuário e prepara a impressão
window.abrirProntuario = function (id) {
  const consulta = getConsultas().find((c) => c.id === id);
  if (!consulta) return;

  document.getElementById("pront-data-medico").innerText =
    `Atendimento realizado por ${consulta.medico} (${consulta.especialidade}) em ${formatarData(consulta.data)}.`;
  document.getElementById("pront-resumo").innerText =
    consulta.resumo || "Nenhum relato registrado para esta consulta.";

  // Atualiza o onClick do botão de imprimir para passar o ID atual
  const btnImprimir = document.getElementById("btn-imprimir-prontuario");
  btnImprimir.onclick = () => imprimirProntuario(consulta);

  openModal("modalProntuario");
};

// GERADOR DE IMPRESSÃO DE PRONTUÁRIO
window.imprimirProntuario = function (consulta) {
  const perfil = getPerfil();
  const dataHoje = new Date().toLocaleDateString("pt-BR");

  // Criamos uma nova janela em branco que será preenchida com um HTML limpo para impressão
  const printWindow = window.open("", "_blank", "width=800,height=600");

  const printHTML = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <title>Prontuário Médico - ${perfil.nome}</title>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; color: #333; line-height: 1.6; }
        .header { text-align: center; border-bottom: 2px solid #419543; padding-bottom: 20px; margin-bottom: 30px; }
        .header h1 { color: #419543; margin: 0; font-size: 28px; }
        .header p { margin: 5px 0 0; color: #666; font-size: 14px; }
        .info-box { border: 1px solid #ddd; padding: 15px; border-radius: 8px; margin-bottom: 30px; background: #f9f9f9; }
        .info-box p { margin: 5px 0; }
        .diagnostico { margin-bottom: 50px; }
        .assinatura { text-align: center; margin-top: 80px; }
        .assinatura div { width: 300px; border-top: 1px solid #333; margin: 0 auto; padding-top: 10px; }
        @media print { body { padding: 0; } }
      </style>
    </head>
    <body onload="window.print(); window.close();">
      <div class="header">
        <h1>Tele-Saúde Criciúma</h1>
        <p>Documento Clínico Oficial - Gerado Eletronicamente</p>
      </div>
      
      <div class="info-box">
        <h3>Dados do Paciente</h3>
        <p><strong>Nome:</strong> ${perfil.nome}</p>
        <p><strong>CPF:</strong> ${perfil.cpf} | <strong>Nascimento:</strong> ${formatarData(perfil.nascimento)}</p>
      </div>

      <div class="info-box">
        <h3>Dados do Atendimento</h3>
        <p><strong>Data da Consulta:</strong> ${formatarData(consulta.data)} às ${consulta.hora}</p>
        <p><strong>Profissional:</strong> ${consulta.medico} (${consulta.especialidade})</p>
      </div>

      <div class="diagnostico">
        <h3>Relato Clínico e Diagnóstico:</h3>
        <p>${consulta.resumo}</p>
      </div>

      <div class="assinatura">
        <div>
          <strong>${consulta.medico}</strong><br>
          ${consulta.especialidade}
        </div>
      </div>
      
      <p style="text-align:center; font-size: 12px; color: #888; margin-top: 40px;">
        Impresso em ${dataHoje} pelo Portal Tele-Saúde.
      </p>
    </body>
    </html>
  `;

  printWindow.document.write(printHTML);
  printWindow.document.close();
};

// 4. Renderiza e Salva Página "Meu Perfil" (perfil.html)
function loadPerfil() {
  const form = document.getElementById("form-perfil");
  if (!form) return;

  const perfil = getPerfil();
  document.getElementById("perfil-nome-display").innerText = perfil.nome;
  document.getElementById("perfil-nome").value = perfil.nome;
  document.getElementById("perfil-cpf").value = perfil.cpf;
  document.getElementById("perfil-email").value = perfil.email;
  document.getElementById("perfil-telefone").value = perfil.telefone;
  document.getElementById("perfil-nascimento").value = perfil.nascimento;
  document.getElementById("perfil-sangue").value = perfil.tipoSanguineo;
}

window.salvarPerfil = function (e) {
  e.preventDefault();
  const perfil = getPerfil();
  perfil.nome = document.getElementById("perfil-nome").value;
  perfil.email = document.getElementById("perfil-email").value;
  perfil.telefone = document.getElementById("perfil-telefone").value;
  perfil.nascimento = document.getElementById("perfil-nascimento").value;
  perfil.tipoSanguineo = document.getElementById("perfil-sangue").value;

  savePerfilDB(perfil);
  showToast("Perfil atualizado com sucesso!", "success");
  loadPerfil();
  atualizarAvatar();
};

// --- AÇÕES GLOBAIS DE CONSULTA ---
const formAgendamento = document.getElementById("form-novo-agendamento");
if (formAgendamento) {
  formAgendamento.addEventListener("submit", function (e) {
    e.preventDefault();
    const especialidade = document.getElementById(
      "agendamento-especialidade",
    ).value;
    const medico = document.getElementById("agendamento-medico").value;
    const data = document.getElementById("agendamento-data").value;
    const hora = document.getElementById("agendamento-hora").value;

    const novaConsulta = {
      id: Date.now(),
      medico: medico || "Profissional Padrão",
      especialidade: especialidade,
      data: data,
      hora: hora,
      status: "Confirmada",
      resumo: "",
    };

    const consultas = getConsultas();
    consultas.push(novaConsulta);
    saveConsultas(consultas);

    closeModal("modalAgendamento");
    formAgendamento.reset();
    showToast("Consulta agendada com sucesso!", "success");

    // Atualiza a tela que estiver aberta
    renderDashboard();
    if (document.getElementById("pagina-consultas-container"))
      filtrarConsultas(
        "Todas",
        document.querySelector(".card-header .tab-btn.active"),
      );
  });
}

window.cancelarConsulta = function (id, fromPaginaConsultas = false) {
  if (confirm("Tem certeza que deseja cancelar esta consulta?")) {
    let consultas = getConsultas();
    let consultaIndex = consultas.findIndex((c) => c.id === id);
    if (consultaIndex !== -1) {
      consultas[consultaIndex].status = "Cancelada";
      saveConsultas(consultas);
      showToast("Consulta cancelada com sucesso.", "error");

      if (fromPaginaConsultas) {
        filtrarConsultas(
          "Todas",
          document.querySelector(".card-header .tab-btn.active"),
        );
      } else {
        renderDashboard();
      }
    }
  }
};

window.entrarSala = function (id) {
  showToast("Iniciando conexão segura (Criptografia Fim-a-Fim)...", "info");
  setTimeout(() => {
    showToast("Conectado à sala virtual do médico.", "success");
  }, 2000);
};

// Avaliação de Estrelas
const stars = document.querySelectorAll(".star-rating i");
stars.forEach((star, index) => {
  star.addEventListener("click", () => {
    stars.forEach((s, i) => {
      if (i <= index) {
        s.classList.remove("fa-regular");
        s.classList.add("fa-solid");
      } else {
        s.classList.remove("fa-solid");
        s.classList.add("fa-regular");
      }
    });
  });
});

// INITIALIZE APP
document.addEventListener("DOMContentLoaded", () => {
  initDB();
  atualizarAvatar();

  // Chama as funções de renderização dependendo da página ativa
  renderDashboard();
  filtrarConsultas("Todas"); // Se estiver na página de consultas
  renderPaginaProntuarios(); // Se estiver na página de prontuários
  loadPerfil(); // Se estiver na página de perfil

  // Revela itens animados logo no carregamento
  revealOnScroll();
});
