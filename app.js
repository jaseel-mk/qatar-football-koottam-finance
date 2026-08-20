/* ============================================================
   QATAR FOOTBALL KOOTTAM FINANCE
   ------------------------------------------------------------
   Main JavaScript file

   FEATURES:
   1. Supabase authentication
   2. Login / logout
   3. Forgot password
   4. Password reset redirect
   5. Members
   6. Add / deactivate members
   7. Matches
   8. Expenses
   9. Cash transactions
   10. Dashboard
   11. Reports
   12. CSV export

   IMPORTANT:
   - SUPABASE_URL must be your project URL.
   - Do NOT add /rest/v1/ to the URL.
   - Never put the Supabase service_role key in this file.
   - Only use the publishable/anon key in frontend code.

   NEW MEMBER FEATURE:
   - Members can be added from the Cash page.
   - New members start with QAR 0 cash.
   - Members automatically appear in transfer,
     expense and collection-receiver dropdowns.
   - Members are deactivated instead of deleted so
     historical transactions remain safe.
============================================================ */


/* ============================================================
   1. SUPABASE CONFIGURATION
============================================================ */

// Your Supabase project URL
const SUPABASE_URL =
  "https://soakyzawpmsoxqodskgr.supabase.co";

// Your Supabase publishable/anon key
const SUPABASE_KEY =
  "sb_publishable_knMPrkJfZ003rPvb7bRgRA_QJC8DWGJ";


/* ============================================================
   2. PASSWORD RESET PAGE
============================================================ */

const RESET_PAGE_URL =
  "https://jaseel-mk.github.io/qatar-football-koottam-finance/reset.html";


/* ============================================================
   3. CHECK WHETHER SUPABASE IS CONFIGURED
============================================================ */

const configured =
  !SUPABASE_URL.startsWith("YOUR_") &&
  !SUPABASE_KEY.startsWith("YOUR_");


/* ============================================================
   4. CREATE SUPABASE CLIENT
============================================================ */

const sb = configured
  ? window.supabase.createClient(
      SUPABASE_URL,
      SUPABASE_KEY,
      {
        auth: {
          // Keep the user logged in after refreshing the page.
          persistSession: true,

          // Automatically refresh expired sessions.
          autoRefreshToken: true,

          // Detect authentication/password-reset links.
          detectSessionInUrl: true
        }
      }
    )
  : null;


/* ============================================================
   5. APPLICATION STATE
============================================================ */

const $ = id => document.getElementById(id);

let state = {
  members: [],
  matches: [],
  expenses: [],
  ledger: [],
  page: "dashboard"
};


/* ============================================================
   6. GENERAL HELPER FUNCTIONS
============================================================ */


/*
 * Format an amount as QAR.
 *
 * Example:
 * 150     -> QAR 150
 * 150.50  -> QAR 150.50
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
 * Escape HTML characters.
 *
 * This prevents user-entered text from being interpreted
 * as HTML when inserted into the page.
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
 * Convert YYYY-MM-DD into a readable date.
 *
 * Example:
 * 2026-08-19
 * becomes:
 * 19 Aug 2026
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
 * Display a temporary notification.
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
 * Return today's date in YYYY-MM-DD format.
 */
function today() {

  return new Date()
    .toISOString()
    .slice(0, 10);
}


/* ============================================================
   7. PASSWORD RESET
============================================================ */


/*
 * Add "Forgot password?" below the login form.
 *
 * The button is created with JavaScript so the existing
 * index.html does not need a separate forgot-password button.
 */
function addForgotPasswordLink() {

  const form = $("loginForm");

  if (!form) return;

  // Don't create it twice.
  if ($("forgotPasswordBtn")) return;


  const wrapper =
    document.createElement("div");

  wrapper.style.cssText =
    "text-align:center;" +
    "margin-top:12px;";


  const btn =
    document.createElement("button");

  btn.type = "button";

  btn.id = "forgotPasswordBtn";

  btn.textContent =
    "Forgot password?";

  btn.style.cssText =
    "border:0;" +
    "background:none;" +
    "color:#52786d;" +
    "text-decoration:underline;" +
    "cursor:pointer;" +
    "font-size:14px;" +
    "padding:8px;";


  btn.onclick =
    sendPasswordReset;


  wrapper.appendChild(btn);

  form.insertAdjacentElement(
    "afterend",
    wrapper
  );
}


