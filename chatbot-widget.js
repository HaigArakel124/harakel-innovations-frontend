/*!
 * Harakel Innovations — Chatbot Widget v1.0
 * Embed on any website with:
 *
 *   <script>
 *     window.HarakelChatbot = {
 *       client_id: 'YOUR_CLIENT_ID',
 *       api_url:   'https://web-production-608a8.up.railway.app', // optional
 *       bot_name:  'Aria',   // optional override
 *       brand_color: '#6c63ff', // optional override
 *     };
 *   </script>
 *   <script src="chatbot-widget.js"></script>
 */
(function () {
  'use strict';

  /* ── Config ─────────────────────────────────────────────────────────────── */
  var cfg = window.HarakelChatbot || {};
  // Support data-client-id / data-api-url attributes on the <script> tag
  var _scriptEl = document.currentScript || (function () {
    var s = document.getElementsByTagName('script');
    return s[s.length - 1];
  }());
  var CLIENT_ID = cfg.client_id || (_scriptEl && _scriptEl.getAttribute('data-client-id')) || '';
  var API_URL   = (cfg.api_url || (_scriptEl && _scriptEl.getAttribute('data-api-url')) || 'https://web-production-608a8.up.railway.app').replace(/\/$/, '');
  var SESSION_ID  = 'hk_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);

  var botName    = cfg.bot_name    || 'Aria';
  var brandColor = cfg.brand_color || '#6c63ff';
  var isOpen     = false;
  var leadCaptured = false;

  /* ── Helpers ─────────────────────────────────────────────────────────────── */
  function esc(s) {
    return String(s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function timeNow() {
    return new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }

  /* ── Styles ──────────────────────────────────────────────────────────────── */
  function injectStyles(color) {
    var el = document.getElementById('hk-widget-styles');
    if (!el) {
      el = document.createElement('style');
      el.id = 'hk-widget-styles';
      document.head.appendChild(el);
    }
    el.textContent = [
      /* Bubble */
      '#hk-bubble{position:fixed;bottom:24px;right:24px;z-index:2147483646;',
      'width:56px;height:56px;border-radius:50%;background:COLOR;border:none;cursor:pointer;',
      'display:flex;align-items:center;justify-content:center;',
      'box-shadow:0 4px 20px COLOR44;transition:transform .2s,box-shadow .2s;',
      'font-size:22px;color:white;outline:none;}',
      '#hk-bubble:hover{transform:scale(1.08);box-shadow:0 6px 28px COLOR66;}',
      '#hk-bubble.hk-open{background:#2a2a36;box-shadow:0 2px 12px rgba(0,0,0,.4);}',

      /* Widget */
      '#hk-widget{position:fixed;bottom:92px;right:24px;z-index:2147483645;',
      'width:360px;max-height:520px;border-radius:16px;',
      'background:#111118;border:1px solid rgba(255,255,255,.09);',
      'display:flex;flex-direction:column;overflow:hidden;',
      'box-shadow:0 16px 60px rgba(0,0,0,.65);',
      'transform:translateY(16px) scale(.97);opacity:0;pointer-events:none;',
      'transition:transform .22s cubic-bezier(.4,0,.2,1),opacity .22s cubic-bezier(.4,0,.2,1);',
      'font-family:"DM Sans",-apple-system,BlinkMacSystemFont,sans-serif;}',
      '#hk-widget.hk-open{transform:translateY(0) scale(1);opacity:1;pointer-events:all;}',

      /* Header */
      '#hk-header{padding:14px 16px;display:flex;align-items:center;gap:10px;',
      'background:COLOR18;border-bottom:1px solid rgba(255,255,255,.07);flex-shrink:0;}',
      '#hk-avatar{width:34px;height:34px;border-radius:50%;background:COLOR;',
      'display:flex;align-items:center;justify-content:center;font-size:15px;flex-shrink:0;}',
      '#hk-header-text{flex:1;min-width:0;}',
      '#hk-bot-name{font-size:14px;font-weight:600;color:#f0f0f5;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}',
      '#hk-status{font-size:11px;color:#00d9a3;display:flex;align-items:center;gap:4px;}',
      '#hk-status-dot{width:6px;height:6px;border-radius:50%;background:#00d9a3;flex-shrink:0;}',
      '#hk-close{background:transparent;border:none;cursor:pointer;',
      'color:#5a5a72;font-size:18px;line-height:1;padding:4px;transition:color .15s;',
      'display:flex;align-items:center;justify-content:center;flex-shrink:0;}',
      '#hk-close:hover{color:#f0f0f5;}',

      /* Messages */
      '#hk-messages{flex:1;overflow-y:auto;padding:16px;',
      'display:flex;flex-direction:column;gap:10px;}',
      '#hk-messages::-webkit-scrollbar{width:4px;}',
      '#hk-messages::-webkit-scrollbar-track{background:transparent;}',
      '#hk-messages::-webkit-scrollbar-thumb{background:rgba(255,255,255,.1);border-radius:2px;}',

      '.hk-msg{display:flex;gap:8px;align-items:flex-end;max-width:88%;}',
      '.hk-msg-bot{align-self:flex-start;}',
      '.hk-msg-user{align-self:flex-end;flex-direction:row-reverse;}',
      '.hk-bbl{padding:10px 13px;border-radius:14px;font-size:13px;line-height:1.5;',
      'color:#f0f0f5;word-break:break-word;white-space:pre-wrap;}',
      '.hk-msg-bot .hk-bbl{background:#1e1e28;border-radius:4px 14px 14px 14px;}',
      '.hk-msg-user .hk-bbl{background:COLOR;border-radius:14px 4px 14px 14px;}',
      '.hk-time{font-size:10px;color:#5a5a72;flex-shrink:0;margin-bottom:2px;}',
      '.hk-icon{width:24px;height:24px;border-radius:50%;background:COLOR22;',
      'display:flex;align-items:center;justify-content:center;font-size:12px;flex-shrink:0;}',

      /* Typing */
      '#hk-typing{display:none;align-self:flex-start;}',
      '.hk-dots{display:flex;gap:4px;padding:2px 0;}',
      '.hk-dot{width:7px;height:7px;border-radius:50%;background:#5a5a72;',
      'animation:hk-bounce 1.2s infinite;}',
      '.hk-dot:nth-child(2){animation-delay:.2s;}',
      '.hk-dot:nth-child(3){animation-delay:.4s;}',
      '@keyframes hk-bounce{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-5px)}}',

      /* Footer */
      '#hk-footer{padding:10px 12px;border-top:1px solid rgba(255,255,255,.07);',
      'display:flex;gap:8px;align-items:flex-end;flex-shrink:0;background:#18181f;}',
      '#hk-input{flex:1;background:#1e1e28;border:1px solid rgba(255,255,255,.09);',
      'border-radius:10px;padding:9px 12px;color:#f0f0f5;font-size:13px;',
      'font-family:inherit;outline:none;transition:border-color .15s;',
      'resize:none;line-height:1.4;max-height:80px;overflow-y:auto;}',
      '#hk-input:focus{border-color:COLOR66;}',
      '#hk-input::placeholder{color:#5a5a72;}',
      '#hk-send{width:36px;height:36px;border-radius:10px;background:COLOR;border:none;',
      'cursor:pointer;display:flex;align-items:center;justify-content:center;',
      'flex-shrink:0;transition:opacity .15s,transform .1s;color:white;font-size:14px;}',
      '#hk-send:hover{opacity:.88;}',
      '#hk-send:active{transform:scale(.92);}',
      '#hk-send:disabled{opacity:.35;cursor:default;}',

      /* Branding */
      '#hk-branding{text-align:center;font-size:10px;color:#3a3a52;',
      'padding:5px;flex-shrink:0;background:#18181f;letter-spacing:.3px;}',

      /* Mobile */
      '@media(max-width:420px){',
      '#hk-widget{width:calc(100vw - 16px);right:8px;bottom:80px;}',
      '#hk-bubble{right:16px;bottom:16px;}}',
    ].join('').replace(/COLOR/g, color);
  }

  /* ── Build DOM ───────────────────────────────────────────────────────────── */
  function buildDOM() {
    /* Bubble */
    var bubble = document.createElement('button');
    bubble.id = 'hk-bubble';
    bubble.setAttribute('aria-label', 'Open chat');
    bubble.setAttribute('aria-expanded', 'false');
    bubble.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>';
    document.body.appendChild(bubble);

    /* Widget */
    var widget = document.createElement('div');
    widget.id = 'hk-widget';
    widget.setAttribute('role', 'dialog');
    widget.setAttribute('aria-label', 'Chat with ' + botName);
    widget.innerHTML =
      '<div id="hk-header">' +
        '<div id="hk-avatar">🤖</div>' +
        '<div id="hk-header-text">' +
          '<div id="hk-bot-name">' + esc(botName) + '</div>' +
          '<div id="hk-status"><div id="hk-status-dot"></div>Online now</div>' +
        '</div>' +
        '<button id="hk-close" aria-label="Close chat">' +
          '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
        '</button>' +
      '</div>' +
      '<div id="hk-messages" role="log" aria-live="polite" aria-atomic="false"></div>' +
      '<div id="hk-footer">' +
        '<textarea id="hk-input" rows="1" placeholder="Type a message..." aria-label="Chat message"></textarea>' +
        '<button id="hk-send" aria-label="Send">' +
          '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>' +
        '</button>' +
      '</div>' +
      '<div id="hk-branding">Powered by Harakel Innovations</div>';
    document.body.appendChild(widget);
  }

  /* ── Messages ────────────────────────────────────────────────────────────── */
  function appendMsg(text, role) {
    var msgs   = document.getElementById('hk-messages');
    var typing = document.getElementById('hk-typing');
    var div    = document.createElement('div');
    div.className = 'hk-msg hk-msg-' + role;

    if (role === 'bot') {
      div.innerHTML =
        '<div class="hk-icon">🤖</div>' +
        '<div><div class="hk-bbl">' + esc(text) + '</div>' +
        '<div class="hk-time">' + timeNow() + '</div></div>';
    } else {
      div.innerHTML =
        '<div><div class="hk-bbl">' + esc(text) + '</div>' +
        '<div class="hk-time" style="text-align:right">' + timeNow() + '</div></div>';
    }

    msgs.insertBefore(div, typing || null);
    msgs.scrollTop = msgs.scrollHeight;
  }

  function showTyping(show) {
    var t    = document.getElementById('hk-typing');
    var msgs = document.getElementById('hk-messages');
    if (t) t.style.display = show ? 'flex' : 'none';
    if (msgs) msgs.scrollTop = msgs.scrollHeight;
  }

  /* ── Send ────────────────────────────────────────────────────────────────── */
  function sendMessage(text) {
    text = (text || '').trim();
    if (!text || !CLIENT_ID) return;

    var input   = document.getElementById('hk-input');
    var sendBtn = document.getElementById('hk-send');
    input.value = '';
    input.style.height = 'auto';
    sendBtn.disabled = true;

    appendMsg(text, 'user');
    showTyping(true);

    fetch(API_URL + '/api/chatbot/message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message:    text,
        client_id:  CLIENT_ID,
        session_id: SESSION_ID,
      }),
    })
    .then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    })
    .then(function (data) {
      showTyping(false);
      appendMsg(data.response || "I didn't catch that — could you rephrase?", 'bot');
      if (data.lead_captured && !leadCaptured) leadCaptured = true;
    })
    .catch(function () {
      showTyping(false);
      appendMsg("Sorry, I'm having trouble connecting right now. Please try again in a moment.", 'bot');
    })
    .finally(function () {
      sendBtn.disabled = false;
      document.getElementById('hk-input').focus();
    });
  }

  /* ── Toggle ──────────────────────────────────────────────────────────────── */
  function openWidget() {
    isOpen = true;
    document.getElementById('hk-widget').classList.add('hk-open');
    var b = document.getElementById('hk-bubble');
    b.classList.add('hk-open');
    b.setAttribute('aria-expanded', 'true');
    b.setAttribute('aria-label', 'Close chat');
    b.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
    setTimeout(function () { document.getElementById('hk-input').focus(); }, 230);
  }

  function closeWidget() {
    isOpen = false;
    document.getElementById('hk-widget').classList.remove('hk-open');
    var b = document.getElementById('hk-bubble');
    b.classList.remove('hk-open');
    b.setAttribute('aria-expanded', 'false');
    b.setAttribute('aria-label', 'Open chat');
    b.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>';
  }

  /* ── Init ────────────────────────────────────────────────────────────────── */
  function init() {
    injectStyles(brandColor);
    buildDOM();

    /* Typing indicator (appended to #hk-messages) */
    var msgs       = document.getElementById('hk-messages');
    var typingDiv  = document.createElement('div');
    typingDiv.id   = 'hk-typing';
    typingDiv.className = 'hk-msg hk-msg-bot';
    typingDiv.style.display = 'none';
    typingDiv.innerHTML =
      '<div class="hk-icon">🤖</div>' +
      '<div class="hk-bbl"><div class="hk-dots">' +
      '<div class="hk-dot"></div><div class="hk-dot"></div><div class="hk-dot"></div>' +
      '</div></div>';
    msgs.appendChild(typingDiv);

    /* Greeting */
    appendMsg('Hi! I\'m ' + botName + '. How can I help you today?', 'bot');

    /* Events */
    document.getElementById('hk-bubble').addEventListener('click', function () {
      isOpen ? closeWidget() : openWidget();
    });
    document.getElementById('hk-close').addEventListener('click', closeWidget);
    document.getElementById('hk-send').addEventListener('click', function () {
      sendMessage(document.getElementById('hk-input').value);
    });
    document.getElementById('hk-input').addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage(this.value);
      }
    });
    document.getElementById('hk-input').addEventListener('input', function () {
      this.style.height = 'auto';
      this.style.height = Math.min(this.scrollHeight, 80) + 'px';
    });
  }

  /* ── Bootstrap: fetch client config, then init ───────────────────────────── */
  function bootstrap() {
    if (!CLIENT_ID) {
      console.warn('[HarakelChatbot] No client_id set in window.HarakelChatbot — widget will use defaults.');
      init();
      return;
    }

    fetch(API_URL + '/api/clients/')
      .then(function (res) { return res.json(); })
      .then(function (data) {
        var match = (data.clients || []).filter(function (c) { return c.id === CLIENT_ID; })[0];
        if (match) {
          if (match.bot_name    && !cfg.bot_name)    botName    = match.bot_name;
          if (match.brand_color && !cfg.brand_color) brandColor = match.brand_color;
        }
      })
      .catch(function () { /* silently fall back to defaults */ })
      .finally(function () { init(); });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap);
  } else {
    bootstrap();
  }

}());
