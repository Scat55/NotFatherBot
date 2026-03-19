<script setup lang="ts">
definePageMeta({
  middleware: ["auth"],
});

const config = useRuntimeConfig();
const tokenCookie = useCookie("token", { maxAge: 60 * 60 * 24 }); // 1 день

const loginTelegram = async () => {
  const res = await $fetch(`${config.public.apiBase}/auth/telegram/start`, {
    method: "POST",
  });

  window.open(res.url, "_blank");

  pollStatus(res.token);
};

const pollStatus = async (token: string) => {
  const config = useRuntimeConfig();
  const interval = setInterval(async () => {
    const statusRes = await $fetch(
      `${config.public.apiBase}/auth/telegram/status/${token}`,
    );

    if (statusRes.status === "success") {
      clearInterval(interval);
      // сохраняем токен в cookie
      tokenCookie.value = statusRes.token;
      window.location.href = "/";
    }

    if (["expired", "invalid", "used"].includes(statusRes.status)) {
      clearInterval(interval);
      alert("Ссылка недействительна. Попробуйте ещё раз.");
    }
  }, 2000);
};
</script>

<template>
  <div class="flex justify-center items-center w-full h-screen">
    <div class="flex flex-col justify-center items-center gap-2">
      <h1>Войти через Telegram</h1>
      <Button @click="loginTelegram">Войти</Button>
    </div>
  </div>
</template>

<style scoped></style>
