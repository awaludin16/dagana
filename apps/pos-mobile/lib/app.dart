import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class DaganaPosApp extends StatelessWidget {
  const DaganaPosApp({required this.router, super.key});

  final GoRouter router;

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: 'Dagana POS',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(),
      routerConfig: router,
    );
  }
}
