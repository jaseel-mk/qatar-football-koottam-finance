/* ============================================================
   QATAR FOOTBALL KOOTTAM - FINANCE APP
   ------------------------------------------------------------
   This file handles:

   1. Supabase connection
   2. User login / logout
   3. Password reset email
   4. Password update after reset
   5. Loading finance data from Supabase
   6. Matches
   7. Expenses
   8. Cash transfers
   9. Dashboard
   10. Reports
   11. CSV export

   IMPORTANT SECURITY NOTES:
   - Never put the Supabase service_role key here.
   - Only use the Supabase publishable/anon key.
   - The password reset page must be added to Supabase
     Authentication > URL Configuration.
   ============================================================ */


/* ============================================================
   1. SUPABASE CONFIGURATION
   ============================================================ */

/*
   Your Supabase project URL.

   IMPORTANT:
   Do NOT add:
       /rest/v1/

   Correct:
       https://soakyzawpmsoxqodskgr.supabase.co
*/
const SUPABASE_URL =
  "https://soakyzawpmsoxqodskgr.supabase.co";


/*
   Supabase publishable key.

   Never use a service_role key in browser JavaScript.
*/
const SUPABASE_KEY =
  "sb_publishable_knMPrkJfZ003rPvb7bRgRA_QJC8DWGJ";


/*
   Password reset page.

   IMPORTANT:
   This must be ONLY the URL.

   DO NOT write:
       redirectTo: "URL"

   The redirectTo property is added later when calling
   resetPasswordForEmail().
*/
const RESET_PAGE_URL =
  "https://jaseel-mk.github.io/qatar-football-koottam-finance/reset.html";


/*
   Check whether Supabase has been configured.

   This prevents the application from trying to connect
   when placeholder values are still being used.
*/
const configured =
  !SUPABASE_URL.startsWith("YOUR_") &&
  !SUPABASE_KEY.startsWith("YOUR_");


/*
   Create the Supabase client.

   persistSession:
   Keeps the user's login session in the browser.

   autoRefreshToken:
   Automatically refreshes the authentication token.

   detectSessionInUrl:
   IMPORTANT for password recovery links.
   Supabase places recovery information in the URL and
   this allows the Supabase client to detect it.
*/
const sb = configured
  ? window.supabase.createClient(
      SUPABASE_URL,
      SUPABASE_KEY,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
        }
      }
    )
  : null;


/* ============================================================
   2. GLOBAL APPLICATION STATE
   ============================================================ */

/*
   All data used by the application is stored here.

   members:
   Active football group members.

   matches:
   Football matches.

   expenses:
   Match-related expenses.

   ledger:
   Cash movements between members.

   page:
   Currently selected application page.
*/
let state = {
  members: [],
  matches: [],
  expenses: [],
  ledger: [],
  page: "dashboard"
};


/* ============================================================
   3. SMALL HELPER FUNCTIONS
   ============================================================ */


/*
   Convert a number into QAR currency format.

   Example:
       money(100)
       -> QAR 100
*/
function money(n) {
  return `QAR ${Number(n || 0).toLocaleString(
    "en-QA",
    {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }
  )}`;
}


/*
   Escape HTML before inserting database values
   into innerHTML.

   This helps prevent unwanted HTML/script injection.
*/
function esc(v) {
  return String(v ?? "").replace(
    /[&<>"']/g,
    m => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    }[m])
  );
}


/*
   Convert a database date into a readable format.

   Example:
       2026-08-19
       -> 19 Aug 2026
*/
function dateText(v) {
  if (!v) return "—";

  return new Date(v + "T00:00:00")
    .toLocaleDateString(
      "en-GB",
      {
        day: "2-digit",
        month: "short",
        year: "numeric"
      }
    );
}


/*
   Display a temporary notification message.
*/
function toast(msg) {
  const t = $("toast");

  if (!t) {
    alert(msg);
    return;
  }

  t.textContent = msg;
  t.classList.add("show");

  setTimeout(
    () => t.classList.remove("show"),
    2400
  );
}


/*
   Get today's date in YYYY-MM-DD format.
*/
function today() {
  return new Date()
    .toISOString()
    .slice(0, 10);
}


/*
   Short helper for document.getElementById().
*/
const $ = id => document.getElementById(id);


/* ============================================================
   4. PASSWORD RESET
   ============================================================ */


/*
   Adds the "Forgot password?" button below the login form.

   The button is created dynamically so we don't need to
   manually add it to index.html.
*/
function addForgotPasswordLink() {

  const form = $("loginForm");

  /*
     Stop if login form doesn't exist.
  */
  if (!form) return;


  /*
     Stop if button was already created.
     This prevents duplicate buttons.
  */
  if ($("forgotPasswordBtn")) return;


  /*
     Create wrapper.
  */
  const wrapper = document.createElement("div");

  wrapper.style.cssText =
    "text-align:center;margin-top:12px;";


  /*
     Create Forgot Password button.
  */
  const btn = document.createElement("button");

  btn.type = "button";
  btn.id = "forgotPasswordBtn";
  btn.textContent = "Forgot password?";

  btn.style.cssText =
    "border:0;" +
    "background:none;" +
    "color:#52786d;" +
    "text-decoration:underline;" +
    "cursor:pointer;" +
    "font-size:14px;" +
    "padding:8px;";


  /*
     When clicked, send password reset email.
  */
  btn.onclick = sendPasswordReset;


  wrapper.appendChild(btn);


  /*
     Put the button underneath the login form.
  */
  form.insertAdjacentElement(
    "afterend",
    wrapper
  );
}


