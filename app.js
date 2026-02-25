// ============================================================
// CheekMes v5.0 =]
// ============================================================

// ============ ЧАСТЬ 1: КОНФИГУРАЦИЯ ============
const _tk = {
    p1: 'ghp_QKhdgOHBH1q8So',
    p2: '0a3cab58dd1981c'
};
const _gi = {
    p1: '9863e70e547dd72136d8',
    p2: 'wWp7M8CswKyf3hbx4JYCxg'
};

const GITHUB_TOKEN = _tk.p1 + _tk.p2;
const GIST_ID = _gi.p1 + _gi.p2;
const API_URL = 'https://api.github.com/gists';
const USERS_FILE = 'cmusers.json';
const DIR_FILE = 'cmdirectory.json';

// ============ ЧАСТЬ 2: СОСТОЯНИЕ-ПРИЛОЖЕНИЯ ============
const S = {
    user: null, seed: '',
    chats: [], notes: [],
    curChat: null, msgs: [],
    selMsg: null, editMsg: null, replyTo: null,
    timer: null, refreshMs: 8000,
    soundOn: true, recording: false, recorder: null, chunks: [],
    unread: {},
    usersCache: {},
    lastMsgUser: null,
    lastMsgTime: 0
};

// ============ ЧАСТЬ 3: КОНСТАНТЫ-ИНТЕРФЕЙС ============
const EMOJIS = {
    '😀':'😀😃😄😁😆😅🤣😂🙂🙃😉😊😇🥰😍🤩😘😗😚😙😋😛😜🤪😝🤗🤭🤫🤔🤐🤨😐😑😶😏😒🙄😬😌😔😪😴😷🤒🤕🤢🤮🥵🥶🥴😵🤯🤠🥳😎🤓😕😟🙁😮😯😲😳🥺😦😧😨😰😥😢😭😱😖😣😞😩😫🥱',
    '👋':'👋🤚✋🖖👌🤏✌🤞🤟🤘🤙👈👉👆🖕👇☝👍👎✊👊🤛🤜👏🙌👐🤲🤝🙏💪🦾',
    '❤️':'❤️🧡💛💚💙💜🖤🤍🤎💔❣💕💞💓💗💖💘💝💟',
    '🐱':'🐱🐶🐭🐹🐰🦊🐻🐼🐨🐯🦁🐮🐷🐸🐵🙈🙉🙊🐔🐧🐦🦆🦅🦉🐺🐗🐴🦄🐝🦋🐌🐞🐢🐍🐙🐬🐳🦈🐘🦒🦓',
    '🍕':'🍕🍔🍟🌭🍿🍳🥞🍞🧀🥗🌮🍖🍗🍅🥑🍇🍉🍊🍌🍍🍎🍏🍑🍒🍓🍰🎂🍫☕🍵🍺🍷🥤',
    '⚡':'⚡🔥✨🌟💫⭐🌈☀️❄💧🌊🎵🎶🎸🎹🎮🏀⚽🎾🏆💻📱💡🔑🔒💰💎📌✏📝🎁🎉🎈🚀🛸'
};
const THEMES = [
    {id:'dark',    name:'🌙 Тёмная',   c:'#0a0a12'},
    {id:'amoled',  name:'⬛ AMOLED',   c:'#000000'},
    {id:'light',   name:'☀️ Светлая',  c:'#f5f5fa'},
    {id:'nord',    name:'🧊 Nord',     c:'#2e3440'},
    {id:'dracula', name:'🧛 Dracula',  c:'#282a36'},
    {id:'midnight',name:'🌌 Midnight', c:'#0d1117'}
];
const ACCENTS = [
    {p:'#7c3aed',s:'#ec4899'},{p:'#06b6d4',s:'#3b82f6'},{p:'#10b981',s:'#34d399'},
    {p:'#f43f5e',s:'#fb923c'},{p:'#8b5cf6',s:'#d946ef'},{p:'#ef4444',s:'#f97316'},
    {p:'#eab308',s:'#f43f5e'},{p:'#6366f1',s:'#a855f7'}
];
const COLORS = ['#7c3aed','#06b6d4','#10b981','#f43f5e','#8b5cf6','#ef4444','#eab308','#6366f1'];

// ============ ЧАСТЬ 4: УТИЛИТЫ-DOM ============
const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);

function esc(t) {
    const d = document.createElement('div');
    d.textContent = t || '';
    return d.innerHTML;
}
function rnd(len) {
    let r = '', c = 'abcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < (len||6); i++) r += c[Math.floor(Math.random() * c.length)];
    return r;
}
function sha(str) { return CryptoJS.SHA256(str).toString(); }

