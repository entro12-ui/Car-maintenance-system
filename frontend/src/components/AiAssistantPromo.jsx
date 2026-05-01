import { Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export const ASSISTANT_OPEN_EVENT = 'open-assistant-chat'

/** @param {'support' | 'maintenance' | 'reports'} mode */
export function openAssistantChat(mode = 'support') {
  window.dispatchEvent(new CustomEvent(ASSISTANT_OPEN_EVENT, { detail: { mode } }))
}

/**
 * Hub promo card — opens the floating assistant in the requested mode.
 * @param {{ mode: 'maintenance' | 'reports', title: string, description: string, examples?: string[] }} props
 */
export default function AiAssistantPromo({ mode, title, description, examples = [] }) {
  return (
    <Card className="border-primary/30 bg-gradient-to-br from-primary/[0.07] via-transparent to-teal-600/[0.04] shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <Sparkles className="h-5 w-5" aria-hidden />
          </span>
          <div className="min-w-0 space-y-1">
            <CardTitle className="text-base leading-snug">{title}</CardTitle>
            <CardDescription className="text-sm leading-relaxed">{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        {examples.length > 0 ? (
          <ul className="list-disc space-y-1 pl-5 text-xs text-muted-foreground">
            {examples.map((ex) => (
              <li key={ex}>{ex}</li>
            ))}
          </ul>
        ) : null}
        <Button type="button" className="gap-2" onClick={() => openAssistantChat(mode)}>
          <Sparkles className="h-4 w-4" aria-hidden />
          Open AI assistant
        </Button>
      </CardContent>
    </Card>
  )
}
