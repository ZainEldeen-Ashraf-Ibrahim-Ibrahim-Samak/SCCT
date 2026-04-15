enum MediaUploadStatus {
  pending,
  uploading,
  uploaded,
  failed,
}

class MediaUploadItem {
  const MediaUploadItem({
    required this.fieldDefinitionId,
    required this.localUri,
    required this.status,
    required this.required,
    this.uploadedUrl,
    this.uploadedPublicId,
    this.lastError,
  });

  final String fieldDefinitionId;
  final String localUri;
  final MediaUploadStatus status;
  final String? uploadedUrl;
  final String? uploadedPublicId;
  final bool required;
  final String? lastError;

  bool get isBlockingRequiredUpload {
    if (!required) return false;
    return status == MediaUploadStatus.pending ||
        status == MediaUploadStatus.uploading ||
        status == MediaUploadStatus.failed;
  }

  MediaUploadItem copyWith({
    String? fieldDefinitionId,
    String? localUri,
    MediaUploadStatus? status,
    String? uploadedUrl,
    String? uploadedPublicId,
    bool? required,
    String? lastError,
  }) {
    return MediaUploadItem(
      fieldDefinitionId: fieldDefinitionId ?? this.fieldDefinitionId,
      localUri: localUri ?? this.localUri,
      status: status ?? this.status,
      uploadedUrl: uploadedUrl ?? this.uploadedUrl,
      uploadedPublicId: uploadedPublicId ?? this.uploadedPublicId,
      required: required ?? this.required,
      lastError: lastError ?? this.lastError,
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      "fieldDefinitionId": fieldDefinitionId,
      "localUri": localUri,
      "status": status.name,
      "uploadedUrl": uploadedUrl,
      "uploadedPublicId": uploadedPublicId,
      "required": required,
      "lastError": lastError,
    };
  }

  factory MediaUploadItem.fromJson(Map<String, dynamic> json) {
    final rawStatus = (json["status"] ?? "pending").toString();
    final status = MediaUploadStatus.values.firstWhere(
      (value) => value.name == rawStatus,
      orElse: () => MediaUploadStatus.pending,
    );

    return MediaUploadItem(
      fieldDefinitionId: (json["fieldDefinitionId"] ?? "").toString(),
      localUri: (json["localUri"] ?? "").toString(),
      status: status,
      uploadedUrl: json["uploadedUrl"]?.toString(),
      uploadedPublicId: json["uploadedPublicId"]?.toString(),
      required: json["required"] == true,
      lastError: json["lastError"]?.toString(),
    );
  }
}
