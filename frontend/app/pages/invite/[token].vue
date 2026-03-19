<script setup lang="ts">
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  UserRound,
  HeartHandshake,
  LinkIcon,
  AlertCircle,
} from "lucide-vue-next";

// Публичная страница — без middleware auth
const route = useRoute();
const config = useRuntimeConfig();
const token = route.params.token as string;
const authToken = useCookie("token");

interface InviteInfo {
  status: "valid" | "invalid" | "expired" | "taken";
  creator?: {
    firstName?: string;
    lastName?: string;
    username?: string;
    photoUrl?: string;
  };
}

// Загружаем информацию об инвайте
const { data: invite, status } = await useFetch<InviteInfo>(
  `${config.public.apiBase}/couples/invite/${token}`,
);

const joining = ref(false);
const joined = ref(false);
const joinError = ref<string | null>(null);

const creatorName = computed(() => {
  const c = invite.value?.creator;
  if (!c) return "Неизвестный";
  return (
    c.username ||
    `${c.firstName || ""} ${c.lastName || ""}`.trim() ||
    "Неизвестный"
  );
});

const creatorInitials = computed(() => {
  const c = invite.value?.creator;
  if (!c) return "?";
  return (
    ((c.firstName?.[0] ?? "") + (c.lastName?.[0] ?? "")).toUpperCase() || "?"
  );
});

async function acceptInvite() {
  if (!authToken.value) {
    // Не авторизован — редирект на авторизацию, потом вернёмся
    navigateTo(`/auth?redirect=/invite/${token}`);
    return;
  }

  joining.value = true;
  joinError.value = null;

  try {
    await $fetch(`${config.public.apiBase}/couples/join/${token}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${authToken.value}` },
    });
    joined.value = true;
    setTimeout(() => navigateTo("/couples"), 2000);
  } catch (e: any) {
    joinError.value = e?.data?.message ?? "Что-то пошло не так";
  } finally {
    joining.value = false;
  }
}
</script>

<template>
  <div class="min-h-screen bg-background flex items-center justify-center px-4">
    <!-- Ambient blobs -->
    <div class="pointer-events-none fixed inset-0 z-0" aria-hidden="true">
      <div
        class="absolute -top-32 -right-24 w-[400px] h-[400px] rounded-full bg-primary opacity-10 blur-[80px]"
      />
      <div
        class="absolute -bottom-24 -left-20 w-[300px] h-[300px] rounded-full bg-accent opacity-10 blur-[70px]"
      />
    </div>

    <Card
      class="relative z-10 w-full max-w-sm border-border/60 animate-[fadeUp_0.4s_ease_both]"
    >
      <CardContent
        class="px-6 py-8 flex flex-col items-center gap-5 text-center"
      >
        <!-- Loading -->
        <template v-if="status === 'pending'">
          <div
            class="w-12 h-12 rounded-full border-2 border-primary border-t-transparent animate-spin"
          />
          <p class="text-sm text-muted-foreground">Загружаем приглашение...</p>
        </template>

        <!-- Invalid / Expired / Taken -->
        <template v-else-if="invite?.status !== 'valid'">
          <div
            class="w-14 h-14 rounded-2xl bg-destructive/10 flex items-center justify-center"
          >
            <AlertCircle class="w-7 h-7 text-destructive" />
          </div>
          <div>
            <p class="text-base font-semibold text-foreground">
              {{
                invite?.status === "expired"
                  ? "Ссылка устарела"
                  : invite?.status === "taken"
                    ? "Место занято"
                    : "Ссылка недействительна"
              }}
            </p>
            <p class="text-sm text-muted-foreground mt-1">
              {{
                invite?.status === "expired"
                  ? "Срок действия ссылки истёк. Попроси партнёра создать новую."
                  : invite?.status === "taken"
                    ? "В эту пару уже кто-то вступил."
                    : "Эта ссылка-приглашение не существует."
              }}
            </p>
          </div>
          <Button variant="outline" class="w-full" @click="navigateTo('/')">
            На главную
          </Button>
        </template>

        <!-- Joined successfully -->
        <template v-else-if="joined">
          <div
            class="w-14 h-14 rounded-2xl bg-green-500/15 flex items-center justify-center"
          >
            <HeartHandshake class="w-7 h-7 text-green-500" />
          </div>
          <div>
            <p class="text-base font-semibold text-foreground">Ты в паре! 💜</p>
            <p class="text-sm text-muted-foreground mt-1">
              Перенаправляем на страницу пар...
            </p>
          </div>
        </template>

        <!-- Valid invite -->
        <template v-else>
          <div class="flex flex-col items-center gap-3">
            <div class="relative">
              <div
                class="absolute inset-0 rounded-full bg-gradient-to-br from-primary to-accent blur-[6px] opacity-50 scale-110"
              />
              <Avatar class="relative w-16 h-16 border-4 border-card">
                <AvatarImage :src="invite?.creator?.photoUrl" />
                <AvatarFallback
                  class="bg-muted text-foreground text-lg font-bold"
                >
                  {{ creatorInitials }}
                </AvatarFallback>
              </Avatar>
            </div>
            <div>
              <p class="text-base font-semibold text-foreground">
                {{ creatorName }} приглашает тебя в пару
              </p>
              <p class="text-sm text-muted-foreground mt-0.5">
                Прими приглашение чтобы стать партнёром
              </p>
            </div>
          </div>

          <div
            class="w-full flex flex-col gap-2 text-xs text-muted-foreground bg-muted/40 border border-border/50 rounded-xl px-4 py-3"
          >
            <div class="flex items-center gap-2">
              <UserRound class="w-3.5 h-3.5 shrink-0 text-primary" />
              <span>Ты сможешь выполнять хотелки партнёра</span>
            </div>
            <div class="flex items-center gap-2">
              <LinkIcon class="w-3.5 h-3.5 shrink-0 text-primary" />
              <span>За выполнение ты будешь получать монеты</span>
            </div>
          </div>

          <p v-if="joinError" class="text-xs text-destructive">
            {{ joinError }}
          </p>

          <Button
            class="w-full gap-2"
            :disabled="joining"
            @click="acceptInvite"
          >
            <span
              v-if="joining"
              class="w-4 h-4 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin"
            />
            {{ joining ? "Вступаем..." : "Принять приглашение" }}
          </Button>

          <p class="text-[11px] text-muted-foreground">
            {{
              authToken
                ? "Ты будешь добавлен как партнёр"
                : "Тебе нужно войти через Telegram"
            }}
          </p>
        </template>
      </CardContent>
    </Card>
  </div>
</template>

<style>
@keyframes fadeUp {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