/*
   Send password reset email.

   User must first enter their email in the login email field.
*/
async function sendPasswordReset() {

  /*
     Check Supabase configuration.
  */
  if (!sb) {
    toast("Supabase is not configured.");
    return;
  }


  /*
     Read email from login form.
  */
  const email =
    $("loginEmail")?.value?.trim();


  /*
     Email is required.
  */
  if (!email) {

    toast("Enter your email address first.");

    $("loginEmail")?.focus();

    return;
  }


  try {

    /*
       Ask Supabase to send password reset email.

       IMPORTANT:
       redirectTo tells Supabase where the user should
       be sent after clicking the reset email.

       This URL must also be allowed in:
       Supabase Dashboard
       > Authentication
       > URL Configuration
       > Redirect URLs
    */
    const { error } =
      await sb.auth.resetPasswordForEmail(
        email,
        {
          redirectTo: RESET_PAGE_URL
        }
      );


    /*
       If Supabase returns an error, show it.
    */
    if (error) {

      console.error(
        "Password reset error:",
        error
      );

      toast(error.message);

      return;
    }


    /*
       Password reset email was successfully requested.
    */
    toast(
      "Password reset email sent. Check your email."
    );

  } catch (err) {

    console.error(
      "Password reset exception:",
      err
    );

    toast(
      "Unable to send password reset email."
    );
  }
}


/*
   Update the user's password.

   This function is normally called from reset.html
   after the user opens the reset link.
*/
async function updatePassword(newPassword) {

  /*
     Make sure Supabase is configured.
  */
  if (!sb) {

    toast(
      "Supabase is not configured."
    );

    return false;
  }


  /*
     Password must contain at least 6 characters.
  */
  if (
    !newPassword ||
    newPassword.length < 6
  ) {

    toast(
      "Password must be at least 6 characters."
    );

    return false;
  }


  /*
     Ask Supabase to update the password.
  */
  const { error } =
    await sb.auth.updateUser({
      password: newPassword
    });


  /*
     Handle update error.
  */
  if (error) {

    console.error(
      "Password update error:",
      error
    );

    toast(error.message);

    return false;
  }


  /*
     Password successfully changed.
  */
  toast(
    "Password updated successfully."
  );

  return true;
}


/* ============================================================
   5. APPLICATION INITIALIZATION
   ============================================================ */


/*
   Start the application.
*/
async function init() {

  /*
     If Supabase isn't configured, show configuration warning.
  */
  if (!configured) {

    $("configWarning")
      ?.classList
      .remove("hidden");

    return;
  }


  /*
     Add Forgot Password button.
  */
  addForgotPasswordLink();


  /*
     Ask Supabase whether a valid login session already exists.

     This is important because users should not need to
     login again every time they refresh the page.
  */
  const {
    data: { session }
  } = await sb.auth.getSession();


  /*
     If a session exists, show application.
     Otherwise show login page.
  */
  if (session) {

    await showApp(session);

  } else {

    showAuth();
  }


  /*
     Listen for authentication changes.

     Examples:
       SIGNED_IN
       SIGNED_OUT
       TOKEN_REFRESHED
       PASSWORD_RECOVERY
  */
  sb.auth.onAuthStateChange(
    async (_event, session) => {

      console.log(
        "Auth state changed:",
        _event
      );


      /*
         User is logged in.
      */
      if (session) {

        await showApp(session);

      } else {

        /*
           User is logged out.
        */
        showAuth();
      }
    }
  );
}


/* ============================================================
   6. SHOW LOGIN / SHOW APPLICATION
   ============================================================ */


/*
   Display login screen.
*/
function showAuth() {

  $("authView")
    ?.classList
    .remove("hidden");

  $("appView")
    ?.classList
    .add("hidden");

  addForgotPasswordLink();
}


/*
   Display main application after successful login.
*/
async function showApp(session) {

  $("authView")
    ?.classList
    .add("hidden");

  $("appView")
    ?.classList
    .remove("hidden");


  /*
     Display logged-in user's email.
  */
  if ($("userEmail")) {

    $("userEmail").textContent =
      session.user.email ||
      "Signed in";
  }


  /*
     Load finance data.
  */
  await loadData();
}


/* ============================================================
   7. SUPABASE ERROR HANDLER
   ============================================================ */


/*
   Check Supabase query result.

   If there is an error:
       - log it to browser console
       - show error to user
       - throw the error
*/
async function requireOk(result) {

  if (result.error) {

    console.error(
      result.error
    );

    toast(
      result.error.message
    );

    throw result.error;
  }

  return result.data;
}


