import "package:flutter/material.dart";

import "../../config/brand_config.dart";
import "../../i18n/index.dart";
import "../components/app_logo.dart";

class StartupErrorScreen extends StatelessWidget {
  const StartupErrorScreen({
    super.key,
    required this.errorCode,
    this.onToggleTheme,
    this.onLocaleSelected,
    this.onRetry,
  });

  final String errorCode;
  final VoidCallback? onToggleTheme;
  final ValueChanged<String>? onLocaleSelected;
  final VoidCallback? onRetry;

  String _localeCode(BuildContext context) {
    final code = Localizations.localeOf(context).languageCode.toLowerCase();
    return code == "ar" ? "ar" : "en";
  }

  String _t(BuildContext context, String key) {
    final locale = _localeCode(context);
    final catalog =
        I18nCatalog.getCached(locale) ?? I18nCatalog.getCached("en");
    return catalog?.t(key) ?? key;
  }

  String _message(BuildContext context) {
    final isArabic = _localeCode(context) == "ar";
    final map = <String, String>{
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
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final localeCode = _localeCode(context);
    final cardColor = isDark ? const Color(0xFF132C44) : Colors.white;
    final cardBorder =
        isDark ? const Color(0xFF2D5676) : const Color(0xFFD0E1F0);
    final textPrimary =
        isDark ? const Color(0xFFE8F2FC) : const Color(0xFF142D43);
    final textSecondary =
        isDark ? const Color(0xFFB7CEE3) : const Color(0xFF5A748D);

    return Scaffold(
      appBar: AppBar(
        titleSpacing: 12,
        backgroundColor:
            isDark ? const Color(0xFF0D2439) : const Color(0xFFE8F3FC),
        elevation: 0,
        scrolledUnderElevation: 0,
        title: Row(
          children: [
            AppLogo(
              size: 28,
              radius: 9,
              backgroundColor:
                  isDark ? const Color(0xFF17344E) : const Color(0xFFDDECF8),
              borderColor:
                  isDark ? const Color(0xFF2D5676) : const Color(0xFFC8DEEF),
            ),
            const SizedBox(width: 8),
            Text(
              BrandConfig.siteName,
              style: TextStyle(
                color: textPrimary,
                fontWeight: FontWeight.w700,
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            tooltip: _t(context, "mobile.scan.themeToggle"),
            onPressed: onToggleTheme,
            icon: Icon(
                isDark ? Icons.light_mode_rounded : Icons.dark_mode_rounded),
            color: textPrimary,
          ),
          PopupMenuButton<String>(
            tooltip: _t(context, "mobile.scan.language"),
            initialValue: localeCode,
            onSelected: onLocaleSelected,
            itemBuilder: (context) => const <PopupMenuEntry<String>>[
              PopupMenuItem<String>(value: "en", child: Text("EN")),
              PopupMenuItem<String>(value: "ar", child: Text("AR")),
            ],
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 12),
              child: Center(
                child: Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                  decoration: BoxDecoration(
                    color: isDark
                        ? const Color(0xFF17344E)
                        : const Color(0xFFDDECF8),
                    borderRadius: BorderRadius.circular(999),
                  ),
                  child: Text(
                    localeCode.toUpperCase(),
                    style: TextStyle(
                      color: textPrimary,
                      fontWeight: FontWeight.w700,
                      fontSize: 12,
                    ),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [
              isDark ? const Color(0xFF091A2B) : const Color(0xFFF1F7FD),
              isDark ? const Color(0xFF143554) : const Color(0xFFE0EDF8),
            ],
          ),
        ),
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(18),
            child: Container(
              constraints: const BoxConstraints(maxWidth: 420),
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: cardColor,
                borderRadius: BorderRadius.circular(22),
                border: Border.all(color: cardBorder),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: isDark ? 0.22 : 0.08),
                    blurRadius: 16,
                    offset: const Offset(0, 8),
                  ),
                ],
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    width: 64,
                    height: 64,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: isDark
                          ? const Color(0xFF4C2B30)
                          : const Color(0xFFFCEBED),
                    ),
                    child: Icon(
                      Icons.warning_amber_rounded,
                      size: 34,
                      color: isDark
                          ? const Color(0xFFFFB4BA)
                          : const Color(0xFFB23A44),
                    ),
                  ),
                  const SizedBox(height: 14),
                  Text(
                    _t(context, "mobile.startupError.title"),
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      color: textPrimary,
                      fontWeight: FontWeight.w800,
                      fontSize: 19,
                    ),
                  ),
                  const SizedBox(height: 10),
                  Text(
                    _message(context),
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      color: textSecondary,
                      height: 1.35,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    decoration: BoxDecoration(
                      color: isDark
                          ? const Color(0xFF1C3C58)
                          : const Color(0xFFE9F3FC),
                      borderRadius: BorderRadius.circular(999),
                    ),
                    child: Text(
                      "${_t(context, "mobile.startupError.code")}: $errorCode",
                      style: TextStyle(
                        color: textPrimary,
                        fontWeight: FontWeight.w700,
                        fontSize: 12,
                      ),
                    ),
                  ),
                  if (onRetry != null) ...[
                    const SizedBox(height: 14),
                    FilledButton.icon(
                      onPressed: onRetry,
                      icon: const Icon(Icons.refresh_rounded),
                      label: Text(_t(context, "mobile.startupError.retry")),
                    ),
                  ],
                  const SizedBox(height: 10),
                  Text(
                    _t(context, "mobile.startupError.help"),
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      color: textSecondary,
                      fontSize: 12,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