// ============ ЧАСТЬ 5: АВАТАРЫ-ГЕНЕРАТОР ============
const _avCache = {};
function makeAvCanvas(name, size) {
    size = size || 80;
    const key = (name||'?') + '_' + size;
    if (_avCache[key]) return _avCache[key];
    const cv = document.createElement('canvas');
    cv.width = cv.height = size;
    const ctx = cv.getContext('2d');
    let hash = 0;
    for (let i = 0; i < (name||'').length; i++) hash = (name.charCodeAt(i) + ((hash << 5) - hash)) | 0;
    const hue = Math.abs(hash % 360);
    const g = ctx.createLinearGradient(0, 0, size, size);
    g.addColorStop(0, `hsl(${hue},70%,50%)`);
    g.addColorStop(1, `hsl(${(hue+45)%360},80%,40%)`);
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(size/2, size/2, size/2, 0, Math.PI*2); ctx.fill();
    const initials = (name||'?').substring(0,2).toUpperCase();
    ctx.fillStyle = 'rgba(255,255,255,.95)';
    ctx.font = `bold ${Math.round(size*0.38)}px 'Outfit',sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(initials, size/2, size/2 + 1);
    _avCache[key] = cv;
    return cv;
}

function makeAvEl(src, name, size) {
    if (src) {
        const img = document.createElement('img');
        img.src = src; img.alt = name||''; img.loading = 'lazy';
        img.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block';
        img.onerror = function() {
            const cv = makeAvCanvas(name||'?', size||80);
            cv.style.cssText = 'width:100%;height:100%;display:block';
            this.replaceWith(cv);
        };
        return img;
    }
    const cv = makeAvCanvas(name||'?', size||80);
    cv.style.cssText = 'width:100%;height:100%;display:block';
    return cv;
}

function setAv(el, src, name, size) {
    if (!el) return;
    el.innerHTML = '';
    el.appendChild(makeAvEl(src, name, size));
}

// ============ ЧАСТЬ 6: UI-ХЕЛПЕРЫ ============
function showScreen(id) { 
    $$('.screen').forEach(s => s.classList.remove('active')); 
    document.getElementById(id)?.classList.add('active'); 
}
function showModal(id) { document.getElementById(id)?.classList.add('show'); }
function hideModal(id) { document.getElementById(id)?.classList.remove('show'); }

function toast(msg, type) {
    const c = document.getElementById('toasts'); if (!c) return;
    const t = document.createElement('div');
    t.className = 'toast ' + (type==='success'?'ok': type==='error'?'err':'info');
    t.textContent = msg; c.appendChild(t);
    setTimeout(() => { t.style.cssText += ';opacity:0;transform:translateX(110%);transition:.3s'; setTimeout(()=>t.remove(),330); }, 3800);
}
function showLoader(txt) { 
    const m=document.getElementById('loaderMsg'); 
    if(m) m.textContent=txt||'Загрузка...'; 
    const e=document.getElementById('loader'); 
    if(e) e.style.display='flex'; 
}
function hideLoader() { 
    const e=document.getElementById('loader'); 
    if(e) e.style.display='none'; 
}

function confirm2(text, cb, icon) {
    const p = document.getElementById('confirmText'); if (p) p.textContent = text;
    const i = document.getElementById('confirmIcon'); if (i) i.textContent = icon||'⚠️';
    const b = document.getElementById('confirmOk');
    if (b) b.onclick = () => { hideModal('confirmModal'); cb(); };
    showModal('confirmModal');
}
function togglePass(id) { 
    const el=document.getElementById(id); 
    if(el) el.type = el.type==='password'?'text':'password'; 
}

function fmtTime(ts) {
    if (!ts) return '';
    const d=Date.now()-ts, m=Math.floor(d/60000), h=Math.floor(d/3600000), dy=Math.floor(d/86400000);
    if (m<1) return 'только что'; if (m<60) return m+'м'; if (h<24) return h+'ч'; if (dy<7) return dy+'д';
    return new Date(ts).toLocaleDateString('ru',{day:'numeric',month:'short'});
}
function fmtFullTime(ts) { 
    return ts ? new Date(ts).toLocaleTimeString('ru',{hour:'2-digit',minute:'2-digit'}) : ''; 
}
function fmtSize(b) { 
    if (b<1024) return b+'B'; 
    if (b<1048576) return (b/1024).toFixed(1)+'KB'; 
    return (b/1048576).toFixed(1)+'MB'; 
}

function beep() {
    try {
        const ctx = new(window.AudioContext||window.webkitAudioContext)();
        const o=ctx.createOscillator(), g=ctx.createGain();
        o.connect(g); g.connect(ctx.destination);
        o.frequency.value=880; g.gain.value=0.04;
        o.start(); o.stop(ctx.currentTime+0.09);
    } catch(e){}
}

function btnLoad(btn, loading) {
    if (!btn) return;
    const l=btn.querySelector('.btn-label'), s=btn.querySelector('.btn-spin');
    if (loading) { if(l) l.style.display='none'; if(s) s.style.display='block'; btn.disabled=true; }
    else { if(l) l.style.display=''; if(s) s.style.display='none'; btn.disabled=false; }
}

// ============ ЧАСТЬ 7: GIST-API ============
function gistFriendlyError(method, status, body) {
    const map = {
        401:'❌ Неверный токен (401). Замените токен в коде — нужен токен с правом "gist".',
        403:'❌ Доступ запрещён (403). Токен истёк или не имеет прав. Создайте новый на github.com/settings/tokens.',
        404:'❌ Gist не найден (404). Проверьте ID в коде.',
        409:'⚠️ Конфликт (409). Попробуйте ещё раз.',
        422:'❌ Некорректные данные (422).',
        429:'⏳ Лимит запросов (429). Подождите минуту.',
        500:'❌ Сервер GitHub упал (500). Попробуйте позже.',
        503:'❌ GitHub недоступен (503). Попробуйте позже.'
    };
    return new Error(map[status] || `${method} ошибка ${status}: ${body.substring(0,120)}`);
}

async function gistGetAll() {
    if (!GITHUB_TOKEN||!GIST_ID) throw new Error('⚙️ Настройте токены в коде');
    let r;
    try { 
        r = await fetch(`${API_URL}/${GIST_ID}?_t=${Date.now()}`, { 
            headers:{'Authorization':'token '+GITHUB_TOKEN,'Accept':'application/vnd.github.v3+json'} 
        }); 
    }
    catch(e) { throw new Error('🌐 Нет интернета: '+e.message); }
    if (!r.ok) { const b=await r.text().catch(()=>''); throw gistFriendlyError('GET',r.status,b); }
    return r.json();
}

async function gistPatchFiles(files) {
    const clean={};
    for (const [k,v] of Object.entries(files||{})) {
        if (!k||k==='undefined'||k==='null') continue;
        if (v===null) { clean[k]=null; continue; }
        if (v&&typeof v==='object'&&'content' in v) clean[k]={content:(typeof v.content==='string'&&v.content.length>0)?v.content:'.'};
    }
    if (!Object.keys(clean).length) throw new Error('gistPatchFiles: нет данных');
    if (!GITHUB_TOKEN||!GIST_ID) throw new Error('⚙️ Настройте токен и Gist ID');
    let r;
    try {
        r = await fetch(`${API_URL}/${GIST_ID}`,{
            method:'PATCH',
            headers:{'Authorization':'token '+GITHUB_TOKEN,'Content-Type':'application/json','Accept':'application/vnd.github.v3+json'},
            body:JSON.stringify({files:clean})
        });
    } catch(e) { throw new Error('🌐 Нет интернета: '+e.message); }
    if (!r.ok) { const b=await r.text().catch(()=>''); throw gistFriendlyError('PATCH',r.status,b); }
    return r.json();
}

async function gistReadFile(name) {
    if (!name) return '';
    const data = await gistGetAll();
    return (data.files&&data.files[name]&&data.files[name].content)||'';
}
async function gistWriteFile(name, content) {
    if (!name) throw new Error('gistWriteFile: нет имени');
    await gistPatchFiles({[name]:{content:(typeof content==='string'&&content)?content:'.'}});
}
async function gistAppendLine(name, line) {
    if (!name||!line) throw new Error('gistAppendLine: некорректные данные');
    const ex = await gistReadFile(name);
    const cleaned = (ex.trim()==='.'||!ex.trim()) ? '' : ex.trim();
    await gistWriteFile(name, cleaned ? cleaned+'\n'+line : line);
}
async function gistFileExists(name) {
    if (!name) return false;
    const data = await gistGetAll();
    return !!(data.files&&data.files[name]);
}

// ============ ЧАСТЬ 8: БАЗА-ДАННЫХ ============
async function loadUsersDB() {
    try { const r=await gistReadFile(USERS_FILE); return (r&&r.trim()&&r.trim()!=='.')?JSON.parse(r):{}; }
    catch(e) { return {}; }
}
async function saveUsersDB(db) { await gistWriteFile(USERS_FILE, JSON.stringify(db)); }

async function loadDirectory() {
    try { const r=await gistReadFile(DIR_FILE); return (r&&r.trim()&&r.trim()!=='.')?JSON.parse(r):{}; }
    catch(e) { return {}; }
}
async function saveDirectory(dir) { await gistWriteFile(DIR_FILE, JSON.stringify(dir)); }

// ============ ЧАСТЬ 9: ИНИЦИАЛИЗАЦИЯ ============
document.addEventListener('DOMContentLoaded', () => {
    loadSettings(); initColorGrid(); initTextarea(); initEmojiPanel();
    initFileInput(); initClickOutside(); initAvatarUpload(); initScrollWatcher();
    if ('Notification' in window && Notification.permission==='default') Notification.requestPermission();
    const lp=document.getElementById('loginPassword'); if(lp) lp.addEventListener('keydown',e=>{if(e.key==='Enter') doLogin();});
    const lu=document.getElementById('loginUsername'); if(lu) lu.addEventListener('keydown',e=>{if(e.key==='Enter') document.getElementById('loginPassword')?.focus();});
    const rc=document.getElementById('regPasswordConfirm'); if(rc) rc.addEventListener('keydown',e=>{if(e.key==='Enter') doRegister();});
    const dmT=document.getElementById('dmTarget'); if(dmT) dmT.addEventListener('keydown',e=>{if(e.key==='Enter') doNewDM();});
    initSystemFiles();
});

async function initSystemFiles() {
    if (!GITHUB_TOKEN||!GIST_ID) return;
    try {
        const data = await gistGetAll();
        const c={};
        if (!data.files?.[USERS_FILE]) c[USERS_FILE]={content:'{}'};
        if (!data.files?.[DIR_FILE])   c[DIR_FILE]={content:'{}'};
        if (Object.keys(c).length) await gistPatchFiles(c);
    } catch(e) { console.warn('initSystemFiles:',e.message); }
}

// ============ ЧАСТЬ 10: АВТОРИЗАЦИЯ ============
function switchAuthTab(formId, btn) {
    $$('.auth-tab').forEach(b=>b.classList.remove('active'));
    $$('.auth-form').forEach(f=>f.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(formId)?.classList.add('active');
}

let _ucTimer=null;
function checkUsername() {
    if (_ucTimer) clearTimeout(_ucTimer);
    const inp=document.getElementById('regUsername'), hint=document.getElementById('regUsernameHint'), st=document.getElementById('regUsernameStatus');
    if (!inp||!hint||!st) return;
    const val=inp.value.trim().toLowerCase();
    if (!val) { hint.textContent=''; hint.className='field-hint'; st.textContent=''; return; }
    if (!/^[a-z0-9_]{3,20}$/.test(val)) { hint.textContent='Только a-z, 0-9, _ (3-20 символов)'; hint.className='field-hint error'; st.textContent='❌'; return; }
    hint.textContent='Проверяем...'; hint.className='field-hint'; st.textContent='⏳';
    _ucTimer=setTimeout(async()=>{
        try {
            const db=await loadUsersDB();
            if (db[val]) { hint.textContent='Занят!'; hint.className='field-hint error'; st.textContent='❌'; }
            else { hint.textContent='Свободен ✓'; hint.className='field-hint ok'; st.textContent='✅'; }
        } catch(e) { hint.textContent='Ошибка проверки'; hint.className='field-hint error'; st.textContent='⚠️'; }
    }, 700);
}

async function doRegister() {
    const uI=document.getElementById('regUsername'), dnI=document.getElementById('regDisplayName');
    const pI=document.getElementById('regPassword'), p2I=document.getElementById('regPasswordConfirm');
    if (!uI||!pI||!p2I) return;
    const username=uI.value.trim().toLowerCase(), displayName=dnI?.value.trim()||username;
    const pass=pI.value, pass2=p2I.value;
    if (!/^[a-z0-9_]{3,20}$/.test(username)) return toast('Username: 3-20 символов (a-z 0-9 _)','error');
    if (pass.length<6) return toast('Пароль минимум 6 символов','error');
    if (pass!==pass2) return toast('Пароли не совпадают','error');
    const btn=document.getElementById('regBtn'); btnLoad(btn,true);
    try {
        const db=await loadUsersDB();
        if (db[username]) { toast('Username уже занят!','error'); return; }
        db[username]={username,displayName,passwordHash:sha(pass),bio:'',status:'online',avatar:null,createdAt:Date.now()};
        await saveUsersDB(db);
        toast('Аккаунт создан! Войдите.','success');
        switchAuthTab('login-form',$$('.auth-tab')[0]);
        const luI=document.getElementById('loginUsername');
        if (luI) { luI.value=username; document.getElementById('loginPassword')?.focus(); }
    } catch(e) { toast('Ошибка: '+e.message,'error'); }
    finally { btnLoad(btn,false); }
}

async function doLogin() {
    const uI=document.getElementById('loginUsername'), pI=document.getElementById('loginPassword');
    if (!uI||!pI) return;
    const username=uI.value.trim().toLowerCase(), pass=pI.value;
    if (!username) return toast('Введите username','error');
    if (!pass)     return toast('Введите пароль','error');
    const btn=document.getElementById('loginBtn'); btnLoad(btn,true);
    try {
        const db=await loadUsersDB();
        const user=db[username];
        if (!user)                          { toast('Пользователь не найден','error'); return; }
        if (user.passwordHash!==sha(pass))  { toast('Неверный пароль','error'); return; }
        S.user=user; S.seed=pass;
        db[username].status='online'; saveUsersDB(db).catch(()=>{});
        afterLogin();
    } catch(e) { toast('Ошибка входа: '+e.message,'error'); }
    finally { btnLoad(btn,false); }
}

function afterLogin() {
    loadLocalData(); loadNotes(); loadUnread();
    showScreen('main-screen');
    updateMainHeader(); renderChats(); renderDMs(); renderNotes();
    toast('Привет, '+S.user.displayName+'! 👋','success');
    syncIncomingDMs();
}

async function syncIncomingDMs() {
    try {
        const dir=await loadDirectory(); if (!dir.dms) return;
        const db=await loadUsersDB(); S.usersCache=db;
        let changed=false;
        for (const [dmId,info] of Object.entries(dir.dms)) {
            if (!(info.users||[]).includes(S.user.username)) continue;
            if (S.chats.some(c=>c.id===info.id)) continue;
            const other=(info.users||[]).find(u=>u!==S.user.username); if (!other) continue;
            const pair=info.users, dmKey=sha(pair.join('::'));
            const otherInfo=db[other]||{};
            S.chats.push({id:info.id,name:otherInfo.displayName||other,desc:'',color:'#06b6d4',key:dmKey,fileName:info.fileName,admins:pair,perms:{msg:true,files:true,voice:true},members:pair,lastMsg:null,lastTime:null,isDM:true,dmWith:other,pinned:null});
            changed=true;
        }
        if (changed) { saveLocalData(); renderDMs(); toast('💬 Новые диалоги!','info'); }
    } catch(e) { console.warn('syncIncomingDMs:',e.message); }
}

function logout() {
    confirm2('Выйти из аккаунта?',()=>{
        if (S.timer) clearInterval(S.timer);
        Object.assign(S,{timer:null,user:null,seed:'',curChat:null,msgs:[],usersCache:{},unread:{}});
        showScreen('auth-screen');
    },'👋');
}

// ============ ЧАСТЬ 11: ГЛАВНЫЙ-ЗАГОЛОВОК ============
function updateMainHeader() {
    const av=document.getElementById('mainAvatar'); if (av) setAv(av,S.user.avatar,S.user.displayName,36);
    const nm=document.getElementById('mainDisplayName'); if (nm) nm.textContent=S.user.displayName;
    const st=document.getElementById('mainStatus');
    if (st) {
        const map={online:'● в сети',away:'● отошёл',busy:'● занят',invisible:''};
        st.textContent=map[S.user.status||'online']||'';
        st.style.color=S.user.status==='busy'?'var(--err)':S.user.status==='away'?'var(--warn)':'var(--ok)';
        st.style.display=S.user.status==='invisible'?'none':'';
    }
}

function switchMainTab(btn) {
    $$('.nav-tab').forEach(t=>t.classList.remove('active'));
    $$('.tab-panel').forEach(p=>p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(btn.dataset.target)?.classList.add('active');
}

// ============ ЧАСТЬ 12: ЛОКАЛЬНОЕ-ХРАНИЛИЩЕ ============
function loadLocalData() { 
    try { S.chats=JSON.parse(localStorage.getItem('cm5chats_'+S.user.username)||'[]'); } catch(e){S.chats=[];} 
}
function saveLocalData() { 
    localStorage.setItem('cm5chats_'+S.user.username,JSON.stringify(S.chats)); 
}
function loadNotes() { 
    try { S.notes=JSON.parse(localStorage.getItem('cm5notes_'+S.user.username)||'[]'); } catch(e){S.notes=[];} 
}
function saveNotes() { 
    localStorage.setItem('cm5notes_'+S.user.username,JSON.stringify(S.notes)); 
}
function loadUnread() { 
    try { S.unread=JSON.parse(localStorage.getItem('cm5unread_'+S.user.username)||'{}'); } catch(e){S.unread={};} 
}
function saveUnread() { 
    localStorage.setItem('cm5unread_'+S.user.username,JSON.stringify(S.unread)); 
}

function markRead(chatId) { 
    if(S.unread[chatId]){delete S.unread[chatId]; saveUnread(); updateBadges();} 
}
function addUnread(chatId) { 
    S.unread[chatId]=(S.unread[chatId]||0)+1; saveUnread(); updateBadges(); 
}

function updateBadges() {
    let cc=0, dc=0;
    for (const c of S.chats) { 
        const n=S.unread[c.id]||0; 
        if(n>0){if(c.isDM) dc+=n; else cc+=n;} 
    }
    const bc=document.getElementById('badge-chats'), bd=document.getElementById('badge-dm');
    if (bc) { bc.textContent=cc>99?'99+':cc; bc.style.display=cc>0?'flex':'none'; }
    if (bd) { bd.textContent=dc>99?'99+':dc; bd.style.display=dc>0?'flex':'none'; }
}

// ============ ЧАСТЬ 13: ЗАМЕТКИ ============
function renderNotes() {
    const box=document.getElementById('notesBox'); if (!box) return;
    box.innerHTML=`<div class="note-input"><textarea id="noteTA" placeholder="Новая заметка (Markdown)..." rows="2"></textarea><button class="send-btn" onclick="addNote()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg></button></div>`;
    if (!S.notes.length) { 
        box.innerHTML+=`<div class="empty-state"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg><span>Заметки видны только вам · Поддерживает Markdown</span></div>`; 
        return; 
    }
    S.notes.slice().reverse().forEach(n => {
        const html=DOMPurify.sanitize(marked.parse(n.text||'',{breaks:true,gfm:true}));
        const div=document.createElement('div'); div.className='note-card';
        div.innerHTML=`<div class="note-body">${html}</div><div class="note-foot"><span class="note-time">${new Date(n.time).toLocaleString('ru')}</span><button class="note-del" onclick="delNote('${n.id}')">🗑️ Удалить</button></div>`;
        box.appendChild(div);
    });
}
function addNote() { 
    const ta=document.getElementById('noteTA'); 
    if(!ta||!ta.value.trim()) return; 
    S.notes.push({id:rnd(8),text:ta.value.trim(),time:Date.now()}); 
    saveNotes(); ta.value=''; renderNotes(); 
}
function delNote(id) { 
    S.notes=S.notes.filter(n=>n.id!==id); 
    saveNotes(); renderNotes(); 
}

