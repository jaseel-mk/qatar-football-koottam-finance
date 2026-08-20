/* Qatar Football Koottam Finance
   Supabase configuration + password reset support.
   IMPORTANT:
   - Use the project URL WITHOUT /rest/v1/
   - Never put a Supabase service_role key in this file.
*/

const SUPABASE_URL = "https://soakyzawpmsoxqodskgr.supabase.co";
const SUPABASE_KEY = "sb_publishable_knMPrkJfZ003rPvb7bRgRA_QJC8DWGJ";

const RESET_PAGE_URL = "redirectTo: "https://jaseel-mk.github.io/qatar-football-koottam-finance/reset.html"";

const configured =
  !SUPABASE_URL.startsWith("YOUR_") &&
  !SUPABASE_KEY.startsWith("YOUR_");

const sb = configured
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    })
  : null;

const $ = id => document.getElementById(id);
let state = { members: [], matches: [], expenses: [], ledger: [], page: "dashboard" };

function money(n){
  return `QAR ${Number(n||0).toLocaleString("en-QA",{minimumFractionDigits:0,maximumFractionDigits:2})}`;
}
function esc(v){
  return String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
}
function dateText(v){
  if(!v) return "—";
  return new Date(v+"T00:00:00").toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"});
}
function toast(msg){
  const t=$("toast");
  if(!t) return alert(msg);
  t.textContent=msg;
  t.classList.add("show");
  setTimeout(()=>t.classList.remove("show"),2400);
}
function today(){ return new Date().toISOString().slice(0,10); }

/* ---------------- PASSWORD RESET ---------------- */

function addForgotPasswordLink(){
  const form = $("loginForm");
  if(!form || $("forgotPasswordBtn")) return;

  const wrapper = document.createElement("div");
  wrapper.style.cssText = "text-align:center;margin-top:12px;";

  const btn = document.createElement("button");
  btn.type = "button";
  btn.id = "forgotPasswordBtn";
  btn.textContent = "Forgot password?";
  btn.style.cssText =
    "border:0;background:none;color:#52786d;text-decoration:underline;" +
    "cursor:pointer;font-size:14px;padding:8px;";

  btn.onclick = sendPasswordReset;
  wrapper.appendChild(btn);

  form.insertAdjacentElement("afterend", wrapper);
}

async function sendPasswordReset(){
  if(!sb){
    toast("Supabase is not configured.");
    return;
  }

  const email = $("loginEmail")?.value?.trim();

  if(!email){
    toast("Enter your email address first.");
    $("loginEmail")?.focus();
    return;
  }

  try{
    const { error } = await sb.auth.resetPasswordForEmail(email, {
      redirectTo: RESET_PAGE_URL
    });

    if(error){
      console.error(error);
      toast(error.message);
      return;
    }

    toast("Password reset email sent. Check your email.");
  }catch(err){
    console.error(err);
    toast("Unable to send password reset email.");
  }
}

async function updatePassword(newPassword){
  if(!sb){
    toast("Supabase is not configured.");
    return false;
  }

  if(!newPassword || newPassword.length < 6){
    toast("Password must be at least 6 characters.");
    return false;
  }

  const { error } = await sb.auth.updateUser({
    password: newPassword
  });

  if(error){
    console.error(error);
    toast(error.message);
    return false;
  }

  toast("Password updated successfully.");
  return true;
}

/* ---------------- APP ---------------- */

async function init(){
  if(!configured){
    $("configWarning")?.classList.remove("hidden");
    return;
  }

  addForgotPasswordLink();

  const {data:{session}} = await sb.auth.getSession();

  if(session) showApp(session);
  else showAuth();

  sb.auth.onAuthStateChange((_event,session)=>{
    if(session) showApp(session);
    else showAuth();
  });
}

function showAuth(){
  $("authView")?.classList.remove("hidden");
  $("appView")?.classList.add("hidden");
  addForgotPasswordLink();
}

async function showApp(session){
  $("authView")?.classList.add("hidden");
  $("appView")?.classList.remove("hidden");
  if($("userEmail")) $("userEmail").textContent=session.user.email||"Signed in";
  await loadData();
}

async function requireOk(result){
  if(result.error){
    console.error(result.error);
    toast(result.error.message);
    throw result.error;
  }
  return result.data;
}

