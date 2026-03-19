<script setup lang="ts">
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { useUserStore } from "@/stores/user";
import {
  Heart,
  CheckCircle2,
  Clock,
  Sparkles,
  ChevronRight,
  Gift,
} from "lucide-vue-next";

definePageMeta({
  middleware: ["auth"],
});

const userStore = useUserStore();
const { user } = storeToRefs(userStore);

// TODO: заменить на реальные данные из API
const subscription = {
  active: true,
  month: "Апрель 2026",
  tariff: "Премиум +",
  items: [
    "Шоколадка",
    "Вечер настольных игр",
    "Выходные обнимашек",
    "Массаж спинки",
    "Совместный просмотр",
  ],
};

const wishlist = [
  { id: 1, title: "Шоколадка", cost: 10, done: false },
  { id: 2, title: "Вечер настольных игр", cost: 30, done: true },
  { id: 3, title: "Массаж спинки", cost: 50, done: false },
  { id: 4, title: "Совместный просмотр", cost: 20, done: false },
];

const activities = [
  {
    id: 1,
    text: "Хотелка «Вечер настольных игр» выполнена",
    time: "2 часа назад",
    icon: "✅",
  },
  {
    id: 2,
    text: "Добавлена новая хотелка «Массаж спинки»",
    time: "вчера",
    icon: "💜",
  },
  {
    id: 3,
    text: "Подписка на апрель активирована",
    time: "3 дня назад",
    icon: "🎉",
  },
];

const completedCount = computed(() => wishlist.filter((w) => w.done).length);
const totalCount = computed(() => wishlist.length);
const progressPercent = computed(() =>
  Math.round((completedCount.value / totalCount.value) * 100),
);
</script>

<template>
  <div class="max-w-3xl mx-auto px-4 py-8 flex flex-col gap-6">
    <!-- Greeting -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold tracking-tight text-foreground">
          Привет, {{ user?.firstName ?? "дорогой" }} 👋
        </h1>
        <p class="text-sm text-muted-foreground mt-0.5">
          Вот что происходит у вас с парой
        </p>
      </div>
      <div
        class="w-10 h-10 rounded-2xl bg-primary/15 flex items-center justify-center text-xl"
      >
        💜
      </div>
    </div>

    <!-- Subscription status -->
    <Card class="border-border/60 overflow-hidden">
      <div class="h-1 bg-gradient-to-r from-primary via-accent to-primary/40" />
      <CardContent class="px-5 py-4">
        <div class="flex items-start justify-between gap-4">
          <div class="flex items-center gap-3">
            <div
              class="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0"
            >
              <Sparkles class="w-5 h-5 text-primary" />
            </div>
            <div>
              <div class="flex items-center gap-2">
                <p class="text-sm font-semibold text-foreground">
                  Подписка на {{ subscription.month }}
                </p>
                <Badge
                  class="text-[10px] px-2 py-0"
                  :class="
                    subscription.active
                      ? 'bg-green-500/15 text-green-600 border-green-500/25'
                      : 'bg-destructive/15 text-destructive border-destructive/25'
                  "
                >
                  {{ subscription.active ? "Активна" : "Неактивна" }}
                </Badge>
              </div>
              <p class="text-xs text-muted-foreground mt-0.5">
                Тариф «{{ subscription.tariff }}»
              </p>
            </div>
          </div>
          <NuxtLink to="/subscription">
            <Button
              variant="ghost"
              size="sm"
              class="text-xs text-muted-foreground shrink-0 gap-1"
            >
              Подробнее <ChevronRight class="w-3 h-3" />
            </Button>
          </NuxtLink>
        </div>

        <Separator class="my-3" />

        <div class="flex flex-wrap gap-2">
          <div
            v-for="item in subscription.items"
            :key="item"
            class="flex items-center gap-1.5 text-xs bg-background border border-border/50 rounded-lg px-2.5 py-1.5"
          >
            <Gift class="w-3 h-3 text-primary" />
            {{ item }}
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Wishlist progress -->
    <Card class="border-border/60">
      <CardHeader class="pb-2 px-5 pt-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <Heart class="w-4 h-4 text-primary" />
            <p class="text-sm font-semibold text-foreground">
              Активные хотелки
            </p>
          </div>
          <span class="text-xs text-muted-foreground">
            {{ completedCount }} / {{ totalCount }} выполнено
          </span>
        </div>

        <!-- Progress bar -->
        <div class="mt-3 h-1.5 rounded-full bg-border/50 overflow-hidden">
          <div
            class="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
            :style="{ width: `${progressPercent}%` }"
          />
        </div>
      </CardHeader>

      <CardContent class="px-5 pb-4 flex flex-col gap-2">
        <div
          v-for="item in wishlist"
          :key="item.id"
          class="flex items-center justify-between py-2 px-3 rounded-xl border transition-all duration-200"
          :class="
            item.done
              ? 'bg-muted/40 border-border/30 opacity-60'
              : 'bg-background border-border/50 hover:border-primary/40'
          "
        >
          <div class="flex items-center gap-2.5">
            <CheckCircle2
              class="w-4 h-4 shrink-0"
              :class="item.done ? 'text-green-500' : 'text-border'"
            />
            <span
              class="text-sm font-medium"
              :class="
                item.done
                  ? 'line-through text-muted-foreground'
                  : 'text-foreground'
              "
            >
              {{ item.title }}
            </span>
          </div>
          <div class="flex items-center gap-1 text-xs text-muted-foreground">
            <span>{{ item.cost }}</span>
            <span>🪙</span>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Recent activity -->
    <Card class="border-border/60">
      <CardHeader class="pb-2 px-5 pt-4">
        <div class="flex items-center gap-2">
          <Clock class="w-4 h-4 text-primary" />
          <p class="text-sm font-semibold text-foreground">
            Последние активности
          </p>
        </div>
      </CardHeader>
      <CardContent class="px-5 pb-4 flex flex-col gap-1">
        <div v-for="(activity, index) in activities" :key="activity.id">
          <div class="flex items-center gap-3 py-2">
            <span class="text-base w-7 text-center shrink-0">{{
              activity.icon
            }}</span>
            <div class="flex-1 min-w-0">
              <p class="text-sm text-foreground truncate">
                {{ activity.text }}
              </p>
              <p class="text-[11px] text-muted-foreground mt-0.5">
                {{ activity.time }}
              </p>
            </div>
          </div>
          <Separator v-if="index < activities.length - 1" class="opacity-50" />
        </div>
      </CardContent>
    </Card>
  </div>
</template>
