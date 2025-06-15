// src/tables/ServicioMedico.ts

import { supabase } from "../../lib/supabase";
import { Diagnostico } from "./types";

export class DiagnosticoTable {
  private table = "diagnostico";
  private pk = "id_diagnostico";

  async get(id?: number): Promise<Diagnostico[] | Diagnostico | null> {
    const query = supabase.from(this.table).select("*");
    const { data, error } = id
      ? await query.eq(this.pk, id).single()
      : await query;

    if (error) throw error;
    return data;
  }

  async post(data: Diagnostico): Promise<Diagnostico> {
    const { data: inserted, error } = await supabase
      .from(this.table)
      .insert(data)
      .select()
      .single();
    if (error) throw error;
    return inserted;
  }

  async put(id: number, data: Partial<Diagnostico>): Promise<Diagnostico> {
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

  async getByServicio(id_servicio_medico: number): Promise<Diagnostico | null> {
    const { data, error } = await supabase
      .from(this.table)
      .select("*")
      .eq("id_servicio_medico", id_servicio_medico)
      .single();
    if (error) throw error;
    return data;
  }
}
