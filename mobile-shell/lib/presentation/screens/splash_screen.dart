import "package:flutter/material.dart";

import "../components/app_logo.dart";

class SplashScreen extends StatelessWidget {
  const SplashScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0F172A),
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: const [
            AppLogo(
              size: 110,
              radius: 20,
              padding: 8,
              backgroundColor: Colors.white,
              borderColor: Color(0xFFCBDCEB),
            ),
            SizedBox(height: 18),
            Text(
              "SCCT DAMAGES",
              style: TextStyle(
                color: Colors.white,
                fontSize: 20,
                fontWeight: FontWeight.w700,
                letterSpacing: 0.4,
              ),
            ),
            SizedBox(height: 14),
            SizedBox(
              width: 20,
              height: 20,
              child: CircularProgressIndicator(
                strokeWidth: 2,
                color: Colors.white,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
