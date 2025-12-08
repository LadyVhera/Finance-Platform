// Redirect target after successful admin sign-in
const ADMIN_DASH_URL = "admindashboard.html";

// --- Admin approvals storage () ---
const ADMIN_KEYS = {
  APPS: "tpt_admin_apps", // Array of applications [{name,email,reason,at,status}]
  APPROVALS: "tpt_admin_approvals", // Map: { "email@x.com": true }
  PENDING_EMAIL: "tpt_admin_pending_email", // last email awaiting approval for this device
};

// Helper: check if an email is approved by Major Admin
function isAdminApproved(email) {
  const map = JSON.parse(localStorage.getItem(ADMIN_KEYS.APPROVALS) || "{}");
  return !!map[(email || "").toLowerCase()];
}

// Open Sign-Up from the slash link in the Login footer
document
  .getElementById("linkOpenAdminSignup")
  ?.addEventListener("click", (e) => {
    e.preventDefault();
    sessionStorage.setItem("pendingRole", "Admin"); // remember intent to become admin
    bootstrap.Modal.getInstance(
      document.getElementById("modalAdminLogin")
    )?.hide();
    bootstrap.Modal.getOrCreateInstance(
      document.getElementById("modalAdminSignup")
    ).show();
  });

// Handle Admin Sign-Up submit
document.getElementById("formAdminSignup")?.addEventListener("submit", (e) => {
  e.preventDefault();

  const name = document.getElementById("suName").value.trim();
  const email = document.getElementById("suEmail").value.trim();
  const pass = document.getElementById("suPassword").value.trim();
  const reason = document.getElementById("suReason").value.trim();
  const invite = document.getElementById("suInvite").value.trim();

  if (
    !name ||
    !/^\S+@\S+\.\S+$/.test(email) ||
    !pass ||
    pass.length < 6 ||
    !reason
  ) {
    alert("Please fill all required fields (valid email, 6+ char password).");
    return;
  }

  // Save/append application
  const apps = JSON.parse(localStorage.getItem(ADMIN_KEYS.APPS) || "[]");
  apps.unshift({
    name,
    email,
    reason,
    at: new Date().toISOString(),
    status: "pending",
  });
  localStorage.setItem(ADMIN_KEYS.APPS, JSON.stringify(apps));

  // Optional instant-approval via invite code (you can remove this if not desired)
  // Example: INVITE-ADMIN -> auto-approve:
  if (invite === "INVITE-ADMIN") {
    const approvals = JSON.parse(
      localStorage.getItem(ADMIN_KEYS.APPROVALS) || "{}"
    );
    approvals[email.toLowerCase()] = true;
    localStorage.setItem(ADMIN_KEYS.APPROVALS, JSON.stringify(approvals));
  }

  // If Major Admin has already approved this email, promote & redirect
  if (isAdminApproved(email)) {
    // Reuse your existing state model safely:
    try {
      const state = {
        set isAdmin(v) {
          localStorage.setItem("isAdmin", v ? "true" : "false");
        },
        set authed(v) {
          v
            ? localStorage.setItem("authToken", "-token")
            : localStorage.removeItem("authToken");
        },
        set role(r) {
          localStorage.setItem("role", r);
        },
        get user() {
          try {
            return JSON.parse(localStorage.getItem("user")) || null;
          } catch {
            return null;
          }
        },
        set user(u) {
          localStorage.setItem("user", JSON.stringify(u));
        },
      };
      state.isAdmin = true;
      state.authed = true;
      state.role = "Admin";
      state.user = { ...(state.user || {}), name, email };
    } catch {}

    // close modal then go
    bootstrap.Modal.getInstance(
      document.getElementById("modalAdminSignup")
    )?.hide();
    sessionStorage.removeItem("pendingRole");
    window.location.href = ADMIN_DASH_URL;
    return;
  }

  // Otherwise, mark as pending and inform the user
  localStorage.setItem(ADMIN_KEYS.PENDING_EMAIL, email);
  bootstrap.Modal.getInstance(
    document.getElementById("modalAdminSignup")
  )?.hide();
  alert(
    "Your admin request was submitted and is pending approval by the Major Admin."
  );
});

// On load, if a user has a pending signup and has since been approved, auto-promote
(function checkPendingApprovalOnLoad() {
  const email = localStorage.getItem(ADMIN_KEYS.PENDING_EMAIL);
  if (!email) return;
  if (!isAdminApproved(email)) return;

  // Promote now
  try {
    const state = {
      set isAdmin(v) {
        localStorage.setItem("isAdmin", v ? "true" : "false");
      },
      set authed(v) {
        v
          ? localStorage.setItem("authToken", "-token")
          : localStorage.removeItem("authToken");
      },
      set role(r) {
        localStorage.setItem("role", r);
      },
      get user() {
        try {
          return JSON.parse(localStorage.getItem("user")) || null;
        } catch {
          return null;
        }
      },
      set user(u) {
        localStorage.setItem("user", JSON.stringify(u));
      },
    };
    state.isAdmin = true;
    state.authed = true;
    state.role = "Admin";
    state.user = {
      ...(state.user || {}),
      name: state.user?.name || "Administrator",
      email,
    };
  } catch {}

  localStorage.removeItem(ADMIN_KEYS.PENDING_EMAIL);
  const pending = sessionStorage.getItem("pendingRole");
  sessionStorage.removeItem("pendingRole");
  if (pending === "Admin") {
    window.location.href = ADMIN_DASH_URL;
  }
})();

// Run in console on the Major Admin device/page to approve someone
const k = "tpt_admin_approvals",
  m = JSON.parse(localStorage.getItem(k) || "{}");
m["newadmin@example.com"] = true;
localStorage.setItem(k, JSON.stringify(m));

// --- Utilities & Seed ---
const fmtMoney = (v) => "₣" + Number(v).toLocaleString();
const uid = (p) => p + Math.random().toString(36).slice(2, 7).toUpperCase();
const nowISO = () => new Date().toISOString().slice(0, 10);

const LS = {
  REQ: "tpt_demo_requests",
  TX: "tpt_demo_tx",
  MSG: "tpt_demo_messages",
  BANK: "tpt_demo_bank",
  PROFILE: "tpt_demo_profile",
  PREFS: "tpt_demo_prefs",
  KYC: "tpt_demo_kyc",
  REFS: "tpt_demo_refs",
};

function seed() {
  if (!localStorage.getItem(LS.REQ)) {
    localStorage.setItem(
      LS.REQ,
      JSON.stringify([
        {
          id: "R-1201",
          title: "Emergency rent",
          cat: "Housing",
          amount: 9000,
          status: "Verified",
          created: "2025-10-04",
        },
        {
          id: "R-1202",
          title: "Medication fund",
          cat: "Medical",
          amount: 6000,
          status: "Pending",
          created: "2025-10-08",
        },
        {
          id: "R-1203",
          title: "Tuition & books",
          cat: "Education",
          amount: 12000,
          status: "Fulfilled",
          created: "2025-10-10",
        },
        {
          id: "R-1204",
          title: "Clinic transport",
          cat: "Medical",
          amount: 2400,
          status: "Pending",
          created: "2025-10-14",
        },
      ])
    );
  }
  if (!localStorage.getItem(LS.TX)) {
    localStorage.setItem(
      LS.TX,
      JSON.stringify([
        {
          date: "2025-10-12",
          type: "Received",
          ref: "R-1203",
          amount: 12000,
          status: "Completed",
        },
        {
          date: "2025-10-13",
          type: "Provided",
          ref: "R-9932",
          amount: 5000,
          status: "Completed",
        },
        {
          date: "2025-10-14",
          type: "Add Funds",
          ref: "TOPUP-114",
          amount: 10000,
          status: "Completed",
        },
      ])
    );
  }
  if (!localStorage.getItem(LS.MSG)) {
    localStorage.setItem(
      LS.MSG,
      JSON.stringify([
        {
          id: "C-1",
          title: "Verification Help",
          with: "Reviewer Team",
          last: "2025-10-13",
          thread: [
            {
              me: false,
              text: "Hi, we received your ID. Please add a selfie.",
              at: "2025-10-13 10:04",
            },
            { me: true, text: "Uploaded now, thanks!", at: "2025-10-13 10:10" },
          ],
        },
        {
          id: "C-2",
          title: "Proof of transfer",
          with: "Marcus M.",
          last: "2025-10-14",
          thread: [
            {
              me: false,
              text: "I sent ₣6,000 for R-1201. Receipt attached.",
              at: "2025-10-14 07:20",
            },
            { me: true, text: "Confirmed, thank you!", at: "2025-10-14 07:35" },
          ],
        },
      ])
    );
  }
  if (!localStorage.getItem(LS.REFS)) {
    const base = location.origin + location.pathname.replace(/[^/]+$/, "");
    localStorage.setItem(
      LS.REFS,
      JSON.stringify({
        link: base + "?ref=ABC123",
        list: [
          {
            name: "Ana López",
            email: "ana@example.com",
            joined: "2025-09-21",
            status: "Active",
          },
          {
            name: "José Perez",
            email: "jose@example.com",
            joined: "2025-10-01",
            status: "Pending",
          },
        ],
        stats: { count: 2, active: 1, bonus: 1500 },
      })
    );
  }
  if (!localStorage.getItem(LS.PROFILE)) {
    localStorage.setItem(
      LS.PROFILE,
      JSON.stringify({
        name: "Friend",
        email: "friend@example.com",
        phone: "",
        city: "",
      })
    );
  }
  if (!localStorage.getItem(LS.PREFS)) {
    localStorage.setItem(
      LS.PREFS,
      JSON.stringify({ email: true, sms: false, anon: true, lang: "Español" })
    );
  }
}
seed();