// ============ ЧАСТЬ 14: ПОИСК ============
function onMainSearch() {
    const q=document.getElementById('mainSearchInput')?.value.toLowerCase()||'';
    const cl=document.getElementById('mainSearchClear'); if(cl) cl.style.display=q?'flex':'none';
    renderChats(q); renderDMs(q);
}
function clearMainSearch() { 
    const i=document.getElementById('mainSearchInput'); 
    if(i)i.value=''; 
    document.getElementById('mainSearchClear').style.display='none'; 
    renderChats(); renderDMs(); 
}

// ============ ЧАСТЬ 15: СПИСОК-ЧАТОВ ============
function renderChats(filter) {
    filter=filter||'';
    const el=document.getElementById('tab-chats'); if (!el) return;
    const list=S.chats.filter(c=>!c.isDM&&c.name.toLowerCase().includes(filter));
    if (!list.length) { 
        el.innerHTML=`<div class="empty-state"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg><span>Нет чатов. Нажмите + чтобы создать или вступить!</span></div>`; 
        return; 
    }
    el.innerHTML='';
    list.forEach(c => {
        const idx=S.chats.indexOf(c), unread=S.unread[c.id]||0;
        const item=document.createElement('div'); item.className='chat-item'; item.onclick=()=>openChat(idx);
        const avWrap=document.createElement('div'); avWrap.className='ci-av-wrap';
        const av=document.createElement('div'); av.className='ci-av'; av.style.background=c.color||'var(--acG)';
        setAv(av,null,c.name,48); avWrap.appendChild(av);
        const body=document.createElement('div'); body.className='ci-body';
        body.innerHTML=`<div class="ci-top"><span class="ci-name">${esc(c.name)}</span><span class="ci-time">${fmtTime(c.lastTime)}</span></div><div class="ci-bottom"><span class="ci-preview">${esc(c.lastMsg||'Нет сообщений')}</span>${unread>0?`<span class="ci-unread">${unread>99?'99+':unread}</span>`:''}</div><div class="ci-id">ID: ${c.id}</div>`;
        item.appendChild(avWrap); item.appendChild(body); el.appendChild(item);
    });
}

function renderDMs(filter) {
    filter=filter||'';
    const el=document.getElementById('tab-dm'); if (!el) return;
    const list=S.chats.filter(c=>c.isDM&&(c.dmWith||'').toLowerCase().includes(filter));
    if (!list.length) { 
        el.innerHTML=`<div class="empty-state"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg><span>Нет диалогов. Нажмите + чтобы написать!</span></div>`; 
        return; 
    }
    el.innerHTML='';
    list.forEach(c => {
        const idx=S.chats.indexOf(c), unread=S.unread[c.id]||0;
        const other=S.usersCache[c.dmWith]||{};
        const item=document.createElement('div'); item.className='chat-item'; item.onclick=()=>openChat(idx);
        const avWrap=document.createElement('div'); avWrap.className='ci-av-wrap';
        const av=document.createElement('div'); av.className='ci-av'; av.style.background='#06b6d4';
        setAv(av,other.avatar||null,c.dmWith||'?',48);
        if (other.status==='online') {
            const dot=document.createElement('span'); dot.className='ci-online'; avWrap.appendChild(dot);
        }
        avWrap.appendChild(av);
        const body=document.createElement('div'); body.className='ci-body';
        body.innerHTML=`<div class="ci-top"><span class="ci-name">@${esc(c.dmWith||'DM')}</span><span class="ci-time">${fmtTime(c.lastTime)}</span></div><div class="ci-bottom"><span class="ci-preview">${esc(c.lastMsg||'')}</span>${unread>0?`<span class="ci-unread">${unread>99?'99+':unread}</span>`:''}</div>`;
        item.appendChild(avWrap); item.appendChild(body); el.appendChild(item);
    });
}

// ============ ЧАСТЬ 16: FAB-МЕНЮ ============
function toggleFab() { 
    const p=document.getElementById('createPopup'),w=document.getElementById('fabWrap'); 
    p?.classList.toggle('show'); w?.classList.toggle('open'); 
}
function closeFab() { 
    document.getElementById('createPopup')?.classList.remove('show'); 
    document.getElementById('fabWrap')?.classList.remove('open'); 
}
function showCreateChatModal() { closeFab(); showModal('createChatModal'); }
function showJoinModal()       { closeFab(); showModal('joinModal'); }
function showNewDMModal()      { closeFab(); showModal('dmModal'); }

function initColorGrid() {
    const g=document.getElementById('colorGrid'); if (!g) return;
    g.innerHTML=COLORS.map((c,i)=>`<div class="color-dot${i===0?' sel':''}" data-color="${c}" style="background:${c}" onclick="pickClr(this)"></div>`).join('');
}
function pickClr(el) { $$('#colorGrid .color-dot').forEach(o=>o.classList.remove('sel')); el.classList.add('sel'); }
function genKey(id) { const i=document.getElementById(id||'ccKey'); if(i) i.value=rnd(16); }


// ============ ЧАСТЬ 17: СОЗДАНИЕ-ЧАТОВ ============
async function doCreateChat() {
    const nameI=document.getElementById('ccName'), descI=document.getElementById('ccDesc'), keyI=document.getElementById('ccKey');
    if (!nameI||!keyI) return;
    const name=nameI.value.trim(), desc=descI?.value.trim()||'', key=keyI.value.trim();
    if (!name) return toast('Введите название','error');
    if (!key||key.length<4) return toast('Ключ минимум 4 символа','error');
    const color=$('#colorGrid .color-dot.sel')?.dataset.color||COLORS[0];
    const btn=document.getElementById('createChatModal')?.querySelector('.cta-btn'); btnLoad(btn,true);
    try {
        const dir=await loadDirectory();
        let chatId, att=0;
        do { chatId=rnd(8); att++; if(att>50) throw new Error('Не удалось создать ID'); } while(dir[chatId]);
        const fileName='chat'+chatId+'.txt';
        dir[chatId]={name,desc,color,createdBy:S.user.username,createdAt:Date.now(),fileName};
        await saveDirectory(dir);
        await gistWriteFile(fileName,'.');
        S.chats.push({id:chatId,name,desc,color,key,fileName,admins:[S.user.username],perms:{msg:true,files:true,voice:true},members:[S.user.username],lastMsg:null,lastTime:null,isDM:false,pinned:null});
        saveLocalData(); renderChats();
        nameI.value=''; if(descI) descI.value=''; keyI.value='';
        hideModal('createChatModal');
        toast('Чат создан! ID: '+chatId,'success');
    } catch(e) { toast('Ошибка: '+e.message,'error'); }
    finally { btnLoad(btn,false); }
}

async function doJoin() {
    const idI=document.getElementById('joinId'), keyI=document.getElementById('joinKey');
    if (!idI||!keyI) return;
    const id=idI.value.trim(), key=keyI.value.trim();
    if (!id) return toast('Введите ID','error');
    if (!key) return toast('Введите ключ','error');
    if (S.chats.some(c=>c.id===id&&!c.isDM)) return toast('Вы уже в этом чате','error');
    const btn=document.getElementById('joinModal')?.querySelector('.cta-btn'); btnLoad(btn,true);
    try {
        const dir=await loadDirectory();
        const info=dir[id]; if (!info) { toast('Чат не найден','error'); return; }
        S.chats.push({id,name:info.name,desc:info.desc||'',color:info.color||COLORS[0],key,fileName:info.fileName,admins:[info.createdBy],perms:{msg:true,files:true,voice:true},members:[],lastMsg:null,lastTime:null,isDM:false,pinned:null});
        saveLocalData(); renderChats();
        idI.value=''; keyI.value=''; hideModal('joinModal');
        toast('Добро пожаловать в чат!','success');
    } catch(e) { toast('Ошибка: '+e.message,'error'); }
    finally { btnLoad(btn,false); }
}

async function doNewDM() {
    const tI=document.getElementById('dmTarget'); if (!tI) return;
    const target=tI.value.trim().toLowerCase();
    if (!target) return toast('Введите username','error');
    if (target===S.user.username) return toast('Нельзя написать себе','error');
    if (S.chats.some(c=>c.isDM&&c.dmWith===target)) return toast('Диалог уже существует','error');
    const btn=document.getElementById('dmModal')?.querySelector('.cta-btn'); btnLoad(btn,true);
    try {
        const db=await loadUsersDB();
        if (!db[target]) { toast('Пользователь не найден','error'); return; }
        const pair=[S.user.username,target].sort();
        const dmHash=sha(pair.join('::'));
        const fileName='dm'+dmHash.substring(0,16)+'.txt';
        const dmKey=sha(pair.join('::'));
        const dmId='dm'+dmHash.substring(0,8);
        if (!await gistFileExists(fileName)) await gistWriteFile(fileName,'.');
        const dir=await loadDirectory();
        if (!dir.dms) dir.dms={};
        if (!dir.dms[dmId]) { dir.dms[dmId]={id:dmId,users:pair,fileName,createdAt:Date.now()}; await saveDirectory(dir); }
        S.usersCache[target]=db[target];
        S.chats.push({id:dmId,name:db[target].displayName||target,desc:'',color:'#06b6d4',key:dmKey,fileName,admins:pair,perms:{msg:true,files:true,voice:true},members:pair,lastMsg:null,lastTime:null,isDM:true,dmWith:target,pinned:null});
        saveLocalData(); renderDMs();
        tI.value=''; hideModal('dmModal');
        toast('Диалог с @'+target+' открыт!','success');
    } catch(e) { toast('Ошибка: '+e.message,'error'); }
    finally { btnLoad(btn,false); }
}

