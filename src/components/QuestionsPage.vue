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
          <span v-for="i in 12" :key="i" class="heart-particle" :style="getParticleStyle(i)">💗</span>
        </div>
      </div>
    </Transition>

    <!-- 留言 Modal -->
    <Transition name="modal">
      <div
        v-if="selectedQuestion"
        class="fixed inset-0 z-40 bg-black/50 flex items-center justify-center p-4"
        @click.self="closeModal"
      >
        <div class="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col overflow-hidden">
          <!-- Modal 標題 -->
          <div class="p-4 border-b bg-pink-50 flex justify-between items-center">
            <h2 class="text-lg font-bold text-pink-600">💬 留言區</h2>
            <button @click="closeModal" class="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
          </div>

          <!-- 原始問題 -->
          <div class="p-4 bg-yellow-50 border-b">
            <p class="text-gray-800 whitespace-pre-line">{{ selectedQuestion.content }}</p>
            <span class="text-xs text-gray-500 mt-2 block">
              {{ new Date(selectedQuestion.created_at).toLocaleString() }}
            </span>
          </div>

          <!-- 留言列表 -->
          <div class="flex-1 overflow-y-auto p-4 space-y-3">
            <div v-if="loadingReplies" class="text-center text-gray-400">載入中…</div>
            <div v-else-if="replies.length === 0" class="text-center text-gray-400">
              還沒有留言，來當第一個吧！
            </div>
            <div
              v-for="reply in replies"
              :key="reply.id"
              class="bg-gray-50 rounded-lg p-3 border-l-4 border-pink-300"
            >
              <p class="text-gray-700 text-sm whitespace-pre-line">{{ reply.content }}</p>
              <span class="text-xs text-gray-400 mt-1 block">
                {{ new Date(reply.created_at).toLocaleString() }}
              </span>
            </div>
          </div>

          <!-- 新增留言 -->
          <div class="p-4 border-t bg-gray-50">
            <div class="flex gap-2">
              <input
                v-model="newReply"
                @keyup.enter="submitReply"
                type="text"
                placeholder="輸入匿名留言…"
                class="flex-1 px-4 py-2 border rounded-full focus:ring-2 focus:ring-pink-300 focus:outline-none"
                :disabled="submittingReply"
              />
              <button
                @click="submitReply"
                :disabled="!newReply.trim() || submittingReply"
                class="px-4 py-2 bg-pink-500 text-white rounded-full hover:bg-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {{ submittingReply ? '送出中…' : '送出' }}
              </button>
            </div>
          </div>
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
        
        <!-- 底部區域：時間 + 按鈕 -->
        <div class="flex items-center justify-between mt-3">
          <span class="text-xs text-gray-500">
            {{ new Date(q.created_at).toLocaleString() }}
          </span>
          
          <div class="flex items-center gap-2">
            <!-- 留言按鈕 -->
            <button
              @click="openReplyModal(q)"
              class="flex items-center gap-1 px-2 py-1 rounded-full bg-white/70 text-gray-600 hover:bg-gray-100 transition-all duration-200"
            >
              <span class="text-sm">💬</span>
              <span class="text-xs font-medium">{{ q.reply_count || 0 }}</span>
            </button>

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
        </div>

        <div class="absolute -top-2 left-4 w-16 h-4 bg-pink-200 rounded-sm shadow"></div>
        <div class="absolute -top-2 right-4 w-16 h-4 bg-pink-200 rounded-sm shadow"></div>
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

// 留言相關
const selectedQuestion = ref(null);
const replies = ref([]);
const loadingReplies = ref(false);
const newReply = ref("");
const submittingReply = ref(false);

