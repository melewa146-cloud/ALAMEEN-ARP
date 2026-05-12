/* AL AMEEN ERP — app.js (Multi-Company Edition) */

// ══ مفتاح تخزين الشركة الحالية ══
function getCompanyStoreKey() {
  return `alameen_erp_${SYSTEM.currentCompany?.id || 'default'}`;
}

// ══ تحميل بيانات الشركة ══
function loadCompanyData(storeKey, corp) {
  try {
    const raw = localStorage.getItem(storeKey);
    if (raw) {
      const d = JSON.parse(raw);
      DB.accounts  = d.accounts  || DEFAULT_ACCOUNTS.map(a => ({...a}));
      DB.journal   = d.journal   || [];
      DB.vouchers  = d.vouchers  || [];
      DB.clients   = d.clients   || [];
      DB.suppliers = d.suppliers || [];
      DB.products  = d.products  || [];
      DB.invoices  = d.invoices  || [];
      DB.purchases = d.purchases || [];
      if (d.c) {
        DB.nextJV           = d.c.jv  || 1;
        DB.nextSaleInv      = d.c.si  || 1001;
        DB.nextPurchInv     = d.c.pi  || 3001;
        DB.nextVoucher      = d.c.v   || 1;
        DB.nextAccId        = d.c.a   || 9000;
        DB.nextClientSeq    = d.c.cs  || 1;
        DB.nextSupplierSeq  = d.c.ss  || 1;
      }
    } else {
      // شركة جديدة — بيانات افتراضية
      DB.accounts  = DEFAULT_ACCOUNTS.map(a => ({...a}));
      DB.journal   = [];
      DB.vouchers  = [];
      DB.clients   = [];
      DB.suppliers = [];
      DB.products  = [];
      DB.invoices  = [];
      DB.purchases = [];
      DB.nextJV = 1; DB.nextSaleInv = 1001; DB.nextPurchInv = 3001;
      DB.nextVoucher = 1; DB.nextAccId = 9000; DB.nextClientSeq = 1; DB.nextSupplierSeq = 1;
    }
    // دائماً زامن settings من بيانات الشركة
    DB.settings.companyName   = corp.name    || 'AL AMEEN ERP';
    DB.settings.companyNameAr = corp.nameAr  || '';
    DB.settings.address       = corp.address || '';
    DB.settings.phone         = corp.phone   || '';
    DB.settings.email         = corp.email   || '';
    DB.settings.taxNumber     = corp.taxNum  || '';
    DB.settings.taxRate       = corp.taxRate || 14;
    DB.settings.currency      = corp.currency|| 'ج.م';
    DB.settings.invoiceNote   = corp.invoiceNote || 'شكراً لتعاملكم معنا';
    DB.settings.logo          = corp.logo    || '';
  } catch(e) {
    console.warn('loadCompanyData error', e);
    DB.accounts = DEFAULT_ACCOUNTS.map(a => ({...a}));
  }
}

// ══ حفظ بيانات الشركة الحالية ══
function save() {
  if (!SYSTEM.currentCompany) return;
  const storeKey = getCompanyStoreKey();
  try {
    localStorage.setItem(storeKey, JSON.stringify({
      accounts:  DB.accounts,
      journal:   DB.journal,
      vouchers:  DB.vouchers,
      clients:   DB.clients,
      suppliers: DB.suppliers,
      products:  DB.products,
      invoices:  DB.invoices,
      purchases: DB.purchases,
      c: {
        jv: DB.nextJV, si: DB.nextSaleInv, pi: DB.nextPurchInv,
        v: DB.nextVoucher, a: DB.nextAccId, cs: DB.nextClientSeq, ss: DB.nextSupplierSeq
      }
    }));
    const b = document.getElementById('saved-badge');
    if (b) { b.style.display = 'inline'; clearTimeout(window._st); window._st = setTimeout(() => b.style.display='none', 2500); }
  } catch(e) { console.warn('save error', e); }
}

