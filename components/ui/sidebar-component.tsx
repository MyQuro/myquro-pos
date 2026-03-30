"use client";

import React, { useState } from "react";
import { Layers } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Search as SearchIcon,
  Dashboard,
  Task,
  Folder,
  Calendar as CalendarIcon,
  UserMultiple,
  Analytics,
  DocumentAdd,
  Settings as SettingsIcon,
  User as UserIcon,
  ChevronDown as ChevronDownIcon,
  AddLarge,
  Filter,
  Time,
  InProgress,
  CheckmarkOutline,
  Flag,
  Archive,
  View,
  Report,
  StarFilled,
  Group,
  ChartBar,
  FolderOpen,
  Share,
  CloudUpload,
  Security,
  Notification,
  Integration,
} from "@carbon/icons-react";
import { authClient } from "@/lib/auth-client";

// Softer spring animation curve
const softSpringEasing = "cubic-bezier(0.25, 1.1, 0.4, 1)";

/* ----------------------------- Brand / Logos ----------------------------- */

function InterfacesLogoSquare() {
  return (
    <div className="flex items-center justify-center size-full text-neutral-50 cursor-pointer">
      <Layers className="size-6" />
    </div>
  );
}

function BrandBadge() {
  return (
    <div className="relative shrink-0 w-full">
      <div className="flex items-center p-1 w-full">
        <div className="h-10 w-8 flex items-center justify-center pl-2">
          <InterfacesLogoSquare />
        </div>
        <div className="px-2 py-1">
          <div className="font-['Lexend:SemiBold',_sans-serif] text-[16px] text-neutral-50 cursor-pointer">
            MyQuro
          </div>
        </div>
      </div>
    </div>
  );
}

/* --------------------------------- Avatar -------------------------------- */

function AvatarCircle({ src, name }: { src?: string; name?: string }) {
  return (
    <div className="relative rounded-full shrink-0 size-8 bg-neutral-900 overflow-hidden flex items-center justify-center border border-neutral-800">
      {src ? (
        <img src={src} alt={name || "User Avatar"} className="size-full object-cover" />
      ) : (
        <UserIcon size={16} className="text-neutral-500" />
      )}
    </div>
  );
}

/* ------------------------------ Search Input ----------------------------- */

function SearchContainer({ isCollapsed = false }: { isCollapsed?: boolean }) {
  const [searchValue, setSearchValue] = useState("");

  return (
    <div
      className={`relative shrink-0 transition-all duration-500 ${
        isCollapsed ? "w-full flex justify-center" : "w-full"
      }`}
      style={{ transitionTimingFunction: softSpringEasing }}
    >
      <div
        className={`bg-black h-10 relative rounded-lg flex items-center transition-all duration-500 ${
          isCollapsed ? "w-10 min-w-10 justify-center" : "w-full"
        }`}
        style={{ transitionTimingFunction: softSpringEasing }}
      >
        <div
          className={`flex items-center justify-center shrink-0 transition-all duration-500 ${
            isCollapsed ? "p-1" : "px-1"
          }`}
          style={{ transitionTimingFunction: softSpringEasing }}
        >
          <div className="size-8 flex items-center justify-center">
            <SearchIcon size={16} className="text-neutral-50" />
          </div>
        </div>

        <div
          className={`flex-1 relative transition-opacity duration-500 overflow-hidden ${
            isCollapsed ? "opacity-0 w-0" : "opacity-100"
          }`}
          style={{ transitionTimingFunction: softSpringEasing }}
        >
          <div className="flex flex-col justify-center size-full">
            <div className="flex flex-col gap-2 items-start justify-center pr-2 py-1 w-full">
              <input
                suppressHydrationWarning
                type="text"
                placeholder="Search..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className="w-full bg-transparent border-none outline-none font-['Lexend:Regular',_sans-serif] text-[14px] text-neutral-50 placeholder:text-neutral-400 leading-[20px]"
                tabIndex={isCollapsed ? -1 : 0}
              />
            </div>
          </div>
        </div>

        <div
          aria-hidden="true"
          className="absolute inset-0 rounded-lg border border-neutral-800 pointer-events-none"
        />
      </div>
    </div>
  );
}

/* --------------------------- Types / Content Map -------------------------- */

interface MenuItemT {
  icon?: React.ReactNode;
  label: string;
  href?: string;
  hasDropdown?: boolean;
  isActive?: boolean;
  children?: MenuItemT[];
}
interface MenuSectionT {
  title: string;
  items: MenuItemT[];
}
interface SidebarContent {
  title: string;
  sections: MenuSectionT[];
}

