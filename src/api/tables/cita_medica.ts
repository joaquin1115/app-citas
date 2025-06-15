// src/tables/ServicioMedico.ts

import { supabase } from "../../lib/supabase";
import { CitaMedica, Appointment, ServicioMedico, Control } from "./types";

export class CitaMedicaTable {
  private table = "cita_medica";
  private pk = "id_cita_medica";

  async get(id?: number): Promise<CitaMedica[] | CitaMedica | null> {
    const query = supabase.from(this.table).select("*");
    const { data, error } = id
      ? await query.eq(this.pk, id).single()
      : await query;

    if (error) throw error;
    return data;
  }

  async post(data: CitaMedica): Promise<CitaMedica> {
    const { data: inserted, error } = await supabase
      .from(this.table)
      .insert(data)
      .select()
      .single();
    if (error) throw error;
    return inserted;
  }

  async put(id: number, data: Partial<CitaMedica>): Promise<CitaMedica> {
    const { data: updated, error } = await supabase
      .from(this.table)
      .update(data)
      .eq(this.pk, id)
      .select()
      .single();
    if (error) throw error;
    return updated;
  }

  async delete(id: number): Promise<{ success: boolean }> {
    const { error } = await supabase.from(this.table).delete().eq(this.pk, id);
    if (error) throw error;
    return { success: true };
  }

  async getAppointments(id_personal_medico?: number): Promise<Appointment[]> {
    const { data, error } = await supabase
      .from("cita_medica")
      .select(
        `
        id_cita_medica,
        fecha_hora_registro,
        fecha_hora_programada,
        estado,
        paciente (
            id_paciente,
            persona (
            prenombres,
            primer_apellido,
            segundo_apellido
            )
        )
      `
      )
      .eq("estado", "Pendiente")
      .eq("id_personal_medico", id_personal_medico);

    if (error) throw error;

    return (data ?? []).map((item: any) => ({
      id: item.id_cita_medica.toString(),
      patientId: item.paciente.id_paciente.toString(),
      patientName: `${item.paciente.persona.prenombres} ${item.paciente.persona.primer_apellido} ${item.paciente.persona.segundo_apellido}`,
      date: item.fecha_hora_programada.split("T")[0],
      time: item.fecha_hora_programada.split("T")[1].substring(0, 5),
      status: item.estado,
      reason: item.actividad ?? "",
    }));
  }

  async getServiciosMedicosTriajes(id: number): Promise<any> {
    const { data, error } = await supabase
      .from("servicio_medico")
      .select(
        `
          id_servicio_medico,
          fecha_servicio,
          hora_inicio_servicio,
          control (
            id_control,
            pulso_cardiaco,
            presion_diastolica,
            presion_sistolica,
            oxigenacion,
            estado_paciente,
            observaciones
          )
        `
      )
      .eq("id_cita_medica", id)
      .not("control", "is", null);

    if (error) throw error;

    return data || [];
  }

  async getServiciosMedicosExamenes(id: number): Promise<any> {
    const { data, error } = await supabase
      .from("servicio_medico")
      .select(
        `
          id_servicio_medico,
          fecha_servicio,
          hora_inicio_servicio,
          examen (
            id_servicio_medico
          )
        `
      )
      .eq("id_cita_medica", id)
      .not("examen", "is", null);

    if (error) throw error;

    return data || [];
  }

  async getServiciosMedicosDiagnostico(id: number): Promise<any> {
    const { data, error } = await supabase
      .from("servicio_medico")
      .select(
        `
          id_servicio_medico,
          fecha_servicio,
          hora_inicio_servicio,
          diagnostico (
            sintoma (
              nombre_sintoma
            )
          )
        `
      )
      .eq("id_cita_medica", id)
      .not("diagnostico", "is", null);

    if (error) throw error;

    return data || [];
  }

  async getServiciosMedicosOrdenes(id: number): Promise<any> {
    const { data, error } = await supabase
      .from("servicio_medico")
      .select(
        `
          id_servicio_medico,
          fecha_servicio,
          hora_inicio_servicio,
          orden_medica (
            motivo,
            observaciones,
            subtipo_servicio (
              nombre,
              tipo_servicio (
                id_tipo_servicio
              )
            )
          )
        `
      )
      .eq("id_cita_medica", id)
      .not("orden_medica", "is", null)
      .order("fecha_servicio", { ascending: true })
      .order("hora_inicio_servicio", { ascending: true });

    if (error) throw error;

    return data || [];
  }

  async getServiciosMedicosTerapias(id_cita: number): Promise<
    {
      id: number;
      type: "treatment";
      details: { type: "therapy" };
    }[]
  > {
    const { data, error } = await supabase
      .from("servicio_medico")
      .select(
        `
        id_servicio_medico,
        fecha_servicio,
        hora_inicio_servicio,
        terapia (
          id_terapia
        )
      `
      )
      .eq("id_cita_medica", id_cita)
      .not("terapia", "is", null);

    if (error) throw error;

    return (data ?? []).map((item: any) => ({
      id: item.id_servicio_medico,
      type: "treatment",
      date: item.fecha_servicio,
      time: item.hora_inicio_servicio,
      details: {
        type: "therapy",
      },
    }));
  }

  async getServiciosMedicosIntervencionesQuirurgicas(id_cita: number): Promise<
    {
      id: number;
      type: "treatment";
      details: { type: "surgery" };
    }[]
  > {
    const { data, error } = await supabase
      .from("servicio_medico")
      .select(
        `
        id_servicio_medico,
        fecha_servicio,
        hora_inicio_servicio,
        intervencion_quirurgica (
          id_intervencion
        )
      `
      )
      .eq("id_cita_medica", id_cita)
      .not("intervencion_quirurgica", "is", null);

    if (error) throw error;

    return (data ?? []).map((item: any) => ({
      id: item.id_servicio_medico,
      type: "treatment",
      date: item.fecha_servicio,
      time: item.hora_inicio_servicio,
      details: {
        type: "surgery",
      },
    }));
  }

  async getServiciosMedicosTratamientoMedicamentos(id_cita: number): Promise<
    {
      id: number;
      type: "treatment";
      details: { type: "medication" };
    }[]
  > {
    const { data, error } = await supabase
      .from("servicio_medico")
      .select(
        `
        id_servicio_medico,
        fecha_servicio,
        hora_inicio_servicio,
        tratamiento (
          id_tratamiento
        )
      `
      )
      .eq("id_cita_medica", id_cita)
      .not("tratamiento", "is", null);

    if (error) throw error;

    return (data ?? []).map((item: any) => ({
      id: item.id_servicio_medico,
      type: "treatment",
      date: item.fecha_servicio,
      time: item.hora_inicio_servicio,
      details: {
        type: "medication",
      },
    }));
  }
}
