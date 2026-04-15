import "package:flutter/material.dart";
import "package:image_picker/image_picker.dart";

import "../../../domain/constants/message_keys.dart";
import "../../../domain/entities/field_response.dart";

class MediaUploadSection extends StatefulWidget {
  const MediaUploadSection({
    super.key,
    required this.fieldId,
    required this.response,
    required this.requiredMedia,
    required this.enabled,
    required this.isUploading,
    required this.onUpload,
    required this.onClear,
    required this.t,
    this.errorText,
  });

  final String fieldId;
  final FieldResponse response;
  final bool requiredMedia;
  final bool enabled;
  final bool isUploading;
  final Future<void> Function(String fieldId, String filePath) onUpload;
  final ValueChanged<String> onClear;
  final String Function(String key) t;
  final String? errorText;

  @override
  State<MediaUploadSection> createState() => _MediaUploadSectionState();
}

class _MediaUploadSectionState extends State<MediaUploadSection> {
  final ImagePicker _picker = ImagePicker();

  Future<void> _pickAndUpload() async {
    final selected = await _picker.pickImage(source: ImageSource.gallery);
    if (selected == null) {
      return;
    }

    await widget.onUpload(widget.fieldId, selected.path);
  }

  @override
  Widget build(BuildContext context) {
    final mediaUrl = widget.response.mediaUrl;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            FilledButton.tonalIcon(
              onPressed: widget.enabled && !widget.isUploading ? _pickAndUpload : null,
              icon: const Icon(Icons.upload_file_rounded),
              label: Text(
                widget.requiredMedia
                    ? widget.t(MessageKeys.submissionMediaUploadRequired)
                    : widget.t(MessageKeys.submissionMediaUpload),
              ),
            ),
            const SizedBox(width: 8),
            OutlinedButton.icon(
              onPressed: widget.enabled ? () => widget.onClear(widget.fieldId) : null,
              icon: const Icon(Icons.clear_rounded),
              label: Text(widget.t(MessageKeys.submissionMediaClear)),
            ),
          ],
        ),
        if (widget.isUploading)
          const Padding(
            padding: EdgeInsets.only(top: 8),
            child: LinearProgressIndicator(),
          ),
        if (mediaUrl != null && mediaUrl.trim().isNotEmpty)
          Padding(
            padding: const EdgeInsets.only(top: 8),
            child: SelectableText(
              mediaUrl,
              style: Theme.of(context).textTheme.bodySmall,
            ),
          ),
        if (widget.errorText != null)
          Padding(
            padding: const EdgeInsets.only(top: 8),
            child: Text(
              widget.errorText!,
              style: TextStyle(
                color: Theme.of(context).colorScheme.error,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
      ],
    );
  }
}
