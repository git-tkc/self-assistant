// Test API call to check response structure
const axios = require("axios");

async function testAPI() {
  try {
    console.log("🔄 Testing API call to localhost:5000/api/tasks");
    const response = await axios.get("http://localhost:5000/api/tasks");

    console.log("📥 Response Status:", response.status);
    console.log("📊 Response Data Structure:");
    console.log("  - success:", response.data.success);
    console.log("  - data exists:", !!response.data.data);
    console.log("  - tasks exists:", !!response.data.data?.tasks);
    console.log("  - tasks count:", response.data.data?.tasks?.length || 0);
    console.log("  - errors:", response.data.data?.errors);

    if (response.data.data?.tasks?.length > 0) {
      console.log("📋 First task sample:", response.data.data.tasks[0]);
    }
  } catch (error) {
    console.error("❌ API Test Error:", error.message);
  }
}

testAPI();
