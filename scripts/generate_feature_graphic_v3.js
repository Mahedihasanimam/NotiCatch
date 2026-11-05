const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const iconPath = path.resolve(__dirname, '../assets/playstore_icon_512.png');
const iconBase64 = fs.readFileSync(iconPath).toString('base64');

// WhatsApp authentic doodle SVG background pattern (repeated seamlessly)
const doodleSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="360" height="360" viewBox="0 0 360 360" fill="none" stroke="#7A869A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" opacity="0.13">
  <!-- Coffee Cup -->
  <path d="M40 50 h35 v25 a15 15 0 0 1 -30 0 v-25 z" />
  <path d="M75 56 a8 8 0 0 1 0 14" />
  <path d="M48 38 c2 -4 0 -7 2 -11" />
  <path d="M60 38 c2 -4 0 -7 2 -11" />

  <!-- Speech bubble -->
  <path d="M140 40 h45 a12 12 0 0 1 12 12 v20 a12 12 0 0 1 -12 12 h-25 l-12 10 v-10 h-8 a12 12 0 0 1 -12 -12 v-20 a12 12 0 0 1 12 -12 z" />
  <circle cx="155" cy="62" r="2.5" fill="#7A869A" />
  <circle cx="168" cy="62" r="2.5" fill="#7A869A" />
  <circle cx="181" cy="62" r="2.5" fill="#7A869A" />

  <!-- Music note -->
  <path d="M260 65 v-25 l25 -6 v25" />
  <circle cx="254" cy="68" r="7" fill="#7A869A" />
  <circle cx="279" cy="62" r="7" fill="#7A869A" />

  <!-- Burger -->
  <path d="M30 150 c0 -15 35 -15 35 0 z" />
  <path d="M28 156 h40" />
  <path d="M30 162 h35 a6 6 0 0 1 0 8 h-35 a6 6 0 0 1 0 -8 z" />

  <!-- Heart -->
  <path d="M120 150 c-8 -12 -24 0 -12 14 l12 12 l12 -12 c12 -14 -4 -26 -12 -14 z" />

  <!-- Paper plane -->
  <path d="M200 145 l35 15 l-35 15 l8 -15 z" />
  <path d="M208 160 l14 0" />

  <!-- Star -->
  <path d="M290 145 l4 8 l9 1 l-7 6 l2 9 l-8 -4 l-8 4 l2 -9 l-7 -6 l9 -1 z" />

  <!-- Headphones -->
  <path d="M50 250 a20 20 0 0 1 40 0 v15 h-8 v-15 a12 12 0 0 0 -24 0 v15 h-8 z" />
  <rect x="42" y="250" width="8" height="15" rx="3" />
  <rect x="90" y="250" width="8" height="15" rx="3" />

  <!-- Clock -->
  <circle cx="150" cy="255" r="18" />
  <path d="M150 243 v12 l8 6" />

  <!-- Camera -->
  <rect x="230" y="240" width="38" height="26" rx="5" />
  <circle cx="249" cy="253" r="7" />
  <path d="M242 240 l3 -5 h8 l3 5" />
  <circle cx="261" cy="245" r="1.5" fill="#7A869A" />

  <!-- Soda cup with straw -->
  <path d="M310 240 l5 30 h18 l5 -30 z" />
  <path d="M307 240 h28" />
  <path d="M320 240 l5 -15 h8" />

  <!-- Chat bubble 2 -->
  <path d="M80 325 h30 a10 10 0 0 1 10 10 v10 a10 10 0 0 1 -10 10 h-15 l-8 6 v-6 h-7 a10 10 0 0 1 -10 -10 v-10 a10 10 0 0 1 10 -10 z" />

  <!-- French Fries -->
  <path d="M190 325 l4 28 h20 l4 -28 z" />
  <path d="M195 325 v-15" />
  <path d="M201 325 v-20" />
  <path d="M207 325 v-18" />
  <path d="M213 325 v-12" />

  <!-- Game controller -->
  <rect x="280" y="325" width="40" height="22" rx="10" />
  <path d="M288 336 h6" />
  <path d="M291 333 v6" />
  <circle cx="310" cy="334" r="2" fill="#7A869A" />
  <circle cx="314" cy="339" r="2" fill="#7A869A" />