async function loadData(){
  try{
    const [m,ma,e,l] = await Promise.all([
      sb.from("members").select("*").eq("active",true).order("name"),
      sb.from("matches").select("*").order("match_number",{ascending:false}),
      sb.from("expenses").select("*, members:paid_by(name)").order("expense_date",{ascending:false}),
      sb.from("cash_transactions").select("*, from_member:from_member_id(name), to_member:to_member_id").order("transaction_date",{ascending:false})
    ]);

    state.members=await requireOk(m)||[];
    state.matches=await requireOk(ma)||[];
    state.expenses=await requireOk(e)||[];
    state.ledger=await requireOk(l)||[];
    render();
  }catch(e){}
}

function matchBalance(match){
  const expenses=state.expenses.filter(x=>x.match_id===match.id).reduce((s,x)=>s+Number(x.amount),0);
  return Number(match.total_collected)-expenses;
}

function cashByMember(){
  const out={};
  state.members.forEach(m=>out[m.id]={...m,balance:0});

  state.ledger.forEach(t=>{
    const a=Number(t.amount);
    if(t.to_member_id && out[t.to_member_id]) out[t.to_member_id].balance += a;
    if(t.from_member_id && out[t.from_member_id]) out[t.from_member_id].balance -= a;
  });

  return Object.values(out);
}

function totals(){
  const collected=state.matches.reduce((s,m)=>s+Number(m.total_collected),0);
  const expenses=state.expenses.reduce((s,e)=>s+Number(e.amount),0);
  const cash=cashByMember().reduce((s,m)=>s+m.balance,0);
  return {collected,expenses,net:collected-expenses,cash};
}

function render(){
  renderDashboard();
  renderMatches();
  renderCash();
  renderExpenses();
  renderReports();
  switchPage(state.page,false);
}

function renderDashboard(){
  const t=totals();
  $("totalCash").textContent=money(t.cash);
  $("cashTotal2").textContent=money(t.cash);
  $("totalCollected").textContent=money(t.collected);
  $("totalExpenses").textContent=money(t.expenses);
  $("netBalance").textContent=money(t.net);
  $("totalMatches").textContent=state.matches.length;

  const people=cashByMember();
  $("cashCards").innerHTML=people.map(p=>
    `<div class="cash-card"><div class="person">${esc(p.name)}</div><div class="amount">${money(p.balance)}</div></div>`
  ).join("")||empty("No members");

  $("cashStatus").innerHTML=`● ${t.cash>=0?"Balanced":"Check cash"}`;
  $("cashStatus").className=`status ${t.cash>=0?"ok":""}`;

  const recent=state.matches.slice(0,5);
  $("recentMatches").innerHTML=recent.map(m=>matchCard(m)).join("")||empty("No matches yet.");
}

function matchCard(m){
  const b=matchBalance(m);
  return `<div class="match-card"><div><strong>Match #${m.match_number}</strong><div class="match-meta">${dateText(m.match_date)} · ${m.players} players · Collected ${money(m.total_collected)}</div></div><div class="match-balance ${b>=0?"positive":"negative"}">${b>=0?"+":""}${money(b)}</div></div>`;
}

function empty(text){return `<div class="empty">${esc(text)}</div>`;}

function renderMatches(){
  const q=($("matchSearch")?.value||"").toLowerCase();
  const f=$("matchFilter")?.value||"all";

  let rows=state.matches.filter(m=>`${m.match_number} ${m.match_date}`.toLowerCase().includes(q));

  if(f!=="all") rows=rows.filter(m=>f==="positive"?matchBalance(m)>=0:matchBalance(m)<0);

  $("matchesTable").innerHTML=rows.length?`<table class="data-table"><thead><tr><th>Match</th><th>Date</th><th>Players</th><th>Collected</th><th>Expenses</th><th>Balance</th><th></th></tr></thead><tbody>${rows.map(m=>{
    const ex=state.expenses.filter(e=>e.match_id===m.id).reduce((s,e)=>s+Number(e.amount),0), b=Number(m.total_collected)-ex;
    return `<tr><td><strong>#${m.match_number}</strong></td><td>${dateText(m.match_date)}</td><td>${m.players}</td><td>${money(m.total_collected)}</td><td>${money(ex)}</td><td class="${b>=0?"positive":"negative"}"><strong>${money(b)}</strong></td><td><button class="text-btn" onclick="openMatch(${JSON.stringify(m.id)})">View</button></td></tr>`;
  }).join("")}</tbody></table>`:empty("No matches found.");
}

function openMatch(id){
  const m=state.matches.find(x=>x.id===id);
  if(!m)return;

  const ex=state.expenses.filter(e=>e.match_id===id);

  openModal(`<h3>Match #${m.match_number}</h3><p class="muted">${dateText(m.match_date)} · ${m.players} players</p><div class="stats-grid"><div class="stat-card"><span>Collected</span><strong>${money(m.total_collected)}</strong></div><div class="stat-card"><span>Expenses</span><strong>${money(ex.reduce((s,e)=>s+Number(e.amount),0))}</strong></div><div class="stat-card"><span>Balance</span><strong>${money(matchBalance(m))}</strong></div><div class="stat-card"><span>Collection/player</span><strong>${money(m.collection_per_player)}</strong></div></div><h4>Expenses</h4>${ex.map(e=>`<div class="match-card"><div><strong>${esc(e.category)}</strong><div class="match-meta">${esc(e.paid_by_name||"")} · ${esc(e.description||"")}</div></div><strong>${money(e.amount)}</strong></div>`).join("")||empty("No expenses")}`);
}