document.getElementById("year").textContent = new Date().getFullYear();
const sidebar = document.getElementById("sidebar");
document
  .getElementById("btnToggleSidebar")
  ?.addEventListener("click", () => sidebar.classList.toggle("open"));

// Load profile
const profile = JSON.parse(localStorage.getItem(LS.PROFILE));
document.getElementById("usernameTop").textContent =
  profile.name || "Dear Friend!";
document.getElementById("badgeRank").textContent = "Member";

// KPIs from transactions
function refreshKPIs() {
  const tx = JSON.parse(localStorage.getItem(LS.TX) || "[]");

  // Calculate totals
  const received = tx
    .filter((t) => t.type === "Received")
    .reduce((a, b) => a + Number(b.amount || 0), 0);

  const provided = tx
    .filter((t) => t.type === "Provided")
    .reduce((a, b) => a + Number(b.amount || 0), 0);

  // Wallet Balance
  const balance = tx.reduce(
    (a, b) =>
      a +
      (b.type === "Add Funds" ? b.amount : 0) +
      (b.type === "Received" ? b.amount : 0) -
      (b.type === "Provided" ? b.amount : 0),
    0
  );

  // Fulfillment Rate should be EXACTLY same as Wallet Balance
  const fulfillment = balance;

  // Display values
  document.getElementById("kpiBalance").textContent = fmtMoney(balance);
  document.getElementById("kpiReceived").textContent = fmtMoney(received);
  document.getElementById("kpiProvided").textContent = fmtMoney(provided);

  // Fulfillment shows MONEY not %
  document.getElementById("kpiFulfillment").textContent = fmtMoney(fulfillment);

  // Progress bars
  document.getElementById("pbBalance").style.width =
    Math.min(100, balance % 100) + "%";

  document.getElementById("pbReceived").style.width =
    Math.min(100, received % 100) + "%";

  document.getElementById("pbProvided").style.width =
    Math.min(100, provided % 100) + "%";

  document.getElementById("pbFulfillment").style.width =
    Math.min(100, fulfillment % 100) + "%";

  // Update wallet area if used elsewhere
  document.getElementById("walletBalance").textContent = fmtMoney(balance);
}

refreshKPIs();


// Charts
const chartActivity = new Chart(document.getElementById("chartActivity"), {
  type: "line",
  data: {
    labels: Array.from({ length: 12 }, (_, i) => `D${i + 1}`),
    datasets: [
      {
        label: "Received",
        data: [4, 5, 3, 6, 7, 9, 6, 8, 7, 10, 8, 9],
        tension: 0.35,
      },
      {
        label: "Provided",
        data: [2, 3, 2, 5, 4, 6, 3, 5, 4, 6, 5, 5],
        tension: 0.35,
      },
    ],
  },
  options: {
    plugins: { legend: { labels: { color: "#cbd5e1" } } },
    scales: {
      x: {
        ticks: { color: "#9fb0c9" },
        grid: { color: "rgba(255,255,255,.06)" },
      },
      y: {
        ticks: { color: "#9fb0c9" },
        grid: { color: "rgba(255,255,255,.06)" },
      },
    },
  },
});
new Chart(document.getElementById("chartSplit"), {
  type: "doughnut",
  data: {
    labels: ["Medical", "Education", "others"],
    datasets: [{ data: [45, 35, 20] }],
  },
  options: { plugins: { legend: { labels: { color: "#cbd5e1" } } } },
});
new Chart(document.getElementById("chartWallet"), {
  type: "bar",
  data: {
    labels: ["W1", "W2", "W3", "W4"],
    datasets: [{ label: "Net", data: [2, 4, 3, 5] }],
  },
  options: {
    plugins: { legend: { labels: { color: "#cbd5e1" } } },
    scales: {
      x: { ticks: { color: "#9fb0c9" } },
      y: { ticks: { color: "#9fb0c9" } },
    },
  },
});
const chartReferrals = new Chart(document.getElementById("chartReferrals"), {
  type: "bar",
  data: {
    labels: ["Aug", "Sep", "Oct"],
    datasets: [{ label: "Referrals", data: [1, 2, 3] }],
  },
  options: {
    plugins: { legend: { labels: { color: "#cbd5e1" } } },
    scales: {
      x: { ticks: { color: "#9fb0c9" } },
      y: { ticks: { color: "#9fb0c9" } },
    },
  },
});

// Requests (Kanban + Table)
function renderReqCard(r) {
  return `<div class="req-card">
      <div class="title">${r.title}</div>
      <div class="meta">${r.id} • ${r.cat} • ${r.created}</div>
      <div class="fw-bold mt-1">${fmtMoney(r.amount)}</div>
      <div class="d-flex gap-1 mt-2">
        <button class="btn btn-sm btn-outline-light" data-id="${
          r.id
        }" data-action="view"><i class="bi bi-eye"></i></button>
        <button class="btn btn-sm btn-outline-light" data-id="${
          r.id
        }" data-action="edit"><i class="bi bi-pencil"></i></button>
        <button class="btn btn-sm btn-outline-light" data-id="${
          r.id
        }" data-action="del"><i class="bi bi-trash"></i></button>
      </div>
    </div>`;
}
function refreshRequests() {
  const reqs = JSON.parse(localStorage.getItem(LS.REQ) || "[]");
  // Kanban
  document.getElementById("colPending").innerHTML = reqs
    .filter((r) => r.status === "Pending")
    .map(renderReqCard)
    .join("");
  document.getElementById("colVerified").innerHTML = reqs
    .filter((r) => r.status === "Verified")
    .map(renderReqCard)
    .join("");
  document.getElementById("colFulfilled").innerHTML = reqs
    .filter((r) => r.status === "Fulfilled")
    .map(renderReqCard)
    .join("");
  // Table
  const term = (document.getElementById("rqSearch").value || "").toLowerCase();
  const filt = document.getElementById("rqFilter").value || "";
  const rows = reqs.filter(
    (r) =>
      (!filt || r.status === filt) &&
      (!term ||
        r.title.toLowerCase().includes(term) ||
        r.id.toLowerCase().includes(term))
  );
  const tbody = document.getElementById("tblRequests");
  tbody.innerHTML = "";
  rows.forEach((r) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${r.id}</td><td>${r.title}</td><td>${
      r.cat
    }</td><td>${fmtMoney(r.amount)}</td>
        <td><span class="badge ${
          r.status === "Fulfilled"
            ? "text-bg-success"
            : r.status === "Verified"
            ? "text-bg-info"
            : "text-bg-warning"
        }">${r.status}</span></td>
        <td class="small">${r.created}</td>
        <td class="text-end">
          <button class="btn btn-sm btn-outline-light" data-id="${
            r.id
          }" data-action="view"><i class="bi bi-eye"></i></button>
          <button class="btn btn-sm btn-outline-light" data-id="${
            r.id
          }" data-action="edit"><i class="bi bi-pencil"></i></button>
          <button class="btn btn-sm btn-outline-light" data-id="${
            r.id
          }" data-action="del"><i class="bi bi-trash"></i></button>
        </td>`;
    tbody.appendChild(tr);
  });
}
refreshRequests();
document.getElementById("rqSearch").addEventListener("input", refreshRequests);
document.getElementById("rqFilter").addEventListener("change", refreshRequests);

// Provide Help grid

document.getElementById("phContinue").addEventListener("click", () => {
    const amt = Number(document.getElementById("phAmount").value);
    const accept = document.getElementById("phAccept").checked;

    if (!amt || amt <= 0) {
        return alert("Enter a valid amount.");
    }
    if (!accept) {
        return alert("You must accept the terms before continuing.");
    }

    // Simulate merging process
    document.getElementById("phStep1").style.display = "none";
    document.getElementById("phStep2").style.display = "block";

    setTimeout(() => {
        document.getElementById("phStep2").style.display = "none";
        document.getElementById("phStep3").style.display = "block";
    }, 3000); // 3 seconds processing ()
});

// Upload proof of help sent
document.getElementById("phUploadProof").addEventListener("click", () => {
    const file = document.getElementById("phProof").files[0];
    if (!file) return alert("Please upload proof of payment.");

    alert("Proof submitted to admin ().");

    document.getElementById("phStep3").style.display = "none";
    document.getElementById("phReceiver").style.display = "block";
});

// Receiver confirms
document.getElementById("phConfirmReceived").addEventListener("click", () => {
    alert("Fund confirmed received (). Transaction completed.");
    document.getElementById("phReceiver").style.display = "none";
});


// Wallet & Transactions
function refreshTx() {
  const term = (document.getElementById("txSearch")?.value || "").toLowerCase();
  const tbody = document.getElementById("tblTx");
  tbody.innerHTML = "";
  JSON.parse(localStorage.getItem(LS.TX) || "[]")
    .filter(
      (t) =>
        !term ||
        t.ref.toLowerCase().includes(term) ||
        t.type.toLowerCase().includes(term)
    )
    .forEach((t) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td class="small">${t.date}</td><td class="small">${
        t.type
      }</td><td class="small">${t.ref}</td><td class="small">${fmtMoney(
        t.amount
      )}</td>
          <td class="small"><span class="badge ${
            t.status === "Completed" ? "text-bg-success" : "text-bg-warning"
          }">${t.status}</span></td>`;
      tbody.appendChild(tr);
    });
}
refreshTx();
document.getElementById("txSearch").addEventListener("input", refreshTx);