/* ============================================================
   8. LOAD ALL DATABASE DATA
   ============================================================ */


/*
   Load all required tables from Supabase.

   Tables:
       members
       matches
       expenses
       cash_transactions
*/
async function loadData() {

  try {

    const [
      m,
      ma,
      e,
      l
    ] = await Promise.all([

      /*
         Active members.
      */
      sb
        .from("members")
        .select("*")
        .eq("active", true)
        .order("name"),


      /*
         Matches.
      */
      sb
        .from("matches")
        .select("*")
        .order(
          "match_number",
          {
            ascending: false
          }
        ),


      /*
         Expenses.

         Also fetch the member who paid.
      */
      sb
        .from("expenses")
        .select(
          "*, members:paid_by(name)"
        )
        .order(
          "expense_date",
          {
            ascending: false
          }
        ),


      /*
         Cash transactions.

         Fetch names of sender and receiver.
      */
      sb
        .from("cash_transactions")
        .select(
          "*, from_member:from_member_id(name), to_member:to_member_id(name)"
        )
        .order(
          "transaction_date",
          {
            ascending: false
          }
        )
    ]);


    /*
       Save database results into application state.
    */
    state.members =
      await requireOk(m) || [];

    state.matches =
      await requireOk(ma) || [];

    state.expenses =
      await requireOk(e) || [];

    state.ledger =
      await requireOk(l) || [];


    /*
       Refresh the user interface.
    */
    render();

  } catch (e) {

    /*
       requireOk() already displays the error.

       We catch it here so the application doesn't crash.
    */
  }
}


/* ============================================================
   9. MATCH BALANCE
   ============================================================ */


/*
   Calculate balance for one match.

   Balance =
       Total collection - Match expenses
*/
function matchBalance(match) {

  const expenses =
    state.expenses
      .filter(
        x => x.match_id === match.id
      )
      .reduce(
        (s, x) =>
          s + Number(x.amount),
        0
      );


  return (
    Number(match.total_collected) -
    expenses
  );
}


/* ============================================================
   10. CASH BALANCE BY MEMBER
   ============================================================ */


/*
   Calculate current cash balance for every member.
*/
function cashByMember() {

  const out = {};


  /*
     Start every active member with zero balance.
  */
  state.members.forEach(m => {

    out[m.id] = {
      ...m,
      balance: 0
    };

  });


  /*
     Process every cash transaction.
  */
  state.ledger.forEach(t => {

    const amount =
      Number(t.amount);


    /*
       Money received.
    */
    if (
      t.to_member_id &&
      out[t.to_member_id]
    ) {

      out[
        t.to_member_id
      ].balance += amount;
    }


    /*
       Money paid/sent.
    */
    if (
      t.from_member_id &&
      out[t.from_member_id]
    ) {

      out[
        t.from_member_id
      ].balance -= amount;
    }

  });


  return Object.values(out);
}


/* ============================================================
   11. TOTALS
   ============================================================ */


/*
   Calculate overall finance totals.
*/
function totals() {

  /*
     Total money collected from matches.
  */
  const collected =
    state.matches.reduce(
      (s, m) =>
        s + Number(m.total_collected),
      0
    );


  /*
     Total expenses.
  */
  const expenses =
    state.expenses.reduce(
      (s, e) =>
        s + Number(e.amount),
      0
    );


  /*
     Total cash currently held by members.
  */
  const cash =
    cashByMember().reduce(
      (s, m) =>
        s + m.balance,
      0
    );


  return {
    collected,
    expenses,
    net: collected - expenses,
    cash
  };
}


/* ============================================================
   12. RENDER ENTIRE APPLICATION
   ============================================================ */


/*
   Refresh all sections of the application.
*/
function render() {

  renderDashboard();

  renderMatches();

  renderCash();

  renderExpenses();

  renderReports();

  switchPage(
    state.page,
    false
  );
}


/* ============================================================
   13. DASHBOARD
   ============================================================ */


function renderDashboard() {

  const t = totals();


  /*
     Update dashboard numbers.
  */
  $("totalCash").textContent =
    money(t.cash);

  $("cashTotal2").textContent =
    money(t.cash);

  $("totalCollected").textContent =
    money(t.collected);

  $("totalExpenses").textContent =
    money(t.expenses);

  $("netBalance").textContent =
    money(t.net);

  $("totalMatches").textContent =
    state.matches.length;


  /*
     Display cash balance for each member.
  */
  const people =
    cashByMember();

  $("cashCards").innerHTML =
    people
      .map(
        p =>
          `<div class="cash-card">
             <div class="person">
               ${esc(p.name)}
             </div>

             <div class="amount">
               ${money(p.balance)}
             </div>
           </div>`
      )
      .join("") ||
    empty("No members");


  /*
     Display cash status.
  */
  $("cashStatus").innerHTML =
    `● ${t.cash >= 0
      ? "Balanced"
      : "Check cash"}`;

  $("cashStatus").className =
    `status ${t.cash >= 0
      ? "ok"
      : ""}`;


  /*
     Display last five matches.
  */
  const recent =
    state.matches.slice(0, 5);

  $("recentMatches").innerHTML =
    recent
      .map(matchCard)
      .join("") ||
    empty("No matches yet.");
}


