import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Meta, Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { ErrorApi } from '../../../../cuenta/dominio/interfaces/sesion';
import { instanteEnGuayaquil } from '../../../aplicacion/fechas';
import { BusquedasAdminService } from '../../../aplicacion/servicios/BusquedasAdminService';
import { BusquedaSinResultados } from '../../../dominio/interfaces/busquedas-admin';

// Búsquedas sin resultados: lo que la gente escribió en la tienda y no encontró, de más a menos veces.
@Component({
  selector: 'app-admin-busquedas',
  imports: [RouterLink],
  templateUrl: './busquedas.html',
  styleUrl: './busquedas.css',
})
export class AdminBusquedas implements OnInit {
  private servicio = inject(BusquedasAdminService);
  private destroyRef = inject(DestroyRef);

  readonly instante = instanteEnGuayaquil;
  readonly periodos = [{ dias: 7, etiqueta: '7 días' }, { dias: 30, etiqueta: '30 días' }, { dias: 90, etiqueta: '90 días' }];

  dias = signal(30);
  busquedas = signal<BusquedaSinResultados[]>([]);
  cargando = signal(true);
  error = signal('');

  constructor() {
    inject(Title).setTitle('Búsquedas sin resultados | Panel de Jardín de Sele');
    inject(Meta).updateTag({ name: 'robots', content: 'noindex, nofollow' });
  }

  ngOnInit(): void {
    this.cargar();
  }

  elegir(dias: number): void {
    this.dias.set(dias);
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set('');
    this.servicio.sinResultados(this.dias()).pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.cargando.set(false))).subscribe({
      next: l => this.busquedas.set(l.data),
      error: (e: ErrorApi) => this.error.set(e.message),
    });
  }
}
