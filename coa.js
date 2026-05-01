/* AL AMEEN ERP — coa.js + journal.js + ledger.js */

// ══ ACC SEARCH INPUT ══
function initAccSearch(inputId, hiddenId, hintId, filterFn){
  const inp=document.getElementById(inputId);
  const hid=document.getElementById(hiddenId);
  const hint=document.getElementById(hintId);
  if(!inp)return;
  let box=inp.nextElementSibling;
  if(!box||!box.classList.contains('acc-suggestions')){
    box=document.createElement('div');box.className='acc-suggestions';
    inp.parentNode.insertBefore(box,inp.nextSibling);
  }
  inp.oninput=()=>{
    const q=inp.value.trim();
    if(!q){box.classList.remove('show');return;}
    let res=searchAccounts(q);
    if(filterFn)res=res.filter(filterFn);
    if(!res.length){box.innerHTML='<div class="acc-sug-item" style="color:#94A3B8">لا توجد نتائج</div>';box.classList.add('show');return;}
    box.innerHTML=res.map(a=>`<div class="acc-sug-item" data-id="${a.id}" data-name="${a.name}" data-code="${a.code}">
      <span class="acc-sug-code">[${a.code}]</span>${a.name}
      <span style="font-size:10px;color:#94A3B8;margin-right:4px">${a.gname}</span>
    </div>`).join('');
    box.classList.add('show');
    box.querySelectorAll('.acc-sug-item').forEach(el=>el.addEventListener('click',()=>{
      const id=parseInt(el.dataset.id);
      if(hid)hid.value=id;
      inp.value=`[${el.dataset.code}] ${el.dataset.name}`;
      box.classList.remove('show');
      if(hint){const a=findAcc(id);if(a)hint.textContent=`طبيعته: ${a.nat==='Dr'?'مدين':'دائن'} | رصيده: ${fmt(a.bal)} ج`;}
    }));
  };
  document.addEventListener('click',e=>{if(!inp.contains(e.target)&&!box.contains(e.target))box.classList.remove('show');});
}

