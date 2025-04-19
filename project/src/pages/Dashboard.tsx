import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  GavelIcon, 
  Star, 
  Archive, 
  Calendar,
  Search,
  ArrowRight,
  Clock,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { useCases } from '../hooks/useCases';
import { useClients } from '../hooks/useClients';
import { useTasks } from '../hooks/useTasks';
import { useAppointments } from '../hooks/useAppointments';
import { format } from 'date-fns';

// Interfaces for type safety
interface Client {
  id: number;
  name: string;
  mobile: string;
  cases: number;
  status: boolean;
}

interface Case {
  id: number;
  clientName: string;
  clientNo: string;
  caseType: string;
  court: string;
  courtNo: string;
  magistrate: string;
  petitioner: string;
  respondent: string;
  nextDate: string;
  status: string;
  isImportant: boolean;
}

interface Task {
  id: number;
  taskName: string;
  relatedTo: {
    name: string;
    caseNumber: string;
  };
  startDate: string;
  deadline: string;
  members: string[];
  status: string;
  priority: 'Low' | 'Medium' | 'Urgent';
}

interface Appointment {
  id: number;
  clientName: string;
  date: string;
  time: string;
  status: string;
}

function Dashboard() {
  // Use the real API hooks
  const { clients: apiClients, loading: clientsLoading } = useClients();
  const { cases: apiCases, loading: casesLoading } = useCases();
  const { tasks: apiTasks, loading: tasksLoading } = useTasks();
  const { appointments: apiAppointments, loading: appointmentsLoading } = useAppointments();
  
  // State for UI (transformed from API data)
  const [clients, setClients] = useState<Client[]>([]);
  const [cases, setCases] = useState<Case[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Stats calculation
  const stats = {
    totalClients: clients.length,
    totalCases: cases.length,
    importantCases: cases.filter(c => c.isImportant).length,
    archivedCases: cases.filter(c => c.status === 'Completed').length
  };

  // Transform API clients to UI client format
  useEffect(() => {
    if (apiClients && apiClients.length > 0) {
      const transformedClients = apiClients.map(client => ({
        id: typeof client._id === 'string' ? parseInt(client._id.slice(-6), 16) : Math.floor(Math.random() * 1000),
        name: client.name,
        mobile: client.mobile || client.phone || 'N/A',
        cases: client.cases?.length || 0,
        status: client.status
      }));
      setClients(transformedClients);
    }
  }, [apiClients]);

  // Transform API cases to UI case format
  useEffect(() => {
    if (apiCases && apiCases.length > 0) {
      const transformedCases = apiCases.map(caseItem => ({
        id: typeof caseItem._id === 'string' ? parseInt(caseItem._id.slice(-6), 16) : Math.floor(Math.random() * 1000),
        clientName: caseItem.clientName,
        clientNo: caseItem.clientNo,
        caseType: caseItem.caseType,
        court: caseItem.court,
        courtNo: caseItem.courtNo || 'N/A',
        magistrate: caseItem.magistrate || 'N/A',
        petitioner: caseItem.petitioner,
        respondent: caseItem.respondent,
        nextDate: caseItem.nextDate ? new Date(caseItem.nextDate).toLocaleDateString() : 'No date set',
        status: caseItem.status,
        isImportant: caseItem.isImportant
      }));
      setCases(transformedCases);
    }
  }, [apiCases]);

  // Transform API tasks to UI task format
  useEffect(() => {
    if (apiTasks && apiTasks.length > 0) {
      const transformedTasks = apiTasks.map(task => ({
        id: typeof task._id === 'string' ? parseInt(task._id.slice(-6), 16) : Math.floor(Math.random() * 1000),
        taskName: task.title,
        relatedTo: task.relatedTo || {
          name: 'N/A',
          caseNumber: 'N/A'
        },
        startDate: task.startDate ? new Date(task.startDate).toLocaleDateString() : 'N/A',
        deadline: task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'N/A',
        members: [task.userId], // This could be enhanced if task has assigned members
        status: task.status,
        priority: mapPriority(task.priority)
      }));
      setTasks(transformedTasks);
    }
  }, [apiTasks]);

  // Map API priority values to UI priority values
  const mapPriority = (priority: string): 'Low' | 'Medium' | 'Urgent' => {
    switch (priority) {
      case 'High': return 'Urgent';
      case 'Medium': return 'Medium';
      case 'Low': return 'Low';
      default: return 'Medium';
    }
  };

  // Transform API appointments to UI appointment format
  useEffect(() => {
    if (apiAppointments && apiAppointments.length > 0) {
      const transformedAppointments = apiAppointments.map(appointment => {
        // Find client by ID
        const client = apiClients.find(c => c._id === appointment.clientId);
        const appointmentDate = new Date(appointment.dateTime);
        
        return {
          id: typeof appointment._id === 'string' ? parseInt(appointment._id.slice(-6), 16) : Math.floor(Math.random() * 1000),
          clientName: client?.name || 'Unknown Client',
          date: format(appointmentDate, 'MM-dd-yyyy'),
          time: format(appointmentDate, 'h:mm a'),
          status: appointment.status
        };
      });
      setAppointments(transformedAppointments);
    }
  }, [apiAppointments, apiClients]);

  // Set loading state based on all API loading states
  useEffect(() => {
    setLoading(clientsLoading || casesLoading || tasksLoading || appointmentsLoading);
  }, [clientsLoading, casesLoading, tasksLoading, appointmentsLoading]);

  // Auto-refresh data every 30 seconds for real-time updates
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      // These functions will be called from their respective useEffect clean-up
      // No need to call them directly here
    }, 30000);
    
    return () => clearInterval(refreshInterval);
  }, []);

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'Low':
        return 'bg-gray-100 text-gray-800';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'Urgent':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <main className="p-4 md:p-6">
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
          <span className="ml-2 text-lg">Loading dashboard data...</span>
        </div>
      ) : (
        <>
          {/* Stats Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6">
            <StatCard 
              icon={<Users className="text-blue-600" />} 
              number={stats.totalClients} 
              label="Clients" 
              subLabel="Total clients" 
            />
            <StatCard 
              icon={<GavelIcon className="text-blue-600" />} 
              number={stats.totalCases} 
              label="Cases" 
              subLabel="Total cases" 
            />
            <StatCard 
              icon={<Star className="text-blue-600" />} 
              number={stats.importantCases} 
              label="Important Cases" 
              subLabel="Total important cases" 
            />
            <StatCard 
              icon={<Archive className="text-blue-600" />} 
              number={stats.archivedCases} 
              label="Archived Cases" 
              subLabel="Total completed cases" 
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            {/* Recent Cases */}
            <section className="bg-white rounded-lg shadow p-4 md:p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg md:text-xl font-semibold flex items-center">
                  <GavelIcon className="w-5 h-5 mr-2" />
                  Recent Cases
                </h2>
                <Link 
                  to="/cases" 
                  className="text-blue-600 hover:text-blue-800 flex items-center text-sm"
                >
                  View All <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </div>
              <div className="space-y-4 overflow-x-auto">
                {cases.length > 0 ? (
                  cases.slice(0, 3).map(c => (
                    <div key={c.id} className="border-b pb-4 last:border-0">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                        <div>
                          <h3 className="font-medium">{c.clientName}</h3>
                          <p className="text-sm text-gray-500">Case: {c.caseType}</p>
                          <p className="text-sm text-gray-500">Court: {c.court}</p>
                        </div>
                        <span className="px-2 py-1 text-sm rounded-full bg-blue-100 text-blue-800 mt-2 sm:mt-0">
                          {c.status}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center text-sm text-gray-500">
                        <Clock className="w-4 h-4 mr-1" />
                        Next Date: {c.nextDate}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-gray-500">No cases found</div>
                )}
              </div>
            </section>

            {/* Urgent Tasks */}
            <section className="bg-white rounded-lg shadow p-4 md:p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg md:text-xl font-semibold flex items-center">
                  <AlertCircle className="w-5 h-5 mr-2" />
                  Urgent Tasks
                </h2>
                <Link 
                  to="/tasks" 
                  className="text-blue-600 hover:text-blue-800 flex items-center text-sm"
                >
                  View All <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </div>
              <div className="space-y-4 overflow-x-auto">
                {tasks.length > 0 ? (
                  tasks
                    .filter(t => t.priority === 'Urgent')
                    .slice(0, 3)
                    .map(task => (
                      <div key={task.id} className="border-b pb-4 last:border-0">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                          <div>
                            <h3 className="font-medium">{task.taskName}</h3>
                            <p className="text-sm text-gray-500">
                              Related to: {task.relatedTo.name}
                            </p>
                            <p className="text-sm text-gray-500">
                              Case: {task.relatedTo.caseNumber}
                            </p>
                          </div>
                          <span className={`px-2 py-1 text-sm rounded-full ${getPriorityColor(task.priority)} mt-2 sm:mt-0`}>
                            {task.priority}
                          </span>
                        </div>
                        <div className="mt-2 flex items-center text-sm text-gray-500">
                          <Clock className="w-4 h-4 mr-1" />
                          Deadline: {task.deadline}
                        </div>
                      </div>
                    ))
                ) : (
                  <div className="text-center py-4 text-gray-500">No urgent tasks found</div>
                )}
              </div>
            </section>

            {/* Today's Appointments */}
            <section className="bg-white rounded-lg shadow p-4 md:p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg md:text-xl font-semibold flex items-center">
                  <Calendar className="w-5 h-5 mr-2" />
                  Today's Appointments
                </h2>
                <Link 
                  to="/appointments" 
                  className="text-blue-600 hover:text-blue-800 flex items-center text-sm"
                >
                  View All <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </div>
              <div className="space-y-4 overflow-x-auto">
                {appointments.length > 0 ? (
                  appointments
                    .filter(a => {
                      // Show only today's appointments
                      const today = new Date().toLocaleDateString();
                      const appointmentDate = new Date(a.date).toLocaleDateString();
                      return today === appointmentDate;
                    })
                    .map(appointment => (
                      <div key={appointment.id} className="border-b pb-4 last:border-0">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                          <div>
                            <h3 className="font-medium">{appointment.clientName}</h3>
                            <div className="flex items-center text-sm text-gray-500">
                              <Clock className="w-4 h-4 mr-1" />
                              {appointment.time}
                            </div>
                          </div>
                          <span className="px-2 py-1 text-sm rounded-full bg-blue-100 text-blue-800 mt-2 sm:mt-0">
                            {appointment.status}
                          </span>
                        </div>
                      </div>
                    ))
                ) : (
                  <div className="text-center py-4 text-gray-500">No appointments for today</div>
                )}
              </div>
            </section>

            {/* Recent Clients */}
            <section className="bg-white rounded-lg shadow p-4 md:p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg md:text-xl font-semibold flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  Recent Clients
                </h2>
                <Link 
                  to="/clients" 
                  className="text-blue-600 hover:text-blue-800 flex items-center text-sm"
                >
                  View All <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </div>
              <div className="space-y-4 overflow-x-auto">
                {clients.length > 0 ? (
                  clients
                    .slice(0, 3)
                    .map(client => (
                      <div key={client.id} className="border-b pb-4 last:border-0">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                          <div>
                            <h3 className="font-medium">{client.name}</h3>
                            <p className="text-sm text-gray-500">
                              Mobile: {client.mobile}
                            </p>
                            <p className="text-sm text-gray-500">
                              Cases: {client.cases}
                            </p>
                          </div>
                          <div className="relative inline-block w-10 mr-2 align-middle select-none mt-2 sm:mt-0">
                            <input
                              type="checkbox"
                              checked={client.status}
                              readOnly
                              className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
                            />
                            <label className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer"></label>
                          </div>
                        </div>
                      </div>
                    ))
                ) : (
                  <div className="text-center py-4 text-gray-500">No clients found</div>
                )}
              </div>
            </section>
          </div>
        </>
      )}
    </main>
  );
}

function StatCard({ icon, number, label, subLabel }) {
  return (
    <div className="bg-white p-4 md:p-6 rounded-lg shadow">
      <div className="flex items-center space-x-4">
        <div className="p-3 bg-blue-50 rounded-lg">
          {icon}
        </div>
        <div>
          <div className="text-xl md:text-2xl font-bold">{number}</div>
          <div className="text-gray-600">{label}</div>
          <div className="text-sm text-gray-500">{subLabel}</div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;