function openMatchForm(){
  const next=(Math.max(0,...state.matches.map(m=>Number(m.match_number)))+1);

  openModal(`<h3>Add Match</h3><form id="matchForm"><div class="form-grid">
    <label>Match number<input id="mfNum" type="number" min="1" value="${next}" required></label>
    <label>Date<input id="mfDate" type="date" value="${today()}" required></label>
    <label>Players<input id="mfPlayers" type="number" min="0" value="0" required></label>
    <label>Collection / player<input id="mfRate" type="number" min="0" step=".01" value="10" required></label>
    <label>Collected<input id="mfCollected" type="number" min="0" step=".01" value="0" required></label>
    <label>Collection received by<select id="mfReceiver">${memberOptions()}</select></label>
    <label class="full-row">Notes<textarea id="mfNotes" rows="3" placeholder="Optional"></textarea></label>
  </div><p class="small muted">Total collected is initially Players × Collection/player. You can adjust it before saving.</p><div class="modal-actions"><button type="button" class="secondary" onclick="closeModal()">Cancel</button><button class="primary">Save Match</button></div></form>`);

  $("mfPlayers").addEventListener("input",()=>{ $("mfCollected").value=(Number($("mfPlayers").value)*Number($("mfRate").value)).toFixed(2); });
  $("mfRate").addEventListener("input",()=>{ $("mfCollected").value=(Number($("mfPlayers").value)*Number($("mfRate").value)).toFixed(2); });
  $("matchForm").onsubmit=saveMatch;
}

async function saveMatch(ev){
  ev.preventDefault();

  const row={
    match_number:Number($("mfNum").value),
    match_date:$("mfDate").value,
    players:Number($("mfPlayers").value),
    collection_per_player:Number($("mfRate").value),
    total_collected:Number($("mfCollected").value),
    notes:$("mfNotes").value||null
  };

  const m=await requireOk(await sb.from("matches").insert(row).select().single());
  const receiver=$("mfReceiver").value;

  if(receiver && Number(m.total_collected)>0)
    await requireOk(await sb.from("cash_transactions").insert({
      transaction_date:m.match_date,
      type:"match_collection",
      amount:Number(m.total_collected),
      to_member_id:receiver,
      match_id:m.id,
      description:`Match #${m.match_number} collection`
    }));

  closeModal();
  toast("Match added successfully");
  await loadData();
}

function memberOptions(){
  return state.members.map(m=>`<option value="${m.id}">${esc(m.name)}</option>`).join("")
}

function renderCash(){
  const people=cashByMember();

  $("cashPeople").innerHTML=people.map(p=>
    `<div class="cash-card"><div class="person">${esc(p.name)}</div><div class="amount">${money(p.balance)}</div><div class="match-meta">Current ledger balance</div></div>`
  ).join("")||empty("No members");

  $("cashLedger").innerHTML=state.ledger.length?`<table class="data-table"><thead><tr><th>Date</th><th>Type</th><th>Amount</th><th>From</th><th>To</th><th>Description</th></tr></thead><tbody>${state.ledger.map(t=>
    `<tr><td>${dateText(t.transaction_date)}</td><td><span class="pill">${esc(t.type.replaceAll("_"," "))}</span></td><td>${money(t.amount)}</td><td>${esc(t.from_member?.name||"—")}</td><td>${esc(t.to_member?.name||"—")}</td><td>${esc(t.description||"—")}</td></tr>`
  ).join("")}</tbody></table>`:empty("No cash transactions yet.");
}