/*
 * Send password reset email.
 */
async function sendPasswordReset() {

  if (!sb) {

    toast(
      "Supabase is not configured."
    );

    return;
  }


  const email =
    $("loginEmail")?.value?.trim();


  if (!email) {

    toast(
      "Enter your email address first."
    );

    $("loginEmail")?.focus();

    return;
  }


  try {

    const { error } =
      await sb.auth.resetPasswordForEmail(
        email,
        {
          redirectTo: RESET_PAGE_URL
        }
      );


    if (error) {

      console.error(
        "Password reset error:",
        error
      );

      toast(error.message);

      return;
    }


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
 * Update user's password.
 *
 * This function can also be used by reset.html.
 */
async function updatePassword(newPassword) {

  if (!sb) {

    toast(
      "Supabase is not configured."
    );

    return false;
  }


  if (
    !newPassword ||
    newPassword.length < 6
  ) {

    toast(
      "Password must be at least 6 characters."
    );

    return false;
  }


  const { error } =
    await sb.auth.updateUser({
      password: newPassword
    });


  if (error) {

    console.error(
      "Password update error:",
      error
    );

    toast(error.message);

    return false;
  }


  toast(
    "Password updated successfully."
  );

  return true;
}


/* ============================================================
   8. APPLICATION INITIALIZATION
============================================================ */

async function init() {

  /*
   * If Supabase configuration is missing,
   * show configuration warning.
   */
  if (!configured) {

    $("configWarning")
      ?.classList
      .remove("hidden");

    return;
  }


  // Add Forgot Password link.
  addForgotPasswordLink();


  /*
   * Check whether a user is already logged in.
   */
  const {
    data: { session }
  } = await sb.auth.getSession();


  /*
   * Show correct screen.
   */
  if (session) {

    showApp(session);

  } else {

    showAuth();

  }


  /*
   * Listen for authentication changes.
   */
  sb.auth.onAuthStateChange(
    (_event, session) => {

      if (session) {

        showApp(session);

      } else {

        showAuth();

      }

    }
  );
}


/* ============================================================
   9. SHOW LOGIN PAGE
============================================================ */

function showAuth() {

  $("authView")
    ?.classList
    .remove("hidden");

  $("appView")
    ?.classList
    .add("hidden");


  addForgotPasswordLink();
}


/* ============================================================
   10. SHOW MAIN APPLICATION
============================================================ */

async function showApp(session) {

  $("authView")
    ?.classList
    .add("hidden");

  $("appView")
    ?.classList
    .remove("hidden");


  /*
   * Display logged-in user's email.
   */
  if ($("userEmail")) {

    $("userEmail").textContent =
      session.user.email ||
      "Signed in";

  }


  /*
   * Load finance data.
   */
  await loadData();
}


/* ============================================================
   11. SUPABASE ERROR HANDLER
============================================================ */

async function requireOk(result) {

  if (result.error) {

    console.error(result.error);

    toast(
      result.error.message
    );

    throw result.error;
  }

  return result.data;
}


/* ============================================================
   12. LOAD DATA FROM SUPABASE
============================================================ */

async function loadData() {

  try {

    /*
     * Load all required tables simultaneously.
     */
    const [
      m,
      ma,
      e,
      l
    ] = await Promise.all([

      /*
       * Active members.
       *
       * Only active members appear in the application.
       */
      sb
        .from("members")
        .select("*")
        .eq("active", true)
        .order("name"),


      /*
       * Matches.
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
       * Expenses.
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
       * Cash ledger.
       *
       * IMPORTANT:
       * Both from_member and to_member now request
       * the member name.
       */
      sb
        .from("cash_transactions")
        .select(`
          *,
          from_member:from_member_id(name),
          to_member:to_member_id(name)
        `)
        .order(
          "transaction_date",
          {
            ascending: false
          }
        )

    ]);


    /*
     * Store results.
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
     * Refresh interface.
     */
    render();

  } catch (e) {

    console.error(
      "Data loading error:",
      e
    );
  }
}


/* ============================================================
   13. MATCH BALANCE
============================================================ */

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
   14. CASH BALANCE BY MEMBER
============================================================ */

function cashByMember() {

  const out = {};


  /*
   * Start every active member with QAR 0.
   *
   * This is what allows newly added members to
   * automatically appear with a zero balance.
   */
  state.members.forEach(m => {

    out[m.id] = {
      ...m,
      balance: 0
    };

  });


  /*
   * Apply every cash transaction.
   */
  state.ledger.forEach(t => {

    const amount =
      Number(t.amount);


    /*
     * Money received.
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
     * Money paid/transferred.
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
   15. TOTAL FINANCE VALUES
============================================================ */

function totals() {

  const collected =
    state.matches.reduce(
      (s, m) =>
        s +
        Number(m.total_collected),
      0
    );


  const expenses =
    state.expenses.reduce(
      (s, e) =>
        s +
        Number(e.amount),
      0
    );


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
   16. MAIN RENDER FUNCTION
============================================================ */

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
   17. DASHBOARD
============================================================ */

function renderDashboard() {

  const t = totals();


  if ($("totalCash"))
    $("totalCash").textContent =
      money(t.cash);


  if ($("cashTotal2"))
    $("cashTotal2").textContent =
      money(t.cash);


  if ($("totalCollected"))
    $("totalCollected").textContent =
      money(t.collected);


  if ($("totalExpenses"))
    $("totalExpenses").textContent =
      money(t.expenses);


  if ($("netBalance"))
    $("netBalance").textContent =
      money(t.net);


  if ($("totalMatches"))
    $("totalMatches").textContent =
      state.matches.length;


  /*
   * Display cash balance for every active member.
   */
  const people =
    cashByMember();


  if ($("cashCards")) {

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

  }


  /*
   * Cash status.
   */
  if ($("cashStatus")) {

    $("cashStatus").innerHTML =
      `● ${
        t.cash >= 0
          ? "Balanced"
          : "Check cash"
      }`;

    $("cashStatus").className =
      `status ${
        t.cash >= 0
          ? "ok"
          : ""
      }`;

  }


  /*
   * Show latest five matches.
   */
  const recent =
    state.matches.slice(0, 5);


  if ($("recentMatches")) {

    $("recentMatches").innerHTML =
      recent
        .map(
          m => matchCard(m)
        )
        .join("") ||
      empty("No matches yet.");

  }
}


/* ============================================================
   18. MATCH CARD
============================================================ */

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
          ·
          ${m.players} players
          ·
          Collected ${money(m.total_collected)}
        </div>

      </div>

      <div
        class="match-balance ${
          b >= 0
            ? "positive"
            : "negative"
        }"
      >
        ${
          b >= 0
            ? "+"
            : ""
        }${money(b)}
      </div>

    </div>
  `;
}


/* ============================================================
   19. EMPTY STATE
============================================================ */

function empty(text) {

  return `
    <div class="empty">
      ${esc(text)}
    </div>
  `;
}


/* ============================================================
   20. MATCHES PAGE
============================================================ */

function renderMatches() {

  const q =
    (
      $("matchSearch")
        ?.value || ""
    ).toLowerCase();


  const f =
    $("matchFilter")
      ?.value || "all";


  let rows =
    state.matches.filter(
      m =>
        `${m.match_number} ${m.match_date}`
          .toLowerCase()
          .includes(q)
    );


  /*
   * Filter by balance.
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


  if (!$("matchesTable"))
    return;


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

            ${rows
              .map(m => {

                const ex =
                  state.expenses
                    .filter(
                      e =>
                        e.match_id === m.id
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
                      <strong>
                        #${m.match_number}
                      </strong>
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

                    <td
                      class="${
                        b >= 0
                          ? "positive"
                          : "negative"
                      }"
                    >
                      <strong>
                        ${money(b)}
                      </strong>
                    </td>

                    <td>

                      <button
                        class="text-btn"
                        onclick='openMatch(${JSON.stringify(m.id)})'
                      >
                        View
                      </button>

                    </td>

                  </tr>
                `;

              })
              .join("")}

          </tbody>

        </table>
      `

      : empty(
          "No matches found."
        );
}


/* ============================================================
   21. VIEW MATCH
============================================================ */

function openMatch(id) {

  const m =
    state.matches.find(
      x => x.id === id
    );


  if (!m)
    return;


  const ex =
    state.expenses.filter(
      e =>
        e.match_id === id
    );


  openModal(`

    <h3>
      Match #${m.match_number}
    </h3>

    <p class="muted">
      ${dateText(m.match_date)}
      ·
      ${m.players} players
    </p>


    <div class="stats-grid">

      <div class="stat-card">
        <span>Collected</span>
        <strong>
          ${money(
            m.total_collected
          )}
        </strong>
      </div>


      <div class="stat-card">
        <span>Expenses</span>
        <strong>
          ${money(
            ex.reduce(
              (s,e) =>
                s + Number(e.amount),
              0
            )
          )}
        </strong>
      </div>


      <div class="stat-card">
        <span>Balance</span>
        <strong>
          ${money(
            matchBalance(m)
          )}
        </strong>
      </div>


      <div class="stat-card">
        <span>
          Collection/player
        </span>

        <strong>
          ${money(
            m.collection_per_player
          )}
        </strong>
      </div>

    </div>


    <h4>
      Expenses
    </h4>


    ${
      ex
        .map(
          e =>
            `
            <div class="match-card">

              <div>

                <strong>
                  ${esc(e.category)}
                </strong>

                <div class="match-meta">
                  ${esc(
                    e.paid_by_name || ""
                  )}
                  ·
                  ${esc(
                    e.description || ""
                  )}
                </div>

              </div>

              <strong>
                ${money(e.amount)}
              </strong>

            </div>
            `
        )
        .join("") ||
      empty("No expenses")
    }

  `);
}


/* ============================================================
   22. ADD MATCH FORM
============================================================ */

function openMatchForm() {

  const next =
    Math.max(
      0,
      ...state.matches.map(
        m =>
          Number(
            m.match_number
          )
      )
    ) + 1;


  openModal(`

    <h3>
      Add Match
    </h3>


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
            placeholder="Optional"
          ></textarea>

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
          onclick="closeModal()"
        >
          Cancel
        </button>


        <button
          class="primary"
        >
          Save Match
        </button>

      </div>

    </form>

  `);


  /*
   * Automatically calculate collection.
   */
  const updateCollected =
    () => {

      $("mfCollected").value =
        (
          Number(
            $("mfPlayers").value
          ) *
          Number(
            $("mfRate").value
          )
        ).toFixed(2);

    };


  $("mfPlayers")
    ?.addEventListener(
      "input",
      updateCollected
    );


  $("mfRate")
    ?.addEventListener(
      "input",
      updateCollected
    );


  $("matchForm").onsubmit =
    saveMatch;
}


/* ============================================================
   23. SAVE MATCH
============================================================ */

async function saveMatch(ev) {

  ev.preventDefault();


  const row = {

    match_number:
      Number(
        $("mfNum").value
      ),

    match_date:
      $("mfDate").value,

    players:
      Number(
        $("mfPlayers").value
      ),

    collection_per_player:
      Number(
        $("mfRate").value
      ),

    total_collected:
      Number(
        $("mfCollected").value
      ),

    notes:
      $("mfNotes").value ||
      null

  };


  /*
   * Insert match.
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
   * Record who received the collection.
   */
  const receiver =
    $("mfReceiver").value;


  if (
    receiver &&
    Number(
      m.total_collected
    ) > 0
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
            Number(
              m.total_collected
            ),

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

  await loadData();
}


/* ============================================================
   24. MEMBER OPTIONS
============================================================ */


/*
 * Generate options for active members.
 *
 * This is used in:
 * - Match collection receiver
 * - Cash transfer From
 * - Cash transfer To
 * - Expense Paid by
 */
function memberOptions() {

  if (!state.members.length) {

    return `
      <option value="">
        No active members
      </option>
    `;

  }


  return state.members
    .map(
      m =>
        `<option value="${esc(m.id)}">
          ${esc(m.name)}
        </option>`
    )
    .join("");
}


/* ============================================================
   25. ADD MEMBER
============================================================ */


/*
 * Open Add Member form.
 *
 * New members are stored in the existing
 * public.members table.
 *
 * No cash transaction is created here.
 * Therefore the new member automatically starts
 * with QAR 0.
 */
function openAddMemberForm() {

  openModal(`

    <h3>
      Add Member
    </h3>

    <p class="muted">
      Add a new person who can hold or receive
      football group cash.
    </p>


    <form id="memberForm">

      <div class="form-grid">

        <label class="full-row">

          Member name

          <input
            id="memberName"
            type="text"
            maxlength="100"
            placeholder="Enter member name"
            autocomplete="off"
            required
          >

        </label>

      </div>


      <p class="small muted">
        The new member will start with
        QAR 0 cash.
      </p>


      <div class="modal-actions">

        <button
          type="button"
          class="secondary"
          onclick="closeModal()"
        >
          Cancel
        </button>


        <button
          type="submit"
          class="primary"
        >
          Add Member
        </button>

      </div>

    </form>

  `);


  $("memberForm").onsubmit =
    saveMember;


  /*
   * Automatically focus the name field.
   */
  setTimeout(
    () => $("memberName")?.focus(),
    50
  );
}


/*
 * Save a new member.
 */
async function saveMember(ev) {

  ev.preventDefault();


  const name =
    $("memberName")
      ?.value
      ?.trim();


  /*
   * Validate name.
   */
  if (!name) {

    toast(
      "Enter a member name."
    );

    return;
  }


  /*
   * Check against currently loaded members.
   *
   * The database also has a UNIQUE constraint on name,
   * so this is only a friendly first check.
   */
  const duplicate =
    state.members.some(
      m =>
        m.name.trim().toLowerCase() ===
        name.toLowerCase()
    );


  if (duplicate) {

    toast(
      "This member already exists."
    );

    return;
  }


  try {

    /*
     * Insert new active member.
     *
     * No cash transaction is inserted.
     * Therefore the starting cash is QAR 0.
     */
    await requireOk(
      await sb
        .from("members")
        .insert({
          name,
          active: true
        })
    );


    closeModal();

    toast(
      `${name} added successfully`
    );


    /*
     * Reload members and all finance data.
     */
    await loadData();

    /*
     * Return to Cash page so the newly added
     * member is immediately visible.
     */
    switchPage("cash");

  } catch (error) {

    /*
     * PostgreSQL UNIQUE constraint may catch a duplicate
     * that was added by another user at the same time.
     */
    if (
      String(
        error?.message || ""
      ).toLowerCase().includes(
        "duplicate"
      )
    ) {

      toast(
        "A member with this name already exists."
      );

    } else {

      console.error(
        "Add member error:",
        error
      );

    }

  }
}


/* ============================================================
   26. DEACTIVATE MEMBER
============================================================ */


/*
 * Deactivate a member instead of deleting them.
 *
 * IMPORTANT:
 * We do NOT delete the member because historical
 * cash transactions and expenses may reference them.
 *
 * Their old transactions remain in the database.
 * They simply disappear from the active member list.
 */
async function deactivateMember(id) {

  const member =
    state.members.find(
      m => m.id === id
    );


  if (!member)
    return;


  /*
   * Prevent accidental removal.
   */
  const confirmed =
    confirm(
      `Remove ${member.name} from the active member list?\n\n` +
      `Their historical transactions will be preserved.`
    );


  if (!confirmed)
    return;


  try {

    await requireOk(
      await sb
        .from("members")
        .update({
          active: false
        })
        .eq("id", id)
    );


    toast(
      `${member.name} removed from active members`
    );


    await loadData();

  } catch (error) {

    console.error(
      "Deactivate member error:",
      error
    );

  }
}


/* ============================================================
   27. CASH PAGE
============================================================ */

function renderCash() {

  const people =
    cashByMember();


  /*
   * Render active cash holders.
   */
  if ($("cashPeople")) {

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

              <button
                class="text-btn"
                style="margin-top:10px"
                onclick='deactivateMember(${JSON.stringify(p.id)})'
              >
                Remove
              </button>

            </div>
            `
        )
        .join("") ||
      empty("No members");

  }


  /*
   * Render cash ledger.
   */
  if (!$("cashLedger"))
    return;


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

            ${state.ledger
              .map(
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
                          String(
                            t.type || ""
                          ).replaceAll(
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
              )
              .join("")}

          </tbody>

        </table>
      `

      : empty(
          "No cash transactions yet."
        );
}


/* ============================================================
   28. CASH TRANSFER FORM
============================================================ */

function openTransferForm() {

  if (state.members.length < 2) {

    toast(
      "Add at least two members first."
    );

    return;
  }


  openModal(`

    <h3>
      Transfer Cash
    </h3>


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
          onclick="closeModal()"
        >
          Cancel
        </button>


        <button
          class="primary"
        >
          Transfer
        </button>

      </div>

    </form>

  `);


  $("transferForm").onsubmit =
    saveTransfer;
}


/* ============================================================
   29. SAVE CASH TRANSFER
============================================================ */

async function saveTransfer(ev) {

  ev.preventDefault();


  const from =
    $("tfFrom").value;

  const to =
    $("tfTo").value;

  const amount =
    Number(
      $("tfAmount").value
    );


  /*
   * Validate amount.
   */
  if (
    !Number.isFinite(amount) ||
    amount <= 0
  ) {

    toast(
      "Enter a valid amount."
    );

    return;
  }


  /*
   * Sender and receiver cannot be the same.
   */
  if (from === to) {

    toast(
      "From and To must be different."
    );

    return;
  }


  /*
   * Check available balance.
   */
  const holder =
    cashByMember().find(
      x => x.id === from
    );


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
   * Insert transfer into ledger.
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
   30. EXPENSES PAGE
============================================================ */

function renderExpenses() {

  const q =
    (
      $("expenseSearch")
        ?.value || ""
    ).toLowerCase();


  const rows =
    state.expenses.filter(
      e =>
        `${e.category} ${
          e.description || ""
        } ${
          e.members?.name || ""
        }`
          .toLowerCase()
          .includes(q)
    );


  if (!$("expensesTable"))
    return;


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

            ${rows
              .map(
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
                        )
                          ?.match_number ||
                        "—"
                      }
                    </td>

                    <td>
                      <span class="pill">
                        ${esc(
                          e.category
                        )}
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
              )
              .join("")}

          </tbody>

        </table>
      `

      : empty(
          "No expenses found."
        );
}


