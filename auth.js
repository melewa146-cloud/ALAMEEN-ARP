/* ═══════════════════════════════════
   AL AMEEN ERP — auth.js
   نظام المصادقة وإدارة الشركات المتعددة
   ═══════════════════════════════════ */

const AUTH_KEY   = 'alameen_auth_v1';
const USERS_KEY  = 'alameen_users_v1';
const CORPS_KEY  = 'alameen_corps_v1';
const SESSION_KEY= 'alameen_session_v1';

// ── نظام المستخدمين ──
const SYSTEM = {
  users: [],        // [{id, username, password(hashed), role, companyIds, name}]
  companies: [],    // [{id, name, nameAr, address, phone, email, taxNum, currency, logo, taxRate, invoiceNote, createdAt, active}]
  currentUser: null,
  currentCompany: null,
};

// ── تشفير بسيط للكلمة السرية ──
function hashPass(p) {
  let h = 0;
  for (let i = 0; i < p.length; i++) { h = ((h << 5) - h) + p.charCodeAt(i); h |= 0; }
  return 'h_' + Math.abs(h).toString(36) + '_' + p.length;
}

// ── حفظ / تحميل نظام المصادقة ──
function saveAuth() {
  localStorage.setItem(USERS_KEY,  JSON.stringify(SYSTEM.users));
  localStorage.setItem(CORPS_KEY,  JSON.stringify(SYSTEM.companies));
}
function loadAuth() {
  try {
    SYSTEM.users     = JSON.parse(localStorage.getItem(USERS_KEY)  || '[]');
    SYSTEM.companies = JSON.parse(localStorage.getItem(CORPS_KEY)  || '[]');
  } catch(e) { SYSTEM.users=[]; SYSTEM.companies=[]; }
}

// ── تهيئة أول مرة (مدير النظام) ──
function initDefaultAdmin() {
  if (SYSTEM.users.length > 0) return;
  SYSTEM.users = [{
    id: 'admin_001',
    username: 'admin',
    password: hashPass('admin123'),
    role: 'superadmin',
    companyIds: ['*'],   // * = كل الشركات
    name: 'مدير النظام',
    email: 'admin@alameen.com',
  }];
  saveAuth();
}

// ── تسجيل الدخول ──
function doLogin() {
  const u = document.getElementById('login-user').value.trim();
  const p = document.getElementById('login-pass').value.trim();
  if (!u || !p) { showLoginErr('أدخل اسم المستخدم وكلمة المرور'); return; }
  const user = SYSTEM.users.find(x => x.username === u && x.password === hashPass(p));
  if (!user) { showLoginErr('اسم المستخدم أو كلمة المرور غير صحيحة'); return; }
  SYSTEM.currentUser = user;
  sessionStorage.setItem(SESSION_KEY, JSON.stringify({ userId: user.id, time: Date.now() }));
  showCompanySelect();
}

function doLogout() {
  SYSTEM.currentUser = null;
  SYSTEM.currentCompany = null;
  sessionStorage.removeItem(SESSION_KEY);
  showLoginScreen();
}

function checkSession() {
  try {
    const sess = JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null');
    if (!sess) return false;
    const user = SYSTEM.users.find(u => u.id === sess.userId);
    if (!user) return false;
    SYSTEM.currentUser = user;
    return true;
  } catch(e) { return false; }
}

function showLoginErr(msg) {
  const el = document.getElementById('login-err');
  if (el) { el.textContent = msg; el.style.display = 'block'; }
}

// ── اختيار الشركة ──
function showCompanySelect() {
  document.getElementById('screen-login').style.display   = 'none';
  document.getElementById('screen-company').style.display = 'flex';
  document.getElementById('screen-app').style.display     = 'none';
  renderCompanySelect();
}

function getUserCompanies() {
  const u = SYSTEM.currentUser;
  if (!u) return [];
  if (u.companyIds.includes('*')) return SYSTEM.companies.filter(c => c.active !== false);
  return SYSTEM.companies.filter(c => u.companyIds.includes(c.id) && c.active !== false);
}

