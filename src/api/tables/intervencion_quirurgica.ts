// src/tables/ServicioMedico.ts

import { supabase } from "../../lib/supabase";
import { IntervencionQuirurgica } from "./types";

export class IntervencionQuirurgicaTable {
  private table = "intervencion_quirurgica";
  private pk = "id_intervencion";

  async get(
    id?: number
  ): Promise<IntervencionQuirurgica[] | IntervencionQuirurgica | null> {
    const query = supabase.from(this.table).select("*");
    const { data, error } = id
      ? await query.eq(this.pk, id).single()
      : await query;

    if (error) throw error;
    return data;
  }

  async post(data: IntervencionQuirurgica): Promise<IntervencionQuirurgica> {
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
    data: Partial<IntervencionQuirurgica>
  ): Promise<IntervencionQuirurgica> {
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
