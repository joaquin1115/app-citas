import React, { useEffect, useState } from "react";
import { useUser } from "../contexts/UserContext";
import { supabase } from "../lib/supabase";
import {
  Calendar,
  Clock,
  FileText,
  ChevronRight,
  Plus,
  X,
  Save,
  Stethoscope,
  Heart,
  Activity,
  Brain,
  Thermometer,
  Clipboard,
  FileCheck,
  Pill,
  Syringe,
  Bed,
  Scissors,
  CheckCircle,
  AlertCircle,
  User,
  FileSearch,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ServiciosMedicos } from "../api/modules/servicios_medicos";
import { Cie10 } from "../api/tables/types";
import { Cie10Table } from "../api/tables/cie10";
import { CitaMedicaTable } from "../api/tables/cita_medica";
import { TipoServicioTable } from "../api/tables/tipo_servicio";
import { SubtipoServicioTable } from "../api/tables/subtipo_servicio";
import { UnidadTiempoTable } from "../api/tables/unidad_tiempo";
import { MedicamentoTable } from "../api/tables/medicamento";
import { PersonalMedicoTable } from "../api/tables/personal_medico";

interface MedicalAttention {
  id: string;
  type: "triage" | "exam" | "diagnosis" | "hospitalization" | "treatment";
  date: string;
  details: Record<string, any>;
  doctor: string;
}

interface MedicalOrder {
  id: string;
  type: "exam" | "surgery" | "therapy" | "consultation";
  date: string;
  description: string;
  status: "pending" | "completed";
  details?: Record<string, any>;
}

interface Appointment {
  id: string;
  patientName: string;
  patientId: string;
  date: string;
  time: string;
  status: "pending" | "in-progress" | "completed";
  reason: string;
}