/*
   Create a small match card.
*/
function matchCard(m) {

  const b =
    matchBalance(m);


  return `
    <div class="match-card">

      <div>
        <strong>
          Match #${m.match_number}
        </strong>

        <div class="match-meta">
          ${dateText(m.match_date)}
          · ${m.players} players
          · Collected ${money(m.total_collected)}
        </div>
      </div>

      <div class="match-balance ${
        b >= 0
          ? "positive"
          : "negative"
      }">
        ${b >= 0 ? "+" : ""}
        ${money(b)}
      </div>

    </div>
  `;
}


/*
   Display an empty-state message.
*/
function empty(text) {

  return `
    <div class="empty">
      ${esc(text)}
    </div>
  `;
}


/* ============================================================
   14. MATCHES PAGE
   ============================================================ */


function renderMatches() {

  const q =
    ($("matchSearch")?.value || "")
      .toLowerCase();

  const f =
    $("matchFilter")?.value ||
    "all";


  /*
     Search matches.
  */
  let rows =
    state.matches.filter(
      m =>
        `${m.match_number} ${m.match_date}`
          .toLowerCase()
          .includes(q)
    );


  /*
     Apply balance filter.
  */
  if (f !== "all") {

    rows =
      rows.filter(
        m =>
          f === "positive"
            ? matchBalance(m) >= 0
            : matchBalance(m) < 0
      );
  }


  /*
     Create table.
  */
  $("matchesTable").innerHTML =
    rows.length
      ? `
        <table class="data-table">

          <thead>
            <tr>
              <th>Match</th>
              <th>Date</th>
              <th>Players</th>
              <th>Collected</th>
              <th>Expenses</th>
              <th>Balance</th>
              <th></th>
            </tr>
          </thead>

          <tbody>

            ${rows.map(m => {

              const ex =
                state.expenses
                  .filter(
                    e =>
                      e.match_id === m.id
                  )
                  .reduce(
                    (s, e) =>
                      s + Number(e.amount),
                    0
                  );

              const b =
                Number(m.total_collected) -
                ex;


              return `
                <tr>

                  <td>
                    <strong>
                      #${m.match_number}
                    </strong>
                  </td>

                  <td>
                    ${dateText(m.match_date)}
                  </td>

                  <td>
                    ${m.players}
                  </td>

                  <td>
                    ${money(m.total_collected)}
                  </td>

                  <td>
                    ${money(ex)}
                  </td>

                  <td class="${
                    b >= 0
                      ? "positive"
                      : "negative"
                  }">

                    <strong>
                      ${money(b)}
                    </strong>

                  </td>

                  <td>
                    <button
                      class="text-btn"
                      onclick='openMatch(${JSON.stringify(m.id)})'>
                      View
                    </button>
                  </td>

                </tr>
              `;

            }).join("")}

          </tbody>

        </table>
      `
      : empty("No matches found.");
}


/* ============================================================
   15. VIEW MATCH DETAILS
   ============================================================ */


function openMatch(id) {

  const m =
    state.matches.find(
      x => x.id === id
    );


  if (!m) return;


  const ex =
    state.expenses.filter(
      e => e.match_id === id
    );


  openModal(`

    <h3>
      Match #${m.match_number}
    </h3>

    <p class="muted">
      ${dateText(m.match_date)}
      · ${m.players} players
    </p>

    <div class="stats-grid">

      <div class="stat-card">
        <span>Collected</span>
        <strong>
          ${money(m.total_collected)}
        </strong>
      </div>

      <div class="stat-card">
        <span>Expenses</span>
        <strong>
          ${money(
            ex.reduce(
              (s, e) =>
                s + Number(e.amount),
              0
            )
          )}
        </strong>
      </div>

      <div class="stat-card">
        <span>Balance</span>
        <strong>
          ${money(matchBalance(m))}
        </strong>
      </div>

      <div class="stat-card">
        <span>Collection/player</span>
        <strong>
          ${money(m.collection_per_player)}
        </strong>
      </div>

    </div>

    <h4>Expenses</h4>

    ${
      ex.map(
        e => `
          <div class="match-card">

            <div>

              <strong>
                ${esc(e.category)}
              </strong>

              <div class="match-meta">
                ${esc(e.paid_by_name || "")}
                ·
                ${esc(e.description || "")}
              </div>

            </div>

            <strong>
              ${money(e.amount)}
            </strong>

          </div>
        `
      ).join("") ||
      empty("No expenses")
    }

  `);
}


/* ============================================================
   16. ADD MATCH FORM
   ============================================================ */


