// src/tables/ServicioMedico.ts

import { supabase } from "../../lib/supabase";
import { TratamientoMedicamento } from "./types";

export class TratamientoMedicamentoTable {
  private table = "tratamiento_medicamento";
  private pk = "id_tratamiento_medicamento";

  async get(
    id?: number
  ): Promise<TratamientoMedicamento[] | TratamientoMedicamento | null> {
    const query = supabase.from(this.table).select("*");
    const { data, error } = id
      ? await query.eq(this.pk, id).single()
      : await query;

    if (error) throw error;
    return data;
  }

  async post(data: TratamientoMedicamento): Promise<TratamientoMedicamento> {
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
    data: Partial<TratamientoMedicamento>
  ): Promise<TratamientoMedicamento> {
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
