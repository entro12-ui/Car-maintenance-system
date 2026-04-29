import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import SetupScreenFrame from './SetupScreenFrame'
import { FILE_MENU } from './FileSidebarMenu'
import { systemSettingsApi } from '../services/api'

const DEFAULT_RELATED = [
  { to: '/company-setup', label: 'Company Setup' },
  { to: '/gl-account-setup', label: 'GL AccountNo Setup' },
  { to: '/garage-invoices/job-estimation', label: 'Job Estimation' },
]

const EST_LETTER_CATEGORY = 'estimation_letter_setup'
const EST_LETTER_KEY = 'default'
const DEFAULT_EST_LETTER = {
  header_text: 'ESTIMATION LETTER',
  validity_wording: 'This estimation is valid for 15 days from issue date.',
  terms_and_conditions:
    'Prices are indicative and may change if additional faults are found after dismantling.',
  footer_notes:
    'Thank you for choosing our garage. Please approve this estimate before work starts.',
  signature_left_label: 'Service Advisor',
  signature_right_label: 'Customer Approval',
}

function parseEstimationLetter(v) {
  if (!v) return { ...DEFAULT_EST_LETTER }
  try {
    const parsed = typeof v === 'string' ? JSON.parse(v) : v
    return { ...DEFAULT_EST_LETTER, ...(parsed || {}) }
  } catch {
    return { ...DEFAULT_EST_LETTER }
  }
}