function openMatchForm() {

  /*
     Automatically calculate next match number.
  */
  const next =
    Math.max(
      0,
      ...state.matches.map(
        m => Number(m.match_number)
      )
    ) + 1;


  openModal(`

    <h3>Add Match</h3>

    <form id="matchForm">

      <div class="form-grid">

        <label>
          Match number
          <input
            id="mfNum"
            type="number"
            min="1"
            value="${next}"
            required
          >
        </label>

        <label>
          Date
          <input
            id="mfDate"
            type="date"
            value="${today()}"
            required
          >
        </label>

        <label>
          Players
          <input
            id="mfPlayers"
            type="number"
            min="0"
            value="0"
            required
          >
        </label>

        <label>
          Collection / player
          <input
            id="mfRate"
            type="number"
            min="0"
            step=".01"
            value="10"
            required
          >
        </label>

        <label>
          Collected
          <input
            id="mfCollected"
            type="number"
            min="0"
            step=".01"
            value="0"
            required
          >
        </label>

        <label>
          Collection received by
          <select id="mfReceiver">
            ${memberOptions()}
          </select>
        </label>

        <label class="full-row">
          Notes

          <textarea
            id="mfNotes"
            rows="3"
            placeholder="Optional">
          </textarea>

        </label>

      </div>

      <p class="small muted">
        Total collected is initially
        Players × Collection/player.
        You can adjust it before saving.
      </p>

      <div class="modal-actions">

        <button
          type="button"
          class="secondary"
          onclick="closeModal()">
          Cancel
        </button>

        <button
          class="primary">
          Save Match
        </button>

      </div>

    </form>
  `);


  /*
     Automatically calculate collection.
  */
  $("mfPlayers").addEventListener(
    "input",
    () => {

      $("mfCollected").value =
        (
          Number($("mfPlayers").value) *
          Number($("mfRate").value)
        ).toFixed(2);

    }
  );


  $("mfRate").addEventListener(
    "input",
    () => {

      $("mfCollected").value =
        (
          Number($("mfPlayers").value) *
          Number($("mfRate").value)
        ).toFixed(2);

    }
  );


  $("matchForm").onsubmit =
    saveMatch;
}


/* ============================================================
   17. SAVE MATCH
   ============================================================ */


async function saveMatch(ev) {

  ev.preventDefault();


  /*
     Build database row.
  */
  const row = {

    match_number:
      Number($("mfNum").value),

    match_date:
      $("mfDate").value,

    players:
      Number($("mfPlayers").value),

    collection_per_player:
      Number($("mfRate").value),

    total_collected:
      Number($("mfCollected").value),

    notes:
      $("mfNotes").value || null
  };


  /*
     Insert match into database.
  */
  const m =
    await requireOk(
      await sb
        .from("matches")
        .insert(row)
        .select()
        .single()
    );


  /*
     Find member receiving the collection.
  */
  const receiver =
    $("mfReceiver").value;


  /*
     Add collection to cash ledger.
  */
  if (
    receiver &&
    Number(m.total_collected) > 0
  ) {

    await requireOk(
      await sb
        .from("cash_transactions")
        .insert({

          transaction_date:
            m.match_date,

          type:
            "match_collection",

          amount:
            Number(m.total_collected),

          to_member_id:
            receiver,

          match_id:
            m.id,

          description:
            `Match #${m.match_number} collection`
        })
    );
  }


  closeModal();

  toast(
    "Match added successfully"
  );


  /*
     Refresh data from Supabase.
  */
  await loadData();
}


/* ============================================================
   18. MEMBER OPTIONS
   ============================================================ */


/*
   Generate <option> elements for member dropdowns.
*/
function memberOptions() {

  return state.members
    .map(
      m =>
        `<option value="${m.id}">
          ${esc(m.name)}
        </option>`
    )
    .join("");
}


/* ============================================================
   19. CASH PAGE
   ============================================================ */


function renderCash() {

  const people =
    cashByMember();


  /*
     Member cash cards.
  */
  $("cashPeople").innerHTML =
    people
      .map(
        p =>
          `
          <div class="cash-card">

            <div class="person">
              ${esc(p.name)}
            </div>

            <div class="amount">
              ${money(p.balance)}
            </div>

            <div class="match-meta">
              Current ledger balance
            </div>

          </div>
          `
      )
      .join("") ||
    empty("No members");


  /*
     Cash transaction table.
  */
  $("cashLedger").innerHTML =
    state.ledger.length
      ? `
        <table class="data-table">

          <thead>
            <tr>
              <th>Date</th>
              <th>Type</th>
              <th>Amount</th>
              <th>From</th>
              <th>To</th>
              <th>Description</th>
            </tr>
          </thead>

          <tbody>

            ${state.ledger.map(
              t =>
                `
                <tr>

                  <td>
                    ${dateText(
                      t.transaction_date
                    )}
                  </td>

                  <td>
                    <span class="pill">
                      ${esc(
                        t.type.replaceAll(
                          "_",
                          " "
                        )
                      )}
                    </span>
                  </td>

                  <td>
                    ${money(t.amount)}
                  </td>

                  <td>
                    ${esc(
                      t.from_member?.name ||
                      "—"
                    )}
                  </td>

                  <td>
                    ${esc(
                      t.to_member?.name ||
                      "—"
                    )}
                  </td>

                  <td>
                    ${esc(
                      t.description ||
                      "—"
                    )}
                  </td>

                </tr>
                `
            ).join("")}

          </tbody>

        </table>
      `
      : empty(
          "No cash transactions yet."
        );
}


