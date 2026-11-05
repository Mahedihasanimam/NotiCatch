const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.resolve(__dirname, '../assets/playstore_screenshots');
const ARTIFACT_DIR = '/Users/mehedihasan/.gemini/antigravity/brain/d7a06c9e-e511-4cc0-9c40-ebd0ec90784d/playstore_screenshots';

if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
if (!fs.existsSync(ARTIFACT_DIR)) fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

// Read local poster images as base64
const posterMsgBase64 = fs.readFileSync(path.resolve(__dirname, '../assets/poster_deleted_messages.jpg')).toString('base64');
const posterPhotoBase64 = fs.readFileSync(path.resolve(__dirname, '../assets/poster_deleted_photos.jpg')).toString('base64');
const posterLockBase64 = fs.readFileSync(path.resolve(__dirname, '../assets/poster_app_lock.jpg')).toString('base64');
const iconBase64 = fs.readFileSync(path.resolve(__dirname, '../assets/icon.png')).toString('base64');

// Common Base CSS for 1080x2400 Visual Posters
const commonVisualCss = `
  * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
  body {
    width: 1080px;
    height: 2400px;
    overflow: hidden;
    background: #060B14;
    color: #FFFFFF;
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
  }

  .top-banner {
    position: relative;
    z-index: 20;
    width: 100%;
    padding: 70px 40px 30px 40px;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    background: linear-gradient(180deg, rgba(6, 11, 20, 0.98) 0%, rgba(6, 11, 20, 0.92) 80%, rgba(6, 11, 20, 0) 100%);
  }
  .visual-pill {
    display: inline-flex;
    align-items: center;
    gap: 14px;
    padding: 14px 32px;
    background: rgba(255, 255, 255, 0.08);
    backdrop-filter: blur(20px);
    border: 1.5px solid var(--pill-border, rgba(45, 212, 191, 0.4));
    border-radius: 999px;
    font-size: 26px;
    font-weight: 800;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--pill-color, #2DD4BF);
    box-shadow: 0 4px 25px rgba(0, 0, 0, 0.5);
    margin-bottom: 20px;
  }
  .visual-title {
    font-size: 72px;
    font-weight: 900;
    line-height: 1.1;
    letter-spacing: -1.5px;
    text-transform: uppercase;
    margin-bottom: 12px;
    background: linear-gradient(180deg, #FFFFFF 20%, var(--title-glow, #5EEAD4) 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    filter: drop-shadow(0 4px 16px rgba(0,0,0,0.6));
  }
  .visual-sub {
    font-size: 32px;
    font-weight: 700;
    color: var(--sub-color, #94A3B8);
    max-width: 960px;
    line-height: 1.35;
  }

  .poster-visual-wrapper {
    position: absolute;
    top: 360px;
    left: 0;
    width: 1080px;
    height: 2040px;
    z-index: 10;
    overflow: hidden;
  }
  .poster-visual-wrapper img {
    width: 1080px;
    height: auto;
    display: block;
  }
  .poster-overlay-top-fade {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 200px;
    background: linear-gradient(180deg, #060B14 0%, rgba(6, 11, 20, 0) 100%);
    z-index: 15;
    pointer-events: none;
  }
`;

// ==========================================
// SCREEN 1: Recover Deleted Messages (3D Poster + Banner)
// ==========================================
const screen1VisualHtml = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  ${commonVisualCss}
  :root {
    --pill-border: rgba(37, 211, 102, 0.5);
    --pill-color: #25D366;
    --title-glow: #34D399;
    --sub-color: #A7F3D0;
  }
</style>
</head>
<body>
  <div class="top-banner">
    <div class="visual-pill">
      <span style="font-size:30px;">🟢</span>
      <span>WHATSAPP & MESSENGER</span>
    </div>
    <h1 class="visual-title">DELETED? RECOVERED! ⚡</h1>
    <p class="visual-sub">ডিলিট করে দিলেও আপনি সবকিছু পড়তে পারবেন!</p>
  </div>

  <div class="poster-visual-wrapper">
    <div class="poster-overlay-top-fade"></div>
    <img src="data:image/jpeg;base64,${posterMsgBase64}" />
  </div>
