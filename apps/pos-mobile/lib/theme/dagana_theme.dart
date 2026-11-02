import 'package:flutter/material.dart';

abstract final class DaganaColors {
  static const primary = Color(0xFF176B52);
  static const primaryHover = Color(0xFF12543F);
  static const primarySoft = Color(0xFFDCEFE7);
  static const amber = Color(0xFFE8A23A);
  static const amberForeground = Color(0xFF2D2417);
  static const terracotta = Color(0xFFA94F36);

  static const lightBackground = Color(0xFFF6F8F5);
  static const lightSurface = Color(0xFFFFFFFF);
  static const lightSurfaceSubtle = Color(0xFFEDF2EE);
  static const lightText = Color(0xFF18231E);
  static const lightTextMuted = Color(0xFF5D6B63);
  static const lightBorder = Color(0xFFE3E8E4);
  static const lightInputBorder = Color(0xFFD5DED8);

  static const darkBackground = Color(0xFF101A16);
  static const darkSurface = Color(0xFF17231D);
  static const darkSurfaceRaised = Color(0xFF1E2D25);
  static const darkSurfaceSubtle = Color(0xFF25372D);
  static const darkText = Color(0xFFF2F6F3);
  static const darkTextMuted = Color(0xFFB2C0B7);
  static const darkBorder = Color(0xFF34463B);

  static const success = Color(0xFF18794E);
  static const successContainer = Color(0xFFE1F3E8);
  static const warning = Color(0xFFA15C00);
  static const warningContainer = Color(0xFFFFF1D6);
  static const danger = Color(0xFFB42318);
  static const dangerContainer = Color(0xFFFCE8E6);
  static const info = Color(0xFF245E9B);
  static const infoContainer = Color(0xFFE7F0FA);
}

abstract final class DaganaTheme {
  static const fontFamily = 'PlusJakartaSans';

  static const TextTheme textTheme = TextTheme(
    displayLarge: TextStyle(
      fontSize: 32,
      height: 1.22,
      fontWeight: FontWeight.w700,
    ),
    headlineLarge: TextStyle(
      fontSize: 28,
      height: 1.29,
      fontWeight: FontWeight.w700,
    ),
    headlineMedium: TextStyle(
      fontSize: 24,
      height: 1.33,
      fontWeight: FontWeight.w700,
    ),
    titleLarge: TextStyle(
      fontSize: 20,
      height: 1.4,
      fontWeight: FontWeight.w600,
    ),
    titleMedium: TextStyle(
      fontSize: 18,
      height: 1.44,
      fontWeight: FontWeight.w600,
    ),
    titleSmall: TextStyle(
      fontSize: 16,
      height: 1.5,
      fontWeight: FontWeight.w600,
    ),
    bodyLarge: TextStyle(
      fontSize: 16,
      height: 1.5,
      fontWeight: FontWeight.w400,
    ),
    bodyMedium: TextStyle(
      fontSize: 14,
      height: 1.57,
      fontWeight: FontWeight.w400,
    ),
    bodySmall: TextStyle(
      fontSize: 12,
      height: 1.5,
      fontWeight: FontWeight.w500,
    ),
    labelLarge: TextStyle(
      fontSize: 14,
      height: 1.43,
      fontWeight: FontWeight.w600,
    ),
    labelMedium: TextStyle(
      fontSize: 13,
      height: 1.54,
      fontWeight: FontWeight.w600,
    ),
    labelSmall: TextStyle(
      fontSize: 12,
      height: 1.5,
      fontWeight: FontWeight.w500,
    ),
  );

