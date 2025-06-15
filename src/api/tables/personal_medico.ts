// src/tables/ServicioMedico.ts

import { supabase } from "../../lib/supabase";
import { PersonalMedico } from "./types";

export class PersonalMedicoTable {
  private table = "personal_medico";
  private pk = "id_personal_medico";

  async get(id?: number): Promise<PersonalMedico[] | PersonalMedico | null> {
    const query = supabase.from(this.table).select("*");
    const { data, error } = id
      ? await query.eq(this.pk, id).single()
      : await query;

    if (error) throw error;
    return data;
  }

  async post(data: PersonalMedico): Promise<PersonalMedico> {
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
    data: Partial<PersonalMedico>
  ): Promise<PersonalMedico> {
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

  async getByPersonaId(id_persona: number): Promise<PersonalMedico> {
    const { data, error } = await supabase
      .from(this.table)
      .select("*")
      .eq("id_persona", id_persona)
      .single(); // Suponiendo que un id_persona tiene solo un personal_medico

    if (error) throw error;
    return data;
  }
}
