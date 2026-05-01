/* AL AMEEN ERP — data.js v2
   ترقيم الأكواد: رئيسي-فرعي-تسلسلي  مثال: 1-2-3 */
const STORE_KEY='alameen_erp_v6';

const DEFAULT_ACCOUNTS=[
  // 1 الأصول
  {id:1010,code:'1-1-1',name:'الصندوق',                        gid:1,gname:'الأصول',sub:'1-1 أصول متداولة',          nat:'Dr',bal:0,locked:true},
  {id:1020,code:'1-1-2',name:'البنك الأهلي',                   gid:1,gname:'الأصول',sub:'1-1 أصول متداولة',          nat:'Dr',bal:0},
  {id:1030,code:'1-1-3',name:'بنك مصر',                        gid:1,gname:'الأصول',sub:'1-1 أصول متداولة',          nat:'Dr',bal:0},
  {id:1040,code:'1-2',  name:'حسابات القبض — العملاء',         gid:1,gname:'الأصول',sub:'1-2 حسابات القبض',          nat:'Dr',bal:0,locked:true,isParentClient:true},
  {id:1050,code:'1-2-0',name:'أوراق القبض',                    gid:1,gname:'الأصول',sub:'1-2 حسابات القبض',          nat:'Dr',bal:0},
  {id:1060,code:'1-3-1',name:'المخزون / البضاعة',              gid:1,gname:'الأصول',sub:'1-3 المخزون',               nat:'Dr',bal:0},
  {id:1070,code:'1-3-2',name:'مواد خام',                       gid:1,gname:'الأصول',sub:'1-3 المخزون',               nat:'Dr',bal:0},
  {id:1080,code:'1-4-1',name:'مصروفات مدفوعة مقدماً',         gid:1,gname:'الأصول',sub:'1-4 مدفوعات مقدمة',         nat:'Dr',bal:0},
  {id:1090,code:'1-5-1',name:'ضريبة القيمة المضافة — مدخلات', gid:1,gname:'الأصول',sub:'1-5 ضرائب مدينة',           nat:'Dr',bal:0},
  {id:1100,code:'1-6-1',name:'الأراضي',                        gid:1,gname:'الأصول',sub:'1-6 أصول ثابتة',            nat:'Dr',bal:0},
  {id:1110,code:'1-6-2',name:'المباني والإنشاءات',             gid:1,gname:'الأصول',sub:'1-6 أصول ثابتة',            nat:'Dr',bal:0},
  {id:1120,code:'1-6-3',name:'الأثاث والديكور',                gid:1,gname:'الأصول',sub:'1-6 أصول ثابتة',            nat:'Dr',bal:0},
  {id:1130,code:'1-6-4',name:'الأجهزة والمعدات',               gid:1,gname:'الأصول',sub:'1-6 أصول ثابتة',            nat:'Dr',bal:0},
  {id:1140,code:'1-6-5',name:'الحاسب الآلي والبرامج',          gid:1,gname:'الأصول',sub:'1-6 أصول ثابتة',            nat:'Dr',bal:0},
  {id:1150,code:'1-6-6',name:'السيارات والمركبات',             gid:1,gname:'الأصول',sub:'1-6 أصول ثابتة',            nat:'Dr',bal:0},
  {id:1160,code:'1-7-1',name:'مجمع إهلاك المباني',            gid:1,gname:'الأصول',sub:'1-7 مجمع الإهلاك',          nat:'Cr',bal:0},
  {id:1170,code:'1-7-2',name:'مجمع إهلاك الأجهزة',            gid:1,gname:'الأصول',sub:'1-7 مجمع الإهلاك',          nat:'Cr',bal:0},
  {id:1180,code:'1-7-3',name:'مجمع إهلاك السيارات',           gid:1,gname:'الأصول',sub:'1-7 مجمع الإهلاك',          nat:'Cr',bal:0},
  // 2 الخصوم
  {id:2010,code:'2-1',  name:'حسابات الدفع — الموردون',        gid:2,gname:'الخصوم',sub:'2-1 حسابات الدفع',          nat:'Cr',bal:0,locked:true,isParentSupplier:true},
  {id:2020,code:'2-1-0',name:'أوراق الدفع',                    gid:2,gname:'الخصوم',sub:'2-1 حسابات الدفع',          nat:'Cr',bal:0},
  {id:2030,code:'2-2-1',name:'ضريبة القيمة المضافة — مخرجات', gid:2,gname:'الخصوم',sub:'2-2 ضرائب دائنة',           nat:'Cr',bal:0},
  {id:2040,code:'2-2-2',name:'ضريبة الدخل المستحقة',           gid:2,gname:'الخصوم',sub:'2-2 ضرائب دائنة',           nat:'Cr',bal:0},
  {id:2050,code:'2-2-3',name:'مخصص ضريبة الدخل',              gid:2,gname:'الخصوم',sub:'2-2 ضرائب دائنة',           nat:'Cr',bal:0},
  {id:2060,code:'2-3-1',name:'رواتب مستحقة الدفع',            gid:2,gname:'الخصوم',sub:'2-3 مستحقات',               nat:'Cr',bal:0},
  {id:2070,code:'2-3-2',name:'دائنون متنوعون',                 gid:2,gname:'الخصوم',sub:'2-3 مستحقات',               nat:'Cr',bal:0},
  {id:2080,code:'2-4-1',name:'قروض بنكية طويلة الأجل',        gid:2,gname:'الخصوم',sub:'2-4 خصوم طويلة الأجل',      nat:'Cr',bal:0},
  // 3 حقوق الملكية
  {id:3010,code:'3-1-1',name:'رأس المال المدفوع',             gid:3,gname:'حقوق الملكية',sub:'3-1 حقوق الملكية',    nat:'Cr',bal:0},
  {id:3020,code:'3-1-2',name:'الأرباح المحتجزة',              gid:3,gname:'حقوق الملكية',sub:'3-1 حقوق الملكية',    nat:'Cr',bal:0},
  {id:3030,code:'3-1-3',name:'الاحتياطيات',                   gid:3,gname:'حقوق الملكية',sub:'3-1 حقوق الملكية',    nat:'Cr',bal:0},
  {id:3040,code:'3-1-4',name:'سحوبات الشركاء',                gid:3,gname:'حقوق الملكية',sub:'3-1 حقوق الملكية',    nat:'Dr',bal:0},
  // 4 الإيرادات
  {id:4010,code:'4-1-1',name:'إيرادات المبيعات',              gid:4,gname:'الإيرادات',sub:'4-1 إيرادات التشغيل',    nat:'Cr',bal:0},
  {id:4020,code:'4-1-2',name:'إيرادات الخدمات',               gid:4,gname:'الإيرادات',sub:'4-1 إيرادات التشغيل',    nat:'Cr',bal:0},
  {id:4030,code:'4-1-3',name:'مردودات ومسموحات المبيعات',     gid:4,gname:'الإيرادات',sub:'4-1 إيرادات التشغيل',    nat:'Dr',bal:0},
  {id:4040,code:'4-1-4',name:'خصومات المبيعات الممنوحة',      gid:4,gname:'الإيرادات',sub:'4-1 إيرادات التشغيل',    nat:'Dr',bal:0},
  {id:4050,code:'4-2-1',name:'فوائد بنكية مكتسبة',            gid:4,gname:'الإيرادات',sub:'4-2 إيرادات أخرى',       nat:'Cr',bal:0},
  {id:4060,code:'4-2-2',name:'أرباح بيع أصول ثابتة',          gid:4,gname:'الإيرادات',sub:'4-2 إيرادات أخرى',       nat:'Cr',bal:0},
  {id:4070,code:'4-2-3',name:'إيرادات متنوعة أخرى',           gid:4,gname:'الإيرادات',sub:'4-2 إيرادات أخرى',       nat:'Cr',bal:0},
  // 5 المصروفات
  {id:5010,code:'5-1-1',name:'تكلفة البضاعة المباعة',         gid:5,gname:'المصروفات',sub:'5-1 تكلفة المبيعات',     nat:'Dr',bal:0},
  {id:5020,code:'5-1-2',name:'مصاريف الشحن والتوصيل',         gid:5,gname:'المصروفات',sub:'5-1 تكلفة المبيعات',     nat:'Dr',bal:0},
  {id:5030,code:'5-1-3',name:'تكلفة المواد الخام',             gid:5,gname:'المصروفات',sub:'5-1 تكلفة المبيعات',     nat:'Dr',bal:0},
  {id:5040,code:'5-2-1',name:'مصاريف تسويق وإعلان',           gid:5,gname:'المصروفات',sub:'5-2 مصروفات البيع',       nat:'Dr',bal:0},
  {id:5050,code:'5-2-2',name:'عمولات البيع',                   gid:5,gname:'المصروفات',sub:'5-2 مصروفات البيع',       nat:'Dr',bal:0},
  {id:5060,code:'5-3-1',name:'رواتب وأجور الموظفين',          gid:5,gname:'المصروفات',sub:'5-3 مصروفات عمومية وإدارية',nat:'Dr',bal:0},
  {id:5070,code:'5-3-2',name:'مكافآت ورواتب إضافية',          gid:5,gname:'المصروفات',sub:'5-3 مصروفات عمومية وإدارية',nat:'Dr',bal:0},
  {id:5080,code:'5-3-3',name:'إيجار المحل / المكتب',           gid:5,gname:'المصروفات',sub:'5-3 مصروفات عمومية وإدارية',nat:'Dr',bal:0},
  {id:5090,code:'5-3-4',name:'الكهرباء والمياه',               gid:5,gname:'المصروفات',sub:'5-3 مصروفات عمومية وإدارية',nat:'Dr',bal:0},
  {id:5100,code:'5-3-5',name:'الاتصالات والإنترنت',            gid:5,gname:'المصروفات',sub:'5-3 مصروفات عمومية وإدارية',nat:'Dr',bal:0},
  {id:5110,code:'5-3-6',name:'صيانة ومستلزمات',               gid:5,gname:'المصروفات',sub:'5-3 مصروفات عمومية وإدارية',nat:'Dr',bal:0},
  {id:5120,code:'5-3-7',name:'تأمين',                          gid:5,gname:'المصروفات',sub:'5-3 مصروفات عمومية وإدارية',nat:'Dr',bal:0},
  {id:5130,code:'5-3-8',name:'قرطاسية ومطبوعات',              gid:5,gname:'المصروفات',sub:'5-3 مصروفات عمومية وإدارية',nat:'Dr',bal:0},
  {id:5140,code:'5-3-9',name:'إهلاك الأصول الثابتة',          gid:5,gname:'المصروفات',sub:'5-3 مصروفات عمومية وإدارية',nat:'Dr',bal:0},
  {id:5150,code:'5-3-10',name:'مصاريف إدارية متنوعة',         gid:5,gname:'المصروفات',sub:'5-3 مصروفات عمومية وإدارية',nat:'Dr',bal:0},
  {id:5160,code:'5-4-1',name:'فوائد قروض ومصاريف بنكية',      gid:5,gname:'المصروفات',sub:'5-4 مصروفات مالية',       nat:'Dr',bal:0},
  {id:5170,code:'5-4-2',name:'خسائر بيع أصول ثابتة',          gid:5,gname:'المصروفات',sub:'5-4 مصروفات مالية',       nat:'Dr',bal:0},
  {id:5180,code:'5-5-1',name:'ضريبة الدخل',                   gid:5,gname:'المصروفات',sub:'5-5 مصروفات ضريبية',      nat:'Dr',bal:0},
  {id:5190,code:'5-6-1',name:'مصاريف متنوعة أخرى',            gid:5,gname:'المصروفات',sub:'5-6 مصروفات أخرى',        nat:'Dr',bal:0},
];

