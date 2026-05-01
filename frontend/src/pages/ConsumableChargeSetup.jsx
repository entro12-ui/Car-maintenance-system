import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { otherChargeTypesApi, systemSettingsApi } from '../services/api'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import SetupScreenFrame from './SetupScreenFrame'

const HEADER_CAT = 'consumable_charge_header'
const RATE_CAT = 'consumable_charge_rate'

function parseRates(raw) {
  if (!raw) return []
  try {
    const v = JSON.parse(raw)
    return Array.isArray(v) ? v : []
  } catch {
    return []
  }
}

export default function ConsumableChargeSetup() {
  const [jobTypes, setJobTypes] = useState([])
  const [jobType, setJobType] = useState('')
  const [chargeCodes, setChargeCodes] = useState([])
  const [chargeCode, setChargeCode] = useState('')
  const [basedOn, setBasedOn] = useState('')
  const [isTaxable, setIsTaxable] = useState(true)
  const [rates, setRates] = useState([])
  const [headerSettingId, setHeaderSettingId] = useState(null)
  const [rateSettingId, setRateSettingId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const jobTypesQuery = useQuery({
    queryKey: ['systemSettings', { category: 'job_type', for: 'consumableCharge' }],
    queryFn: () => systemSettingsApi.list({ category: 'job_type', limit: 500 }),
  })

  const chargesQuery = useQuery({
    queryKey: ['otherChargeTypes', { active_only: false, for: 'consumableCharge' }],
    queryFn: () => otherChargeTypesApi.list({ active_only: false }),
  })

  useEffect(() => {
    const rows = jobTypesQuery.data?.data || []
    const opts = [
      { code: 'ALL', name: 'All Job Types' },
      ...rows
      .map((r) => ({
        code: (r.setting_key || '').trim(),
        name: (r.setting_value || '').trim(),
      }))
      .filter((x) => x.code),
    ]
    setJobTypes(opts)
    setJobType((cur) => {
      if (cur) return cur
      if (!opts.length) return ''
      return `${opts[0].code} — ${opts[0].name}`
    })
  }, [jobTypesQuery.data])

  useEffect(() => {
    const rows = chargesQuery.data?.data || []
    const opts = rows.map((r) => ({
      value: `${(r.charge_code || '').trim()} — ${(r.description || '').trim()}`.trim(),
      code: (r.charge_code || '').trim(),
    }))
    setChargeCodes(opts)
    setChargeCode((cur) => {
      if (cur) return cur
      if (!opts.length) return ''
      return opts[0].value
    })
  }, [chargesQuery.data])

  const compositeKey = useMemo(() => {
    const jt = (jobType || '').split('—')[0]?.trim() || ''
    const cc = (chargeCode || '').split('—')[0]?.trim() || ''
    if (!jt || !cc) return ''
    return `${jt}||${cc}`
  }, [jobType, chargeCode])

  const loadSettings = async () => {
    if (!compositeKey) return
    setLoading(true)
    setError('')
    try {
      const [hRes, rRes] = await Promise.all([
        systemSettingsApi.list({ category: HEADER_CAT, limit: 500 }),
        systemSettingsApi.list({ category: RATE_CAT, limit: 500 }),
      ])
      const hRow = (hRes.data || []).find((r) => r.setting_key === compositeKey)
      setHeaderSettingId(hRow?.setting_id || null)
      if (hRow?.description) {
        try {
          const meta = JSON.parse(hRow.description)
          setBasedOn(meta.basedOn || '')
          setIsTaxable(meta.isTaxable !== false)
        } catch {
          setBasedOn('')
          setIsTaxable(true)
        }
      } else {
        setBasedOn('')
        setIsTaxable(true)
      }

      const rRow = (rRes.data || []).find((r) => r.setting_key === compositeKey)
      setRateSettingId(rRow?.setting_id || null)
      setRates(parseRates(rRow?.setting_value))
    } catch (e) {
      console.error(e)
      setError('Failed to load consumable charge setup.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!compositeKey) return
    loadSettings()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [compositeKey])

  const onSaveHeader = async () => {
    if (!compositeKey) return
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const meta = JSON.stringify({ basedOn: (basedOn || '').trim(), isTaxable: !!isTaxable })
      const payloadBase = {
        setting_key: compositeKey,
        setting_value: '1',
        setting_type: 'string',
        category: HEADER_CAT,
        description: meta,
      }
      if (headerSettingId) await systemSettingsApi.update(headerSettingId, payloadBase)
      else await systemSettingsApi.create(payloadBase)
      await loadSettings()
      setSuccess('Header saved.')
    } catch (e) {
      console.error(e)
      setError(e?.response?.data?.detail || 'Save failed.')
    } finally {
      setSaving(false)
    }
  }

  const onSaveRates = async () => {
    if (!compositeKey) return
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const cleaned = rates.map((r) => ({
        consumable_charge_code: (r.consumable_charge_code || '').trim(),
        amount_from: Number(r.amount_from),
        amount_to: Number(r.amount_to),
        charge_percent: Number(r.charge_percent),
      }))
      for (const r of cleaned) {
        if (!Number.isFinite(r.amount_from) || !Number.isFinite(r.amount_to) || !Number.isFinite(r.charge_percent)) {
          throw new Error('Each tier needs numeric From/To/Percent.')
        }
      }
      const json = JSON.stringify(cleaned)
      const payloadBase = {
        setting_key: compositeKey,
        setting_value: json,
        setting_type: 'json',
        category: RATE_CAT,
        description: 'Consumable charge rate tiers',
      }
      if (rateSettingId) await systemSettingsApi.update(rateSettingId, payloadBase)
      else await systemSettingsApi.create(payloadBase)
      await loadSettings()
      setSuccess('Consumable rates saved.')
    } catch (e) {
      console.error(e)
      setError(e?.message || e?.response?.data?.detail || 'Save failed.')
    } finally {
      setSaving(false)
    }
  }

  const addRow = () => {
    const cc = (chargeCode || '').split('—')[0]?.trim() || ''
    setRates((prev) => [
      ...prev,
      { consumable_charge_code: cc, amount_from: '', amount_to: '', charge_percent: '' },
    ])
  }

  const status = loading ? 'Loading…' : saving ? 'Saving…' : 'Ready'

  return (
    <SetupScreenFrame
      hubTo="/maintenance-hub"
      hubLabel="Maintenance"
      title="Consumables charge setup"
      subtitle="Define consumable tiers by job type and charge code. Stored in system settings until dedicated tables are introduced."
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-blue-700">{status}</span>
          <Button type="button" variant="outline" onClick={() => loadSettings()}>
            Refresh
          </Button>
        </div>
      }
    >
      {error && <div className="rounded border border-red-200 bg-red-50 text-red-700 px-3 py-2 text-sm">{error}</div>}
      {success && <div className="rounded border border-green-200 bg-green-50 text-green-700 px-3 py-2 text-sm">{success}</div>}

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
        <p className="font-semibold text-slate-900">Consumable Charges Setup Guidance</p>
        <p className="mt-1">
          Use this page to setup charge codes for consumables (also called <strong>Small Materials (SM)</strong>)
          that are not treated through parts issue to job.
        </p>
        <p className="mt-1">
          The consumable charge is calculated as a percentage of total non-parts value on a job. Typically, the
          percentage declines as non-parts value grows.
        </p>
        <p className="mt-1">
          You can apply setup to <strong>all jobs</strong> by selecting <strong>ALL — All Job Types</strong>, or apply to a
          specific job category by selecting a single job type.
        </p>
      </div>

      <div className="bg-white border rounded-lg shadow-sm p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
          <label className="text-sm space-y-1">
            <div className="text-gray-700 font-medium">Used For / Job Type</div>
            <select className="w-full border rounded-md px-3 py-2 text-sm" value={jobType} onChange={(e) => setJobType(e.target.value)}>
              {jobTypes.map((jt) => (
                <option key={jt.code} value={`${jt.code} — ${jt.name}`}>
                  {jt.code} — {jt.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm space-y-1">
            <div className="text-gray-700 font-medium">Charge Code</div>
            <select
              className="w-full border rounded-md px-3 py-2 text-sm"
              value={chargeCode}
              onChange={(e) => setChargeCode(e.target.value)}
            >
              {chargeCodes.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.value}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm space-y-1">
            <div className="text-gray-700 font-medium">Based On</div>
            <Input value={basedOn} onChange={(e) => setBasedOn(e.target.value)} placeholder="e.g. Labour amount, Parts total…" />
          </label>
        </div>
        <div className="flex items-center justify-between gap-3">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={isTaxable} onChange={(e) => setIsTaxable(e.target.checked)} />
            <span>Is Taxable</span>
          </label>
          <Button type="button" onClick={onSaveHeader} disabled={saving || !compositeKey}>
            Save header
          </Button>
        </div>

        <div className="border-t pt-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="text-base font-semibold text-gray-900">Consumable Rate</div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={addRow}>
                Add tier
              </Button>
              <Button type="button" onClick={onSaveRates} disabled={saving || !compositeKey}>
                Save tiers
              </Button>
            </div>
          </div>
          <div className="overflow-auto">
            <table className="min-w-[900px] w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600 border-b">
                  <th className="py-2 pr-2">Consumable Charge Code</th>
                  <th className="py-2 pr-2">Amount From</th>
                  <th className="py-2 pr-2">Amount To</th>
                  <th className="py-2 pr-2">Charge Percent</th>
                </tr>
              </thead>
              <tbody>
                {rates.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-gray-500">
                      No tiers yet — add a row and save.
                    </td>
                  </tr>
                ) : (
                  rates.map((r, idx) => (
                    <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50 align-top">
                      <td className="py-2 pr-2 w-56">
                        <Input
                          value={r.consumable_charge_code}
                          onChange={(e) => {
                            const v = e.target.value
                            setRates((prev) => prev.map((x, i) => (i === idx ? { ...x, consumable_charge_code: v } : x)))
                          }}
                        />
                      </td>
                      <td className="py-2 pr-2 w-40">
                        <Input
                          value={r.amount_from}
                          onChange={(e) => {
                            const v = e.target.value
                            setRates((prev) => prev.map((x, i) => (i === idx ? { ...x, amount_from: v } : x)))
                          }}
                        />
                      </td>
                      <td className="py-2 pr-2 w-40">
                        <Input
                          value={r.amount_to}
                          onChange={(e) => {
                            const v = e.target.value
                            setRates((prev) => prev.map((x, i) => (i === idx ? { ...x, amount_to: v } : x)))
                          }}
                        />
                      </td>
                      <td className="py-2 pr-2 w-40">
                        <Input
                          value={r.charge_percent}
                          onChange={(e) => {
                            const v = e.target.value
                            setRates((prev) => prev.map((x, i) => (i === idx ? { ...x, charge_percent: v } : x)))
                          }}
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="border-t pt-4">
          <div className="text-base font-semibold text-gray-900 mb-2">Job Types</div>
          <p className="text-sm text-gray-600">
            Job types are maintained under <span className="font-medium">Global Parameters → Job Type</span> (system settings
            category <span className="font-mono text-xs">job_type</span>).
          </p>
        </div>
      </div>
    </SetupScreenFrame>
  )
}
