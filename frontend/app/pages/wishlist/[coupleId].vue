<script setup lang="ts">
import draggable from "vuedraggable";
import { toast } from "vue-sonner";
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
  ArrowLeft,
} from "lucide-vue-next";
import { wishesApi, type Wish } from "@/api/wishes";
import { couplesApi } from "@/api/couples";

definePageMeta({
  middleware: ["auth"],
});

const config = useRuntimeConfig();
const token = useCookie("token");
const route = useRoute();
const coupleId = Number(route.params.coupleId);

const { data: userMe } = await useFetch<{ id: number }>(
  `${config.public.apiBase}/users/me`,
  { headers: { Authorization: `Bearer ${token.value}` } },
);

const couple = await couplesApi.getOne(
  config.public.apiBase,
  token.value!,
  coupleId,
);
const isCreator = computed(() => couple.creatorId === userMe.value?.id);

const partnerName = computed(() => {
  const partner = isCreator.value ? couple.partner : couple.creator;
  if (!partner) return "Партнёр";
  return (
    partner.username ||
    `${partner.firstName ?? ""} ${partner.lastName ?? ""}`.trim() ||
    "Партнёр"
  );
});

// Хотелки
const items = ref<Wish[]>([]);
const loadingWishes = ref(true);

async function fetchWishes() {
  loadingWishes.value = true;
  try {
    items.value = await wishesApi.getAll(
      config.public.apiBase,
      token.value!,
      coupleId,
    );
  } finally {
    loadingWishes.value = false;
  }
}

await fetchWishes();

// Form state
const showForm = ref(false);
const editingId = ref<number | null>(null);
const formTitle = ref("");
const formCost = ref<number>(10);
const saving = ref(false);

// Delete confirm
const deleteConfirmId = ref<number | null>(null);

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

function openEdit(item: Wish) {
  editingId.value = item.id;
  formTitle.value = item.text;
  formCost.value = item.cost;
  showForm.value = true;
}

function closeForm() {
  showForm.value = false;
  editingId.value = null;
  formTitle.value = "";
  formCost.value = 10;
}

async function saveForm() {
  if (!formTitle.value.trim()) {
    toast.error("Введи название хотелки");
    return;
  }
  saving.value = true;
  try {
    if (editingId.value !== null) {
      await wishesApi.update(
        config.public.apiBase,
        token.value!,
        coupleId,
        editingId.value,
        { text: formTitle.value.trim(), cost: formCost.value },
      );
      toast.success("Хотелка обновлена");
    } else {
      await wishesApi.create(config.public.apiBase, token.value!, coupleId, {
        text: formTitle.value.trim(),
        cost: formCost.value,
      });
      toast.success("Хотелка добавлена");
    }
    await fetchWishes();
    closeForm();
  } catch {
    toast.error("Не удалось сохранить хотелку");
  } finally {
    saving.value = false;
  }
}

async function toggleDone(item: Wish) {
  if (isCreator.value) {
    toast.error("Отмечать выполненными может только партнёр");
    return;
  }
  try {
    await wishesApi.update(
      config.public.apiBase,
      token.value!,
      coupleId,
      item.id,
      { done: !item.done },
    );
    await fetchWishes();
    if (!item.done) {
      toast.success(`+${item.cost} 🪙 за выполнение!`);
    }
  } catch {
    toast.error("Не удалось обновить хотелку");
  }
}

async function confirmDelete(id: number) {
  deleteConfirmId.value = id;
}

async function deleteItem(id: number) {
  try {
    await wishesApi.delete(config.public.apiBase, token.value!, coupleId, id);
    await fetchWishes();
    deleteConfirmId.value = null;
    toast.success("Хотелка удалена");
  } catch {
    toast.error("Не удалось удалить хотелку");
  }
}

