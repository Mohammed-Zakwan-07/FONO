import { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Calendar, MessageSquare, Users, Clock, Phone, Mail } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface Inquiry {
  id: string;
  message: string;
  aiResponse: string;
  customerInfo: any;
  timestamp: string;
  status: string;
}

interface Appointment {
  id: string;
  customerName: string;
  email: string;
  phone: string;
  date: string;
  time: string;
  service: string;
  status: string;
  createdAt: string;
}

export function AdminDashboard() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch inquiries
      const inquiriesResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-8200c55f/inquiries`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );
      
      if (inquiriesResponse.ok) {
        const inquiriesData = await inquiriesResponse.json();
        setInquiries(inquiriesData.inquiries || []);
      }

      // Fetch appointments
      const appointmentsResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-8200c55f/appointments`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );
      
      if (appointmentsResponse.ok) {
        const appointmentsData = await appointmentsResponse.json();
        setAppointments(appointmentsData.appointments || []);
      }
      
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <Button onClick={fetchData}>Refresh Data</Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Inquiries</p>
              <p className="text-2xl font-bold text-gray-900">{inquiries.length}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Appointments</p>
              <p className="text-2xl font-bold text-gray-900">{appointments.length}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Unique Customers</p>
              <p className="text-2xl font-bold text-gray-900">
                {new Set(inquiries.map(i => i.customerInfo?.email).filter(Boolean)).size}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Data Tables */}
      <Tabs defaultValue="inquiries" className="space-y-6">
        <TabsList>
          <TabsTrigger value="inquiries">Customer Inquiries</TabsTrigger>
          <TabsTrigger value="appointments">Appointments</TabsTrigger>
        </TabsList>

        <TabsContent value="inquiries" className="space-y-4">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Recent Customer Inquiries</h2>
            {inquiries.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No inquiries yet. Try the demo above!</p>
            ) : (
              <div className="space-y-4">
                {inquiries.map((inquiry) => (
                  <div key={inquiry.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <Badge variant="outline">{inquiry.status}</Badge>
                          <span className="text-sm text-gray-500">
                            {formatDate(inquiry.timestamp)}
                          </span>
                        </div>
                        <div className="space-y-2">
                          <div>
                            <p className="text-sm font-medium text-gray-700">Customer Message:</p>
                            <p className="text-gray-900 bg-gray-50 p-2 rounded">{inquiry.message}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-700">AI Response:</p>
                            <p className="text-gray-900 bg-blue-50 p-2 rounded">{inquiry.aiResponse}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    {inquiry.customerInfo && (
                      <div className="flex items-center space-x-4 text-sm text-gray-600 border-t pt-3">
                        {inquiry.customerInfo.email && (
                          <div className="flex items-center space-x-1">
                            <Mail className="w-4 h-4" />
                            <span>{inquiry.customerInfo.email}</span>
                          </div>
                        )}
                        {inquiry.customerInfo.phone && (
                          <div className="flex items-center space-x-1">
                            <Phone className="w-4 h-4" />
                            <span>{inquiry.customerInfo.phone}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="appointments" className="space-y-4">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Scheduled Appointments</h2>
            {appointments.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No appointments scheduled yet.</p>
            ) : (
              <div className="space-y-4">
                {appointments.map((appointment) => (
                  <div key={appointment.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">{appointment.customerName}</h3>
                        <p className="text-sm text-gray-600">{appointment.service}</p>
                      </div>
                      <Badge className={appointment.status === 'confirmed' ? 'bg-green-100 text-green-800' : ''}>
                        {appointment.status}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span>{appointment.date} at {appointment.time}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span>Booked {formatDate(appointment.createdAt)}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span>{appointment.email}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span>{appointment.phone}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}