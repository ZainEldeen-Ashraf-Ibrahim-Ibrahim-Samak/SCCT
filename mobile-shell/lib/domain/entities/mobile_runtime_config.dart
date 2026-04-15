enum AppLocale { ar, en }

class MobileRuntimeConfig {
  const MobileRuntimeConfig({
    required this.appBaseUrl,
    required this.allowedHosts,
    required this.defaultLocale,
    required this.supportedLocales,
    required this.splashMinDurationMs,
    required this.scanTimeoutMs,
  });

  final Uri appBaseUrl;
  final List<String> allowedHosts;
  final AppLocale defaultLocale;
  final List<AppLocale> supportedLocales;
  final int splashMinDurationMs;
  final int scanTimeoutMs;
}

class RuntimeConfigInput {
  const RuntimeConfigInput({
    this.mobileAppBaseUrl,
    this.mobileAllowedHosts,
    this.mobileDefaultLocale,
    this.mobileSupportedLocales,
    this.mobileSplashMinDurationMs,
    this.mobileScanTimeoutMs,
  });

  final String? mobileAppBaseUrl;
  final String? mobileAllowedHosts;
  final String? mobileDefaultLocale;
  final String? mobileSupportedLocales;
  final String? mobileSplashMinDurationMs;
  final String? mobileScanTimeoutMs;
}
