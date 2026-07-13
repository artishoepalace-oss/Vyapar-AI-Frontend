(function () {
  "use strict";

  const config = window.VYAPAR_CONFIG || {};
  const API_BASE = String(
    config.apiBase || "https://vypar-backend.onrender.com"
  ).replace(/\/$/, "");

  const TOKEN_KEY = "vyapar_ai_auth_token_v1";
  const ACCOUNT_KEY = "vyapar_ai_account_cache_v1";
  const REQUEST_TIMEOUT_MS = 25000;

  document.body.classList.add("auth-pending");

  const style = document.createElement("style");
  style.id = "vyaparOtpGateStyles";
  style.textContent = `
    #vyaparOtpGate {
      position: fixed;
      inset: 0;
      z-index: 2147483647;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 18px;
      overflow: auto;
      background:
        radial-gradient(circle at 50% 0%, rgba(37, 99, 235, .28), transparent 42%),
        #020617;
      color: #f8fafc;
      font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }

    #vyaparOtpGate * {
      box-sizing: border-box;
    }

    #vyaparOtpGate .otp-card {
      width: min(94vw, 430px);
      padding: 28px 22px 22px;
      border: 1px solid rgba(103, 232, 249, .24);
      border-radius: 28px;
      background:
        radial-gradient(circle at top right, rgba(37, 99, 235, .20), transparent 36%),
        linear-gradient(160deg, #111827, #07101f 62%, #020617);
      box-shadow: 0 35px 100px rgba(0, 0, 0, .66), 0 0 55px rgba(37, 99, 235, .14);
    }

    #vyaparOtpGate .otp-logo {
      width: 70px;
      height: 70px;
      margin: 0 auto 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 23px;
      background: linear-gradient(135deg, #06b6d4, #2563eb, #4f46e5);
      font-size: 30px;
      font-weight: 950;
      box-shadow: 0 18px 42px rgba(37, 99, 235, .32);
    }

    #vyaparOtpGate h1 {
      margin: 0 0 7px;
      text-align: center;
      font-size: 27px;
    }

    #vyaparOtpGate .otp-subtitle {
      margin: 0 0 20px;
      text-align: center;
      color: #94a3b8;
      font-size: 13px;
      line-height: 1.55;
    }

    #vyaparOtpGate .otp-email-preview {
      margin: 0 0 14px;
      padding: 10px 12px;
      border: 1px solid rgba(56, 189, 248, .18);
      border-radius: 13px;
      background: rgba(14, 116, 144, .10);
      color: #bae6fd;
      text-align: center;
      font-size: 13px;
      overflow-wrap: anywhere;
    }

    #vyaparOtpGate label {
      display: block;
      margin: 12px 0 6px;
      color: #cbd5e1;
      font-size: 12px;
      font-weight: 800;
    }

    #vyaparOtpGate input {
      width: 100%;
      border: 1px solid rgba(148, 163, 184, .22);
      border-radius: 15px;
      padding: 14px;
      background: rgba(15, 23, 42, .86);
      color: #fff;
      font-size: 15px;
      outline: none;
    }

    #vyaparOtpGate input:focus {
      border-color: #38bdf8;
      box-shadow: 0 0 0 3px rgba(56, 189, 248, .11);
    }

    #vyaparOtpGate #otpCode {
      text-align: center;
      font-size: 25px;
      font-weight: 900;
      letter-spacing: 8px;
    }

    #vyaparOtpGate button {
      width: 100%;
      min-height: 48px;
      margin-top: 16px;
      border: 0;
      border-radius: 16px;
      padding: 13px 14px;
      color: #fff;
      background: linear-gradient(120deg, #0891b2, #2563eb, #4f46e5);
      font-size: 15px;
      font-weight: 900;
      cursor: pointer;
      box-shadow: 0 15px 35px rgba(37, 99, 235, .27);
    }

    #vyaparOtpGate button:disabled {
      opacity: .55;
      cursor: wait;
    }

    #vyaparOtpGate .otp-secondary {
      margin-top: 9px;
      border: 1px solid rgba(148, 163, 184, .18);
      background: transparent;
      box-shadow: none;
      color: #93c5fd;
    }

    #vyaparOtpGate .otp-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 9px;
    }

    #vyaparOtpGate .otp-message {
      display: none;
      margin-top: 13px;
      padding: 11px;
      border-radius: 13px;
      font-size: 12px;
      line-height: 1.45;
    }

    #vyaparOtpGate .otp-message.error {
      display: block;
      color: #fecaca;
      background: rgba(239, 68, 68, .12);
      border: 1px solid rgba(248, 113, 113, .25);
    }

    #vyaparOtpGate .otp-message.success {
      display: block;
      color: #bbf7d0;
      background: rgba(34, 197, 94, .10);
      border: 1px solid rgba(74, 222, 128, .22);
    }

    #vyaparOtpGate .otp-message.info {
      display: block;
      color: #bfdbfe;
      background: rgba(59, 130, 246, .10);
      border: 1px solid rgba(96, 165, 250, .22);
    }

    #vyaparOtpGate .otp-secure {
      margin-top: 13px;
      text-align: center;
      color: #64748b;
      font-size: 10px;
    }

    #vyaparOtpGate .otp-spinner {
      width: 34px;
      height: 34px;
      margin: 18px auto;
      border: 3px solid rgba(255,255,255,.16);
      border-top-color: #38bdf8;
      border-radius: 50%;
      animation: vyaparOtpSpin .8s linear infinite;
    }

    @keyframes vyaparOtpSpin {
      to { transform: rotate(360deg); }
    }

    @media (max-width: 420px) {
      #vyaparOtpGate .otp-card {
        padding: 24px 17px 19px;
      }
      #vyaparOtpGate .otp-row {
        grid-template-columns: 1fr;
      }
    }
  `;
  document.head.appendChild(style);

  const gate = document.createElement("div");
  gate.id = "vyaparOtpGate";
  gate.innerHTML = `
    <div class="otp-card">
      <div class="otp-logo">V</div>
      <h1>Welcome to Vyapar AI</h1>
      <p class="otp-subtitle" id="otpSubtitle">
        Secure email login ke baad dashboard open hoga.
      </p>

      <div id="sessionStep">
        <div class="otp-spinner"></div>
        <p class="otp-subtitle">Secure session check ho rahi hai...</p>
      </div>

      <form id="emailStep" style="display:none" novalidate>
        <label for="otpName">Your Name</label>
        <input id="otpName" autocomplete="name" maxlength="80" placeholder="Your name" />

        <label for="otpEmail">Email Address</label>
        <input id="otpEmail" type="email" autocomplete="email" maxlength="160" placeholder="name@example.com" />

        <button id="sendOtpButton" type="submit">Send Secure Code</button>
      </form>

      <form id="codeStep" style="display:none" novalidate>
        <div class="otp-email-preview" id="otpEmailPreview"></div>
        <label for="otpCode">Enter 6-digit OTP</label>
        <input id="otpCode" inputmode="numeric" pattern="[0-9]*" maxlength="6" autocomplete="one-time-code" placeholder="000000" />

        <button id="verifyOtpButton" type="submit">Verify & Open Dashboard</button>

        <div class="otp-row">
          <button id="resendOtpButton" type="button" class="otp-secondary">Resend OTP</button>
          <button id="changeEmailButton" type="button" class="otp-secondary">Change Email</button>
        </div>
      </form>

      <div id="sessionErrorStep" style="display:none">
        <button id="retrySessionButton" type="button">Retry Connection</button>
        <button id="useAnotherEmailButton" type="button" class="otp-secondary">Login with another email</button>
      </div>

      <div id="otpMessage" class="otp-message" role="status" aria-live="polite"></div>
      <div class="otp-secure">🔒 OTP expires in 10 minutes • Never share your code</div>
    </div>
  `;
  document.body.prepend(gate);

  const sessionStep = document.getElementById("sessionStep");
  const emailStep = document.getElementById("emailStep");
  const codeStep = document.getElementById("codeStep");
  const sessionErrorStep = document.getElementById("sessionErrorStep");
  const subtitle = document.getElementById("otpSubtitle");
  const messageBox = document.getElementById("otpMessage");
  const emailInput = document.getElementById("otpEmail");
  const nameInput = document.getElementById("otpName");
  const codeInput = document.getElementById("otpCode");
  const emailPreview = document.getElementById("otpEmailPreview");
  const sendButton = document.getElementById("sendOtpButton");
  const verifyButton = document.getElementById("verifyOtpButton");
  const resendButton = document.getElementById("resendOtpButton");

  let resendTimer = null;
  let resendSeconds = 0;

  function hideAllSteps() {
    sessionStep.style.display = "none";
    emailStep.style.display = "none";
    codeStep.style.display = "none";
    sessionErrorStep.style.display = "none";
  }

  function showMessage(message, type) {
    if (!message) {
      messageBox.textContent = "";
      messageBox.className = "otp-message";
      return;
    }

    messageBox.textContent = message;
    messageBox.className = "otp-message " + (type || "error");
  }

  function setButtonBusy(button, busy, busyText, normalText) {
    button.disabled = Boolean(busy);
    button.textContent = busy ? busyText : normalText;
  }

  function clearSession() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(ACCOUNT_KEY);
  }

  function saveSession(data) {
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(
      ACCOUNT_KEY,
      JSON.stringify({
        user: data.user,
        subscription: data.subscription
      })
    );
  }

  function unlockDashboard(data) {
    if (data && data.user) {
      localStorage.setItem(
        ACCOUNT_KEY,
        JSON.stringify({
          user: data.user,
          subscription: data.subscription
        })
      );
    }

    document.body.classList.remove("auth-pending");
    gate.remove();

    window.dispatchEvent(
      new CustomEvent("vyapar-auth-ready", {
        detail: data || null
      })
    );
  }

  function showLogin(message) {
    hideAllSteps();
    emailStep.style.display = "block";
    subtitle.textContent = "Secure email login ke baad dashboard open hoga.";
    showMessage(message || "", message ? "info" : "");
    setTimeout(function () {
      if (!nameInput.value.trim()) {
        nameInput.focus();
      } else {
        emailInput.focus();
      }
    }, 50);
  }

  function showCodeStep(email, message) {
    hideAllSteps();
    codeStep.style.display = "block";
    emailPreview.textContent = email;
    subtitle.textContent = "Email par bheja gaya 6-digit code enter karo.";
    showMessage(message || "OTP email par bhej diya gaya", "success");
    codeInput.focus();
  }

  function showSessionError(message) {
    hideAllSteps();
    sessionErrorStep.style.display = "block";
    subtitle.textContent = "Backend se secure connection nahi ho pa raha.";
    showMessage(message, "error");
  }

  async function request(path, options) {
    const controller = new AbortController();
    const timeout = setTimeout(function () {
      controller.abort();
    }, REQUEST_TIMEOUT_MS);

    let response;

    try {
      response = await fetch(API_BASE + path, {
        ...(options || {}),
        signal: controller.signal
      });
    } catch (error) {
      if (error && error.name === "AbortError") {
        throw new Error("Backend response me zyada time lag raha hai. Retry karo.");
      }
      throw new Error("Backend connect nahi hua. Internet aur Render service check karo.");
    } finally {
      clearTimeout(timeout);
    }

    const raw = await response.text();
    let data = {};

    try {
      data = raw ? JSON.parse(raw) : {};
    } catch (error) {
      const invalidError = new Error("Backend ne valid response nahi bheja.");
      invalidError.status = response.status;
      throw invalidError;
    }

    if (!response.ok || data.success === false) {
      const apiError = new Error(data.message || "Request failed");
      apiError.status = response.status;
      apiError.code = data.code || "REQUEST_FAILED";
      throw apiError;
    }

    return data;
  }

  function updateResendButton() {
    if (resendSeconds > 0) {
      resendButton.disabled = true;
      resendButton.textContent = "Resend in " + resendSeconds + "s";
      return;
    }

    resendButton.disabled = false;
    resendButton.textContent = "Resend OTP";
  }

  function startResendTimer(seconds) {
    clearInterval(resendTimer);
    resendSeconds = Number(seconds) || 60;
    updateResendButton();

    resendTimer = setInterval(function () {
      resendSeconds -= 1;
      updateResendButton();

      if (resendSeconds <= 0) {
        clearInterval(resendTimer);
        resendTimer = null;
      }
    }, 1000);
  }

  async function sendOtp() {
    const email = emailInput.value.trim().toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showMessage("Valid email enter karo", "error");
      emailInput.focus();
      return;
    }

    setButtonBusy(sendButton, true, "Sending code...", "Send Secure Code");
    resendButton.disabled = true;

    try {
      const data = await request("/auth/request-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email })
      });

      emailInput.readOnly = true;
      showCodeStep(email, data.message);
      startResendTimer(60);
    } catch (error) {
      showMessage(error.message, "error");
    } finally {
      setButtonBusy(sendButton, false, "Sending code...", "Send Secure Code");
      if (resendSeconds <= 0) {
        resendButton.disabled = false;
      }
    }
  }

  async function verifyOtp() {
    const email = emailInput.value.trim().toLowerCase();
    const code = codeInput.value.replace(/\D/g, "").slice(0, 6);
    const name = nameInput.value.trim().slice(0, 80);

    if (code.length !== 6) {
      showMessage("6-digit OTP enter karo", "error");
      codeInput.focus();
      return;
    }

    setButtonBusy(verifyButton, true, "Verifying...", "Verify & Open Dashboard");

    try {
      const data = await request("/auth/verify-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, code, name })
      });

      saveSession(data);
      showMessage("Login successful. Dashboard opening...", "success");

      setTimeout(function () {
        window.location.reload();
      }, 350);
    } catch (error) {
      showMessage(error.message, "error");
      codeInput.select();
    } finally {
      setButtonBusy(verifyButton, false, "Verifying...", "Verify & Open Dashboard");
    }
  }

  async function resendOtp() {
    if (resendSeconds > 0) {
      return;
    }

    const email = emailInput.value.trim().toLowerCase();
    resendButton.disabled = true;
    resendButton.textContent = "Sending...";

    try {
      const data = await request("/auth/request-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email })
      });

      codeInput.value = "";
      showMessage(data.message || "Naya OTP bhej diya gaya", "success");
      startResendTimer(60);
      codeInput.focus();
    } catch (error) {
      showMessage(error.message, "error");
      updateResendButton();
    }
  }

  async function restoreSession() {
    const token = String(localStorage.getItem(TOKEN_KEY) || "").trim();

    if (!token) {
      showLogin();
      return;
    }

    hideAllSteps();
    sessionStep.style.display = "block";
    subtitle.textContent = "Secure session check ho rahi hai...";
    showMessage("", "");

    try {
      const data = await request("/auth/me", {
        method: "GET",
        headers: {
          Authorization: "Bearer " + token
        }
      });

      unlockDashboard(data);
    } catch (error) {
      if (error.status === 401) {
        clearSession();
        showLogin("Session expire ho gaya. Email OTP se dobara login karo.");
        return;
      }

      showSessionError(error.message);
    }
  }

  emailStep.addEventListener("submit", function (event) {
    event.preventDefault();
    sendOtp();
  });

  codeStep.addEventListener("submit", function (event) {
    event.preventDefault();
    verifyOtp();
  });

  codeInput.addEventListener("input", function () {
    this.value = this.value.replace(/\D/g, "").slice(0, 6);
  });

  resendButton.addEventListener("click", resendOtp);

  document.getElementById("changeEmailButton").addEventListener("click", function () {
    clearInterval(resendTimer);
    resendTimer = null;
    resendSeconds = 0;
    emailInput.readOnly = false;
    codeInput.value = "";
    showLogin();
    emailInput.focus();
  });

  document.getElementById("retrySessionButton").addEventListener("click", restoreSession);

  document.getElementById("useAnotherEmailButton").addEventListener("click", function () {
    clearSession();
    showLogin();
  });

  window.VyaparAuth = {
    tokenKey: TOKEN_KEY,
    accountKey: ACCOUNT_KEY,
    apiBase: API_BASE,
    logout: function () {
      clearSession();
      window.location.reload();
    },
    requireLogin: function () {
      clearSession();
      window.location.reload();
    }
  };

  restoreSession();
})();
