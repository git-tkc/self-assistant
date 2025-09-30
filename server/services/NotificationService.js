const notifier = require("node-notifier");
const path = require("path");
const { exec } = require("child_process");
const os = require("os");

class NotificationService {
  constructor() {
    this.isEnabled = process.env.ENABLE_DESKTOP_NOTIFICATIONS !== "false";
    this.isWSL = this.detectWSL();
  }

  /**
   * WSL環境かどうかを検出
   */
  detectWSL() {
    try {
      // WSLの場合、/proc/versionにMicrosoft/WSLが含まれる
      const fs = require("fs");
      if (fs.existsSync("/proc/version")) {
        const version = fs.readFileSync("/proc/version", "utf8");
        return (
          version.toLowerCase().includes("microsoft") ||
          version.toLowerCase().includes("wsl")
        );
      }
      return false;
    } catch (error) {
      return false;
    }
  }

  /**
   * WSL環境でWindows通知を送信（シンプル版）
   */
  sendWSLNotification(title, message, type = "info") {
    console.log("� TASK NOTIFICATION:", title, "-", message);

    // 企業環境でも動くシンプルな通知システム
    if (process.env.ENABLE_DESKTOP_NOTIFICATIONS === "true") {
      // コンソールログに加えて、ファイルベースの通知も記録
      const notificationData = {
        timestamp: new Date().toISOString(),
        title,
        message,
        type,
      };

      // 通知ログファイルに記録（後で確認可能）
      const fs = require("fs");
      const logPath = "/tmp/personal-assistant-notifications.log";
      const logEntry = `${
        notificationData.timestamp
      } [${type.toUpperCase()}] ${title}: ${message}\n`;

      try {
        fs.appendFileSync(logPath, logEntry, "utf8");
        console.log("📝 Notification logged to:", logPath);
      } catch (error) {
        console.log("⚠️ Could not write notification log:", error.message);
      }

      // 軽量なToast通知も試行（表示されなくても問題なし）
      this.tryLightweightToast(title, message);
    } else {
      console.log("🔇 Desktop notifications disabled in environment");
    }
  }

  /**
   * 軽量なToast通知を試行（失敗しても問題なし）
   */
  tryLightweightToast(title, message) {
    const safeTitle = this.sanitizeForPowerShell(title);
    const safeMessage = this.sanitizeForPowerShell(message);

    // 動作確認済みのPowerShellコマンド（より確実）
    const psScript = `
try {
    [Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] > $null
    $template = [Windows.UI.Notifications.ToastNotificationManager]::GetTemplateContent([Windows.UI.Notifications.ToastTemplateType]::ToastText02)
    $template.GetElementsByTagName("text")[0].AppendChild($template.CreateTextNode("${safeTitle}")) > $null
    $template.GetElementsByTagName("text")[1].AppendChild($template.CreateTextNode("${safeMessage}")) > $null
    $toast = [Windows.UI.Notifications.ToastNotification]::new($template)
    $notifier = [Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier("Personal Assistant")
    $notifier.Show($toast)
} catch {
    # Toast失敗は無視（企業環境では正常）
}
`;

    const command = `powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -EncodedCommand ${Buffer.from(
      psScript,
      "utf16le"
    ).toString("base64")}`;

    exec(command, { timeout: 5000 }, (error, stdout, stderr) => {
      // 結果は無視（Toast通知はベストエフォート）
      if (!error) {
        console.log("✨ Toast notification sent using working PowerShell method");
      }
    });
  }

  /**
   * シンプルなWSL通知（フォールバック用）
   */
  sendSimpleWSLNotification(title, message) {
    const safeTitle = this.sanitizeForPowerShell(title);
    const safeMessage = this.sanitizeForPowerShell(message);

    // BurntToastモジュールを使用（あれば）
    const psCommand = `
if (Get-Module -ListAvailable -Name BurntToast) {
    Import-Module BurntToast -Force
    New-BurntToastNotification -Text '${safeTitle}', '${safeMessage}'
} else {
    # 最後の手段：コンソール出力
    Write-Host 'NOTIFICATION: ${safeTitle} - ${safeMessage}'
}`;

    const command = `powershell.exe -NoProfile -ExecutionPolicy Bypass -EncodedCommand ${Buffer.from(
      psCommand,
      "utf16le"
    ).toString("base64")}`;

    exec(command, { timeout: 10000 }, (error, stdout, stderr) => {
      if (error) {
        console.error("❌ Fallback notification also failed:", error.message);
        this.fallbackNotification(title, message);
      } else {
        console.log("✅ Fallback notification sent");
      }
    });
  }

