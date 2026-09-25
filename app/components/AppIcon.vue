<script setup lang="ts">
import {
  ArrowLeft, BadgePercent, Bot, CalendarDays, Check, ChevronLeft, CircleCheck, CircleX, Copy, Download, History,
  LayoutDashboard, LayoutGrid, LoaderCircle, LogOut, Mail, MapIcon, Megaphone, Menu, MessageSquareHeart, Package,
  PenLine, Plug, Receipt, RefreshCw, ScanSearch, Search, Send, Settings, ShieldCheck, ShoppingCart, Sparkles, Star,
  Store, TrendingUp, Users, Wallet, WandSparkles, X, Zap,
} from 'lucide-vue-next'

const ICONS = {
  ArrowLeft, BadgePercent, Bot, CalendarDays, Check, ChevronLeft, CircleCheck, CircleX, Copy, Download, History,
  LayoutDashboard, LayoutGrid, Loader: LoaderCircle, LogOut, Mail, Map: MapIcon, Megaphone, Menu, MessageSquareHeart,
  Package, PenLine, Plug, Receipt, RefreshCw, ScanSearch, Search, Send, Settings, ShieldCheck, ShoppingCart, Sparkles,
  Star, Store, TrendingUp, Users, Wallet, WandSparkles, X, Zap,
}

const props = withDefaults(defineProps<{ name: string; size?: number; spin?: boolean }>(), { size: 20 })
const cmp = computed(() => ICONS[props.name as keyof typeof ICONS] ?? Sparkles)
</script>

<template>
  <component :is="cmp" :size="size" :stroke-width="1.9" :class="spin && 'animate-spin'" aria-hidden="true" />
</template>
