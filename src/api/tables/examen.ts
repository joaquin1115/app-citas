// src/tables/ServicioMedico.ts

import { supabase } from "../../lib/supabase";
import { Examen } from "./types";

export class ExamenTable {
  private table = "examen";

  async get(id?: number): Promise<Examen[] | Examen | null> {
    const query = supabase.from(this.table).select("*");
    const { data, error } = id
      ? await query.eq("id_examen", id).single()
      : await query;

    if (error) throw error;
    return data;
  }

  async post(data: Examen): Promise<Examen> {
    const { data: inserted, error } = await supabase
      .from(this.table)
      .insert(data)
      .select()
      .single();
    if (error) throw error;
    return inserted;
  }

  async put(id: number, data: Partial<Examen>): Promise<Examen> {
    const { data: updated, error } = await supabase
      .from(this.table)
      .update(data)
      .eq("id_examen", id)
      .select()
      .single();
    if (error) throw error;
    return updated;
  }

  async delete(id: number): Promise<{ success: boolean }> {
    const { error } = await supabase
      .from(this.table)
      .delete()
      .eq("id_examen", id);
    if (error) throw error;
    return { success: true };
  }

  async deleteByServicio(
    id_servicio_medico: number
  ): Promise<{ success: boolean }> {
    const { error } = await supabase
      .from(this.table)
      .delete()
      .eq("id_servicio_medico", id_servicio_medico);
    if (error) throw error;
    return { success: true };
  }
}