function openTransferForm(){
  if(state.members.length<2){toast("Add at least two members first.");return}

  openModal(`<h3>Transfer Cash</h3><form id="transferForm"><div class="form-grid">
    <label>From<select id="tfFrom">${memberOptions()}</select></label>
    <label>To<select id="tfTo">${memberOptions()}</select></label>
    <label>Amount (QAR)<input id="tfAmount" type="number" min=".01" step=".01" required></label>
    <label>Date<input id="tfDate" type="date" value="${today()}" required></label>
    <label class="full-row">Reason<input id="tfReason" placeholder="Cash handover"></label>
  </div><div class="modal-actions"><button type="button" class="secondary" onclick="closeModal()">Cancel</button><button class="primary">Transfer</button></div></form>`);

  $("transferForm").onsubmit=saveTransfer;
}

async function saveTransfer(ev){
  ev.preventDefault();

  const from=$("tfFrom").value,to=$("tfTo").value,amount=Number($("tfAmount").value);

  if(from===to){toast("From and To must be different.");return}

  const holder=cashByMember().find(x=>x.id===from);

  if(!holder || holder.balance<amount){
    toast("Transfer is greater than available cash.");
    return;
  }

  await requireOk(await sb.from("cash_transactions").insert({
    transaction_date:$("tfDate").value,
    type:"cash_transfer",
    amount,
    from_member_id:from,
    to_member_id:to,
    description:$("tfReason").value||"Cash transfer"
  }));

  closeModal();
  toast("Cash transferred");
  await loadData();
}

function renderExpenses(){
  const q=($("expenseSearch")?.value||"").toLowerCase();

  const rows=state.expenses.filter(e=>
    `${e.category} ${e.description||""} ${e.members?.name||""}`.toLowerCase().includes(q)
  );

  $("expensesTable").innerHTML=rows.length?`<table class="data-table"><thead><tr><th>Date</th><th>Match</th><th>Category</th><th>Amount</th><th>Paid by</th><th>Note</th></tr></thead><tbody>${rows.map(e=>
    `<tr><td>${dateText(e.expense_date)}</td><td>#${state.matches.find(m=>m.id===e.match_id)?.match_number||"—"}</td><td><span class="pill">${esc(e.category)}</span></td><td>${money(e.amount)}</td><td>${esc(e.members?.name||"—")}</td><td>${esc(e.description||"—")}</td></tr>`
  ).join("")}</tbody></table>`:empty("No expenses found.");
}

function openExpenseForm(){
  if(!state.members.length || !state.matches.length){
    toast("Add a member and match first.");
    return;
  }

  openModal(`<h3>Add Expense</h3><form id="expenseForm"><div class="form-grid">
    <label>Date<input id="efDate" type="date" value="${today()}" required></label>
    <label>Match<select id="efMatch">${state.matches.slice().sort((a,b)=>b.match_number-a.match_number).map(m=>`<option value="${m.id}">#${m.match_number} — ${dateText(m.match_date)}</option>`).join("")}</select></label>
    <label>Category<select id="efCat"><option>Ground</option><option>Water</option><option>Equipment</option><option>Food</option><option>Other</option></select></label>
    <label>Amount (QAR)<input id="efAmount" type="number" min=".01" step=".01" required></label>
    <label>Paid by<select id="efPaid">${memberOptions()}</select></label>
    <label class="full-row">Note<input id="efNote" placeholder="Optional"></label>
  </div><div class="modal-actions"><button type="button" class="secondary" onclick="closeModal()">Cancel</button><button class="primary">Save Expense</button></div></form>`);

  $("expenseForm").onsubmit=saveExpense;
}

async function saveExpense(ev){
  ev.preventDefault();

  const match=state.matches.find(m=>m.id===$("efMatch").value);

  const row={
    expense_date:$("efDate").value,
    match_id:$("efMatch").value,
    category:$("efCat").value,
    amount:Number($("efAmount").value),
    paid_by:$("efPaid").value,
    description:$("efNote").value||null
  };

  await requireOk(await sb.from("expenses").insert(row));

  await requireOk(await sb.from("cash_transactions").insert({
    transaction_date:row.expense_date,
    type:"expense_payment",
    amount:row.amount,
    from_member_id:row.paid_by,
    match_id:row.match_id,
    description:`${row.category} — Match #${match.match_number}`
  }));

  closeModal();
  toast("Expense recorded");
  await loadData();
}

