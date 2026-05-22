export const CHATS_CHANGED_EVENT = "engineering-ai:chats-changed";

export function notifyChatsChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(CHATS_CHANGED_EVENT));
  }
}
