import { useEffect, useRef, useState } from 'react'
import { X, Sparkles, Plus, AlertCircle, ArrowUp } from 'lucide-react'
import { chatApi } from '@/features/assistant/services/chatApi'
import { useChat } from '@/features/assistant/hooks/useChat'
import { useAssistantHealth } from '@/features/assistant/hooks/useAssistantHealth'
import MessageBubble from '@/features/assistant/components/MessageBubble'

export default function FloatingChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [inputVal, setInputVal] = useState('')
  const [activeConversationId, setActiveConversationId] = useState(null)
  
  const health = useAssistantHealth()
  const scrollRef = useRef(null)
  const textareaRef = useRef(null)

  // Ephemeral conversation creation for this session turn
  const ensureConversation = async () => {
    if (activeConversationId) return { id: activeConversationId }
    const payload = await chatApi.createConversation('Public Session')
    const newId = payload.conversation.id
    setActiveConversationId(newId)
    return { id: newId }
  }

  const {
    messages,
    loading,
    loadError,
    streaming,
    regenerating,
    send,
    stop,
    retry,
  } = useChat({
    conversationId: activeConversationId,
    ensureConversation,
  })

  // Auto-scroll on new tokens or messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, streaming])

  // Focus textarea when popover opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => textareaRef.current?.focus(), 150)
    }
  }, [isOpen])

  // Auto-resize textarea height dynamically
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 100)}px`
    }
  }, [inputVal])

  const handleSend = (textToSend) => {
    const query = (textToSend || inputVal).trim()
    if (!query || streaming || regenerating) return
    setInputVal('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
    send(query)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleNewChat = () => {
    setActiveConversationId(null)
    setInputVal('')
  }

  return (
    <div className="fixed bottom-6 right-6 z-[80] flex flex-col items-end font-sans">
      {/* Popover Window */}
      {isOpen && (
        <div
          className="mb-3 flex h-[570px] max-h-[84vh] w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-white/15 bg-[#08090d]/95 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.95)] backdrop-blur-2xl transition-all duration-300 sm:w-[410px]"
          role="dialog"
          aria-label="JAAZ AI Assistant"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.03] px-4 py-3">
            <div className="flex items-center gap-2.5">
              <div className="relative flex size-7 items-center justify-center rounded-lg bg-[#c9ad7c]/15 text-[#c9ad7c] border border-[#c9ad7c]/30">
                <Sparkles className="size-3.5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-display text-sm font-medium tracking-tight text-paper">
                    JAAZ AI <span className="italic text-[#c9ad7c]">Assistant</span>
                  </h3>
                  <span
                    className={`inline-block size-1.5 rounded-full ${
                      health.available ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'bg-amber-400'
                    }`}
                  />
                </div>
               
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleNewChat}
                title="New Chat"
                className="flex size-7 items-center justify-center rounded-md text-mist transition-colors hover:bg-white/10 hover:text-paper"
              >
                <Plus className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                title="Close"
                className="flex size-7 items-center justify-center rounded-md text-mist transition-colors hover:bg-white/10 hover:text-paper"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>

          {/* Chat Stream Body */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-3.5 space-y-3.5">
            {messages.length === 0 && !loading && (
              <div className="py-2">
                <div className="rounded-xl border border-[#c9ad7c]/20 bg-gradient-to-b from-[#c9ad7c]/10 to-transparent p-4 text-center">
                  <div className="mx-auto mb-2 flex size-9 items-center justify-center rounded-full bg-[#c9ad7c]/15 text-[#c9ad7c] border border-[#c9ad7c]/30">
                    <Sparkles className="size-4" />
                  </div>
                  <h4 className="font-display text-base text-paper mb-1">
                    JAAZ Intelligence
                  </h4>
                  <p className="text-xs text-bone leading-relaxed max-w-[280px] mx-auto">
                    Ask any question regarding custom home theatre engineering, acoustic treatments, lighting scenes, or architectural solutions.
                  </p>
                </div>
              </div>
            )}

            {loading && messages.length === 0 && (
              <div className="flex h-32 items-center justify-center gap-2 text-xs font-mono text-mist">
                <span className="size-2 rounded-full bg-[#c9ad7c] animate-ping" />
                Connecting to knowledge base...
              </div>
            )}

            {loadError && (
              <div className="flex items-start gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
                <AlertCircle className="size-4 shrink-0 mt-0.5 text-rose-400" />
                <div>
                  <p>Could not connect to assistant context.</p>
                  <button
                    type="button"
                    onClick={handleNewChat}
                    className="mt-1 font-mono text-[0.625rem] text-rose-200 underline uppercase"
                  >
                    Start new session
                  </button>
                </div>
              </div>
            )}

            {messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                streaming={streaming && msg.id === messages[messages.length - 1]?.id}
                onRegenerate={() => retry(msg)}
                canRegenerate={!streaming && !regenerating}
                showSources={false}
              />
            ))}
          </div>

          {/* Input Bar */}
          <div className="border-t border-white/10 bg-[#06070a] p-3">
            <div className="flex items-center gap-2 rounded-xl border border-white/12 bg-white/[0.04] px-3 py-1.5 transition-colors focus-within:border-[#c9ad7c]/60">
              <textarea
                ref={textareaRef}
                rows={1}
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about cinemas, audio & lighting..."
                disabled={streaming || regenerating}
                className="max-h-24 flex-1 resize-none bg-transparent text-xs text-paper placeholder:text-ash focus:outline-none disabled:opacity-50"
              />

              {streaming || regenerating ? (
                <button
                  type="button"
                  onClick={stop}
                  className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-white/10 text-paper transition-colors hover:bg-white/20"
                  title="Stop generating"
                >
                  <span className="size-2 bg-paper rounded-xs" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleSend()}
                  disabled={!inputVal.trim()}
                  className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-[#c9ad7c] text-ink transition-all hover:bg-[#d8bd8c] disabled:opacity-30 disabled:hover:bg-[#c9ad7c]"
                  title="Send message"
                >
                  <ArrowUp className="size-4 stroke-[2.5]" />
                </button>
              )}
            </div>

            <div className="mt-1.5 flex items-center justify-between px-1 font-mono text-[0.5625rem] text-ash tracking-wider uppercase">
            
              <span>Press Enter to send</span>
            </div>
          </div>
        </div>
      )}

      {/* Floating Launcher Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="group flex items-center gap-2.5 rounded-full border border-white/20 bg-[#0a0c10]/90 px-4 py-3 text-paper shadow-[0_15px_35px_rgba(0,0,0,0.8)] backdrop-blur-xl transition-all duration-300 hover:border-[#c9ad7c]/60 hover:bg-[#12141c] hover:shadow-[0_15px_40px_rgba(201,173,124,0.2)] focus:outline-none"
        aria-label={isOpen ? 'Close Assistant' : 'Open JAAZ AI Assistant'}
      >
        <div className="relative flex size-5 items-center justify-center rounded-full bg-[#c9ad7c]/20 text-[#c9ad7c]">
          <Sparkles className="size-3 transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110" />
        </div>

        <span className="font-mono text-xs tracking-wider uppercase text-bone group-hover:text-paper font-medium">
          {isOpen ? 'Close' : 'Ask JAAZ AI'}
        </span>

        <span className="relative flex size-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#c9ad7c] opacity-75" />
          <span className="relative inline-flex size-2 rounded-full bg-[#c9ad7c]" />
        </span>
      </button>
    </div>
  )
}
