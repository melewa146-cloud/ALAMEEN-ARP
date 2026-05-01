/**
 * AL AMEEN ERP — sync.js
 * ========================
 * أضف هذا السطر الوحيد في index.html قبل أي <script> آخر:
 *   <script src="sync.js"></script>
 *
 * لا يغيّر أي شيء في الموقع — فقط يحفظ البيانات على السيرفر
 */

(function () {
  // ── إعدادات ──────────────────────────────────────────────────
  const SERVER   = "http://localhost:3000"; // غيّر لو السيرفر على IP ثاني
  const KEY      = "alameen_erp_v6";        // نفس الـ key في data.js
  const INTERVAL = 20000;                   // حفظ تلقائي كل 20 ثانية

  let online = false;

  // ── badge ─────────────────────────────────────────────────────
  function badge(txt, color) {
    let el = document.getElementById("__srv_badge");
    if (!el) {
      el = document.createElement("div");
      el.id = "__srv_badge";
      Object.assign(el.style, {
        position:"fixed", bottom:"10px", left:"10px",
        padding:"3px 10px", borderRadius:"20px",
        fontSize:"11px", fontFamily:"sans-serif",
        zIndex:"99999", cursor:"pointer",
        boxShadow:"0 1px 4px rgba(0,0,0,.3)"
      });
      el.title = "اضغط لتنزيل نسخة احتياطية";
      el.onclick = () => window.open(SERVER + "/api/backup");
      document.body.appendChild(el);
    }
    el.style.background = color;
    el.style.color = "#fff";
    el.textContent = txt;
  }

  // ── حفظ على السيرفر ───────────────────────────────────────────
  async function saveToServer() {
    const raw = localStorage.getItem(KEY);
    if (!raw) return;
    try {
      const r = await fetch(SERVER + "/api/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: raw,
      });
      if (r.ok) {
        online = true;
        badge("🟢 Server: محفوظ", "#16a34a");
      }
    } catch {
      online = false;
      badge("🔴 Server: غير متصل", "#dc2626");
    }
  }

  // ── تحميل من السيرفر عند البداية (لو localStorage فاضي) ──────
  async function loadFromServer() {
    try {
      const r = await fetch(SERVER + "/api/status");
      if (!r.ok) throw new Error();
      online = true;
      badge("🟢 Server: متصل", "#16a34a");

      // لو localStorage فاضي → جيب البيانات من السيرفر
      if (!localStorage.getItem(KEY)) {
        const r2 = await fetch(SERVER + "/api/load");
        const d  = await r2.json();
        if (d.found && d.data) {
          localStorage.setItem(KEY, JSON.stringify(d.data));
          console.log("[sync] ✅ تم تحميل البيانات من السيرفر");
          // إعادة تحميل الصفحة عشان الموقع ياخد البيانات الجديدة
          location.reload();
        }
      }
    } catch {
      online = false;
      badge("🟡 Offline", "#d97706");
    }
  }

  // ── مراقبة localStorage.setItem ───────────────────────────────
  const _set = localStorage.setItem.bind(localStorage);
  localStorage.setItem = function (k, v) {
    _set(k, v);
    // لما الموقع يحفظ البيانات، ارفعها للسيرفر فوراً
    if (k === KEY && online) {
      fetch(SERVER + "/api/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: v,
      }).then(r => {
        if (r.ok) badge("🟢 Server: محفوظ ✓", "#16a34a");
      }).catch(() => {
        online = false;
        badge("🔴 Server: غير متصل", "#dc2626");
      });
    }
  };

  // ── حفظ دوري كل 20 ثانية ──────────────────────────────────────
  setInterval(async () => {
    if (!online) {
      // إعادة محاولة الاتصال
      try {
        await fetch(SERVER + "/api/status");
        online = true;
        await saveToServer(); // رفع البيانات المحلية
      } catch { /* لسه offline */ }
      return;
    }
    await saveToServer();
  }, INTERVAL);

  // ── ابدأ ──────────────────────────────────────────────────────
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", loadFromServer);
  } else {
    loadFromServer();
  }
})();
