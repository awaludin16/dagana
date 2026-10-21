import { useState } from "react";
import { Outlet, NavLink, Link } from "react-router-dom";
import {
  House,
  ShoppingCart,
  ClipboardText,
  Warehouse,
  Coins,
  Storefront,
  UsersThree,
  List,
} from "@phosphor-icons/react";
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
import daganaLogo from "../../../../../design-system/dagana/dagana-logo.png";

const baseNavItems = [
  { to: "/", label: "Dasbor", icon: House, perm: null },
  { to: "/pos", label: "POS", icon: ShoppingCart, perm: null },
  { to: "/orders", label: "Pesanan", icon: ClipboardText, perm: null },
  { to: "/products", label: "Produk", icon: Warehouse, perm: null },
  { to: "/cash", label: "Kas", icon: Coins, perm: null },
  { to: "/outlets", label: "Outlet", icon: Storefront, perm: "outlets.read" },
  { to: "/members", label: "Anggota", icon: UsersThree, perm: "members.read" },
] as const;

function DaganaLogo() {
  return (
    <img
      src={daganaLogo}
      alt="Dagana"
      className="h-9 w-26 object-cover object-center"
    />
  );
}

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
                ? "bg-primary/10 font-medium text-primary"
                : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
            }`
          }
        >
          <Icon className="size-5" weight="duotone" aria-hidden="true" />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );

  return (
    <div className="min-h-dvh">
      <a
        href="#main-content"
        className="sr-only z-60 rounded-md bg-background p-3 text-foreground focus:not-sr-only focus:fixed focus:left-3 focus:top-3"
      >
        Lewati ke konten utama
      </a>
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="mx-auto flex min-h-14 max-w-screen-2xl flex-wrap items-center justify-between gap-2 px-3 py-2 sm:flex-nowrap sm:px-4">
          <div className="flex min-w-0 items-center gap-2">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <button
                  type="button"
                  className="inline-flex size-10 shrink-0 items-center justify-center rounded-md border bg-background text-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  aria-label="Buka navigasi"
                >
                  <List className="size-5" aria-hidden="true" />
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[min(20rem,85vw)] gap-0 p-0">
                <SheetHeader className="border-b px-4 py-3">
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
          <div className="flex min-w-0 flex-1 items-center justify-end gap-2 sm:flex-initial sm:gap-3">
            <BusinessOutletSelector />
          </div>
        </div>
      </header>
      <main
        id="main-content"
        tabIndex={-1}
        className="mx-auto w-full max-w-screen-2xl px-4 pb-8 pt-4"
      >
        <Outlet />
      </main>
    </div>
  );
}