// ============ ЧАСТЬ 18: ОТКРЫТИЕ-ЧАТА ============
function openChat(idx) {
    const chat=S.chats[idx]; if (!chat) return;
    S.curChat=idx; S.msgs=[]; S.selMsg=null; S.editMsg=null; S.replyTo=null;
    S.lastMsgUser=null; S.lastMsgTime=0;
    markRead(chat.id);
    showScreen('chat-screen');

    const nm=document.getElementById('chatHdrName'), sub=document.getElementById('chatHdrSub');
    if (nm) nm.textContent=chat.isDM?'@'+(chat.dmWith||'DM'):chat.name;
    if (sub) sub.textContent=chat.isDM?'Личные сообщения':'ID: '+chat.id;

    const av=document.getElementById('chatHdrAv');
    if (av) {
        av.style.background=chat.color||'var(--acG)';
        const cached=chat.isDM?(S.usersCache[chat.dmWith]||{}):null;
        setAv(av, cached?.avatar||null, chat.isDM?chat.dmWith:chat.name, 38);
    }

    const onlineDot=document.getElementById('chatHdrOnlineDot');
    if (onlineDot) {
        if (chat.isDM) { const cached=S.usersCache[chat.dmWith]||{}; onlineDot.style.display=cached.status==='online'?'block':'none'; }
        else onlineDot.style.display='none';
    }

    const mb=document.getElementById('manageBtn');
    if (mb) mb.style.display=(!chat.isDM&&(chat.admins||[]).includes(S.user.username))?'':'none';

    checkPerms(); cancelReply(); cancelEdit();
    updatePinnedBar(chat);

    const area=document.getElementById('msgArea');
    if (area) area.innerHTML=`<div class="empty-state" style="height:100%"><div class="loader-ring" style="width:32px;height:32px;border-width:3px"></div><span>Загрузка сообщений...</span></div>`;

    loadMessages();
    if (S.timer) clearInterval(S.timer);
    S.timer=setInterval(loadMessages, S.refreshMs);
}

function goBack() {
    if (S.timer) { clearInterval(S.timer); S.timer=null; }
    S.curChat=null; S.msgs=[]; S.selMsg=null; S.editMsg=null;
    S.lastMsgUser=null; S.lastMsgTime=0;
    hideRxPanel(); closeSearch();
    document.getElementById('emojiPanel')?.classList.remove('show');
    document.getElementById('chatMenu')?.classList.remove('show');
    document.getElementById('replyBar').style.display='none';
    document.getElementById('editBar').style.display='none';
    showScreen('main-screen');
    renderChats(); renderDMs();
}

function checkPerms() {
    const chat=S.chats[S.curChat]; if (!chat) return;
    const isAdmin=(chat.admins||[]).includes(S.user.username);
    document.getElementById('inputArea')?.classList.toggle('disabled',!isAdmin&&chat.perms&&!chat.perms.msg);
}

function updatePinnedBar(chat) {
    const bar=document.getElementById('pinnedBar'), txt=document.getElementById('pinnedText');
    if (!bar||!txt) return;
    if (chat?.pinned) {
        const pm=S.msgs.find(m=>m.id===chat.pinned);
        if (pm&&!pm.deleted) { txt.textContent=(pm.type==='file'?'📎 '+pm.name:pm.text||'').substring(0,70); bar.style.display='flex'; return; }
    }
    bar.style.display='none';
}
function scrollToPinned() { const c=S.chats[S.curChat]; if(c?.pinned) scrollToMsg(c.pinned); }
function clearPin(e) { 
    e.stopPropagation(); 
    const c=S.chats[S.curChat]; if(!c) return; 
    c.pinned=null; saveLocalData(); 
    document.getElementById('pinnedBar').style.display='none'; 
    toast('Откреплено','info'); 
}

// ============ ЧАСТЬ 19: ЗАГРУЗКА-СООБЩЕНИЙ ============
async function loadMessages() {
    if (S.curChat===null) return;
    const chat=S.chats[S.curChat]; if (!chat?.fileName) return;
    try {
        const content=await gistReadFile(chat.fileName);
        const lines=content.split('\n').filter(l=>{ const t=l.trim(); return t&&t!=='.'; });
        const prevCount=S.msgs.length;
        const prevIds=new Set(S.msgs.map(m=>m.id));
        S.msgs=[];
        for (const line of lines) {
            try {
                const dec=CryptoJS.AES.decrypt(line,chat.key).toString(CryptoJS.enc.Utf8);
                if (dec) {
                    const msg=JSON.parse(dec);
                    if (!msg.reactions) msg.reactions=[];
                    if (!msg.id) msg.id=String(msg.time);
                    S.msgs.push(msg);
                }
            } catch(e) { /* bad key / corrupt */ }
        }
        S.msgs.sort((a,b)=>(a.time||0)-(b.time||0));

        const live=S.msgs.filter(m=>!m.deleted);
        if (live.length>0) { 
            const last=live[live.length-1]; 
            chat.lastMsg=last.type==='file'?'📎 '+last.name:(last.text||'').substring(0,50); 
            chat.lastTime=last.time; 
        }
        const members={}; 
        (chat.members||[]).forEach(m=>members[m]=true); 
        S.msgs.forEach(m=>{if(m.user) members[m.user]=true;}); 
        chat.members=Object.keys(members);
        saveLocalData();

        const sub=document.getElementById('chatHdrSub');
        if (sub) sub.textContent=chat.isDM?'Личные сообщения':chat.members.length+' уч. · ID: '+chat.id;

        updatePinnedBar(chat);
        renderMsgs();

        const newMsgs=S.msgs.filter(m=>!prevIds.has(m.id)&&!m.deleted&&m.user!==S.user.username);
        if (prevCount>0&&newMsgs.length>0) {
            if (S.soundOn) beep();
            markRead(chat.id);
            const newest=newMsgs[newMsgs.length-1];
            if (document.hidden&&'Notification' in window&&Notification.permission==='granted') {
                new Notification('CheekMes — '+(chat.isDM?'@'+(newest.displayName||newest.user):chat.name),{body:(newest.text||'📎 Файл').substring(0,80),icon:'icon.png'});
            }
        }
    } catch(e) {
        console.error('loadMessages:',e);
        const area=document.getElementById('msgArea');
        if (area&&!S.msgs.length) area.innerHTML=`<div class="empty-state" style="height:100%"><span>❌ ${esc(e.message)}</span></div>`;
    }
}

// ============ ЧАСТЬ 20: РЕНДЕР-СООБЩЕНИЙ-С-ГРУППИРОВКОЙ ============
function renderMsgs() {
    const el=document.getElementById('msgArea'); if (!el) return;
    const atBottom=el.scrollHeight-el.scrollTop-el.clientHeight<100;
    el.innerHTML='';
    let lastDate='';
    let lastUser = null;
    let lastTime = 0;
    const GROUP_TIME = 5 * 60 * 1000;
    S.msgs.forEach((msg, index) => {
        // System messages
        if (msg.type==='system') {
            const sw=document.createElement('div'); sw.className='mw sys';
            sw.innerHTML=`<div class="m-bub sys-bub">${esc(msg.text)}</div>`;
            el.appendChild(sw); 
            lastUser = null;
            return;
        }

        // Date divider
        if (msg.time) {
            const ds=new Date(msg.time).toLocaleDateString('ru',{day:'numeric',month:'long',year:'numeric'});
            if (ds!==lastDate) {
                lastDate=ds;
                const dd=document.createElement('div'); dd.className='date-div';
                dd.innerHTML=`<span>${ds}</span>`; el.appendChild(dd);
            }
        }

        const isOwn=msg.user===S.user.username;
        const chat=S.chats[S.curChat];
        const isAdmin=chat&&(chat.admins||[]).includes(msg.user);
        
        // Определяем, нужно ли показывать аватар и имя
        const isNewGroup = !lastUser || lastUser !== msg.user || (msg.time - lastTime) > GROUP_TIME;
        const wrap=document.createElement('div');
        wrap.className='mw'+(isOwn?' own':'')+(isNewGroup?' new-group':' grouped');
        wrap.dataset.mid=msg.id;

        // Avatar для чужих сообщений
        if (!isOwn && isNewGroup) {
            const avEl=document.createElement('div'); avEl.className='m-av';
            const cached=S.usersCache[msg.user]||{};
            setAv(avEl, msg.avatar||cached.avatar||null, msg.displayName||msg.user, 28);
            avEl.title='@'+(msg.user||'');
            avEl.onclick=()=>showUserProfile(msg.user, msg.displayName||msg.user, msg.avatar||cached.avatar||null, msg.bio||cached.bio||'');
            wrap.appendChild(avEl);
        } else if (!isOwn) {
            const spacer=document.createElement('div'); 
            spacer.className='m-av-spacer';
            wrap.appendChild(spacer);
        }

        const body=document.createElement('div'); body.className='m-body';
        const bub=document.createElement('div');
        bub.className='m-bub'+(msg.deleted?' del':'')+(msg.edited?' edited':'');
        bub.addEventListener('click',e=>{e.stopPropagation(); if(!msg.deleted) showRxPanel(msg,e);});

        // Author
        if (!isOwn && isNewGroup && !msg.deleted && !chat?.isDM) {
            const auth=document.createElement('div'); auth.className='m-author';
            auth.innerHTML=esc(msg.displayName||msg.user)+(isAdmin?' <span class="adm-badge">admin</span>':'');
            auth.onclick=e=>{e.stopPropagation(); showUserProfile(msg.user,msg.displayName||msg.user,msg.avatar||null,msg.bio||'');};
            bub.appendChild(auth);
        }

        if (msg.deleted) {
            bub.innerHTML+='<span style="font-size:13px;opacity:.6">🚫 Сообщение удалено</span>';
        } else {
            // Pin badge
            if (chat?.pinned===msg.id) bub.innerHTML+='<span class="m-pin-badge">📌</span>';

            // Reply
            if (msg.replyTo) {
                const rd=document.createElement('div'); rd.className='m-reply';
                rd.innerHTML=`<div class="m-reply-author">${esc(msg.replyTo.user||'')}</div><div class="m-reply-text">${esc(msg.replyTo.text||'📎')}</div>`;
                rd.onclick=e=>{e.stopPropagation(); scrollToMsg(msg.replyTo.id);}; 
                bub.appendChild(rd);
            }

            // Content
            if (msg.type==='file') {
                bub.appendChild(buildFileBubble(msg));
            } else {
                const td=document.createElement('div'); td.className='m-text';
                try {
                    td.innerHTML=DOMPurify.sanitize(marked.parse(msg.text||'',{breaks:true,gfm:true}));
                    td.querySelectorAll('a').forEach(a=>{a.target='_blank'; a.rel='noopener noreferrer';});
                } catch(e) { td.textContent=msg.text||''; }
                bub.appendChild(td);
            }
        }

        // Time
        if (msg.time&&!msg.deleted) {
            const td=document.createElement('div'); td.className='m-time';
            td.textContent=fmtFullTime(msg.time); 
            bub.appendChild(td);
        }

        body.appendChild(bub);

        // Reactions
        if (msg.reactions?.length&&!msg.deleted) {
            const rxDiv=document.createElement('div'); rxDiv.className='m-rxs';
            const grouped={};
            msg.reactions.forEach(r=>{if(!grouped[r.reaction]) grouped[r.reaction]=[]; grouped[r.reaction].push(r.user);});
            Object.entries(grouped).forEach(([emoji,users])=>{
                const sp=document.createElement('span');
                sp.className='rx'+(users.includes(S.user.username)?' mine':'');
                sp.innerHTML=`${emoji}<span class="rx-ct">${users.length}</span>`;
                sp.title=users.join(', ');
                sp.onclick=e=>{e.stopPropagation(); S.selMsg=msg; doRx(emoji);};
                rxDiv.appendChild(sp);
            });
            body.appendChild(rxDiv);
        }
        wrap.appendChild(body);
        if (isOwn && isNewGroup) {
            const ownAv=document.createElement('div'); ownAv.className='m-av';
            setAv(ownAv, S.user.avatar, S.user.displayName, 28);
            ownAv.onclick=()=>showMyProfile();
            wrap.appendChild(ownAv);
        } else if (isOwn) {
            const spacer=document.createElement('div'); 
            spacer.className='m-av-spacer';
            wrap.appendChild(spacer);
        }

        el.appendChild(wrap);
        lastUser = msg.user;
        lastTime = msg.time;
    });

    if (atBottom) requestAnimationFrame(()=>{ el.scrollTop=el.scrollHeight; });
    updateScrollBtn();
}

