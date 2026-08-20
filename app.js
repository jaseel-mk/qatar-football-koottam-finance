/* ============================================================
   QATAR FOOTBALL KOOTTAM FINANCE
   ------------------------------------------------------------
   Main JavaScript file

   FEATURES
   ------------------------------------------------------------
   1. Supabase authentication
   2. Login / logout
   3. Forgot password
   4. Password reset
   5. Members
      - Add
      - Edit
      - Delete / deactivate
      - Re-activate deleted member
   6. Matches
      - Add
      - Edit
      - Delete
   7. Expenses
      - Add
      - Edit
      - Delete
   8. Cash transactions
      - Add transfer
      - Edit
      - Delete
   9. Dashboard
   10. Reports
   11. CSV export

   IMPORTANT
   ------------------------------------------------------------
   - Use ONLY the Supabase publishable/anon key.
   - NEVER use the service_role key in frontend JavaScript.
============================================================ */


/* ============================================================
   1. SUPABASE CONFIGURATION
============================================================ */

const SUPABASE_URL =
  "https://soakyzawpmsoxqodskgr.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_knMPrkJfZ003rPvb7bRgRA_QJC8DWGJ";

const RESET_PAGE_URL =
  "https://jaseel-mk.github.io/qatar-football-koottam-finance/reset.html";


/* ============================================================
   2. SUPABASE CLIENT
============================================================ */

const configured =
  !SUPABASE_URL.startsWith("YOUR_") &&
  !SUPABASE_KEY.startsWith("YOUR_");

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
   3. APPLICATION STATE
============================================================ */

let state = {
  members: [],
  allMembers: [],
  matches: [],
  expenses: [],
  ledger: [],
  page: "dashboard"
};


/* ============================================================
   4. SHORTCUT
============================================================ */

const $ = id =>
  document.getElementById(id);


/* ============================================================
   5. GENERAL HELPERS
============================================================ */

function money(n) {

  return `QAR ${Number(n || 0).toLocaleString(
    "en-QA",
    {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }
  )}`;
}


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


function dateText(v) {

  if (!v)
    return "—";

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


function today() {

  return new Date()
    .toISOString()
    .slice(0, 10);
}


function toast(msg) {

  const t = $("toast");

  if (!t) {
    alert(msg);
    return;
  }

  t.textContent = msg;

  t.classList.add("show");

  clearTimeout(window.__toastTimer);

  window.__toastTimer =
    setTimeout(
      () => t.classList.remove("show"),
      2400
    );
}


function empty(text) {

  return `
    <div class="empty">
      ${esc(text)}
    </div>
  `;
}


/* ============================================================
   6. SUPABASE RESULT HANDLER
============================================================ */

async function requireOk(result) {

  if (result.error) {

    console.error(result.error);

    toast(
      result.error.message ||
      "Database operation failed."
    );

    throw result.error;
  }

  return result.data;
}


/* ============================================================
   7. PASSWORD RESET
============================================================ */

function addForgotPasswordLink() {

  const form =
    $("loginForm");

  if (!form)
    return;

  if ($("forgotPasswordBtn"))
    return;

  const wrapper =
    document.createElement("div");

  wrapper.style.cssText =
    "text-align:center;margin-top:12px;";

  const btn =
    document.createElement("button");

  btn.type = "button";

  btn.id =
    "forgotPasswordBtn";

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
          redirectTo:
            RESET_PAGE_URL
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

    console.error(err);

    toast(
      "Unable to send password reset email."
    );
  }
}


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

    console.error(error);

    toast(error.message);

    return false;
  }

  toast(
    "Password updated successfully."
  );

  return true;
}


/* ============================================================
   8. INITIALIZATION
============================================================ */

