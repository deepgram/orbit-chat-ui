import { ToolCall } from "@langchain/core/messages/tool";
import { unknownToPrettyDate } from "../utils";
import { ContentCopyable } from "../../messages/shared";

export function ToolCallTable({ toolCall }: { toolCall: ToolCall }) {
  return (
    <div className="max-w-full min-w-[300px] overflow-hidden rounded-lg border">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th
              className="bg-secondary px-2 py-1 text-left text-sm"
              colSpan={2}
            >
              <div className="flex items-center justify-between gap-2">
                <span>{toolCall.name}</span>
                <ContentCopyable
                  content={JSON.stringify(
                    { name: toolCall.name, id: toolCall.id, args: toolCall.args },
                    null,
                    2,
                  )}
                  disabled={false}
                />
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(toolCall.args).map(([key, value]) => {
            let valueStr = "";
            if (["string", "number"].includes(typeof value)) {
              valueStr = value.toString();
            }

            const date = unknownToPrettyDate(value);
            if (date) {
              valueStr = date;
            }

            try {
              valueStr = valueStr || JSON.stringify(value, null, 2);
            } catch (_) {
              // failed to stringify, just assign an empty string
              valueStr = "";
            }

            return (
              <tr
                key={key}
                className="border-t"
              >
                <td className="w-1/3 px-2 py-1 text-xs font-medium">{key}</td>
                <td className="px-2 py-1 font-mono text-xs whitespace-pre-wrap break-words">{valueStr.replaceAll("\\n", "\n")}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
