// src/ServiciosMedicos.ts

import { supabase } from "../../lib/supabase";
import { Cie10Table } from "../tables/cie10";
import { CitaMedicaTable } from "../tables/cita_medica";
import { ControlTable } from "../tables/control";
import { DiagnosticoTable } from "../tables/diagnostico";
import { ExamenTable } from "../tables/examen";
import { IntervencionQuirurgicaTable } from "../tables/intervencion_quirurgica";
import { MorbilidadTable } from "../tables/morbilidad";
import { OrdenMedicaTable } from "../tables/orden_medica";
import { ServicioMedicoTable } from "../tables/servicio_medico";
import { SintomaTable } from "../tables/sintoma";
import { TerapiaTable } from "../tables/terapia";
import { TratamientoTable } from "../tables/tratamiento";
import { TratamientoMedicamentoTable } from "../tables/tratamiento_medicamento";
import {
  Control,
  Examen,
  IntervencionQuirurgica,
  ServicioMedico,
  Terapia,
  TratamientoMedicamentos,
} from "../tables/types";
import { DiagnosticoData } from "./types";

export abstract class ServiciosMedicos {
  static tables = {
    servicio_medico: new ServicioMedicoTable(),
    control: new ControlTable(),
    examen: new ExamenTable(),
    diagnostico: new DiagnosticoTable(),
    morbilidad: new MorbilidadTable(),
    sintoma: new SintomaTable(),
    cie10: new Cie10Table(),
    orden_medica: new OrdenMedicaTable(),
    cita_medica: new CitaMedicaTable(),
    terapia: new TerapiaTable(),
    intervencion_quirurgica: new IntervencionQuirurgicaTable(),
    tratamiento: new TratamientoTable(),
    tratamiento_medicamento: new TratamientoMedicamentoTable(),
  };

  static async registrarTriaje(
    servicioData: ServicioMedico,
    triajeData: Omit<Control, "id_servicio_medico">
  ) {
    // 1. Insertar el servicio médico
    const servicioInsertado = await this.tables.servicio_medico.post(
      servicioData
    );

    const { id_servicio_medico } = servicioInsertado;

    console.log("Servicio medico para triaje insertado: ", id_servicio_medico);

    // 2. Insertar el control vinculado a ese servicio médico
    const controlInsertado = await this.tables.control.post({
      ...triajeData,
      id_servicio_medico,
    });

    console.log("Control insertado: ", controlInsertado);

    return {
      servicio: servicioInsertado,
      control: controlInsertado,
      success: 1,
    };
  }

  static async eliminarTriaje(idServicioMedico: number) {
    try {
      // 1. Obtener el control vinculado a este servicio
      const { data: control, error: controlError } = await supabase
        .from("control")
        .select("id_control")
        .eq("id_servicio_medico", idServicioMedico)
        .single();

      if (controlError) throw controlError;

      // 2. Eliminar el control
      if (control?.id_control) {
        await this.tables.control.delete(control.id_control);
        console.log("Control eliminado con éxito:", control.id_control);
      } else {
        console.warn("No se encontró control vinculado al servicio");
      }

      // 3. Eliminar el servicio médico
      await this.tables.servicio_medico.delete(idServicioMedico);
      console.log("Servicio médico eliminado con éxito:", idServicioMedico);

      return { success: 1 };
    } catch (error) {
      console.error("Error al eliminar triaje:", error);
      return { success: 1, error };
    }
  }

  static async registrarExamen(
    servicioData: ServicioMedico,
    examenData: Examen
  ): Promise<{ success: number; examen: Examen }> {
    // 1. Insertar el servicio médico
    const servicioInsertado = await this.tables.servicio_medico.post(
      servicioData
    );

    const { id_servicio_medico } = servicioInsertado;

    console.log("Servicio medico para examen insertado: ", id_servicio_medico);

    // 2. Insertar el examen vinculado a ese servicio médico
    const examenInsertado = await this.tables.examen.post({
      ...examenData,
      id_servicio_medico,
    });

    console.log("Examen insertado: ", examenInsertado);

    return {
      success: 1,
      examen: examenInsertado,
    };
  }

