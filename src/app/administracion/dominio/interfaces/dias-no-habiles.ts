export type TipoDiaNoHabil = 'national_holiday' | 'local_holiday' | 'closure';

export interface DiaNoHabil {
  date: string;                 // YYYY-MM-DD (fecha de Guayaquil)
  type: TipoDiaNoHabil;
  affects_production: boolean;
  affects_dispatch: boolean;
  affects_delivery: boolean;
  note: string | null;
}

/** Lo que Laravel responde al listar: los días y el dato para el aviso del año siguiente. */
export interface ListaDiasNoHabiles {
  data: DiaNoHabil[];
  meta: { next_year: number; national_holidays_next_year: number };
}

export interface DatosDiaNoHabil {
  date: string;
  end_date?: string | null;
  type: TipoDiaNoHabil;
  affects_production: boolean;
  affects_dispatch: boolean;
  affects_delivery: boolean;
  note: string | null;
}