function EstimationLetterSetup() {
  const [settingId, setSettingId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [form, setForm] = useState(() => ({ ...DEFAULT_EST_LETTER }))

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await systemSettingsApi.list({ category: EST_LETTER_CATEGORY, limit: 50 })
      const rows = res?.data || []
      const row = rows.find((r) => r.setting_key === EST_LETTER_KEY) || rows[0]
      setSettingId(row?.setting_id || null)
      setForm(parseEstimationLetter(row?.setting_value))
    } catch (e) {
      console.error(e)
      setError('Failed to load estimation letter setup.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const update = (k, v) => {
    setForm((prev) => ({ ...prev, [k]: v }))
    setError('')
    setSuccess('')
  }

  const onSave = async () => {
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const payload = {
        setting_key: EST_LETTER_KEY,
        setting_value: JSON.stringify({
          header_text: (form.header_text || '').trim(),
          validity_wording: (form.validity_wording || '').trim(),
          terms_and_conditions: (form.terms_and_conditions || '').trim(),
          footer_notes: (form.footer_notes || '').trim(),
          signature_left_label: (form.signature_left_label || '').trim(),
          signature_right_label: (form.signature_right_label || '').trim(),
        }),
        setting_type: 'json',
        category: EST_LETTER_CATEGORY,
        description: 'Estimation letter template',
      }
      if (settingId) await systemSettingsApi.update(settingId, payload)
      else await systemSettingsApi.create(payload)
      await load()
      setSuccess('Estimation letter setup saved.')
    } catch (e) {
      console.error(e)
      setError(e?.response?.data?.detail || 'Failed to save estimation letter setup.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Estimation Letter Template</CardTitle>
          <CardDescription>
            Configure reusable estimation letter content such as header text, terms, validity wording, footer notes, and signature labels.
          </CardDescription>
        </CardHeader>
        <div className="px-6 pb-6 space-y-4">
          {loading ? (
            <div className="text-sm text-muted-foreground">Loading...</div>
          ) : (
            <>
              <label className="block text-sm">
                <span className="text-gray-600">Header Text</span>
                <input className="w-full mt-1 border rounded px-3 py-2" value={form.header_text} onChange={(e) => update('header_text', e.target.value)} />
              </label>
              <label className="block text-sm">
                <span className="text-gray-600">Validity Wording</span>
                <textarea className="w-full mt-1 border rounded px-3 py-2 min-h-[68px]" value={form.validity_wording} onChange={(e) => update('validity_wording', e.target.value)} />
              </label>
              <label className="block text-sm">
                <span className="text-gray-600">Terms & Conditions</span>
                <textarea className="w-full mt-1 border rounded px-3 py-2 min-h-[120px]" value={form.terms_and_conditions} onChange={(e) => update('terms_and_conditions', e.target.value)} />
              </label>
              <label className="block text-sm">
                <span className="text-gray-600">Footer Notes</span>
                <textarea className="w-full mt-1 border rounded px-3 py-2 min-h-[90px]" value={form.footer_notes} onChange={(e) => update('footer_notes', e.target.value)} />
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <label className="block text-sm">
                  <span className="text-gray-600">Left Signature Label</span>
                  <input className="w-full mt-1 border rounded px-3 py-2" value={form.signature_left_label} onChange={(e) => update('signature_left_label', e.target.value)} />
                </label>
                <label className="block text-sm">
                  <span className="text-gray-600">Right Signature Label</span>
                  <input className="w-full mt-1 border rounded px-3 py-2" value={form.signature_right_label} onChange={(e) => update('signature_right_label', e.target.value)} />
                </label>
              </div>
              {error && <div className="text-sm text-red-600">{error}</div>}
              {success && <div className="text-sm text-green-600">{success}</div>}
              <div className="flex gap-2">
                <Button type="button" onClick={onSave} disabled={saving}>
                  {saving ? 'Saving...' : 'Save Letter Setup'}
                </Button>
                <Button type="button" variant="outline" onClick={load} disabled={saving}>
                  Reload
                </Button>
              </div>
            </>
          )}
        </div>
      </Card>

      {!loading && (
        <Card className="border-dashed bg-muted/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Letter Preview</CardTitle>
          </CardHeader>
          <div className="px-6 pb-6">
            <div className="rounded border bg-white p-4 space-y-3 text-sm">
              <div className="text-center text-base font-semibold">{form.header_text || '-'}</div>
              <p>{form.validity_wording || '-'}</p>
              <div>
                <div className="font-medium mb-1">Terms & Conditions</div>
                <p className="whitespace-pre-wrap">{form.terms_and_conditions || '-'}</p>
              </div>
              <div>
                <div className="font-medium mb-1">Footer Notes</div>
                <p className="whitespace-pre-wrap">{form.footer_notes || '-'}</p>
              </div>
              <div className="grid grid-cols-2 gap-8 pt-6">
                <div className="border-t pt-1 text-center">{form.signature_left_label || '-'}</div>
                <div className="border-t pt-1 text-center">{form.signature_right_label || '-'}</div>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}

export default function FileToolPage() {
  const { slug } = useParams()
  const entry = useMemo(() => FILE_MENU.find((item) => item.slug === slug), [slug])

  if (!slug || !entry) {
    return <Navigate to="/file-hub" replace />
  }

  if (entry.path) {
    return <Navigate to={entry.path} replace />
  }

  if (entry.slug === 'estimation-letter-setup') {
    return (
      <SetupScreenFrame
        hubTo="/file-hub"
        hubLabel="File"
        relatedSectionDescription="Apply this template in Job Estimation printing so advisors use consistent letter wording."
        reviewSectionDescription="Check legal wording, validity text, and signatures with management before rollout."
        title={entry.label}
        subtitle="Configure reusable estimation letter content and keep a shared format for all printed estimates."
        reviewPoints={[
          'Use simple wording that customers can understand before approving work.',
          'Keep validity period and tax wording aligned with Company setup.',
          'Review signatures and footer notes with the service manager.',
        ]}
        relatedLinks={DEFAULT_RELATED}
      >
        <EstimationLetterSetup />
      </SetupScreenFrame>
    )
  }

  return (
    <SetupScreenFrame
      hubTo="/file-hub"
      hubLabel="File"
      relatedSectionDescription="Open related setup and estimation screens while the letter template editor is implemented."
      reviewSectionDescription="Review wording, signatures, tax wording, and print layout before sending estimation letters to customers."
      title={entry.label}
      subtitle="Configure reusable estimation letter content such as header text, terms, validity wording, footer notes, and signature labels."
      reviewPoints={[
        'Keep template wording aligned with company legal and VAT wording.',
        'Version templates so open estimates do not silently change printed wording.',
        'Preview a sample estimate before making a template available to advisors.',
      ]}
      relatedLinks={DEFAULT_RELATED}
    >
      <Card className="border-dashed bg-muted/20">
        <CardHeader>
          <CardTitle className="text-base">Implementation status</CardTitle>
          <CardDescription>
            Estimation Letter Setup is available as a File menu entry. Template storage and print-preview editing can be
            wired here next. Use{' '}
            <Link to="/garage-invoices/job-estimation" className="text-primary font-medium hover:underline">
              Job Estimation
            </Link>{' '}
            for live estimate workflow today.
          </CardDescription>
        </CardHeader>
      </Card>
    </SetupScreenFrame>
  )
}
