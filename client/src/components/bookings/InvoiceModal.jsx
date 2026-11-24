import { useEffect, useState } from 'react'

import { getBookingInvoice } from '../../services/bookingService.js'
import { formatPKR, formatStayDate } from '../../utils/formatters.js'

const fieldRowClass = 'flex items-baseline justify-between gap-4 py-1.5 text-sm'

function InvoiceModal({ bookingId, onClose }) {
  const [invoice, setInvoice] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function load() {
      setInvoice(null)
      setError('')
      try {
        const nextInvoice = await getBookingInvoice(bookingId)
        if (!cancelled) setInvoice(nextInvoice)
      } catch (requestError) {
        if (!cancelled) {
          setError(
            requestError.response?.data?.message ??
              'Unable to load this invoice. Please try again.',
          )
        }
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [bookingId])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .invoice-print-area, .invoice-print-area * { visibility: visible; }
          .invoice-print-area {
            position: fixed;
            inset: 0;
            width: 100%;
            max-width: none;
            max-height: none;
            margin: 0;
            padding: 0;
            overflow: visible;
            border: 0;
            border-radius: 0;
            box-shadow: none;
            background: #fff;
            color: #000;
          }
          .invoice-no-print { display: none !important; }
          @page { margin: 14mm; }
        }
      `}</style>

      <button
        type="button"
        onClick={onClose}
        aria-label="Close invoice"
        className="invoice-no-print fixed inset-0 bg-black/50"
      />

      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="invoice-title"
        className="invoice-print-area relative max-h-[calc(100dvh-2rem)] w-full max-w-2xl overflow-y-auto rounded-3xl border border-line bg-surface p-6 text-content shadow-xl print:my-0 print:max-h-none print:overflow-visible print:rounded-none print:border-0 print:bg-white print:p-0 print:text-black sm:p-8"
      >
        <div className="invoice-no-print mb-4 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-line-strong px-4 py-1.5 text-xs font-semibold transition-colors hover:bg-elevated"
          >
            Close
          </button>
        </div>

        {error ? (
          <p
            role="alert"
            className="rounded-xl border border-danger/40 bg-danger-surface px-4 py-3 text-sm text-danger"
          >
            {error}
          </p>
        ) : null}

        {!invoice && !error ? (
          <p className="py-10 text-center text-sm text-muted">Preparing invoice…</p>
        ) : null}

        {invoice ? (
          <div>
            <header className="flex flex-wrap items-start justify-between gap-4 border-b border-line pb-5 print:border-black/20">
              <div>
                <p className="text-xs font-semibold tracking-[0.22em] text-muted uppercase print:text-black">
                  LuxuryStay Hospitality
                </p>
                <h2 id="invoice-title" className="mt-1 font-display text-2xl">
                  Invoice
                </h2>
                <p className="mt-1 text-xs text-muted print:text-black">
                  Islamabad, Pakistan · reservations@luxurystay.pk
                </p>
              </div>
              <div className="text-right text-sm">
                <p className="font-semibold">{invoice.invoiceNumber}</p>
                <p className="text-muted print:text-black">
                  Issued {formatStayDate(invoice.issuedAt)}
                </p>
              </div>
            </header>

            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold tracking-[0.16em] text-muted uppercase print:text-black">
                  Billed to
                </p>
                <p className="mt-2 font-medium">{invoice.guest.name}</p>
                {invoice.guest.email ? (
                  <p className="text-sm text-muted print:text-black">{invoice.guest.email}</p>
                ) : null}
                {invoice.booking.contactPhone ? (
                  <p className="text-sm text-muted print:text-black">
                    {invoice.booking.contactPhone}
                  </p>
                ) : null}
              </div>

              <div className="sm:text-right">
                <p className="text-xs font-semibold tracking-[0.16em] text-muted uppercase print:text-black">
                  Stay details
                </p>
                <p className="mt-2 font-medium">
                  Room {invoice.room.roomNumber} · {invoice.room.type}
                </p>
                <p className="text-sm text-muted print:text-black">
                  {formatStayDate(invoice.booking.checkInDate)} –{' '}
                  {formatStayDate(invoice.booking.checkOutDate)}
                </p>
                <p className="text-sm text-muted print:text-black">
                  {invoice.booking.nights}{' '}
                  {invoice.booking.nights === 1 ? 'night' : 'nights'} ·{' '}
                  {invoice.booking.numberOfGuests}{' '}
                  {invoice.booking.numberOfGuests === 1 ? 'guest' : 'guests'}
                </p>
              </div>
            </div>

            {invoice.booking.specialRequests ? (
              <p className="mt-4 rounded-xl bg-elevated px-4 py-3 text-sm print:bg-transparent print:px-0">
                <span className="font-medium">Special requests: </span>
                {invoice.booking.specialRequests}
              </p>
            ) : null}

            <table className="mt-6 w-full text-left text-sm">
              <thead className="border-b border-line text-xs tracking-[0.14em] text-muted uppercase print:border-black/20 print:text-black">
                <tr>
                  <th scope="col" className="py-2 pr-4 font-medium">
                    Description
                  </th>
                  <th scope="col" className="py-2 text-right font-medium">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-line/60 print:border-black/10">
                  <td className="py-3 pr-4">
                    Room charges ({invoice.booking.nights}{' '}
                    {invoice.booking.nights === 1 ? 'night' : 'nights'})
                  </td>
                  <td className="py-3 text-right tabular-nums">
                    {formatPKR(invoice.roomCharges)}
                  </td>
                </tr>

                {invoice.services.map((service) => (
                  <tr
                    key={service.id}
                    className="border-b border-line/60 print:border-black/10"
                  >
                    <td className="py-3 pr-4">
                      <span className="capitalize">{service.category.replace('-', ' ')}</span>
                      {service.description ? (
                        <span className="block text-xs text-muted print:text-black">
                          {service.description}
                        </span>
                      ) : null}
                    </td>
                    <td className="py-3 text-right tabular-nums">
                      {formatPKR(service.charge)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="mt-4 ml-auto max-w-xs space-y-1">
              <div className={fieldRowClass}>
                <span className="text-muted print:text-black">Subtotal</span>
                <span className="tabular-nums">{formatPKR(invoice.subtotal)}</span>
              </div>
              <div className={fieldRowClass}>
                <span className="text-muted print:text-black">
                  Tax ({Math.round(invoice.taxRate * 100)}%)
                </span>
                <span className="tabular-nums">{formatPKR(invoice.tax)}</span>
              </div>
              <div className="flex items-baseline justify-between gap-4 border-t border-line pt-2 text-base font-semibold print:border-black/20">
                <span>Grand total</span>
                <span className="tabular-nums">{formatPKR(invoice.grandTotal)}</span>
              </div>
            </div>

            <p className="mt-6 text-center text-xs text-muted print:text-black">
              Thank you for staying with LuxuryStay Hospitality.
            </p>

            <div className="invoice-no-print mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => window.print()}
                className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-on-accent transition-opacity hover:opacity-90"
              >
                Print Invoice
              </button>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  )
}

export default InvoiceModal
