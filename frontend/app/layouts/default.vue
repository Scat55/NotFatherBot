<script setup lang="ts">
import { AppHeader } from "@/components/header";
import { useUserStore } from "@/stores/user";
import { Home, Heart, Users, User } from "lucide-vue-next";

const userStore = useUserStore();
const route = useRoute();

const routeList = [
  { name: "Главная", link: "/", icon: Home },
  { name: "Хотелки", link: "/wishlist", icon: Heart },
  { name: "Пары", link: "/couples", icon: Users },
  { name: "Профиль", link: "/profile", icon: User },
];

const isActive = (link: string) => {
  if (link === "/") return route.path === "/";
  return route.path.startsWith(link);
};
</script>

<template>
  <div class="flex flex-col min-h-screen">
    <div class="flex flex-1 overflow-hidden">
      <!-- Sidebar — desktop only -->
      <aside
        v-if="userStore.isLogin"
        class="hidden md:flex w-60 flex-col border-r border-border/50 bg-sidebar-primary shrink-0"
      >
        <nav class="flex-1 px-3 py-4 flex flex-col gap-1">
          <NuxtLink
            v-for="item in routeList"
            :key="item.name"
            :to="item.link"
            class="group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
            :class="
              isActive(item.link)
                ? 'bg-primary/15 text-primary'
                : 'text-muted-foreground hover:bg-primary/8 hover:text-foreground'
            "
          >
            <!-- Active indicator -->
            <span
              class="absolute left-0 w-1 h-6 rounded-r-full bg-primary transition-all duration-200"
              :class="isActive(item.link) ? 'opacity-100' : 'opacity-0'"
            />

            <component
              :is="item.icon"
              class="w-4.5 h-4.5 shrink-0 transition-transform duration-200 group-hover:scale-110"
              :class="
                isActive(item.link)
                  ? 'text-primary'
                  : 'text-muted-foreground group-hover:text-foreground'
              "
            />
            <span>{{ item.name }}</span>

            <!-- Active dot -->
            <span
              v-if="isActive(item.link)"
              class="ml-auto w-1.5 h-1.5 rounded-full bg-primary"
            />
          </NuxtLink>
        </nav>

        <!-- Bottom decoration -->
        <div class="px-4 py-4 border-t border-border/40">
          <div
            class="text-[10px] text-muted-foreground/50 uppercase tracking-widest text-center"
          >
            Not Father
          </div>
        </div>
      </aside>

      <!-- Content -->
      <main class="flex-1 bg-background overflow-auto pb-20 md:pb-0">
        <slot />
      </main>
    </div>

    <!-- Bottom nav — mobile only -->
    <nav
      v-if="userStore.isLogin"
      class="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-sidebar-primary/90 backdrop-blur-xl border-t border-border/50"
    >
      <div class="flex items-center justify-around px-2 py-2 safe-area-pb">
        <NuxtLink
          v-for="item in routeList"
          :key="item.name"
          :to="item.link"
          class="flex flex-col items-center gap-1 px-4 py-1.5 rounded-xl transition-all duration-200 min-w-[60px]"
          :class="
            isActive(item.link) ? 'text-primary' : 'text-muted-foreground'
          "
        >
          <div
            class="relative flex items-center justify-center w-10 h-7 rounded-xl transition-all duration-200"
            :class="isActive(item.link) ? 'bg-primary/15' : ''"
          >
            <!-- Active pill -->
            <span
              v-if="isActive(item.link)"
              class="absolute inset-0 rounded-xl bg-primary/15 animate-[fadeIn_0.2s_ease]"
            />
            <component
              :is="item.icon"
              class="relative w-5 h-5 transition-transform duration-200"
              :class="isActive(item.link) ? 'scale-110' : ''"
            />
          </div>
          <span
            class="text-[10px] font-medium tracking-wide transition-all duration-200"
            :class="isActive(item.link) ? 'opacity-100' : 'opacity-60'"
          >
            {{ item.name }}
          </span>
        </NuxtLink>
      </div>
    </nav>
  </div>
</template>

<style>
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.safe-area-pb {
  padding-bottom: max(0.5rem, env(safe-area-inset-bottom));
}
</style>
