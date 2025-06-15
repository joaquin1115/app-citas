import React, { useState, useEffect } from 'react';
import RegisterFace from './RegisterFace';
import { supabase } from '../lib/supabase'; // Asegúrate de tener el cliente Supabase configurado
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../lib/supabase';

type Props = {
  onClose: () => void;
};

// Opciones de roles disponibles
const ROLE_OPTIONS = [
  { value: 'Paciente', label: 'Paciente' },
  { value: 'Personal Médico', label: 'Personal Médico' },
  { value: 'Asistente Administrativo', label: 'Asistente Administrativo' }
];

// Opciones para campos de selección
const LIFE_STAGE_OPTIONS = [
  { value: 'Infante', label: 'Infante' },
  { value: 'Adolescente', label: 'Adolescente' },
  { value: 'Adulto', label: 'Adulto' },
  { value: 'Adulto Mayor', label: 'Adulto Mayor' }
];

const LEGAL_STATUS_OPTIONS = [
  { value: 'Libre', label: 'Libre' },
  { value: 'Detenido', label: 'Detenido' },
  { value: 'Procesado', label: 'Procesado' },
  { value: 'Sentenciado', label: 'Sentenciado' }
];

const INSURANCE_TYPE_OPTIONS = [
  { value: 'Ninguno', label: 'Ninguno' },
  { value: 'SIS', label: 'SIS' },
  { value: 'EsSalud', label: 'EsSalud' },
  { value: 'Privado', label: 'Privado' },
  { value: 'Otro', label: 'Otro' }
];

