import { useState } from "react";
import { Outlet, NavLink, Link } from "react-router-dom";
import {
  House,
  ShoppingCart,
  ClipboardText,
  Warehouse,
  Storefront,
  UsersThree,
  List,
} from "@phosphor-icons/react";
import { DaganaLogo } from "./DaganaLogo";
import { UserInfo } from "./UserInfo";
import { BusinessOutletSelector } from "./BusinessOutletSelector";
import { useBusiness } from "@/providers/business-provider";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const baseNavItems = [
  { to: "/", label: "Dasbor", icon: House, perm: null },
  { to: "/pos", label: "POS", icon: ShoppingCart, perm: "products.read" },
  { to: "/orders", label: "Pesanan", icon: ClipboardText, perm: null },
  { to: "/products", label: "Produk", icon: Warehouse, perm: "products.read" },
  { to: "/outlets", label: "Outlet", icon: Storefront, perm: "outlets.read" },
  { to: "/members", label: "Anggota", icon: UsersThree, perm: "members.read" },
] as const;

export function RootLayout() {
  const { can } = useBusiness();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navItems = baseNavItems.filter((item) => !item.perm || can(item.perm));

  const navigation = () => (
    <nav aria-label="Navigasi utama" className="flex flex-col gap-1 p-2">
      {navItems.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === "/"}
          onClick={() => setMobileMenuOpen(false)}
          className={({ isActive }) =>
            `flex min-h-11 items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
              isActive
                ? "bg-soft-primary font-medium text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`
          }
        >
          <Icon className="size-[18px] shrink-0" weight="regular" aria-hidden="true" />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );

  return (
    <div className="min-h-dvh bg-canvas sm:p-2">
      <a
        href="#main-content"
        className="sr-only z-60 rounded-md bg-background p-3 text-foreground focus:not-sr-only focus:fixed focus:left-3 focus:top-3"
      >
        Lewati ke konten utama
      </a>
      <header className="sticky top-0 z-40 bg-canvas sm:top-2">
        <div className="mx-auto flex min-h-12 max-w-screen-2xl flex-wrap items-center justify-between gap-2 px-3 py-2 sm:flex-nowrap sm:px-5">
          <div className="flex min-w-0 items-center gap-2">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <button
                  type="button"
                  className="inline-flex size-11 shrink-0 items-center justify-center rounded-md text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  aria-label="Buka navigasi"
                >
                  <List className="size-5" aria-hidden="true" />
                </button>
              </SheetTrigger>
              <SheetContent
                side="left"
                className="w-[min(18rem,88vw)] gap-0 p-0"
              >
                <SheetHeader className="border-b px-4 py-2.5">
                  <SheetTitle>
                    <DaganaLogo />
                  </SheetTitle>
                  <SheetDescription className="sr-only">
                    Navigasi fitur utama Dagana
                  </SheetDescription>
                </SheetHeader>
                <div className="flex-1 overflow-y-auto">{navigation()}</div>
                <UserInfo />
              </SheetContent>
            </Sheet>
            <Link to="/" aria-label="Dagana — Dasbor" className="shrink-0">
              <DaganaLogo />
            </Link>
          </div>
          <div className="flex min-w-0 max-w-[calc(100%-7.5rem)] flex-1 items-center justify-end gap-2 sm:max-w-none sm:flex-initial sm:gap-3">
            <BusinessOutletSelector />
          </div>
        </div>
      </header>
      <main
        id="main-content"
        tabIndex={-1}
        className="mx-auto min-h-[calc(100dvh-3.5rem)] w-full max-w-screen-2xl rounded-xl border bg-card px-4 pb-8 pt-5 sm:min-h-[calc(100dvh-5.5rem)] sm:rounded-2xl sm:px-6 sm:pt-6 lg:px-8"
      >
        <Outlet />
      </main>
    </div>
  );
}
