import { defineStore } from "pinia";
import { userApi, type User } from "@/api/user";

export const useUserStore = defineStore("user", () => {
  const config = useRuntimeConfig();
  const token = useCookie("token");

  const user = ref<User | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const isLogin = computed(() => {
    return !!token.value
  })

  const fullName = computed(() =>
    user.value
      ? `${user.value.firstName} ${user.value.lastName}`.trim()
      : ""
  );

  const initials = computed(() => {
    const first = user.value?.firstName?.[0] ?? "";
    const last = user.value?.lastName?.[0] ?? "";
    return (first + last).toUpperCase();
  });

  async function fetchMe() {
    if (!token.value) return;
    loading.value = true;
    error.value = null;
    try {
      user.value = await userApi.getMe(config.public.apiBase, token.value);
    } catch (e) {
      error.value = "Не удалось загрузить профиль";
    } finally {
      loading.value = false;
    }
  }

    function logout() {
    token.value = null;
    user.value = null;
    error.value = null;
    navigateTo("/auth");
  }

  function clear() {
    user.value = null;
    error.value = null;
  }

  return {
    isLogin,
    user,
    loading,
    error,
    fullName,
    initials,
    fetchMe,
    logout,
    clear,
  };
});
