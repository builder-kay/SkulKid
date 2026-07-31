import { Fragment } from "react";
import { cn } from "@/lib/utils";

const urlPattern = /\b((?:https?:\/\/|www\.)[^\s<]+)/gi;

function normalizeHref(raw: string) {
  const trimmed = raw.replace(/[),.!?;:'"]+$/g, "");
  const trailing = raw.slice(trimmed.length);
  const href = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  return { href, label: trimmed, trailing };
}

export function ChatMessageText({
  body,
  linkify = false,
  className,
  linkClassName
}: {
  body: string;
  linkify?: boolean;
  className?: string;
  linkClassName?: string;
}) {
  if (!linkify) {
    return <p className={className}>{body}</p>;
  }

  const parts: Array<string | { href: string; label: string; trailing: string }> = [];
  let lastIndex = 0;
  for (const match of body.matchAll(urlPattern)) {
    const index = match.index ?? 0;
    if (index > lastIndex) parts.push(body.slice(lastIndex, index));
    parts.push(normalizeHref(match[1]));
    lastIndex = index + match[1].length;
  }
  if (lastIndex < body.length) parts.push(body.slice(lastIndex));

  return (
    <p className={className}>
      {parts.map((part, index) =>
        typeof part === "string" ? (
          <Fragment key={index}>{part}</Fragment>
        ) : (
          <Fragment key={index}>
            <a
              className={cn("underline underline-offset-2 break-all", linkClassName)}
              href={part.href}
              rel="noopener noreferrer"
              target="_blank"
            >
              {part.label}
            </a>
            {part.trailing}
          </Fragment>
        )
      )}
    </p>
  );
}
