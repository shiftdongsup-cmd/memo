"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MemoCard } from "@/components/memo-card";
import { Plus, Search, StickyNote, Moon, Sun, LogOut } from "lucide-react";

interface Memo {
  id: string;
  content: string;
}

export function MemoApp() {
  const { data: session } = useSession();
  const [memos, setMemos] = useState<Memo[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const savedTheme = localStorage.getItem("memo-theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const shouldBeDark = savedTheme === "dark" || (!savedTheme && prefersDark);
    setIsDarkMode(shouldBeDark);
    document.documentElement.classList.toggle("dark", shouldBeDark);
  }, []);

  const refreshMemos = useCallback(async () => {
    setLoadError(null);
    const res = await fetch("/api/memos");
    if (!res.ok) {
      setLoadError("메모를 불러오지 못했습니다.");
      setMemos([]);
      return;
    }
    const data: Memo[] = await res.json();
    setMemos(data);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      await refreshMemos();
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshMemos]);

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem("memo-theme", newMode ? "dark" : "light");
    document.documentElement.classList.toggle("dark", newMode);
  };

  const handleNewMemo = async () => {
    const res = await fetch("/api/memos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: "" }),
    });
    if (!res.ok) return;
    const memo: Memo = await res.json();
    setMemos((prev) => [memo, ...prev]);
    setEditingId(memo.id);
  };

  const handleSave = async (id: string, content: string) => {
    const res = await fetch(`/api/memos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    if (!res.ok) return;
    const updated: Memo = await res.json();
    setMemos((prev) => prev.map((m) => (m.id === id ? updated : m)));
    setEditingId(null);
  };

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/memos/${id}`, { method: "DELETE" });
    if (!res.ok) return;
    setMemos((prev) => prev.filter((m) => m.id !== id));
    if (editingId === id) setEditingId(null);
  };

  const handleEdit = (id: string) => {
    setEditingId(id);
  };

  const filteredMemos = useMemo(() => {
    if (!searchQuery.trim()) return memos;
    return memos.filter((memo) =>
      memo.content.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [memos, searchQuery]);

  const handleLogout = () => {
    signOut({ callbackUrl: "/login" });
  };

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${
        isDarkMode
          ? "bg-gradient-to-br from-gray-900 to-gray-800"
          : "bg-gradient-to-br from-amber-50 to-orange-100"
      }`}
    >
      <header
        className={`shadow-lg transition-colors duration-300 ${
          isDarkMode ? "bg-gray-800 text-gray-100" : "bg-amber-500 text-white"
        }`}
      >
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <StickyNote className="w-8 h-8 shrink-0" />
              <div>
                <h1 className="text-2xl font-bold">메모 앱</h1>
                {session?.user?.email && (
                  <p className={`text-sm mt-0.5 ${isDarkMode ? "text-gray-400" : "text-amber-100"}`}>
                    {session.user.email}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleLogout}
                className={
                  isDarkMode
                    ? "bg-gray-700 text-gray-100 hover:bg-gray-600 border-0"
                    : "bg-amber-600/90 text-white hover:bg-amber-700 border-0"
                }
              >
                <LogOut className="w-4 h-4 mr-2" />
                로그아웃
              </Button>
              <Button
                size="icon"
                onClick={toggleDarkMode}
                className={`rounded-full transition-all duration-300 ${
                  isDarkMode
                    ? "bg-yellow-400 hover:bg-yellow-500 text-gray-900"
                    : "bg-amber-500 hover:bg-amber-600 text-white"
                }`}
                aria-label={isDarkMode ? "라이트 모드로 전환" : "다크 모드로 전환"}
              >
                {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {loadError && (
          <div className="mb-4 rounded-md bg-destructive/15 text-destructive px-4 py-2 text-sm">
            {loadError}
            <Button variant="link" className="ml-2 h-auto p-0" onClick={() => refreshMemos()}>
              다시 시도
            </Button>
          </div>
        )}

        {loading ? (
          <p className={isDarkMode ? "text-gray-400" : "text-muted-foreground"}>불러오는 중…</p>
        ) : (
          <>
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <Button
                onClick={handleNewMemo}
                className="bg-amber-500 hover:bg-amber-600 text-white"
              >
                <Plus className="w-5 h-5 mr-2" />
                새 메모
              </Button>

              <div className="relative flex-1 max-w-md">
                <Search
                  className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                    isDarkMode ? "text-gray-400" : "text-muted-foreground"
                  }`}
                />
                <Input
                  type="text"
                  placeholder="메모 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`pl-10 transition-colors ${
                    isDarkMode
                      ? "bg-gray-700 border-gray-600 text-gray-100 placeholder:text-gray-400 focus:border-gray-500"
                      : "border-amber-300 focus:border-amber-500 focus:ring-amber-500"
                  }`}
                />
              </div>
            </div>

            {searchQuery && (
              <p className={`mb-4 ${isDarkMode ? "text-gray-400" : "text-muted-foreground"}`}>
                검색 결과: {filteredMemos.length}개의 메모
              </p>
            )}

            {filteredMemos.length === 0 ? (
              <div className="text-center py-16">
                <StickyNote
                  className={`w-16 h-16 mx-auto mb-4 ${
                    isDarkMode ? "text-gray-600" : "text-amber-300"
                  }`}
                />
                {searchQuery ? (
                  <p className={`text-lg ${isDarkMode ? "text-gray-400" : "text-muted-foreground"}`}>
                    검색 결과가 없습니다.
                  </p>
                ) : (
                  <>
                    <p
                      className={`text-lg mb-2 ${
                        isDarkMode ? "text-gray-400" : "text-muted-foreground"
                      }`}
                    >
                      아직 메모가 없습니다.
                    </p>
                    <p className={isDarkMode ? "text-gray-500" : "text-muted-foreground"}>
                      &quot;새 메모&quot; 버튼을 눌러 첫 번째 메모를 작성해보세요!
                    </p>
                  </>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredMemos.map((memo) => (
                  <MemoCard
                    key={memo.id}
                    id={memo.id}
                    content={memo.content}
                    isEditing={editingId === memo.id}
                    isDarkMode={isDarkMode}
                    onSave={handleSave}
                    onDelete={handleDelete}
                    onEdit={handleEdit}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </main>

      <footer
        className={`text-center py-6 ${isDarkMode ? "text-gray-500" : "text-muted-foreground"}`}
      >
        <p>총 {memos.length}개의 메모</p>
      </footer>
    </div>
  );
}
