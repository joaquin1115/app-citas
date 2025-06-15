// src/tables/ServicioMedico.ts

import { supabase } from "../../lib/supabase";
import { Control } from "./types";

export class ControlTable {
  private table = "control";

  async get(id?: number): Promise<Control[] | Control | null> {
    const query = supabase.from(this.table).select("*");
    const { data, error } = id
      ? await query.eq("id_control", id).single()
      : await query;

    if (error) throw error;
    return data;
  }

  async post(data: Control | Control[]): Promise<Control> {
    const { data: inserted, error } = await supabase
      .from(this.table)
      .insert(data)
      .select()
      .single();
    if (error) throw error;
    return inserted;
  }

  async put(id: number, data: Partial<Control>): Promise<Control> {
    const { data: updated, error } = await supabase
      .from(this.table)
      .update(data)
      .eq("id_control", id)
      .select()
      .single();
    if (error) throw error;
    return updated;
  }

  async delete(id: number): Promise<{ success: boolean }> {
    const { error } = await supabase
      .from(this.table)
      .delete()
      .eq("id_control", id);
    if (error) throw error;
    return { success: true };
  }
}
