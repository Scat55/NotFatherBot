<script setup lang="ts">
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-vue-next";

definePageMeta({
  middleware: ["auth"],
});

const config = useRuntimeConfig();
const token = useCookie("token");

const headers = computed(() => ({
  Authorization: `Bearer ${token.value}`,
}));

// Берём первую пару
const { data: couples } = await useFetch<any[]>(
  `${config.public.apiBase}/couples`,
  { headers },
);
const firstCouple = computed(() => couples.value?.[0] ?? null);

// Загружаем все циклы пары
const { data: cycles } = await useFetch<any[]>(
  () =>
    firstCouple.value
      ? `${config.public.apiBase}/couples/${firstCouple.value.id}/cycles`
      : null,
  { headers, watch: [firstCouple] },
);

// Прошлые циклы — все кроме активного
const history = computed(() => cycles.value?.filter((c) => !c.isActive) ?? []);

const formatMonth = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString("ru-RU", {
    month: "long",
    year: "numeric",
  });

const completedOf = (cycle: any) =>
  cycle.entries?.filter((e: any) => e.done).length ?? 0;

const totalOf = (cycle: any) => cycle.entries?.length ?? 0;

const earnedOf = (cycle: any) =>
  cycle.entries
    ?.filter((e: any) => e.done)
    .reduce((sum: number, e: any) => sum + e.cost, 0) ?? 0;
</script>

<template>
  <div class="max-w-2xl mx-auto px-4 py-8 flex flex-col gap-6">
    <div class="flex items-center gap-3">
      <button
        class="p-2 rounded-xl hover:bg-muted transition-colors"
        @click="navigateTo('/subscription')"
      >
        <ArrowLeft class="w-4 h-4 text-muted-foreground" />
      </button>
      <div>
        <h1 class="text-2xl font-bold tracking-tight text-foreground">
          История
        </h1>
        <p class="text-sm text-muted-foreground mt-0.5">Архив прошлых циклов</p>
      </div>
    </div>

    <!-- No couple -->
    <div v-if="!firstCouple" class="text-center py-12">
      <p class="text-sm text-muted-foreground">Нет активной пары</p>
    </div>

    <!-- Empty history -->
    <div
      v-else-if="!history.length"
      class="text-center py-12 flex flex-col items-center gap-2"
    >
      <span class="text-4xl">📭</span>
      <p class="text-base font-semibold text-foreground">История пуста</p>
      <p class="text-sm text-muted-foreground">
        Прошлые циклы будут отображаться здесь
      </p>
    </div>

    <!-- History list -->
    <div v-else class="flex flex-col gap-3">
      <Card v-for="cycle in history" :key="cycle.id" class="border-border/60">
        <CardContent class="px-5 py-4">
          <div class="flex items-center justify-between gap-3">
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <p class="text-sm font-semibold text-foreground capitalize">
                  {{ formatMonth(cycle.startDate) }}
                </p>
                <Badge variant="secondary" class="text-[10px] px-2 py-0">
                  {{ cycle.cycleLength }} дней
                </Badge>
              </div>

              <div
                class="mt-2 h-1.5 rounded-full bg-border/50 overflow-hidden w-full"
              >
                <div
                  class="h-full rounded-full bg-gradient-to-r from-primary to-accent"
                  :style="{
                    width:
                      totalOf(cycle) > 0
                        ? `${Math.round((completedOf(cycle) / totalOf(cycle)) * 100)}%`
                        : '0%',
                  }"
                />
              </div>

              <div
                class="flex items-center gap-3 mt-2 text-xs text-muted-foreground"
              >
                <span
                  >{{ completedOf(cycle) }}/{{ totalOf(cycle) }} выполнено</span
                >
                <span>·</span>
                <span>{{ earnedOf(cycle) }} 🪙 заработано</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
