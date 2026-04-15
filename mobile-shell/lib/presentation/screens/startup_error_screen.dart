import "package:flutter/material.dart";

import "../../config/brand_config.dart";

class StartupErrorScreen extends StatelessWidget {
  const StartupErrorScreen({super.key, required this.errorCode});

  final String errorCode;

  String _message(BuildContext context) {
    final isArabic = Localizations.localeOf(context).languageCode.toLowerCase() == "ar";
    final map = {
      "config_missing": isArabic
          ? "بعض إعدادات التشغيل المطلوبة مفقودة."
          : "Some required configuration values are missing.",
      "config_invalid_url": isArabic
          ? "رابط التشغيل الأساسي غير صالح."
          : "The base startup URL is invalid.",
      "config_invalid_hosts": isArabic
          ? "قائمة النطاقات المسموح بها غير صالحة."
          : "Allowed hosts configuration is invalid.",
      "config_invalid_locale": isArabic
          ? "إعدادات اللغة غير صالحة."
          : "Locale configuration is invalid.",
      "config_invalid_numeric_range": isArabic
          ? "قيم إعدادات التشغيل خارج النطاق المسموح."
          : "Startup numeric configuration is out of range.",
    };

    return map[errorCode] ??
        (isArabic
            ? "حدث خطأ في إعدادات التشغيل."
            : "Startup configuration error occurred.");
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text(BrandConfig.siteName)),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                _message(context),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 8),
              Text(
                "($errorCode)",
                style: const TextStyle(color: Colors.grey),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
