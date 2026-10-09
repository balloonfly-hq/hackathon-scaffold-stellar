import React, {
  createContext,
  useState,
  ReactNode,
  useMemo,
  useCallback,
  useRef,
  useEffect,
} from "react";
import { Notification as StellarNotification } from "@stellar/design-system";
import "./NotificationProvider.css"; // Import CSS for sliding effect

type NotificationType =
  | "primary"
  | "secondary"
  | "success"
  | "error"
  | "warning";
interface Notification {
  id: string;
  message: string;
  type: NotificationType;
  isVisible: boolean;
}

interface NotificationContextType {
  addNotification: (message: string, type: NotificationType) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined,
);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const timeoutIdsRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());

  useEffect(() => {
    const currentTimers = timeoutIdsRef.current;
    return () => {
      currentTimers.forEach((timerId) => clearTimeout(timerId));
      currentTimers.clear();
    };
  }, []);

  const addNotification = useCallback(
    (message: string, type: NotificationType) => {
      const uniqueId =
        typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : `${type}-${Date.now().toString()}-${Math.random().toString(36).slice(2, 9)}`;

      const newNotification: Notification = {
        id: uniqueId,
        message,
        type,
        isVisible: true,
      };
      setNotifications((prev) => [...prev, newNotification]);

      const slideTimer = setTimeout(() => {
        timeoutIdsRef.current.delete(slideTimer);
        setNotifications(markRead(newNotification.id));
      }, 2500); // Start transition out after 2.5 seconds
      timeoutIdsRef.current.add(slideTimer);

      const removeTimer = setTimeout(() => {
        timeoutIdsRef.current.delete(removeTimer);
        setNotifications(filterOut(newNotification.id));
      }, 5000); // Remove after 5 seconds
      timeoutIdsRef.current.add(removeTimer);
    },
    [],
  );

  const contextValue = useMemo(() => ({ addNotification }), [addNotification]);

  return (
    <NotificationContext value={contextValue}>
      {children}
      <div className="notification-container">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`notification ${notification.isVisible ? "slide-in" : "slide-out"}`}
          >
            <StellarNotification
              title={notification.message}
              variant={notification.type}
            />
          </div>
        ))}
      </div>
    </NotificationContext>
  );
};

function markRead(
  id: Notification["id"],
): React.SetStateAction<Notification[]> {
  return (prev) =>
    prev.map((notification) =>
      notification.id === id
        ? { ...notification, isVisible: false }
        : notification,
    );
}

function filterOut(
  id: Notification["id"],
): React.SetStateAction<Notification[]> {
  return (prev) => prev.filter((notification) => notification.id !== id);
}

export { NotificationContext };
export type { NotificationContextType };
