<script setup lang="ts">
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useUserStore } from "@/stores/user";
import {
  Heart,
  CheckCircle2,
  Clock,
  Sparkles,
  ChevronRight,
} from "lucide-vue-next";

definePageMeta({
  middleware: ["auth"],
});

const config = useRuntimeConfig();
const token = useCookie("token");
const userStore = useUserStore();
const { user } = storeToRefs(userStore);

const headers = computed(() => ({
  Authorization: `Bearer ${token.value}`,
}));

// Пары
const { data: couples } = await useFetch<any[]>(
  `${config.public.apiBase}/couples`,
  { headers },
);
const firstCouple = computed(() => couples.value?.[0] ?? null);

// Текущий пользователь
const { data: userMe } = await useFetch<{ id: number }>(
  `${config.public.apiBase}/users/me`,
  { headers },
);
const isCreator = computed(
  () => firstCouple.value?.creatorId === userMe.value?.id,
);
const partnerName = computed(() => {
  if (!firstCouple.value) return null;
  const partner = isCreator.value
    ? firstCouple.value.partner
    : firstCouple.value.creator;
  if (!partner) return "Партнёр";
  return (
    partner.username ||
    `${partner.firstName ?? ""} ${partner.lastName ?? ""}`.trim() ||
    "Партнёр"
  );
});

// Хотелки первой пары
const { data: wishes } = await useFetch<any[]>(
  () =>
    firstCouple.value
      ? `${config.public.apiBase}/couples/${firstCouple.value.id}/wishes`
      : null,
  { headers, watch: [firstCouple] },
);

// Активный цикл первой пары
const { data: cycle } = await useFetch<any>(
  () =>
    firstCouple.value
      ? `${config.public.apiBase}/couples/${firstCouple.value.id}/cycles/active`
      : null,
  { headers, watch: [firstCouple] },
);

const wishesCompletedCount = computed(
  () => wishes.value?.filter((w: any) => w.done).length ?? 0,
);
const wishesTotalCount = computed(() => wishes.value?.length ?? 0);
const wishesProgressPercent = computed(() =>
  wishesTotalCount.value > 0
    ? Math.round((wishesCompletedCount.value / wishesTotalCount.value) * 100)
    : 0,
);

