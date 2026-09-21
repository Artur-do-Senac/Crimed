# CRIMED · Tele-Saúde Criciúma

Protótipo navegável do **Programa Tele-Saúde Expandido (PTSE-001)** — um sistema
de telemedicina para a rede municipal de saúde de Criciúma/SC: teleconsultas por
vídeo, prontuário eletrônico, agendamento online e painel de gestão.

Trabalho acadêmico. Construído **somente com HTML, CSS e JavaScript**, sem
framework, sem build e sem servidor de aplicação — publicável direto no GitHub
Pages.

---

## Como publicar no GitHub Pages

```bash
git add -A && git commit -m "CRIMED: portal de tele-saude de Criciuma" && git push
```

Depois, no GitHub: **Settings → Pages → Source: Deploy from a branch → Branch:
`main` / `/ (root)` → Save**. Em cerca de um minuto o site fica no ar em
`https://<usuario>.github.io/Crimed/`.

> **Importante:** a câmera e o microfone só funcionam em `https://` ou
> `http://localhost`. No GitHub Pages funciona; abrindo o arquivo direto com
> duplo clique (`file://`) o navegador bloqueia a câmera.

### Rodando na sua máquina

```bash
python -m http.server 5173
```

E abra `http://localhost:5173`.

---

## Acesso ao sistema

Na tela de acesso, escolha um dos três perfis. Usuário e senha já vêm
preenchidos (`demo1234`) — qualquer valor é aceito.

| Perfil | Onde entra | O que demonstra |
|---|---|---|
| **Paciente** | `dashboard.html` | Agendamento, sala de consulta, prontuário, receitas, LGPD |
| **Profissional** | `medico.html` | Agenda do dia, fila de risco, atendimento, registro clínico |
| **Gestor** | `admin.html` | Indicadores, gráficos, metas e relatórios da Secretaria |

---

## Roteiro sugerido para a apresentação

1. **`index.html`** — portal público. Role até o mapa das 10 UBS e passe o mouse
   nos marcadores. Clique em **Libras** na barra superior para ativar o VLibras.
2. **Botão flutuante "Cris"** — faça a triagem: *Estou com dor → Peito*. Ela
   classifica o risco como alto e manda procurar o SAMU. Depois refaça com
   *Cabeça* e clique em **Agendar Clínica Médica**.
3. **Acesso como Paciente** — o painel mostra a consulta de hoje com contagem
   regressiva.
4. **"Entrar na sala agora"** — permita a câmera quando o navegador pedir.
   **A sua câmera liga de verdade.** Mostre o mudo, o desligar câmera e o
   **compartilhar tela**. Mande uma mensagem no chat. Encerre a chamada.
5. **Prontuário e Exames** — aba *Receitas digitais*: aponte o celular para o
   **QR Code**, ele é real. Clique em *Imprimir receita*.
6. **Perfil e LGPD** — mostre os consentimentos, *Quem acessou meu prontuário* e
   *Baixar todos os meus dados*.
7. **Sair → entrar como Gestor** — painel de indicadores, os gráficos animam ao
   carregar. Clique em *Relatório gerencial*.
8. **`sobre.html`** — cada entregável do Termo de Abertura ligado à tela que o
   implementa.

Se precisar zerar a demonstração: **Perfil → Apagar meus dados de demonstração**.

---

## Estrutura

```
index.html          Portal público (landing institucional)
acesso.html         Login e cadastro, com os três perfis
dashboard.html      Painel do paciente
consultas.html      Agendamento, histórico e agenda do mês
teleconsulta.html   Sala virtual — vídeo, áudio, chat, compartilhar tela
prontuarios.html    Prontuário, exames e receitas digitais
perfil.html         Dados cadastrais e central de privacidade (LGPD)
medico.html         Painel do profissional de saúde
admin.html          Painel de indicadores da Secretaria
sobre.html          O projeto: escopo, entregáveis, marcos, riscos
manifest.json       Metadados do PWA
sw.js               Service Worker (funciona offline)

assets/css/
  base.css          Reset, design tokens, tipografia, animações
  components.css    Botões, cards, formulários, modais, tabelas
  layout.css        Barra de acessibilidade, navbar, sidebar, rodapé
  pages.css         Estilos por página

assets/js/
  icons.js          Biblioteca de ícones SVG própria (sem CDN)
  data.js           Base de dados simulada + camada de acesso
  core.js           Toasts, modais, tema, acessibilidade, shell do app
  charts.js         Motor de gráficos SVG próprio
  app.js            Componentes compartilhados + páginas pública/acesso/perfil
  paciente.js       Telas do paciente
  gestao.js         Painéis do profissional e da gestão
  teleconsulta.js   Sala de atendimento
  assistente.js     "Cris", a assistente de triagem

assets/vendor/
  qrcode.js         Gerador de QR Code (MIT, Kazuhiko Arase)
```

---

## Decisões técnicas

**Paleta institucional.** As cores vêm do portal oficial da Prefeitura de
Criciúma (`criciuma.sc.gov.br`): verde `#208049` e `#013D00`, azul `#003451`,
vinho `#B13B4E`.

**Zero dependências de runtime.** Os ícones e os gráficos foram escritos do zero
em SVG. A única biblioteca de terceiros é o gerador de QR Code, que está no
próprio repositório. O sistema abre mesmo sem internet — só as fontes do Google
e o VLibras precisam de rede, e ambos degradam sem quebrar nada.

**Vídeo de verdade.** A sala usa `getUserMedia` e `getDisplayMedia`. O vídeo do
outro participante é simulado: não há servidor de sinalização WebRTC, o que
fugiria do escopo de um protótipo estático.

**Dados no dispositivo.** Tudo fica em `localStorage`; nenhuma informação de
saúde sai do navegador. Ao abrir, a base se reajusta para a data atual, para a
demonstração nunca aparecer vencida.

**Acessibilidade.** Quatro níveis de ampliação de texto, alto contraste, modo
escuro, redução de animações, navegação por teclado, foco visível, marcos ARIA e
integração com o VLibras do gov.br. Isso responde ao risco **R2** do Termo de
Abertura — baixa inclusão digital.

---

## Aviso

Protótipo acadêmico com dados fictícios. Não é um serviço de saúde real e não
possui validade clínica ou legal. Em emergências: **SAMU 192**.

Equipe: Artur · Brendon · Gabriel · Thiago Motta · Welliton
