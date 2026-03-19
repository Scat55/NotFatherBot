<script setup lang="ts">
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Plus,
  Link,
  Copy,
  Check,
  Users,
  Heart,
  Coins,
  LogOut,
  Clock,
} from "lucide-vue-next";

definePageMeta({
  middleware: ["auth"],
});

interface Couple {
  id: number;
  partnerName: string;
  partnerPhoto?: string;
  role: "creator" | "partner";
  wishCount: number;
  completedCount: number;
  partnerCoins: number;
  joinedAt: string;
}

// TODO: заменить на реальные данные из API
const couples = ref<Couple[]>([
  {
    id: 1,
    partnerName: "Катя",
    role: "partner",
    wishCount: 5,
    completedCount: 2,
    partnerCoins: 80,
    joinedAt: "1 марта 2026",
  },
]);

// Pending invite
const pendingInvite = ref<string | null>(null);
const copiedInvite = ref(false);
const showLeaveConfirm = ref<number | null>(null);

// TODO: заменить на реальный API-вызов
function createCouple() {
  const fakeToken = Math.random().toString(36).substring(2, 10);
  pendingInvite.value = `${window.location.origin}/invite/${fakeToken}`;
}

async function copyInvite() {
  if (!pendingInvite.value) return;
  await navigator.clipboard.writeText(pendingInvite.value);
  copiedInvite.value = true;
  setTimeout(() => (copiedInvite.value = false), 2000);
}

function cancelInvite() {
  pendingInvite.value = null;
}

function leaveCouple(id: number) {
  couples.value = couples.value.filter((c) => c.id !== id);
  showLeaveConfirm.value = null;
}

const progressPercent = (c: Couple) =>
  c.wishCount > 0 ? Math.round((c.completedCount / c.wishCount) * 100) : 0;
</script>

