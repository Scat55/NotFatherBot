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
  LogOut,
  Clock,
} from "lucide-vue-next";

definePageMeta({
  middleware: ["auth"],
});

const config = useRuntimeConfig();
const token = useCookie("token");

interface Partner {
  id: number;
  firstName?: string;
  lastName?: string;
  username?: string;
  photoUrl?: string;
}

interface Couple {
  id: number;
  creatorId: number;
  partnerId?: number;
  inviteToken?: string;
  inviteExpiresAt?: string;
  createdAt: string;
  creator: Partner;
  partner?: Partner;
  _count: { wishes: number };
}

const headers = computed(() => ({
  Authorization: `Bearer ${token.value}`,
}));

const { data: couples, refresh } = await useFetch<Couple[]>(
  `${config.public.apiBase}/couples`,
  { headers },
);

const { data: userMe } = await useFetch<{ id: number }>(
  `${config.public.apiBase}/users/me`,
  { headers },
);

const pendingInvite = ref<string | null>(null);
const copiedInvite = ref(false);
const showLeaveConfirm = ref<number | null>(null);
const loading = ref(false);

async function createCouple() {
  loading.value = true;
  try {
    const res = await $fetch<Couple>(`${config.public.apiBase}/couples`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token.value}` },
    });
    pendingInvite.value = `${window.location.origin}/invite/${res.inviteToken}`;
    await refresh();
  } finally {
    loading.value = false;
  }
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

async function leaveCouple(id: number) {
  await $fetch(`${config.public.apiBase}/couples/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token.value}` },
  });
  showLeaveConfirm.value = null;
  await refresh();
}

const isCreator = (couple: Couple) => couple.creatorId === userMe.value?.id;

const partnerOf = (couple: Couple) =>
  isCreator(couple) ? couple.partner : couple.creator;

const progressPercent = (_couple: Couple) => 0;

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
</script>

<template>
  <div class="max-w-2xl mx-auto px-4 py-8 flex flex-col gap-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold tracking-tight text-foreground">Пары</h1>
        <p class="text-sm text-muted-foreground mt-0.5">
          {{ couples?.length ?? 0 }}
          {{ couples?.length === 1 ? "пара" : "пары" }}
        </p>
      </div>
      <Button class="gap-2" size="sm" :disabled="loading" @click="createCouple">
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
          Скрыть
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
                  class="w-11 h-11 rounded-full bg-primary/15 flex items-center justify-center text-lg font-bold text-primary overflow-hidden"
                >
                  <img
                    v-if="partnerOf(couple)?.photoUrl"
                    :src="partnerOf(couple)?.photoUrl"
                    class="w-full h-full object-cover"
                  />
                  <span v-else>
                    {{ partnerOf(couple)?.firstName?.[0] ?? "?" }}
                  </span>
                </div>
                <span
                  v-if="couple.partnerId"
                  class="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 border-2 border-card"
                />
              </div>
              <div>
                <p class="text-sm font-semibold text-foreground">
                  {{
                    partnerOf(couple)
                      ? partnerOf(couple)?.username ||
                        `${partnerOf(couple)?.firstName ?? ""} ${partnerOf(couple)?.lastName ?? ""}`.trim() ||
                        "Без имени"
                      : "Ожидает партнёра..."
                  }}
                </p>
                <p class="text-xs text-muted-foreground">
                  с {{ formatDate(couple.createdAt) }}
                </p>
              </div>
            </div>
            <Badge variant="secondary" class="text-[10px] shrink-0">
              {{ isCreator(couple) ? "Создатель" : "Партнёр" }}
            </Badge>
          </div>

          <!-- Pending partner -->
          <div
            v-if="!couple.partnerId"
            class="flex items-center gap-2 text-xs text-muted-foreground bg-muted/40 border border-border/40 rounded-xl px-3 py-2"
          >
            <Clock class="w-3.5 h-3.5 shrink-0" />
            <span>Партнёр ещё не принял приглашение</span>
          </div>

          <Separator />

          <!-- Stats -->
          <div class="grid grid-cols-2 gap-3">
            <div
              class="flex flex-col items-center gap-0.5 py-2.5 rounded-xl bg-background border border-border/50"
            >
              <div class="flex items-center gap-1">
                <Heart class="w-3.5 h-3.5 text-primary" />
                <span class="text-base font-bold text-foreground">
                  {{ couple._count.wishes }}
                </span>
              </div>
              <span
                class="text-[10px] text-muted-foreground uppercase tracking-wider"
                >Хотелок</span
              >
            </div>
            <div
              class="flex flex-col items-center gap-0.5 py-2.5 rounded-xl bg-background border border-border/50"
            >
              <span class="text-base font-bold text-foreground">
                {{ progressPercent(couple) }}%
              </span>
              <span
                class="text-[10px] text-muted-foreground uppercase tracking-wider"
                >Прогресс</span
              >
            </div>
          </div>

          <Separator />

          <!-- Wishes button -->
          <Button
            variant="outline"
            size="sm"
            class="w-full gap-2"
            @click="navigateTo(`/wishlist/${couple.id}`)"
          >
            <Heart class="w-3.5 h-3.5" />
            Хотелки
          </Button>

          <!-- Leave confirm -->
          <div
            v-if="showLeaveConfirm === couple.id"
            class="flex flex-col gap-2"
          >
            <p class="text-sm text-center text-foreground">
              {{ isCreator(couple) ? "Удалить пару?" : "Выйти из пары?" }}
            </p>
            <p class="text-xs text-center text-muted-foreground">
              {{
                isCreator(couple)
                  ? "Пара и все хотелки будут удалены"
                  : "Все хотелки и история останутся"
              }}
            </p>
            <div class="flex gap-2">
              <Button
                variant="destructive"
                size="sm"
                class="flex-1"
                @click="leaveCouple(couple.id)"
              >
                {{ isCreator(couple) ? "Удалить" : "Выйти" }}
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
            {{ isCreator(couple) ? "Удалить пару" : "Выйти из пары" }}
          </Button>
        </CardContent>
      </Card>
    </div>

    <!-- Empty state -->
    <div
      v-if="!couples?.length && !pendingInvite"
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
      <Button class="gap-2 mt-2" :disabled="loading" @click="createCouple">
        <Plus class="w-4 h-4" />
        Создать пару
      </Button>
    </div>
  </div>
</template>
