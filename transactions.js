/* AL AMEEN ERP — transactions.js */

// ══ INVOICES (مبيعات) ══
let ilC=0;
function initInvModal(inv=null){
  document.getElementById('fi-cl').innerHTML=DB.clients.length
    ?DB.clients.map(c=>`<option value="${c.id}">${c.name}</option>`).join('')
    :'<option value="">أضف عملاء أولاً</option>';
  document.getElementById('fi-due').value=today();
  document.getElementById('fi-taxr').value=DB.settings.taxRate||14;
  document.getElementById('fi-lines').innerHTML='';
  document.getElementById('fi-eid').value='';
  document.getElementById('im-t').textContent='فاتورة مبيعات جديدة';
  ilC=0;
  if(inv){
    document.getElementById('fi-eid').value=inv.id;
    document.getElementById('fi-due').value=inv.due;
    document.getElementById('fi-pay').value=inv.pay;
    document.getElementById('fi-taxr').value=inv.taxRate*100;
    if(inv.clientId)document.getElementById('fi-cl').value=inv.clientId;
    inv.lines.forEach(l=>addInvLine(l));
  }else{addInvLine();}
  calcInv();
}
function addInvLine(pf=null){
  const id=ilC++;const tr=document.createElement('tr');const prods=DB.products;
  tr.innerHTML=`<td>${prods.length
    ?`<select id="ilp-${id}" onchange="onIPC(${id})" style="width:100%">${prods.map(p=>`<option value="${p.id}" data-price="${p.price}" data-cost="${p.cost}" ${pf&&pf.productId==p.id?'selected':''}>${p.name}</option>`).join('')}</select>`
    :`<input id="ilp-${id}" placeholder="المنتج/الخدمة" value="${pf?.name||''}" style="width:100%">`
  }</td>
  <td><input type="number" id="ilq-${id}" value="${pf?.qty||1}" min="1" oninput="calcInv()" style="width:50px"></td>
  <td><input type="number" id="ilpr-${id}" value="${pf?.price||prods[0]?.price||0}" oninput="calcInv()" style="width:62px"></td>
  <td id="ilt-${id}" style="font-weight:700;font-size:11px">0</td>
  <td id="ilcost-${id}" style="font-size:10px;color:#A16207">0</td>
  <td><button style="cursor:pointer;color:#DC2626;border:none;background:none;font-size:13px" onclick="this.closest('tr').remove();calcInv()">✕</button></td>`;
  document.getElementById('fi-lines').appendChild(tr);calcInv();
}
function onIPC(id){
  const sel=document.getElementById('ilp-'+id);
  if(sel?.selectedOptions)document.getElementById('ilpr-'+id).value=sel.selectedOptions[0]?.dataset.price||0;
  calcInv();
}
function calcInv(){
  let sub=0,cogs=0;
  document.querySelectorAll('#fi-lines tr').forEach((_,i)=>{
    const q=parseFloat(document.getElementById('ilq-'+i)?.value)||0;
    const p=parseFloat(document.getElementById('ilpr-'+i)?.value)||0;
    const pEl=document.getElementById('ilp-'+i);
    const cost=pEl?.tagName==='SELECT'?parseFloat(pEl.selectedOptions[0]?.dataset.cost||0):0;
    const t=q*p,c=q*cost;
    const te=document.getElementById('ilt-'+i);if(te)te.textContent=fmt(t)+' ج';
    const ce=document.getElementById('ilcost-'+i);if(ce)ce.textContent=fmt(c)+' ج';
    sub+=t;cogs+=c;
  });
  const r=(parseFloat(document.getElementById('fi-taxr').value)||0)/100;
  const tax=sub*r;
  document.getElementById('fi-sub').textContent=fmt(sub);
  document.getElementById('fi-taxamt').textContent=fmt(tax);
  document.getElementById('fi-cogs').textContent=fmt(cogs);
  document.getElementById('fi-tot').textContent=fmt(sub+tax);
}
function saveInvoice(){
  const eid=document.getElementById('fi-eid').value;
  const cid=parseInt(document.getElementById('fi-cl').value)||0;
  if(!cid){toast('اختر عميلاً','err');return;}
  const pay=document.getElementById('fi-pay').value;
  const taxRate=(parseFloat(document.getElementById('fi-taxr').value)||0)/100;
  let sub=0,cogsTotal=0;const lines=[];
  document.querySelectorAll('#fi-lines tr').forEach((_,i)=>{
    const pEl=document.getElementById('ilp-'+i);
    const q=parseFloat(document.getElementById('ilq-'+i)?.value)||0;
    const p=parseFloat(document.getElementById('ilpr-'+i)?.value)||0;
    if(!q||!p)return;
    const name=pEl?.tagName==='SELECT'?pEl.selectedOptions[0]?.text:pEl?.value||'خدمة';
    const pid=pEl?.tagName==='SELECT'?parseInt(pEl.value):null;
    const cost=pEl?.tagName==='SELECT'?parseFloat(pEl.selectedOptions[0]?.dataset.cost||0):0;
    lines.push({name,productId:pid,qty:q,price:p,cost,total:q*p,cogs:q*cost});
    sub+=q*p;cogsTotal+=q*cost;
    if(pid){const prod=DB.products.find(x=>x.id===pid);if(prod)prod.qty=Math.max(0,prod.qty-q);}
  });
  if(!lines.length){toast('أضف بنداً واحداً','err');return;}
  const tax=Math.round(sub*taxRate),subtotal=Math.round(sub),total=subtotal+tax,cogs=Math.round(cogsTotal);
  const client=DB.clients.find(c=>c.id===cid);
  const clientAcc=client?ensureClientAcc(client):null;
  // قيود الفاتورة
  const jvLines=[];
  const dMap={cash:'1-1-1',bank:'1-1-2'};
  if(pay==='credit'&&clientAcc){
    jvLines.push({accId:clientAcc.id,dr:total,cr:0}); // ح/العميل مدين
  }else{
    const dAcc=findCode(dMap[pay]||'1-1-1');if(dAcc)jvLines.push({accId:dAcc.id,dr:total,cr:0});
  }
  const revAcc=findCode(C.SALES);if(revAcc)jvLines.push({accId:revAcc.id,dr:0,cr:subtotal});
  const vatAcc=findCode(C.VAT_OUT);if(tax&&vatAcc)jvLines.push({accId:vatAcc.id,dr:0,cr:tax});
  const cogsAcc=findCode(C.COGS);if(cogs&&cogsAcc)jvLines.push({accId:cogsAcc.id,dr:cogs,cr:0});
  const stockAcc=findCode(C.INV);if(cogs&&stockAcc)jvLines.push({accId:stockAcc.id,dr:0,cr:cogs});

  if(eid){
    const old=DB.invoices.find(x=>x.id==eid);
    if(old?.jvId){const oj=DB.journal.find(j=>j.id===old.jvId);if(oj)oj.lines.forEach(l=>revBal(l.accId,l.dr,l.cr));DB.journal=DB.journal.filter(j=>j.id!==old.jvId);}
    Object.assign(old,{clientId:cid,due:document.getElementById('fi-due').value,pay,taxRate,subtotal,tax,total,cogs,lines});
    if(jvLines.length){const jvId='JV-'+String(DB.nextJV++).padStart(4,'0');jvLines.forEach(l=>updateBal(l.accId,l.dr,l.cr));DB.journal.push({id:jvId,date:today(),desc:`تعديل فاتورة #${eid}`,lines:jvLines});old.jvId=jvId;}
    if(clientAcc)syncClientBal(cid);
    toast('تم تعديل الفاتورة ✓','ok');
  }else{
    const invId=DB.nextSaleInv++;let jvId='';
    if(jvLines.length){jvId='JV-'+String(DB.nextJV++).padStart(4,'0');jvLines.forEach(l=>updateBal(l.accId,l.dr,l.cr));DB.journal.push({id:jvId,date:today(),desc:`فاتورة مبيعات #${invId} — ${client?.name||''}`,lines:jvLines});}
    if(clientAcc)syncClientBal(cid);
    DB.invoices.push({id:invId,clientId:cid,date:today(),due:document.getElementById('fi-due').value,pay,taxRate,subtotal,tax,total,cogs,lines,jvId});
    toast(`تم ترحيل الفاتورة #${invId} ✓`,'ok');
  }
  closeModal('modal-inv');save();renderDash();
}
function renderInvList(){
  if(!DB.invoices.length){document.getElementById('inv-body').innerHTML='<div class="empty">لا توجد فواتير مبيعات</div>';return;}
  document.getElementById('inv-body').innerHTML=`<table>
    <tr><th style="width:7%">رقم</th><th style="width:16%">العميل</th><th style="width:9%">تاريخ</th><th style="width:11%">مبيعات</th><th style="width:9%">ضريبة</th><th style="width:9%">تكلفة</th><th style="width:10%">الإجمالي</th><th style="width:7%">دفع</th><th style="width:22%"></th></tr>
    ${DB.invoices.map(i=>{const c=DB.clients.find(x=>x.id===i.clientId);return`<tr>
      <td style="font-weight:700;color:#185FA5">#${i.id}</td>
      <td>${c?.name||'—'}</td><td style="font-size:10px">${i.date.slice(5)}</td>
      <td class="apos">${fmt(i.subtotal)}</td><td>${fmt(i.tax)}</td>
      <td style="color:#A16207">${fmt(i.cogs||0)}</td>
      <td class="apos">${fmt(i.total)} ج</td>
      <td style="font-size:10px">${i.pay==='cash'?'نقدي':i.pay==='bank'?'بنكي':'آجل'}</td>
      <td><div style="display:flex;gap:3px">
        <button class="btn btn-edit" onclick="editInv(${i.id})">تعديل</button>
        <button class="btn btn-print" onclick="printInv(${i.id})">🖨 PDF</button>
        <button class="btn btn-del" onclick="delInv(${i.id})">حذف</button>
      </div></td>
    </tr>`}).join('')}
  </table>`;
}
function editInv(id){const inv=DB.invoices.find(x=>x.id===id);if(!inv)return;initInvModal(inv);document.getElementById('modal-inv').classList.add('open');}
function delInv(id){
  confirmDel('سيتم حذف الفاتورة وعكس قيودها.',()=>{
    const inv=DB.invoices.find(x=>x.id===id);
    if(inv?.jvId){const jv=DB.journal.find(j=>j.id===inv.jvId);if(jv)jv.lines.forEach(l=>revBal(l.accId,l.dr,l.cr));DB.journal=DB.journal.filter(j=>j.id!==inv.jvId);}
    if(inv?.clientId){const acc=DB.accounts.find(a=>a.clientId===inv.clientId);if(acc)syncClientBal(inv.clientId);}
    DB.invoices=DB.invoices.filter(x=>x.id!==id);
    toast('تم الحذف ✓','ok');save();renderInvList();renderDash();
  });
}

