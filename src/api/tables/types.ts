export interface ServicioMedico {
  id_servicio_medico?: number;
  id_cita_medica: number;
  fecha_servicio: string;
  hora_inicio_servicio: string;
  hora_fin_servicio: string;
}

export interface Control {
  id_control?: number;
  id_servicio_medico?: number;
  pulso_cardiaco: number;
  presion_diastolica: number;
  presion_sistolica: number;
  oxigenacion: number;
  estado_paciente?: string;
  observaciones?: string;
}

export type Examen = {
  id_examen?: number; // Opcional si lo genera el backend (SERIAL)
  id_servicio_medico?: number;
  descripcion_procedimiento: string;
  fecha_hora_atencion: string; // ISO string, compatible con Supabase TIMESTAMP
  descripcion: string;
  tipo_procedimiento: string;
  tipo_laboratorio: string;
  resultado: string;
};

export type Morbilidad = {
  id_morbilidad?: number; // Opcional si lo genera el backend (SERIAL)
  id_cie10: number; // Clave foránea obligatoria
  descripcion?: string; // Opcional porque en la tabla no tiene NOT NULL
  fecha_identificacion?: string; // Formato ISO: "YYYY-MM-DD"
  tipo: string; // Obligatorio
  nivel_gravedad?: string; // Opcional
  contagiosa?: boolean; // Opcional
};

export type Cie10 = {
  id_cie10?: number; // Opcional si lo genera el backend (SERIAL)
  codigo: string; // CHAR(3), pero en TypeScript usamos string
  descripcion: string;
};

export type Sintoma = {
  id_sintoma?: number; // Opcional si lo genera el backend (SERIAL)
  id_diagnostico: number; // FK, obligatorio
  nombre_sintoma: string; // Requerido
  fecha_primera_manifestacion: string; // Formato ISO (ej. "2025-06-10")
  descripcion?: string; // Opcional
  severidad: number; // Nivel numérico de severidad
  estado_actual: string; // Requerido
};

export type Diagnostico = {
  id_diagnostico?: number; // Opcional si es autogenerado (SERIAL)
  id_morbilidad: number; // FK requerido
  id_servicio_medico: number; // FK requerido
  detalle?: string; // Opcional (VARCHAR(100), no NOT NULL)
};

export type CitaMedica = {
  id_cita_medica: number;
  id_paciente: number;
  id_personal_medico: number;
  estado: string;
  actividad: string | null; // puede ser NULL
  fecha_hora_registro: string; // ISO timestamp string
};

export type Appointment = {
  id: string;
  patientName: string;
  patientId: string;
  date: string; // formato YYYY-MM-DD
  time: string; // formato HH:mm
  status: string;
  reason: string;
};

// TipoServicio.ts
export type TipoServicio = {
  id_tipo_servicio: number;
  nombre: string;
};

// SubtipoServicio.ts
export type SubtipoServicio = {
  id_subtipo_servicio: number;
  nombre: string;
  id_tipo_servicio: number; // FK hacia TipoServicio
};

export type OrdenMedica = {
  id_orden: number;
  motivo: string | null;
  observaciones: string | null;
  id_tipo_servicio: number;
  id_subtipo_servicio: number;
  cantidad: number;
};

export type Terapia = {
  id_terapia?: number; // Opcional si lo genera el backend (SERIAL)
  id_servicio_medico?: number; // FK
  descripcion: string; // Opcional
  observaciones: string; // Opcional
  resultados: string; // Opcional
};

export type IntervencionQuirurgica = {
  id_intervencion?: number; // Opcional si lo genera el backend (SERIAL)
  id_servicio_medico?: number; // FK
  procedimiento_quirurgico: string; // Opcional
  tipo_anestesia: string; // Opcional
  observaciones: string; // Opcional
};

export type TratamientoMedicamento = {
  id_tratamiento_medicamento?: number;
  id_tratamiento?: number;
  id_medicamento: number;
  motivo?: string | null;
  cantidad_dosis: number;
  frecuencia: string;
};

export type Tratamiento = {
  id_tratamiento?: number;
  id_servicio_medico?: number;
  razon?: string | null;
  id_unid_tiempo: number;
  duracion_cantidad?: number | null; // SMALLINT puede ser null
  observaciones?: string | null;
};

export type UnidadTiempo = {
  id_unid_tiempo: number;
  nombre?: string | null;
};

export type Medicamento = {
  id_medicamento: number;
  nombre_comercial: string;
  metodo_administracion: string;
  concentracion: string;
  laboratorio: string;
};

export type TratamientoMedicamentos = {
  tratamiento: Tratamiento;
  medicamentos: TratamientoMedicamento[];
};

export type PersonalMedico = {
  id_personal_medico?: number; // SERIAL, autogenerado por la BD
  id_persona: number; // INT NOT NULL
  id_especialidad: number; // SMALLINT NOT NULL
  licencia_medica?: string; // VARCHAR(50)
  colegiatura?: string; // VARCHAR(50)
  habilitado?: boolean; // BOOLEAN
  institucion_asociada?: string; // VARCHAR(100)
};
