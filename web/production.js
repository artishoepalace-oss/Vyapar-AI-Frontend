(function(){
  "use strict";

  const API_BASE =
    String(
      window.VYAPAR_CONFIG &&
      window.VYAPAR_CONFIG.apiBase
        ? window.VYAPAR_CONFIG.apiBase
        : "https://vypar-backend.onrender.com"
    ).replace(/\/$/, "");

  const AUTH_TOKEN_KEY =
    "vyapar_ai_auth_token_v1";

  const ACCOUNT_CACHE_KEY =
    "vyapar_ai_account_cache_v1";

  const CLOUD_SYNC_TIME_KEY =
    "vyapar_ai_last_cloud_sync_v1";

  let account =
    readJson(
      ACCOUNT_CACHE_KEY,
      null
    );

  let syncTimer = null;
  let syncBusy = false;
  let pendingAfterAuth = null;
  let paymentBusy = false;

  function readJson(
    key,
    fallback
  ){
    try{
      const value =
        JSON.parse(
          localStorage.getItem(key)
        );

      return value === null
        ? fallback
        : value;

    }catch(error){
      return fallback;
    }
  }

  function authToken(){
    return String(
      localStorage.getItem(
        AUTH_TOKEN_KEY
      ) || ""
    ).trim();
  }

  function saveAccount(value){
    account = value || null;

    if(account){
      localStorage.setItem(
        ACCOUNT_CACHE_KEY,
        JSON.stringify(account)
      );
    }else{
      localStorage.removeItem(
        ACCOUNT_CACHE_KEY
      );
    }
  }

  function clearLogin(){
    localStorage.removeItem(
      AUTH_TOKEN_KEY
    );

    localStorage.removeItem(
      ACCOUNT_CACHE_KEY
    );

    account = null;

    applyAccountToApp();
  }

  function forceOtpLogin(){
    clearLogin();
    window.location.reload();
  }

  async function api(
    route,
    options
  ){
    const settings =
      options || {};

    const headers =
      new Headers(
        settings.headers || {}
      );

    const token =
      authToken();

    if(token){
      headers.set(
        "Authorization",
        "Bearer " + token
      );
    }

    if(
      settings.body &&
      !(
        settings.body
        instanceof FormData
      ) &&
      !headers.has(
        "Content-Type"
      )
    ){
      headers.set(
        "Content-Type",
        "application/json"
      );
    }

    let response;

    try{
      response =
        await fetch(
          API_BASE + route,
          {
            ...settings,
            headers
          }
        );

    }catch(error){
      throw new Error(
        "Backend connect nahi hua. Internet, Render deployment aur URL check karo."
      );
    }

    const raw =
      await response.text();

    let data = {};

    try{
      data = raw
        ? JSON.parse(raw)
        : {};

    }catch(error){
      throw new Error(
        "Backend ne valid JSON nahi bheja: " +
        raw.slice(0, 120)
      );
    }

    if(
      !response.ok ||
      data.success === false
    ){
      if(
        response.status === 401 &&
        token
      ){
        clearLogin();
        setTimeout(function(){
          window.location.reload();
        }, 50);
      }

      const error =
        new Error(
          data.message ||
          "Request failed"
        );

      error.status =
        response.status;

      error.data =
        data;

      throw error;
    }

    return data;
  }

  function currentAccountPlan(){
    const plan =
      account &&
      account.subscription
        ? account
            .subscription
            .plan
        : "free";

    return (
      plan === "pro" ||
      plan === "business"
    )
      ? plan
      : "free";
  }

  function hasBusinessData(value){
    if(
      !value ||
      typeof value !== "object"
    ){
      return false;
    }

    return Boolean(
      (
        Array.isArray(
          value.sales
        ) &&
        value.sales.length
      ) ||

      (
        Array.isArray(
          value.stocks
        ) &&
        value.stocks.length
      ) ||

      (
        Array.isArray(
          value.monthly
        ) &&
        value.monthly.length
      ) ||

      (
        Array.isArray(
          value.daily
        ) &&
        value.daily.length
      )
    );
  }

  function safeStateForCloud(){
    try{
      const copy =
        JSON.parse(
          JSON.stringify(state)
        );

      copy.subscription = {
        plan:
          currentAccountPlan(),

        verified:
          currentAccountPlan() !==
          "free",

        token:
          ""
      };

      copy.plan =
        currentAccountPlan();

      return copy;

    }catch(error){
      return null;
    }
  }

  function applyAccountToApp(){
    try{
      if(
        typeof state ===
        "undefined"
      ){
        return;
      }

      const plan =
        currentAccountPlan();

      state.profile =
        state.profile || {};

      state.profile.backendUrl =
        API_BASE;

      state.subscription = {
        plan:
          plan,

        verified:
          plan !== "free",

        token:
          authToken()
      };

      state.plan =
        plan;

      localStorage.setItem(
        "vyapar_ai_prod_v1",
        JSON.stringify(state)
      );

      const badge =
        document.getElementById(
          "planBadge"
        );

      if(badge){
        badge.textContent =
          plan.toUpperCase() +
          " Plan";
      }

    }catch(error){
      console.warn(
        "Account state apply failed:",
        error
      );
    }
  }

  async function refreshAccount(){
    if(!authToken()){
      saveAccount(null);
      applyAccountToApp();
      return null;
    }

    try{
      const data =
        await api(
          "/auth/me",
          {
            method: "GET"
          }
        );

      saveAccount({
        user:
          data.user,

        subscription:
          data.subscription
      });

      applyAccountToApp();

      return account;

    }catch(error){
      if(error && error.status === 401){
        clearLogin();
      }
      throw error;
    }
  }

  async function initialCloudDecision(){
    if(!authToken()){
      return;
    }

    try{
      const cloud =
        await api(
          "/data",
          {
            method: "GET"
          }
        );

      const localHasData =
        typeof state !==
        "undefined" &&
        hasBusinessData(state);

      const cloudHasData =
        cloud.state &&
        hasBusinessData(
          cloud.state
        );

      if(
        !localHasData &&
        cloudHasData
      ){
        const restored =
          typeof normalizeState ===
          "function"
            ? normalizeState(
                cloud.state
              )
            : cloud.state;

        state =
          restored;

        applyAccountToApp();

        localStorage.setItem(
          "vyapar_ai_prod_v1",
          JSON.stringify(state)
        );

        if(
          typeof render ===
          "function"
        ){
          render();
        }

      }else if(
        localHasData &&
        !cloudHasData
      ){
        await pushCloudState(
          true
        );
      }

    }catch(error){
      console.warn(
        "Initial cloud sync skipped:",
        error.message
      );
    }
  }

  async function pushCloudState(
    showMessage
  ){
    if(
      !authToken() ||
      syncBusy
    ){
      return;
    }

    const cloudState =
      safeStateForCloud();

    if(!cloudState){
      return;
    }

    syncBusy = true;

    try{
      const data =
        await api(
          "/data",
          {
            method: "PUT",

            body:
              JSON.stringify({
                state:
                  cloudState
              })
          }
        );

      localStorage.setItem(
        CLOUD_SYNC_TIME_KEY,

        data.updatedAt ||
        new Date()
          .toISOString()
      );

      if(showMessage){
        premiumToast(
          "Cloud backup complete",
          "success"
        );
      }

      updateAccountCard();

    }catch(error){
      if(showMessage){
        premiumToast(
          error.message,
          "error"
        );
      }

      console.warn(
        "Cloud sync failed:",
        error.message
      );

    }finally{
      syncBusy = false;
    }
  }

  function scheduleCloudSync(){
    if(!authToken()){
      return;
    }

    clearTimeout(syncTimer);

    syncTimer =
      setTimeout(
        function(){
          pushCloudState(false);
        },
        1200
      );
  }

  async function pullCloudState(){
    if(!authToken()){
      forceOtpLogin();
      return;
    }

    try{
      const data =
        await api(
          "/data",
          {
            method: "GET"
          }
        );

      if(!data.state){
        premiumToast(
          "Cloud backup abhi empty hai",
          "info"
        );

        return;
      }

      if(
        hasBusinessData(state)
      ){
        const okay =
          confirm(
            "Cloud data current device ke data ko replace karega. Continue?"
          );

        if(!okay){
          return;
        }
      }

      state =
        typeof normalizeState ===
        "function"
          ? normalizeState(
              data.state
            )
          : data.state;

      applyAccountToApp();

      localStorage.setItem(
        "vyapar_ai_prod_v1",
        JSON.stringify(state)
      );

      if(
        typeof render ===
        "function"
      ){
        render();
      }

      premiumToast(
        "Cloud data restored",
        "success"
      );

    }catch(error){
      premiumToast(
        error.message,
        "error"
      );
    }
  }

  function premiumToast(
    message,
    type
  ){
    const old =
      document.getElementById(
        "productionToast"
      );

    if(old){
      old.remove();
    }

    const toast =
      document.createElement(
        "div"
      );

    toast.id =
      "productionToast";

    toast.textContent =
      message;

    toast.className =
      "production-toast " +
      "production-toast-" +
      (type || "info");

    document.body.appendChild(
      toast
    );

    requestAnimationFrame(
      function(){
        toast.classList.add(
          "show"
        );
      }
    );

    setTimeout(
      function(){
        toast.classList.remove(
          "show"
        );

        setTimeout(
          function(){
            toast.remove();
          },
          220
        );
      },
      3200
    );
  }

  function escapeHtml(value){
    return String(value || "")
      .replace(
        /[&<>"']/g,

        function(character){
          return {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
          }[character];
        }
      );
  }

  function openAuthModal(
    mode,
    afterSuccess
  ){
    pendingAfterAuth =
      typeof afterSuccess ===
      "function"
        ? afterSuccess
        : null;

    const old =
      document.getElementById(
        "authModal"
      );

    if(old){
      old.remove();
    }

    const modal =
      document.createElement(
        "div"
      );

    modal.id =
      "authModal";

    modal.className =
      "production-overlay";

    modal.innerHTML = `
      <div class="production-modal">
        <button
          class="production-close"
          id="authClose"
        >×</button>

        <div class="production-logo">
          V
        </div>

        <div class="production-kicker">
          SECURE ACCOUNT
        </div>

        <h2 id="authTitle">
          ${
            mode === "register"
              ? "Create your account"
              : "Welcome back"
          }
        </h2>

        <p
          class="production-muted"
          id="authSubtitle"
        >
          ${
            mode === "register"
              ? "Cloud backup, subscription restore and multi-device access."
              : "Login to continue with your business data and subscription."
          }
        </p>

        <div
          id="authNameWrap"
          style="display:${
            mode === "register"
              ? "block"
              : "none"
          }"
        >
          <label>Full Name</label>

          <input
            id="authName"
            autocomplete="name"
            placeholder="Your name"
          >
        </div>

        <label>Email</label>

        <input
          id="authEmail"
          type="email"
          autocomplete="email"
          placeholder="name@example.com"
        >

        <label>Password</label>

        <input
          id="authPassword"
          type="password"
          autocomplete="current-password"
          placeholder="Minimum 8 characters"
        >

        <div
          id="authError"
          class="production-error"
          style="display:none"
        ></div>

        <button
          id="authSubmit"
          class="production-primary"
        >
          ${
            mode === "register"
              ? "Create Account"
              : "Login Securely"
          }
        </button>

        <button
          id="authSwitch"
          class="production-link"
        >
          ${
            mode === "register"
              ? "Already have an account? Login"
              : "New here? Create account"
          }
        </button>

        <div class="production-secure">
          🔒 Password encrypted • HTTPS connection
        </div>
      </div>
    `;

    document.body.appendChild(
      modal
    );

    let currentMode =
      mode === "register"
        ? "register"
        : "login";

    function close(){
      modal.remove();
      pendingAfterAuth = null;
    }

    function setMode(nextMode){
      currentMode =
        nextMode;

      const register =
        currentMode ===
        "register";

      document.getElementById(
        "authNameWrap"
      ).style.display =
        register
          ? "block"
          : "none";

      document.getElementById(
        "authTitle"
      ).textContent =
        register
          ? "Create your account"
          : "Welcome back";

      document.getElementById(
        "authSubtitle"
      ).textContent =
        register
          ? "Cloud backup, subscription restore and multi-device access."
          : "Login to continue with your business data and subscription.";

      document.getElementById(
        "authSubmit"
      ).textContent =
        register
          ? "Create Account"
          : "Login Securely";

      document.getElementById(
        "authSwitch"
      ).textContent =
        register
          ? "Already have an account? Login"
          : "New here? Create account";

      document.getElementById(
        "authError"
      ).style.display =
        "none";
    }

    document.getElementById(
      "authClose"
    ).onclick =
      close;

    document.getElementById(
      "authSwitch"
    ).onclick =
      function(){
        setMode(
          currentMode ===
          "register"
            ? "login"
            : "register"
        );
      };

    modal.addEventListener(
      "click",

      function(event){
        if(
          event.target === modal
        ){
          close();
        }
      }
    );

    document.getElementById(
      "authSubmit"
    ).onclick =
      async function(){
        const button =
          this;

        const errorBox =
          document.getElementById(
            "authError"
          );

        const name =
          String(
            document.getElementById(
              "authName"
            ).value || ""
          ).trim();

        const email =
          String(
            document.getElementById(
              "authEmail"
            ).value || ""
          ).trim();

        const password =
          String(
            document.getElementById(
              "authPassword"
            ).value || ""
          );

        errorBox.style.display =
          "none";

        button.disabled =
          true;

        button.textContent =
          currentMode ===
          "register"
            ? "Creating account..."
            : "Logging in...";

        try{
          const data =
            await api(
              "/auth/" +
              currentMode,

              {
                method:
                  "POST",

                body:
                  JSON.stringify(
                    currentMode ===
                    "register"
                      ? {
                          name,
                          email,
                          password
                        }
                      : {
                          email,
                          password
                        }
                  )
              }
            );

          localStorage.setItem(
            AUTH_TOKEN_KEY,
            data.token
          );

          saveAccount({
            user:
              data.user,

            subscription:
              data.subscription
          });

          applyAccountToApp();

          modal.remove();

          premiumToast(
            currentMode ===
            "register"
              ? "Account created"
              : "Login successful",

            "success"
          );

          await initialCloudDecision();

          if(
            typeof render ===
            "function"
          ){
            render();
          }

          const callback =
            pendingAfterAuth;

          pendingAfterAuth =
            null;

          if(callback){
            callback();
          }

        }catch(error){
          errorBox.textContent =
            error.message;

          errorBox.style.display =
            "block";

        }finally{
          button.disabled =
            false;

          if(
            document.body
              .contains(button)
          ){
            button.textContent =
              currentMode ===
              "register"
                ? "Create Account"
                : "Login Securely";
          }
        }
      };
  }

  async function logoutAccount(){
    clearLogin();
    window.location.reload();
  }

  async function cancelSubscription(){
    if(!authToken()){
      forceOtpLogin();
      return;
    }

    const okay =
      confirm(
        "Current billing cycle ke end par subscription cancel karna hai?"
      );

    if(!okay){
      return;
    }

    try{
      const data =
        await api(
          "/subscription/cancel",

          {
            method:
              "POST",

            body:
              JSON.stringify({
                atCycleEnd:
                  true
              
              })
          }
        );

      await refreshAccount();

      if(
        typeof render ===
        "function"
      ){
        render();
      }

      premiumToast(
        data.message,
        "success"
      );

    }catch(error){
      premiumToast(
        error.message,
        "error"
      );
    }
  }

  async function deleteAccount(){
    if(!authToken()){
      forceOtpLogin();
      return;
    }

    const expectedEmail =
      account &&
      account.user &&
      account.user.email
        ? String(account.user.email).trim().toLowerCase()
        : "";

    const confirmEmail =
      String(
        prompt(
          "Account permanently delete karne ke liye apna exact email enter karo:\n" +
          expectedEmail
        ) || ""
      )
        .trim()
        .toLowerCase();

    if(!confirmEmail){
      return;
    }

    if(confirmEmail !== expectedEmail){
      premiumToast(
        "Email match nahi hua. Account delete nahi kiya gaya.",
        "error"
      );
      return;
    }

    const confirmed =
      confirm(
        "Sales, stock, cloud backup aur account permanently delete ho jayega. Continue?"
      );

    if(!confirmed){
      return;
    }

    try{
      await api(
        "/auth/account",
        {
          method: "DELETE",
          body: JSON.stringify({
            confirmEmail
          })
        }
      );

      localStorage.removeItem("vyapar_ai_prod_v1");
      localStorage.removeItem(CLOUD_SYNC_TIME_KEY);
      clearLogin();
      window.location.reload();

    }catch(error){
      premiumToast(
        error.message,
        "error"
      );
    }
  }

  function updateAccountCard(){
    const card =
      document.getElementById(
        "productionAccountCard"
      );

    if(!card){
      return;
    }

    const loggedIn =
      Boolean(
        authToken() &&
        account &&
        account.user
      );

    const plan =
      currentAccountPlan();

    const lastSync =
      localStorage.getItem(
        CLOUD_SYNC_TIME_KEY
      );

    const end =
      account &&
      account.subscription
        ? account
            .subscription
            .currentEnd
        : null;

    if(loggedIn){
      card.innerHTML = `
        <div class="production-account-head">
          <div class="production-avatar">
            ${escapeHtml(
              (
                account.user.name ||
                "U"
              )
                .slice(0, 1)
                .toUpperCase()
            )}
          </div>

          <div>
            <h3>
              ${escapeHtml(
                account.user.name ||
                "User"
              )}
            </h3>

            <p>
              ${escapeHtml(
                account.user.email ||
                ""
              )}
            </p>
          </div>

          <span class="production-plan">
            ${plan.toUpperCase()}
          </span>
        </div>

        <div class="production-account-grid">
          <div>
            <span>Status</span>

            <b>
              ${escapeHtml(
                account.subscription
                  ? account
                      .subscription
                      .status
                  : "none"
              )}
            </b>
          </div>

          <div>
            <span>Renewal</span>

            <b>
              ${
                end
                  ? new Date(end)
                      .toLocaleDateString(
                        "en-IN"
                      )
                  : "-"
              }
            </b>
          </div>

          <div>
            <span>Cloud Sync</span>

            <b>
              ${
                lastSync
                  ? new Date(
                      lastSync
                    ).toLocaleString(
                      "en-IN"
                    )
                  : "Not synced"
              }
            </b>
          </div>
        </div>

        <div class="production-actions">
          <button
            onclick="window.vyaparCloudBackup()"
          >
            Backup Now
          </button>

          <button
            onclick="window.vyaparCloudRestore()"
          >
            Restore Cloud
          </button>

          ${
            plan !== "free"
              ? `
                <button
                  onclick="window.vyaparCancelSubscription()"
                >
                  Cancel at Cycle End
                </button>
              `
              : ""
          }

          <button
            onclick="window.vyaparLogout()"
          >
            Logout
          </button>

          <button
            class="danger"
            onclick="window.vyaparDeleteAccount()"
          >
            Delete Account
          </button>
        </div>
      `;

    }else{
      card.innerHTML = `
        <div class="production-account-head">
          <div class="production-avatar">
            V
          </div>

          <div>
            <h3>
              Vyapar AI Account
            </h3>

            <p>
              Cloud backup and subscription restore
            </p>
          </div>
        </div>

        <div class="production-actions">
          <button
            class="primary"
            onclick="window.vyaparLogin()"
          >
            Login
          </button>

          <button
            onclick="window.vyaparRegister()"
          >
            Create Account
          </button>
        </div>
      `;
    }
  }

  function appendAccountCard(){
    const screen =
      document.getElementById(
        "screen-settings"
      );

    if(
      !screen ||
      document.getElementById(
        "productionAccountCard"
      )
    ){
      return;
    }

    const card =
      document.createElement(
        "div"
      );

    card.id =
      "productionAccountCard";

    card.className =
      "card production-account-card";

    card.style.marginTop =
      "14px";

    screen.prepend(card);

    updateAccountCard();
  }

  function appendSubscriptionManagement(){
    const screen =
      document.getElementById(
        "screen-subscription"
      );

    if(
      !screen ||
      document.getElementById(
        "productionSubscriptionInfo"
      )
    ){
      return;
    }

    const box =
      document.createElement(
        "div"
      );

    box.id =
      "productionSubscriptionInfo";

    box.className =
      "card production-subscription-card";

    box.style.marginTop =
      "14px";

    if(
      authToken() &&
      account &&
      account.user
    ){
      const end =
        account.subscription
          ? account
              .subscription
              .currentEnd
          : null;

      box.innerHTML = `
        <h3>
          Subscription Account
        </h3>

        <p class="muted">
          ${escapeHtml(
            account.user.email
          )}
          •
          ${currentAccountPlan()
            .toUpperCase()}
          plan
        </p>

        <p class="muted">
          Status:
          <b>
            ${escapeHtml(
              account.subscription
                ? account
                    .subscription
                    .status
                : "none"
            )}
          </b>

          ${
            end
              ? " • Current cycle ends " +
                new Date(end)
                  .toLocaleDateString(
                    "en-IN"
                  )
              : ""
          }
        </p>

        <div class="actions">
          <button
            class="btn"
            onclick="window.vyaparCloudBackup()"
          >
            Cloud Backup
          </button>

          ${
            currentAccountPlan() !==
            "free"
              ? `
                <button
                  class="btn danger"
                  onclick="window.vyaparCancelSubscription()"
                >
                  Manage Cancellation
                </button>
              `
              : ""
          }
        </div>
      `;

    }else{
      box.innerHTML = `
        <h3>
          Login Required for Paid Plans
        </h3>

        <p class="muted">
          Payment, renewal and subscription restore account ke saath secure rahenge.
        </p>

        <div class="actions">
          <button
            class="btn primary"
            onclick="window.vyaparLogin()"
          >
            Login
          </button>

          <button
            class="btn"
            onclick="window.vyaparRegister()"
          >
            Create Account
          </button>
        </div>
      `;
    }

    screen.appendChild(box);
  }

  function injectLegalFooter(){
    if(
      document.getElementById(
        "productionLegalFooter"
      )
    ){
      return;
    }

    const footer =
      document.createElement(
        "footer"
      );

    footer.id =
      "productionLegalFooter";

    footer.className =
      "production-footer";

    footer.innerHTML = `
      <span>
        © ${new Date().getFullYear()} Vyapar AI
      </span>

      <a
        href="privacy.html"
        target="_blank"
      >
        Privacy
      </a>

      <a
        href="terms.html"
        target="_blank"
      >
        Terms
      </a>

      <a
        href="refund.html"
        target="_blank"
      >
        Refund
      </a>

      <a
        href="delete-account.html"
        target="_blank"
      >
        Delete Account
      </a>
    `;

    document.body.appendChild(
      footer
    );
  }

  async function startSubscription(
    plan
  ){
    if(plan === "free"){
      if(
        currentAccountPlan() !==
        "free"
      ){
        premiumToast(
          "Paid subscription ko Manage Cancellation se cancel karo",
          "info"
        );

        return;
      }

      if(
        typeof selectPlan ===
        "function"
      ){
        selectPlan("free");
      }

      return;
    }

    if(
      plan !== "pro" &&
      plan !== "business"
    ){
      premiumToast(
        "Invalid plan",
        "error"
      );

      return;
    }

    if(!authToken()){
      forceOtpLogin();
      return;
    }

    if(
      typeof Razorpay ===
      "undefined"
    ){
      premiumToast(
        "Razorpay checkout script missing in index.html",
        "error"
      );

      return;
    }

    if(paymentBusy){
      premiumToast(
        "Payment window already open ho rahi hai",
        "info"
      );
      return;
    }

    paymentBusy = true;

    try{
      if(
        typeof showPaymentLoader ===
        "function"
      ){
        showPaymentLoader(
          "Creating secure subscription..."
        );
      }

      const created =
        await api(
          "/subscription/create",

          {
            method:
              "POST",

            body:
              JSON.stringify({
                plan
              })
          }
        );

      const options = {
        key:
          created.keyId,

        subscription_id:
          created.subscriptionId,

        name:
          "Vyapar AI",

        description:
          plan.toUpperCase() +
          " Monthly Plan",

        prefill: {
          name:
            created.name ||
            (
              account &&
              account.user
                ? account
                    .user.name
                : ""
            ),

          email:
            created.email ||
            (
              account &&
              account.user
                ? account
                    .user.email
                : ""
            )
        },

        notes: {
          plan:
            plan,

          app:
            "Vyapar AI"
        },

        theme: {
          color:
            "#2563eb"
        },

        handler:
          async function(
            paymentResponse
          ){
            try{
              if(
                typeof showPaymentLoader ===
                "function"
              ){
                showPaymentLoader(
                  "Verifying subscription..."
                );
              }

              const verified =
                await api(
                  "/subscription/verify",

                  {
                    method:
                      "POST",

                    body:
                      JSON.stringify({
                        razorpay_payment_id:
                          paymentResponse
                            .razorpay_payment_id,

                        razorpay_subscription_id:
                          paymentResponse
                            .razorpay_subscription_id,

                        razorpay_signature:
                          paymentResponse
                            .razorpay_signature
                      })
                  }
                );

              await refreshAccount();

              applyAccountToApp();

              if(
                typeof hidePaymentLoader ===
                "function"
              ){
                hidePaymentLoader();
              }

              if(
                typeof render ===
                "function"
              ){
                render();
              }

              await pushCloudState(
                false
              );

              if(
                typeof showPlanSuccessPopup ===
                "function"
              ){
                showPlanSuccessPopup(
                  verified.subscription &&
                  verified.subscription.plan
                    ? verified
                        .subscription
                        .plan
                    : plan
                );

              }else{
                premiumToast(
                  "Subscription activated",
                  "success"
                );
              }

              paymentBusy = false;

            }catch(error){
              paymentBusy = false;
              if(
                typeof hidePaymentLoader ===
                "function"
              ){
                hidePaymentLoader();
              }

              premiumToast(
                error.message,
                "error"
              );
            }
          },

        modal: {
          ondismiss:
            function(){
              paymentBusy = false;

              if(
                typeof hidePaymentLoader ===
                "function"
              ){
                hidePaymentLoader();
              }

              if(
                typeof showPaymentCancelPopup ===
                "function"
              ){
                showPaymentCancelPopup(
                  plan
                );
              }
            }
        }
      };

      const checkout =
        new Razorpay(options);

      checkout.on(
        "payment.failed",

        function(response){
          paymentBusy = false;

          if(
            typeof hidePaymentLoader ===
            "function"
          ){
            hidePaymentLoader();
          }

          const message =
            response &&
            response.error &&
            response.error.description
              ? response
                  .error
                  .description
              : "Payment failed";

          premiumToast(
            message,
            "error"
          );
        }
      );

      if(
        typeof hidePaymentLoader ===
        "function"
      ){
        hidePaymentLoader();
      }

      checkout.open();

    }catch(error){
      paymentBusy = false;

      if(
        typeof hidePaymentLoader ===
        "function"
      ){
        hidePaymentLoader();
      }

      premiumToast(
        error.message,
        "error"
      );
    }
  }

  function injectStyles(){
    if(
      document.getElementById(
        "productionStyles"
      )
    ){
      return;
    }

    const style =
      document.createElement(
        "style"
      );

    style.id =
      "productionStyles";

    style.textContent = `
      .production-overlay{
        position:fixed;
        inset:0;
        z-index:1000000000;
        display:flex;
        align-items:center;
        justify-content:center;
        padding:18px;
        background:
          radial-gradient(
            circle at 50% 10%,
            rgba(37,99,235,.22),
            transparent 36%
          ),
          rgba(2,6,23,.88);
        backdrop-filter:blur(18px);
        -webkit-backdrop-filter:blur(18px);
      }

      .production-modal{
        position:relative;
        width:min(94vw,420px);
        padding:28px 22px 22px;
        border:1px solid
          rgba(125,211,252,.28);
        border-radius:28px;
        color:#f8fafc;
        background:
          linear-gradient(
            160deg,
            #111827,
            #07101f 62%,
            #020617
          );
        box-shadow:
          0 35px 100px
          rgba(0,0,0,.65),
          0 0 60px
          rgba(37,99,235,.16);
        font-family:
          Inter,
          system-ui,
          sans-serif;
      }

      .production-close{
        position:absolute;
        right:15px;
        top:15px;
        width:38px;
        height:38px;
        border-radius:50%;
        border:1px solid
          rgba(255,255,255,.12);
        background:
          rgba(255,255,255,.06);
        color:#fff;
        font-size:22px;
        cursor:pointer;
      }

      .production-logo{
        width:66px;
        height:66px;
        margin:0 auto 15px;
        display:flex;
        align-items:center;
        justify-content:center;
        border-radius:21px;
        color:white;
        background:
          linear-gradient(
            135deg,
            #06b6d4,
            #2563eb,
            #4f46e5
          );
        font-size:28px;
        font-weight:950;
        box-shadow:
          0 18px 45px
          rgba(37,99,235,.36);
      }

      .production-kicker{
        text-align:center;
        color:#67e8f9;
        font-size:11px;
        font-weight:900;
        letter-spacing:1.4px;
      }

      .production-modal h2{
        text-align:center;
        margin:10px 0 7px;
        font-size:26px;
      }

      .production-muted{
        text-align:center;
        color:#94a3b8;
        font-size:13px;
        line-height:1.5;
        margin:0 0 18px;
      }

      .production-modal label{
        display:block;
        margin:12px 0 6px;
        color:#cbd5e1;
        font-size:12px;
        font-weight:800;
      }

      .production-modal input{
        width:100%;
        box-sizing:border-box;
        border:1px solid
          rgba(148,163,184,.22);
        border-radius:14px;
        padding:13px 14px;
        background:
          rgba(15,23,42,.82);
        color:#fff;
        outline:none;
      }

      .production-modal input:focus{
        border-color:#38bdf8;
        box-shadow:
          0 0 0 3px
          rgba(56,189,248,.12);
      }

      .production-primary{
        width:100%;
        margin-top:17px;
        border:0;
        border-radius:15px;
        padding:14px;
        color:#fff;
        font-weight:900;
        background:
          linear-gradient(
            120deg,
            #0891b2,
            #2563eb,
            #4f46e5
          );
        box-shadow:
          0 14px 34px
          rgba(37,99,235,.28);
        cursor:pointer;
      }

      .production-primary:disabled{
        opacity:.6;
        cursor:wait;
      }

      .production-link{
        width:100%;
        margin-top:8px;
        border:0;
        background:transparent;
        color:#93c5fd;
        padding:10px;
        font-weight:750;
        cursor:pointer;
      }

      .production-secure{
        text-align:center;
        color:#64748b;
        font-size:10px;
        margin-top:7px;
      }

      .production-error{
        margin-top:12px;
        padding:10px;
        border-radius:12px;
        background:
          rgba(239,68,68,.12);
        border:1px solid
          rgba(248,113,113,.25);
        color:#fecaca;
        font-size:12px;
      }

      .production-toast{
        position:fixed;
        left:50%;
        bottom:24px;
        z-index:1000000001;
        max-width:min(88vw,440px);
        padding:12px 16px;
        border-radius:14px;
        color:#fff;
        background:#111827;
        border:1px solid
          rgba(255,255,255,.13);
        box-shadow:
          0 20px 55px
          rgba(0,0,0,.45);
        transform:
          translate(-50%,20px);
        opacity:0;
        transition:.22s ease;
        font:
          700 13px/1.4
          Inter,
          system-ui,
          sans-serif;
        text-align:center;
      }

      .production-toast.show{
        transform:
          translate(-50%,0);
        opacity:1;
      }

      .production-toast-success{
        border-color:
          rgba(34,197,94,.45);
      }

      .production-toast-error{
        border-color:
          rgba(248,113,113,.5);
      }

      .production-account-head{
        display:flex;
        align-items:center;
        gap:12px;
      }

      .production-avatar{
        width:48px;
        height:48px;
        display:flex;
        align-items:center;
        justify-content:center;
        border-radius:16px;
        background:
          linear-gradient(
            135deg,
            #06b6d4,
            #2563eb
          );
        color:#fff;
        font-weight:950;
      }

      .production-account-head h3{
        margin:0 0 3px;
      }

      .production-account-head p{
        margin:0;
        color:
          var(--muted,#94a3b8);
        font-size:12px;
      }

      .production-plan{
        margin-left:auto;
        padding:7px 10px;
        border-radius:999px;
        background:
          rgba(37,99,235,.14);
        border:1px solid
          rgba(96,165,250,.22);
        font-size:11px;
        font-weight:900;
      }

      .production-account-grid{
        display:grid;
        grid-template-columns:
          repeat(3,1fr);
        gap:8px;
        margin-top:14px;
      }

      .production-account-grid div{
        padding:11px;
        border-radius:14px;
        background:
          rgba(255,255,255,.04);
        border:1px solid
          rgba(255,255,255,.07);
      }

      .production-account-grid span{
        display:block;
        color:
          var(--muted,#94a3b8);
        font-size:10px;
      }

      .production-account-grid b{
        display:block;
        margin-top:4px;
        font-size:12px;
        word-break:break-word;
      }

      .production-actions{
        display:flex;
        flex-wrap:wrap;
        gap:8px;
        margin-top:14px;
      }

      .production-actions button{
        border:1px solid
          rgba(148,163,184,.2);
        border-radius:12px;
        padding:10px 12px;
        background:
          rgba(255,255,255,.05);
        color:inherit;
        font-weight:800;
        cursor:pointer;
      }

      .production-actions button.primary{
        background:
          linear-gradient(
            135deg,
            #0891b2,
            #2563eb
          );
        color:#fff;
      }

      .production-actions button.danger{
        border-color:
          rgba(248,113,113,.3);
        color:#fca5a5;
      }

      .production-footer{
        display:flex;
        flex-wrap:wrap;
        justify-content:center;
        gap:12px;
        padding:24px 14px 90px;
        color:#64748b;
        font:
          600 11px
          Inter,
          system-ui,
          sans-serif;
      }

      .production-footer a{
        color:#94a3b8;
        text-decoration:none;
      }

      @media(max-width:640px){
        .production-account-grid{
          grid-template-columns:1fr;
        }

        .production-modal{
          padding:
            25px 18px 20px;
        }
      }
    `;

    document.head.appendChild(
      style
    );
  }

  const originalSave =
    typeof save === "function"
      ? save
      : null;

  if(originalSave){
    window.save =
      function(){
        const result =
          originalSave.apply(
            this,
            arguments
          );

        scheduleCloudSync();

        return result;
      };
  }

  const originalRenderSettings =
    typeof renderSettings ===
    "function"
      ? renderSettings
      : null;

  if(originalRenderSettings){
    window.renderSettings =
      function(){
        const result =
          originalRenderSettings.apply(
            this,
            arguments
          );

        appendAccountCard();

        return result;
      };
  }

  const originalRenderSubscription =
    typeof renderSubscription ===
    "function"
      ? renderSubscription
      : null;

  if(originalRenderSubscription){
    window.renderSubscription =
      function(){
        const result =
          originalRenderSubscription
            .apply(
              this,
              arguments
            );

        appendSubscriptionManagement();

        return result;
      };
  }

  const originalSelectPlan =
    typeof selectPlan ===
    "function"
      ? selectPlan
      : null;

  window.selectPlan =
    function(selectedPlan){
      if(
        selectedPlan === "free" &&
        currentAccountPlan() !==
        "free"
      ){
        premiumToast(
          "Paid subscription ko Cancel at Cycle End se manage karo",
          "info"
        );

        return;
      }

      if(originalSelectPlan){
        return originalSelectPlan(
          selectedPlan
        );
      }
    };

  window.getSubscriptionToken =
    authToken;

  window.getCurrentPlan =
    currentAccountPlan;

  window.requirePlan =
    function(requiredPlan){
      const ranks = {
        free: 0,
        pro: 1,
        business: 2
      };

      const current =
        currentAccountPlan();

      if(
        (
          ranks[current] || 0
        ) >=
        (
          ranks[requiredPlan] || 0
        )
      ){
        return true;
      }

      if(!authToken()){
        forceOtpLogin();

      }else if(
        typeof showUpgradePopup ===
        "function"
      ){
        showUpgradePopup(
          requiredPlan,
          current
        );

      }else{
        premiumToast(
          requiredPlan
            .toUpperCase() +
          " plan required",
          "info"
        );

        if(
          typeof setTab ===
          "function"
        ){
          setTab(
            "subscription"
          );
        }
      }

      return false;
    };

  window.startPayment =
    startSubscription;

  window.vyaparLogin =
    forceOtpLogin;

  window.vyaparRegister =
    forceOtpLogin;

  window.vyaparLogout =
    logoutAccount;

  window.vyaparCloudBackup =
    function(){
      pushCloudState(true);
    };

  window.vyaparCloudRestore =
    pullCloudState;

  window.vyaparCancelSubscription =
    cancelSubscription;

  window.vyaparDeleteAccount =
    deleteAccount;

  injectStyles();
  injectLegalFooter();
  applyAccountToApp();

  refreshAccount()
    .then(
      initialCloudDecision
    )
    .catch(
      function(error){
        console.warn(
          "Session restore failed:",
          error.message
        );
      }
    )
    .finally(
      function(){
        if(
          typeof render ===
          "function"
        ){
          render();
        }

        appendAccountCard();
        appendSubscriptionManagement();
      }
    );
})();