function renderCompanySelect() {
  const corps = getUserCompanies();
  const el = document.getElementById('company-list');
  document.getElementById('company-welcome').textContent = `مرحباً، ${SYSTEM.currentUser?.name || ''}`;
  if (!corps.length) {
    el.innerHTML = `<div style="text-align:center;padding:24px;color:#94A3B8">
      لا توجد شركات مسجلة بعد
      ${SYSTEM.currentUser?.role === 'superadmin' ? '<br><button class="btn btn-p" style="margin-top:12px" onclick="openNewCompanyModal()">+ إنشاء شركة جديدة</button>' : ''}
    </div>`;
    return;
  }
  el.innerHTML = corps.map(c => `
    <div class="company-card" onclick="enterCompany('${c.id}')">
      <div class="company-card-logo">
        ${c.logo ? `<img src="${c.logo}" alt="${c.name}">` : `<div class="company-card-initials">${(c.nameAr||c.name||'?')[0]}</div>`}
      </div>
      <div class="company-card-info">
        <div class="company-card-name">${c.nameAr || c.name}</div>
        <div class="company-card-sub">${c.name}</div>
        ${c.taxNum ? `<div class="company-card-detail">ر.ض: ${c.taxNum}</div>` : ''}
      </div>
      <div class="company-card-arrow">←</div>
    </div>
  `).join('');
}

function enterCompany(id) {
  const corp = SYSTEM.companies.find(c => c.id === id);
  if (!corp) return;
  SYSTEM.currentCompany = corp;
  // تحميل بيانات هذه الشركة
  const storeKey = `alameen_erp_${id}`;
  loadCompanyData(storeKey, corp);
  showAppScreen();
}

// ── عرض الشاشات ──
function showLoginScreen() {
  document.getElementById('screen-login').style.display   = 'flex';
  document.getElementById('screen-company').style.display = 'none';
  document.getElementById('screen-app').style.display     = 'none';
  document.getElementById('login-user').value = '';
  document.getElementById('login-pass').value = '';
  document.getElementById('login-err').style.display = 'none';
}

function showAppScreen() {
  document.getElementById('screen-login').style.display   = 'none';
  document.getElementById('screen-company').style.display = 'none';
  document.getElementById('screen-app').style.display     = 'flex';
  initApp();
}

// ── إدارة الشركات (للمدير) ──
function openNewCompanyModal() {
  document.getElementById('nc-name').value    = '';
  document.getElementById('nc-name-ar').value = '';
  document.getElementById('nc-addr').value    = '';
  document.getElementById('nc-phone').value   = '';
  document.getElementById('nc-email').value   = '';
  document.getElementById('nc-tax').value     = '';
  document.getElementById('nc-taxrate').value = 14;
  document.getElementById('nc-currency').value= 'ج.م';
  document.getElementById('nc-note').value    = '';
  document.getElementById('nc-logo-preview').style.display = 'none';
  document.getElementById('nc-logo-data').value = '';
  document.getElementById('modal-newcorp').style.display = 'flex';
}

function closeNewCompanyModal() {
  document.getElementById('modal-newcorp').style.display = 'none';
}

function handleLogoUpload(input) {
  const file = input.files[0]; if (!file) return;
  if (file.size > 500000) { alert('حجم الصورة كبير جداً — اختر صورة أقل من 500KB'); return; }
  const reader = new FileReader();
  reader.onload = e => {
    document.getElementById('nc-logo-data').value = e.target.result;
    const prev = document.getElementById('nc-logo-preview');
    prev.src = e.target.result;
    prev.style.display = 'block';
  };
  reader.readAsDataURL(file);
}