// ══ COA RENDER ══
function renderCOA(){
  const q=(document.getElementById('coa-q')||{}).value?.trim().toLowerCase()||'';
  const cols={1:'#185FA5',2:'#DC2626',3:'#15803D',4:'#0F6E56',5:'#A16207'};
  const gN={1:'الأصول',2:'الخصوم',3:'حقوق الملكية',4:'الإيرادات',5:'المصروفات'};
  const ico={1:'🏦',2:'📋',3:'💼',4:'📈',5:'📉'};
  let html='';
  [1,2,3,4,5].forEach(gid=>{
    const allGid=DB.accounts.filter(a=>a.gid===gid);
    let mainAccs=allGid.filter(a=>!a.isClientSub&&!a.isSupplierSub);
    if(q)mainAccs=mainAccs.filter(a=>a.code.includes(q)||a.name.includes(q)||a.sub.includes(q));
    const totDr=allGid.filter(a=>a.nat==='Dr').reduce((s,a)=>s+a.bal,0);
    const totCr=allGid.filter(a=>a.nat==='Cr').reduce((s,a)=>s+a.bal,0);
    const netBal=totDr-totCr;
    html+=`<div class="coa-group">
      <div class="coa-grp-hdr" style="background:${cols[gid]}11;color:${cols[gid]}" onclick="toggleGrp(this)">
        <span>${ico[gid]} ${gid}. ${gN[gid]} <span style="font-size:10px;font-weight:400">(${allGid.length} حساب)</span></span>
        <span style="font-size:12px">${fmt(Math.abs(netBal))} ج <span class="arr">▼</span></span>
      </div>
      <div class="coa-grp-body">`;
    if(!mainAccs.length&&!q){html+='<div class="empty">اضغط + لإضافة حساب</div>';
    }else{
      const subs=[...new Set(mainAccs.map(a=>a.sub))].sort();
      subs.forEach(sub=>{
        const sa=mainAccs.filter(a=>a.sub===sub).sort((a,b)=>a.code.localeCompare(b.code,undefined,{numeric:true}));
        const subTot=sa.reduce((s,a)=>s+a.bal,0);
        html+=`<div class="coa-sub-section">
          <div class="coa-sub-hdr" onclick="toggleSub(this)">
            <span>${sub}</span>
            <span>${fmt(Math.abs(subTot))} ج <span class="arr">▼</span></span>
          </div>
          <div class="coa-sub-body">`;
        sa.forEach(a=>{
          const isParent=a.isParentClient||a.isParentSupplier;
          const clientSubs=a.isParentClient?DB.accounts.filter(x=>x.isClientSub&&x.parentAccId===a.id):[];
          const suppSubs=a.isParentSupplier?DB.accounts.filter(x=>x.isSupplierSub&&x.parentAccId===a.id):[];
          html+=`<div class="coa-acc-row">
            <span style="font-family:monospace;font-weight:700;font-size:11px;color:#7C3AED">${a.code}</span>
            <span style="font-weight:${isParent?700:400}">${a.name}${isParent?` <span style="font-size:9px;color:#94A3B8">(${clientSubs.length||suppSubs.length} فرعي)</span>`:''}</span>
            <span><span class="badge ${a.nat==='Dr'?'bs':'bd'}">${a.nat}</span></span>
            <span class="${a.nat==='Dr'?'apos':'aneg'}">${fmt(a.bal)}</span>
            <span style="display:flex;gap:3px">
              <button class="btn btn-edit" onclick="openAccModal(${a.id})">✎</button>
              ${a.locked?'<span style="font-size:10px;color:#CBD5E1;padding:2px 5px">●</span>':`<button class="btn btn-del" onclick="deleteAcc(${a.id})">✕</button>`}
              <button class="btn" style="font-size:10px;padding:2px 6px" onclick="showLedgerForAcc(${a.id})">أستاذ</button>
            </span>
          </div>`;
          // حسابات العملاء الفرعية
          if(clientSubs.length){
            html+=`<div style="border-top:1px dashed #E9D5FF">`;
            clientSubs.sort((a,b)=>a.code.localeCompare(b.code,undefined,{numeric:true})).forEach(ca=>{
              html+=`<div class="coa-sub-acc">
                <span><span class="linked-cl">عميل</span><span style="font-family:monospace;font-size:10px;color:#7C3AED">${ca.code}</span>&nbsp;${ca.name}</span>
                <span style="display:flex;align-items:center;gap:6px">
                  <span class="apos" style="font-size:12px">${fmt(ca.bal)} ج</span>
                  <button class="btn" style="font-size:10px;padding:2px 5px" onclick="showLedgerForAcc(${ca.id})">أستاذ</button>
                </span>
              </div>`;
            });
            html+='</div>';
          }
          // حسابات الموردين الفرعية
          if(suppSubs.length){
            html+=`<div style="border-top:1px dashed #FDE68A">`;
            suppSubs.sort((a,b)=>a.code.localeCompare(b.code,undefined,{numeric:true})).forEach(sa2=>{
              html+=`<div class="coa-sub-acc" style="background:#FFFDF0">
                <span><span class="linked-sp">مورد</span><span style="font-family:monospace;font-size:10px;color:#A16207">${sa2.code}</span>&nbsp;${sa2.name}</span>
                <span style="display:flex;align-items:center;gap:6px">
                  <span class="aneg" style="font-size:12px">${fmt(sa2.bal)} ج</span>
                  <button class="btn" style="font-size:10px;padding:2px 5px" onclick="showLedgerForAcc(${sa2.id})">أستاذ</button>
                </span>
              </div>`;
            });
            html+='</div>';
          }
        });
        html+='</div></div>';
      });
    }
    html+='</div></div>';
  });
  document.getElementById('coa-tree').innerHTML=html||'<div class="empty">لا توجد نتائج</div>';
}

function toggleGrp(el){el.classList.toggle('open');el.nextElementSibling?.classList.toggle('open');}
function toggleSub(el){el.classList.toggle('open');el.nextElementSibling?.classList.toggle('open');}
function expandAll(){document.querySelectorAll('.coa-grp-hdr').forEach(el=>{el.classList.add('open');el.nextElementSibling?.classList.add('open');});document.querySelectorAll('.coa-sub-hdr').forEach(el=>{el.classList.add('open');el.nextElementSibling?.classList.add('open');});}
function collapseAll(){document.querySelectorAll('.coa-grp-hdr,.coa-sub-hdr').forEach(el=>{el.classList.remove('open');el.nextElementSibling?.classList.remove('open');});}
function showLedgerForAcc(id){go('ledger',null);document.querySelectorAll('.ni').forEach(n=>{if(n.textContent.includes('دفتر الأستاذ'))n.classList.add('on');});setTimeout(()=>{document.getElementById('ledger-sel').value=id;renderLedger();},60);}

