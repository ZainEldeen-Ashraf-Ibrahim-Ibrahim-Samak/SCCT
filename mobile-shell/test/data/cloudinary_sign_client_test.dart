import "dart:convert";

import "package:flutter_test/flutter_test.dart";
import "package:http/http.dart" as http;
import "package:http/testing.dart";
import "package:scct_mobile_shell/data/services/cloudinary_sign_client.dart";
import "package:scct_mobile_shell/data/services/submission_api_client.dart";

void main() {
  test("requestSignature accepts legacy cloudname/apikey response keys",
      () async {
    final mockClient = MockClient((request) async {
      expect(request.method, "POST");
      expect(request.url.path, "/api/cloudinary/sign");

      return http.Response(
        jsonEncode(<String, dynamic>{
          "success": true,
          "data": <String, dynamic>{
            "signature": "sig_123",
            "timestamp": 1710000000,
            "cloudname": "demo-cloud",
            "apikey": "api-key-123",
          },
        }),
        200,
        headers: const <String, String>{"content-type": "application/json"},
      );
    });

    final client = CloudinarySignClient(
      baseUrl: Uri.parse("https://example.com"),
      timeoutMs: 5000,
      httpClient: mockClient,
    );

    final result = await client.requestSignature(folder: "scct/submissions");

    expect(result.signature, "sig_123");
    expect(result.timestamp, 1710000000);
    expect(result.cloudName, "demo-cloud");
    expect(result.apiKey, "api-key-123");
  });

  test("requestSignature throws when required signature fields are missing",
      () async {
    final mockClient = MockClient((_) async {
      return http.Response(
        jsonEncode(<String, dynamic>{
          "success": true,
          "data": <String, dynamic>{
            "signature": "",
            "timestamp": 0,
            "cloudname": "",
            "apikey": "",
          },
        }),
        200,
      );
    });

    final client = CloudinarySignClient(
      baseUrl: Uri.parse("https://example.com"),
      timeoutMs: 5000,
      httpClient: mockClient,
    );

    expect(
      () => client.requestSignature(),
      throwsA(
        isA<SubmissionApiException>().having(
          (error) => error.code,
          "code",
          "SIGNATURE_RESPONSE_INVALID",
        ),
      ),
    );
  });
}
