<script setup lang="ts">
import { toast } from "vue-sonner";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import Switch from "@/components/ui/switch/Switch.vue";
import {
  Copy,
  Plus,
  MessageSquareText,
  Check,
  Pencil,
  Trash2,
  X,
  ArrowLeft,
  Heart,
} from "lucide-vue-next";

definePageMeta({
  middleware: ["auth"],
});

const config = useRuntimeConfig();
const token = useCookie("token");

const headers = computed(() => ({
  Authorization: `Bearer ${token.value}`,
}));

interface Template {
  id: number;
  title: string;
  text: string;
  tag?: string;
  order: number;
  includeWishes: boolean;
}

const { data: templates, refresh } = await useFetch<Template[]>(
  `${config.public.apiBase}/templates`,
  { headers },
);

// Copy
const copiedId = ref<number | null>(null);
async function copyText(id: number, text: string) {
  await navigator.clipboard.writeText(text);
  copiedId.value = id;
  setTimeout(() => (copiedId.value = null), 2000);
}

// Form
const showForm = ref(false);
const editingId = ref<number | null>(null);
const formTitle = ref("");
const formText = ref("");
const formTag = ref("");
const formIncludeWishes = ref(false);
const saving = ref(false);
const deleteConfirmId = ref<number | null>(null);

function openCreate() {
  editingId.value = null;
  formTitle.value = "";
  formText.value = "";
  formTag.value = "";
  formIncludeWishes.value = false;
  showForm.value = true;
}

function openEdit(t: Template) {
  editingId.value = t.id;
  formTitle.value = t.title;
  formText.value = t.text;
  formTag.value = t.tag ?? "";
  formIncludeWishes.value = t.includeWishes;
  showForm.value = true;
}

function closeForm() {
  showForm.value = false;
  editingId.value = null;
  formTitle.value = "";
  formText.value = "";
  formTag.value = "";
  formIncludeWishes.value = false;
}

