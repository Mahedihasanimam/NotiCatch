/**
 * Helper to identify messaging / chat applications vs general notification apps.
 */
export function isChatMessage(record: {
  packageName?: string | null;
  appName?: string | null;
  category?: string | null;
}): boolean {
  if (record.category === 'msg') return true;

  const pkg = (record.packageName || '').toLowerCase();
  const app = (record.appName || '').toLowerCase();

  return (
    pkg.includes('whatsapp') ||
    app.includes('whatsapp') ||
    pkg.includes('telegram') ||
    app.includes('telegram') ||
    pkg.includes('signal') ||
    app.includes('signal') ||
    pkg.includes('messenger') ||
    pkg.includes('orca') ||
    app.includes('messenger') ||
    pkg.includes('messaging') ||
    pkg.includes('mms') ||
    app.includes('message') ||
    app.includes('messages') ||
    app.includes('sms') ||
    pkg.includes('discord') ||
    app.includes('discord') ||
    pkg.includes('viber') ||
    app.includes('viber') ||
    pkg.includes('slack') ||
    app.includes('slack') ||
    pkg.includes('instagram') ||
    app.includes('instagram') ||
    pkg.includes('line') ||
    pkg.includes('skype') ||
    pkg.includes('wechat') ||
    pkg.includes('imo')
  );
}

