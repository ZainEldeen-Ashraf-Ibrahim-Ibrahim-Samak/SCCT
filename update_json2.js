const fs = require('fs');

const enFile = 'mobile-shell/assets/i18n/en.json';
const arFile = 'mobile-shell/assets/i18n/ar.json';

const enData = JSON.parse(fs.readFileSync(enFile, 'utf8'));
const arData = JSON.parse(fs.readFileSync(arFile, 'utf8'));

enData["mobile.startupError.title"] = "Startup configuration issue";
enData["mobile.startupError.retry"] = "Retry startup";
enData["mobile.startupError.code"] = "Error code";
enData["mobile.startupError.help"] = "Update environment settings and try again.";

arData["mobile.startupError.title"] = "مشكلة في إعدادات التشغيل";
arData["mobile.startupError.retry"] = "إعادة محاولة التشغيل";
arData["mobile.startupError.code"] = "رمز الخطأ";
arData["mobile.startupError.help"] = "حدّث إعدادات البيئة ثم حاول مجددًا.";

fs.writeFileSync(enFile, JSON.stringify(enData, null, 2));
fs.writeFileSync(arFile, JSON.stringify(arData, null, 2));
