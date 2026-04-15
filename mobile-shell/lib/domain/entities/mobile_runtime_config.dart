enum AppLocale { ar, en }

class MobileRuntimeConfig {
  const MobileRuntimeConfig({
    required this.appBaseUrl,
    required this.allowedHosts,
    required this.defaultLocale,
    required this.supportedLocales,
    required this.splashMinDurationMs,
    required this.scanTimeoutMs,
    required this.submissionPathSegment,
    required this.apiTimeoutMs,
    required this.draftAutosaveDebounceMs,
  });

  final Uri appBaseUrl;
  final List<String> allowedHosts;
  final AppLocale defaultLocale;
  final List<AppLocale> supportedLocales;
  final int splashMinDurationMs;
  final int scanTimeoutMs;
  final String submissionPathSegment;
  final int apiTimeoutMs;
  final int draftAutosaveDebounceMs;
}

class RuntimeConfigInput {
  const RuntimeConfigInput({
    this.mobileAppBaseUrl,
    this.mobileAllowedHosts,
    this.mobileDefaultLocale,
    this.mobileSupportedLocales,
    this.mobileSplashMinDurationMs,
    this.mobileScanTimeoutMs,
    this.mobileSubmissionPathSegment,
    this.mobileApiTimeoutMs,
    this.mobileDraftAutosaveDebounceMs,
  });

  final String? mobileAppBaseUrl;
  final String? mobileAllowedHosts;
  final String? mobileDefaultLocale;
  final String? mobileSupportedLocales;
  final String? mobileSplashMinDurationMs;
  final String? mobileScanTimeoutMs;
  final String? mobileSubmissionPathSegment;
  final String? mobileApiTimeoutMs;
  final String? mobileDraftAutosaveDebounceMs;
}
