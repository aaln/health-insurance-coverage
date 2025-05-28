"use client";

import { AssistantRuntimeProvider } from "@assistant-ui/react";
import { useChatRuntime } from "@assistant-ui/react-ai-sdk";
import { PolicyProvider } from "@/components/policy-context";
import { PolicySelector } from "@/components/policy-selector";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { HeartPlus } from "lucide-react";
import { PolicyOverview } from "@/components/policy-overview";
import PolicyAnalysis from "@/components/policy-analysis";
import { useIsMobile } from "@/hooks/use-mobile";
import { AssistantModal } from "@/components/assistant-ui/assistant-modal";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export const Assistant = () => {
  const runtime = useChatRuntime({
    api: "/api/chat",
  });

  const isMobile = useIsMobile();
  return (
    <AssistantRuntimeProvider runtime={runtime}>
        <PolicyProvider>
        <SidebarProvider>
          {/* <AppSidebar /> */}
          <SidebarInset>
            <header className="w-full max-w-screen-xl mx-auto flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <Link href="/" target="_blank">
              <div className="flex items-center gap-2">
                
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                    <HeartPlus className="size-4" />
                  </div>
                  <div className="flex flex-col gap-0.5 leading-none">
                    <span className="font-semibold">Health Insurance Coverage</span>
                  </div>
                
              </div>
              </Link>
              <Separator orientation="vertical" className="mr-2 h-4" />
              <Link
                className="flex items-center gap-2"
                href="https://github.com/aaln/health-insurance-coverage"
                target="_blank"
              >
                <div className="flex flex-col justify-center leading-tight">
                  <span className="font-semibold">GitHub</span>
                  <span className="text-xs text-muted-foreground">View Open Source Repo</span>
                </div>
              </Link>
              
              {/* <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem className="hidden md:block">
                    <BreadcrumbLink href="#">
                      Check What Your Health Insurance Covers
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb> */}
              <div className="flex-1 flex justify-end">
                <PolicySelector />
              </div>
            </header> 
            <div className="flex flex-col h-full p-4 max-w-screen-xl mx-auto w-full">
              
              <PolicyOverview />
              <PolicyAnalysis />
            </div>
            {isMobile && <AssistantModal />}
          </SidebarInset>
        </SidebarProvider>
      </PolicyProvider>
    </AssistantRuntimeProvider>
  );
};
