/// Diatur lewat `--dart-define` atau `--dart-define-from-file`.
/// Default memakai host Android emulator; ganti untuk perangkat fisik.
const String apiBaseUrl = String.fromEnvironment(
  'API_BASE_URL',
  defaultValue: 'http://10.0.2.2:8000/api/v1',
);