const DB={
  accounts:[],journal:[],vouchers:[],clients:[],suppliers:[],products:[],invoices:[],purchases:[],
  settings:{companyName:'AL AMEEN ERP',companyNameAr:'الأمين للمحاسبة والمراجعة',address:'',phone:'',email:'',taxNumber:'',taxRate:14,currency:'ج.م',invoiceNote:'شكراً لتعاملكم معنا'},
  nextJV:1,nextSaleInv:1001,nextPurchInv:3001,nextVoucher:1,nextAccId:9000,nextClientSeq:1,nextSupplierSeq:1,
};

// أكواد ثابتة
const C={CASH:'1-1-1',BANK:'1-1-2',AR:'1-2',INV:'1-3-1',AP:'2-1',VAT_OUT:'2-2-1',SALES:'4-1-1',COGS:'5-1-1'};

function findAcc(id){return DB.accounts.find(a=>a.id==id)||null;}
function findCode(c){return DB.accounts.find(a=>a.code===c)||null;}
function getParentClient(){return DB.accounts.find(a=>a.isParentClient)||findCode(C.AR);}
function getParentSupplier(){return DB.accounts.find(a=>a.isParentSupplier)||findCode(C.AP);}

function updateBal(id,dr,cr){
  const a=findAcc(id);if(!a)return;
  if(a.nat==='Dr')a.bal+=(dr-cr);else a.bal+=(cr-dr);
}
function revBal(id,dr,cr){updateBal(id,cr,dr);}

