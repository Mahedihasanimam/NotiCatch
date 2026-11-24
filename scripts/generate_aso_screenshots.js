// ASO Play Store screenshots (1080x2400) built from real device captures in assets/playstore_source.
// Run: node scripts/generate_aso_screenshots.js  → assets/playstore_screenshots_aso/
const { execSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'assets/playstore_source');
const OUT = path.join(ROOT, 'assets/playstore_screenshots_aso');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'aso-'));
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
fs.mkdirSync(OUT, { recursive: true });

const img = (f) => `data:image/png;base64,${fs.readFileSync(path.join(SRC, f)).toString('base64')}`;
const MESSAGES = img('messages.png');
const SAVED = img('saved.png');
const ICON = `data:image/png;base64,${fs.readFileSync(path.join(ROOT, 'assets/playstore_icon_512.png')).toString('base64')}`;

// Source captures are 720x1600. Phone screen renders at 760 wide → scale 760/720.
const SCREEN_W = 760;
const SCALE = SCREEN_W / 720;

/** A zoomed crop of a source capture: region {y, h} (source px, full width), shown at `zoom`. */
function zoomCrop(src, { x = 0, y, w = 720, h }, zoom) {
  return `<div class="crop" style="width:${w * zoom}px;height:${h * zoom}px;
    background-image:url(${src});background-size:${720 * zoom}px ${1600 * zoom}px;
    background-position:-${x * zoom}px -${y * zoom}px"></div>`;
}

const SHOTS = [
  {
    file: '01_recover_deleted_messages.png',
    tag: 'Deleted Message Recovery',
    title: 'See <em>Deleted</em><br>Messages',
    sub: 'Unsent or deleted? NotiCatch already saved it.',
    screen: MESSAGES,
    overlay: `
      <div class="float recover" style="top:1180px">
        <div class="deleted"><span class="ban">⊘</span><i>This message was deleted</i><span class="t">2:25 pm</span></div>
        <div class="recovered">
          <img src="${ICON}" class="mini-icon">
          <div><div class="rlabel">RECOVERED BY NOTICATCH</div><div class="rmsg">Kar satha kotha bolso tmi</div></div>
          <span class="t">2:25 pm</span>
        </div>
      </div>`,
  },
  {
    file: '02_read_without_seen.png',
    tag: 'Secret Reader',
    title: 'Read Chats<br><em>Without “Seen”</em>',
    sub: 'Read every message quietly. No read receipts.',
    screen: SAVED,
    overlay: `
      <div class="float zoom" style="top:1300px">
        ${zoomCrop(SAVED, { x: 30, y: 968, w: 660, h: 232 }, 1.5)}
        <div class="chip gold" style="top:-84px;right:40px">👁 Read silently</div>
      </div>`,
  },
  {
    file: '03_recover_photos_voice_notes.png',
    tag: 'Media Recovery',
    title: 'Deleted Photos<br><em>&amp; Voice Notes</em>',
    sub: 'Recover them anytime. View &amp; play.',
    screen: SAVED,
    overlay: `
      <div class="float media" style="top:1010px">
        <div class="bubble photo">
          <div class="del-tag">⊘ DELETED BY SENDER</div>
          <svg viewBox="0 70 800 400" class="pic">
            <defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFB86B"/><stop offset=".55" stop-color="#FF7E79"/><stop offset="1" stop-color="#7A5AC8"/></linearGradient></defs>
            <rect width="800" height="520" fill="url(#sky)"/>
            <circle cx="560" cy="250" r="80" fill="#FFE7A8"/>
            <path d="M0 380 L170 230 L300 330 L450 190 L640 360 L800 270 L800 520 L0 520Z" fill="#3E2F6B"/>
            <path d="M0 440 L200 340 L380 430 L560 330 L800 430 L800 520 L0 520Z" fill="#241B45"/>
          </svg>
          <div class="meta"><span>📷 Photo recovered</span><span>2:25 pm</span></div>
        </div>
        <div class="bubble voice">
          <div class="del-tag">⊘ DELETED BY SENDER</div>
          <div class="player">
            <div class="play">▶</div>
            <div class="wave">${Array.from({ length: 34 }, (_, i) => `<i style="height:${18 + Math.round(Math.abs(Math.sin(i * 1.7) * 52 + Math.sin(i * 0.6) * 20))}px;${i < 12 ? 'background:#0A6C74' : ''}"></i>`).join('')}</div>
            <div class="dur">0:42</div>
          </div>
        </div>
      </div>`,
  },
  {
    file: '04_one_inbox_all_apps.png',
    tag: 'Smart Inbox',
    title: 'All Your Chats<br><em>In One Inbox</em>',
    sub: 'Grouped by contact, with message counts.',
    screen: MESSAGES,
    overlay: `
      <div class="float zoom" style="top:1260px">
        ${zoomCrop(MESSAGES, { x: 0, y: 330, w: 720, h: 425 }, 1.36)}
        <div class="chip" style="top:-84px;right:40px">💬 14 messages saved</div>
      </div>`,
  },
  {
    file: '05_private_secure.png',
    tag: 'Private & Secure',
    title: '100% Private<br><em>&amp; Secure</em>',
    sub: 'Your data never leaves your phone.',
    screen: MESSAGES,
    overlay: `
      <div class="badges">
        <div class="badge"><span>🔒</span>PIN Lock</div>
        <div class="badge"><span>👆</span>Fingerprint</div>
        <div class="badge"><span>📴</span>Works Offline</div>
        <div class="badge"><span>🚫</span>No Tracking</div>
      </div>`,
  },
];

