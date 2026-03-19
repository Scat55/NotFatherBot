<script setup lang="ts">
import { Toaster } from "vue-sonner";
import "vue-sonner/style.css";
import { useUserStore } from "@/stores/user";

const userStore = useUserStore();
onMounted(async () => {
  await userStore.fetchMe();
});
</script>
<template>
  <div>
    <Toaster position="top-center" richColors />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>