// 生成散開粒子的樣式
const getParticleStyle = (index) => {
  const angle = (index - 1) * 30;
  const distance = 80 + Math.random() * 40;
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

// 開啟留言 Modal
const openReplyModal = async (question) => {
  selectedQuestion.value = question;
  loadingReplies.value = true;
  replies.value = [];

  const { data, error } = await supabase
    .from("replies")
    .select("*")
    .eq("question_id", question.id)
    .order("created_at", { ascending: true });

  if (!error && Array.isArray(data)) {
    replies.value = data;
  }
  loadingReplies.value = false;
};

// 關閉 Modal
const closeModal = () => {
  selectedQuestion.value = null;
  replies.value = [];
  newReply.value = "";
};

// 送出留言
const submitReply = async () => {
  if (!newReply.value.trim() || !selectedQuestion.value || submittingReply.value) return;
  
  submittingReply.value = true;
  const content = newReply.value.trim();

  const { data, error } = await supabase
    .from("replies")
    .insert({ question_id: selectedQuestion.value.id, content })
    .select()
    .single();

  if (!error && data) {
    replies.value.push(data);
    newReply.value = "";
    // 更新問題的留言數
    const q = questions.value.find(q => q.id === selectedQuestion.value.id);
    if (q) {
      q.reply_count = (q.reply_count || 0) + 1;
    }
  } else {
    alert("留言失敗：" + (error?.message || "未知錯誤"));
  }

  submittingReply.value = false;
};

// localStorage 相關
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

const saveLikedIds = () => {
  try {
    localStorage.setItem("askbox_liked_ids", JSON.stringify([...likedIds.value]));
  } catch (e) {
    console.error("Failed to save liked IDs:", e);
  }
};

const isLiked = (id) => likedIds.value.has(id);

const toggleLike = async (question) => {
  const qId = question.id;
  if (likingIds.value.has(qId)) return;
  likingIds.value.add(qId);

  const alreadyLiked = isLiked(qId);
  const newLikes = alreadyLiked 
    ? Math.max(0, (question.likes || 0) - 1) 
    : (question.likes || 0) + 1;

  question.likes = newLikes;
  if (alreadyLiked) {
    likedIds.value.delete(qId);
  } else {
    likedIds.value.add(qId);
    triggerHeartAnimation();
  }
  saveLikedIds();

  const { error } = await supabase
    .from("questions")
    .update({ likes: newLikes })
    .eq("id", qId);

  if (error) {
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
  
  // 查詢問題並計算留言數
  const { data, error } = await supabase
    .from("questions")
    .select(`
      *,
      replies(count)
    `)
    .order("created_at", { ascending: false });

  if (!error && Array.isArray(data)) {
    questions.value = data.map(q => ({
      ...q,
      reply_count: q.replies?.[0]?.count || 0
    }));
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

.heart-main {
  font-size: 120px;
  animation: heart-pop 0.6s cubic-bezier(0.17, 0.89, 0.32, 1.49) forwards;
  filter: drop-shadow(0 0 20px rgba(236, 72, 153, 0.6));
}

@keyframes heart-pop {
  0% { transform: scale(0); opacity: 0; }
  50% { transform: scale(1.3); opacity: 1; }
  100% { transform: scale(1); opacity: 0; }
}

.heart-particle {
  position: absolute;
  font-size: calc(24px * var(--size));
  animation: particle-fly 0.7s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
  animation-delay: var(--delay);
  opacity: 0;
}

@keyframes particle-fly {
  0% { transform: translate(0, 0) scale(0) rotate(0deg); opacity: 0; }
  20% { opacity: 1; }
  100% {
    transform: translate(
      calc(cos(var(--angle)) * var(--distance)), 
      calc(sin(var(--angle)) * var(--distance))
    ) scale(1) rotate(360deg);
    opacity: 0;
  }
}

.heart-burst-enter-active { animation: fade-in 0.1s ease-out; }
.heart-burst-leave-active { animation: fade-out 0.3s ease-in 0.5s; }

@keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
@keyframes fade-out { from { opacity: 1; } to { opacity: 0; } }

/* Modal 動畫 */
.modal-enter-active { animation: modal-in 0.3s ease-out; }
.modal-leave-active { animation: modal-out 0.2s ease-in; }

@keyframes modal-in {
  from { opacity: 0; transform: scale(0.9); }
  to { opacity: 1; transform: scale(1); }
}

@keyframes modal-out {
  from { opacity: 1; transform: scale(1); }
  to { opacity: 0; transform: scale(0.9); }
}
</style>
