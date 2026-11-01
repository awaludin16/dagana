import 'package:dagana_pos/app.dart';
import 'package:dagana_pos/router.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  testWidgets('menampilkan beranda POS beserta API base URL', (tester) async {
    await tester.pumpWidget(DaganaPosApp(router: createRouter()));
    await tester.pumpAndSettle();

    expect(find.text('Dagana POS'), findsWidgets);
    expect(
      find.textContaining('API: http://10.0.2.2:8000/api/v1'),
      findsOneWidget,
    );
  });

  testWidgets('menampilkan halaman tidak ditemukan untuk route tak dikenal', (
    tester,
  ) async {
    await tester.pumpWidget(
      DaganaPosApp(router: createRouter(initialLocation: '/tidak-ada')),
    );
    await tester.pumpAndSettle();

    expect(find.text('Halaman tidak ditemukan'), findsOneWidget);
    expect(
      find.widgetWithText(TextButton, 'Kembali ke beranda'),
      findsOneWidget,
    );
  });

  testWidgets('beranda tidak overflow pada lebar ponsel', (tester) async {
    tester.view.physicalSize = const Size(390, 844);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);

    await tester.pumpWidget(DaganaPosApp(router: createRouter()));
    await tester.pumpAndSettle();

    expect(tester.takeException(), isNull);
  });
}