// ── طباعة الفاتورة PDF ──
function printInv(id){
  const inv=DB.invoices.find(x=>x.id===id);if(!inv)return;
  const client=DB.clients.find(c=>c.id===inv.clientId);
  const s=DB.settings;
  const logoSrc=typeof LOGO_SRC!=='undefined'?LOGO_SRC:'';
  const payLabel=inv.pay==='cash'?'نقدي ✓':inv.pay==='bank'?'بنكي ✓':'آجل';
  const isCredit=inv.pay==='credit';
  const w=window.open('','_blank','width=920,height=750');
  w.document.write(`<!DOCTYPE html><html lang="ar" dir="rtl"><head>
  <meta charset="UTF-8"><title>فاتورة مبيعات #${inv.id}</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Segoe UI',Tahoma,Arial,sans-serif;background:#F0F2F5;direction:rtl;padding:20px}
    .wrap{max-width:820px;margin:0 auto;background:#fff;padding:28px;border-radius:10px;box-shadow:0 2px 12px rgba(0,0,0,.1)}
    .hdr{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:22px;padding-bottom:16px;border-bottom:3px solid #042C53}
    .co-logo{width:70px;height:70px;object-fit:contain;border-radius:8px}
    .co-info{margin-right:12px}
    .co-name{font-size:22px;font-weight:700;color:#042C53}
    .co-sub{font-size:11px;color:#64748B;margin-top:2px}
    .co-detail{font-size:11px;color:#64748B;margin-top:3px}
    .inv-box{text-align:center;border:2px solid #042C53;border-radius:8px;padding:10px 18px;min-width:160px}
    .inv-title{font-size:12px;font-weight:700;color:#042C53;text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px}
    .inv-num{font-size:24px;font-weight:700;color:#042C53}
    .inv-date{font-size:11px;color:#64748B;margin-top:3px}
    .inv-status{display:inline-block;margin-top:5px;padding:3px 10px;border-radius:5px;font-size:11px;font-weight:700;background:${isCredit?'#FEF9C3':'#DCFCE7'};color:${isCredit?'#A16207':'#15803D'}}
    .parties{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:18px}
    .party{background:#F8FAFC;border:1px solid #E2E8F0;border-radius:8px;padding:11px 13px}
    .party-title{font-size:9px;font-weight:700;color:#94A3B8;text-transform:uppercase;letter-spacing:.06em;margin-bottom:5px}
    .party-name{font-size:14px;font-weight:700;color:#1E293B}
    .party-info{font-size:11px;color:#64748B;margin-top:2px}
    table{width:100%;border-collapse:collapse;margin-bottom:16px}
    thead th{padding:9px 10px;background:#042C53;color:#fff;font-size:11px;font-weight:700;text-align:right}
    tbody td{padding:8px 10px;border-bottom:1px solid #E2E8F0;font-size:12px;text-align:right}
    tbody tr:nth-child(even) td{background:#F8FAFC}
    tbody tr:last-child td{border-bottom:none}
    .totals-wrap{display:flex;justify-content:flex-end;margin-bottom:16px}
    .totals{width:270px}
    .tot-row{display:flex;justify-content:space-between;padding:5px 0;font-size:12px;border-bottom:1px solid #F1F5F9}
    .tot-final{display:flex;justify-content:space-between;padding:9px 0;font-size:15px;font-weight:700;color:#042C53;border-top:2px solid #042C53}
    .note-box{background:#EFF6FF;border-radius:7px;padding:9px 13px;font-size:12px;color:#1D4ED8;margin-bottom:14px;border-right:3px solid #185FA5}
    .footer{text-align:center;font-size:10px;color:#94A3B8;padding-top:12px;border-top:1px solid #E2E8F0;margin-top:4px}
    .stamp-area{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:20px}
    .stamp-box{border:1px dashed #CBD5E1;border-radius:6px;padding:10px;text-align:center;font-size:11px;color:#94A3B8;min-height:60px}
    .print-btn{display:block;margin:16px auto 0;padding:9px 22px;background:#042C53;color:#fff;border:none;border-radius:7px;font-size:13px;cursor:pointer;font-family:inherit}
    @media print{.print-btn{display:none}body{background:#fff;padding:0}.wrap{box-shadow:none;border-radius:0;padding:15mm}}
  </style></head><body>
  <div class="wrap" id="inv-print-area">
    <div class="hdr">
      <div style="display:flex;align-items:flex-start;gap:12px">
        ${logoSrc?`<img src="${logoSrc}" class="co-logo" alt="logo">`:''}
        <div class="co-info">
          <div class="co-name">${s.companyName||'AL AMEEN ERP'}</div>
          <div class="co-sub">${s.companyNameAr||''}</div>
          ${s.address?`<div class="co-detail">📍 ${s.address}</div>`:''}
          ${s.phone?`<div class="co-detail">📞 ${s.phone}</div>`:''}
          ${s.email?`<div class="co-detail">✉ ${s.email}</div>`:''}
          ${s.taxNumber?`<div class="co-detail">الرقم الضريبي: ${s.taxNumber}</div>`:''}
        </div>
      </div>
      <div class="inv-box">
        <div class="inv-title">فاتورة مبيعات</div>
        <div class="inv-num">#${inv.id}</div>
        <div class="inv-date">التاريخ: ${inv.date}</div>
        <div class="inv-date">الاستحقاق: ${inv.due}</div>
        <div><span class="inv-status">${payLabel}</span></div>
      </div>
    </div>
    <div class="parties">
      <div class="party">
        <div class="party-title">مُصدر الفاتورة</div>
        <div class="party-name">${s.companyName||'AL AMEEN'}</div>
        ${s.address?`<div class="party-info">${s.address}</div>`:''}
        ${s.phone?`<div class="party-info">${s.phone}</div>`:''}
        ${s.taxNumber?`<div class="party-info">ر.ض: ${s.taxNumber}</div>`:''}
      </div>
      <div class="party">
        <div class="party-title">فُواتَر إلى</div>
        <div class="party-name">${client?.name||'—'}</div>
        ${client?.phone?`<div class="party-info">📞 ${client.phone}</div>`:''}
        ${client?.email?`<div class="party-info">✉ ${client.email}</div>`:''}
        ${client?.addr?`<div class="party-info">📍 ${client.addr}</div>`:''}
      </div>
    </div>
    <table>
      <thead><tr><th style="width:5%">#</th><th style="width:42%">المنتج / الخدمة</th><th style="width:12%">الكمية</th><th style="width:18%">سعر الوحدة</th><th style="width:23%">الإجمالي</th></tr></thead>
      <tbody>
        ${inv.lines.map((l,i)=>`<tr><td>${i+1}</td><td>${l.name}</td><td>${l.qty}</td><td>${fmt(l.price)} ${s.currency}</td><td style="font-weight:700">${fmt(l.total)} ${s.currency}</td></tr>`).join('')}
      </tbody>
    </table>
    <div class="totals-wrap">
      <div class="totals">
        <div class="tot-row"><span>المجموع قبل الضريبة</span><span>${fmt(inv.subtotal)} ${s.currency}</span></div>
        <div class="tot-row"><span>ضريبة القيمة المضافة (${Math.round(inv.taxRate*100)}%)</span><span>${fmt(inv.tax)} ${s.currency}</span></div>
        <div class="tot-final"><span>إجمالي المبلغ المستحق</span><span>${fmt(inv.total)} ${s.currency}</span></div>
      </div>
    </div>
    ${s.invoiceNote?`<div class="note-box">ملاحظة: ${s.invoiceNote}</div>`:''}
    <div class="stamp-area">
      <div class="stamp-box">توقيع المستلم / العميل<br><br><br></div>
      <div class="stamp-box">ختم وتوقيع ${s.companyName||''}<br><br><br></div>
    </div>
    <div class="footer">
      ${s.companyName||'AL AMEEN ERP'} — ${s.address||''} — ${s.phone||''}
      ${s.taxNumber?`— الرقم الضريبي: ${s.taxNumber}`:''}
    </div>
  </div>
  <button class="print-btn" onclick="window.print()">🖨 طباعة / حفظ PDF</button>
  </body></html>`);
  w.document.close();
}

