// src/tables/ServicioMedico.ts

import { supabase } from "../../lib/supabase";
import { Cie10 } from "./types";

export class Cie10Table {
  private table = "cie10";
  private pk = "id_cie10";

  async get(id?: number): Promise<Cie10[] | Cie10 | null> {
    const query = supabase.from(this.table).select("*");
    const { data, error } = id
      ? await query.eq(this.pk, id).single()
      : await query;

    if (error) throw error;
    return data;
  }

  async post(data: Cie10): Promise<Cie10> {
    const { data: inserted, error } = await supabase
      .from(this.table)
      .insert(data)
      .select()
      .single();
    if (error) throw error;
    return inserted;
  }

  async put(id: number, data: Partial<Cie10>): Promise<Cie10> {
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
