import "dart:io";

import "package:flutter/foundation.dart";

import "../domain/entities/mobile_runtime_config.dart";

RuntimeConfigInput loadRuntimeEnv() {
  const appBaseFromDefine = String.fromEnvironment("MOBILE_APP_BASE_URL");
  const allowedHostsFromDefine = String.fromEnvironment("MOBILE_ALLOWED_HOSTS");
  const defaultLocaleFromDefine = String.fromEnvironment("MOBILE_DEFAULT_LOCALE");
  const supportedLocalesFromDefine = String.fromEnvironment("MOBILE_SUPPORTED_LOCALES");
  const splashMsFromDefine = String.fromEnvironment("MOBILE_SPLASH_MIN_DURATION_MS");
  const scanTimeoutFromDefine = String.fromEnvironment("MOBILE_SCAN_TIMEOUT_MS");

  return RuntimeConfigInput(
    mobileAppBaseUrl: _resolveRequiredValue(
      defineValue: appBaseFromDefine,
      envKey: "MOBILE_APP_BASE_URL",
      debugFallback: "https://scct-damages.vercel.app",
    ),
    mobileAllowedHosts: _resolveRequiredValue(
      defineValue: allowedHostsFromDefine,
      envKey: "MOBILE_ALLOWED_HOSTS",
      debugFallback: "scct-damages.vercel.app",
    ),
    mobileDefaultLocale: _resolveRequiredValue(
      defineValue: defaultLocaleFromDefine,
      envKey: "MOBILE_DEFAULT_LOCALE",
      debugFallback: "ar",
    ),
    mobileSupportedLocales: _resolveRequiredValue(
      defineValue: supportedLocalesFromDefine,
      envKey: "MOBILE_SUPPORTED_LOCALES",
      debugFallback: "ar,en",
    ),
    mobileSplashMinDurationMs: _resolveRequiredValue(
      defineValue: splashMsFromDefine,
      envKey: "MOBILE_SPLASH_MIN_DURATION_MS",
      debugFallback: "1200",
    ),
    mobileScanTimeoutMs: _resolveOptionalValue(
      defineValue: scanTimeoutFromDefine,
      envKey: "MOBILE_SCAN_TIMEOUT_MS",
      debugFallback: "10000",
    ),
  );
}

String? _resolveRequiredValue({
  required String defineValue,
  required String envKey,
  required String debugFallback,
}) {
  final fromDefine = defineValue.trim();
  if (fromDefine.isNotEmpty) {
    return fromDefine;
  }

  final fromEnv = Platform.environment[envKey]?.trim();
  if (fromEnv != null && fromEnv.isNotEmpty) {
    return fromEnv;
  }

  if (!kReleaseMode) {
    return debugFallback;
  }

  return null;
}

String? _resolveOptionalValue({
  required String defineValue,
  required String envKey,
  String? debugFallback,
}) {
  final fromDefine = defineValue.trim();
  if (fromDefine.isNotEmpty) {
    return fromDefine;
  }

  final fromEnv = Platform.environment[envKey]?.trim();
  if (fromEnv != null && fromEnv.isNotEmpty) {
    return fromEnv;
  }

  if (!kReleaseMode) {
    return debugFallback;
  }

  return null;
}
