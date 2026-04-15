import "dart:convert";

import "package:flutter/services.dart" show rootBundle;

class I18nCatalog {
  I18nCatalog(this._messages);

  final Map<String, dynamic> _messages;

  String t(String key) => (_messages[key] ?? key).toString();

  static Future<I18nCatalog> load(String locale) async {
    final raw = await rootBundle.loadString("assets/i18n/$locale.json");
    final decoded = jsonDecode(raw) as Map<String, dynamic>;
    return I18nCatalog(decoded);
  }
}
