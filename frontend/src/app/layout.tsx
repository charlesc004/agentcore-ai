import type { Metadata } from "next";
import "./globals.css";
import "@xyflow/react/dist/style.css";
import "@/styles/premium.css";
import Providers from "@/components/providers";
export const metadata: Metadata = {
  title: "AgentCore AI — Intelligent orchestration",
  description: "Build, run, and monitor intelligent agent workflows.",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
