import { useState, useRef, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Bell, Check, X } from "lucide-react";
import { useNotificationStore } from "@/store/useNotificationStore";
import { NotificationService } from "@/services/notification.service";
import {
  inferCategory,
  inferNotificationRoute,
  type NotifCategory,
} from "@/lib/notificationRoutes";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const CATEGORY_TABS: { id: NotifCategory; label: string }[] = [
  { id: "all", label: "All" },
  { id: "booking", label: "Booking" },
  { id: "verification", label: "Verification" },
  { id: "payment", label: "Payment" },
  { id: "message", label: "Message" },
];

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [category, setCategory] = useState<NotifCategory>("all");
  const { notifications, unreadCount, removeNotification } = useNotificationStore();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const sortedNotifications = useMemo(
    () =>
      [...notifications]
        .filter(
          (n) =>
            category === "all" ||
            inferCategory(n.title, n.message) === category,
        )
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        ),
    [notifications, category],
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleNotificationClick = (notif: (typeof notifications)[0]) => {
    if (!notif.read) void NotificationService.markRead(notif.id);
    const route = inferNotificationRoute(
      notif.title,
      notif.message,
      location.pathname,
    );
    if (route) {
      setIsOpen(false);
      navigate(route);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex items-center justify-center w-[36px] h-[36px] rounded-full border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
        aria-label="Notifications"
        aria-expanded={isOpen}
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
            className="absolute right-0 mt-3 w-[340px] bg-[#161616] border border-white/10 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.65)] z-[200] overflow-hidden isolate"
          >
            <div className="p-4 border-b border-white/8 flex items-center justify-between bg-[#161616]">
              <h3 className="text-sm font-semibold text-white">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={() => void NotificationService.markAllRead()}
                  className="text-[11px] font-medium text-[#FF7A59] hover:text-[#FF8D6B] transition-colors flex items-center gap-1"
                >
                  <Check size={12} />
                  Mark all read
                </button>
              )}
            </div>

            <div className="flex gap-1 px-3 py-2 border-b border-white/5 bg-[#141414] overflow-x-auto servd-scrollbar">
              {CATEGORY_TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setCategory(tab.id)}
                  className={cn(
                    "shrink-0 px-2.5 py-1 rounded-lg text-[10px] font-semibold uppercase tracking-wide transition-colors",
                    category === tab.id
                      ? "bg-[#FF7A59]/20 text-[#FF7A59]"
                      : "text-white/50 hover:text-white/80 hover:bg-white/5",
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="max-h-[350px] overflow-y-auto bg-[#161616] servd-scrollbar">
              {sortedNotifications.length === 0 ? (
                <div className="px-4 py-8 text-center text-white/40 text-xs">
                  No notifications in this category.
                </div>
              ) : (
                <div className="flex flex-col">
                  {sortedNotifications.map((notif) => {
                    const hasRoute = Boolean(
                      inferNotificationRoute(
                        notif.title,
                        notif.message,
                        location.pathname,
                      ),
                    );
                    return (
                      <div
                        key={notif.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => handleNotificationClick(notif)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            handleNotificationClick(notif);
                          }
                        }}
                        className={cn(
                          "group relative px-4 py-3 border-b border-white/5 transition-colors",
                          hasRoute ? "cursor-pointer hover:bg-white/[0.03]" : "cursor-default",
                          notif.read ? "bg-[#161616]" : "bg-[#1A1A1A]",
                        )}
                      >
                        <div className="flex gap-3 items-start">
                          <div
                            className={cn(
                              "mt-1 w-[6px] h-[6px] rounded-full shrink-0",
                              notif.read ? "bg-white/20" : "bg-[#FF7A59]",
                              !notif.read &&
                                notif.type === "success" &&
                                "bg-emerald-500",
                              !notif.read &&
                                notif.type === "error" &&
                                "bg-red-500",
                              !notif.read &&
                                notif.type === "warning" &&
                                "bg-amber-500",
                            )}
                          />
                          <div className="flex-1 min-w-0 pr-6">
                            <p
                              className={cn(
                                "text-[13px] font-medium leading-tight mb-0.5",
                                notif.read ? "text-white/70" : "text-white",
                              )}
                            >
                              {notif.title}
                            </p>
                            <p className="text-[11.5px] text-white/60 leading-snug">
                              {notif.message}
                            </p>
                            <p className="text-[10px] text-white/35 mt-1">
                              {new Date(notif.createdAt).toLocaleString([], {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeNotification(notif.id);
                          }}
                          className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 text-white/30 hover:text-red-400 transition-all p-1"
                          aria-label="Dismiss notification"
                        >
                          <X size={13} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
