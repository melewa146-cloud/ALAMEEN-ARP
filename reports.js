/* AL AMEEN ERP — reports.js + voucher.js + settings.js */

// ══ VOUCHER ══
let vType='pay';
function setVType(t){
  vType=t;
  document.getElementById('vtab-pay').classList.toggle('on',t==='pay');
  document.getElementById('vtab-rcv').classList.toggle('on',t==='rcv');
  document.getElementById('v-btn').textContent=t==='pay'?'إصدار سند صرف':'إصدار سند قبض';
  updateVPreview();
}
function renderVoucherPage(){
  const cash=findCode(C.CASH);
  document.getElementById('v-box-bal').textContent='الصندوق: '+(cash?fmt(cash.bal)+' ج':'غير محدد');
  document.getElementById('v-date').value=today();
  document.getElementById('v-num').value='VCH-'+String(DB.nextVoucher).padStart(4,'0');
  document.getElementById('v-acc').innerHTML=buildAccOpts(null,a=>a.id!==findCode(C.CASH)?.id);
  updateVPreview();renderVoucherList();
}
function updateVPreview(){
  const accId=parseInt(document.getElementById('v-acc')?.value)||0;
  const a=findAcc(accId);
  const amt=parseFloat(document.getElementById('v-amount')?.value)||0;
  const el=document.getElementById('v-preview');if(!el)return;
  el.innerHTML=a?(vType==='pay'
    ?`<b>سند صرف:</b> الصندوق (دائن) ← ${a.name} [${a.code}] (مدين) — ${fmt(amt)} ج`
    :`<b>سند قبض:</b> الصندوق (مدين) ← ${a.name} [${a.code}] (دائن) — ${fmt(amt)} ج`)
    :'اختر الحساب المقابل';
}
function postVoucher(){
  const date=document.getElementById('v-date').value;
  const accId=parseInt(document.getElementById('v-acc').value)||0;
  const amt=parseFloat(document.getElementById('v-amount').value)||0;
  const desc=document.getElementById('v-desc').value.trim();
  if(!accId){toast('اختر الحساب المقابل','err');return;}
  if(!amt||amt<=0){toast('أدخل المبلغ','err');return;}
  if(!desc){toast('اكتب البيان','err');return;}
  const cashAcc=findCode(C.CASH);
  if(!cashAcc){toast('حساب الصندوق غير موجود','err');return;}
  const vId='VCH-'+String(DB.nextVoucher++).padStart(4,'0');
  const targetAcc=findAcc(accId);
  const jvLines=vType==='pay'
    ?[{accId:accId,dr:amt,cr:0},{accId:cashAcc.id,dr:0,cr:amt}]
    :[{accId:cashAcc.id,dr:amt,cr:0},{accId:accId,dr:0,cr:amt}];
  jvLines.forEach(l=>updateBal(l.accId,l.dr,l.cr));
  // مزامنة العميل/المورد
  if(targetAcc?.clientId)syncClientBal(targetAcc.clientId);
  if(targetAcc?.supplierId)syncSupplierBal(targetAcc.supplierId);
  const jvId='JV-'+String(DB.nextJV++).padStart(4,'0');
  DB.journal.push({id:jvId,date,desc:`${vType==='pay'?'سند صرف':'سند قبض'} ${vId} — ${desc}`,lines:jvLines});
  DB.vouchers.push({id:vId,type:vType,date,accId,accName:targetAcc?.name||'',amount:amt,desc,jvId});
  toast(`تم إصدار ${vId} وترحيل ${jvId} ✓`,'ok');
  clearVoucher();save();renderVoucherList();renderDash();
}
function clearVoucher(){
  document.getElementById('v-amount').value='';document.getElementById('v-desc').value='';
  document.getElementById('v-num').value='VCH-'+String(DB.nextVoucher).padStart(4,'0');
  const cash=findCode(C.CASH);
  document.getElementById('v-box-bal').textContent='الصندوق: '+(cash?fmt(cash.bal)+' ج':'غير محدد');
  updateVPreview();
}
function renderVoucherList(){
  if(!DB.vouchers.length){document.getElementById('v-list').innerHTML='<div class="empty">لا توجد سندات بعد</div>';return;}
  document.getElementById('v-list').innerHTML=`<table>
    <tr><th style="width:10%">رقم</th><th style="width:9%">تاريخ</th><th style="width:9%">النوع</th><th style="width:22%">الحساب المقابل</th><th style="width:11%">المبلغ</th><th style="width:22%">البيان</th><th style="width:9%">قيد</th><th style="width:8%"></th></tr>
    ${DB.vouchers.slice().reverse().map(v=>`<tr>
      <td style="font-weight:700;font-size:10px">${v.id}</td>
      <td style="font-size:10px">${v.date.slice(5)}</td>
      <td><span class="badge ${v.type==='pay'?'bd':'bs'}">${v.type==='pay'?'صرف':'قبض'}</span></td>
      <td style="font-size:11px">${v.accName}</td>
      <td class="${v.type==='pay'?'aneg':'apos'}">${v.type==='pay'?'-':'+'}${fmt(v.amount)} ج</td>
      <td style="font-size:11px">${v.desc}</td>
      <td style="font-size:9px;font-family:monospace;color:#7C3AED">${v.jvId}</td>
      <td><button class="btn btn-del" onclick="deleteVoucher('${v.id}')">✕</button></td>
    </tr>`).join('')}
  </table>`;
}
function deleteVoucher(id){
  confirmDel('سيتم حذف السند وعكس قيوده.',()=>{
    const v=DB.vouchers.find(x=>x.id===id);
    if(v?.jvId){
      const jv=DB.journal.find(j=>j.id===v.jvId);
      if(jv){jv.lines.forEach(l=>{revBal(l.accId,l.dr,l.cr);const a=findAcc(l.accId);if(a?.clientId)syncClientBal(a.clientId);if(a?.supplierId)syncSupplierBal(a.supplierId);});}
      DB.journal=DB.journal.filter(j=>j.id!==v.jvId);
    }
    DB.vouchers=DB.vouchers.filter(x=>x.id!==id);
    toast('تم الحذف ✓','ok');save();renderVoucherList();renderDash();
  });
}