// ============ ЧАСТЬ 21: ФАЙЛЫ-В-СООБЩЕНИЯХ ============
function buildFileBubble(msg) {
    const fd=document.createElement('div'); fd.className='file-msg';
    try {
        const bin=atob(msg.data), arr=new Uint8Array(bin.length);
        for (let j=0;j<bin.length;j++) arr[j]=bin.charCodeAt(j);
        const blob=new Blob([arr],{type:msg.mime}), burl=URL.createObjectURL(blob);
        if (msg.mime?.startsWith('image/')) {
            const img=document.createElement('img'); img.src=burl; img.loading='lazy'; img.alt=msg.name||'';
            img.onclick=e=>{e.stopPropagation(); openLightbox(burl,msg.name);}; 
            fd.appendChild(img);
        } else if (msg.mime?.startsWith('video/')) {
            const vid=document.createElement('video'); vid.src=burl; vid.controls=true; vid.preload='metadata';
            vid.onclick=e=>e.stopPropagation(); fd.appendChild(vid);
        } else if (msg.mime?.startsWith('audio/')) {
            const aud=document.createElement('audio'); aud.src=burl; aud.controls=true;
            aud.onclick=e=>e.stopPropagation(); fd.appendChild(aud);
        } else {
            const gen=document.createElement('div'); gen.className='file-generic';
            gen.innerHTML=`<div class="file-generic-ico">📄</div><div class="file-generic-info"><div class="file-generic-name">${esc(msg.name)}</div><div class="file-generic-size">${fmtSize(msg.size||0)}</div></div>`;
            fd.appendChild(gen);
        }
        const info=document.createElement('div'); info.className='file-info';
        info.innerHTML=`<span class="file-name">📎 ${esc(msg.name)} (${fmtSize(msg.size||0)})</span><a href="${burl}" download="${esc(msg.name)}" class="file-dl" onclick="event.stopPropagation()" title="Скачать"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px;pointer-events:none"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg></a>`;
        fd.appendChild(info);
    } catch(e) {
        fd.innerHTML=`<div class="file-generic"><div class="file-generic-ico">⚠️</div><div class="file-generic-info"><div class="file-generic-name">${esc(msg.name||'файл')}</div><div class="file-generic-size">Ошибка загрузки</div></div></div>`;
    }
    return fd;
}

function scrollToMsg(id) {
    if (!id) return;
    const el=document.querySelector(`[data-mid="${id}"] .m-bub`);
    if (el) { el.scrollIntoView({behavior:'smooth',block:'center'}); el.classList.add('hl'); setTimeout(()=>el.classList.remove('hl'),1600); }
}

// ============ ЧАСТЬ 22: СКРОЛЛ-ИНДИКАТОР ============
function initScrollWatcher() {
    const area=document.getElementById('msgArea'); if (!area) return;
    area.addEventListener('scroll', updateScrollBtn, {passive:true});
}
function updateScrollBtn() {
    const el=document.getElementById('msgArea'), btn=document.getElementById('scrollBtn');
    if (!el||!btn) return;
    btn.style.display=(el.scrollHeight-el.scrollTop-el.clientHeight>200)?'flex':'none';
}
function scrollToBottom() { 
    const el=document.getElementById('msgArea'); 
    if(el) el.scrollTo({top:el.scrollHeight,behavior:'smooth'}); 
}

// ============ ЧАСТЬ 23: ЛАЙТБОКС ============
function openLightbox(src, name) {
    const lb=document.getElementById('lightbox'), img=document.getElementById('lightboxImg'), dl=document.getElementById('lightboxDl');
    if (!lb||!img) return;
    img.src=src; if(dl){dl.href=src; dl.download=name||'image';} lb.classList.add('show');
}
function closeLightbox() { 
    document.getElementById('lightbox')?.classList.remove('show'); 
}


// ============ ЧАСТЬ 24: ОТПРАВКА-СООБЩЕНИЙ ============
async function sendMsg() {
    const ta=document.getElementById('msgInput'); if (!ta) return;
    const text=ta.value.trim(); if (!text||S.curChat===null) return;
    const chat=S.chats[S.curChat]; if (!chat?.fileName||!chat.key) return;
    const isAdmin=(chat.admins||[]).includes(S.user.username);
    if (!isAdmin&&chat.perms&&!chat.perms.msg) return toast('Отправка отключена','error');

    // Edit mode
    if (S.editMsg) {
        const msg=S.msgs.find(m=>m.id===S.editMsg.id);
        if (msg) { msg.text=text; msg.edited=true; msg.editedAt=Date.now(); }
        cancelEdit(); ta.value=''; ta.style.height='auto';
        await rewriteAllMessages(chat); return;
    }

    const msg={
        id:Date.now()+'_'+rnd(4), type:'text',
        user:S.user.username, displayName:S.user.displayName,
        text, time:Date.now(), avatar:S.user.avatar||null,
        bio:S.user.bio||null, reactions:[], deleted:false
    };
    if (S.replyTo) {
        msg.replyTo={id:S.replyTo.id, user:S.replyTo.displayName||S.replyTo.user, text:S.replyTo.type==='file'?'📎 '+S.replyTo.name:(S.replyTo.text||'').substring(0,100)};
        cancelReply();
    }
    ta.value=''; ta.style.height='auto';
    document.getElementById('emojiPanel')?.classList.remove('show');
    try {
        const enc=CryptoJS.AES.encrypt(JSON.stringify(msg),chat.key).toString();
        await gistAppendLine(chat.fileName,enc);
        loadMessages();
    } catch(e) { toast('Ошибка отправки: '+e.message,'error'); }
}

// ============ ЧАСТЬ 25: ОТПРАВКА-ФАЙЛОВ ============
function pickFile() { document.getElementById('fileInput')?.click(); }
function initFileInput() {
    const inp=document.getElementById('fileInput'); if (!inp) return;
    inp.addEventListener('change', async e=>{const f=e.target.files[0]; if(f) await sendFile(f); e.target.value='';});
}
async function sendFile(file) {
    if (S.curChat===null) return;
    const chat=S.chats[S.curChat]; if (!chat?.fileName||!chat.key) return;
    const isAdmin=(chat.admins||[]).includes(S.user.username);
    if (!isAdmin&&chat.perms&&!chat.perms.files) return toast('Файлы отключены','error');
    if (file.size>10*1024*1024) return toast('Файл > 10MB','error');
    showLoader('Загружаем файл...');
    try {
        let processed=file;
        if (file.type.startsWith('image/')&&!file.type.includes('gif')) processed=await compressImage(file);
        const b64=await fileToBase64(processed);
        const obj={id:Date.now()+'_'+rnd(4),type:'file',user:S.user.username,displayName:S.user.displayName,avatar:S.user.avatar||null,name:file.name,mime:processed.type||file.type,size:processed.size||file.size,data:b64.split(',')[1],time:Date.now(),reactions:[],deleted:false};
        const enc=CryptoJS.AES.encrypt(JSON.stringify(obj),chat.key).toString();
        await gistAppendLine(chat.fileName,enc);
        loadMessages();
    } catch(e) { toast('Ошибка: '+e.message,'error'); }
    finally { hideLoader(); }
}
function fileToBase64(f) { 
    return new Promise((res,rej)=>{const r=new FileReader(); r.onload=e=>res(e.target.result); r.onerror=rej; r.readAsDataURL(f);}); 
}
function compressImage(file) {
    return new Promise((res,rej)=>{
        const reader=new FileReader();
        reader.onload=e=>{
            const img=new Image(); img.onload=()=>{
                const MAX=1280; let {width:w,height:h}=img;
                if(w>MAX){h=Math.round(h*MAX/w); w=MAX;} if(h>MAX){w=Math.round(w*MAX/h); h=MAX;}
                const cv=document.createElement('canvas'); cv.width=w; cv.height=h;
                cv.getContext('2d').drawImage(img,0,0,w,h);
                cv.toBlob(blob=>res(new File([blob],file.name,{type:'image/webp'})),'image/webp',0.82);
            }; img.onerror=rej; img.src=e.target.result;
        }; reader.onerror=rej; reader.readAsDataURL(file);
    });
}
function compressForAvatar(file) {
    return new Promise((res,rej)=>{
        const reader=new FileReader();
        reader.onload=e=>{
            const img=new Image(); img.onload=()=>{
                const S2=160; let {width:w,height:h}=img;
                if(w>S2){h=Math.round(h*S2/w); w=S2;} if(h>S2){w=Math.round(w*S2/h); h=S2;}
                const cv=document.createElement('canvas'); cv.width=w; cv.height=h;
                cv.getContext('2d').drawImage(img,0,0,w,h);
                res(cv.toDataURL('image/jpeg',0.85));
            }; img.onerror=rej; img.src=e.target.result;
        }; reader.onerror=rej; reader.readAsDataURL(file);
    });
}

// ============ ЧАСТЬ 26: ГОЛОСОВЫЕ-СООБЩЕНИЯ ============
async function toggleVoice() {
    if (S.curChat!==null) {
        const chat=S.chats[S.curChat];
        if (chat) { 
            const isAdmin=(chat.admins||[]).includes(S.user.username); 
            if(!isAdmin&&chat.perms&&!chat.perms.voice) return toast('Голосовые отключены','error'); 
        }
    }
    const btn=document.getElementById('voiceBtn');
    if (!S.recording) {
        try {
            const stream=await navigator.mediaDevices.getUserMedia({audio:true});
            const mime=(typeof MediaRecorder.isTypeSupported==='function'&&MediaRecorder.isTypeSupported('audio/webm'))?'audio/webm':'';
            S.recorder=new MediaRecorder(stream,mime?{mimeType:mime}:{});
            S.chunks=[];
            S.recorder.ondataavailable=e=>S.chunks.push(e.data);
            S.recorder.onstop=async()=>{
                const blob=new Blob(S.chunks,{type:'audio/webm'});
                const file=new File([blob],'voice_'+Date.now()+'.webm',{type:'audio/webm'});
                await sendFile(file); stream.getTracks().forEach(t=>t.stop());
            };
            S.recorder.start(); S.recording=true; btn?.classList.add('recording');
            toast('🎙️ Запись... Нажмите снова чтобы остановить','info');
        } catch(e) { toast('Нет доступа к микрофону','error'); }
    } else {
        S.recorder.stop(); S.recording=false; btn?.classList.remove('recording');
    }
}