// ══ PURCHASES (مشتريات) ══
function initPurchModal(po=null){
  document.getElementById('po-supp').innerHTML=DB.suppliers.length?DB.suppliers.map(s=>`<option value="${s.id}">${s.name}</option>`).join(''):'<option value="">أضف موردين</option>';
  document.getElementById('po-prod').innerHTML=DB.products.length?DB.products.map(p=>`<option value="${p.id}">${p.name}</option>`).join(''):'<option value="">أضف منتجات</option>';
  document.getElementById('po-date').value=today();
  document.getElementById('po-eid').value='';
  document.getElementById('pm-t').textContent='فاتورة شراء جديدة';
  if(po){document.getElementById('po-eid').value=po.id;document.getElementById('po-supp').value=po.supplierId;document.getElementById('po-prod').value=po.productId;document.getElementById('po-qty').value=po.qty;document.getElementById('po-price').value=po.price;document.getElementById('po-date').value=po.date;document.getElementById('po-pay').value=po.pay;}
}
function savePurch(){
  const eid=document.getElementById('po-eid').value;
  const sid=parseInt(document.getElementById('po-supp').value)||0;
  const pid=parseInt(document.getElementById('po-prod').value)||0;
  const qty=parseFloat(document.getElementById('po-qty').value)||0;
  const price=parseFloat(document.getElementById('po-price').value)||0;
  const pay=document.getElementById('po-pay').value;
  const date=document.getElementById('po-date').value;
  if(!qty||!price){toast('أدخل الكمية والسعر','err');return;}
  const total=Math.round(qty*price);
  const supplier=DB.suppliers.find(s=>s.id===sid);
  const suppAcc=supplier?ensureSupplierAcc(supplier):null;
  const stockAcc=findCode(C.INV);
  const jvLines=[];
  if(stockAcc)jvLines.push({accId:stockAcc.id,dr:total,cr:0});
  if(pay==='credit'&&suppAcc){
    jvLines.push({accId:suppAcc.id,dr:0,cr:total}); // ح/المورد دائن
  }else{
    const cMap={cash:'1-1-1',bank:'1-1-2'};
    const cAcc=findCode(cMap[pay]||'1-1-1');if(cAcc)jvLines.push({accId:cAcc.id,dr:0,cr:total});
  }
  if(eid){
    const old=DB.purchases.find(x=>x.id==eid);
    if(old?.jvId){const oj=DB.journal.find(j=>j.id===old.jvId);if(oj)oj.lines.forEach(l=>revBal(l.accId,l.dr,l.cr));DB.journal=DB.journal.filter(j=>j.id!==old.jvId);}
    const prod=DB.products.find(p=>p.id===pid);if(prod&&old)prod.qty+=(qty-old.qty);
    Object.assign(old,{supplierId:sid,productId:pid,qty,price,total,pay,date});
    if(jvLines.length){const jvId='JV-'+String(DB.nextJV++).padStart(4,'0');jvLines.forEach(l=>updateBal(l.accId,l.dr,l.cr));DB.journal.push({id:jvId,date,desc:`تعديل فاتورة شراء #${eid}`,lines:jvLines});old.jvId=jvId;}
    if(suppAcc)syncSupplierBal(sid);
    toast('تم التعديل ✓','ok');
  }else{
    const prod=DB.products.find(p=>p.id===pid);if(prod){prod.qty+=qty;prod.cost=price;}
    const invId=DB.nextPurchInv++;let jvId='';
    if(jvLines.length){jvId='JV-'+String(DB.nextJV++).padStart(4,'0');jvLines.forEach(l=>updateBal(l.accId,l.dr,l.cr));DB.journal.push({id:jvId,date,desc:`فاتورة شراء #${invId} من ${supplier?.name||''}`,lines:jvLines});}
    if(suppAcc)syncSupplierBal(sid);
    DB.purchases.push({id:invId,supplierId:sid,productId:pid,qty,price,total,pay,date,jvId});
    toast(`تم ترحيل فاتورة الشراء #${invId} ✓`,'ok');
  }
  closeModal('modal-purch');save();renderDash();
}
function renderPurchList(){
  if(!DB.purchases.length){document.getElementById('purch-body').innerHTML='<div class="empty">لا توجد فواتير مشتريات</div>';return;}
  document.getElementById('purch-body').innerHTML=`<table>
    <tr><th style="width:7%">رقم</th><th style="width:16%">المورد</th><th style="width:14%">المنتج</th><th style="width:9%">تاريخ</th><th style="width:7%">كمية</th><th style="width:11%">سعر</th><th style="width:11%">إجمالي</th><th style="width:7%">دفع</th><th style="width:18%"></th></tr>
    ${DB.purchases.map(p=>{const s=DB.suppliers.find(x=>x.id===p.supplierId);const pr=DB.products.find(x=>x.id===p.productId);return`<tr>
      <td style="font-weight:700;color:#A16207">#${p.id}</td>
      <td>${s?.name||'—'}</td><td>${pr?.name||'—'}</td><td style="font-size:10px">${(p.date||'').slice(5)}</td>
      <td>${p.qty}</td><td>${fmt(p.price)}</td><td class="aneg">${fmt(p.total)} ج</td>
      <td style="font-size:10px">${p.pay==='cash'?'نقدي':p.pay==='bank'?'بنكي':'آجل'}</td>
      <td><div style="display:flex;gap:3px">
        <button class="btn btn-edit" onclick="editPurch(${p.id})">✎</button>
        <button class="btn btn-print" onclick="printPurch(${p.id})">🖨 PDF</button>
        <button class="btn btn-del" onclick="delPurch(${p.id})">✕</button>
      </div></td>
    </tr>`}).join('')}
  </table>`;
}
function editPurch(id){const po=DB.purchases.find(x=>x.id===id);if(!po)return;initPurchModal(po);document.getElementById('modal-purch').classList.add('open');}
function delPurch(id){
  confirmDel('سيتم حذف فاتورة الشراء وعكس قيودها.',()=>{
    const po=DB.purchases.find(x=>x.id===id);
    if(po?.jvId){const jv=DB.journal.find(j=>j.id===po.jvId);if(jv)jv.lines.forEach(l=>revBal(l.accId,l.dr,l.cr));DB.journal=DB.journal.filter(j=>j.id!==po.jvId);}
    if(po){const prod=DB.products.find(p=>p.id===po.productId);if(prod)prod.qty=Math.max(0,prod.qty-po.qty);if(po.supplierId){const acc=DB.accounts.find(a=>a.supplierId===po.supplierId);if(acc)syncSupplierBal(po.supplierId);}}
    DB.purchases=DB.purchases.filter(x=>x.id!==id);
    toast('تم الحذف ✓','ok');save();renderPurchList();renderDash();
  });
}
// طباعة فاتورة شراء
function printPurch(id){
  const po=DB.purchases.find(x=>x.id===id);if(!po)return;
  const supp=DB.suppliers.find(s=>s.id===po.supplierId);
  const prod=DB.products.find(p=>p.id===po.productId);
  const s=DB.settings;
  const logoSrc=typeof LOGO_SRC!=='undefined'?LOGO_SRC:'';
  const payLabel=po.pay==='cash'?'نقدي':po.pay==='bank'?'بنكي':'آجل';
  const w=window.open('','_blank','width=820,height=700');
  w.document.write(`<!DOCTYPE html><html lang="ar" dir="rtl"><head>
  <meta charset="UTF-8"><title>فاتورة شراء #${po.id}</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Segoe UI',Tahoma,Arial,sans-serif;background:#F0F2F5;direction:rtl;padding:20px}
    .wrap{max-width:820px;margin:0 auto;background:#fff;padding:28px;border-radius:10px;box-shadow:0 2px 12px rgba(0,0,0,.1)}
    .hdr{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:22px;padding-bottom:16px;border-bottom:3px solid #A16207}
    .co-logo{width:70px;height:70px;object-fit:contain;border-radius:8px}
    .co-name{font-size:20px;font-weight:700;color:#A16207}
    .co-sub{font-size:11px;color:#64748B;margin-top:2px}
    .co-detail{font-size:11px;color:#64748B;margin-top:3px}
    .inv-box{text-align:center;border:2px solid #A16207;border-radius:8px;padding:10px 18px;min-width:160px}
    .inv-title{font-size:12px;font-weight:700;color:#A16207;letter-spacing:.04em;margin-bottom:4px}
    .inv-num{font-size:24px;font-weight:700;color:#A16207}
    .inv-date{font-size:11px;color:#64748B;margin-top:3px}
    .parties{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:18px}
    .party{background:#FFFDF0;border:1px solid #FDE68A;border-radius:8px;padding:11px 13px}
    .party-title{font-size:9px;font-weight:700;color:#A16207;text-transform:uppercase;letter-spacing:.05em;margin-bottom:5px}
    .party-name{font-size:14px;font-weight:700;color:#1E293B}
    .party-info{font-size:11px;color:#64748B;margin-top:2px}
    table{width:100%;border-collapse:collapse;margin-bottom:14px}
    thead th{padding:9px 10px;background:#A16207;color:#fff;font-size:11px;text-align:right}
    tbody td{padding:8px 10px;border-bottom:1px solid #E2E8F0;font-size:12px;text-align:right}
    tbody tr:nth-child(even) td{background:#FFFDF0}
    .tot-final{display:flex;justify-content:space-between;padding:9px;font-size:15px;font-weight:700;color:#A16207;border:2px solid #A16207;border-radius:7px}
    .footer{text-align:center;font-size:10px;color:#94A3B8;padding-top:10px;border-top:1px solid #E2E8F0;margin-top:14px}
    .print-btn{display:block;margin:16px auto 0;padding:9px 22px;background:#A16207;color:#fff;border:none;border-radius:7px;font-size:13px;cursor:pointer;font-family:inherit}
    @media print{.print-btn{display:none}body{background:#fff;padding:0}.wrap{box-shadow:none;padding:15mm}}
  </style></head><body>
  <div class="wrap">
    <div class="hdr">
      <div style="display:flex;align-items:flex-start;gap:12px">
        ${logoSrc?`<img src="${logoSrc}" class="co-logo" alt="logo">`:''}
        <div>
          <div class="co-name">${s.companyName||'AL AMEEN ERP'}</div>
          <div class="co-sub">${s.companyNameAr||''}</div>
          ${s.address?`<div class="co-detail">📍 ${s.address}</div>`:''}
          ${s.phone?`<div class="co-detail">📞 ${s.phone}</div>`:''}
        </div>
      </div>
      <div class="inv-box">
        <div class="inv-title">فاتورة مشتريات</div>
        <div class="inv-num">#${po.id}</div>
        <div class="inv-date">التاريخ: ${po.date}</div>
        <div class="inv-date">طريقة الدفع: ${payLabel}</div>
      </div>
    </div>
    <div class="parties">
      <div class="party">
        <div class="party-title">المشتري</div>
        <div class="party-name">${s.companyName||'AL AMEEN'}</div>
        ${s.address?`<div class="party-info">${s.address}</div>`:''}
      </div>
      <div class="party">
        <div class="party-title">المورد</div>
        <div class="party-name">${supp?.name||'—'}</div>
        ${supp?.phone?`<div class="party-info">📞 ${supp.phone}</div>`:''}
        ${supp?.cat?`<div class="party-info">التخصص: ${supp.cat}</div>`:''}
      </div>
    </div>
    <table>
      <thead><tr><th style="width:5%">#</th><th style="width:45%">المنتج</th><th style="width:12%">الكمية</th><th style="width:18%">سعر الوحدة</th><th style="width:20%">الإجمالي</th></tr></thead>
      <tbody>
        <tr><td>1</td><td>${prod?.name||'—'}</td><td>${po.qty}</td><td>${fmt(po.price)} ${s.currency}</td><td style="font-weight:700">${fmt(po.total)} ${s.currency}</td></tr>
      </tbody>
    </table>
    <div style="display:flex;justify-content:flex-end;margin-bottom:14px">
      <div class="tot-final" style="width:260px"><span>إجمالي المبلغ</span><span>${fmt(po.total)} ${s.currency}</span></div>
    </div>
    <div class="footer">${s.companyName||'AL AMEEN ERP'} — ${s.address||''} — ${s.phone||''}</div>
  </div>
  <button class="print-btn" onclick="window.print()">🖨 طباعة / حفظ PDF</button>
  </body></html>`);
  w.document.close();
}

