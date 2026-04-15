enum ValidationStatus { pending, accepted, rejected }

enum QrFailureCode { invalidFormat, nonHttps, disallowedHost, blockedPath }

class QrScanPayload {
  const QrScanPayload({
    required this.rawValue,
    required this.validationStatus,
    required this.scannedAt,
    this.normalizedUrl,
    this.scheme,
    this.host,
    this.failureCode,
  });

  final String rawValue;
  final String? normalizedUrl;
  final String? scheme;
  final String? host;
  final ValidationStatus validationStatus;
  final QrFailureCode? failureCode;
  final DateTime scannedAt;
}
