import { Component, PLATFORM_ID, computed, inject } from '@angular/core';
import { CurrencyPipe, isPlatformBrowser } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';
import { Meta, Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
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
  imports: [CurrencyPipe, RouterLink, VideoAuto],
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
  readonly colorCampana = computed(() => { const c = this.campana()?.theme.color; return c && /^#[0-9a-f]{6}$/i.test(c) ? c : null; });
  readonly tinteCampana = computed(() => { const c = this.colorCampana(); return c ? `color-mix(in srgb, ${c} 14%, white)` : null; });
  readonly portadaCampana = computed(() => { const s = this.campana()?.theme.cover?.srcset; return s ? (s['600'] ?? Object.values(s)[0] ?? null) : null; });
  readonly promesa = inject(PromesaService).promesa();
  readonly macetasEnvioGratis = inject(EnvioGratisService).MACETAS_PARA_ENVIO_GRATIS;
  readonly enlaceAyuda = enlaceWhatsapp();

  // Con "reducir movimiento" solo se ve la portada
  private reducirMovimiento = isPlatformBrowser(inject(PLATFORM_ID))
    && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  // Portada elegida en el panel (imagen o video); null = se usa la imagen de siempre.
  readonly portada = toSignal(inject(PortadaInicioService).portada(), { initialValue: null });
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

  constructor() {
    inject(Title).setTitle('Jardín de Sele | Macetas personalizadas con plantita natural');
    inject(Meta).updateTag({
      name: 'description',
      content: 'Regalos personalizados con su nombre y una plantita natural. Envíos a todo Ecuador.',
    });
  }
}