/* ============================================================
   20. CASH TRANSFER FORM
   ============================================================ */


function openTransferForm() {

  /*
     At least two members are required.
  */
  if (state.members.length < 2) {

    toast(
      "Add at least two members first."
    );

    return;
  }


  openModal(`

    <h3>Transfer Cash</h3>

    <form id="transferForm">

      <div class="form-grid">

        <label>
          From
          <select id="tfFrom">
            ${memberOptions()}
          </select>
        </label>

        <label>
          To
          <select id="tfTo">
            ${memberOptions()}
          </select>
        </label>

        <label>
          Amount (QAR)
          <input
            id="tfAmount"
            type="number"
            min=".01"
            step=".01"
            required
          >
        </label>

        <label>
          Date
          <input
            id="tfDate"
            type="date"
            value="${today()}"
            required
          >
        </label>

        <label class="full-row">
          Reason
          <input
            id="tfReason"
            placeholder="Cash handover"
          >
        </label>

      </div>

      <div class="modal-actions">

        <button
          type="button"
          class="secondary"
          onclick="closeModal()">
          Cancel
        </button>

        <button class="primary">
          Transfer
        </button>

      </div>

    </form>
  `);


  $("transferForm").onsubmit =
    saveTransfer;
}


/* ============================================================
   21. SAVE CASH TRANSFER
   ============================================================ */


async function saveTransfer(ev) {

  ev.preventDefault();


  const from =
    $("tfFrom").value;

  const to =
    $("tfTo").value;

  const amount =
    Number($("tfAmount").value);


  /*
     Sender and receiver cannot be same person.
  */
  if (from === to) {

    toast(
      "From and To must be different."
    );

    return;
  }


  /*
     Find sender's current balance.
  */
  const holder =
    cashByMember()
      .find(
        x => x.id === from
      );


  /*
     Prevent transfer greater than available cash.
  */
  if (
    !holder ||
    holder.balance < amount
  ) {

    toast(
      "Transfer is greater than available cash."
    );

    return;
  }


  /*
     Insert transfer into ledger.
  */
  await requireOk(
    await sb
      .from("cash_transactions")
      .insert({

        transaction_date:
          $("tfDate").value,

        type:
          "cash_transfer",

        amount,

        from_member_id:
          from,

        to_member_id:
          to,

        description:
          $("tfReason").value ||
          "Cash transfer"
      })
  );


  closeModal();

  toast(
    "Cash transferred"
  );


  await loadData();
}


/* ============================================================
   22. EXPENSES PAGE
   ============================================================ */


function renderExpenses() {

  const q =
    ($("expenseSearch")?.value || "")
      .toLowerCase();


  /*
     Filter expenses based on search text.
  */
  const rows =
    state.expenses.filter(
      e =>
        `${e.category}
         ${e.description || ""}
         ${e.members?.name || ""}`
          .toLowerCase()
          .includes(q)
    );


  /*
     Create expense table.
  */
  $("expensesTable").innerHTML =
    rows.length
      ? `
        <table class="data-table">

          <thead>
            <tr>
              <th>Date</th>
              <th>Match</th>
              <th>Category</th>
              <th>Amount</th>
              <th>Paid by</th>
              <th>Note</th>
            </tr>
          </thead>

          <tbody>

            ${rows.map(
              e =>
                `
                <tr>

                  <td>
                    ${dateText(
                      e.expense_date
                    )}
                  </td>

                  <td>
                    #${
                      state.matches.find(
                        m =>
                          m.id ===
                          e.match_id
                      )?.match_number ||
                      "—"
                    }
                  </td>

                  <td>
                    <span class="pill">
                      ${esc(e.category)}
                    </span>
                  </td>

                  <td>
                    ${money(e.amount)}
                  </td>

                  <td>
                    ${esc(
                      e.members?.name ||
                      "—"
                    )}
                  </td>

                  <td>
                    ${esc(
                      e.description ||
                      "—"
                    )}
                  </td>

                </tr>
                `
            ).join("")}

          </tbody>

        </table>
      `
      : empty(
          "No expenses found."
        );
}


/* ============================================================
   23. ADD EXPENSE FORM
   ============================================================ */