// ══ تهيئة التطبيق بعد دخول الشركة ══
function initApp() {
  const corp = SYSTEM.currentCompany;
  if (!corp) return;

  // اللوجو
  const logoSrc = corp.logo || (typeof LOGO_SRC !== 'undefined' ? LOGO_SRC : '');
  ['sb-logo','tb-logo','wb-logo'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.src = logoSrc;
  });

  // اسم الشركة
  const cn = document.getElementById('sb-logo-name');
  if (cn) cn.textContent = corp.name || 'AL AMEEN ERP';

  // مؤشر الشركة في التوبار
  const ci = document.getElementById('corp-indicator');
  if (ci) {
    ci.innerHTML = `
      ${corp.logo ? `<img src="${corp.logo}" alt="">` : ''}
      <span class="corp-indicator-name">${corp.nameAr || corp.name}</span>
      <span class="corp-switch-btn">⇄</span>`;
    ci.title = 'تبديل الشركة';
    ci.onclick = () => { doSwitchCompany(); };
  }

  // التاريخ
  document.getElementById('tb-date').textContent =
    new Date().toLocaleDateString('ar-EG', {year:'numeric',month:'long',day:'numeric'});

  // صلاحيات
  updateUIByRole();

  renderDash();
}

function doSwitchCompany() {
  save(); // حفظ قبل التبديل
  SYSTEM.currentCompany = null;
  showCompanySelect();
}

function updateUIByRole() {
  const role = SYSTEM.currentUser?.role;
  // إظهار/إخفاء بنود الإدارة
  document.querySelectorAll('.admin-only').forEach(el => {
    el.style.display = role === 'superadmin' ? '' : 'none';
  });
}

// ══ توجيه الصفحات ══
function go(page, el) {
  document.querySelectorAll('.pg').forEach(p => p.classList.remove('on'));
  document.querySelectorAll('.ni,.ni-settings').forEach(n => n.classList.remove('on'));
  document.getElementById('pg-' + page).classList.add('on');
  if (el) el.classList.add('on');
  const T = {
    dash:'لوحة التحكم', voucher:'الصندوق — سند صرف / قبض',
    coa:'شجرة الحسابات', journal:'دفتر اليومية', ledger:'دفتر الأستاذ',
    tb:'ميزان المراجعة', pl:'قائمة الدخل', bs:'الميزانية العمومية',
    stmt_client:'كشف حساب عميل', stmt_supp:'كشف حساب مورد',
    sales:'فواتير المبيعات', purchases:'فواتير المشتريات',
    clients:'العملاء', supp:'الموردون', stock:'المخزون',
    settings:'الإعدادات', admin:'إدارة النظام',
  };
  document.getElementById('ptitle').textContent = T[page] || page;
  const R = {
    dash: renderDash, voucher: renderVoucherPage, coa: renderCOA,
    journal: renderJList, ledger: renderLedgerSel,
    tb: renderTB, pl: renderPL, bs: renderBS,
    sales: renderInvList, purchases: renderPurchList,
    clients: renderClients, supp: renderSuppliers, stock: renderStock,
    stmt_client: () => { refreshClientStmtSelect(); document.getElementById('stmt-body').innerHTML='<div class="empty">اختر عميلاً وحدد الفترة</div>'; },
    stmt_supp:   () => { refreshSupplierStmtSelect(); document.getElementById('sstmt-body').innerHTML='<div class="empty">اختر مورداً وحدد الفترة</div>'; },
    settings: renderSettings,
    admin: renderAdminPanel,
  };
  if (R[page]) R[page]();
}

function openModal(id) {
  if (id === 'modal-journal') initJModal();
  if (id === 'modal-inv')     initInvModal();
  if (id === 'modal-purch')   initPurchModal();
  document.getElementById(id).classList.add('open');
}
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

function toast(msg, type = '') {
  const t = document.getElementById('global-toast') || document.getElementById('toast');
if(!t){console.warn('toast:',msg);return;}
  t.textContent = msg; t.className = 'toast show ' + type;
  setTimeout(() => t.className = 'toast', 3200);
}
function confirmDel(msg, cb) {
  document.getElementById('confirm-msg').textContent = msg;
  document.getElementById('confirm-yes').onclick = () => { closeModal('modal-confirm'); cb(); };
  document.getElementById('modal-confirm').classList.add('open');
}

