<script setup lang="ts">
import { Users, Plus } from "lucide-vue-next";
import { couplesApi } from "@/api/couples";

definePageMeta({
  middleware: ["auth"],
});

const config = useRuntimeConfig();
const token = useCookie("token");

const couples = await couplesApi.getAll(config.public.apiBase, token.value!);

// Если есть пары — редиректим на первую
if (couples.length > 0) {
  await navigateTo(`/wishlist/${couples[0].id}`, { replace: true });
}
</script>

<template>
  <div class="flex flex-col items-center justify-center py-16 gap-3">
    <div
      class="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center"
    >
      <Users class="w-8 h-8 text-primary/60" />
    </div>
    <p class="text-base font-semibold text-foreground">Нет пар</p>
    <p class="text-sm text-muted-foreground text-center max-w-xs">
      Сначала создай пару — хотелки привязаны к паре
    </p>
    <Button class="gap-2 mt-2" @click="navigateTo('/couples')">
      <Plus class="w-4 h-4" />
      Перейти к парам
    </Button>
  </div>
</template>
