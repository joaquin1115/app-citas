// src/tables/ServicioMedico.ts

import { supabase } from "../../lib/supabase";
import { SubtipoServicio } from "./types";

export class SubtipoServicioTable {
  private table = "subtipo_servicio";
  private pk = "id_subtipo_servicio";

  async get(id?: number): Promise<SubtipoServicio[] | SubtipoServicio | null> {
    const query = supabase.from(this.table).select("*");
    const { data, error } = id
      ? await query.eq(this.pk, id).single()
      : await query;

    if (error) throw error;
    return data;
  }

  async post(data: SubtipoServicio): Promise<SubtipoServicio> {
    const { data: inserted, error } = await supabase
      .from(this.table)
      .insert(data)
      .select()
      .single();
    if (error) throw error;
    return inserted;
  }

  async put(id: number, data: Partial<SubtipoServicio>): Promise<SubtipoServicio> {
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
}