function openAccModal(editId=null){
  document.getElementById('a-eid').value=editId||'';
  if(editId){
    const a=findAcc(editId);if(!a)return;
    document.getElementById('am-t').textContent='تعديل حساب';
    document.getElementById('a-code').value=a.code;
    document.getElementById('a-name').value=a.name;
    document.getElementById('a-grp').value=a.gid;
    document.getElementById('a-sub').value=a.sub;
    document.getElementById('a-nat').value=a.nat;
    document.getElementById('a-bal').value=a.bal;
  }else{
    document.getElementById('am-t').textContent='حساب جديد';
    ['a-code','a-name','a-sub'].forEach(id=>document.getElementById(id).value='');
    document.getElementById('a-bal').value=0;
    document.getElementById('a-grp').value=1;
    document.getElementById('a-nat').value='Dr';
  }
  document.getElementById('modal-acc').classList.add('open');
}

function saveAcc(){
  const eid=document.getElementById('a-eid').value;
  const code=document.getElementById('a-code').value.trim();
  const name=document.getElementById('a-name').value.trim();
  if(!code||!name){toast('أدخل الكود والاسم','err');return;}
  if(!eid&&DB.accounts.find(a=>a.code===code)){toast('الكود موجود مسبقاً','err');return;}
  const gid=parseInt(document.getElementById('a-grp').value);
  const gN={1:'الأصول',2:'الخصوم',3:'حقوق الملكية',4:'الإيرادات',5:'المصروفات'};
  const sub=document.getElementById('a-sub').value.trim()||`${gid}-1 عام`;
  const nat=document.getElementById('a-nat').value;
  const bal=parseFloat(document.getElementById('a-bal').value)||0;
  if(eid){
    const a=findAcc(parseInt(eid));
    Object.assign(a,{code,name,gid,gname:gN[gid],sub,nat,bal});
    toast('تم التعديل ✓','ok');
  }else{
    // كود تلقائي إذا كان الكود غير محدد
    const finalCode=code||autoCode(gid,sub);
    DB.accounts.push({id:DB.nextAccId++,code:finalCode,name,gid,gname:gN[gid],sub,nat,bal});
    toast('تم إضافة الحساب ✓','ok');
  }
  closeModal('modal-acc');save();renderCOA();
}

function deleteAcc(id){
  const inUse=DB.journal.some(j=>j.lines.some(l=>l.accId==id))||DB.vouchers.some(v=>v.accId==id);
  if(inUse){toast('لا يمكن حذف حساب له حركات','err');return;}
  confirmDel('سيتم حذف الحساب نهائياً.',()=>{DB.accounts=DB.accounts.filter(a=>a.id!==id);toast('تم الحذف ✓','ok');save();renderCOA();});
}

