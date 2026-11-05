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
    background: #E8EBEF;
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }

  /* WhatsApp Style Subtle Clean Doodle Background */
  .doodle-layer {
    position: absolute;
    inset: 0;
    opacity: 0.12;
    background-image: 
      radial-gradient(#54656F 1.2px, transparent 1.2px),
      radial-gradient(#54656F 1.2px, #E8EBEF 1.2px);
    background-size: 32px 32px;
    background-position: 0 0, 16px 16px;
  }

  /* Emojis */
  .emoji-shocked {
    position: absolute;
    top: 65px;
    left: 80px;
    font-size: 58px;
    filter: drop-shadow(0 4px 10px rgba(0,0,0,0.12));
  }
  .emoji-frustrated {
    position: absolute;
    top: 65px;
    right: 80px;
    font-size: 58px;
    filter: drop-shadow(0 4px 10px rgba(0,0,0,0.12));
  }
  .emoji-happy {
    position: absolute;
    bottom: 95px;
    right: 80px;
    font-size: 58px;
    filter: drop-shadow(0 4px 10px rgba(0,0,0,0.12));
  }

  /* Center Stage Container */
  .center-stage {
    position: relative;
    z-index: 10;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
  }

  /* 1. Deleted Bubble (Classic WhatsApp Style) */
  .deleted-bubble {
    background: #FFFFFF;
    border-radius: 18px;
    border-top-left-radius: 4px;
    padding: 16px 26px;
    display: flex;
    align-items: center;
    gap: 14px;
    box-shadow: 0 4px 15px rgba(11, 20, 26, 0.08);
    min-width: 480px;
  }
  .prohibition-icon {
    width: 24px;
    height: 24px;
    color: #667781;
    flex-shrink: 0;
  }
  .deleted-text {
    font-size: 24px;
    font-style: italic;
    color: #667781;
    font-weight: 400;
  }
  .msg-time-del {
    font-size: 15px;
    color: #8696A0;
    margin-left: auto;
    padding-left: 20px;
  }

  /* 2. Sleek Minimal Connector */
  .connector-row {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .app-icon-badge {
    width: 32px;
    height: 32px;
    border-radius: 9px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  }
  .connector-pill {
    padding: 6px 18px;
    background: #0D9488;
    color: #FFFFFF;
    border-radius: 999px;
    font-size: 14px;
    font-weight: 800;
    letter-spacing: 1px;
    text-transform: uppercase;
    box-shadow: 0 2px 10px rgba(13, 148, 136, 0.3);
    display: flex;
    align-items: center;
    gap: 6px;
  }

  /* 3. Recovered Bubble (WhatsApp Green / Clean Style) */
  .recovered-bubble {
    background: #D9FDD3;
    border-radius: 18px;
    border-top-right-radius: 4px;
    padding: 16px 26px;
    display: flex;
    align-items: center;
    gap: 14px;
    box-shadow: 0 4px 15px rgba(11, 20, 26, 0.08);
    min-width: 480px;
  }
  .recovered-content {
    font-size: 24px;
    font-weight: 600;
    color: #111B21;
  }
  .recovered-time-wrap {
    margin-left: auto;
    padding-left: 20px;
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 15px;
    color: #667781;
  }
  .double-check {
    color: #53BDEB;
    font-weight: 900;
    font-size: 16px;
  }

  /* Bottom Clean Branding */
  .bottom-brand-simple {
    position: absolute;
    bottom: 24px;
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 17px;
    font-weight: 700;
    color: #54656F;
    letter-spacing: 1.5px;
    text-transform: uppercase;
  }
</style>
</head>
<body>
  <div class="doodle-layer"></div>

  <!-- Surrounding Emojis (Like Reference Image) -->
  <div class="emoji-shocked">😱</div>
  <div class="emoji-frustrated">😤</div>
  <div class="emoji-happy">😃</div>

  <div class="center-stage">
    <!-- Top Bubble: Deleted Message -->
    <div class="deleted-bubble">
      <svg class="prohibition-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
        <circle cx="12" cy="12" r="10"/>
        <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
      </svg>
      <span class="deleted-text">This message was deleted</span>
      <span class="msg-time-del">17:20</span>
    </div>

    <!-- Minimal Connector -->
    <div class="connector-row">
      <img src="data:image/png;base64,${iconBase64}" class="app-icon-badge" />
      <div class="connector-pill">
        <span>⚡</span>
        <span>NotiCatch Recovered</span>
      </div>
    </div>

    <!-- Bottom Bubble: Recovered Message -->
    <div class="recovered-bubble">
      <span class="recovered-content">See you tonight at 8:00 PM! 🎂</span>
      <div class="recovered-time-wrap">
        <span>17:20</span>
        <span class="double-check">✓✓</span>
      </div>
    </div>
  </div>

  <!-- Bottom Brand -->
  <div class="bottom-brand-simple">
    <span>NotiCatch</span>
  </div>
</body>
</html>
`;

const htmlPath = '/tmp/feature_graphic_clean.html';
const outPng = path.resolve(__dirname, '../assets/playstore_feature_graphic_1024x500.png');
const outArtifact = '/Users/mehedihasan/.gemini/antigravity/brain/d7a06c9e-e511-4cc0-9c40-ebd0ec90784d/playstore_feature_graphic_1024x500.png';

fs.writeFileSync(htmlPath, html);
execSync(`"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --screenshot="${outPng}" --window-size=1024,500 --hide-scrollbars --user-data-dir=/tmp/chrome-data --no-sandbox --disable-gpu "file://${htmlPath}" 2>/dev/null`);

fs.copyFileSync(outPng, outArtifact);
const stat = fs.statSync(outPng);
console.log(`✓ Super clean Feature Graphic generated: ${(stat.size / 1024).toFixed(1)} KB`);