// ══ REPORTS ══
function renderTB(){
  const accs=DB.accounts.filter(a=>a.bal!==0);
  const tDr=DB.accounts.filter(a=>a.nat==='Dr').reduce((s,a)=>s+a.bal,0);
  const tCr=DB.accounts.filter(a=>a.nat==='Cr').reduce((s,a)=>s+a.bal,0);
  const ok=Math.abs(tDr-tCr)<0.01;
  document.getElementById('tb-body').innerHTML=`
    <div style="margin-bottom:9px;padding:7px 11px;border-radius:8px;font-weight:700;background:${ok?'#DCFCE7':'#FEE2E2'};color:${ok?'#15803D':'#DC2626'}">${ok?'الميزان متوازن ✓':'الميزان غير متوازن — راجع القيود'}</div>
    <table><tr><th style="width:13%">الكود</th><th style="width:30%">الحساب</th><th style="width:13%">المجموعة</th><th style="width:11%">الطبيعة</th><th style="width:16%">مدين</th><th style="width:17%">دائن</th></tr>
    ${accs.sort((a,b)=>a.code.localeCompare(b.code,undefined,{numeric:true})).map(a=>`<tr>
      <td style="font-family:monospace;font-weight:700;font-size:10px;color:#7C3AED">${a.code}</td>
      <td>${a.isClientSub||a.isSupplierSub?'<span style="color:#94A3B8;margin-left:3px">↳</span>':''}${a.name}</td>
      <td style="font-size:10px;color:#64748B">${a.gname}</td>
      <td><span class="badge ${a.nat==='Dr'?'bs':'bd'}">${a.nat}</span></td>
      <td class="apos">${a.nat==='Dr'?fmt(a.bal):''}</td>
      <td class="aneg">${a.nat==='Cr'?fmt(a.bal):''}</td>
    </tr>`).join('')}
    <tr style="font-weight:700;font-size:13px;border-top:2px solid #E2E8F0;background:#F8FAFC">
      <td colspan="4">الإجمالي</td><td class="apos">${fmt(tDr)}</td><td class="aneg">${fmt(tCr)}</td>
    </tr></table>`;
}

