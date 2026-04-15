import "package:flutter/material.dart";
import "package:webview_flutter/webview_flutter.dart";

class WebviewScreen extends StatefulWidget {
  const WebviewScreen({super.key, required this.initialUrl});

  final Uri initialUrl;

  @override
  State<WebviewScreen> createState() => _WebviewScreenState();
}

class _WebviewScreenState extends State<WebviewScreen> {
  late final WebViewController _controller;
  double _loadingProgress = 0;

  @override
  void initState() {
    super.initState();
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(const Color(0x00000000))
      ..setNavigationDelegate(
        NavigationDelegate(
          onProgress: (progress) {
            if (!mounted) return;
            setState(() {
              _loadingProgress = progress / 100;
            });
          },
        ),
      )
      ..loadRequest(widget.initialUrl);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text("SCCT Webview")),
      body: Stack(
        children: [
          WebViewWidget(controller: _controller),
          if (_loadingProgress < 1)
            LinearProgressIndicator(value: _loadingProgress == 0 ? null : _loadingProgress),
        ],
      ),
    );
  }
}
