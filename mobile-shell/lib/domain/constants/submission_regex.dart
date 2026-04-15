final RegExp emailRegex = RegExp(r"^[^\s@]+@[^\s@]+\.[^\s@]+$");
final RegExp phoneRegex = RegExp(r"^\+201[0-9]{9}$");
final RegExp nameRegex = RegExp(
    r"^[A-Za-z\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\u0590-\u05FF\s\-_]+$");
final RegExp textRegex = RegExp(r'''^[\u0600-\u06FFa-zA-Z0-9\s.,?!&\-()'"]$''');
