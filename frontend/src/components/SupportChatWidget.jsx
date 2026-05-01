import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { MessageCircle, X, Send, Loader2, ExternalLink, BookOpen, Sparkles } from 'lucide-react'
import { supportApi } from '@/services/api'
import { ASSISTANT_OPEN_EVENT } from '@/components/AiAssistantPromo'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const WELCOME = {
  support:
    'How can we help you today? Ask about bookings, your vehicles, loyalty, or finding your way around the app. Replies can include links and videos you can open for more detail.',
  maintenance:
    'Ask about vehicle care (intervals, fluids, warning lights) or workshop setup — where to configure labor, charges, plates, sublets, and parameters in Maintenance. Replies use help articles and videos when relevant.',
  reports:
    'Ask how to choose a report, set date ranges, or read results — listing, sales, productivity, custom, or garage dashboards. I can explain menus and typical interpretation, but I cannot see your live numbers.',
}

const MODE_LABELS = {
  support: 'Support',
  maintenance: 'Maintenance',
  reports: 'Reports',
}

const MODE_SUBTITLE = {
  support: 'Product help and navigation',
  maintenance: 'Vehicle care & Maintenance hub',
  reports: 'Report selection & interpretation',
}

function formatAssistantText(text) {
  if (!text) return null
  const lines = text.split('\n')
  return lines.map((line, i) => (
    <span key={i}>
      {line}
      {i < lines.length - 1 ? <br /> : null}
    </span>
  ))
}

