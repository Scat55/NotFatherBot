<script setup lang="ts">
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Copy, Plus, MessageSquareText, Check } from "lucide-vue-next";

definePageMeta({
  middleware: ["auth"],
});

// TODO: заменить на реальные данные из API
const templates = ref([
  {
    id: 1,
    title: "Ежемесячное обновление",
    tag: "Основное",
    text: `❗️ЕЖЕМЕСЯЧНОЕ\nОБНОВЛЕНИЕ ПОДПИСКИ НА отцовство❗️\nПоздравляю❗️❗️❗️\nВы НЕ отец.\nПо независящим от нас обстоятельствам, наша компания столкнулась с небольшой задержкой в этом месяце. На данный момент проблема уже устранена и цикл восстановлен. Надеемся, что этот случай не вызвал у вас сильного стресса.😊`,
  },
  {
    id: 2,
    title: "Запрос на продление",
    tag: "Продление",
    text: `Если хотите отправить запрос на продление подписки на следующий месяц, отправьте «ДА» в ответном сообщении.`,
  },
  {
    id: 3,
    title: "Условия тарифа",
    tag: "Тариф",
    text: `У Вас приобретен тариф «Премиум +», стоимость тарифа составляет:\n- Шоколадка\n- Вечер настольных игры\n- Выходные обнимашек и целовашек\n- Массаж спинки\n- Совместный просмотр чего-то интересного`,
  },
]);

const copiedId = ref<number | null>(null);

const copyText = async (id: number, text: string) => {
  await navigator.clipboard.writeText(text);
  copiedId.value = id;
  setTimeout(() => {
    copiedId.value = null;
  }, 2000);
};
</script>

<template>
  <div class="max-w-2xl mx-auto px-4 py-8 flex flex-col gap-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold tracking-tight text-foreground">
          Шаблоны
        </h1>
        <p class="text-sm text-muted-foreground mt-0.5">
          Готовые сообщения для пары
        </p>
      </div>
      <Button size="sm" class="gap-2">
        <Plus class="w-4 h-4" />
        Добавить
      </Button>
    </div>

    <div class="flex flex-col gap-4">
      <Card
        v-for="template in templates"
        :key="template.id"
        class="border-border/60"
      >
        <CardHeader class="px-5 pt-4 pb-2">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <MessageSquareText class="w-4 h-4 text-primary" />
              <p class="text-sm font-semibold text-foreground">
                {{ template.title }}
              </p>
            </div>
            <Badge variant="secondary" class="text-[10px] px-2 py-0">
              {{ template.tag }}
            </Badge>
          </div>
        </CardHeader>

        <CardContent class="px-5 pb-4 flex flex-col gap-3">
          <div
            class="bg-background border border-border/50 rounded-xl px-4 py-3"
          >
            <p
              class="text-sm text-foreground whitespace-pre-line leading-relaxed"
            >
              {{ template.text }}
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            class="w-full gap-2 transition-all duration-200"
            :class="
              copiedId === template.id
                ? 'border-green-500/50 text-green-600'
                : ''
            "
            @click="copyText(template.id, template.text)"
          >
            <Check v-if="copiedId === template.id" class="w-3.5 h-3.5" />
            <Copy v-else class="w-3.5 h-3.5" />
            {{ copiedId === template.id ? "Скопировано!" : "Скопировать" }}
          </Button>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
