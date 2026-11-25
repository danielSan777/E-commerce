export interface EventoDeCiclo {
  type: 'closed' | 'reopened' | 'capacity_changed';
  actor_name: string | null;
  at: string;                                             // instante UTC
  data: { from?: number | null; to?: number | null; committed?: number } | null;
}

export interface CicloAdmin {
  date: string;                                           // YYYY-MM-DD (ciclo de producción, Guayaquil)
  cutoff_at: string;                                      // instante UTC del corte
  dispatch_date: string;
  window: { start: string; end: string };
  paid: number;
  pending_transfer: number;
  card_in_progress: number;
  committed: number;
  capacity: number;
  tolerance_limit: number;
  remaining: number;
  closed: boolean;
  capacity_override: number | null;
  is_offered: boolean;                                    // el ciclo donde entra el siguiente pedido ahora mismo
  last_event: EventoDeCiclo | null;
}

export interface ListaCiclos {
  data: CicloAdmin[];
  meta: { nominal_capacity: number; tolerance: number; max_capacity: number };
}