export default function SupportChatWidget() {
  const [open, setOpen] = useState(false)
  const [assistantMode, setAssistantMode] = useState('support')
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState(null)
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: WELCOME.support,
      citations: [],
      localOnly: true,
    },
  ])
  const scrollRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    const onOpen = (e) => {
      const mode = e.detail?.mode
      if (mode === 'maintenance' || mode === 'reports' || mode === 'support') {
        setAssistantMode(mode)
        setOpen(true)
      }
    }
    window.addEventListener(ASSISTANT_OPEN_EVENT, onOpen)
    return () => window.removeEventListener(ASSISTANT_OPEN_EVENT, onOpen)
  }, [])

  useEffect(() => {
    setMessages([
      {
        role: 'assistant',
        content: WELCOME[assistantMode] || WELCOME.support,
        citations: [],
        localOnly: true,
      },
    ])
    setError(null)
  }, [assistantMode])

  useEffect(() => {
    if (!open) return
    const t = requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
    })
    return () => cancelAnimationFrame(t)
  }, [open, messages, sending])

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  const send = useCallback(async () => {
    const trimmed = input.trim()
    if (!trimmed || sending) return
    setInput('')
    setError(null)
    const nextThread = [...messages, { role: 'user', content: trimmed, citations: [] }]
    setMessages(nextThread)
    setSending(true)
    try {
      const payload = nextThread
        .filter((m) => m.role === 'user' || (m.role === 'assistant' && m.content && !m.localOnly))
        .map((m) => ({ role: m.role, content: m.content }))
      const { data } = await supportApi.chat(payload, { assistant_mode: assistantMode })
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.answer,
          citations: data.citations || [],
        },
      ])
    } catch (e) {
      const detail = e.response?.data?.detail
      const msg =
        typeof detail === 'string'
          ? detail
          : Array.isArray(detail)
            ? detail.map((d) => d.msg || d).join(' ')
            : e.message || 'Something went wrong.'
      setError(msg)
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            'I couldn’t reach the support service just now. If this persists, confirm the server has `OPENAI_API_KEY` set and try again.',
          citations: [],
          localOnly: true,
        },
      ])
    } finally {
      setSending(false)
    }
  }, [input, messages, sending, assistantMode])

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  return (
    <>
      <div
        className={cn(
          'fixed bottom-4 right-4 z-[100] flex flex-col items-end gap-3',
          'pointer-events-none [&>*]:pointer-events-auto'
        )}
        aria-live="polite"
      >
        {open && (
          <div
            className={cn(
              'flex w-[min(100vw-1.5rem,420px)] h-[min(100dvh-5.5rem,560px)] flex-col overflow-hidden rounded-2xl border border-border/80 bg-card/95 shadow-2xl shadow-primary/10 backdrop-blur-md',
              'ring-1 ring-black/5 dark:ring-white/10'
            )}
            role="dialog"
            aria-label="AI assistant chat"
          >
            <header className="relative flex shrink-0 flex-col gap-2 bg-gradient-to-br from-primary via-primary to-primary/85 px-4 py-3 text-primary-foreground">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/25">
                    <Sparkles className="h-5 w-5" aria-hidden />
                  </div>
                  <div>
                    <p className="text-sm font-semibold tracking-tight">AI assistant</p>
                    <p className="text-xs text-primary-foreground/85 leading-snug">
                      {MODE_SUBTITLE[assistantMode] || MODE_SUBTITLE.support}
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 text-primary-foreground hover:bg-white/15"
                  onClick={() => setOpen(false)}
                  aria-label="Close assistant chat"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div
                className="flex flex-wrap gap-1 rounded-lg bg-black/15 p-1 ring-1 ring-white/10"
                role="tablist"
                aria-label="Assistant mode"
              >
                {(['support', 'maintenance', 'reports']).map((m) => (
                  <button
                    key={m}
                    type="button"
                    role="tab"
                    aria-selected={assistantMode === m}
                    onClick={() => setAssistantMode(m)}
                    className={cn(
                      'rounded-md px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide transition-colors',
                      assistantMode === m
                        ? 'bg-white text-primary shadow-sm'
                        : 'text-primary-foreground/90 hover:bg-white/10'
                    )}
                  >
                    {MODE_LABELS[m]}
                  </button>
                ))}
              </div>
            </header>

            <div
              ref={scrollRef}
              className="flex-1 space-y-3 overflow-y-auto px-3 py-3 bg-gradient-to-b from-muted/20 to-transparent"
            >
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}
                >
                  <div
                    className={cn(
                      'max-w-[92%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-sm',
                      m.role === 'user'
                        ? 'bg-primary text-primary-foreground rounded-br-md'
                        : 'bg-background border border-border/70 text-foreground rounded-bl-md'
                    )}
                  >
                    <div className="whitespace-pre-wrap break-words">
                      {m.role === 'assistant' ? formatAssistantText(m.content) : m.content}
                    </div>
                    {m.role === 'assistant' && m.citations?.length > 0 && (
                      <div className="mt-3 border-t border-border/60 pt-2.5">
                        <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                          <BookOpen className="h-3.5 w-3.5" aria-hidden />
                          References
                        </p>
                        <ul className="space-y-1.5">
                          {m.citations.map((c) => {
                            const url = c.url || ''
                            const isAppPath =
                              url.startsWith('/') && !url.startsWith('//')
                            const isYoutube =
                              /youtube\.com|youtu\.be/i.test(url) ||
                              (c.source_type === 'video' && url)
                            const kindLabel = isYoutube
                              ? 'Video'
                              : isAppPath
                                ? 'In-app page'
                                : url
                                  ? 'Web'
                                  : 'Help article'
                            const linkLabel = isAppPath
                              ? 'Open in app'
                              : isYoutube
                                ? 'Watch on YouTube'
                                : url
                                  ? 'Open link'
                                  : null
                            return (
                              <li
                                key={`${c.id}-${c.title}`}
                                className="flex flex-col gap-1 rounded-lg bg-muted/50 px-2 py-2 text-xs"
                              >
                                <span className="font-medium text-foreground leading-snug">
                                  [{c.id}] {c.title}
                                </span>
                                <span className="text-[11px] text-muted-foreground">
                                  {kindLabel}
                                </span>
                                {isAppPath ? (
                                  <Link
                                    to={url}
                                    className="inline-flex w-fit items-center gap-1 rounded-md text-xs font-semibold text-primary underline-offset-2 hover:underline"
                                  >
                                    {linkLabel}
                                    <ExternalLink className="h-3 w-3 opacity-70" aria-hidden />
                                  </Link>
                                ) : url ? (
                                  <a
                                    href={url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex w-fit items-center gap-1 rounded-md text-xs font-semibold text-primary underline-offset-2 hover:underline"
                                  >
                                    {linkLabel}
                                    <ExternalLink className="h-3 w-3" aria-hidden />
                                  </a>
                                ) : (
                                  <span className="text-[11px] text-muted-foreground">
                                    No URL in help library for this item.
                                  </span>
                                )}
                              </li>
                            )
                          })}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {sending && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-2 rounded-2xl rounded-bl-md border border-border/70 bg-background px-3 py-2 text-xs text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    Thinking…
                  </div>
                </div>
              )}
            </div>

            {error && (
              <div className="shrink-0 px-3 pb-1 text-xs text-destructive" role="alert">
                {error}
              </div>
            )}

            <div className="shrink-0 border-t border-border/80 bg-card/90 p-3">
              <div className="flex gap-2">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={onKeyDown}
                  placeholder="Ask a question…"
                  rows={2}
                  disabled={sending}
                  className={cn(
                    'flex-1 resize-none rounded-xl border border-input bg-background px-3 py-2 text-sm',
                    'placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
                  )}
                  aria-label="Message"
                />
                <Button
                  type="button"
                  size="icon"
                  className="h-[4.25rem] w-11 shrink-0 rounded-xl self-stretch"
                  onClick={send}
                  disabled={sending || !input.trim()}
                  aria-label="Send message"
                >
                  {sending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="mt-2 text-[10px] leading-snug text-muted-foreground">
                AI-generated — double-check anything safety- or billing-related with your garage. Numbers like [1] match the references above.
              </p>
            </div>
          </div>
        )}

        <Button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={cn(
            'h-14 w-14 rounded-full shadow-lg shadow-primary/25',
            'bg-gradient-to-br from-primary to-primary/90 hover:from-primary/95 hover:to-primary/80',
            'ring-2 ring-background'
          )}
          size="icon"
          aria-expanded={open}
          aria-label={open ? 'Close AI assistant' : 'Open AI assistant'}
        >
          {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
        </Button>
      </div>
    </>
  )
}
