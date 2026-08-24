"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Megaphone,
  PlusCircle,
  Heart,
  Link2,
  LogOut,
  HandCoins,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { signOut, useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function AppSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/" || pathname.startsWith("/campaign/");
    return pathname === href || pathname.startsWith(href + "/");
  };

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="mb-2">
            <Link
              href="/dashboard"
              className="font-display text-base font-semibold tracking-tight text-sidebar-foreground"
            >
              ~/commit2fund
              <span className="cursor-blink ml-0.5 text-sidebar-primary" aria-hidden>
                ▍
              </span>
            </Link>
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/")}>
                  <Link href="/">
                    <HandCoins />
                    <span>Explore Campaigns</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/dashboard")}>
                  <Link href="/dashboard">
                    <LayoutDashboard />
                    <span>Dashboard</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/campaigns")}>
                  <Link href="/campaigns">
                    <Megaphone />
                    <span>My Campaigns</span>
                  </Link>
                </SidebarMenuButton>
                <SidebarMenuSub>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild isActive={isActive("/campaigns/new")}>
                      <Link href="/campaigns/new">
                        <PlusCircle />
                        <span>Create Campaign</span>
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                </SidebarMenuSub>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/contributions")}>
                  <Link href="/contributions">
                    <Heart />
                    <span>My contributions</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/link-account")}>
                  <Link href="/link-account">
                    <Link2 />
                    <span>Link Account</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        {session?.user && (
          <div className="flex items-center gap-3 border-t px-2 pt-3 pb-1">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs">
                {session.user.name
                  ?.split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2) ?? "?"}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col overflow-hidden">
              <span className="truncate text-sm font-medium">{session.user.name}</span>
              <span className="truncate text-xs text-muted-foreground">{session.user.email}</span>
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={() =>
            signOut({
              fetchOptions: {
                onSuccess: () => {
                  window.location.href = "/signin";
                },
              },
            })
          }
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