async function saveForm() {
  if (!formTitle.value.trim() || !formText.value.trim()) {
    toast.error("Заполни название и текст");
    return;
  }
  saving.value = true;
  try {
    const body = {
      title: formTitle.value.trim(),
      text: formText.value.trim(),
      tag: formTag.value.trim() || null,
      includeWishes: formIncludeWishes.value,
    };

    if (editingId.value !== null) {
      await $fetch(`${config.public.apiBase}/templates/${editingId.value}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token.value}` },
        body,
      });
      toast.success("Шаблон обновлён");
    } else {
      await $fetch(`${config.public.apiBase}/templates`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token.value}` },
        body,
      });
      toast.success("Шаблон добавлен");
    }
    await refresh();
    closeForm();
  } catch {
    toast.error("Не удалось сохранить шаблон");
  } finally {
    saving.value = false;
  }
}

async function deleteTemplate(id: number) {
  try {
    await $fetch(`${config.public.apiBase}/templates/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token.value}` },
    });
    await refresh();
    deleteConfirmId.value = null;
    toast.success("Шаблон удалён");
  } catch {
    toast.error("Не удалось удалить шаблон");
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
          @click="navigateTo('/subscription')"
        >
          <ArrowLeft class="w-4 h-4 text-muted-foreground" />
        </button>
        <div>
          <h1 class="text-2xl font-bold tracking-tight text-foreground">
            Шаблоны
          </h1>
          <p class="text-sm text-muted-foreground mt-0.5">
            Готовые сообщения — отправляются партнёру при запуске цикла
          </p>
        </div>
      </div>
      <Button size="sm" class="gap-2" @click="openCreate">
        <Plus class="w-4 h-4" />
        Добавить
      </Button>
    </div>

    <!-- Form -->
    <Card v-if="showForm" class="border-primary/40 bg-primary/5">
      <CardContent class="px-5 py-4 flex flex-col gap-3">
        <p class="text-sm font-semibold text-foreground">
          {{ editingId ? "Редактировать шаблон" : "Новый шаблон" }}
        </p>

        <div class="flex flex-col gap-2">
          <label class="text-xs text-muted-foreground uppercase tracking-wider"
            >Название</label
          >
          <input
            v-model="formTitle"
            type="text"
            placeholder="Например: Ежемесячное обновление"
            class="w-full px-3 py-2 rounded-lg bg-background border border-border/60 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 transition-colors"
          />
        </div>

        <div class="flex flex-col gap-2">
          <label class="text-xs text-muted-foreground uppercase tracking-wider"
            >Тег (необязательно)</label
          >
          <input
            v-model="formTag"
            type="text"
            placeholder="Например: Основное"
            class="w-full px-3 py-2 rounded-lg bg-background border border-border/60 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 transition-colors"
          />
        </div>

        <div class="flex flex-col gap-2">
          <label class="text-xs text-muted-foreground uppercase tracking-wider"
            >Текст сообщения</label
          >
          <textarea
            v-model="formText"
            rows="6"
            placeholder="Текст который придёт партнёру..."
            class="w-full px-3 py-2 rounded-lg bg-background border border-border/60 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 transition-colors resize-none"
          />
        </div>

        <!-- Include wishes toggle -->
        <div
          class="flex items-center justify-between py-2.5 px-3 rounded-lg bg-background border border-border/50"
        >
          <div class="flex items-center gap-2.5">
            <Heart class="w-4 h-4 text-primary" />
            <div>
              <p class="text-sm font-medium text-foreground">
                Включить хотелки
              </p>
              <p class="text-xs text-muted-foreground">
                Отправляется только после «ДА» в боте
              </p>
            </div>
          </div>
          <Switch v-model="formIncludeWishes" />
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

    <!-- Empty state -->
    <div
      v-if="!templates?.length && !showForm"
      class="flex flex-col items-center py-12 gap-3"
    >
      <span class="text-4xl">📝</span>
      <p class="text-base font-semibold text-foreground">Нет шаблонов</p>
      <p class="text-sm text-muted-foreground text-center max-w-xs">
        Добавь шаблоны — они будут автоматически отправляться партнёру при
        запуске нового цикла
      </p>
      <Button size="sm" class="gap-2 mt-1" @click="openCreate">
        <Plus class="w-4 h-4" />
        Добавить первый шаблон
      </Button>
    </div>

    <!-- Templates list -->
    <div class="flex flex-col gap-4">
      <Card
        v-for="template in templates"
        :key="template.id"
        class="border-border/60"
      >
        <CardHeader class="px-5 pt-4 pb-2">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2 min-w-0">
              <MessageSquareText class="w-4 h-4 text-primary shrink-0" />
              <p class="text-sm font-semibold text-foreground truncate">
                {{ template.title }}
              </p>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <Badge
                v-if="template.includeWishes"
                class="text-[10px] px-2 py-0 bg-primary/15 text-primary border-primary/25"
              >
                + хотелки
              </Badge>
              <Badge
                v-else-if="template.tag"
                variant="secondary"
                class="text-[10px] px-2 py-0"
              >
                {{ template.tag }}
              </Badge>
              <button
                class="p-1.5 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                @click="openEdit(template)"
              >
                <Pencil class="w-3.5 h-3.5" />
              </button>
              <button
                class="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                @click="deleteConfirmId = template.id"
              >
                <Trash2 class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </CardHeader>

        <CardContent class="px-5 pb-4 flex flex-col gap-3">
          <!-- Delete confirm -->
          <div
            v-if="deleteConfirmId === template.id"
            class="flex items-center justify-between py-2 px-3 rounded-xl bg-destructive/5 border border-destructive/20"
          >
            <p class="text-sm text-foreground">Удалить шаблон?</p>
            <div class="flex gap-1.5">
              <Button
                variant="destructive"
                size="sm"
                class="h-7 px-2.5 text-xs"
                @click="deleteTemplate(template.id)"
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
