import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import { supabase } from '../lib/supabase';
import {
  Calendar,
  FileText,
  AlertCircle,
  Users,
  Stethoscope,
  Clock,
  Activity,
  TrendingUp,
  UserCheck,
  RefreshCw
} from 'lucide-react';

// Interfaces para los datos
interface UpcomingAppointment {
  id: number;
  doctor: string;
  specialty: string;
  date: string;
  time: string;
  status: string;
}

interface RecentMedicalRecord {
  id: number;
  serviceType: string;
  doctor: string;
  date: string;
  type: 'consulta' | 'examen' | 'terapia' | 'cirugia' | 'control' | 'tratamiento' | 'diagnostico' | 'ingreso' | 'alta';
}

interface AccessRequest {
  id: number;
  name: string;
  type: string;
  document: string;
  requestDate: string;
  status: string;
}

interface TodayAppointment {
  id: number;
  patient: string;
  time: string;
  status: 'completed' | 'in-progress' | 'pending';
  specialty?: string;
}

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  pendingRequests: number;
  totalPatients: number;
}

const Dashboard: React.FC = () => {
  const { user } = useUser();

  if (!user) return null;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };

  // Different dashboard content based on role
  const renderDashboardContent = () => {
    switch (user.currentRole) {
      case 'patient':
        return <PatientDashboard />;
      case 'admin':
        return <AdminDashboard />;
      case 'medical':
        return <MedicalDashboard />;
      default:
        return <PatientDashboard />;
    }
  };

  return (
      <div className="container mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-800">
            {getGreeting()}, {user.name}
          </h1>
          <p className="text-gray-600 mt-1">
            Bienvenido al Sistema de Gestión de Historias Clínicas
          </p>
        </div>

        {renderDashboardContent()}
      </div>
  );
};

