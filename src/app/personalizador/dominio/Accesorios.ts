export type ComportamientoAccesorio = 'lentes' | 'gafas' | 'marco_foto' | 'marco_frase';

export interface Accesorio {

  id: number;

  nombre: string;

  imagen: string;

  tipo?: 'imagen' | 'texto';

  texto?: string;

  categoria?: string;

  /** Comportamiento especial que reconoce el personalizador (lo marca el administrador en el accesorio). */
  comportamiento?: ComportamientoAccesorio | null;

}



export interface AccesorioColocado {

  id: number;

  accesorioId: number;

  nombre: string;

  imagen: string;

  x: number;

  y: number;

  ancho: number;

  alto: number;

  tipo?: 'imagen' | 'texto';

  texto?: string;

  rotX?: number; rotY?: number; rotZ?: number; // grados

  espejo?: boolean;

  categoria?: string;

  ubicacionId?: number

}

