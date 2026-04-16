import axios from "axios";
import { config } from "./config";
import type { PagingListResponse, ImageGenResponse } from "./types";
import { logger } from "./logger";

export class WanxClient {
  private headers = {
    "content-type": "application/json",
    Cookie: `WANX_CN_SESSION=${config.SESSION}`,
  };

  async getTaskList(pageSize = 10): Promise<PagingListResponse> {
    try {
      const response = await axios.post<PagingListResponse>(
        `${config.BASE_URL}/v2/task/pagingList`,
        { pageSize, mediaType: "all" },
        { headers: this.headers },
      );
      return response.data;
    } catch (error: any) {
      logger.error("❌ 获取任务列表失败:", error.message);
      throw error;
    }
  }

  async submitTask(): Promise<ImageGenResponse> {
    try {
      const response = await axios.post<ImageGenResponse>(
        `${config.BASE_URL}/imageGen`,
        config.SUBMIT_PAYLOAD,
        { headers: this.headers },
      );
      return response.data;
    } catch (error: any) {
      if (error.response && error.response.status === 429) {
        return error.response.data;
      }
      logger.error("❌ 提交任务失败:", error.message);
      throw error;
    }
  }
}
