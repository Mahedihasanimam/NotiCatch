const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const iconBase64 = fs.readFileSync(path.resolve(__dirname, '../assets/playstore_icon_512.png')).toString('base64');
const chatImgBase64 = fs.readFileSync('/Users/mehedihasan/.gemini/antigravity/brain/d7a06c9e-e511-4cc0-9c40-ebd0ec90784d/.user_uploaded/media_1793685117618_2f6559e8.jpg').toString('base64');

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
    background: #080D1A;
    color: #FFFFFF;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 60px;
  }

  /* Ambient Glows */
  .glow-left {
    position: absolute;
    top: -100px;
    left: -100px;
    width: 600px;
    height: 600px;
    background: radial-gradient(circle, rgba(13, 148, 136, 0.3) 0%, rgba(8, 13, 26, 0) 70%);
    pointer-events: none;
  }
  .glow-right {
    position: absolute;
    bottom: -150px;
    right: 50px;
    width: 600px;
    height: 600px;
    background: radial-gradient(circle, rgba(56, 189, 248, 0.25) 0%, rgba(8, 13, 26, 0) 70%);
    pointer-events: none;
  }

  /* Left Brand Info */
  .left-content {
    position: relative;
    z-index: 10;
    max-width: 540px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .brand-row {
    display: flex;
    align-items: center;
    gap: 18px;
  }
  .app-icon-img {
    width: 76px;
    height: 76px;
    border-radius: 20px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5), 0 0 20px rgba(45, 212, 191, 0.3);
    border: 1px solid rgba(255, 255, 255, 0.2);
  }
  .brand-title {
    font-size: 50px;
    font-weight: 900;
    letter-spacing: -1px;
    background: linear-gradient(135deg, #FFFFFF 30%, #2DD4BF 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  .brand-tagline {
    font-size: 26px;
    font-weight: 700;
    line-height: 1.25;
    color: #F8FAFC;
  }
  .brand-sub {
    font-size: 18px;
    color: #94A3B8;
    line-height: 1.4;
  }
  .pills-row {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-top: 6px;
  }
  .feature-pill {
    padding: 8px 16px;
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(45, 212, 191, 0.3);
    border-radius: 999px;
    font-size: 14px;
    font-weight: 700;
    color: #2DD4BF;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  /* Right Phone Mockup */
  .right-mockup {
    position: relative;
    z-index: 10;
    width: 320px;
    height: 640px;
    margin-top: 80px;
    transform: rotate(-6deg) translateY(-20px);
    background: #111827;
    border-radius: 44px;
    padding: 10px;
    border: 1.5px solid rgba(255, 255, 255, 0.2);
    box-shadow: 
      0 30px 70px rgba(0, 0, 0, 0.8),
      0 0 40px rgba(13, 148, 136, 0.25);
  }
  .screen-wrap {
    width: 100%;
    height: 100%;
    border-radius: 34px;
    overflow: hidden;
    background: #000;
    position: relative;
  }
  .screen-wrap img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .floating-badge {
    position: absolute;
    bottom: 240px;
    left: -50px;
    padding: 12px 20px;
    background: rgba(15, 23, 42, 0.95);
    border: 1.5px solid #2DD4BF;
    border-radius: 16px;
    backdrop-filter: blur(10px);
    box-shadow: 0 10px 25px rgba(0,0,0,0.6);
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 16px;
    font-weight: 800;
    color: #FFFFFF;
    white-space: nowrap;
    transform: rotate(6deg);
  }
</style>
</head>
<body>
  <div class="glow-left"></div>
  <div class="glow-right"></div>

  <div class="left-content">
    <div class="brand-row">
      <img src="data:image/png;base64,${iconBase64}" class="app-icon-img" />
      <span class="brand-title">NotiCatch</span>
    </div>

    <div class="brand-tagline">
      Recover Deleted Messages, Photos & Audio
    </div>

    <div class="brand-sub">
      Never miss an important text or notification again. Read unseen without blue checkmarks.
    </div>

    <div class="pills-row">
      <div class="feature-pill">⚡ Auto-Recovery</div>
      <div class="feature-pill">🎙️ Voice Notes</div>
      <div class="feature-pill">📷 Photos & Media</div>
      <div class="feature-pill">🔒 100% Private</div>
    </div>
  </div>

  <div class="right-mockup">
    <div class="screen-wrap">
      <img src="data:image/jpeg;base64,${chatImgBase64}" />
    </div>
    <div class="floating-badge">
      <span>⚡</span>
      <span style="color: #2DD4BF;">Instant Chat Recovery</span>
    </div>
  </div>
</body>
</html>
`;

const htmlPath = '/tmp/feature_graphic.html';
const outPng = path.resolve(__dirname, '../assets/playstore_feature_graphic_1024x500.png');
const outArtifact = '/Users/mehedihasan/.gemini/antigravity/brain/d7a06c9e-e511-4cc0-9c40-ebd0ec90784d/playstore_feature_graphic_1024x500.png';

fs.writeFileSync(htmlPath, html);
execSync(`"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --screenshot="${outPng}" --window-size=1024,500 --hide-scrollbars --user-data-dir=/tmp/chrome-data --no-sandbox --disable-gpu "file://${htmlPath}" 2>/dev/null`);

fs.copyFileSync(outPng, outArtifact);
const stat = fs.statSync(outPng);
console.log(`✓ Feature graphic generated (1024x500): ${(stat.size / 1024).toFixed(1)} KB`);