document.getElementById("formAddFunds").addEventListener("submit", (e) => {
  e.preventDefault();
  const amt = Number(document.getElementById("afAmt").value);
  const tx = JSON.parse(localStorage.getItem(LS.TX) || "[]");
  tx.unshift({
    date: nowISO(),
    type: "Add Funds",
    ref: uid("TOPUP-"),
    amount: amt,
    status: "Completed",
  });
  localStorage.setItem(LS.TX, JSON.stringify(tx));
  refreshTx();
  refreshKPIs();
  bootstrap.Modal.getInstance(document.getElementById("modalAddFunds"))?.hide();
  e.target.reset();
});
document.getElementById("formWithdraw").addEventListener("submit", (e) => {
  e.preventDefault();
  const amt = Number(document.getElementById("wdAmt").value);
  const tx = JSON.parse(localStorage.getItem(LS.TX) || "[]");
  tx.unshift({
    date: nowISO(),
    type: "Withdraw",
    ref: uid("WD-"),
    amount: amt,
    status: "Pending",
  });
  localStorage.setItem(LS.TX, JSON.stringify(tx));
  refreshTx();
  refreshKPIs();
  bootstrap.Modal.getInstance(document.getElementById("modalWithdraw"))?.hide();
  e.target.reset();
});
// Bank
const bank = JSON.parse(localStorage.getItem(LS.BANK) || "null");
document.getElementById("bankInfo").textContent = bank
  ? `${bank.name} • ${bank.bank} • ${bank.number}`
  : "Not set";
document.getElementById("formBank").addEventListener("submit", (e) => {
  e.preventDefault();
  const data = {
    name: bkName.value.trim(),
    number: bkNumber.value.trim(),
    bank: bkBank.value.trim(),
  };
  localStorage.setItem(LS.BANK, JSON.stringify(data));
  document.getElementById(
    "bankInfo"
  ).textContent = `${data.name} • ${data.bank} • ${data.number}`;
  bootstrap.Modal.getInstance(document.getElementById("modalBank"))?.hide();
  e.target.reset();
});
document.getElementById("btnExportCsv").addEventListener("click", () => {
  const tx = JSON.parse(localStorage.getItem(LS.TX) || "[]");
  const rows = [["Date", "Type", "Ref", "Amount", "Status"]].concat(
    tx.map((t) => [t.date, t.type, t.ref, t.amount, t.status])
  );
  const csv = rows
    .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "transactions.csv";
  a.click();
  URL.revokeObjectURL(a.href);
});

// Messages
function refreshInbox() {
  const list = JSON.parse(localStorage.getItem(LS.MSG) || "[]");
  const el = document.getElementById("msgList");
  el.innerHTML = "";
  list.forEach((c) => {
    const a = document.createElement("a");
    a.href = "#";
    a.className =
      "list-group-item list-group-item-action d-flex justify-content-between align-items-center";
    a.dataset.cid = c.id;
    a.innerHTML = `<span><i class="bi bi-chat-left-text me-2"></i>${c.title} <span class="muted small">• ${c.with}</span></span><span class="small muted">${c.last}</span>`;
    el.appendChild(a);
  });
}
function openConversation(cid) {
  const list = JSON.parse(localStorage.getItem(LS.MSG) || "[]");
  const c = list.find((x) => x.id === cid);
  if (!c) return;
  msgTitle.textContent = c.title;
  msgMeta.textContent = c.with + " • " + c.last;
  const thread = document.getElementById("msgThread");
  thread.innerHTML = "";
  thread.dataset.cid = cid;
  c.thread.forEach((m) => {
    const row = document.createElement("div");
    row.className =
      "d-flex " + (m.me ? "justify-content-end" : "justify-content-start");
    row.innerHTML = `<div class="p-2 rounded-3 ${
      m.me ? "bg-primary text-dark" : "bg-dark text-light"
    }" style="max-width:70%">${m.text}<div class="small muted mt-1">${
      m.at
    }</div></div>`;
    thread.appendChild(row);
  });
  thread.scrollTop = thread.scrollHeight;
}
refreshInbox();
document.getElementById("msgList").addEventListener("click", (e) => {
  const a = e.target.closest("a[data-cid]");
  if (!a) return;
  e.preventDefault();
  openConversation(a.dataset.cid);
});
document.getElementById("btnNewMessage").addEventListener("click", () => {
  const list = JSON.parse(localStorage.getItem(LS.MSG) || "[]");
  const id = uid("C-");
  list.unshift({
    id,
    title: "New conversation",
    with: "Support",
    last: nowISO(),
    thread: [],
  });
  localStorage.setItem(LS.MSG, JSON.stringify(list));
  refreshInbox();
  openConversation(id);
});
document.getElementById("msgAttach").addEventListener("change", (e) => {
  document.getElementById("msgAttachName").textContent = e.target.files[0]
    ? `Attached: ${e.target.files[0].name}`
    : "";
});
document.getElementById("formSendMessage").addEventListener("submit", (e) => {
  e.preventDefault();
  const cid = msgThread.dataset.cid;
  if (!cid) return;
  const txt = msgInput.value.trim();
  if (!txt) return;
  const list = JSON.parse(localStorage.getItem(LS.MSG) || "[]");
  const c = list.find((x) => x.id === cid);
  c.thread.push({
    me: true,
    text: txt,
    at: new Date().toISOString().slice(0, 16).replace("T", " "),
  });
  c.last = nowISO();
  localStorage.setItem(LS.MSG, JSON.stringify(list));
  msgInput.value = "";
  msgAttach.value = "";
  msgAttachName.textContent = "";
  openConversation(cid);
  refreshInbox();
});