// ══ لوحة التحكم ══
function renderDash() {
  const revCr = DB.accounts.filter(a=>a.gid===4&&a.nat==='Cr').reduce((s,a)=>s+a.bal,0);
  const revDr = DB.accounts.filter(a=>a.gid===4&&a.nat==='Dr').reduce((s,a)=>s+a.bal,0);
  const exp   = DB.accounts.filter(a=>a.gid===5).reduce((s,a)=>s+a.bal,0);
  const assets= DB.accounts.filter(a=>a.gid===1&&a.nat==='Dr'&&!a.isClientSub).reduce((s,a)=>s+a.bal,0)
               -DB.accounts.filter(a=>a.gid===1&&a.nat==='Cr').reduce((s,a)=>s+a.bal,0);
  const cash  = findCode(C.CASH);
  const net   = (revCr - revDr) - exp;
  document.getElementById('d-stats').innerHTML = `
    <div class="sc"><div class="sl">رصيد الصندوق</div><div class="sv ${(cash?.bal||0)>=0?'apos':'aneg'}">${fmt(cash?.bal||0)} ج</div></div>
    <div class="sc"><div class="sl">إجمالي الأصول</div><div class="sv">${fmt(assets)} ج</div></div>
    <div class="sc"><div class="sl">صافي الإيرادات</div><div class="sv">${fmt(revCr-revDr)} ج</div></div>
    <div class="sc"><div class="sl">صافي الربح</div><div class="sv ${net>=0?'apos':'aneg'}">${fmt(net)} ج</div></div>`;
  document.getElementById('d-jlist').innerHTML = DB.journal.length
    ? `<table><tr><th style="width:12%">رقم</th><th style="width:11%">تاريخ</th><th>البيان</th><th style="width:16%">مدين</th><th style="width:16%">دائن</th></tr>
      ${DB.journal.slice(-7).reverse().map(j=>{
        const dr=j.lines.reduce((s,l)=>s+l.dr,0), cr=j.lines.reduce((s,l)=>s+l.cr,0);
        return `<tr><td style="font-size:10px;font-weight:700">${j.id}</td><td style="font-size:10px">${j.date.slice(5)}</td><td>${j.desc}</td><td class="apos">${fmt(dr)}</td><td class="aneg">${fmt(cr)}</td></tr>`;
      }).join('')}</table>`
    : '<div class="empty">ابدأ بإدخال القيود</div>';
  const keyAccs = DB.accounts.filter(a=>a.bal!==0&&!a.isClientSub&&!a.isSupplierSub).slice(0,8);
  document.getElementById('d-bal').innerHTML = keyAccs.length
    ? `<table><tr><th>الحساب</th><th style="width:14%">كود</th><th style="width:21%">رصيد</th></tr>
      ${keyAccs.map(a=>`<tr><td>${a.name}</td><td style="font-family:monospace;font-size:10px;color:#7C3AED">${a.code}</td><td class="${a.nat==='Dr'?'apos':'aneg'}">${fmt(a.bal)} ج</td></tr>`).join('')}</table>`
    : '<div class="empty">أضف حسابات وأرصدة</div>';
}

// ══ لوحة الإدارة (superadmin) ══
function renderAdminPanel() {
  renderCompanyManagement();
  renderUserManagement();
  populateCorpSelect();
}