  static async eliminarExamen(
    id_servicio_medico: number
  ): Promise<{ success: number }> {
    // 1. Eliminar el examen vinculado al servicio médico
    await this.tables.examen.deleteByServicio(id_servicio_medico);
    console.log("Examen eliminado con id_servicio_medico:", id_servicio_medico);

    // 2. Eliminar el servicio médico
    await this.tables.servicio_medico.delete(id_servicio_medico);
    console.log("Servicio médico eliminado:", id_servicio_medico);

    return { success: 1 };
  }

  static async registrarDiagnostico(
    servicioData: ServicioMedico,
    diagnosticoData: DiagnosticoData
  ): Promise<{ success: number; diagnostico: DiagnosticoData }> {
    // 1. Insertar el servicio médico
    const servicioInsertado = await this.tables.servicio_medico.post(
      servicioData
    );
    const id_servicio_medico = servicioInsertado.id_servicio_medico;

    console.log(
      "Servicio médico insertado para diagnóstico:",
      id_servicio_medico
    );

    // 3. Insertar la morbilidad
    const morbilidadInsertada = await this.tables.morbilidad.post({
      ...diagnosticoData.morbilidad,
      id_cie10: diagnosticoData.morbilidad.id_cie10!,
    });

    console.log("Morbilidad insertada:", morbilidadInsertada);

    // 4. Insertar el diagnóstico
    const diagnosticoInsertado = await this.tables.diagnostico.post({
      ...diagnosticoData.diagnostico,
      id_morbilidad: morbilidadInsertada.id_morbilidad!,
      id_servicio_medico: id_servicio_medico!,
    });

    console.log("Diagnóstico insertado:", diagnosticoInsertado);

    // 5. Insertar los síntomas relacionados
    const sintomasInsertados = [];
    for (const sintoma of diagnosticoData.sintomas) {
      const sintomaInsertado = await this.tables.sintoma.post({
        ...sintoma,
        id_diagnostico: diagnosticoInsertado.id_diagnostico!,
      });
      sintomasInsertados.push(sintomaInsertado);
    }

    console.log("Síntomas insertados:", sintomasInsertados);

    return {
      success: 1,
      diagnostico: {
        diagnostico: diagnosticoInsertado,
        morbilidad: morbilidadInsertada,
        cie10: {
          ...diagnosticoData.cie10,
          id_cie10: diagnosticoData.morbilidad.id_cie10!,
        },
        sintomas: sintomasInsertados,
      },
    };
  }

  static async eliminarDiagnostico(
    id_servicio_medico: number
  ): Promise<{ success: number }> {
    // 1. Obtener el diagnóstico por servicio
    const diagnostico = await this.tables.diagnostico.getByServicio(
      id_servicio_medico
    );
    if (!diagnostico)
      throw new Error("Diagnóstico no encontrado para este servicio");

    const id_diagnostico = diagnostico.id_diagnostico;
    const id_morbilidad = diagnostico.id_morbilidad;

    // 2. Eliminar los síntomas relacionados
    await this.tables.sintoma.deleteByDiagnostico(id_diagnostico);
    console.log("Síntomas eliminados");

    // 3. Eliminar el diagnóstico
    await this.tables.diagnostico.delete(id_diagnostico);
    console.log("Diagnóstico eliminado");

    // 4. Eliminar la morbilidad
    await this.tables.morbilidad.delete(id_morbilidad);
    console.log("Morbilidad eliminada");

    // 5. Eliminar el servicio médico
    await this.tables.servicio_medico.delete(id_servicio_medico);
    console.log("Servicio médico eliminado");

    return { success: 1 };
  }

  static async registrarOrden(servicioData: ServicioMedico, ordenData: any) {
    // 1. Insertar el servicio médico
    const servicioInsertado = await this.tables.servicio_medico.post(
      servicioData
    );

    const { id_servicio_medico } = servicioInsertado;

    console.log("Servicio medico para orden insertado: ", id_servicio_medico);

    // 2. Insertar el orden
    const ordenInsertado = await this.tables.orden_medica.post({
      ...ordenData,
      id_servicio_medico,
    });

    console.log("Orden insertado: ", ordenInsertado);

    return {
      success: 1,
      orden: ordenInsertado,
    };
  }