function openExpenseForm() {

  /*
     A member and match are required before
     an expense can be recorded.
  */
  if (
    !state.members.length ||
    !state.matches.length
  ) {

    toast(
      "Add a member and match first."
    );

    return;
  }


  openModal(`

    <h3>Add Expense</h3>

    <form id="expenseForm">

      <div class="form-grid">

        <label>
          Date
          <input
            id="efDate"
            type="date"
            value="${today()}"
            required
          >
        </label>

        <label>
          Match

          <select id="efMatch">

            ${
              state.matches
                .slice()
                .sort(
                  (a, b) =>
                    b.match_number -
                    a.match_number
                )
                .map(
                  m =>
                    `
                    <option value="${m.id}">
                      #${m.match_number}
                      —
                      ${dateText(
                        m.match_date
                      )}
                    </option>
                    `
                )
                .join("")
            }

          </select>

        </label>

        <label>
          Category

          <select id="efCat">
            <option>Ground</option>
            <option>Water</option>
            <option>Equipment</option>
            <option>Food</option>
            <option>Other</option>
          </select>

        </label>

        <label>
          Amount (QAR)

          <input
            id="efAmount"
            type="number"
            min=".01"
            step=".01"
            required
          >

        </label>

        <label>
          Paid by

          <select id="efPaid">
            ${memberOptions()}
          </select>

        </label>

        <label class="full-row">
          Note

          <input
            id="efNote"
            placeholder="Optional"
          >

        </label>

      </div>

      <div class="modal-actions">

        <button
          type="button"
          class="secondary"
          onclick="closeModal()">
          Cancel
        </button>

        <button class="primary">
          Save Expense
        </button>

      </div>

    </form>
  `);


  $("expenseForm").onsubmit =
    saveExpense;
}


/* ============================================================
   24. SAVE EXPENSE
   ============================================================ */


async function saveExpense(ev) {

  ev.preventDefault();


  const match =
    state.matches.find(
      m =>
        m.id ===
        $("efMatch").value
    );


  /*
     Create expense record.
  */
  const row = {

    expense_date:
      $("efDate").value,

    match_id:
      $("efMatch").value,

    category:
      $("efCat").value,

    amount:
      Number($("efAmount").value),

    paid_by:
      $("efPaid").value,

    description:
      $("efNote").value ||
      null
  };


  /*
     Save expense to expenses table.
  */
  await requireOk(
    await sb
      .from("expenses")
      .insert(row)
  );


  /*
     Also create a cash transaction.

     Because the selected member paid the expense,
     money leaves that member's cash balance.
  */
  await requireOk(
    await sb
      .from("cash_transactions")
      .insert({

        transaction_date:
          row.expense_date,

        type:
          "expense_payment",

        amount:
          row.amount,

        from_member_id:
          row.paid_by,

        match_id:
          row.match_id,

        description:
          `${row.category} — Match #${match.match_number}`
      })
  );


  closeModal();

  toast(
    "Expense recorded"
  );


  await loadData();
}


/* ============================================================
   25. REPORTS
   ============================================================ */


function renderReports() {

  const t =
    totals();


  /*
     Summary report cards.
  */
  $("reportCards").innerHTML =

    `
    <div class="stat-card">
      <span>Matches</span>
      <strong>
        ${state.matches.length}
      </strong>
    </div>
    ` +

    `
    <div class="stat-card">
      <span>
        Players participations
      </span>

      <strong>
        ${
          state.matches.reduce(
            (s, m) =>
              s + Number(m.players),
            0
          )
        }
      </strong>
    </div>
    ` +

    `
    <div class="stat-card">
      <span>Total collected</span>

      <strong>
        ${money(t.collected)}
      </strong>
    </div>
    ` +

    `
    <div class="stat-card">
      <span>Net balance</span>

      <strong>
        ${money(t.net)}
      </strong>
    </div>
    `;


  /*
     Match-by-match report table.
  */
  $("reportTable").innerHTML =
    state.matches.length
      ? `
        <table class="data-table">

          <thead>
            <tr>
              <th>Match</th>
              <th>Date</th>
              <th>Players</th>
              <th>Collected</th>
              <th>Ground/Other</th>
              <th>Balance</th>
            </tr>
          </thead>

          <tbody>

            ${state.matches.map(
              m => {

                const ex =
                  state.expenses
                    .filter(
                      e =>
                        e.match_id ===
                        m.id
                    )
                    .reduce(
                      (s, e) =>
                        s +
                        Number(e.amount),
                      0
                    );

                const b =
                  Number(
                    m.total_collected
                  ) - ex;


                return `
                  <tr>

                    <td>
                      #${m.match_number}
                    </td>

                    <td>
                      ${dateText(
                        m.match_date
                      )}
                    </td>

                    <td>
                      ${m.players}
                    </td>

                    <td>
                      ${money(
                        m.total_collected
                      )}
                    </td>

                    <td>
                      ${money(ex)}
                    </td>

                    <td class="${
                      b >= 0
                        ? "positive"
                        : "negative"
                    }">

                      ${money(b)}

                    </td>

                  </tr>
                `;
              }
            ).join("")}

          </tbody>

        </table>
      `
      : empty(
          "No report data."
        );
}


/* ============================================================
   26. PAGE NAVIGATION
   ============================================================ */


function switchPage(
  page,
  update = true
) {

  state.page = page;


  /*
     Hide all pages.
  */
  document
    .querySelectorAll(".page")
    .forEach(
      x =>
        x.classList.add("hidden")
    );


  /*
     Show selected page.
  */
  $(`page-${page}`)
    ?.classList
    .remove("hidden");


  /*
     Update navigation buttons.
  */
  document
    .querySelectorAll("[data-page]")
    .forEach(
      x =>
        x.classList.toggle(
          "active",
          x.dataset.page === page
        )
    );


  /*
     Update page title.
  */
  if ($("pageTitle")) {

    $("pageTitle").textContent =
      page[0].toUpperCase() +
      page.slice(1);
  }


  /*
     Scroll to top when user changes page.
  */
  if (update) {

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  }
}


