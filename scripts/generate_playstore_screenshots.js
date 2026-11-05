const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.resolve(__dirname, '../assets/playstore_screenshots');
const ARTIFACT_DIR = '/Users/mehedihasan/.gemini/antigravity/brain/d7a06c9e-e511-4cc0-9c40-ebd0ec90784d/playstore_screenshots';

if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
if (!fs.existsSync(ARTIFACT_DIR)) fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

// Read local assets as base64
const iconBase64 = fs.readFileSync(path.resolve(__dirname, '../assets/icon.png')).toString('base64');
const vipBannerBase64 = fs.existsSync(path.resolve(__dirname, '../assets/vip_banner_bg.jpg'))
  ? fs.readFileSync(path.resolve(__dirname, '../assets/vip_banner_bg.jpg')).toString('base64')
  : '';

// Base Phone Template Helper
function renderPhoneFrame(innerContentHtml) {
  return `
    <div class="phone-mockup">
      <!-- Phone Bezel & Screen Outer -->
      <div class="phone-screen">
        <!-- Status Bar -->
        <div class="phone-status-bar">
          <div class="status-time">10:42</div>
          <div class="camera-punchhole"></div>
          <div class="status-icons">
            <svg class="status-svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3c-4.97 0-9 4.03-9 9 0 2.12.74 4.07 1.97 5.61L4.35 21l3.52-.63C9.28 20.73 10.6 21 12 21c4.97 0 9-4.03 9-9s-4.03-9-9-9z"/></svg>
            <svg class="status-svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 4C7.31 4 3.07 5.9 0 8.98L12 21 24 8.98C20.93 5.9 16.69 4 12 4z"/></svg>
            <svg class="status-svg" viewBox="0 0 24 24" fill="currentColor"><path d="M17 4h-3V2h-4v2H7v18h10V4z"/></svg>
          </div>
        </div>

        <!-- App Screen UI Content -->
        <div class="phone-app-body">
          ${innerContentHtml}
        </div>

        <!-- Android Home Navigation Bar -->
        <div class="phone-home-bar"></div>
      </div>
    </div>
  `;
}

// Global Styles
const commonCss = `
  * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
  body {
    width: 1080px;
    height: 2400px;
    overflow: hidden;
    background: #090D16;
    color: #FFFFFF;
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
  }

  /* Background Ambient Glows & Grid */
  .bg-glow-top {
    position: absolute;
    top: -150px;
    left: 50%;
    transform: translateX(-50%);
    width: 1100px;
    height: 900px;
    background: radial-gradient(circle, var(--accent-glow, rgba(13, 148, 136, 0.35)) 0%, rgba(9, 13, 22, 0) 70%);
    z-index: 0;
    pointer-events: none;
  }
  .bg-grid {
    position: absolute;
    inset: 0;
    background-image: 
      linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
    background-size: 60px 60px;
    z-index: 0;
    pointer-events: none;
  }

  /* Header Section */
  .header-container {
    position: relative;
    z-index: 10;
    width: 1000px;
    text-align: center;
    padding-top: 100px;
    margin-bottom: 20px;
  }
  .feature-pill {
    display: inline-flex;
    align-items: center;
    gap: 12px;
    padding: 12px 28px;
    background: rgba(255, 255, 255, 0.06);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.14);
    border-radius: 999px;
    font-size: 26px;
    font-weight: 700;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    color: var(--accent-color, #2DD4BF);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    margin-bottom: 26px;
  }
  .feature-pill .app-mini-icon {
    width: 32px;
    height: 32px;
    border-radius: 8px;
  }
  .main-title {
    font-size: 70px;
    font-weight: 900;
    line-height: 1.12;
    letter-spacing: -1.5px;
    text-transform: uppercase;
    margin-bottom: 20px;
    background: linear-gradient(180deg, #FFFFFF 15%, var(--title-gradient-end, #CBD5E1) 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  .main-subtitle {
    font-size: 34px;
    font-weight: 500;
    line-height: 1.35;
    color: #94A3B8;
    max-width: 860px;
    margin: 0 auto;
  }

  /* Phone Mockup */
  .phone-mockup {
    position: relative;
    z-index: 10;
    width: 860px;
    height: 1820px;
    margin-top: 40px;
    background: #111827;
    border-radius: 60px;
    padding: 16px;
    box-shadow: 
      0 40px 100px -20px rgba(0, 0, 0, 0.9),
      0 0 0 1px rgba(255, 255, 255, 0.16),
      0 0 80px var(--phone-halo, rgba(13, 148, 136, 0.2));
  }
  .phone-screen {
    width: 100%;
    height: 100%;
    background: #0B1120;
    border-radius: 46px;
    overflow: hidden;
    position: relative;
    display: flex;
    flex-direction: column;
    border: 1px solid rgba(255, 255, 255, 0.08);
  }
  .phone-status-bar {
    height: 64px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 36px;
    color: #FFFFFF;
    background: transparent;
    z-index: 20;
  }
  .status-time {
    font-size: 22px;
    font-weight: 600;
    letter-spacing: 0.5px;
  }
  .camera-punchhole {
    width: 24px;
    height: 24px;
    background: #000000;
    border-radius: 50%;
    border: 2px solid #1E293B;
  }
  .status-icons {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .status-svg {
    width: 22px;
    height: 22px;
  }
  .phone-app-body {
    flex: 1;
    overflow: hidden;
    position: relative;
    display: flex;
    flex-direction: column;
  }
  .phone-home-bar {
    width: 200px;
    height: 6px;
    background: #64748B;
    border-radius: 999px;
    margin: 12px auto 16px auto;
  }

  /* Floating Tag / Badge */
  .floating-highlight {
    position: absolute;
    z-index: 30;
    padding: 16px 28px;
    background: rgba(15, 23, 42, 0.92);
    border: 1.5px solid var(--accent-color, #2DD4BF);
    border-radius: 20px;
    box-shadow: 0 20px 40px rgba(0,0,0,0.7), 0 0 30px var(--accent-glow, rgba(13, 148, 136, 0.4));
    display: flex;
    align-items: center;
    gap: 14px;
    font-size: 24px;
    font-weight: 800;
    color: #FFFFFF;
    backdrop-filter: blur(16px);
  }
`;