  static async eliminarOrden(
    id_servicio_medico: number
  ): Promise<{ success: number }> {
    // 1. Obtener la orden médica por servicio
    console.log("Eliminando orden médica...", id_servicio_medico);
    const orden = await this.tables.orden_medica.getByServicio(
      id_servicio_medico
    );
    if (!orden)
      throw new Error("Orden médica no encontrada para este servicio");

    // 2. Eliminar la orden médica
    await this.tables.orden_medica.delete(orden.id_orden);
    console.log("Orden médica eliminada");

    // 3. Eliminar el servicio médico asociado
    await this.tables.servicio_medico.delete(id_servicio_medico);
    console.log("Servicio médico eliminado");

    return { success: 1 };
  }

  static async registrarTerapia(
    servicioData: ServicioMedico,
    terapiaData: Terapia
  ): Promise<{ success: number; terapia: Terapia }> {
    // 1. Insertar el servicio médico
    const servicioInsertado = await this.tables.servicio_medico.post(
      servicioData
    );

    const { id_servicio_medico } = servicioInsertado;

    console.log("Servicio medico para terapia insertado: ", id_servicio_medico);

    // 2. Insertar la terapia
    const terapiaInsertado = await this.tables.terapia.post({
      ...terapiaData,
      id_servicio_medico,
    });

    console.log("Terapia insertado: ", terapiaInsertado);

    return {
      success: 1,
      terapia: terapiaInsertado,
    };
  }

  static async eliminarTerapia(
    id_servicio_medico: number
  ): Promise<{ success: number }> {
    // 1. Eliminar la terapia vinculada al servicio médico
    const terapia = await this.tables.terapia.get(); // Obtiene todas
    const terapiaAsociada = (terapia as Terapia[]).find(
      (t) => t.id_servicio_medico === id_servicio_medico
    );
    if (!terapiaAsociada) throw new Error("No se encontró la terapia asociada");

    await this.tables.terapia.delete(terapiaAsociada.id_terapia);

    // 2. Eliminar el servicio médico
    await this.tables.servicio_medico.delete(id_servicio_medico);

    return { success: 1 };
  }

  static async registrarIntervencionQuirurgica(
    servicioData: ServicioMedico,
    intervencionData: IntervencionQuirurgica
  ): Promise<{ success: number; intervencion: IntervencionQuirurgica }> {
    // 1. Insertar el servicio médico
    const servicioInsertado = await this.tables.servicio_medico.post(
      servicioData
    );

    const { id_servicio_medico } = servicioInsertado;

    console.log(
      "Servicio médico insertado para intervención quirúrgica: ",
      id_servicio_medico
    );

    // 2. Insertar la intervención
    const intervencionInsertado =
      await this.tables.intervencion_quirurgica.post({
        ...intervencionData,
        id_servicio_medico,
      });

    console.log("Intervención insertado: ", intervencionInsertado);

    return {
      success: 1,
      intervencion: intervencionInsertado,
    };
  }

  static async eliminarIntervencionQuirurgica(
    id_servicio_medico: number
  ): Promise<{ success: number }> {
    // 1. Obtener la intervención quirúrgica vinculada al servicio médico
    const { data: intervencion, error } = await supabase
      .from("intervencion_quirurgica")
      .select("id_intervencion")
      .eq("id_servicio_medico", id_servicio_medico)
      .single();

    if (error) throw error;

    // 2. Eliminar la intervención quirúrgica
    await this.tables.intervencion_quirurgica.delete(
      intervencion.id_intervencion
    );

    // 3. Eliminar el servicio médico
    await this.tables.servicio_medico.delete(id_servicio_medico);

    return { success: 1 };
  }

  static async eliminarTratamientoMedicamentos(
    id_servicio_medico: number
  ): Promise<{ success: number }> {
    // 1. Obtener el tratamiento asociado al servicio médico
    const { data: tratamiento, error: errorTratamiento } = await supabase
      .from("tratamiento")
      .select("id_tratamiento")
      .eq("id_servicio_medico", id_servicio_medico)
      .single();

    if (errorTratamiento) throw errorTratamiento;

    const id_tratamiento = tratamiento.id_tratamiento;

    // 2. Eliminar los medicamentos vinculados a ese tratamiento
    const { error: errorMedicamentos } = await supabase
      .from("tratamiento_medicamento")
      .delete()
      .eq("id_tratamiento", id_tratamiento);

    if (errorMedicamentos) throw errorMedicamentos;

    // 3. Eliminar el tratamiento
    await supabase
      .from("tratamiento")
      .delete()
      .eq("id_tratamiento", id_tratamiento);

    // 4. Eliminar el servicio médico
    await supabase
      .from("servicio_medico")
      .delete()
      .eq("id_servicio_medico", id_servicio_medico);

    return { success: 1 };
  }

