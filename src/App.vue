<script setup>
import { ref } from "vue";
import { supabase } from "./lib/supabaseClient";
import QuestionsPage from "./components/QuestionsPage.vue";

const mode = ref("form"); // form | done | list
const content = ref("");
const loading = ref(false);

const submit = async () => {
  if (!content.value.trim()) return;
  loading.value = true;

  const { error } = await supabase
    .from("questions")
    .insert({ content: content.value });

  loading.value = false;
  if (!error) {
    content.value = "";
    mode.value = "done";
  } else {
    alert("送出失敗：" + error.message);
  }
};
</script>

<template>
  <!-- ✍️ 提問表單 -->
  <div
    v-if="mode === 'form'"
    class="min-h-screen bg-pink-50 flex items-center justify-center p-6"
  >
    <div class="bg-white rounded-2xl shadow p-6 w-full max-w-md">
      <h1 class="text-2xl font-bold text-center mb-4 text-pink-600">提問箱</h1>

      <textarea
        v-model="content"
        placeholder="寫下你的問題…"
        class="w-full h-32 p-3 border rounded focus:ring focus:ring-pink-300"
      />

      <button
        @click="submit"
        :disabled="loading"
        class="mt-4 w-full bg-pink-500 text-white py-2 rounded disabled:opacity-50"
      >
        {{ loading ? "送出中…" : "送出" }}
      </button>

      <button
        @click="mode = 'list'"
        class="mt-4 w-full text-pink-600 underline text-sm"
      >
        查看大家的提問
      </button>
    </div>
  </div>

  <!-- 🎉 提問成功便條紙 -->
  <div
    v-else-if="mode === 'done'"
    class="min-h-screen flex items-center justify-center bg-pink-50"
  >
    <div
      class="relative bg-yellow-100 p-6 rounded shadow w-72 h-72 text-center"
    >
      <h2 class="text-xl font-bold mb-2">感謝你的提問</h2>
      <p class="text-sm text-gray-700">你的問題已收到！</p>

      <div class="mt-6 flex flex-col gap-2">
        <button
          @click="mode = 'form'"
          class="bg-pink-400 text-white px-4 py-2 rounded"
        >
          再問一題
        </button>
        <button
          @click="mode = 'list'"
          class="bg-white border border-pink-400 text-pink-600 px-4 py-2 rounded"
        >
          查看大家的提問
        </button>
      </div>

      <!-- 裝飾膠帶 -->
      <div
        class="absolute -top-2 left-6 w-20 h-5 bg-pink-200 rotate-[-8deg] shadow"
      ></div>
      <div
        class="absolute -top-2 right-6 w-20 h-5 bg-pink-200 rotate-[8deg] shadow"
      ></div>
    </div>
  </div>

  <!-- 💌 大家的提問牆 -->
  <QuestionsPage v-else-if="mode === 'list'" @back="mode = 'form'" />
</template>