function renderPL(){
  // إيرادات
  const revCr=DB.accounts.filter(a=>a.gid===4&&a.nat==='Cr'&&a.bal!==0);
  const revDr=DB.accounts.filter(a=>a.gid===4&&a.nat==='Dr'&&a.bal!==0);
  const tRevCr=revCr.reduce((s,a)=>s+a.bal,0);
  const tRevDr=revDr.reduce((s,a)=>s+a.bal,0);
  const netRev=tRevCr-tRevDr;
  // تكلفة المبيعات
  const cogs=DB.accounts.filter(a=>a.gid===5&&a.sub.includes('5-1')&&a.bal!==0);
  const tCogs=cogs.reduce((s,a)=>s+a.bal,0);
  const grossProfit=netRev-tCogs;
  // مصروفات البيع
  const sellExp=DB.accounts.filter(a=>a.gid===5&&a.sub.includes('5-2')&&a.bal!==0);
  const tSell=sellExp.reduce((s,a)=>s+a.bal,0);
  // مصروفات عمومية وإدارية
  const adminExp=DB.accounts.filter(a=>a.gid===5&&a.sub.includes('5-3')&&a.bal!==0);
  const tAdmin=adminExp.reduce((s,a)=>s+a.bal,0);
  const opProfit=grossProfit-tSell-tAdmin;
  // إيرادات أخرى
  const otherRev=DB.accounts.filter(a=>a.gid===4&&a.sub.includes('4-2')&&a.bal!==0&&a.nat==='Cr');
  const tOtherRev=otherRev.reduce((s,a)=>s+a.bal,0);
  // مصروفات مالية
  const finExp=DB.accounts.filter(a=>a.gid===5&&a.sub.includes('5-4')&&a.bal!==0);
  const tFin=finExp.reduce((s,a)=>s+a.bal,0);
  // ضرائب
  const taxExp=DB.accounts.filter(a=>a.gid===5&&a.sub.includes('5-5')&&a.bal!==0);
  const tTax=taxExp.reduce((s,a)=>s+a.bal,0);
  // مصروفات أخرى
  const otherExp=DB.accounts.filter(a=>a.gid===5&&a.sub.includes('5-6')&&a.bal!==0);
  const tOther=otherExp.reduce((s,a)=>s+a.bal,0);
  const netProfit=opProfit+tOtherRev-tFin-tTax-tOther;

  const sec=(title,accs,col,neg=false)=>accs.length?`<div class="rep-sec"><div class="rep-sec-hdr" style="color:${col}">${title}</div>${accs.map(a=>`<div class="rep-row"><span style="font-family:monospace;font-size:10px;color:#94A3B8;margin-left:6px">${a.code}</span><span>${a.name}</span><span class="${neg?'aneg':'apos'}">${neg?'('+fmt(a.bal)+')':fmt(a.bal)} ج</span></div>`).join('')}</div>`:'';

  document.getElementById('pl-body').innerHTML=`
    ${sec('إيرادات المبيعات',revCr,'#15803D')}
    ${revDr.length?`<div class="rep-sec"><div class="rep-sec-hdr" style="color:#DC2626">خصومات ومردودات المبيعات</div>${revDr.map(a=>`<div class="rep-row"><span>${a.name}</span><span class="aneg">(${fmt(a.bal)}) ج</span></div>`).join('')}</div>`:''}
    <div class="rep-tot" style="background:#EFF6FF"><span>صافي المبيعات</span><span class="apos">${fmt(netRev)} ج</span></div>
    ${sec('تكلفة البضاعة المباعة',cogs,'#DC2626',true)}
    <div class="rep-tot" style="background:${grossProfit>=0?'#F0FDF4':'#FFF1F2'}"><span style="font-weight:700">مجمل الربح</span><span class="${grossProfit>=0?'apos':'aneg'}">${fmt(grossProfit)} ج</span></div>
    ${sec('مصروفات البيع والتوزيع',sellExp,'#A16207',true)}
    ${sec('المصروفات العمومية والإدارية',adminExp,'#854F0B',true)}
    <div class="rep-tot" style="background:${opProfit>=0?'#EFF6FF':'#FFF1F2'}"><span style="font-weight:700">ربح العمليات</span><span class="${opProfit>=0?'apos':'aneg'}">${fmt(opProfit)} ج</span></div>
    ${otherRev.length?`${sec('إيرادات أخرى',otherRev,'#0F6E56')}<div class="rep-tot" style="background:#F0FDF4"><span>إجمالي الإيرادات الأخرى</span><span class="apos">${fmt(tOtherRev)} ج</span></div>`:''}
    ${sec('المصروفات المالية',finExp,'#7C3AED',true)}
    ${sec('ضريبة الدخل',taxExp,'#0F6E56',true)}
    ${sec('مصروفات أخرى',otherExp,'#64748B',true)}
    <div class="rep-net" style="background:${netProfit>=0?'#DCFCE7':'#FEE2E2'}">
      <span>صافي الربح / الخسارة</span>
      <span class="${netProfit>=0?'apos':'aneg'}">${fmt(netProfit)} ج</span>
    </div>`;
}

