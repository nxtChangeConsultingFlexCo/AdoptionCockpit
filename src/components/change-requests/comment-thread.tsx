"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addComment } from "@/app/change-requests/comments-actions";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

export interface CommentItem {
  id: string;
  body: string;
  created_at: string;
  author_name: string;
}

interface CommentThreadProps {
  requestId: string;
  comments: CommentItem[];
}

const textareaClassName =
  "flex w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30";

export function CommentThread({ requestId, comments }: CommentThreadProps) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit() {
    setError(null);
    startTransition(async () => {
      const res = await addComment(requestId, body);
      if (res.error) {
        setError(res.error);
        return;
      }
      setBody("");
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-4 border-t border-border pt-4">
      <p className="text-sm font-medium text-foreground">
        Diskussion ({comments.length})
      </p>

      {comments.length === 0 ? (
        <p className="text-sm text-muted-foreground">Noch keine Kommentare.</p>
      ) : (
        <ol className="flex flex-col gap-3">
          {comments.map((comment) => (
            <li
              key={comment.id}
              className="flex flex-col gap-0.5 rounded-lg bg-muted/50 p-3 text-sm"
            >
              <p className="whitespace-pre-wrap text-foreground">{comment.body}</p>
              <span className="text-xs text-muted-foreground">
                {comment.author_name} ·{" "}
                {new Date(comment.created_at).toLocaleString("de-DE", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </li>
          ))}
        </ol>
      )}

      <div className="flex flex-col gap-2">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={3}
          placeholder="Kommentar schreiben…"
          className={textareaClassName}
        />
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <Button
          size="sm"
          className="self-start"
          disabled={isPending || !body.trim()}
          onClick={handleSubmit}
        >
          {isPending ? "Wird gesendet…" : "Kommentieren"}
        </Button>
      </div>
    </div>
  );
}