</body>
</html>
`;

// ==========================================
// SCREEN 2: Recover Deleted Photos (3D Poster + Banner)
// ==========================================
const screen2VisualHtml = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  ${commonVisualCss}
  :root {
    --pill-border: rgba(56, 189, 248, 0.5);
    --pill-color: #38BDF8;
    --title-glow: #7DD3FC;
    --sub-color: #BAE6FD;
  }
</style>
</head>
<body>
  <div class="top-banner">
    <div class="visual-pill">
      <span style="font-size:30px;">📸</span>
      <span>PHOTO & MEDIA RECOVERY</span>
    </div>
    <h1 class="visual-title">RESTORE DELETED PHOTOS ✨</h1>
    <p class="visual-sub">ছবি ডিলিট করলেও NotiCatch-এ সেভ থাকবে!</p>
  </div>

  <div class="poster-visual-wrapper">
    <div class="poster-overlay-top-fade"></div>
    <img src="data:image/jpeg;base64,${posterPhotoBase64}" />
  </div>
</body>
</html>
`;

// ==========================================
// SCREEN 3: Read Messages Without Blue Ticks (Ultra Visual Metaphor)
// ==========================================
const screen3VisualHtml = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  ${commonVisualCss}
  :root {
    --pill-border: rgba(168, 85, 247, 0.6);
    --pill-color: #C084FC;
    --title-glow: #E879F9;
    --sub-color: #F5D0FE;
  }

  .secret-content-body {
    position: relative;
    z-index: 10;
    width: 960px;
    margin-top: 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 36px;
  }

  /* Big Visual Cross Comparison Badge */
  .no-tick-mega-badge {
    width: 100%;
    padding: 30px;
    background: linear-gradient(135deg, rgba(30, 27, 75, 0.95), rgba(15, 23, 42, 0.95));
    border: 3px solid #A855F7;
    border-radius: 40px;
    box-shadow: 0 20px 60px rgba(168, 85, 247, 0.35);
    display: flex;
    align-items: center;
    justify-content: space-around;
  }
  .sender-view-box {
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
  }
  .view-label {
    font-size: 22px;
    font-weight: 800;
    color: #94A3B8;
    text-transform: uppercase;
    letter-spacing: 1px;
  }
  .tick-display {
    font-size: 70px;
    font-weight: 900;
  }
  .tick-grey { color: #64748B; }
  .tick-status-text {
    font-size: 24px;
    font-weight: 700;
    color: #CBD5E1;
  }

  .versus-divider {
    font-size: 50px;
    color: #A855F7;
  }

  /* Crossed Out Double Ticks */
  .tick-crossed-container {
    position: relative;
    display: inline-block;
  }
  .tick-blue { color: #38BDF8; }
  .red-x-overlay {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 110px;
    color: #EF4444;
    font-weight: 900;
    text-shadow: 0 0 30px #EF4444;
  }

  /* Secret Phone Reader Visual */
  .stealth-phone-card {
    width: 100%;
    background: #0F172A;
    border: 2px solid rgba(255, 255, 255, 0.15);
    border-radius: 44px;
    overflow: hidden;
    box-shadow: 0 30px 80px rgba(0,0,0,0.8);
  }
  .phone-header-bar {
    background: #1E1B4B;
    padding: 24px 32px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid rgba(168, 85, 247, 0.3);
  }
  .contact-meta {
    display: flex;
    align-items: center;
    gap: 18px;
  }
  .contact-avatar {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    background: linear-gradient(135deg, #7E22CE, #C084FC);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 30px;
  }
  .contact-name { font-size: 28px; font-weight: 800; color: white; }
  .contact-subtitle { font-size: 20px; color: #C084FC; font-weight: 600; }

  .phone-messages-list {
    padding: 36px 32px;
    display: flex;
    flex-direction: column;
    gap: 24px;
    background: radial-gradient(circle at 50% 20%, #17112E 0%, #0B0E17 100%);
  }
  .secret-bubble {
    max-width: 85%;
    padding: 24px 28px;
    border-radius: 28px;
    font-size: 26px;
    line-height: 1.4;
    background: #1E293B;
    border: 1.5px solid rgba(168, 85, 247, 0.3);
    color: white;
  }
  .secret-meta-row {
    margin-top: 10px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 18px;
    color: #94A3B8;
  }

  /* Floating 3D Emojis Showcase */
  .floating-pill-banner {
    width: 100%;
    padding: 24px;
    background: linear-gradient(90deg, rgba(168, 85, 247, 0.2), rgba(56, 189, 248, 0.2));
    border: 2px dashed #C084FC;
    border-radius: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 20px;
    font-size: 30px;
    font-weight: 900;
    color: #FFFFFF;
  }
</style>
</head>
<body>
  <div class="top-banner">
    <div class="visual-pill">
      <span style="font-size:30px;">🤫</span>
      <span>INCOGNITO GHOST MODE</span>
    </div>
    <h1 class="visual-title">NO BLUE TICKS! 🕶️</h1>
    <p class="visual-sub">মেসেজ পড়ুন গোপনে — সেন্ডার কোনো ব্লু টিক দেখতে পাবে না!</p>
  </div>

  <div class="secret-content-body">
    <!-- Big Visual Proof: Sender sees 1 tick, Double blue tick is crossed out -->
    <div class="no-tick-mega-badge">
      <div class="sender-view-box">
        <div class="view-label">SENDEE'S PHONE</div>
        <div class="tick-display tick-grey">✓</div>
        <div class="tick-status-text">Shows "Unread"</div>
      </div>

      <div class="versus-divider">➔</div>

      <div class="sender-view-box">
        <div class="view-label">BLUE TICKS BLOCKED</div>
        <div class="tick-crossed-container">
          <div class="tick-display tick-blue">✓✓</div>
          <div class="red-x-overlay">❌</div>
        </div>
        <div class="tick-status-text" style="color: #EF4444; font-weight: 800;">NEVER SENT!</div>
      </div>
    </div>

    <!-- Smartphone UI -->
    <div class="stealth-phone-card">
      <div class="phone-header-bar">
        <div class="contact-meta">
          <div class="contact-avatar">🕵️</div>
          <div>
            <div class="contact-name">Secret Reading Vault</div>
            <div class="contact-subtitle">● 100% Invisible to Sender</div>
          </div>
        </div>
        <div style="font-size: 34px;">🔒</div>
      </div>

      <div class="phone-messages-list">
        <div class="secret-bubble">
          <div>"Are you coming to the surprise party tonight? Please reply ASAP!"</div>
          <div class="secret-meta-row">
            <span>10:40 AM</span>
            <span style="color: #34D399; font-weight: 700;">✓ Read Privately</span>
          </div>
        </div>

        <div class="secret-bubble">
          <div>"I need to know before 2 PM. Don't tell anyone!"</div>
          <div class="secret-meta-row">
            <span>10:41 AM</span>
            <span style="color: #34D399; font-weight: 700;">✓ Read Privately</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Floating USP Banner -->
    <div class="floating-pill-banner">
      <span>🚫 No Seen</span>
      <span>•</span>
      <span>🚫 No Blue Ticks</span>
      <span>•</span>
      <span>🕶️ 100% Invisible</span>
    </div>
  </div>
</body>
</html>
`;

// ==========================================
// SCREEN 4: Recover Deleted Voice Notes (Ultra Visual Audio Player)
// ==========================================
const screen4VisualHtml = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  ${commonVisualCss}
  :root {
    --pill-border: rgba(16, 185, 129, 0.6);
    --pill-color: #34D399;
    --title-glow: #6EE7B7;
    --sub-color: #A7F3D0;
  }

  .audio-content-body {
    position: relative;
    z-index: 10;
    width: 960px;
    margin-top: 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 36px;
  }

  /* Deleted to Restored Audio Flow */
  .audio-flow-card {
    width: 100%;
    padding: 34px;
    background: linear-gradient(135deg, rgba(6, 78, 59, 0.4), rgba(15, 23, 42, 0.95));
    border: 3px solid #10B981;
    border-radius: 40px;
    box-shadow: 0 20px 60px rgba(16, 185, 129, 0.35);
    display: flex;
    flex-direction: column;
    gap: 28px;
  }

  /* Red Deleted Audio Alert */
  .deleted-audio-alert {
    background: rgba(239, 68, 68, 0.12);
    border: 2px dashed #EF4444;
    border-radius: 26px;
    padding: 22px 28px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .del-alert-left {
    display: flex;
    align-items: center;
    gap: 16px;
    color: #F87171;
    font-size: 26px;
    font-weight: 800;
  }

  /* Big Arrow */
  .arrow-down-glow {
    align-self: center;
    font-size: 54px;
    color: #34D399;
    font-weight: 900;
    filter: drop-shadow(0 0 15px #10B981);
  }

  /* Giant Restored Audio Player */
  .restored-audio-box {
    background: linear-gradient(135deg, #064E3B, #022C22);
    border: 2px solid #34D399;
    border-radius: 30px;
    padding: 26px 30px;
    box-shadow: 0 10px 40px rgba(16, 185, 129, 0.4);
  }
  .audio-title-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20px;
  }
  .audio-tag {
    padding: 6px 18px;
    background: #10B981;
    color: #022C22;
    border-radius: 12px;
    font-size: 20px;
    font-weight: 900;
    letter-spacing: 0.5px;
  }
  .audio-time {
    font-size: 24px;
    font-weight: 700;
    color: #A7F3D0;
  }

  .player-controls-row {
    display: flex;
    align-items: center;
    gap: 24px;
  }
  .play-mega-btn {
    width: 90px;
    height: 90px;
    background: linear-gradient(135deg, #10B981, #059669);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #FFFFFF;
    font-size: 42px;
    box-shadow: 0 0 35px #10B981;
    flex-shrink: 0;
  }
  .waveform-bars {
    flex: 1;
    height: 64px;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .w-bar {
    flex: 1;
    background: #34D399;
    border-radius: 999px;
    box-shadow: 0 0 8px #10B981;
  }

  .audio-features-row {
    width: 100%;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
  }
  .feature-box {
    background: #1E293B;
    border: 1.5px solid rgba(255, 255, 255, 0.1);
    border-radius: 26px;
    padding: 24px;
    display: flex;
    align-items: center;
    gap: 18px;
  }
  .feature-icon { font-size: 44px; }
  .feature-txt-title { font-size: 24px; font-weight: 800; color: white; }
  .feature-txt-sub { font-size: 18px; color: #94A3B8; margin-top: 4px; }
</style>
</head>
<body>
  <div class="top-banner">
    <div class="visual-pill">
      <span style="font-size:30px;">🎙️</span>
      <span>VOICE NOTE RECOVERY</span>
    </div>
    <h1 class="visual-title">PLAY DELETED AUDIO ▶️</h1>
    <p class="visual-sub">ডিলিট হওয়া ভয়েস মেসেজ শুনুন প্লে বাটন চেপে!</p>
  </div>

  <div class="audio-content-body">
    <div class="audio-flow-card">
      <!-- Deleted audio alert -->
      <div class="deleted-audio-alert">
        <div class="del-alert-left">
          <span style="font-size:38px;">🗑️</span>
          <div>
            <div>Voice Message Deleted ❌</div>
            <div style="font-size: 18px; color: #FCA5A5; font-weight: 500;">Sender deleted the voice note</div>
          </div>
        </div>
        <div style="font-size: 30px;">⛔</div>
      </div>

      <!-- Arrow -->
      <div class="arrow-down-glow">⬇️ RECOVERED BY NOTICATCH ⬇️</div>

      <!-- Giant Playable Waveform -->
      <div class="restored-audio-box">
        <div class="audio-title-row">
          <span class="audio-tag">⚡ VOICE NOTE RESTORED</span>
          <span class="audio-time">0:42 / 1:15</span>
        </div>

        <div class="player-controls-row">
          <div class="play-mega-btn">▶</div>
          <div class="waveform-bars">
            <div class="w-bar" style="height: 24px;"></div>
            <div class="w-bar" style="height: 48px;"></div>
            <div class="w-bar" style="height: 60px;"></div>
            <div class="w-bar" style="height: 38px;"></div>
            <div class="w-bar" style="height: 64px;"></div>
            <div class="w-bar" style="height: 44px;"></div>
            <div class="w-bar" style="height: 28px;"></div>
            <div class="w-bar" style="height: 52px;"></div>
            <div class="w-bar" style="height: 58px;"></div>
            <div class="w-bar" style="height: 36px;"></div>
            <div class="w-bar" style="height: 48px;"></div>
            <div class="w-bar" style="height: 62px;"></div>
            <div class="w-bar" style="height: 40px;"></div>
            <div class="w-bar" style="height: 26px;"></div>
            <div class="w-bar" style="height: 34px;"></div>
            <div class="w-bar" style="height: 50px;"></div>
          </div>
          <div style="padding: 10px 16px; background: rgba(255,255,255,0.15); border-radius: 14px; font-size: 20px; font-weight: 800;">1.5x</div>
        </div>
      </div>
    </div>

    <!-- Quick Features -->
    <div class="audio-features-row">
      <div class="feature-box">
        <div class="feature-icon">🎧</div>
        <div>
          <div class="feature-txt-title">Listen Anytime</div>
          <div class="feature-txt-sub">Saved in local storage</div>
        </div>
      </div>
      <div class="feature-box">
        <div class="feature-icon">⚡</div>
        <div>
          <div class="feature-txt-title">100% Restored</div>
          <div class="feature-txt-sub">Original high quality</div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
`;

// ==========================================
// SCREEN 5: PIN & Biometric Lock (3D Poster + Banner)
// ==========================================
const screen5VisualHtml = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  ${commonVisualCss}
  :root {
    --pill-border: rgba(245, 158, 11, 0.6);
    --pill-color: #FBBF24;
    --title-glow: #FCD34D;
    --sub-color: #FDE68A;
  }
</style>
</head>
<body>
  <div class="top-banner">
    <div class="visual-pill">
      <span style="font-size:30px;">🔒</span>
      <span>100% PRIVATE & OFFLINE</span>
    </div>
    <h1 class="visual-title">LOCK PRIVATE CHATS 🔒</h1>
    <p class="visual-sub">ফিঙ্গারপ্রিন্ট বা পিন দিয়ে সব মেসেজ গোপন রাখুন!</p>
  </div>

  <div class="poster-visual-wrapper">
    <div class="poster-overlay-top-fade"></div>
    <img src="data:image/jpeg;base64,${posterLockBase64}" />
  </div>
</body>
</html>
`;

// ==========================================
// SCREEN 6: All Notifications In One Place (Visual App Funnel)
// ==========================================
const screen6VisualHtml = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  ${commonVisualCss}
  :root {
    --pill-border: rgba(56, 189, 248, 0.6);
    --pill-color: #38BDF8;
    --title-glow: #7DD3FC;
    --sub-color: #BAE6FD;
  }

  .timeline-visual-body {
    position: relative;
    z-index: 10;
    width: 960px;
    margin-top: 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 32px;
  }

  /* 4 Apps Mega Grid Flowing into NotiCatch */
  .apps-flow-row {
    width: 100%;
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 20px;
  }
  .app-glow-box {
    padding: 24px 16px;
    border-radius: 28px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    font-size: 22px;
    font-weight: 800;
    color: white;
    box-shadow: 0 15px 35px rgba(0,0,0,0.5);
  }
  .app-wa { background: linear-gradient(135deg, #075E54, #25D366); border: 2px solid #25D366; }
  .app-ig { background: linear-gradient(135deg, #833AB4, #FD1D1D, #FCB045); border: 2px solid #FD1D1D; }
  .app-tg { background: linear-gradient(135deg, #0088CC, #229ED9); border: 2px solid #229ED9; }
  .app-ms { background: linear-gradient(135deg, #00B2FF, #006AFF); border: 2px solid #00B2FF; }

  /* Funnel Indicator */
  .funnel-arrow-row {
    display: flex;
    align-items: center;
    gap: 16px;
    font-size: 28px;
    font-weight: 900;
    color: #38BDF8;
  }

  /* Timeline Storage Card */
  .timeline-storage-card {
    width: 100%;
    background: #0B1324;
    border: 2px solid #38BDF8;
    border-radius: 36px;
    padding: 30px;
    box-shadow: 0 25px 70px rgba(56, 189, 248, 0.25);
  }
  .storage-live-status {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 24px;
    padding-bottom: 20px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }
  .live-dot {
    width: 18px;
    height: 18px;
    background: #10B981;
    border-radius: 50%;
    box-shadow: 0 0 15px #10B981;
    display: inline-block;
    margin-right: 12px;
  }

  /* Feed cards */
  .feed-cards-wrap {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .feed-mini-item {
    background: #1E293B;
    border-radius: 20px;
    padding: 18px 22px;
    display: flex;
    align-items: center;
    gap: 18px;
  }
  .feed-app-badge {
    width: 50px;
    height: 50px;
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 26px;
    font-weight: 900;
    color: white;
  }
  .feed-text-area { flex: 1; }
  .feed-title { font-size: 22px; font-weight: 700; color: white; }
  .feed-snippet { font-size: 18px; color: #94A3B8; margin-top: 4px; }
  .feed-time { font-size: 16px; color: #64748B; }

  /* Zero Loss Guarantee Footer */
  .never-lose-guarantee {
    width: 100%;
    padding: 22px;
    background: linear-gradient(90deg, rgba(16, 185, 129, 0.2), rgba(56, 189, 248, 0.2));
    border: 2px solid #10B981;
    border-radius: 26px;
    text-align: center;
    font-size: 26px;
    font-weight: 800;
    color: #FFFFFF;
  }
</style>
</head>
<body>
  <div class="top-banner">
    <div class="visual-pill">
      <span style="font-size:30px;">📥</span>
      <span>ALL-IN-ONE TIMELINE</span>
    </div>
    <h1 class="visual-title">ALL NOTIFICATIONS SAVED 🗂️</h1>
    <p class="visual-sub">সব অ্যাপের নোটিফিকেশন ও মেসেজ এক জায়গায় জমা থাকবে!</p>
  </div>

  <div class="timeline-visual-body">
    <!-- App Icons Funneling In -->
    <div class="apps-flow-row">
      <div class="app-glow-box app-wa">
        <span style="font-size:40px;">💬</span>
        <span>WhatsApp</span>
      </div>
      <div class="app-glow-box app-ig">
        <span style="font-size:40px;">📷</span>
        <span>Instagram</span>
      </div>
      <div class="app-glow-box app-tg">
        <span style="font-size:40px;">✈️</span>
        <span>Telegram</span>
      </div>
      <div class="app-glow-box app-ms">
        <span style="font-size:40px;">⚡</span>
        <span>Messenger</span>
      </div>
    </div>

    <div class="funnel-arrow-row">
      <span>⬇️</span>
      <span>AUTOMATICALLY SAVED IN NOTICATCH</span>
      <span>⬇️</span>
    </div>

    <!-- Timeline Storage Box -->
    <div class="timeline-storage-card">
      <div class="storage-live-status">
        <div style="font-size: 24px; font-weight: 800; color: #34D399;">
          <span class="live-dot"></span>Service Active (100% Saved)
        </div>
        <div style="font-size: 20px; color: #E2E8F0; font-weight: 700;">524 Captured</div>
      </div>

      <div class="feed-cards-wrap">
        <div class="feed-mini-item">
          <div class="feed-app-badge" style="background:#25D366;">WA</div>
          <div class="feed-text-area">
            <div class="feed-title">Sarah Jenkins</div>
            <div class="feed-snippet">Sent you 3 photos from graduation</div>
          </div>
          <div class="feed-time">Just now</div>
        </div>

        <div class="feed-mini-item">
          <div class="feed-app-badge" style="background:#E1306C;">IG</div>
          <div class="feed-text-area">
            <div class="feed-title">alex_visuals</div>
            <div class="feed-snippet">Mentioned you in a story</div>
          </div>
          <div class="feed-time">4m ago</div>
        </div>

        <div class="feed-mini-item">
          <div class="feed-app-badge" style="background:#0088CC;">TG</div>
          <div class="feed-text-area">
            <div class="feed-title">Crypto VIP Alerts</div>
            <div class="feed-snippet">Bitcoin breakout alert confirmed!</div>
          </div>
          <div class="feed-time">12m ago</div>
        </div>
      </div>
    </div>

    <div class="never-lose-guarantee">
      🛡️ Never Miss OTPs, Messages or Critical Alerts!
    </div>
  </div>
</body>
</html>
`;

// Build & Render
const visualScreens = [
  { name: '01_recover_deleted_messages', html: screen1VisualHtml },
  { name: '02_recover_deleted_photos', html: screen2VisualHtml },
  { name: '03_read_without_blue_ticks', html: screen3VisualHtml },
  { name: '04_recover_deleted_voice_notes', html: screen4VisualHtml },
  { name: '05_pin_biometric_lock', html: screen5VisualHtml },
  { name: '06_all_notifications_timeline', html: screen6VisualHtml },
];

console.log('Rendering 6 Visual-First Google Play Store Screenshots (1080 x 2400)...');

for (const s of visualScreens) {
  const htmlPath = path.join('/tmp', `${s.name}_visual.html`);
  const outPngLocal = path.join(OUTPUT_DIR, `${s.name}.png`);
  const outPngArtifact = path.join(ARTIFACT_DIR, `${s.name}.png`);

  fs.writeFileSync(htmlPath, s.html, 'utf8');

  console.log(`Rendering ${s.name}...`);
  try {
    execSync(`"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --screenshot="${outPngLocal}" --window-size=1080,2400 --hide-scrollbars --user-data-dir=/tmp/chrome-data --no-sandbox --disable-gpu "file://${htmlPath}" 2>/dev/null`);

    fs.copyFileSync(outPngLocal, outPngArtifact);
    const stat = fs.statSync(outPngLocal);
    console.log(`✓ Generated ${s.name}.png (${(stat.size / 1024).toFixed(1)} KB)`);
  } catch (err) {
    console.error(`Error generating ${s.name}:`, err.message);
  }
}

console.log('Done! All 6 visual-first screenshots are ready.');

