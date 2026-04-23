import Appointments from './Appointments'

export default function AdvancedBooking() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-gray-800">Advanced Booking</h1>
      <p className="text-sm text-gray-600">
        Advanced booking is managed through Appointments with date/time scheduling and status tracking.
      </p>
      <Appointments />
    </div>
  )
}

