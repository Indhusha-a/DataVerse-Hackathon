import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Bot, Check, Lock, Send, ShieldCheck, Sparkles, X } from 'lucide-react'
import { useAuthStore } from '@/store/useAuthStore'
import { useUiStore } from '@/store/useUiStore'
import { ROLE_LABEL } from '@/lib/labels'
import { apiRequest, ApiError, errorMessage, readToken } from '@/api/client'
import { ALLOWED_SCOPE, RESTRICTED_SCOPE, SUGGESTED_PROMPTS } from './scope'

interface ChatResponse {
  reply: string
  tool_calls: string[]
}

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  text?: string
  tools?: string[]
  error?: boolean
  pending?: boolean
}

const TOOL_LABEL: Record<string, string> = {
  get_order_status: 'Checked order status',
  get_today_trips: "Checked today's trips",
  get_deferred_orders: 'Checked deferred orders',
  get_notifications: 'Checked notifications',
  get_system_health: 'Checked system health',
  get_audit_log: 'Checked the audit log',
  get_users: 'Checked user accounts',
  get_fleet: 'Checked the fleet',
}

export function AIAssistant() {
  const { aiOpen, toggleAi, closeAi } = useUiStore()
  const currentUser = useAuthStore((s) => s.currentUser)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')

  if (!currentUser) return null

  async function send(text: string) {
    const message = text.trim()
    if (!message || !currentUser) return
    const pendingId = crypto.randomUUID()
    setMessages((m) => [
      ...m,
      { id: crypto.randomUUID(), role: 'user', text: message },
      { id: pendingId, role: 'assistant', pending: true },
    ])
    setInput('')

    try {
      const response = await apiRequest<ChatResponse>('/chat', {
        method: 'POST',
        body: { message },
        token: readToken(),
      })
      setMessages((m) =>
        m.map((msg) =>
          msg.id === pendingId ? { ...msg, pending: false, text: response.reply, tools: response.tool_calls } : msg,
        ),
      )
    } catch (error) {
      const unavailable = error instanceof ApiError && (error.status === 0 || error.status >= 500)
      setMessages((m) =>
        m.map((msg) =>
          msg.id === pendingId
            ? {
                ...msg,
                pending: false,
                error: true,
                text: unavailable
                  ? 'The assistant service is not reachable. It needs an LLM key in the environment file to answer.'
                  : errorMessage(error),
              }
            : msg,
        ),
      )
    }
  }

  return (
    <>
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.3 }}
        className="fixed right-5 bottom-6 z-[60] lg:right-8"
      >
        {!aiOpen && (
          <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-brand-500/40" style={{ animationDuration: '2.5s' }} />
        )}
        <motion.button
          onClick={toggleAi}
          aria-label={aiOpen ? 'Close assistant' : 'Open assistant'}
          whileHover={{ scale: 1.08, y: -2 }}
          whileTap={{ scale: 0.94 }}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-600 text-white shadow-[0_8px_24px_-4px_rgba(79,70,229,0.55)] ring-4 ring-white"
        >
          <AnimatePresence mode="wait" initial={false}>
            {aiOpen ? (
              <motion.span key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
                <X className="h-5 w-5" />
              </motion.span>
            ) : (
              <motion.span key="open" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}>
                <Sparkles className="h-5 w-5" />
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </motion.div>

      <AnimatePresence>
        {aiOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeAi}
              className="fixed inset-0 z-50 lg:hidden"
            />
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.97 }}
              transition={{ duration: 0.18 }}
              className="fixed right-4 bottom-24 z-[60] flex h-[560px] w-[380px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl lg:right-8"
            >
              <div className="flex items-center gap-3 bg-navy-950 px-4 py-3.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600">
                  <Bot className="h-4 w-4 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-white">WAYPOINT AI</p>
                  <p className="truncate text-[11px] text-slate-400">Operational assistant · {ROLE_LABEL[currentUser.role]} access</p>
                </div>
              </div>

              <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
                {messages.length === 0 && (
                  <div>
                    <div className="mb-4 rounded-xl bg-slate-50 p-3">
                      <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-slate-600">
                        <ShieldCheck className="h-3.5 w-3.5 text-success-600" /> In scope for you
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {ALLOWED_SCOPE[currentUser.role].map((s) => (
                          <span key={s} className="rounded-full bg-success-50 px-2 py-0.5 text-[11px] text-success-600">{s}</span>
                        ))}
                      </div>
                      {RESTRICTED_SCOPE[currentUser.role].length > 0 && (
                        <>
                          <p className="mt-3 mb-2 flex items-center gap-1.5 text-xs font-medium text-slate-600">
                            <Lock className="h-3.5 w-3.5 text-slate-400" /> Restricted
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {RESTRICTED_SCOPE[currentUser.role].map((s) => (
                              <span key={s} className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-400">{s}</span>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                    <p className="mb-2 text-xs font-medium text-slate-400">Try asking</p>
                    <div className="space-y-1.5">
                      {SUGGESTED_PROMPTS[currentUser.role].map((p) => (
                        <button
                          key={p}
                          onClick={() => send(p)}
                          className="block w-full rounded-lg border border-slate-200 px-3 py-2 text-left text-xs text-slate-600 hover:border-brand-300 hover:bg-brand-50"
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {messages.map((m) =>
                  m.role === 'user' ? (
                    <div key={m.id} className="flex justify-end">
                      <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-brand-600 px-3.5 py-2 text-sm text-white">{m.text}</div>
                    </div>
                  ) : (
                    <div key={m.id} className="flex justify-start">
                      <div
                        className={`max-w-[90%] rounded-2xl rounded-bl-sm px-3.5 py-2.5 text-sm ${
                          m.error ? 'bg-warning-50 text-warning-700' : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {m.pending ? (
                          <ToolActivity />
                        ) : (
                          <>
                            {m.tools && m.tools.length > 0 && (
                              <ul className="mb-2 space-y-1">
                                {m.tools.map((t, i) => (
                                  <li key={i} className="flex items-center gap-1.5 text-[11px] text-slate-400">
                                    <Check className="h-3 w-3 text-success-500" /> {TOOL_LABEL[t] ?? t}
                                  </li>
                                ))}
                              </ul>
                            )}
                            <p className="whitespace-pre-wrap">{m.text}</p>
                          </>
                        )}
                      </div>
                    </div>
                  ),
                )}
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  send(input)
                }}
                className="flex items-center gap-2 border-t border-slate-100 p-3"
              >
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask Waypoint…"
                  className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-400"
                />
                <button
                  type="submit"
                  aria-label="Send"
                  className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-brand-600 text-white"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

function ToolActivity() {
  return (
    <div className="flex items-center gap-1.5 text-slate-400">
      <span className="flex gap-1">
        <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.2 }} className="h-1.5 w-1.5 rounded-full bg-slate-400" />
        <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.2, delay: 0.2 }} className="h-1.5 w-1.5 rounded-full bg-slate-400" />
        <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.2, delay: 0.4 }} className="h-1.5 w-1.5 rounded-full bg-slate-400" />
      </span>
      <span className="text-xs">Checking permissions and tools…</span>
    </div>
  )
}
