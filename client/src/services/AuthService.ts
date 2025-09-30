import axios from "axios";
import { AuthStatus, AuthUrls, ServiceConfig } from "../types/types";

const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

export class AuthService {
  static async getAuthStatus(): Promise<AuthStatus> {
    try {
      const response = await api.get("/auth/status");
      return response.data.data;
    } catch (error) {
      console.error("Error getting auth status:", error);
      return { gmail: false, asana: false, cybozu: false };
    }
  }

  static async getAuthUrls(): Promise<AuthUrls> {
    try {
      const response = await api.get("/auth/urls");
      return response.data.data;
    } catch (error) {
      console.error("Error getting auth URLs:", error);
      throw new Error("Failed to get authentication URLs");
    }
  }

  static async getServiceAuthUrl(service: string): Promise<string> {
    try {
      const response = await api.get(`/auth/urls/${service}`);
      return response.data.data.url;
    } catch (error) {
      console.error(`Error getting ${service} auth URL:`, error);
      throw error;
    }
  }

  static async getServiceConfig(): Promise<ServiceConfig> {
    try {
      const response = await api.get("/services/config");
      return response.data.data;
    } catch (error) {
      console.error("Error getting service config:", error);
      throw new Error("Failed to get service configuration");
    }
  }

  static async testServiceConnection(service: string): Promise<any> {
    try {
      const response = await api.post(`/services/test/${service}`);
      return response.data.data;
    } catch (error) {
      console.error(`Error testing ${service} connection:`, error);
      throw new Error(`Failed to test ${service} connection`);
    }
  }

  static openAuthWindow(url: string, service: string): Promise<boolean> {
    return new Promise((resolve) => {
      const popup = window.open(
        url,
        `${service}_auth`,
        "width=500,height=600,scrollbars=yes,resizable=yes"
      );

      const checkClosed = setInterval(() => {
        if (popup?.closed) {
          clearInterval(checkClosed);
          // Give some time for the callback to process
          setTimeout(() => resolve(true), 1000);
        }
      }, 1000);

      // Fallback timeout
      setTimeout(() => {
        clearInterval(checkClosed);
        if (popup && !popup.closed) {
          popup.close();
        }
        resolve(false);
      }, 300000); // 5 minutes timeout
    });
  }
}
