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
  favoritos = this.servicio.favoritos();

  enlaceWhatsapp = computed(() =>
    enlaceWhatsapp(`Hola 🌿 Busqué "${this.termino().trim()}" en la tienda y no lo encontré. ¿Me pueden ayudar?`));

  constructor() {
    // Las búsquedas no se indexan
    inject(Meta).updateTag({ name: 'robots', content: 'noindex, follow' });
  }

  escribir(valor: string): void {
    this.termino.set(valor);
    // La dirección guarda lo buscado (se puede compartir y el botón "atrás" no se llena de pasos)
    void this.router.navigate([], { queryParams: { q: valor.trim() || null }, replaceUrl: true });
  }
}
