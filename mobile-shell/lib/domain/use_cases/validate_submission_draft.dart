import "../constants/message_keys.dart";
import "../constants/submission_regex.dart";
import "../entities/contact_record.dart";
import "../entities/field_response.dart";
import "../entities/submission_session.dart";

class SubmissionValidationResult {
  const SubmissionValidationResult({
    required this.fieldErrorKeys,
    this.contactErrorKey,
  });

  final Map<String, String> fieldErrorKeys;
  final String? contactErrorKey;

  bool get isValid => fieldErrorKeys.isEmpty && contactErrorKey == null;
}

class ValidateSubmissionDraftUseCase {
  const ValidateSubmissionDraftUseCase();

  SubmissionValidationResult execute({
    required List<ContactRecord> contacts,
    required List<SubmissionFieldDefinition> fields,
    required Map<String, FieldResponse> responses,
  }) {
    final fieldErrors = <String, String>{};
    String? contactError;

    final meaningfulContacts = contacts.where((contact) => contact.hasAnyMeaningfulValue).toList(growable: false);
    if (meaningfulContacts.isEmpty) {
      contactError = MessageKeys.submissionValidationContactRequired;
    }

    final seenContactSignatures = <String>{};
    for (final contact in meaningfulContacts) {
      final signature = [
        contact.name.trim().toLowerCase(),
        (contact.email ?? "").trim().toLowerCase(),
        (contact.phone ?? "").trim(),
        (contact.contact ?? "").trim().toLowerCase(),
      ].join("|");

      if (signature.replaceAll("|", "").isNotEmpty && !seenContactSignatures.add(signature)) {
        contactError = MessageKeys.submissionValidationContactRequired;
      }

      if (contact.name.trim().isNotEmpty && !nameRegex.hasMatch(contact.name.trim())) {
        contactError = MessageKeys.submissionValidationName;
      }

      final email = (contact.email ?? "").trim();
      if (email.isNotEmpty && !emailRegex.hasMatch(email)) {
        contactError = MessageKeys.submissionValidationEmail;
      }

      final phone = (contact.phone ?? "").trim();
      if (phone.isNotEmpty && !phoneRegex.hasMatch(phone)) {
        contactError = MessageKeys.submissionValidationPhone;
      }

      final contactText = (contact.contact ?? "").trim();
      if (contactText.isNotEmpty && !textRegex.hasMatch(contactText)) {
        contactError = MessageKeys.submissionValidationText;
      }
    }

    for (final field in fields) {
      final response = responses[field.id] ?? FieldResponse(fieldDefinitionId: field.id);
      final value = response.value;

      if (field.validation.required && !response.hasMeaningfulValue) {
        fieldErrors[field.id] = MessageKeys.submissionValidationRequiredField;
        continue;
      }

      if (field.inputType == SubmissionFieldType.dropdown) {
        final allowed = <String>{
          ...field.dropdownOptionsEn.map((v) => v.trim()),
          ...field.dropdownOptionsAr.map((v) => v.trim()),
        };

        if (field.isMultiple) {
          if (value != null && value is! List<dynamic>) {
            fieldErrors[field.id] = MessageKeys.submissionValidationRequiredField;
            continue;
          }

          if (value is List<dynamic>) {
            for (final item in value) {
              final asString = item.toString().trim();
              if (asString.isNotEmpty && !allowed.contains(asString)) {
                fieldErrors[field.id] = MessageKeys.submissionValidationRequiredField;
              }
            }
          }
        } else {
          if (value is List<dynamic>) {
            fieldErrors[field.id] = MessageKeys.submissionValidationRequiredField;
            continue;
          }

          final text = value?.toString().trim() ?? "";
          if (text.isNotEmpty && !allowed.contains(text)) {
            fieldErrors[field.id] = MessageKeys.submissionValidationRequiredField;
          }
        }
      }

      final regexType = field.validation.regexType;
      if (regexType == null) {
        continue;
      }

      final text = value?.toString().trim() ?? "";
      if (text.isEmpty) {
        continue;
      }

      switch (regexType) {
        case SubmissionRegexType.email:
          if (!emailRegex.hasMatch(text)) {
            fieldErrors[field.id] = MessageKeys.submissionValidationEmail;
          }
          break;
        case SubmissionRegexType.phone:
          if (!phoneRegex.hasMatch(text)) {
            fieldErrors[field.id] = MessageKeys.submissionValidationPhone;
          }
          break;
        case SubmissionRegexType.name:
          if (!nameRegex.hasMatch(text)) {
            fieldErrors[field.id] = MessageKeys.submissionValidationName;
          }
          break;
      }
    }

    return SubmissionValidationResult(
      fieldErrorKeys: fieldErrors,
      contactErrorKey: contactError,
    );
  }
}
