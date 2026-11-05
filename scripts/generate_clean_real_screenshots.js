const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.resolve(__dirname, '../assets/playstore_screenshots');
const ARTIFACT_DIR = '/Users/mehedihasan/.gemini/antigravity/brain/d7a06c9e-e511-4cc0-9c40-ebd0ec90784d';

if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
if (!fs.existsSync(ARTIFACT_DIR)) fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

const uploadedDir = '/Users/mehedihasan/.gemini/antigravity/brain/d7a06c9e-e511-4cc0-9c40-ebd0ec90784d/.user_uploaded';

// Read real screenshots as base64
const img1Base64 = fs.readFileSync(path.join(uploadedDir, 'media_1793685117618_2f6559e8.jpg')).toString('base64');
const img2Base64 = fs.readFileSync(path.join(uploadedDir, 'media_1793685783536_ff815270.jpg')).toString('base64');
const img3Base64 = fs.readFileSync(path.join(uploadedDir, 'media_1793675791555_d333b0ec.png')).toString('base64');
const img4Base64 = fs.readFileSync(path.join(uploadedDir, 'media_1793685113306_460e66ee.jpg')).toString('base64');
const img5Base64 = fs.readFileSync(path.join(uploadedDir, 'media_1793683858798_1205332a.jpg')).toString('base64');
const img6Base64 = fs.readFileSync(path.resolve(__dirname, '../assets/onbording.png')).toString('base64');