function renderBS(){
  const aAccs=DB.accounts.filter(a=>a.gid===1&&a.bal!==0);
  const lAccs=DB.accounts.filter(a=>a.gid===2&&a.bal!==0);
  const eAccs=DB.accounts.filter(a=>a.gid===3&&a.bal!==0);
  const tA=aAccs.filter(a=>a.nat==='Dr').reduce((s,a)=>s+a.bal,0)-aAccs.filter(a=>a.nat==='Cr').reduce((s,a)=>s+a.bal,0);
  const tL=lAccs.reduce((s,a)=>s+a.bal,0);
  const tE=eAccs.filter(a=>a.nat==='Cr').reduce((s,a)=>s+a.bal,0)-eAccs.filter(a=>a.nat==='Dr').reduce((s,a)=>s+a.bal,0);
  const ok=Math.abs(tA-(tL+tE))<1;
  const rs=(accs,pn)=>accs.sort((a,b)=>a.code.localeCompare(b.code,undefined,{numeric:true})).map(a=>`<div class="rep-row">
    <span style="font-family:monospace;font-size:10px;color:#94A3B8;margin-left:5px">${a.code}</span>
    <span>${a.isClientSub||a.isSupplierSub?'<span style="color:#94A3B8">↳ </span>':''}${a.name}</span>
    <span class="${a.nat===pn?'apos':'aneg'}">${fmt(a.bal)}</span>
  </div>`).join('');
  document.getElementById('bs-body').innerHTML=`
    <div style="margin-bottom:9px;padding:7px 11px;border-radius:8px;font-weight:700;background:${ok?'#DCFCE7':'#FEF9C3'};color:${ok?'#15803D':'#A16207'}">${ok?'الميزانية متوازنة ✓ (الأصول = الخصوم + حقوق الملكية)':'الميزانية غير متوازنة'}</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:13px">
      <div>
        <div class="rep-sec"><div class="rep-sec-hdr" style="color:#185FA5;font-size:13px">الأصول</div>${rs(aAccs,'Dr')}</div>
        <div class="rep-tot" style="background:#EFF6FF"><span>إجمالي الأصول</span><span class="apos">${fmt(tA)} ج</span></div>
      </div>
      <div>
        <div class="rep-sec"><div class="rep-sec-hdr" style="color:#DC2626;font-size:13px">الخصوم</div>${rs(lAccs,'Cr')}</div>
        <div style="font-size:11px;font-weight:700;color:#64748B;padding:4px 8px">الخصوم: <span class="aneg">${fmt(tL)} ج</span></div>
        <div class="rep-sec"><div class="rep-sec-hdr" style="color:#15803D;font-size:13px">حقوق الملكية</div>${rs(eAccs,'Cr')}</div>
        <div style="font-size:11px;font-weight:700;color:#64748B;padding:4px 8px">الملكية: <span class="apos">${fmt(tE)} ج</span></div>
        <div class="rep-tot" style="background:#F0FDF4"><span>الخصوم + الملكية</span><span>${fmt(tL+tE)} ج</span></div>
      </div>
    </div>`;
}