function renderCompanyManagement() {
  const el = document.getElementById('corps-list'); if (!el) return;
  if (!SYSTEM.companies.length) {
    el.innerHTML = '<div class="empty">لا توجد شركات — أنشئ أول شركة</div>'; return;
  }
  el.innerHTML = `<table>
    <tr><th style="width:5%">شعار</th><th style="width:20%">الاسم</th><th style="width:20%">الاسم بالعربي</th><th style="width:15%">الهاتف</th><th style="width:13%">الرقم الضريبي</th><th style="width:10%">الحالة</th><th style="width:17%">إجراءات</th></tr>
    ${SYSTEM.companies.map(c => `<tr>
      <td>${c.logo?`<img src="${c.logo}" style="width:32px;height:32px;object-fit:contain;border-radius:5px;border:1px solid #E2E8F0">`:
        `<div style="width:32px;height:32px;background:#EFF6FF;border-radius:5px;display:flex;align-items:center;justify-content:center;font-weight:700;color:#185FA5;font-size:12px">${(c.nameAr||c.name||'?')[0]}</div>`}</td>
      <td style="font-weight:600">${c.name}</td>
      <td>${c.nameAr||'—'}</td>
      <td>${c.phone||'—'}</td>
      <td style="font-family:monospace;font-size:11px">${c.taxNum||'—'}</td>
      <td><span class="badge ${c.active!==false?'bs':'bd'}">${c.active!==false?'نشطة':'معطلة'}</span></td>
      <td><div style="display:flex;gap:4px">
        <button class="btn btn-edit" onclick="editCompany('${c.id}')">تعديل</button>
        <button class="btn btn-del" onclick="toggleCompany('${c.id}')">${c.active!==false?'تعطيل':'تفعيل'}</button>
      </div></td>
    </tr>`).join('')}
  </table>`;
}

function editCompany(id) {
  const c = SYSTEM.companies.find(x => x.id === id); if (!c) return;
  document.getElementById('nc-name').value    = c.name    || '';
  document.getElementById('nc-name-ar').value = c.nameAr  || '';
  document.getElementById('nc-addr').value    = c.address || '';
  document.getElementById('nc-phone').value   = c.phone   || '';
  document.getElementById('nc-email').value   = c.email   || '';
  document.getElementById('nc-tax').value     = c.taxNum  || '';
  document.getElementById('nc-taxrate').value = c.taxRate || 14;
  document.getElementById('nc-currency').value= c.currency|| 'ج.م';
  document.getElementById('nc-note').value    = c.invoiceNote || '';
  document.getElementById('nc-logo-data').value = c.logo || '';
  if (c.logo) {
    const prev = document.getElementById('nc-logo-preview');
    prev.src = c.logo; prev.style.display = 'block';
  }
  document.getElementById('nc-edit-id').value = id;
  document.getElementById('modal-newcorp').style.display = 'flex';
}

function saveNewCompany() {
  const editId = document.getElementById('nc-edit-id').value;
  const name   = document.getElementById('nc-name').value.trim();
  const nameAr = document.getElementById('nc-name-ar').value.trim();
  if (!name && !nameAr) { alert('أدخل اسم الشركة'); return; }
  const data = {
    name: name||nameAr, nameAr: nameAr||name,
    address: document.getElementById('nc-addr').value.trim(),
    phone:   document.getElementById('nc-phone').value.trim(),
    email:   document.getElementById('nc-email').value.trim(),
    taxNum:  document.getElementById('nc-tax').value.trim(),
    taxRate: parseFloat(document.getElementById('nc-taxrate').value)||14,
    currency:document.getElementById('nc-currency').value.trim()||'ج.م',
    invoiceNote: document.getElementById('nc-note').value.trim()||'شكراً لتعاملكم معنا',
    logo:    document.getElementById('nc-logo-data').value||'',
    active:  true,
  };
  if (editId) {
    Object.assign(SYSTEM.companies.find(c=>c.id===editId), data);
    // إذا هي الشركة الحالية، حدّث settings فوراً
    if (SYSTEM.currentCompany?.id === editId) {
      Object.assign(SYSTEM.currentCompany, data);
      DB.settings.companyName   = data.name;
      DB.settings.companyNameAr = data.nameAr;
      DB.settings.address       = data.address;
      DB.settings.phone         = data.phone;
      DB.settings.email         = data.email;
      DB.settings.taxNumber     = data.taxNum;
      DB.settings.taxRate       = data.taxRate;
      DB.settings.currency      = data.currency;
      DB.settings.invoiceNote   = data.invoiceNote;
      DB.settings.logo          = data.logo;
      // تحديث اللوجو في الواجهة
      const logoSrc = data.logo || (typeof LOGO_SRC!=='undefined'?LOGO_SRC:'');
      ['sb-logo','tb-logo','wb-logo'].forEach(id2=>{const el=document.getElementById(id2);if(el)el.src=logoSrc;});
      const cn=document.getElementById('sb-logo-name');if(cn)cn.textContent=data.name;
    }
    showToastMsg('تم تحديث بيانات الشركة ✓');
  } else {
    const id = 'corp_' + Date.now();
    SYSTEM.companies.push({ id, ...data, createdAt: new Date().toISOString() });
    SYSTEM.users.filter(u=>u.role==='superadmin').forEach(u=>{if(!u.companyIds.includes('*')&&!u.companyIds.includes(id))u.companyIds.push(id);});
    showToastMsg('تم إنشاء الشركة ✓');
  }
  saveAuth();
  closeNewCompanyModal();
  renderCompanyManagement();
}