  static async registrarTratamientoMedicamentos(
    servicioData: ServicioMedico,
    tratamientoMedicamentosData: TratamientoMedicamentos
  ) {
    // 1. Insertar el servicio médico
    const servicioInsertado = await this.tables.servicio_medico.post(
      servicioData
    );

    const { id_servicio_medico } = servicioInsertado;

    console.log(
      "Servicio medico para tratamiento insertado: ",
      id_servicio_medico
    );

    // 2. Insertar el tratamiento
    const tratamientoInsertado = await this.tables.tratamiento.post({
      ...tratamientoMedicamentosData.tratamiento,
      id_servicio_medico,
    });

    console.log("Tratamiento insertado: ", tratamientoInsertado);

    // 3. Insertar los medicamentos
    for (const medicamento of tratamientoMedicamentosData.medicamentos) {
      const medicamentoInsertado =
        await this.tables.tratamiento_medicamento.post({
          ...medicamento,
          id_tratamiento: tratamientoInsertado.id_tratamiento,
        });
      console.log("Medicamento insertado: ", medicamentoInsertado);
    }

    return {
      success: 1,
      tratamiento: tratamientoInsertado,
    };
  }

  static async obtenerServiciosMedicosTriajes(id_cita_medica: number) {
    const serviciosMedicos =
      await this.tables.cita_medica.getServiciosMedicosTriajes(id_cita_medica);

    const serviciosFormateados = serviciosMedicos.map((servicio: any) => {
      const {
        pulso_cardiaco,
        presion_diastolica,
        presion_sistolica,
        oxigenacion,
        estado_paciente,
        observaciones,
      } = servicio.control[0];

      return {
        id: servicio.id_servicio_medico.toString(),
        type: "triage",
        date: servicio.fecha_servicio,
        time: servicio.hora_inicio_servicio,
        details: {
          pulso_cardiaco,
          presion_diastolica,
          presion_sistolica,
          oxigenacion,
          estado_paciente,
          observaciones,
        },
        doctor: "",
        id_servicio_medico: servicio.id_servicio_medico,
      };
    });

    return serviciosFormateados;
  }

  static async obtenerServiciosMedicosExamenes(id_cita_medica: number) {
    const serviciosMedicos =
      await this.tables.cita_medica.getServiciosMedicosExamenes(id_cita_medica);

    const serviciosFormateados = serviciosMedicos.map((servicio: any) => {
      return {
        id: servicio.id_servicio_medico.toString(),
        type: "exam",
        date: servicio.fecha_servicio,
        time: servicio.hora_inicio_servicio,
        doctor: "",
        id_servicio_medico: servicio.id_servicio_medico,
      };
    });

    return serviciosFormateados;
  }

  static async obtenerServiciosMedicosDiagnostico(id_cita_medica: number) {
    const serviciosMedicos =
      await this.tables.cita_medica.getServiciosMedicosDiagnostico(
        id_cita_medica
      );

    const serviciosFormateados = serviciosMedicos.map((servicio: any) => {
      const sintomas = servicio.diagnostico?.[0]?.sintoma || [];

      return {
        id: servicio.id_servicio_medico.toString(),
        type: "diagnosis",
        date: servicio.fecha_servicio,
        time: servicio.hora_inicio_servicio,
        doctor: "", // Puedes completar esto si tienes el nombre del doctor
        details: {
          symptoms: sintomas.map(
            (sintoma: { nombre_sintoma: string }) => sintoma.nombre_sintoma
          ),
        },
        id_servicio_medico: servicio.id_servicio_medico,
      };
    });

    return serviciosFormateados;
  }

