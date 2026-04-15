import "package:flutter/material.dart";
import "package:desktop_drop/desktop_drop.dart";
import "package:image_picker/image_picker.dart";
import "package:mobile_scanner/mobile_scanner.dart";
import "dart:typed_data";

import "../../config/brand_config.dart";
import "../view_models/scan_view_model.dart";

class ScanScreen extends StatefulWidget {
  const ScanScreen({
    super.key,
    required this.viewModel,
    required this.onAccepted,
    this.themeMode = ThemeMode.light,
    this.currentLocale = const Locale("en"),
    this.onToggleTheme,
    this.onLocaleSelected,
  });

  final ScanViewModel viewModel;
  final ValueChanged<Uri> onAccepted;
  final ThemeMode themeMode;
  final Locale currentLocale;
  final VoidCallback? onToggleTheme;
  final ValueChanged<String>? onLocaleSelected;

  @override
  State<ScanScreen> createState() => _ScanScreenState();
}

class _ScanScreenState extends State<ScanScreen> {
  final TextEditingController _controller = TextEditingController();
  final ImagePicker _imagePicker = ImagePicker();
  final MobileScannerController _scannerController = MobileScannerController(autoStart: false);
  String? _error;
  XFile? _selectedPhoto;
  Uint8List? _selectedPhotoBytes;
  bool _isDraggingPhoto = false;
  bool _isDecodingPhoto = false;

  static const Map<String, Map<String, String>> _messages = {
    "en": {
      "mobile.scan.invalid": "The scanned QR code is invalid.",
      "mobile.scan.disallowed": "This destination is not allowed.",
      "mobile.scan.blocked": "This destination path is blocked.",
      "mobile.scan.camera_denied": "Camera permission is required.",
      "mobile.scan.offline": "You are offline. Check your connection.",
      "mobile.scan.prompt": "Scan SCCT QR code",
      "mobile.scan.open": "Validate and open",
      "mobile.scan.choosePhoto": "Choose from photo library",
      "mobile.scan.clearPhoto": "Clear selected photo",
      "mobile.scan.openCamera": "Open camera scanner",
      "mobile.scan.cameraHint": "Point the camera at a QR code",
      "mobile.scan.themeToggle": "Toggle theme",
      "mobile.scan.language": "Language",
      "mobile.scan.dropPhoto": "Drag and drop a photo here",
      "mobile.scan.selectedPhoto": "Selected photo",
      "mobile.scan.noPhoto": "No photo selected",
      "mobile.scan.decoding": "Decoding QR from image...",
      "mobile.scan.noQrInPhoto": "No QR code found in this photo.",
    },
    "ar": {
      "mobile.scan.invalid": "رمز QR غير صالح.",
      "mobile.scan.disallowed": "هذا الرابط غير مسموح.",
      "mobile.scan.blocked": "مسار الرابط محظور.",
      "mobile.scan.camera_denied": "إذن الكاميرا مطلوب.",
      "mobile.scan.offline": "لا يوجد اتصال بالإنترنت.",
      "mobile.scan.prompt": "امسح رمز SCCT",
      "mobile.scan.open": "تحقق وافتح",
      "mobile.scan.choosePhoto": "اختر من معرض الصور",
      "mobile.scan.clearPhoto": "إزالة الصورة المختارة",
      "mobile.scan.openCamera": "فتح ماسح الكاميرا",
      "mobile.scan.cameraHint": "وجّه الكاميرا نحو رمز QR",
      "mobile.scan.themeToggle": "تبديل المظهر",
      "mobile.scan.language": "اللغة",
      "mobile.scan.dropPhoto": "اسحب وأفلت صورة هنا",
      "mobile.scan.selectedPhoto": "الصورة المختارة",
      "mobile.scan.noPhoto": "لا توجد صورة مختارة",
      "mobile.scan.decoding": "يتم قراءة رمز QR من الصورة...",
      "mobile.scan.noQrInPhoto": "لا يوجد رمز QR في هذه الصورة.",
    },
  };

  @override
  void dispose() {
    _controller.dispose();
    _scannerController.dispose();
    super.dispose();
  }

  void _submit() {
    final result = widget.viewModel.processScan(_controller.text);
    if (result.acceptedUri != null) {
      setState(() => _error = null);
      widget.onAccepted(result.acceptedUri!);
      return;
    }

    setState(() => _error = result.messageKey ?? "mobile.scan.invalid");
  }

