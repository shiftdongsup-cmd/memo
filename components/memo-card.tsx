"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Pencil, Save, Trash2 } from "lucide-react";

interface MemoCardProps {
  id: string;
  content: string;
  isEditing: boolean;
  isDarkMode: boolean;
  onSave: (id: string, content: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
}

export function MemoCard({
  id,
  content,
  isEditing,
  isDarkMode,
  onSave,
  onDelete,
  onEdit,
}: MemoCardProps) {
  const [editContent, setEditContent] = useState(content);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isEditing]);

  useEffect(() => {
    setEditContent(content);
  }, [content]);

  const handleSave = () => {
    onSave(id, editContent);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && e.ctrlKey) {
      handleSave();
    }
  };

  return (
    <Card className={`h-full flex flex-col shadow-md hover:shadow-lg transition-all duration-300 ${
      isDarkMode 
        ? "bg-gray-800 border-gray-700" 
        : "bg-amber-50 border-amber-200"
    }`}>
      <CardContent className="flex-1 p-4">
        {isEditing ? (
          <Textarea
            ref={textareaRef}
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="메모를 입력하세요..."
            className={`min-h-[120px] resize-none transition-colors ${
              isDarkMode 
                ? "border-gray-600 bg-gray-700 text-gray-100 placeholder:text-gray-400 focus:border-gray-500" 
                : "border-amber-300 bg-amber-50 focus:border-amber-400 focus:ring-amber-400"
            }`}
          />
        ) : (
          <p className={`whitespace-pre-wrap min-h-[120px] ${
            isDarkMode ? "text-gray-200" : "text-foreground"
          }`}>
            {content || "빈 메모"}
          </p>
        )}
      </CardContent>
      <CardFooter className="flex justify-end gap-2 p-3 pt-0">
        {isEditing ? (
          <Button
            size="sm"
            onClick={handleSave}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <Save className="w-4 h-4 mr-1" />
            저장
          </Button>
        ) : (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onEdit(id)}
            className={`transition-colors ${
              isDarkMode 
                ? "border-gray-600 text-gray-300 hover:bg-gray-700" 
                : "border-amber-400 text-amber-700 hover:bg-amber-100"
            }`}
          >
            <Pencil className="w-4 h-4 mr-1" />
            수정
          </Button>
        )}
        <Button
          size="sm"
          variant="destructive"
          onClick={() => onDelete(id)}
        >
          <Trash2 className="w-4 h-4 mr-1" />
          삭제
        </Button>
      </CardFooter>
    </Card>
  );
}