// ══ JOURNAL ══
const TPLS={
  sale_cash:{desc:'بيع بضاعة نقداً',a:[{c:'1-1-1',d:1},{c:'4-1-1',d:0}]},
  sale_bank:{desc:'بيع بضاعة بنكياً',a:[{c:'1-1-2',d:1},{c:'4-1-1',d:0}]},
  sale_credit:{desc:'بيع بضاعة آجل',a:[{c:'1-2',d:1},{c:'4-1-1',d:0}]},
  sale_return:{desc:'مردود مبيعات',a:[{c:'4-1-3',d:1},{c:'1-1-1',d:0}]},
  purch_cash:{desc:'شراء بضاعة نقداً',a:[{c:'1-3-1',d:1},{c:'1-1-1',d:0}]},
  purch_bank:{desc:'شراء بضاعة بنكياً',a:[{c:'1-3-1',d:1},{c:'1-1-2',d:0}]},
  purch_credit:{desc:'شراء بضاعة آجل',a:[{c:'1-3-1',d:1},{c:'2-1',d:0}]},
  purch_return:{desc:'مردود مشتريات',a:[{c:'2-1',d:1},{c:'1-3-1',d:0}]},
  collect_cash:{desc:'تحصيل من عميل نقداً',a:[{c:'1-1-1',d:1},{c:'1-2',d:0}]},
  collect_bank:{desc:'تحصيل من عميل بنكياً',a:[{c:'1-1-2',d:1},{c:'1-2',d:0}]},
  pay_supp_cash:{desc:'سداد لمورد نقداً',a:[{c:'2-1',d:1},{c:'1-1-1',d:0}]},
  pay_supp_bank:{desc:'سداد لمورد بنكياً',a:[{c:'2-1',d:1},{c:'1-1-2',d:0}]},
  salary:{desc:'رواتب وأجور',a:[{c:'5-3-1',d:1},{c:'1-1-1',d:0}]},
  rent:{desc:'إيجار',a:[{c:'5-3-3',d:1},{c:'1-1-1',d:0}]},
  utilities:{desc:'كهرباء ومياه',a:[{c:'5-3-4',d:1},{c:'1-1-1',d:0}]},
  telecom:{desc:'اتصالات وإنترنت',a:[{c:'5-3-5',d:1},{c:'1-1-1',d:0}]},
  depreciation:{desc:'إهلاك أصول ثابتة',a:[{c:'5-3-9',d:1},{c:'1-7-2',d:0}]},
  expense_cash:{desc:'مصروف عام نقدي',a:[{c:'5-6-1',d:1},{c:'1-1-1',d:0}]},
  expense_bank:{desc:'مصروف عام بنكي',a:[{c:'5-6-1',d:1},{c:'1-1-2',d:0}]},
  bank_deposit:{desc:'إيداع في البنك',a:[{c:'1-1-2',d:1},{c:'1-1-1',d:0}]},
  bank_withdraw:{desc:'سحب من البنك',a:[{c:'1-1-1',d:1},{c:'1-1-2',d:0}]},
  vat_pay:{desc:'سداد ضريبة القيمة المضافة',a:[{c:'2-2-1',d:1},{c:'1-1-1',d:0}]},
  capital_inject:{desc:'إضافة رأس مال',a:[{c:'1-1-1',d:1},{c:'3-1-1',d:0}]},
  owner_draw:{desc:'سحب الشريك',a:[{c:'3-1-4',d:1},{c:'1-1-1',d:0}]},
};

