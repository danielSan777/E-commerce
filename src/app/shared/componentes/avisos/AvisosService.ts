import { Injectable, signal } from '@angular/core';

export interface Aviso { id: number; texto: string; tipo: 'exito' | 'error' }

// Mensajes flotantes ("Imagen subida.", "Categoría eliminada."): se ven sin importar cuánto se haya bajado en la página,
// y se cierran solos. No usan alert() del navegador, que bloquea la pantalla y no se puede dar estilo.
@Injectable({ providedIn: 'root' })
export class AvisosService {
    readonly lista = signal<Aviso[]>([]);
    private siguiente = 1;

    exito(texto: string, ms = 4500): void { this.mostrar(texto, 'exito', ms); }
    error(texto: string, ms = 8000): void { this.mostrar(texto, 'error', ms); }

    cerrar(id: number): void {
        this.lista.update(l => l.filter(a => a.id !== id));
    }

    private mostrar(texto: string, tipo: Aviso['tipo'], ms: number): void {
        const id = this.siguiente++;
        this.lista.update(l => [...l.slice(-2), { id, texto, tipo }]); // máximo 3 a la vez
        setTimeout(() => this.cerrar(id), ms);
    }
}
