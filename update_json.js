const fs = require('fs');

const enFile = 'mobile-shell/assets/i18n/en.json';
const arFile = 'mobile-shell/assets/i18n/ar.json';

const enData = JSON.parse(fs.readFileSync(enFile, 'utf8'));
const arData = JSON.parse(fs.readFileSync(arFile, 'utf8'));

const enMessages = {
  // from scan_screen.dart
  "mobile.home.title": "Smart QR Scanner",
  "mobile.home.subtitle": "Validate SCCT links quickly and open them safely.",
  "mobile.scan.secure": "Secure validation enabled",
  "mobile.scan.manual": "Manual link input",
  "mobile.scan.quickActions": "Quick actions",
  "mobile.scan.dragHint": "Tip: drag an image file into the drop area.",
  "mobile.scan.photoPreview": "Photo preview",
  "mobile.scan.invalid": "The scanned QR code is invalid.",
  "mobile.scan.disallowed": "This destination is not allowed.",
  "mobile.scan.blocked": "This destination path is blocked.",
  "mobile.scan.camera_denied": "Camera permission is required.",
  "mobile.scan.offline": "You are offline. Check your connection.",
  "mobile.scan.prompt": "Scan SCCT QR code",
  "mobile.scan.open": "Validate and open",
  "mobile.scan.choosePhoto": "Choose from photo library",
  "mobile.scan.clearPhoto": "Clear selected photo",
  "mobile.scan.openCamera": "Open camera scanner",
  "mobile.scan.alignCode": "Place the QR code inside the frame",
  "mobile.scan.cameraHint": "Point the camera at a QR code",
  "mobile.scan.themeToggle": "Toggle theme",
  "mobile.scan.language": "Language",
  "mobile.scan.dropPhoto": "Drag and drop a photo here",
  "mobile.scan.selectedPhoto": "Selected photo",
  "mobile.scan.noPhoto": "No photo selected",
  "mobile.scan.decoding": "Decoding QR from image...",
  "mobile.scan.noQrInPhoto": "No QR code found in this photo.",
  "mobile.scan.errorTitle": "Scan issue",
  // from splash_screen.dart
  "mobile.splash.title": "SCCT DAMAGES",
  "mobile.splash.subtitle": "Preparing secure scanner experience...",
  // from startup_error_screen.dart
  "mobile.startup.title": "Setup incomplete",
  "mobile.startup.subtitle": "Could not verify app configuration.",
  "mobile.startup.retry": "Retry setup",
  "mobile.startup.contactAdmin": "Contact administrator if the problem persists.",
  "mobile.startup.config_missing": "Some required configuration values are missing.",
  "mobile.startup.config_invalid": "Configuration values are invalid.",
  "mobile.startup.recovery": "Please check the app configuration and restart.",
  "mobile.startup.unknown": "An unknown error occurred during startup.",
  // from webview_screen.dart
  "mobile.webview.close": "Close browser",
  "mobile.webview.back": "Go back",
  "mobile.webview.forward": "Go forward",
  "mobile.webview.refresh": "Refresh page"
};

const arMessages = {
  // from scan_screen.dart
  "mobile.home.title": "ماسح QR الذكي",
  "mobile.home.subtitle": "تحقق من روابط SCCT بسرعة وافتحها بأمان.",
  "mobile.scan.secure": "التحقق الآمن مفعل",
  "mobile.scan.manual": "إدخال الرابط يدويًا",
  "mobile.scan.quickActions": "إجراءات سريعة",
  "mobile.scan.dragHint": "معلومة: يمكنك سحب ملف صورة وإفلاته في منطقة الإسقاط.",
  "mobile.scan.photoPreview": "معاينة الصورة",
  "mobile.scan.invalid": "رمز QR غير صالح.",
  "mobile.scan.disallowed": "هذا الرابط غير مسموح.",
  "mobile.scan.blocked": "مسار الرابط محظور.",
  "mobile.scan.camera_denied": "إذن الكاميرا مطلوب.",
  "mobile.scan.offline": "لا يوجد اتصال بالإنترنت.",
  "mobile.scan.prompt": "امسح رمز SCCT",
  "mobile.scan.open": "تحقق وافتح",
  "mobile.scan.choosePhoto": "اختر من معرض الصور",
  "mobile.scan.clearPhoto": "إزالة الصورة المختارة",
  "mobile.scan.openCamera": "فتح ماسح الكاميرا",
  "mobile.scan.alignCode": "ضع رمز QR داخل الإطار",
  "mobile.scan.cameraHint": "وجّه الكاميرا نحو رمز QR",
  "mobile.scan.themeToggle": "تبديل المظهر",
  "mobile.scan.language": "اللغة",
  "mobile.scan.dropPhoto": "اسحب وأفلت صورة هنا",
  "mobile.scan.selectedPhoto": "الصورة المختارة",
  "mobile.scan.noPhoto": "لا توجد صورة مختارة",
  "mobile.scan.decoding": "يتم قراءة رمز QR من الصورة...",
  "mobile.scan.noQrInPhoto": "لا يوجد رمز QR في هذه الصورة.",
  "mobile.scan.errorTitle": "مشكلة في المسح",
  // from splash_screen.dart
  "mobile.splash.title": "أعطال SCCT",
  "mobile.splash.subtitle": "جاري تجهيز تجربة المسح الآمنة...",
  // from startup_error_screen.dart
  "mobile.startup.title": "الإعداد غير مكتمل",
  "mobile.startup.subtitle": "تعذر التحقق من تكوين التطبيق.",
  "mobile.startup.retry": "إعادة المحاولة",
  "mobile.startup.contactAdmin": "اتصل بمسؤول النظام إذا استمرت المشكلة.",
  "mobile.startup.config_missing": "بعض إعدادات التكوين المطلوبة مفقودة.",
  "mobile.startup.config_invalid": "إعدادات التكوين غير صالحة.",
  "mobile.startup.recovery": "يرجى التحقق من إعدادات التطبيق وإعادة التشغيل.",
  "mobile.startup.unknown": "حدث خطأ غير معروف أثناء بدء التشغيل.",
  // from webview_screen.dart
  "mobile.webview.close": "إغلاق المتصفح",
  "mobile.webview.back": "للخلف",
  "mobile.webview.forward": "للأمام",
  "mobile.webview.refresh": "تحديث الصفحة"
};

Object.assign(enData, enMessages);
Object.assign(arData, arMessages);

fs.writeFileSync(enFile, JSON.stringify(enData, null, 2));
fs.writeFileSync(arFile, JSON.stringify(arData, null, 2));