  Future<void> _chooseFromLibrary() async {
    final selected = await _imagePicker.pickImage(source: ImageSource.gallery);
    if (selected == null) {
      return;
    }
    await _setSelectedPhoto(selected);
  }

  Future<void> _handleDroppedPhotos(Iterable<XFile?> files) async {
    final nonNullFiles = files.whereType<XFile>().toList();
    if (nonNullFiles.isEmpty) {
      return;
    }

    final photo = nonNullFiles.firstWhere(
      (file) => _isSupportedImage(file.name),
      orElse: () => nonNullFiles.first,
    );

    await _setSelectedPhoto(photo);
  }

  Future<void> _setSelectedPhoto(XFile photo) async {
    final bytes = await photo.readAsBytes();

    setState(() {
      _selectedPhoto = photo;
      _selectedPhotoBytes = bytes;
      _error = null;
    });

    await _decodeQrFromPhoto(photo);
  }

  void _clearSelectedPhoto() {
    setState(() {
      _selectedPhoto = null;
      _selectedPhotoBytes = null;
      _isDecodingPhoto = false;
      _error = null;
    });
  }

  Future<void> _openCameraScanner() async {
    final cameraController = MobileScannerController(
      autoStart: true,
      facing: CameraFacing.back,
      detectionSpeed: DetectionSpeed.noDuplicates,
      formats: const <BarcodeFormat>[BarcodeFormat.qrCode],
    );

    var handled = false;

    await showModalBottomSheet<void>(
      context: context,
      useSafeArea: true,
      isScrollControlled: true,
      backgroundColor: Colors.black,
      builder: (sheetContext) {
        return SizedBox(
          height: MediaQuery.of(sheetContext).size.height * 0.78,
          child: Stack(
            fit: StackFit.expand,
            children: [
              MobileScanner(
                controller: cameraController,
                onDetect: (capture) {
                  if (handled || !mounted) {
                    return;
                  }

                  final decodedValue = capture.barcodes
                          .map((barcode) => barcode.rawValue?.trim() ?? "")
                          .firstWhere((value) => value.isNotEmpty, orElse: () => "")
                      .trim();

                  if (decodedValue.isEmpty) {
                    return;
                  }

                  handled = true;
                  _controller.text = decodedValue;

                  if (Navigator.of(sheetContext).canPop()) {
                    Navigator.of(sheetContext).pop();
                  }

                  _submit();
                },
              ),
              Positioned(
                top: 12,
                right: 12,
                child: IconButton.filledTonal(
                  onPressed: () {
                    if (Navigator.of(sheetContext).canPop()) {
                      Navigator.of(sheetContext).pop();
                    }
                  },
                  icon: const Icon(Icons.close),
                ),
              ),
              Positioned(
                left: 16,
                right: 16,
                bottom: 20,
                child: DecoratedBox(
                  decoration: BoxDecoration(
                    color: Colors.black.withValues(alpha: 0.62),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                    child: Text(
                      _t("mobile.scan.cameraHint"),
                      textAlign: TextAlign.center,
                      style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600),
                    ),
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );

    await cameraController.dispose();
  }

  Future<void> _decodeQrFromPhoto(XFile photo) async {
    setState(() {
      _isDecodingPhoto = true;
    });

    try {
      final capture = await _scannerController.analyzeImage(photo.path);
      final decodedValue = capture?.barcodes
              .map((barcode) => barcode.rawValue?.trim() ?? "")
              .firstWhere((value) => value.isNotEmpty, orElse: () => "") ??
          "";

      if (decodedValue.isEmpty) {
        setState(() {
          _error = "mobile.scan.noQrInPhoto";
        });
        return;
      }

      _controller.text = decodedValue;
      _submit();
    } catch (_) {
      setState(() {
        _error = "mobile.scan.noQrInPhoto";
      });
    } finally {
      if (mounted) {
        setState(() {
          _isDecodingPhoto = false;
        });
      }
    }
  }

  bool _isSupportedImage(String filename) {
    final lower = filename.toLowerCase();
    return lower.endsWith(".png") ||
        lower.endsWith(".jpg") ||
        lower.endsWith(".jpeg") ||
        lower.endsWith(".webp") ||
        lower.endsWith(".gif") ||
        lower.endsWith(".ico");
  }

  String _selectedPhotoLabel() {
    final selected = _selectedPhoto;
    if (selected == null) {
      return _t("mobile.scan.noPhoto");
    }
    if (selected.name.isNotEmpty) {
      return selected.name;
    }
    final segments = selected.path.split(RegExp(r"[/\\]"));
    return segments.isEmpty ? selected.path : segments.last;
  }

  Widget _buildPhotoPreview() {
    final bytes = _selectedPhotoBytes;
    if (bytes == null) {
      return const SizedBox.shrink();
    }

    return Padding(
      padding: const EdgeInsets.only(top: 10),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(12),
        child: Image.memory(
          bytes,
          height: 140,
          width: double.infinity,
          fit: BoxFit.cover,
        ),
      ),
    );
  }

  String _localeCode() {
    final code = widget.currentLocale.languageCode.toLowerCase();
    return code == "ar" ? "ar" : "en";
  }

  String _t(String key) {
    final locale = _localeCode();
    return _messages[locale]?[key] ?? _messages["en"]?[key] ?? key;
  }

  @override
  Widget build(BuildContext context) {
    final isDark = widget.themeMode == ThemeMode.dark;
    final localeCode = _localeCode();

    return Scaffold(
      appBar: AppBar(
        title: const Text(BrandConfig.siteName),
        actions: [
          IconButton(
            tooltip: _t("mobile.scan.themeToggle"),
            onPressed: widget.onToggleTheme,
            icon: Icon(isDark ? Icons.light_mode : Icons.dark_mode),
          ),
          PopupMenuButton<String>(
            tooltip: _t("mobile.scan.language"),
            initialValue: localeCode,
            onSelected: widget.onLocaleSelected,
            itemBuilder: (context) => const <PopupMenuEntry<String>>[
              PopupMenuItem<String>(value: "en", child: Text("EN")),
              PopupMenuItem<String>(value: "ar", child: Text("AR")),
            ],
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 12),
              child: Center(
                child: Text(
                  localeCode.toUpperCase(),
                  style: const TextStyle(fontWeight: FontWeight.w700),
                ),
              ),
            ),
          ),
        ],
      ),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(_t("mobile.scan.prompt")),
            const SizedBox(height: 8),
            TextField(
              controller: _controller,
              decoration: InputDecoration(
                labelText: _t("mobile.scan.prompt"),
                hintText: "https://scct-damages.vercel.app/ar/submit/abc123",
              ),
            ),
            const SizedBox(height: 12),
            ElevatedButton(onPressed: _submit, child: Text(_t("mobile.scan.open"))),
            const SizedBox(height: 8),
            ElevatedButton.icon(
              onPressed: _openCameraScanner,
              icon: const Icon(Icons.qr_code_scanner),
              label: Text(_t("mobile.scan.openCamera")),
            ),
            const SizedBox(height: 16),
            ElevatedButton.icon(
              onPressed: _chooseFromLibrary,
              icon: const Icon(Icons.photo_library_outlined),
              label: Text(_t("mobile.scan.choosePhoto")),
            ),
            if (_selectedPhoto != null) ...[
              const SizedBox(height: 8),
              TextButton.icon(
                onPressed: _clearSelectedPhoto,
                icon: const Icon(Icons.clear),
                label: Text(_t("mobile.scan.clearPhoto")),
              ),
            ],
            const SizedBox(height: 10),
            DropTarget(
              onDragDone: (details) => _handleDroppedPhotos(details.files),
              onDragEntered: (_) => setState(() => _isDraggingPhoto = true),
              onDragExited: (_) => setState(() => _isDraggingPhoto = false),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 180),
                width: double.infinity,
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: _isDraggingPhoto ? const Color(0xFFE6F2FF) : const Color(0xFFF7F9FC),
                  border: Border.all(
                    color: _isDraggingPhoto ? const Color(0xFF2563EB) : const Color(0xFFCBD5E1),
                  ),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      _t("mobile.scan.dropPhoto"),
                      style: const TextStyle(fontWeight: FontWeight.w600),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      "${_t("mobile.scan.selectedPhoto")}: ${_selectedPhotoLabel()}",
                    ),
                  ],
                ),
              ),
            ),
            _buildPhotoPreview(),
            if (_isDecodingPhoto) ...[
              const SizedBox(height: 10),
              Row(
                children: [
                  const SizedBox(
                    height: 16,
                    width: 16,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  ),
                  const SizedBox(width: 8),
                  Text(_t("mobile.scan.decoding")),
                ],
              ),
            ],
            if (_error != null) ...[
              const SizedBox(height: 12),
              Text(_t(_error!), style: const TextStyle(color: Colors.red)),
            ],
          ],
        ),
      ),
    );
  }
}