/* ============================================================
   27. MODAL FUNCTIONS
   ============================================================ */


/*
   Open modal window.
*/
function openModal(html) {

  $("modalBox").innerHTML =
    html;

  $("modal")
    .classList
    .remove("hidden");
}


/*
   Close modal window.
*/
function closeModal() {

  $("modal")
    .classList
    .add("hidden");

  $("modalBox").innerHTML = "";
}


/* ============================================================
   28. LOGIN
   ============================================================ */


/*
   Login form.

   Supabase checks the email/password combination.
*/
$("loginForm")
  ?.addEventListener(
    "submit",
    async e => {

      e.preventDefault();


      /*
         Make sure Supabase is available.
      */
      if (!sb) return;


      /*
         Get login credentials.
      */
      const email =
        $("loginEmail")
          .value
          .trim();

      const password =
        $("loginPassword")
          .value;


      /*
         Attempt login.
      */
      const {
        error
      } =
        await sb.auth.signInWithPassword({
          email,
          password
        });


      /*
         Display login error.
      */
      if (error) {

        console.error(
          "Login error:",
          error
        );

        toast(
          error.message
        );
      }

    }
  );


/* ============================================================
   29. LOGOUT
   ============================================================ */


$("logoutBtn")
  ?.addEventListener(
    "click",
    async () => {

      /*
         Sign out from Supabase.
      */
      await sb.auth.signOut();

      toast(
        "Signed out"
      );
    }
  );


/* ============================================================
   30. BUTTON EVENT LISTENERS
   ============================================================ */


/*
   Refresh button.
*/
$("refreshBtn")
  ?.addEventListener(
    "click",
    loadData
  );


/*
   Add match button.
*/
$("addMatchBtn")
  ?.addEventListener(
    "click",
    openMatchForm
  );


/*
   Transfer cash button.
*/
$("transferBtn")
  ?.addEventListener(
    "click",
    openTransferForm
  );


/*
   Add expense button.
*/
$("addExpenseBtn")
  ?.addEventListener(
    "click",
    openExpenseForm
  );


/*
   Export CSV button.
*/
$("exportBtn")
  ?.addEventListener(
    "click",
    exportCSV
  );


/*
   Match search.
*/
$("matchSearch")
  ?.addEventListener(
    "input",
    renderMatches
  );


/*
   Match filter.
*/
$("matchFilter")
  ?.addEventListener(
    "change",
    renderMatches
  );


/*
   Expense search.
*/
$("expenseSearch")
  ?.addEventListener(
    "input",
    renderExpenses
  );


/* ============================================================
   31. PAGE NAVIGATION CLICK HANDLER
   ============================================================ */


document.addEventListener(
  "click",
  e => {

    /*
       Find closest navigation element.
    */
    const b =
      e.target.closest(
        "[data-page]"
      );


    /*
       Change page if found.
    */
    if (b) {

      switchPage(
        b.dataset.page
      );
    }

  }
);


/* ============================================================
   32. CLOSE MODAL WHEN CLICKING BACKDROP
   ============================================================ */


$("modal")
  ?.addEventListener(
    "click",
    e => {

      /*
         Only close when the actual backdrop
         is clicked, not the modal content.
      */
      if (
        e.target.classList
          .contains("modal-backdrop")
      ) {

        closeModal();
      }

    }
  );


/* ============================================================
   33. EXPORT DATA TO CSV
   ============================================================ */


function exportCSV() {

  /*
     CSV header row.
  */
  const rows = [
    [
      "Match",
      "Date",
      "Players",
      "Collected",
      "Expenses",
      "Balance",
      "Notes"
    ]
  ];


  /*
     Add every match to CSV.
  */
  state.matches.forEach(
    m => {

      rows.push([

        m.match_number,

        m.match_date,

        m.players,

        m.total_collected,

        state.expenses
          .filter(
            e =>
              e.match_id ===
              m.id
          )
          .reduce(
            (s, e) =>
              s + Number(e.amount),
            0
          ),

        matchBalance(m),

        m.notes || ""
      ]);

    }
  );


  /*
     Convert rows to CSV text.
  */
  const csv =
    rows
      .map(
        r =>
          r
            .map(
              v =>
                `"${String(v)
                  .replaceAll(
                    '"',
                    '""'
                  )}"`
            )
            .join(",")
      )
      .join("\n");


  /*
     Create downloadable file.
  */
  const blob =
    new Blob(
      [csv],
      {
        type:
          "text/csv;charset=utf-8"
      }
    );


  const url =
    URL.createObjectURL(
      blob
    );


  /*
     Create temporary download link.
  */
  const a =
    document.createElement(
      "a"
    );

  a.href = url;

  a.download =
    "qatar-football-finance.csv";


  /*
     Start download.
  */
  a.click();


  /*
     Release temporary URL.
  */
  URL.revokeObjectURL(
    url
  );
}


/* ============================================================
   34. START APPLICATION
   ============================================================ */

init();