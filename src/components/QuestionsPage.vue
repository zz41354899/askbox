<template>
  <div class="min-h-screen bg-pink-50 p-6">
    <div class="max-w-5xl mx-auto mb-6 flex justify-between items-center">
      <h1 class="text-3xl font-bold text-pink-600">大家的提問</h1>
      <button
        @click="$emit('back')"
        class="px-4 py-2 bg-pink-400 text-white rounded hover:bg-pink-500"
      >
        返回提問箱
      </button>
    </div>

    <!-- 讀取中 -->
    <div v-if="loading" class="text-center text-gray-500 mt-8">讀取中…</div>

    <!-- 沒資料 -->
    <div
      v-else-if="Array.isArray(questions) && questions.length === 0"
      class="text-center text-gray-500 mt-12 text-lg flex flex-col items-center gap-4"
    >
      <lottie-player
        src="/lottie/empty-box.json"
        background="transparent"
        speed="1"
        style="width: 250px; height: 250px"
        loop
        autoplay
      ></lottie-player>

      📭 還沒有任何提問，快來當第一個吧！
    </div>

    <!-- 有資料 -->
    <TransitionGroup
      name="note"
      tag="div"
      class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto"
    >
      <div
        v-for="q in questions"
        :key="q.id"
        class="relative bg-yellow-100 rounded-lg shadow p-5 w-full min-h-[120px] flex flex-col justify-between hover:scale-105 hover:shadow-xl active:rotate-1 transition duration-200 ease-out"
      >
        <p class="text-gray-800 text-base whitespace-pre-line">
          {{ q.content }}
        </p>
        <span class="block mt-3 text-xs text-gray-500">
          {{ new Date(q.created_at).toLocaleString() }}
        </span>

        <div
          class="absolute -top-2 left-4 w-16 h-4 bg-pink-200 rounded-sm shadow"
        ></div>
        <div
          class="absolute -top-2 right-4 w-16 h-4 bg-pink-200 rounded-sm shadow"
        ></div>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { supabase } from "../lib/supabase";

const questions = ref([]);
const loading = ref(true);

onMounted(async () => {
  const { data, error } = await supabase
    .from("questions")
    .select("*")
    .order("created_at", { ascending: false });

  if (!error && Array.isArray(data)) {
    questions.value = data;
  }
  loading.value = false;
});
</script>
