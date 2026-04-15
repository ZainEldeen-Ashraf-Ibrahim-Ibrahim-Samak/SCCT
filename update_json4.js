const fs = require('fs');

const enFile = 'mobile-shell/assets/i18n/en.json';
const arFile = 'mobile-shell/assets/i18n/ar.json';

const enData = JSON.parse(fs.readFileSync(enFile, 'utf8'));
const arData = JSON.parse(fs.readFileSync(arFile, 'utf8'));

enData["mobile.startupError.config_missing"] = "Some required configuration values are missing.";
enData["mobile.startupError.config_invalid_url"] = "The base startup URL is invalid.";
enData["mobile.startupError.config_invalid_hosts"] = "Allowed hosts configuration is invalid.";
enData["mobile.startupError.config_invalid_locale"] = "Locale configuration is invalid.";
enData["mobile.startupError.config_invalid_numeric_range"] = "Startup numeric configuration is out of range.";
enData["mobile.startupError.unknown"] = "Startup configuration error occurred.";

arData["mobile.startupError.config_missing"] = "بعض إعدادات التشغيل المطلوبة مفقودة.";
arData["mobile.startupError.config_invalid_url"] = "رابط التشغيل الأساسي غير صالح.";
arData["mobile.startupError.config_invalid_hosts"] = "قائمة النطاقات المسموح بها غير صالحة.";
arData["mobile.startupError.config_invalid_locale"] = "إعدادات اللغة غير صالحة.";
arData["mobile.startupError.config_invalid_numeric_range"] = "قيم إعدادات التشغيل خارج النطاق المسموح.";
arData["mobile.startupError.unknown"] = "حدث خطأ في إعدادات التشغيل.";

fs.writeFileSync(enFile, JSON.stringify(enData, null, 2));
fs.writeFileSync(arFile, JSON.stringify(arData, null, 2));
