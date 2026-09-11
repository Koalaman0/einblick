import { useEffect, useMemo, useRef, useState } from "react";
import { Send, Loader2, MessageCircle, X } from "lucide-react";
import { Client } from "@stomp/stompjs";
import { cn } from "@/lib/utils";
import { apiFetch, API_BASE_URL, getToken } from "@/lib/apiConfig";
import { useAuth } from "@/contexts/AuthContext";

interface ChatRoomDto {
  roomId: number;
  otherUserId: number;
  otherUserName: string;
  lastMessage: string | null;
  lastMessageAt: string;
}

interface ChatMessageDto {
  id: number;
  roomId: number;
  senderId: number;
  senderName: string;
  content: string;
  createdAt: string;
}

interface ChatUserDto {
  id: number;
  name: string;
  loginId: string;
}

function wsUrl(): string {
  return `${API_BASE_URL.replace(/^http/, "ws")}/ws`;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("ko-KR", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function ChatPage() {
  const { user } = useAuth();
  const [rooms, setRooms] = useState<ChatRoomDto[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [activeRoomId, setActiveRoomId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessageDto[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [input, setInput] = useState("");
  const [connected, setConnected] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [contacts, setContacts] = useState<ChatUserDto[]>([]);
  const [error, setError] = useState<string | null>(null);

  const clientRef = useRef<Client | null>(null);
  const activeRoomIdRef = useRef<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeRoom = useMemo(() => rooms.find((r) => r.roomId === activeRoomId) ?? null, [rooms, activeRoomId]);

  useEffect(() => {
    activeRoomIdRef.current = activeRoomId;
  }, [activeRoomId]);

  const loadRooms = () => {
    setLoadingRooms(true);
    apiFetch("/api/chat/rooms")
      .then((res) => {
        if (!res.ok) throw new Error(`대화 목록을 불러오지 못했습니다 (${res.status})`);
        return res.json() as Promise<ChatRoomDto[]>;
      })
      .then(setRooms)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "대화 목록을 불러오지 못했습니다."))
      .finally(() => setLoadingRooms(false));
  };

  useEffect(() => {
    loadRooms();
  }, []);

  useEffect(() => {
    if (activeRoomId == null) {
      setMessages([]);
      return;
    }
    setLoadingMessages(true);
    apiFetch(`/api/chat/rooms/${activeRoomId}/messages`)
      .then((res) => {
        if (!res.ok) throw new Error(`메시지를 불러오지 못했습니다 (${res.status})`);
        return res.json() as Promise<ChatMessageDto[]>;
      })
      .then(setMessages)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "메시지를 불러오지 못했습니다."))
      .finally(() => setLoadingMessages(false));
  }, [activeRoomId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // WebSocket(STOMP)은 페이지 진입 시 한 번만 연결하고, 방을 옮길 때는 activeRoomIdRef로
  // 어떤 방 메시지인지만 판별한다 (재연결/재구독 없이 개인 큐 하나로 모든 방의 메시지를 받는다).
  useEffect(() => {
    const token = getToken();
    if (!token) return;

    const client = new Client({
      brokerURL: wsUrl(),
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 3000,
      onConnect: () => {
        setConnected(true);
        client.subscribe("/user/queue/messages", (frame) => {
          const msg = JSON.parse(frame.body) as ChatMessageDto;
          if (msg.roomId === activeRoomIdRef.current) {
            setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
          }
          setRooms((prev) => {
            const exists = prev.some((r) => r.roomId === msg.roomId);
            if (!exists) {
              loadRooms();
              return prev;
            }
            return prev
              .map((r) => (r.roomId === msg.roomId ? { ...r, lastMessage: msg.content, lastMessageAt: msg.createdAt } : r))
              .sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
          });
        });
      },
      onDisconnect: () => setConnected(false),
      onStompError: () => setError("실시간 연결에 문제가 발생했습니다."),
    });
    client.activate();
    clientRef.current = client;

    return () => {
      client.deactivate();
      clientRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openPicker = () => {
    setPickerOpen(true);
    apiFetch("/api/chat/users")
      .then((res) => (res.ok ? (res.json() as Promise<ChatUserDto[]>) : []))
      .then(setContacts)
      .catch(() => setContacts([]));
  };

  const startChat = async (otherUserId: number) => {
    try {
      const res = await apiFetch("/api/chat/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otherUserId }),
      });
      if (!res.ok) throw new Error(`대화방을 시작하지 못했습니다 (${res.status})`);
      const room = (await res.json()) as ChatRoomDto;
      setPickerOpen(false);
      setRooms((prev) => (prev.some((r) => r.roomId === room.roomId) ? prev : [room, ...prev]));
      setActiveRoomId(room.roomId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "대화방을 시작하지 못했습니다.");
    }
  };

  const sendMessage = () => {
    const content = input.trim();
    if (!content || activeRoomId == null || !clientRef.current?.connected) return;
    clientRef.current.publish({
      destination: "/app/chat.send",
      body: JSON.stringify({ roomId: activeRoomId, content }),
    });
    setInput("");
  };

  return (
    <div className="p-5 h-full flex flex-col">
      {error && (
        <div className="mb-3 px-3 py-2 rounded-lg bg-red-50 text-red-700 text-[12px] flex items-center justify-between">
          {error}
          <button onClick={() => setError(null)}><X className="w-3.5 h-3.5" /></button>
        </div>
      )}
      <div className="flex-1 flex bg-white rounded-xl border border-slate-200 overflow-hidden min-h-0">
        {/* 방 목록 */}
        <div className="w-[280px] border-r border-slate-200 flex flex-col shrink-0">
          <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
            <span className="text-[13px] font-semibold text-slate-800">메신저</span>
            <button
              onClick={openPicker}
              className="text-[12px] text-blue-600 hover:text-blue-700 font-medium"
            >
              + 새 대화
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loadingRooms ? (
              <div className="p-4 text-center text-slate-400"><Loader2 className="w-4 h-4 animate-spin inline" /></div>
            ) : rooms.length === 0 ? (
              <div className="p-4 text-[12px] text-slate-400 text-center">대화가 없습니다. 새 대화를 시작해보세요.</div>
            ) : (
              rooms.map((r) => (
                <button
                  key={r.roomId}
                  onClick={() => setActiveRoomId(r.roomId)}
                  className={cn(
                    "w-full text-left px-4 py-3 border-b border-slate-100 hover:bg-slate-50 transition-colors",
                    activeRoomId === r.roomId && "bg-blue-50 hover:bg-blue-50"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-medium text-slate-800 truncate">{r.otherUserName}</span>
                    <span className="text-[10px] text-slate-400 shrink-0">{formatTime(r.lastMessageAt)}</span>
                  </div>
                  <div className="text-[12px] text-slate-500 truncate mt-0.5">{r.lastMessage ?? "대화를 시작해보세요"}</div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* 메시지 창 */}
        <div className="flex-1 flex flex-col min-w-0">
          {activeRoom ? (
            <>
              <div className="px-4 py-3 border-b border-slate-200 flex items-center gap-2">
                <span className="text-[13px] font-semibold text-slate-800">{activeRoom.otherUserName}</span>
                {!connected && <span className="text-[10px] text-amber-600">연결 중...</span>}
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {loadingMessages ? (
                  <div className="text-center text-slate-400"><Loader2 className="w-4 h-4 animate-spin inline" /></div>
                ) : (
                  messages.map((m) => {
                    const mine = m.senderId === user?.userId;
                    return (
                      <div key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                        <div className={cn("max-w-[70%] rounded-2xl px-3.5 py-2", mine ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-800")}>
                          <div className="text-[13px] whitespace-pre-wrap break-words">{m.content}</div>
                          <div className={cn("text-[10px] mt-1", mine ? "text-blue-100" : "text-slate-400")}>{formatTime(m.createdAt)}</div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>
              <div className="p-3 border-t border-slate-200 flex items-center gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder="메시지를 입력하세요"
                  className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || !connected}
                  className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center disabled:opacity-40 hover:bg-blue-700 transition-colors shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-2">
              <MessageCircle className="w-8 h-8" />
              <span className="text-[13px]">왼쪽에서 대화를 선택하세요</span>
            </div>
          )}
        </div>
      </div>

      {pickerOpen && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={() => setPickerOpen(false)}>
          <div className="bg-white rounded-xl w-[360px] max-h-[70vh] flex flex-col shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
              <span className="text-[13px] font-semibold text-slate-800">새 대화 시작</span>
              <button onClick={() => setPickerOpen(false)}><X className="w-4 h-4 text-slate-400" /></button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {contacts.length === 0 ? (
                <div className="p-4 text-[12px] text-slate-400 text-center">불러올 사용자가 없습니다.</div>
              ) : (
                contacts.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => startChat(c.id)}
                    className="w-full text-left px-4 py-2.5 hover:bg-slate-50 flex items-center gap-2.5 border-b border-slate-100"
                  >
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white text-[11px] font-bold shrink-0">
                      {c.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="text-[13px] text-slate-800 truncate">{c.name}</div>
                      <div className="text-[11px] text-slate-400 truncate">{c.loginId}</div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
