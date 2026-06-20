import { useQuery } from "@tanstack/react-query";
import { FileText, Download, Loader2 } from "lucide-react";
import {
  MessageAttachmentsSupabaseService,
  type MessageAttachment,
} from "@/services/supabase/message-attachments.service";

interface MessageAttachmentListProps {
  messageId: string;
}

function AttachmentItem({ attachment }: { attachment: MessageAttachment }) {
  const mime = attachment.mime_type ?? "";
  const isImage = mime.startsWith("image/");
  const isPdf = mime === "application/pdf";

  if (!attachment.public_url) {
    return (
      <span className="text-[9px] text-[#A8A8A8] italic">
        {attachment.file_name} (unavailable)
      </span>
    );
  }

  if (isImage) {
    return (
      <a
        href={attachment.public_url}
        target="_blank"
        rel="noopener noreferrer"
        className="block mt-1"
      >
        <img
          src={attachment.public_url}
          alt={attachment.file_name}
          className="max-w-full max-h-40 rounded-lg border border-white/10 object-cover"
        />
      </a>
    );
  }

  if (isPdf) {
    return (
      <div className="mt-1 space-y-1">
        <a
          href={attachment.public_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-[10px] text-[#FF7A59] hover:underline"
        >
          <FileText size={12} />
          {attachment.file_name}
        </a>
        <iframe
          src={attachment.public_url}
          title={attachment.file_name}
          className="w-full h-32 rounded-lg border border-white/10 bg-white/5"
        />
      </div>
    );
  }

  return (
    <a
      href={attachment.public_url}
      download={attachment.file_name}
      className="flex items-center gap-1.5 text-[10px] text-[#FF7A59] hover:underline mt-1"
    >
      <Download size={12} />
      {attachment.file_name}
    </a>
  );
}

export function MessageAttachmentList({ messageId }: MessageAttachmentListProps) {
  const { data: attachments = [], isLoading } = useQuery({
    queryKey: ["message_attachments", messageId],
    queryFn: () => MessageAttachmentsSupabaseService.listForMessage(messageId),
    staleTime: 60_000,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-1">
        <Loader2 size={12} className="animate-spin text-[#A8A8A8]" />
      </div>
    );
  }

  if (attachments.length === 0) return null;

  return (
    <div className="space-y-1 mt-1">
      {attachments.map((att) => (
        <AttachmentItem key={att.id} attachment={att} />
      ))}
    </div>
  );
}
