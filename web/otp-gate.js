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
      position:fixed;
      inset:0;
      z-index:2147483647;
      display:flex;
      align-items:center;
      justify-content:center;
      padding:18px;
      background:
        radial-gradient(
          circle at 50% 5%,
          rgba(37,99,235,.24),
          transparent 38%
        ),
        #020617;
      color:#f8fafc;
      font-family:
        Inter,
        system-ui,
        sans-serif;
    }

    #vyaparOtpGate .otp-card{
      position:relative;
      width:min(94vw,420px);
      padding:28px 22px 22px;
      border-radius:28px;
      border:1px solid
        rgba(103,232,249,.25);
      background:
        radial-gradient(
          circle at top right,
          rgba(37,99,235,.20),
          transparent 35%
        ),
        linear-gradient(
          160deg,
          #111827,
          #07101f 62%,
          #020617
        );
      box-shadow:
        0 35px 100px
        rgba(0,0,0,.68),
        0 0 55px
        rgba(37,99,235,.14);
    }

    #vyaparOtpGate .otp-logo{
      width:70px;
      height:70px;
      margin:0 auto 16px;
      display:flex;
      align-items:center;
      justify-content:center;
      border-radius:23px;
      background:
        linear-gradient(
          135deg,
          #06b6d4,
          #2563eb,
          #4f46e5
        );
      font-size:30px;
      font-weight:950;
      box-shadow:
        0 18px 42px
        rgba(37,99,235,.32);
    }

    #vyaparOtpGate h1{
      margin:0 0 7px;
      text-align:center;
      font-size:27px;
    }

    #vyaparOtpGate .otp-subtitle{
      margin:0 0 20px;
      text-align:center;
      color:#94a3b8;
      font-size:13px;
      line-height:1.5;
    }

    #vyaparOtpGate label{
      display:block;
      margin:12px 0 6px;
      color:#cbd5e1;
      font-size:12px;
      font-weight:800;
    }

    #vyaparOtpGate input{
      width:100%;
      box-sizing:border-box;
      border:1px solid
        rgba(148,163,184,.22);
      border-radius:15px;
      padding:14px;
      background:
        rgba(15,23,42,.85);
      color:#fff;
      font-size:15px;
      outline:none;
    }

    #vyaparOtpGate input:focus{
      border-color:#38bdf8;
      box-shadow:
        0 0 0 3px
        rgba(56,189,248,.11);
    }

    #vyaparOtpGate #otpCode{
      text-align:center;
      font-size:25px;
      font-weight:900;
      letter-spacing:8px;
    }

    #vyaparOtpGate button{
      width:100%;
      margin-top:16px;
      border:0;
      border-radius:16px;
      padding:14px;
      color:#fff;
      background:
        linear-gradient(
          120deg,
          #0891b2,
          #2563eb,
          #4f46e5
        );
      font-size:15px;
      font-weight:900;
      cursor:pointer;
      box-shadow:
        0 15px 35px
        rgba(37,99,235,.27);
    }

    #vyaparOtpGate button:disabled{
      opacity:.55;
      cursor:wait;
    }

    #vyaparOtpGate .otp-secondary{
      margin-top:8px;
      background:transparent;
      border:1px solid
        rgba(148,163,184,.18);
      box-shadow:none;
      color:#93c5fd;
    }

    #vyaparOtpGate .otp-message{
      display:none;
      margin-top:13px;
      padding:11px;
      border-radius:13px;
      font-size:12px;
      line-height:1.4;
    }

    #vyaparOtpGate .otp-message.error{
      display:block;
      color:#fecaca;
      background:
        rgba(239,68,68,.12);
      border:1px solid
        rgba(248,113,113,.25);
    }

    #vyaparOtpGate .otp-message.success{
      display:block;
      color:#bbf7d0;
      background:
        rgba(34,197,94,.10);
      border:1px solid
        rgba(74,222,128,.22);
    }

    #vyaparOtpGate .otp-secure{
      margin-top:13px;
      text-align:center;
      color:#64748b;
      font-size:10px;
    }
  `;

  document.head.appendChild(style);

  const gate =
    document.createElement("div");

  gate.id =
    "vyaparOtpGate";

  gate.innerHTML = `
    <div class="otp-card">
      <div class="otp-logo">V</div>

      <h1>Welcome to Vyapar AI</h1>

      <p
        class="otp-subtitle"
        id="otpSubtitle"
      >
        Secure email login ke baad aapka dashboard open hoga.
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
          Send Secure Code
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
          Verify & Open Dashboard
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
          "Send Secure Code";
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
          "Verify & Open Dashboard";
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
        "Secure email login ke baad aapka dashboard open hoga.";

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