import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { VideoAuto } from '../../../../shared/directivas/video-auto';

/**
 * Banner de una campaña: lo usan la página principal y la vista previa del panel.
 * Es solo presentación: recibe los datos ya listos y no llama a ninguna API.
 * Con `cierre` en lugar de botón muestra el mensaje de despedida ("San Valentín regresará pronto").
 */
@Component({
  selector: 'app-campana-banner',
  imports: [RouterLink, VideoAuto],
  templateUrl: './campana-banner.html',
  styleUrl: './campana-banner.css',
})
export class CampanaBanner {
  readonly nombre = input.required<string>();
  readonly lema = input<string | null>(null);
  readonly frase = input<string | null>(null);
  readonly emoji = input<string | null>(null);
  readonly color = input<string | null>(null);
  /** Dirección de "Ver campaña". Sin ella (vista previa) el botón no es un enlace. */
  readonly enlace = input<string | null>(null);
  readonly foto = input<string | null>(null);
  readonly fotoAlt = input<string | null>(null);
  readonly video = input<string | null>(null);
  readonly videoPortada = input<string | null>(null);
  /** Mensaje de despedida: si existe, el banner está en modo "cierre" (sin botón). */
  readonly cierre = input<string | null>(null);

  /** Solo se aceptan colores #RRGGBB: cualquier otra cosa se ignora y queda el color de siempre. */
  readonly colorValido = computed(() => { const c = this.color(); return c && /^#[0-9a-f]{6}$/i.test(c) ? c : null; });
  readonly tinte = computed(() => { const c = this.colorValido(); return c ? `color-mix(in srgb, ${c} 14%, white)` : null; });
}
