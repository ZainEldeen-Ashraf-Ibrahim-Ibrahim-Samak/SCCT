import "package:flutter/material.dart";

import "../presentation/screens/webview_screen.dart";

class AppRouter {
  const AppRouter._();

  static Route<dynamic> toWebview(Uri url) {
    return MaterialPageRoute<void>(
      builder: (_) => WebviewScreen(initialUrl: url),
    );
  }
}