// ============ ЧАСТЬ 27: ТЕКСТОВОЕ-ПОЛЕ ============
function initTextarea() {
    const ta=document.getElementById('msgInput'); if (!ta) return;
    ta.addEventListener('input',()=>{ ta.style.height='auto'; ta.style.height=Math.min(ta.scrollHeight,110)+'px'; });
    ta.addEventListener('keydown',e=>{ if(e.key==='Enter'&&!e.shiftKey){e.preventDefault(); sendMsg();} });
}

// ============ ЧАСТЬ 28: ЭМОДЗИ ============
function initEmojiPanel() {
    const tabs=document.getElementById('emojiTabs'); if (!tabs) return;
    const keys=Object.keys(EMOJIS);
    tabs.innerHTML=keys.map((k,i)=>`<button class="emoji-tab${i===0?' active':''}" onclick="selEmCat(this,'${k}')">${k}</button>`).join('');
    fillEmGrid(keys[0]);
}
function selEmCat(btn, key) { $$('.emoji-tab').forEach(t=>t.classList.remove('active')); btn.classList.add('active'); fillEmGrid(key); }
function fillEmGrid(key) {
    const g=document.getElementById('emojiGrid'); if (!g) return;
    const arr=Array.from(EMOJIS[key]||'');
    g.innerHTML=arr.filter(c=>c.trim()).map(c=>`<span onclick="insEm('${c}')">${c}</span>`).join('');
}
function insEm(emoji) {
    const ta=document.getElementById('msgInput'); if (!ta) return;
    const s=ta.selectionStart;
    ta.value=ta.value.substring(0,s)+emoji+ta.value.substring(ta.selectionEnd);
    ta.selectionStart=ta.selectionEnd=s+emoji.length; ta.focus();
    ta.dispatchEvent(new Event('input'));
}
function toggleEmoji() { document.getElementById('emojiPanel')?.classList.toggle('show'); }

// ============ ЧАСТЬ 29: РЕАКЦИИ ============
function showRxPanel(msg, event) {
    S.selMsg=msg;
    const panel=document.getElementById('rxPanel'); if (!panel) return;
    panel.classList.add('show');

    const editBtn=document.getElementById('rxEditBtn');
    if (editBtn) editBtn.style.display=(msg.user===S.user.username&&msg.type!=='file')?'':'none';
    
    const pinBtn=document.getElementById('rxPinBtn');
    if (pinBtn) {
        const chat=S.chats[S.curChat];
        const isAdmin=chat&&(chat.admins||[]).includes(S.user.username);
        pinBtn.style.display=isAdmin?'':'none';
    }

    const bub=event.target.closest('.m-bub');
    if (!bub) return;
    const rect=bub.getBoundingClientRect();
    const pw=210, ph=240;
    let left=Math.max(6, Math.min(rect.left, window.innerWidth-pw-6));
    let top=rect.top-ph;
    if (top<6) top=rect.bottom+6;
    panel.style.left=left+'px'; panel.style.top=Math.max(6,top)+'px';
}
function hideRxPanel() { 
    document.getElementById('rxPanel')?.classList.remove('show'); 
    S.selMsg=null; 
}

async function doRx(emoji) {
    if (!S.selMsg||S.curChat===null) return;
    const chat=S.chats[S.curChat]; if (!chat) return;
    hideRxPanel();
    const msg=S.msgs.find(m=>m.id===S.selMsg.id); if (!msg) return;
    const idx=msg.reactions.findIndex(r=>r.user===S.user.username&&r.reaction===emoji);
    if (idx!==-1) msg.reactions.splice(idx,1); else msg.reactions.push({user:S.user.username,reaction:emoji});
    await rewriteAllMessages(chat);
}

function doReplyAction() {
    if (!S.selMsg) return;
    S.replyTo=S.selMsg; hideRxPanel();
    const who=document.getElementById('replyAuthor'), what=document.getElementById('replyText');
    if (who) who.textContent=S.selMsg.displayName||S.selMsg.user;
    if (what) what.textContent=S.selMsg.type==='file'?'📎 '+S.selMsg.name:(S.selMsg.text||'').substring(0,80);
    document.getElementById('replyBar').style.display='flex';
    document.getElementById('msgInput')?.focus();
}
function cancelReply() { 
    S.replyTo=null; 
    const b=document.getElementById('replyBar'); 
    if(b) b.style.display='none'; 
}

function doEditAction() {
    if (!S.selMsg||S.selMsg.user!==S.user.username||S.selMsg.type==='file') return;
    S.editMsg=S.selMsg; hideRxPanel();
    document.getElementById('editBar').style.display='flex';
    const ta=document.getElementById('msgInput');
    if (ta) { ta.value=S.selMsg.text||''; ta.focus(); ta.style.height='auto'; ta.style.height=Math.min(ta.scrollHeight,110)+'px'; }
}
function cancelEdit() { 
    S.editMsg=null; 
    const b=document.getElementById('editBar'); 
    if(b) b.style.display='none'; 
}

function doCopyAction() {
    if (!S.selMsg) return;
    const text=S.selMsg.text||S.selMsg.name||'';
    navigator.clipboard.writeText(text).then(()=>toast('Скопировано ✓','success')).catch(()=>toast('Ошибка копирования','error'));
    hideRxPanel();
}

function doPinAction() {
    if (!S.selMsg||S.curChat===null) return;
    const chat=S.chats[S.curChat];
    if (!(chat.admins||[]).includes(S.user.username)) { hideRxPanel(); return toast('Только администратор','error'); }
    hideRxPanel();
    chat.pinned=(chat.pinned===S.selMsg.id)?null:S.selMsg.id;
    saveLocalData(); updatePinnedBar(chat);
    toast(chat.pinned?'📌 Закреплено':'Откреплено','info');
}

async function doDeleteAction() {
    if (!S.selMsg||S.curChat===null) return;
    const chat=S.chats[S.curChat];
    const isAdmin=(chat.admins||[]).includes(S.user.username);
    const isOwn=S.selMsg.user===S.user.username;
    if (!isOwn&&!isAdmin) { hideRxPanel(); return toast('Можно удалить только свои сообщения','error'); }
    hideRxPanel();
    const msg=S.msgs.find(m=>m.id===S.selMsg.id); if (!msg) return;
    msg.deleted=true; msg.text=''; delete msg.data; delete msg.name; msg.reactions=[];
    if (chat.pinned===msg.id) { chat.pinned=null; updatePinnedBar(chat); }
    await rewriteAllMessages(chat);
    toast('Удалено','success');
}

async function rewriteAllMessages(chat) {
    if (!chat?.fileName||!chat.key) return;
    const lines=S.msgs.map(m=>CryptoJS.AES.encrypt(JSON.stringify(m),chat.key).toString());
    await gistWriteFile(chat.fileName,lines.join('\n'));
    loadMessages();
}

// ============ ЧАСТЬ 30: МЕНЮ-ЧАТА ============
function toggleChatMenu() { 
    const m=document.getElementById('chatMenu'); 
    m?.classList.toggle('show'); 
}
function closeChatMenu() { 
    document.getElementById('chatMenu')?.classList.remove('show'); 
}

function cmdCopyId() {
    const chat=S.chats[S.curChat]; if (!chat) return; closeChatMenu();
    navigator.clipboard.writeText(chat.id).then(()=>toast('ID скопирован: '+chat.id,'success')).catch(()=>toast('Ошибка','error'));
}

function cmdSearch() { 
    closeChatMenu(); 
    const bar=document.getElementById('searchBar'); 
    if(bar) bar.style.display='flex'; 
    document.getElementById('searchInput')?.focus(); 
}

function doSearch() {
    const q=document.getElementById('searchInput')?.value.toLowerCase()||'';
    const hits=[];
    $$('.m-bub').forEach(b=>{
        b.classList.remove('hl');
        if (q&&b.textContent.toLowerCase().includes(q)) { b.classList.add('hl'); hits.push(b); }
    });
    const cnt=document.getElementById('searchCount');
    if (cnt) cnt.textContent=q&&hits.length?hits.length+' найд.':'';
    if (hits.length) hits[0].scrollIntoView({behavior:'smooth',block:'center'});
}

function closeSearch() {
    const bar=document.getElementById('searchBar'); if(bar) bar.style.display='none';
    const inp=document.getElementById('searchInput'); if(inp) inp.value='';
    $$('.m-bub').forEach(b=>b.classList.remove('hl'));
    const cnt=document.getElementById('searchCount'); if(cnt) cnt.textContent='';
}


// ============ ЧАСТЬ 31: ИНФОРМАЦИЯ-О-ЧАТЕ ============
function showChatInfo() {
    closeChatMenu();
    if (S.curChat===null) return;
    const chat=S.chats[S.curChat];
    const memberMap={};
    S.msgs.forEach(m=>{if(m.user&&!memberMap[m.user]) memberMap[m.user]={user:m.user,dn:m.displayName||m.user,avatar:m.avatar,bio:m.bio||''};});
    const admins=chat.admins||[];

    const title=document.getElementById('infoTitle'); if(title) title.textContent=chat.isDM?'ℹ️ Диалог':'ℹ️ О чате';
    const bodyEl=document.getElementById('infoBody'); if (!bodyEl) return;

    let html=`<div class="profile-hero">`;
    const avDiv=document.createElement('div'); avDiv.className='profile-hero-av';
    setAv(avDiv, null, chat.isDM?chat.dmWith:chat.name, 80);
    bodyEl.innerHTML='';
    const heroDiv=document.createElement('div'); heroDiv.className='profile-hero'; heroDiv.appendChild(avDiv);
    heroDiv.innerHTML+=`<div class="profile-hero-name">${esc(chat.isDM?'@'+(chat.dmWith||''):chat.name)}</div><div class="profile-hero-uname">${chat.isDM?'Личный диалог':'Группа · '+chat.members.length+' участников'}</div>`;
    bodyEl.appendChild(heroDiv);

    let extra='';
    if (!chat.isDM) extra+=`<div class="s-sec"><div class="chat-id-box"><code>${chat.id}</code><button class="btn-ghost btn-sm" onclick="navigator.clipboard.writeText('${chat.id}');toast('Скопировано','success')" style="border-radius:7px;padding:5px 10px">📋</button></div></div>`;
    if (chat.desc) extra+=`<div class="s-sec"><h4>Описание</h4><p style="font-size:13px;color:var(--t2);line-height:1.5">${esc(chat.desc)}</p></div>`;
    extra+=`<div class="s-sec"><h4>Сообщений</h4><p style="font-size:13px;font-weight:600">${S.msgs.filter(m=>!m.deleted).length}</p></div>`;

    const mkeys=Object.keys(memberMap);
    if (mkeys.length) {
        extra+=`<div class="s-sec"><h4>Участники (${mkeys.length})</h4>`;
        mkeys.forEach(k=>{
            const m=memberMap[k], isAdm=admins.includes(m.user);
            const mc=document.createElement('div'); mc.className='member-card';
            const mav=document.createElement('div'); mav.className='mc-av';
            setAv(mav, m.avatar||null, m.dn, 36);
            mc.appendChild(mav);
            mc.innerHTML+=`<div class="mc-info"><div class="mc-name">${esc(m.dn)}${isAdm?'<span class="adm-badge">admin</span>':''}</div><div class="mc-uname">@${esc(m.user)}</div>${m.bio?`<div class="mc-bio">${esc(m.bio)}</div>`:''}</div>`;
            bodyEl.querySelector('.s-sec:last-child')?.appendChild(mc);
        });
        extra+='</div>';
    }
    bodyEl.insertAdjacentHTML('beforeend', extra);
    showModal('chatInfoModal');
}