const PatientDashboard: React.FC = () => {
  const { user } = useUser();
  const [upcomingAppointments, setUpcomingAppointments] = useState<UpcomingAppointment[]>([]);
  const [recentRecords, setRecentRecords] = useState<RecentMedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPatientData = async () => {
    if (!user?.currentProfileId) return;

    try {
      setLoading(true);
      setError(null);

      // Obtener citas próximas del paciente
      const { data: citasData, error: citasError } = await supabase
          .from('cita_medica')
          .select(`
          id_cita_medica,
          fecha_hora_programada,
          estado,
          personal_medico (
            persona (
              prenombres,
              primer_apellido
            ),
            especialidad (
              descripcion
            )
          )
        `)
          .eq('id_paciente', user.currentProfileId)
          .eq('estado', 'Programada')
          .gte('fecha_hora_programada', new Date().toISOString())
          .order('fecha_hora_programada', { ascending: true })
          .limit(5);

      if (!citasError && citasData) {
        const appointments: UpcomingAppointment[] = citasData.map((cita: any) => {
          const fechaHora = new Date(cita.fecha_hora_programada);
          const doctor = cita.personal_medico?.persona;
          const doctorName = doctor ?
              `Dr. ${doctor.prenombres} ${doctor.primer_apellido}` :
              'Doctor no asignado';

          return {
            id: cita.id_cita_medica,
            doctor: doctorName,
            specialty: cita.personal_medico?.especialidad?.descripcion || 'Medicina General',
            date: fechaHora.toLocaleDateString('es-ES'),
            time: fechaHora.toLocaleTimeString('es-ES', {
              hour: '2-digit',
              minute: '2-digit'
            }),
            status: cita.estado
          };
        });
        setUpcomingAppointments(appointments);
      }

      // Obtener servicios médicos recientes
      const { data: serviciosData, error: serviciosError } = await supabase
          .from('servicio_medico')
          .select(`
          id_servicio_medico,
          fecha_servicio,
          cita_medica!inner (
            id_paciente,
            personal_medico (
              persona (
                prenombres,
                primer_apellido
              )
            )
          ),
          consulta_medica (
            id_consulta_medica,
            tipo_servicio (
              nombre
            )
          ),
          examen (
            id_examen,
            tipo_procedimiento,
            tipo_laboratorio
          ),
          terapia (
            id_terapia,
            descripcion
          ),
          intervencion_quirurgica (
            id_intervencion,
            procedimiento_quirurgico
          ),
          control (
            id_control
          ),
          tratamiento (
            id_tratamiento
          ),
          diagnostico (
            id_diagnostico
          ),
          ingreso_hospitalizacion (
            id_ingreso_hospitalizacion
          ),
          alta_hospitalizacion (
            id_alta_hospitalizacion
          )
        `)
          .eq('cita_medica.id_paciente', user.currentProfileId)
          .order('fecha_servicio', { ascending: false })
          .limit(5);

      if (!serviciosError && serviciosData) {
        const records: RecentMedicalRecord[] = serviciosData.map((servicio: any) => {
          const doctor = servicio.cita_medica?.personal_medico?.persona;
          const doctorName = doctor ?
              `Dr. ${doctor.prenombres} ${doctor.primer_apellido}` :
              'Personal médico';

          let serviceType = 'Servicio Médico';
          let type: RecentMedicalRecord['type'] = 'consulta';

          if (servicio.consulta_medica && servicio.consulta_medica.length > 0) {
            serviceType = servicio.consulta_medica[0].tipo_servicio?.nombre || 'Consulta Médica';
            type = 'consulta';
          } else if (servicio.examen && servicio.examen.length > 0) {
            const examen = servicio.examen[0];
            serviceType = examen.tipo_laboratorio || examen.tipo_procedimiento || 'Examen Médico';
            type = 'examen';
          } else if (servicio.terapia && servicio.terapia.length > 0) {
            serviceType = 'Terapia';
            type = 'terapia';
          } else if (servicio.intervencion_quirurgica && servicio.intervencion_quirurgica.length > 0) {
            serviceType = 'Intervención Quirúrgica';
            type = 'cirugia';
          } else if (servicio.control && servicio.control.length > 0) {
            serviceType = 'Control de Signos Vitales';
            type = 'control';
          } else if (servicio.tratamiento && servicio.tratamiento.length > 0) {
            serviceType = 'Tratamiento';
            type = 'tratamiento';
          } else if (servicio.diagnostico && servicio.diagnostico.length > 0) {
            serviceType = 'Diagnóstico';
            type = 'diagnostico';
          } else if (servicio.ingreso_hospitalizacion && servicio.ingreso_hospitalizacion.length > 0) {
            serviceType = 'Ingreso Hospitalario';
            type = 'ingreso';
          } else if (servicio.alta_hospitalizacion && servicio.alta_hospitalizacion.length > 0) {
            serviceType = 'Alta Hospitalaria';
            type = 'alta';
          }

          return {
            id: servicio.id_servicio_medico,
            serviceType,
            doctor: doctorName,
            date: new Date(servicio.fecha_servicio).toLocaleDateString('es-ES'),
            type
          };
        });
        setRecentRecords(records);
      }

    } catch (error) {
      console.error('Error cargando datos del paciente:', error);
      setError('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatientData();
  }, [user?.currentProfileId]);

  const getServiceIcon = (type: RecentMedicalRecord['type']) => {
    switch (type) {
      case 'consulta':
        return <Stethoscope className="h-5 w-5 text-green-600" />;
      case 'examen':
        return <FileText className="h-5 w-5 text-blue-600" />;
      case 'terapia':
        return <Activity className="h-5 w-5 text-purple-600" />;
      case 'cirugia':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      case 'control':
        return <Activity className="h-5 w-5 text-pink-600" />;
      case 'tratamiento':
      return <TrendingUp className="h-5 w-5 text-yellow-600" />;
      case 'diagnostico':
      return <FileText className="h-5 w-5 text-gray-600" />;
      case 'ingreso':
      return <Clock className="h-5 w-5 text-blue-600" />;
      case 'alta':
        return <UserCheck className="h-5 w-5 text-green-600" />;
      default:
        return <FileText className="h-5 w-5 text-gray-600" />;
    }
  };

  if (loading) {
    return (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Cargando...</span>
        </div>
    );
  }

  return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Upcoming Appointments */}
        <div className="col-span-1 md:col-span-2 bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-800">Próximas Citas</h2>
            {error && (
                <button
                    onClick={fetchPatientData}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
                >
                  <RefreshCw className="h-4 w-4 mr-1"/>
                  Reintentar
                </button>
            )}
          </div>

          {error ? (
              <div className="text-center py-6 text-red-500">
                <AlertCircle className="h-8 w-8 mx-auto mb-2"/>
                <p className="text-sm">{error}</p>
              </div>
          ) : upcomingAppointments.length > 0 ? (
              <div className="space-y-4">
                {upcomingAppointments.map((appointment) => (
                    <div key={appointment.id} className="border-l-4 border-blue-500 pl-4 py-3 bg-blue-50 rounded-r-md">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-800">{appointment.doctor}</p>
                          <p className="text-sm text-gray-600">{appointment.specialty}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-800">{appointment.date}</p>
                          <p className="text-xs text-gray-600">{appointment.time}</p>
                        </div>
                      </div>
                    </div>
                ))}
              </div>
          ) : (
              <div className="text-center py-6 text-gray-500">
                <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-2"/>
                <p>No tienes citas programadas</p>
              </div>
          )}
        </div>

        {/* Recent Medical Records */}
        <div className="col-span-1 bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-800">Servicios Reciente</h2>
          </div>

          <div className="space-y-4">
            {recentRecords.length > 0 ? (
                recentRecords.map((record) => (
                    <div key={record.id}
                         className="border border-gray-200 rounded-md p-3 hover:bg-gray-50 transition-colors">
                      <div className="flex justify-between">
                        <div className="flex items-center">
                          {getServiceIcon(record.type)}
                          <p className="font-medium text-gray-800 ml-2 text-sm">{record.serviceType}</p>
                        </div>
                        <span className="text-xs text-gray-500">{record.date}</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{record.doctor}</p>
                    </div>
                ))
            ) : (
                <div className="text-center py-4 text-gray-500">
                  <FileText className="h-8 w-8 mx-auto text-gray-400 mb-2"/>
                  <p className="text-sm">No hay registros recientes</p>
                </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="col-span-1 md:col-span-2 lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
          <Link
              to="/medical-records"
              className="bg-white p-4 rounded-lg shadow-sm flex items-center hover:bg-green-50 transition-colors"
          >
            <div className="p-3 bg-green-100 rounded-full">
              <FileText className="h-6 w-6 text-green-600"/>
            </div>
            <span className="ml-3 font-medium text-gray-800">Ver Historia Clínica</span>
          </Link>
          <Link
              to="/appointments"
              className="bg-white p-4 rounded-lg shadow-sm flex items-center hover:bg-green-50 transition-colors"
          >
            <div className="p-3 bg-purple-100 rounded-full">
              <Calendar className="h-6 w-6 text-purple-600"/>
            </div>
            <span className="ml-3 font-medium text-gray-800">Programar Citas</span>
          </Link>
        </div>
      </div>
  );
};

const AdminDashboard: React.FC = () => {
  const [pendingRequests, setPendingRequests] = useState<AccessRequest[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeUsers: 0,
    pendingRequests: 0,
    totalPatients: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Obtener solicitudes pendientes
      const {data: solicitudesData, error: solicitudesError } = await supabase
          .from('solicitud')
          .select(`
          id_solicitud,
          descripcion,
          fecha_solicitud,
          estado_solicitud,
          persona (
            prenombres,
            primer_apellido,
            dni_idcarnet
          )
        `)
          .eq('estado_solicitud', 'Pendiente')
          .order('fecha_solicitud', { ascending: false })
          .limit(5);

      if (!solicitudesError && solicitudesData) {
        const requests: AccessRequest[] = solicitudesData.map((solicitud: any) => ({
          id: solicitud.id_solicitud,
          name: `${solicitud.persona.prenombres} ${solicitud.persona.primer_apellido}`,
          type: solicitud.descripcion || 'Solicitud de acceso',
          document: solicitud.persona.dni_idcarnet,
          requestDate: new Date(solicitud.fecha_solicitud).toLocaleDateString('es-ES'),
          status: solicitud.estado_solicitud
        }));
        setPendingRequests(requests);
      }

      // Obtener estadísticas
      // Total de pacientes
      const { count: totalPatients } = await supabase
          .from('paciente')
          .select('*', { count: 'exact', head: true });

      // Solicitudes pendientes
      const { count: pendingCount } = await supabase
          .from('solicitud')
          .select('*', { count: 'exact', head: true })
          .eq('estado_solicitud', 'Pendiente');

      // Personal médico activo
      const { count: activeStaff } = await supabase
          .from('personal_medico')
          .select('*', { count: 'exact', head: true })
          .eq('habilitado', true);

      setStats({
        totalUsers: (totalPatients || 0) + (activeStaff || 0),
        activeUsers: activeStaff || 0,
        pendingRequests: pendingCount || 0,
        totalPatients: totalPatients || 0
      });

    } catch (error) {
      console.error('Error cargando datos de administrador:', error);
      setError('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  if (loading) {
    return (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Cargando estadísticas...</span>
        </div>
    );
  }

  return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Estadísticas principales */}
        <div className="col-span-1 md:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-full">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Pacientes</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalPatients}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-full">
                <UserCheck className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Personal Activo</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activeUsers}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-3 bg-red-100 rounded-full">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Solicitudes Pendientes</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pendingRequests}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Solicitudes pendientes */}
        <div className="col-span-1 md:col-span-2 bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-800">Solicitudes Pendientes</h2>
            {stats.pendingRequests > 0 && (
                <span className="inline-flex items-center justify-center px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
              {stats.pendingRequests} nuevas
            </span>
            )}
          </div>

          {error ? (
              <div className="text-center py-6 text-red-500">
                <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                <p className="text-sm">{error}</p>
                <button
                    onClick={fetchAdminData}
                    className="mt-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  Reintentar
                </button>
              </div>
          ) : pendingRequests.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Solicitante
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Documento
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Fecha
                    </th>
                  </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                  {pendingRequests.map((request) => (
                      <tr key={request.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{request.name}</div>
                          <div className="text-sm text-gray-500">{request.type}</div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                          {request.document}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                          {request.requestDate}
                        </td>
                      </tr>
                  ))}
                  </tbody>
                </table>
              </div>
          ) : (
              <div className="text-center py-6 text-gray-500">
                <Users className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                <p>No hay solicitudes pendientes</p>
              </div>
          )}
        </div>

        {/* Acciones rápidas */}
        <div className="col-span-1 space-y-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-medium text-gray-800 mb-4">Estadísticas del Sistema</h2>

            <div className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 text-sm">👥</span>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">Usuarios del Sistema</div>
                      <div className="text-sm text-gray-500">Total registrados</div>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-blue-600">{stats.totalUsers}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-medium text-gray-800 mb-4">Acciones Rápidas</h2>

            <div className="space-y-3">
              <Link
                  to='/access-management'
                  className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center"
              >
                <Users className="h-5 w-5 mr-2"/>
                Gestionar Usuarios
              </Link>

              <Link
                  to='/medical-records'
                  className="w-full py-2 px-4 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200 transition-colors flex items-center justify-center"
              >
                <FileText className="h-5 w-5 mr-2"/>
                Historias Clínicas
              </Link>
            </div>
          </div>
        </div>
      </div>
  );
};