async function init() {

  if (!configured) {

    $("configWarning")
      ?.classList
      .remove("hidden");

    return;
  }

  addForgotPasswordLink();

  const {
    data: { session }
  } =
    await sb.auth.getSession();

  if (session) {

    showApp(session);

  } else {

    showAuth();

  }

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
   9. AUTH SCREEN
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
   10. MAIN APPLICATION
============================================================ */

async function showApp(session) {

  $("authView")
    ?.classList
    .add("hidden");

  $("appView")
    ?.classList
    .remove("hidden");

  if ($("userEmail")) {

    $("userEmail").textContent =
      session.user.email ||
      "Signed in";

  }

  await loadData();
}


/* ============================================================
   11. LOAD DATA
============================================================ */

async function loadData() {

  if (!sb)
    return;

  try {

    const [
      membersResult,
      matchesResult,
      expensesResult,
      ledgerResult
    ] =
      await Promise.all([

        sb
          .from("members")
          .select("*")
          .order("name"),

        sb
          .from("matches")
          .select("*")
          .order(
            "match_number",
            {
              ascending: false
            }
          ),

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


    state.allMembers =
      await requireOk(
        membersResult
      ) || [];


    /*
     * Only active members are used for
     * normal cash calculations.
     */
    state.members =
      state.allMembers.filter(
        m => m.active === true
      );


    state.matches =
      await requireOk(
        matchesResult
      ) || [];


    state.expenses =
      await requireOk(
        expensesResult
      ) || [];


    state.ledger =
      await requireOk(
        ledgerResult
      ) || [];


    render();

  } catch (e) {

    console.error(
      "Data loading error:",
      e
    );

  }
}


/* ============================================================
   12. TOTALS
============================================================ */

function matchBalance(match) {

  const expenses =
    state.expenses
      .filter(
        x =>
          x.match_id ===
          match.id
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


function cashByMember() {

  const out = {};

  state.members.forEach(
    m => {

      out[m.id] = {
        ...m,
        balance: 0
      };

    }
  );


  state.ledger.forEach(
    t => {

      const amount =
        Number(t.amount);


      if (
        t.to_member_id &&
        out[t.to_member_id]
      ) {

        out[
          t.to_member_id
        ].balance += amount;

      }


      if (
        t.from_member_id &&
        out[t.from_member_id]
      ) {

        out[
          t.from_member_id
        ].balance -= amount;

      }

    }
  );


  return Object.values(out);
}


function totals() {

  const collected =
    state.matches.reduce(
      (s, m) =>
        s +
        Number(
          m.total_collected
        ),
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
    net:
      collected -
      expenses,
    cash
  };
}


/* ============================================================
   13. RENDER EVERYTHING
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
   14. DASHBOARD
============================================================ */

function renderDashboard() {

  const t =
    totals();


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


  const people =
    cashByMember();


  if ($("cashCards")) {

    $("cashCards").innerHTML =
      people
        .map(
          p => `
            <div class="cash-card">

              <div class="person">
                ${esc(p.name)}
              </div>

              <div class="amount">
                ${money(p.balance)}
              </div>

            </div>
          `
        )
        .join("") ||
      empty("No members");

  }


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


  const recent =
    state.matches.slice(0, 5);


  if ($("recentMatches")) {

    $("recentMatches").innerHTML =
      recent
        .map(matchCard)
        .join("") ||
      empty(
        "No matches yet."
      );

  }
}


/* ============================================================
   15. MATCH CARD
============================================================ */

function matchCard(m) {

  const b =
    matchBalance(m);

  return `
    <div class="match-card">

      <div>

        <strong>
          Match #${esc(m.match_number)}
        </strong>

        <div class="match-meta">
          ${dateText(m.match_date)}
          ·
          ${esc(m.players)} players
          ·
          Collected ${money(
            m.total_collected
          )}
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
   16. MATCHES TABLE
============================================================ */

function renderMatches() {

  const q =
    (
      $("matchSearch")
        ?.value || ""
    ).toLowerCase();


  const f =
    $("matchFilter")
      ?.value ||
    "all";


  let rows =
    state.matches.filter(
      m =>
        `${m.match_number} ${m.match_date}`
          .toLowerCase()
          .includes(q)
    );


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
              <th>Actions</th>
            </tr>

          </thead>

          <tbody>

            ${rows
              .map(
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
                          Number(
                            e.amount
                          ),
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
                          #${esc(
                            m.match_number
                          )}
                        </strong>
                      </td>

                      <td>
                        ${dateText(
                          m.match_date
                        )}
                      </td>

                      <td>
                        ${esc(
                          m.players
                        )}
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
                          type="button"
                          onclick='openMatch(${JSON.stringify(m.id)})'
                        >
                          View
                        </button>

                        <button
                          class="text-btn"
                          type="button"
                          onclick='editMatch(${JSON.stringify(m.id)})'
                        >
                          Edit
                        </button>

                        <button
                          class="text-btn negative"
                          type="button"
                          onclick='deleteMatch(${JSON.stringify(m.id)})'
                        >
                          Delete
                        </button>

                      </td>

                    </tr>
                  `;

                }
              )
              .join("")}

          </tbody>

        </table>
      `

      : empty(
          "No matches found."
        );
}


/* ============================================================
   17. VIEW MATCH
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
      Match #${esc(m.match_number)}
    </h3>

    <p class="muted">
      ${dateText(m.match_date)}
      ·
      ${esc(m.players)} players
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
              (s, e) =>
                s +
                Number(
                  e.amount
                ),
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
          e => `
            <div class="match-card">

              <div>

                <strong>
                  ${esc(
                    e.category
                  )}
                </strong>

                <div class="match-meta">
                  ${esc(
                    e.members?.name ||
                    ""
                  )}
                  ·
                  ${esc(
                    e.description ||
                    ""
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
      empty(
        "No expenses"
      )
    }

  `);
}


/* ============================================================
   18. MEMBER OPTIONS
============================================================ */

function memberOptions(
  selected = "",
  includeInactive = false
) {

  const list =
    includeInactive
      ? state.allMembers
      : state.members;


  return list
    .filter(
      m =>
        includeInactive ||
        m.active === true
    )
    .map(
      m => `
        <option
          value="${esc(m.id)}"
          ${
            m.id === selected
              ? "selected"
              : ""
          }
        >
          ${esc(m.name)}
          ${
            !m.active
              ? " (inactive)"
              : ""
          }
        </option>
      `
    )
    .join("");
}


/* ============================================================
   19. ADD MEMBER
============================================================ */

function openMemberForm() {

  openModal(`

    <h3>
      Add Member
    </h3>


    <form id="memberForm">

      <label>

        Member name

        <input
          id="memberName"
          type="text"
          required
          maxlength="100"
          placeholder="Enter member name"
        >

      </label>


      <p class="small muted">
        If this member previously existed and was
        deactivated, the existing member will be
        reactivated instead of creating a duplicate.
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
          type="submit"
        >
          Add Member
        </button>

      </div>

    </form>

  `);


  $("memberForm").onsubmit =
    saveMember;


  setTimeout(
    () =>
      $("memberName")?.focus(),
    50
  );
}


/* ============================================================
   20. SAVE / REACTIVATE MEMBER
============================================================ */

async function saveMember(ev) {

  ev.preventDefault();


  const name =
    $("memberName")
      ?.value
      ?.trim();


  if (!name) {

    toast(
      "Enter a member name."
    );

    return;
  }


  /*
   * IMPORTANT:
   *
   * Your SQL has:
   *
   * name text not null unique
   *
   * Therefore a deactivated member with the same
   * name still exists in the database.
   *
   * Instead of trying INSERT and getting a duplicate
   * error, first search for the existing member.
   */
  const existing =
    state.allMembers.find(
      m =>
        m.name.trim().toLowerCase() ===
        name.toLowerCase()
    );


  if (existing) {

    /*
     * Existing active member
     */
    if (existing.active) {

      toast(
        "A member with this name already exists."
      );

      return;
    }


    /*
     * Existing inactive member.
     *
     * Reactivate it.
     */
    await requireOk(
      await sb
        .from("members")
        .update({
          active: true
        })
        .eq(
          "id",
          existing.id
        )
    );


    closeModal();

    toast(
      `${existing.name} reactivated`
    );

    await loadData();

    return;
  }


  /*
   * Completely new member.
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
    "Member added successfully"
  );

  await loadData();
}


/* ============================================================
   21. EDIT MEMBER
============================================================ */

function editMember(id) {

  const member =
    state.allMembers.find(
      m => m.id === id
    );

  if (!member)
    return;


  openModal(`

    <h3>
      Edit Member
    </h3>


    <form id="editMemberForm">

      <label>

        Member name

        <input
          id="editMemberName"
          type="text"
          value="${esc(
            member.name
          )}"
          required
          maxlength="100"
        >

      </label>


      <label style="margin-top:13px;">

        Status

        <select id="editMemberActive">

          <option
            value="true"
            ${
              member.active
                ? "selected"
                : ""
            }
          >
            Active
          </option>

          <option
            value="false"
            ${
              !member.active
                ? "selected"
                : ""
            }
          >
            Inactive
          </option>

        </select>

      </label>


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
          type="submit"
        >
          Save Changes
        </button>

      </div>

    </form>

  `);


  $("editMemberForm").onsubmit =
    async ev => {

      ev.preventDefault();


      const newName =
        $("editMemberName")
          .value
          .trim();


      const active =
        $("editMemberActive")
          .value === "true";


      if (!newName) {

        toast(
          "Member name cannot be empty."
        );

        return;
      }


      /*
       * Check duplicate name.
       */
      const duplicate =
        state.allMembers.find(
          m =>
            m.id !== id &&
            m.name
              .trim()
              .toLowerCase() ===
            newName.toLowerCase()
        );


      if (duplicate) {

        toast(
          "Another member already has this name."
        );

        return;
      }


      await requireOk(
        await sb
          .from("members")
          .update({
            name: newName,
            active
          })
          .eq(
            "id",
            id
          )
      );


      closeModal();

      toast(
        "Member updated"
      );

      await loadData();

    };
}


/* ============================================================
   22. DELETE / DEACTIVATE MEMBER
============================================================ */

async function deleteMember(id) {

  const member =
    state.allMembers.find(
      m => m.id === id
    );

  if (!member)
    return;


  /*
   * We do NOT physically delete the member.
   *
   * We set active=false.
   *
   * This preserves old financial records.
   *
   * When the same name is added again,
   * saveMember() automatically reactivates it.
   */
  const ok =
    confirm(
      `Deactivate "${member.name}"?\n\n` +
      `Existing matches, expenses and cash records ` +
      `will be preserved.`
    );


  if (!ok)
    return;


  await requireOk(
    await sb
      .from("members")
      .update({
        active: false
      })
      .eq(
        "id",
        id
      )
  );


  toast(
    `${member.name} deactivated`
  );

  await loadData();
}


/* ============================================================
   23. MATCH FORM
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
          type="submit"
        >
          Save Match
        </button>

      </div>

    </form>

  `);


  setupMatchCalculation();

  $("matchForm").onsubmit =
    saveMatch;
}