function html(s) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@500;700;800&display=block" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{width:1080px;height:2400px;overflow:hidden;position:relative;font-family:Manrope,-apple-system,sans-serif;color:#fff;
  background:radial-gradient(1100px 900px at 50% 1250px, rgba(31,170,180,.45), transparent 70%),
             linear-gradient(170deg,#0C8089 0%,#0A6C74 38%,#063F45 100%)}
.dots{position:absolute;inset:0;opacity:.07;background-image:radial-gradient(#fff 2px,transparent 2px);background-size:44px 44px}
.head{position:absolute;top:120px;width:100%;text-align:center;padding:0 60px}
.tag{display:inline-flex;align-items:center;gap:14px;padding:14px 30px 14px 16px;border-radius:999px;
  background:rgba(255,255,255,.12);border:2px solid rgba(255,255,255,.22);font-weight:800;font-size:30px;letter-spacing:1.5px;text-transform:uppercase}
.tag img{width:48px;height:48px;border-radius:12px}
h1{margin-top:44px;font-weight:800;font-size:112px;line-height:1.05;letter-spacing:-3px;text-shadow:0 6px 30px rgba(0,0,0,.25)}
h1 em{font-style:normal;color:#FFC107}
.sub{margin-top:34px;font-size:42px;font-weight:500;color:rgba(255,255,255,.88)}
.phone{position:absolute;left:50%;top:720px;transform:translateX(-50%);width:${SCREEN_W + 36}px;height:${1600 * SCALE + 36}px;
  border-radius:78px;background:#11161B;padding:18px;box-shadow:0 40px 120px rgba(0,0,0,.5),0 0 0 3px rgba(255,255,255,.12)}
.screen{width:100%;height:100%;border-radius:62px;background:url(${s.screen}) top/100% auto no-repeat}
.float{position:absolute;left:50%;transform:translateX(-50%);z-index:5}
.zoom .crop{border-radius:40px;box-shadow:0 30px 80px rgba(0,0,0,.6),0 0 0 4px #FFC107}
.crop{background-repeat:no-repeat}
.chip{position:absolute;padding:16px 30px;border-radius:999px;background:#fff;color:#0A6C74;font-weight:800;font-size:34px;box-shadow:0 12px 30px rgba(0,0,0,.35);white-space:nowrap}
.chip.gold{background:#FFC107;color:#1A1A1A}
.recover{width:960px;background:#fff;border-radius:44px;color:#0F1A20;box-shadow:0 30px 90px rgba(0,0,0,.55);overflow:hidden}
.deleted{display:flex;align-items:center;gap:20px;padding:40px 44px;color:#6B7A83;font-size:40px;border-bottom:3px dashed #D3DCE1}
.ban{font-size:50px}.t{margin-left:auto;font-size:30px;color:#8A979F}
.recovered{display:flex;align-items:center;gap:24px;padding:40px 44px}
.mini-icon{width:84px;height:84px;border-radius:22px}
.rlabel{font-size:26px;font-weight:800;color:#0A6C74;letter-spacing:1.5px}
.rmsg{font-size:44px;font-weight:800;margin-top:6px}
.media{width:960px;display:flex;flex-direction:column;gap:36px}
.bubble{background:#fff;border-radius:44px;padding:28px;box-shadow:0 30px 90px rgba(0,0,0,.55);color:#0F1A20;position:relative}
.del-tag{display:inline-block;background:#FDE2E1;color:#C62828;font-weight:800;font-size:28px;letter-spacing:1.5px;padding:10px 22px;border-radius:999px;margin-bottom:22px}
.pic{display:block;width:100%;height:auto;border-radius:28px}
.meta{display:flex;justify-content:space-between;margin-top:20px;font-size:32px;font-weight:700;color:#52636D}
.meta span:first-child{color:#0A6C74}
.player{display:flex;align-items:center;gap:26px}
.play{width:104px;height:104px;border-radius:50%;background:#0A6C74;color:#fff;font-size:44px;display:flex;align-items:center;justify-content:center;padding-left:8px;flex:none}
.wave{flex:1;display:flex;align-items:center;gap:7px;height:110px}
.wave i{flex:1;border-radius:6px;background:#B9D3D7}
.dur{font-size:34px;font-weight:800;color:#52636D}
.badges{position:absolute;left:50%;transform:translateX(-50%);top:1440px;z-index:5;display:grid;grid-template-columns:1fr 1fr;gap:28px;width:960px}
.badge{display:flex;align-items:center;gap:20px;padding:34px 32px;border-radius:36px;background:rgba(255,255,255,.96);color:#0A6C74;
  font-size:40px;font-weight:800;box-shadow:0 20px 50px rgba(0,0,0,.4)}
.badge span{font-size:52px}
</style></head><body>
<div class="dots"></div>
<div class="head">
  <div class="tag"><img src="${ICON}">${s.tag}</div>
  <h1>${s.title}</h1>
  <div class="sub">${s.sub}</div>
</div>
<div class="phone"><div class="screen"></div></div>
${s.overlay}
</body></html>`;
}

for (const s of SHOTS) {
  const htmlPath = path.join(TMP, s.file.replace('.png', '.html'));
  fs.writeFileSync(htmlPath, html(s));
  const out = path.join(OUT, s.file);
  execSync(`"${CHROME}" --headless=new --screenshot="${out}" --window-size=1080,2400 --hide-scrollbars --virtual-time-budget=4000 --user-data-dir="${TMP}/chrome" --no-sandbox --disable-gpu "file://${htmlPath}" 2>/dev/null`);
  console.log('✓', s.file);
}