const cycleEntries = computed(() => cycle.value?.entries ?? []);
const cycleCompleted = computed(
  () => cycleEntries.value.filter((e: any) => e.done).length,
);
const cycleTotal = computed(() => cycleEntries.value.length);
const cycleProgressPercent = computed(() =>
  cycleTotal.value > 0
    ? Math.round((cycleCompleted.value / cycleTotal.value) * 100)
    : 0,
);
const cycleMonth = computed(() => {
  if (!cycle.value?.startDate) return "—";
  return new Date(cycle.value.startDate).toLocaleDateString("ru-RU", {
    month: "long",
    year: "numeric",
  });
});
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
          {{
            firstCouple ? `Пара с ${partnerName}` : "Создай пару чтобы начать"
          }}
        </p>
      </div>
      <div
        class="w-10 h-10 rounded-2xl bg-primary/15 flex items-center justify-center text-xl"
      >
        💜
      </div>
    </div>

    <!-- No couple -->
    <Card v-if="!firstCouple" class="border-border/60">
      <CardContent
        class="px-5 py-8 flex flex-col items-center gap-3 text-center"
      >
        <span class="text-4xl">💜</span>
        <p class="text-base font-semibold text-foreground">Нет активной пары</p>
        <p class="text-sm text-muted-foreground">
          Создай пару и пригласи партнёра чтобы начать
        </p>
        <NuxtLink to="/couples">
          <Button size="sm" class="mt-1">Создать пару</Button>
        </NuxtLink>
      </CardContent>
    </Card>

    <template v-else>
      <!-- Subscription / active cycle -->
      <Card class="border-border/60 overflow-hidden">
        <div
          class="h-1 bg-gradient-to-r from-primary via-accent to-primary/40"
        />
        <CardContent class="px-5 py-4">
          <div class="flex items-start justify-between gap-4">
            <div class="flex items-center gap-3">
              <div
                class="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0"
              >
                <Sparkles class="w-5 h-5 text-primary" />
              </div>
              <div>
                <div class="flex items-center gap-2 flex-wrap">
                  <p class="text-sm font-semibold text-foreground">
                    {{ cycle ? `Цикл — ${cycleMonth}` : "Подписка" }}
                  </p>
                  <Badge
                    v-if="cycle"
                    class="text-[10px] px-2 py-0 bg-green-500/15 text-green-600 border-green-500/25"
                  >
                    Активен
                  </Badge>
                  <Badge
                    v-else
                    class="text-[10px] px-2 py-0 bg-muted text-muted-foreground border-border"
                  >
                    Нет цикла
                  </Badge>
                </div>
                <p class="text-xs text-muted-foreground mt-0.5">
                  {{
                    cycle
                      ? `${cycleCompleted} из ${cycleTotal} выполнено · ${cycle.cycleLength} дней`
                      : isCreator
                        ? "Запусти цикл на странице подписки"
                        : "Ожидай запуска цикла от партнёра"
                  }}
                </p>
              </div>
            </div>
            <NuxtLink to="/subscription">
              <Button
                variant="ghost"
                size="sm"
                class="text-xs text-muted-foreground shrink-0 gap-1"
              >
                Перейти <ChevronRight class="w-3 h-3" />
              </Button>
            </NuxtLink>
          </div>

          <!-- Cycle progress bar -->
          <div
            v-if="cycle"
            class="mt-3 h-1.5 rounded-full bg-border/50 overflow-hidden"
          >
            <div
              class="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
              :style="{ width: `${cycleProgressPercent}%` }"
            />
          </div>
        </CardContent>
      </Card>

      <!-- Wishlist -->
      <Card class="border-border/60">
        <CardHeader class="pb-2 px-5 pt-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <Heart class="w-4 h-4 text-primary" />
              <p class="text-sm font-semibold text-foreground">Хотелки</p>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-xs text-muted-foreground">
                {{ wishesCompletedCount }} / {{ wishesTotalCount }} выполнено
              </span>
              <NuxtLink :to="`/wishlist/${firstCouple.id}`">
                <Button
                  variant="ghost"
                  size="sm"
                  class="text-xs text-muted-foreground h-6 px-2 gap-1"
                >
                  Все <ChevronRight class="w-3 h-3" />
                </Button>
              </NuxtLink>
            </div>
          </div>

          <div class="mt-3 h-1.5 rounded-full bg-border/50 overflow-hidden">
            <div
              class="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
              :style="{ width: `${wishesProgressPercent}%` }"
            />
          </div>
        </CardHeader>

        <CardContent class="px-5 pb-4 flex flex-col gap-2">
          <div
            v-if="!wishes?.length"
            class="flex flex-col items-center py-6 gap-2"
          >
            <span class="text-3xl">💜</span>
            <p class="text-sm text-muted-foreground">Хотелок пока нет</p>
          </div>

          <div
            v-for="item in wishes?.slice(0, 5)"
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
                {{ item.text }}
              </span>
            </div>
            <div class="flex items-center gap-1 text-xs text-muted-foreground">
              <span>{{ item.cost }}</span>
              <span>🪙</span>
            </div>
          </div>

          <NuxtLink
            v-if="wishes && wishes.length > 5"
            :to="`/wishlist/${firstCouple.id}`"
            class="text-xs text-center text-muted-foreground hover:text-primary transition-colors pt-1"
          >
            Ещё {{ wishes.length - 5 }} хотелок →
          </NuxtLink>
        </CardContent>
      </Card>

      <!-- Recent activity — заглушка -->
      <Card class="border-border/60">
        <CardHeader class="pb-2 px-5 pt-4">
          <div class="flex items-center gap-2">
            <Clock class="w-4 h-4 text-primary" />
            <p class="text-sm font-semibold text-foreground">
              Последние активности
            </p>
            <Badge
              class="text-[10px] px-2 py-0 bg-muted text-muted-foreground border-border ml-auto"
            >
              Скоро
            </Badge>
          </div>
        </CardHeader>
        <CardContent class="px-5 pb-5">
          <p class="text-sm text-muted-foreground text-center py-4">
            История активностей появится в следующей версии
          </p>
        </CardContent>
      </Card>
    </template>
  </div>
</template>
