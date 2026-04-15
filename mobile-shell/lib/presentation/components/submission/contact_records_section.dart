import "package:flutter/material.dart";

import "../../../domain/constants/message_keys.dart";
import "../../../domain/entities/contact_record.dart";

typedef ContactFieldChanged = void Function(String contactId, String fieldKey, String value);

class ContactRecordsSection extends StatelessWidget {
  const ContactRecordsSection({
    super.key,
    required this.contacts,
    required this.enabled,
    required this.onContactChanged,
    required this.onAddContact,
    required this.onRemoveContact,
    this.errorText,
    required this.t,
  });

  final List<ContactRecord> contacts;
  final bool enabled;
  final ContactFieldChanged onContactChanged;
  final VoidCallback onAddContact;
  final ValueChanged<String> onRemoveContact;
  final String? errorText;
  final String Function(String key) t;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Expanded(
              child: Text(
                t("mobile.submission.section.contact"),
                style: Theme.of(context).textTheme.titleMedium,
              ),
            ),
            FilledButton.tonalIcon(
              onPressed: enabled ? onAddContact : null,
              icon: const Icon(Icons.add_rounded),
              label: Text(t(MessageKeys.submissionContactAdd)),
            ),
          ],
        ),
        const SizedBox(height: 8),
        if (errorText != null)
          Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: Text(
              errorText!,
              style: TextStyle(
                color: Theme.of(context).colorScheme.error,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ...contacts.map((contact) {
          return Card(
            margin: const EdgeInsets.only(bottom: 10),
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          contact.name.trim().isEmpty
                              ? t(MessageKeys.submissionContactDefaultTitle)
                              : contact.name,
                          style: Theme.of(context).textTheme.titleSmall,
                        ),
                      ),
                      if (contacts.length > 1)
                        IconButton(
                          onPressed: enabled ? () => onRemoveContact(contact.id) : null,
                          icon: const Icon(Icons.delete_outline_rounded),
                        ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  TextFormField(
                    key: ValueKey("name_${contact.id}"),
                    enabled: enabled,
                    initialValue: contact.name,
                    decoration: InputDecoration(
                      labelText: t(MessageKeys.submissionContactName),
                    ),
                    onChanged: (value) => onContactChanged(contact.id, "name", value),
                  ),
                  const SizedBox(height: 8),
                  TextFormField(
                    key: ValueKey("email_${contact.id}"),
                    enabled: enabled,
                    initialValue: contact.email ?? "",
                    keyboardType: TextInputType.emailAddress,
                    decoration: InputDecoration(
                      labelText: t(MessageKeys.submissionContactEmail),
                    ),
                    onChanged: (value) => onContactChanged(contact.id, "email", value),
                  ),
                  const SizedBox(height: 8),
                  TextFormField(
                    key: ValueKey("phone_${contact.id}"),
                    enabled: enabled,
                    keyboardType: TextInputType.phone,
                    initialValue: contact.phone ?? "",
                    decoration: InputDecoration(
                      labelText: t(MessageKeys.submissionContactPhone),
                    ),
                    onChanged: (value) => onContactChanged(contact.id, "phone", value),
                  ),
                  const SizedBox(height: 8),
                  TextFormField(
                    key: ValueKey("address_${contact.id}"),
                    enabled: enabled,
                    initialValue: contact.contact ?? "",
                    decoration: InputDecoration(
                      labelText: t(MessageKeys.submissionContactAddress),
                    ),
                    onChanged: (value) => onContactChanged(contact.id, "contact", value),
                  ),
                ],
              ),
            ),
          );
        }),
      ],
    );
  }
}