  /**
   * PowerShell用の文字列サニタイズ（日本語保持）
   */
  sanitizeForPowerShell(str) {
    return str
      .replace(/'/g, "''") // シングルクォートをエスケープ
      .replace(/"/g, '""') // ダブルクォートをエスケープ
      .replace(/\$/g, "`$") // ドル記号をエスケープ
      .replace(/`/g, "``") // バッククォートをエスケープ
      .replace(/\n/g, " ") // 改行をスペースに
      .replace(/\r/g, "") // キャリッジリターンを削除
      .substring(0, 200); // 長さ制限
  }

  /**
   * フォールバック通知（コンソール表示）
   */
  fallbackNotification(title, message) {
    const border = "═".repeat(50);
    const timestamp = new Date().toLocaleTimeString();

    console.log(`\n╔${border}╗`);
    console.log(`║ 🔔 ${title.padEnd(46)} ║`);
    console.log(`╠${border}╣`);
    message.split("\n").forEach((line) => {
      console.log(`║ ${line.padEnd(48)} ║`);
    });
    console.log(`║ ${("⏰ " + timestamp).padEnd(48)} ║`);
    console.log(`╚${border}╝\n`);
  }

  /**
   * タスク更新完了時にデスクトップ通知を送信
   * @param {Object} summary - タスクサマリー情報
   * @param {number} summary.total - 総タスク数
   * @param {number} summary.cybozu - Cybozuタスク数
   * @param {number} summary.gmail - Gmailタスク数
   * @param {number} summary.asana - Asanaタスク数
   */
  notifyTaskUpdate(summary) {
    if (!this.isEnabled) {
      console.log("📱 Desktop notifications are disabled");
      return;
    }

    const { total, cybozu = 0, gmail = 0, asana = 0 } = summary;

    // 通知メッセージを構築
    const services = [];
    if (cybozu > 0) services.push(`Cybozu: ${cybozu}`);
    if (gmail > 0) services.push(`Gmail: ${gmail}`);
    if (asana > 0) services.push(`Asana: ${asana}`);

    const message =
      services.length > 0
        ? `📋 総タスク数: ${total}件\n${services.join(", ")}`
        : `📋 総タスク数: ${total}件\n新しいタスクはありません`;

    const title = "My Personal Assistant - タスク更新完了";

    if (this.isWSL) {
      console.log("🐧 WSL環境でWindows通知を送信中...");
      this.sendWSLNotification(title, message);
    } else {
      // 通常のnode-notifier使用
      try {
        notifier.notify(
          {
            title: title,
            message: message,
            icon: path.join(__dirname, "../assets/icon.png"),
            sound: false,
            wait: false,
            timeout: 5,
            actions: ["確認", "閉じる"],
            appID: "My Personal Assistant",
          },
          (err, response, metadata) => {
            if (err) {
              console.error("❌ Notification error:", err.message);
              this.fallbackNotification(title, message);
            } else {
              console.log("✅ Desktop notification sent successfully");
            }
          }
        );
      } catch (error) {
        console.error("❌ Failed to send desktop notification:", error.message);
        this.fallbackNotification(title, message);
      }
    }
  }

  /**
   * エラー通知を送信
   * @param {string} service - サービス名
   * @param {string} error - エラーメッセージ
   */
  notifyError(service, error) {
    if (!this.isEnabled) return;

    const title = `My Personal Assistant - ${service} エラー`;
    const message = `⚠️ ${service}でエラーが発生しました\n${error}`;

    if (this.isWSL) {
      this.sendWSLNotification(title, message, "error");
    } else {
      try {
        notifier.notify({
          title: title,
          message: message,
          icon: path.join(__dirname, "../assets/error-icon.png"),
          sound: true,
          timeout: 10,
          type: "error",
        });
      } catch (notifyError) {
        console.error(
          "❌ Failed to send error notification:",
          notifyError.message
        );
        this.fallbackNotification(title, message);
      }
    }
  }

  /**
   * 成功通知を送信
   * @param {string} message - 成功メッセージ
   */
  notifySuccess(message) {
    if (!this.isEnabled) return;

    const title = "My Personal Assistant";
    const fullMessage = `✅ ${message}`;

    if (this.isWSL) {
      this.sendWSLNotification(title, fullMessage);
    } else {
      try {
        notifier.notify({
          title: title,
          message: fullMessage,
          sound: false,
          timeout: 3,
        });
      } catch (error) {
        console.error("❌ Failed to send success notification:", error.message);
        this.fallbackNotification(title, fullMessage);
      }
    }
  }

  /**
   * 通知機能の有効/無効を切り替え
   * @param {boolean} enabled - 有効にするかどうか
   */
  setEnabled(enabled) {
    this.isEnabled = enabled;
    console.log(`📱 Desktop notifications ${enabled ? "enabled" : "disabled"}`);
  }
}

module.exports = new NotificationService();