<template>
  <div class="max-w-2xl mx-auto px-4 py-8 flex flex-col gap-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold tracking-tight text-foreground">Пары</h1>
        <p class="text-sm text-muted-foreground mt-0.5">
          {{ couples.length }} {{ couples.length === 1 ? "пара" : "пары" }}
        </p>
      </div>
      <Button class="gap-2" size="sm" @click="createCouple">
        <Plus class="w-4 h-4" />
        Создать пару
      </Button>
    </div>

    <!-- Pending invite -->
    <Card v-if="pendingInvite" class="border-primary/40 bg-primary/5">
      <CardContent class="px-5 py-4 flex flex-col gap-3">
        <div class="flex items-center gap-2">
          <Link class="w-4 h-4 text-primary" />
          <p class="text-sm font-semibold text-foreground">
            Ссылка-приглашение готова
          </p>
        </div>
        <p class="text-xs text-muted-foreground">
          Отправь эту ссылку партнёру — он перейдёт по ней и автоматически
          присоединится к паре.
        </p>

        <div
          class="flex items-center gap-2 bg-background border border-border/60 rounded-xl px-3 py-2.5"
        >
          <span class="text-xs text-muted-foreground truncate flex-1 font-mono">
            {{ pendingInvite }}
          </span>
          <button
            class="shrink-0 p-1.5 rounded-lg transition-colors"
            :class="
              copiedInvite
                ? 'bg-green-500/15 text-green-600'
                : 'hover:bg-primary/10 text-muted-foreground hover:text-primary'
            "
            @click="copyInvite"
          >
            <Check v-if="copiedInvite" class="w-4 h-4" />
            <Copy v-else class="w-4 h-4" />
          </button>
        </div>

        <div class="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock class="w-3.5 h-3.5 shrink-0" />
          <span>Ссылка активна 24 часа</span>
        </div>

        <Separator />

        <Button
          variant="ghost"
          size="sm"
          class="w-full text-muted-foreground"
          @click="cancelInvite"
        >
          Отменить
        </Button>
      </CardContent>
    </Card>

    <!-- Couples list -->
    <div class="flex flex-col gap-4">
      <Card v-for="couple in couples" :key="couple.id" class="border-border/60">
        <CardContent class="px-5 py-4 flex flex-col gap-4">
          <!-- Partner info -->
          <div class="flex items-center justify-between gap-3">
            <div class="flex items-center gap-3">
              <div class="relative">
                <div
                  class="w-11 h-11 rounded-full bg-primary/15 flex items-center justify-center text-lg font-bold text-primary"
                >
                  {{ couple.partnerName[0] }}
                </div>
                <span
                  class="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 border-2 border-card"
                />
              </div>
              <div>
                <p class="text-sm font-semibold text-foreground">
                  {{ couple.partnerName }}
                </p>
                <p class="text-xs text-muted-foreground">
                  с {{ couple.joinedAt }}
                </p>
              </div>
            </div>
            <Badge variant="secondary" class="text-[10px] shrink-0">
              {{ couple.role === "creator" ? "Создатель" : "Партнёр" }}
            </Badge>
          </div>

          <Separator />

          <!-- Stats -->
          <div class="grid grid-cols-3 gap-3">
            <div
              class="flex flex-col items-center gap-0.5 py-2.5 rounded-xl bg-background border border-border/50"
            >
              <div class="flex items-center gap-1">
                <Heart class="w-3.5 h-3.5 text-primary" />
                <span class="text-base font-bold text-foreground">{{
                  couple.wishCount
                }}</span>
              </div>
              <span
                class="text-[10px] text-muted-foreground uppercase tracking-wider"
                >Хотелок</span
              >
            </div>
            <div
              class="flex flex-col items-center gap-0.5 py-2.5 rounded-xl bg-background border border-border/50"
            >
              <div class="flex items-center gap-1">
                <Check class="w-3.5 h-3.5 text-green-500" />
                <span class="text-base font-bold text-foreground">{{
                  couple.completedCount
                }}</span>
              </div>
              <span
                class="text-[10px] text-muted-foreground uppercase tracking-wider"
                >Выполнено</span
              >
            </div>
            <div
              class="flex flex-col items-center gap-0.5 py-2.5 rounded-xl bg-background border border-border/50"
            >
              <span class="text-base font-bold text-foreground"
                >{{ couple.partnerCoins }} 🪙</span
              >
              <span
                class="text-[10px] text-muted-foreground uppercase tracking-wider"
                >Монет</span
              >
            </div>
          </div>

          <!-- Progress -->
          <div>
            <div
              class="flex justify-between text-xs text-muted-foreground mb-1.5"
            >
              <span>Прогресс хотелок</span>
              <span>{{ progressPercent(couple) }}%</span>
            </div>
            <div class="h-1.5 rounded-full bg-border/50 overflow-hidden">
              <div
                class="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
                :style="{ width: `${progressPercent(couple)}%` }"
              />
            </div>
          </div>

          <Separator />

          <!-- Actions -->
          <div
            v-if="showLeaveConfirm === couple.id"
            class="flex flex-col gap-2"
          >
            <p class="text-sm text-center text-foreground">
              Выйти из пары с
              <span class="font-semibold">{{ couple.partnerName }}</span
              >?
            </p>
            <p class="text-xs text-center text-muted-foreground">
              Все хотелки и история останутся
            </p>
            <div class="flex gap-2">
              <Button
                variant="destructive"
                size="sm"
                class="flex-1"
                @click="leaveCouple(couple.id)"
              >
                Выйти
              </Button>
              <Button
                variant="outline"
                size="sm"
                class="flex-1"
                @click="showLeaveConfirm = null"
              >
                Отмена
              </Button>
            </div>
          </div>

          <Button
            v-else
            variant="ghost"
            size="sm"
            class="w-full gap-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            @click="showLeaveConfirm = couple.id"
          >
            <LogOut class="w-3.5 h-3.5" />
            Выйти из пары
          </Button>
        </CardContent>
      </Card>
    </div>

    <!-- Empty state -->
    <div
      v-if="couples.length === 0 && !pendingInvite"
      class="flex flex-col items-center justify-center py-16 gap-3"
    >
      <div
        class="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center"
      >
        <Users class="w-8 h-8 text-primary/60" />
      </div>
      <p class="text-base font-semibold text-foreground">Пока нет пар</p>
      <p class="text-sm text-muted-foreground text-center max-w-xs">
        Создай пару и отправь партнёру ссылку-приглашение
      </p>
      <Button class="gap-2 mt-2" @click="createCouple">
        <Plus class="w-4 h-4" />
        Создать пару
      </Button>
    </div>
  </div>
</template>