/* ============================================================
   24. MATCH CALCULATION
============================================================ */

function setupMatchCalculation() {

  const calculate =
    () => {

      const players =
        Number(
          $("mfPlayers")?.value || 0
        );

      const rate =
        Number(
          $("mfRate")?.value || 0
        );

      if ($("mfCollected")) {

        $("mfCollected").value =
          (
            players *
            rate
          ).toFixed(2);

      }

    };


  $("mfPlayers")
    ?.addEventListener(
      "input",
      calculate
    );


  $("mfRate")
    ?.addEventListener(
      "input",
      calculate
    );
}


/* ============================================================
   25. SAVE MATCH
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


  try {

    const m =
      await requireOk(
        await sb
          .from("matches")
          .insert(row)
          .select()
          .single()
      );


    const receiver =
      $("mfReceiver")
        ?.value;


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

  } catch (err) {

    console.error(err);

  }
}


/* ============================================================
   26. EDIT MATCH
============================================================ */

function editMatch(id) {

  const m =
    state.matches.find(
      x => x.id === id
    );

  if (!m)
    return;


  /*
   * Find existing collection transaction.
   */
  const collectionTx =
    state.ledger.find(
      t =>
        t.type ===
          "match_collection" &&
        t.match_id === id
    );


  openModal(`

    <h3>
      Edit Match #${esc(
        m.match_number
      )}
    </h3>


    <form id="editMatchForm">

      <div class="form-grid">

        <label>
          Match number

          <input
            id="emNum"
            type="number"
            min="1"
            value="${esc(
              m.match_number
            )}"
            required
          >
        </label>


        <label>
          Date

          <input
            id="emDate"
            type="date"
            value="${esc(
              m.match_date
            )}"
            required
          >
        </label>


        <label>
          Players

          <input
            id="emPlayers"
            type="number"
            min="0"
            value="${esc(
              m.players
            )}"
            required
          >
        </label>


        <label>
          Collection / player

          <input
            id="emRate"
            type="number"
            min="0"
            step=".01"
            value="${esc(
              m.collection_per_player
            )}"
            required
          >
        </label>


        <label>
          Collected

          <input
            id="emCollected"
            type="number"
            min="0"
            step=".01"
            value="${esc(
              m.total_collected
            )}"
            required
          >
        </label>


        <label>
          Collection received by

          <select id="emReceiver">

            ${memberOptions(
              collectionTx
                ?.to_member_id || ""
            )}

          </select>

        </label>


        <label class="full-row">

          Notes

          <textarea
            id="emNotes"
            rows="3"
          >${esc(
            m.notes || ""
          )}</textarea>

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
          type="submit"
        >
          Save Changes
        </button>

      </div>

    </form>

  `);


  $("editMatchForm").onsubmit =
    async ev => {

      ev.preventDefault();


      const updated = {

        match_number:
          Number(
            $("emNum").value
          ),

        match_date:
          $("emDate").value,

        players:
          Number(
            $("emPlayers").value
          ),

        collection_per_player:
          Number(
            $("emRate").value
          ),

        total_collected:
          Number(
            $("emCollected").value
          ),

        notes:
          $("emNotes").value ||
          null

      };


      try {

        await requireOk(
          await sb
            .from("matches")
            .update(updated)
            .eq(
              "id",
              id
            )
        );


        /*
         * Keep collection transaction synchronized.
         */
        if (collectionTx) {

          const receiver =
            $("emReceiver").value;


          if (
            receiver &&
            updated.total_collected > 0
          ) {

            await requireOk(
              await sb
                .from(
                  "cash_transactions"
                )
                .update({

                  transaction_date:
                    updated.match_date,

                  amount:
                    updated.total_collected,

                  to_member_id:
                    receiver,

                  description:
                    `Match #${updated.match_number} collection`

                })
                .eq(
                  "id",
                  collectionTx.id
                )
            );

          } else {

            await requireOk(
              await sb
                .from(
                  "cash_transactions"
                )
                .delete()
                .eq(
                  "id",
                  collectionTx.id
                )
            );

          }

        } else if (
          updated.total_collected > 0 &&
          $("emReceiver").value
        ) {

          /*
           * Old match without a collection
           * ledger record.
           */
          await requireOk(
            await sb
              .from(
                "cash_transactions"
              )
              .insert({

                transaction_date:
                  updated.match_date,

                type:
                  "match_collection",

                amount:
                  updated.total_collected,

                to_member_id:
                  $("emReceiver").value,

                match_id:
                  id,

                description:
                  `Match #${updated.match_number} collection`

              })
          );

        }


        closeModal();

        toast(
          "Match updated"
        );

        await loadData();

      } catch (err) {

        console.error(err);

      }

    };
}


