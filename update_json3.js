const fs = require('fs');

const enFile = 'mobile-shell/assets/i18n/en.json';
const arFile = 'mobile-shell/assets/i18n/ar.json';

const enData = JSON.parse(fs.readFileSync(enFile, 'utf8'));
const arData = JSON.parse(fs.readFileSync(arFile, 'utf8'));

enData["mobile.webview.title"] = "SCCT Web View";
enData["mobile.webview.back"] = "Back";
enData["mobile.webview.forward"] = "Forward";
enData["mobile.webview.reload"] = "Reload";
enData["mobile.scan.themeToggle"] = "Toggle theme";
enData["mobile.scan.language"] = "Language";

arData["mobile.webview.title"] = "عرض SCCT";
arData["mobile.webview.back"] = "السابق";
arData["mobile.webview.forward"] = "التالي";
arData["mobile.webview.reload"] = "إعادة تحميل";
arData["mobile.scan.themeToggle"] = "تبديل المظهر";
arData["mobile.scan.language"] = "اللغة";

fs.writeFileSync(enFile, JSON.stringify(enData, null, 2));
fs.writeFileSync(arFile, JSON.stringify(arData, null, 2));
