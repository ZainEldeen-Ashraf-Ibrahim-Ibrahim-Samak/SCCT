import "package:flutter/material.dart";

import "../presentation/screens/webview_screen.dart";

class AppRouter {
  const AppRouter._();

  static Route<dynamic> toWebview(
    Uri url, {
    required ThemeMode themeMode,
    required Locale currentLocale,
    VoidCallback? onToggleTheme,
    ValueChanged<String>? onLocaleSelected,
  }) {
    return MaterialPageRoute<void>(
      builder: (_) => WebviewScreen(
        initialUrl: url,
        themeMode: themeMode,
        currentLocale: currentLocale,
        onToggleTheme: onToggleTheme,
        onLocaleSelected: onLocaleSelected,
      ),
    );
  }
}
