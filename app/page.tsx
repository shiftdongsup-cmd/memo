import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { MemoApp } from "@/components/memo-app";

export default async function HomePage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  return <MemoApp />;
}
