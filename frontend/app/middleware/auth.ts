export default defineNuxtRouteMiddleware((to, from) => {
  const token = useCookie("token").value;

  // Приватные страницы (требуют авторизации)
  const protectedRoutes = ["/", "/profile", "/couples"];

  // Публичные страницы (для гостей)
  const guestRoutes = ["/auth"];

  // Приватные страницы → без токена редирект на логин
  if (protectedRoutes.includes(to.path) && !token) {
    return navigateTo("/auth");
  }

  // Публичные страницы → с токеном редирект на dashboard
  if (guestRoutes.includes(to.path) && token) {
    return navigateTo("/");
  }
});
