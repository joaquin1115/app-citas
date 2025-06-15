// src/tables/ServicioMedico.ts

import { supabase } from "../../lib/supabase";
import { ServicioMedico } from "./types";

export class ServicioMedicoTable {
  private table = "servicio_medico";

  async get(id?: number): Promise<ServicioMedico[] | ServicioMedico | null> {
    const query = supabase.from(this.table).select("*");
    const { data, error } = id
      ? await query.eq("id_servicio_medico", id).single()
      : await query;

    if (error) throw error;
    return data;
  }

  async post(data: ServicioMedico): Promise<ServicioMedico> {
    const { data: inserted, error } = await supabase
      .from(this.table)
      .insert(data)
      .select()
      .single();
    if (error) throw error;
    return inserted;
  }

  async put(
    id: number,
    data: Partial<ServicioMedico>
  ): Promise<ServicioMedico> {
    const { data: updated, error } = await supabase
      .from(this.table)
      .update(data)
      .eq("id_servicio_medico", id)
      .select()
      .single();
    if (error) throw error;
    return updated;
  }

  async delete(id: number): Promise<{ success: boolean }> {
    const { error } = await supabase
      .from(this.table)
      .delete()
      .eq("id_servicio_medico", id);
    if (error) throw error;
    return { success: true };
  }
}