// كود تلقائي للحساب الجديد حسب موضعه
function autoCode(gid,sub){
  const subM=sub.match(/^(\d+)-(\d+)/);
  if(!subM)return`${gid}-9-1`;
  const subN=subM[2];
  const cnt=DB.accounts.filter(a=>a.gid===gid&&a.sub===sub&&!a.isClientSub&&!a.isSupplierSub).length;
  return`${gid}-${subN}-${cnt+1}`;
}
function clientCode(){return`1-2-${String(DB.nextClientSeq++).padStart(3,'0')}`;}
function supplierCode(){return`2-1-${String(DB.nextSupplierSeq++).padStart(3,'0')}`;}

function ensureClientAcc(client){
  let a=DB.accounts.find(x=>x.clientId==client.id);if(a)return a;
  const p=getParentClient();
  a={id:DB.nextAccId++,code:clientCode(),name:client.name,gid:1,gname:'الأصول',
     sub:'1-2 حسابات القبض',nat:'Dr',bal:client.balance||0,
     clientId:client.id,parentAccId:p?p.id:null,isClientSub:true,locked:false};
  DB.accounts.push(a);return a;
}
function ensureSupplierAcc(supplier){
  let a=DB.accounts.find(x=>x.supplierId==supplier.id);if(a)return a;
  const p=getParentSupplier();
  a={id:DB.nextAccId++,code:supplierCode(),name:supplier.name,gid:2,gname:'الخصوم',
     sub:'2-1 حسابات الدفع',nat:'Cr',bal:supplier.balance||0,
     supplierId:supplier.id,parentAccId:p?p.id:null,isSupplierSub:true,locked:false};
  DB.accounts.push(a);return a;
}

