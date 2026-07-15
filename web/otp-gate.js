(function(){
  "use strict";

  const API_BASE =
    "https://vypar-backend.onrender.com";

  const TOKEN_KEY =
    "vyapar_ai_auth_token_v1";

  const ACCOUNT_KEY =
    "vyapar_ai_account_cache_v1";

  const style =
    document.createElement("style");

  style.textContent = `
    #vyaparOtpGate{
      --otp-bg:#06111f;
      --otp-card:#0b1929;
      --otp-input:#102238;
      --otp-border:#1f3a55;
      --otp-text:#eef7ff;
      --otp-muted:#91a8bd;
      --otp-label:#c5d5e4;
      --otp-accent:#2f7df6;
      --otp-shadow:rgba(0,5,12,.46);
      --otp-error-text:#ffb7c0;
      --otp-error-bg:rgba(255,77,97,.09);
      --otp-error-border:rgba(255,77,97,.28);
      --otp-success-text:#a9f3cf;
      --otp-success-bg:rgba(43,217,139,.08);
      --otp-success-border:rgba(43,217,139,.25);
      position:fixed;
      inset:0;
      z-index:2147483647;
      display:flex;
      align-items:center;
      justify-content:center;
      padding:20px 16px calc(20px + env(safe-area-inset-bottom));
      background:var(--otp-bg);
      color:var(--otp-text);
      font-family:Inter,Roboto,system-ui,-apple-system,"Segoe UI",Arial,sans-serif;
      -webkit-font-smoothing:antialiased;
    }

    #vyaparOtpGate.otp-light{
      --otp-bg:#f3f8fd;
      --otp-card:#ffffff;
      --otp-input:#edf4fb;
      --otp-border:#cbdceb;
      --otp-text:#10273b;
      --otp-muted:#5f768b;
      --otp-label:#38546c;
      --otp-accent:#2369d8;
      --otp-shadow:rgba(44,73,99,.18);
      --otp-error-text:#b82d45;
      --otp-error-bg:rgba(220,63,88,.08);
      --otp-error-border:rgba(220,63,88,.22);
      --otp-success-text:#0e704c;
      --otp-success-bg:rgba(19,141,96,.08);
      --otp-success-border:rgba(19,141,96,.22);
    }

    #vyaparOtpGate .otp-card{
      width:min(100%,390px);
      padding:24px 18px 18px;
      border:1px solid var(--otp-border);
      border-radius:22px;
      background:var(--otp-card);
      box-shadow:0 24px 70px var(--otp-shadow);
    }

    #vyaparOtpGate .otp-logo{
      width:58px;
      height:58px;
      margin:0 auto 14px;
      display:flex;
      align-items:center;
      justify-content:center;
      border-radius:17px;
      background:var(--otp-accent);
      color:#fff;
      font-size:25px;
      font-weight:950;
      box-shadow:none;
    }

    #vyaparOtpGate h1{
      margin:0 0 6px;
      text-align:center;
      font-size:24px;
      letter-spacing:-.035em;
    }

    #vyaparOtpGate .otp-subtitle{
      margin:0 0 20px;
      text-align:center;
      color:var(--otp-muted);
      font-size:12.5px;
      line-height:1.5;
    }

    #vyaparOtpGate label{
      display:block;
      margin:12px 0 6px;
      color:var(--otp-label);
      font-size:11.5px;
      font-weight:800;
    }

    #vyaparOtpGate input{
      width:100%;
      min-height:50px;
      box-sizing:border-box;
      border:1px solid var(--otp-border);
      border-radius:13px;
      padding:13px 14px;
      background:var(--otp-input);
      color:var(--otp-text);
      font-size:16px;
      outline:none;
      -webkit-tap-highlight-color:transparent;
    }

    #vyaparOtpGate input:focus{
      border-color:var(--otp-accent);
      box-shadow:0 0 0 3px rgba(91,140,255,.14);
    }

    #vyaparOtpGate #otpCode{
      text-align:center;
      font-size:24px;
      font-weight:900;
      letter-spacing:7px;
    }

    #vyaparOtpGate button{
      width:100%;
      min-height:50px;
      margin-top:15px;
      border:0;
      border-radius:13px;
      padding:12px 14px;
      color:#fff;
      background:var(--otp-accent);
      font-size:14px;
      font-weight:900;
      cursor:pointer;
      box-shadow:none;
      -webkit-tap-highlight-color:transparent;
    }

    #vyaparOtpGate button:active{transform:scale(.99)}
    #vyaparOtpGate button:disabled{opacity:.55;cursor:wait}

    #vyaparOtpGate .otp-secondary{
      margin-top:8px;
      background:var(--otp-input);
      border:1px solid var(--otp-border);
      color:var(--otp-text);
    }

    #vyaparOtpGate .otp-message{
      display:none;
      margin-top:12px;
      padding:11px 12px;
      border-radius:12px;
      font-size:12px;
      line-height:1.45;
    }

    #vyaparOtpGate .otp-message.error{
      display:block;
      color:var(--otp-error-text);
      background:var(--otp-error-bg);
      border:1px solid var(--otp-error-border);
    }

    #vyaparOtpGate .otp-message.success{
      display:block;
      color:var(--otp-success-text);
      background:var(--otp-success-bg);
      border:1px solid var(--otp-success-border);
    }

    #vyaparOtpGate .otp-secure{
      margin-top:13px;
      text-align:center;
      color:var(--otp-muted);
      font-size:10px;
    }
  `;

  document.head.appendChild(style);

  function savedLightTheme(){
    try{
      const stored = JSON.parse(localStorage.getItem("vyapar_ai_prod_v1") || "{}");
      return Boolean(stored && stored.settings && stored.settings.theme === "light");
    }catch(error){
      return false;
    }
  }

  const gate =
    document.createElement("div");

  gate.id =
    "vyaparOtpGate";

  gate.classList.toggle("otp-light", savedLightTheme());

  gate.innerHTML = `
    <div class="otp-card">
      <div class="otp-logo">V</div>

      <h1>Login to Vyapar AI</h1>

      <p
        class="otp-subtitle"
        id="otpSubtitle"
      >
        Email OTP verify karke dashboard open karo.
      </p>

      <div id="emailStep">
        <label>Your Name</label>

        <input
          id="otpName"
          autocomplete="name"
          placeholder="Your name"
        >

        <label>Email Address</label>

        <input
          id="otpEmail"
          type="email"
          autocomplete="email"
          placeholder="name@example.com"
        >

        <button id="sendOtpButton">
          Send OTP
        </button>
      </div>

      <div
        id="codeStep"
        style="display:none"
      >
        <label>
          Enter 6-digit OTP
        </label>

        <input
          id="otpCode"
          inputmode="numeric"
          maxlength="6"
          autocomplete="one-time-code"
          placeholder="000000"
        >

        <button id="verifyOtpButton">
          Verify & Continue
        </button>

        <button
          id="changeEmailButton"
          class="otp-secondary"
        >
          Change Email
        </button>
      </div>

      <div
        id="otpMessage"
        class="otp-message"
      ></div>

      <div class="otp-secure">
        🔒 Secure login • OTP expires in 10 minutes
      </div>
    </div>
  `;

  document.body.prepend(gate);

  const otpThemeObserver = new MutationObserver(function(){
    gate.classList.toggle(
      "otp-light",
      document.body.classList.contains("theme-light") || savedLightTheme()
    );
  });

  otpThemeObserver.observe(document.body, {
    attributes:true,
    attributeFilter:["class"]
  });

  const emailStep =
    document.getElementById("emailStep");

  const codeStep =
    document.getElementById("codeStep");

  const messageBox =
    document.getElementById("otpMessage");

  const emailInput =
    document.getElementById("otpEmail");

  const nameInput =
    document.getElementById("otpName");

  const codeInput =
    document.getElementById("otpCode");

  function showMessage(
    message,
    type
  ){
    messageBox.textContent =
      message;

    messageBox.className =
      "otp-message " +
      (type || "error");
  }

  async function readResponse(
    response
  ){
    const text =
      await response.text();

    let data = {};

    try{
      data =
        text
          ? JSON.parse(text)
          : {};
    }catch(error){
      throw new Error(
        "Backend valid response nahi bhej raha"
      );
    }

    if(
      !response.ok ||
      data.success === false
    ){
      throw new Error(
        data.message ||
        "Request failed"
      );
    }

    return data;
  }

  document.getElementById(
    "sendOtpButton"
  ).onclick =
    async function(){
      const button = this;

      const email =
        emailInput.value
          .trim()
          .toLowerCase();

      if(
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/
          .test(email)
      ){
        showMessage(
          "Valid email enter karo",
          "error"
        );

        return;
      }

      button.disabled = true;
      button.textContent =
        "Sending code...";

      try{
        const response =
          await fetch(
            API_BASE +
            "/auth/request-otp",
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json"
              },

              body:
                JSON.stringify({
                  email
                })
            }
          );

        const data =
          await readResponse(
            response
          );

        emailInput.readOnly =
          true;

        emailStep.style.display =
          "none";

        codeStep.style.display =
          "block";

        codeInput.focus();

        showMessage(
          data.message ||
          "OTP email par bhej diya gaya",
          "success"
        );

      }catch(error){
        showMessage(
          error.message,
          "error"
        );

      }finally{
        button.disabled = false;

        button.textContent =
          "Send OTP";
      }
    };

  document.getElementById(
    "verifyOtpButton"
  ).onclick =
    async function(){
      const button = this;

      const email =
        emailInput.value
          .trim()
          .toLowerCase();

      const code =
        codeInput.value
          .replace(/\D/g, "")
          .slice(0, 6);

      const name =
        nameInput.value.trim();

      if(code.length !== 6){
        showMessage(
          "6-digit OTP enter karo",
          "error"
        );

        return;
      }

      button.disabled = true;

      button.textContent =
        "Verifying...";

      try{
        const response =
          await fetch(
            API_BASE +
            "/auth/verify-otp",
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json"
              },

              body:
                JSON.stringify({
                  email,
                  code,
                  name
                })
            }
          );

        const data =
          await readResponse(
            response
          );

        localStorage.setItem(
          TOKEN_KEY,
          data.token
        );

        localStorage.setItem(
          ACCOUNT_KEY,
          JSON.stringify({
            user:
              data.user,

            subscription:
              data.subscription
          })
        );

        showMessage(
          "Login successful. Dashboard opening...",
          "success"
        );

        setTimeout(function(){
          location.reload();
        }, 500);

      }catch(error){
        showMessage(
          error.message,
          "error"
        );

      }finally{
        button.disabled = false;

        button.textContent =
          "Verify & Continue";
      }
    };

  document.getElementById(
    "changeEmailButton"
  ).onclick =
    function(){
      emailInput.readOnly =
        false;

      codeInput.value = "";

      codeStep.style.display =
        "none";

      emailStep.style.display =
        "block";

      messageBox.style.display =
        "none";
    };

  async function restoreSession(){
    const token =
      String(
        localStorage.getItem(
          TOKEN_KEY
        ) || ""
      ).trim();

    if(!token){
      return;
    }

    document.getElementById(
      "otpSubtitle"
    ).textContent =
      "Secure session checking...";

    emailStep.style.display =
      "none";

    try{
      const response =
        await fetch(
          API_BASE + "/auth/me",
          {
            headers: {
              "Authorization":
                "Bearer " + token
            }
          }
        );

      const data =
        await readResponse(
          response
        );

      localStorage.setItem(
        ACCOUNT_KEY,
        JSON.stringify({
          user:
            data.user,

          subscription:
            data.subscription
        })
      );

      gate.remove();

    }catch(error){
      localStorage.removeItem(
        TOKEN_KEY
      );

      localStorage.removeItem(
        ACCOUNT_KEY
      );

      document.getElementById(
        "otpSubtitle"
      ).textContent =
        "Email OTP verify karke dashboard open karo.";

      emailStep.style.display =
        "block";

      showMessage(
        "Session expired. Email OTP se dobara login karo.",
        "error"
      );
    }
  }

  restoreSession();
})();