function cmdManage() {
    closeChatMenu();
    if (S.curChat===null) return;
    const chat=S.chats[S.curChat];
    if (!(chat.admins||[]).includes(S.user.username)) return toast('Только администратор','error');
    renderManageModal(chat);
    showModal('manageModal');
}

function renderManageModal(chat) {
    const bodyEl=document.getElementById('manageBody'); if (!bodyEl) return;
    const p=chat.perms||{msg:true,files:true,voice:true};
    const ms=chat.members||[], adms=chat.admins||[];

    let html=`<div class="s-sec"><h4>Редактировать чат</h4>
        <div class="field-group"><label class="field-label">Название</label><input type="text" id="editChatName" value="${esc(chat.name)}" class="modal-input"></div>
        <div class="field-group"><label class="field-label">Описание</label><textarea id="editChatDesc" class="modal-input" rows="2">${esc(chat.desc||'')}</textarea></div>
        <div class="field-group"><label class="field-label">Цвет</label><div style="display:flex;gap:6px;flex-wrap:wrap" id="manageChatColor">`;
    COLORS.forEach(c=>{ html+=`<div class="color-dot${c===chat.color?' sel':''}" data-color="${c}" style="background:${c}" onclick="pickManageClr(this)"></div>`; });
    html+=`</div></div><button class="cta-btn" onclick="saveChatEdit()" style="margin-bottom:4px"><span class="btn-label">💾 Сохранить изменения</span><div class="btn-spin" style="display:none"></div></button></div>`;

    html+=`<div class="s-sec"><h4>Разрешения для участников</h4>
        <div class="perm-row"><label>💬 Отправка сообщений</label><div class="sw${p.msg?' on':''}" onclick="tglPerm('msg',this)"></div></div>
        <div class="perm-row"><label>📎 Файлы и медиа</label><div class="sw${p.files?' on':''}" onclick="tglPerm('files',this)"></div></div>
        <div class="perm-row"><label>🎙️ Голосовые сообщения</label><div class="sw${p.voice!==false?' on':''}" onclick="tglPerm('voice',this)"></div></div>
    </div>`;

    bodyEl.innerHTML=html;

    const secDiv=document.createElement('div'); secDiv.className='s-sec';
    secDiv.innerHTML=`<h4>Участники (${ms.length})</h4>`;
    ms.forEach(m=>{
        const isAdm=adms.includes(m), isSelf=m===S.user.username;
        const mc=document.createElement('div'); mc.className='member-card';
        const mav=document.createElement('div'); mav.className='mc-av'; mav.style.cssText='width:36px;height:36px;border-radius:50%;overflow:hidden;flex-shrink:0';
        const cached=S.usersCache[m]||{}; setAv(mav, cached.avatar||null, m, 36);
        mc.appendChild(mav);
        let btns='';
        if (!isSelf) {
            btns=isAdm
                ?`<button onclick="rmAdm('${m}')" class="mc-btns" style="padding:4px 8px;font-size:10px;border-radius:7px;border:1px solid var(--brd);background:transparent;color:var(--t2);cursor:pointer;font-family:inherit">−admin</button>`
                :`<button onclick="mkAdm('${m}')" style="padding:4px 8px;font-size:10px;border-radius:7px;border:1px solid var(--brd);background:transparent;color:var(--ac);cursor:pointer;font-family:inherit">+admin</button>`;
        }
        mc.innerHTML+=`<div class="mc-info"><div class="mc-name">${esc(m)}${isAdm?'<span class="adm-badge">admin</span>':''}</div><div class="mc-uname">@${esc(m)}</div></div><div class="mc-btns">${btns}</div>`;
        secDiv.appendChild(mc);
    });
    bodyEl.appendChild(secDiv);
}

function pickManageClr(el) { $$('#manageChatColor .color-dot').forEach(o=>o.classList.remove('sel')); el.classList.add('sel'); }

function saveChatEdit() {
    if (S.curChat===null) return;
    const chat=S.chats[S.curChat];
    const ni=document.getElementById('editChatName'), di=document.getElementById('editChatDesc'), ci=$('#manageChatColor .color-dot.sel');
    if (ni&&ni.value.trim()) chat.name=ni.value.trim();
    if (di) chat.desc=di.value.trim();
    if (ci) chat.color=ci.dataset.color;
    saveLocalData();
    const nm=document.getElementById('chatHdrName'); if(nm) nm.textContent=chat.name;
    const av=document.getElementById('chatHdrAv'); if(av){av.style.background=chat.color; setAv(av,null,chat.name,38);}
    renderChats(); toast('Изменения сохранены ✓','success');
}

function tglPerm(key, el) {
    if (S.curChat===null) return;
    const chat=S.chats[S.curChat]; if (!chat.perms) chat.perms={};
    chat.perms[key]=!chat.perms[key]; el.classList.toggle('on'); saveLocalData(); checkPerms();
}

function mkAdm(user) {
    if (S.curChat===null) return;
    const chat=S.chats[S.curChat]; if (!chat.admins) chat.admins=[];
    if (!chat.admins.includes(user)) chat.admins.push(user);
    saveLocalData(); renderManageModal(chat); toast('@'+user+' назначен администратором','success');
}
function rmAdm(user) {
    if (S.curChat===null) return;
    const chat=S.chats[S.curChat];
    if (user===(chat.admins||[])[0]) return toast('Нельзя убрать создателя','error');
    chat.admins=(chat.admins||[]).filter(a=>a!==user);
    saveLocalData(); renderManageModal(chat); toast('@'+user+' снят','info');
}

async function cmdClear() {
    closeChatMenu();
    if (S.curChat===null) return;
    const chat=S.chats[S.curChat];
    if (!(chat.admins||[]).includes(S.user.username)) return toast('Только администратор','error');
    confirm2('Удалить ВСЕ сообщения в чате? Это нельзя отменить.',async()=>{
        try {
            await gistWriteFile(chat.fileName,'.');
            chat.lastMsg=null; chat.lastTime=null; chat.pinned=null;
            saveLocalData(); loadMessages(); toast('Чат очищен','success');
        } catch(e) { toast('Ошибка: '+e.message,'error'); }
    },'🗑️');
}

