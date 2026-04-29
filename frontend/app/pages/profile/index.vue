<script setup lang="ts">
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import Switch from "@/components/ui/switch/Switch.vue";
import { useUserStore } from "@/stores/user";
import { useNumberFormat } from "~/composables/useFormatNumber";

definePageMeta({
  middleware: ["auth"],
});

const userStore = useUserStore();
const colorMode = useColorMode();
await userStore.fetchMe();

const { user, initials } = storeToRefs(userStore);
const { format } = useNumberFormat();

const joinDate = computed(() => {
  if (!user.value?.createdAt) return "—";
  return new Date(user.value.createdAt).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
});

const isDark = computed({
  get: () => colorMode.value === "dark",
  set: (val) => {
    colorMode.preference = val ? "dark" : "light";
  },
});
</script>

<template>
  <div class="relative bg-background overflow-hidden">
    <!-- Ambient blobs -->
    <div class="pointer-events-none fixed inset-0 z-0" aria-hidden="true">
      <div
        class="absolute -top-32 -right-24 w-[500px] h-[500px] rounded-full bg-primary opacity-15 blur-[90px] animate-[drift_12s_ease-in-out_infinite_alternate]"
      />
      <div
        class="absolute -bottom-24 -left-20 w-[360px] h-[360px] rounded-full bg-accent opacity-15 blur-[80px] animate-[drift_16s_ease-in-out_infinite_alternate-reverse]"
      />
    </div>

    <div
      class="relative z-10 max-w-4xl mx-auto px-4 py-10 flex flex-col gap-6 animate-[fadeUp_0.45s_ease_both]"
    >
      <!-- Top: Avatar card -->
      <Card class="overflow-hidden border-border/60">
        <div
          class="h-28 bg-gradient-to-r from-primary/30 via-accent/20 to-primary/10"
        />
        <CardContent class="pt-0 pb-6 px-6">
          <div
            class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 -mt-10"
          >
            <div class="relative w-fit">
              <div
                class="absolute inset-0 rounded-full bg-gradient-to-br from-primary to-accent blur-[6px] opacity-60 scale-110"
              />
              <Avatar
                class="relative w-20 h-20 border-4 border-card text-lg font-semibold"
              >
                <AvatarImage :src="user?.photoUrl" alt="Фото профиля" />
                <AvatarFallback
                  class="bg-muted text-foreground text-xl font-bold"
                >
                  {{ initials }}
                </AvatarFallback>
              </Avatar>
              <span
                class="absolute bottom-1 right-1 w-3.5 h-3.5 rounded-full bg-green-500 border-2 border-card"
              />
            </div>

            <div class="flex-1 min-w-0">
              <h1
                class="text-2xl font-bold tracking-tight text-foreground truncate"
              >
                {{ user?.firstName }} {{ user?.lastName }}
              </h1>
              <p class="text-sm text-muted-foreground mt-0.5">
                @{{ user?.username ?? "пользователь" }}
              </p>
            </div>

            <div class="flex gap-2 flex-wrap">
              <Badge variant="secondary">Участник</Badge>
              <Badge
                class="bg-primary/20 text-primary border-primary/30 hover:bg-primary/30"
              >
                Активен
              </Badge>
            </div>
          </div>

          <Separator class="my-5" />

          <!-- Stats -->
          <div class="grid grid-cols-3 gap-4 text-center">
            <div class="flex flex-col gap-0.5">
              <span class="text-2xl font-bold text-foreground">{{
                user?.wishlistCount ?? 0
              }}</span>
              <span
                class="text-xs text-muted-foreground uppercase tracking-widest"
                >Хотелки</span
              >
            </div>
            <div class="flex flex-col gap-0.5">
              <span class="text-2xl font-bold text-foreground">{{
                user?.pairsCount ?? 0
              }}</span>
              <span
                class="text-xs text-muted-foreground uppercase tracking-widest"
                >Пары</span
              >
            </div>
            <div class="flex flex-col gap-0.5">
              <span class="text-2xl font-bold text-foreground">{{
                user?.completedTasks ?? 0
              }}</span>
              <span
                class="text-xs text-muted-foreground uppercase tracking-widest"
                >Выполнено</span
              >
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Balance card -->
      <Card class="border-border/60 overflow-hidden">
        <CardContent class="px-6 py-5">
          <div class="flex items-center justify-between gap-4">
            <div class="flex items-center gap-4">
              <div
                class="w-12 h-12 rounded-2xl bg-primary/15 flex items-center justify-center text-2xl shrink-0"
              >
                🪙
              </div>
              <div>
                <p
                  class="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-0.5"
                >
                  Баланс монет
                </p>
                <p class="text-3xl font-bold tracking-tight text-foreground">
                  {{ format(user?.balance ?? 0) }}
                  <span class="text-base font-medium text-muted-foreground ml-1"
                    >монет</span
                  >
                </p>
              </div>
            </div>
            <Badge
              class="bg-primary/15 text-primary border-primary/25 text-xs px-3 py-1"
            >
              Скоро: геймификация
            </Badge>
          </div>

          <Separator class="my-4" />

          <div class="grid grid-cols-3 gap-3">
            <div
              v-for="item in [
                {
                  icon: '🎯',
                  label: 'Пропущено',
                  value: user?.skippedTasks ?? 0,
                },
                {
                  icon: '⭐',
                  label: 'Выполнено',
                  value: user?.completedTasks ?? 0,
                },
                {
                  icon: '🏆',
                  label: 'Достижений',
                  value: user?.achievements ?? 0,
                },
              ]"
              :key="item.label"
              class="flex flex-col items-center gap-1 py-3 px-2 rounded-xl bg-background border border-border/50 text-center"
            >
              <span class="text-xl">{{ item.icon }}</span>
              <span class="text-lg font-bold text-foreground">{{
                item.value
              }}</span>
              <span class="text-[10px] text-muted-foreground leading-tight">{{
                item.label
              }}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Bottom: Info + Actions -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <!-- Personal info -->
        <Card class="border-border/60">
          <CardHeader class="pb-2">
            <p
              class="text-xs font-semibold uppercase tracking-widest text-muted-foreground"
            >
              Личные данные
            </p>
          </CardHeader>
          <CardContent class="flex flex-col gap-3">
            <div
              v-for="item in [
                { label: 'Имя', value: user?.firstName },
                { label: 'Фамилия', value: user?.lastName },
                {
                  label: 'Username',
                  value: user?.username ? `@${user.username}` : null,
                },
                { label: 'Дата регистрации', value: joinDate },
              ]"
              :key="item.label"
              class="flex items-center justify-between py-2 px-3 rounded-lg bg-background border border-border/50 hover:border-primary/40 transition-all duration-200"
            >
              <span
                class="text-xs text-muted-foreground uppercase tracking-wider"
                >{{ item.label }}</span
              >
              <span class="text-sm font-medium text-foreground">{{
                item.value ?? "—"
              }}</span>
            </div>
          </CardContent>
        </Card>

        <!-- Actions -->
        <Card class="border-border/60">
          <CardHeader class="pb-2">
            <p
              class="text-xs font-semibold uppercase tracking-widest text-muted-foreground"
            >
              Действия
            </p>
          </CardHeader>
          <CardContent class="flex flex-col gap-3">
            <div
              class="flex items-center justify-between py-2.5 px-3 rounded-lg bg-background border border-border/50 hover:border-primary/40 transition-all duration-200"
            >
              <div class="flex items-center gap-2.5">
                <span class="text-base">{{ isDark ? "🌙" : "☀️" }}</span>
                <span class="text-sm font-medium text-foreground">
                  {{ isDark ? "Тёмная тема" : "Светлая тема" }}
                </span>
              </div>
              <Switch v-model="isDark" />
            </div>
            <Separator />
            <Button
              class="w-full justify-start gap-2 text-destructive hover:text-destructive"
              variant="ghost"
              @click="userStore.logout()"
            >
              <span>🚪</span> Выйти из аккаунта
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
</template>

<style>
@keyframes fadeUp {
  from {
    opacity: 0;
    transform: translateY(18px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
@keyframes drift {
  from {
    transform: translate(0, 0) scale(1);
  }
  to {
    transform: translate(28px, 18px) scale(1.07);
  }
}
</style>