let jLines=[],jLC=0,editingJV=null;
function initJModal(jv=null){
  editingJV=jv;jLines=[];jLC=0;
  document.getElementById('j-lines-wrap').innerHTML='';
  document.getElementById('j-tpl').value='';
  document.getElementById('jm-t').textContent=jv?'تعديل قيد':'قيد يومية جديد';
  document.getElementById('j-btn').textContent=jv?'حفظ التعديل':'ترحيل القيد';
  if(jv){document.getElementById('j-date').value=jv.date;document.getElementById('j-desc').value=jv.desc;jv.lines.forEach(l=>addJLine(l.accId,l.dr,l.cr));}
  else{document.getElementById('j-date').value=today();document.getElementById('j-desc').value='';addJLine();addJLine();}
  calcJ();
}
function applyTpl(){
  const v=document.getElementById('j-tpl').value;if(!v)return;
  const t=TPLS[v];if(!t)return;
  jLines=[];jLC=0;document.getElementById('j-lines-wrap').innerHTML='';
  t.a.forEach(l=>{const a=findCode(l.c);addJLine(a?a.id:null,0,0);});
  document.getElementById('j-desc').value=t.desc;calcJ();
}
function addJLine(accId=null,dr=0,cr=0){
  const lid=jLC++;jLines.push(lid);
  const div=document.createElement('div');div.className='jlr';div.id='jlr-'+lid;
  const opts=DB.accounts.length?buildAccOpts(accId||DB.accounts[0]?.id):'<option>أضف حسابات</option>';
  div.innerHTML=`<div>
    <select id="jla-${lid}" onchange="onJA(${lid})" style="width:100%">${opts}</select>
    <div class="acc-hint" id="jlh-${lid}"></div>
  </div>
  <input type="number" id="jld-${lid}" value="${dr||''}" placeholder="0" min="0" oninput="calcJ()" style="width:83px;text-align:left">
  <input type="number" id="jlc-${lid}" value="${cr||''}" placeholder="0" min="0" oninput="calcJ()" style="width:83px;text-align:left">
  <button style="cursor:pointer;color:#DC2626;border:none;background:none;font-size:15px" onclick="rmJL(${lid})">✕</button>`;
  document.getElementById('j-lines-wrap').appendChild(div);
  if(accId)setTimeout(()=>onJA(lid),0);
}
function onJA(lid){
  const sel=document.getElementById('jla-'+lid);if(!sel)return;
  const a=findAcc(parseInt(sel.value));if(!a)return;
  const h=document.getElementById('jlh-'+lid);
  if(h)h.innerHTML=`<span style="color:${a.nat==='Dr'?'#15803D':'#DC2626'}">طبيعته: ${a.nat==='Dr'?'مدين':'دائن'} | رصيده: ${fmt(a.bal)} ج | ${a.sub}</span>`;
}
function rmJL(lid){document.getElementById('jlr-'+lid)?.remove();jLines=jLines.filter(x=>x!==lid);calcJ();}
function calcJ(){
  let dr=0,cr=0;
  jLines.forEach(lid=>{dr+=parseFloat(document.getElementById('jld-'+lid)?.value)||0;cr+=parseFloat(document.getElementById('jlc-'+lid)?.value)||0;});
  document.getElementById('j-dr').textContent=fmt(dr);document.getElementById('j-cr').textContent=fmt(cr);
  const el=document.getElementById('j-bal'),diff=Math.abs(dr-cr);
  if(!dr&&!cr){el.textContent='';el.style.color='';}
  else if(diff<0.01){el.textContent='متوازن ✓';el.style.color='#15803D';}
  else{el.textContent=`فرق ${fmt(diff)} ج`;el.style.color='#DC2626';}
}
function postJournal(){
  const date=document.getElementById('j-date').value;
  const desc=document.getElementById('j-desc').value.trim();
  if(!desc){toast('اكتب البيان','err');return;}
  let dr=0,cr=0;const lines=[];
  jLines.forEach(lid=>{
    const sel=document.getElementById('jla-'+lid);
    const d=parseFloat(document.getElementById('jld-'+lid)?.value)||0;
    const c=parseFloat(document.getElementById('jlc-'+lid)?.value)||0;
    if(d||c){lines.push({accId:parseInt(sel.value),dr:d,cr:c});dr+=d;cr+=c;}
  });
  if(!lines.length){toast('أضف سطور','err');return;}
  if(Math.abs(dr-cr)>0.01){toast(`غير متوازن — مدين ${fmt(dr)} / دائن ${fmt(cr)}`,'err');return;}
  if(editingJV){
    editingJV.lines.forEach(l=>revBal(l.accId,l.dr,l.cr));
    editingJV.date=date;editingJV.desc=desc;editingJV.lines=lines;
    lines.forEach(l=>updateBal(l.accId,l.dr,l.cr));
    // مزامنة العملاء والموردين
    lines.forEach(l=>{const a=findAcc(l.accId);if(a?.clientId)syncClientBal(a.clientId);if(a?.supplierId)syncSupplierBal(a.supplierId);});
    toast(`تم تعديل ${editingJV.id} ✓`,'ok');
  }else{
    const jvId=`JV-${String(DB.nextJV++).padStart(4,'0')}`;
    lines.forEach(l=>updateBal(l.accId,l.dr,l.cr));
    lines.forEach(l=>{const a=findAcc(l.accId);if(a?.clientId)syncClientBal(a.clientId);if(a?.supplierId)syncSupplierBal(a.supplierId);});
    DB.journal.push({id:jvId,date,desc,lines});
    toast(`تم ترحيل ${jvId} على ${lines.length} حسابات ✓`,'ok');
  }
  closeModal('modal-journal');save();renderDash();
}
function renderJList(){
  const q=(document.getElementById('j-q')||{}).value?.toLowerCase()||'';
  let list=DB.journal.slice().reverse();
  if(q)list=list.filter(j=>j.id.toLowerCase().includes(q)||j.desc.includes(q));
  if(!list.length){document.getElementById('j-list').innerHTML='<div class="empty">لا توجد قيود بعد</div>';return;}
  document.getElementById('j-list').innerHTML=`<table>
    <tr><th style="width:9%">رقم</th><th style="width:9%">تاريخ</th><th style="width:26%">البيان</th><th style="width:20%">الحساب</th><th style="width:11%">مدين</th><th style="width:11%">دائن</th><th style="width:14%"></th></tr>
    ${list.map(j=>j.lines.map((l,i)=>{const a=findAcc(l.accId);return`<tr>
      <td style="font-size:10px;font-weight:700">${i===0?j.id:''}</td>
      <td style="font-size:10px">${i===0?j.date.slice(5):''}</td>
      <td>${i===0?j.desc:''}</td>
      <td style="font-size:11px">[${a?.code||'?'}] ${a?.name||'؟'}</td>
      <td class="apos">${l.dr?fmt(l.dr):'—'}</td>
      <td class="aneg">${l.cr?fmt(l.cr):'—'}</td>
      <td>${i===0?`<div style="display:flex;gap:3px"><button class="btn btn-edit" onclick="editJV('${j.id}')">✎</button><button class="btn btn-del" onclick="deleteJV('${j.id}')">✕</button></div>`:''}</td>
    </tr>`;}).join('')).join('')}
  </table>`;
}
function editJV(id){const jv=DB.journal.find(j=>j.id===id);if(!jv)return;initJModal(jv);document.getElementById('modal-journal').classList.add('open');}
function deleteJV(id){
  confirmDel('سيتم حذف القيد وعكس تأثيره.',()=>{
    const jv=DB.journal.find(j=>j.id===id);
    if(jv){jv.lines.forEach(l=>{revBal(l.accId,l.dr,l.cr);const a=findAcc(l.accId);if(a?.clientId)syncClientBal(a.clientId);if(a?.supplierId)syncSupplierBal(a.supplierId);});}
    DB.journal=DB.journal.filter(j=>j.id!==id);
    toast('تم الحذف ✓','ok');save();renderJList();renderDash();
  });
}

