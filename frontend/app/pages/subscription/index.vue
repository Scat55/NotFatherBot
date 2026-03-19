<script setup lang="ts">
import { toast } from "vue-sonner";
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
  Calendar,
} from "lucide-vue-next";

definePageMeta({
  middleware: ["auth"],
});

const config = useRuntimeConfig();
const token = useCookie("token");

const headers = computed(() => ({
  Authorization: `Bearer ${token.value}`,
}));

// Загружаем пары
const { data: couples } = await useFetch<any[]>(
  `${config.public.apiBase}/couples`,
  { headers },
);

const firstCouple = computed(() => couples.value?.[0] ?? null);

// Загружаем активный цикл первой пары
const { data: cycle, refresh: refreshCycle } = await useFetch<any>(
  () =>
    firstCouple.value
      ? `${config.public.apiBase}/couples/${firstCouple.value.id}/cycles/active`
      : null,
  { headers, watch: [firstCouple] },
);

// Определяем роль
const { data: userMe } = await useFetch<{ id: number }>(
  `${config.public.apiBase}/users/me`,
  { headers },
);
const isCreator = computed(
  () => firstCouple.value?.creatorId === userMe.value?.id,
);

const creating = ref(false);

async function createCycle() {
  if (!firstCouple.value) return;
  creating.value = true;
  try {
    await $fetch(
      `${config.public.apiBase}/couples/${firstCouple.value.id}/cycles`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token.value}` },
      },
    );
    await refreshCycle();
    toast.success("Новый цикл запущен 🎉");
  } catch (e: any) {
    toast.error(e?.data?.message ?? "Не удалось создать цикл");
  } finally {
    creating.value = false;
  }
}

async function toggleEntry(entryId: number, done: boolean, cost: number) {
  if (!firstCouple.value || !cycle.value) return;
  try {
    await $fetch(
      `${config.public.apiBase}/couples/${firstCouple.value.id}/cycles/${cycle.value.id}/entries/${entryId}`,
      {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token.value}` },
        body: { done },
      },
    );
    await refreshCycle();
    if (done) toast.success(`+${cost} 🪙 за выполнение!`);
  } catch (e: any) {
    const msg = e?.data?.message;
    if (msg === "Only partner can mark entries as done") {
      toast.error("Отмечать выполненными может только партнёр");
    } else {
      toast.error("Не удалось обновить");
    }
  }
}

const entries = computed(() => cycle.value?.entries ?? []);
const completedCount = computed(
  () => entries.value.filter((e: any) => e.done).length,
);
const totalCount = computed(() => entries.value.length);
const earnedCoins = computed(() =>
  entries.value
    .filter((e: any) => e.done)
    .reduce((sum: number, e: any) => sum + e.cost, 0),
);
const totalCost = computed(() =>
  entries.value.reduce((sum: number, e: any) => sum + e.cost, 0),
);
const progressPercent = computed(() =>
  totalCount.value > 0
    ? Math.round((completedCount.value / totalCount.value) * 100)
    : 0,
);

const cycleMonth = computed(() => {
  if (!cycle.value?.startDate) return "—";
  return new Date(cycle.value.startDate).toLocaleDateString("ru-RU", {
    month: "long",
    year: "numeric",
  });
});

const cycleCreatedAt = computed(() => {
  if (!cycle.value?.createdAt) return "—";
  return new Date(cycle.value.createdAt).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
});
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
      <Button
        v-if="isCreator"
        class="gap-2"
        size="sm"
        :disabled="creating"
        @click="createCycle"
      >
        <Plus class="w-4 h-4" />
        Новый цикл
      </Button>
    </div>

    <!-- No couple -->
    <Card v-if="!firstCouple" class="border-border/60">
      <CardContent
        class="px-5 py-8 flex flex-col items-center gap-3 text-center"
      >
        <span class="text-4xl">💜</span>
        <p class="text-base font-semibold text-foreground">Нет активной пары</p>
        <p class="text-sm text-muted-foreground">Создай пару чтобы начать</p>
        <NuxtLink to="/couples">
          <Button size="sm" class="mt-1">Создать пару</Button>
        </NuxtLink>
      </CardContent>
    </Card>

    <!-- No active cycle -->
    <Card v-else-if="!cycle" class="border-border/60">
      <CardContent
        class="px-5 py-8 flex flex-col items-center gap-3 text-center"
      >
        <span class="text-4xl">🗓️</span>
        <p class="text-base font-semibold text-foreground">
          Нет активного цикла
        </p>
        <p class="text-sm text-muted-foreground">
          {{
            isCreator
              ? "Запусти новый цикл чтобы начать подписку"
              : "Попроси партнёра запустить цикл"
          }}
        </p>
        <Button
          v-if="isCreator"
          size="sm"
          class="mt-1 gap-2"
          :disabled="creating"
          @click="createCycle"
        >
          <Plus class="w-4 h-4" />
          Запустить цикл
        </Button>
      </CardContent>
    </Card>

    <!-- Active cycle -->
    <Card v-else class="border-border/60 overflow-hidden">
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
                <p class="text-base font-semibold text-foreground capitalize">
                  {{ cycleMonth }}
                </p>
                <Badge
                  class="text-[10px] px-2 py-0 bg-green-500/15 text-green-600 border-green-500/25"
                >
                  Активен
                </Badge>
              </div>
              <div class="flex items-center gap-1.5 mt-0.5">
                <Calendar class="w-3 h-3 text-muted-foreground" />
                <p class="text-xs text-muted-foreground">
                  Создан {{ cycleCreatedAt }}
                </p>
              </div>
            </div>
          </div>
          <Badge variant="secondary" class="shrink-0 text-xs">
            {{ cycle.cycleLength }} дней
          </Badge>
        </div>
      </CardHeader>

      <CardContent class="px-5 py-4 flex flex-col gap-4">
        <!-- Stats -->
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

        <!-- Entries list -->
        <div class="flex flex-col gap-2">
          <p
            class="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1"
          >
            Список хотелок
          </p>

          <div v-if="!entries.length" class="text-center py-4">
            <p class="text-sm text-muted-foreground">
              В этом цикле нет хотелок
            </p>
          </div>

          <button
            v-for="entry in entries"
            :key="entry.id"
            class="flex items-center justify-between py-2.5 px-3 rounded-xl border transition-all duration-200 w-full text-left"
            :class="
              entry.done
                ? 'bg-muted/30 border-border/30 opacity-70'
                : 'bg-background border-border/50 hover:border-primary/40'
            "
            @click="toggleEntry(entry.id, !entry.done, entry.cost)"
          >
            <div class="flex items-center gap-2.5 min-w-0">
              <CheckCircle2
                v-if="entry.done"
                class="w-4 h-4 text-green-500 shrink-0"
              />
              <Circle v-else class="w-4 h-4 text-border shrink-0" />
              <p
                class="text-sm font-medium truncate"
                :class="
                  entry.done
                    ? 'line-through text-muted-foreground'
                    : 'text-foreground'
                "
              >
                {{ entry.wishText }}
              </p>
            </div>
            <div
              class="flex items-center gap-1 text-xs text-muted-foreground shrink-0 ml-2"
            >
              <span class="font-medium">{{ entry.cost }}</span>
              <span>🪙</span>
            </div>
          </button>
        </div>
      </CardContent>
    </Card>

    <!-- Navigation -->
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