function toggleCompany(id) {
  const c = SYSTEM.companies.find(x => x.id === id); if (!c) return;
  c.active = !c.active;
  saveAuth(); renderCompanyManagement();
}

// إعدادات الشركة (من داخل التطبيق)
function renderSettings() {
  const corp = SYSTEM.currentCompany || {};
  document.getElementById('set-company').value    = corp.name    || '';
  document.getElementById('set-company-ar').value = corp.nameAr  || '';
  document.getElementById('set-address').value    = corp.address || '';
  document.getElementById('set-phone').value      = corp.phone   || '';
  document.getElementById('set-email').value      = corp.email   || '';
  document.getElementById('set-taxnum').value     = corp.taxNum  || '';
  document.getElementById('set-taxrate').value    = corp.taxRate || 14;
  document.getElementById('set-currency').value   = corp.currency|| 'ج.م';
  document.getElementById('set-invnote').value    = corp.invoiceNote || '';
  if (corp.logo) {
    const prev = document.getElementById('set-logo-preview');
    if (prev) { prev.src = corp.logo; prev.style.display = 'block'; }
  }
  const used = JSON.stringify(DB).length;
  const si = document.getElementById('storage-info');
  if (si) si.textContent = `حجم بيانات الشركة: ${(used/1024).toFixed(1)} KB`;
  ['stat-accs','stat-jvs','stat-invs','stat-clients','stat-supps'].forEach((id,i)=>{
    const el=document.getElementById(id);
    if(el)el.textContent=[DB.accounts.length,DB.journal.length,DB.invoices.length+DB.purchases.length,DB.clients.length,DB.suppliers.length][i];
  });
}

function saveSettings() {
  const corp = SYSTEM.currentCompany; if (!corp) return;
  const logo = document.getElementById('set-logo-data')?.value || corp.logo || '';
  const upd = {
    name:    document.getElementById('set-company').value.trim()    || corp.name,
    nameAr:  document.getElementById('set-company-ar').value.trim() || corp.nameAr,
    address: document.getElementById('set-address').value.trim(),
    phone:   document.getElementById('set-phone').value.trim(),
    email:   document.getElementById('set-email').value.trim(),
    taxNum:  document.getElementById('set-taxnum').value.trim(),
    taxRate: parseFloat(document.getElementById('set-taxrate').value)||14,
    currency:document.getElementById('set-currency').value.trim()||'ج.م',
    invoiceNote: document.getElementById('set-invnote').value.trim(),
    logo,
  };
  Object.assign(corp, upd);
  Object.assign(DB.settings, {
    companyName: upd.name, companyNameAr: upd.nameAr,
    address: upd.address, phone: upd.phone, email: upd.email,
    taxNumber: upd.taxNum, taxRate: upd.taxRate, currency: upd.currency,
    invoiceNote: upd.invoiceNote, logo: upd.logo,
  });
  // حفظ التغييرات في نظام الشركات
  const c2 = SYSTEM.companies.find(x=>x.id===corp.id);
  if (c2) Object.assign(c2, upd);
  saveAuth();
  save();
  // تحديث اللوجو
  const logoSrc = upd.logo || (typeof LOGO_SRC!=='undefined'?LOGO_SRC:'');
  ['sb-logo','tb-logo','wb-logo'].forEach(id=>{const el=document.getElementById(id);if(el)el.src=logoSrc;});
  const cn=document.getElementById('sb-logo-name');if(cn)cn.textContent=upd.name;
  toast('تم حفظ الإعدادات ✓','ok');
}

