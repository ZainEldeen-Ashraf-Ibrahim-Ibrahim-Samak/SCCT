import "package:flutter/material.dart";

class ScanErrorSheet extends StatelessWidget {
  const ScanErrorSheet({super.key, required this.message});

  final String message;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: const BoxDecoration(
        color: Color(0xFFFFF1F1),
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      child: Text(
        message,
        style: const TextStyle(color: Color(0xFF8A1A1A)),
      ),
    );
  }
}
