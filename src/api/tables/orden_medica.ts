// src/tables/ServicioMedico.ts

import { supabase } from "../../lib/supabase";
import { OrdenMedica } from "./types";

export class OrdenMedicaTable {
  private table = "orden_medica";
  private pk = "id_orden";

  async get(id?: number): Promise<OrdenMedica[] | OrdenMedica | null> {
    const query = supabase.from(this.table).select("*");
    const { data, error } = id
      ? await query.eq(this.pk, id).single()
      : await query;

    if (error) throw error;
    return data;
  }

  async post(data: OrdenMedica): Promise<OrdenMedica> {
    const { data: inserted, error } = await supabase
      .from(this.table)
      .insert(data)
      .select()
      .single();
    if (error) throw error;
    return inserted;
  }

  async put(id: number, data: Partial<OrdenMedica>): Promise<OrdenMedica> {
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

  async getByServicio(id_servicio_medico: number): Promise<OrdenMedica | null> {
    const { data, error } = await supabase
      .from(this.table)
      .select("*")
      .eq("id_servicio_medico", id_servicio_medico)
      .single();
    if (error) throw error;
    return data;
  }
}
