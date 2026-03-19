<script setup lang="ts">
definePageMeta({
  middleware: ["auth"],
});
const config = useRuntimeConfig();

const token = useCookie("token");

const { data, error } = await useFetch(`${config.public.apiBase}/users/me`, {
  headers: {
    Authorization: `Bearer ${token.value}`,
  },
});

console.log(data);

const isDark = ref(false);

function toggleTheme() {
  isDark.value = !isDark.value;
  document.documentElement.classList.toggle("dark", isDark.value);
}

// синхронизация при загрузке страницы
onMounted(() => {
  document.documentElement.classList.toggle("dark", isDark.value);
});
</script>

<template>
  <div class="flex items-center justify-center">
    <div>
      Профиль
      <div>
        <img
          class="rounded-[50%] border-4 border-primary"
          :src="data?.photoUrl"
          alt="ProfilePhoto"
        />
      </div>
      <div>
        {{ data?.firstName }}
        {{ data?.lastName }}
      </div>

      <Button @click="toggleTheme">Изменить тему</Button>
    </div>
  </div>
</template>

<style scoped></style>
