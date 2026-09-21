/* ============================================================================
   CRIMED · icons.js
   Biblioteca de ícones SVG própria (sem CDN) — o sistema continua funcionando
   mesmo sem internet. Uso:
     · No HTML:  <i data-ico="home"></i>
     · No JS:    Icon.svg('home', 'ico-lg')
   ========================================================================= */
(function (global) {
  "use strict";

  var P = {
    /* — identidade / saúde — */
    logo: '<path d="M12 20.6s-7.6-4.9-7.6-10.2A4.6 4.6 0 0 1 12 7.4a4.6 4.6 0 0 1 7.6 3c0 5.3-7.6 10.2-7.6 10.2z"/><path d="M4.9 12.4h2.7l1.6-2.9 2.4 5.5 1.8-3.5 1.2 .9h4"/>',
    heart:
      '<path d="M12 20.6s-7.6-4.9-7.6-10.2A4.6 4.6 0 0 1 12 7.4a4.6 4.6 0 0 1 7.6 3c0 5.3-7.6 10.2-7.6 10.2z"/>',
    pulse: '<path d="M3 12h4l3-8 4 16 3-8h4"/>',
    stethoscope:
      '<path d="M6 3v5.5a4 4 0 0 0 8 0V3"/><path d="M4.5 3h3M12.5 3h3"/><path d="M10 12.2V15a5 5 0 0 0 10 0v-1.2"/><circle cx="20" cy="11" r="2.1"/>',
    pill: '<path d="M16.4 3.6a5 5 0 0 1 0 7.1l-5.7 5.7a5 5 0 1 1-7.1-7.1l5.7-5.7a5 5 0 0 1 7.1 0z"/><path d="M7 7.1l7.1 7.1"/>',
    flask:
      '<path d="M9.5 3v6.6l-5 8.4a2 2 0 0 0 1.7 3h11.6a2 2 0 0 0 1.7-3l-5-8.4V3"/><path d="M8 3h8"/><path d="M6.6 15.4h10.8"/>',
    ambulance:
      '<path d="M2.5 16.5V7.5A1.5 1.5 0 0 1 4 6h9.5v10.5"/><path d="M13.5 9.5H18l3 3.5v3.5h-2.5"/><circle cx="7" cy="18" r="2"/><circle cx="16.5" cy="18" r="2"/><path d="M9 18h5.5"/><path d="M6.5 10.5h3M8 9v3"/>',
    shield:
      '<path d="M12 3 4.6 6.2v5.6c0 4.7 3.2 8.6 7.4 9.6 4.2-1 7.4-4.9 7.4-9.6V6.2z"/><path d="m8.9 12.2 2.2 2.2 4.1-4.4"/>',
    "shield-plain":
      '<path d="M12 3 4.6 6.2v5.6c0 4.7 3.2 8.6 7.4 9.6 4.2-1 7.4-4.9 7.4-9.6V6.2z"/>',

    /* — navegação — */
    home: '<path d="M3 10.6 12 3l9 7.6"/><path d="M5.6 9.4V21h12.8V9.4"/><path d="M9.8 21v-6.2h4.4V21"/>',
    grid: '<rect x="3.5" y="3.5" width="7" height="7" rx="1.8"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.8"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.8"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.8"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    close: '<path d="M18 6 6 18M6 6l12 12"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    minus: '<path d="M5 12h14"/>',
    check: '<path d="M20 6.5 9.5 17 4 11.5"/>',
    "check-circle":
      '<circle cx="12" cy="12" r="9"/><path d="m8.2 12.2 2.6 2.6 5-5.4"/>',
    "x-circle": '<circle cx="12" cy="12" r="9"/><path d="M15 9l-6 6M9 9l6 6"/>',
    "chevron-down": '<path d="m6 9.5 6 6 6-6"/>',
    "chevron-up": '<path d="m6 14.5 6-6 6 6"/>',
    "chevron-right": '<path d="m9.5 6 6 6-6 6"/>',
    "chevron-left": '<path d="m14.5 6-6 6 6 6"/>',
    "arrow-right": '<path d="M4 12h15"/><path d="m13 6 6 6-6 6"/>',
    "arrow-left": '<path d="M20 12H5"/><path d="m11 18-6-6 6-6"/>',
    "arrow-up-right": '<path d="M7 17 17 7"/><path d="M8.5 7H17v8.5"/>',
    "arrow-down": '<path d="M12 4.5v15"/><path d="m5.5 13 6.5 6.5 6.5-6.5"/>',
    "external-link":
      '<path d="M13.5 4H20v6.5"/><path d="M10.5 13.5 20 4"/><path d="M18.5 13.5v4.9A1.6 1.6 0 0 1 16.9 20H5.6A1.6 1.6 0 0 1 4 18.4V7.1a1.6 1.6 0 0 1 1.6-1.6h4.9"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20.5 20.5-4.2-4.2"/>',
    filter: '<path d="M3.5 5h17l-6.8 8v5.6l-3.4 2V13z"/>',
    refresh:
      '<path d="M20.4 12.6a8.5 8.5 0 1 1-2.3-6.4"/><path d="M20.5 3.5v5h-5"/>',
    "more-vertical":
      '<circle cx="12" cy="5" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="12" cy="19" r="1.4"/>',

    /* — pessoas — */
    user: '<circle cx="12" cy="8" r="3.7"/><path d="M4.8 20.6a7.2 7.2 0 0 1 14.4 0"/>',
    "user-plus":
      '<circle cx="9.5" cy="8" r="3.7"/><path d="M2.8 20.6a6.8 6.8 0 0 1 13.4 0"/><path d="M19 8.5v5M16.5 11h5"/>',
    users:
      '<circle cx="9" cy="8" r="3.4"/><path d="M2.5 20.4a6.6 6.6 0 0 1 13 0"/><path d="M16.2 4.9a3.4 3.4 0 0 1 0 6.4"/><path d="M17.6 14.5a6.6 6.6 0 0 1 3.9 5.9"/>',
    "user-doctor":
      '<circle cx="12" cy="7.5" r="3.4"/><path d="M6.6 20.6v-2.1a5.4 5.4 0 0 1 3.2-4.9l2.2 3.1 2.2-3.1a5.4 5.4 0 0 1 3.2 4.9v2.1"/><path d="M12 3.2v1.9"/>',
    accessibility:
      '<circle cx="12" cy="4.3" r="1.9"/><path d="M4.6 8.4c2.4 1 4.9 1.5 7.4 1.5s5-.5 7.4-1.5"/><path d="M12 9.9v4.6"/><path d="m8.2 20.8 3.8-6.3 3.8 6.3"/>',

    /* — agenda / tempo — */
    calendar:
      '<rect x="3.2" y="5" width="17.6" height="16" rx="2.6"/><path d="M3.2 10h17.6"/><path d="M8 3v4M16 3v4"/>',
    "calendar-plus":
      '<rect x="3.2" y="5" width="17.6" height="16" rx="2.6"/><path d="M3.2 10h17.6"/><path d="M8 3v4M16 3v4"/><path d="M12 13v5M9.5 15.5h5"/>',
    "calendar-check":
      '<rect x="3.2" y="5" width="17.6" height="16" rx="2.6"/><path d="M3.2 10h17.6"/><path d="M8 3v4M16 3v4"/><path d="m9.2 15.4 2 2 3.8-3.8"/>',
    clock: '<circle cx="12" cy="12" r="8.8"/><path d="M12 6.8V12l3.4 2"/>',
    history:
      '<path d="M3.5 12a8.5 8.5 0 1 0 2.5-6"/><path d="M3.5 3.5v4.8h4.8"/><path d="M12 7.5V12l3 1.8"/>',
    hourglass:
      '<path d="M7 3h10M7 21h10"/><path d="M7 3v3.2c0 2 1.5 3.6 3.3 4.4L12 12l1.7-1.4C15.5 9.8 17 8.2 17 6.2V3"/><path d="M7 21v-3.2c0-2 1.5-3.6 3.3-4.4L12 12l1.7 1.4c1.8.8 3.3 2.4 3.3 4.4V21"/>',

    /* — comunicação — */
    video:
      '<rect x="2.8" y="6" width="12.8" height="12" rx="2.6"/><path d="m15.6 10.6 5.6-3.4v9.6l-5.6-3.4z"/>',
    "video-off":
      '<path d="M15.6 10.6 21.2 7.2v9.6l-4.3-2.6"/><path d="M12.8 6h-.2M5.4 6H5.4A2.6 2.6 0 0 0 2.8 8.6v6.8A2.6 2.6 0 0 0 5.4 18h7.6a2.6 2.6 0 0 0 2.6-2.6V13"/><path d="M3 3l18 18"/>',
    mic: '<rect x="9.4" y="2.8" width="5.2" height="10.4" rx="2.6"/><path d="M5.6 11.4a6.4 6.4 0 0 0 12.8 0"/><path d="M12 17.8v3.4M8.6 21.2h6.8"/>',
    "mic-off":
      '<path d="M14.6 6v-.6a2.6 2.6 0 0 0-5.2 0v4.2"/><path d="M9.4 13.2a2.6 2.6 0 0 0 5.2-.6"/><path d="M5.6 11.4a6.4 6.4 0 0 0 9.7 5.5M18.4 12.6v-1.2"/><path d="M12 17.8v3.4M8.6 21.2h6.8"/><path d="M3 3l18 18"/>',
    phone:
      '<path d="M21.3 17v2.4a1.8 1.8 0 0 1-2 1.8 17.8 17.8 0 0 1-7.7-2.8A17.4 17.4 0 0 1 6.3 13a17.8 17.8 0 0 1-2.8-7.8 1.8 1.8 0 0 1 1.8-2h2.4a1.8 1.8 0 0 1 1.8 1.5c.1 1 .35 1.9.7 2.8a1.8 1.8 0 0 1-.4 1.9L8.7 10.6a14.2 14.2 0 0 0 5.3 5.3l1.2-1.1a1.8 1.8 0 0 1 1.9-.4c.9.35 1.8.6 2.8.7a1.8 1.8 0 0 1 1.5 1.9z"/>',
    "phone-off":
      '<path d="M15.9 14.4a1.8 1.8 0 0 1 1.9-.4c.9.35 1.8.6 2.8.7a1.8 1.8 0 0 1 1.5 1.9v2.3a1.8 1.8 0 0 1-2 1.8 17.8 17.8 0 0 1-7.7-2.8"/><path d="M8.5 10.7a14.2 14.2 0 0 0 2.2 2.8"/><path d="M9.7 5.5a1.8 1.8 0 0 0-1.6-1.3H5.7a1.8 1.8 0 0 0-1.8 2c.2 1.7.6 3.3 1.3 4.8"/><path d="M3 3l18 18"/>',
    message:
      '<path d="M20.8 11.7a8.4 8.4 0 0 1-11.6 7.8L3.8 21l1.5-5.2A8.4 8.4 0 1 1 20.8 11.7z"/>',
    "message-dots":
      '<path d="M20.8 11.7a8.4 8.4 0 0 1-11.6 7.8L3.8 21l1.5-5.2A8.4 8.4 0 1 1 20.8 11.7z"/><circle cx="8.6" cy="12" r=".9" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r=".9" fill="currentColor" stroke="none"/><circle cx="15.4" cy="12" r=".9" fill="currentColor" stroke="none"/>',
    send: '<path d="m21.4 2.6-9.6 19-2.6-7.8-7.8-2.6z"/><path d="M21.4 2.6 9.2 13.8"/>',
    bell: '<path d="M18 9.5a6 6 0 1 0-12 0c0 5-2.3 6.6-2.3 6.6h16.6S18 14.5 18 9.5z"/><path d="M13.8 19.5a2.1 2.1 0 0 1-3.6 0"/>',
    mail: '<rect x="2.8" y="4.8" width="18.4" height="14.4" rx="2.6"/><path d="m3.4 7 8.6 6 8.6-6"/>',
    volume:
      '<path d="M11 4.8 6.4 8.9H3v6.2h3.4L11 19.2z"/><path d="M14.8 9.4a3.7 3.7 0 0 1 0 5.2"/><path d="M17.6 6.8a7.4 7.4 0 0 1 0 10.4"/>',
    monitor:
      '<rect x="2.6" y="4" width="18.8" height="13" rx="2.4"/><path d="M8.5 21h7M12 17.2V21"/>',
    "screen-share":
      '<rect x="2.6" y="4" width="18.8" height="13" rx="2.4"/><path d="M8.5 21h7M12 17.2V21"/><path d="M12 12.6V7.4M9.6 9.6 12 7.2l2.4 2.4"/>',
    wifi: '<path d="M2.5 9a15 15 0 0 1 19 0"/><path d="M5.8 12.6a10 10 0 0 1 12.4 0"/><path d="M9 16.1a5 5 0 0 1 6 0"/><circle cx="12" cy="19.6" r="1.1" fill="currentColor" stroke="none"/>',

    /* — documentos — */
    "file-text":
      '<path d="M13.6 3H7.2a2.2 2.2 0 0 0-2.2 2.2v13.6A2.2 2.2 0 0 0 7.2 21h9.6a2.2 2.2 0 0 0 2.2-2.2V8.4z"/><path d="M13.6 3v5.4H19"/><path d="M8.6 13h6.8M8.6 16.4h6.8"/>',
    "file-medical":
      '<path d="M13.6 3H7.2a2.2 2.2 0 0 0-2.2 2.2v13.6A2.2 2.2 0 0 0 7.2 21h9.6a2.2 2.2 0 0 0 2.2-2.2V8.4z"/><path d="M13.6 3v5.4H19"/><path d="M12 11.6v5.6M9.2 14.4h5.6"/>',
    clipboard:
      '<path d="M9 4.4H7.2A2.2 2.2 0 0 0 5 6.6v12.2A2.2 2.2 0 0 0 7.2 21h9.6a2.2 2.2 0 0 0 2.2-2.2V6.6a2.2 2.2 0 0 0-2.2-2.2H15"/><rect x="8.8" y="2.4" width="6.4" height="4" rx="1.4"/><path d="M8.8 12h6.4M8.8 15.6h4.4"/>',
    print:
      '<path d="M7 9.4V3.4h10v6"/><path d="M7 18H5.4A2.4 2.4 0 0 1 3 15.6v-3.2a2.4 2.4 0 0 1 2.4-2.4h13.2a2.4 2.4 0 0 1 2.4 2.4v3.2a2.4 2.4 0 0 1-2.4 2.4H17"/><rect x="7" y="14" width="10" height="6.6" rx="1.4"/>',
    download:
      '<path d="M12 3.6v10.8"/><path d="m7.6 10.4 4.4 4.4 4.4-4.4"/><path d="M4.6 19.6h14.8"/>',
    upload:
      '<path d="M12 15.4V4.6"/><path d="m7.6 9 4.4-4.4L16.4 9"/><path d="M4.6 19.6h14.8"/>',
    edit: '<path d="M16.4 3.6a2.2 2.2 0 0 1 3.1 3.1L8.2 18l-4.3 1.2L5.1 15z"/><path d="m14.6 5.4 3.1 3.1"/>',
    trash:
      '<path d="M4 6.8h16"/><path d="M9.4 6.8V4.6h5.2v2.2"/><path d="m6.6 6.8 1 13.2h8.8l1-13.2"/><path d="M10.4 10.8v5.4M13.6 10.8v5.4"/>',
    copy: '<rect x="8.4" y="8.4" width="12" height="12" rx="2.2"/><path d="M15.6 5.6v-.8a2.2 2.2 0 0 0-2.2-2.2H5.8a2.2 2.2 0 0 0-2.2 2.2v7.6a2.2 2.2 0 0 0 2.2 2.2h.8"/>',
    qr: '<rect x="3.4" y="3.4" width="6.4" height="6.4" rx="1.4"/><rect x="14.2" y="3.4" width="6.4" height="6.4" rx="1.4"/><rect x="3.4" y="14.2" width="6.4" height="6.4" rx="1.4"/><path d="M14.2 14.2h3v3h-3zM20.6 14.2v3M17.6 20.6h3M14.2 20.6h.01"/>',
    book: '<path d="M4.2 4.6A2.2 2.2 0 0 1 6.4 2.4h13.4v15H6.4a2.2 2.2 0 0 0-2.2 2.2z"/><path d="M4.2 19.6a2.2 2.2 0 0 1 2.2-2.2h13.4v4.2H6.4a2.2 2.2 0 0 1-2.2-2z"/>',

    /* — dados / gestão — */
    "bar-chart":
      '<path d="M3.4 20.6h17.2"/><path d="M6.6 20.6v-7.4M12 20.6V4.4M17.4 20.6v-11"/>',
    "line-chart":
      '<path d="M3.6 3.4v17.2h17"/><path d="m7 15.4 4-4.6 3 2.6 5.4-6.4"/>',
    "pie-chart":
      '<path d="M21 13.4A9 9 0 1 1 10.6 3v9.4H21z"/><path d="M14.2 3.4A9 9 0 0 1 20.6 9.8h-6.4z"/>',
    "trending-up": '<path d="m3.6 17 6-6 4 4 6.8-7.4"/><path d="M15.4 7.6h5v5"/>',
    "trending-down":
      '<path d="m3.6 7 6 6 4-4 6.8 7.4"/><path d="M15.4 16.4h5v-5"/>',
    target:
      '<circle cx="12" cy="12" r="8.6"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none"/>',
    award:
      '<circle cx="12" cy="9" r="5.6"/><path d="m8.6 13.8-1.4 7.2 4.8-2.6 4.8 2.6-1.4-7.2"/>',
    layers:
      '<path d="m12 3 8.6 4.6L12 12.2 3.4 7.6z"/><path d="m3.4 12 8.6 4.6 8.6-4.6"/><path d="m3.4 16.4 8.6 4.6 8.6-4.6"/>',
    sliders:
      '<path d="M4 7h7M15 7h5M4 17h5M13 17h7M4 12h11M19 12h1"/><circle cx="13" cy="7" r="2"/><circle cx="11" cy="17" r="2"/><circle cx="17" cy="12" r="2"/>',
    building:
      '<path d="M4 21V7l8-4 8 4v14"/><path d="M3 21h18"/><path d="M9.6 21v-5h4.8v5"/><path d="M8.4 10.4h.01M12 10.4h.01M15.6 10.4h.01M8.4 13.6h.01M15.6 13.6h.01"/>',
    "map-pin":
      '<path d="M20 10.4c0 6-8 11.8-8 11.8s-8-5.8-8-11.8a8 8 0 1 1 16 0z"/><circle cx="12" cy="10.2" r="2.9"/>',
    globe:
      '<circle cx="12" cy="12" r="9"/><path d="M3.2 12h17.6"/><path d="M12 3a14.5 14.5 0 0 1 0 18 14.5 14.5 0 0 1 0-18z"/>',

    /* — segurança / conta — */
    lock: '<rect x="4.4" y="10.2" width="15.2" height="10.6" rx="2.6"/><path d="M7.8 10.2V7a4.2 4.2 0 0 1 8.4 0v3.2"/><path d="M12 14.6v2"/>',
    unlock:
      '<rect x="4.4" y="10.2" width="15.2" height="10.6" rx="2.6"/><path d="M7.8 10.2V7a4.2 4.2 0 0 1 8.1-1.5"/>',
    key: '<circle cx="7.6" cy="15.6" r="3.8"/><path d="m10.4 13 8.4-8.4"/><path d="m16.2 7.2 2.4 2.4M14 9.4l2.4 2.4"/>',
    eye: '<path d="M2.6 12S6.2 5.6 12 5.6 21.4 12 21.4 12 17.8 18.4 12 18.4 2.6 12 2.6 12z"/><circle cx="12" cy="12" r="3"/>',
    "eye-off":
      '<path d="M9.6 6a9.4 9.4 0 0 1 2.4-.3c5.8 0 9.4 6.3 9.4 6.3a16 16 0 0 1-2.8 3.6M6.2 7.4A16 16 0 0 0 2.6 12S6.2 18.4 12 18.4a9.6 9.6 0 0 0 3.6-.7"/><path d="M10 10a2.9 2.9 0 0 0 4 4"/><path d="M3 3l18 18"/>',
    "log-out":
      '<path d="M15.4 16.6 20 12l-4.6-4.6"/><path d="M20 12H9.2"/><path d="M12 20.4H6.6a2.2 2.2 0 0 1-2.2-2.2V5.8a2.2 2.2 0 0 1 2.2-2.2H12"/>',
    "log-in":
      '<path d="M11 16.6 15.6 12 11 7.4"/><path d="M15.6 12H4.8"/><path d="M12 3.6h5.4a2.2 2.2 0 0 1 2.2 2.2v12.4a2.2 2.2 0 0 1-2.2 2.2H12"/>',

    /* — feedback — */
    star: '<path d="m12 3.4 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17.4 6.6 20.3l1-6.1L3.2 9.9l6.1-.9z"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5.6M12 7.6h.01"/>',
    "alert-circle":
      '<circle cx="12" cy="12" r="9"/><path d="M12 7.4v5.4M12 16.4h.01"/>',
    "alert-triangle":
      '<path d="M10.3 4.2 2.7 17.4a2 2 0 0 0 1.7 3h15.2a2 2 0 0 0 1.7-3L13.7 4.2a2 2 0 0 0-3.4 0z"/><path d="M12 9.4v4M12 16.8h.01"/>',
    "help-circle":
      '<circle cx="12" cy="12" r="9"/><path d="M9.6 9.4a2.5 2.5 0 0 1 4.9.6c0 1.7-2.5 2.5-2.5 2.5v1"/><path d="M12 16.8h.01"/>',
    sparkles:
      '<path d="m12 2.8 1.8 4.9 4.9 1.8-4.9 1.8L12 16.2l-1.8-4.9-4.9-1.8 4.9-1.8z"/><path d="m18.6 15 .9 2.3 2.3.9-2.3.9-.9 2.3-.9-2.3-2.3-.9 2.3-.9z"/><path d="m5 3 .6 1.6L7.2 5.2l-1.6.6L5 7.4l-.6-1.6-1.6-.6 1.6-.6z"/>',
    zap: '<path d="m13.4 2.4-9 11.2h6.4l-1.4 8 9-11.2h-6.4z"/>',
    activity: '<path d="M3 12h4.4l2.6-7 4 14 2.6-7H21"/>',
    thumbs:
      '<path d="M7 21V10.6l4.4-7.6a2.3 2.3 0 0 1 3.3 2.9l-1.3 3.2h4.9a2.2 2.2 0 0 1 2.1 2.8l-2 7A2.2 2.2 0 0 1 16.3 21z"/><rect x="2.6" y="10.6" width="4.4" height="10.4" rx="1.4"/>',

    /* — interface — */
    sun: '<circle cx="12" cy="12" r="4.2"/><path d="M12 2.6v2.6M12 18.8v2.6M2.6 12h2.6M18.8 12h2.6M5.3 5.3l1.9 1.9M16.8 16.8l1.9 1.9M18.7 5.3l-1.9 1.9M7.2 16.8l-1.9 1.9"/>',
    moon: '<path d="M20.6 14.4A8.7 8.7 0 0 1 9.6 3.4a8.7 8.7 0 1 0 11 11z"/>',
    contrast:
      '<circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor" stroke="none"/>',
    type: '<path d="M4.4 7V4.8h15.2V7"/><path d="M12 4.8v14.4"/><path d="M8.8 19.2h6.4"/>',
    maximize:
      '<path d="M8.4 3.4H4.8a1.4 1.4 0 0 0-1.4 1.4v3.6"/><path d="M15.6 3.4h3.6a1.4 1.4 0 0 1 1.4 1.4v3.6"/><path d="M20.6 15.6v3.6a1.4 1.4 0 0 1-1.4 1.4h-3.6"/><path d="M3.4 15.6v3.6a1.4 1.4 0 0 0 1.4 1.4h3.6"/>',
    play: '<path d="M7.4 4.6 19 12 7.4 19.4z"/>',
    pause: '<rect x="6.6" y="4.6" width="3.8" height="14.8" rx="1.3"/><rect x="13.6" y="4.6" width="3.8" height="14.8" rx="1.3"/>',
    settings:
      '<path d="M4 7h7M15 7h5M4 17h5M13 17h7M4 12h11M19 12h1"/><circle cx="13" cy="7" r="2"/><circle cx="11" cy="17" r="2"/><circle cx="17" cy="12" r="2"/>',
    "credit-card":
      '<rect x="2.6" y="5" width="18.8" height="14" rx="2.6"/><path d="M2.6 9.8h18.8"/><path d="M6.4 14.6h3.4"/>',
    paperclip:
      '<path d="M20 11.4 12.3 19a5 5 0 0 1-7.1-7.1l8.2-8.2a3.3 3.3 0 1 1 4.7 4.7l-8.2 8.2a1.7 1.7 0 0 1-2.3-2.3l7.5-7.6"/>',
    list: '<path d="M8.6 6.4h12M8.6 12h12M8.6 17.6h12"/><circle cx="4.4" cy="6.4" r="1.3" fill="currentColor" stroke="none"/><circle cx="4.4" cy="12" r="1.3" fill="currentColor" stroke="none"/><circle cx="4.4" cy="17.6" r="1.3" fill="currentColor" stroke="none"/>',
    inbox:
      '<path d="M21 12.6h-5l-1.6 2.8H9.6L8 12.6H3"/><path d="M6.1 4.8h11.8a2 2 0 0 1 1.8 1.1l3.1 6.7v5.2a2.2 2.2 0 0 1-2.2 2.2H4.4a2.2 2.2 0 0 1-2.2-2.2v-5.2l3.1-6.7a2 2 0 0 1 1.8-1.1z"/>',
    bookmark: '<path d="M18.4 20.6 12 16.2l-6.4 4.4V5.6a2.2 2.2 0 0 1 2.2-2.2h8.4a2.2 2.2 0 0 1 2.2 2.2z"/>',
  };

  var SPRITE_ID = "crimed-icon-sprite";

  function buildSprite() {
    if (document.getElementById(SPRITE_ID)) return;
    var parts = [];
    for (var name in P) {
      if (!Object.prototype.hasOwnProperty.call(P, name)) continue;
      parts.push(
        '<symbol id="i-' + name + '" viewBox="0 0 24 24">' + P[name] + "</symbol>"
      );
    }
    var holder = document.createElement("div");
    holder.id = SPRITE_ID;
    holder.setAttribute("aria-hidden", "true");
    holder.style.cssText =
      "position:absolute;width:0;height:0;overflow:hidden;pointer-events:none";
    holder.innerHTML =
      '<svg xmlns="http://www.w3.org/2000/svg">' + parts.join("") + "</svg>";
    (document.body || document.documentElement).appendChild(holder);
  }

  /** Retorna o HTML de um ícone. */
  function svg(name, cls) {
    if (!P[name]) name = "info";
    return (
      '<svg class="ico ' +
      (cls || "") +
      '" aria-hidden="true" focusable="false"><use href="#i-' +
      name +
      '"></use></svg>'
    );
  }

  /** Substitui todos os <i data-ico="x"> da página por SVGs. */
  function hydrate(root) {
    var nodes = (root || document).querySelectorAll("[data-ico]");
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      var name = el.getAttribute("data-ico");
      var extra = el.getAttribute("class") || "";
      var tmp = document.createElement("div");
      tmp.innerHTML = svg(name, extra.replace(/\bico\b/, "").trim());
      var node = tmp.firstChild;
      if (el.hasAttribute("data-tip")) {
        node.setAttribute("data-tip", el.getAttribute("data-tip"));
      }
      el.parentNode.replaceChild(node, el);
    }
  }

  function init() {
    buildSprite();
    hydrate(document);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  global.Icon = { svg: svg, hydrate: hydrate, names: Object.keys(P) };
})(window);
