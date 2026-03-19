<script setup lang="ts">
import draggable from "vuedraggable";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  GripVertical,
  Plus,
  Pencil,
  Trash2,
  CheckCircle2,
  Circle,
  X,
  Check,
} from "lucide-vue-next";

definePageMeta({
  middleware: ["auth"],
});

interface WishItem {
  id: number;
  title: string;
  cost: number;
  done: boolean;
}

// TODO: заменить на реальные данные из API
const items = ref<WishItem[]>([
  { id: 1, title: "Шоколадка", cost: 10, done: false },
  { id: 2, title: "Вечер настольных игр", cost: 30, done: false },
  { id: 3, title: "Выходные обнимашек и целовашек", cost: 50, done: false },
  { id: 4, title: "Массаж спинки", cost: 40, done: false },
  {
    id: 5,
    title: "Совместный просмотр чего-то интересного",
    cost: 20,
    done: true,
  },
]);

// Form state
const showForm = ref(false);
const editingId = ref<number | null>(null);
const formTitle = ref("");
const formCost = ref<number>(10);

const totalCost = computed(() =>
  items.value.reduce((sum, i) => sum + i.cost, 0),
);
const completedCount = computed(() => items.value.filter((i) => i.done).length);

function openCreate() {
  editingId.value = null;
  formTitle.value = "";
  formCost.value = 10;
  showForm.value = true;
}

function openEdit(item: WishItem) {
  editingId.value = item.id;
  formTitle.value = item.title;
  formCost.value = item.cost;
  showForm.value = true;
}

function closeForm() {
  showForm.value = false;
  editingId.value = null;
  formTitle.value = "";
  formCost.value = 10;
}

function saveForm() {
  if (!formTitle.value.trim()) return;

  if (editingId.value !== null) {
    const item = items.value.find((i) => i.id === editingId.value);
    if (item) {
      item.title = formTitle.value.trim();
      item.cost = formCost.value;
    }
  } else {
    items.value.push({
      id: Date.now(),
      title: formTitle.value.trim(),
      cost: formCost.value,
      done: false,
    });
  }

  closeForm();
}

function toggleDone(item: WishItem) {
  item.done = !item.done;
}

function deleteItem(id: number) {
  items.value = items.value.filter((i) => i.id !== id);
}
</script>

<template>
  <div class="max-w-2xl mx-auto px-4 py-8 flex flex-col gap-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold tracking-tight text-foreground">
          Хотелки
        </h1>
        <p class="text-sm text-muted-foreground mt-0.5">
          {{ completedCount }} из {{ items.length }} выполнено ·
          {{ totalCost }} 🪙 всего
        </p>
      </div>
      <Button class="gap-2" size="sm" @click="openCreate">
        <Plus class="w-4 h-4" />
        Добавить
      </Button>
    </div>

    <!-- Form -->
    <Card v-if="showForm" class="border-primary/40 bg-primary/5">
      <CardContent class="px-5 py-4 flex flex-col gap-3">
        <p class="text-sm font-semibold text-foreground">
          {{ editingId ? "Редактировать хотелку" : "Новая хотелка" }}
        </p>

        <div class="flex flex-col gap-2">
          <label class="text-xs text-muted-foreground uppercase tracking-wider"
            >Название</label
          >
          <input
            v-model="formTitle"
            type="text"
            placeholder="Например: Вечер настольных игр"
            class="w-full px-3 py-2 rounded-lg bg-background border border-border/60 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 transition-colors"
            @keydown.enter="saveForm"
            @keydown.esc="closeForm"
          />
        </div>

        <div class="flex flex-col gap-2">
          <div class="flex items-center justify-between">
            <label
              class="text-xs text-muted-foreground uppercase tracking-wider"
            >
              Стоимость в монетах
            </label>
            <span class="text-sm font-semibold text-primary"
              >{{ formCost }} 🪙</span
            >
          </div>
          <input
            v-model="formCost"
            type="range"
            min="5"
            max="200"
            step="5"
            class="w-full accent-primary"
          />
          <div class="flex justify-between text-[10px] text-muted-foreground">
            <span>5</span>
            <span>50</span>
            <span>100</span>
            <span>150</span>
            <span>200</span>
          </div>
        </div>

        <Separator />

        <div class="flex gap-2">
          <Button class="flex-1 gap-2" size="sm" @click="saveForm">
            <Check class="w-3.5 h-3.5" />
            {{ editingId ? "Сохранить" : "Добавить" }}
          </Button>
          <Button variant="ghost" size="sm" class="gap-2" @click="closeForm">
            <X class="w-3.5 h-3.5" />
            Отмена
          </Button>
        </div>
      </CardContent>
    </Card>

    <!-- List -->
    <Card class="border-border/60">
      <CardContent class="px-3 py-3">
        <draggable
          v-model="items"
          item-key="id"
          handle=".drag-handle"
          :animation="180"
          ghost-class="drag-ghost"
        >
          <template #item="{ element, index }">
            <div>
              <div
                class="flex items-center gap-2 px-2 py-2.5 rounded-xl transition-all duration-150 group"
                :class="element.done ? 'opacity-50' : 'hover:bg-primary/5'"
              >
                <!-- Drag handle -->
                <GripVertical
                  class="drag-handle w-4 h-4 text-muted-foreground/40 shrink-0 cursor-grab active:cursor-grabbing group-hover:text-muted-foreground transition-colors"
                />

                <!-- Done toggle -->
                <button
                  class="shrink-0 transition-transform duration-150 hover:scale-110"
                  @click="toggleDone(element)"
                >
                  <CheckCircle2
                    v-if="element.done"
                    class="w-5 h-5 text-green-500"
                  />
                  <Circle
                    v-else
                    class="w-5 h-5 text-border hover:text-primary transition-colors"
                  />
                </button>

                <!-- Title -->
                <span
                  class="flex-1 text-sm font-medium min-w-0 truncate"
                  :class="
                    element.done
                      ? 'line-through text-muted-foreground'
                      : 'text-foreground'
                  "
                >
                  {{ element.title }}
                </span>

                <!-- Cost -->
                <span
                  class="text-xs text-muted-foreground shrink-0 tabular-nums"
                >
                  {{ element.cost }} 🪙
                </span>

                <!-- Actions -->
                <div
                  class="flex items-center gap-0.5 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity shrink-0"
                >
                  <button
                    class="p-1.5 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                    @click="openEdit(element)"
                  >
                    <Pencil class="w-3.5 h-3.5" />
                  </button>
                  <button
                    class="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                    @click="deleteItem(element.id)"
                  >
                    <Trash2 class="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <Separator
                v-if="index < items.length - 1"
                class="opacity-40 mx-2"
              />
            </div>
          </template>
        </draggable>

        <!-- Empty state -->
        <div
          v-if="items.length === 0"
          class="flex flex-col items-center justify-center py-12 gap-2"
        >
          <span class="text-4xl">💜</span>
          <p class="text-sm text-muted-foreground">
            Список пуст — добавь первую хотелку
          </p>
        </div>
      </CardContent>
    </Card>
  </div>
</template>

<style>
.drag-ghost {
  opacity: 0.4;
  background: color-mix(in srgb, var(--primary) 10%, transparent);
  border-radius: 0.75rem;
}
</style>
