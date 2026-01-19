import { useQuery } from '@tanstack/react-query'
import { dashboardApi } from '../services/api'
import { Calendar, DollarSign, Users, Package, AlertCircle, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function Dashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const response = await dashboardApi.getStats()
      return response.data
    },
  })

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>
  }

  const cards = [
    {
      title: "Today's Appointments",
      value: stats?.today_appointments || 0,
      icon: Calendar,
      color: "bg-blue-500",
    },
    {
      title: "Completed Today",
      value: stats?.completed_today || 0,
      icon: TrendingUp,
      color: "bg-green-500",
    },
    {
      title: "Today's Revenue",
      value: `ETB ${(stats?.today_revenue || 0).toLocaleString()}`,
      icon: DollarSign,
      color: "bg-yellow-500",
    },
    {
      title: "Customers Served",
      value: stats?.customers_served_today || 0,
      icon: Users,
      color: "bg-purple-500",
    },
    {
      title: "Low Stock Items",
      value: stats?.low_stock_items || 0,
      icon: Package,
      color: "bg-red-500",
    },
    {
      title: "Notifications Sent",
      value: stats?.notifications_sent || 0,
      icon: AlertCircle,
      color: "bg-indigo-500",
    },
  ]

  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-tight mb-6">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card, index) => {
          const Icon = card.icon
          return (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {card.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-semibold tracking-tight">{card.value}</div>
                  <div className={`${card.color} p-3 rounded-full`}>
                    <Icon className="text-white" size={22} />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