// ══ CLIENTS ══
function saveClient(){
  const eid=document.getElementById('cl-eid').value;
  const name=document.getElementById('cl-name').value.trim();
  if(!name){toast('أدخل الاسم','err');return;}
  const data={name,phone:document.getElementById('cl-phone').value,email:document.getElementById('cl-email').value,addr:document.getElementById('cl-addr').value,balance:parseFloat(document.getElementById('cl-bal').value)||0};
  if(eid){
    Object.assign(DB.clients.find(c=>c.id==eid),data);
    const acc=DB.accounts.find(a=>a.clientId==eid);
    if(acc){acc.name=data.name;acc.bal=data.balance;}
    toast('تم التعديل ✓','ok');
  }else{
    const newClient={id:Date.now(),...data};
    DB.clients.push(newClient);
    ensureClientAcc(newClient);
    toast('تم إضافة العميل وحسابه الفرعي ✓','ok');
  }
  closeModal('modal-client');save();renderClients();if(typeof refreshClientStmtSelect==='function')refreshClientStmtSelect();
}
function editClient(id){
  const c=DB.clients.find(x=>x.id==id);if(!c)return;
  document.getElementById('clm-t').textContent='تعديل عميل';
  document.getElementById('cl-eid').value=id;document.getElementById('cl-name').value=c.name;
  document.getElementById('cl-phone').value=c.phone||'';document.getElementById('cl-email').value=c.email||'';
  document.getElementById('cl-addr').value=c.addr||'';document.getElementById('cl-bal').value=c.balance||0;
  document.getElementById('modal-client').classList.add('open');
}
function delClient(id){
  confirmDel('سيتم حذف العميل وحسابه الفرعي.',()=>{
    DB.clients=DB.clients.filter(c=>c.id!==id);
    DB.accounts=DB.accounts.filter(a=>a.clientId!==id);
    toast('تم الحذف ✓','ok');save();renderClients();renderCOA();
  });
}
function renderClients(){
  if(!DB.clients.length){document.getElementById('clients-body').innerHTML='<div class="empty">لا يوجد عملاء</div>';return;}
  document.getElementById('clients-body').innerHTML=`<table>
    <tr><th style="width:20%">الاسم</th><th style="width:13%">الهاتف</th><th style="width:16%">البريد</th><th style="width:13%">العنوان</th><th style="width:11%">الرصيد</th><th style="width:9%">حساب</th><th style="width:18%"></th></tr>
    ${DB.clients.map(c=>{
      const acc=DB.accounts.find(a=>a.clientId==c.id);
      return`<tr>
        <td style="font-weight:600">${c.name}</td>
        <td>${c.phone||'—'}</td><td style="font-size:11px">${c.email||'—'}</td>
        <td style="font-size:11px">${c.addr||'—'}</td>
        <td class="${c.balance>0?'apos':''}">${fmt(c.balance)} ج</td>
        <td><span style="font-size:9px;font-family:monospace;color:#7C3AED">${acc?acc.code:'—'}</span></td>
        <td><div style="display:flex;gap:3px">
          <button class="btn btn-edit" onclick="editClient(${c.id})">تعديل</button>
          <button class="btn" style="font-size:10px;padding:3px 5px;color:#7C3AED;border-color:#E9D5FF" onclick="showLedgerForAcc(${acc?acc.id:0})">كشف</button>
          <button class="btn btn-del" onclick="delClient(${c.id})">حذف</button>
        </div></td>
      </tr>`;
    }).join('')}
  </table>`;
}