// Referrals
function refreshRefs() {
  const data = JSON.parse(localStorage.getItem(LS.REFS) || "{}");
  inviteLink.value = data.link || location.href + "?ref=ABC123";
  refCount.textContent = data.stats?.count || 0;
  refActive.textContent = data.stats?.active || 0;
  refBonus.textContent = fmtMoney(data.stats?.bonus || 0);
  const tbody = document.getElementById("tblReferrals");
  tbody.innerHTML = "";
  (data.list || []).forEach((r) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${r.name}</td><td class="small">${r.email}</td><td class="small">${r.joined}</td><td class="small">${r.status}</td>`;
    tbody.appendChild(tr);
  });
}
refreshRefs();
document.getElementById("btnCopyInvite").addEventListener("click", async () => {
  await navigator.clipboard.writeText(
    document.getElementById("inviteLink").value
  );
  alert("Invite link copied!");
});

// Verification
document.getElementById("pName").value = profile.name || "";
document.getElementById("pEmail").value = profile.email || "";
document.getElementById("pPhone").value = profile.phone || "";
document.getElementById("pCity").value = profile.city || "";
document.getElementById("formProfile").addEventListener("submit", (e) => {
  e.preventDefault();
  const p = {
    name: pName.value.trim(),
    email: pEmail.value.trim(),
    phone: pPhone.value.trim(),
    city: pCity.value.trim(),
  };
  localStorage.setItem(LS.PROFILE, JSON.stringify(p));
  usernameTop.textContent = p.name || "Friend";
  alert("Profile saved ().");
});
const kyc = JSON.parse(localStorage.getItem(LS.KYC) || "{}");
document.getElementById("kycStatus").textContent =
  kyc.status || "Not submitted";
document.getElementById("formKyc").addEventListener("submit", (e) => {
  e.preventDefault();
  localStorage.setItem(
    LS.KYC,
    JSON.stringify({ status: "Submitted " + nowISO() })
  );
  document.getElementById("kycStatus").textContent = "Submitted " + nowISO();
  alert("KYC submitted ().");
});

// Preferences & Security
const prefs = JSON.parse(localStorage.getItem(LS.PREFS) || "{}");
prefEmail.checked = !!prefs.email;
prefSms.checked = !!prefs.sms;
prefAnon.checked = !!prefs.anon;
prefLang.value = prefs.lang || "Español";
formPrefs.addEventListener("submit", (e) => {
  e.preventDefault();
  const p = {
    email: prefEmail.checked,
    sms: prefSms.checked,
    anon: prefAnon.checked,
    lang: prefLang.value,
  };
  localStorage.setItem(LS.PREFS, JSON.stringify(p));
  alert("Preferences saved ().");
});
formSecurity.addEventListener("submit", (e) => {
  e.preventDefault();
  if (secNew.value && secNew.value === secNew2.value) {
    alert("Security updated ().");
    e.target.reset();
  } else {
    alert("Passwords do not match.");
  }
});

// ---------- Tab hash support (NEW) ----------
// Activate tab from URL hash (e.g., ...#tab-messages)
if (location.hash) {
  const trigger = document.querySelector(`[data-bs-target="${location.hash}"]`);
  if (trigger) new bootstrap.Tab(trigger).show();
}
// Keep URL hash in sync with active tab
document.querySelectorAll('[data-bs-toggle="tab"]').forEach((el) => {
  el.addEventListener("shown.bs.tab", (e) => {
    const target = e.target.getAttribute("data-bs-target");
    if (target) history.replaceState(null, "", target);
    // close sidebar on mobile after navigation
    sidebar?.classList.remove("open");
  });
});

/* ===== LocalStorage keys ===== */
LS.MOD = LS.MOD || "tpt_modules_v2";
LS.WAL = LS.WAL || "tpt_wallet_v1";
LS.ACT = LS.ACT || "tpt_activity_v1";
LS.REF = LS.REF || "tpt_referrals_v1"; // Track student referrals

/* ===== Seed School Modules ===== */
function seedSchool() {
  if (!localStorage.getItem(LS.MOD)) {
    localStorage.setItem(
      LS.MOD,
      JSON.stringify([
        { id: 1, title: "Community policies", done: false },
        { id: 2, title: "How verification works", done: false },
        { 
          id: 3, 
          title: "Referral Submission Stage", 
          done: false,
          desc: "Provide at least 15 referral links, with 10 who have provided help. Complete a quiz after a short lesson before rank upgrade." 
        },
        { id: 4, title: "Responsible inviting", done: false },
        { id: 5, title: "Privacy & consent", done: false },
        { 
          id: 6, 
          title: "Referral Expansion Stage", 
          done: false,
          desc: "Reach at least 100 direct and indirect referrals. Complete quiz after lesson before promotion. Admin upgrades ranks automatically, bonuses rise with rank." 
        },
      ])
    );
  }

  if (!localStorage.getItem(LS.WAL)) {
    localStorage.setItem(
      LS.WAL,
      JSON.stringify([{ type: "credit", val: 2000, note: "Welcome bonus", at: new Date().toISOString() }])
    );
  }

  if (!localStorage.getItem(LS.ACT)) {
    localStorage.setItem(LS.ACT, JSON.stringify([{ t: "Opened TPT School", at: new Date().toISOString() }]));
  }

  if (!localStorage.getItem(LS.REF)) {
    localStorage.setItem(LS.REF, JSON.stringify([]));
  }
}

/* ===== Render Modules ===== */
function renderModules() {
  const holder = document.getElementById("modules");
  if (!holder) return;
  holder.innerHTML = "";
  const mods = JSON.parse(localStorage.getItem(LS.MOD) || "[]");
  const done = mods.filter((m) => m.done).length;
  const prog = document.getElementById("modProgress");
  if (prog) prog.textContent = `${done}/${mods.length} complete`;

  mods.forEach((m) => {
    const col = document.createElement("div");
    col.className = "col-12";

    // Custom layout for module 3
    if (m.id === 3) {
      const refs = JSON.parse(localStorage.getItem(LS.REF) || "[]");
      const userRefs = refs.slice(0, 15); // show only first 15
      col.innerHTML = `
        <div class="panel p-3 d-flex flex-column gap-2">
          <div class="d-flex justify-content-between align-items-center">
            <h6 class="mb-1">${m.title}</h6>
            <span class="chip">Module ${m.id}</span>
          </div>
          <p class="small muted">${m.desc}</p>
          <form id="refForm">
            <label class="small">Add Referral Link:</label>
            <input type="url" class="form-control mb-1" placeholder="Paste referral link" required>
            <div class="form-check mb-2">
              <input class="form-check-input" type="checkbox" id="helpedCheck">
              <label class="form-check-label">This referral has provided help</label>
            </div>
            <button class="btn btn-sm btn-primary mb-2" type="submit">Add Referral</button>
          </form>
          <div class="small muted">Referrals added: ${userRefs.length}/15</div>
          <button class="btn btn-sm btn-success mt-2" ${checkReferralRequirements(3) ? "" : "disabled"} id="quizBtn3">
            Take Quiz & Complete Module
          </button>
        </div>
      `;
      holder.appendChild(col);

      // Bind form submit for module 3
      const form3 = col.querySelector("#refForm");
      form3?.addEventListener("submit", (e) => {
        e.preventDefault();
        const link = form3.querySelector("input").value.trim();
        const helped = form3.querySelector("#helpedCheck").checked;
        if (!link) return;
        addReferral(link, helped);
        form3.reset();
        renderModules(); // re-render to update count
      });

      // Quiz button
      col.querySelector("#quizBtn3")?.addEventListener("click", () => {
        const modsArr = JSON.parse(localStorage.getItem(LS.MOD) || "[]");
        const mod = modsArr.find(x => x.id === 3);
        mod.done = true;
        localStorage.setItem(LS.MOD, JSON.stringify(modsArr));
        addActivity("Completed Module 3 after quiz");
        renderModules();
      });

      return; // Skip default rendering for module 3
    }

    // Custom layout for module 6
    if (m.id === 6) {
      const refs = JSON.parse(localStorage.getItem(LS.REF) || "[]");
      const totalRefs = refs.length; // direct + indirect
      col.innerHTML = `
        <div class="panel p-3 d-flex flex-column gap-2">
          <div class="d-flex justify-content-between align-items-center">
            <h6 class="mb-1">${m.title}</h6>
            <span class="chip">Module ${m.id}</span>
          </div>
          <p class="small muted">${m.desc}</p>
          <div class="small mb-2">Total referrals: ${totalRefs}/100</div>
          <button class="btn btn-sm btn-success mt-2" ${checkReferralRequirements(6) ? "" : "disabled"} id="quizBtn6">
            Take Quiz & Complete Module
          </button>
        </div>
      `;
      holder.appendChild(col);

      // Quiz button
      col.querySelector("#quizBtn6")?.addEventListener("click", () => {
        const modsArr = JSON.parse(localStorage.getItem(LS.MOD) || "[]");
        const mod = modsArr.find(x => x.id === 6);
        mod.done = true;
        localStorage.setItem(LS.MOD, JSON.stringify(modsArr));
        addActivity("Completed Module 6 after quiz");
        renderModules();
      });

      return; // Skip default rendering for module 6
    }

    // Default rendering for modules 1,2,4,5
    col.innerHTML = `
      <div class="panel p-3 d-flex flex-column gap-2">
        <div class="d-flex justify-content-between align-items-center">
          <div>
            <h6 class="mb-1">${m.title}</h6>
            <p class="small muted mb-0">${m.desc || "Short lesson with a quiz."}</p>
          </div>
          <span class="chip">Module ${m.id}</span>
        </div>
        <div class="d-flex justify-content-end">
          <button class="btn btn-sm ${m.done ? "" : ""}" data-mod="${m.id}">
            ${m.done ? "Completed" : '<i class="bi bi-play-circle me-1"></i>Start'}
          </button>
        </div>
      </div>`;
    holder.appendChild(col);
  });
}

/* ===== Referral helper ===== */
function addReferral(link, helped = false) {
  const refs = JSON.parse(localStorage.getItem(LS.REF) || "[]");
  refs.push({ link, helped });
  localStorage.setItem(LS.REF, JSON.stringify(refs));
}

function checkReferralRequirements(modId) {
  const refs = JSON.parse(localStorage.getItem(LS.REF) || "[]");
  if(modId === 3){
    const helpedCount = refs.filter(r => r.helped).length;
    return refs.length >= 15 && helpedCount >= 10;
  }
  if(modId === 6){
    return refs.length >= 100; // Direct + indirect
  }
  return true;
}

/* ===== School Activity ===== */
function addActivity(t) {
  const arr = JSON.parse(localStorage.getItem(LS.ACT) || "[]");
  arr.push({ t, at: new Date().toISOString() });
  localStorage.setItem(LS.ACT, JSON.stringify(arr));
}

/* ===== Wallet Rendering ===== */
function renderWallet() {
  const ul = document.getElementById("walletList");
  if (!ul) return;
  ul.innerHTML = "";
  JSON.parse(localStorage.getItem(LS.WAL) || "[]")
    .slice()
    .reverse()
    .forEach((w) => {
      const li = document.createElement("li");
      li.className = "list-group-item bg-transparent text-light d-flex justify-content-between";
      li.innerHTML = `<span>${w.type === "credit" ? "+" : "-"} FEL ${w.val} — ${w.note || ""}</span>
                      <span class="small muted">${new Date(w.at).toLocaleDateString()}</span>`;
      ul.appendChild(li);
    });
  const bal = JSON.parse(localStorage.getItem(LS.WAL) || "[]").reduce((a, x) => a + (x.type === "credit" ? x.val : -x.val), 0);
  const wBal = document.getElementById("wBalance");
  if (wBal) wBal.textContent = "FEL " + bal.toLocaleString();
}

/* ===== Bind School Tab Behaviors ===== */
function bindSchool() {
  const yr = document.getElementById("polYear");
  if (yr) yr.textContent = new Date().getFullYear();

  document.getElementById("tab-school")?.addEventListener("click", (e) => {
    const b = e.target.closest("button[data-mod]");
    if (!b) return;
    const id = +b.dataset.mod;
    const mods = JSON.parse(localStorage.getItem(LS.MOD) || "[]");
    const m = mods.find((x) => x.id === id);
    if (!m) return;

    if (!checkReferralRequirements(id)) {
      return alert("You do not meet the referral requirements for this module yet.");
    }

    m.done = !m.done;
    localStorage.setItem(LS.MOD, JSON.stringify(mods));
    addActivity((m.done ? "Completed: " : "Reopened: ") + m.title);
    renderModules();
  });

  // Upload form
  document.getElementById("uploadForm")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const f = e.target;
    if (!f.checkValidity()) {
      f.classList.add("was-validated");
      return;
    }
    addActivity("Uploaded testimonial video");
    bootstrap.Modal.getInstance(document.getElementById("uploadModal"))?.hide();
    f.reset();
  });

  // Wallet buttons
  document.getElementById("addFeliz")?.addEventListener("click", () => {
    const w = JSON.parse(localStorage.getItem(LS.WAL) || "[]");
    w.push({ type: "credit", val: 500, note: " top-up", at: new Date().toISOString() });
    localStorage.setItem(LS.WAL, JSON.stringify(w));
    renderWallet();
  });

  document.getElementById("convertCash")?.addEventListener("click", () => {
    const w = JSON.parse(localStorage.getItem(LS.WAL) || "[]");
    const bal = w.reduce((a, x) => a + (x.type === "credit" ? x.val : -x.val), 0);
    if (bal <= 0) return alert("No balance");
    alert(`Convert: FEL ${bal.toLocaleString()} → MX$${bal.toLocaleString()}`);
    addActivity("Converted FEL to MXN");
  });
}

/* ===== Boot School ===== */
function bootSchool() {
  seedSchool();
  renderModules();
  renderWallet();
  bindSchool();
}

bootSchool();
document.querySelector("#tablink-school")?.addEventListener("shown.bs.tab", () => {
  renderModules();
  renderWallet();
});


// ----- User role switcher & avatar menu () -----
(function () {
  const qs = (s, r = document) => r.querySelector(s);
  const qsa = (s, r = document) => [...r.querySelectorAll(s)];

  // ---- State helpers () ----
  const state = {
    get user() {
      try {
        return JSON.parse(localStorage.getItem("user")) || null;
      } catch {
        return null;
      }
    },
    set user(u) {
      localStorage.setItem("user", JSON.stringify(u));
    },

    get role() {
      return localStorage.getItem("role") || "Member";
    },
    set role(r) {
      localStorage.setItem("role", r);
    },

    get authed() {
      return !!localStorage.getItem("authToken");
    },
    set authed(v) {
      v
        ? localStorage.setItem("authToken", "-token")
        : localStorage.removeItem("authToken");
    },

    get isAdmin() {
      return localStorage.getItem("isAdmin") === "true";
    },
    set isAdmin(v) {
      localStorage.setItem("isAdmin", v ? "true" : "false");
    },
  };

  // ---- UI bind ----
  function renderUserBits() {
    // Name / Email (avatar dropdown)
    const name = state.user?.name || "Friend";
    const email = state.user?.email || "friend@example.com";
    const role = state.role;

    const badge = qs("#badgeRank");
    const usernameTop = qs("#usernameTop");
    const ddName = qs("#ddName");
    const ddEmail = qs("#ddEmail");

    if (badge) badge.textContent = role;
    if (usernameTop) usernameTop.textContent = name;
    if (ddName) ddName.textContent = name;
    if (ddEmail) ddEmail.textContent = email;

    // If not authed, still show Member role by default
    if (!state.authed && badge) badge.textContent = "Member";
  }

  function wireRoleSwitcher() {
    const qs = (s, r = document) => r.querySelector(s);
    const qsa = (s, r = document) => [...r.querySelectorAll(s)];
    const adminLoginModal = qs("#modalAdminLogin");
    const badge = qs("#badgeRank");

    const setBadge = (role) => {
      if (badge) badge.textContent = role;
    };

    qsa(".role-option").forEach((a) => {
      a.addEventListener("click", (e) => {
        e.preventDefault();
        const picked = a.dataset.role; // "Member" | "Admin"

        if (picked === "Member") {
          localStorage.setItem("role", "Member");
          setBadge("Member");
          sessionStorage.removeItem("pendingRole");
          return;
        }

        // picked === "Admin"
        const alreadyAdmin = localStorage.getItem("isAdmin") === "true";
        if (alreadyAdmin) {
          localStorage.setItem("role", "Admin");
          setBadge("Admin");
          return;
        }

        // Not an admin yet: do NOT set role to Admin. Show login modal instead.
        setBadge("Member");
        sessionStorage.setItem("pendingRole", "Admin");
        bootstrap.Modal.getOrCreateInstance(adminLoginModal).show();
      });
    });
  }
  function wireAvatarMenu() {
    const btnLoginAsAdmin = qs("#btnLoginAsAdmin");
    const adminLoginModal = qs("#modalAdminLogin");
    const formAdminLogin = qs("#formAdminLogin");

    // Explicit "Login as Admin" action
    btnLoginAsAdmin?.addEventListener("click", (e) => {
      e.preventDefault();
      bootstrap.Modal.getOrCreateInstance(adminLoginModal).show();
    });

    // Fake/real admin login submit (replace this block in wireAvatarMenu)
    formAdminLogin?.addEventListener("submit", async (e) => {
      e.preventDefault();

      const emailEl = document.getElementById("adminEmail");
      const passEl = document.getElementById("adminPassword");
      const remember = document.getElementById("rememberMe")?.checked;

      const email = emailEl?.value.trim() || "";
      const pass = passEl?.value.trim() || "";

      if (!/^\S+@\S+\.\S+$/.test(email) || !pass) {
        alert("Please enter a valid admin email and password.");
        return;
      }

      // ---- Approval + (optional)  password gate ----
      const approved =
        typeof isAdminApproved === "function" ? isAdminApproved(email) : false;
      const demoOk = pass === "12345"; // replace with real API result later

      if (!approved && !demoOk) {
        // Not approved and  pass not used -> go to Sign-Up
        localStorage.setItem(ADMIN_KEYS.PENDING_EMAIL, email);
        bootstrap.Modal.getInstance(
          document.getElementById("modalAdminLogin")
        )?.hide();
        alert("You're not approved yet. Please request admin access.");
        sessionStorage.setItem("pendingRole", "Admin");
        bootstrap.Modal.getOrCreateInstance(
          document.getElementById("modalAdminSignup")
        ).show();
        return;
      }

      // ✅ Promote to Admin
      localStorage.setItem("isAdmin", "true");
      localStorage.setItem("authToken", "-token");
      localStorage.setItem("role", "Admin");

      try {
        const u = JSON.parse(localStorage.getItem("user") || "{}");
        localStorage.setItem(
          "user",
          JSON.stringify({ ...u, name: u.name || "Administrator", email })
        );
      } catch {}

      if (remember) localStorage.setItem("adminEmailRemember", email);
      else localStorage.removeItem("adminEmailRemember");

      // Close modal & update badge immediately
      bootstrap.Modal.getInstance(
        document.getElementById("modalAdminLogin")
      )?.hide();
      const badge = document.querySelector("#badgeRank");
      if (badge) badge.textContent = "Admin";

      // If user came here via Admin toggle, redirect now
      const pending = sessionStorage.getItem("pendingRole");
      sessionStorage.removeItem("pendingRole");
      if (pending === "Admin") {
        window.location.href = ADMIN_DASH_URL; // admindashboard.html
      }
    });

    // Logout
    const btnLogout = qs("#btnLogout");
    const confirmModalEl = qs("#modalConfirmLogout");
    const loggedOutModalEl = qs("#modalLoggedOut");
    const confirmModal = bootstrap.Modal.getOrCreateInstance(confirmModalEl);
    const loggedOutModal =
      bootstrap.Modal.getOrCreateInstance(loggedOutModalEl);

    btnLogout?.addEventListener("click", (e) => {
      e.preventDefault();
      confirmModal.show();
    });

    qs("#confirmLogout")?.addEventListener("click", () => {
      // Clear  auth
      ["authToken", "isAdmin"].forEach((k) => localStorage.removeItem(k));
      // Keep user profile, but reset role to Member
      state.role = "Member";
      confirmModal.hide();
      setTimeout(() => loggedOutModal.show(), 220);
      renderUserBits();
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    // Seed  user if none
    if (!state.user)
      state.user = { name: "Friend", email: "friend@example.com" };

    // If authed not set, assume authed in dashboard view ()
    if (state.authed === false) state.authed = true;

    // ✅ Normalize role on every load/login (authoritative)
    (function normalizeRoleOnLoad() {
      const isAdminFlag = localStorage.getItem("isAdmin") === "true";
      const badge = document.querySelector("#badgeRank");

      if (!isAdminFlag) {
        localStorage.setItem("role", "Member");
        if (badge) badge.textContent = "Member";
      } else {
        localStorage.setItem("role", "Admin");
        if (badge) badge.textContent = "Admin";
      }
    })();

    renderUserBits();
    wireRoleSwitcher();
    wireAvatarMenu();
  });
})();

// Helper: show tab by its LINK id (not the pane)
function openTabByLinkId(linkSelector, evtTarget) {
  const linkEl = document.querySelector(linkSelector);
  if (!linkEl) return;
  bootstrap.Tab.getOrCreateInstance(linkEl).show();

  // Optional: close the dropdown after click
  const menu = evtTarget?.closest?.(".dropdown-menu");
  if (menu) {
    const toggle = menu.parentElement?.querySelector(
      '[data-bs-toggle="dropdown"]'
    );
    if (toggle) bootstrap.Dropdown.getOrCreateInstance(toggle).hide();
  }
}

// Wire dropdown items -> sidebar tablinks
document.getElementById("openProfileTab")?.addEventListener("click", (e) => {
  e.preventDefault();
  openTabByLinkId("#tablink-profile", e.target);
});
document.getElementById("openMessagesTab")?.addEventListener("click", (e) => {
  e.preventDefault();
  openTabByLinkId("#tablink-messages", e.target);
});
document.getElementById("openSettingsTab")?.addEventListener("click", (e) => {
  e.preventDefault();
  openTabByLinkId("#tablink-settings", e.target);
});
// FIX: use the tab LINK id, not the pane id
document.getElementById("openSecurityTab")?.addEventListener("click", (e) => {
  e.preventDefault();
  openTabByLinkId("#tablink-verification", e.target);
});
// FIX: wallet link id is #tablink-wallet (not billing)
document.getElementById("openBillingTab")?.addEventListener("click", (e) => {
  e.preventDefault();
  openTabByLinkId("#tablink-wallet", e.target);
});

// helper
const $ = (s, r = document) => r.querySelector(s);
const show = (el) => el.classList.remove("d-none");
const hide = (el) => el.classList.add("d-none");

// Ensure .btn-brand uses your gradient (alias to .btn)
document.head.insertAdjacentHTML(
  "beforeend",
  `
                <style>.btn-brand{background:linear-gradient(90deg,var(--accent2),var(--accent1));color:var(--btn-text);box-shadow:0 6px 20px rgba(0,112,255,.12);}</style>
  `
);

// Forgot: send link
$("#forgotForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  hide($("#fpAlertSuccess"));
  hide($("#fpAlertError"));
  const email = $("#fpEmail").value.trim();

  // basic email check
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    $("#fpEmail").classList.add("is-invalid");
    return;
  } else {
    $("#fpEmail").classList.remove("is-invalid");
  }

  try {
    // TODO: replace with your API call:
    // await fetch('/api/auth/request-reset', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({email}) });
    await new Promise((r) => setTimeout(r, 600)); // 
    show($("#fpAlertSuccess"));
  } catch (err) {
    show($("#fpAlertError"));
  }
});

// Reset: set new password
$("#resetForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  hide($("#rpAlertSuccess"));
  hide($("#rpAlertError"));

  const p1 = $("#rpNew").value;
  const p2 = $("#rpNew2").value;
  let ok = true;

  if (p1.length < 8) {
    $("#rpNew").classList.add("is-invalid");
    ok = false;
  } else {
    $("#rpNew").classList.remove("is-invalid");
  }
  if (p2 !== p1 || !p2) {
    $("#rpNew2").classList.add("is-invalid");
    ok = false;
  } else {
    $("#rpNew2").classList.remove("is-invalid");
  }
  if (!ok) return;

  try {
    const token =
      new URLSearchParams(location.search).get("token") || "-token";
    // TODO: replace with your API call:
    // await fetch('/api/auth/reset-password', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({token, password:p1}) });
    await new Promise((r) => setTimeout(r, 650)); // 
    show($("#rpAlertSuccess"));
  } catch (err) {
    show($("#rpAlertError"));
  }
});

// If we have ?token=... in URL, open Reset modal automatically
(function autoOpenResetIfToken() {
  const params = new URLSearchParams(location.search);
  if (params.has("token")) {
    const resetModal = new bootstrap.Modal(
      document.getElementById("resetModal")
    );
    resetModal.show();
  }
})();

// ===== PROFILE TAB: Edit / Cancel / Save (with outside-form selects) =====
(function () {
  const pane = document.getElementById("tab-profile");
  if (!pane) return;

  // Buttons
  const btnEdit = pane.querySelector("#btnEditProfile");
  const btnCancel = pane.querySelector("#btnCancelEdit");
  const btnSave = pane.querySelector("#btnSaveProfile");

  // Form + fields
  const form = pane.querySelector("#profileForm");
  const avatarInput = pane.querySelector("#avatarInput");
  const avatarPrev = pane.querySelector("#avatarPreview");
  const switch2FA = pane.querySelector("#switch2FA");
  const switchEmail = pane.querySelector("#switchEmailNotif");
  const toastEl = document.getElementById("profileToast");

  // ---------- helpers (UPDATED) ----------
  // Find any control by name whether it's inside the form OR linked via form="profileForm"
  function findField(name) {
    return (
      pane.querySelector(`#profileForm [name="${name}"]`) ||
      pane.querySelector(`[form="profileForm"][name="${name}"]`)
    );
  }

  // All editable controls: inside the form OR associated via form="profileForm"
  const $allEditable = () =>
    Array.from(
      pane.querySelectorAll(
        '#profileForm input, #profileForm select, #profileForm textarea, [form="profileForm"]'
      )
    )
      .concat([switch2FA, switchEmail, avatarInput])
      .filter(Boolean);

  // Snapshot for Cancel
  let snapshot = null;

  function readForm() {
    // FormData includes associated controls with form="profileForm"
    const data = Object.fromEntries(new FormData(form).entries());
    data.twofa = !!(switch2FA && switch2FA.checked);
    data.emailNotif = !!(switchEmail && switchEmail.checked);
    data.avatar = avatarPrev?.src || "";
    return data;
  }

  function writeForm(data) {
    for (const [k, v] of Object.entries(data)) {
      const el = findField(k);
      if (el) {
        // only set if option exists (avoids blanking selects with unexpected values)
        if (el.tagName === "SELECT") {
          const has = [...el.options].some(
            (o) => o.value === v || o.text === v
          );
          el.value = has ? v : el.value;
        } else {
          el.value = v;
        }
      }
    }
    if (typeof data.twofa !== "undefined" && switch2FA)
      switch2FA.checked = !!data.twofa;
    if (typeof data.emailNotif !== "undefined" && switchEmail)
      switchEmail.checked = !!data.emailNotif;
    if (data.avatar && avatarPrev) avatarPrev.src = data.avatar;
  }

  function loadFromStorage() {
    const LS_PROFILE = JSON.parse(
      localStorage.getItem("tpt_demo_profile") || "{}"
    );
    const LS_PREFS = JSON.parse(localStorage.getItem("tpt_demo_prefs") || "{}");

    const [firstName = "", ...rest] = (LS_PROFILE.name || "Friend").split(" ");
    const lastName = rest.join(" ") || "User";

    const data = {
      firstName,
      lastName,
      email: LS_PROFILE.email || "friend@example.com",
      phone: LS_PROFILE.phone || "",
      country: LS_PROFILE.country || "Nigeria",
      city: LS_PROFILE.city || "Lagos",
      bio: LS_PROFILE.bio || "Member at TPT México",
      // these three are the ones outside the form:
      lang: LS_PREFS.lang || "English",
      tz: LS_PROFILE.tz || "Africa/Lagos (GMT+1)",
      theme: LS_PROFILE.theme || "System",
      twofa: !!LS_PROFILE.twofa,
      emailNotif: LS_PREFS.email !== undefined ? !!LS_PREFS.email : true,
      avatar: LS_PROFILE.avatar || avatarPrev?.src || "",
    };
    writeForm(data);
    return data;
  }

  function saveToStorage(data) {
    const profile = {
      name:
        [data.firstName, data.lastName].filter(Boolean).join(" ") || "Friend",
      email: data.email,
      phone: data.phone,
      city: data.city,
      country: data.country,
      bio: data.bio,
      tz: data.tz, // save time zone
      theme: data.theme, // save theme
      twofa: !!data.twofa,
      avatar: data.avatar || avatarPrev?.src || "",
    };
    const prefs = {
      ...JSON.parse(localStorage.getItem("tpt_demo_prefs") || "{}"),
      email: !!data.emailNotif,
      lang: data.lang || "English", // save language
    };

    localStorage.setItem("tpt_demo_profile", JSON.stringify(profile));
    localStorage.setItem("tpt_demo_prefs", JSON.stringify(prefs));

    const usernameTop = document.getElementById("usernameTop");
    if (usernameTop) usernameTop.textContent = profile.name || "Friend";
  }

  function setEditMode(on) {
    $allEditable().forEach((el) => {
      if (!el) return;
      if (on) el.removeAttribute("disabled");
      else el.setAttribute("disabled", "disabled");
    });

    if (on) {
      btnEdit?.classList.add("d-none");
      btnCancel?.classList.remove("d-none");
      btnSave?.classList.remove("d-none");
    } else {
      btnEdit?.classList.remove("d-none");
      btnCancel?.classList.add("d-none");
      btnSave?.classList.add("d-none");
    }
  }

  // Avatar preview
  avatarInput?.addEventListener("change", (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (avatarPrev) avatarPrev.src = reader.result;
    };
    reader.readAsDataURL(f);
  });

  // Wire buttons
  btnEdit?.addEventListener("click", () => {
    snapshot = readForm();
    setEditMode(true);
  });

  btnCancel?.addEventListener("click", () => {
    if (snapshot) writeForm(snapshot);
    setEditMode(false);
  });

  btnSave?.addEventListener("click", (e) => {
    e.preventDefault();
    if (!form.checkValidity()) {
      form.classList.add("was-validated");
      return;
    }
    const data = readForm();
    saveToStorage(data);
    setEditMode(false);
    if (toastEl) bootstrap.Toast.getOrCreateInstance(toastEl).show();
  });

  // Init
  loadFromStorage();
  setEditMode(false);
})();