function handleSettingsLogo(input) {
  const file = input.files[0]; if (!file) return;
  if (file.size > 500000) { toast('الصورة كبيرة جداً — أقل من 500KB','err'); return; }
  const reader = new FileReader();
  reader.onload = e => {
    document.getElementById('set-logo-data').value = e.target.result;
    const prev = document.getElementById('set-logo-preview');
    if (prev) { prev.src = e.target.result; prev.style.display='block'; }
  };
  reader.readAsDataURL(file);
}

function exportData() {
  const data = {
    version: 'ALAMEEN_ERP_v6',
    company: SYSTEM.currentCompany?.name || '',
    exportDate: new Date().toISOString(),
    accounts: DB.accounts, journal: DB.journal, vouchers: DB.vouchers,
    clients: DB.clients, suppliers: DB.suppliers, products: DB.products,
    invoices: DB.invoices, purchases: DB.purchases,
    counters: { jv:DB.nextJV, si:DB.nextSaleInv, pi:DB.nextPurchInv,
                v:DB.nextVoucher, a:DB.nextAccId, cs:DB.nextClientSeq, ss:DB.nextSupplierSeq }
  };
  const blob = new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
  const url  = URL.createObjectURL(blob);
  const el   = document.createElement('a');
  const d    = new Date();
  el.href    = url;
  el.download= `ALAMEEN_${SYSTEM.currentCompany?.name||'data'}_${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}.json`;
  el.click(); URL.revokeObjectURL(url);
  toast('تم التصدير ✓','ok');
}

function importData(file) {
  const r = new FileReader();
  r.onload = e => {
    try {
      const d = JSON.parse(e.target.result);
      if (!d.version?.startsWith('ALAMEEN')) { toast('ملف غير صالح','err'); return; }
      DB.accounts=d.accounts||[]; DB.journal=d.journal||[]; DB.vouchers=d.vouchers||[];
      DB.clients=d.clients||[]; DB.suppliers=d.suppliers||[];
      DB.products=d.products||[]; DB.invoices=d.invoices||[]; DB.purchases=d.purchases||[];
      if (d.counters) {
        DB.nextJV=d.counters.jv||1; DB.nextSaleInv=d.counters.si||1001; DB.nextPurchInv=d.counters.pi||3001;
        DB.nextVoucher=d.counters.v||1; DB.nextAccId=d.counters.a||9000;
        DB.nextClientSeq=d.counters.cs||1; DB.nextSupplierSeq=d.counters.ss||1;
      }
      save(); toast('تم الاستيراد ✓','ok'); renderDash();
    } catch(err) { toast('خطأ في الملف','err'); }
  };
  r.readAsText(file);
}

function clearAllData() {
  if (!confirm('مسح كل بيانات هذه الشركة؟ لا يمكن التراجع!')) return;
  if (!confirm('تأكيد أخير!')) return;
  localStorage.removeItem(getCompanyStoreKey());
  loadCompanyData(getCompanyStoreKey(), SYSTEM.currentCompany);
  renderDash(); toast('تم المسح ✓','ok');
}

// ══ Entry Point ══
window.addEventListener('DOMContentLoaded', () => {
  loadAuth();
  initDefaultAdmin();
  if (checkSession()) {
    showCompanySelect();
  } else {
    showLoginScreen();
  }
  // Enter على نافذة الدخول
  document.getElementById('login-pass')?.addEventListener('keydown', e => { if(e.key==='Enter') doLogin(); });
  document.getElementById('login-user')?.addEventListener('keydown', e => { if(e.key==='Enter') document.getElementById('login-pass').focus(); });
});
