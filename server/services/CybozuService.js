const axios = require("axios");
const cheerio = require("cheerio");

class CybozuService {
  constructor() {
    this.baseUrl =
      process.env.CYBOZU_OFFICE_URL || "http://cybozu/cgi-bin/cbag/ag.exe";
    this.username = process.env.CYBOZU_USERNAME || "";
    this.password = process.env.CYBOZU_PASSWORD || "";

    this.axiosInstance = axios.create({
      timeout: 10000,
    });
  }

  async getTasks(user) {
    if (!this.baseUrl || !this.username || !this.password) {
      throw new Error("Cybozu Office configuration missing");
    }

    try {
      console.log("🔍 Cybozu: Attempting login to", this.baseUrl);

      // Step 1: ログインページを取得
      const loginPageResponse = await this.axiosInstance.get(this.baseUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
      });

      const cookies = loginPageResponse.headers["set-cookie"];
      console.log("🍪 Cybozu: Received cookies from login page");

      // Step 2: ログインフォームにPOST
      const loginData = new URLSearchParams({
        _System: "login",
        _Login: "1",
        LoginMethod: "1",
        _ID: this.username,
        Password: this.password,
        csrf_ticket: "",
      });

      const loginResponse = await this.axiosInstance.post(
        this.baseUrl,
        loginData,
        {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Content-Type": "application/x-www-form-urlencoded",
            Cookie: cookies ? cookies.join("; ") : "",
            Referer: this.baseUrl,
          },
          maxRedirects: 0,
          validateStatus: function (status) {
            return status < 400;
          },
        }
      );

      console.log(
        "🔐 Cybozu: Login attempt completed, status:",
        loginResponse.status
      );

      // Step 3: 認証後のCookieを取得
      const authCookies = loginResponse.headers["set-cookie"];
      const allCookies = [...(cookies || []), ...(authCookies || [])].join(
        "; "
      );

      // Step 4: 通知ページにアクセス (page=NotificationIndex&Sort=&Rev=&APP=&MENT=0)
      const notificationResponse = await this.axiosInstance.get(this.baseUrl, {
        params: {
          page: "NotificationIndex",
          Sort: "",
          Rev: "",
          APP: "",
          MENT: "1",
        },
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          Cookie: allCookies,
          Referer: this.baseUrl,
        },
      });

      console.log("�� Cybozu: Notification page response received");
      console.log("📊 Response status:", notificationResponse.status);
      console.log("📄 Response HTML preview (first 500 chars):");
      console.log(notificationResponse.data.substring(0, 500));

      // ログインページかどうかチェック (より厳密に)
      if (
        notificationResponse.data.includes("_System=login") &&
        notificationResponse.data.includes("Password")
      ) {
        console.log(
          "⚠️ Cybozu: Authentication failed - redirected to login form"
        );
        return [];
      }

      // HTMLをパースして通知一覧を抽出
      const $ = cheerio.load(notificationResponse.data);
      const notifications = [];

      // 指定されたセレクターで通知をチェック
      const targetNotifications = $(
        "div.notificationRows > div.notificationRow > div.notificationSubject > a"
      );
      console.log(
        "🔍 Cybozu: Found " +
          targetNotifications.length +
          " notifications with target selector"
      );

      if (targetNotifications.length === 0) {
        console.log("📝 Cybozu: No notifications found with target selector");

        // デバッグ: どんな要素があるか調べる
        const allNotificationRows = $("div.notificationRow");
        console.log(
          "🔍 Debug: Found " +
            allNotificationRows.length +
            " div.notificationRow elements"
        );

        const allLinks = $("a");
        console.log("🔍 Debug: Found " + allLinks.length + " total links");

        return [];
      }

      // 通知要素をパース
      targetNotifications.each((index, element) => {
        const $link = $(element);
        const title = $link.text().trim();

        if (title && title !== "件名" && title.length > 0) {
          const $notificationRow = $link.closest(".notificationRow");
          const date =
            $notificationRow.find(".notificationDate, .date").text().trim() ||
            "";
          const linkHref = $link.attr("href") || "";
          let fullUrl;
          if (linkHref.startsWith("http")) {
            fullUrl = linkHref;
          } else if (linkHref.startsWith("/")) {
            // 絶対パスの場合
            fullUrl = "http://cybozu" + linkHref;
          } else {
            // 相対パスの場合は /cgi-bin/cbag/ を補完
            fullUrl = "http://cybozu/cgi-bin/cbag/" + linkHref;
          }

          notifications.push({
            id: "cybozu_notification_" + index,
            title: title,
            //description: title, // 差出人情報を削除してタイトルのみ
            priority: 2,
            status: "open",
            assignee: "me",
            createdDate: new Date().toISOString(),
            updatedDate: new Date().toISOString(),
            dueDate: null,
            url: fullUrl,
            service: "cybozu",
            notificationDate: date,
          });
        }
      });

      console.log(
        "📋 Cybozu: Found " + notifications.length + " notifications"
      );
      return notifications;
    } catch (error) {
      console.error(
        "⚠️ Cybozu connection failed:",
        error.code || error.message
      );

      // ネットワークエラーの場合は空配列を返す
      if (
        error.code === "EHOSTUNREACH" ||
        error.code === "ECONNREFUSED" ||
        error.code === "ETIMEDOUT" ||
        error.message.includes("Failed to connect")
      ) {
        console.log("🔄 Cybozu: Network unreachable, skipping Cybozu tasks");
        return [];
      }

      throw new Error(
        "Cybozu API Error: " +
          (error.response ? error.response.status : error.message)
      );
    }
  }

  async testConnection() {
    if (!this.baseUrl || !this.username || !this.password) {
      return { connected: false, error: "Configuration missing" };
    }

    try {
      console.log("🧪 Cybozu: Testing connection with actual login...");

      // 実際のgetTasks()と同じ方法でテスト
      const loginPageResponse = await this.axiosInstance.get(this.baseUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
      });

      const cookies = loginPageResponse.headers["set-cookie"];

      const loginData = new URLSearchParams({
        _System: "login",
        _Login: "1",
        LoginMethod: "1",
        _ID: this.username,
        Password: this.password,
        csrf_ticket: "",
      });

      const loginResponse = await this.axiosInstance.post(
        this.baseUrl,
        loginData,
        {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Content-Type": "application/x-www-form-urlencoded",
            Cookie: cookies ? cookies.join("; ") : "",
            Referer: this.baseUrl,
          },
          maxRedirects: 0,
          validateStatus: function (status) {
            return status < 400;
          },
        }
      );

      if (loginResponse.status === 302) {
        return {
          connected: true,
          message: "Cybozu Office login successful (redirected)",
        };
      } else {
        return {
          connected: true,
          message: "Cybozu Office connection successful",
        };
      }
    } catch (error) {
      return {
        connected: false,
        error:
          "Connection failed: " +
          (error.response ? error.response.status : error.message),
      };
    }
  }
}

module.exports = new CybozuService();