// مزامنة رصيد العميل/المورد في الجدول الرئيسي
function syncClientBal(clientId){
  const cl=DB.clients.find(c=>c.id==clientId);if(!cl)return;
  const ac=DB.accounts.find(a=>a.clientId==clientId);if(ac)cl.balance=ac.bal;
}
function syncSupplierBal(supplierId){
  const sp=DB.suppliers.find(s=>s.id==supplierId);if(!sp)return;
  const ac=DB.accounts.find(a=>a.supplierId==supplierId);if(ac)sp.balance=ac.bal;
}

function buildAccOpts(selId,filterFn=null){
  const gN={1:'الأصول',2:'الخصوم',3:'حقوق الملكية',4:'الإيرادات',5:'المصروفات'};
  let html='';
  [1,2,3,4,5].forEach(gid=>{
    let accs=DB.accounts.filter(a=>a.gid===gid);
    if(filterFn)accs=accs.filter(filterFn);
    accs.sort((a,b)=>a.code.localeCompare(b.code,undefined,{numeric:true}));
    if(!accs.length)return;
    html+=`<optgroup label="${gid}. ${gN[gid]}">`;
    accs.forEach(a=>{
      const pfx=a.isClientSub||a.isSupplierSub?'\u00A0\u00A0↳ ':'';
      html+=`<option value="${a.id}" ${a.id==selId?'selected':''}>[${a.code}] ${pfx}${a.name}</option>`;
    });
    html+='</optgroup>';
  });
  return html;
}