/* ============================================================
   27. DELETE MATCH
============================================================ */

async function deleteMatch(id) {

  const m =
    state.matches.find(
      x => x.id === id
    );

  if (!m)
    return;


  const expenseCount =
    state.expenses.filter(
      e =>
        e.match_id === id
    ).length;


  const ok =
    confirm(
      `Delete Match #${m.match_number}?\n\n` +
      `This will also delete ${expenseCount} ` +
      `expense record(s) belonging to this match ` +
      `because your SQL uses ON DELETE CASCADE.\n\n` +
      `Cash transactions will remain unless manually deleted.`
    );


  if (!ok)
    return;


  try {

    /*
     * Delete cash collection/payment records
     * first so no orphan financial entries remain.
     */
    await requireOk(
      await sb
        .from("cash_transactions")
        .delete()
        .eq(
          "match_id",
          id
        )
    );


    /*
     * Expenses cascade automatically.
     */
    await requireOk(
      await sb
        .from("matches")
        .delete()
        .eq(
          "id",
          id
        )
    );


    toast(
      `Match #${m.match_number} deleted`
    );

    await loadData();

  } catch (err) {

    console.error(err);

  }
}


/* ============================================================
   28. CASH PAGE
============================================================ */

function renderCash() {

  const people =
    cashByMember();


  if ($("cashPeople")) {

    $("cashPeople").innerHTML =
      people
        .map(
          p => `
            <div class="cash-card">

              <div
                style="display:flex;
                justify-content:space-between;
                align-items:center;"
              >

                <div class="person">
                  ${esc(p.name)}
                </div>

                <div>

                  <button
                    class="text-btn"
                    type="button"
                    onclick='editMember(${JSON.stringify(p.id)})'
                  >
                    Edit
                  </button>

                  <button
                    class="text-btn negative"
                    type="button"
                    onclick='deleteMember(${JSON.stringify(p.id)})'
                  >
                    Delete
                  </button>

                </div>

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
      empty(
        "No members"
      );


  }


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
              <th>Actions</th>
            </tr>

          </thead>


          <tbody>

            ${state.ledger
              .map(
                t => `

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
                            t.type
                          ).replaceAll(
                            "_",
                            " "
                          )
                        )}
                      </span>

                    </td>


                    <td>
                      ${money(
                        t.amount
                      )}
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


                    <td>

                      <button
                        class="text-btn"
                        type="button"
                        onclick='editCashTransaction(${JSON.stringify(t.id)})'
                      >
                        Edit
                      </button>


                      <button
                        class="text-btn negative"
                        type="button"
                        onclick='deleteCashTransaction(${JSON.stringify(t.id)})'
                      >
                        Delete
                      </button>

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
   29. CASH TRANSFER FORM