async function onReorder() {
  try {
    const ids = items.value.map((i) => i.id);
    await wishesApi.reorder(config.public.apiBase, token.value!, coupleId, ids);
  } catch {
    toast.error("Не удалось сохранить порядок");
  }
}
</script>

<template>
  <div class="max-w-2xl mx-auto px-4 py-8 flex flex-col gap-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <button
          class="p-2 rounded-xl hover:bg-muted transition-colors"
          @click="navigateTo('/couples')"
        >
          <ArrowLeft class="w-4 h-4 text-muted-foreground" />
        </button>
        <div>
          <h1 class="text-2xl font-bold tracking-tight text-foreground">
            Хотелки
          </h1>
          <p class="text-sm text-muted-foreground mt-0.5">
            Пара с {{ partnerName }} · {{ completedCount }} из
            {{ items.length }} выполнено · {{ totalCost }} 🪙 всего
          </p>
        </div>
      </div>
      <Button v-if="isCreator" class="gap-2" size="sm" @click="openCreate">
        <Plus class="w-4 h-4" />
        Добавить
      </Button>
    </div>

    <!-- Form -->
    <Card v-if="showForm && isCreator" class="border-primary/40 bg-primary/5">
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
          <Button
            class="flex-1 gap-2"
            size="sm"
            :disabled="saving"
            @click="saveForm"
          >
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

    <!-- Loading -->
    <div v-if="loadingWishes" class="flex justify-center py-12">
      <div
        class="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin"
      />
    </div>

    <!-- List -->
    <Card v-else class="border-border/60">
      <CardContent class="px-3 py-3">
        <draggable
          v-model="items"
          item-key="id"
          handle=".drag-handle"
          :animation="180"
          ghost-class="drag-ghost"
          :disabled="!isCreator"
          @end="onReorder"
        >
          <template #item="{ element, index }">
            <div>
              <!-- Delete confirm inline -->
              <div
                v-if="deleteConfirmId === element.id"
                class="flex items-center justify-between px-3 py-2.5 rounded-xl bg-destructive/5 border border-destructive/20"
              >
                <p class="text-sm text-foreground">
                  Удалить <span class="font-medium">«{{ element.text }}»</span>?
                </p>
                <div class="flex items-center gap-1.5 shrink-0">
                  <Button
                    variant="destructive"
                    size="sm"
                    class="h-7 px-2.5 text-xs"
                    @click="deleteItem(element.id)"
                  >
                    Удалить
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    class="h-7 px-2.5 text-xs"
                    @click="deleteConfirmId = null"
                  >
                    Отмена
                  </Button>
                </div>
              </div>

              <!-- Normal row -->
              <div
                v-else
                class="flex items-center gap-2 px-2 py-2.5 rounded-xl transition-all duration-150 group"
                :class="element.done ? 'opacity-50' : 'hover:bg-primary/5'"
              >
                <GripVertical
                  v-if="isCreator"
                  class="drag-handle w-4 h-4 text-muted-foreground/40 shrink-0 cursor-grab active:cursor-grabbing group-hover:text-muted-foreground transition-colors"
                />
                <div v-else class="w-4 shrink-0" />

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

                <span
                  class="flex-1 text-sm font-medium min-w-0 truncate"
                  :class="
                    element.done
                      ? 'line-through text-muted-foreground'
                      : 'text-foreground'
                  "
                >
                  {{ element.text }}
                </span>

                <span
                  class="text-xs text-muted-foreground shrink-0 tabular-nums"
                >
                  {{ element.cost }} 🪙
                </span>

                <div
                  v-if="isCreator"
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
                    @click="confirmDelete(element.id)"
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

        <div
          v-if="items.length === 0"
          class="flex flex-col items-center justify-center py-12 gap-2"
        >
          <span class="text-4xl">💜</span>
          <p class="text-sm text-muted-foreground">
            {{
              isCreator
                ? "Список пуст — добавь первую хотелку"
                : "Хотелок пока нет"
            }}
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
