// 直接ブラウザのコンソールに貼り付けて実行してね♪
// フロントエンドからAPIを手動呼び出し（タイムアウト60秒）
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 60000); // 60秒タイムアウト

fetch("http://localhost:5000/api/tasks", {
  signal: controller.signal,
  headers: {
    "Content-Type": "application/json",
  },
})
  .then((response) => {
    clearTimeout(timeoutId);
    return response.json();
  })
  .then((data) => {
    console.log("📥 Manual API call response:", data);
    console.log("📊 Tasks count:", data.data?.tasks?.length);
    console.log("📋 Tasks:", data.data?.tasks);
  })
  .catch((error) => {
    clearTimeout(timeoutId);
    console.error("❌ Manual API call error:", error);
  });
