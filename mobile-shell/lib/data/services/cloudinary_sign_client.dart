import "dart:convert";

import "package:http/http.dart" as http;

import "../../domain/entities/field_response.dart";
import "submission_api_client.dart";

class CloudinarySignResponse {
  const CloudinarySignResponse({
    required this.signature,
    required this.timestamp,
    required this.apiKey,
    required this.cloudName,
  });

  final String signature;
  final int timestamp;
  final String apiKey;
  final String cloudName;
}

class CloudinarySignClient {
  CloudinarySignClient({
    required Uri baseUrl,
    required int timeoutMs,
    http.Client? httpClient,
  })  : _baseUrl = baseUrl,
        _timeoutMs = timeoutMs,
        _httpClient = httpClient ?? http.Client();

  final Uri _baseUrl;
  final int _timeoutMs;
  final http.Client _httpClient;

  Future<CloudinarySignResponse> requestSignature({
    String? folder,
    String? eager,
    String? publicId,
  }) async {
    final uri = _baseUrl.resolve("/api/cloudinary/sign");

    final payload = <String, dynamic>{
      "timestamp": DateTime.now().toUtc().millisecondsSinceEpoch ~/ 1000,
      if (folder != null && folder.trim().isNotEmpty) "folder": folder.trim(),
      if (eager != null && eager.trim().isNotEmpty) "eager": eager.trim(),
      if (publicId != null && publicId.trim().isNotEmpty)
        "public_id": publicId.trim(),
    };

    final response = await _httpClient
        .post(
          uri,
          headers: const <String, String>{
            "Content-Type": "application/json",
            "Accept": "application/json",
          },
          body: jsonEncode(payload),
        )
        .timeout(Duration(milliseconds: _timeoutMs));

    final body = _decodeBody(response.body);
    if (response.statusCode < 200 ||
        response.statusCode >= 300 ||
        body["success"] != true) {
      throw SubmissionApiException(
        message:
            (body["error"] ?? "Cloudinary signature request failed").toString(),
        statusCode: response.statusCode,
        code: body["code"]?.toString(),
      );
    }

    final data =
        body["data"] as Map<String, dynamic>? ?? const <String, dynamic>{};

    final cloudName = _firstNonEmptyString(<Object?>[
      data["cloudName"],
      data["cloud_name"],
      data["cloudname"],
    ]);

    final apiKey = _firstNonEmptyString(<Object?>[
      data["apiKey"],
      data["api_key"],
      data["apikey"],
    ]);

    final signatureValue = _firstNonEmptyString(<Object?>[
      data["signature"],
    ]);

    final timestampValue = (data["timestamp"] is int)
        ? data["timestamp"] as int
        : int.tryParse((data["timestamp"] ?? "0").toString()) ?? 0;

    if (signatureValue.isEmpty ||
        cloudName.isEmpty ||
        apiKey.isEmpty ||
        timestampValue <= 0) {
      throw const SubmissionApiException(
        message: "Cloudinary signature response is missing required fields",
        statusCode: 500,
        code: "SIGNATURE_RESPONSE_INVALID",
      );
    }

    return CloudinarySignResponse(
      signature: signatureValue,
      timestamp: timestampValue,
      apiKey: apiKey,
      cloudName: cloudName,
    );
  }

  Future<MediaReference> uploadFile({
    required String filePath,
    required CloudinarySignResponse signature,
    String? folder,
    String? publicId,
  }) async {
    final uploadUri = Uri.parse(
        "https://api.cloudinary.com/v1_1/${signature.cloudName}/auto/upload");

    final request = http.MultipartRequest("POST", uploadUri)
      ..fields["api_key"] = signature.apiKey
      ..fields["timestamp"] = signature.timestamp.toString()
      ..fields["signature"] = signature.signature;

    if (folder != null && folder.trim().isNotEmpty) {
      request.fields["folder"] = folder.trim();
    }

    if (publicId != null && publicId.trim().isNotEmpty) {
      request.fields["public_id"] = publicId.trim();
    }

    request.files.add(await http.MultipartFile.fromPath("file", filePath));

    final streamResponse = await _httpClient
        .send(request)
        .timeout(Duration(milliseconds: _timeoutMs));
    final response = await http.Response.fromStream(streamResponse);
    final body = _decodeBody(response.body);

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw SubmissionApiException(
        message: (body["error"] ?? "Cloudinary upload failed").toString(),
        statusCode: response.statusCode,
        code: body["code"]?.toString(),
      );
    }

    final secureUrl = (body["secure_url"] ?? body["url"] ?? "").toString();
    final returnedPublicId = (body["public_id"] ?? "").toString();

    if (secureUrl.isEmpty || returnedPublicId.isEmpty) {
      throw const SubmissionApiException(
        message: "Cloudinary upload response missing media references",
        statusCode: 500,
        code: "UPLOAD_RESPONSE_INVALID",
      );
    }

    return MediaReference(
      url: secureUrl,
      publicId: returnedPublicId,
    );
  }

  Map<String, dynamic> _decodeBody(String raw) {
    if (raw.trim().isEmpty) {
      return const <String, dynamic>{};
    }

    try {
      final decoded = jsonDecode(raw);
      if (decoded is Map<String, dynamic>) {
        return decoded;
      }
      return const <String, dynamic>{};
    } catch (_) {
      return const <String, dynamic>{};
    }
  }

  String _firstNonEmptyString(List<Object?> values) {
    for (final value in values) {
      final text = (value ?? "").toString().trim();
      if (text.isNotEmpty) {
        return text;
      }
    }

    return "";
  }
}