const CreateUserModal: React.FC<Props> = ({ onClose }) => {
  // Datos básicos de persona
  const [prenombres, setPrenombres] = useState('');
  const [primerApellido, setPrimerApellido] = useState('');
  const [segundoApellido, setSegundoApellido] = useState('');
  const [dni, setDni] = useState('');
  const [sexo, setSexo] = useState('');
  const [fechaNacimiento, setFechaNacimiento] = useState('');
  const [direccionLegal, setDireccionLegal] = useState('');
  const [correoElectronico, setCorreoElectronico] = useState('');
  const [celularPersonal, setCelularPersonal] = useState('');
  const [celularEmergencia, setCelularEmergencia] = useState('');
  const [tempPassword, setTempPassword] = useState('');

  // Roles y fechas de expiración
  const [selectedRoles, setSelectedRoles] = useState<{
    role: string;
    expiration?: string;
  }[]>([]);

  // Datos específicos por rol
  const [pacienteData, setPacienteData] = useState({
    tipoSeguro: '',
    situacionJuridica: '',
    estaVivo: true,
    etapaVida: ''
  });

  const [personalMedicoData, setPersonalMedicoData] = useState({
    especialidad: '',
    licenciaMedica: '',
    colegiatura: '',
    institucionAsociada: ''
  });

  const [asistenteAdminData, setAsistenteAdminData] = useState({
    cargo: '',
    nivelAcceso: ''
  });

  const [especialidades, setEspecialidades] = useState<any[]>([]);
  const [loadingEspecialidades, setLoadingEspecialidades] = useState(false);

  const [step, setStep] = useState<'form' | 'face'>('form');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userId, setUserId] = useState<string | null>(null);

  // Cargar especialidades al montar el componente
  useEffect(() => {
    const fetchEspecialidades = async () => {
      setLoadingEspecialidades(true);
      try {
        const { data, error } = await supabase
          .from('especialidad')
          .select('id_especialidad, descripcion, area_asignada, nivel_experiencia');
        
        if (error) throw error;
        
        setEspecialidades(data || []);
      } catch (error) {
        console.error('Error cargando especialidades:', error);
      } finally {
        setLoadingEspecialidades(false);
      }
    };

    fetchEspecialidades();
  }, []);

  const generateTempPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
    let password = '';
    for (let i = 0; i < 10; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setTempPassword(password);
    return password;
  };

  const handleRoleChange = (roleValue: string, isChecked: boolean) => {
    setSelectedRoles(prev => {
      if (isChecked) {
        return [...prev, { role: roleValue }];
      } else {
        return prev.filter(r => r.role !== roleValue);
      }
    });
  };

  const handleRoleExpirationChange = (roleValue: string, expiration: string) => {
    setSelectedRoles(prev =>
      prev.map(r => 
        r.role === roleValue ? { ...r, expiration } : r
      )
    );
  };

  const handleContinueToFace = async () => {
    // Validación de campos obligatorios
    if (!prenombres || !primerApellido || !dni || !sexo || !fechaNacimiento || !direccionLegal) {
      setError('Por favor complete todos los campos obligatorios');
      return;
    }

    // Validar datos específicos por rol
    if (selectedRoles.some(r => r.role === 'Personal Médico')) {
      if (!personalMedicoData.especialidad) {
        setError('Debe seleccionar una especialidad para el personal médico');
        return;
      }
      if (!personalMedicoData.colegiatura) {
        setError('La colegiatura es obligatoria para el personal médico');
        return;
      }
    }

    if (selectedRoles.some(r => r.role === 'Paciente') && !pacienteData.etapaVida) {
      setError('Debe seleccionar la etapa de vida para el paciente');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const tempPassword = generateTempPassword();
      
      // Estructurar los datos para enviar al backend
      const userData = {
        persona: {
          prenombres,
          primer_apellido: primerApellido,
          segundo_apellido: segundoApellido,
          dni_idcarnet: dni,
          sexo,
          fecha_nacimiento: fechaNacimiento,
          direccion_legal: direccionLegal,
          correo_electronico: correoElectronico,
          numero_celular_personal: celularPersonal,
          numero_celular_emergencia: celularEmergencia
        },
        roles: selectedRoles,
        paciente: selectedRoles.some(r => r.role === 'Paciente') ? pacienteData : null,
        personal_medico: selectedRoles.some(r => r.role === 'Personal Médico') ? personalMedicoData : null,
        asistente_administrativo: selectedRoles.some(r => r.role === 'Asistente Administrativo') ? asistenteAdminData : null,
        password: tempPassword
      };

      const response = await fetch(`${SUPABASE_URL}/functions/v1/create-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify(userData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al crear usuario');
      }

      setUserId(data.user.id);
      setStep('face');
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFaceSuccess = () => {
    // Mostrar alerta con las credenciales
    alert(`Usuario creado exitosamente!\n\nUsuario: ${correoElectronico || dni}\nContraseña temporal: ${tempPassword}\n\nPor favor, proporcione estas credenciales al usuario.`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-70 flex items-center justify-center p-6">
      {step === 'form' ? (
        <div className="bg-white rounded-lg p-6 w-full max-w-2xl shadow-xl overflow-y-auto max-h-screen">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Nuevo Usuario</h2>

          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-700">Datos Personales</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prenombres*</label>
                <input
                  type="text"
                  value={prenombres}
                  onChange={(e) => setPrenombres(e.target.value)}
                  className="w-full border rounded px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Primer Apellido*</label>
                <input
                  type="text"
                  value={primerApellido}
                  onChange={(e) => setPrimerApellido(e.target.value)}
                  className="w-full border rounded px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Segundo Apellido</label>
                <input
                  type="text"
                  value={segundoApellido}
                  onChange={(e) => setSegundoApellido(e.target.value)}
                  className="w-full border rounded px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">DNI/Carnet*</label>
                <input
                  type="text"
                  value={dni}
                  onChange={(e) => setDni(e.target.value)}
                  className="w-full border rounded px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sexo*</label>
                <select
                  value={sexo}
                  onChange={(e) => setSexo(e.target.value)}
                  className="w-full border rounded px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Seleccione</option>
                  <option value="M">Masculino</option>
                  <option value="F">Femenino</option>
                  <option value="O">Otro</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Nacimiento*</label>
                <input
                  type="date"
                  value={fechaNacimiento}
                  onChange={(e) => setFechaNacimiento(e.target.value)}
                  className="w-full border rounded px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Dirección Legal*</label>
                <input
                  type="text"
                  value={direccionLegal}
                  onChange={(e) => setDireccionLegal(e.target.value)}
                  className="w-full border rounded px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico</label>
                <input
                  type="email"
                  value={correoElectronico}
                  onChange={(e) => setCorreoElectronico(e.target.value)}
                  className="w-full border rounded px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Celular Personal</label>
                <input
                  type="text"
                  value={celularPersonal}
                  onChange={(e) => setCelularPersonal(e.target.value)}
                  className="w-full border rounded px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Celular de Emergencia</label>
                <input
                  type="text"
                  value={celularEmergencia}
                  onChange={(e) => setCelularEmergencia(e.target.value)}
                  className="w-full border rounded px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <h3 className="text-lg font-medium text-gray-700 mt-6">Roles y Permisos</h3>
            <div className="space-y-4">
              {ROLE_OPTIONS.map((role) => (
                <div key={role.value} className="border rounded p-4">
                  <div className="flex items-center mb-2">
                    <input
                      type="checkbox"
                      id={`role-${role.value}`}
                      checked={selectedRoles.some(r => r.role === role.value)}
                      onChange={(e) => handleRoleChange(role.value, e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor={`role-${role.value}`} className="ml-2 block text-sm font-medium text-gray-700">
                      {role.label}
                    </label>
                  </div>
                  
                  {selectedRoles.some(r => r.role === role.value) && (
                    <div className="ml-6 space-y-3">
                      <div className="flex items-center">
                        <label className="block text-sm text-gray-700 mr-2">Fecha de expiración (opcional):</label>
                        <input
                          type="date"
                          value={selectedRoles.find(r => r.role === role.value)?.expiration || ''}
                          onChange={(e) => handleRoleExpirationChange(role.value, e.target.value)}
                          className="border rounded px-2 py-1 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      {role.value === 'Paciente' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm text-gray-700 mb-1">Tipo de Seguro</label>
                            <select
                              value={pacienteData.tipoSeguro}
                              onChange={(e) => setPacienteData({...pacienteData, tipoSeguro: e.target.value})}
                              className="w-full border rounded px-2 py-1 focus:ring-blue-500 focus:border-blue-500"
                            >
                              {INSURANCE_TYPE_OPTIONS.map(option => (
                                <option key={option.value} value={option.value}>{option.label}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm text-gray-700 mb-1">Situación Jurídica</label>
                            <select
                              value={pacienteData.situacionJuridica}
                              onChange={(e) => setPacienteData({...pacienteData, situacionJuridica: e.target.value})}
                              className="w-full border rounded px-2 py-1 focus:ring-blue-500 focus:border-blue-500"
                            >
                              {LEGAL_STATUS_OPTIONS.map(option => (
                                <option key={option.value} value={option.value}>{option.label}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm text-gray-700 mb-1">Etapa de Vida*</label>
                            <select
                              value={pacienteData.etapaVida}
                              onChange={(e) => setPacienteData({...pacienteData, etapaVida: e.target.value})}
                              className="w-full border rounded px-2 py-1 focus:ring-blue-500 focus:border-blue-500"
                              required
                            >
                              {LIFE_STAGE_OPTIONS.map(option => (
                                <option key={option.value} value={option.value}>{option.label}</option>
                              ))}
                            </select>
                          </div>
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              id="estaVivo"
                              checked={pacienteData.estaVivo}
                              onChange={(e) => setPacienteData({...pacienteData, estaVivo: e.target.checked})}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <label htmlFor="estaVivo" className="ml-2 block text-sm text-gray-700">
                              ¿Está vivo?
                            </label>
                          </div>
                        </div>
                      )}

                      {role.value === 'Personal Médico' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm text-gray-700 mb-1">Especialidad*</label>
                            <select
                              value={personalMedicoData.especialidad}
                              onChange={(e) => setPersonalMedicoData({...personalMedicoData, especialidad: e.target.value})}
                              className="w-full border rounded px-2 py-1 focus:ring-blue-500 focus:border-blue-500"
                              required
                              disabled={loadingEspecialidades}
                            >
                              <option value="">Seleccione una especialidad</option>
                              {especialidades.map(especialidad => (
                                <option key={especialidad.id_especialidad} value={especialidad.id_especialidad}>
                                  {especialidad.descripcion} ({especialidad.area_asignada})
                                </option>
                              ))}
                            </select>
                            {loadingEspecialidades && (
                              <p className="text-xs text-gray-500">Cargando especialidades...</p>
                            )}
                          </div>
                          <div>
                            <label className="block text-sm text-gray-700 mb-1">Licencia Médica</label>
                            <input
                              type="text"
                              value={personalMedicoData.licenciaMedica}
                              onChange={(e) => setPersonalMedicoData({...personalMedicoData, licenciaMedica: e.target.value})}
                              className="w-full border rounded px-2 py-1 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm text-gray-700 mb-1">Colegiatura*</label>
                            <input
                              type="text"
                              value={personalMedicoData.colegiatura}
                              onChange={(e) => setPersonalMedicoData({...personalMedicoData, colegiatura: e.target.value})}
                              className="w-full border rounded px-2 py-1 focus:ring-blue-500 focus:border-blue-500"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm text-gray-700 mb-1">Institución Asociada</label>
                            <input
                              type="text"
                              value={personalMedicoData.institucionAsociada}
                              onChange={(e) => setPersonalMedicoData({...personalMedicoData, institucionAsociada: e.target.value})}
                              className="w-full border rounded px-2 py-1 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                        </div>
                      )}

                      {role.value === 'Asistente Administrativo' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm text-gray-700 mb-1">Cargo</label>
                            <input
                              type="text"
                              value={asistenteAdminData.cargo}
                              onChange={(e) => setAsistenteAdminData({...asistenteAdminData, cargo: e.target.value})}
                              className="w-full border rounded px-2 py-1 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm text-gray-700 mb-1">Nivel de Acceso</label>
                            <input
                              type="text"
                              value={asistenteAdminData.nivelAcceso}
                              onChange={(e) => setAsistenteAdminData({...asistenteAdminData, nivelAcceso: e.target.value})}
                              className="w-full border rounded px-2 py-1 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-2 mt-6">
            <button
              onClick={onClose}
              disabled={loading}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleContinueToFace}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded disabled:opacity-50 flex items-center"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Procesando...
                </>
              ) : (
                'Continuar con rostro'
              )}
            </button>
          </div>
        </div>
      )  : (
        <div className="bg-white rounded-lg p-6 w-full max-w-2xl shadow-xl overflow-y-auto max-h-screen">
          {/* Sección de credenciales temporales */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="font-medium text-blue-800 mb-2">Credenciales temporales del usuario</h3>
            <p className="text-sm text-gray-700 mb-1">
              <span className="font-medium">Usuario:</span> {correoElectronico || dni}
            </p>
            <p className="text-sm text-gray-700">
              <span className="font-medium">Contraseña temporal:</span> 
              <span className="ml-2 font-mono bg-yellow-100 px-2 py-1 rounded">{tempPassword}</span>
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Esta contraseña es provisional. El usuario deberá cambiarla en su primer inicio de sesión.
            </p>
          </div>
  
          {/* Componente de registro facial */}
          <RegisterFace 
            userId={userId}
            username={correoElectronico || dni} 
            onSuccess={handleFaceSuccess} 
            onCancel={() => {
              setStep('form');
              onClose();
            }} 
          />
        </div>
      )}
    </div>
  )};

  export default CreateUserModal;