<template>
  <div class="min-h-screen bg-pink-50 p-6 relative overflow-hidden">
    <!-- 全屏愛心動畫 -->
    <Transition name="heart-burst">
      <div
        v-if="showHeartAnimation"
        class="fixed inset-0 z-50 pointer-events-none flex items-center justify-center"
      >
        <div class="heart-container">
          <span class="heart-main">❤️</span>
          <!-- 散開的小愛心 -->
          <span v-for="i in 12" :key="i" class="heart-particle" :style="getParticleStyle(i)">💗</span>
        </div>
      </div>
    </Transition>

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

      還沒有任何提問，快來當第一個吧！
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
        
        <!-- 底部區域：時間 + 按讚 -->
        <div class="flex items-center justify-between mt-3">
          <span class="text-xs text-gray-500">
            {{ new Date(q.created_at).toLocaleString() }}
          </span>
          
          <!-- 按讚按鈕 -->
          <button
            @click="toggleLike(q)"
            :disabled="likingIds.has(q.id)"
            class="flex items-center gap-1 px-2 py-1 rounded-full transition-all duration-200 active:scale-125"
            :class="isLiked(q.id) 
              ? 'bg-pink-500 text-white' 
              : 'bg-white/70 text-pink-500 hover:bg-pink-100'"
          >
            <span class="text-sm">{{ isLiked(q.id) ? '❤️' : '🤍' }}</span>
            <span class="text-xs font-medium">{{ q.likes || 0 }}</span>
          </button>
        </div>

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
import { supabase } from "../lib/supabaseClient";

const questions = ref([]);
const loading = ref(true);
const likedIds = ref(new Set());
const likingIds = ref(new Set());
const showHeartAnimation = ref(false);

// 生成散開粒子的樣式
const getParticleStyle = (index) => {
  const angle = (index - 1) * 30; // 每 30 度一個
  const distance = 80 + Math.random() * 40; // 隨機距離
  const delay = Math.random() * 0.2;
  const size = 0.5 + Math.random() * 0.5;
  
  return {
    '--angle': `${angle}deg`,
    '--distance': `${distance}px`,
    '--delay': `${delay}s`,
    '--size': size,
  };
};

// 觸發愛心動畫
const triggerHeartAnimation = () => {
  showHeartAnimation.value = true;
  setTimeout(() => {
    showHeartAnimation.value = false;
  }, 800);
};

// 從 localStorage 讀取已按讚的 ID
const loadLikedIds = () => {
  try {
    const stored = localStorage.getItem("askbox_liked_ids");
    if (stored) {
      likedIds.value = new Set(JSON.parse(stored));
    }
  } catch (e) {
    console.error("Failed to load liked IDs:", e);
  }
};

// 儲存已按讚的 ID 到 localStorage
const saveLikedIds = () => {
  try {
    localStorage.setItem(
      "askbox_liked_ids",
      JSON.stringify([...likedIds.value])
    );
  } catch (e) {
    console.error("Failed to save liked IDs:", e);
  }
};

// 檢查是否已按讚
const isLiked = (id) => likedIds.value.has(id);

// 切換按讚狀態
const toggleLike = async (question) => {
  const qId = question.id;
  
  // 防止重複點擊
  if (likingIds.value.has(qId)) return;
  likingIds.value.add(qId);

  const alreadyLiked = isLiked(qId);
  const newLikes = alreadyLiked 
    ? Math.max(0, (question.likes || 0) - 1) 
    : (question.likes || 0) + 1;

  // 樂觀更新 UI
  question.likes = newLikes;
  if (alreadyLiked) {
    likedIds.value.delete(qId);
  } else {
    likedIds.value.add(qId);
    // 只有按讚時才觸發動畫
    triggerHeartAnimation();
  }
  saveLikedIds();

  // 更新資料庫
  const { error } = await supabase
    .from("questions")
    .update({ likes: newLikes })
    .eq("id", qId);

  if (error) {
    // 發生錯誤時回滾
    console.error("Failed to update likes:", error);
    question.likes = alreadyLiked ? newLikes + 1 : newLikes - 1;
    if (alreadyLiked) {
      likedIds.value.add(qId);
    } else {
      likedIds.value.delete(qId);
    }
    saveLikedIds();
  }

  likingIds.value.delete(qId);
};

onMounted(async () => {
  loadLikedIds();
  
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

<style scoped>
/* 愛心爆發動畫容器 */
.heart-container {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 主愛心 */
.heart-main {
  font-size: 120px;
  animation: heart-pop 0.6s cubic-bezier(0.17, 0.89, 0.32, 1.49) forwards;
  filter: drop-shadow(0 0 20px rgba(236, 72, 153, 0.6));
}

@keyframes heart-pop {
  0% {
    transform: scale(0);
    opacity: 0;
  }
  50% {
    transform: scale(1.3);
    opacity: 1;
  }
  100% {
    transform: scale(1);
    opacity: 0;
  }
}

/* 散開的小愛心粒子 */
.heart-particle {
  position: absolute;
  font-size: calc(24px * var(--size));
  animation: particle-fly 0.7s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
  animation-delay: var(--delay);
  opacity: 0;
}

@keyframes particle-fly {
  0% {
    transform: translate(0, 0) scale(0) rotate(0deg);
    opacity: 0;
  }
  20% {
    opacity: 1;
  }
  100% {
    transform: 
      translate(
        calc(cos(var(--angle)) * var(--distance)), 
        calc(sin(var(--angle)) * var(--distance))
      ) 
      scale(1) 
      rotate(360deg);
    opacity: 0;
  }
}

/* Vue Transition */
.heart-burst-enter-active {
  animation: fade-in 0.1s ease-out;
}

.heart-burst-leave-active {
  animation: fade-out 0.3s ease-in 0.5s;
}

@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes fade-out {
  from { opacity: 1; }
  to { opacity: 0; }
}
</style>
