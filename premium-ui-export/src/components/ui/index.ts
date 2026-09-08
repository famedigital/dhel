/**
 * Premium UI kit — barrel exports for portable reuse.
 * Import from `@/components/ui` or copy `premium-ui-export/` into another project.
 */

// Primitives (shadcn)
export { Alert, alertVariants } from "./alert";
export { Avatar, AvatarImage, AvatarFallback } from "./avatar";
export { Badge, badgeVariants, type BadgeProps } from "./badge";
export { Button, buttonVariants, type ButtonProps } from "./button";
export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
} from "./card";
export { Checkbox } from "./checkbox";
export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
} from "./dropdown-menu";
export { Input, type InputProps } from "./input";
export { Label } from "./label";
export { ScrollArea, ScrollBar } from "./scroll-area";
export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
} from "./select";
export { Separator } from "./separator";
export { Skeleton } from "./skeleton";
export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
} from "./table";
export { Tabs, TabsList, TabsTrigger, TabsContent } from "./tabs";
export { Textarea } from "./textarea";

// Premium chat
export { PromptInput, type PromptInputProps } from "./ai-chat-input";
export { AiChatLanding, type AiChatLandingProps } from "./ai-chat-landing";
export {
  ChatBubble,
  ChatBubbleMessage,
  ChatBubbleAvatar,
  ChatBubbleAction,
  ChatBubbleActionWrapper,
} from "./chat-bubble";
export { MessageLoading } from "./message-loading";

// Layout & navigation
export {
  SidebarProvider,
  Sidebar,
  SidebarBody,
  DesktopSidebar,
  MobileSidebar,
  SidebarLink,
  useSidebar,
} from "./sidebar";
export {
  UserDropdown,
  type UserDropdownUser,
  type UserDropdownProps,
} from "./user-dropdown";
export {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
} from "./breadcrumb";
export { DayCellTabs, DayCellTabsContent } from "./tabs-in-cell-for-navigation";

// Visual / interaction
export { DotPattern } from "./dot-pattern";
export { MenuBar, type MenuBarProps, type MenuBarItem, type DefaultMenuKey } from "./animated-menu-bar";
export { CircularCommandMenu, type CircularCommandMenuProps, type CommandItem } from "./circular-command-menu";
export {
  CreateMenu,
  type CreateMenuProps,
  type CreateMenuItem,
} from "./be-ui-create-menu";
export { default as Footer } from "./footer";
export { ExpandableText } from "./expandable-text";
export { EmptyState } from "./empty-state";
export { default as Autocomplete } from "./reui-autocomplete";

// Demos (preview / Storybook-style)
export { SidebarDemo, Logo, LogoIcon } from "./sidebar-demo";
export {
  ChatBubbleVariants,
  ChatBubbleAiLayout,
  ChatBubbleStates,
} from "./chat-bubble-demo";
export { DotPatternDemo } from "./dot-pattern-demo";
