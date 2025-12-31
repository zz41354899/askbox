import { createApp } from "vue";
import App from "./App.vue";
import "./assets/main.css";
import "@lottiefiles/lottie-player";

// 抑制 Vue Devtools 的 XMLHttpRequest 錯誤
const originalConsoleError = console.error;
console.error = (...args) => {
    const message = args[0]?.toString?.() || "";
    if (
        message.includes("InvalidStateError") &&
        message.includes("responseText") &&
        message.includes("responseType")
    ) {
        // 忽略這個來自 Vue Devtools 的錯誤
        return;
    }
    originalConsoleError.apply(console, args);
};

// 全域錯誤處理器
window.addEventListener("error", (event) => {
    if (
        event.message?.includes("InvalidStateError") &&
        event.filename?.includes("inspector")
    ) {
        event.preventDefault();
        return true;
    }
});

createApp(App).mount("#app");