  static ThemeData light() {
    final colorScheme =
        ColorScheme.fromSeed(
          seedColor: DaganaColors.primary,
          brightness: Brightness.light,
        ).copyWith(
          primary: DaganaColors.primary,
          onPrimary: Colors.white,
          primaryContainer: DaganaColors.primarySoft,
          onPrimaryContainer: const Color(0xFF123B2D),
          secondary: DaganaColors.amber,
          onSecondary: DaganaColors.amberForeground,
          tertiary: DaganaColors.terracotta,
          onTertiary: Colors.white,
          error: DaganaColors.danger,
          onError: Colors.white,
          surface: DaganaColors.lightSurface,
          onSurface: DaganaColors.lightText,
          onSurfaceVariant: DaganaColors.lightTextMuted,
          outline: DaganaColors.lightInputBorder,
          outlineVariant: DaganaColors.lightBorder,
        );

    return ThemeData(
      useMaterial3: true,
      colorScheme: colorScheme,
      fontFamily: fontFamily,
      textTheme: textTheme,
      scaffoldBackgroundColor: DaganaColors.lightBackground,
      visualDensity: VisualDensity.standard,
      appBarTheme: const AppBarTheme(
        backgroundColor: DaganaColors.lightBackground,
        foregroundColor: DaganaColors.lightText,
        elevation: 0,
        centerTitle: false,
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          minimumSize: const Size(48, 48),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
          textStyle: const TextStyle(fontWeight: FontWeight.w600),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          minimumSize: const Size(48, 48),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
          side: const BorderSide(color: DaganaColors.lightInputBorder),
          textStyle: const TextStyle(fontWeight: FontWeight.w600),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: DaganaColors.lightSurface,
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 16,
          vertical: 14,
        ),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: DaganaColors.lightInputBorder),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: DaganaColors.lightInputBorder),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: DaganaColors.primary, width: 2),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: DaganaColors.danger),
        ),
      ),
      dividerTheme: const DividerThemeData(
        color: DaganaColors.lightBorder,
        thickness: 1,
        space: 1,
      ),
    );
  }

  static ThemeData dark() {
    const darkPrimary = Color(0xFF77CBAA);
    const darkOnPrimary = Color(0xFF0C2D20);
    const darkPrimaryContainer = Color(0xFF204C3B);
    const darkOnPrimaryContainer = Color(0xFFD9F3E7);
    const darkAmber = Color(0xFFF1B756);
    const darkOnAmber = Color(0xFF30200A);
    const darkTerracotta = Color(0xFFF0A087);
    const darkOnTerracotta = Color(0xFF30150E);

    final colorScheme =
        ColorScheme.fromSeed(
          seedColor: darkPrimary,
          brightness: Brightness.dark,
        ).copyWith(
          primary: darkPrimary,
          onPrimary: darkOnPrimary,
          primaryContainer: darkPrimaryContainer,
          onPrimaryContainer: darkOnPrimaryContainer,
          secondary: darkAmber,
          onSecondary: darkOnAmber,
          tertiary: darkTerracotta,
          onTertiary: darkOnTerracotta,
          error: const Color(0xFFFF8A80),
          onError: const Color(0xFF30150E),
          surface: DaganaColors.darkSurface,
          onSurface: DaganaColors.darkText,
          onSurfaceVariant: DaganaColors.darkTextMuted,
          outline: DaganaColors.darkBorder,
          outlineVariant: DaganaColors.darkBorder,
        );

    return ThemeData(
      useMaterial3: true,
      colorScheme: colorScheme,
      fontFamily: fontFamily,
      textTheme: textTheme,
      scaffoldBackgroundColor: DaganaColors.darkBackground,
      visualDensity: VisualDensity.standard,
      appBarTheme: const AppBarTheme(
        backgroundColor: DaganaColors.darkBackground,
        foregroundColor: DaganaColors.darkText,
        elevation: 0,
        centerTitle: false,
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          minimumSize: const Size(48, 48),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
          textStyle: const TextStyle(fontWeight: FontWeight.w600),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: DaganaColors.darkSurface,
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 16,
          vertical: 14,
        ),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: DaganaColors.darkBorder),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: DaganaColors.darkBorder),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: BorderSide(color: darkPrimary, width: 2),
        ),
      ),
      dividerTheme: const DividerThemeData(
        color: DaganaColors.darkBorder,
        thickness: 1,
        space: 1,
      ),
    );
  }
}
