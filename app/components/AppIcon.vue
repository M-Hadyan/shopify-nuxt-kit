<script setup lang="ts">
import {
  ArrowLeft, ArrowUpLeft, BadgePercent, Bell, Bot, Brain, CalendarDays, ChartLine, Check, ChevronDown, ChevronLeft, CircleCheck, CircleHelp, ClipboardList,
  Code, Copy, Crown, DoorOpen, Download, FileText, Film, FlaskConical, FolderPlus, Gift, Handshake, History, Image, Landmark,
  Layers, LayoutGrid, Lightbulb, LoaderCircle, Lock, LogOut, Magnet, Mail, MailOpen, MapIcon, Megaphone, Menu,
  MessageSquare, Mic, MousePointerClick, Network, PanelTop, PenLine, Plug, Presentation, Radar, RefreshCw, Repeat,
  Rocket, Scale, ScanSearch, Search, Settings, Settings2, Share2, ShieldCheck, Smartphone, Sparkles, SpellCheck, Star,
  Store, Swords, Tag, Target, Ticket, UserMinus, UserPlus, UsersRound, WandSparkles, Waypoints, Wrench, X, Zap,
} from 'lucide-vue-next'

const ICONS = {
  ArrowLeft, ArrowUpLeft, BadgePercent, Bell, Bot, Brain, CalendarDays, ChartLine, Check, ChevronDown, ChevronLeft, CircleCheck, CircleHelp, ClipboardList,
  Code, Copy, Crown, DoorOpen, Download, FileText, Film, FlaskConical, FolderPlus, Gift, Handshake, History, Image, Landmark,
  Layers, LayoutGrid, Lightbulb, Loader: LoaderCircle, Lock, LogOut, Magnet, Mail, MailOpen, Map: MapIcon, Megaphone, Menu,
  MessageSquare, Mic, MousePointerClick, Network, PanelTop, PenLine, Plug, Presentation, Radar, RefreshCw, Repeat,
  Rocket, Scale, ScanSearch, Search, Settings, Settings2, Share2, ShieldCheck, Smartphone, Sparkles, SpellCheck, Star,
  Store, Swords, Tag, Target, Ticket, UserMinus, UserPlus, UsersRound, WandSparkles, Waypoints, Wrench, X, Zap,
}

const props = withDefaults(defineProps<{ name: string; size?: number; spin?: boolean }>(), { size: 20 })
const cmp = computed(() => ICONS[props.name as keyof typeof ICONS] ?? Sparkles)
</script>

<template>
  <component :is="cmp" :size="size" :stroke-width="1.9" :class="spin && 'animate-spin'" aria-hidden="true" />
</template>
