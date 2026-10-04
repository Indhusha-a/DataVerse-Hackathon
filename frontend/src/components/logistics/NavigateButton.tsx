import { useState } from 'react'
import { ExternalLink, Navigation2 } from 'lucide-react'

/** Inline turn-by-turn directions to the outlet. Destination is a text query;
 * origin is left unset so Maps uses the driver's live location as the start. */
export function NavigateButton({ outletCode, district, className }: { outletCode: string; district?: string; className?: string }) {
  const [open, setOpen] = useState(false)
  const destination = `${outletCode} outlet${district ? `, ${district}` : ''}, Sri Lanka`
  const encoded = encodeURIComponent(destination)

  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className={
          className ??
          'inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50'
        }
      >
        <Navigation2 className="h-3.5 w-3.5" /> {open ? 'Hide map' : 'Navigate'}
      </button>

      {open && (
        <div className="mt-2 overflow-hidden rounded-xl border border-slate-200">
          <iframe
            title={`Directions to ${outletCode}`}
            src={`https://maps.google.com/maps?daddr=${encoded}&output=embed`}
            className="h-56 w-full border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${encoded}&travelmode=driving`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-1.5 border-t border-slate-200 bg-slate-50 py-1.5 text-[11px] font-medium text-slate-500 hover:text-brand-600"
          >
            <ExternalLink className="h-3 w-3" /> Open in Google Maps
          </a>
        </div>
      )}
    </div>
  )
}