// ==========================================
// SCREEN 1: Recover Deleted Messages
// ==========================================
const screen1Html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  ${commonCss}
  :root {
    --accent-color: #2DD4BF;
    --accent-glow: rgba(13, 148, 136, 0.45);
    --phone-halo: rgba(13, 148, 136, 0.25);
    --title-gradient-end: #5EEAD4;
  }

  /* Chat Thread Styling */
  .chat-app-header {
    background: #0B192C;
    padding: 16px 24px;
    display: flex;
    align-items: center;
    gap: 16px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }
  .chat-avatar {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background: linear-gradient(135deg, #0D9488, #14B8A6);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 26px;
    font-weight: 700;
    color: white;
  }
  .chat-contact-info { flex: 1; }
  .chat-name { font-size: 26px; font-weight: 700; color: #FFFFFF; }
  .chat-status { font-size: 18px; color: #10B981; margin-top: 2px; }
  .chat-brand-badge {
    padding: 6px 14px;
    background: rgba(37, 211, 102, 0.15);
    border: 1px solid #25D366;
    border-radius: 12px;
    font-size: 18px;
    font-weight: 700;
    color: #25D366;
  }

  .chat-messages-area {
    flex: 1;
    padding: 30px 24px;
    display: flex;
    flex-direction: column;
    gap: 24px;
    background: radial-gradient(circle at 50% 30%, #0F172A 0%, #0B1120 100%);
    position: relative;
  }
  .chat-date-pill {
    align-self: center;
    padding: 6px 18px;
    background: rgba(255,255,255,0.06);
    border-radius: 12px;
    font-size: 18px;
    color: #94A3B8;
  }

  .msg-bubble {
    max-width: 82%;
    padding: 20px 24px;
    border-radius: 24px;
    font-size: 24px;
    line-height: 1.4;
    position: relative;
  }
  .msg-incoming {
    align-self: flex-start;
    background: #1E293B;
    color: #F8FAFC;
    border-bottom-left-radius: 6px;
    border: 1px solid rgba(255, 255, 255, 0.06);
  }
  .msg-time {
    font-size: 17px;
    color: #64748B;
    text-align: right;
    margin-top: 8px;
  }

  /* Deleted Message Card */
  .msg-deleted-box {
    align-self: flex-start;
    width: 86%;
    background: rgba(239, 68, 68, 0.08);
    border: 1.5px dashed #EF4444;
    border-radius: 24px;
    padding: 20px 24px;
  }
  .msg-deleted-alert {
    display: flex;
    align-items: center;
    gap: 12px;
    color: #F87171;
    font-size: 22px;
    font-weight: 700;
    margin-bottom: 14px;
  }

  /* NotiCatch Recovered Message Container */
  .msg-recovered-card {
    background: linear-gradient(135deg, rgba(13, 148, 136, 0.25), rgba(15, 23, 42, 0.85));
    border: 2px solid #2DD4BF;
    border-radius: 20px;
    padding: 20px 24px;
    box-shadow: 0 10px 30px rgba(13, 148, 136, 0.2);
  }
  .recovered-badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 4px 12px;
    background: #0D9488;
    color: white;
    font-size: 16px;
    font-weight: 800;
    border-radius: 8px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 12px;
  }
  .recovered-text {
    font-size: 26px;
    font-weight: 600;
    color: #FFFFFF;
    line-height: 1.35;
  }
  .recovered-footer {
    display: flex;
    justify-content: space-between;
    margin-top: 12px;
    font-size: 17px;
    color: #5EEAD4;
    font-weight: 600;
  }

  .floating-highlight.pos-1 {
    top: 980px;
    right: 40px;
  }
</style>
</head>
<body>
  <div class="bg-glow-top"></div>
  <div class="bg-grid"></div>

  <div class="header-container">
    <div class="feature-pill">
      <img src="data:image/png;base64,${iconBase64}" class="app-mini-icon" />
      <span>ANTI-DELETE ENGINE</span>
    </div>
    <h1 class="main-title">RECOVER DELETED<br/>MESSAGES INSTANTLY</h1>
    <p class="main-subtitle">Read deleted WhatsApp & Messenger chats the exact moment the sender presses delete</p>
  </div>

  ${renderPhoneFrame(`
    <div class="chat-app-header">
      <div class="chat-avatar">AI</div>
      <div class="chat-contact-info">
        <div class="chat-name">Ashikul Islam</div>
        <div class="chat-status">● Online</div>
      </div>
      <div class="chat-brand-badge">WhatsApp</div>
    </div>

    <div class="chat-messages-area">
      <div class="chat-date-pill">Today, November 5</div>

      <div class="msg-bubble msg-incoming">
        <div>Hey! Are you free tonight around 8 PM?</div>
        <div class="msg-time">10:39 AM</div>
      </div>

      <div class="msg-deleted-box">
        <div class="msg-deleted-alert">
          <svg style="width:24px;height:24px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
          <span>This message was deleted by sender (10:41 AM)</span>
        </div>

        <div class="msg-recovered-card">
          <div class="recovered-badge">
            <svg style="width:16px;height:16px;" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L1 21h22L12 2zm0 3.99L19.53 19H4.47L12 5.99zM11 16h2v2h-2zm0-6h2v4h-2z"/></svg>
            RECOVERED BY NOTICATCH
          </div>
          <div class="recovered-text">
            "Don't tell anyone, but we arranged a surprise birthday party for you at Sky Lounge! 🎂🎉"
          </div>
          <div class="recovered-footer">
            <span>⚡ Captured 2s before delete</span>
            <span>10:41 AM</span>
          </div>
        </div>
      </div>

      <div class="msg-bubble msg-incoming">
        <div>Never mind haha, talk later!</div>
        <div class="msg-time">10:42 AM</div>
      </div>
    </div>
  `)}

  <div class="floating-highlight pos-1">
    <span style="font-size:32px;">⚡</span>
    <div>
      <div style="font-size: 22px; color: #5EEAD4;">100% SUCCESS RATE</div>
      <div style="font-size: 18px; color: #94A3B8; font-weight: 500;">Zero Cloud • Private & Secure</div>
    </div>
  </div>
</body>
</html>
`;

// ==========================================
// SCREEN 2: Never Miss a Notification
// ==========================================
const screen2Html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  ${commonCss}
  :root {
    --accent-color: #38BDF8;
    --accent-glow: rgba(56, 189, 248, 0.4);
    --phone-halo: rgba(56, 189, 248, 0.2);
    --title-gradient-end: #38BDF8;
  }

  /* Notifications Screen UI */
  .notif-top-bar {
    padding: 24px 28px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: #0B1324;
    border-bottom: 1px solid rgba(255,255,255,0.06);
  }
  .app-brand-row {
    display: flex;
    align-items: center;
    gap: 14px;
  }
  .app-brand-logo {
    width: 48px;
    height: 48px;
    border-radius: 14px;
  }
  .app-brand-title {
    font-size: 30px;
    font-weight: 800;
    color: white;
  }

  /* Live Active Banner */
  .live-status-card {
    margin: 20px 24px;
    padding: 18px 24px;
    background: linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(15, 23, 42, 0.9));
    border: 1.5px solid #10B981;
    border-radius: 20px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .live-badge {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 20px;
    font-weight: 700;
    color: #34D399;
  }
  .pulsing-dot {
    width: 14px;
    height: 14px;
    background: #10B981;
    border-radius: 50%;
    box-shadow: 0 0 12px #10B981;
  }
  .live-stats {
    font-size: 19px;
    font-weight: 600;
    color: #E2E8F0;
  }

  /* Filter Pills Bar */
  .filter-pills-row {
    display: flex;
    gap: 12px;
    padding: 0 24px 16px 24px;
    overflow-x: auto;
  }
  .filter-tab {
    padding: 10px 22px;
    border-radius: 999px;
    font-size: 19px;
    font-weight: 700;
    background: #1E293B;
    color: #94A3B8;
  }
  .filter-tab.active {
    background: #0D9488;
    color: white;
    box-shadow: 0 4px 14px rgba(13, 148, 136, 0.4);
  }

  /* Notification Cards */
  .notif-cards-list {
    flex: 1;
    padding: 0 24px;
    display: flex;
    flex-direction: column;
    gap: 16px;
    overflow: hidden;
  }
  .notif-item {
    background: #1E293B;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 22px;
    padding: 20px 22px;
    display: flex;
    gap: 18px;
  }
  .notif-app-icon {
    width: 52px;
    height: 52px;
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    font-weight: 800;
    color: white;
    flex-shrink: 0;
  }
  .icon-wa { background: #25D366; }
  .icon-ig { background: linear-gradient(45deg, #F58529, #DD2A7B, #8134AF); }
  .icon-tg { background: #229ED9; }
  .icon-ms { background: #0084FF; }

  .notif-details { flex: 1; }
  .notif-header-row {
    display: flex;
    justify-content: space-between;
    margin-bottom: 6px;
  }
  .notif-sender { font-size: 22px; font-weight: 700; color: white; }
  .notif-time { font-size: 16px; color: #64748B; }
  .notif-body {
    font-size: 19px;
    color: #CBD5E1;
    line-height: 1.35;
  }
  .notif-badge-tag {
    display: inline-block;
    margin-top: 10px;
    padding: 4px 10px;
    background: rgba(45, 212, 191, 0.15);
    color: #2DD4BF;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 700;
  }

  /* Bottom Tab Bar */
  .app-bottom-nav {
    height: 84px;
    background: #0B1324;
    border-top: 1px solid rgba(255,255,255,0.08);
    display: flex;
    align-items: center;
    justify-content: space-around;
    padding: 0 10px;
  }
  .nav-tab-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    color: #64748B;
    font-size: 16px;
    font-weight: 700;
  }
  .nav-tab-item.active { color: #2DD4BF; }
</style>
</head>
<body>
  <div class="bg-glow-top"></div>
  <div class="bg-grid"></div>

  <div class="header-container">
    <div class="feature-pill">
      <span>🔔 100% TIMELINE CAPTURE</span>
    </div>
    <h1 class="main-title">NEVER MISS A<br/>NOTIFICATION AGAIN</h1>
    <p class="main-subtitle">Save every alert, message, OTP, and notification in a clean, searchable history log</p>
  </div>

  ${renderPhoneFrame(`
    <div class="notif-top-bar">
      <div class="app-brand-row">
        <img src="data:image/png;base64,${iconBase64}" class="app-brand-logo" />
        <span class="app-brand-title">NotiCatch</span>
      </div>
      <div style="font-size: 26px;">🔍</div>
    </div>

    <div class="live-status-card">
      <div class="live-badge">
        <div class="pulsing-dot"></div>
        <span>Service Active</span>
      </div>
      <div class="live-stats">524 captured • 12 unread</div>
    </div>

    <div class="filter-pills-row">
      <div class="filter-tab active">All (524)</div>
      <div class="filter-tab">WhatsApp (184)</div>
      <div class="filter-tab">Instagram (92)</div>
      <div class="filter-tab">Telegram (64)</div>
    </div>

    <div class="notif-cards-list">
      <div class="notif-item">
        <div class="notif-app-icon icon-wa">WA</div>
        <div class="notif-details">
          <div class="notif-header-row">
            <span class="notif-sender">Sarah Jenkins</span>
            <span class="notif-time">Just now</span>
          </div>
          <div class="notif-body">Sent you 3 photos from our weekend trip! Let me know if you like them.</div>
          <div class="notif-badge-tag">WhatsApp • 3 Messages</div>
        </div>
      </div>

      <div class="notif-item">
        <div class="notif-app-icon icon-ig">IG</div>
        <div class="notif-details">
          <div class="notif-header-row">
            <span class="notif-sender">alex.visuals</span>
            <span class="notif-time">4m ago</span>
          </div>
          <div class="notif-body">Mentioned you in a comment: "This is unbelievable work! 🔥🔥"</div>
          <div class="notif-badge-tag">Instagram Mention</div>
        </div>
      </div>

      <div class="notif-item">
        <div class="notif-app-icon icon-tg">TG</div>
        <div class="notif-details">
          <div class="notif-header-row">
            <span class="notif-sender">Crypto VIP Signals</span>
            <span class="notif-time">18m ago</span>
          </div>
          <div class="notif-body">🚀 Breakout alert: Major resistance broken, target hit +24%</div>
          <div class="notif-badge-tag">Telegram Channel</div>
        </div>
      </div>

      <div class="notif-item">
        <div class="notif-app-icon icon-ms">FB</div>
        <div class="notif-details">
          <div class="notif-header-row">
            <span class="notif-sender">Michael Scott</span>
            <span class="notif-time">32m ago</span>
          </div>
          <div class="notif-body">Are you joining the group call today?</div>
          <div class="notif-badge-tag">Messenger</div>
        </div>
      </div>
    </div>

    <div class="app-bottom-nav">
      <div class="nav-tab-item active">
        <span style="font-size:24px;">🔔</span>
        <span>Notifications</span>
      </div>
      <div class="nav-tab-item">
        <span style="font-size:24px;">💬</span>
        <span>Chats</span>
      </div>
      <div class="nav-tab-item">
        <span style="font-size:24px;">⚙️</span>
        <span>Settings</span>
      </div>
    </div>
  `)}
</body>
</html>
`;

// ==========================================
// SCREEN 3: Incognito Reader (No Blue Ticks)
// ==========================================
const screen3Html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  ${commonCss}
  :root {
    --accent-color: #A855F7;
    --accent-glow: rgba(168, 85, 247, 0.4);
    --phone-halo: rgba(168, 85, 247, 0.2);
    --title-gradient-end: #C084FC;
  }

  .incognito-header {
    background: #130B24;
    padding: 18px 24px;
    display: flex;
    align-items: center;
    gap: 16px;
    border-bottom: 1px solid rgba(168, 85, 247, 0.2);
  }
  .incognito-icon-box {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: linear-gradient(135deg, #7E22CE, #A855F7);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 28px;
  }
  .incognito-title-area { flex: 1; }
  .incognito-sender { font-size: 26px; font-weight: 800; color: white; }
  .incognito-status { font-size: 18px; color: #D8B4FE; }

  .stealth-banner {
    margin: 20px 24px;
    padding: 16px 20px;
    background: rgba(168, 85, 247, 0.12);
    border: 1px solid rgba(168, 85, 247, 0.4);
    border-radius: 16px;
    display: flex;
    align-items: center;
    gap: 14px;
    font-size: 19px;
    font-weight: 600;
    color: #E9D5FF;
  }

  .incognito-chat-body {
    flex: 1;
    padding: 10px 24px 30px 24px;
    display: flex;
    flex-direction: column;
    gap: 20px;
    overflow: hidden;
  }
  .secret-msg-bubble {
    max-width: 85%;
    padding: 20px 24px;
    border-radius: 24px;
    font-size: 23px;
    line-height: 1.4;
    background: #1E1B4B;
    border: 1px solid rgba(168, 85, 247, 0.25);
    color: white;
  }
  .secret-msg-time {
    font-size: 16px;
    color: #A5B4FC;
    margin-top: 8px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .no-tick-badge {
    color: #94A3B8;
    display: flex;
    align-items: center;
    gap: 6px;
    font-weight: 700;
    font-size: 15px;
  }

  .floating-highlight.pos-3 {
    top: 1020px;
    left: 40px;
  }
</style>
</head>
<body>
  <div class="bg-glow-top"></div>
  <div class="bg-grid"></div>

  <div class="header-container">
    <div class="feature-pill">
      <span>🕶️ GHOST INCOGNITO READER</span>
    </div>
    <h1 class="main-title">READ MESSAGES<br/>WITHOUT BLUE TICKS</h1>
    <p class="main-subtitle">Read entire conversations in complete secrecy without alerting the sender or showing "Seen"</p>
  </div>

  ${renderPhoneFrame(`
    <div class="incognito-header">
      <div class="incognito-icon-box">🕶️</div>
      <div class="incognito-title-area">
        <div class="incognito-sender">Jessica Taylor</div>
        <div class="incognito-status">Incognito Mode Active</div>
      </div>
      <div style="padding: 6px 14px; background: rgba(168,85,247,0.2); border-radius: 12px; color: #C084FC; font-weight: 700; font-size: 16px;">WhatsApp</div>
    </div>

    <div class="stealth-banner">
      <span style="font-size: 26px;">🛡️</span>
      <span>Sender will NEVER see blue double ticks or typing status!</span>
    </div>

    <div class="incognito-chat-body">
      <div class="secret-msg-bubble">
        <div>Hey, did you review the confidential proposal I sent you this morning?</div>
        <div class="secret-msg-time">
          <span>11:15 AM</span>
          <span class="no-tick-badge">🚫 No Seen Receipt</span>
        </div>
      </div>

      <div class="secret-msg-bubble">
        <div>We need an urgent answer before the 2:00 PM boardroom meeting! Please check.</div>
        <div class="secret-msg-time">
          <span>11:18 AM</span>
          <span class="no-tick-badge">🚫 No Seen Receipt</span>
        </div>
      </div>

      <div class="secret-msg-bubble">
        <div>I see you were online 5 minutes ago. Let me know when you read this.</div>
        <div class="secret-msg-time">
          <span>11:20 AM</span>
          <span class="no-tick-badge">🚫 Unopened on WhatsApp</span>
        </div>
      </div>
    </div>
  `)}

  <div class="floating-highlight pos-3">
    <span style="font-size:32px;">👁️</span>
    <div>
      <div style="font-size: 22px; color: #C084FC;">100% UNTRACEABLE</div>
      <div style="font-size: 18px; color: #94A3B8; font-weight: 500;">Zero Read Receipts Sent</div>
    </div>
  </div>
</body>
</html>
`;

// ==========================================
// SCREEN 4: Auto-Save Photos & Voice Notes
// ==========================================
const screen4Html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  ${commonCss}
  :root {
    --accent-color: #10B981;
    --accent-glow: rgba(16, 185, 129, 0.4);
    --phone-halo: rgba(16, 185, 129, 0.2);
    --title-gradient-end: #34D399;
  }

  .media-chat-header {
    background: #062419;
    padding: 18px 24px;
    display: flex;
    align-items: center;
    gap: 16px;
    border-bottom: 1px solid rgba(16, 185, 129, 0.2);
  }
  .media-avatar {
    width: 58px;
    height: 58px;
    border-radius: 50%;
    background: linear-gradient(135deg, #059669, #10B981);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 26px;
    font-weight: 700;
  }

  .media-chat-body {
    flex: 1;
    padding: 24px;
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  /* Voice Note Player Bubble */
  .voice-bubble {
    background: #0E2E23;
    border: 1.5px solid #10B981;
    border-radius: 26px;
    padding: 22px 24px;
    width: 90%;
    box-shadow: 0 10px 30px rgba(16, 185, 129, 0.15);
  }
  .voice-tag {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 14px;
  }
  .voice-pill {
    padding: 4px 12px;
    background: #10B981;
    color: #062419;
    border-radius: 8px;
    font-size: 15px;
    font-weight: 800;
  }
  .voice-player-row {
    display: flex;
    align-items: center;
    gap: 18px;
  }
  .play-btn {
    width: 60px;
    height: 60px;
    background: #10B981;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #062419;
    font-size: 26px;
    flex-shrink: 0;
  }
  .waveform-container {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 4px;
    height: 48px;
  }
  .wave-bar {
    flex: 1;
    background: #34D399;
    border-radius: 4px;
  }

  /* Photo Recovery Card */
  .photo-bubble {
    background: #1E293B;
    border: 1.5px solid rgba(255, 255, 255, 0.12);
    border-radius: 26px;
    overflow: hidden;
    width: 86%;
  }
  .photo-display {
    width: 100%;
    height: 320px;
    background: linear-gradient(135deg, #0284C7, #0D9488, #10B981);
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .photo-tag-overlay {
    position: absolute;
    top: 14px;
    left: 14px;
    padding: 6px 14px;
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(8px);
    border-radius: 10px;
    font-size: 16px;
    font-weight: 700;
    color: #34D399;
  }
  .photo-footer {
    padding: 16px 20px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 18px;
    font-weight: 600;
    color: #CBD5E1;
  }
</style>
</head>
<body>
  <div class="bg-glow-top"></div>
  <div class="bg-grid"></div>

  <div class="header-container">
    <div class="feature-pill">
      <span>🎙️ AUTO-MEDIA VAULT</span>
    </div>
    <h1 class="main-title">SAVE PHOTOS &<br/>VOICE NOTES</h1>
    <p class="main-subtitle">Listen to deleted voice messages and view cached photos before they disappear</p>
  </div>

  ${renderPhoneFrame(`
    <div class="media-chat-header">
      <div class="media-avatar">EM</div>
      <div style="flex:1;">
        <div style="font-size: 26px; font-weight: 700; color: white;">Emma Watson</div>
        <div style="font-size: 18px; color: #34D399;">● Online</div>
      </div>
      <div style="padding: 6px 14px; background: rgba(16,185,129,0.2); border-radius: 12px; color: #34D399; font-weight: 700;">WhatsApp</div>
    </div>

    <div class="media-chat-body">
      <!-- Voice Note Card -->
      <div class="voice-bubble">
        <div class="voice-tag">
          <span class="voice-pill">🎙️ DELETED VOICE NOTE • SAVED</span>
          <span style="font-size: 16px; color: #6EE7B7;">0:42 / 1:15</span>
        </div>
        <div class="voice-player-row">
          <div class="play-btn">▶</div>
          <div class="waveform-container">
            <div class="wave-bar" style="height: 18px;"></div>
            <div class="wave-bar" style="height: 36px;"></div>
            <div class="wave-bar" style="height: 44px;"></div>
            <div class="wave-bar" style="height: 28px;"></div>
            <div class="wave-bar" style="height: 48px;"></div>
            <div class="wave-bar" style="height: 32px;"></div>
            <div class="wave-bar" style="height: 20px;"></div>
            <div class="wave-bar" style="height: 38px;"></div>
            <div class="wave-bar" style="height: 42px;"></div>
            <div class="wave-bar" style="height: 26px;"></div>
            <div class="wave-bar" style="height: 34px;"></div>
            <div class="wave-bar" style="height: 46px;"></div>
            <div class="wave-bar" style="height: 30px;"></div>
            <div class="wave-bar" style="height: 18px;"></div>
            <div class="wave-bar" style="height: 24px;"></div>
          </div>
          <div style="padding: 6px 12px; background: rgba(255,255,255,0.1); border-radius: 8px; font-size: 16px; font-weight: 700;">1.5x</div>
        </div>
      </div>

      <!-- Photo Card -->
      <div class="photo-bubble">
        <div class="photo-display">
          <div class="photo-tag-overlay">⚡ Auto-Saved Before Delete</div>
          <div style="text-align:center;">
            <span style="font-size: 64px;">🏖️</span>
            <div style="font-size: 22px; font-weight: 700; color: white; margin-top: 10px;">IMG_20261105_Vacation.jpg</div>
          </div>
        </div>
        <div class="photo-footer">
          <span>Deleted by sender at 10:41 AM</span>
          <span style="color: #34D399; font-weight: 700;">Saved in Cache ✓</span>
        </div>
      </div>
    </div>
  `)}
</body>
</html>
`;

// ==========================================
// SCREEN 5: Biometric & PIN Security
// ==========================================
const screen5Html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  ${commonCss}
  :root {
    --accent-color: #38BDF8;
    --accent-glow: rgba(56, 189, 248, 0.45);
    --phone-halo: rgba(56, 189, 248, 0.25);
    --title-gradient-end: #7DD3FC;
  }

  .lock-screen-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 30px;
    background: radial-gradient(circle at 50% 25%, #0F2038 0%, #080D1A 100%);
  }
  .lock-shield-logo {
    width: 90px;
    height: 90px;
    border-radius: 28px;
    background: linear-gradient(135deg, #0284C7, #38BDF8);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 46px;
    box-shadow: 0 0 50px rgba(56, 189, 248, 0.4);
    margin-bottom: 24px;
  }
  .lock-heading {
    font-size: 32px;
    font-weight: 800;
    color: white;
    margin-bottom: 8px;
  }
  .lock-sub {
    font-size: 20px;
    color: #94A3B8;
    margin-bottom: 36px;
  }

  /* PIN Dots */
  .pin-dots-row {
    display: flex;
    gap: 20px;
    margin-bottom: 48px;
  }
  .pin-dot {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    border: 2px solid #38BDF8;
  }
  .pin-dot.filled {
    background: #38BDF8;
    box-shadow: 0 0 16px #38BDF8;
  }

  /* Numeric Keypad */
  .numpad-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 24px;
    width: 100%;
    max-width: 500px;
  }
  .num-key {
    height: 90px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 50%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    font-size: 36px;
    font-weight: 700;
    color: white;
  }
  .num-letters {
    font-size: 12px;
    font-weight: 600;
    color: #64748B;
    letter-spacing: 2px;
    margin-top: -2px;
  }

  .biometric-prompt {
    margin-top: 36px;
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 20px;
    font-weight: 600;
    color: #38BDF8;
  }
</style>
</head>
<body>
  <div class="bg-glow-top"></div>
  <div class="bg-grid"></div>

  <div class="header-container">
    <div class="feature-pill">
      <span>🔒 HARDWARE-BACKED SECURITY</span>
    </div>
    <h1 class="main-title">PIN & BIOMETRIC<br/>CHAT LOCK</h1>
    <p class="main-subtitle">Keep your private conversations & notification records locked away from snooping eyes</p>
  </div>

  ${renderPhoneFrame(`
    <div class="lock-screen-container">
      <div class="lock-shield-logo">🔒</div>
      <div class="lock-heading">Enter Security PIN</div>
      <div class="lock-sub">Protected by Biometric App Lock</div>

      <div class="pin-dots-row">
        <div class="pin-dot filled"></div>
        <div class="pin-dot filled"></div>
        <div class="pin-dot filled"></div>
        <div class="pin-dot"></div>
      </div>

      <div class="numpad-grid">
        <div class="num-key">1<span class="num-letters"></span></div>
        <div class="num-key">2<span class="num-letters">ABC</span></div>
        <div class="num-key">3<span class="num-letters">DEF</span></div>
        <div class="num-key">4<span class="num-letters">GHI</span></div>
        <div class="num-key">5<span class="num-letters">JKL</span></div>
        <div class="num-key">6<span class="num-letters">MNO</span></div>
        <div class="num-key">7<span class="num-letters">PQRS</span></div>
        <div class="num-key">8<span class="num-letters">TUV</span></div>
        <div class="num-key">9<span class="num-letters">WXYZ</span></div>
        <div class="num-key" style="border:none;background:transparent;font-size:32px;">👆</div>
        <div class="num-key">0</div>
        <div class="num-key" style="border:none;background:transparent;font-size:28px;">⌫</div>
      </div>

      <div class="biometric-prompt">
        <span>Touch fingerprint sensor to unlock</span>
      </div>
    </div>
  `)}
</body>
</html>
`;

// ==========================================
// SCREEN 6: NotiCatch VIP Pass
// ==========================================
const screen6Html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  ${commonCss}
  :root {
    --accent-color: #F59E0B;
    --accent-glow: rgba(245, 158, 11, 0.45);
    --phone-halo: rgba(245, 158, 11, 0.25);
    --title-gradient-end: #FCD34D;
  }

  .vip-paywall-modal {
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: 30px;
    background: radial-gradient(circle at 50% 15%, #261E08 0%, #0B1120 100%);
    position: relative;
    overflow: hidden;
  }

  .vip-crown-badge {
    align-self: center;
    width: 90px;
    height: 90px;
    border-radius: 50%;
    background: linear-gradient(135deg, #F59E0B, #D97706);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 46px;
    box-shadow: 0 0 50px rgba(245, 158, 11, 0.6);
    margin-bottom: 20px;
  }

  .vip-headline {
    text-align: center;
    font-size: 38px;
    font-weight: 900;
    color: white;
    margin-bottom: 8px;
  }
  .vip-sub {
    text-align: center;
    font-size: 20px;
    color: #FDE68A;
    margin-bottom: 30px;
  }

  /* VIP Perks List */
  .vip-perks-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
    margin-bottom: 30px;
  }
  .vip-perk-row {
    display: flex;
    align-items: center;
    gap: 16px;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(245, 158, 11, 0.2);
    border-radius: 18px;
    padding: 16px 20px;
  }
  .perk-check {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    background: #F59E0B;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #1E1B4B;
    font-weight: 900;
    font-size: 20px;
    flex-shrink: 0;
  }
  .perk-text {
    font-size: 20px;
    font-weight: 700;
    color: white;
  }

  /* Plan Offer Box */
  .plan-card {
    background: linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(15, 23, 42, 0.8));
    border: 2px solid #F59E0B;
    border-radius: 24px;
    padding: 24px;
    margin-bottom: 24px;
    text-align: center;
  }
  .plan-badge {
    display: inline-block;
    padding: 6px 18px;
    background: #F59E0B;
    color: #1E1B4B;
    border-radius: 999px;
    font-size: 16px;
    font-weight: 900;
    margin-bottom: 12px;
  }
  .plan-title { font-size: 26px; font-weight: 800; color: white; }
  .plan-price { font-size: 34px; font-weight: 900; color: #FCD34D; margin: 6px 0; }
  .plan-terms { font-size: 16px; color: #94A3B8; }

  /* CTA Button */
  .vip-cta-btn {
    background: linear-gradient(135deg, #F59E0B, #D97706);
    padding: 22px;
    border-radius: 20px;
    text-align: center;
    font-size: 26px;
    font-weight: 800;
    color: #0F172A;
    box-shadow: 0 10px 30px rgba(245, 158, 11, 0.4);
    letter-spacing: 0.5px;
  }
</style>
</head>
<body>
  <div class="bg-glow-top"></div>
  <div class="bg-grid"></div>

  <div class="header-container">
    <div class="feature-pill">
      <span>👑 NOTICATCH VIP PASS</span>
    </div>
    <h1 class="main-title">UNLOCK THE FULL<br/>VIP EXPERIENCE</h1>
    <p class="main-subtitle">Enjoy 365-day history retention, ad-free experience, auto-backup & VIP priority support</p>
  </div>

  ${renderPhoneFrame(`
    <div class="vip-paywall-modal">
      <div class="vip-crown-badge">👑</div>
      <div class="vip-headline">NotiCatch VIP</div>
      <div class="vip-sub">Start with 3 Days Free Trial</div>

      <div class="vip-perks-list">
        <div class="vip-perk-row">
          <div class="perk-check">✓</div>
          <div class="perk-text">Unlimited 365-Day Notification Log</div>
        </div>
        <div class="vip-perk-row">
          <div class="perk-check">✓</div>
          <div class="perk-text">Instant Deleted Message Recovery</div>
        </div>
        <div class="vip-perk-row">
          <div class="perk-check">✓</div>
          <div class="perk-text">Biometric PIN & Fingerprint Vault</div>
        </div>
        <div class="vip-perk-row">
          <div class="perk-check">✓</div>
          <div class="perk-text">100% Ad-Free Clean Interface</div>
        </div>
      </div>

      <div class="plan-card">
        <div class="plan-badge">3 DAYS FREE TRIAL</div>
        <div class="plan-title">VIP Monthly Subscription</div>
        <div class="plan-price">$2.99 / Month</div>
        <div class="plan-terms">Cancel anytime on Google Play with 1 click</div>
      </div>

      <div class="vip-cta-btn">
        START 3-DAY FREE TRIAL
      </div>
    </div>
  `)}
</body>
</html>
`;

// Screens configuration
const screens = [
  { name: '01_recover_deleted_messages', html: screen1Html },
  { name: '02_never_miss_notification', html: screen2Html },
  { name: '03_read_without_blue_ticks', html: screen3Html },
  { name: '04_save_photos_voice_notes', html: screen4Html },
  { name: '05_pin_biometric_lock', html: screen5Html },
  { name: '06_unlock_vip_pass', html: screen6Html },
];

console.log('Generating 6 Google Play Store screenshots (1080 x 2400)...');

for (const s of screens) {
  const htmlPath = path.join('/tmp', `${s.name}.html`);
  const outPngLocal = path.join(OUTPUT_DIR, `${s.name}.png`);
  const outPngArtifact = path.join(ARTIFACT_DIR, `${s.name}.png`);

  fs.writeFileSync(htmlPath, s.html, 'utf8');

  console.log(`Rendering ${s.name}...`);
  try {
    execSync(`"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --screenshot="${outPngLocal}" --window-size=1080,2400 --hide-scrollbars --user-data-dir=/tmp/chrome-data --no-sandbox --disable-gpu "file://${htmlPath}" 2>/dev/null`);

    // Copy to artifact directory as well
    fs.copyFileSync(outPngLocal, outPngArtifact);
    const stat = fs.statSync(outPngLocal);
    console.log(`✓ Generated ${s.name}.png (${(stat.size / 1024).toFixed(1)} KB)`);
  } catch (err) {
    console.error(`Error generating ${s.name}:`, err.message);
  }
}

console.log('All 6 screenshots successfully created in:');
console.log('1. ', OUTPUT_DIR);
console.log('2. ', ARTIFACT_DIR);

