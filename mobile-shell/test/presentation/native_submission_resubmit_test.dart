import "package:flutter/material.dart";
import "package:flutter_test/flutter_test.dart";
import "package:scct_mobile_shell/domain/entities/field_response.dart";
import "package:scct_mobile_shell/domain/entities/submission_session.dart";
import "package:scct_mobile_shell/presentation/components/submission/field_response_section.dart";

void main() {
  testWidgets("FieldResponseSection hydrates existing values for editable sessions", (tester) async {
    const fields = <SubmissionFieldDefinition>[
      SubmissionFieldDefinition(
        id: "f1",
        nameEn: "Comment",
        nameAr: "تعليق",
        inputType: SubmissionFieldType.text,
        isMultiple: false,
        validation: SubmissionFieldValidation(required: false),
        dropdownOptionsEn: <String>[],
        dropdownOptionsAr: <String>[],
      ),
    ];

    const responses = <String, FieldResponse>{
      "f1": FieldResponse(
        fieldDefinitionId: "f1",
        value: "Existing value",
      ),
    };

    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: FieldResponseSection(
            fields: fields,
            responsesByFieldId: responses,
            fieldErrorTextById: const <String, String>{},
            enabled: true,
            localeCode: "en",
            onValueChanged: (_, __) {},
            onUploadMedia: (_, __) async {},
            onClearMedia: (_) {},
            isFieldUploading: (_) => false,
          ),
        ),
      ),
    );

    expect(find.text("Existing value"), findsOneWidget);
  });
}
