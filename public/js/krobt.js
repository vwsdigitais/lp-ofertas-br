/* krobt.js — KROB Tracker v1.0
 * Orquestrador cliente: UUID first-party, cookie _krob_eid,
 * fetch/beacon para /api/capi (dedup com Meta Conversions API).
 */
(function () {
  'use strict';

  /* ---------- UUID generator ---------- */
  function generateId() {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    // Fallback: timestamp + random (não é RFC4122 mas é único o suficiente)
    return (
      Date.now().toString(36) +
      '-' +
      Math.random().toString(36).slice(2, 10) +
      '-' +
      Math.random().toString(36).slice(2, 10)
    );
  }

  /* ---------- Cookie helpers ---------- */
  function getCookie(name) {
    var match = document.cookie.match(
      new RegExp('(?:^|;\\s*)' + name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '=([^;]*)')
    );
    return match ? decodeURIComponent(match[1]) : '';
  }

  function setKrobCookie(id) {
    document.cookie =
      '_krob_eid=' +
      encodeURIComponent(id) +
      '; Max-Age=15552000; Path=/; SameSite=Lax; Secure';
  }

  /* ---------- Init: gera pageViewEventId e seta cookie ---------- */
  var pageViewEventId = generateId();
  setKrobCookie(pageViewEventId);

  /* ---------- getUserData ---------- */
  function getUserData() {
    return {
      fbp: getCookie('_fbp'),
      fbc: getCookie('_fbc'),
      external_id: getCookie('_krob_eid'),
    };
  }

  /* ---------- sendEvent (fetch, retorna eventId) ---------- */
  function sendEvent(eventName, customData, opts) {
    opts = opts || {};
    var eventId = opts.eventId || generateId();
    var payload = {
      event_name: eventName,
      event_id: eventId,
      event_time: Math.floor(Date.now() / 1000),
      event_source_url: window.location.href,
      user_data: getUserData(),
      custom_data: customData || {},
    };
    fetch('/api/capi', {
      method: 'POST',
      keepalive: true,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).catch(function (err) {
      console.error('[krobt] sendEvent error:', err);
    });
    return eventId;
  }

  /* ---------- sendBeacon (fire-and-forget, sobrevive ao redirect) ---------- */
  function sendBeacon(eventName, customData, eventId) {
    eventId = eventId || generateId();
    var payload = {
      event_name: eventName,
      event_id: eventId,
      event_time: Math.floor(Date.now() / 1000),
      event_source_url: window.location.href,
      user_data: getUserData(),
      custom_data: customData || {},
    };
    var blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/capi', blob);
    } else {
      // Fallback para browsers sem sendBeacon (raro em 2026)
      fetch('/api/capi', {
        method: 'POST',
        keepalive: true,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).catch(function (err) {
        console.error('[krobt] sendBeacon fallback error:', err);
      });
    }
    return eventId;
  }

  /* ---------- Expõe API global ---------- */
  window.krobTracker = {
    pageViewEventId: pageViewEventId,
    generateId: generateId,
    getUserData: getUserData,
    sendEvent: sendEvent,
    sendBeacon: sendBeacon,
  };
})();
