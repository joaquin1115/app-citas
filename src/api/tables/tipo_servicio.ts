// src/tables/ServicioMedico.ts

import { supabase } from "../../lib/supabase";
import { SubtipoServicio, TipoServicio } from "./types";

export class TipoServicioTable {
  private table = "tipo_servicio";
  private pk = "id_tipo_servicio";

  async get(id?: number): Promise<TipoServicio[] | TipoServicio | null> {
    const query = supabase.from(this.table).select("*");
    const { data, error } = id
      ? await query.eq(this.pk, id).single()
      : await query;

    if (error) throw error;
    return data;
  }

  async post(data: TipoServicio): Promise<TipoServicio> {
    const { data: inserted, error } = await supabase
      .from(this.table)
      .insert(data)
      .select()
      .single();
    if (error) throw error;
    return inserted;
  }

  async put(id: number, data: Partial<TipoServicio>): Promise<TipoServicio> {
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

  async getSubTipos(id: number): Promise<SubtipoServicio[]> {
    const query = supabase.from("subtipo_servicio").select("*");
    const { data, error } = await query.eq("id_tipo_servicio", id);
    if (error) throw error;
    return data;
  }
}
