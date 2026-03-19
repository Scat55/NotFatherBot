<script setup lang="ts">
import { AppHeader } from "@/components/header";
const routeList = [
  { name: "Главная", link: "/" },
  { name: "Мои хотелки", link: "" },
  { name: "Мои пары", link: "" },
  { name: "", link: "" },
];
</script>

<template>
  <div class="flex flex-col min-h-screen">
    <!-- Header -->
    <AppHeader class="w-full" />

    <!-- Основная часть: sidebar + контент -->
    <div class="flex flex-1">
      <!-- Sidebar -->
      <aside class="bg-sidebar-primary w-64 flex flex-col justify-between">
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

        <!-- Нижний элемент: кабинет -->
        <div class="px-4 py-2">
          <NuxtLink
            to="/profile"
            class="hover:bg-primary p-2 rounded-md block cursor-pointer"
          >
            <span>Кабинет</span>
          </NuxtLink>
        </div>
      </aside>

      <!-- Контент -->
      <main class="flex-1 bg-background p-6 overflow-auto">
        <slot />
      </main>
    </div>
  </div>
</template>
