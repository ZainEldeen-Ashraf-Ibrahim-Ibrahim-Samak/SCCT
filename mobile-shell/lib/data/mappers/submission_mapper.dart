import "../../domain/entities/contact_record.dart";
import "../../domain/entities/field_response.dart";
import "../../domain/entities/submission_session.dart";

class SubmissionMapper {
  const SubmissionMapper();

  SubmissionSession mapSession({
    required String token,
    required String localeCode,
    required bool isOnline,
    required Map<String, dynamic> data,
  }) {
    final isNew = data["isNew"] == true;
    final formTemplate = data["formTemplate"] as Map<String, dynamic>? ?? const <String, dynamic>{};
    final submission = data["submission"] as Map<String, dynamic>?;
    final fieldsRaw = data["fields"] as List<dynamic>? ?? const <dynamic>[];
    final valuesRaw = data["values"] as List<dynamic>? ?? const <dynamic>[];

    final fields = fieldsRaw
        .whereType<Map<String, dynamic>>()
        .map(_mapField)
        .toList(growable: false);

    final responseByField = <String, FieldResponse>{
      for (final value in valuesRaw.whereType<Map<String, dynamic>>())
        (value["fieldDefinitionId"] ?? "").toString(): _mapFieldResponse(value),
    };

    final initialResponses = fields
        .map(
          (field) => responseByField[field.id] ??
              FieldResponse(fieldDefinitionId: field.id),
        )
        .toList(growable: false);

    final contactsRaw = (submission?["contactRecords"] ?? formTemplate["contactRecords"]) as List<dynamic>? ?? const <dynamic>[];
    final contacts = contactsRaw
        .whereType<Map<String, dynamic>>()
        .map(ContactRecord.fromJson)
        .toList(growable: false);

    final safeContacts = contacts.isEmpty
        ? <ContactRecord>[ContactRecord(id: "contact_primary", name: "")]
        : contacts;

    return SubmissionSession(
      token: token,
      submissionId: submission?["id"]?.toString(),
      formTemplateId: (formTemplate["id"] ?? "").toString(),
      formName: (formTemplate["name"] ?? "").toString(),
      clientName: (submission?["clientName"] ?? "").toString(),
      clientContact: (submission?["clientContact"] ?? "").toString(),
      mode: _mapMode(isNew: isNew, status: submission?["status"]?.toString()),
      formVersion: (data["formVersion"] ?? "0").toString(),
      submissionUpdatedAt: submission?["updatedAt"]?.toString(),
      localeCode: localeCode,
      isOnline: isOnline,
      fields: fields,
      contacts: safeContacts,
      fieldResponses: initialResponses,
    );
  }

  SubmissionFieldDefinition _mapField(Map<String, dynamic> json) {
    final validation = json["validationRules"] as Map<String, dynamic>? ?? const <String, dynamic>{};

    return SubmissionFieldDefinition(
      id: (json["id"] ?? "").toString(),
      nameEn: (json["nameEn"] ?? "").toString(),
      nameAr: (json["nameAr"] ?? "").toString(),
      inputType: _mapInputType((json["inputType"] ?? "text").toString()),
      isMultiple: json["isMultiple"] == true,
      validation: SubmissionFieldValidation(
        required: validation["required"] == true,
        regexType: _mapRegexType(validation["regexType"]?.toString()),
      ),
      dropdownOptionsEn: (json["dropdownOptionsEn"] as List<dynamic>? ?? const <dynamic>[])
          .map((item) => item.toString())
          .toList(growable: false),
      dropdownOptionsAr: (json["dropdownOptionsAr"] as List<dynamic>? ?? const <dynamic>[])
          .map((item) => item.toString())
          .toList(growable: false),
    );
  }

  FieldResponse _mapFieldResponse(Map<String, dynamic> json) {
    final rawItems = json["mediaItems"] as List<dynamic>? ?? const <dynamic>[];
    final mediaItems = rawItems
        .whereType<Map<String, dynamic>>()
        .map(MediaReference.fromJson)
        .toList(growable: false);

    return FieldResponse(
      fieldDefinitionId: (json["fieldDefinitionId"] ?? "").toString(),
      value: json["value"],
      mediaUrl: json["mediaUrl"]?.toString(),
      mediaPublicId: json["mediaPublicId"]?.toString(),
      mediaItems: mediaItems,
    );
  }

  SubmissionMode _mapMode({required bool isNew, required String? status}) {
    if (isNew) {
      return SubmissionMode.newSubmission;
    }

    switch ((status ?? "").toLowerCase()) {
      case "draft":
        return SubmissionMode.draft;
      case "needs_rewrite":
        return SubmissionMode.needsRewrite;
      default:
        return SubmissionMode.readOnly;
    }
  }

  SubmissionFieldType _mapInputType(String raw) {
    switch (raw) {
      case "number":
        return SubmissionFieldType.number;
      case "image":
        return SubmissionFieldType.image;
      case "file":
        return SubmissionFieldType.file;
      case "date":
        return SubmissionFieldType.date;
      case "dropdown":
        return SubmissionFieldType.dropdown;
      case "text":
      default:
        return SubmissionFieldType.text;
    }
  }

  SubmissionRegexType? _mapRegexType(String? raw) {
    switch ((raw ?? "").toLowerCase()) {
      case "email":
        return SubmissionRegexType.email;
      case "phone":
        return SubmissionRegexType.phone;
      case "name":
        return SubmissionRegexType.name;
      default:
        return null;
    }
  }
}