// ===== CHANGE PASSWORD BUTTON -> OPEN SETTINGS TAB =====
document.getElementById("btnChangePassword")?.addEventListener("click", (e) => {
  e.preventDefault();

  // Target the sidebar/tab link that opens the Settings tab
  const tabLink = document.querySelector("#tablink-settings");
  if (tabLink) {
    // use Bootstrap Tab API to show it
    const tab = new bootstrap.Tab(tabLink);
    tab.show();

    // optional: scroll into view / focus Security section
    setTimeout(() => {
      const secForm = document.getElementById("formSecurity");
      secForm?.scrollIntoView({ behavior: "smooth", block: "start" });
      secForm?.querySelector("input")?.focus();
    }, 250);
  }
});

(function () {
  const ACK_KEY = "tpt_policy_ack_v1";
  const lastUpdated = "2025-01-15"; // set your real date here

  // Stamps
  document.getElementById("polYear")?.replaceChildren(new Date().getFullYear());
  document
    .getElementById("polLastUpdated")
    ?.replaceChildren(new Date(lastUpdated).toLocaleDateString());

  // Restore acceptance
  const accept = document.getElementById("polAccept");
  if (accept) accept.checked = localStorage.getItem(ACK_KEY) === "true";

  // Accept & Continue
  document.getElementById("polContinueBtn")?.addEventListener("click", () => {
    const c = document.getElementById("polAccept");
    if (!c?.checked) {
      alert("Please read and tick “I’ve read & agree”.");
      return;
    }
    localStorage.setItem(ACK_KEY, "true");

    // Optional: jump to Support or back to where user came from
    // new bootstrap.Tab(document.querySelector('#tablink-overview')).show();
    alert("Thanks! Your acceptance was saved for this device.");
  });

  // Print / Save
  document
    .getElementById("polPrintBtn")
    ?.addEventListener("click", () => window.print());

  // Go to Support tab
  document.getElementById("polGoSupport")?.addEventListener("click", (e) => {
    e.preventDefault();
    const link = document.querySelector("#tablink-support");
    if (link) new bootstrap.Tab(link).show();
  });

  // Enable Bootstrap scrollspy (needs container with data-bs-spy)
  const cont = document.querySelector(".policy-content");
  if (cont) {
    bootstrap.ScrollSpy.getInstance(cont) ||
      new bootstrap.ScrollSpy(cont, {
        target: "#policyNav",
        rootMargin: "0px 0px -60%",
      });
  }
})();