/* ============================================================
   31. ADD EXPENSE FORM
============================================================ */

function openExpenseForm() {

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

    <h3>
      Add Expense
    </h3>


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
                  (a,b) =>
                    b.match_number -
                    a.match_number
                )
                .map(
                  m =>
                    `
                    <option value="${esc(m.id)}">
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

            <option>
              Ground
            </option>

            <option>
              Water
            </option>

            <option>
              Equipment
            </option>

            <option>
              Food
            </option>

            <option>
              Other
            </option>

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
          onclick="closeModal()"
        >
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
   32. SAVE EXPENSE
============================================================ */

async function saveExpense(ev) {

  ev.preventDefault();


  const match =
    state.matches.find(
      m =>
        m.id ===
        $("efMatch").value
    );


  if (!match) {

    toast(
      "Please select a valid match."
    );

    return;
  }


  const amount =
    Number(
      $("efAmount").value
    );


  if (
    !Number.isFinite(amount) ||
    amount <= 0
  ) {

    toast(
      "Enter a valid expense amount."
    );

    return;
  }


  const row = {

    expense_date:
      $("efDate").value,

    match_id:
      $("efMatch").value,

    category:
      $("efCat").value,

    amount,

    paid_by:
      $("efPaid").value,

    description:
      $("efNote").value ||
      null

  };


  /*
   * Save expense.
   */
  await requireOk(
    await sb
      .from("expenses")
      .insert(row)
  );


  /*
   * Record cash payment in ledger.
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
   33. REPORTS
============================================================ */

function renderReports() {

  const t =
    totals();


  if ($("reportCards")) {

    $("reportCards").innerHTML =

      `
      <div class="stat-card">

        <span>
          Matches
        </span>

        <strong>
          ${state.matches.length}
        </strong>

      </div>


      <div class="stat-card">

        <span>
          Players participations
        </span>

        <strong>
          ${
            state.matches.reduce(
              (s,m) =>
                s +
                Number(m.players),
              0
            )
          }
        </strong>

      </div>


      <div class="stat-card">

        <span>
          Total collected
        </span>

        <strong>
          ${money(t.collected)}
        </strong>

      </div>


      <div class="stat-card">

        <span>
          Net balance
        </span>

        <strong>
          ${money(t.net)}
        </strong>

      </div>
      `;

  }


  if (!$("reportTable"))
    return;


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

            ${state.matches
              .map(m => {

                const ex =
                  state.expenses
                    .filter(
                      e =>
                        e.match_id ===
                        m.id
                    )
                    .reduce(
                      (s,e) =>
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

                    <td
                      class="${
                        b >= 0
                          ? "positive"
                          : "negative"
                      }"
                    >
                      ${money(b)}
                    </td>

                  </tr>
                `;

              })
              .join("")}

          </tbody>

        </table>
      `

      : empty(
          "No report data."
        );
}


/* ============================================================
   34. PAGE NAVIGATION
============================================================ */

function switchPage(
  page,
  update = true
) {

  state.page = page;


  /*
   * Hide every page.
   */
  document
    .querySelectorAll(".page")
    .forEach(
      x =>
        x.classList.add(
          "hidden"
        )
    );


  /*
   * Show selected page.
   */
  $(`page-${page}`)
    ?.classList
    .remove("hidden");


  /*
   * Highlight navigation buttons.
   */
  document
    .querySelectorAll(
      "[data-page]"
    )
    .forEach(
      x =>
        x.classList.toggle(
          "active",
          x.dataset.page === page
        )
    );


  /*
   * Update page title.
   */
  if ($("pageTitle")) {

    $("pageTitle")
      .textContent =
        page
          .charAt(0)
          .toUpperCase() +
        page.slice(1);

  }


  /*
   * Scroll to top when navigation changes.
   */
  if (update) {

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });

  }
}


/* ============================================================
   35. MODAL FUNCTIONS
============================================================ */

function openModal(html) {

  if (
    !$("modal") ||
    !$("modalBox")
  ) {

    return;
  }


  $("modalBox")
    .innerHTML = html;


  $("modal")
    .classList
    .remove("hidden");
}


function closeModal() {

  if (
    !$("modal") ||
    !$("modalBox")
  ) {

    return;
  }


  $("modal")
    .classList
    .add("hidden");


  $("modalBox")
    .innerHTML = "";
}


/* ============================================================
   36. LOGIN
============================================================ */

$("loginForm")
  ?.addEventListener(
    "submit",
    async e => {

      e.preventDefault();


      if (!sb) {

        toast(
          "Supabase is not configured."
        );

        return;
      }


      const email =
        $("loginEmail")
          ?.value
          ?.trim();


      const password =
        $("loginPassword")
          ?.value;


      if (
        !email ||
        !password
      ) {

        toast(
          "Enter your email and password."
        );

        return;
      }


      /*
       * Sign in using Supabase Auth.
       */
      const { error } =
        await sb.auth.signInWithPassword({

          email,

          password

        });


      /*
       * Display login error.
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
   37. LOGOUT
============================================================ */

$("logoutBtn")
  ?.addEventListener(
    "click",
    async () => {

      if (!sb)
        return;


      await sb.auth.signOut();


      toast(
        "Signed out"
      );

    }
  );


/* ============================================================
   38. BUTTON EVENT HANDLERS
============================================================ */


/*
 * Refresh data.
 */
$("refreshBtn")
  ?.addEventListener(
    "click",
    loadData
  );


/*
 * Add Match.
 */
$("addMatchBtn")
  ?.addEventListener(
    "click",
    openMatchForm
  );


/*
 * Transfer Cash.
 */
$("transferBtn")
  ?.addEventListener(
    "click",
    openTransferForm
  );


/*
 * Add Expense.
 */
$("addExpenseBtn")
  ?.addEventListener(
    "click",
    openExpenseForm
  );


/*
 * Export CSV.
 */
$("exportBtn")
  ?.addEventListener(
    "click",
    exportCSV
  );


/*
 * Add Member.
 *
 * IMPORTANT:
 * This works if your index.html contains:
 *
 * <button id="addMemberBtn">+ Add Member</button>
 *
 * If the button is not yet in index.html,
 * nothing breaks.
 */
$("addMemberBtn")
  ?.addEventListener(
    "click",
    openAddMemberForm
  );


/* ============================================================
   39. SEARCH / FILTER EVENTS
============================================================ */

$("matchSearch")
  ?.addEventListener(
    "input",
    renderMatches
  );


$("matchFilter")
  ?.addEventListener(
    "change",
    renderMatches
  );


$("expenseSearch")
  ?.addEventListener(
    "input",
    renderExpenses
  );


/* ============================================================
   40. NAVIGATION CLICK HANDLER
============================================================ */

document.addEventListener(
  "click",
  e => {

    const b =
      e.target.closest(
        "[data-page]"
      );


    if (b) {

      switchPage(
        b.dataset.page
      );

    }

  }
);


/* ============================================================
   41. CLOSE MODAL WHEN BACKDROP IS CLICKED
============================================================ */

$("modal")
  ?.addEventListener(
    "click",
    e => {

      if (
        e.target.classList.contains(
          "modal-backdrop"
        )
      ) {

        closeModal();

      }

    }
  );


/* ============================================================
   42. EXPORT FINANCE DATA TO CSV
============================================================ */

function exportCSV() {

  /*
   * CSV header.
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
   * Add every match.
   */
  state.matches.forEach(
    m => {

      const expenses =
        state.expenses
          .filter(
            e =>
              e.match_id ===
              m.id
          )
          .reduce(
            (s,e) =>
              s +
              Number(e.amount),
            0
          );


      rows.push([

        m.match_number,

        m.match_date,

        m.players,

        m.total_collected,

        expenses,

        matchBalance(m),

        m.notes || ""

      ]);

    }
  );


  /*
   * Convert rows into CSV text.
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
   * Create downloadable file.
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


  const a =
    document.createElement(
      "a"
    );


  a.href = url;

  a.download =
    "qatar-football-finance.csv";


  a.click();


  URL.revokeObjectURL(
    url
  );
}


/* ============================================================
   43. START APPLICATION
============================================================ */

/*
 * Everything above is defined first.
 *
 * init() starts the application.
 */
init();