const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const iconBase64 = fs.readFileSync(path.resolve(__dirname, '../assets/playstore_icon_512.png')).toString('base64');

const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
  body {
    width: 1024px;
    height: 500px;
    overflow: hidden;
    background: #0B141B;
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: #FFFFFF;
  }

  /* WhatsApp Style Doodle Pattern Background */
  .doodle-bg {
    position: absolute;
    inset: 0;
    opacity: 0.08;
    background-image: radial-gradient(#25D366 1px, transparent 1px), radial-gradient(#FFFFFF 1px, #0B141B 1px);
    background-size: 40px 40px;
    background-position: 0 0, 20px 20px;
  }

  /* Subtle Ambient Lights */
  .ambient-glow-top {
    position: absolute;
    top: -120px;
    left: 20%;
    width: 500px;
    height: 350px;
    background: radial-gradient(circle, rgba(239, 68, 68, 0.22) 0%, transparent 70%);
    pointer-events: none;
  }
  .ambient-glow-bot {
    position: absolute;
    bottom: -120px;
    right: 20%;
    width: 500px;
    height: 350px;
    background: radial-gradient(circle, rgba(13, 148, 136, 0.3) 0%, transparent 70%);
    pointer-events: none;
  }

  /* Main Container */
  .cards-container {
    position: relative;
    z-index: 10;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 24px;
    width: 900px;
  }

  /* Top Card: WhatsApp Deleted Message */
  .deleted-bubble-row {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    width: 100%;
    padding-left: 20px;
    gap: 16px;
    position: relative;
  }
  .emoji-shocked {
    font-size: 52px;
    filter: drop-shadow(0 6px 14px rgba(0,0,0,0.5));
    animation: bounce 2s infinite ease-in-out;
  }
  .wa-deleted-bubble {
    background: #1F2C34;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 18px;
    border-top-left-radius: 4px;
    padding: 14px 22px;
    display: flex;
    align-items: center;
    gap: 14px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
    max-width: 580px;
  }
  .prohibition-icon {
    width: 26px;
    height: 26px;
    color: #8696A0;
    flex-shrink: 0;
  }
  .deleted-text {
    font-size: 23px;
    font-style: italic;
    color: #8696A0;
    font-weight: 400;
  }
  .msg-time {
    font-size: 14px;
    color: #8696A0;
    margin-left: 12px;
    align-self: flex-end;
  }

  /* Middle Arrow / Transform indicator */
  .transform-bridge {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 14px;
    margin: -6px 0;
  }
  .curved-arrow {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 6px 18px;
    background: rgba(13, 148, 136, 0.15);
    border: 1px solid #0D9488;
    border-radius: 999px;
    font-size: 15px;
    font-weight: 800;
    color: #2DD4BF;
    letter-spacing: 0.5px;
    box-shadow: 0 0 20px rgba(13, 148, 136, 0.3);
  }
  .app-mini-brand {
    width: 24px;
    height: 24px;
    border-radius: 6px;
  }

  /* Bottom Card: NotiCatch Recovered Message */
  .recovered-bubble-row {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    width: 100%;
    padding-right: 20px;
    gap: 16px;
    position: relative;
  }
  .emoji-happy {
    font-size: 52px;
    filter: drop-shadow(0 6px 14px rgba(0,0,0,0.5));
  }
  .noticatch-recovered-bubble {
    background: linear-gradient(135deg, #005C4B 0%, #004638 100%);
    border: 1.5px solid #25D366;
    border-radius: 18px;
    border-top-right-radius: 4px;
    padding: 16px 24px;
    box-shadow: 0 12px 35px rgba(0, 92, 75, 0.5), 0 0 25px rgba(37, 211, 102, 0.2);
    max-width: 650px;
  }
  .recovered-tag-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
  }
  .recovered-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 3px 10px;
    background: #25D366;
    color: #0B141B;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 900;
    letter-spacing: 0.5px;
    text-transform: uppercase;
  }
  .recovered-text-content {
    font-size: 24px;
    font-weight: 600;
    color: #FFFFFF;
    line-height: 1.35;
  }
  .recovered-footer {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 6px;
    margin-top: 8px;
    font-size: 14px;
    color: #68DDB0;
  }

  /* Bottom Minimal Branding */
  .bottom-brand {
    position: absolute;
    bottom: 22px;
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 18px;
    font-weight: 800;
    color: #8696A0;
    letter-spacing: 1.5px;
    text-transform: uppercase;
  }
  .bottom-logo {
    width: 26px;
    height: 26px;
    border-radius: 7px;
  }
</style>
</head>
<body>
  <div class="doodle-bg"></div>
  <div class="ambient-glow-top"></div>
  <div class="ambient-glow-bot"></div>

  <div class="cards-container">
    <!-- 1. Sender deletes message in WhatsApp -->
    <div class="deleted-bubble-row">
      <div class="emoji-shocked">😱</div>
      <div class="wa-deleted-bubble">
        <svg class="prohibition-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
        </svg>
        <span class="deleted-text">This message was deleted</span>
        <span class="msg-time">17:20</span>
      </div>
      <div style="font-size: 38px; opacity: 0.85;">😤</div>
    </div>

    <!-- 2. Recovery Transformation Bridge -->
    <div class="transform-bridge">
      <div class="curved-arrow">
        <img src="data:image/png;base64,${iconBase64}" class="app-mini-brand" />
        <span>RECOVERED BY NOTICATCH</span>
        <span style="font-size: 18px;">⚡</span>
      </div>
    </div>

    <!-- 3. NotiCatch reveals the deleted content -->
    <div class="recovered-bubble-row">
      <div class="noticatch-recovered-bubble">
        <div class="recovered-tag-row">
          <div class="recovered-badge">✓ UNVEILED INSTANTLY</div>
          <span style="font-size: 13px; color: #A7F3D0; font-weight: 600;">Saved before delete</span>
        </div>
        <div class="recovered-text-content">
          "Don't worry, surprise party tonight at 8 PM! Don't tell Sarah! 🎂🎉"
        </div>
        <div class="recovered-footer">
          <span>17:20</span>
          <span style="color: #25D366; font-size: 16px;">✓✓</span>
        </div>
      </div>
      <div class="emoji-happy">😃</div>
    </div>
  </div>

  <div class="bottom-brand">
    <img src="data:image/png;base64,${iconBase64}" class="bottom-logo" />
    <span>NotiCatch • Anti-Delete Tool</span>
  </div>
</body>
</html>
`;

const htmlPath = '/tmp/feature_graphic_v2.html';
const outPng = path.resolve(__dirname, '../assets/playstore_feature_graphic_1024x500.png');
const outArtifact = '/Users/mehedihasan/.gemini/antigravity/brain/d7a06c9e-e511-4cc0-9c40-ebd0ec90784d/playstore_feature_graphic_1024x500.png';

fs.writeFileSync(htmlPath, html);
execSync(`"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --screenshot="${outPng}" --window-size=1024,500 --hide-scrollbars --user-data-dir=/tmp/chrome-data --no-sandbox --disable-gpu "file://${htmlPath}" 2>/dev/null`);

fs.copyFileSync(outPng, outArtifact);
const stat = fs.statSync(outPng);
console.log(`✓ New Simple & Clean Feature Graphic generated (1024x500): ${(stat.size / 1024).toFixed(1)} KB`);