============================================================ */

function openTransferForm() {

  if (
    state.members.length < 2
  ) {

    toast(
      "Add at least two active members first."
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
          type="submit"
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
   30. SAVE CASH TRANSFER
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


  if (from === to) {

    toast(
      "From and To must be different."
    );

    return;
  }


  if (
    !amount ||
    amount <= 0
  ) {

    toast(
      "Enter a valid amount."
    );

    return;
  }


  const holder =
    cashByMember().find(
      x =>
        x.id === from
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
   31. EDIT CASH TRANSACTION
============================================================ */

function editCashTransaction(id) {

  const t =
    state.ledger.find(
      x => x.id === id
    );

  if (!t)
    return;


  /*
   * Historical cash adjustment is editable too.
   */
  openModal(`

    <h3>
      Edit Cash Transaction
    </h3>


    <form id="editCashForm">

      <div class="form-grid">

        <label>

          Date

          <input
            id="ecDate"
            type="date"
            value="${esc(
              t.transaction_date
            )}"
            required
          >

        </label>


        <label>

          Type

          <select id="ecType">

            <option
              value="match_collection"
              ${
                t.type ===
                "match_collection"
                  ? "selected"
                  : ""
              }
            >
              Match Collection
            </option>

            <option
              value="expense_payment"
              ${
                t.type ===
                "expense_payment"
                  ? "selected"
                  : ""
              }
            >
              Expense Payment
            </option>

            <option
              value="cash_transfer"
              ${
                t.type ===
                "cash_transfer"
                  ? "selected"
                  : ""
              }
            >
              Cash Transfer
            </option>

            <option
              value="cash_adjustment"
              ${
                t.type ===
                "cash_adjustment"
                  ? "selected"
                  : ""
              }
            >
              Cash Adjustment
            </option>

          </select>

        </label>


        <label>

          Amount (QAR)

          <input
            id="ecAmount"
            type="number"
            min=".01"
            step=".01"
            value="${esc(
              t.amount
            )}"
            required
          >

        </label>


        <label>

          From

          <select id="ecFrom">

            <option value="">
              None
            </option>

            ${memberOptions(
              t.from_member_id
            )}

          </select>

        </label>


        <label>

          To

          <select id="ecTo">

            <option value="">
              None
            </option>

            ${memberOptions(
              t.to_member_id
            )}

          </select>

        </label>


        <label>

          Description

          <input
            id="ecDescription"
            value="${esc(
              t.description || ""
            )}"
          >

        </label>

      </div>


      <p class="small muted">
        Editing a cash transaction changes the
        ledger balance immediately.
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
          type="submit"
        >
          Save Changes
        </button>

      </div>

    </form>

  `);


  $("editCashForm").onsubmit =
    async ev => {

      ev.preventDefault();


      const from =
        $("ecFrom").value ||
        null;

      const to =
        $("ecTo").value ||
        null;

      const amount =
        Number(
          $("ecAmount").value
        );


      if (
        !amount ||
        amount <= 0
      ) {

        toast(
          "Enter a valid amount."
        );

        return;
      }


      if (
        from &&
        to &&
        from === to
      ) {

        toast(
          "From and To must be different."
        );

        return;
      }


      if (
        !from &&
        !to
      ) {

        toast(
          "Select at least From or To."
        );

        return;
      }


      try {

        await requireOk(
          await sb
            .from(
              "cash_transactions"
            )
            .update({

              transaction_date:
                $("ecDate").value,

              type:
                $("ecType").value,

              amount,

              from_member_id:
                from,

              to_member_id:
                to,

              description:
                $("ecDescription")
                  .value ||
                null

            })
            .eq(
              "id",
              id
            )
        );


        closeModal();

        toast(
          "Cash transaction updated"
        );

        await loadData();

      } catch (err) {

        console.error(err);

      }

    };
}


/* ============================================================
   32. DELETE CASH TRANSACTION
============================================================ */

async function deleteCashTransaction(id) {

  const t =
    state.ledger.find(
      x => x.id === id
    );

  if (!t)
    return;


  const ok =
    confirm(
      `Delete this cash transaction?\n\n` +
      `${dateText(
        t.transaction_date
      )}\n` +
      `${String(
        t.type
      ).replaceAll(
        "_",
        " "
      )}\n` +
      `${money(t.amount)}\n\n` +
      `This will change the in-hand cash balance.`
    );


  if (!ok)
    return;


  try {

    await requireOk(
      await sb
        .from(
          "cash_transactions"
        )
        .delete()
        .eq(
          "id",
          id
        )
    );


    toast(
      "Cash transaction deleted"
    );

    await loadData();

  } catch (err) {

    console.error(err);

  }
}


/* ============================================================
   33. EXPENSES
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
              <th>Actions</th>
            </tr>

          </thead>


          <tbody>

            ${rows
              .map(
                e => `

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
                      ${money(
                        e.amount
                      )}
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


                    <td>

                      <button
                        class="text-btn"
                        type="button"
                        onclick='editExpense(${JSON.stringify(e.id)})'
                      >
                        Edit
                      </button>


                      <button
                        class="text-btn negative"
                        type="button"
                        onclick='deleteExpense(${JSON.stringify(e.id)})'
                      >
                        Delete
                      </button>

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
   34. ADD EXPENSE
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
                  (a, b) =>
                    b.match_number -
                    a.match_number
                )
                .map(
                  m => `
                    <option
                      value="${esc(
                        m.id
                      )}"
                    >
                      #${esc(
                        m.match_number
                      )}
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


        <button
          class="primary"
          type="submit"
        >
          Save Expense
        </button>

      </div>

    </form>

  `);


  $("expenseForm").onsubmit =
    saveExpense;
}


/* ============================================================
   35. SAVE EXPENSE
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


  const row = {

    expense_date:
      $("efDate").value,

    match_id:
      $("efMatch").value,

    category:
      $("efCat").value,

    amount:
      Number(
        $("efAmount").value
      ),

    paid_by:
      $("efPaid").value,

    description:
      $("efNote").value ||
      null

  };


  try {

    const expense =
      await requireOk(
        await sb
          .from("expenses")
          .insert(row)
          .select()
          .single()
      );


    /*
     * Record cash payment.
     */
    await requireOk(
      await sb
        .from(
          "cash_transactions"
        )
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
            `Expense #${expense.id}`

        })
    );


    closeModal();

    toast(
      "Expense recorded"
    );

    await loadData();

  } catch (err) {

    console.error(err);

  }
}


