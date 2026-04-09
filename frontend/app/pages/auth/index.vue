<script setup lang="ts">
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

definePageMeta({
  middleware: ["auth"],
});

const config = useRuntimeConfig();
const tokenCookie = useCookie("token", { maxAge: 60 * 60 * 24 * 7 }); // 7 дней

const telegramUrl = ref<string | null>(null);
const loading = ref(false);
const polling = ref(false);
let pollInterval: ReturnType<typeof setInterval> | null = null;

const loginTelegram = async () => {
  loading.value = true;
  try {
    const res = await $fetch<{ url: string; token: string }>(
      `${config.public.apiBase}/auth/telegram/start`,
      { method: "POST" },
    );
    telegramUrl.value = res.url;
    startPolling(res.token);
  } catch {
    alert("Не удалось подключиться к серверу. Попробуй ещё раз.");
  } finally {
    loading.value = false;
  }
};

const startPolling = (token: string) => {
  polling.value = true;
  pollInterval = setInterval(async () => {
    try {
      const statusRes = await $fetch<{ status: string; token?: string }>(
        `${config.public.apiBase}/auth/telegram/status/${token}`,
      );

      if (statusRes.status === "success" && statusRes.token) {
        clearInterval(pollInterval!);
        tokenCookie.value = statusRes.token;
        window.location.href = "/";
      }

      if (["expired", "invalid"].includes(statusRes.status)) {
        clearInterval(pollInterval!);
        polling.value = false;
        telegramUrl.value = null;
        alert("Ссылка недействительна. Попробуйте ещё раз.");
      }
    } catch {
      // сеть временно недоступна — продолжаем polling
    }
  }, 2000);
};

onUnmounted(() => {
  if (pollInterval) clearInterval(pollInterval);
});
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
        <div
          class="w-16 h-16 rounded-2xl bg-primary/15 flex items-center justify-center text-3xl"
        >
          💜
        </div>

        <div>
          <h1 class="text-xl font-bold tracking-tight text-foreground">
            Not Father
          </h1>
          <p class="text-sm text-muted-foreground mt-1">
            Войди через Telegram чтобы продолжить
          </p>
        </div>

        <!-- Шаг 1 — кнопка входа -->
        <template v-if="!telegramUrl">
          <Button
            class="w-full gap-2"
            :disabled="loading"
            @click="loginTelegram"
          >
            <span
              v-if="loading"
              class="w-4 h-4 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin"
            />
            <span v-else>✈️</span>
            {{ loading ? "Подключаемся..." : "Войти через Telegram" }}
          </Button>
        </template>

        <!-- Шаг 2 — открыть бота -->
        <template v-else>
          <div class="w-full flex flex-col gap-3">
            <a :href="telegramUrl" target="_blank" class="w-full">
              <Button class="w-full gap-2">
                <span>✈️</span>
                Открыть Telegram
              </Button>
            </a>

            <div class="flex items-center gap-2 text-xs text-muted-foreground">
              <span
                class="w-3 h-3 rounded-full border-2 border-primary border-t-transparent animate-spin shrink-0"
              />
              <span>Ожидаем подтверждения в боте...</span>
            </div>

            <p class="text-xs text-muted-foreground">
              После нажатия /start в боте ты автоматически войдёшь в приложение
            </p>

            <button
              class="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
              @click="
                telegramUrl = null;
                polling = false;
                clearInterval(pollInterval!);
              "
            >
              Начать заново
            </button>
          </div>
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
