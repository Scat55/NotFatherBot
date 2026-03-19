<script setup lang="ts">
import { AppHeader } from "@/components/header";
import { useUserStore } from "@/stores/user";

const routeList = [
  { name: "Главная", link: "/" },
  { name: "Мои хотелки", link: "" },
  { name: "Мои пары", link: "" },
  { name: "", link: "" },
];
const userStore = useUserStore();
</script>

<template>
  <div class="flex flex-col min-h-screen">
    <!-- Header -->
    <AppHeader class="w-full" v-if="userStore.isLogin" />

    <!-- Основная часть: sidebar + контент -->
    <div class="flex flex-1">
      <!-- Sidebar -->
      <aside
        class="bg-sidebar-primary w-64 flex flex-col justify-between"
        v-if="userStore.isLogin"
      >
        <!-- Верх: навигация -->
        <nav class="flex-1">
          <div v-for="route in routeList" :key="route.name" class="px-4 py-2">
            <NuxtLink
              v-if="route.name"
              :to="route.link"
              class="hover:bg-primary p-2 rounded-md block cursor-pointer"
            >
              <span>{{ route.name }}</span>
            </NuxtLink>
          </div>
        </nav>
      </aside>

      <!-- Контент -->
      <main class="flex-1 bg-background p-6 overflow-auto">
        <slot />
      </main>
    </div>
  </div>
</template>
