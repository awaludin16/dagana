# Dagana POS Mobile

Aplikasi POS mobile Dagana. Stack: Flutter + Dart + go_router (Material 3).

## Menjalankan

```bash
flutter pub get
cp env/dev.example.json env/dev.json   # opsional
flutter run --dart-define-from-file=env/dev.json
```

`API_BASE_URL` default `http://10.0.2.2:8000/api/v1` (emulator Android). Untuk perangkat fisik, isi IP host pada `env/dev.json`.

## Pemeriksaan

```bash
flutter analyze
flutter test
dart format --output=none --set-exit-if-changed .
```

Panduan lengkap: `docs/operations/development-environment.md`.
