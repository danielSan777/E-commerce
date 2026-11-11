import { Component, PLATFORM_ID, computed, effect, inject, signal } from '@angular/core';
import { CurrencyPipe, isPlatformBrowser } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';
import { Meta, Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { CampanaBanner } from '../../../../campanas/presentacion/componentes/campana-banner/campana-banner';
import { CampanaService } from '../../../../campanas/aplicacion/servicios/CampanaService';
import { CategoriaService } from '../../../../categorias/aplicacion/servicios/CategoriaService';
import { PromesaService } from '../../../../checkout/aplicacion/servicios/PromesaService';
import { EnvioGratisService } from '../../../../catalogo/aplicacion/servicios/EnvioGratisService';
import { enlaceWhatsapp } from '../../../../core/configuracion/tienda';
import { PortadaInicioService } from '../../../aplicacion/servicios/PortadaInicioService';
import { VideoAuto } from '../../../../shared/directivas/video-auto';

// Página principal (/), de arriba hacia abajo en el celular: video, promesa, campaña en temporada (si hay), categorías, favoritos,
// cómo funciona y confianza. Testimonios llegan cuando Josué entregue sus datos.
@Component({
  selector: 'app-inicio',
  imports: [CurrencyPipe, RouterLink, VideoAuto, CampanaBanner],
  templateUrl: './inicio.html',
  styleUrl: './inicio.css',
})
export class Inicio {

  // ===== EDITABLES =====
  readonly RUTA_CATEGORIAS = '/categorias';
  // Imagen de siempre: se ve mientras el administrador no elija una portada propia (imagen o video) en el panel.
  readonly IMAGEN_DE_SIEMPRE = 'imagenes/doctor3D.png';
  readonly PASOS = [
    { icono: 'bi-search-heart', titulo: 'Elige', texto: 'Escoge la maceta que más se parece a esa persona.' },
    { icono: 'bi-magic', titulo: 'Personaliza', texto: 'Agrega su nombre, accesorios y una dedicatoria.' },
    { icono: 'bi-box2-heart', titulo: 'Recíbelo', texto: 'Llega a tu puerta con su plantita natural.' },
  ];
  readonly CONFIANZA = [
    { icono: 'bi-shield-check', texto: 'Pago seguro con tarjeta o transferencia' },
    { icono: 'bi-truck', texto: 'Envíos a todo Ecuador por Servientrega (excepto Galápagos)' },
    { icono: 'bi-geo-alt', texto: 'Hecho en Guayaquil' },
  ];

  private catalogo = inject(CategoriaService);
  readonly categorias = toSignal(this.catalogo.categorias().pipe(catchError(() => of([]))), { initialValue: [] });
  readonly favoritos = toSignal(this.catalogo.favoritos().pipe(catchError(() => of([]))), { initialValue: [] });
  // Campaña en temporada hoy (la decide Laravel con la fecha de Guayaquil): null = no se muestra el banner.
  readonly campana = toSignal(inject(CampanaService).vigente().pipe(catchError(() => of(null))), { initialValue: null });
  /** Color de la campaña si es un #RRGGBB válido; si no, el banner usa el color de la tienda. */
  readonly portadaCampana = computed(() => { const s = this.campana()?.theme.cover?.srcset; return s ? (s['600'] ?? Object.values(s)[0] ?? null) : null; });
  readonly promesa = inject(PromesaService).promesa();
  readonly macetasEnvioGratis = inject(EnvioGratisService).MACETAS_PARA_ENVIO_GRATIS;
  readonly enlaceAyuda = enlaceWhatsapp();

  // Con "reducir movimiento" solo se ve la portada
  private reducirMovimiento = isPlatformBrowser(inject(PLATFORM_ID))
    && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  // Portadas elegidas en el panel (imágenes y videos, sin límite); lista vacía = se usa la imagen de siempre.
  // Con una sola, el video va en bucle; con varias se muestran una tras otra (el video al terminar, la imagen a los 6 s).
  // null = todavía cargando: no se muestra nada (así no parpadea la imagen de siempre antes de que llegue la portada elegida)
  private readonly portadasCargadas = toSignal(inject(PortadaInicioService).portadas(), { initialValue: null });
  readonly portadas = computed(() => this.portadasCargadas() ?? []);
  readonly indice = signal(0);
  readonly portada = computed(() => { const l = this.portadas(); return l.length ? l[this.indice() % l.length] : null; });
  /** Lista de un solo elemento (la portada, o la imagen de siempre): así hay un único medio en pantalla y Angular recrea el <video> al pasar a la siguiente. */
  readonly actual = computed(() => this.portadasCargadas() === null ? [] : [this.portada() ?? 'siempre']);
  readonly variasPortadas = computed(() => this.portadas().length > 1);
  readonly videoPortada = computed(() => { const p = this.portada(); return p?.type === 'video' ? p : null; });
  verVideo = computed(() => !!this.videoPortada() && !this.reducirMovimiento);
  /** Imagen de la portada: la foto elegida, la portada del video, o la de siempre. */
  readonly imagenPortada = computed(() => {
    const p = this.portada();
    if (p?.type === 'image') return p.srcset['1080'] ?? Object.values(p.srcset)[0] ?? this.IMAGEN_DE_SIEMPRE;
    if (p?.type === 'video') return p.poster ?? this.IMAGEN_DE_SIEMPRE;
    return this.IMAGEN_DE_SIEMPRE;
  });
  readonly altPortada = computed(() => { const p = this.portada(); return p?.type === 'image' ? (p.alt ?? '') : ''; });

  siguiente(): void { this.indice.update(i => (i + 1) % Math.max(this.portadas().length, 1)); }
  irA(i: number): void { this.indice.set(i); }

  constructor() {
    // Imagen suelta (o video con "reducir movimiento"): pasa sola a la siguiente a los 6 s
    if (isPlatformBrowser(inject(PLATFORM_ID))) {
      effect(onCleanup => {
        if (!this.variasPortadas()) return;
        this.indice();
        if (this.verVideo()) return; // el video avisa al terminar
        const temporizador = setTimeout(() => this.siguiente(), 6000);
        onCleanup(() => clearTimeout(temporizador));
      });
    }
    inject(Title).setTitle('Jardín de Sele | Macetas personalizadas con plantita natural');
    inject(Meta).updateTag({
      name: 'description',
      content: 'Regalos personalizados con su nombre y una plantita natural. Envíos a todo Ecuador.',
    });
  }
}