/* ============================================================
   36. EDIT EXPENSE
============================================================ */

function editExpense(id) {

  const e =
    state.expenses.find(
      x => x.id === id
    );

  if (!e)
    return;


  /*
   * Find the associated cash payment.
   *
   * New expenses created by this version
   * use "Expense #UUID" in the description.
   *
   * For older records we also try to find
   * a matching transaction.
   */
  let cashTx =
    state.ledger.find(
      t =>
        t.type ===
          "expense_payment" &&
        t.description ===
          `Expense #${id}`
    );


  if (!cashTx) {

    cashTx =
      state.ledger.find(
        t =>
          t.type ===
            "expense_payment" &&
          t.match_id ===
            e.match_id &&
          t.from_member_id ===
            e.paid_by &&
          Number(t.amount) ===
            Number(e.amount)
      );

  }


  openModal(`

    <h3>
      Edit Expense
    </h3>


    <form id="editExpenseForm">

      <div class="form-grid">

        <label>

          Date

          <input
            id="eeDate"
            type="date"
            value="${esc(
              e.expense_date
            )}"
            required
          >

        </label>


        <label>

          Match

          <select id="eeMatch">

            ${
              state.matches
                .map(
                  m => `
                    <option
                      value="${esc(
                        m.id
                      )}"
                      ${
                        m.id ===
                        e.match_id
                          ? "selected"
                          : ""
                      }
                    >
                      #${esc(
                        m.match_number
                      )}
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

          <select id="eeCat">

            ${[
              "Ground",
              "Water",
              "Equipment",
              "Food",
              "Other"
            ]
              .map(
                c => `
                  <option
                    ${
                      e.category === c
                        ? "selected"
                        : ""
                    }
                  >
                    ${c}
                  </option>
                `
              )
              .join("")}

          </select>

        </label>


        <label>

          Amount (QAR)

          <input
            id="eeAmount"
            type="number"
            min=".01"
            step=".01"
            value="${esc(
              e.amount
            )}"
            required
          >

        </label>


        <label>

          Paid by

          <select id="eePaid">

            ${memberOptions(
              e.paid_by,
              true
            )}

          </select>

        </label>


        <label class="full-row">

          Note

          <input
            id="eeNote"
            value="${esc(
              e.description ||
              ""
            )}"
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
          type="submit"
        >
          Save Changes
        </button>

      </div>

    </form>

  `);


  $("editExpenseForm").onsubmit =
    async ev => {

      ev.preventDefault();


      const updated = {

        expense_date:
          $("eeDate").value,

        match_id:
          $("eeMatch").value,

        category:
          $("eeCat").value,

        amount:
          Number(
            $("eeAmount").value
          ),

        paid_by:
          $("eePaid").value,

        description:
          $("eeNote").value ||
          null

      };


      try {

        await requireOk(
          await sb
            .from("expenses")
            .update(updated)
            .eq(
              "id",
              id
            )
        );


        /*
         * Synchronize associated cash payment.
         */
        if (cashTx) {

          await requireOk(
            await sb
              .from(
                "cash_transactions"
              )
              .update({

                transaction_date:
                  updated.expense_date,

                amount:
                  updated.amount,

                from_member_id:
                  updated.paid_by,

                match_id:
                  updated.match_id,

                description:
                  `Expense #${id}`

              })
              .eq(
                "id",
                cashTx.id
              )
          );

        } else {

          /*
           * Old expense with no ledger record.
           * Create one now.
           */
          await requireOk(
            await sb
              .from(
                "cash_transactions"
              )
              .insert({

                transaction_date:
                  updated.expense_date,

                type:
                  "expense_payment",

                amount:
                  updated.amount,

                from_member_id:
                  updated.paid_by,

                match_id:
                  updated.match_id,

                description:
                  `Expense #${id}`

              })
          );

        }


        closeModal();

        toast(
          "Expense updated"
        );

        await loadData();

      } catch (err) {

        console.error(err);

      }

    };
}


