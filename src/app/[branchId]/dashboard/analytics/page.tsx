'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  TrendingUp, 
  TrendingDown,
  Calendar,
  DollarSign,
  Users,
  Sparkles,
  Clock,
  Star
} from 'lucide-react'

const stats = [
  { label: 'Total Revenue', value: '$45,678', change: '+23.1%', trend: 'up', icon: DollarSign },
  { label: 'Total Bookings', value: '1,234', change: '+12.5%', trend: 'up', icon: Calendar },
  { label: 'New Customers', value: '156', change: '+8.2%', trend: 'up', icon: Users },
  { label: 'Avg Rating', value: '4.8', change: '+0.3', trend: 'up', icon: Star },
]

const topServices = [
  { name: 'Swedish Massage', bookings: 342, revenue: 41040, growth: 15 },
  { name: 'Facial Treatment', bookings: 312, revenue: 34320, growth: 12 },
  { name: 'Aromatherapy Massage', bookings: 298, revenue: 53640, growth: 18 },
  { name: 'Hot Stone Massage', bookings: 256, revenue: 38400, growth: 10 },
  { name: 'Anti-Aging Facial', bookings: 245, revenue: 49000, growth: 22 },
]

const topStaff = [
  { name: 'Emma Wilson', bookings: 342, rating: 4.9, revenue: 41040 },
  { name: 'Lisa Anderson', bookings: 298, rating: 4.8, revenue: 53640 },
  { name: 'Maria Garcia', bookings: 189, rating: 5.0, revenue: 20790 },
  { name: 'John Smith', bookings: 256, rating: 4.7, revenue: 35840 },
]

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            {'Analytics & Reports'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {'Business insights and performance metrics'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select defaultValue="30days">
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">{'Last 7 Days'}</SelectItem>
              <SelectItem value="30days">{'Last 30 Days'}</SelectItem>
              <SelectItem value="90days">{'Last 90 Days'}</SelectItem>
              <SelectItem value="year">{'This Year'}</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            {'Export Report'}
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          const TrendIcon = stat.trend === 'up' ? TrendingUp : TrendingDown
          return (
            <Card key={stat.label}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.label}
                </CardTitle>
                <Icon className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <TrendIcon className={`w-3 h-3 ${stat.trend === 'up' ? 'text-green-600' : 'text-red-600'}`} />
                  <span className={stat.trend === 'up' ? 'text-green-600' : 'text-red-600'}>{stat.change}</span>
                  <span>{'from last period'}</span>
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{'Revenue Overview'}</CardTitle>
            <CardDescription>{'Monthly revenue trend'}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center border border-dashed border-border rounded-lg">
              <p className="text-sm text-muted-foreground">{'Revenue chart visualization'}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{'Booking Trends'}</CardTitle>
            <CardDescription>{'Daily bookings over time'}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center border border-dashed border-border rounded-lg">
              <p className="text-sm text-muted-foreground">{'Booking chart visualization'}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Tables */}
      <Tabs defaultValue="services" className="space-y-4">
        <TabsList>
          <TabsTrigger value="services">{'Top Services'}</TabsTrigger>
          <TabsTrigger value="staff">{'Top Performers'}</TabsTrigger>
          <TabsTrigger value="customers">{'Top Customers'}</TabsTrigger>
        </TabsList>

        <TabsContent value="services">
          <Card>
            <CardHeader>
              <CardTitle>{'Top Services'}</CardTitle>
              <CardDescription>{'Most popular services by bookings and revenue'}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topServices.map((service, index) => (
                  <div key={service.name} className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-sm">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium text-foreground">{service.name}</p>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-muted-foreground">{service.bookings} bookings</span>
                          <span className="font-semibold">${service.revenue.toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-secondary rounded-full h-2">
                          <div 
                            className="bg-primary rounded-full h-2"
                            style={{ width: `${(service.bookings / topServices[0].bookings) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-green-600 font-medium">+{service.growth}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="staff">
          <Card>
            <CardHeader>
              <CardTitle>{'Top Performers'}</CardTitle>
              <CardDescription>{'Staff members by bookings and revenue'}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topStaff.map((staff, index) => (
                  <div key={staff.name} className="flex items-center gap-4 p-4 rounded-lg border border-border">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-sm">
                      {index + 1}
                    </div>
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <p className="font-medium text-foreground">{staff.name}</p>
                        <div className="flex items-center gap-1 mt-1">
                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          <span className="text-xs font-medium">{staff.rating}</span>
                        </div>
                      </div>
                      <div className="text-center">
                        <p className="font-semibold text-foreground">{staff.bookings}</p>
                        <p className="text-xs text-muted-foreground">{'Bookings'}</p>
                      </div>
                      <div className="text-center">
                        <p className="font-semibold text-foreground">${staff.revenue.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">{'Revenue'}</p>
                      </div>
                      <div className="text-right">
                        <Button variant="outline" size="sm">
                          {'View Details'}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customers">
          <Card>
            <CardHeader>
              <CardTitle>{'Top Customers'}</CardTitle>
              <CardDescription>{'Most valuable customers by spending'}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground text-center py-8">
                {'Top customers data would be displayed here'}
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Additional Insights */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>{'Peak Hours'}</CardTitle>
            <CardDescription>{'Busiest times of day'}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">{'10:00 AM - 12:00 PM'}</span>
                </div>
                <span className="text-sm font-medium">{'High'}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">{'02:00 PM - 04:00 PM'}</span>
                </div>
                <span className="text-sm font-medium">{'High'}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">{'06:00 PM - 08:00 PM'}</span>
                </div>
                <span className="text-sm font-medium">{'Medium'}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{'Customer Retention'}</CardTitle>
            <CardDescription>{'Repeat customer rate'}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-4xl font-bold text-foreground mb-2">{'78%'}</div>
              <p className="text-sm text-muted-foreground">{'Customers return within 30 days'}</p>
              <div className="mt-4 w-full bg-secondary rounded-full h-3">
                <div className="bg-primary rounded-full h-3" style={{ width: '78%' }} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{'Avg Session Duration'}</CardTitle>
            <CardDescription>{'Average treatment time'}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-4xl font-bold text-foreground mb-2">{'72 min'}</div>
              <p className="text-sm text-muted-foreground">{'Across all services'}</p>
              <div className="mt-4 flex items-center justify-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-600 font-medium">{'+5 min from last month'}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
