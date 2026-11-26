export interface BusquedaSinResultados {
  term: string;
  times: number;
  last_at: string;
}

export interface ListaBusquedasSinResultados {
  data: BusquedaSinResultados[];
  meta: { days: number };
}
