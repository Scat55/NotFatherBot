<script setup lang="ts">
import { Button } from "@/components/ui/button";

definePageMeta({
  middleware: ["auth"],
});
</script>

<template>
  <div>
    <Button>Click</Button>
  </div>
</template>

<style></style>