(function () {
  const ACK_KEY = "tpt_policy_ack_v1";

  // === Reading progress ===
  const content = document.querySelector(".policy-content");
  const bar = document.getElementById("polProgressBar");
  function updateProgress() {
    if (!content || !bar) return;
    const s = content.scrollTop;
    const h = content.scrollHeight - content.clientHeight;
    const pct = Math.max(0, Math.min(1, h ? s / h : 0));
    bar.style.width = pct * 100 + "%";
    // Show CTA after ~40% read if not yet accepted
    if (!localStorage.getItem(ACK_KEY)) {
      document.getElementById("polCta")?.classList.toggle("show", pct > 0.4);
    }
  }
  content?.addEventListener("scroll", updateProgress);
  updateProgress();

  // === Mirror checkbox & accept from floating CTA ===
  const acceptTop = document.getElementById("polAccept");
  const acceptFloat = document.getElementById("polAccept2");
  const btnFloat = document.getElementById("polContinueBtn2");

  // Sync initial state
  if (acceptTop && acceptFloat) acceptFloat.checked = acceptTop.checked;

  function acceptAndStore() {
    const checked = acceptTop?.checked || acceptFloat?.checked;
    if (!checked) {
      alert("Please tick “I agree” first.");
      return;
    }
    localStorage.setItem(ACK_KEY, "true");
    document.getElementById("polCta")?.classList.remove("show");
    alert("Thanks! Your acceptance was saved on this device.");
  }

  acceptTop?.addEventListener("change", () => {
    if (acceptFloat) acceptFloat.checked = acceptTop.checked;
  });
  acceptFloat?.addEventListener("change", () => {
    if (acceptTop) acceptTop.checked = acceptFloat.checked;
  });

  document
    .getElementById("polContinueBtn")
    ?.addEventListener("click", acceptAndStore);
  btnFloat?.addEventListener("click", acceptAndStore);
})();

