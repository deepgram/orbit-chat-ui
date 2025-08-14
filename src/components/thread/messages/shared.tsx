import {
  XIcon,
  SendHorizontal,
  PlayCircle,
  Pencil,
  Copy,
  CopyCheck,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { TooltipIconButton } from "../tooltip-icon-button";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function ContentCopyable({
  content,
  disabled,
}: {
  content: string;
  disabled: boolean;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
  ) => {
    e.stopPropagation();

    const copyWithAsyncClipboard = async (text: string) => {
      try {
        if (navigator?.clipboard?.writeText) {
          await navigator.clipboard.writeText(text);
          return true;
        }
      } catch {
        // fall through to fallback
      }
      return false;
    };

    const copyWithFallback = (text: string) => {
      try {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.setAttribute("readonly", "");
        textarea.style.position = "absolute";
        textarea.style.left = "-9999px";
        document.body.appendChild(textarea);
        textarea.select();
        textarea.setSelectionRange(0, textarea.value.length);
        const success = document.execCommand("copy");
        document.body.removeChild(textarea);
        return success;
      } catch {
        return false;
      }
    };

    const didCopy = (await copyWithAsyncClipboard(content)) || copyWithFallback(content);
    if (didCopy) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Copied to clipboard");
    } else {
      toast.error("Failed to copy", {
        description: "Your browser blocked clipboard access.",
      });
    }
  };

  return (
    <TooltipIconButton
      onClick={(e) => handleCopy(e)}
      variant="ghost"
      tooltip="Copy content"
      disabled={disabled}
    >
      <AnimatePresence
        mode="wait"
        initial={false}
      >
        {copied ? (
          <motion.div
            key="check"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.15 }}
          >
            <CopyCheck className="text-green-500" />
          </motion.div>
        ) : (
          <motion.div
            key="copy"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.15 }}
          >
            <Copy />
          </motion.div>
        )}
      </AnimatePresence>
    </TooltipIconButton>
  );
}

export function BranchSwitcher({
  branch,
  branchOptions,
  onSelect,
  isLoading,
}: {
  branch: string | undefined;
  branchOptions: string[] | undefined;
  onSelect: (branch: string) => void;
  isLoading: boolean;
}) {
  if (!branchOptions || !branch) return null;
  const index = branchOptions.indexOf(branch);

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="icon"
        className="size-6 p-1"
        onClick={() => {
          const prevBranch = branchOptions[index - 1];
          if (!prevBranch) return;
          onSelect(prevBranch);
        }}
        disabled={isLoading}
      >
        <ChevronLeft />
      </Button>
      <span className="text-sm">
        {index + 1} / {branchOptions.length}
      </span>
      <Button
        variant="ghost"
        size="icon"
        className="size-6 p-1"
        onClick={() => {
          const nextBranch = branchOptions[index + 1];
          if (!nextBranch) return;
          onSelect(nextBranch);
        }}
        disabled={isLoading}
      >
        <ChevronRight />
      </Button>
    </div>
  );
}

export function CommandBar({
  content,
  isHumanMessage,
  isAiMessage,
  hideCopyButton,
  isEditing,
  setIsEditing,
  handleSubmitEdit,
  handleRegenerate,
  isLoading,
}: {
  content: string;
  isHumanMessage?: boolean;
  isAiMessage?: boolean;
  hideCopyButton?: boolean;
  isEditing?: boolean;
  setIsEditing?: React.Dispatch<React.SetStateAction<boolean>>;
  handleSubmitEdit?: () => void;
  handleRegenerate?: () => void;
  isLoading: boolean;
}) {
  if (isHumanMessage && isAiMessage) {
    throw new Error(
      "Can only set one of isHumanMessage or isAiMessage to true, not both.",
    );
  }

  if (!isHumanMessage && !isAiMessage) {
    throw new Error(
      "One of isHumanMessage or isAiMessage must be set to true.",
    );
  }

  if (
    isHumanMessage &&
    (isEditing === undefined ||
      setIsEditing === undefined ||
      handleSubmitEdit === undefined)
  ) {
    throw new Error(
      "If isHumanMessage is true, all of isEditing, setIsEditing, and handleSubmitEdit must be set.",
    );
  }

  const showEdit =
    isHumanMessage &&
    isEditing !== undefined &&
    !!setIsEditing &&
    !!handleSubmitEdit;

  if (isHumanMessage && isEditing && !!setIsEditing && !!handleSubmitEdit) {
    return (
      <div className="flex items-center gap-2">
        <TooltipIconButton
          disabled={isLoading}
          tooltip="Cancel edit"
          variant="ghost"
          onClick={() => {
            setIsEditing(false);
          }}
        >
          <XIcon />
        </TooltipIconButton>
        <TooltipIconButton
          disabled={isLoading}
          tooltip="Submit"
          variant="secondary"
          onClick={handleSubmitEdit}
        >
          <SendHorizontal />
        </TooltipIconButton>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {!hideCopyButton && (
        <ContentCopyable
          content={content}
          disabled={isLoading}
        />
      )}
      {isAiMessage && !!handleRegenerate && (
        <TooltipIconButton
          disabled={isLoading}
          tooltip="Resume from"
          variant="ghost"
          onClick={handleRegenerate}
        >
          <PlayCircle />
        </TooltipIconButton>
      )}
      {showEdit && (
        <TooltipIconButton
          disabled={isLoading}
          tooltip="Edit"
          variant="ghost"
          onClick={() => {
            setIsEditing?.(true);
          }}
        >
          <Pencil />
        </TooltipIconButton>
      )}
    </div>
  );
}