// ══ SUPPLIERS ══
function saveSupplier(){
  const eid=document.getElementById('sp-eid').value;
  const name=document.getElementById('sp-name').value.trim();
  if(!name){toast('أدخل الاسم','err');return;}
  const data={name,phone:document.getElementById('sp-phone').value,cat:document.getElementById('sp-cat').value,balance:parseFloat(document.getElementById('sp-bal').value)||0};
  if(eid){
    Object.assign(DB.suppliers.find(s=>s.id==eid),data);
    const acc=DB.accounts.find(a=>a.supplierId==eid);
    if(acc){acc.name=data.name;acc.bal=data.balance;}
    toast('تم التعديل ✓','ok');
  }else{
    const newSupp={id:Date.now(),...data};
    DB.suppliers.push(newSupp);
    ensureSupplierAcc(newSupp);
    toast('تم إضافة المورد وحسابه الفرعي ✓','ok');
  }
  closeModal('modal-supp');save();renderSuppliers();if(typeof refreshSupplierStmtSelect==='function')refreshSupplierStmtSelect();
}
function editSupplier(id){
  const s=DB.suppliers.find(x=>x.id==id);if(!s)return;
  document.getElementById('spm-t').textContent='تعديل مورد';
  document.getElementById('sp-eid').value=id;document.getElementById('sp-name').value=s.name;
  document.getElementById('sp-phone').value=s.phone||'';document.getElementById('sp-cat').value=s.cat||'';
  document.getElementById('sp-bal').value=s.balance||0;
  document.getElementById('modal-supp').classList.add('open');
}
function delSupplier(id){
  confirmDel('سيتم حذف المورد وحسابه الفرعي.',()=>{
    DB.suppliers=DB.suppliers.filter(s=>s.id!==id);
    DB.accounts=DB.accounts.filter(a=>a.supplierId!==id);
    toast('تم الحذف ✓','ok');save();renderSuppliers();renderCOA();
  });
}
function renderSuppliers(){
  if(!DB.suppliers.length){document.getElementById('supp-body').innerHTML='<div class="empty">لا يوجد موردون</div>';return;}
  document.getElementById('supp-body').innerHTML=`<table>
    <tr><th style="width:22%">الاسم</th><th style="width:14%">الهاتف</th><th style="width:16%">التخصص</th><th style="width:11%">المستحق</th><th style="width:9%">حساب</th><th style="width:28%"></th></tr>
    ${DB.suppliers.map(s=>{
      const acc=DB.accounts.find(a=>a.supplierId==s.id);
      return`<tr>
        <td style="font-weight:600">${s.name}</td>
        <td>${s.phone||'—'}</td><td>${s.cat||'—'}</td>
        <td class="${s.balance>0?'aneg':''}">${fmt(s.balance)} ج</td>
        <td><span style="font-size:9px;font-family:monospace;color:#A16207">${acc?acc.code:'—'}</span></td>
        <td><div style="display:flex;gap:3px">
          <button class="btn btn-edit" onclick="editSupplier(${s.id})">تعديل</button>
          <button class="btn" style="font-size:10px;padding:3px 5px;color:#A16207;border-color:#FDE68A" onclick="showLedgerForAcc(${acc?acc.id:0})">كشف</button>
          <button class="btn btn-del" onclick="delSupplier(${s.id})">حذف</button>
        </div></td>
      </tr>`;
    }).join('')}
  </table>`;
}