// ══ LEDGER ══
function renderLedgerSel(){
  document.getElementById('ledger-sel').innerHTML=DB.accounts.length?buildAccOpts(DB.accounts[0]?.id):'<option>أضف حسابات</option>';
  renderLedger();
}
function renderLedger(){
  const id=parseInt(document.getElementById('ledger-sel').value);
  const a=findAcc(id);
  if(!a){document.getElementById('ledger-body').innerHTML='<div class="empty">اختر حسابًا</div>';return;}
  const entries=[];
  DB.journal.forEach(j=>j.lines.forEach(l=>{if(l.accId===id)entries.push({date:j.date,jid:j.id,desc:j.desc,dr:l.dr,cr:l.cr});}));
  entries.sort((a,b)=>a.date.localeCompare(b.date));
  let bal=0;
  const rows=entries.map(e=>{
    if(a.nat==='Dr')bal+=e.dr-e.cr;else bal+=e.cr-e.dr;
    return`<tr><td style="font-size:10px">${e.date}</td><td style="font-size:10px;font-weight:700">${e.jid}</td><td>${e.desc}</td><td class="apos">${e.dr?fmt(e.dr):'—'}</td><td class="aneg">${e.cr?fmt(e.cr):'—'}</td><td class="${bal>=0?'apos':'aneg'}">${fmt(Math.abs(bal))} ${bal>=0?'Dr':'Cr'}</td></tr>`;
  });
  document.getElementById('ledger-body').innerHTML=`
    <div style="display:flex;flex-wrap:wrap;gap:12px;font-size:12px;padding:7px 9px;background:#F8FAFC;border-radius:7px;margin-bottom:9px;border:1px solid #E2E8F0">
      <span>الحساب: <b>${a.name}</b></span>
      <span style="font-family:monospace;color:#7C3AED">كود: <b>${a.code}</b></span>
      <span>الطبيعة: <b style="color:${a.nat==='Dr'?'#15803D':'#DC2626'}">${a.nat==='Dr'?'مدين':'دائن'}</b></span>
      <span>الرصيد: <b class="${a.nat==='Dr'?'apos':'aneg'}">${fmt(a.bal)} ج</b></span>
    </div>
    <table><tr><th style="width:11%">تاريخ</th><th style="width:11%">قيد</th><th style="width:36%">بيان</th><th style="width:13%">مدين</th><th style="width:13%">دائن</th><th style="width:16%">رصيد جاري</th></tr>
    ${rows.length?rows.join(''):'<tr><td colspan="6" class="empty">لا توجد حركات</td></tr>'}
    </table>`;
}
