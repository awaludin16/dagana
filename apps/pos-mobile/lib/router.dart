import 'package:go_router/go_router.dart';

import 'pages/home_page.dart';
import 'pages/not_found_page.dart';

GoRouter createRouter({String initialLocation = '/'}) {
  return GoRouter(
    initialLocation: initialLocation,
    routes: [GoRoute(path: '/', builder: (context, state) => const HomePage())],
    errorBuilder: (context, state) => const NotFoundPage(),
  );
}
