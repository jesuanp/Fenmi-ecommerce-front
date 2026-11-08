import React from 'react';
import {
  LayoutDashboard, Boxes, Package, Shapes, Tags, Warehouse, ShoppingBag,
  RotateCcw, Wallet, UsersRound, TicketPercent, Star, Settings2,
  Store, Image, PanelsTopLeft, CreditCard, Truck, FileText, PanelBottom,
  Share2, Search, ClipboardList, CircleHelp, TrendingUp, Clock3,
  PackageCheck, AlertTriangle, UserRound, BadgeCheck, ArrowRight,
  BarChart3, ReceiptText, ShoppingCart
} from 'lucide-react';

const icons = {
  dashboard: LayoutDashboard,
  catalog: Boxes,
  package: Package,
  categories: Shapes,
  tags: Tags,
  inventory: Warehouse,
  orders: ShoppingBag,
  returns: RotateCcw,
  refunds: Wallet,
  customers: UsersRound,
  coupons: TicketPercent,
  reviews: Star,
  settings: Settings2,
  store: Store,
  image: Image,
  panels: PanelsTopLeft,
  'credit-card': CreditCard,
  truck: Truck,
  'file-text': FileText,
  'panel-bottom': PanelBottom,
  share: Share2,
  search: Search,
  audit: ClipboardList,
  help: CircleHelp,
  growth: TrendingUp,
  pending: Clock3,
  delivered: PackageCheck,
  warning: AlertTriangle,
  user: UserRound,
  'badge-check': BadgeCheck,
  arrow: ArrowRight,
  chart: BarChart3,
  receipt: ReceiptText,
  cart: ShoppingCart
};

export default function AdminIcon({ name, size = 18, ...props }) {
  const Icon = icons[name] || CircleHelp;
  return <Icon size={size} strokeWidth={1.9} aria-hidden="true" {...props} />;
}