function renderReports(){
  const t=totals();

  $("reportCards").innerHTML=
    `<div class="stat-card"><span>Matches</span><strong>${state.matches.length}</strong></div>`+
    `<div class="stat-card"><span>Players participations</span><strong>${state.matches.reduce((s,m)=>s+Number(m.players),0)}</strong></div>`+
    `<div class="stat-card"><span>Total collected</span><strong>${money(t.collected)}</strong></div>`+
    `<div class="stat-card"><span>Net balance</span><strong>${money(t.net)}</strong></div>`;

  $("reportTable").innerHTML=state.matches.length?`<table class="data-table"><thead><tr><th>Match</th><th>Date</th><th>Players</th><th>Collected</th><th>Ground/Other</th><th>Balance</th></tr></thead><tbody>${state.matches.map(m=>{
    const ex=state.expenses.filter(e=>e.match_id===m.id).reduce((s,e)=>s+Number(e.amount),0),b=Number(m.total_collected)-ex;
    return `<tr><td>#${m.match_number}</td><td>${dateText(m.match_date)}</td><td>${m.players}</td><td>${money(m.total_collected)}</td><td>${money(ex)}</td><td class="${b>=0?"positive":"negative"}">${money(b)}</td></tr>`;
  }).join("")}</tbody></table>`:empty("No report data.");
}

function switchPage(page,update=true){
  state.page=page;

  document.querySelectorAll(".page").forEach(x=>x.classList.add("hidden"));
  $(`page-${page}`)?.classList.remove("hidden");

  document.querySelectorAll("[data-page]").forEach(x=>x.classList.toggle("active",x.dataset.page===page));
  if($("pageTitle")) $("pageTitle").textContent=page[0].toUpperCase()+page.slice(1);

  if(update) window.scrollTo({top:0,behavior:"smooth"});
}

function openModal(html){
  $("modalBox").innerHTML=html;
  $("modal").classList.remove("hidden");
}
function closeModal(){
  $("modal").classList.add("hidden");
  $("modalBox").innerHTML="";
}

/* LOGIN */
$("loginForm")?.addEventListener("submit",async e=>{
  e.preventDefault();
  if(!sb)return;

  const {error}=await sb.auth.signInWithPassword({
    email:$("loginEmail").value,
    password:$("loginPassword").value
  });

  if(error)toast(error.message);
});

$("logoutBtn")?.addEventListener("click",async()=>{
  await sb.auth.signOut();
  toast("Signed out");
});

$("refreshBtn")?.addEventListener("click",loadData);
$("addMatchBtn")?.addEventListener("click",openMatchForm);
$("transferBtn")?.addEventListener("click",openTransferForm);
$("addExpenseBtn")?.addEventListener("click",openExpenseForm);
$("exportBtn")?.addEventListener("click",exportCSV);

$("matchSearch")?.addEventListener("input",renderMatches);
$("matchFilter")?.addEventListener("change",renderMatches);
$("expenseSearch")?.addEventListener("input",renderExpenses);

document.addEventListener("click",e=>{
  const b=e.target.closest("[data-page]");
  if(b)switchPage(b.dataset.page);
});

$("modal")?.addEventListener("click",e=>{
  if(e.target.classList.contains("modal-backdrop"))closeModal();
});

function exportCSV(){
  const rows=[["Match","Date","Players","Collected","Expenses","Balance","Notes"]];

  state.matches.forEach(m=>rows.push([
    m.match_number,
    m.match_date,
    m.players,
    m.total_collected,
    state.expenses.filter(e=>e.match_id===m.id).reduce((s,e)=>s+Number(e.amount),0),
    matchBalance(m),
    m.notes||""
  ]));

  const csv=rows.map(r=>r.map(v=>`"${String(v).replaceAll('"','""')}"`).join(",")).join("\n");
  const blob=new Blob([csv],{type:"text/csv;charset=utf-8"});
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a");
  a.href=url;
  a.download="qatar-football-finance.csv";
  a.click();
  URL.revokeObjectURL(url);
}

init();
