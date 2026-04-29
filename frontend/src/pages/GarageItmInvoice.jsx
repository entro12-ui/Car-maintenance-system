import GarageInvoiceEntryForm from './GarageInvoiceEntryForm'

export default function GarageItmInvoice() {
  return <GarageInvoiceEntryForm invoiceType="ITM" title="Invoice By Item" subtitle="Select a closed uninvoiced ITM job and print invoice." itmMode />
}
