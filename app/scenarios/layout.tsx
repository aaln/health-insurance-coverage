"use client";
import { PolicyProvider } from "@/components/policy-context";
import { AssistantRuntimeProvider } from "@assistant-ui/react";
import { useChatRuntime } from "@assistant-ui/react-ai-sdk";

export default function ScenariosLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const runtime = useChatRuntime({
    api: "/api/chat",
  });
  return (
    <AssistantRuntimeProvider runtime={runtime}>
        <PolicyProvider>
          {children}
        </PolicyProvider>
    </AssistantRuntimeProvider>
  );
}
