"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { Icon } from "@iconify/react";

type MenuItem = {
  icon: string;
  label: string;
  action: string;
  iconClass?: string;
  badge?: { text: string; className: string };
  rightIcon?: string;
  showAvatar?: boolean;
};

type StatusItem = {
  value: string;
  icon: string;
  label: string;
};

const MENU_ITEMS: {
  status: StatusItem[];
  profile: MenuItem[];
  premium: MenuItem[];
  support: MenuItem[];
  account: MenuItem[];
} = {
  status: [
    { value: "focus", icon: "solar:emoji-funny-circle-line-duotone", label: "Focus" },
    { value: "offline", icon: "solar:moon-sleep-line-duotone", label: "Appear Offline" },
  ],
  profile: [
    { icon: "solar:user-circle-line-duotone", label: "Your profile", action: "profile" },
    { icon: "solar:sun-line-duotone", label: "Appearance", action: "appearance" },
    { icon: "solar:settings-line-duotone", label: "Settings", action: "settings" },
    { icon: "solar:bell-line-duotone", label: "Notifications", action: "notifications" },
  ],
  premium: [
    {
      icon: "solar:star-bold",
      label: "Upgrade to Pro",
      action: "upgrade",
      iconClass: "text-amber-600",
      badge: { text: "20% off", className: "bg-amber-600 text-white text-[11px]" },
    },
    { icon: "solar:gift-line-duotone", label: "Referrals", action: "referrals" },
  ],
  support: [
    { icon: "solar:download-line-duotone", label: "Download app", action: "download" },
    {
      icon: "solar:letter-unread-line-duotone",
      label: "What's new?",
      action: "whats-new",
      rightIcon: "solar:square-top-down-line-duotone",
    },
    {
      icon: "solar:question-circle-line-duotone",
      label: "Get help?",
      action: "help",
      rightIcon: "solar:square-top-down-line-duotone",
    },
  ],
  account: [
    {
      icon: "solar:users-group-rounded-bold-duotone",
      label: "Switch account",
      action: "switch",
      showAvatar: false,
    },
    { icon: "solar:logout-2-bold-duotone", label: "Log out", action: "logout" },
  ],
};

export type UserDropdownUser = {
  name: string;
  username: string;
  avatar?: string;
  initials: string;
  status: string;
};

export type UserDropdownProps = {
  user?: UserDropdownUser;
  onAction?: (action: string) => void;
  onStatusChange?: (status: string) => void;
  selectedStatus?: string;
  promoDiscount?: string;
  accounts?: unknown[];
  className?: string;
};

const DEFAULT_USER: UserDropdownUser = {
  name: "Ayman Echakar",
  username: "@aymanch-03",
  avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=96&h=96&fit=crop&crop=faces",
  initials: "AE",
  status: "online",
};

export function UserDropdown({
  user = DEFAULT_USER,
  onAction = () => {},
  onStatusChange,
  selectedStatus: controlledStatus,
  promoDiscount = "20% off",
  className,
}: UserDropdownProps) {
  const [internalStatus, setInternalStatus] = useState(controlledStatus ?? "online");
  const selectedStatus = controlledStatus ?? internalStatus;

  function handleStatusChange(value: string) {
    setInternalStatus(value);
    onStatusChange?.(value);
  }

  const renderMenuItem = (item: MenuItem, index: number) => (
    <DropdownMenuItem
      key={`${item.action}-${index}`}
      className={cn(
        item.badge || item.showAvatar || item.rightIcon ? "justify-between" : "",
        "cursor-pointer rounded-lg p-2",
      )}
      onClick={() => onAction(item.action)}
    >
      <span className="flex items-center gap-1.5 font-medium">
        <Icon
          icon={item.icon}
          className={`size-5 ${item.iconClass || "text-muted-foreground"}`}
        />
        {item.label}
      </span>
      {item.badge ? (
        <Badge className={item.badge.className}>{promoDiscount || item.badge.text}</Badge>
      ) : null}
      {item.rightIcon ? (
        <Icon icon={item.rightIcon} className="size-4 text-muted-foreground" />
      ) : null}
      {item.showAvatar ? (
        <Avatar className="size-6 cursor-pointer border border-border shadow">
          <AvatarImage src={user.avatar} alt={user.name} />
          <AvatarFallback>{user.initials}</AvatarFallback>
        </Avatar>
      ) : null}
    </DropdownMenuItem>
  );

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      online:
        "text-green-700 bg-green-100 border-green-300 dark:text-green-400 dark:bg-green-900/30 dark:border-green-500/50",
      offline:
        "text-muted-foreground bg-muted border-border dark:text-muted-foreground dark:bg-muted dark:border-border",
      busy: "text-red-700 bg-red-100 border-red-300 dark:text-red-400 dark:bg-red-900/30 dark:border-red-500/50",
      focus:
        "text-amber-800 bg-amber-100 border-amber-300 dark:text-amber-300 dark:bg-amber-900/30 dark:border-amber-500/50",
    };
    return colors[status.toLowerCase()] || colors.online;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring",
            className,
          )}
          aria-label="Open account menu"
        >
          <Avatar className="size-10 cursor-pointer border border-border">
            <AvatarImage src={user.avatar} alt={user.name} />
            <AvatarFallback>{user.initials}</AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="no-scrollbar w-[310px] rounded-2xl border-border bg-muted p-0"
        align="end"
      >
        <section className="rounded-2xl border border-border bg-card p-1 shadow-sm">
          <div className="flex items-center p-2">
            <div className="flex flex-1 items-center gap-2">
              <Avatar className="size-10 border border-border">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback>{user.initials}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <h3 className="truncate text-sm font-semibold text-foreground">{user.name}</h3>
                <p className="truncate text-xs text-muted-foreground">{user.username}</p>
              </div>
            </div>
            <Badge
              className={`${getStatusColor(user.status)} rounded-sm border-[0.5px] text-[11px] capitalize`}
            >
              {user.status}
            </Badge>
          </div>

          <DropdownMenuGroup>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="cursor-pointer rounded-lg p-2">
                <span className="flex items-center gap-1.5 font-medium text-muted-foreground">
                  <Icon
                    icon="solar:smile-circle-line-duotone"
                    className="size-5 text-muted-foreground"
                  />
                  Update status
                </span>
              </DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent className="border-border bg-card backdrop-blur-lg">
                  <DropdownMenuRadioGroup
                    value={selectedStatus}
                    onValueChange={handleStatusChange}
                  >
                    {MENU_ITEMS.status.map((status) => (
                      <DropdownMenuRadioItem className="gap-2" key={status.value} value={status.value}>
                        <Icon icon={status.icon} className="size-5 text-muted-foreground" />
                        {status.label}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>
          </DropdownMenuGroup>

          <DropdownMenuSeparator />
          <DropdownMenuGroup>{MENU_ITEMS.profile.map(renderMenuItem)}</DropdownMenuGroup>

          <DropdownMenuSeparator />
          <DropdownMenuGroup>{MENU_ITEMS.premium.map(renderMenuItem)}</DropdownMenuGroup>

          <DropdownMenuSeparator />
          <DropdownMenuGroup>{MENU_ITEMS.support.map(renderMenuItem)}</DropdownMenuGroup>
        </section>

        <section className="mt-1 rounded-2xl p-1">
          <DropdownMenuGroup>{MENU_ITEMS.account.map(renderMenuItem)}</DropdownMenuGroup>
        </section>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default UserDropdown;