function searchAccounts(q){
  if(!q)return[];
  const ql=q.toLowerCase();
  return DB.accounts.filter(a=>a.code.toLowerCase().includes(ql)||a.name.toLowerCase().includes(ql)).slice(0,10);
}

let _st=null;
function save(){
  try{
    localStorage.setItem(STORE_KEY,JSON.stringify({
      accounts:DB.accounts,journal:DB.journal,vouchers:DB.vouchers,
      clients:DB.clients,suppliers:DB.suppliers,products:DB.products,
      invoices:DB.invoices,purchases:DB.purchases,settings:DB.settings,
      c:{jv:DB.nextJV,si:DB.nextSaleInv,pi:DB.nextPurchInv,v:DB.nextVoucher,
         a:DB.nextAccId,cs:DB.nextClientSeq,ss:DB.nextSupplierSeq}
    }));
    const b=document.getElementById('saved-badge');
    if(b){b.style.display='inline';clearTimeout(_st);_st=setTimeout(()=>b.style.display='none',2500);}
  }catch(e){console.warn(e);}
}

function load(){
  try{
    const raw=localStorage.getItem(STORE_KEY);if(!raw)return false;
    const d=JSON.parse(raw);
    DB.accounts=d.accounts||DEFAULT_ACCOUNTS.map(a=>({...a}));
    DB.journal=d.journal||[];DB.vouchers=d.vouchers||[];
    DB.clients=d.clients||[];DB.suppliers=d.suppliers||[];
    DB.products=d.products||[];DB.invoices=d.invoices||[];DB.purchases=d.purchases||[];
    if(d.settings)Object.assign(DB.settings,d.settings);
    if(d.c){
      DB.nextJV=d.c.jv||1;DB.nextSaleInv=d.c.si||1001;DB.nextPurchInv=d.c.pi||3001;
      DB.nextVoucher=d.c.v||1;DB.nextAccId=d.c.a||9000;
      DB.nextClientSeq=d.c.cs||1;DB.nextSupplierSeq=d.c.ss||1;
    }
    return true;
  }catch(e){return false;}
}

function exportData(){
  const data={version:'ALAMEEN_ERP_v6',exportDate:new Date().toISOString(),
    accounts:DB.accounts,journal:DB.journal,vouchers:DB.vouchers,
    clients:DB.clients,suppliers:DB.suppliers,products:DB.products,
    invoices:DB.invoices,purchases:DB.purchases,settings:DB.settings,
    counters:{jv:DB.nextJV,si:DB.nextSaleInv,pi:DB.nextPurchInv,v:DB.nextVoucher,
              a:DB.nextAccId,cs:DB.nextClientSeq,ss:DB.nextSupplierSeq}};
  const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob);const el=document.createElement('a');
  const d=new Date();
  el.href=url;el.download=`ALAMEEN_${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}.json`;
  el.click();URL.revokeObjectURL(url);toast('تم التصدير ✓','ok');
}

function importData(file){
  const r=new FileReader();
  r.onload=e=>{
    try{
      const d=JSON.parse(e.target.result);
      if(!d.version?.startsWith('ALAMEEN')){toast('ملف غير صالح','err');return;}
      DB.accounts=d.accounts||[];DB.journal=d.journal||[];DB.vouchers=d.vouchers||[];
      DB.clients=d.clients||[];DB.suppliers=d.suppliers||[];DB.products=d.products||[];
      DB.invoices=d.invoices||[];DB.purchases=d.purchases||[];
      if(d.settings)Object.assign(DB.settings,d.settings);
      if(d.counters){
        DB.nextJV=d.counters.jv||1;DB.nextSaleInv=d.counters.si||1001;DB.nextPurchInv=d.counters.pi||3001;
        DB.nextVoucher=d.counters.v||1;DB.nextAccId=d.counters.a||9000;
        DB.nextClientSeq=d.counters.cs||1;DB.nextSupplierSeq=d.counters.ss||1;
      }
      save();toast('تم الاستيراد ✓','ok');renderDash();
    }catch(err){toast('خطأ في الملف','err');}
  };r.readAsText(file);
}

const fmt=n=>Math.round(n).toLocaleString('ar-EG');
const today=()=>new Date().toISOString().split('T')[0];
