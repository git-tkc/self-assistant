import React, { useState, useEffect } from "react";
import { AuthStatus as IAuthStatus, ServiceConfig } from "../types/types";
import { AuthService } from "../services/AuthService";

interface AuthStatusProps {
  authStatus: IAuthStatus;
  onAuthUpdate: () => void;
}

const AuthStatus: React.FC<AuthStatusProps> = ({
  authStatus,
  onAuthUpdate,
}) => {
  const [config, setConfig] = useState<ServiceConfig | null>(null);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [testing, setTesting] = useState<string | null>(null);
  const [expandedServices, setExpandedServices] = useState<
    Record<string, boolean>
  >({});
  const [connectionResults, setConnectionResults] = useState<
    Record<
      string,
      { connected: boolean; message?: string; lastChecked?: string }
    >
  >({});

  useEffect(() => {
    loadConfig();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadConfig = async () => {
    try {
      const configData = await AuthService.getServiceConfig();
      setConfig(configData);
      // 初期ロード時に全サービスの接続をテスト
      await testAllConnections();
    } catch (error) {
      console.error("Error loading config:", error);
    }
  };

  const testAllConnections = async () => {
    const services = ["cybozu", "gmail", "asana"];
    const results: Record<string, any> = {};

    for (const service of services) {
      try {
        const result = await AuthService.testServiceConnection(service);
        results[service] = {
          connected: result.connected || false,
          message: result.message || result.error,
          lastChecked: new Date().toLocaleTimeString("ja-JP"),
        };
      } catch (error) {
        results[service] = {
          connected: false,
          message: `接続エラー: ${error}`,
          lastChecked: new Date().toLocaleTimeString("ja-JP"),
        };
      }
    }

    setConnectionResults(results);
  };

  const handleAuth = async (service: "gmail" | "asana") => {
    try {
      setConnecting(service);

      // Asanaで接続テストを先に実行してPersonal Access Token使用かチェック
      if (service === "asana") {
        try {
          const testResult = await AuthService.testServiceConnection(service);
          if (testResult.connected) {
            alert(
              "✅ Asana は既にPersonal Access Tokenで接続済みです。OAuth認証は不要です。"
            );
            setConnecting(null);
            return;
          }
        } catch (error) {
          console.log("Asana test failed, proceeding with OAuth...");
        }
      }

      // 個別サービスのOAuth URLを取得
      const url = await AuthService.getServiceAuthUrl(service);

      const success = await AuthService.openAuthWindow(url, service);
      if (success) {
        onAuthUpdate();
      }
    } catch (error) {
      console.error(`Error authenticating ${service}:`, error);

      // エラーメッセージの処理
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      if (errorMessage.includes("personal access token")) {
        alert(
          `ℹ️ ${
            service === "asana" ? "Asana" : service
          } は Personal Access Token で設定済みです。OAuth認証は不要です。`
        );
      } else if (errorMessage.includes("Gmail OAuth not configured")) {
        alert(
          `⚠️ Gmail OAuth設定が不完了です。\n.envファイルにGOOGLE_CLIENT_IDとGOOGLE_CLIENT_SECRETを設定してください。`
        );
      } else if (errorMessage.includes("not configured")) {
        alert(`⚠️ ${service} の設定が不完了です。\n設定を確認してください。`);
      } else {
        alert(
          `${service}の認証に失敗しました。もう一度お試しください。\nエラー: ${errorMessage}`
        );
      }
    } finally {
      setConnecting(null);
    }
  };

  const testConnection = async (service: string) => {
    try {
      setTesting(service);
      const result = await AuthService.testServiceConnection(service);

      setConnectionResults((prev) => ({
        ...prev,
        [service]: {
          connected: result.connected || false,
          message: result.message || result.error,
          lastChecked: new Date().toLocaleTimeString("ja-JP"),
        },
      }));

      // 成功メッセージを表示
      if (result.connected) {
        alert(
          `✅ ${service} 接続成功!\n${
            result.message || "正常に接続されています"
          }`
        );
      } else {
        alert(`❌ ${service} 接続失敗\n${result.error || result.message}`);
      }
    } catch (error) {
      setConnectionResults((prev) => ({
        ...prev,
        [service]: {
          connected: false,
          message: `接続エラー: ${error}`,
          lastChecked: new Date().toLocaleTimeString("ja-JP"),
        },
      }));
      alert(`❌ ${service}接続テストに失敗しました: ${error}`);
    } finally {
      setTesting(null);
    }
  };

  const toggleServiceExpansion = (serviceName: string) => {
    setExpandedServices((prev) => ({
      ...prev,
      [serviceName]: !prev[serviceName],
    }));
  };

  const services = [
    {
      name: "cybozu",
      label: "🏢 サイボウズ",
      connected: connectionResults.cybozu?.connected || false,
      enabled: config?.cybozu.enabled || false,
      needsAuth: false,
      description:
        connectionResults.cybozu?.message ||
        (config?.cybozu.domain
          ? `ドメイン: ${config.cybozu.domain}`
          : "未設定"),
      lastChecked: connectionResults.cybozu?.lastChecked,
    },
    {
      name: "gmail",
      label: "📧 Gmail",
      connected: connectionResults.gmail?.connected || false,
      enabled: config?.gmail.enabled || false,
      needsAuth: true,
      description: connectionResults.gmail?.message || "Googleアカウント連携",
      lastChecked: connectionResults.gmail?.lastChecked,
    },
    {
      name: "asana",
      label: "📊 Asana",
      connected: connectionResults.asana?.connected || false,
      enabled: config?.asana.enabled || false,
      needsAuth: true,
      description:
        connectionResults.asana?.message || "Asanaワークスペース連携",
      lastChecked: connectionResults.asana?.lastChecked,
    },
  ];

  return (
    <div className="bg-gray-800/50 backdrop-blur-md border border-gray-700 rounded-lg shadow-xl">
      <div className="px-6 py-4 border-b border-gray-700">
        <div>
          <h2 className="text-lg font-medium text-white">サービス接続状態</h2>
          <p className="text-sm text-gray-300 mt-1">
            タスクを表示するためにサービスを接続してください
          </p>
          <div className="mt-3">
            <button
              onClick={testAllConnections}
              className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white text-sm px-4 py-2 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg"
              title="全サービスの接続をテスト"
            >
              🔄 全テスト
            </button>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-4">
        {services.map((service) => (
          <div
            key={service.name}
            className="border border-gray-600 bg-gray-700/30 rounded-lg backdrop-blur-sm hover:bg-gray-700/50 transition-all duration-200"
          >
            {/* 常に表示されるヘッダー部分 */}
            <div
              className="p-4 cursor-pointer"
              onClick={() => toggleServiceExpansion(service.name)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 min-w-0 flex-1">
                  {/* サービス名 */}
                  <h3 className="font-medium text-white text-base truncate">
                    {service.label}
                  </h3>

                  {/* 成功・失敗ステータス（アイコンのみ） */}
                  {service.connected ? (
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center">
                      <svg
                        className="w-4 h-4 text-green-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                  ) : (
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center">
                      <svg
                        className="w-4 h-4 text-red-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </div>
                  )}
                </div>

                {/* 展開/折り畳みアイコン */}
                <div className="flex-shrink-0 text-gray-400 transition-transform duration-200 ml-2">
                  {expandedServices[service.name] ? (
                    <svg
                      className="w-5 h-5 transform rotate-180"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  )}
                </div>
              </div>
            </div>

            {/* 折り畳み可能な詳細部分 */}
            {expandedServices[service.name] && (
              <div className="px-4 pb-4 border-t border-gray-600/50">
                {/* 確認日時 */}
                {service.lastChecked && (
                  <div className="mb-3 pt-3">
                    <span className="text-sm text-gray-400">
                      最終確認: {service.lastChecked}
                    </span>
                  </div>
                )}

                {/* 接続・テストボタン */}
                <div className="mb-3">
                  {service.enabled ? (
                    <div className="flex space-x-2">
                      {service.needsAuth && !service.connected && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAuth(service.name as "gmail" | "asana");
                          }}
                          disabled={connecting === service.name}
                          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-600 text-white text-sm px-4 py-2 rounded-lg transition-all duration-300 shadow-sm"
                        >
                          {connecting === service.name ? "接続中..." : "接続"}
                        </button>
                      )}

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          testConnection(service.name);
                        }}
                        disabled={testing === service.name}
                        className="bg-gray-600 hover:bg-gray-500 disabled:bg-gray-700 text-white text-sm px-4 py-2 rounded-lg transition-colors shadow-sm"
                      >
                        {testing === service.name ? "テスト中..." : "テスト"}
                      </button>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-500 px-4 py-2 bg-gray-800/50 rounded-lg inline-block">
                      未設定
                    </span>
                  )}
                </div>

                {/* メッセージ */}
                <div className="pt-2 border-t border-gray-600/50">
                  <p className="text-sm text-gray-400">{service.description}</p>
                </div>
              </div>
            )}
          </div>
        ))}

        <div className="mt-6 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg backdrop-blur-sm">
          <h4 className="text-sm font-medium text-blue-300 mb-3">
            📝 セットアップ手順
          </h4>
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <span className="text-blue-400 text-lg flex-shrink-0">🏢</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-blue-200">
                  <span className="font-medium text-blue-100">サイボウズ:</span>
                  <br />
                  .envにCYBOZU_OFFICE_URL、USERNAME、PASSWORDを設定
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <span className="text-blue-400 text-lg flex-shrink-0">📧</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-blue-200">
                  <span className="font-medium text-blue-100">Gmail:</span>
                  <br />
                  Google Cloud ConsoleでOAuth設定
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <span className="text-blue-400 text-lg flex-shrink-0">📊</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-blue-200">
                  <span className="font-medium text-blue-100">Asana:</span>
                  <br />
                  Personal Access Tokenを設定
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthStatus;