function saveNewCompany() {
  const name   = document.getElementById('nc-name').value.trim();
  const nameAr = document.getElementById('nc-name-ar').value.trim();
  if (!name && !nameAr) { alert('أدخل اسم الشركة'); return; }
  const id = 'corp_' + Date.now();
  const corp = {
    id,
    name:    name || nameAr,
    nameAr:  nameAr || name,
    address: document.getElementById('nc-addr').value.trim(),
    phone:   document.getElementById('nc-phone').value.trim(),
    email:   document.getElementById('nc-email').value.trim(),
    taxNum:  document.getElementById('nc-tax').value.trim(),
    taxRate: parseFloat(document.getElementById('nc-taxrate').value) || 14,
    currency:document.getElementById('nc-currency').value.trim() || 'ج.م',
    invoiceNote: document.getElementById('nc-note').value.trim() || 'شكراً لتعاملكم معنا',
    logo:    document.getElementById('nc-logo-data').value || '',
    createdAt: new Date().toISOString(),
    active:  true,
  };
  SYSTEM.companies.push(corp);
  // تفعيل الشركة لجميع المستخدمين superadmin تلقائياً
  SYSTEM.users.filter(u => u.role === 'superadmin').forEach(u => {
    if (!u.companyIds.includes('*') && !u.companyIds.includes(id)) u.companyIds.push(id);
  });
  saveAuth();
  closeNewCompanyModal();
  renderCompanySelect();
  showToastMsg('تم إنشاء الشركة بنجاح ✓');
}

// ── إدارة المستخدمين ──
function renderUserManagement() {
  const el = document.getElementById('users-list'); if (!el) return;
  el.innerHTML = `<table>
    <tr><th style="width:15%">اسم المستخدم</th><th style="width:20%">الاسم</th><th style="width:12%">الدور</th><th style="width:25%">الشركات</th><th style="width:28%">إجراءات</th></tr>
    ${SYSTEM.users.map(u => `<tr>
      <td style="font-family:monospace;font-weight:700">${u.username}</td>
      <td>${u.name}</td>
      <td><span class="badge ${u.role==='superadmin'?'bp':'bi'}">${u.role==='superadmin'?'مدير النظام':'مستخدم'}</span></td>
      <td style="font-size:11px">${u.companyIds.includes('*')?'كل الشركات':SYSTEM.companies.filter(c=>u.companyIds.includes(c.id)).map(c=>c.nameAr||c.name).join('، ')||'لا يوجد'}</td>
      <td><div style="display:flex;gap:4px">
        ${u.id!=='admin_001'?`<button class="btn btn-del" onclick="deleteUser('${u.id}')">حذف</button>`:''}
        <button class="btn btn-edit" onclick="resetUserPass('${u.id}')">إعادة كلمة المرور</button>
      </div></td>
    </tr>`).join('')}
  </table>`;
}

function addUser() {
  const uname = document.getElementById('nu-username').value.trim();
  const pass  = document.getElementById('nu-pass').value.trim();
  const name  = document.getElementById('nu-name').value.trim();
  const role  = document.getElementById('nu-role').value;
  if (!uname || !pass || !name) { alert('أكمل جميع الحقول'); return; }
  if (SYSTEM.users.find(u => u.username === uname)) { alert('اسم المستخدم موجود مسبقاً'); return; }
  const selCorps = [...document.getElementById('nu-corps').selectedOptions].map(o => o.value);
  SYSTEM.users.push({
    id: 'u_' + Date.now(), username: uname, password: hashPass(pass),
    role, companyIds: role === 'superadmin' ? ['*'] : selCorps, name, email: '',
  });
  saveAuth();
  renderUserManagement();
  document.getElementById('nu-username').value = '';
  document.getElementById('nu-pass').value = '';
  document.getElementById('nu-name').value = '';
  showToastMsg('تم إضافة المستخدم ✓');
}

function deleteUser(id) {
  if (!confirm('حذف المستخدم؟')) return;
  SYSTEM.users = SYSTEM.users.filter(u => u.id !== id);
  saveAuth(); renderUserManagement();
}

function resetUserPass(id) {
  const p = prompt('كلمة المرور الجديدة:');
  if (!p || p.length < 4) { alert('كلمة المرور قصيرة جداً'); return; }
  const u = SYSTEM.users.find(x => x.id === id);
  if (u) { u.password = hashPass(p); saveAuth(); showToastMsg('تم تغيير كلمة المرور ✓'); }
}

function showToastMsg(msg) {
  const t = document.getElementById('global-toast');
  if (!t) return;
  t.textContent = msg; t.style.opacity = '1';
  setTimeout(() => t.style.opacity = '0', 2800);
}

function populateCorpSelect() {
  const sel = document.getElementById('nu-corps'); if (!sel) return;
  sel.innerHTML = SYSTEM.companies.map(c => `<option value="${c.id}">${c.nameAr||c.name}</option>`).join('');
}
