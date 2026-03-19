<script setup lang="ts"></script>

<template>
  <header>
    <div class="bg-sidebar-primary px-6 py-4 flex justify-between">
      <p>HEADER</p>
      <div>
        <NuxtLink
          to="/profile"
          class="hover:bg-primary p-2 rounded-md block cursor-pointer"
        >
          <span>Кабинет</span>
        </NuxtLink>
      </div>
    </div>
  </header>
</template>

<style scoped></style>
