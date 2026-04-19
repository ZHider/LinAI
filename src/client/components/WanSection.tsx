import { useEffect, useState } from "react";
import { hc } from "hono/client";
import {
  Card,
  Typography,
  Alert,
  Button,
  Switch,
  Space,
  Spin,
  message,
} from "antd";
import { RocketOutlined } from "@ant-design/icons";
import type { AppType } from "../../server/index";

const client = hc<AppType>("/");

const { Title, Text } = Typography;

export function WanSection() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [autoSubmit, setAutoSubmit] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchStatus = async () => {
    try {
      const res = await client.api.wan.status.$get();
      const data = await res.json();
      setIsLoggedIn(data.isLoggedIn);
      setAutoSubmit(data.autoSubmit);
      setErrorMsg(data.errorMsg);
    } catch (e) {
      console.error(e);
      message.error("获取状态失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const res = await client.api.wan.login.$post();
      const data = await res.json();
      if (!data.success) {
        message.error(data.error || "登录失败");
      } else {
        message.success("登录成功");
      }
      await fetchStatus();
    } catch (e) {
      console.error(e);
      message.error("请求登录失败");
    }
    setLoading(false);
  };

  const toggleAutoSubmit = async (checked: boolean) => {
    setAutoSubmit(checked);
    try {
      const res = await client.api.wan["auto-submit"].$post({
        json: { enable: checked },
      });
      const data = await res.json();
      if (!data.success) {
        message.error("切换自动提交失败");
        setAutoSubmit(!checked);
      }
      await fetchStatus();
    } catch (e) {
      console.error(e);
      message.error("请求失败");
      setAutoSubmit(!checked);
    }
  };

  if (loading && !isLoggedIn) {
    return (
      <Card
        bordered={false}
        className="shadow-sm rounded-xl border border-gray-100 p-6"
      >
        <div className="flex justify-center items-center py-8">
          <Spin size="large" tip="加载中..." />
        </div>
      </Card>
    );
  }

  return (
    <Card
      bordered={false}
      className="shadow-sm rounded-xl border border-gray-100"
      title={
        <Space>
          <RocketOutlined className="text-blue-500" />
          <span className="text-xl font-bold">快捷入口 - Wan 视频下载</span>
        </Space>
      }
    >
      <div className="space-y-4">
        {errorMsg && (
          <Alert
            message="错误信息"
            description={errorMsg}
            type="error"
            showIcon
            className="rounded-lg"
          />
        )}

        {!isLoggedIn ? (
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
            <Text type="secondary" className="text-base">
              您尚未登录，请先登录以继续操作。
            </Text>
            <Button
              type="primary"
              onClick={handleLogin}
              loading={loading}
              size="large"
              className="px-6 rounded-lg font-medium"
            >
              登录
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex flex-col">
              <Text strong className="text-base text-gray-900">
                自动提交任务
              </Text>
              <Text type="secondary" className="text-sm">
                开启后将自动轮询并提交新的下载任务
              </Text>
            </div>
            <Switch
              checked={autoSubmit}
              onChange={toggleAutoSubmit}
              className="bg-gray-300"
            />
          </div>
        )}
      </div>
    </Card>
  );
}
