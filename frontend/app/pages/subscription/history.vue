<script setup lang="ts">
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, CheckCircle2, Circle } from "lucide-vue-next";

definePageMeta({
  middleware: ["auth"],
});

// TODO: заменить на реальные данные из API
const history = [
  {
    id: 1,
    month: "Март 2026",
    tariff: "Премиум +",
    completed: 4,
    total: 5,
    earnedCoins: 110,
    active: false,
  },
  {
    id: 2,
    month: "Февраль 2026",
    tariff: "Базовый",
    completed: 3,
    total: 3,
    earnedCoins: 60,
    active: false,
  },
  {
    id: 3,
    month: "Январь 2026",
    tariff: "Премиум +",
    completed: 2,
    total: 5,
    earnedCoins: 40,
    active: false,
  },
];
</script>

<template>
  <div class="max-w-2xl mx-auto px-4 py-8 flex flex-col gap-6">
    <div>
      <h1 class="text-2xl font-bold tracking-tight text-foreground">
        История подписок
      </h1>
      <p class="text-sm text-muted-foreground mt-0.5">Архив прошлых месяцев</p>
    </div>

    <div class="flex flex-col gap-3">
      <NuxtLink
        v-for="item in history"
        :key="item.id"
        :to="`/subscription/history/${item.id}`"
      >
        <Card
          class="border-border/60 hover:border-primary/40 transition-all duration-200 cursor-pointer group"
        >
          <CardContent class="px-5 py-4">
            <div class="flex items-center justify-between gap-3">
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 flex-wrap">
                  <p class="text-sm font-semibold text-foreground">
                    {{ item.month }}
                  </p>
                  <Badge variant="secondary" class="text-[10px] px-2 py-0">
                    {{ item.tariff }}
                  </Badge>
                </div>

                <!-- Progress bar -->
                <div
                  class="mt-2 h-1.5 rounded-full bg-border/50 overflow-hidden w-full"
                >
                  <div
                    class="h-full rounded-full bg-gradient-to-r from-primary to-accent"
                    :style="{
                      width: `${Math.round((item.completed / item.total) * 100)}%`,
                    }"
                  />
                </div>

                <div
                  class="flex items-center gap-3 mt-2 text-xs text-muted-foreground"
                >
                  <span>{{ item.completed }}/{{ item.total }} выполнено</span>
                  <span>·</span>
                  <span>{{ item.earnedCoins }} 🪙 заработано</span>
                </div>
              </div>

              <ChevronRight
                class="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0"
              />
            </div>
          </CardContent>
        </Card>
      </NuxtLink>
    </div>
  </div>
</template>
