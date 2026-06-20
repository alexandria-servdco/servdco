import { useState, useRef, useEffect } from "react";
import { Bell, Check, Trash2, X } from "lucide-react";
import { useNotificationStore } from "@/store/useNotificationStore";
import { NotificationService } from "@/services/notification.service";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, unreadCount, removeNotification } = useNotificationStore();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const sortedNotifications = [...notifications].sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex items-center justify-center w-[36px] h-[36px] rounded-full border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
      >
        <Bell size={16} className="text-white/80" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-[14px] h-[14px] flex items-center justify-center bg-[#FF7A59] border border-[#111] rounded-full text-[8px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-3 w-[320px] bg-[#111113]/98 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl z-[150] overflow-hidden"
          >
            <div className="p-4 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={() => void NotificationService.markAllRead()}
                  className="text-[11px] font-medium text-[#FF7A59] hover:text-[#FF8D6B] transition-colors flex items-center gap-1"
                >
                  <Check size={12} />
                  Mark all read
                </button>
              )}
            </div>

            <div className="max-h-[350px] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="px-4 py-8 text-center text-white/40 text-xs">
                  You have no new notifications.
                </div>
              ) : (
                <div className="flex flex-col">
                  {sortedNotifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() =>
                        !notif.read && void NotificationService.markRead(notif.id)
                      }
                      className={cn(
                        "group relative px-4 py-3 border-b border-white/5 transition-colors cursor-default",
                        notif.read ? "bg-transparent" : "bg-white/[0.02]"
                      )}
                    >
                      <div className="flex gap-3 items-start">
                        <div
                          className={cn(
                            "mt-0.5 w-[6px] h-[6px] rounded-full shrink-0",
                            notif.type === "success" && "bg-emerald-500",
                            notif.type === "error" && "bg-red-500",
                            notif.type === "warning" && "bg-amber-500",
                            notif.type === "info" && "bg-blue-500"
                          )}
                        />
                        <div className="flex-1 min-w-0 pr-6">
                          <p className={cn("text-[13px] font-medium leading-tight mb-0.5", notif.read ? "text-white/70" : "text-white")}>
                            {notif.title}
                          </p>
                          <p className="text-[11.5px] text-white/50 leading-snug">
                            {notif.message}
                          </p>
                          <p className="text-[10px] text-white/30 mt-1">
                            {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeNotification(notif.id);
                        }}
                        className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 text-white/30 hover:text-red-400 transition-all p-1"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
