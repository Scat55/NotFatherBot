export default defineNuxtRouteMiddleware((to, from) => {
  const token = useCookie("token").value;

  // Приватные страницы (требуют авторизации)
  const protectedRoutes = ["/", "/profile", "/couples", "/wishlist", "/subscription"];

  // Публичные страницы (для гостей, с токеном → редирект на главную)
  const guestRoutes = ["/auth"];

  // Приватные страницы → без токена редирект на логин
  const isProtected = protectedRoutes.some((r) => to.path === r || to.path.startsWith(r + "/"));
  if (isProtected && !token) {
    return navigateTo("/auth");
  }

  // Публичные страницы → с токеном редирект на главную
  if (guestRoutes.includes(to.path) && token) {
    return navigateTo("/");
  }

  // /invite/:token — публичная, доступна всем, никаких редиректов
});