function generateHtml(config) {
  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
  body {
    width: 1080px;
    height: 2400px;
    background: #080D18;
    overflow: hidden;
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    color: #FFFFFF;
  }

  /* Subtle ambient lighting */
  .bg-ambient {
    position: absolute;
    top: 250px;
    left: 50%;
    transform: translateX(-50%);
    width: 1000px;
    height: 1000px;
    background: radial-gradient(circle, ${config.glowColor} 0%, rgba(8, 13, 24, 0) 70%);
    pointer-events: none;
    z-index: 1;
  }

  /* Header Section */
  .header {
    position: relative;
    z-index: 10;
    width: 1000px;
    padding-top: 90px;
    text-align: center;
  }
  .pill {
    display: inline-flex;
    align-items: center;
    gap: 12px;
    padding: 12px 28px;
    background: rgba(255, 255, 255, 0.06);
    border: 1.5px solid ${config.accentColor};
    border-radius: 999px;
    font-size: 24px;
    font-weight: 800;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    color: ${config.accentColor};
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
    margin-bottom: 22px;
  }
  .title {
    font-size: 68px;
    font-weight: 900;
    line-height: 1.15;
    letter-spacing: -1.5px;
    text-transform: uppercase;
    color: #FFFFFF;
    margin-bottom: 16px;
    text-shadow: 0 4px 20px rgba(0,0,0,0.6);
  }
  .subtitle {
    font-size: 30px;
    font-weight: 500;
    color: #94A3B8;
    line-height: 1.4;
    max-width: 900px;
    margin: 0 auto;
  }
  .sub-bangla {
    color: ${config.accentColor};
    font-weight: 700;
    font-size: 28px;
    display: block;
    margin-top: 6px;
  }

  /* Realistic Clean Phone Mockup */
  .phone-frame {
    position: relative;
    z-index: 10;
    width: 820px;
    height: 1780px;
    margin-top: 50px;
    background: #111827;
    border-radius: 56px;
    padding: 14px;
    border: 1.5px solid rgba(255, 255, 255, 0.18);
    box-shadow: 
      0 40px 90px -15px rgba(0, 0, 0, 0.9),
      0 0 60px ${config.glowColor};
  }
  .screen-area {
    width: 100%;
    height: 100%;
    border-radius: 44px;
    overflow: hidden;
    position: relative;
    background: #000000;
    border: 1px solid rgba(255, 255, 255, 0.08);
  }
  .screen-area img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  /* Punch-hole camera */
  .notch-punch {
    position: absolute;
    top: 14px;
    left: 50%;
    transform: translateX(-50%);
    width: 20px;
    height: 20px;
    background: #000000;
    border-radius: 50%;
    z-index: 20;
    border: 1.5px solid #1E293B;
  }

  /* Floating Clean Callout Badges */
  .floating-callout {
    position: absolute;
    ${config.calloutPosition};
    z-index: 30;
    padding: 18px 28px;
    background: rgba(15, 23, 42, 0.94);
    border: 2px solid ${config.accentColor};
    border-radius: 22px;
    backdrop-filter: blur(20px);
    box-shadow: 0 20px 45px rgba(0,0,0,0.7), 0 0 35px ${config.glowColor};
    display: flex;
    align-items: center;
    gap: 16px;
    color: #FFFFFF;
  }
  .callout-icon {
    font-size: 32px;
  }
  .callout-title {
    font-size: 22px;
    font-weight: 800;
    color: ${config.accentColor};
  }
  .callout-sub {
    font-size: 16px;
    font-weight: 600;
    color: #CBD5E1;
    margin-top: 2px;
  }
</style>
</head>
<body>
  <div class="bg-ambient"></div>

  <div class="header">
    <div class="pill">
      <span>${config.pill}</span>
    </div>
    <h1 class="title">${config.title}</h1>
    <p class="subtitle">${config.subtitle}<span class="sub-bangla">${config.subBangla}</span></p>
  </div>

  <div class="phone-frame">
    <div class="screen-area">
      <div class="notch-punch"></div>
      <img src="data:image/${config.imgMime};base64,${config.imgBase64}" />
    </div>

    <div class="floating-callout">
      <span class="callout-icon">${config.calloutIcon}</span>
      <div>
        <div class="callout-title">${config.calloutTitle}</div>
        <div class="callout-sub">${config.calloutSub}</div>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

const screens = [
  {
    filename: '01_recover_deleted_chats',
    imgBase64: img1Base64,
    imgMime: 'jpeg',
    accentColor: '#2DD4BF',
    glowColor: 'rgba(13, 148, 136, 0.25)',
    pill: '⚡ REAL-TIME RECOVERY',
    title: 'RECOVER DELETED CHATS',
    subtitle: 'Recover deleted messages, voice notes & photos before they vanish',
    subBangla: 'ডিলিট করা মেসেজ, ফটো ও অডিও স্বয়ংক্রিয়ভাবে উদ্ধার করুন',
    calloutPosition: 'bottom: 120px; right: -25px;',
    calloutIcon: '🎙️',
    calloutTitle: 'AUDIO & PHOTO RECOVERED',
    calloutSub: 'Saved automatically before sender deleted'
  },
  {
    filename: '02_read_without_blue_ticks',
    imgBase64: img2Base64,
    imgMime: 'jpeg',
    accentColor: '#C084FC',
    glowColor: 'rgba(168, 85, 247, 0.25)',
    pill: '🕶️ SECRET INCOGNITO READER',
    title: 'READ WITHOUT BLUE TICKS',
    subtitle: 'Read entire conversations in complete secrecy without "Seen"',
    subBangla: 'গোপনে মেসেজ পড়ুন — সেন্ডার কোনো ব্লু টিক দেখতে পাবে না',
    calloutPosition: 'bottom: 140px; left: -25px;',
    calloutIcon: '👁️',
    calloutTitle: 'NO BLUE CHECKMARKS',
    calloutSub: 'Read messages completely unseen'
  },
  {
    filename: '03_autosave_photos_media',
    imgBase64: img3Base64,
    imgMime: 'png',
    accentColor: '#38BDF8',
    glowColor: 'rgba(56, 189, 248, 0.25)',
    pill: '📸 PHOTO & MEDIA VAULT',
    title: 'AUTO-SAVE PHOTOS & MEDIA',
    subtitle: 'View cached pictures and media attachments even after deletion',
    subBangla: 'ছবি ডিলিট করলেও NotiCatch ক্যাশে সুরক্ষিত থাকবে',
    calloutPosition: 'bottom: 120px; right: -25px;',
    calloutIcon: '📷',
    calloutTitle: 'PHOTOS CACHED LOCALLY',
    calloutSub: 'Open, view and share anytime'
  },
  {
    filename: '04_realtime_notification_capture',
    imgBase64: img4Base64,
    imgMime: 'jpeg',
    accentColor: '#FB923C',
    glowColor: 'rgba(251, 146, 60, 0.25)',
    pill: '🔔 100% TIMELINE CAPTURE',
    title: 'NEVER MISS A NOTIFICATION',
    subtitle: 'Intercepts incoming notifications the exact millisecond they arrive',
    subBangla: 'নোটিফিকেশন আসার সাথে সাথেই স্বয়ংক্রিয়ভাবে রেকর্ড হয়',
    calloutPosition: 'bottom: 140px; left: -25px;',
    calloutIcon: '⚡',
    calloutTitle: 'INTERCEPTED IN REAL-TIME',
    calloutSub: 'Saved even if notification is cleared'
  },
  {
    filename: '05_organized_chat_inbox',
    imgBase64: img5Base64,
    imgMime: 'jpeg',
    accentColor: '#60A5FA',
    glowColor: 'rgba(96, 165, 250, 0.25)',
    pill: '🗂️ ORGANIZED INBOX',
    title: 'ALL CHATS IN ONE PLACE',
    subtitle: 'Search & filter messages across WhatsApp, Messenger & Teams',
    subBangla: 'সব অ্যাপের মেসেজ ও চ্যাট এক জায়গায় খুঁজুন এবং পড়ুন',
    calloutPosition: 'bottom: 120px; right: -25px;',
    calloutIcon: '🔍',
    calloutTitle: 'SEARCH & FILTER',
    calloutSub: 'Organized by apps and senders'
  },
  {
    filename: '06_private_offline_security',
    imgBase64: img6Base64,
    imgMime: 'png',
    accentColor: '#FBBF24',
    glowColor: 'rgba(251, 191, 36, 0.25)',
    pill: '🔒 100% LOCAL & PRIVATE',
    title: '100% PRIVATE & SECURE',
    subtitle: 'All notifications stay on your device • Biometric & PIN lock',
    subBangla: '১০০% অফলাইন ও নিরাপদ — কোনো ডেটা সার্ভারে যায় না',
    calloutPosition: 'bottom: 140px; left: -25px;',
    calloutIcon: '🛡️',
    calloutTitle: 'ZERO CLOUD UPLOAD',
    calloutSub: 'Protected with Biometric & PIN lock'
  }
];

console.log('Generating 6 Clean, Real Google Play Store Screenshots (1080 x 2400)...');

for (const s of screens) {
  const htmlPath = path.join('/tmp', `${s.filename}_clean.html`);
  const outPngLocal = path.join(OUTPUT_DIR, `${s.filename}.png`);
  const outPngArtifact = path.join(ARTIFACT_DIR, `${s.filename}.png`);

  const html = generateHtml(s);
  fs.writeFileSync(htmlPath, html, 'utf8');

  console.log(`Rendering ${s.filename}...`);
  try {
    execSync(`"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --screenshot="${outPngLocal}" --window-size=1080,2400 --hide-scrollbars --user-data-dir=/tmp/chrome-data --no-sandbox --disable-gpu "file://${htmlPath}" 2>/dev/null`);

    fs.copyFileSync(outPngLocal, outPngArtifact);
    const stat = fs.statSync(outPngLocal);
    console.log(`✓ Generated ${s.filename}.png (${(stat.size / 1024).toFixed(1)} KB)`);
  } catch (err) {
    console.error(`Error generating ${s.filename}:`, err.message);
  }
}

console.log('All 6 real & clean screenshots have been generated successfully!');

