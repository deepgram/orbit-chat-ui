import { AIMessage, ToolMessage } from "@langchain/langgraph-sdk";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";
import { ContentCopyable } from "./shared";

function isComplexValue(value: any): boolean {
  return Array.isArray(value) || (typeof value === "object" && value !== null);
}

function normalizeNewlines(value: any): string {
  return String(value).replaceAll("\\n", "\n");
}

function ValueRenderer({ value }: { value: any }) {
  if (typeof value === "string") {
    return (
      <code className="rounded bg-secondary px-2 py-1 font-mono text-sm whitespace-pre-wrap break-words">
        {normalizeNewlines(value)}
      </code>
    );
  }

  if (typeof value !== "object" || value === null) {
    return (
      <code className="rounded bg-secondary px-2 py-1 font-mono text-sm whitespace-pre-wrap break-words">
        {String(value)}
      </code>
    );
  }

  if (Array.isArray(value)) {
    return (
      <table className="min-w-full divide-y divide-border">
        <tbody className="divide-y divide-border">
          {value.map((item, idx) => (
            <tr key={idx}>
              <td className="px-4 py-2 text-sm font-medium whitespace-nowrap text-foreground">
                {idx}
              </td>
              <td className="px-4 py-2 text-sm text-muted-foreground">
                <ValueRenderer value={item} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  // object
  return (
    <table className="min-w-full divide-y divide-border">
      <tbody className="divide-y divide-border">
        {Object.entries(value).map(([k, v], idx) => (
          <tr key={idx}>
            <td className="px-4 py-2 text-sm font-medium whitespace-nowrap text-foreground">
              {k}
            </td>
            <td className="px-4 py-2 text-sm text-muted-foreground">
              <ValueRenderer value={v} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function ToolCalls({
  toolCalls,
}: {
  toolCalls: AIMessage["tool_calls"];
}) {
  if (!toolCalls || toolCalls.length === 0) return null;

  // Hide write_todos tool calls per requirements
  const filteredToolCalls = toolCalls.filter((tc) => tc.name !== "write_todos");
  if (filteredToolCalls.length === 0) return null;

  return (
    <div className="mx-auto grid max-w-5xl grid-rows-[1fr_auto] gap-2">
      {filteredToolCalls.map((tc, idx) => {
        const args = tc.args as Record<string, any>;
        const hasArgs = Object.keys(args).length > 0;
        return (
          <div
            key={idx}
            className="overflow-hidden rounded-lg border border-border/80 bg-card/40 bg-gradient-to-b from-cyan-300/10 to-transparent ring-1 ring-cyan-300/10"
          >
            <div className="border-b border-border bg-secondary/80 px-4 py-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-medium text-foreground">
                  {tc.name}
                  {tc.id && (
                    <code className="ml-2 rounded bg-secondary px-2 py-1 text-sm">
                      {tc.id}
                    </code>
                  )}
                </h3>
                <ContentCopyable
                  content={normalizeNewlines(
                    JSON.stringify(
                      { name: tc.name, id: tc.id, args },
                      null,
                      2,
                    ),
                  )}
                  disabled={false}
                />
              </div>
            </div>
            {hasArgs ? (
              <table className="min-w-full divide-y divide-border">
                <tbody className="divide-y divide-border">
                  {Object.entries(args).map(([key, value], argIdx) => (
                    <tr key={argIdx}>
                      <td className="px-4 py-2 text-sm font-medium whitespace-nowrap text-foreground">
                        {key}
                      </td>
                      <td className="px-4 py-2 text-sm text-muted-foreground">
                        <ValueRenderer value={value} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <code className="block p-3 text-sm">{"{}"}</code>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function ToolResult({ message }: { message: ToolMessage }) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Special handling for write_todos tool results: render a themed todos table
  const isWriteTodos = message.name === "write_todos";

  function parseTodosFromContent(raw: unknown): Array<{ content: string; status: string }>|null {
    try {
      if (Array.isArray(raw)) {
        return raw as Array<{ content: string; status: string }>;
      }
      if (typeof raw === "string") {
        const trimmed = raw.trim();
        // Try direct JSON parse first
        if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
          const parsed = JSON.parse(trimmed);
          if (Array.isArray(parsed)) return parsed;
          if (parsed && Array.isArray((parsed as any).todos)) return (parsed as any).todos;
        }
        // Extract array substring like: Updated todo list to [ { 'content': '...', 'status': '...' }, ... ]
        const start = trimmed.indexOf("[");
        const end = trimmed.lastIndexOf("]");
        if (start !== -1 && end !== -1 && end > start) {
          let arrStr = trimmed.slice(start, end + 1);
          // Convert single quotes to double quotes to form valid JSON
          arrStr = arrStr.replace(/'/g, '"');
          try {
            const parsed = JSON.parse(arrStr);
            if (Array.isArray(parsed)) return parsed;
          } catch (_) {
            // fall through
          }
        }
      }
      if (typeof raw === "object" && raw !== null) {
        const asObj = raw as any;
        if (Array.isArray(asObj.todos)) return asObj.todos;
      }
    } catch {
      // ignore parse errors, fall back to default rendering
    }
    return null;
  }

  function getStatusMeta(statusRaw: string | undefined): { label: string; dotClass: string } {
    const status = (statusRaw || "pending").toLowerCase();
    if (status === "completed" || status === "done") {
      return { label: "Completed", dotClass: "bg-green-500" };
    }
    if (status === "in_progress" || status === "in-progress" || status === "working") {
      return { label: "In Progress", dotClass: "bg-yellow-400" };
    }
    return { label: "Pending", dotClass: "bg-gray-400" };
  }

  let parsedContent: any;
  let isJsonContent = false;

  try {
    if (typeof message.content === "string") {
      parsedContent = JSON.parse(message.content);
      isJsonContent = isComplexValue(parsedContent);
    }
  } catch {
    // Content is not JSON, use as is
    parsedContent = message.content;
  }

  const contentStr = isJsonContent
    ? JSON.stringify(parsedContent, null, 2)
    : String(message.content);
  const normalizedContentStr = normalizeNewlines(contentStr);
  const contentLines = normalizedContentStr.split("\n");
  const shouldTruncate = contentLines.length > 4 || normalizedContentStr.length > 500;
  const displayedContent =
    shouldTruncate && !isExpanded
      ? normalizedContentStr.length > 500
        ? normalizedContentStr.slice(0, 500) + "..."
        : contentLines.slice(0, 4).join("\n") + "\n..."
      : normalizedContentStr;

  return (
      <div className="mx-auto grid max-w-5xl grid-rows-[1fr_auto] gap-2">
      <div className="overflow-hidden rounded-lg border border-border/80 bg-card/40 bg-gradient-to-b from-violet-300/10 to-transparent ring-1 ring-violet-300/10">
        <div className="border-b border-border bg-accent/80 px-4 py-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            {message.name ? (
              <h3 className="font-medium text-foreground">
                {isWriteTodos ? (
                  <span>Todo List</span>
                ) : (
                  <>
                    Tool Result:{" "}
                    <code className="rounded bg-secondary px-2 py-1">{message.name}</code>
                  </>
                )}
              </h3>
            ) : (
              <h3 className="font-medium text-foreground">Tool Result</h3>
            )}
            <div className="flex items-center gap-2">
              {!isWriteTodos && message.tool_call_id && (
                <code className="rounded bg-secondary px-2 py-1 text-sm">
                  {message.tool_call_id}
                </code>
              )}
              {!isWriteTodos && (
                <ContentCopyable
                  content={normalizeNewlines(contentStr)}
                  disabled={false}
                />
              )}
            </div>
          </div>
        </div>
        <motion.div
          className="min-w-full bg-accent/20"
          initial={false}
          animate={{ height: "auto" }}
          transition={{ duration: 0.3 }}
        >
          <div className="p-3">
            <AnimatePresence
              mode="wait"
              initial={false}
            >
              <motion.div
                key={isExpanded ? "expanded" : "collapsed"}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
              >
                {isWriteTodos ? (
                  (() => {
                    const todos = parseTodosFromContent(message.content);
                    if (!todos || todos.length === 0) {
                      // Fallback to default rendering if unable to parse
                      return (
                        <code className="block text-sm whitespace-pre-wrap break-words">{displayedContent}</code>
                      );
                    }
                    return (
                      <table className="min-w-full divide-y divide-border">
                        <thead>
                          <tr>
                            <th className="px-4 py-2 text-left text-sm font-semibold text-foreground">Todo</th>
                            <th className="px-4 py-2 text-left text-sm font-semibold text-foreground">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {todos.map((t, idx) => {
                            const { label, dotClass } = getStatusMeta(t.status);
                            return (
                              <tr key={idx}>
                                <td className="px-4 py-2 text-sm text-muted-foreground">
                                  {t.content}
                                </td>
                                <td className="px-4 py-2 text-sm text-muted-foreground">
                                  <span className={`inline-block h-2 w-2 rounded-full ${dotClass} mr-2 align-middle`} />
                                  <span className="align-middle">{label}</span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    );
                  })()
                ) : isJsonContent ? (
                  <table className="min-w-full divide-y divide-border">
                    <tbody className="divide-y divide-border">
                      {(Array.isArray(parsedContent)
                        ? isExpanded
                          ? parsedContent
                          : parsedContent.slice(0, 5)
                        : Object.entries(parsedContent)
                      ).map((item, argIdx) => {
                        const [key, value] = Array.isArray(parsedContent)
                          ? [argIdx, item]
                          : [item[0], item[1]];
                        return (
                          <tr key={argIdx}>
                            <td className="px-4 py-2 text-sm font-medium whitespace-nowrap text-foreground">
                              {key}
                            </td>
                            <td className="px-4 py-2 text-sm text-muted-foreground">
                              <ValueRenderer value={value} />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                ) : (
                  <code className="block text-sm whitespace-pre-wrap break-words">{displayedContent}</code>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
          {!isWriteTodos && ((shouldTruncate && !isJsonContent) ||
            (isJsonContent &&
              Array.isArray(parsedContent) &&
              parsedContent.length > 5)) && (
            <motion.button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex w-full cursor-pointer items-center justify-center border-t-[1px] border-border py-2 text-muted-foreground transition-all duration-200 ease-in-out hover:bg-accent hover:text-foreground"
              initial={{ scale: 1 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isExpanded ? <ChevronUp /> : <ChevronDown />}
            </motion.button>
          )}
        </motion.div>
      </div>
    </div>
  );
}
