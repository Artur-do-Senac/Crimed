/* ============================================================================
   CRIMED · data.js
   Base de dados simulada (localStorage). Todas as datas são geradas a partir
   da data atual para que a demonstração nunca fique "vencida".
   ========================================================================= */
(function (global) {
  "use strict";

  var SEED_VERSION = "crimed.v3";
  var K = {
    consultas: SEED_VERSION + ".consultas",
    perfil: SEED_VERSION + ".perfil",
    exames: SEED_VERSION + ".exames",
    receitas: SEED_VERSION + ".receitas",
    notificacoes: SEED_VERSION + ".notificacoes",
    avaliacoes: SEED_VERSION + ".avaliacoes",
    fila: SEED_VERSION + ".fila",
    sessao: SEED_VERSION + ".sessao",
    prefs: SEED_VERSION + ".prefs",
    lgpd: SEED_VERSION + ".lgpd",
  };

  /* ------------------------------------------------------------ utilitários */
  function pad(n) {
    return n < 10 ? "0" + n : "" + n;
  }
  function iso(date) {
    return (
      date.getFullYear() + "-" + pad(date.getMonth() + 1) + "-" + pad(date.getDate())
    );
  }
  /** Data ISO deslocada em N dias a partir de hoje. */
  function dayOffset(n) {
    var d = new Date();
    d.setHours(12, 0, 0, 0);
    d.setDate(d.getDate() + n);
    return iso(d);
  }
  function hoje() {
    return dayOffset(0);
  }

  /* ------------------------------------------------------- UNIDADES (UBS) */
  var UNIDADES = [
    { id: "ubs-centro", nome: "UBS Centro", bairro: "Centro", equipes: 6, teleconsultas: 412, lat: 42, lng: 48 },
    { id: "ubs-prospera", nome: "UBS Próspera", bairro: "Próspera", equipes: 5, teleconsultas: 368, lat: 62, lng: 34 },
    { id: "ubs-riomaina", nome: "UBS Rio Maina", bairro: "Rio Maina", equipes: 4, teleconsultas: 295, lat: 20, lng: 58 },
    { id: "ubs-santaluzia", nome: "UBS Santa Luzia", bairro: "Santa Luzia", equipes: 3, teleconsultas: 241, lat: 55, lng: 70 },
    { id: "ubs-pinheirinho", nome: "UBS Pinheirinho", bairro: "Pinheirinho", equipes: 3, teleconsultas: 198, lat: 33, lng: 25 },
    { id: "ubs-metropol", nome: "UBS Metropol", bairro: "Metropol", equipes: 3, teleconsultas: 176, lat: 72, lng: 55 },
    { id: "ubs-quartalinha", nome: "UBS Quarta Linha", bairro: "Quarta Linha", equipes: 2, teleconsultas: 143, lat: 80, lng: 22 },
    { id: "ubs-boavista", nome: "UBS Boa Vista", bairro: "Boa Vista", equipes: 2, teleconsultas: 121, lat: 15, lng: 30 },
    { id: "ubs-minadomato", nome: "UBS Mina do Mato", bairro: "Mina do Mato", equipes: 2, teleconsultas: 96, lat: 28, lng: 80 },
    { id: "ubs-saoluiz", nome: "UBS São Luiz", bairro: "São Luiz", equipes: 2, teleconsultas: 88, lat: 66, lng: 78 },
  ];

  /* ---------------------------------------------------------- PROFISSIONAIS */
  var MEDICOS = [
    {
      id: "med-1",
      nome: "Dra. Vanessa Costa",
      especialidade: "Neurologia",
      crm: "CRM/SC 18.442",
      unidade: "ubs-centro",
      nota: 4.9,
      atendimentos: 1284,
      horarios: ["08:00", "08:40", "09:20", "10:00", "10:40", "13:30", "14:10", "14:50"],
      bio: "Neurologista com foco em cefaleias e acompanhamento de epilepsia na rede pública.",
    },
    {
      id: "med-2",
      nome: "Dr. Fernando Silva",
      especialidade: "Cardiologia",
      crm: "CRM/SC 12.907",
      unidade: "ubs-prospera",
      nota: 4.8,
      atendimentos: 1657,
      horarios: ["08:20", "09:00", "09:40", "13:00", "13:40", "14:30", "15:10", "15:50"],
      bio: "Cardiologista, coordenador do programa de hipertensão da rede municipal.",
    },
    {
      id: "med-3",
      nome: "Dr. Carlos Mendes",
      especialidade: "Ortopedia",
      crm: "CRM/SC 20.113",
      unidade: "ubs-riomaina",
      nota: 4.7,
      atendimentos: 943,
      horarios: ["07:40", "08:20", "09:00", "10:20", "11:00", "14:00", "14:40"],
      bio: "Ortopedista. Atua em triagem de lesões musculoesqueléticas e pós-operatório.",
    },
    {
      id: "med-4",
      nome: "Dra. Helena Búrigo",
      especialidade: "Clínica Médica",
      crm: "CRM/SC 15.320",
      unidade: "ubs-centro",
      nota: 5.0,
      atendimentos: 2210,
      horarios: ["08:00", "08:30", "09:00", "09:30", "10:00", "13:30", "14:00", "14:30", "15:00"],
      bio: "Clínica geral, referência em atenção primária e doenças crônicas.",
    },
    {
      id: "med-5",
      nome: "Dra. Marina Zanette",
      especialidade: "Psicologia",
      crm: "CRP 12/09887",
      unidade: "ubs-santaluzia",
      nota: 4.9,
      atendimentos: 812,
      horarios: ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00"],
      bio: "Psicóloga clínica, atendimento em saúde mental e apoio psicossocial.",
    },
    {
      id: "med-6",
      nome: "Dr. Rafael Bianchini",
      especialidade: "Pediatria",
      crm: "CRM/SC 22.508",
      unidade: "ubs-pinheirinho",
      nota: 4.8,
      atendimentos: 1390,
      horarios: ["08:00", "08:40", "09:20", "10:00", "13:30", "14:10", "14:50", "15:30"],
      bio: "Pediatra, puericultura e acompanhamento do crescimento infantil.",
    },
    {
      id: "med-7",
      nome: "Dra. Juliana Pasqualli",
      especialidade: "Dermatologia",
      crm: "CRM/SC 19.774",
      unidade: "ubs-metropol",
      nota: 4.6,
      atendimentos: 704,
      horarios: ["08:30", "09:10", "09:50", "14:00", "14:40", "15:20"],
      bio: "Dermatologista. Teledermatologia e rastreio de lesões de pele.",
    },
    {
      id: "med-8",
      nome: "Enf. Patrícia Nandi",
      especialidade: "Enfermagem / Triagem",
      crm: "COREN/SC 411.203",
      unidade: "ubs-centro",
      nota: 4.9,
      atendimentos: 3105,
      horarios: ["07:30", "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00"],
      bio: "Enfermeira responsável pela triagem digital e classificação de risco.",
    },
  ];

  var ESPECIALIDADES = [
    "Clínica Médica",
    "Cardiologia",
    "Neurologia",
    "Ortopedia",
    "Pediatria",
    "Dermatologia",
    "Psicologia",
    "Enfermagem / Triagem",
  ];

  /* ------------------------------------------------------------- USUÁRIOS */
  var USUARIOS = {
    paciente: {
      id: "u-pac-1",
      nome: "Artur Seixas Pedro",
      papel: "paciente",
      papelLabel: "Paciente",
      cpf: "072.418.339-55",
      cns: "708 4051 8829 0014",
      nascimento: "2004-03-12",
      telefone: "(48) 99812-4470",
      email: "artur@telesaude.criciuma.sc.gov.br",
      endereco: "Rua Coronel Pedro Benedet, 190 — Centro, Criciúma/SC",
      unidade: "ubs-centro",
      tipoSanguineo: "O+",
      alergias: "Dipirona",
      condicoes: "Rinite alérgica",
      home: "dashboard.html",
    },
    medico: {
      id: "med-4",
      nome: "Dra. Helena Búrigo",
      papel: "medico",
      papelLabel: "Profissional de Saúde",
      cpf: "—",
      crm: "CRM/SC 15.320",
      especialidade: "Clínica Médica",
      unidade: "ubs-centro",
      email: "helena.burigo@criciuma.sc.gov.br",
      home: "medico.html",
    },
    admin: {
      id: "u-adm-1",
      nome: "Gestão Municipal de Saúde",
      papel: "admin",
      papelLabel: "Administrador",
      cargo: "Secretaria Municipal de Saúde",
      unidade: "ubs-centro",
      email: "gestao.saude@criciuma.sc.gov.br",
      home: "admin.html",
    },
  };

  /* ------------------------------------------------------------- CONSULTAS */
  function seedConsultas() {
    return [
      {
        id: 1001,
        medicoId: "med-2",
        medico: "Dr. Fernando Silva",
        especialidade: "Cardiologia",
        unidade: "ubs-prospera",
        data: dayOffset(0),
        hora: proximaHoraCheia(),
        status: "Confirmada",
        motivo: "Retorno — controle de pressão arterial",
        resumo: "",
        conduta: "",
        anamnese: "",
        paciente: "Artur Seixas Pedro",
      },
      {
        id: 1002,
        medicoId: "med-5",
        medico: "Dra. Marina Zanette",
        especialidade: "Psicologia",
        unidade: "ubs-santaluzia",
        data: dayOffset(6),
        hora: "15:00",
        status: "Confirmada",
        motivo: "Acompanhamento — ansiedade",
        resumo: "",
        conduta: "",
        anamnese: "",
        paciente: "Artur Seixas Pedro",
      },
      {
        id: 1003,
        medicoId: "med-1",
        medico: "Dra. Vanessa Costa",
        especialidade: "Neurologia",
        unidade: "ubs-centro",
        data: dayOffset(-18),
        hora: "10:00",
        status: "Realizada",
        motivo: "Cefaleia recorrente",
        anamnese:
          "Paciente relata episódios de cefaleia pulsátil há cerca de 3 meses, com frequência de 2 a 3 vezes por semana, predominantemente no período vespertino. Nega aura visual. Refere piora com privação de sono e telas.",
        resumo:
          "Exame neurológico sem alterações. Reflexos preservados e simétricos. Hipótese diagnóstica: enxaqueca sem aura (CID-10 G43.0).",
        conduta:
          "Higiene do sono, redução do tempo de tela à noite e diário de cefaleia. Analgésico em crise. Retorno em 6 meses ou antes se piora.",
        nota: 5,
        paciente: "Artur Seixas Pedro",
      },
      {
        id: 1004,
        medicoId: "med-3",
        medico: "Dr. Carlos Mendes",
        especialidade: "Ortopedia",
        unidade: "ubs-riomaina",
        data: dayOffset(-46),
        hora: "09:00",
        status: "Realizada",
        motivo: "Dor lombar",
        anamnese:
          "Lombalgia mecânica há 4 semanas, sem irradiação para membros inferiores. Trabalha sentado por longos períodos.",
        resumo:
          "Lombalgia mecânica inespecífica (CID-10 M54.5). Sem sinais de alerta. Mobilidade preservada.",
        conduta:
          "Encaminhamento para fisioterapia (10 sessões), orientação postural e alongamentos diários. Anti-inflamatório por 5 dias.",
        nota: 4,
        paciente: "Artur Seixas Pedro",
      },
      {
        id: 1005,
        medicoId: "med-4",
        medico: "Dra. Helena Búrigo",
        especialidade: "Clínica Médica",
        unidade: "ubs-centro",
        data: dayOffset(-92),
        hora: "08:30",
        status: "Realizada",
        motivo: "Consulta de rotina",
        anamnese:
          "Consulta de rotina anual. Assintomático. Nega tabagismo e etilismo. Pratica atividade física 2x/semana.",
        resumo:
          "Paciente hígido. Exame físico sem alterações. PA 120/80 mmHg. IMC dentro da faixa adequada.",
        conduta:
          "Solicitado hemograma completo e glicemia de jejum. Manter atividade física e alimentação equilibrada.",
        nota: 5,
        paciente: "Artur Seixas Pedro",
      },
      {
        id: 1006,
        medicoId: "med-7",
        medico: "Dra. Juliana Pasqualli",
        especialidade: "Dermatologia",
        unidade: "ubs-metropol",
        data: dayOffset(-30),
        hora: "14:40",
        status: "Cancelada",
        motivo: "Avaliação de lesão de pele",
        resumo: "",
        conduta: "",
        anamnese: "",
        paciente: "Artur Seixas Pedro",
      },
    ];
  }

  /**
   * Próxima marca de 15 minutos a partir de agora — assim a consulta "de hoje"
   * está sempre a poucos minutos de distância e a sala aparece aberta durante
   * a demonstração, a qualquer hora do dia.
   */
  function proximaHoraCheia() {
    var d = new Date();
    d.setMinutes(d.getMinutes() + 3, 0, 0);
    d.setMinutes(Math.ceil(d.getMinutes() / 15) * 15);
    return pad(d.getHours()) + ":" + pad(d.getMinutes());
  }

  /* ---------------------------------------------------------------- EXAMES */
  function seedExames() {
    return [
      {
        id: "ex-1",
        nome: "Hemograma completo",
        tipo: "Laboratorial",
        data: dayOffset(-88),
        unidade: "Laboratório Municipal — Centro",
        solicitante: "Dra. Helena Búrigo",
        status: "Disponível",
        resultado: "Série vermelha, branca e plaquetas dentro dos valores de referência.",
        itens: [
          { k: "Hemoglobina", v: "15,1 g/dL", ref: "13,5 – 17,5", ok: true },
          { k: "Hematócrito", v: "44,8 %", ref: "41 – 53", ok: true },
          { k: "Leucócitos", v: "7.200 /mm³", ref: "4.000 – 11.000", ok: true },
          { k: "Plaquetas", v: "268.000 /mm³", ref: "150.000 – 450.000", ok: true },
        ],
      },
      {
        id: "ex-2",
        nome: "Glicemia de jejum",
        tipo: "Laboratorial",
        data: dayOffset(-88),
        unidade: "Laboratório Municipal — Centro",
        solicitante: "Dra. Helena Búrigo",
        status: "Disponível",
        resultado: "Glicemia levemente acima do ideal. Recomendado reavaliar em 6 meses.",
        itens: [
          { k: "Glicose", v: "104 mg/dL", ref: "70 – 99", ok: false },
          { k: "Hemoglobina glicada", v: "5,4 %", ref: "< 5,7", ok: true },
        ],
      },
      {
        id: "ex-3",
        nome: "Eletrocardiograma (ECG)",
        tipo: "Imagem / Gráfico",
        data: dayOffset(-12),
        unidade: "UBS Próspera",
        solicitante: "Dr. Fernando Silva",
        status: "Disponível",
        resultado: "Ritmo sinusal regular, FC 72 bpm. Sem alterações isquêmicas agudas.",
        itens: [
          { k: "Frequência cardíaca", v: "72 bpm", ref: "60 – 100", ok: true },
          { k: "Intervalo PR", v: "148 ms", ref: "120 – 200", ok: true },
          { k: "Ritmo", v: "Sinusal", ref: "Sinusal", ok: true },
        ],
      },
      {
        id: "ex-4",
        nome: "Raio-X de coluna lombar",
        tipo: "Imagem",
        data: dayOffset(-40),
        unidade: "Policlínica Municipal",
        solicitante: "Dr. Carlos Mendes",
        status: "Disponível",
        resultado: "Retificação da lordose lombar. Espaços discais preservados.",
        itens: [{ k: "Laudo", v: "Retificação da lordose", ref: "—", ok: false }],
      },
      {
        id: "ex-5",
        nome: "Perfil lipídico",
        tipo: "Laboratorial",
        data: dayOffset(2),
        unidade: "Laboratório Municipal — Centro",
        solicitante: "Dr. Fernando Silva",
        status: "Aguardando",
        resultado: "",
        itens: [],
      },
    ];
  }

  /* -------------------------------------------------------------- RECEITAS */
  function seedReceitas() {
    return [
      {
        id: "rec-1",
        codigo: "CRM-2026-8F4A-2291",
        medico: "Dra. Vanessa Costa",
        crm: "CRM/SC 18.442",
        especialidade: "Neurologia",
        data: dayOffset(-18),
        validade: dayOffset(12),
        tipo: "Receituário simples",
        medicamentos: [
          {
            nome: "Dipirona sódica 500 mg",
            posologia: "1 comprimido de 6/6h em caso de dor",
            duracao: "Uso em crise",
            qtd: "20 comprimidos",
          },
          {
            nome: "Complexo B",
            posologia: "1 comprimido ao dia, após o café",
            duracao: "60 dias",
            qtd: "60 comprimidos",
          },
        ],
        observacao:
          "Suspender dipirona em caso de reação alérgica e procurar atendimento.",
      },
      {
        id: "rec-2",
        codigo: "CRM-2026-1C7E-5540",
        medico: "Dr. Carlos Mendes",
        crm: "CRM/SC 20.113",
        especialidade: "Ortopedia",
        data: dayOffset(-46),
        validade: dayOffset(-16),
        tipo: "Receituário simples",
        medicamentos: [
          {
            nome: "Ibuprofeno 600 mg",
            posologia: "1 comprimido de 8/8h após as refeições",
            duracao: "5 dias",
            qtd: "15 comprimidos",
          },
        ],
        observacao: "Tomar sempre após alimentação.",
      },
    ];
  }

  /* ---------------------------------------------------------- NOTIFICAÇÕES */
  function seedNotificacoes() {
    return [
      {
        id: "n-1",
        tipo: "consulta",
        titulo: "Teleconsulta hoje",
        texto:
          "Sua consulta de Cardiologia com Dr. Fernando Silva acontece hoje. A sala virtual abre 15 minutos antes.",
        quando: "Agora há pouco",
        lida: false,
        link: "consultas.html",
      },
      {
        id: "n-2",
        tipo: "exame",
        titulo: "Resultado de exame disponível",
        texto: "O laudo do seu Eletrocardiograma (ECG) já pode ser consultado.",
        quando: "Há 2 dias",
        lida: false,
        link: "prontuarios.html#exames",
      },
      {
        id: "n-3",
        tipo: "receita",
        titulo: "Receita digital emitida",
        texto:
          "Dra. Vanessa Costa emitiu uma receita digital. Válida em todas as farmácias credenciadas.",
        quando: "Há 5 dias",
        lida: false,
        link: "prontuarios.html#receitas",
      },
      {
        id: "n-4",
        tipo: "campanha",
        titulo: "Campanha de vacinação — Criciúma",
        texto:
          "A vacinação contra Influenza está disponível em todas as UBS do município até o fim do mês.",
        quando: "Há 1 semana",
        lida: true,
        link: "#",
      },
    ];
  }

  /* ---------------------------------- FILA DE ESPERA (painel do profissional) */
  function seedFila() {
    return [
      {
        id: "f-1",
        paciente: "Artur Seixas Pedro",
        idade: 22,
        unidade: "ubs-centro",
        motivo: "Retorno — controle de pressão arterial",
        risco: "Verde",
        espera: 4,
        hora: proximaHoraCheia(),
        consultaId: 1001,
      },
      {
        id: "f-2",
        paciente: "Maria Aparecida Búrigo",
        idade: 68,
        unidade: "ubs-prospera",
        motivo: "Tontura e pressão alta há 2 dias",
        risco: "Amarelo",
        espera: 11,
        hora: "—",
        consultaId: null,
      },
      {
        id: "f-3",
        paciente: "João Pedro Damiani",
        idade: 7,
        unidade: "ubs-pinheirinho",
        motivo: "Febre há 24h, acompanhado da mãe",
        risco: "Amarelo",
        espera: 8,
        hora: "—",
        consultaId: null,
      },
      {
        id: "f-4",
        paciente: "Sebastião Crispim",
        idade: 74,
        unidade: "ubs-riomaina",
        motivo: "Renovação de receita de anti-hipertensivo",
        risco: "Verde",
        espera: 19,
        hora: "—",
        consultaId: null,
      },
      {
        id: "f-5",
        paciente: "Luana Colombo",
        idade: 31,
        unidade: "ubs-santaluzia",
        motivo: "Resultado de exame laboratorial",
        risco: "Azul",
        espera: 26,
        hora: "—",
        consultaId: null,
      },
    ];
  }

  /* ------------------------------------------------- MÉTRICAS (painel admin) */
  var MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

  function ultimosMeses(n) {
    var out = [];
    var m = new Date().getMonth();
    for (var i = n - 1; i >= 0; i--) {
      out.push(MESES[(m - i + 12) % 12]);
    }
    return out;
  }

  var METRICAS = {
    labels: ultimosMeses(9),
    teleconsultas: [186, 241, 298, 355, 402, 478, 521, 596, 664],
    presenciais: [742, 718, 690, 651, 622, 583, 548, 511, 474],
    canceladas: [24, 21, 26, 19, 17, 15, 14, 12, 11],
    esperaDias: [21, 19, 17, 15, 13, 11, 10, 8, 7],
    satisfacao: [78, 80, 83, 84, 86, 88, 89, 91, 93],
    especialidades: [
      { nome: "Clínica Médica", valor: 1284 },
      { nome: "Cardiologia", valor: 742 },
      { nome: "Pediatria", valor: 611 },
      { nome: "Psicologia", valor: 508 },
      { nome: "Dermatologia", valor: 366 },
      { nome: "Ortopedia", valor: 289 },
      { nome: "Neurologia", valor: 241 },
    ],
    avaliacoes: { cinco: 1428, quatro: 392, tres: 96, dois: 31, um: 18 },
    kpis: {
      teleconsultas: 3741,
      esperaDias: 7,
      satisfacao: 93,
      economiaKm: 48250,
      faltas: 6.4,
      unidadesAtivas: 10,
      profissionais: 68,
      pacientes: 12480,
    },
  };

  /* ------------------------------------------- TRIAGEM DA ASSISTENTE "CRIS" */
  var TRIAGEM = {
    inicio: {
      texto:
        "Olá! Eu sou a <strong>Cris</strong>, assistente virtual da Tele-Saúde Criciúma. Vou te ajudar a encontrar o atendimento certo. Como você está se sentindo hoje?",
      opcoes: [
        { label: "Estou com dor", proximo: "dor" },
        { label: "Febre ou sintomas de gripe", proximo: "febre" },
        { label: "Quero renovar uma receita", proximo: "receita" },
        { label: "Preciso de apoio emocional", proximo: "emocional" },
        { label: "Quero resultado de exame", proximo: "exame" },
      ],
    },
    dor: {
      texto: "Entendi. Em que região está a dor?",
      opcoes: [
        { label: "Cabeça", proximo: "dor_cabeca" },
        { label: "Peito", proximo: "dor_peito" },
        { label: "Coluna / costas", proximo: "dor_coluna" },
        { label: "Outra região", proximo: "generico" },
      ],
    },
    dor_peito: {
      texto:
        "<strong>Atenção:</strong> dor no peito pode indicar urgência. Se houver falta de ar, suor frio, dor no braço ou desmaio, ligue <strong>192 (SAMU)</strong> agora ou vá à emergência mais próxima.",
      risco: "vermelho",
      opcoes: [
        { label: "Entendi, vou procurar emergência", proximo: "fim_urgencia" },
        { label: "Os sintomas são leves", proximo: "dor_peito_leve" },
      ],
    },
    dor_peito_leve: {
      texto:
        "Mesmo assim vale uma avaliação. Vou sugerir uma <strong>teleconsulta com Cardiologia</strong> com prioridade.",
      risco: "amarelo",
      acao: { especialidade: "Cardiologia", label: "Agendar Cardiologia" },
      opcoes: [{ label: "Começar de novo", proximo: "inicio" }],
    },
    dor_cabeca: {
      texto:
        "Dores de cabeça recorrentes merecem avaliação. A <strong>Clínica Médica</strong> faz a primeira avaliação e encaminha para Neurologia se necessário.",
      risco: "verde",
      acao: { especialidade: "Clínica Médica", label: "Agendar Clínica Médica" },
      opcoes: [{ label: "Começar de novo", proximo: "inicio" }],
    },
    dor_coluna: {
      texto:
        "Dor na coluna geralmente é avaliada pela <strong>Ortopedia</strong>. Enquanto aguarda: evite peso, mantenha-se ativo e cuide da postura.",
      risco: "verde",
      acao: { especialidade: "Ortopedia", label: "Agendar Ortopedia" },
      opcoes: [{ label: "Começar de novo", proximo: "inicio" }],
    },
    febre: {
      texto: "Há quanto tempo você está com febre?",
      opcoes: [
        { label: "Menos de 3 dias", proximo: "febre_curta" },
        { label: "Mais de 3 dias", proximo: "febre_longa" },
      ],
    },
    febre_curta: {
      texto:
        "Mantenha hidratação e repouso. Se surgir <strong>falta de ar, confusão mental ou febre acima de 39 °C</strong>, procure atendimento imediato. A triagem com Enfermagem pode te orientar hoje mesmo.",
      risco: "verde",
      acao: { especialidade: "Enfermagem / Triagem", label: "Agendar triagem" },
      opcoes: [{ label: "Começar de novo", proximo: "inicio" }],
    },
    febre_longa: {
      texto:
        "Febre por mais de 3 dias precisa de avaliação médica. Vou priorizar uma <strong>teleconsulta de Clínica Médica</strong>.",
      risco: "amarelo",
      acao: { especialidade: "Clínica Médica", label: "Agendar Clínica Médica" },
      opcoes: [{ label: "Começar de novo", proximo: "inicio" }],
    },
    receita: {
      texto:
        "Você pode solicitar a renovação direto pelo portal. Receitas de uso contínuo são renovadas pelo profissional que acompanha seu caso, sem precisar ir à UBS.",
      risco: "verde",
      link: { href: "prontuarios.html#receitas", label: "Ver minhas receitas" },
      opcoes: [{ label: "Começar de novo", proximo: "inicio" }],
    },
    emocional: {
      texto:
        "Que bom que você procurou ajuda — isso já é um passo importante. A rede municipal oferece <strong>atendimento psicológico por teleconsulta</strong>. Se você estiver em sofrimento intenso agora, ligue <strong>188 (CVV)</strong>, disponível 24h e gratuito.",
      risco: "amarelo",
      acao: { especialidade: "Psicologia", label: "Agendar Psicologia" },
      opcoes: [{ label: "Começar de novo", proximo: "inicio" }],
    },
    exame: {
      texto:
        "Seus resultados de exame ficam no prontuário eletrônico, junto com o histórico das consultas.",
      risco: "verde",
      link: { href: "prontuarios.html#exames", label: "Ver meus exames" },
      opcoes: [{ label: "Começar de novo", proximo: "inicio" }],
    },
    generico: {
      texto:
        "Para sintomas gerais, a <strong>Clínica Médica</strong> é a porta de entrada. O profissional avalia e encaminha para a especialidade certa.",
      risco: "verde",
      acao: { especialidade: "Clínica Médica", label: "Agendar Clínica Médica" },
      opcoes: [{ label: "Começar de novo", proximo: "inicio" }],
    },
    fim_urgencia: {
      texto:
        "Certo. <strong>SAMU: 192</strong> · <strong>Bombeiros: 193</strong>. A UPA Bom Jesus e a Emergência do Hospital São José atendem 24 horas em Criciúma. Cuide-se.",
      risco: "vermelho",
      opcoes: [{ label: "Começar de novo", proximo: "inicio" }],
    },
  };

  /* ------------------------------------------------------- CAMADA DE ACESSO */
  function read(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }
  function write(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      return false;
    }
  }

  var DB = {
    keys: K,
    unidades: UNIDADES,
    medicos: MEDICOS,
    especialidades: ESPECIALIDADES,
    usuarios: USUARIOS,
    metricas: METRICAS,
    triagem: TRIAGEM,

    dayOffset: dayOffset,
    hoje: hoje,
    iso: iso,

    init: function () {
      if (!localStorage.getItem(K.consultas)) write(K.consultas, seedConsultas());
      if (!localStorage.getItem(K.perfil)) write(K.perfil, USUARIOS.paciente);
      if (!localStorage.getItem(K.exames)) write(K.exames, seedExames());
      if (!localStorage.getItem(K.receitas)) write(K.receitas, seedReceitas());
      if (!localStorage.getItem(K.notificacoes))
        write(K.notificacoes, seedNotificacoes());
      if (!localStorage.getItem(K.fila)) write(K.fila, seedFila());
      if (!localStorage.getItem(K.avaliacoes)) write(K.avaliacoes, []);
      DB.rejuvenescer();
      return DB;
    },

    /**
     * Mantém a demonstração sempre "no presente".
     * Consultas confirmadas que ficaram para trás são trazidas para hoje/amanhã,
     * e a receita de exemplo continua dentro da validade. Sem isso, um protótipo
     * semeado ontem mostraria a consulta de hoje como atrasada.
     */
    rejuvenescer: function () {
      var hj = hoje();
      var mudou = false;

      var consultas = read(K.consultas, []);
      var atrasadas = consultas.filter(function (c) {
        return c.status === "Confirmada" && c.data < hj;
      });
      atrasadas.forEach(function (c, i) {
        c.data = i === 0 ? hj : dayOffset(i * 3);
        if (i === 0) c.hora = proximaHoraCheia();
        mudou = true;
      });
      if (mudou) write(K.consultas, consultas);

      /* a receita vigente acompanha a data atual */
      var receitas = read(K.receitas, []);
      var vigente = receitas[0];
      if (vigente && vigente.validade < hj) {
        vigente.validade = dayOffset(12);
        write(K.receitas, receitas);
      }

      /* o exame ainda não liberado permanece no futuro próximo */
      var exames = read(K.exames, []);
      var pendente = exames.filter(function (e) { return e.status === "Aguardando"; })[0];
      if (pendente && pendente.data < hj) {
        pendente.data = dayOffset(2);
        write(K.exames, exames);
      }

      /* a fila de espera espelha o horário da consulta de hoje */
      var fila = read(K.fila, []);
      var primeira = consultas.filter(function (c) {
        return c.status === "Confirmada" && c.data === hj;
      })[0];
      if (fila[0] && primeira) {
        fila[0].hora = primeira.hora;
        fila[0].consultaId = primeira.id;
        write(K.fila, fila);
      }
    },

    /** Restaura todos os dados de demonstração ao estado original. */
    reset: function () {
      Object.keys(K).forEach(function (k) {
        if (k !== "prefs") localStorage.removeItem(K[k]);
      });
      DB.init();
    },

    consultas: function () {
      return read(K.consultas, []);
    },
    salvarConsultas: function (lista) {
      write(K.consultas, lista);
    },
    consulta: function (id) {
      return DB.consultas().filter(function (c) {
        return String(c.id) === String(id);
      })[0];
    },
    atualizarConsulta: function (id, patch) {
      var lista = DB.consultas();
      for (var i = 0; i < lista.length; i++) {
        if (String(lista[i].id) === String(id)) {
          for (var k in patch) lista[i][k] = patch[k];
          break;
        }
      }
      DB.salvarConsultas(lista);
      return lista;
    },

    perfil: function () {
      return read(K.perfil, USUARIOS.paciente);
    },
    salvarPerfil: function (p) {
      write(K.perfil, p);
    },

    exames: function () {
      return read(K.exames, []);
    },
    salvarExames: function (l) {
      write(K.exames, l);
    },

    receitas: function () {
      return read(K.receitas, []);
    },
    salvarReceitas: function (l) {
      write(K.receitas, l);
    },

    notificacoes: function () {
      return read(K.notificacoes, []);
    },
    salvarNotificacoes: function (l) {
      write(K.notificacoes, l);
    },
    naoLidas: function () {
      return DB.notificacoes().filter(function (n) {
        return !n.lida;
      }).length;
    },
    notificar: function (n) {
      var lista = DB.notificacoes();
      lista.unshift({
        id: "n-" + Date.now(),
        tipo: n.tipo || "consulta",
        titulo: n.titulo,
        texto: n.texto,
        quando: "Agora",
        lida: false,
        link: n.link || "#",
      });
      DB.salvarNotificacoes(lista);
    },

    fila: function () {
      return read(K.fila, []);
    },
    salvarFila: function (l) {
      write(K.fila, l);
    },

    avaliacoes: function () {
      return read(K.avaliacoes, []);
    },
    salvarAvaliacao: function (a) {
      var l = DB.avaliacoes();
      l.push(a);
      write(K.avaliacoes, l);
    },

    sessao: function () {
      return read(K.sessao, null);
    },
    entrar: function (papel) {
      var u = USUARIOS[papel] || USUARIOS.paciente;
      if (papel === "paciente") u = DB.perfil();
      write(K.sessao, u);
      return u;
    },
    sair: function () {
      localStorage.removeItem(K.sessao);
    },

    prefs: function () {
      return read(K.prefs, {});
    },
    salvarPrefs: function (p) {
      write(K.prefs, p);
    },

    lgpdAceito: function () {
      return read(K.lgpd, false);
    },
    aceitarLgpd: function () {
      write(K.lgpd, { aceito: true, quando: new Date().toISOString() });
    },

    medico: function (id) {
      return MEDICOS.filter(function (m) {
        return m.id === id;
      })[0];
    },
    unidade: function (id) {
      return UNIDADES.filter(function (u) {
        return u.id === id;
      })[0];
    },
    medicosPorEspecialidade: function (esp) {
      return MEDICOS.filter(function (m) {
        return m.especialidade === esp;
      });
    },
  };

  global.DB = DB;
})(window);