const MedicalDashboard: React.FC = () => {
  const {user} = useUser();
  const [todayAppointments, setTodayAppointments] = useState<TodayAppointment[]>([]);
  const [stats, setStats] = useState({
    totalToday: 0,
    completed: 0,
    inProgress: 0,
    pending: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMedicalData = async () => {
    if (!user?.currentProfileId) return;

    try {
      setLoading(true);
      setError(null);

      const today = new Date().toISOString().split('T')[0];

      // Obtener ID del personal médico basado en id_persona
      const { data: personalData, error: personalError } = await supabase
          .from('personal_medico')
          .select('id_personal_medico')
          .eq('id_persona', user.currentProfileId)
          .single();

      if (personalError) {
        console.error('Error obteniendo personal médico:', personalError);
        throw new Error('No se encontró información del personal médico');
      }

      if (!personalData) {
        throw new Error('No se encontró registro de personal médico para este usuario');
      }

      console.log('Personal médico encontrado:', personalData);

      // Obtener citas de hoy para este médico
      const { data: citasData, error: citasError } = await supabase
          .from('cita_medica')
          .select(`
          id_cita_medica,
          fecha_hora_programada,
          estado,
          paciente (
            persona (
              prenombres,
              primer_apellido
            )
          ),
          servicio_medico (
            id_servicio_medico,
            fecha_servicio
          )
        `)
          .eq('id_personal_medico', personalData.id_personal_medico)
          .gte('fecha_hora_programada', `${today}T00:00:00`)
          .lt('fecha_hora_programada', `${today}T23:59:59`)
          .order('fecha_hora_programada', { ascending: true });

      if (citasError) {
        console.error('Error obteniendo citas:', citasError);
        throw new Error('Error al cargar las citas médicas');
      }

      console.log('Citas encontradas:', citasData);

      if (citasData && citasData.length > 0) {
        const appointments: TodayAppointment[] = citasData.map((cita: any) => {
          const fechaHora = new Date(cita.fecha_hora_programada);
          const paciente = cita.paciente?.persona;
          const patientName = paciente ?
              `${paciente.prenombres} ${paciente.primer_apellido}` :
              'Paciente no identificado';

          let status: TodayAppointment['status'] = 'pending';
          if (cita.estado === 'Completada' || (cita.servicio_medico && cita.servicio_medico.length > 0)) {
            status = 'completed';
          } else if (cita.estado === 'En Progreso') {
            status = 'in-progress';
          }

          return {
            id: cita.id_cita_medica,
            patient: patientName,
            time: fechaHora.toLocaleTimeString('es-ES', {
              hour: '2-digit',
              minute: '2-digit'
            }),
            status
          };
        });

        setTodayAppointments(appointments);

        // Calcular estadísticas
        const completed = appointments.filter(a => a.status === 'completed').length;
        const inProgress = appointments.filter(a => a.status === 'in-progress').length;
        const pending = appointments.filter(a => a.status === 'pending').length;

        setStats({
          totalToday: appointments.length,
          completed,
          inProgress,
          pending
        });
      } else {
        // No hay citas para hoy
        setTodayAppointments([]);
        setStats({
          totalToday: 0,
          completed: 0,
          inProgress: 0,
          pending: 0
        });
      }

    } catch (error) {
      console.error('Error cargando datos médicos:', error);
      setError(error instanceof Error ? error.message : 'Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedicalData();
  }, [user?.currentProfileId]);

  if (loading) {
    return (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Cargando agenda...</span>
        </div>
    );
  }

  return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Today's Schedule */}
        <div className="col-span-1 md:col-span-2 bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-800">Agenda de Hoy</h2>
            <div className="text-sm text-gray-600">
              {new Date().toLocaleDateString('es-ES', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </div>
          </div>

          {error ? (
              <div className="text-center py-6 text-red-500">
                <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                <p className="text-sm">{error}</p>
                <button
                    onClick={fetchMedicalData}
                    className="mt-2 text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center mx-auto"
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Reintentar
                </button>
              </div>
          ) : todayAppointments.length > 0 ? (
              <div className="space-y-4">
                {todayAppointments.map((appointment) => (
                    <div
                        key={appointment.id}
                        className={`flex items-center justify-between p-4 rounded-md ${
                            appointment.status === 'completed'
                                ? 'bg-green-50 border-l-4 border-green-500'
                                : appointment.status === 'in-progress'
                                    ? 'bg-blue-50 border-l-4 border-blue-500'
                                    : 'bg-gray-50 border-l-4 border-gray-300'
                        }`}
                    >
                      <div className="flex items-center">
                        <div className="mr-4">
                          <div className="text-sm font-medium">{appointment.time}</div>
                        </div>
                        <div>
                          <div className="font-medium">{appointment.patient}</div>
                          <div className="text-sm text-gray-500">
                            {appointment.status === 'completed'
                                ? 'Completada'
                                : appointment.status === 'in-progress'
                                    ? 'En progreso'
                                    : 'Pendiente'}
                          </div>
                        </div>
                      </div>
                    </div>
                ))}
              </div>
          ) : (
              <div className="text-center py-6 text-gray-500">
                <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                <p>No tienes citas programadas para hoy</p>
              </div>
          )}
        </div>

        {/* Quick Actions and Stats */}
        <div className="col-span-1 space-y-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-medium text-gray-800 mb-4">Acciones Rápidas</h2>

            <div className="space-y-3">
              <Link
                  to='/medical-services'
                  className="w-full py-3 px-4 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center justify-center"
              >
                <Stethoscope className="h-5 w-5 mr-2" />
                Registrar Servicio Médico
              </Link>

              <Link
                  to='/medical-records'
                  className="w-full py-3 px-4 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200 transition-colors flex items-center justify-center"
              >
                <FileText className="h-5 w-5 mr-2" />
                Ver Historias Clínicas
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-medium text-gray-800 mb-4">Resumen del Día</h2>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded-md">
                <div className="text-2xl font-bold text-blue-700">{stats.totalToday}</div>
                <div className="text-sm text-blue-700">Citas programadas</div>
              </div>

              <div className="bg-green-50 p-4 rounded-md">
                <div className="text-2xl font-bold text-green-700">{stats.completed}</div>
                <div className="text-sm text-green-700">Completadas</div>
              </div>

              <div className="bg-yellow-50 p-4 rounded-md">
                <div className="text-2xl font-bold text-yellow-700">{stats.inProgress}</div>
                <div className="text-sm text-yellow-700">En progreso</div>
              </div>

              <div className="bg-gray-50 p-4 rounded-md">
                <div className="text-2xl font-bold text-gray-700">{stats.pending}</div>
                <div className="text-sm text-gray-700">Pendientes</div>
              </div>
            </div>
          </div>
        </div>
      </div>
  );
};

export default Dashboard;