</svg>
`;

const doodleBase64 = Buffer.from(doodleSvg.trim()).toString('base64');
const doodleUrl = `data:image/svg+xml;base64,${doodleBase64}`;

// =========================================================================
// OPTION 1: The Iconic WAMR-Benchmark (Ultra-Clean, Instant Curiosity)
// Exactly like WAMR's hit feature graphic, but with NotiCatch branding
// =========================================================================
const htmlOption1 = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    width: 1024px;
    height: 500px;
    overflow: hidden;
    background: #E8ECEF;
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  }

  .doodle-bg {
    position: absolute;
    inset: 0;
    background-image: url("${doodleUrl}");
    background-repeat: repeat;
    background-size: 360px 360px;
    pointer-events: none;
  }

  /* Sticker Emojis with crisp white border and drop shadow */
  .emoji-sticker {
    position: absolute;
    font-size: 64px;
    line-height: 1;
    filter: 
      drop-shadow(2.5px 0 0 #FFFFFF)
      drop-shadow(-2.5px 0 0 #FFFFFF)
      drop-shadow(0 2.5px 0 #FFFFFF)
      drop-shadow(0 -2.5px 0 #FFFFFF)
      drop-shadow(2px 2px 0 #FFFFFF)
      drop-shadow(-2px -2px 0 #FFFFFF)
      drop-shadow(2px -2px 0 #FFFFFF)
      drop-shadow(-2px 2px 0 #FFFFFF)
      drop-shadow(0 8px 16px rgba(18, 25, 33, 0.18));
    z-index: 10;
  }
  .emoji-left {
    top: 130px;
    left: 200px;
    transform: rotate(-10deg);
  }
  .emoji-right {
    top: 130px;
    right: 200px;
    transform: rotate(10deg);
  }

  /* Center Stage */
  .bubble-container {
    position: relative;
    z-index: 5;
    margin-top: 10px;
  }

  /* Authentic WhatsApp Message Bubble */
  .wa-bubble {
    background: #FFFFFF;
    border-radius: 18px;
    border-top-left-radius: 4px;
    padding: 18px 28px;
    display: flex;
    align-items: center;
    gap: 16px;
    box-shadow: 0 4px 20px rgba(11, 20, 26, 0.08), 0 1px 3px rgba(11, 20, 26, 0.04);
    min-width: 530px;
    position: relative;
  }

  /* WhatsApp Bubble Tail */
  .wa-bubble::before {
    content: "";
    position: absolute;
    top: 0;
    left: -10px;
    width: 0;
    height: 0;
    border-top: 0px solid transparent;
    border-bottom: 14px solid transparent;
    border-right: 14px solid #FFFFFF;
  }

  .prohibition-icon {
    width: 28px;
    height: 28px;
    color: #54656F;
    flex-shrink: 0;
  }

  .deleted-text {
    font-size: 26px;
    font-style: italic;
    color: #54656F;
    font-weight: 400;
    letter-spacing: -0.2px;
  }

  .wa-time {
    font-size: 16px;
    color: #8696A0;
    margin-left: auto;
    padding-left: 28px;
    font-style: normal;
    font-weight: 400;
  }

  /* Bottom NotiCatch Branding */
  .bottom-branding {
    position: absolute;
    bottom: 45px;
    display: flex;
    align-items: center;
    gap: 12px;
    z-index: 5;
  }

  .app-icon {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    box-shadow: 0 4px 12px rgba(10, 108, 116, 0.25);
  }

  .brand-text-wrap {
    display: flex;
    flex-direction: column;
    gap: 1px;
  }

  .brand-name {
    font-size: 22px;
    font-weight: 800;
    color: #111B21;
    letter-spacing: 0.5px;
  }

  .brand-tagline {
    font-size: 13px;
    font-weight: 600;
    color: #54656F;
    letter-spacing: 0.2px;
  }
</style>
</head>
<body>
  <div class="doodle-bg"></div>

  <!-- Surrounding Stickers (Matching WAMR) -->
  <div class="emoji-sticker emoji-left">😱</div>
  <div class="emoji-sticker emoji-right">😤</div>

  <!-- Center WhatsApp Deleted Bubble -->
  <div class="bubble-container">
    <div class="wa-bubble">
      <svg class="prohibition-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
      </svg>
      <span class="deleted-text">This message was deleted</span>
      <span class="wa-time">17:20</span>
    </div>
  </div>

  <!-- Bottom NotiCatch Brand Card -->
  <div class="bottom-branding">
    <img src="data:image/png;base64,${iconBase64}" class="app-icon" />
    <div class="brand-text-wrap">
      <span class="brand-name">NotiCatch</span>
      <span class="brand-tagline">Recover Deleted Messages & Media</span>
    </div>
  </div>
</body>
</html>
`;

