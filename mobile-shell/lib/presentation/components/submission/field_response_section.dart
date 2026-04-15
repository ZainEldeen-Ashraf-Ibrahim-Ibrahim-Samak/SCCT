import "package:flutter/material.dart";
import "package:flutter/services.dart";

import "../../../domain/constants/message_keys.dart";
import "../../../domain/entities/field_response.dart";
import "../../../domain/entities/submission_session.dart";
import "media_upload_section.dart";

class FieldResponseSection extends StatelessWidget {
  const FieldResponseSection({
    super.key,
    required this.fields,
    required this.responsesByFieldId,
    required this.fieldErrorTextById,
    required this.enabled,
    required this.localeCode,
    required this.onValueChanged,
    required this.onUploadMedia,
    required this.onClearMedia,
    required this.isFieldUploading,
    required this.t,
  });

  final List<SubmissionFieldDefinition> fields;
  final Map<String, FieldResponse> responsesByFieldId;
  final Map<String, String> fieldErrorTextById;
  final bool enabled;
  final String localeCode;
  final void Function(String fieldId, Object? value) onValueChanged;
  final Future<void> Function(String fieldId, String filePath) onUploadMedia;
  final ValueChanged<String> onClearMedia;
  final bool Function(String fieldId) isFieldUploading;
  final String Function(String key) t;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        ...fields.map((field) {
          final response = responsesByFieldId[field.id] ??
              FieldResponse(fieldDefinitionId: field.id);
          final errorText = fieldErrorTextById[field.id];

          return Card(
            margin: const EdgeInsets.only(bottom: 10),
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildFieldLabel(context, field),
                  const SizedBox(height: 8),
                  _buildFieldInput(
                    context: context,
                    field: field,
                    response: response,
                    enabled: enabled,
                  ),
                  if (errorText != null)
                    Padding(
                      padding: const EdgeInsets.only(top: 8),
                      child: Text(
                        errorText,
                        style: TextStyle(
                          color: Theme.of(context).colorScheme.error,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                ],
              ),
            ),
          );
        }),
      ],
    );
  }

  Widget _buildFieldInput({
    required BuildContext context,
    required SubmissionFieldDefinition field,
    required FieldResponse response,
    required bool enabled,
  }) {
    switch (field.inputType) {
      case SubmissionFieldType.text:
      case SubmissionFieldType.number:
      case SubmissionFieldType.date:
        final rawValue = response.value?.toString() ?? "";

        if (field.inputType == SubmissionFieldType.date) {
          return TextFormField(
            key: ValueKey("field_${field.id}_$rawValue"),
            enabled: enabled,
            readOnly: true,
            initialValue: rawValue,
            onTap: !enabled
                ? null
                : () async {
                    final now = DateTime.now();
                    final parsed = _parseDate(rawValue);
                    final picked = await showDatePicker(
                      context: context,
                      initialDate: parsed ?? now,
                      firstDate: DateTime(now.year - 50),
                      lastDate: DateTime(now.year + 50),
                    );
                    if (picked != null) {
                      onValueChanged(field.id, _formatDate(picked));
                    }
                  },
            decoration: _inputDecoration(
              hintText: field.validation.required
                  ? t(MessageKeys.commonRequired)
                  : t(MessageKeys.commonOptional),
              suffixIcon: const Icon(Icons.calendar_today_rounded, size: 18),
            ),
          );
        }

        if (field.inputType == SubmissionFieldType.number) {
          return TextFormField(
            key: ValueKey("field_${field.id}_$rawValue"),
            enabled: enabled,
            initialValue: rawValue,
            keyboardType: TextInputType.number,
            inputFormatters: <TextInputFormatter>[
              FilteringTextInputFormatter.digitsOnly,
            ],
            onChanged: (value) {
              onValueChanged(
                  field.id, value.trim().isEmpty ? null : value.trim());
            },
            decoration: _inputDecoration(
              hintText: "0",
            ),
          );
        }

        final useMultiLine = field.validation.maxLength == null ||
            (field.validation.maxLength ?? 0) > 100;

        return TextFormField(
          key: ValueKey("field_${field.id}_$rawValue"),
          enabled: enabled,
          initialValue: rawValue,
          keyboardType: TextInputType.text,
          minLines: useMultiLine ? 3 : 1,
          maxLines: useMultiLine ? 5 : 1,
          maxLength: field.validation.maxLength,
          onChanged: (value) {
            onValueChanged(field.id, value);
          },
          decoration: _inputDecoration(
            hintText: field.validation.required
                ? t(MessageKeys.commonRequired)
                : t(MessageKeys.commonOptional),
          ),
        );
      case SubmissionFieldType.dropdown:
        return field.isMultiple
            ? _buildMultiDropdown(field, response, enabled)
            : _buildSingleDropdown(field, response, enabled);
      case SubmissionFieldType.image:
      case SubmissionFieldType.file:
        return MediaUploadSection(
          fieldId: field.id,
          response: response,
          requiredMedia: field.validation.required,
          enabled: enabled,
          isUploading: isFieldUploading(field.id),
          onUpload: onUploadMedia,
          onClear: onClearMedia,
          t: t,
        );
    }
  }

  Widget _buildSingleDropdown(
    SubmissionFieldDefinition field,
    FieldResponse response,
    bool enabled,
  ) {
    final options =
        localeCode == "ar" ? field.dropdownOptionsAr : field.dropdownOptionsEn;
    final selected = response.value?.toString();
    final normalizedSelected = options.contains(selected) ? selected : null;

    return DropdownButtonFormField<String>(
      value: normalizedSelected,
      items: options
          .map(
            (option) => DropdownMenuItem<String>(
              value: option,
              child: Text(option),
            ),
          )
          .toList(growable: false),
      onChanged: enabled ? (value) => onValueChanged(field.id, value) : null,
      decoration: _inputDecoration(
        hintText: field.validation.required
            ? t(MessageKeys.commonRequired)
            : t(MessageKeys.commonOptional),
      ),
    );
  }

  Widget _buildMultiDropdown(
    SubmissionFieldDefinition field,
    FieldResponse response,
    bool enabled,
  ) {
    final options =
        localeCode == "ar" ? field.dropdownOptionsAr : field.dropdownOptionsEn;
    final selected = (response.value is List<dynamic>)
        ? (response.value as List<dynamic>)
            .map((item) => item.toString())
            .toSet()
        : <String>{};

    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: options.map((option) {
        final isSelected = selected.contains(option);
        return FilterChip(
          selected: isSelected,
          label: Text(option),
          onSelected: !enabled
              ? null
              : (value) {
                  final next = <String>{...selected};
                  if (value) {
                    next.add(option);
                  } else {
                    next.remove(option);
                  }
                  onValueChanged(field.id, next.toList(growable: false));
                },
        );
      }).toList(growable: false),
    );
  }

  Widget _buildFieldLabel(
    BuildContext context,
    SubmissionFieldDefinition field,
  ) {
    return Row(
      children: [
        Expanded(
          child: Text(
            field.labelForLocale(localeCode),
            style: Theme.of(context).textTheme.titleSmall,
          ),
        ),
        if (field.validation.required)
          Text(
            "*",
            style: TextStyle(
              color: Theme.of(context).colorScheme.error,
              fontWeight: FontWeight.w700,
            ),
          ),
      ],
    );
  }

  InputDecoration _inputDecoration({
    required String hintText,
    Widget? suffixIcon,
  }) {
    return InputDecoration(
      hintText: hintText,
      suffixIcon: suffixIcon,
      border: const OutlineInputBorder(),
      enabledBorder: const OutlineInputBorder(),
      focusedBorder: const OutlineInputBorder(),
      contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
    );
  }

  DateTime? _parseDate(String value) {
    if (value.trim().isEmpty) {
      return null;
    }

    return DateTime.tryParse(value.trim());
  }

  String _formatDate(DateTime date) {
    final month = date.month.toString().padLeft(2, "0");
    final day = date.day.toString().padLeft(2, "0");
    return "${date.year}-$month-$day";
  }
}
