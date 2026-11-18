import type { Metadata } from "next";
import type { ReactNode } from "react";
import { MiNav } from "@/components/cuenta/MiNav";

export const metadata: Metadata = { title: { default: "Mi área", template: "%s · Mi área · Rioja Abierta" }, robots: { index: false } };

export default function LayoutMi({ children }: { children: ReactNode }) {
  return (
    <>
      <MiNav />
      {children}
    </>
  );
}