// ══ كشف حساب عميل ══
function renderClientStatement(){
  const cid=parseInt(document.getElementById('stmt-client').value)||0;
  const from=document.getElementById('stmt-from').value;
  const to=document.getElementById('stmt-to').value;
  if(!cid){document.getElementById('stmt-body').innerHTML='<div class="empty">اختر عميلاً</div>';return;}
  const client=DB.clients.find(c=>c.id===cid);
  const acc=DB.accounts.find(a=>a.clientId===cid);
  if(!acc){document.getElementById('stmt-body').innerHTML='<div class="empty">لا يوجد حساب مرتبط بهذا العميل</div>';return;}
  const entries=[];
  DB.journal.forEach(j=>{
    if(from&&j.date<from)return;if(to&&j.date>to)return;
    j.lines.forEach(l=>{if(l.accId===acc.id)entries.push({date:j.date,jid:j.id,desc:j.desc,dr:l.dr,cr:l.cr});});
  });
  entries.sort((a,b)=>a.date.localeCompare(b.date));
  let bal=0;
  const rows=entries.map(e=>{
    bal+=e.dr-e.cr;
    return`<tr>
      <td>${e.date}</td><td style="font-size:10px;font-family:monospace">${e.jid}</td>
      <td>${e.desc}</td>
      <td class="apos">${e.dr?fmt(e.dr):'—'}</td>
      <td class="aneg">${e.cr?fmt(e.cr):'—'}</td>
      <td class="${bal>=0?'apos':'aneg'}" style="font-weight:700">${fmt(Math.abs(bal))} ${bal>=0?'مدين':'دائن'}</td>
    </tr>`;
  });
  const total=entries.reduce((s,e)=>s+e.dr,0);
  const totalCr=entries.reduce((s,e)=>s+e.cr,0);
  document.getElementById('stmt-body').innerHTML=`
    <div style="display:flex;gap:14px;font-size:12px;padding:8px 10px;background:#F3E8FF;border-radius:7px;margin-bottom:10px;border:1px solid #E9D5FF">
      <span>العميل: <b>${client?.name||'—'}</b></span>
      <span style="font-family:monospace;color:#7C3AED">حساب: <b>${acc.code}</b></span>
      <span>الرصيد الحالي: <b class="apos">${fmt(acc.bal)} ج</b></span>
      ${from?`<span>من: ${from}</span>`:''}${to?`<span>إلى: ${to}</span>`:''}
    </div>
    ${rows.length?`<table>
      <tr><th style="width:11%">تاريخ</th><th style="width:11%">قيد</th><th style="width:35%">بيان</th><th style="width:13%">مدين</th><th style="width:13%">دائن</th><th style="width:17%">الرصيد</th></tr>
      ${rows.join('')}
      <tr style="font-weight:700;border-top:2px solid #E2E8F0;background:#F8FAFC">
        <td colspan="3">الإجمالي</td>
        <td class="apos">${fmt(total)}</td>
        <td class="aneg">${fmt(totalCr)}</td>
        <td class="${bal>=0?'apos':'aneg'}">${fmt(Math.abs(bal))} ${bal>=0?'مدين':'دائن'}</td>
      </tr>
    </table>`:'<div class="empty">لا توجد حركات في هذه الفترة</div>'}`;
}

// ══ كشف حساب مورد ══
function renderSupplierStatement(){
  const sid=parseInt(document.getElementById('sstmt-supp').value)||0;
  const from=document.getElementById('sstmt-from').value;
  const to=document.getElementById('sstmt-to').value;
  if(!sid){document.getElementById('sstmt-body').innerHTML='<div class="empty">اختر مورداً</div>';return;}
  const supp=DB.suppliers.find(s=>s.id===sid);
  const acc=DB.accounts.find(a=>a.supplierId===sid);
  if(!acc){document.getElementById('sstmt-body').innerHTML='<div class="empty">لا يوجد حساب مرتبط بهذا المورد</div>';return;}
  const entries=[];
  DB.journal.forEach(j=>{
    if(from&&j.date<from)return;if(to&&j.date>to)return;
    j.lines.forEach(l=>{if(l.accId===acc.id)entries.push({date:j.date,jid:j.id,desc:j.desc,dr:l.dr,cr:l.cr});});
  });
  entries.sort((a,b)=>a.date.localeCompare(b.date));
  let bal=0;
  const rows=entries.map(e=>{
    bal+=e.cr-e.dr; // طبيعة دائنة
    return`<tr>
      <td>${e.date}</td><td style="font-size:10px;font-family:monospace">${e.jid}</td>
      <td>${e.desc}</td>
      <td class="apos">${e.dr?fmt(e.dr):'—'}</td>
      <td class="aneg">${e.cr?fmt(e.cr):'—'}</td>
      <td class="${bal>=0?'aneg':'apos'}" style="font-weight:700">${fmt(Math.abs(bal))} ${bal>=0?'دائن':'مدين'}</td>
    </tr>`;
  });
  const total=entries.reduce((s,e)=>s+e.dr,0);
  const totalCr=entries.reduce((s,e)=>s+e.cr,0);
  document.getElementById('sstmt-body').innerHTML=`
    <div style="display:flex;gap:14px;font-size:12px;padding:8px 10px;background:#FEF9C3;border-radius:7px;margin-bottom:10px;border:1px solid #FDE68A">
      <span>المورد: <b>${supp?.name||'—'}</b></span>
      <span style="font-family:monospace;color:#A16207">حساب: <b>${acc.code}</b></span>
      <span>الرصيد: <b class="aneg">${fmt(acc.bal)} ج</b></span>
    </div>
    ${rows.length?`<table>
      <tr><th style="width:11%">تاريخ</th><th style="width:11%">قيد</th><th style="width:35%">بيان</th><th style="width:13%">مدين</th><th style="width:13%">دائن</th><th style="width:17%">الرصيد</th></tr>
      ${rows.join('')}
      <tr style="font-weight:700;border-top:2px solid #E2E8F0;background:#F8FAFC">
        <td colspan="3">الإجمالي</td>
        <td class="apos">${fmt(total)}</td>
        <td class="aneg">${fmt(totalCr)}</td>
        <td class="${bal>=0?'aneg':'apos'}">${fmt(Math.abs(bal))} ${bal>=0?'دائن':'مدين'}</td>
      </tr>
    </table>`:'<div class="empty">لا توجد حركات في هذه الفترة</div>'}`;
}