// ══ STOCK ══
function saveProduct(){
  const eid=document.getElementById('pr-eid').value;
  const name=document.getElementById('pr-name').value.trim();
  if(!name){toast('أدخل الاسم','err');return;}
  const data={name,cat:document.getElementById('pr-cat').value,unit:document.getElementById('pr-unit').value,qty:parseFloat(document.getElementById('pr-qty').value)||0,minQty:parseFloat(document.getElementById('pr-min').value)||0,cost:parseFloat(document.getElementById('pr-cost').value)||0,price:parseFloat(document.getElementById('pr-price').value)||0};
  if(eid){Object.assign(DB.products.find(p=>p.id==eid),data);toast('تم التعديل ✓','ok');}
  else{DB.products.push({id:Date.now(),...data});toast('تم الإضافة ✓','ok');}
  closeModal('modal-product');save();renderStock();
}
function editProduct(id){
  const p=DB.products.find(x=>x.id==id);if(!p)return;
  document.getElementById('prm-t').textContent='تعديل منتج';
  document.getElementById('pr-eid').value=id;document.getElementById('pr-name').value=p.name;
  document.getElementById('pr-cat').value=p.cat||'';document.getElementById('pr-unit').value=p.unit||'';
  document.getElementById('pr-qty').value=p.qty;document.getElementById('pr-min').value=p.minQty||0;
  document.getElementById('pr-cost').value=p.cost;document.getElementById('pr-price').value=p.price;
  document.getElementById('modal-product').classList.add('open');
}
function delProduct(id){confirmDel('سيتم حذف المنتج.',()=>{DB.products=DB.products.filter(p=>p.id!==id);toast('تم الحذف ✓','ok');save();renderStock();});}
function renderStock(){
  if(!DB.products.length){document.getElementById('stock-body').innerHTML='<div class="empty">لا توجد منتجات</div>';return;}
  document.getElementById('stock-body').innerHTML=`<table>
    <tr><th style="width:18%">الاسم</th><th style="width:9%">الفئة</th><th style="width:7%">وحدة</th><th style="width:7%">كمية</th><th style="width:7%">أدنى</th><th style="width:11%">سعر التكلفة</th><th style="width:11%">سعر البيع</th><th style="width:8%">هامش</th><th style="width:8%">حالة</th><th style="width:14%"></th></tr>
    ${DB.products.map(p=>{
      const m=p.price>0?Math.round((p.price-p.cost)/p.price*100):0;
      const st=p.minQty>0&&p.qty<=p.minQty*.5?'<span class="badge bd">نفد</span>':p.minQty>0&&p.qty<=p.minQty?'<span class="badge bw">منخفض</span>':'<span class="badge bs">جيد</span>';
      return`<tr><td style="font-weight:600">${p.name}</td><td>${p.cat||'—'}</td><td>${p.unit||'—'}</td><td style="font-weight:700">${p.qty}</td><td>${p.minQty||'—'}</td><td>${fmt(p.cost)} ج</td><td>${fmt(p.price)} ج</td><td style="color:${m>0?'#15803D':'#DC2626'}">${m}%</td><td>${st}</td><td><div style="display:flex;gap:3px"><button class="btn btn-edit" onclick="editProduct(${p.id})">✎</button><button class="btn btn-del" onclick="delProduct(${p.id})">✕</button></div></td></tr>`;
    }).join('')}
  </table>`;
}
