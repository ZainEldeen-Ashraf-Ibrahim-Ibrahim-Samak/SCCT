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

  @override
  void initState() {
    super.initState();
    _controller = WebViewController()..loadRequest(widget.initialUrl);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text("SCCT Webview")),
      body: WebViewWidget(controller: _controller),
    );
  }
}
