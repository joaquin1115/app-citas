import { Cie10, Diagnostico, Morbilidad, Sintoma } from "../tables/types";

export type DiagnosticoData = {
  diagnostico: Diagnostico;
  morbilidad: Morbilidad;
  cie10: Cie10;
  sintomas: Sintoma[];
};
