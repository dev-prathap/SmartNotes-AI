"use client";

import dynamic from "next/dynamic";
import { useTheme } from "next-themes";
import { Theme } from "@npm_chat2db/zoer-copilot";

// 动态导入并关闭 SSR
const ZoerCopilot = dynamic(
  async () => {
    const mod = await import("@npm_chat2db/zoer-copilot");
    return mod.ZoerCopilot;
  },
  { ssr: false }
);

const ZoerCopilotComponent = () => {
  const { theme } = useTheme();

  return <ZoerCopilot theme={theme as Theme} postgrestApiKey={''} />;
};

export default ZoerCopilotComponent;