function getSidebarContent(activeSection: string): SidebarContent {
  const contentMap: Record<string, SidebarContent> = {
    pos: {
      title: "Point of Sale",
      sections: [
        {
          title: "Core",
          items: [
            { icon: <Dashboard size={16} className="text-neutral-50" />, label: "Dashboard", href: "/pos" },
            { icon: <Task size={16} className="text-neutral-50" />, label: "Menu Management", href: "/pos/menu" },
            { icon: <DocumentAdd size={16} className="text-neutral-50" />, label: "Order Management", href: "/pos/orders" },
          ],
        },
        {
          title: "Management",
          items: [
            { icon: <UserMultiple size={16} className="text-neutral-50" />, label: "Customers", href: "/pos/customers" },
            { icon: <Folder size={16} className="text-neutral-50" />, label: "Inventory", href: "/pos/inventory" },
            { icon: <Group size={16} className="text-neutral-50" />, label: "Vendors", href: "/pos/vendors" },
          ],
        },
        {
          title: "Analytics",
          items: [
            { icon: <Report size={16} className="text-neutral-50" />, label: "Reports & Analytics", href: "/pos/reports" },
          ],
        }
      ],
    },
    settings: {
      title: "Settings",
      sections: [
        {
          title: "Account",
          items: [
            { icon: <UserIcon size={16} className="text-neutral-50" />, label: "Profile settings", href: "/settings/profile" },
            { icon: <Security size={16} className="text-neutral-50" />, label: "Security", href: "/settings/security" },
            { icon: <Notification size={16} className="text-neutral-50" />, label: "Notifications", href: "/settings/notifications" },
          ],
        },
        {
          title: "Workspace",
          items: [
            {
              icon: <SettingsIcon size={16} className="text-neutral-50" />,
              label: "Preferences",
              href: "/settings/preferences",
              hasDropdown: true,
              children: [
                { icon: <View size={14} className="text-neutral-300" />, label: "Theme settings", href: "/settings/preferences?tab=theme" },
                { icon: <Time size={14} className="text-neutral-300" />, label: "Time zone", href: "/settings/preferences?tab=timezone" },
              ],
            },
            { icon: <Integration size={16} className="text-neutral-50" />, label: "Integrations", href: "/settings/integrations" },
          ],
        },
      ],
    },
  };

  return contentMap[activeSection] || contentMap.pos;
}

/* ---------------------------- Left Icon Nav Rail -------------------------- */

