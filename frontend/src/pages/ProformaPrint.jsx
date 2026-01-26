import { useQuery } from '@tanstack/react-query'
import { useParams, useNavigate } from 'react-router-dom'
import { proformasApi } from '../services/api'
import { format } from 'date-fns'
import { Printer, ArrowLeft, Download } from 'lucide-react'
import { Button } from '../components/ui/button'

export default function ProformaPrint() {
  const { id } = useParams()
  const navigate = useNavigate()

  const { data: proformaData, isLoading } = useQuery({
    queryKey: ['proforma', id],
    queryFn: () => proformasApi.getById(id),
  })

  const handlePrint = () => {
    window.print()
  }

  const handleDownload = () => {
    // Create a printable version
    const printWindow = window.open('', '_blank')
    const content = document.getElementById('proforma-content').innerHTML
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Proforma Invoice - ${proformaData?.data?.proforma_number}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 20px;
              color: #333;
            }
            .header {
              border-bottom: 3px solid #333;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .company-info {
              margin-bottom: 20px;
            }
            .proforma-info {
              text-align: right;
            }
            .details {
              margin: 30px 0;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 12px;
              text-align: left;
            }
            th {
              background-color: #f5f5f5;
              font-weight: bold;
            }
            .totals {
              margin-top: 30px;
              text-align: right;
            }
            .totals table {
              width: 400px;
              margin-left: auto;
            }
            .footer {
              margin-top: 50px;
              padding-top: 20px;
              border-top: 2px solid #333;
              text-align: center;
              font-size: 12px;
              color: #666;
            }
            .stamp-area {
              margin-top: 50px;
              height: 100px;
              border: 2px dashed #999;
              text-align: center;
              padding-top: 30px;
              color: #999;
            }
            @media print {
              .no-print {
                display: none;
              }
            }
          </style>
        </head>
        <body>
          ${content}
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.print()
  }

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>
  }

  if (!proformaData?.data) {
    return <div className="text-center py-8">Proforma not found</div>
  }

  const proforma = proformaData.data

  return (
    <div className="max-w-4xl mx-auto">
      {/* Action Buttons */}
      <div className="mb-4 flex gap-2 no-print">
        <Button variant="outline" onClick={() => navigate('/proformas')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Button onClick={handlePrint}>
          <Printer className="w-4 h-4 mr-2" />
          Print
        </Button>
        <Button variant="outline" onClick={handleDownload}>
          <Download className="w-4 h-4 mr-2" />
          Download PDF
        </Button>
      </div>

      {/* Proforma Content */}
      <div id="proforma-content" className="bg-white p-8 shadow-lg">
        {/* Header */}
        <div className="border-b-4 border-gray-800 pb-6 mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                BERHANU AL-ADEM Auto Solution
              </h1>
              <div className="text-gray-600">
                <p>Car Service Management</p>
                <p>Professional Auto Maintenance & Repair</p>
              </div>
            </div>
            <div className="text-right">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">PROFORMA INVOICE</h2>
              <p className="text-sm text-gray-600">Proforma #</p>
              <p className="text-xl font-bold text-blue-600">{proforma.proforma_number}</p>
            </div>
          </div>
        </div>

        {/* Organization, Customer & Car Info */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            {proforma.organization_name && (
              <>
                <h3 className="font-bold text-gray-800 mb-2">Organization:</h3>
                <p className="text-gray-700 font-semibold">{proforma.organization_name}</p>
              </>
            )}
            {proforma.customer_name && (
              <>
                <h3 className="font-bold text-gray-800 mb-2 mt-4">Customer Name:</h3>
                <p className="text-gray-700 font-semibold">{proforma.customer_name}</p>
                <p className="text-xs text-gray-500">(External Customer)</p>
              </>
            )}
            {proforma.car_model && (
              <>
                <h3 className="font-bold text-gray-800 mb-2 mt-4">Car Model:</h3>
                <p className="text-gray-700 font-semibold">{proforma.car_model}</p>
              </>
            )}
            {/* Fallback to linked customer info if exists (from customer_id) */}
            {!proforma.customer_name && (proforma.customer_email || proforma.customer_phone) && (
              <>
                <h3 className="font-bold text-gray-800 mb-2">Bill To:</h3>
                <div className="text-gray-700">
                  {proforma.customer_email && <p>{proforma.customer_email}</p>}
                  {proforma.customer_phone && <p>{proforma.customer_phone}</p>}
                </div>
              </>
            )}
          </div>
          <div>
            <h3 className="font-bold text-gray-800 mb-2">Proforma Details:</h3>
            <div className="text-gray-700 space-y-1">
              <p><span className="font-semibold">Date:</span> {format(new Date(proforma.created_at), 'MMMM dd, yyyy')}</p>
              {proforma.valid_until && (
                <p><span className="font-semibold">Valid Until:</span> {format(new Date(proforma.valid_until), 'MMMM dd, yyyy')}</p>
              )}
              {proforma.vehicle_info && (
                <p><span className="font-semibold">Vehicle:</span> {proforma.vehicle_info}</p>
              )}
              {proforma.service_type_name && (
                <p><span className="font-semibold">Service Type:</span> {proforma.service_type_name}</p>
              )}
              <p><span className="font-semibold">Status:</span> {proforma.status}</p>
            </div>
          </div>
        </div>

        {/* Description */}
        {proforma.description && (
          <div className="mb-6">
            <h3 className="font-bold text-gray-800 mb-2">Description:</h3>
            <p className="text-gray-700">{proforma.description}</p>
          </div>
        )}

        {/* Items Table */}
        <div className="mb-8">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-4 py-3 text-left font-semibold">#</th>
                <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Type</th>
                <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Item Description</th>
                <th className="border border-gray-300 px-4 py-3 text-right font-semibold">Quantity</th>
                <th className="border border-gray-300 px-4 py-3 text-right font-semibold">Unit Price</th>
                <th className="border border-gray-300 px-4 py-3 text-right font-semibold">Total</th>
              </tr>
            </thead>
            <tbody>
              {proforma.items.map((item, index) => (
                <>
                  <tr key={item.proforma_item_id || index}>
                    <td className="border border-gray-300 px-4 py-3">{index + 1}</td>
                    <td className="border border-gray-300 px-4 py-3">
                      <span className={`px-2 py-1 text-xs font-semibold rounded ${
                        item.item_type === 'Service' ? 'bg-blue-100 text-blue-800' :
                        item.item_type === 'Part' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {item.item_type || 'Other'}
                      </span>
                    </td>
                    <td className="border border-gray-300 px-4 py-3">
                      <div>
                        <div className="font-medium">{item.item_name}</div>
                        {item.item_description && (
                          <div className="text-sm text-gray-600">{item.item_description}</div>
                        )}
                        {item.part_code && (
                          <div className="text-xs text-gray-500">Part: {item.part_code}</div>
                        )}
                        {/* Market Prices */}
                        {item.market_prices && item.market_prices.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-gray-200">
                            <div className="text-xs font-semibold text-gray-700 mb-1">Market Prices:</div>
                            {item.market_prices.map((mp, mpIndex) => (
                              <div key={mpIndex} className="text-xs text-gray-600">
                                {mp.organization_name}: {new Intl.NumberFormat('en-US', {
                                  style: 'currency',
                                  currency: 'ETB',
                                }).format(mp.unit_price)}
                                {mp.notes && ` (${mp.notes})`}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="border border-gray-300 px-4 py-3 text-right">{item.quantity}</td>
                    <td className="border border-gray-300 px-4 py-3 text-right">
                      {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'ETB',
                      }).format(item.unit_price)}
                    </td>
                    <td className="border border-gray-300 px-4 py-3 text-right font-semibold">
                      {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'ETB',
                      }).format(item.total_price)}
                    </td>
                  </tr>
                </>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end mb-8">
          <div className="w-96">
            <table className="w-full border-collapse">
              <tbody>
                <tr>
                  <td className="border border-gray-300 px-4 py-2 text-right font-semibold">Subtotal:</td>
                  <td className="border border-gray-300 px-4 py-2 text-right">
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'ETB',
                    }).format(proforma.subtotal)}
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-2 text-right font-semibold">
                    Tax ({proforma.tax_rate}%):
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-right">
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'ETB',
                    }).format(proforma.tax_amount)}
                  </td>
                </tr>
                {proforma.discount_amount > 0 && (
                  <tr>
                    <td className="border border-gray-300 px-4 py-2 text-right font-semibold">Discount:</td>
                    <td className="border border-gray-300 px-4 py-2 text-right text-red-600">
                      - {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'ETB',
                      }).format(proforma.discount_amount)}
                    </td>
                  </tr>
                )}
                <tr className="bg-gray-100">
                  <td className="border border-gray-300 px-4 py-3 text-right font-bold text-lg">Grand Total:</td>
                  <td className="border border-gray-300 px-4 py-3 text-right font-bold text-lg text-blue-600">
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'ETB',
                    }).format(proforma.grand_total)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Notes */}
        {proforma.notes && (
          <div className="mb-8">
            <h3 className="font-bold text-gray-800 mb-2">Notes:</h3>
            <p className="text-gray-700">{proforma.notes}</p>
          </div>
        )}

        {/* Stamp Area */}
        <div className="mt-12 pt-8 border-t-2 border-dashed border-gray-400">
          <div className="text-center text-gray-500 mb-4">
            <p className="text-sm">Organization Stamp & Signature</p>
          </div>
          <div className="h-24 border-2 border-dashed border-gray-300 rounded flex items-center justify-center">
            <p className="text-gray-400 text-sm">[Stamp Here]</p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-6 border-t-2 border-gray-800 text-center text-sm text-gray-600">
          <p>Thank you for your business!</p>
          <p className="mt-2">This is a proforma invoice. Prices and availability are subject to change.</p>
          <p className="mt-1">For inquiries, please contact us.</p>
        </div>
      </div>
    </div>
  )
}
