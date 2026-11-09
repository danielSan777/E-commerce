import { DOCUMENT } from '@angular/common';
import { Injectable, inject, signal } from '@angular/core';

export interface Aviso { id: number; texto: string; tipo: 'exito' | 'error' }

// Mensajes flotantes ("Imagen subida.", "Categoría eliminada."): se ven sin importar cuánto se haya bajado en la página,
// y se cierran solos. No usan alert() del navegador, que bloquea la pantalla y no se puede dar estilo.
@Injectable({ providedIn: 'root' })
export class AvisosService {
    readonly lista = signal<Aviso[]>([]);
    private siguiente = 1;
    private document = inject(DOCUMENT);

    /**
     * Aviso general cuando un formulario no se puede enviar: faltan datos o hay datos incorrectos. Además lleva al primer
     * campo marcado en rojo (`aria-invalid="true"`). Cada pantalla marca sus campos; este aviso es el mismo en todas.
     */
    faltanDatos(): void {
        this.error('Faltan datos o hay datos incorrectos. Revisa los campos marcados en rojo.');
        setTimeout(() => {
            const campo = this.document.querySelector<HTMLElement>('[aria-invalid="true"]');
            campo?.scrollIntoView?.({ block: 'center', behavior: 'smooth' });
            campo?.focus?.({ preventScroll: true });
        });
    }

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