function IconNavButton({
  children,
  isActive = false,
  onClick,
}: {
  children: React.ReactNode;
  isActive?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      suppressHydrationWarning
      type="button"
      className={`flex items-center justify-center rounded-lg size-10 min-w-10 transition-colors duration-500
        ${isActive ? "bg-neutral-800 text-neutral-50" : "hover:bg-neutral-800 text-neutral-400 hover:text-neutral-300"}`}
      style={{ transitionTimingFunction: softSpringEasing }}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function IconNavigation({
  activeSection,
  onSectionChange,
}: {
  activeSection: string;
  onSectionChange: (section: string) => void;
}) {
  const navItems = [
    { id: "pos", icon: <Dashboard size={16} />, label: "Point of Sale" },
  ];

  return (
    <aside className="bg-black flex flex-col gap-2 items-center p-4 w-16 h-[800px] border-r border-neutral-800 rounded-l-2xl">
      {/* Logo */}
      <div className="mb-2 size-10 flex items-center justify-center">
        <div className="size-7">
          <InterfacesLogoSquare />
        </div>
      </div>

      {/* Navigation Icons */}
      <div className="flex flex-col gap-2 w-full items-center">
        {navItems.map((item) => (
          <IconNavButton
            key={item.id}
            isActive={activeSection === item.id}
            onClick={() => onSectionChange(item.id)}
          >
            {item.icon}
          </IconNavButton>
        ))}
      </div>

      <div className="flex-1" />

      {/* Bottom section */}
      <div className="flex flex-col gap-2 w-full items-center">
        <IconNavButton isActive={activeSection === "settings"} onClick={() => onSectionChange("settings")}>
          <SettingsIcon size={16} />
        </IconNavButton>
        <div className="size-8">
          <DetailSidebarAvatar activeSection={activeSection} />
        </div>
      </div>
    </aside>
  );
}

function DetailSidebarAvatar({ activeSection }: { activeSection: string }) {
  const { data: session } = authClient.useSession();
  return <AvatarCircle src={session?.user.image || undefined} name={session?.user.name} />;
}

/* ------------------------------ Right Sidebar ----------------------------- */

function SectionTitle({
  title,
  onToggleCollapse,
  isCollapsed,
}: {
  title: string;
  onToggleCollapse: () => void;
  isCollapsed: boolean;
}) {
  if (isCollapsed) {
    return (
      <div className="w-full flex justify-center transition-all duration-500" style={{ transitionTimingFunction: softSpringEasing }}>
        <button
          suppressHydrationWarning
          type="button"
          onClick={onToggleCollapse}
          className="flex items-center justify-center rounded-lg size-10 min-w-10 transition-all duration-500 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-300"
          style={{ transitionTimingFunction: softSpringEasing }}
          aria-label="Expand sidebar"
        >
          <span className="inline-block rotate-180">
            <ChevronDownIcon size={16} />
          </span>
        </button>
      </div>
    );
  }

  return (
    <div className="w-full overflow-hidden transition-all duration-500" style={{ transitionTimingFunction: softSpringEasing }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center h-10">
          <div className="px-2 py-1">
            <div className="font-['Lexend:SemiBold',_sans-serif] text-[18px] text-neutral-50 leading-[27px]">
              {title}
            </div>
          </div>
        </div>
        <div className="pr-1">
          <button
            suppressHydrationWarning
            type="button"
            onClick={onToggleCollapse}
            className="flex items-center justify-center rounded-lg size-10 min-w-10 transition-all duration-500 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-300"
            style={{ transitionTimingFunction: softSpringEasing }}
            aria-label="Collapse sidebar"
          >
            <ChevronDownIcon size={16} className="-rotate-90" />
          </button>
        </div>
      </div>
    </div>
  );
}

function DetailSidebar({ activeSection }: { activeSection: string }) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { data: session } = authClient.useSession();
  const content = getSidebarContent(activeSection);

  const toggleExpanded = (itemKey: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(itemKey)) next.delete(itemKey);
      else next.add(itemKey);
      return next;
    });
  };

  const toggleCollapse = () => setIsCollapsed((s) => !s);

  return (
    <aside
      className={`bg-black flex flex-col gap-4 items-start p-4 rounded-r-2xl transition-all duration-500 h-[800px] ${
        isCollapsed ? "w-16 min-w-16 !px-0 justify-center" : "w-80"
      }`}
      style={{ transitionTimingFunction: softSpringEasing }}
    >
      {!isCollapsed && <BrandBadge />}

      <SectionTitle title={content.title} onToggleCollapse={toggleCollapse} isCollapsed={isCollapsed} />
      <SearchContainer isCollapsed={isCollapsed} />

      <div
        className={`flex flex-col w-full overflow-y-auto transition-all duration-500 ${
          isCollapsed ? "gap-2 items-center" : "gap-4 items-start"
        }`}
        style={{ transitionTimingFunction: softSpringEasing }}
      >
        {content.sections.map((section, index) => (
          <MenuSection
            key={`${activeSection}-${index}`}
            section={section}
            expandedItems={expandedItems}
            onToggleExpanded={toggleExpanded}
            isCollapsed={isCollapsed}
          />
        ))}
      </div>

      {!isCollapsed && (
        <div className="w-full mt-auto pt-2 border-t border-neutral-800">
          <div className="flex items-center gap-2 px-2 py-2">
            <AvatarCircle src={session?.user.image || undefined} name={session?.user.name} />
            <div className="font-['Lexend:Regular',_sans-serif] text-[14px] text-neutral-50 ml-2 truncate max-w-[120px]">
              {session?.user.name || "Guest"}
            </div>
            <button
              suppressHydrationWarning
              type="button"
              className="ml-auto flex items-center justify-center size-8 rounded-md transition-colors hover:bg-neutral-800"
              aria-label="More"
            >
              <svg className="size-4" viewBox="0 0 16 16" fill="none">
                <circle cx="4" cy="8" r="1.5" fill="#A3A3A3" />
                <circle cx="8" cy="8" r="1.5" fill="#A3A3A3" />
                <circle cx="12" cy="8" r="1.5" fill="#A3A3A3" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}

/* ------------------------------ Menu Elements ---------------------------- */

function MenuItem({
  item,
  isExpanded,
  onToggle,
  onItemClick,
  isCollapsed,
}: {
  item: MenuItemT;
  isExpanded?: boolean;
  onToggle?: () => void;
  onItemClick?: () => void;
  isCollapsed?: boolean;
}) {
  const pathname = usePathname() || "";
  const isActive = item.href ? (item.href === "/pos" ? pathname === "/pos" : pathname.startsWith(item.href)) : item.isActive;

  const handleClick = (e: React.MouseEvent) => {
    if (item.hasDropdown && onToggle) {
      e.preventDefault();
      onToggle();
    } else {
      onItemClick?.();
    }
  };

  const content = (
    <div
      className={`relative shrink-0 transition-all duration-500 ${
        isCollapsed ? "w-full flex justify-center" : "w-full"
      }`}
      style={{ transitionTimingFunction: softSpringEasing }}
    >
      <div
        className={`rounded-lg cursor-pointer transition-all duration-500 flex items-center relative ${
          isActive ? "bg-neutral-800" : "hover:bg-neutral-800 text-neutral-400 hover:text-neutral-300"
        } ${isCollapsed ? "w-10 min-w-10 h-10 justify-center p-4" : "w-full h-10 px-4 py-2"}`}
        style={{ transitionTimingFunction: softSpringEasing }}
        onClick={item.href && !item.hasDropdown ? undefined : handleClick}
        title={isCollapsed ? item.label : undefined}
      >
        <div className={`flex items-center justify-center shrink-0 ${isActive ? "text-neutral-50" : ""}`}>
          {item.icon}
        </div>

        <div
          className={`flex-1 relative transition-opacity duration-500 overflow-hidden ${
            isCollapsed ? "opacity-0 w-0" : "opacity-100 ml-3"
          }`}
          style={{ transitionTimingFunction: softSpringEasing }}
        >
          <div className={`font-['Lexend:Regular',_sans-serif] text-[14px] leading-[20px] truncate ${isActive ? "text-neutral-50" : "text-neutral-400"}`}>
            {item.label}
          </div>
        </div>

        {item.hasDropdown && (
          <div
            className={`flex items-center justify-center shrink-0 transition-opacity duration-500 ${
              isCollapsed ? "opacity-0 w-0" : "opacity-100 ml-2"
            }`}
            style={{ transitionTimingFunction: softSpringEasing }}
          >
            <ChevronDownIcon
              size={16}
              className={`transition-transform duration-500 ${isActive ? "text-neutral-50" : "text-neutral-400"}`}
              style={{
                transitionTimingFunction: softSpringEasing,
                transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
              }}
            />
          </div>
        )}
      </div>
    </div>
  );

  if (item.href && !item.hasDropdown) {
    return <Link href={item.href} legacyBehavior={false}>{content}</Link>;
  }

  return content;
}

function SubMenuItem({ item, onItemClick }: { item: MenuItemT; onItemClick?: () => void }) {
  return (
    <div className="w-full pl-9 pr-1 py-[1px]">
      <div
        className="h-10 w-full rounded-lg cursor-pointer transition-colors hover:bg-neutral-800 flex items-center px-3 py-1"
        onClick={onItemClick}
      >
        <div className="flex-1 min-w-0">
          <div className="font-['Lexend:Regular',_sans-serif] text-[14px] text-neutral-300 leading-[18px] truncate">
            {item.label}
          </div>
        </div>
      </div>
    </div>
  );
}

function MenuSection({
  section,
  expandedItems,
  onToggleExpanded,
  isCollapsed,
}: {
  section: MenuSectionT;
  expandedItems: Set<string>;
  onToggleExpanded: (itemKey: string) => void;
  isCollapsed?: boolean;
}) {
  return (
    <div className="flex flex-col w-full">
      <div
        className={`relative shrink-0 w-full transition-all duration-500 overflow-hidden ${
          isCollapsed ? "h-0 opacity-0 bg-transparent" : "h-10 opacity-100"
        }`}
        style={{ transitionTimingFunction: softSpringEasing }}
      >
        <div className="flex items-center h-10 px-4">
          <div className="font-['Lexend:Regular',_sans-serif] text-[14px] text-neutral-400">
            {section.title}
          </div>
        </div>
      </div>

      {section.items.map((item, index) => {
        const itemKey = `${section.title}-${index}`;
        const isExpanded = expandedItems.has(itemKey);
        return (
          <div key={itemKey} className="w-full flex flex-col">
            <MenuItem
              item={item}
              isExpanded={isExpanded}
              onToggle={() => onToggleExpanded(itemKey)}
              onItemClick={() => console.log(`Clicked ${item.label}`)}
              isCollapsed={isCollapsed}
            />
            {isExpanded && item.children && !isCollapsed && (
              <div className="flex flex-col gap-1 mb-2">
                {item.children.map((child, childIndex) => (
                  <SubMenuItem
                    key={`${itemKey}-${childIndex}`}
                    item={child}
                    onItemClick={() => console.log(`Clicked ${child.label}`)}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* --------------------------------- Layout -------------------------------- */

export function TwoLevelSidebar() {
  const [activeSection, setActiveSection] = useState("pos");

  return (
    <div className="flex flex-row">
      <IconNavigation activeSection={activeSection} onSectionChange={setActiveSection} />
      <DetailSidebar activeSection={activeSection} />
    </div>
  );
}

/* ------------------------------- Root Frame ------------------------------ */

export function Frame760() {
  return (
    <div className="bg-[#1a1a1a] min-h-screen flex items-center justify-center p-4">
      <TwoLevelSidebar />
    </div>
  );
}

export default Frame760;