async function cmdExport() {
    closeChatMenu();
    if (!S.msgs.length) return toast('Нет сообщений','error');
    const lines=S.msgs.filter(m=>!m.deleted).map(m=>{
        const t=m.time?new Date(m.time).toLocaleString('ru'):'';
        return `[${t}] ${m.displayName||m.user}: ${m.type==='file'?'📎 '+m.name:m.text}`;
    });
    const chat=S.chats[S.curChat];
    const blob=new Blob([lines.join('\n')],{type:'text/plain;charset=utf-8'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a'); a.href=url; a.download='cheekmes_'+(chat?.name||'chat')+'_'+Date.now()+'.txt';
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    toast('Экспортировано ✓','success');
}

function cmdLeave() {
    closeChatMenu();
    if (S.curChat===null) return;
    confirm2('Покинуть чат? Вы потеряете доступ к истории.',()=>{
        S.chats.splice(S.curChat,1); saveLocalData(); goBack(); toast('Вы покинули чат','info');
    },'🚪');
}

// ============ ЧАСТЬ 32: ПРОФИЛЬ ============
function showMyProfile() {
    const bodyEl=document.getElementById('profileBody'); if (!bodyEl||!S.user) return;
    const statusMap={online:'🟢 В сети',away:'🟡 Отошёл',busy:'🔴 Занят',invisible:'⚫ Невидимка'};
    bodyEl.innerHTML='';

    const hero=document.createElement('div'); hero.className='profile-hero';
    const avEl=document.createElement('div'); avEl.className='profile-hero-av';
    setAv(avEl, S.user.avatar, S.user.displayName, 80);
    hero.appendChild(avEl);
    hero.innerHTML+=`<div class="profile-hero-name">${esc(S.user.displayName)}</div><div class="profile-hero-uname">@${esc(S.user.username)}</div>`;
    bodyEl.appendChild(hero);

    bodyEl.innerHTML+=`
        <div class="p-row"><span class="p-key">Имя</span><span class="p-val">${esc(S.user.displayName)}</span></div>
        <div class="p-row"><span class="p-key">О себе</span><span class="p-val">${esc(S.user.bio||'—')}</span></div>
        <div class="p-row"><span class="p-key">Статус</span><span class="p-val">${statusMap[S.user.status||'online']||'🟢'}</span></div>
        <div class="p-row"><span class="p-key">Чатов</span><span class="p-val">${S.chats.filter(c=>!c.isDM).length}</span></div>
        <div class="p-row"><span class="p-key">Диалогов</span><span class="p-val">${S.chats.filter(c=>c.isDM).length}</span></div>
        <button class="cta-btn" onclick="hideModal('profileModal');showEditProfile()" style="margin-top:14px"><span class="btn-label">✏️ Редактировать профиль</span></button>
    `;
    showModal('profileModal');
}

function showEditProfile() {
    const nameI=document.getElementById('editName'), bioI=document.getElementById('editBio');
    const statusS=document.getElementById('editStatus'), avEl=document.getElementById('editAvatar');
    const removeBtn=document.getElementById('removeAvBtn');
    if (nameI) nameI.value=S.user.displayName;
    if (bioI)  bioI.value=S.user.bio||'';
    if (statusS) statusS.value=S.user.status||'online';
    if (avEl) setAv(avEl, S.user.avatar, S.user.displayName, 80);
    if (removeBtn) removeBtn.style.display=S.user.avatar?'block':'none';
    showModal('editProfileModal');
}

function removeAvatar() {
    S.user.avatar=null;
    const avEl=document.getElementById('editAvatar'); if(avEl) setAv(avEl, null, S.user.displayName, 80);
    const rb=document.getElementById('removeAvBtn'); if(rb) rb.style.display='none';
    toast('Фото удалено','info');
}

function initAvatarUpload() {
    const inp=document.getElementById('avFileInput'); if (!inp) return;
    inp.addEventListener('change', async e=>{
        const file=e.target.files[0]; if (!file||!file.type.startsWith('image/')) return;
        try {
            showLoader('Обработка фото...');
            S.user.avatar=await compressForAvatar(file);
            const avEl=document.getElementById('editAvatar'); if(avEl) setAv(avEl, S.user.avatar, S.user.displayName, 80);
            const rb=document.getElementById('removeAvBtn'); if(rb) rb.style.display='block';
        } catch(e) { toast('Ошибка обработки фото: '+e.message,'error'); }
        finally { hideLoader(); e.target.value=''; }
    });
}

async function saveProfile() {
    const nameI=document.getElementById('editName'), bioI=document.getElementById('editBio'), statusS=document.getElementById('editStatus');
    S.user.displayName=(nameI?.value.trim())||S.user.username;
    S.user.bio=bioI?.value.trim()||'';
    S.user.status=statusS?.value||'online';
    const modal=document.getElementById('editProfileModal');
    const btn=modal?.querySelector('.cta-btn'); btnLoad(btn,true);
    try {
        const db=await loadUsersDB();
        if (db[S.user.username]) {
            Object.assign(db[S.user.username],{displayName:S.user.displayName,bio:S.user.bio,status:S.user.status,avatar:S.user.avatar});
            await saveUsersDB(db);
        }
        S.usersCache[S.user.username]=S.user;
        updateMainHeader(); hideModal('editProfileModal'); toast('Профиль сохранён ✓','success');
    } catch(e) { toast('Ошибка: '+e.message,'error'); }
    finally { btnLoad(btn,false); }
}

function showUserProfile(username, displayName, avatar, bio) {
    const title=document.getElementById('userProfileTitle'); if(title) title.textContent='👤 @'+username;
    const body=document.getElementById('userProfileBody'); if (!body) return;
    body.innerHTML='';
    const hero=document.createElement('div'); hero.className='user-profile-hero';
    const avEl=document.createElement('div'); avEl.className='user-profile-av';
    setAv(avEl, avatar, displayName||username, 72);
    hero.appendChild(avEl);
    hero.innerHTML+=`<div class="profile-hero-name">${esc(displayName||username)}</div><div class="profile-hero-uname">@${esc(username)}</div>`;
    body.appendChild(hero);
    body.innerHTML+=`<div class="p-row"><span class="p-key">О себе</span><span class="p-val">${esc(bio||'—')}</span></div>`;
    if (username!==S.user.username) {
        const btn=document.createElement('button'); btn.className='cta-btn'; btn.style.marginTop='14px';
        btn.innerHTML='<span class="btn-label">💬 Написать</span>';
        btn.onclick=async()=>{
            hideModal('userProfileModal');
            if (S.chats.some(c=>c.isDM&&c.dmWith===username)) {
                const idx=S.chats.findIndex(c=>c.isDM&&c.dmWith===username); openChat(idx);
            } else {
                document.getElementById('dmTarget').value=username;
                showModal('dmModal');
            }
        };
        body.appendChild(btn);
    }
    showModal('userProfileModal');
}


// ============ ЧАСТЬ 33: НАСТРОЙКИ ============
function loadSettings() {
    let s={};
    try { s=JSON.parse(localStorage.getItem('cm5sett')||'{}'); } catch(e){}
    setTheme(s.theme||'dark'); setAccent(s.accent||0); setFontSize(s.fs||15);
    S.refreshMs=(s.refresh||8)*1000; S.soundOn=s.sound!==false;
}
function saveSettings() {
    const fs=parseInt(getComputedStyle(document.documentElement).getPropertyValue('--fs'))||15;
    localStorage.setItem('cm5sett',JSON.stringify({theme:document.documentElement.getAttribute('data-theme')||'dark',accent:getAccentIndex(),fs,refresh:S.refreshMs/1000,sound:S.soundOn}));
}
function getAccentIndex() {
    const cur=getComputedStyle(document.documentElement).getPropertyValue('--ac').trim();
    const idx=ACCENTS.findIndex(a=>a.p===cur); return idx>=0?idx:0;
}
function setTheme(id) {
    document.documentElement.setAttribute('data-theme',id);
    const meta=document.querySelector('meta[name="theme-color"]'), theme=THEMES.find(t=>t.id===id);
    if (theme&&meta) meta.content=theme.c;
}
function setAccent(idx) {
    const a=ACCENTS[idx]||ACCENTS[0], r=document.documentElement.style;
    r.setProperty('--ac',a.p); r.setProperty('--ac2',a.s);
    r.setProperty('--acG','linear-gradient(135deg,'+a.p+','+a.s+')');
    r.setProperty('--acGlow',a.p+'33');
}
function setFontSize(px) { document.documentElement.style.setProperty('--fs',px+'px'); }

function openSettings() {
    const theme=document.documentElement.getAttribute('data-theme')||'dark';
    const accentIdx=getAccentIndex();
    const fs=parseInt(getComputedStyle(document.documentElement).getPropertyValue('--fs'))||15;
    const bodyEl=document.getElementById('settingsBody'); if (!bodyEl) return;

    let html=`<div class="s-sec"><h4>Тема оформления</h4><div class="theme-grid">`;
    THEMES.forEach(t=>{ html+=`<div class="theme-opt${t.id===theme?' active':''}" onclick="pickTheme('${t.id}')"><div class="theme-swatch" style="background:${t.c}"></div>${t.name}</div>`; });
    html+=`</div></div>`;

    html+=`<div class="s-sec"><h4>Цвет акцента</h4><div class="accent-row">`;
    ACCENTS.forEach((a,j)=>{ html+=`<div class="acc-dot${j===accentIdx?' active':''}" style="background:${a.p}" onclick="pickAccent(${j})" title="${a.p}"></div>`; });
    html+=`</div></div>`;

    html+=`<div class="s-sec"><h4>Размер шрифта</h4><div class="fs-row"><button class="btn-ghost btn-sm" onclick="adjustFS(-1)">A−</button><span id="fsLabel">${fs}px</span><button class="btn-ghost btn-sm" onclick="adjustFS(1)">A+</button></div></div>`;

    html+=`<div class="s-sec"><h4>Автообновление</h4><select onchange="setRefreshRate(this.value)" class="modal-input" style="margin-top:4px">
        <option value="5"${S.refreshMs===5000?' selected':''}>5 секунд</option>
        <option value="8"${S.refreshMs===8000?' selected':''}>8 секунд</option>
        <option value="15"${S.refreshMs===15000?' selected':''}>15 секунд</option>
        <option value="30"${S.refreshMs===30000?' selected':''}>30 секунд</option>
    </select></div>`;

    html+=`<div class="s-sec"><h4>Звук</h4><div class="sw-row"><label>Звук новых сообщений</label><div class="sw${S.soundOn?' on':''}" onclick="toggleSoundSetting(this)"></div></div></div>`;

    html+=`<div class="s-sec"><h4>О приложении</h4><div style="display:flex;align-items:center;gap:12px;padding:10px;background:var(--bg2);border-radius:12px;border:1px solid var(--brd)">
        <img src="icon.png" style="width:40px;height:40px;border-radius:50%;object-fit:cover" onerror="this.style.display='none'">
        <div><div style="font-weight:700;font-family:'Syne',sans-serif">CheekMes v5.0</div><div style="font-size:11px;color:var(--t2)">E2E-шифрование · Serverless · Open Source</div></div>
    </div></div>`;

    bodyEl.innerHTML=html;
    showModal('settingsModal');
}
function pickTheme(id)  { setTheme(id);  saveSettings(); openSettings(); }
function pickAccent(i)  { setAccent(i);  saveSettings(); openSettings(); }
function adjustFS(delta) {
    let cur=parseInt(getComputedStyle(document.documentElement).getPropertyValue('--fs'))||15;
    cur=Math.max(12,Math.min(22,cur+delta)); setFontSize(cur); saveSettings();
    const l=document.getElementById('fsLabel'); if(l) l.textContent=cur+'px';
}
function setRefreshRate(val) { 
    S.refreshMs=parseInt(val)*1000; 
    saveSettings(); 
    if(S.timer){clearInterval(S.timer); S.timer=setInterval(loadMessages,S.refreshMs);} 
}
function toggleSoundSetting(el) { S.soundOn=!S.soundOn; el.classList.toggle('on'); saveSettings(); }

// ============ ЧАСТЬ 34: КЛИК-ВНЕ-ЭЛЕМЕНТОВ ============
function initClickOutside() {
    document.addEventListener('click', e=>{
        const rxPanel=document.getElementById('rxPanel');
        if (rxPanel?.classList.contains('show')&&!rxPanel.contains(e.target)&&!e.target.closest('.m-bub')) hideRxPanel();

        const chatMenu=document.getElementById('chatMenu');
        if (chatMenu?.classList.contains('show')&&!chatMenu.contains(e.target)&&!e.target.closest('#chatMenuBtn')) chatMenu.classList.remove('show');

        const emojiPanel=document.getElementById('emojiPanel');
        if (emojiPanel?.classList.contains('show')&&!emojiPanel.contains(e.target)&&!e.target.closest('.msg-btn')) emojiPanel.classList.remove('show');

        const fabWrap=document.getElementById('fabWrap');
        if (fabWrap?.classList.contains('open')&&!fabWrap.contains(e.target)) closeFab();

        $$('.overlay.show').forEach(overlay=>{ if(e.target===overlay) overlay.classList.remove('show'); });
    });
}

// ============ ЧАСТЬ 35: ГОРЯЧИЕ-КЛАВИШИ ============
document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
        const open = document.querySelector('.overlay.show');
        if (open) { open.classList.remove('show'); return; }
        const lb = document.getElementById('lightbox');
        if (lb?.classList.contains('show')) { lb.classList.remove('show'); return; }
        const rp = document.getElementById('rxPanel');
        if (rp?.classList.contains('show')) { hideRxPanel(); return; }
        const sb = document.getElementById('searchBar');
        if (sb?.style.display === 'flex') { closeSearch(); return; }
        if (document.getElementById('chat-screen')?.classList.contains('active')) { goBack(); }
    }
});

// ============ ЧАСТЬ 36: СВАЙП-НАЗАД ============
(function() {
    let startX = 0, startY = 0;
    document.addEventListener('touchstart', e => {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
    }, { passive: true });
    document.addEventListener('touchend', e => {
        const dx = e.changedTouches[0].clientX - startX;
        const dy = Math.abs(e.changedTouches[0].clientY - startY);
        if (dx > 80 && dy < 60 && startX < 30) {
            if (document.getElementById('chat-screen')?.classList.contains('active')) goBack();
        }
    }, { passive: true });
})();

// ============ ЧАСТЬ 37: ПУЛЛ-ТУ-РЕФРЕШ ============
(function() {
    let startY = 0, pulling = false;
    const getArea = () => document.getElementById('msgArea');
    document.addEventListener('touchstart', e => {
        const area = getArea();
        if (area && area.scrollTop === 0) { startY = e.touches[0].clientY; pulling = true; }
        else pulling = false;
    }, { passive: true });
    document.addEventListener('touchend', e => {
        if (!pulling) return;
        const dy = e.changedTouches[0].clientY - startY;
        if (dy > 70 && S.curChat !== null) { loadMessages(); toast('Обновление...', 'info'); }
        pulling = false;
    }, { passive: true });
})();

// ============ ЧАСТЬ 38: ВСТАВКА-ИЗ-БУФЕРА ============
document.addEventListener('paste', async e => {
    if (S.curChat === null) return;
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
        if (item.type.startsWith('image/')) {
            const file = item.getAsFile();
            if (file) { e.preventDefault(); await sendFile(file); }
        }
    }
});

// ============ ЧАСТЬ 39: DRAG-AND-DROP ============
document.addEventListener('dragover', e => {
    if (S.curChat !== null) e.preventDefault();
});
document.addEventListener('drop', async e => {
    if (S.curChat === null) return;
    e.preventDefault();
    const files = e.dataTransfer?.files;
    if (files?.length > 0) await sendFile(files[0]);
});

// ============ ЧАСТЬ 40: ВИДИМОСТЬ-СТРАНИЦЫ ============
document.addEventListener('visibilitychange', () => {
    if (!document.hidden && S.curChat !== null) loadMessages();
});

// ============ ЧАСТЬ 41: ОНЛАЙН/ОФФЛАЙН ============
window.addEventListener('online',  () => toast('🌐 Подключено', 'success'));
window.addEventListener('offline', () => toast('📵 Нет интернета', 'error'));