/* ============================================================
   37. DELETE EXPENSE
============================================================ */

async function deleteExpense(id) {

  const e =
    state.expenses.find(
      x => x.id === id
    );

  if (!e)
    return;


  const ok =
    confirm(
      `Delete this expense?\n\n` +
      `${e.category}\n` +
      `${money(e.amount)}\n` +
      `${dateText(
        e.expense_date
      )}\n\n` +
      `The associated cash payment will also be removed.`
    );


  if (!ok)
    return;


  try {

    /*
     * Find associated cash transaction.
     */
    let cashTx =
      state.ledger.find(
        t =>
          t.type ===
            "expense_payment" &&
          t.description ===
            `Expense #${id}`
      );


    /*
     * Compatibility with old transactions.
     */
    if (!cashTx) {

      cashTx =
        state.ledger.find(
          t =>
            t.type ===
              "expense_payment" &&
            t.match_id ===
              e.match_id &&
            t.from_member_id ===
              e.paid_by &&
            Number(t.amount) ===
              Number(e.amount)
        );

    }


    /*
     * Delete cash transaction first.
     */
    if (cashTx) {

      await requireOk(
        await sb
          .from(
            "cash_transactions"
          )
          .delete()
          .eq(
            "id",
            cashTx.id
          )
      );

    }


    /*
     * Delete expense.
     */
    await requireOk(
      await sb
        .from("expenses")
        .delete()
        .eq(
          "id",
          id
        )
    );


    toast(
      "Expense deleted"
    );

    await loadData();

  } catch (err) {

    console.error(err);

  }
}


