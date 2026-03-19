<script setup lang="ts">
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  Plus,
  CheckCircle2,
  Circle,
  History,
  MessageSquareText,
  ChevronRight,
  Gift,
  Calendar,
} from "lucide-vue-next";

definePageMeta({
  middleware: ["auth"],
});

// TODO: заменить на реальные данные из API
const subscription = ref({
  active: true,
  month: "Апрель 2026",
  tariff: "Премиум +",
  createdAt: "1 апреля 2026",
  items: [
    { id: 1, title: "Шоколадка", cost: 10, done: true, dueDate: "07.04.2026" },
    {
      id: 2,
      title: "Вечер настольных игр",
      cost: 30,
      done: true,
      dueDate: "07.04.2026",
    },
    {
      id: 3,
      title: "Выходные обнимашек и целовашек",
      cost: 50,
      done: false,
      dueDate: "14.04.2026",
    },
    {
      id: 4,
      title: "Массаж спинки",
      cost: 40,
      done: false,
      dueDate: "14.04.2026",
    },
    {
      id: 5,
      title: "Совместный просмотр чего-то интересного",
      cost: 20,
      done: false,
      dueDate: "21.04.2026",
    },
  ],
});

const completedCount = computed(
  () => subscription.value.items.filter((i) => i.done).length,
);
const totalCount = computed(() => subscription.value.items.length);
const totalCost = computed(() =>
  subscription.value.items.reduce((sum, i) => sum + i.cost, 0),
);
const earnedCoins = computed(() =>
  subscription.value.items
    .filter((i) => i.done)
    .reduce((sum, i) => sum + i.cost, 0),
);
const progressPercent = computed(() =>
  Math.round((completedCount.value / totalCount.value) * 100),
);
</script>

<template>
  <div class="max-w-2xl mx-auto px-4 py-8 flex flex-col gap-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold tracking-tight text-foreground">
          Подписка
        </h1>
        <p class="text-sm text-muted-foreground mt-0.5">
          Управление текущим месяцем
        </p>
      </div>
      <Button class="gap-2" size="sm">
        <Plus class="w-4 h-4" />
        Новая подписка
      </Button>
    </div>

    <!-- Current subscription -->
    <Card class="border-border/60 overflow-hidden">
      <div class="h-1 bg-gradient-to-r from-primary via-accent to-primary/40" />
      <CardHeader class="px-5 pt-4 pb-0">
        <div class="flex items-start justify-between gap-3">
          <div class="flex items-center gap-3">
            <div
              class="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0"
            >
              <Sparkles class="w-5 h-5 text-primary" />
            </div>
            <div>
              <div class="flex items-center gap-2 flex-wrap">
                <p class="text-base font-semibold text-foreground">
                  {{ subscription.month }}
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
              <div class="flex items-center gap-1.5 mt-0.5">
                <Calendar class="w-3 h-3 text-muted-foreground" />
                <p class="text-xs text-muted-foreground">
                  Создана {{ subscription.createdAt }}
                </p>
              </div>
            </div>
          </div>
          <Badge variant="secondary" class="shrink-0 text-xs">
            {{ subscription.tariff }}
          </Badge>
        </div>
      </CardHeader>

      <CardContent class="px-5 py-4 flex flex-col gap-4">
        <!-- Stats row -->
        <div class="grid grid-cols-3 gap-3">
          <div
            class="flex flex-col items-center gap-0.5 py-3 rounded-xl bg-background border border-border/50"
          >
            <span class="text-lg font-bold text-foreground"
              >{{ completedCount }}/{{ totalCount }}</span
            >
            <span
              class="text-[10px] text-muted-foreground uppercase tracking-wider"
              >Выполнено</span
            >
          </div>
          <div
            class="flex flex-col items-center gap-0.5 py-3 rounded-xl bg-background border border-border/50"
          >
            <span class="text-lg font-bold text-foreground"
              >{{ earnedCoins }} 🪙</span
            >
            <span
              class="text-[10px] text-muted-foreground uppercase tracking-wider"
              >Заработано</span
            >
          </div>
          <div
            class="flex flex-col items-center gap-0.5 py-3 rounded-xl bg-background border border-border/50"
          >
            <span class="text-lg font-bold text-foreground"
              >{{ totalCost }} 🪙</span
            >
            <span
              class="text-[10px] text-muted-foreground uppercase tracking-wider"
              >Всего</span
            >
          </div>
        </div>

        <!-- Progress -->
        <div>
          <div
            class="flex justify-between text-xs text-muted-foreground mb-1.5"
          >
            <span>Прогресс</span>
            <span>{{ progressPercent }}%</span>
          </div>
          <div class="h-2 rounded-full bg-border/50 overflow-hidden">
            <div
              class="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
              :style="{ width: `${progressPercent}%` }"
            />
          </div>
        </div>

        <Separator />

        <!-- Items list -->
        <div class="flex flex-col gap-2">
          <p
            class="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1"
          >
            Список хотелок
          </p>
          <div
            v-for="item in subscription.items"
            :key="item.id"
            class="flex items-center justify-between py-2.5 px-3 rounded-xl border transition-all duration-200"
            :class="
              item.done
                ? 'bg-muted/30 border-border/30 opacity-70'
                : 'bg-background border-border/50 hover:border-primary/40'
            "
          >
            <div class="flex items-center gap-2.5 min-w-0">
              <CheckCircle2
                v-if="item.done"
                class="w-4 h-4 text-green-500 shrink-0"
              />
              <Circle v-else class="w-4 h-4 text-border shrink-0" />
              <div class="min-w-0">
                <p
                  class="text-sm font-medium truncate"
                  :class="
                    item.done
                      ? 'line-through text-muted-foreground'
                      : 'text-foreground'
                  "
                >
                  {{ item.title }}
                </p>
                <p class="text-[11px] text-muted-foreground mt-0.5">
                  до {{ item.dueDate }}
                </p>
              </div>
            </div>
            <div
              class="flex items-center gap-1 text-xs text-muted-foreground shrink-0 ml-2"
            >
              <span class="font-medium">{{ item.cost }}</span>
              <span>🪙</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Navigation cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <NuxtLink to="/subscription/history">
        <Card
          class="border-border/60 hover:border-primary/40 transition-all duration-200 cursor-pointer group"
        >
          <CardContent class="px-5 py-4 flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div
                class="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center"
              >
                <History class="w-4 h-4 text-primary" />
              </div>
              <div>
                <p class="text-sm font-semibold text-foreground">История</p>
                <p class="text-xs text-muted-foreground">Прошлые месяцы</p>
              </div>
            </div>
            <ChevronRight
              class="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors"
            />
          </CardContent>
        </Card>
      </NuxtLink>

      <NuxtLink to="/subscription/templates">
        <Card
          class="border-border/60 hover:border-primary/40 transition-all duration-200 cursor-pointer group"
        >
          <CardContent class="px-5 py-4 flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div
                class="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center"
              >
                <MessageSquareText class="w-4 h-4 text-primary" />
              </div>
              <div>
                <p class="text-sm font-semibold text-foreground">Шаблоны</p>
                <p class="text-xs text-muted-foreground">Сообщения для пары</p>
              </div>
            </div>
            <ChevronRight
              class="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors"
            />
          </CardContent>
        </Card>
      </NuxtLink>
    </div>
  </div>
</template>
