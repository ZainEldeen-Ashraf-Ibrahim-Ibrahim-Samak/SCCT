import "package:flutter/material.dart";
import "package:flutter_localizations/flutter_localizations.dart";

import "app/router.dart";
import "app/startup_coordinator.dart";
import "config/brand_config.dart";
import "domain/entities/mobile_runtime_config.dart";
import "domain/use_cases/evaluate_qr_destination.dart";
import "presentation/screens/scan_screen.dart";
import "presentation/screens/splash_screen.dart";
import "presentation/screens/startup_error_screen.dart";
import "presentation/view_models/scan_view_model.dart";

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const ScctMobileApp());
}

class ScctMobileApp extends StatefulWidget {
  const ScctMobileApp({super.key});

  @override
  State<ScctMobileApp> createState() => _ScctMobileAppState();
}

class _ScctMobileAppState extends State<ScctMobileApp> {
  ThemeMode _themeMode = ThemeMode.light;
  Locale _locale = const Locale("ar");
  bool _appliedStartupLocale = false;
  late final Future<StartupCoordinatorResult> _startupFuture;

  @override
  void initState() {
    super.initState();
    _startupFuture = _loadStartup();
  }

  Future<StartupCoordinatorResult> _loadStartup() async {
    const minSplashDuration = Duration(milliseconds: 1200);
    final startedAt = DateTime.now();
    final result = await startupCoordinator();
    final elapsed = DateTime.now().difference(startedAt);
    if (elapsed < minSplashDuration) {
      await Future<void>.delayed(minSplashDuration - elapsed);
    }
    return result;
  }

  void _toggleTheme() {
    setState(() {
      _themeMode = _themeMode == ThemeMode.dark ? ThemeMode.light : ThemeMode.dark;
    });
  }

  void _setLocale(AppLocale locale) {
    setState(() {
      _locale = Locale(locale == AppLocale.ar ? "ar" : "en");
    });
  }

  void _setLocaleFromCode(String localeCode) {
    _setLocale(localeCode == "ar" ? AppLocale.ar : AppLocale.en);
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: BrandConfig.siteName,
      locale: _locale,
      supportedLocales: const <Locale>[Locale("en"), Locale("ar")],
      localizationsDelegates: const <LocalizationsDelegate<dynamic>>[
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      themeMode: _themeMode,
      theme: ThemeData(
        useMaterial3: true,
        colorSchemeSeed: const Color(0xFF0F172A),
        brightness: Brightness.light,
      ),
      darkTheme: ThemeData(
        useMaterial3: true,
        colorSchemeSeed: const Color(0xFF0F172A),
        brightness: Brightness.dark,
      ),
      home: FutureBuilder(
        future: _startupFuture,
        builder: (context, snapshot) {
          if (!snapshot.hasData) {
            return const SplashScreen();
          }

          final result = snapshot.data!;
          if (!result.ok || result.config == null) {
            return StartupErrorScreen(errorCode: result.errorCode ?? "unknown");
          }

          final configLocale = result.locale;
          if (!_appliedStartupLocale && configLocale != null) {
            final configured = Locale(configLocale == AppLocale.ar ? "ar" : "en");
            if (_locale != configured) {
              WidgetsBinding.instance.addPostFrameCallback((_) {
                if (!mounted) {
                  return;
                }
                setState(() {
                  _locale = configured;
                  _appliedStartupLocale = true;
                });
              });
            } else {
              _appliedStartupLocale = true;
            }
          }

          final scanViewModel = ScanViewModel(
            policy: NavigationPolicy(
              allowedHosts: result.config!.allowedHosts,
              enforceHttps: true,
              allowSubdomains: true,
              blockedPathPrefixes: const <String>["/admin/internal"],
            ),
          );

          return ScanScreen(
            viewModel: scanViewModel,
            themeMode: _themeMode,
            currentLocale: _locale,
            onToggleTheme: _toggleTheme,
            onLocaleSelected: _setLocaleFromCode,
            onAccepted: (uri) {
              Navigator.of(context).push(
                AppRouter.toWebview(
                  uri,
                  themeMode: _themeMode,
                  currentLocale: _locale,
                  onToggleTheme: _toggleTheme,
                  onLocaleSelected: _setLocaleFromCode,
                ),
              );
            },
          );
        },
      ),
    );
  }
}