function refreshClientStmtSelect(){
  const sel=document.getElementById('stmt-client');if(!sel)return;
  sel.innerHTML=DB.clients.length?DB.clients.map(c=>`<option value="${c.id}">${c.name}</option>`).join(''):'<option value="">لا يوجد عملاء</option>';
}
function refreshSupplierStmtSelect(){
  const sel=document.getElementById('sstmt-supp');if(!sel)return;
  sel.innerHTML=DB.suppliers.length?DB.suppliers.map(s=>`<option value="${s.id}">${s.name}</option>`).join(''):'<option value="">لا يوجد موردون</option>';
}

// ══ SETTINGS ══
function renderSettings(){
  const s=DB.settings;
  document.getElementById('set-company').value=s.companyName||'';
  document.getElementById('set-company-ar').value=s.companyNameAr||'';
  document.getElementById('set-address').value=s.address||'';
  document.getElementById('set-phone').value=s.phone||'';
  document.getElementById('set-email').value=s.email||'';
  document.getElementById('set-taxnum').value=s.taxNumber||'';
  document.getElementById('set-taxrate').value=s.taxRate||14;
  document.getElementById('set-currency').value=s.currency||'ج.م';
  document.getElementById('set-invnote').value=s.invoiceNote||'';
  const used=JSON.stringify(DB).length;
  document.getElementById('storage-info').textContent=`حجم البيانات: ${(used/1024).toFixed(1)} كيلوبايت`;
  document.getElementById('stat-accs').textContent=DB.accounts.length;
  document.getElementById('stat-jvs').textContent=DB.journal.length;
  document.getElementById('stat-invs').textContent=DB.invoices.length+DB.purchases.length;
  document.getElementById('stat-clients').textContent=DB.clients.length;
  document.getElementById('stat-supps').textContent=DB.suppliers.length;
}
function saveSettings(){
  Object.assign(DB.settings,{
    companyName:document.getElementById('set-company').value.trim(),
    companyNameAr:document.getElementById('set-company-ar').value.trim(),
    address:document.getElementById('set-address').value.trim(),
    phone:document.getElementById('set-phone').value.trim(),
    email:document.getElementById('set-email').value.trim(),
    taxNumber:document.getElementById('set-taxnum').value.trim(),
    taxRate:parseFloat(document.getElementById('set-taxrate').value)||14,
    currency:document.getElementById('set-currency').value.trim()||'ج.م',
    invoiceNote:document.getElementById('set-invnote').value.trim(),
  });
  const cn=document.getElementById('sb-logo-name');if(cn)cn.textContent=DB.settings.companyName;
  save();toast('تم حفظ الإعدادات ✓','ok');
}
function clearAllData(){
  if(!confirm('تحذير: سيتم حذف جميع البيانات نهائياً!'))return;
  if(!confirm('تأكيد أخير — لا يمكن التراجع!'))return;
  localStorage.removeItem(STORE_KEY);location.reload();
}