  static async obtenerServiciosMedicosTratamientosTerapias(
    id_cita_medica: number
  ) {
    const serviciosMedicos =
      await this.tables.cita_medica.getServiciosMedicosTerapias(id_cita_medica);

    console.log("Servicios médicos de terapias:", serviciosMedicos);

    const serviciosFormateados = serviciosMedicos.map((servicio: any) => {
      return {
        id: servicio.id.toString(),
        type: "treatment",
        date: `${servicio.date}, ${servicio.time}`,
        details: {
          type: "therapy",
        },
        id_servicio_medico: servicio.id,
      };
    });

    return serviciosFormateados;
  }

  static async obtenerServiciosMedicosTratamientosIntervencionesQuirurgicas(
    id_cita_medica: number
  ) {
    const serviciosMedicos =
      await this.tables.cita_medica.getServiciosMedicosIntervencionesQuirurgicas(
        id_cita_medica
      );

    const serviciosFormateados = serviciosMedicos.map((servicio: any) => {
      return {
        id: servicio.id.toString(),
        type: "treatment",
        date: `${servicio.date}, ${servicio.time}`,
        details: {
          type: "surgery",
        },
        id_servicio_medico: servicio.id,
      };
    });

    return serviciosFormateados;
  }

  static async obtenerServiciosMedicosTratamientosMedicamentos(
    id_cita_medica: number
  ) {
    const serviciosMedicos =
      await this.tables.cita_medica.getServiciosMedicosTratamientoMedicamentos(
        id_cita_medica
      );

    const serviciosFormateados = serviciosMedicos.map((servicio: any) => {
      return {
        id: servicio.id.toString(),
        type: "treatment",
        date: `${servicio.date}, ${servicio.time}`,
        details: {
          type: "medication",
        },
        id_servicio_medico: servicio.id,
      };
    });

    return serviciosFormateados;
  }

  static async obtenerAtencionesRegistradas(id_cita_medica: number) {
    const triajes = await this.obtenerServiciosMedicosTriajes(id_cita_medica);
    const examenes = await this.obtenerServiciosMedicosExamenes(id_cita_medica);
    const diagnosticos = await this.obtenerServiciosMedicosDiagnostico(
      id_cita_medica
    );
    const terapias = await this.obtenerServiciosMedicosTratamientosTerapias(
      id_cita_medica
    );
    const intervencionesQuirurgicas =
      await this.obtenerServiciosMedicosTratamientosIntervencionesQuirurgicas(
        id_cita_medica
      );
    const medicamentos =
      await this.obtenerServiciosMedicosTratamientosMedicamentos(
        id_cita_medica
      );

    const tratamientos = [
      ...terapias,
      ...intervencionesQuirurgicas,
      ...medicamentos,
    ];

    const serviciosFormateados = [
      ...triajes,
      ...examenes,
      ...diagnosticos,
      ...tratamientos,
    ];

    return serviciosFormateados;
  }

  static async obtenerOrdenesGeneradas(id_cita_medica: number) {
    const ordenesMedicas =
      await this.tables.cita_medica.getServiciosMedicosOrdenes(id_cita_medica);

    const ordenesFormateadas = ordenesMedicas.map((orden: any) => {
      const orderTypeMap: Record<string, string> = {
        2: "exam",
        4: "surgery",
        3: "therapy",
        1: "consultation",
      };

      return {
        id: orden.id_servicio_medico.toString(),
        type: orderTypeMap[
          orden.orden_medica[0]?.subtipo_servicio?.tipo_servicio
            ?.id_tipo_servicio
        ],
        date: `${orden.fecha_servicio}, ${orden.hora_inicio_servicio}`,
        time: orden.hora_inicio_servicio,
        description: `Orden de ${orden.orden_medica[0]?.subtipo_servicio?.nombre}`,
        status: "pending",
        id_servicio_medico: orden.id_servicio_medico,
      };
    });

    return ordenesFormateadas;
  }

  static async actualizarServicioMedicoHoraFin(id: number, hora_fin?: string) {
    if (!hora_fin) {
      const now = new Date();
      hora_fin = now.toTimeString().split(" ")[0]; // Obtiene HH:mm:ss
    }

    this.tables.servicio_medico.put(id, { hora_fin_servicio: hora_fin });

    return {
      success: 1,
    };
  }
}
