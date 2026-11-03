import { Injectable } from '@angular/core';
import { nombresDeCantones, nombresDeProvincias } from '../../dominio/ubicaciones';

/*
 * Provincias y cantones que ve el comprador. Salen del archivo del INEC que vive dentro del proyecto
 * (dominio/datos/ubicaciones-inec.json), sin APIs externas.
 *
 * Es el único punto que usa la pantalla: cuando exista el backend, solo hay que cambiar este archivo.
 */
@Injectable({ providedIn: 'root' })
export class UbicacionesService {

    provincias(): string[] {
        return nombresDeProvincias();
    }

    cantones(provincia: string): string[] {
        return nombresDeCantones(provincia);
    }
}
