import 'package:flutter/material.dart';

import '../config/env.dart';

class HomePage extends StatelessWidget {
  const HomePage({super.key});

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;

    return Scaffold(
      appBar: AppBar(title: const Text('Dagana POS')),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Dagana POS', style: textTheme.headlineSmall),
              const SizedBox(height: 8),
              Text(
                'Fondasi aplikasi POS sudah berjalan. Alur kasir dan pembayaran dibangun pada fase berikutnya.',
                style: textTheme.bodyMedium,
              ),
              const SizedBox(height: 16),
              Text('API: $apiBaseUrl', style: textTheme.bodySmall),
            ],
          ),
        ),
      ),
    );
  }
}
