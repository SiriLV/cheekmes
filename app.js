// ============================================================
// CheekMes v7.2 Stable
// ============================================================
(() => {
  'use strict';
  const VERSION = '7.2-stable';
  const CFG = window.CHEEKMES_CONFIG || {};
  const API_URL = String(CFG.API_URL || '').replace(/\/$/, '');
  const MAX_FILE_BYTES = Number(CFG.MAX_FILE_BYTES || 650 * 1024);
  const DEFAULT_SYNC_MS = Number(CFG.DEFAULT_SYNC_MS || 25000);
  const KDF_ITERATIONS = Number(CFG.KDF_ITERATIONS || 310000);
  const enc = new TextEncoder();
  const dec = new TextDecoder();
  const S = {
    account: null,
    user: null,
    vaultKey: null,
    privateEcdh: null,
    privateSign: null,
    chats: [],
    users: {},
    currentChat: null,
    chatKeys: new Map(),
    groupInviteKeys: new Map(),
    messages: new Map(),
    lastTs: new Map(),
    pendingFile: null,
    syncTimer: null,
    decryptCache: new Map(),
    settings: loadSettings(),
    admin: { token: sessionStorage.getItem('cm7:adminToken') || '', tab: 'users', data: null }
  };

  const $ = (q, root = document) => root.querySelector(q);
  const $$ = (q, root = document) => [...root.querySelectorAll(q)];

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    applySettings();
    bindAuth();
    bindApp();
    bindSettings();
    bindAdmin();
    updateApiNotice();
    $('#loginUsername').value = localStorage.getItem('cm7:last_user') || '';
    window.addEventListener('online', () => toast('Сеть появилась. Синхронизирую…', 'ok'));
    window.addEventListener('offline', () => toast('Нет сети. Можно читать локальный кэш', 'warn'));
    if ('serviceWorker' in navigator && location.protocol === 'https:') {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    }
    document.addEventListener('visibilitychange', () => {
      if (S.user && !document.hidden) syncNow(true).catch(showErr);
      scheduleSync();
    });
  }

  // ---------------- bind UI ----------------
  function bindAuth() {
    $('#loginTab').onclick = () => switchAuth('login');
    $('#registerTab').onclick = () => switchAuth('register');
    $('#loginForm').addEventListener('submit', e => { e.preventDefault(); login().catch(showErr); });
    $('#registerForm').addEventListener('submit', e => { e.preventDefault(); register().catch(showErr); });
  }

  function bindApp() {
    $('#logoutBtn').onclick = logout;
    $('#newDmBtn').onclick = () => openDialog('dmDialog', '#dmUsername');
    $('#newGroupBtn').onclick = () => openDialog('groupDialog', '#groupNameInput');
    $('#joinGroupBtn').onclick = () => openDialog('joinDialog', '#joinChatId');
    $('#settingsBtn').onclick = () => openSettings();
    $('#refreshBtn').onclick = () => syncNow(true).catch(showErr);
    $('#backBtn').onclick = () => document.body.classList.remove('chat-open');
    $('#dmSubmit').onclick = () => createDm().catch(showErr);
    $('#groupSubmit').onclick = () => createGroup().catch(showErr);
    $('#joinSubmit').onclick = () => joinGroup().catch(showErr);
    $('#shareCopy').onclick = copyShare;
    $('#copyChatBtn').onclick = copyCurrentChat;
    $('#chatSearch').addEventListener('input', renderChatList);
    $('#fileBtn').onclick = () => $('#fileInput').click();
    $('#fileInput').addEventListener('change', onFilePicked);
    $('#clearFileBtn').onclick = clearPendingFile;
    $('#composer').addEventListener('submit', e => { e.preventDefault(); sendMessage().catch(showErr); });
    $('#msgInput').addEventListener('input', autoGrow);
    $('#msgInput').addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey && !isMobile()) {
        e.preventDefault();
        sendMessage().catch(showErr);
      }
    });
  }

  function bindSettings() {
    $('#closeSettings').onclick = () => closeDialog('settingsDialog');
    $('#saveSettings').onclick = saveSettingsFromDialog;
    $('#resetSettings').onclick = () => {
      localStorage.removeItem('cm7:settings');
      S.settings = loadSettings();
      applySettings();
      fillSettingsDialog();
      scheduleSync();
      toast('Настройки сброшены', 'ok');
    };
    $('#settingsExport').onclick = exportLocalBackup;
    $('#settingsImportBtn').onclick = () => $('#settingsImport').click();
    $('#settingsImport').addEventListener('change', importLocalBackup);
  }


  function bindAdmin() {
    const adminBtn = $('#adminBtn');
    if (adminBtn) adminBtn.onclick = () => openAdmin();
    const close = $('#adminClose');
    if (close) close.onclick = () => closeDialog('adminDialog');
    const form = $('#adminLoginForm');
    if (form) form.addEventListener('submit', e => { e.preventDefault(); adminLogin().catch(showErr); });
    const refresh = $('#adminRefresh');
    if (refresh) refresh.onclick = () => adminLoad().catch(showErr);
    const logout = $('#adminLogout');
    if (logout) logout.onclick = adminLogout;
    document.addEventListener('click', e => {
      const tab = e.target.closest('.admin-tab');
      if (tab) {
        S.admin.tab = tab.dataset.adminTab || 'users';
        renderAdmin();
      }
      const action = e.target.closest('[data-admin-action]');
      if (action) adminRunAction(action.dataset.adminAction, action.dataset).catch(showErr);
    });
  }

  function switchAuth(mode) {
    const login = mode === 'login';
    $('#loginTab').classList.toggle('active', login);
    $('#registerTab').classList.toggle('active', !login);
    $('#loginForm').classList.toggle('active', login);
    $('#registerForm').classList.toggle('active', !login);
  }

  function updateApiNotice() {
    const el = $('#apiNotice');
    if (!API_URL) {
      el.textContent = 'Сервер не настроен';
      el.className = 'node-status error';
    } else {
      el.textContent = 'Сервер подключён';
      el.className = 'node-status ok';
    }
  }

  // ---------------- auth ----------------
  async function register() {
    assertApi();
    const username = normalizeUsername($('#regUsername').value);
    const displayName = $('#regDisplayName').value.trim() || username;
    const password = $('#regPassword').value;
    const password2 = $('#regPassword2').value;

    if (!validUsername(username)) throw new Error('Username: 3–20 символов, только a-z, 0-9 и _');
    if (password.length < 10) throw new Error('Пароль минимум 10 символов');
    if (password !== password2) throw new Error('Пароли не совпадают');

    showLoader('Генерация ключей…');
    const salt = randBytes(16);
    const vaultKey = await deriveVaultKey(password, salt, KDF_ITERATIONS);
    const ecdh = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']);
    const sign = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);

    const privateEcdhJwk = await crypto.subtle.exportKey('jwk', ecdh.privateKey);
    const privateSignJwk = await crypto.subtle.exportKey('jwk', sign.privateKey);

    const body = {
      username,
      displayName,
      salt: bytesToB64u(salt),
      kdf: { name: 'PBKDF2-SHA256', iterations: KDF_ITERATIONS },
      publicEcdhJwk: await crypto.subtle.exportKey('jwk', ecdh.publicKey),
      publicSignJwk: await crypto.subtle.exportKey('jwk', sign.publicKey),
      encryptedPrivateEcdh: await aesEncryptJson(vaultKey, privateEcdhJwk),
      encryptedPrivateSign: await aesEncryptJson(vaultKey, privateSignJwk)
    };

    await publicApi('/register', { method: 'POST', body });
    hideLoader();
    toast('Аккаунт создан. Вход выполнен', 'ok');
    $('#loginUsername').value = username;
    $('#loginPassword').value = password;
    await login();
  }

  async function login() {
    assertApi();
    const username = normalizeUsername($('#loginUsername').value);
    const password = $('#loginPassword').value;
    if (!validUsername(username)) throw new Error('Введите корректный username');
    if (!password) throw new Error('Введите пароль');

    showLoader('Расшифровка ключей…');
    const { account } = await publicApi(`/account/${encodeURIComponent(username)}`);
    const iterations = Number(account.kdf?.iterations || KDF_ITERATIONS);
    const vaultKey = await deriveVaultKey(password, b64uToBytes(account.salt), iterations);

    let privateEcdhJwk, privateSignJwk;
    try {
      privateEcdhJwk = await aesDecryptJson(vaultKey, account.encryptedPrivateEcdh);
      privateSignJwk = await aesDecryptJson(vaultKey, account.encryptedPrivateSign);
    } catch (_) {
      throw new Error('Неверный пароль или повреждённые ключи аккаунта');
    }

    S.account = account;
    S.user = {
      username: account.username,
      displayName: account.displayName,
      publicEcdhJwk: account.publicEcdhJwk,
      publicSignJwk: account.publicSignJwk
    };
    S.users[account.username] = S.user;
    S.vaultKey = vaultKey;
    S.privateEcdh = await crypto.subtle.importKey('jwk', privateEcdhJwk, { name: 'ECDH', namedCurve: 'P-256' }, false, ['deriveBits']);
    S.privateSign = await crypto.subtle.importKey('jwk', privateSignJwk, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);

    localStorage.setItem('cm7:last_user', account.username);
    await loadLocalState();
    enterApp();
    await syncNow(true);
    scheduleSync();
    hideLoader();
  }

  function enterApp() {
    $('#authScreen').classList.remove('active');
    $('#appScreen').classList.add('active');
    $('#meName').textContent = S.user.displayName || S.user.username;
    $('#meUsername').textContent = '@' + S.user.username;
    $('#meAvatar').textContent = initials(S.user.displayName || S.user.username);
    renderChatList();
  }

  function logout() {
    if (S.syncTimer) clearTimeout(S.syncTimer);
    saveLocalState().catch(() => {});
    Object.assign(S, {
      account: null,
      user: null,
      vaultKey: null,
      privateEcdh: null,
      privateSign: null,
      chats: [],
      users: {},
      currentChat: null,
      pendingFile: null,
      syncTimer: null
    });
    S.chatKeys.clear();
    S.groupInviteKeys.clear();
    S.messages.clear();
    S.lastTs.clear();
    S.decryptCache.clear();
    document.body.classList.remove('chat-open');
    $('#appScreen').classList.remove('active');
    $('#authScreen').classList.add('active');
  }

  // ---------------- backend calls ----------------
  async function publicApi(path, { method = 'GET', body = null } = {}) {
    const bodyText = body ? JSON.stringify(body) : undefined;
    const r = await fetch(API_URL + path, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: bodyText
    });
    return parseResponse(r);
  }

  async function signedApi(path, { method = 'GET', body = null } = {}) {
    const bodyText = body ? JSON.stringify(body) : '';
    const bodyHash = await sha256Hex(bodyText);
    const time = String(Date.now());
    const fullUrl = new URL(API_URL + path);
    const signedPath = fullUrl.pathname + fullUrl.search;
    const canonical = `${method}\n${signedPath}\n${time}\n${bodyHash}`;
    const sig = await signText(canonical);
    const headers = {
      'X-CM-User': S.user.username,
      'X-CM-Time': time,
      'X-CM-Body': bodyHash,
      'X-CM-Sig': sig
    };
    if (body) headers['Content-Type'] = 'application/json';
    const r = await fetch(API_URL + path, { method, headers, body: body ? bodyText : undefined });
    return parseResponse(r);
  }


  async function adminApi(path, { method = 'GET', body = null } = {}) {
    const bodyText = body ? JSON.stringify(body) : undefined;
    const headers = {};
    if (body) headers['Content-Type'] = 'application/json';
    if (S.admin.token) headers['Authorization'] = 'Bearer ' + S.admin.token;
    const r = await fetch(API_URL + path, { method, headers, body: bodyText });
    return parseResponse(r);
  }

  async function parseResponse(r) {
    const text = await r.text();
    let data;
    try { data = text ? JSON.parse(text) : {}; } catch (_) { data = { error: text || `HTTP ${r.status}` }; }
    if (!r.ok) throw new Error(data.error || `HTTP ${r.status}`);
    return data;
  }

  // ---------------- sync/load reduction ----------------
  async function syncNow(force = false) {
    if (!S.user) return;
    if (!navigator.onLine && !force) return;

    const chatId = S.currentChat?.id || '';
    const after = chatId ? Number(S.lastTs.get(chatId) || 0) : 0;
    const path = `/sync?chatId=${encodeURIComponent(chatId)}&after=${encodeURIComponent(after)}`;
    const data = await signedApi(path);

    S.chats = data.chats || [];
    Object.assign(S.users, data.users || {});
    if (Array.isArray(data.messages) && chatId) mergeMessages(chatId, data.messages);
    await saveLocalState();
    renderChatList();
    if (S.currentChat) renderChat(S.currentChat);
  }

  function scheduleSync() {
    if (S.syncTimer) clearTimeout(S.syncTimer);
    if (!S.user) return;
    const visibleMs = Number(S.settings.syncMs || DEFAULT_SYNC_MS);
    const hiddenMs = Math.max(90000, visibleMs * 5);
    const ms = document.hidden ? hiddenMs : visibleMs;
    S.syncTimer = setTimeout(async () => {
      try { await syncNow(false); }
      catch (e) { console.warn('sync:', e.message); }
      scheduleSync();
    }, ms);
  }

  function mergeMessages(chatId, incoming) {
    const list = S.messages.get(chatId) || [];
    const byId = new Map(list.map(m => [m.id, m]));
    for (const msg of incoming) byId.set(msg.id, msg);
    const merged = [...byId.values()].sort((a, b) => Number(a.ts || 0) - Number(b.ts || 0));
    S.messages.set(chatId, merged);
    const last = merged[merged.length - 1];
    if (last) S.lastTs.set(chatId, Number(last.ts || 0));
  }

  // ---------------- chats ----------------
  async function createDm() {
    const target = normalizeUsername($('#dmUsername').value);
    if (!validUsername(target)) throw new Error('Введите username собеседника');
    showLoader('Создание диалога…');
    const { chat, user } = await signedApi('/dm', { method: 'POST', body: { target } });
    S.users[user.username] = user;
    upsertChat(chat);
    closeDialog('dmDialog');
    $('#dmUsername').value = '';
    await saveLocalState();
    openChat(chat.id);
    hideLoader();
  }

  async function createGroup() {
    const name = $('#groupNameInput').value.trim() || 'Новая группа';
    const raw = randBytes(32);
    const inviteKey = 'cmg_' + bytesToB64u(raw);
    const joinHash = await sha256Hex(inviteKey);
    showLoader('Создание группы…');
    const { chat } = await signedApi('/group', { method: 'POST', body: { name, joinHash } });
    upsertChat(chat);
    await saveGroupKey(chat.id, raw, inviteKey);
    closeDialog('groupDialog');
    $('#groupNameInput').value = '';
    await saveLocalState();
    openChat(chat.id);
    showShare(chat.id, inviteKey);
    hideLoader();
  }

  async function joinGroup() {
    const chatId = cleanChatId($('#joinChatId').value);
    const inviteKey = $('#joinChatKey').value.trim();
    if (!chatId || !inviteKey.startsWith('cmg_')) throw new Error('Введите ID группы и ключ cmg_...');
    const raw = b64uToBytes(inviteKey.slice(4));
    if (raw.length !== 32) throw new Error('Ключ группы повреждён');
    const joinHash = await sha256Hex(inviteKey);
    showLoader('Вход в группу…');
    const { chat } = await signedApi('/group/join', { method: 'POST', body: { chatId, joinHash } });
    upsertChat(chat);
    await saveGroupKey(chat.id, raw, inviteKey);
    closeDialog('joinDialog');
    $('#joinChatId').value = '';
    $('#joinChatKey').value = '';
    await saveLocalState();
    openChat(chat.id);
    hideLoader();
  }

  function upsertChat(chat) {
    const idx = S.chats.findIndex(c => c.id === chat.id);
    if (idx >= 0) S.chats[idx] = chat;
    else S.chats.unshift(chat);
    renderChatList();
  }

  async function openChat(chatId) {
    const chat = S.chats.find(c => c.id === chatId);
    if (!chat) return;
    S.currentChat = chat;
    document.body.classList.add('chat-open');
    $('#composer').classList.remove('hidden');
    $('#chatName').textContent = displayChatName(chat);
    $('#chatMeta').textContent = chat.type === 'dm' ? 'личный диалог' : `группа · ${chat.users.length}`;
    renderChat(chat);
    await syncNow(true).catch(showErr);
  }

  function renderChatList() {
    const q = ($('#chatSearch')?.value || '').trim().toLowerCase();
    const box = $('#chatList');
    box.innerHTML = '';
    const chats = S.chats
      .filter(c => displayChatName(c).toLowerCase().includes(q) || c.id.includes(q))
      .sort((a, b) => lastMessageTs(b.id) - lastMessageTs(a.id) || Number(b.updatedAt || 0) - Number(a.updatedAt || 0));

    if (!chats.length) {
      box.innerHTML = '<div class="empty-list">Нет чатов. Создай ЛС или группу</div>';
      return;
    }

    for (const chat of chats) {
      const last = lastMessagePreview(chat.id);
      const item = document.createElement('button');
      item.className = 'chat-item' + (S.currentChat?.id === chat.id ? ' active' : '');
      item.type = 'button';
      item.onclick = () => openChat(chat.id).catch(showErr);
      item.innerHTML = `
        <div class="chat-avatar ${chat.type}">${escapeHtml(initials(displayChatName(chat)))}</div>
        <div class="chat-info">
          <div class="chat-row"><b>${escapeHtml(displayChatName(chat))}</b><span>${last.time}</span></div>
          <p>${escapeHtml(last.text)}</p>
        </div>`;
      box.appendChild(item);
    }
  }

  function displayChatName(chat) {
    if (!chat) return '';
    if (chat.type === 'dm') {
      const other = (chat.users || []).find(u => u !== S.user?.username) || chat.users?.[0] || 'unknown';
      return S.users[other]?.displayName || '@' + other;
    }
    return chat.name || chat.id;
  }

  function lastMessagePreview(chatId) {
    const list = S.messages.get(chatId) || [];
    const msg = list[list.length - 1];
    if (!msg) return { text: 'Пока нет локальных сообщений', time: '' };
    const cached = S.decryptCache.get(msg.id);
    const text = cached?.file ? `📎 ${cached.file.name}` : cached?.text ? cached.text : 'Зашифрованное сообщение';
    return { text, time: fmtTime(msg.ts) };
  }
  function lastMessageTs(chatId) {
    const list = S.messages.get(chatId) || [];
    return Number(list[list.length - 1]?.ts || 0);
  }

  async function renderChat(chat) {
    const box = $('#messages');
    const list = S.messages.get(chat.id) || [];
    if (!list.length) {
      box.className = 'messages empty';
      box.innerHTML = `<div class="empty-state"><img src="icon.png" alt=""><h2>${escapeHtml(displayChatName(chat))}</h2><p>Пока тихо.</p></div>`;
      return;
    }
    box.className = 'messages';
    box.innerHTML = '';

    for (const msg of list) {
      const node = document.createElement('article');
      node.className = 'msg ' + (msg.sender === S.user.username ? 'own' : 'other');
      node.innerHTML = `<div class="msg-bubble"><div class="msg-top"><b>${escapeHtml(senderName(msg.sender))}</b><span>${fmtFull(msg.ts)}</span></div><div class="msg-body muted">Расшифровка…</div></div>`;
      box.appendChild(node);
      decryptMessage(chat, msg).then(payload => fillMessageNode(node, msg, payload)).catch(err => {
        const body = $('.msg-body', node);
        body.className = 'msg-body error-text';
        body.textContent = 'Не удалось расшифровать: ' + err.message;
      });
    }
    requestAnimationFrame(() => { box.scrollTop = box.scrollHeight; });
  }

  async function decryptMessage(chat, msg) {
    if (S.decryptCache.has(msg.id)) return S.decryptCache.get(msg.id);
    const key = await getChatKey(chat);
    const publicSignJwk = S.users[msg.sender]?.publicSignJwk;
    const verified = await verifyMessage(msg, publicSignJwk);
    const payload = await aesDecryptJson(key, msg.box);
    payload._verified = verified;
    S.decryptCache.set(msg.id, payload);
    return payload;
  }

  function fillMessageNode(node, msg, payload) {
    const body = $('.msg-body', node);
    const top = $('.msg-top', node);
    if (!payload._verified) {
      const badge = document.createElement('span');
      badge.className = 'sig bad';
      badge.textContent = 'не подтверждено';
      top.appendChild(badge);
    }

    body.className = 'msg-body';
    body.innerHTML = '';
    if (payload.text) {
      const p = document.createElement('p');
      p.textContent = payload.text;
      body.appendChild(p);
    }
    if (payload.file) {
      const f = payload.file;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'file-card';
      btn.innerHTML = `<span class="file-ico">${fileIcon(f.type)}</span><span><b>${escapeHtml(f.name)}</b><small>${escapeHtml(f.type || 'file')} · ${fmtSize(f.size || 0)}</small></span>`;
      btn.onclick = () => downloadDecryptedFile(f);
      body.appendChild(btn);
    }
  }

  function senderName(username) {
    return username === S.user?.username ? 'Вы' : (S.users[username]?.displayName || '@' + username);
  }

  // ---------------- sending ----------------
  async function sendMessage() {
    const text = $('#msgInput').value.trim();
    if (!S.currentChat) return;
    if (!text && !S.pendingFile) return;

    const chat = S.currentChat;
    const payload = { v: 7, type: S.pendingFile ? 'file' : 'text', text, createdAt: Date.now() };

    if (S.pendingFile) {
      if (S.pendingFile.size > MAX_FILE_BYTES) throw new Error(`Файл слишком большой для Gist-режима: максимум ${fmtSize(MAX_FILE_BYTES)}`);
      const bytes = new Uint8Array(await S.pendingFile.arrayBuffer());
      payload.file = {
        name: S.pendingFile.name,
        type: S.pendingFile.type || 'application/octet-stream',
        size: S.pendingFile.size,
        data: bytesToB64u(bytes)
      };
    }

    const key = await getChatKey(chat);
    const box = await aesEncryptJson(key, payload);
    const msg = {
      v: 7,
      id: `m_${Date.now().toString(36)}_${randomString(12)}`,
      chatId: chat.id,
      sender: S.user.username,
      ts: Date.now(),
      box,
      sig: ''
    };
    msg.sig = await signMessage(msg);

    $('#sendBtn').disabled = true;
    try {
      await signedApi('/messages', { method: 'POST', body: { message: msg } });
      mergeMessages(chat.id, [msg]);
      S.decryptCache.set(msg.id, { ...payload, _verified: true });
      $('#msgInput').value = '';
      autoGrow();
      clearPendingFile();
      await saveLocalState();
      renderChat(chat);
      renderChatList();
    } finally {
      $('#sendBtn').disabled = false;
    }
  }

  function onFilePicked() {
    const file = $('#fileInput').files?.[0];
    if (!file) return;
    if (file.size > MAX_FILE_BYTES) {
      $('#fileInput').value = '';
      showErr(new Error(`Файл больше лимита ${fmtSize(MAX_FILE_BYTES)}. В этой версии файлы идут через Gist`));
      return;
    }
    S.pendingFile = file;
    $('#fileBadge').classList.remove('hidden');
    $('#fileName').textContent = `${file.name} · ${fmtSize(file.size)}`;
  }

  function clearPendingFile() {
    S.pendingFile = null;
    $('#fileInput').value = '';
    $('#fileBadge').classList.add('hidden');
    $('#fileName').textContent = '';
  }

  function downloadDecryptedFile(file) {
    const bytes = b64uToBytes(file.data);
    const blob = new Blob([bytes], { type: file.type || 'application/octet-stream' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = file.name || 'file';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }

  // ---------------- keys ----------------
  async function getChatKey(chat) {
    if (S.chatKeys.has(chat.id)) return S.chatKeys.get(chat.id);
    if (chat.type === 'dm') {
      const other = (chat.users || []).find(u => u !== S.user.username);
      if (!S.users[other]) {
        const { user } = await publicApi(`/public/user/${encodeURIComponent(other)}`);
        S.users[other] = user;
      }
      const key = await deriveDmKey(chat, S.users[other].publicEcdhJwk);
      S.chatKeys.set(chat.id, key);
      return key;
    }
    throw new Error('Нет локального ключа группы. Войдите по ключу заново');
  }

  async function deriveDmKey(chat, otherPublicJwk) {
    const publicKey = await crypto.subtle.importKey('jwk', otherPublicJwk, { name: 'ECDH', namedCurve: 'P-256' }, false, []);
    const shared = await crypto.subtle.deriveBits({ name: 'ECDH', public: publicKey }, S.privateEcdh, 256);
    const hkdfKey = await crypto.subtle.importKey('raw', shared, 'HKDF', false, ['deriveKey']);
    const salt = await sha256Bytes(`cheekmes:v7:dm:${chat.id}:${chat.users.slice().sort().join(':')}`);
    return crypto.subtle.deriveKey({ name: 'HKDF', hash: 'SHA-256', salt, info: enc.encode('CheekMes DM AES-GCM') }, hkdfKey, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  }

  async function saveGroupKey(chatId, rawBytes, inviteKey) {
    const aes = await crypto.subtle.importKey('raw', rawBytes, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
    S.chatKeys.set(chatId, aes);
    S.groupInviteKeys.set(chatId, inviteKey);
    const store = getGroupKeyStore();
    store[chatId] = await aesEncryptJson(S.vaultKey, { raw: bytesToB64u(rawBytes), inviteKey });
    localStorage.setItem(groupStoreName(), JSON.stringify(store));
  }

  async function loadGroupKeys() {
    const store = getGroupKeyStore();
    for (const [chatId, box] of Object.entries(store)) {
      try {
        const payload = await aesDecryptJson(S.vaultKey, box);
        const raw = b64uToBytes(payload.raw);
        const aes = await crypto.subtle.importKey('raw', raw, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
        S.chatKeys.set(chatId, aes);
        if (payload.inviteKey) S.groupInviteKeys.set(chatId, payload.inviteKey);
      } catch (_) {}
    }
  }

  function groupStoreName() { return `cm7:groups:${S.user.username}`; }
  function getGroupKeyStore() {
    try { return JSON.parse(localStorage.getItem(groupStoreName()) || '{}'); }
    catch (_) { return {}; }
  }

  // ---------------- crypto primitives ----------------
  async function deriveVaultKey(password, saltBytes, iterations) {
    const base = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']);
    return crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt: saltBytes, iterations, hash: 'SHA-256' },
      base,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  async function aesEncryptJson(key, value) {
    const iv = randBytes(12);
    const data = enc.encode(JSON.stringify(value));
    const out = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, data);
    return { alg: 'AES-GCM-256', iv: bytesToB64u(iv), data: bytesToB64u(new Uint8Array(out)) };
  }

  async function aesDecryptJson(key, box) {
    const out = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: b64uToBytes(box.iv) }, key, b64uToBytes(box.data));
    return JSON.parse(dec.decode(out));
  }

  async function signText(text) {
    const sig = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, S.privateSign, enc.encode(text));
    return bytesToB64u(new Uint8Array(sig));
  }

  async function signMessage(msg) {
    const canonical = `${msg.id}|${msg.chatId}|${msg.sender}|${msg.ts}|${msg.box.iv}|${msg.box.data}`;
    return signText(canonical);
  }

  async function verifyMessage(msg, publicSignJwk) {
    if (!publicSignJwk) return false;
    try {
      const key = await crypto.subtle.importKey('jwk', publicSignJwk, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify']);
      const canonical = `${msg.id}|${msg.chatId}|${msg.sender}|${msg.ts}|${msg.box.iv}|${msg.box.data}`;
      return await crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, key, b64uToBytes(msg.sig), enc.encode(canonical));
    } catch (_) { return false; }
  }

  async function sha256Hex(text) {
    const bytes = await sha256Bytes(text);
    return [...bytes].map(b => b.toString(16).padStart(2, '0')).join('');
  }
  async function sha256Bytes(text) {
    return new Uint8Array(await crypto.subtle.digest('SHA-256', enc.encode(String(text))));
  }

  // ---------------- local state ----------------
  async function loadLocalState() {
    S.messages.clear();
    S.lastTs.clear();
    try {
      const raw = localStorage.getItem(`cm7:cache:${S.user.username}`);
      if (raw) {
        const data = JSON.parse(raw);
        for (const [chatId, list] of Object.entries(data.messages || {})) {
          S.messages.set(chatId, list);
          if (list.length) S.lastTs.set(chatId, Number(list[list.length - 1].ts || 0));
        }
      }
    } catch (_) {}
    await loadGroupKeys();
  }

  async function saveLocalState() {
    if (!S.user) return;
    const messages = {};
    for (const [chatId, list] of S.messages.entries()) messages[chatId] = list.slice(-300);
    localStorage.setItem(`cm7:cache:${S.user.username}`, JSON.stringify({ version: 7, messages, savedAt: Date.now() }));
  }

  function exportLocalBackup() {
    const payload = {
      version: 7,
      username: S.user?.username || null,
      settings: S.settings,
      groupKeys: S.user ? getGroupKeyStore() : {},
      cache: S.user ? JSON.parse(localStorage.getItem(`cm7:cache:${S.user.username}`) || '{}') : {},
      exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `cheekmes-backup-${payload.username || 'offline'}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 500);
  }

  async function importLocalBackup() {
    const file = $('#settingsImport').files?.[0];
    if (!file || !S.user) return;
    const data = JSON.parse(await file.text());
    if (data.username && data.username !== S.user.username) throw new Error('Backup от другого username');
    if (data.groupKeys) localStorage.setItem(groupStoreName(), JSON.stringify(data.groupKeys));
    if (data.cache) localStorage.setItem(`cm7:cache:${S.user.username}`, JSON.stringify(data.cache));
    await loadLocalState();
    toast('Backup импортирован', 'ok');
    if (S.currentChat) renderChat(S.currentChat);
  }

  // ---------------- settings ----------------
  function loadSettings() {
    const def = {
      theme: 'midnight',
      accent: '#8b5cf6',
      accent2: '#ec4899',
      syncMs: DEFAULT_SYNC_MS,
      density: 'normal',
      radius: 18,
      fontSize: 15,
      blur: true,
      motion: true
    };
    try { return { ...def, ...JSON.parse(localStorage.getItem('cm7:settings') || '{}') }; }
    catch (_) { return def; }
  }

  function applySettings() {
    const s = S.settings;
    document.documentElement.dataset.theme = s.theme;
    document.documentElement.style.setProperty('--ac', s.accent);
    document.documentElement.style.setProperty('--ac2', s.accent2);
    document.documentElement.style.setProperty('--r', `${s.radius}px`);
    document.documentElement.style.setProperty('--fs', `${s.fontSize}px`);
    document.documentElement.dataset.density = s.density;
    document.documentElement.dataset.blur = s.blur ? 'on' : 'off';
    document.documentElement.dataset.motion = s.motion ? 'on' : 'off';
    localStorage.setItem('cm7:settings', JSON.stringify(s));
  }

  function openSettings() {
    fillSettingsDialog();
    openDialog('settingsDialog');
  }

  function fillSettingsDialog() {
    $('#setTheme').value = S.settings.theme;
    $('#setSync').value = String(S.settings.syncMs);
    $('#setDensity').value = S.settings.density;
    $('#setRadius').value = String(S.settings.radius);
    $('#setFont').value = String(S.settings.fontSize);
    $('#setBlur').checked = !!S.settings.blur;
    $('#setMotion').checked = !!S.settings.motion;
    $$('.accent-pick').forEach(b => b.classList.toggle('active', b.dataset.a === S.settings.accent));
  }

  function saveSettingsFromDialog() {
    S.settings.theme = $('#setTheme').value;
    S.settings.syncMs = Number($('#setSync').value);
    S.settings.density = $('#setDensity').value;
    S.settings.radius = Number($('#setRadius').value);
    S.settings.fontSize = Number($('#setFont').value);
    S.settings.blur = $('#setBlur').checked;
    S.settings.motion = $('#setMotion').checked;
    const active = $('.accent-pick.active');
    if (active) { S.settings.accent = active.dataset.a; S.settings.accent2 = active.dataset.b; }
    applySettings();
    scheduleSync();
    closeDialog('settingsDialog');
    toast('Интерфейс настроен', 'ok');
  }

  document.addEventListener('click', e => {
    const btn = e.target.closest('.accent-pick');
    if (!btn) return;
    $$('.accent-pick').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  });


  // ---------------- admin panel ----------------
  function openAdmin() {
    openDialog('adminDialog', S.admin.token ? null : '#adminLogin');
    if (S.admin.token) adminLoad().catch(showErr);
  }

  async function adminLogin() {
    assertApi();
    const login = $('#adminLogin').value.trim();
    const password = $('#adminPassword').value;
    if (!login || !password) throw new Error('Введите admin login/password');
    showLoader('Вход в панель…');
    const data = await adminApi('/admin/login', { method: 'POST', body: { login, password } });
    S.admin.token = data.token;
    sessionStorage.setItem('cm7:adminToken', data.token);
    $('#adminPassword').value = '';
    await adminLoad();
    hideLoader();
  }

  function adminLogout() {
    S.admin.token = '';
    S.admin.data = null;
    sessionStorage.removeItem('cm7:adminToken');
    $('#adminLoginForm').classList.remove('hidden');
    $('#adminPanel').classList.add('hidden');
    $('#adminContent').innerHTML = '';
  }

  async function adminLoad() {
    assertApi();
    if (!S.admin.token) return;
    const data = await adminApi('/admin/state');
    S.admin.data = data;
    $('#adminLoginForm').classList.add('hidden');
    $('#adminPanel').classList.remove('hidden');
    renderAdmin();
  }

  function renderAdmin() {
    const data = S.admin.data;
    if (!data) return;
    $$('.admin-tab').forEach(b => b.classList.toggle('active', b.dataset.adminTab === S.admin.tab));
    const st = data.stats || {};
    $('#adminStats').innerHTML = [
      ['Юзеры', st.users || 0], ['Блок', st.blocked || 0], ['Чаты', st.chats || 0], ['Сообщения', st.messages || 0], ['Память', fmtBytes(st.storageBytes || 0)]
    ].map(([k,v]) => `<div class="stat"><b>${escapeHtml(v)}</b><span>${escapeHtml(k)}</span></div>`).join('');
    if (S.admin.tab === 'users') renderAdminUsers(data.users || []);
    else if (S.admin.tab === 'chats') renderAdminChats(data.chats || []);
    else renderAdminMemory(data.files || []);
  }

  function renderAdminUsers(users) {
    $('#adminContent').innerHTML = users.map(u => `
      <article class="admin-row">
        <div><b>@${escapeHtml(u.username)} ${u.blocked ? '<span class="pill warn">blocked</span>' : ''}</b><small>${escapeHtml(u.displayName || '')} · chats: ${Number(u.chats || 0)} · ${fmtDate(u.createdAt)}</small></div>
        <div class="admin-actions">
          ${u.blocked
            ? `<button class="mini" data-admin-action="unblockUser" data-username="${escapeHtml(u.username)}">Разблок</button>`
            : `<button class="mini" data-admin-action="blockUser" data-username="${escapeHtml(u.username)}">Блок</button>`}
          <button class="mini danger" data-admin-action="deleteUser" data-username="${escapeHtml(u.username)}">Удалить</button>
        </div>
      </article>`).join('') || '<div class="empty-list">Нет пользователей</div>';
  }

  function renderAdminChats(chats) {
    $('#adminContent').innerHTML = chats.map(c => `
      <article class="admin-row">
        <div><b>${escapeHtml(c.name || c.id)} <span class="pill">${escapeHtml(c.type)}</span></b><small>${escapeHtml(c.id)} · users: ${(c.users||[]).length} · messages: ${Number(c.messages || 0)}</small></div>
        <div class="admin-actions">
          <button class="mini" data-admin-action="purgeChat" data-chat-id="${escapeHtml(c.id)}">Очистить</button>
          <button class="mini danger" data-admin-action="deleteChat" data-chat-id="${escapeHtml(c.id)}">Удалить</button>
        </div>
      </article>`).join('') || '<div class="empty-list">Нет чатов</div>';
  }

  function renderAdminMemory(files) {
    const messageFiles = files.filter(f => /^cm_v7_msg_.*\.ndjson$/.test(f.name));
    const otherFiles = files.filter(f => !/^cm_v7_msg_.*\.ndjson$/.test(f.name));
    $('#adminContent').innerHTML = `
      <article class="admin-row admin-row-head">
        <div><b>Хранилище сообщений</b><small>${messageFiles.length ? 'Можно удалить все message-файлы или точечно один файл' : 'Файлов сообщений нет'}</small></div>
        <div class="admin-actions"><button class="mini danger" data-admin-action="wipeMessages">Удалить все сообщения</button></div>
      </article>
      ${messageFiles.map(f => `<article class="admin-row"><div><b>${escapeHtml(f.name)}</b><small>${fmtBytes(f.size || 0)}${f.truncated ? ' · truncated' : ''}</small></div><div class="admin-actions"><button class="mini danger" data-admin-action="deleteFile" data-file-name="${escapeHtml(f.name)}">Удалить файл</button></div></article>`).join('')}
      ${otherFiles.map(f => `<article class="admin-row muted-row"><div><b>${escapeHtml(f.name)}</b><small>${fmtBytes(f.size || 0)}${f.truncated ? ' · truncated' : ''}</small></div><div></div></article>`).join('')}`;
  }

  async function adminRunAction(action, ds) {
    if (!S.admin.token) throw new Error('Admin token missing');
    const body = { type: action };
    if (ds.username) body.username = ds.username;
    if (ds.chatId) body.chatId = ds.chatId;
    if (ds.fileName) body.fileName = ds.fileName;
    if (action === 'blockUser') body.reason = prompt('Причина блокировки:', 'blocked by admin') || 'blocked by admin';
    const danger = ['deleteUser','deleteChat','purgeChat','wipeMessages','deleteFile'].includes(action);
    if (danger && !confirm(`Выполнить ${action}?`)) return;
    showLoader('Выполняю…');
    const data = await adminApi('/admin/action', { method: 'POST', body });
    S.admin.data = data;
    renderAdmin();
    hideLoader();
    toast(data.notice || 'Готово', 'ok');
  }

  // ---------------- share / dialogs ----------------
  function showShare(chatId, inviteKey) {
    $('#shareId').value = chatId;
    $('#shareKey').value = inviteKey;
    openDialog('shareDialog');
  }
  async function copyShare() {
    const text = `CheekMes group\nID: ${$('#shareId').value}\nKey: ${$('#shareKey').value}`;
    await navigator.clipboard.writeText(text);
    toast('ID и ключ скопированы', 'ok');
  }
  async function copyCurrentChat() {
    if (!S.currentChat) return;
    if (S.currentChat.type === 'group') {
      const key = S.groupInviteKeys.get(S.currentChat.id) || '';
      if (key) return showShare(S.currentChat.id, key);
      await navigator.clipboard.writeText(S.currentChat.id);
      return toast('ID группы скопирован', 'warn');
    }
    await navigator.clipboard.writeText(S.currentChat.id);
    toast('ID диалога скопирован', 'ok');
  }
  function openDialog(id, focusSelector) {
    const d = document.getElementById(id);
    if (!d.open) d.showModal();
    if (focusSelector) setTimeout(() => $(focusSelector)?.focus(), 50);
  }
  function closeDialog(id) {
    const d = document.getElementById(id);
    if (d?.open) d.close();
  }

  // ---------------- utils ----------------
  function assertApi() { if (!API_URL) throw new Error('API_URL не настроен в config.js'); }
  function showLoader(text) { $('#loaderText').textContent = text || 'Загрузка…'; $('#loader').classList.remove('hidden'); }
  function hideLoader() { $('#loader').classList.add('hidden'); }
  function showErr(err) { hideLoader(); toast(err.message || String(err), 'err'); console.error(err); }
  function toast(text, type = 'info') {
    const t = document.createElement('div');
    t.className = 'toast ' + type;
    t.textContent = text;
    $('#toastRoot').appendChild(t);
    setTimeout(() => { t.classList.add('hide'); setTimeout(() => t.remove(), 260); }, 4200);
  }
  function escapeHtml(text) {
    const d = document.createElement('div');
    d.textContent = String(text ?? '');
    return d.innerHTML;
  }
  function normalizeUsername(v) { return String(v || '').trim().replace(/^@/, '').toLowerCase(); }
  function validUsername(v) { return /^[a-z0-9_]{3,20}$/.test(v); }
  function cleanChatId(v) { return String(v || '').replace(/[^a-z0-9_]/gi, '').slice(0, 80); }
  function initials(name) { return String(name || '?').trim().slice(0, 2).toUpperCase(); }
  function randBytes(n) { const b = new Uint8Array(n); crypto.getRandomValues(b); return b; }
  function randomString(n) { return [...randBytes(n)].map(b => (b % 36).toString(36)).join(''); }
  function bytesToB64u(bytes) {
    let bin = '';
    const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) bin += String.fromCharCode(...bytes.subarray(i, i + chunk));
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
  }
  function b64uToBytes(str) {
    const s = String(str).replace(/-/g, '+').replace(/_/g, '/');
    const pad = '='.repeat((4 - s.length % 4) % 4);
    const bin = atob(s + pad);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }
  function fmtTime(ts) {
    if (!ts) return '';
    const d = Date.now() - Number(ts);
    const m = Math.floor(d / 60000), h = Math.floor(d / 3600000), days = Math.floor(d / 86400000);
    if (m < 1) return 'сейчас';
    if (m < 60) return `${m}м`;
    if (h < 24) return `${h}ч`;
    if (days < 7) return `${days}д`;
    return new Date(ts).toLocaleDateString('ru', { day: 'numeric', month: 'short' });
  }
  function fmtFull(ts) { return new Date(Number(ts || Date.now())).toLocaleString('ru', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }); }
  function fmtSize(b) {
    b = Number(b || 0);
    if (b < 1024) return b + ' B';
    if (b < 1048576) return (b / 1024).toFixed(1) + ' KB';
    return (b / 1048576).toFixed(1) + ' MB';
  }
  function fmtBytes(b) {
    b = Number(b || 0);
    if (b < 1024) return b + ' B';
    if (b < 1048576) return (b / 1024).toFixed(1) + ' KB';
    return (b / 1048576).toFixed(1) + ' MB';
  }
  function fmtDate(ts) { return ts ? new Date(Number(ts)).toLocaleDateString('ru') : '—'; }
  function fileIcon(type) {
    type = String(type || '');
    if (type.startsWith('image/')) return '🖼';
    if (type.startsWith('audio/')) return '🎵';
    if (type.startsWith('video/')) return '🎬';
    if (type.includes('pdf')) return '📕';
    return '📎';
  }
  function autoGrow() {
    const ta = $('#msgInput');
    ta.style.height = 'auto';
    ta.style.height = Math.min(160, ta.scrollHeight) + 'px';
  }
  function isMobile() { return matchMedia('(max-width: 760px)').matches; }
})();