(function () {
  // ====== Support draft + submit () ======
  const LS_SUPPORT_TICKETS = "tpt_support_tickets";
  const LS_SUPPORT_DRAFT = "tpt_support_draft";

  const $ = (s, r = document) => r.querySelector(s);
  const emailEl = $("#supEmail");
  const subEl = $("#supSub");
  const catEl = $("#supCat");
  const priEl = $("#supPri");
  const msgEl = $("#supMsg");
  const fileEl = $("#supFile");
  const fileNameEl = $("#supFileName");
  const countEl = $("#supCount");
  const form = $("#formSupport");
  const sendBtn = $("#supSendBtn");
  const success = $("#supSuccess");
  const ticketIdEl = $("#supTicketId");
  const copyBtn = $("#supCopyEmail");

  // Prefill user email if you store it in profile
  try {
    const prof = JSON.parse(localStorage.getItem("tpt_demo_profile") || "{ }");
    if (prof.email && emailEl) emailEl.value = prof.email;
  } catch {}

  // Autosave draft
  function saveDraft() {
    const draft = {
      email: emailEl?.value || "",
      sub: subEl?.value || "",
      cat: catEl?.value || "General",
      pri: priEl?.value || "Normal",
      msg: msgEl?.value || "",
    };
    localStorage.setItem(LS_SUPPORT_DRAFT, JSON.stringify(draft));
  }
  function loadDraft() {
    const d = JSON.parse(localStorage.getItem(LS_SUPPORT_DRAFT) || "null");
    if (!d) return;
    if (emailEl) emailEl.value = d.email || emailEl.value;
    if (subEl) subEl.value = d.sub || "";
    if (catEl) catEl.value = d.cat || "General";
    if (priEl) priEl.value = d.pri || "Normal";
    if (msgEl) msgEl.value = d.msg || "";
    updateCount();
  }
  function clearDraft() {
    localStorage.removeItem(LS_SUPPORT_DRAFT);
  }

  function updateCount() {
    if (!msgEl || !countEl) return;
    countEl.textContent = String(msgEl.value.length);
  }

  msgEl?.addEventListener("input", () => {
    updateCount();
    saveDraft();
  });
  [emailEl, subEl, catEl, priEl].forEach((el) =>
    el?.addEventListener("input", saveDraft)
  );
  fileEl?.addEventListener("change", () => {
    fileNameEl.textContent = fileEl.files?.[0]?.name
      ? `Attached: ${fileEl.files[0].name}`
      : "";
  });

  // Quick templates
  document.querySelectorAll("[data-sup-template]").forEach((a) => {
    a.addEventListener("click", (e) => {
      const t = a.getAttribute("data-sup-template");
      if (t === "verification") {
        subEl.value = "Verification help";
        catEl.value = "Verification";
        msgEl.value =
          "Hello Support, my verification is pending. I uploaded documents on [date]. Please advise on next steps.";
      } else if (t === "payment") {
        subEl.value = "Payment/receipt assistance";
        catEl.value = "Payments";
        msgEl.value =
          "Hi, I sent a payment for request [ID] on [date]. Attached is the receipt. Could you confirm processing?";
      } else if (t === "abuse") {
        subEl.value = "Abuse report";
        catEl.value = "Abuse/Report";
        msgEl.value =
          "I would like to report a policy violation. Details: [who/what/when]. I consent to share the info privately with reviewers.";
      } else {
        subEl.value = "Question about my account";
        catEl.value = "Account";
        msgEl.value = "Hello, I have a question about my account settings…";
      }
      priEl.value = "Normal";
      updateCount();
      saveDraft();
    });
  });

  // Copy support email
  copyBtn?.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText("support@tpt.example");
      const old = copyBtn.innerHTML;
      copyBtn.innerHTML = '<i class="bi bi-clipboard-check me-1"></i>Copied!';
      setTimeout(() => (copyBtn.innerHTML = old), 1200);
    } catch {}
  });

  // Submit -> store local "ticket" ()
  form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!form.checkValidity()) {
      form.classList.add("was-validated");
      return;
    }

    // Loading state
    sendBtn.disabled = true;
    sendBtn.querySelector("span").textContent = "Sending…";

    // Simulate network
    await new Promise((r) => setTimeout(r, 650));

    const id = "ST-" + Math.random().toString(36).slice(2, 7).toUpperCase();
    const payload = {
      id,
      at: new Date().toISOString(),
      email: emailEl.value.trim(),
      subject: subEl.value.trim(),
      category: catEl.value,
      priority: priEl.value,
      message: msgEl.value.trim(),
      file: fileEl.files?.[0]?.name || "",
    };

    // Save ticket list
    const all = JSON.parse(localStorage.getItem(LS_SUPPORT_TICKETS) || "[]");
    all.unshift(payload);
    localStorage.setItem(LS_SUPPORT_TICKETS, JSON.stringify(all));

    // Show success
    ticketIdEl.textContent = id;
    success.classList.remove("d-none");

    // Optionally, also open the Messages tab and start a thread (-friendly)
    try {
      const MSG = "tpt_demo_messages";
      const list = JSON.parse(localStorage.getItem(MSG) || "[]");
      list.unshift({
        id,
        title: `Support: ${payload.subject}`,
        with: "Support",
        last: payload.at,
        thread: [
          { me: true, text: payload.message.slice(0, 200), at: payload.at },
        ],
      });
      localStorage.setItem(MSG, JSON.stringify(list));
    } catch {}

    // Reset UI
    form.reset();
    fileNameEl.textContent = "";
    updateCount();
    clearDraft();

    sendBtn.disabled = false;
    sendBtn.querySelector("span").textContent = "Send";
  });

  // Clear draft button
  $("#supResetDraft")?.addEventListener("click", () => {
    form.reset();
    fileNameEl.textContent = "";
    updateCount();
    clearDraft();
  });

  // FAQ search (by text + data-tags)
  const faqSearch = $("#faqSearch");
  const faqItems = [...document.querySelectorAll("#helpFaq .accordion-item")];
  faqSearch?.addEventListener("input", () => {
    const q = faqSearch.value.toLowerCase().trim();
    faqItems.forEach((item) => {
      const text = item.textContent.toLowerCase();
      const tags = (item.getAttribute("data-tags") || "").toLowerCase();
      const hit = !q || text.includes(q) || tags.includes(q);
      item.style.display = hit ? "" : "none";
    });
  });

  // Link to Messages tab
  $("#openMessagesFromSupport")?.addEventListener("click", (e) => {
    e.preventDefault();
    const link = document.querySelector("#tablink-messages");
    if (link) {
      const tab = new bootstrap.Tab(link);
      tab.show();
      setTimeout(
        () =>
          document
            .getElementById("msgList")
            ?.scrollIntoView({ behavior: "smooth" }),
        250
      );
    }
  });

  // Init
  loadDraft();
  updateCount();
})();

document.addEventListener("DOMContentLoaded", function () {
  const openPoliciesBtn = document.getElementById("openPoliciesBtn");

  openPoliciesBtn.addEventListener("click", function () {
    // Trigger the policies tab
    const policiesTab = document.querySelector(
      '[data-bs-target="#tab-policies"]'
    );
    if (policiesTab) {
      const tab = new bootstrap.Tab(policiesTab);
      tab.show();
    }

    // Wait a moment for the tab to render, then scroll to the top
    setTimeout(() => {
      const policiesSection = document.querySelector("#tab-policies");
      if (policiesSection)
        policiesSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 300);
  });
});



