/* ============================================================================
   CRIMED · data.js
   Base de dados simulada (localStorage). Todas as datas são geradas a partir
   da data atual para que a demonstração nunca fique "vencida".
   ========================================================================= */
(function (global) {
  "use strict";

  var SEED_VERSION = "crimed.v4";
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
    usuarios: SEED_VERSION + ".usuarios",
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
      id: "med-9",
      nome: "Dr. Paulo Rovaris",
      especialidade: "Clínica Médica",
      crm: "CRM/SC 17.865",
      unidade: "ubs-prospera",
      nota: 4.8,
      atendimentos: 1876,
      horarios: ["07:30", "08:10", "08:50", "09:30", "10:10", "13:00", "13:40", "14:20", "15:00", "15:40"],
      bio: "Clínico geral, médico de família e comunidade na UBS Próspera.",
    },
    {
      id: "med-10",
      nome: "Dra. Camila Tasca",
      especialidade: "Clínica Médica",
      crm: "CRM/SC 21.402",
      unidade: "ubs-riomaina",
      nota: 4.9,
      atendimentos: 1102,
      horarios: ["08:15", "09:00", "09:45", "10:30", "13:15", "14:00", "14:45", "15:30", "16:15"],
      bio: "Clínica geral com foco em saúde da mulher e acompanhamento de crônicos.",
    },
    {
      id: "med-11",
      nome: "Dr. Lucas Bortolotto",
      especialidade: "Clínica Médica",
      crm: "CRM/SC 23.019",
      unidade: "ubs-santaluzia",
      nota: 4.7,
      atendimentos: 864,
      horarios: ["08:00", "08:45", "09:30", "10:15", "11:00", "13:30", "14:15", "15:00", "16:30"],
      bio: "Clínico geral, atenção primária e saúde do idoso.",
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
  /*
   * Contas de demonstração. As senhas são guardadas apenas como hash (ver
   * hashSenha). Todas usam a senha "demo1234".
   *   · Paciente  → CPF 072.418.339-61
   *   · Médico    → usuário helena.burigo  (ou CPF 483.915.270-50)
   *   · Gestor    → usuário gestao.saude
   */
  var PACIENTE_DEMO = "u-pac-1";

  var PAPEIS = {
    paciente: { label: "Paciente", home: "dashboard.html" },
    medico: { label: "Profissional de Saúde", home: "medico.html" },
    admin: { label: "Gestor(a)", home: "admin.html" },
  };

  function seedUsuarios() {
    var senha = hashSenha("demo1234");
    return [
      {
        id: PACIENTE_DEMO,
        papel: "paciente",
        nome: "Artur Seixas Pedro",
        cpf: "072.418.339-61",
        cns: "708 4051 8829 0014",
        nascimento: "2004-03-12",
        telefone: "(48) 99812-4470",
        email: "artur@exemplo.com.br",
        endereco: "Rua Coronel Pedro Benedet, 190 — Centro, Criciúma/SC",
        unidade: "ubs-centro",
        tipoSanguineo: "O+",
        alergias: "Dipirona",
        condicoes: "Rinite alérgica",
        senha: senha,
        origem: "portal",
      },
      {
        id: "med-4",
        papel: "medico",
        nome: "Dra. Helena Búrigo",
        login: "helena.burigo",
        cpf: "483.915.270-50",
        crm: "CRM/SC 15.320",
        especialidade: "Clínica Médica",
        unidade: "ubs-centro",
        email: "helena.burigo@criciuma.sc.gov.br",
        senha: senha,
      },
      {
        id: "u-adm-1",
        papel: "admin",
        nome: "Gestão Municipal de Saúde",
        login: "gestao.saude",
        cpf: "315.662.048-36",
        cargo: "Secretaria Municipal de Saúde",
        unidade: "ubs-centro",
        email: "gestao.saude@criciuma.sc.gov.br",
        senha: senha,
      },
    ];
  }

  /* Hash simples (djb2) — suficiente para um protótipo que roda só no
     navegador; um sistema real usaria bcrypt/argon2 no servidor. */
  function hashSenha(s) {
    var str = "crimed$" + String(s || "");
    var h = 5381;
    for (var i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) | 0;
    return "h" + (h >>> 0).toString(36);
  }

  function soDigitos(s) {
    return String(s || "").replace(/\D/g, "");
  }

  /** Valida CPF pelos dígitos verificadores (rejeita sequências repetidas). */
  function validarCPF(cpf) {
    var d = soDigitos(cpf);
    if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
    for (var t = 9; t < 11; t++) {
      var soma = 0;
      for (var i = 0; i < t; i++) soma += Number(d[i]) * (t + 1 - i);
      var dv = ((soma * 10) % 11) % 10;
      if (dv !== Number(d[t])) return false;
    }
    return true;
  }

  function formatarCPF(cpf) {
    var d = soDigitos(cpf);
    return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  }

  /* ------------------------------------------------------------- CONSULTAS */
  /*
   * Regra de negócio: o paciente agenda SOMENTE com clínico geral
   * (Clínica Médica). Consultas com especialistas existem apenas por
   * encaminhamento feito pelo clínico — campo "encaminhadoPor".
   */
  function seedConsultas() {
    var enc = { encaminhadoPor: "Dra. Helena Búrigo", encaminhadoPorId: "med-4" };
    function c(o) {
      var base = {
        pacienteId: PACIENTE_DEMO,
        paciente: "Artur Seixas Pedro",
        resumo: "",
        conduta: "",
        anamnese: "",
      };
      for (var k in o) base[k] = o[k];
      return base;
    }
    return [
      c({
        id: 1001,
        medicoId: "med-4",
        medico: "Dra. Helena Búrigo",
        especialidade: "Clínica Médica",
        unidade: "ubs-centro",
        data: dayOffset(0),
        hora: proximaHoraCheia(),
        status: "Confirmada",
        motivo: "Retorno — controle de pressão arterial",
      }),
      c({
        id: 1002,
        medicoId: "med-2",
        medico: "Dr. Fernando Silva",
        especialidade: "Cardiologia",
        unidade: "ubs-prospera",
        data: dayOffset(6),
        hora: "15:10",
        status: "Confirmada",
        motivo: "Avaliação cardiológica — pressão arterial elevada",
        encaminhadoPor: enc.encaminhadoPor,
        encaminhadoPorId: enc.encaminhadoPorId,
      }),
      c({
        id: 1003,
        medicoId: "med-1",
        medico: "Dra. Vanessa Costa",
        especialidade: "Neurologia",
        unidade: "ubs-centro",
        data: dayOffset(-18),
        hora: "10:00",
        status: "Realizada",
        motivo: "Cefaleia recorrente",
        encaminhadoPor: enc.encaminhadoPor,
        encaminhadoPorId: enc.encaminhadoPorId,
        anamnese:
          "Paciente relata episódios de cefaleia pulsátil há cerca de 3 meses, com frequência de 2 a 3 vezes por semana, predominantemente no período vespertino. Nega aura visual. Refere piora com privação de sono e telas.",
        resumo:
          "Exame neurológico sem alterações. Reflexos preservados e simétricos. Hipótese diagnóstica: enxaqueca sem aura (CID-10 G43.0).",
        conduta:
          "Higiene do sono, redução do tempo de tela à noite e diário de cefaleia. Analgésico em crise. Retorno em 6 meses ou antes se piora.",
        nota: 5,
      }),
      c({
        id: 1004,
        medicoId: "med-3",
        medico: "Dr. Carlos Mendes",
        especialidade: "Ortopedia",
        unidade: "ubs-riomaina",
        data: dayOffset(-46),
        hora: "09:00",
        status: "Realizada",
        motivo: "Dor lombar",
        encaminhadoPor: enc.encaminhadoPor,
        encaminhadoPorId: enc.encaminhadoPorId,
        anamnese:
          "Lombalgia mecânica há 4 semanas, sem irradiação para membros inferiores. Trabalha sentado por longos períodos.",
        resumo:
          "Lombalgia mecânica inespecífica (CID-10 M54.5). Sem sinais de alerta. Mobilidade preservada.",
        conduta:
          "Encaminhamento para fisioterapia (10 sessões), orientação postural e alongamentos diários. Anti-inflamatório por 5 dias.",
        nota: 4,
      }),
      c({
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
      }),
      c({
        id: 1006,
        medicoId: "med-7",
        medico: "Dra. Juliana Pasqualli",
        especialidade: "Dermatologia",
        unidade: "ubs-metropol",
        data: dayOffset(-30),
        hora: "14:40",
        status: "Cancelada",
        motivo: "Avaliação de lesão de pele",
        encaminhadoPor: enc.encaminhadoPor,
        encaminhadoPorId: enc.encaminhadoPorId,
      }),
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
        pacienteId: "u-pac-1",
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
        pacienteId: "u-pac-1",
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
        pacienteId: "u-pac-1",
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
        pacienteId: "u-pac-1",
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
        pacienteId: "u-pac-1",
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
        pacienteId: "u-pac-1",
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
        pacienteId: "u-pac-1",
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
        usuarioId: PACIENTE_DEMO,
        tipo: "consulta",
        titulo: "Consulta hoje",
        texto:
          "Sua consulta com a Dra. Helena Búrigo (clínica geral) é hoje. A sala abre 15 minutos antes.",
        quando: "Agora há pouco",
        lida: false,
        link: "consultas.html",
      },
      {
        id: "n-0",
        usuarioId: PACIENTE_DEMO,
        tipo: "consulta",
        titulo: "Você foi encaminhado para Cardiologia",
        texto:
          "A Dra. Helena Búrigo marcou sua consulta com o Dr. Fernando Silva. Veja a data em Minhas consultas.",
        quando: "Há 1 dia",
        lida: false,
        link: "consultas.html",
      },
      {
        id: "n-2",
        usuarioId: PACIENTE_DEMO,
        tipo: "exame",
        titulo: "Resultado de exame disponível",
        texto: "O laudo do seu Eletrocardiograma (ECG) já pode ser consultado.",
        quando: "Há 2 dias",
        lida: false,
        link: "prontuarios.html#exames",
      },
      {
        id: "n-3",
        usuarioId: PACIENTE_DEMO,
        tipo: "receita",
        titulo: "Receita digital emitida",
        texto:
          "Dra. Vanessa Costa emitiu uma receita digital. Válida em todas as farmácias credenciadas.",
        quando: "Há 5 dias",
        lida: true,
        link: "prontuarios.html#receitas",
      },
      {
        id: "n-m1",
        usuarioId: "med-4",
        tipo: "sistema",
        titulo: "Agenda de hoje publicada",
        texto: "Seus atendimentos de hoje já estão disponíveis na Agenda do Dia.",
        quando: "Hoje",
        lida: false,
        link: "medico.html",
      },
    ];
  }

  /* ---------------------------------- FILA DE ESPERA (painel do profissional) */
  function seedFila() {
    return [
      {
        id: "f-1",
        pacienteId: "u-pac-1",
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
  /* Toda ação de agendamento leva ao clínico geral — é ele quem encaminha
     para o especialista quando necessário. */
  function agendarClinico(motivo) {
    return { motivo: motivo, label: "Agendar com clínico geral" };
  }

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
        "Mesmo assim vale uma avaliação logo. Marque uma consulta com o <strong>clínico geral</strong>: se for preciso, ele mesmo te encaminha para o cardiologista.",
      risco: "amarelo",
      acao: agendarClinico("Estou com sintomas"),
      opcoes: [{ label: "Começar de novo", proximo: "inicio" }],
    },
    dor_cabeca: {
      texto:
        "Dores de cabeça recorrentes merecem avaliação. O <strong>clínico geral</strong> faz a primeira consulta e, se precisar, encaminha você para o neurologista.",
      risco: "verde",
      acao: agendarClinico("Estou com sintomas"),
      opcoes: [{ label: "Começar de novo", proximo: "inicio" }],
    },
    dor_coluna: {
      texto:
        "Enquanto aguarda: evite carregar peso, mantenha-se ativo e cuide da postura. O <strong>clínico geral</strong> avalia e, se necessário, encaminha para a ortopedia.",
      risco: "verde",
      acao: agendarClinico("Estou com sintomas"),
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
        "Mantenha hidratação e repouso. Se surgir <strong>falta de ar, confusão mental ou febre acima de 39 °C</strong>, procure atendimento imediato. Se quiser, já pode marcar uma consulta com o clínico geral.",
      risco: "verde",
      acao: agendarClinico("Estou com sintomas"),
      opcoes: [{ label: "Começar de novo", proximo: "inicio" }],
    },
    febre_longa: {
      texto:
        "Febre por mais de 3 dias precisa de avaliação médica. Marque uma consulta com o <strong>clínico geral</strong> o quanto antes.",
      risco: "amarelo",
      acao: agendarClinico("Estou com sintomas"),
      opcoes: [{ label: "Começar de novo", proximo: "inicio" }],
    },
    receita: {
      texto:
        "Para renovar uma receita, marque uma consulta com o clínico geral escolhendo o motivo <strong>“Renovar receita”</strong>. Suas receitas atuais ficam no prontuário.",
      risco: "verde",
      acao: agendarClinico("Renovar receita"),
      link: { href: "prontuarios.html#receitas", label: "Ver minhas receitas" },
      opcoes: [{ label: "Começar de novo", proximo: "inicio" }],
    },
    emocional: {
      texto:
        "Que bom que você procurou ajuda — isso já é um passo importante. O <strong>clínico geral</strong> pode te ouvir e encaminhar para o atendimento psicológico da rede. Se você estiver em sofrimento intenso agora, ligue <strong>188 (CVV)</strong>, 24h e gratuito.",
      risco: "amarelo",
      acao: agendarClinico("Estou com sintomas"),
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
        "Para qualquer sintoma, o <strong>clínico geral</strong> é a porta de entrada. Ele avalia e, se precisar, encaminha para a especialidade certa.",
      risco: "verde",
      acao: agendarClinico("Estou com sintomas"),
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

  /* — escopo por usuário —
     Um paciente só enxerga os próprios registros. Profissionais e gestão
     enxergam a base inteira (necessário para a agenda e os prontuários). */
  function sessaoBruta() {
    return read(K.sessao, null);
  }
  function usuarioBruto(id) {
    return read(K.usuarios, []).filter(function (u) {
      return u.id === id;
    })[0];
  }
  function pacienteLogadoId() {
    var s = sessaoBruta();
    if (!s) return null;
    var u = usuarioBruto(s.id);
    return u && u.papel === "paciente" ? u.id : null;
  }
  function dono(item, campo) {
    return item[campo] || PACIENTE_DEMO;
  }
  function lerEscopo(key, campo, uid) {
    var todos = read(key, []);
    if (!uid) return todos;
    return todos.filter(function (x) {
      return dono(x, campo) === uid;
    });
  }
  function salvarEscopo(key, campo, uid, lista) {
    if (!uid) return write(key, lista);
    var outros = read(key, []).filter(function (x) {
      return dono(x, campo) !== uid;
    });
    lista.forEach(function (x) {
      if (!x[campo]) x[campo] = uid;
    });
    return write(key, outros.concat(lista));
  }

  /** Remove a senha e acrescenta rótulo e página inicial do papel. */
  function publico(u) {
    if (!u) return null;
    var o = {};
    for (var k in u) if (k !== "senha") o[k] = u[k];
    var p = PAPEIS[u.papel] || PAPEIS.paciente;
    o.papelLabel = p.label;
    o.home = p.home;
    return o;
  }

  var DB = {
    keys: K,
    unidades: UNIDADES,
    medicos: MEDICOS,
    especialidades: ESPECIALIDADES,
    metricas: METRICAS,
    triagem: TRIAGEM,
    papeis: PAPEIS,
    pacienteDemo: PACIENTE_DEMO,

    dayOffset: dayOffset,
    hoje: hoje,
    iso: iso,
    validarCPF: validarCPF,
    formatarCPF: formatarCPF,
    soDigitos: soDigitos,

    init: function () {
      if (!localStorage.getItem(K.usuarios)) write(K.usuarios, seedUsuarios());
      if (!localStorage.getItem(K.consultas)) write(K.consultas, seedConsultas());
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
     * (Só mexe nos dados do paciente de demonstração.)
     */
    rejuvenescer: function () {
      var hj = hoje();
      var mudou = false;

      var consultas = read(K.consultas, []);
      var atrasadas = consultas.filter(function (c) {
        return c.status === "Confirmada" && c.data < hj && dono(c, "pacienteId") === PACIENTE_DEMO;
      });
      atrasadas.forEach(function (c, i) {
        c.data = i === 0 ? hj : dayOffset(i * 3);
        if (i === 0) c.hora = proximaHoraCheia();
        mudou = true;
      });
      if (mudou) write(K.consultas, consultas);

      var receitas = read(K.receitas, []);
      var vigente = receitas[0];
      if (vigente && vigente.validade < hj) {
        vigente.validade = dayOffset(12);
        write(K.receitas, receitas);
      }

      var exames = read(K.exames, []);
      var pendente = exames.filter(function (e) { return e.status === "Aguardando"; })[0];
      if (pendente && pendente.data < hj) {
        pendente.data = dayOffset(2);
        write(K.exames, exames);
      }

      var fila = read(K.fila, []);
      var primeira = consultas.filter(function (c) {
        return c.status === "Confirmada" && c.data === hj && dono(c, "pacienteId") === PACIENTE_DEMO;
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

    /* =========================================================== CONTAS */
    usuarios: function () {
      return read(K.usuarios, []).map(publico);
    },
    usuario: function (id) {
      return publico(usuarioBruto(id));
    },

    /** Localiza uma conta por CPF, Cartão SUS, usuário institucional ou e-mail. */
    buscarConta: function (identificador) {
      var txt = String(identificador || "").trim().toLowerCase();
      if (!txt) return null;
      var dig = soDigitos(txt);
      var temLetra = /[a-z]/.test(txt);
      return read(K.usuarios, []).filter(function (u) {
        if (!temLetra && dig.length === 11 && soDigitos(u.cpf) === dig) return true;
        if (!temLetra && dig.length === 15 && soDigitos(u.cns) === dig) return true;
        if (u.login && u.login.toLowerCase() === txt) return true;
        if (u.email && u.email.toLowerCase() === txt) return true;
        return false;
      })[0] || null;
    },

    cpfCadastrado: function (cpf) {
      var d = soDigitos(cpf);
      return read(K.usuarios, []).some(function (u) {
        return soDigitos(u.cpf) === d;
      });
    },

    /**
     * Confere credenciais.
     * @returns {{ok:boolean, usuario?:object, erro?:string, campo?:string}}
     */
    autenticar: function (identificador, senha) {
      var txt = String(identificador || "").trim();
      if (!txt) return { ok: false, campo: "usuario", erro: "Informe seu CPF." };
      var dig = soDigitos(txt);
      var pareceCPF = !/[a-z@]/i.test(txt);
      if (pareceCPF && dig.length !== 11 && dig.length !== 15) {
        return { ok: false, campo: "usuario", erro: "O CPF precisa ter 11 números." };
      }
      if (pareceCPF && dig.length === 11 && !validarCPF(dig)) {
        return { ok: false, campo: "usuario", erro: "Este CPF não é válido. Confira os números." };
      }
      if (!senha) return { ok: false, campo: "senha", erro: "Digite sua senha." };
      var u = DB.buscarConta(txt);
      if (!u) {
        return {
          ok: false,
          campo: "usuario",
          naoEncontrado: true,
          erro: pareceCPF
            ? "Não encontramos uma conta com este CPF. Toque em “Criar conta”."
            : "Usuário não encontrado.",
        };
      }
      if (u.senha !== hashSenha(senha)) {
        return { ok: false, campo: "senha", erro: "Senha incorreta. Tente novamente." };
      }
      return { ok: true, usuario: publico(u) };
    },

    /**
     * Cria uma conta de paciente após validar os dados.
     * @returns {{ok:boolean, usuario?:object, erro?:string, campo?:string}}
     */
    cadastrar: function (d) {
      d = d || {};
      var nome = String(d.nome || "").trim().replace(/\s+/g, " ");
      if (nome.split(" ").length < 2 || nome.length < 5) {
        return { ok: false, campo: "nome", erro: "Digite seu nome completo (nome e sobrenome)." };
      }
      if (!validarCPF(d.cpf)) {
        return { ok: false, campo: "cpf", erro: "CPF inválido. Confira os 11 números." };
      }
      if (DB.cpfCadastrado(d.cpf)) {
        return { ok: false, campo: "cpf", existe: true, erro: "Já existe uma conta com este CPF. Use a opção “Entrar”." };
      }
      if (d.nascimento) {
        var nasc = new Date(d.nascimento + "T12:00:00");
        var anos = (Date.now() - nasc.getTime()) / 31557600000;
        if (isNaN(anos) || anos < 0 || anos > 120) {
          return { ok: false, campo: "nascimento", erro: "Confira a data de nascimento." };
        }
      } else {
        return { ok: false, campo: "nascimento", erro: "Informe sua data de nascimento." };
      }
      var tel = soDigitos(d.telefone);
      if (tel.length < 10 || tel.length > 11) {
        return { ok: false, campo: "telefone", erro: "Informe o celular com DDD. Ex.: (48) 99999-9999" };
      }
      if (!d.unidade || !DB.unidade(d.unidade)) {
        return { ok: false, campo: "unidade", erro: "Escolha a UBS mais perto da sua casa." };
      }
      if (!d.origemGov) {
        if (String(d.senha || "").length < 8) {
          return { ok: false, campo: "senha", erro: "A senha precisa ter pelo menos 8 caracteres." };
        }
        if (d.senha !== d.confirmacao) {
          return { ok: false, campo: "confirmacao", erro: "As senhas não são iguais." };
        }
      }
      if (d.simular) return { ok: true };
      var lista = read(K.usuarios, []);
      var novo = {
        id: "u-pac-" + Date.now().toString(36),
        papel: "paciente",
        nome: nome,
        cpf: formatarCPF(d.cpf),
        cns: String(d.cns || "").trim(),
        nascimento: d.nascimento,
        telefone: d.telefone,
        email: String(d.email || "").trim(),
        endereco: "",
        unidade: d.unidade,
        tipoSanguineo: "",
        alergias: "",
        condicoes: "",
        senha: hashSenha(d.origemGov ? "gov:" + Date.now() : d.senha),
        origem: d.origemGov ? "gov.br" : "portal",
        criadoEm: new Date().toISOString(),
      };
      lista.push(novo);
      write(K.usuarios, lista);

      var notifs = read(K.notificacoes, []);
      notifs.unshift({
        id: "n-" + Date.now(),
        usuarioId: novo.id,
        tipo: "sistema",
        titulo: "Bem-vindo(a) à Tele-Saúde Criciúma!",
        texto: "Sua conta foi criada. Para marcar sua primeira consulta, toque em “Agendar consulta”.",
        quando: "Agora",
        lida: false,
        link: "agendar.html",
      });
      write(K.notificacoes, notifs);
      return { ok: true, usuario: publico(novo) };
    },

    /* =========================================================== SESSÃO */
    /** Usuário conectado (dados sempre atualizados), ou null. */
    sessao: function () {
      var s = sessaoBruta();
      if (!s || !s.id) return null;
      return publico(usuarioBruto(s.id));
    },
    iniciarSessao: function (u) {
      write(K.sessao, { id: u.id, desde: new Date().toISOString() });
      return DB.sessao();
    },
    /** Atalho de demonstração: entra com a primeira conta do papel. */
    entrar: function (papel) {
      var u = read(K.usuarios, []).filter(function (x) { return x.papel === papel; })[0];
      return u ? DB.iniciarSessao(u) : null;
    },
    sair: function () {
      localStorage.removeItem(K.sessao);
    },

    /* =========================================================== PERFIL */
    /** Perfil do paciente conectado (ou do paciente de demonstração). */
    perfil: function () {
      var uid = pacienteLogadoId() || PACIENTE_DEMO;
      return publico(usuarioBruto(uid)) || publico(seedUsuarios()[0]);
    },
    salvarPerfil: function (p) {
      var lista = read(K.usuarios, []);
      for (var i = 0; i < lista.length; i++) {
        if (lista[i].id === p.id) {
          for (var k in p) {
            if (k !== "senha" && k !== "papel" && k !== "id" && k !== "cpf" && k !== "home" && k !== "papelLabel") {
              lista[i][k] = p[k];
            }
          }
        }
      }
      write(K.usuarios, lista);
    },
    /** Paciente dono de uma consulta (para a visão do profissional). */
    pacienteDaConsulta: function (c) {
      var id = c && c.pacienteId ? c.pacienteId : PACIENTE_DEMO;
      var u = publico(usuarioBruto(id));
      if (u) return u;
      return { id: id, nome: (c && c.paciente) || "Paciente", papel: "paciente" };
    },

    /* ======================================================== CONSULTAS */
    consultas: function () {
      return lerEscopo(K.consultas, "pacienteId", pacienteLogadoId());
    },
    salvarConsultas: function (lista) {
      salvarEscopo(K.consultas, "pacienteId", pacienteLogadoId(), lista);
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

    /** Clínicos gerais — os únicos com agenda aberta ao paciente. */
    clinicosGerais: function () {
      return MEDICOS.filter(function (m) {
        return m.especialidade === "Clínica Médica";
      });
    },
    /** Especialidades que só são acessadas por encaminhamento. */
    especialidadesEncaminhamento: function () {
      return ESPECIALIDADES.filter(function (e) {
        return e !== "Clínica Médica" && e !== "Enfermagem / Triagem";
      });
    },

    /**
     * Horários livres de um profissional em uma data. Alguns horários
     * aparecem como ocupados de forma estável (simula a agenda real).
     */
    horariosLivres: function (medicoId, data) {
      var m = DB.medico(medicoId);
      if (!m || !data) return [];
      var ocupados = read(K.consultas, [])
        .filter(function (c) {
          return c.medicoId === m.id && c.data === data && c.status === "Confirmada";
        })
        .map(function (c) { return c.hora; });
      var agora = new Date();
      var ehHoje = data === hoje();
      return m.horarios.filter(function (h, i) {
        var pseudo = (data.charCodeAt(9) + i * 7 + m.id.length) % 5 === 0;
        if (ocupados.indexOf(h) >= 0 || pseudo) return false;
        if (ehHoje) {
          var p = h.split(":");
          var t = new Date();
          t.setHours(+p[0], +p[1], 0, 0);
          if (t.getTime() < agora.getTime() + 30 * 60000) return false;
        }
        return true;
      });
    },

    /**
     * Encaminhamento: o clínico geral marca a consulta com o especialista.
     * @param {{pacienteId, paciente, medicoId, data, hora, motivo, prioridade}} d
     */
    encaminhar: function (d) {
      var esp = DB.medico(d.medicoId);
      var s = DB.sessao();
      if (!esp || !s) return null;
      var nova = {
        id: Date.now(),
        pacienteId: d.pacienteId,
        paciente: d.paciente,
        medicoId: esp.id,
        medico: esp.nome,
        especialidade: esp.especialidade,
        unidade: esp.unidade,
        data: d.data,
        hora: d.hora,
        status: "Confirmada",
        motivo: d.motivo || "Encaminhamento",
        prioridade: d.prioridade || "Normal",
        encaminhadoPor: s.nome,
        encaminhadoPorId: s.id,
        encaminhadoEm: new Date().toISOString(),
        resumo: "",
        conduta: "",
        anamnese: "",
      };
      var todas = read(K.consultas, []);
      todas.push(nova);
      write(K.consultas, todas);

      var notifs = read(K.notificacoes, []);
      notifs.unshift({
        id: "n-" + Date.now(),
        usuarioId: d.pacienteId,
        tipo: "consulta",
        titulo: "Você foi encaminhado para " + esp.especialidade,
        texto:
          s.nome + " marcou sua consulta com " + esp.nome + " para " +
          d.data.split("-").reverse().join("/") + " às " + d.hora + ".",
        quando: "Agora",
        lida: false,
        link: "consultas.html",
      });
      write(K.notificacoes, notifs);
      return nova;
    },

    /* ========================================================== EXAMES */
    exames: function () {
      return lerEscopo(K.exames, "pacienteId", pacienteLogadoId());
    },
    salvarExames: function (l) {
      salvarEscopo(K.exames, "pacienteId", pacienteLogadoId(), l);
    },

    receitas: function () {
      return lerEscopo(K.receitas, "pacienteId", pacienteLogadoId());
    },
    salvarReceitas: function (l) {
      salvarEscopo(K.receitas, "pacienteId", pacienteLogadoId(), l);
    },

    /* ==================================================== NOTIFICAÇÕES */
    notificacoes: function () {
      var s = sessaoBruta();
      return lerEscopo(K.notificacoes, "usuarioId", s ? s.id : PACIENTE_DEMO);
    },
    salvarNotificacoes: function (l) {
      var s = sessaoBruta();
      salvarEscopo(K.notificacoes, "usuarioId", s ? s.id : PACIENTE_DEMO, l);
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