const MedicalServices: React.FC = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  const [selectedAppointment, setSelectedAppointment] = useState<string | null>(
    null
  );
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [orderType, setOrderType] = useState<
    "exam" | "surgery" | "therapy" | "consultation" | null
  >(null);
  const [showAttentionForm, setShowAttentionForm] = useState(false);
  const [attentionType, setAttentionType] = useState<
    "triage" | "exam" | "diagnosis" | "hospitalization" | "treatment" | null
  >(null);
  const [treatmentType, setTreatmentType] = useState<
    "medication" | "therapy" | "surgery" | null
  >(null);
  const [attentions, setAttentions] = useState<MedicalAttention[]>([]);
  const [orders, setOrders] = useState<MedicalOrder[]>([]);
  const [isAttentionCompleted, setIsAttentionCompleted] = useState(false);

  const [diseases, setDiseases] = useState<Cie10[]>([]);

  const orderTypeMap: Record<string, number> = {
    consultation: 1,
    exam: 2,
    therapy: 3,
    surgery: 4,
  };

  const [servicesType, setServicesType] = useState({
    consultation: {
      info: {},
      subtipos: [],
      form: {
        motivo: "",
        observaciones: "",
        cantidad: 1,
        estado: "Agendada",
        id_subtipo_servicio: 0,
      },
    },
    exam: {
      info: {},
      subtipos: [],
      form: {
        motivo: "",
        observaciones: "",
        cantidad: 1,
        estado: "Agendada",
        id_subtipo_servicio: 0,
      },
    },
    therapy: {
      info: {},
      subtipos: [],
      form: {
        motivo: "",
        observaciones: "",
        cantidad: 1,
        estado: "Agendada",
        id_subtipo_servicio: 0,
      },
    },
    surgery: {
      info: {},
      subtipos: [],
      form: {
        motivo: "",
        observaciones: "",
        cantidad: 1,
        estado: "Agendada",
        id_subtipo_servicio: 0,
      },
    },
  });

  // Estados para formularios
  const [vitalSigns, setVitalSigns] = useState({
    heartRate: "",
    bloodPressure: {
      systolic: "",
      diastolic: "",
    },
    oxygenSaturation: "",
    estadoPaciente: "",
    observaciones: "",
  });

  const [examData, setExamData] = useState({
    descripcion_procedimiento: "",
    fecha_hora_atencion: new Date().toISOString().slice(0, 16), // formato yyyy-MM-ddTHH:mm
    descripcion: "",
    tipo_procedimiento: "",
    tipo_laboratorio: "",
    resultado: "",
  });

  const [cie10Options, setCie10Options] = useState<Cie10[]>([]);
  const [newSymptom, setNewSymptom] = useState({
    nombre_sintoma: "",
    fecha_primera_manifestacion: "",
    descripcion: "",
    severidad: 1,
    estado_actual: "",
  });
  const [diagnosisData, setDiagnosisData] = useState({
    cie10: {
      codigo: "", // El usuario elige esto del listado (lookup)
      descripcion: "", // Se rellena automáticamente al seleccionar código
    },
    morbilidad: {
      id_cie10: 1, // Se vincula con el ID real del código seleccionado
      tipo: "", // Requiere input (ej. "Aguda", "Crónica", etc.)
      descripcion: "", // Opcional
      fecha_identificacion: "", // YYYY-MM-DD
      nivel_gravedad: "", // Opcional
      contagiosa: false, // Opcional
    },
    diagnostico: {
      id_morbilidad: 0, // Se completa luego de insertar la morbilidad
      id_servicio_medico: 0, // Se completa después de insertar el servicio
      detalle: "", // Observaciones
    },
    sintomas: [], // Cada ítem será un objeto tipo Sintoma
  });

  // {
  //   id_medicamento: 0,
  //   motivo: "",
  //   cantidad_dosis: 0,
  //   frecuencia: "",
  // }
  const [medicamentosOpciones, setMedicamentosOpciones] = useState([]);
  const [unidadTiemposOpciones, setUnidadTiemposOpciones] = useState([]);
  const [nuevoMedicamento, setNuevoMedicamento] = useState({
    id_medicamento: 1,
    motivo: "",
    cantidad_dosis: 1,
    frecuencia: "",
  });

  const [tratamientoData, setTratamientoData] = useState({
    medication: {
      razon: "",
      duracion_cantidad: 0,
      id_unid_tiempo: 1,
      observaciones: "",
      medicamentos: [] as {
        id_medicamento: number;
        motivo: string;
        cantidad_dosis: number;
        frecuencia: string;
      }[],
    },
    therapy: {
      descripcion: "",
      observaciones: "",
      resultados: "",
    },
    surgery: {
      procedimiento_quirurgico: "",
      tipo_anestesia: "",
      observaciones: "",
    },
  });

  useEffect(() => {
    async function fetchCie10() {
      const data = await new Cie10Table().get();
      if (Array.isArray(data)) setCie10Options(data);
    }
    async function fetchMedicamentos() {
      const data = await new MedicamentoTable().get();
      if (Array.isArray(data)) setMedicamentosOpciones(data);
    }
    async function fetchUnidadTiempos() {
      const data = await new UnidadTiempoTable().get();
      if (Array.isArray(data)) setUnidadTiemposOpciones(data);
    }

    fetchMedicamentos();
    fetchUnidadTiempos();

    fetchCie10();
  }, []);

  const handleSelectCie10 = (codigo: string) => {
    setDiagnosisData((prev) => ({
      ...prev,
      morbilidad: { ...prev.morbilidad, id_cie10: Number(codigo) },
    }));
  };

  const handleAddSymptom = () => {
    setDiagnosisData((prev) => ({
      ...prev,
      sintomas: [...prev.sintomas, { ...newSymptom, id_diagnostico: 0 }],
    }));
    setNewSymptom({
      nombre_sintoma: "",
      fecha_primera_manifestacion: "",
      descripcion: "",
      severidad: 1,
      estado_actual: "",
    });
  };

  const handleRemoveSymptom = (index: number) => {
    setDiagnosisData((prev) => ({
      ...prev,
      sintomas: prev.sintomas.filter((_, i) => i !== index),
    }));
  };

  const [hospitalizationData, setHospitalizationData] = useState({
    reason: "",
    service: "",
    responsibleDoctor: "",
    bedNumber: "",
    initialObservations: "",
  });

  const [treatmentData, setTreatmentData] = useState({
    medication: {
      name: "",
      dosage: "",
      frequency: "",
      duration: "",
      instructions: "",
    },
    therapy: {
      type: "",
      sessions: "",
      goals: "",
    },
    surgery: {
      type: "",
      specialty: "",
      urgency: "programada",
      procedure: "",
      preOpInstructions: "",
    },
  });

  if (!user) return null;

  // Datos de ejemplo
  // const appointments: Appointment[] = [
  //   {
  //     id: "1",
  //     patientName: "Carlos Sánchez",
  //     patientId: "1",
  //     date: "2025-06-15",
  //     time: "09:00",
  //     status: "Pendiente",
  //     reason: "Control mensual",
  //   },
  //   {
  //     id: "2",
  //     patientName: "Ana García",
  //     patientId: "2",
  //     date: "2025-06-15",
  //     time: "10:30",
  //     status: "Pendiente",
  //     reason: "Dolor de espalda",
  //   },
  // ];
  const [appointments, setAppointments] = useState([]);
  // const appointments: Appointment[] = []

  const fetchTipoServicio = async (id: number, key: string) => {
    const tipoServicioTable = new TipoServicioTable();
    try {
      const tipoServicio = await tipoServicioTable.get(id);
      const { id_tipo_servicio } = tipoServicio;
      const subtipos = await tipoServicioTable.getSubTipos(id_tipo_servicio);
      setServicesType((prev) => ({
        ...prev,
        [key]: {
          info: tipoServicio,
          subtipos: subtipos,
          form: {
            ...prev[key].form,
            id_subtipo_servicio: subtipos[0].id_subtipo_servicio,
          },
        },
      }));
    } catch (error) {
      console.error("Error al cargar tipo de servicio:", error);
    }
  };

  const fetchAppointments = async () => {
    const citaTable = new CitaMedicaTable();

    const { currentProfileId: id_persona } = user;
    const { id_personal_medico } =
      await new PersonalMedicoTable().getByPersonaId(Number(id_persona));

    console.log("ID personal medico:", id_personal_medico);

    try {
      const citas = await citaTable.getAppointments(id_personal_medico);
      console.log(citas);
      setAppointments(citas);
    } catch (error) {
      console.error("Error al cargar citas médicas:", error);
    }
  };

  useEffect(() => {
    for (const [key, value] of Object.entries(orderTypeMap)) {
      fetchTipoServicio(value, key);
    }

    fetchAppointments();
  }, []);

  const medicalServices = [
    { value: "laboratory", label: "Laboratorio Clínico" },
    { value: "radiology", label: "Radiología" },
    { value: "ultrasound", label: "Ecografía" },
    { value: "cardiology", label: "Cardiología" },
  ];

  const specialties = [
    { value: "general", label: "Medicina General" },
    { value: "cardiology", label: "Cardiología" },
    { value: "neurology", label: "Neurología" },
    { value: "orthopedics", label: "Traumatología" },
  ];

  const updateServiciosMedicos = async (appointmentId: string) => {
    const newServices = await ServiciosMedicos.obtenerAtencionesRegistradas(
      Number(appointmentId)
    );
    const newOrders = await ServiciosMedicos.obtenerOrdenesGeneradas(
      Number(appointmentId)
    );

    console.log("Obteniendo nuevos servicios médicos...", newServices);

    setAttentions(newServices);
    setOrders([...newOrders]);
  };

  // Handlers
  const handleStartAppointment = async (appointmentId: string) => {
    setSelectedAppointment(appointmentId);
    const newServices = await ServiciosMedicos.obtenerAtencionesRegistradas(
      Number(appointmentId)
    );
    const newOrders = await ServiciosMedicos.obtenerOrdenesGeneradas(
      Number(appointmentId)
    );

    console.log(newOrders);

    setIsAttentionCompleted(false);
    setAttentions([...attentions, ...newServices]);
    setOrders([...orders, ...newOrders]);
  };

  const [updateServicios, setUpdateServicios] = useState(0);

  const handleSaveAttention = async () => {
    if (!attentionType) return;

    const now = new Date().toLocaleString();
    const doctorName = `${user.firstName} ${user.lastName}`;
    let result: any = null;

    let attentionDetails: Record<string, any> = {};

    switch (attentionType) {
      case "triage":
        attentionDetails = { ...vitalSigns };

        {
          const today = new Date();
          const pad = (n: number) => n.toString().padStart(2, "0");
          // Hora de inicio
          const horaInicio = `${pad(today.getHours())}:${pad(
            today.getMinutes()
          )}:${pad(today.getSeconds())}`;
          // Crear nueva fecha +1 hora
          const fin = new Date(today.getTime() + 60 * 60 * 1000);
          const horaFin = `${pad(fin.getHours())}:${pad(
            fin.getMinutes()
          )}:${pad(fin.getSeconds())}`;

          const servicioData = {
            id_cita_medica: Number(selectedAppointment),
            fecha_servicio: today.toISOString().split("T")[0],
            hora_inicio_servicio: horaInicio,
            hora_fin_servicio: horaFin,
          };

          const triajeData = {
            pulso_cardiaco: attentionDetails.heartRate,
            presion_diastolica: attentionDetails.bloodPressure.diastolic,
            presion_sistolica: attentionDetails.bloodPressure.systolic,
            oxigenacion: attentionDetails.oxygenSaturation,
            estado_paciente: attentionDetails.estadoPaciente,
            observaciones: attentionDetails.observaciones,
          };

          const { success } = await ServiciosMedicos.registrarTriaje(
            servicioData,
            triajeData
          );
          setUpdateServicios(success + updateServicios);
        }

        break;
      case "exam":
        attentionDetails = { ...examData };

        {
          const today = new Date();
          const pad = (n: number) => n.toString().padStart(2, "0");
          // Hora de inicio
          const horaInicio = `${pad(today.getHours())}:${pad(
            today.getMinutes()
          )}:${pad(today.getSeconds())}`;
          // Crear nueva fecha +1 hora
          const fin = new Date(today.getTime() + 60 * 60 * 1000);
          const horaFin = `${pad(fin.getHours())}:${pad(
            fin.getMinutes()
          )}:${pad(fin.getSeconds())}`;

          const servicioData = {
            id_cita_medica: Number(selectedAppointment),
            fecha_servicio: today.toISOString().split("T")[0],
            hora_inicio_servicio: horaInicio,
            hora_fin_servicio: horaFin,
          };

          const { success } = await ServiciosMedicos.registrarExamen(
            servicioData,
            examData
          );
          setUpdateServicios(success + updateServicios);
        }

        break;
      case "diagnosis":
        {
          const today = new Date();
          const pad = (n: number) => n.toString().padStart(2, "0");
          // Hora de inicio
          const horaInicio = `${pad(today.getHours())}:${pad(
            today.getMinutes()
          )}:${pad(today.getSeconds())}`;
          // Crear nueva fecha +1 hora
          const fin = new Date(today.getTime() + 60 * 60 * 1000);
          const horaFin = `${pad(fin.getHours())}:${pad(
            fin.getMinutes()
          )}:${pad(fin.getSeconds())}`;

          const servicioData = {
            id_cita_medica: Number(selectedAppointment),
            fecha_servicio: today.toISOString().split("T")[0],
            hora_inicio_servicio: horaInicio,
            hora_fin_servicio: horaFin,
          };

          const diagnosticoData = {
            diagnostico: diagnosisData.diagnostico,
            morbilidad: diagnosisData.morbilidad,
            cie10: diagnosisData.cie10,
            sintomas: diagnosisData.sintomas,
          };

          const { success } = await ServiciosMedicos.registrarDiagnostico(
            servicioData,
            diagnosticoData
          );

          setUpdateServicios(success + updateServicios);
        }

        break;
      case "hospitalization":
        attentionDetails = { ...hospitalizationData };
        break;
      case "treatment":
        attentionDetails = { type: treatmentType, ...treatmentData };

        if (treatmentType === "medication") {
          const today = new Date();
          const pad = (n: number) => n.toString().padStart(2, "0");
          // Hora de inicio
          const horaInicio = `${pad(today.getHours())}:${pad(
            today.getMinutes()
          )}:${pad(today.getSeconds())}`;
          // Crear nueva fecha +1 hora
          const fin = new Date(today.getTime() + 60 * 60 * 1000);
          const horaFin = `${pad(fin.getHours())}:${pad(
            fin.getMinutes()
          )}:${pad(fin.getSeconds())}`;

          const servicioData = {
            id_cita_medica: Number(selectedAppointment),
            fecha_servicio: today.toISOString().split("T")[0],
            hora_inicio_servicio: horaInicio,
            hora_fin_servicio: horaFin,
          };

          const { success } =
            await ServiciosMedicos.registrarTratamientoMedicamentos(
              servicioData,
              {
                tratamiento: {
                  id_unid_tiempo: Number(
                    tratamientoData.medication.id_unid_tiempo
                  ),
                  duracion_cantidad:
                    tratamientoData.medication.duracion_cantidad,
                  observaciones: tratamientoData.medication.observaciones,
                  razon: tratamientoData.medication.razon,
                },
                medicamentos: tratamientoData.medication.medicamentos,
              }
            );
          setUpdateServicios(success + updateServicios);
        }

        if (treatmentType === "therapy") {
          const today = new Date();
          const pad = (n: number) => n.toString().padStart(2, "0");
          // Hora de inicio
          const horaInicio = `${pad(today.getHours())}:${pad(
            today.getMinutes()
          )}:${pad(today.getSeconds())}`;
          // Crear nueva fecha +1 hora
          const fin = new Date(today.getTime() + 60 * 60 * 1000);
          const horaFin = `${pad(fin.getHours())}:${pad(
            fin.getMinutes()
          )}:${pad(fin.getSeconds())}`;

          const servicioData = {
            id_cita_medica: Number(selectedAppointment),
            fecha_servicio: today.toISOString().split("T")[0],
            hora_inicio_servicio: horaInicio,
            hora_fin_servicio: horaFin,
          };

          const { success } = await ServiciosMedicos.registrarTerapia(
            servicioData,
            tratamientoData.therapy
          );
          setUpdateServicios(success + updateServicios);
        }

        if (treatmentType === "surgery") {
          const today = new Date();
          const pad = (n: number) => n.toString().padStart(2, "0");
          // Hora de inicio
          const horaInicio = `${pad(today.getHours())}:${pad(
            today.getMinutes()
          )}:${pad(today.getSeconds())}`;
          // Crear nueva fecha +1 hora
          const fin = new Date(today.getTime() + 60 * 60 * 1000);
          const horaFin = `${pad(fin.getHours())}:${pad(
            fin.getMinutes()
          )}:${pad(fin.getSeconds())}`;

          const servicioData = {
            id_cita_medica: Number(selectedAppointment),
            fecha_servicio: today.toISOString().split("T")[0],
            hora_inicio_servicio: horaInicio,
            hora_fin_servicio: horaFin,
          };

          const { success } =
            await ServiciosMedicos.registrarIntervencionQuirurgica(
              servicioData,
              tratamientoData.surgery
            );

          setUpdateServicios(success + updateServicios);
        }

        break;
    }

    setShowAttentionForm(false);
    setAttentionType(null);
    setTreatmentType(null);
  };

  useEffect(() => {
    updateServiciosMedicos(selectedAppointment as string);
  }, [updateServicios]);

  const handleDeleteAttention = async (
    id_servicio_medico: number,
    type: "triage" | "exam" | "diagnosis" | "treatment",
    subType: string | null
  ) => {
    if (type === "triage") {
      const { success } = await ServiciosMedicos.eliminarTriaje(
        id_servicio_medico
      );
      setUpdateServicios(success + updateServicios);
    } else if (type === "exam") {
      const { success } = await ServiciosMedicos.eliminarExamen(
        id_servicio_medico
      );
      setUpdateServicios(success + updateServicios);
    } else if (type === "diagnosis") {
      const { success } = await ServiciosMedicos.eliminarDiagnostico(
        id_servicio_medico
      );
      setUpdateServicios(success + updateServicios);
    } else if (type === "treatment") {
      if (subType === "therapy") {
        const { success } = await ServiciosMedicos.eliminarTerapia(
          id_servicio_medico
        );
        setUpdateServicios(success + updateServicios);
      } else if (subType === "surgery") {
        const { success } =
          await ServiciosMedicos.eliminarIntervencionQuirurgica(
            id_servicio_medico
          );
        setUpdateServicios(success + updateServicios);
      } else if (subType === "medication") {
        const { success } =
          await ServiciosMedicos.eliminarTratamientoMedicamentos(
            id_servicio_medico
          );
        setUpdateServicios(success + updateServicios);
      }
    }

    console.log("Eliminando atención:", id_servicio_medico, type);
  };

  const handleDeleteOrder = async (
    id_servicio_medico: number,
    type: "exam" | "surgery" | "therapy" | "consultation"
  ) => {
    const { success } = await ServiciosMedicos.eliminarOrden(
      id_servicio_medico
    );
    setUpdateServicios(success + updateServicios);
    console.log("Eliminando orden:", id_servicio_medico, type);
  };

  const handleCreateOrder = async () => {
    if (!orderType) return;

    const now = new Date().toLocaleString();
    const orderDetails: Record<string, any> = {};

    // Aquí podrías agregar detalles específicos para cada tipo de orden

    const newOrder: MedicalOrder = {
      id: `ord-${Date.now()}`,
      type: orderType,
      date: now,
      description: `Orden de ${orderType}`,
      status: "pending",
      details: orderDetails,
    };

    const today = new Date();
    const pad = (n: number) => n.toString().padStart(2, "0");
    // Hora de inicio
    const horaInicio = `${pad(today.getHours())}:${pad(
      today.getMinutes()
    )}:${pad(today.getSeconds())}`;
    // Crear nueva fecha +1 hora
    const fin = new Date(today.getTime() + 60 * 60 * 1000);
    const horaFin = `${pad(fin.getHours())}:${pad(fin.getMinutes())}:${pad(
      fin.getSeconds()
    )}`;

    const servicioData = {
      id_cita_medica: Number(selectedAppointment),
      fecha_servicio: today.toISOString().split("T")[0],
      hora_inicio_servicio: horaInicio,
      hora_fin_servicio: horaFin,
    };

    const { success } = await ServiciosMedicos.registrarOrden(
      servicioData,
      servicesType[orderType].form
    );

    setUpdateServicios(success + updateServicios);

    setShowOrderForm(false);
    setOrderType(null);
  };

  const handleCompleteAttention = () => {
    setIsAttentionCompleted(true);
    // Aquí iría la lógica para guardar todo en el backend
  };

  const handleViewMedicalRecord = () => {
    const patientId = appointments.find(
      (a) => a.id === selectedAppointment
    )?.patientId;
    if (patientId) {
      navigate(
        `/medical-records?patientId=${patientId}&fromAppointment=${selectedAppointment}`
      );
    }
  };

  // const handleAddSymptom = () => {
  //   if (diagnosisData.newSymptom.trim()) {
  //     setDiagnosisData({
  //       ...diagnosisData,
  //       symptoms: [...diagnosisData.symptoms, diagnosisData.newSymptom.trim()],
  //       newSymptom: "",
  //     });
  //   }
  // };

  const handleToggleDisease = (code: string) => {
    setDiagnosisData({
      ...diagnosisData,
      selectedDiseases: diagnosisData.selectedDiseases.includes(code)
        ? diagnosisData.selectedDiseases.filter((c) => c !== code)
        : [...diagnosisData.selectedDiseases, code],
    });
  };

  const currentAppointment = selectedAppointment
    ? appointments.find((a) => a.id === selectedAppointment)
    : null;

  // Render functions
  const renderAttentionForm = () => {
    switch (attentionType) {
      case "triage":
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-medium text-gray-800">
                Registro de Triaje
              </h3>
              <button
                onClick={() => setAttentionType(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Presión Arterial */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Presión Arterial (mmHg)
                </label>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    value={vitalSigns.bloodPressure.systolic}
                    onChange={(e) =>
                      setVitalSigns({
                        ...vitalSigns,
                        bloodPressure: {
                          ...vitalSigns.bloodPressure,
                          systolic: e.target.value,
                        },
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="120"
                  />
                  <span className="flex items-center">/</span>
                  <input
                    type="number"
                    value={vitalSigns.bloodPressure.diastolic}
                    onChange={(e) =>
                      setVitalSigns({
                        ...vitalSigns,
                        bloodPressure: {
                          ...vitalSigns.bloodPressure,
                          diastolic: e.target.value,
                        },
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="80"
                  />
                </div>
              </div>

              {/* Frecuencia Cardíaca */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Frecuencia Cardíaca (lpm)
                </label>
                <input
                  type="number"
                  value={vitalSigns.heartRate}
                  onChange={(e) =>
                    setVitalSigns({ ...vitalSigns, heartRate: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="75"
                />
              </div>

              {/* Saturación de Oxígeno */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Saturación O₂ (%)
                </label>
                <input
                  type="number"
                  value={vitalSigns.oxygenSaturation}
                  onChange={(e) =>
                    setVitalSigns({
                      ...vitalSigns,
                      oxygenSaturation: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="98"
                />
              </div>

              {/* Estado del paciente */}
              <div className="md:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estado del Paciente
                </label>
                <input
                  type="text"
                  value={vitalSigns.estadoPaciente}
                  onChange={(e) =>
                    setVitalSigns({
                      ...vitalSigns,
                      estadoPaciente: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Estable, crítico, etc."
                />
              </div>

              {/* Observaciones */}
              <div className="md:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Observaciones
                </label>
                <textarea
                  value={vitalSigns.observaciones}
                  onChange={(e) =>
                    setVitalSigns({
                      ...vitalSigns,
                      observaciones: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Notas adicionales..."
                />
              </div>
            </div>
          </div>
        );
      case "exam":
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-medium text-gray-800">
                Registro de Examen
              </h3>
              <button
                onClick={() => setAttentionType(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Descripción del procedimiento */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción del Procedimiento
                </label>
                <input
                  type="text"
                  value={examData.descripcion_procedimiento}
                  onChange={(e) =>
                    setExamData({
                      ...examData,
                      descripcion_procedimiento: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ej. Hemograma completo"
                />
              </div>

              {/* Fecha y Hora de Atención */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha y Hora de Atención
                </label>
                <input
                  type="datetime-local"
                  value={examData.fecha_hora_atencion}
                  onChange={(e) =>
                    setExamData({
                      ...examData,
                      fecha_hora_atencion: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Tipo de Procedimiento */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Procedimiento
                </label>
                <input
                  type="text"
                  value={examData.tipo_procedimiento}
                  onChange={(e) =>
                    setExamData({
                      ...examData,
                      tipo_procedimiento: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ej. Laboratorio, imagenología"
                />
              </div>

              {/* Tipo de Laboratorio */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Laboratorio
                </label>
                <input
                  type="text"
                  value={examData.tipo_laboratorio}
                  onChange={(e) =>
                    setExamData({
                      ...examData,
                      tipo_laboratorio: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ej. Bioquímica, hematología"
                />
              </div>

              {/* Descripción */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción
                </label>
                <input
                  type="text"
                  value={examData.descripcion}
                  onChange={(e) =>
                    setExamData({ ...examData, descripcion: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Detalles adicionales del examen"
                />
              </div>

              {/* Resultado */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Resultado
                </label>
                <textarea
                  value={examData.resultado}
                  onChange={(e) =>
                    setExamData({ ...examData, resultado: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Resultado del examen"
                />
              </div>
            </div>
          </div>
        );

      case "diagnosis":
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-medium text-gray-800">
                Registro de Diagnóstico
              </h3>
              <button
                onClick={() => setAttentionType(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Código CIE-10
              </label>
              <select
                value={diagnosisData.morbilidad.id_cie10}
                onChange={(e) => handleSelectCie10(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                {cie10Options.map((d) => (
                  <option key={d.id_cie10} value={d.id_cie10}>
                    {d.codigo} - {d.descripcion}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo
                </label>
                <input
                  type="text"
                  value={diagnosisData.morbilidad.tipo}
                  onChange={(e) =>
                    setDiagnosisData((prev) => ({
                      ...prev,
                      morbilidad: { ...prev.morbilidad, tipo: e.target.value },
                    }))
                  }
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha Identificación
                </label>
                <input
                  type="date"
                  value={diagnosisData.morbilidad.fecha_identificacion}
                  onChange={(e) =>
                    setDiagnosisData((prev) => ({
                      ...prev,
                      morbilidad: {
                        ...prev.morbilidad,
                        fecha_identificacion: e.target.value,
                      },
                    }))
                  }
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nivel de Gravedad
                </label>
                <input
                  type="text"
                  value={diagnosisData.morbilidad.nivel_gravedad}
                  onChange={(e) =>
                    setDiagnosisData((prev) => ({
                      ...prev,
                      morbilidad: {
                        ...prev.morbilidad,
                        nivel_gravedad: e.target.value,
                      },
                    }))
                  }
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>

              <div className="flex items-center mt-6">
                <input
                  type="checkbox"
                  checked={diagnosisData.morbilidad.contagiosa}
                  onChange={(e) =>
                    setDiagnosisData((prev) => ({
                      ...prev,
                      morbilidad: {
                        ...prev.morbilidad,
                        contagiosa: e.target.checked,
                      },
                    }))
                  }
                  className="mr-2"
                />
                <label className="text-sm">¿Es contagiosa?</label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción
              </label>
              <textarea
                value={diagnosisData.morbilidad.descripcion}
                onChange={(e) =>
                  setDiagnosisData((prev) => ({
                    ...prev,
                    morbilidad: {
                      ...prev.morbilidad,
                      descripcion: e.target.value,
                    },
                  }))
                }
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Detalles del diagnóstico
              </label>
              <textarea
                value={diagnosisData.diagnostico.detalle}
                onChange={(e) =>
                  setDiagnosisData((prev) => ({
                    ...prev,
                    diagnostico: {
                      ...prev.diagnostico,
                      detalle: e.target.value,
                    },
                  }))
                }
                className="w-full px-3 py-2 border rounded-md"
                placeholder="Ingrese los detalles clínicos del diagnóstico..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Síntomas
              </label>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Nombre del síntoma"
                    value={newSymptom.nombre_sintoma}
                    onChange={(e) =>
                      setNewSymptom({
                        ...newSymptom,
                        nombre_sintoma: e.target.value,
                      })
                    }
                    className="px-3 py-2 border rounded-md"
                  />

                  <input
                    type="date"
                    value={newSymptom.fecha_primera_manifestacion}
                    onChange={(e) =>
                      setNewSymptom({
                        ...newSymptom,
                        fecha_primera_manifestacion: e.target.value,
                      })
                    }
                    className="px-3 py-2 border rounded-md"
                  />

                  <input
                    type="number"
                    placeholder="Severidad (1-10)"
                    value={newSymptom.severidad}
                    onChange={(e) =>
                      setNewSymptom({
                        ...newSymptom,
                        severidad: parseInt(e.target.value),
                      })
                    }
                    className="px-3 py-2 border rounded-md"
                  />

                  <input
                    type="text"
                    placeholder="Estado actual (ej. Activo, Resuelto)"
                    value={newSymptom.estado_actual}
                    onChange={(e) =>
                      setNewSymptom({
                        ...newSymptom,
                        estado_actual: e.target.value,
                      })
                    }
                    className="px-3 py-2 border rounded-md"
                  />
                </div>

                <textarea
                  placeholder="Descripción del síntoma (opcional)"
                  value={newSymptom.descripcion}
                  onChange={(e) =>
                    setNewSymptom({
                      ...newSymptom,
                      descripcion: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border rounded-md"
                />

                <button
                  onClick={handleAddSymptom}
                  className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Agregar síntoma
                </button>
              </div>
              {diagnosisData.sintomas.length > 0 && (
                <div className="mt-4 space-y-4">
                  <h4 className="text-sm font-semibold text-gray-700">
                    Síntomas agregados
                  </h4>
                  {diagnosisData.sintomas.map((sintoma, index) => (
                    <div
                      key={index}
                      className="border rounded-md p-3 bg-gray-50 relative shadow-sm"
                    >
                      <button
                        onClick={() => {
                          const nuevos = [...diagnosisData.sintomas];
                          nuevos.splice(index, 1);
                          setDiagnosisData({
                            ...diagnosisData,
                            sintomas: nuevos,
                          });
                        }}
                        className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                        title="Eliminar síntoma"
                      >
                        ×
                      </button>
                      <div className="text-sm space-y-1">
                        <p>
                          <span className="font-medium">Nombre:</span>{" "}
                          {sintoma.nombre_sintoma}
                        </p>
                        <p>
                          <span className="font-medium">
                            Fecha de manifestación:
                          </span>{" "}
                          {sintoma.fecha_primera_manifestacion}
                        </p>
                        <p>
                          <span className="font-medium">Severidad:</span>{" "}
                          {sintoma.severidad}
                        </p>
                        <p>
                          <span className="font-medium">Estado actual:</span>{" "}
                          {sintoma.estado_actual}
                        </p>
                        {sintoma.descripcion && (
                          <p>
                            <span className="font-medium">Descripción:</span>{" "}
                            {sintoma.descripcion}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      case "treatment":
        if (!treatmentType) {
          return (
            <div className="space-y-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-medium text-gray-800">
                  Seleccionar Tipo de Tratamiento
                </h3>
                <button
                  onClick={() => setAttentionType(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <button
                  onClick={() => setTreatmentType("medication")}
                  className="p-6 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="flex items-center mb-3">
                    <Pill className="h-8 w-8 text-blue-600 mr-3" />
                    <h4 className="text-lg font-medium">Medicamentos</h4>
                  </div>
                  <p className="text-gray-600">Prescripción de medicamentos.</p>
                </button>

                <button
                  onClick={() => setTreatmentType("therapy")}
                  className="p-6 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="flex items-center mb-3">
                    <Activity className="h-8 w-8 text-green-600 mr-3" />
                    <h4 className="text-lg font-medium">Terapia</h4>
                  </div>
                  <p className="text-gray-600">
                    Terapia física o rehabilitación.
                  </p>
                </button>

                <button
                  onClick={() => setTreatmentType("surgery")}
                  className="p-6 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="flex items-center mb-3">
                    <Scissors className="h-8 w-8 text-red-600 mr-3" />
                    <h4 className="text-lg font-medium">
                      Intervención Quirúrgica
                    </h4>
                  </div>
                  <p className="text-gray-600">Procedimientos quirúrgicos.</p>
                </button>
              </div>
            </div>
          );
        }

        return (
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-medium text-gray-800">
                {treatmentType === "medication" &&
                  "Prescripción de Medicamentos"}
                {treatmentType === "therapy" && "Prescripción de Terapia"}
                {treatmentType === "surgery" && "Programación de Cirugía"}
              </h3>
              <button
                onClick={() => setTreatmentType(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>

            {treatmentType === "medication" && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Razón
                    <textarea
                      value={tratamientoData.medication.razon}
                      onChange={(e) =>
                        setTratamientoData({
                          ...tratamientoData,
                          medication: {
                            ...tratamientoData.medication,
                            razon: e.target.value,
                          },
                        })
                      }
                      className="w-full text-base px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </label>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Duracion
                    <input
                      value={tratamientoData.medication.duracion_cantidad}
                      onChange={(e) =>
                        setTratamientoData({
                          ...tratamientoData,
                          medication: {
                            ...tratamientoData.medication,
                            duracion_cantidad: Number(e.target.value),
                          },
                        })
                      }
                      type="number"
                      className="w-full text-base px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </label>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Unidad de tiempo
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      value={tratamientoData.medication.id_unid_tiempo}
                      onChange={(e) =>
                        setTratamientoData({
                          ...tratamientoData,
                          medication: {
                            ...tratamientoData.medication,
                            id_unid_tiempo: Number(e.target.value),
                          },
                        })
                      }
                    >
                      {unidadTiemposOpciones.map((d: any) => (
                        <option key={d.id_unid_tiempo} value={d.id_unid_tiempo}>
                          {d.nombre}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Observaciones
                    <textarea
                      value={tratamientoData.medication.observaciones}
                      onChange={(e) =>
                        setTratamientoData({
                          ...tratamientoData,
                          medication: {
                            ...tratamientoData.medication,
                            observaciones: e.target.value,
                          },
                        })
                      }
                      className="w-full text-base px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </label>
                </div>
                <div className="border-t-[1px] border-gray-200 py-4">
                  <label>
                    Medicamentos
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      value={nuevoMedicamento.id_medicamento || 1}
                      onChange={(e) =>
                        setNuevoMedicamento({
                          ...nuevoMedicamento,
                          id_medicamento: Number(e.target.value),
                        })
                      }
                    >
                      {medicamentosOpciones.map((d: any) => (
                        <option key={d.id_medicamento} value={d.id_medicamento}>
                          {d.nombre_comercial}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Motivo
                    <textarea
                      value={nuevoMedicamento.motivo}
                      onChange={(e) =>
                        setNuevoMedicamento({
                          ...nuevoMedicamento,
                          motivo: e.target.value,
                        })
                      }
                      className="w-full text-base px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Cantidad de dosis
                    <input
                      value={nuevoMedicamento.cantidad_dosis || 0}
                      onChange={(e) =>
                        setNuevoMedicamento({
                          ...nuevoMedicamento,
                          cantidad_dosis: Number(e.target.value),
                        })
                      }
                      type="number"
                      className="w-full text-base px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Frecuencia
                    <textarea
                      value={nuevoMedicamento.frecuencia}
                      onChange={(e) =>
                        setNuevoMedicamento({
                          ...nuevoMedicamento,
                          frecuencia: e.target.value,
                        })
                      }
                      className="w-full text-base px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </label>
                </div>
                <button
                  onClick={() => {
                    setTratamientoData({
                      ...tratamientoData,
                      medication: {
                        ...tratamientoData.medication,
                        medicamentos: [
                          ...tratamientoData.medication.medicamentos,
                          nuevoMedicamento,
                        ],
                      },
                    });
                    setNuevoMedicamento({
                      id_medicamento: 1,
                      motivo: "",
                      cantidad_dosis: null,
                      frecuencia: "",
                    });
                  }}
                  className="mt-2 px-4 py-2 w-fit bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Agregar medicamento
                </button>
                {tratamientoData.medication.medicamentos.map(
                  (medicamento: any, index: number) => (
                    <div
                      key={index}
                      className="border border-gray-200 rounded-md p-4 
                               hover:bg-gray-50 transition-colors"
                    >
                      <div>
                        <h4>Medicamento</h4>
                        <p className="text-sm text-gray-600">
                          {medicamento.id_medicamento}
                        </p>
                      </div>
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium text-gray-800 capitalize">
                            {medicamento.nombre_comercial}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {medicamento.razon}
                          </p>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Motivo:</p>
                        <p className="text-sm text-gray-600">
                          {medicamento.motivo}
                        </p>
                      </div>
                      <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                        <div>
                          <p className="text-sm font-medium">
                            Cantidad de dosis:
                          </p>
                          <p className="text-sm text-gray-600">
                            {medicamento.cantidad_dosis}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Frecuencia:</p>
                          <p className="text-sm text-gray-600">
                            {medicamento.frecuencia}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                )}
              </>
            )}

            {treatmentType === "therapy" && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Descripción
                      <textarea
                        value={tratamientoData.therapy.descripcion}
                        onChange={(e) =>
                          setTratamientoData({
                            ...tratamientoData,
                            therapy: {
                              ...tratamientoData.therapy,
                              descripcion: e.target.value,
                            },
                          })
                        }
                        className="w-full text-base px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                    </label>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Observaciones
                      <textarea
                        value={tratamientoData.therapy.observaciones}
                        onChange={(e) =>
                          setTratamientoData({
                            ...tratamientoData,
                            therapy: {
                              ...tratamientoData.therapy,
                              observaciones: e.target.value,
                            },
                          })
                        }
                        className="w-full text-base px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Resultados
                    <textarea
                      value={tratamientoData.therapy.resultados}
                      onChange={(e) =>
                        setTratamientoData({
                          ...tratamientoData,
                          therapy: {
                            ...tratamientoData.therapy,
                            resultados: e.target.value,
                          },
                        })
                      }
                      className="w-full text-base px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </label>
                </div>
              </>
            )}

            {treatmentType === "surgery" && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de anestecia
                    <input
                      value={tratamientoData.surgery.tipo_anestesia}
                      onChange={(e) =>
                        setTratamientoData({
                          ...tratamientoData,
                          surgery: {
                            ...tratamientoData.surgery,
                            tipo_anestesia: e.target.value,
                          },
                        })
                      }
                      className="w-full text-base px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Procedimeiento quirúrgico
                    <textarea
                      value={tratamientoData.surgery.procedimiento_quirurgico}
                      onChange={(e) =>
                        setTratamientoData({
                          ...tratamientoData,
                          surgery: {
                            ...tratamientoData.surgery,
                            procedimiento_quirurgico: e.target.value,
                          },
                        })
                      }
                      className="w-full text-base px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Observaciones
                    <textarea
                      value={tratamientoData.surgery.observaciones}
                      onChange={(e) =>
                        setTratamientoData({
                          ...tratamientoData,
                          surgery: {
                            ...tratamientoData.surgery,
                            observaciones: e.target.value,
                          },
                        })
                      }
                      className="w-full text-base px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </label>
                </div>
              </>
            )}
          </div>
        );

      default:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-800 mb-4">
              Seleccionar Tipo de Atención
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <button
                onClick={() => setAttentionType("triage")}
                className="p-6 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
              >
                <div className="flex items-center mb-3">
                  <Thermometer className="h-8 w-8 text-blue-600 mr-3" />
                  <h4 className="text-lg font-medium">Triaje</h4>
                </div>
                <p className="text-gray-600">
                  Registro de signos vitales y evaluación inicial.
                </p>
              </button>

              <button
                onClick={() => setAttentionType("exam")}
                className="p-6 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
              >
                <div className="flex items-center mb-3">
                  <Clipboard className="h-8 w-8 text-green-600 mr-3" />
                  <h4 className="text-lg font-medium">Examen Médico</h4>
                </div>
                <p className="text-gray-600">
                  Evaluación física y registro de hallazgos.
                </p>
              </button>

              <button
                onClick={() => setAttentionType("diagnosis")}
                className="p-6 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
              >
                <div className="flex items-center mb-3">
                  <Stethoscope className="h-8 w-8 text-purple-600 mr-3" />
                  <h4 className="text-lg font-medium">Diagnóstico</h4>
                </div>
                <p className="text-gray-600">
                  Registro de diagnóstico y plan de tratamiento.
                </p>
              </button>

              <button
                onClick={() => setAttentionType("treatment")}
                className="p-6 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
              >
                <div className="flex items-center mb-3">
                  <Pill className="h-8 w-8 text-orange-600 mr-3" />
                  <h4 className="text-lg font-medium">Tratamiento</h4>
                </div>
                <p className="text-gray-600">
                  Registro de medicamentos y procedimientos.
                </p>
              </button>
            </div>
          </div>
        );
    }
  };

  const renderOrderForm = () => {
    if (!orderType) {
      return (
        <div className="space-y-6">
          <h3 className="text-lg font-medium text-gray-800 mb-4">
            Seleccionar Tipo de Orden
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <button
              onClick={() => setOrderType("exam")}
              className="p-6 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
            >
              <div className="flex items-center mb-3">
                <Activity className="h-8 w-8 text-blue-600 mr-3" />
                <h4 className="text-lg font-medium">Examen Médico</h4>
              </div>
              <p className="text-gray-600">
                Solicitar exámenes de laboratorio, radiografías, ecografías,
                etc.
              </p>
            </button>

            <button
              onClick={() => setOrderType("surgery")}
              className="p-6 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
            >
              <div className="flex items-center mb-3">
                <Heart className="h-8 w-8 text-red-600 mr-3" />
                <h4 className="text-lg font-medium">Intervención Quirúrgica</h4>
              </div>
              <p className="text-gray-600">
                Programar cirugías y procedimientos quirúrgicos.
              </p>
            </button>

            <button
              onClick={() => setOrderType("therapy")}
              className="p-6 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
            >
              <div className="flex items-center mb-3">
                <Brain className="h-8 w-8 text-green-600 mr-3" />
                <h4 className="text-lg font-medium">Terapia</h4>
              </div>
              <p className="text-gray-600">
                Solicitar terapia física, ocupacional, del lenguaje, etc.
              </p>
            </button>

            <button
              onClick={() => setOrderType("consultation")}
              className="p-6 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
            >
              <div className="flex items-center mb-3">
                <Stethoscope className="h-8 w-8 text-purple-600 mr-3" />
                <h4 className="text-lg font-medium">Consulta Especializada</h4>
              </div>
              <p className="text-gray-600">
                Derivar a consulta con un especialista.
              </p>
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-medium text-gray-800">
            {orderType === "exam" && "Orden de Examen Médico"}
            {orderType === "surgery" && "Orden de Intervención Quirúrgica"}
            {orderType === "therapy" && "Orden de Terapia"}
            {orderType === "consultation" && "Orden de Consulta Especializada"}
          </h3>
          <button
            onClick={() => setOrderType(null)}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex flex-col gap-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {orderType === "exam" && "Exámenes solicitados"}
            {orderType === "surgery" && "Tipo de procedimiento"}
            {orderType === "therapy" && "Tipo de terapia"}
            {orderType === "consultation" && "Especialidad"}
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              value={servicesType[orderType].form.id_subtipo_servicio}
              onChange={(e) =>
                setServicesType((prev) => ({
                  ...prev,
                  [orderType]: {
                    ...prev[orderType],
                    form: {
                      ...prev[orderType].form,
                      id_subtipo_servicio: e.target.value,
                    },
                  },
                }))
              }
            >
              {servicesType[orderType].subtipos.map((d) => (
                <option
                  key={d.id_subtipo_servicio}
                  value={d.id_subtipo_servicio}
                >
                  {d.nombre}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Motivo
            <textarea
              value={servicesType[orderType].form.motivo}
              onChange={(e) =>
                setServicesType((prev) => ({
                  ...prev,
                  [orderType]: {
                    ...prev[orderType],
                    form: {
                      ...prev[orderType].form,
                      motivo: e.target.value,
                    },
                  },
                }))
              }
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </label>
          <label className="block text-sm font-medium text-gray-700">
            Observaciones
            <textarea
              value={servicesType[orderType].form.observaciones}
              onChange={(e) =>
                setServicesType((prev) => ({
                  ...prev,
                  [orderType]: {
                    ...prev[orderType],
                    form: {
                      ...prev[orderType].form,
                      observaciones: e.target.value,
                    },
                  },
                }))
              }
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </label>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">
          Servicios Médicos
        </h1>
      </div>

      {selectedAppointment ? (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="p-6">
            {/* Encabezado */}
            <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-6 gap-4">
              <div className="flex-1">
                <button
                  onClick={() => {
                    setSelectedAppointment(null);
                    setShowOrderForm(false);
                    setOrderType(null);
                    setShowAttentionForm(false);
                    setAttentionType(null);
                    setTreatmentType(null);
                  }}
                  className="flex items-center text-blue-600 hover:text-blue-800 mb-4"
                >
                  <span className="mr-1">←</span> Volver a citas
                </button>
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 p-3 rounded-full">
                    <User className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-semibold text-gray-800">
                      {currentAppointment?.patientName}
                    </h2>
                    <p className="text-gray-600">
                      {currentAppointment?.reason}
                    </p>
                  </div>
                </div>
              </div>

              {/* Botones principales */}
              <div className="flex flex-wrap gap-2 justify-end">
                {!showOrderForm && !showAttentionForm && (
                  <>
                    <button
                      onClick={handleViewMedicalRecord}
                      className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors flex items-center"
                    >
                      <FileText size={18} className="mr-2" />
                      Historia Clínica
                    </button>
                    <button
                      onClick={() => setShowAttentionForm(true)}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center"
                    >
                      <FileCheck size={18} className="mr-2" />
                      Registrar Atención
                    </button>
                    <button
                      onClick={() => {
                        setShowOrderForm(true);
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center"
                    >
                      <Plus size={18} className="mr-2" />
                      Generar Orden
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Formularios */}
            {showAttentionForm && (
              <div className="mb-8 p-4 border border-gray-200 rounded-lg">
                {renderAttentionForm()}
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setShowAttentionForm(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSaveAttention}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center"
                  >
                    <Save size={18} className="mr-2" />
                    Guardar Atención
                  </button>
                </div>
              </div>
            )}

            {showOrderForm && (
              <div className="mb-8 p-4 border border-gray-200 rounded-lg">
                {renderOrderForm()}
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => {
                      setShowOrderForm(false);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleCreateOrder}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center"
                  >
                    <Save size={18} className="mr-2" />
                    Generar Orden
                  </button>
                </div>
              </div>
            )}

            {/* Contenido principal */}
            <div className="space-y-8">
              {/* Detalles de la cita */}
              <div className="bg-gray-50 p-4 rounded-md">
                <h3 className="text-lg font-medium text-gray-800 mb-3">
                  Detalles de la Cita
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Fecha</p>
                    <p className="font-medium">{currentAppointment?.date}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Hora</p>
                    <p className="font-medium">{currentAppointment?.time}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Estado</p>
                    <p className="font-medium capitalize">
                      {currentAppointment?.status}
                    </p>
                  </div>
                </div>
              </div>

              {/* Atenciones registradas */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-medium text-gray-800 flex items-center">
                    <Clipboard className="h-5 w-5 text-blue-600 mr-2" />
                    Atenciones Registradas
                  </h3>
                  <span className="text-sm text-gray-500">
                    {attentions.length} registros
                  </span>
                </div>
                {attentions.length > 0 ? (
                  <div className="space-y-3">
                    {attentions.map((attention) => (
                      <div
                        key={attention.id}
                        className="border border-gray-200 rounded-md p-4 hover:bg-gray-50"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium text-gray-800 capitalize">
                              {attention.type === "triage" && "Triaje"}
                              {attention.type === "exam" && "Examen Médico"}
                              {attention.type === "diagnosis" && "Diagnóstico"}
                              {attention.type === "treatment" && "Tratamiento"}
                            </h4>
                            <p className="text-sm text-gray-600">
                              {attention.date}
                            </p>
                          </div>
                          <div className="gap-2 flex items-center">
                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                              Completado
                            </span>
                            <button
                              onClick={() =>
                                handleDeleteAttention(
                                  attention.id_servicio_medico,
                                  attention.type,
                                  attention.details.type || null
                                )
                              }
                              className="px-2 py-1 bg-red-100 text-green-800 text-xs rounded-full hover:bg-red-200/75 active:bg-red-200/50 transition-colors"
                            >
                              Eliminar
                            </button>
                          </div>
                        </div>

                        {/* Mostrar detalles específicos según el tipo de atención */}
                        {attention.type === "triage" && (
                          <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                            <div>
                              <span className="text-gray-500">Pulso: </span>
                              <span>
                                {attention.details.pulso_cardiaco || "--"} lpm
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-500">Presión: </span>
                              <span>
                                {attention.details.presion_sistolica || "--"}/
                                {attention.details.presion_diastolica || "--"}{" "}
                                mmHg
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-500">Sat O₂: </span>
                              <span>
                                {attention.details.oxigenacion || "--"}%
                              </span>
                            </div>
                            <div className="col-span-2">
                              <span className="text-gray-500">
                                Estado del paciente:{" "}
                              </span>
                              <span>
                                {attention.details.estado_paciente || "--"}
                              </span>
                            </div>
                            <div className="col-span-2">
                              <span className="text-gray-500">
                                Observaciones:{" "}
                              </span>
                              <span>
                                {attention.details.observaciones || "--"}
                              </span>
                            </div>
                          </div>
                        )}

                        {attention.type === "diagnosis" &&
                          attention.details.symptoms?.length > 0 && (
                            <div className="mt-2">
                              <p className="text-sm font-medium">Síntomas:</p>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {attention.details.symptoms.map(
                                  (symptom: string, i: number) => (
                                    <span
                                      key={i}
                                      className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                                    >
                                      {symptom}
                                    </span>
                                  )
                                )}
                              </div>
                            </div>
                          )}

                        {attention.type === "treatment" && (
                          <div className="mt-2">
                            <p className="text-sm font-medium">Tipo: </p>
                            <span className="text-sm capitalize">
                              {attention.details.type === "medication" &&
                                "Medicación"}
                              {attention.details.type === "therapy" &&
                                "Terapia"}
                              {attention.details.type === "surgery" &&
                                "Cirugía"}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-500 bg-gray-50 rounded-md">
                    <AlertCircle className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                    <p>No se han registrado atenciones aún</p>
                    <button
                      onClick={() => setShowAttentionForm(true)}
                      className="mt-3 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm"
                    >
                      Registrar primera atención
                    </button>
                  </div>
                )}
              </div>

              {/* Órdenes generadas */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-medium text-gray-800 flex items-center">
                    <FileText className="h-5 w-5 text-blue-600 mr-2" />
                    Órdenes Generadas
                  </h3>
                  <span className="text-sm text-gray-500">
                    {orders.length} registros
                  </span>
                </div>
                {orders.length > 0 ? (
                  <div className="space-y-3">
                    {orders.map((order) => (
                      <div
                        key={order.id}
                        className="border border-gray-200 rounded-md p-4 hover:bg-gray-50"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium text-gray-800 capitalize">
                              {order.type === "exam" && "Examen Médico"}
                              {order.type === "surgery" &&
                                "Intervención Quirúrgica"}
                              {order.type === "therapy" && "Terapia"}
                              {order.type === "consultation" &&
                                "Consulta Especializada"}
                            </h4>
                            <p className="text-sm text-gray-600">
                              {order.date}
                            </p>
                          </div>
                          <div className="gap-2 flex items-center">
                            <span
                              className={`px-2 py-1 text-xs rounded-full ${
                                order.status === "pending"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-green-100 text-green-800"
                              }`}
                            >
                              {order.status === "pending"
                                ? "Pendiente"
                                : "Completado"}
                            </span>
                            <button
                              onClick={() =>
                                handleDeleteOrder(
                                  order.id_servicio_medico,
                                  order.type
                                )
                              }
                              className="px-2 py-1 bg-red-100 text-green-800 text-xs rounded-full hover:bg-red-200/75 active:bg-red-200/50 transition-colors"
                            >
                              Eliminar
                            </button>
                          </div>
                        </div>
                        <p className="text-sm mt-2">{order.description}</p>
                        {order.details && (
                          <div className="mt-2 text-sm text-gray-600">
                            {/* Mostrar detalles específicos de la orden si existen */}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-500 bg-gray-50 rounded-md">
                    <AlertCircle className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                    <p>No se han generado órdenes aún</p>
                    <button
                      onClick={() => setShowOrderForm(true)}
                      className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                    >
                      Generar primera orden
                    </button>
                  </div>
                )}
              </div>

              {/* Botón para concluir atención */}
              <div className="flex justify-end pt-4 border-t border-gray-200">
                {/* <button
                  onClick={handleCompleteAttention}
                  disabled={attentions.length === 0 || isAttentionCompleted}
                  className={`px-6 py-3 rounded-md text-white font-medium flex items-center ${
                    isAttentionCompleted
                      ? "bg-green-600 hover:bg-green-700"
                      : attentions.length === 0
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700"
                  } transition-colors`}
                >
                  {isAttentionCompleted ? (
                    <>
                      <CheckCircle className="h-5 w-5 mr-2" />
                      Atención Completada
                    </>
                  ) : (
                    "Concluir Atención"
                  )}
                </button> */}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Lista de citas */
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="p-6">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4 gap-2">
              <h2 className="text-lg font-medium text-gray-800">
                Citas del Día
              </h2>
              <div className="text-sm text-gray-600">
                {new Date().toLocaleDateString("es-ES", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </div>
            </div>

            {appointments.length > 0 ? (
              <div className="space-y-3">
                {appointments.map((appointment) => (
                  <div
                    key={appointment.id}
                    className="flex items-center justify-between p-4 rounded-md bg-gray-50 border-l-4 border-gray-300 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="bg-blue-100 p-2 rounded-full">
                        <Clock className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-medium">
                          {appointment.patientName}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center gap-2">
                          <span>{appointment.time}</span>
                          <span>•</span>
                          <span>{appointment.reason}</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleStartAppointment(appointment.id)}
                      className="px-4 py-2 rounded-md text-sm font-medium bg-white text-blue-600 border border-blue-600 hover:bg-blue-50 transition-colors"
                    >
                      Iniciar atención
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                <p>No hay citas programadas para hoy</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicalServices;
