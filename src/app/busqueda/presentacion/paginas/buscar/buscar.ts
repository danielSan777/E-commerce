import { AnalyticsService } from '../../../../core/seguimiento/AnalyticsService';
import { Component, computed, inject, signal } from '@angular/core';
import { CurrencyPipe, NgTemplateOutlet } from '@angular/common';
import { Meta } from '@angular/platform-browser';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { BusquedaService } from '../../../aplicacion/servicios/BusquedaService';
import { enlaceWhatsapp } from '../../../../core/configuracion/tienda';

// Búsqueda (/buscar?q=...): resultados mientras se escribe. Sin resultados: favoritos y salidas a categorías y WhatsApp.
@Component({
  selector: 'app-buscar',
  imports: [CurrencyPipe, NgTemplateOutlet, RouterLink],
  templateUrl: './buscar.html',
  styleUrl: './buscar.css',
})
export class Buscar {
  readonly RUTA_CATEGORIAS = '/categorias';

  private servicio = inject(BusquedaService);
  private router = inject(Router);

  termino = signal(inject(ActivatedRoute).snapshot.queryParamMap.get('q') ?? '');
  resultados = computed(() => (this.termino().trim() ? this.servicio.buscar(this.termino()) : []));
  buscando = computed(() => !!this.termino().trim());
  sinResultados = computed(() => this.buscando() && this.resultados().length === 0);
  favoritos = computed(() => this.servicio.favoritos());

  enlaceWhatsapp = computed(() =>
    enlaceWhatsapp(`Hola 🌿 Busqué "${this.termino().trim()}" en la tienda y no lo encontré. ¿Me pueden ayudar?`));

  constructor() {
    // Las búsquedas no se indexan
    inject(Meta).updateTag({ name: 'robots', content: 'noindex, follow' });
  }

  private analytics = inject(AnalyticsService);
  private temporizador: ReturnType<typeof setTimeout> | null = null;

  escribir(valor: string): void {
    this.termino.set(valor);
    // Un solo evento cuando la persona deja de escribir (término y cantidad de resultados)
    if (this.temporizador) clearTimeout(this.temporizador);
    if (valor.trim()) this.temporizador = setTimeout(() =>
      this.analytics.track('search', { search_term: valor.trim(), results_count: this.resultados().length }), 800);
    // La dirección guarda lo buscado (se puede compartir y el botón "atrás" no se llena de pasos)
    void this.router.navigate([], { queryParams: { q: valor.trim() || null }, replaceUrl: true });
  }
}