// =========================================================================
// OPTION 2: The "Magic Reveal" (Shows Deleted + How NotiCatch Recovers It)
// Perfectly spaced, wide landscape composition, ZERO clutter ("hibijibi")
// =========================================================================
const htmlOption2 = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    width: 1024px;
    height: 500px;
    overflow: hidden;
    background: #E8ECEF;
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  }

  .doodle-bg {
    position: absolute;
    inset: 0;
    background-image: url("${doodleUrl}");
    background-repeat: repeat;
    background-size: 360px 360px;
    pointer-events: none;
  }

  /* Header Brand Bar */
  .top-brand {
    position: absolute;
    top: 36px;
    display: flex;
    align-items: center;
    gap: 10px;
    background: rgba(255, 255, 255, 0.85);
    backdrop-filter: blur(8px);
    padding: 6px 18px 6px 12px;
    border-radius: 999px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
    z-index: 10;
  }
  .top-app-icon {
    width: 28px;
    height: 28px;
    border-radius: 7px;
  }
  .top-brand-title {
    font-size: 16px;
    font-weight: 800;
    color: #111B21;
    letter-spacing: 0.3px;
  }
  .top-brand-dot {
    color: #0A6C74;
    font-size: 16px;
  }
  .top-brand-sub {
    font-size: 14px;
    font-weight: 600;
    color: #0A6C74;
  }

  /* Main Flow Container (Horizontal Left to Right) */
  .flow-container {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 32px;
    z-index: 5;
    margin-top: 32px;
    width: 920px;
  }

  /* Card Columns */
  .flow-col {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 12px;
    position: relative;
  }

  /* Sticker Emojis positioned on top of each card */
  .emoji-tag {
    position: absolute;
    top: -36px;
    font-size: 44px;
    filter: 
      drop-shadow(2px 0 0 #FFFFFF)
      drop-shadow(-2px 0 0 #FFFFFF)
      drop-shadow(0 2px 0 #FFFFFF)
      drop-shadow(0 -2px 0 #FFFFFF)
      drop-shadow(0 6px 12px rgba(0,0,0,0.15));
    z-index: 10;
  }
  .emoji-tag.left { left: 16px; }
  .emoji-tag.right { right: 16px; }

  /* Left Bubble: Deleted WhatsApp Message */
  .bubble-deleted {
    background: #FFFFFF;
    border-radius: 16px;
    border-top-left-radius: 4px;
    padding: 20px 22px;
    box-shadow: 0 6px 24px rgba(11, 20, 26, 0.07);
    display: flex;
    flex-direction: column;
    gap: 12px;
    position: relative;
  }
  .bubble-deleted::before {
    content: "";
    position: absolute;
    top: 0;
    left: -8px;
    width: 0;
    height: 0;
    border-bottom: 12px solid transparent;
    border-right: 12px solid #FFFFFF;
  }
  .bubble-top-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .source-pill {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    font-weight: 700;
    color: #54656F;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .bubble-body {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .del-icon {
    width: 24px;
    height: 24px;
    color: #667781;
    flex-shrink: 0;
  }
  .del-text {
    font-size: 21px;
    font-style: italic;
    color: #54656F;
    font-weight: 400;
  }
  .del-time {
    font-size: 14px;
    color: #8696A0;
    align-self: flex-end;
  }

  /* Center Transition Arrow */
  .flow-arrow-wrap {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    z-index: 10;
  }
  .flow-arrow-circle {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: #0A6C74;
    color: #FFFFFF;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 22px;
    box-shadow: 0 4px 14px rgba(10, 108, 116, 0.35);
  }
  .flow-arrow-label {
    font-size: 12px;
    font-weight: 800;
    color: #0A6C74;
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  /* Right Bubble: NotiCatch Recovered Message */
  .bubble-recovered {
    background: #FFFFFF;
    border-radius: 16px;
    border: 2px solid #10B981;
    padding: 18px 22px;
    box-shadow: 0 8px 26px rgba(16, 185, 129, 0.12);
    display: flex;
    flex-direction: column;
    gap: 10px;
    position: relative;
  }
  .rec-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .rec-badge {
    display: flex;
    align-items: center;
    gap: 6px;
    background: #DCFCE7;
    color: #047857;
    font-size: 12px;
    font-weight: 800;
    padding: 3px 10px;
    border-radius: 999px;
    letter-spacing: 0.5px;
    text-transform: uppercase;
  }
  .rec-content {
    font-size: 21px;
    font-weight: 600;
    color: #111B21;
    line-height: 1.3;
  }
  .rec-footer {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 6px;
    font-size: 14px;
    color: #667781;
  }
  .blue-ticks {
    color: #53BDEB;
    font-weight: 900;
    font-size: 15px;
  }
</style>
</head>
<body>
  <div class="doodle-bg"></div>

  <!-- Top NotiCatch Header Pill -->
  <div class="top-brand">
    <img src="data:image/png;base64,${iconBase64}" class="top-app-icon" />
    <span class="top-brand-title">NotiCatch</span>
    <span class="top-brand-dot">•</span>
    <span class="top-brand-sub">Deleted Message Recovery</span>
  </div>

  <!-- Flow: Left (Deleted) -> Center Arrow -> Right (Recovered in NotiCatch) -->
  <div class="flow-container">
    <!-- Left: WhatsApp Deleted -->
    <div class="flow-col">
      <div class="emoji-tag left">😱</div>
      <div class="bubble-deleted">
        <div class="bubble-top-row">
          <div class="source-pill">
            <span>WhatsApp</span>
          </div>
          <span class="del-time">17:20</span>
        </div>
        <div class="bubble-body">
          <svg class="del-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
          </svg>
          <span class="del-text">This message was deleted</span>
        </div>
      </div>
    </div>

    <!-- Center Arrow -->
    <div class="flow-arrow-wrap">
      <div class="flow-arrow-circle">➔</div>
      <span class="flow-arrow-label">Recover</span>
    </div>

    <!-- Right: Recovered in NotiCatch -->
    <div class="flow-col">
      <div class="emoji-tag right">😃</div>
      <div class="bubble-recovered">
        <div class="rec-header">
          <div class="rec-badge">
            <span>✓</span>
            <span>Saved in NotiCatch</span>
          </div>
          <span class="del-time">17:20</span>
        </div>
        <div class="rec-content">
          Hey, are we still meeting tonight? 🎉
        </div>
        <div class="rec-footer">
          <span>Read invisibly</span>
          <span class="blue-ticks">✓✓</span>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
`;

// =========================================================================
// OPTION 3: The Hybrid Masterpiece (Single Bubble with Peel/Split Reveal)
// Top half shows deleted message, bottom half reveals NotiCatch recovered text
// =========================================================================
const htmlOption3 = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    width: 1024px;
    height: 500px;
    overflow: hidden;
    background: #E8ECEF;
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  }

  .doodle-bg {
    position: absolute;
    inset: 0;
    background-image: url("${doodleUrl}");
    background-repeat: repeat;
    background-size: 360px 360px;
    pointer-events: none;
  }

  /* Sticker Emojis */
  .emoji-sticker {
    position: absolute;
    font-size: 66px;
    line-height: 1;
    filter: 
      drop-shadow(2.5px 0 0 #FFFFFF)
      drop-shadow(-2.5px 0 0 #FFFFFF)
      drop-shadow(0 2.5px 0 #FFFFFF)
      drop-shadow(0 -2.5px 0 #FFFFFF)
      drop-shadow(0 8px 18px rgba(18, 25, 33, 0.18));
    z-index: 10;
  }
  .emoji-left {
    top: 90px;
    left: 175px;
    transform: rotate(-10deg);
  }
  .emoji-right {
    bottom: 95px;
    right: 175px;
    transform: rotate(10deg);
  }

  /* Main Card: Elegant 2-part Card */
  .split-card {
    position: relative;
    z-index: 5;
    width: 580px;
    background: #FFFFFF;
    border-radius: 22px;
    box-shadow: 0 8px 30px rgba(11, 20, 26, 0.09), 0 2px 6px rgba(11, 20, 26, 0.04);
    overflow: hidden;
  }

  /* Part 1: Deleted Top */
  .part-deleted {
    padding: 20px 28px;
    display: flex;
    align-items: center;
    gap: 16px;
    background: #FAFBFB;
    border-bottom: 1.5px dashed #D1D7DB;
  }
  .prohibition-icon {
    width: 26px;
    height: 26px;
    color: #667781;
    flex-shrink: 0;
  }
  .deleted-text {
    font-size: 23px;
    font-style: italic;
    color: #667781;
    font-weight: 400;
  }
  .del-time {
    font-size: 15px;
    color: #8696A0;
    margin-left: auto;
    padding-left: 20px;
  }

  /* Part 2: Recovered Bottom */
  .part-recovered {
    padding: 20px 28px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: #FFFFFF;
  }
  .rec-left {
    display: flex;
    align-items: center;
    gap: 14px;
  }
  .rec-app-icon {
    width: 38px;
    height: 38px;
    border-radius: 10px;
    box-shadow: 0 3px 8px rgba(10, 108, 116, 0.25);
  }
  .rec-text-wrap {
    display: flex;
    flex-direction: column;
    gap: 3px;
  }
  .rec-tag {
    font-size: 11px;
    font-weight: 800;
    color: #0A6C74;
    text-transform: uppercase;
    letter-spacing: 0.8px;
  }
  .rec-content {
    font-size: 22px;
    font-weight: 600;
    color: #111B21;
  }
  .rec-time-wrap {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 15px;
    color: #667781;
  }
  .blue-ticks {
    color: #53BDEB;
    font-weight: 900;
  }

  /* Bottom Header Bar */
  .bottom-bar {
    position: absolute;
    bottom: 34px;
    font-size: 16px;
    font-weight: 700;
    color: #54656F;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .bottom-dot {
    color: #0A6C74;
  }
</style>
</head>
<body>
  <div class="doodle-bg"></div>

  <!-- Emojis -->
  <div class="emoji-sticker emoji-left">😱</div>
  <div class="emoji-sticker emoji-right">😃</div>

  <!-- Unified Split Card -->
  <div class="split-card">
    <!-- Top: What WhatsApp Shows -->
    <div class="part-deleted">
      <svg class="prohibition-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
        <circle cx="12" cy="12" r="10"/>
        <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
      </svg>
      <span class="deleted-text">This message was deleted</span>
      <span class="del-time">17:20</span>
    </div>

    <!-- Bottom: What NotiCatch Recovers -->
    <div class="part-recovered">
      <div class="rec-left">
        <img src="data:image/png;base64,${iconBase64}" class="rec-app-icon" />
        <div class="rec-text-wrap">
          <span class="rec-tag">Recovered by NotiCatch</span>
          <span class="rec-content">Hey, are we still meeting tonight? 🎉</span>
        </div>
      </div>
      <div class="rec-time-wrap">
        <span>17:20</span>
        <span class="blue-ticks">✓✓</span>
      </div>
    </div>
  </div>

  <div class="bottom-bar">
    <span>NotiCatch</span>
    <span class="bottom-dot">•</span>
    <span>Auto-Save Deleted Messages & Media</span>
  </div>
</body>
</html>
`;

const outDir = '/Users/mehedihasan/.gemini/antigravity/brain/d7a06c9e-e511-4cc0-9c40-ebd0ec90784d';
const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

function renderHtml(html, outName) {
  const tmpHtml = `/tmp/${outName}.html`;
  const outPng = path.join(outDir, `${outName}.png`);
  fs.writeFileSync(tmpHtml, html);
  execSync(`"${chromePath}" --headless=new --screenshot="${outPng}" --window-size=1024,500 --hide-scrollbars --user-data-dir=/tmp/chrome-data --no-sandbox --disable-gpu "file://${tmpHtml}" 2>/dev/null`);
  console.log(`Rendered: ${outPng}`);
  return outPng;
}

const p1 = renderHtml(htmlOption1, 'feature_graphic_option1_wamr_minimal');
const p2 = renderHtml(htmlOption2, 'feature_graphic_option2_horizontal_flow');
const p3 = renderHtml(htmlOption3, 'feature_graphic_option3_unified_split');

// Also update the main playstore_feature_graphic_1024x500.png with option 3 (or option 1)
const mainAsset = path.resolve(__dirname, '../assets/playstore_feature_graphic_1024x500.png');
fs.copyFileSync(p3, mainAsset);
fs.copyFileSync(p3, path.join(outDir, 'playstore_feature_graphic_1024x500.png'));
console.log('✓ Successfully generated all 3 variations and updated main asset!');