/* ============================================================
   38. REPORTS
============================================================ */

function renderReports() {

  const t =
    totals();


  if ($("reportCards")) {

    $("reportCards").innerHTML = `

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
              (s, m) =>
                s +
                Number(
                  m.players
                ),
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
          ${money(
            t.collected
          )}
        </strong>

      </div>


      <div class="stat-card">

        <span>
          Net balance
        </span>

        <strong>
          ${money(
            t.net
          )}
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
              <th>Expenses</th>
              <th>Balance</th>
            </tr>

          </thead>


          <tbody>

            ${state.matches
              .map(
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
                          Number(
                            e.amount
                          ),
                        0
                      );


                  const b =
                    Number(
                      m.total_collected
                    ) - ex;


                  return `

                    <tr>

                      <td>
                        #${esc(
                          m.match_number
                        )}
                      </td>

                      <td>
                        ${dateText(
                          m.match_date
                        )}
                      </td>

                      <td>
                        ${esc(
                          m.players
                        )}
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

                }
              )
              .join("")}

          </tbody>

        </table>
      `

      : empty(
          "No report data."
        );
}


/* ============================================================
   39. PAGE NAVIGATION
============================================================ */

function switchPage(
  page,
  update = true
) {

  state.page =
    page;


  document
    .querySelectorAll(
      ".page"
    )
    .forEach(
      x =>
        x.classList.add(
          "hidden"
        )
    );


  $(`page-${page}`)
    ?.classList
    .remove("hidden");


  document
    .querySelectorAll(
      "[data-page]"
    )
    .forEach(
      x =>
        x.classList.toggle(
          "active",
          x.dataset.page ===
          page
        )
    );


  if ($("pageTitle")) {

    $("pageTitle")
      .textContent =
        page
          .charAt(0)
          .toUpperCase() +
        page.slice(1);

  }


  if (update) {

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });

  }
}


/* ============================================================
   40. MODAL
============================================================ */

function openModal(html) {

  if (
    !$("modal") ||
    !$("modalBox")
  ) {
    return;
  }


  $("modalBox")
    .innerHTML =
    html;


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
    .innerHTML =
    "";
}


/* ============================================================
   41. LOGIN
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


      const { error } =
        await sb.auth
          .signInWithPassword({

            email,

            password

          });


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
   42. LOGOUT
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
   43. BUTTON EVENTS
============================================================ */

$("refreshBtn")
  ?.addEventListener(
    "click",
    loadData
  );


$("addMatchBtn")
  ?.addEventListener(
    "click",
    openMatchForm
  );


$("addMemberBtn")
  ?.addEventListener(
    "click",
    openMemberForm
  );


$("transferBtn")
  ?.addEventListener(
    "click",
    openTransferForm
  );


$("addExpenseBtn")
  ?.addEventListener(
    "click",
    openExpenseForm
  );


$("exportBtn")
  ?.addEventListener(
    "click",
    exportCSV
  );


/* ============================================================
   44. SEARCH EVENTS
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
   45. NAVIGATION EVENTS
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
   46. CLOSE MODAL ON BACKDROP
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
   47. ESCAPE KEY CLOSES MODAL
============================================================ */

document.addEventListener(
  "keydown",
  e => {

    if (
      e.key === "Escape" &&
      !$("modal")
        ?.classList
        .contains("hidden")
    ) {

      closeModal();

    }

  }
);


/* ============================================================
   48. CSV EXPORT
============================================================ */

function exportCSV() {

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
            (s, e) =>
              s +
              Number(
                e.amount
              ),
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


  a.href =
    url;


  a.download =
    "qatar-football-finance.csv";


  document.body.appendChild(a);

  a.click();

  a.remove();

  URL.revokeObjectURL(
    url
  );
}


/* ============================================================
   49. START APPLICATION
============================================================ */

init();