import "package:flutter/material.dart";
import "package:flutter_test/flutter_test.dart";
import "package:scct_mobile_shell/domain/entities/contact_record.dart";
import "package:scct_mobile_shell/presentation/components/submission/contact_records_section.dart";

void main() {
  testWidgets("ContactRecordsSection shows validation error text", (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: ContactRecordsSection(
            contacts: const <ContactRecord>[
              ContactRecord(id: "c1", name: "Primary"),
            ],
            enabled: true,
            errorText: "validation-error",
            t: (key) => key,
            onAddContact: () {},
            onRemoveContact: (_) {},
            onContactChanged: (_, __, ___) {},
          ),
        ),
      ),
    );

    expect(find.text("validation-error"), findsOneWidget);
  });
}
