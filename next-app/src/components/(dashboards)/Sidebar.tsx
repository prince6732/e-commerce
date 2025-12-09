"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Home,
  LayoutDashboard,
  Users,
  FolderTree,
  Images,
  Tag,
  Layers,
  Palette,
  Mail,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import Image from "next/image";
import logoText from "@/public/ZeltonHorizontalBlack.png";
import logo from "@/public/ZeltonIconBlack.png";

// 🔹 All nav links
const navLinks = [
  { href: "/", label: "Home", icon: Home, roles: ["Admin"] },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["Admin"] },
  { href: "/dashboard/users", label: "Users", icon: Users, roles: ["Admin"] },
  { href: "/dashboard/brands", label: "Brands", icon: Tag, roles: ["Admin"] },
  { href: "/dashboard/attributes", label: "Attributes", icon: Layers, roles: ["Admin"] },
  { href: "/dashboard/categories", label: "Categories", icon: FolderTree, roles: ["Admin"] },
  { href: "/dashboard/orders", label: "Orders", icon: FolderTree, roles: ["Admin"] },
  { href: "/dashboard/sliders", label: "Sliders", icon: Images, roles: ["Admin"] },
  { href: "/dashboard/contact-messages", label: "Contact Messages", icon: Mail, roles: ["Admin"] },
  { href: "/dashboard/themes", label: "Themes", icon: Palette, roles: ["Admin"] },
];

interface SidebarProps {
  isOpen: boolean;
}

export default function Sidebar({ isOpen }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();

  const activeLink = navLinks.reduce(
    (prev, curr) =>
      pathname.startsWith(curr.href) && curr.href.length > prev.href.length ? curr : prev,
    navLinks[0]
  );

  const userRole = user?.role || "Visitor";
  const filteredLinks = navLinks.filter(
    (link) => userRole === "Admin" || link.roles.includes(userRole)
  );

  return (
    <aside
      className={`transition-all ps-2 duration-300 ease-in-out sticky top-0 z-[1199]
        ${isOpen ? "w-[260px]" : "w-[4.9375rem]"} 
        text-gray-800 h-screen flex flex-col justify-between 
       `}
    >
      {/* Logo */}
      <div
        className={`flex items-center px-4 py-3 rounded-2xl border border-gray-200 bg-white shadow-sm mt-2 
    ${isOpen ? "justify-center" : "justify-center"}`}
      >
        <Link href="/" className="logo italic font-bold h-[1.5rem] text-4xl text-gray-800 flex items-center">
          {isOpen ? (
            <Image src={logoText} unoptimized alt="Logo Text" className="h-[1.5rem] w-auto object-contain" />
          ) : (
            <Image src={logo} unoptimized alt="Logo Icon" className="h-[2rem] w-auto object-contain" />
          )}
        </Link>
      </div>


      {/* Nav */}
      <nav className="my-2 flex-1 overflow-y-auto scrollHide rounded-2xl border border-gray-200 bg-white p-2 shadow-sm">
        {filteredLinks.map(({ href, label, icon: Icon }) => {
          const isActive = activeLink.href === href;
          return (
            <Link key={href} href={href} className="block mb-1 last:mb-0">
              <div
                className={`flex items-center py-2.5 rounded-xl cursor-pointer transition-all duration-200
                  ${isOpen ? "justify-between px-3" : "justify-center px-3"} 
                  ${isActive
                    ? "bg-[#fff8ef] border-l-4 border-[#ff9903] text-[#ff9903] shadow-sm"
                    : "text-gray-700 hover:bg-gray-50 hover:text-[#ff9903]"
                  }`}
              >
                <div className="flex items-center flex-1">
                  <Icon className="w-5 h-5" />
                  <span
                    className={`text-sm font-medium text-nowrap pt-1 transition-all duration-300 overflow-hidden 
                      ${isOpen ? "ml-3 w-auto" : "w-0"}`}
                  >
                    {label}
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Footer - Optional branding or info */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm mb-2 p-3">
        <div className="flex items-center justify-center">
          <p className={`text-xs text-gray-500 transition-all duration-300 ${isOpen ? "block" : "hidden"}`}>
            © 2025 Admin Panel
          </p>
        </div>
      </div>
    </aside>
  );
}
