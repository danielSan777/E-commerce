import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Meta, Title } from '@angular/platform-browser';
import { CdkDrag, CdkDragDrop, CdkDragPreview, CdkDropList } from '@angular/cdk/drag-drop';
import { Observable } from 'rxjs';
import { AvisosService } from '../../../../shared/componentes/avisos/AvisosService';
import { Accesorio, AccesorioColocado } from '../../../../personalizador/dominio/Accesorios';
import { ConfigUbicacion, Ubicacion, configInicial } from '../../../../personalizador/dominio/ubicaciones';
import { ErrorApi } from '../../../../cuenta/dominio/interfaces/sesion';
import { CategoriasAdminService } from '../../../aplicacion/servicios/CategoriasAdminService';
import { ConfiguradorAdminService } from '../../../aplicacion/servicios/ConfiguradorAdminService';
import {
  EstadoEditor, accesorioDelEditor, configParaGuardar, configVacia, errorDeUbicacionesFijas, estadoDesdeApi,
} from '../../../aplicacion/configurador-editor';
import { CategoriaAdmin } from '../../../dominio/interfaces/categoria-admin';
import {
  AjusteImagenAdmin, ConfigGuardableAdmin, ConfigLeidaAdmin, ConfiguracionDeCategoriaAdmin, ConfiguracionDeProductoAdmin,
} from '../../../dominio/interfaces/configurador-admin';
import { TextoCanvas } from '../../directivas/texto-canvas';

// Valores que se pueden escribir a mano en el panel de ajustes
type CampoEditable = 'ancho' | 'alto' | 'rotX' | 'rotY' | 'rotZ';

/**
 * Configurador del administrador: dónde va cada accesorio sobre la maceta (ubicaciones, valores por defecto y
 * excepciones). Es el editor del prototipo VentaPruebaApp, pero lo que se guarda y lo que se muestra sale de la base
 * de datos (accesorios, ubicaciones y configuración). La configuración es de una CATEGORÍA (la comparten todos sus
 * productos) o de un PRODUCTO que tiene la suya propia. Laravel valida las reglas; aquí solo se arma el editor.
 */
@Component({
  selector: 'app-admin-configurador',
  imports: [CdkDrag, CdkDropList, CdkDragPreview, FormsModule, RouterLink, TextoCanvas],
  templateUrl: './configurador.html',
  styleUrl: './configurador.css',
})
export class AdminConfigurador implements OnInit {
  private servicio = inject(ConfiguradorAdminService);
  private categoriasServicio = inject(CategoriasAdminService);
  private avisos = inject(AvisosService);
  private ruta = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);

  constructor() {
    inject(Title).setTitle('Configurador | Panel de Jardín de Sele');
    inject(Meta).updateTag({ name: 'robots', content: 'noindex, nofollow' });
  }

  // ==========================================
  // ALCANCE: categoría o producto
  // ==========================================

  categoriasDeProductos = signal<CategoriaAdmin[]>([]);
  categoriaSlug = signal('');
  productoSku = signal('');

  cargando = signal(true);
  guardando = signal(false);
  error = signal('');
  detalle = signal<string[]>([]);

  categoria = signal<ConfiguracionDeCategoriaAdmin | null>(null);
  producto = signal<ConfiguracionDeProductoAdmin | null>(null);

  /** Hay algo que editar: la categoría, o un producto con configuración propia. */
  editable = computed(() => {
    if (!this.categoria()) return false;
    if (!this.productoSku()) return true;
    return !!this.producto()?.uses_own_configurator;
  });

  /** Productos de la categoría que tienen la suya propia. */
  conPropia = computed(() => (this.categoria()?.products ?? []).filter(p => p.uses_own_configurator).length);

  /** Producto elegido (de la lista de la categoría, disponible antes de cargar su configuración). */
  productoElegido = computed(() => (this.categoria()?.products ?? []).find(p => p.sku === this.productoSku()) ?? null);

  /**
   * Foto base del visor: la imagen para personalizar del producto elegido o, con «toda la categoría», la del primer
   * producto que ya la tenga. Si ninguno la tiene se usa la maceta genérica y se avisa.
   */
  imagenBase = computed(() => {
    const productos = this.categoria()?.products ?? [];
    const propia = this.productoElegido()?.base_image;
    return propia ?? (this.productoSku() ? null : productos.find(p => p.base_image)?.base_image) ?? null;
  });
  imagenBaseVisor = computed(() => this.imagenBase() ?? '/imagenes/maceta_vacia.png');

  // ----- encuadre de la foto: se mueve la foto (no los accesorios) para que coincida con las demás de la categoría
  /** Lo que se está moviendo con los deslizadores del producto elegido (aún sin guardar). */
  ajusteEditado = signal<AjusteImagenAdmin | null>(null);
  guardandoAjuste = signal(false);
  readonly ajusteNeutro: AjusteImagenAdmin = { scale: 100, x: 0, y: 0 };

  /** El encuadre que se ve: el que se está moviendo o, con «toda la categoría», el del producto cuya foto se muestra. */
  ajusteBase = computed<AjusteImagenAdmin>(() => {
    if (this.productoSku()) return this.ajusteEditado() ?? this.productoElegido()?.base_adjust ?? this.ajusteNeutro;
    return (this.categoria()?.products ?? []).find(p => p.base_image)?.base_adjust ?? this.ajusteNeutro;
  });
  transformBase = computed(() => `translate(${this.ajusteBase().x}%, ${this.ajusteBase().y}%) scale(${this.ajusteBase().scale / 100})`);
  ajusteGuardado = computed(() => this.productoElegido()?.base_adjust ?? this.ajusteNeutro);
  ajusteSinGuardar = computed(() => {
    const a = this.ajusteBase(), g = this.ajusteGuardado();
    return a.scale !== g.scale || a.x !== g.x || a.y !== g.y;
  });
  /** Cajas de las ubicaciones con valores: sirven de guía para alinear la foto cuando no se edita la configuración. */
  guiasDeUbicaciones = computed(() => this.accesoriosColocados().filter(a => a.accesorioId === 0));

  cambiarAjuste(campo: keyof AjusteImagenAdmin, valor: number): void {
    const rango = campo === 'scale' ? [50, 200] : [-50, 50];
    const v = Math.min(rango[1], Math.max(rango[0], Number.isFinite(valor) ? valor : (campo === 'scale' ? 100 : 0)));
    this.ajusteEditado.set({ ...this.ajusteBase(), [campo]: v });
  }

  reiniciarAjuste(): void {
    this.ajusteEditado.set({ ...this.ajusteNeutro });
  }

  guardarAjuste(): void {
    const sku = this.productoSku();
    if (!sku) return;
    this.guardandoAjuste.set(true);
    this.limpiarMensajes();
    this.servicio.ajustarImagenBase(sku, this.ajusteBase()).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: p => {
        this.guardandoAjuste.set(false);
        this.producto.update(actual => actual && actual.sku === p.sku ? { ...actual, base_adjust: p.base_adjust } : actual);
        this.categoria.update(c => c && ({ ...c, products: c.products.map(x => x.sku === p.sku ? { ...x, base_adjust: p.base_adjust } : x) }));
        this.ajusteEditado.set(null);
        this.avisos.exito('El encuadre de la imagen se guardó correctamente.');
      },
      error: e => { this.guardandoAjuste.set(false); this.fallo(e); },
    });
  }

  pidiendoVaciar = signal(false);

  ngOnInit(): void {
    this.categoriasServicio.listar().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: lista => {
        this.categoriasDeProductos.set(lista);
        this.abrirDesdeLaDireccion();
      },
      error: e => this.fallo(e),
    });
  }

  /** `?producto=SKU` o `?categoria=slug`: se llega desde la lista de productos o desde el panel. */
  private abrirDesdeLaDireccion(): void {
    const params = this.ruta.snapshot.queryParamMap;
    const sku = params.get('producto');
    const slug = params.get('categoria');

    if (sku) {
      this.servicio.deProducto(sku).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: p => {
          this.categoriaSlug.set(p.category_slug ?? '');
          this.cargarCategoria(p.category_slug ?? '', () => this.elegirProducto(sku));
        },
        error: e => this.fallo(e),
      });
    } else if (slug) {
      this.elegirCategoria(slug);
    } else {
      this.cargando.set(false);
    }
  }

  elegirCategoria(slug: string): void {
    this.categoriaSlug.set(slug);
    this.productoSku.set('');
    this.producto.set(null);
    this.categoria.set(null);
    this.limpiarMensajes();
    if (!slug) { this.cargando.set(false); return; }
    this.cargarCategoria(slug);
  }

  private cargarCategoria(slug: string, despues?: () => void): void {
    this.cargando.set(true);
    this.servicio.deCategoria(slug).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: c => {
        this.categoria.set(c);
        this.cargarAccesorios(c.config, () => { this.cargando.set(false); despues?.(); });
      },
      error: e => this.fallo(e),
    });
  }

  /** '' = la configuración de toda la categoría. */
  elegirProducto(sku: string): void {
    this.productoSku.set(sku);
    this.ajusteEditado.set(null);
    this.producto.set(null);
    this.limpiarMensajes();
    const cat = this.categoria();
    if (!cat) return;

    if (!sku) {
      this.cargarAccesorios(cat.config);
      return;
    }
    this.cargando.set(true);
    this.servicio.deProducto(sku).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: p => {
        this.producto.set(p);
        // Siempre se carga: con configuración de la categoría sirve de guía para encuadrar la foto de este producto
        this.cargarAccesorios(p.config, () => this.cargando.set(false));
      },
      error: e => this.fallo(e),
    });
  }

  /** Marca si el producto usa la configuración de su categoría o tiene la suya propia. */
  cambiarModo(propia: boolean, copiar = false): void {
    const sku = this.productoSku();
    if (!sku) return;
    this.guardando.set(true);
    this.limpiarMensajes();
    this.servicio.cambiarModo(sku, propia, copiar).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: p => {
        this.producto.set(p);
        this.actualizarProductoEnLista(p);
        this.guardando.set(false);
        this.avisos.exito(propia ? 'El producto ahora tiene su propia configuración.' : 'El producto vuelve a usar la configuración de su categoría.');
        if (propia) this.cargarAccesorios(p.config);
      },
      error: e => this.fallo(e),
    });
  }

  private actualizarProductoEnLista(p: ConfiguracionDeProductoAdmin): void {
    this.categoria.update(c => c && ({
      ...c,
      products: c.products.map(x => x.sku === p.sku ? { ...x, uses_own_configurator: p.uses_own_configurator } : x),
    }));
  }

  // ==========================================
  // CARGA Y GUARDADO
  // ==========================================

  private cargarAccesorios(config: ConfigLeidaAdmin, despues?: () => void): void {
    this.servicio.accesorios().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: lista => {
        // Se ofrecen los activos (y los marcados aunque se hayan desactivado, para no perderlos al guardar)
        const visibles = lista.filter(a => a.is_active || config.accessory_ids.includes(a.id)).map(accesorioDelEditor);
        this.accesorios.set(visibles);
        this.aplicarEstado(estadoDesdeApi(config, visibles));
        despues?.();
      },
      error: e => this.fallo(e),
    });
  }

  private aplicarEstado(e: EstadoEditor): void {
    this.ubicaciones.set(e.ubicaciones);
    this.configUbicaciones.set(Object.keys(e.configUbicaciones).length ? e.configUbicaciones : configInicial());
    this.accesoriosColocados.set(e.colocados);
    this.idsMarcados.set(e.idsMarcados);
    this.ubicacionesGuardadas.set(e.ubicacionesGuardadas);
    this.siguienteId = e.siguienteId;
    this.tamanosIniciales.clear();
    e.colocados.forEach(c => this.tamanosIniciales.set(c.id, { ancho: c.ancho, alto: c.alto }));

    this.vistaId.set(null);
    this.accesorioSeleccionadoId.set(null);
    this.rotacion.set({ rotX: 0, rotY: 0, rotZ: 0 });
    this.espejo.set(false);
    this.ubicacionActual.set(e.ubicaciones[0]?.id ?? 0);
    const validas = this.categorias();
    this.categoriaActual.set(validas.length === 1 ? validas[0] : '');
  }

  async guardarConfiguracion(): Promise<void> {
    // Una ubicación fija necesita su elemento fijo y sus valores
    const falta = errorDeUbicacionesFijas(this.ubicaciones(), this.configUbicaciones(), this.accesoriosColocados());
    if (falta) {
      this.avisos.error(falta);
      return;
    }

    this.guardar(configParaGuardar(this.ubicaciones(), this.configUbicaciones(), this.accesoriosColocados(), this.idsMarcados()), 'La configuración se guardó correctamente.');
  }

  /** Deja la configuración sin nada (ubicaciones libres y sin valores, ningún accesorio marcado). */
  vaciarConfiguracion(): void {
    this.pidiendoVaciar.set(false);
    this.guardar(configVacia(this.ubicaciones()), 'La configuración quedó vacía.');
  }

  private guardar(config: ConfigGuardableAdmin, mensaje: string): void {
    this.guardando.set(true);
    this.limpiarMensajes();
    const sku = this.productoSku();
    const peticion: Observable<ConfiguracionDeCategoriaAdmin | ConfiguracionDeProductoAdmin> = sku
      ? this.servicio.guardarDeProducto(sku, config)
      : this.servicio.guardarDeCategoria(this.categoriaSlug(), config);

    peticion.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: r => {
        this.guardando.set(false);
        this.avisos.exito(mensaje);
        if (r.scope === 'product') this.producto.set(r); else this.categoria.set(r);
        this.cargarAccesorios(r.config);
      },
      error: e => this.fallo(e),
    });
  }

  private fallo(e: unknown): void {
    const api = e as ErrorApi;
    this.cargando.set(false);
    this.guardando.set(false);
    this.error.set(api?.message ?? 'No se pudo completar la acción. Inténtalo de nuevo.');
    const errores = (api as { errors?: Record<string, string[]> })?.errors;
    this.detalle.set(errores ? Object.values(errores).flat() : []);
  }

  private limpiarMensajes(): void {
    this.error.set('');
    this.detalle.set([]);
  }

  // ==========================================
  // EDITOR (el del prototipo: ubicaciones, valores, excepciones)
  // ==========================================

  private rectPreview: DOMRect | null = null;

  accesorioSeleccionadoId = signal<number | null>(null);

  // Ubicaciones (cabeza, pie izquierdo...): vienen de la base de datos
  ubicaciones = signal<Ubicacion[]>([]);

  // Ubicación donde se coloca el próximo accesorio que se agregue
  ubicacionActual = signal(0);

  nombreUbicacionActual = computed(
    () => this.ubicaciones().find(u => u.id === this.ubicacionActual())?.nombre ?? ''
  );

  // Valores de cada ubicación: estado (libre / fija / deshabilitada), prioridad, capa y elemento fijo
  configUbicaciones = signal<Record<number, ConfigUbicacion>>({});

  configActual = computed<ConfigUbicacion>(
    () => this.configUbicaciones()[this.ubicacionActual()] ?? { estado: 'libre', prioridad: 1, capa: 1, fijoId: null }
  );

  cambiarConfig<K extends keyof ConfigUbicacion>(campo: K, valor: ConfigUbicacion[K]): void {
    const id = this.ubicacionActual();

    this.configUbicaciones.update(c => {
      const nueva = { ...c[id], [campo]: valor } as ConfigUbicacion;

      // Solo una ubicación fija tiene elemento fijo
      if (campo === 'estado' && valor !== 'fija') nueva.fijoId = null;

      return { ...c, [id]: nueva };
    });
  }

  // Accesorio que se está viendo en la ubicación activa (sirve para calibrar los valores)
  vistaId = signal<number | null>(null);

  accesorioEnVista = computed(() => {
    const c = this.configActual();
    return c.estado === 'fija' && c.fijoId ? c.fijoId : this.vistaId();
  });

  alternarVista(accesorioId: number): void {
    this.vistaId.update(v => (v === accesorioId ? null : accesorioId));
  }

  // Valores por defecto de la ubicación activa (el cuadro punteado del visor)
  presetActual = computed(() =>
    this.accesoriosColocados().find(
      a => a.accesorioId === 0 && a.ubicacionId === this.ubicacionActual()
    )
  );

  // Ubicaciones cuyos valores ya se guardaron con el botón "Guardar valores de la ubicación".
  // Solo entonces se muestran la categoría y los accesorios para elegir.
  ubicacionesGuardadas = signal<number[]>([]);

  valoresGuardados = computed(() => this.ubicacionesGuardadas().includes(this.ubicacionActual()));

  // Vista previa: el accesorio en vista, dibujado con los valores de la ubicación
  // (si ya tiene excepción, se ve la excepción en su lugar)
  vistaPrevia = computed<AccesorioColocado | null>(() => {
    const id = this.accesorioEnVista();
    const preset = this.presetActual();

    if (id === null || !preset || this.excepcionDe(id)) return null;

    const accesorio = this.accesorios().find(a => a.id === id);
    if (!accesorio) return null;

    return {
      ...preset,
      id: -1,
      accesorioId: accesorio.id,
      nombre: accesorio.nombre,
      imagen: accesorio.imagen,
      tipo: accesorio.tipo ?? 'imagen',
      texto: accesorio.texto,
    };
  });

  porcentajeAncho = signal(23.3);
  porcentajeAlto = signal(18);

  // Rotación del accesorio seleccionado (en grados)
  rotacion = signal({ rotX: 0, rotY: 0, rotZ: 0 });

  // Modo espejo del accesorio seleccionado (voltea izquierda <-> derecha)
  espejo = signal(false);

  // ----- Accesorios disponibles (de la base de datos)
  accesorios = signal<Accesorio[]>([]);

  // ----- Cuadros colocados en el visor: valores de las ubicaciones (accesorioId 0) y excepciones
  accesoriosColocados = signal<AccesorioColocado[]>([]);

  // ----- Categorías y selección de accesorios

  // Categoría elegida en la lista desplegable ('' = ninguna)
  categoriaActual = signal('');

  // Si la ubicación activa solo admite ciertas categorías, solo se muestran esas
  // (ubicación con "categorias": solo esas; con "excluidas": todas menos esas)
  categoriaPermitida(categoria: string): boolean {
    const u = this.ubicaciones().find(x => x.id === this.ubicacionActual());

    if (u?.categorias) return u.categorias.includes(categoria);
    if (u?.excluidas) return !u.excluidas.includes(categoria);
    return true;
  }

  // Categorías disponibles (sin repetir, en el orden en que aparecen)
  categorias = computed(() =>
    [...new Set(this.accesorios().map(a => a.categoria ?? 'Otros'))]
      .filter(c => this.categoriaPermitida(c))
  );

  // Accesorios de la categoría elegida
  accesoriosDeCategoria = computed(() =>
    this.accesorios().filter(a => (a.categoria ?? 'Otros') === this.categoriaActual())
  );

  // Ids marcados con el check (de todas las categorías), en el orden en que se marcaron
  idsMarcados = signal<number[]>([]);

  // Accesorios marcados: son las tarjetas que se muestran en el panel
  accesoriosMarcados = computed(() =>
    this.idsMarcados()
      .map(id => this.accesorios().find(a => a.id === id))
      .filter((a): a is Accesorio => !!a)
  );

  // Marcados que se pueden usar en la ubicación activa (según sus categorías permitidas)
  marcadosDeUbicacion = computed(() =>
    this.accesoriosMarcados().filter(a => this.categoriaPermitida(a.categoria ?? 'Otros'))
  );

  estaMarcado(id: number): boolean {
    return this.idsMarcados().includes(id);
  }

  alternarMarcado(accesorio: Accesorio, marcado: boolean): void {
    if (marcado) {
      this.idsMarcados.update(ids =>
        ids.includes(accesorio.id) ? ids : [...ids, accesorio.id]
      );
    } else {
      // Al desmarcar también sale del visor (si estaba colocado)
      this.eliminarPorTipo(accesorio.id);
      this.idsMarcados.update(ids => ids.filter(i => i !== accesorio.id));
    }
  }

  // ----- Número de cada cuadro del visor
  private siguienteId = 1;

  // Tamaño con el que se colocó cada cuadro (para el botón "Reiniciar")
  private tamanosIniciales = new Map<number, { ancho: number; alto: number }>();

  // Crea un id nuevo y recuerda el tamaño inicial del cuadro
  private nuevoId(ancho: number, alto: number): number {
    const id = this.siguienteId++;
    this.tamanosIniciales.set(id, { ancho, alto });
    return id;
  }

  registrarPreview(): void {
    const preview = document.querySelector('.cdk-drag-preview');
    if (preview) {
      this.rectPreview = preview.getBoundingClientRect();
    }
  }

  soltarAccesorio(event: CdkDragDrop<AccesorioColocado[]>): void {

    // Si viene del mismo visor, no crear otro accesorio
    if (event.previousContainer === event.container) {
      return;
    }

    const accesorio = event.item.data as Accesorio;

    // Soltar un accesorio en el visor crea una excepción en la ubicación activa
    const preset = this.presetParaExcepcion(accesorio);

    if (!preset) {
      this.rectPreview = null;
      return;
    }

    // Zona de drop (cubre todo el visor)
    const rect = event.container.element.nativeElement.getBoundingClientRect();

    // Tamaño de la excepción: el de la ubicación (después se puede ajustar)
    const anchoPx = rect.width * preset.ancho / 100;
    const altoPx = rect.height * preset.alto / 100;

    // Posición en PÍXELES, relativa al visor
    let xPx: number;
    let yPx: number;

    if (this.rectPreview) {
      // Donde el usuario vio el preview mientras arrastraba
      xPx = this.rectPreview.left - rect.left;
      yPx = this.rectPreview.top - rect.top;
    } else {
      // Respaldo: centrar el accesorio en el cursor
      xPx = event.dropPoint.x - rect.left - anchoPx / 2;
      yPx = event.dropPoint.y - rect.top - altoPx / 2;
    }

    this.rectPreview = null;

    // Limitar para que no quede fuera del visor
    xPx = Math.min(Math.max(xPx, 0), rect.width - anchoPx);
    yPx = Math.min(Math.max(yPx, 0), rect.height - altoPx);

    // Convertir a PORCENTAJE
    const x = +((xPx / rect.width) * 100).toFixed(2);
    const y = +((yPx / rect.height) * 100).toFixed(2);

    this.agregarExcepcion(accesorio, preset, x, y);
  }

  iniciarArrastre(event: PointerEvent, a: AccesorioColocado): void {
    event.preventDefault();

    const el = event.currentTarget as HTMLElement;
    const visor = el.closest('.visor') as HTMLElement;

    if (!visor) return;

    const rect = visor.getBoundingClientRect();

    // Posición actual en píxeles
    const xPixel = (a.x / 100) * rect.width;
    const yPixel = (a.y / 100) * rect.height;

    // Mantener el punto exacto donde agarraste el accesorio
    const offsetX = event.clientX - rect.left - xPixel;
    const offsetY = event.clientY - rect.top - yPixel;

    el.setPointerCapture(event.pointerId);

    const mover = (e: PointerEvent) => {
      const r = visor.getBoundingClientRect();

      // Tamaño del accesorio en píxeles
      const anchoPixel = (a.ancho / 100) * r.width;
      const altoPixel = (a.alto / 100) * r.height;

      // Nueva posición en píxeles
      let x = e.clientX - r.left - offsetX;
      let y = e.clientY - r.top - offsetY;

      // Limitar al visor
      x = Math.max(0, Math.min(x, r.width - anchoPixel));
      y = Math.max(0, Math.min(y, r.height - altoPixel));

      // Convertir a porcentajes
      const xPorcentaje = (x / r.width) * 100;
      const yPorcentaje = (y / r.height) * 100;

      this.accesoriosColocados.update(lista =>
        lista.map(i =>
          i.id === a.id
            ? { ...i, x: xPorcentaje, y: yPorcentaje }
            : i
        )
      );
    };

    const soltar = () => {
      el.removeEventListener('pointermove', mover);
      el.removeEventListener('pointerup', soltar);
      el.removeEventListener('pointercancel', soltar);
    };

    el.addEventListener('pointermove', mover);
    el.addEventListener('pointerup', soltar);
    el.addEventListener('pointercancel', soltar);
  }

  // Resumen de una ubicación para la lista (estado, si tiene valores y cuántas excepciones)
  resumenUbicacion(ubicacionId: number): string {
    const estado = this.configUbicaciones()[ubicacionId]?.estado ?? 'libre';
    const lista = this.accesoriosColocados();

    const conValores = lista.some(a => a.accesorioId === 0 && a.ubicacionId === ubicacionId);
    const excepciones = lista.filter(a => a.accesorioId !== 0 && a.ubicacionId === ubicacionId).length;

    return `${estado} · ${conValores ? 'con valores' : 'sin valores'}`
      + (excepciones ? ` · ${excepciones} excepción(es)` : '');
  }

  // En el visor: los cuadros de TODAS las ubicaciones con valores definidos
  // y la excepción del accesorio en vista (solo de la ubicación activa)
  colocadosVisibles = computed(() => {
    const ubicacionId = this.ubicacionActual();
    const vista = this.accesorioEnVista();

    return this.accesoriosColocados().filter(
      a => a.accesorioId === 0 || (a.ubicacionId === ubicacionId && a.accesorioId === vista)
    );
  });

  estadoDe(ubicacionId: number | undefined): string {
    return ubicacionId === undefined ? '' : this.configUbicaciones()[ubicacionId]?.estado ?? '';
  }

  esActiva(a: AccesorioColocado): boolean {
    return a.ubicacionId === this.ubicacionActual();
  }

  // Las ubicaciones que no están activas se ven más suaves; si hay algo seleccionado, lo demás se atenúa
  opacidad(a: AccesorioColocado): number {
    if (!this.esActiva(a)) return 0.6;

    const sel = this.accesorioSeleccionadoId();
    return sel !== null && sel !== a.id ? 0.4 : 1;
  }

  // Clic en el visor: si es el cuadro de otra ubicación, cambia a esa ubicación
  alHacerClick(a: AccesorioColocado): void {
    if (!this.esActiva(a)) {
      this.cambiarUbicacion(a.ubicacionId!);
    }
    this.seleccionarAccesorio(a);
  }

  // Solo se arrastra lo de la ubicación activa
  alPresionar(event: PointerEvent, a: AccesorioColocado): void {
    if (this.esActiva(a)) this.iniciarArrastre(event, a);
  }

  // Cambia la ubicación activa (y limpia la selección y la vista, que eran de la anterior)
  cambiarUbicacion(id: number): void {
    if (id === this.ubicacionActual()) return;

    this.ubicacionActual.set(id);
    this.vistaId.set(null);
    this.accesorioSeleccionadoId.set(null);
    this.rotacion.set({ rotX: 0, rotY: 0, rotZ: 0 });
    this.espejo.set(false);

    // Categoría: si la nueva ubicación no admite la elegida, se cambia
    const validas = this.categorias();
    if (!validas.includes(this.categoriaActual())) {
      this.categoriaActual.set(validas.length === 1 ? validas[0] : '');
    }
  }

  // Nombres de las ubicaciones donde el accesorio tiene excepción
  ubicacionesDe(accesorioId: number): string {
    const ids = this.accesoriosColocados()
      .filter(a => a.accesorioId === accesorioId)
      .map(a => a.ubicacionId);

    return this.ubicaciones().filter(u => ids.includes(u.id)).map(u => u.nombre).join(', ');
  }

  // Excepción de un accesorio en una ubicación (por defecto, la activa)
  excepcionDe(accesorioId: number, ubicacionId = this.ubicacionActual()): AccesorioColocado | undefined {
    return this.accesoriosColocados().find(
      a => a.accesorioId === accesorioId && a.ubicacionId === ubicacionId
    );
  }

  // true si el accesorio ya tiene excepción en la ubicación ACTIVA
  estaColocado(accesorioId: number): boolean {
    return !!this.excepcionDe(accesorioId);
  }

  // ==========================================
  // VALORES DE LA UBICACIÓN Y EXCEPCIONES
  // ==========================================

  // Crea el cuadro con los valores por defecto de la ubicación activa (o lo selecciona si ya existe)
  definirPreset(): void {
    const existente = this.presetActual();

    if (existente) {
      this.seleccionarAccesorio(existente);
      return;
    }

    // El visor es cuadrado, así que 15% x 15% es un cuadrado
    const nuevo: AccesorioColocado = {
      id: this.nuevoId(15, 15),
      ubicacionId: this.ubicacionActual(),
      accesorioId: 0,                       // 0 = valores de la ubicación (no es un accesorio)
      nombre: this.nombreUbicacionActual(),
      imagen: '',
      x: 42.5,
      y: 42.5,
      ancho: 15,
      alto: 15,
      tipo: 'imagen',
    };

    this.accesoriosColocados.update(lista => [...lista, nuevo]);
    this.seleccionarAccesorio(nuevo);
  }

  // Botón "Guardar valores de la ubicación": deja fijos los valores y habilita la elección de accesorios
  guardarValoresUbicacion(): void {
    if (!this.presetActual()) return;

    this.ubicacionesGuardadas.update(ids =>
      ids.includes(this.ubicacionActual()) ? ids : [...ids, this.ubicacionActual()]
    );

    // Deja de estar seleccionado el cuadro (se ocultan las manijas)
    this.accesorioSeleccionadoId.set(null);
    this.rotacion.set({ rotX: 0, rotY: 0, rotZ: 0 });
    this.espejo.set(false);
  }

  // Botón "Editar valores de la ubicación": vuelve a modo edición (hay que guardar de nuevo)
  editarValores(): void {
    this.ubicacionesGuardadas.update(ids => ids.filter(i => i !== this.ubicacionActual()));

    const preset = this.presetActual();
    if (preset) this.seleccionarAccesorio(preset);
  }

  quitarPreset(): void {
    const preset = this.presetActual();

    this.ubicacionesGuardadas.update(ids => ids.filter(i => i !== this.ubicacionActual()));

    if (preset) this.eliminarAccesorio(preset);
  }

  // Devuelve los valores de la ubicación si se puede crear una excepción (si no, avisa y devuelve null)
  private presetParaExcepcion(accesorio: Accesorio): AccesorioColocado | null {
    const config = this.configActual();
    const preset = this.presetActual();

    let motivo = '';

    if (config.estado === 'deshabilitada') {
      motivo = 'La ubicación está deshabilitada.';
    } else if (config.estado === 'fija' && config.fijoId !== accesorio.id) {
      motivo = 'La ubicación es fija: solo su elemento fijo puede tener excepción.';
    } else if (!preset) {
      motivo = 'Primero define los valores de la ubicación.';
    } else if (this.estaColocado(accesorio.id)) {
      motivo = 'Este accesorio ya tiene una excepción en esta ubicación.';
    }

    if (motivo) {
      this.avisos.error(`No se puede: ${motivo}`);
      return null;
    }

    return preset ?? null;
  }

  // Crea la excepción: nace con el tamaño, giro y espejo de la ubicación
  private agregarExcepcion(accesorio: Accesorio, preset: AccesorioColocado, x: number, y: number): void {
    const nuevo: AccesorioColocado = {
      ...preset,
      id: this.nuevoId(preset.ancho, preset.alto),
      accesorioId: accesorio.id,
      nombre: accesorio.nombre,
      imagen: accesorio.imagen,
      tipo: accesorio.tipo ?? 'imagen',
      texto: accesorio.texto,
      categoria: accesorio.categoria,
      x,
      y,
    };

    this.accesoriosColocados.update(lista => [...lista, nuevo]);
    this.vistaId.set(accesorio.id);
    this.seleccionarAccesorio(nuevo);
  }

  // Botón "Crear excepción": en la misma posición de la ubicación
  crearExcepcion(accesorio: Accesorio): void {
    const preset = this.presetParaExcepcion(accesorio);
    if (preset) this.agregarExcepcion(accesorio, preset, preset.x, preset.y);
  }

  seleccionarAccesorio(a: AccesorioColocado): void {
    this.accesorioSeleccionadoId.set(a.id);
    this.porcentajeAncho.set(a.ancho);
    this.porcentajeAlto.set(a.alto);
    this.rotacion.set({
      rotX: a.rotX ?? 0,
      rotY: a.rotY ?? 0,
      rotZ: a.rotZ ?? 0,
    });
    this.espejo.set(a.espejo ?? false);
  }

  // ==========================================
  // MODO ESPEJO
  // ==========================================

  cambiarEspejo(valor: boolean): void {
    this.espejo.set(valor);

    const id = this.accesorioSeleccionadoId();
    if (id === null) return;

    this.accesoriosColocados.update(lista =>
      lista.map(a => (a.id === id ? { ...a, espejo: valor } : a))
    );
  }

  // ==========================================
  // ROTACIÓN
  // ==========================================

  cambiarRotacion(eje: 'rotX' | 'rotY' | 'rotZ', valor: number): void {
    this.rotacion.update(r => ({ ...r, [eje]: valor }));

    const id = this.accesorioSeleccionadoId();
    if (id === null) return;

    this.accesoriosColocados.update(lista =>
      lista.map(a => (a.id === id ? { ...a, [eje]: valor } : a))
    );
  }

  // ==========================================
  // REINICIAR ANCHO / ALTO (vuelve al tamaño con el que se colocó)
  // ==========================================

  reiniciarAncho(): void {
    const id = this.accesorioSeleccionadoId();
    const inicial = id === null ? undefined : this.tamanosIniciales.get(id);

    if (inicial) this.cambiarAncho(inicial.ancho);
  }

  reiniciarAlto(): void {
    const id = this.accesorioSeleccionadoId();
    const inicial = id === null ? undefined : this.tamanosIniciales.get(id);

    if (inicial) this.cambiarAlto(inicial.alto);
  }

  reiniciarRotacion(): void {
    this.cambiarRotacion('rotX', 0);
    this.cambiarRotacion('rotY', 0);
    this.cambiarRotacion('rotZ', 0);
  }

  transformar(a: AccesorioColocado): string {
    const espejo = a.espejo ? ' scaleX(-1)' : '';
    return `perspective(600px) rotateX(${a.rotX ?? 0}deg) rotateY(${a.rotY ?? 0}deg) rotateZ(${a.rotZ ?? 0}deg)${espejo}`;
  }

  cambiarAncho(valor: number): void {
    this.porcentajeAncho.set(valor);

    const id = this.accesorioSeleccionadoId();

    if (id === null) return;

    this.accesoriosColocados.update(lista =>
      lista.map(a => a.id === id ? { ...a, ancho: valor } : a)
    );
  }

  cambiarAlto(valor: number): void {
    this.porcentajeAlto.set(valor);

    const id = this.accesorioSeleccionadoId();

    if (id === null) return;

    this.accesoriosColocados.update(lista =>
      lista.map(a => a.id === id ? { ...a, alto: valor } : a)
    );
  }

  // ==========================================
  // EDICIÓN MANUAL (escribir el valor en el campo)
  // ==========================================

  // Mismos límites que los sliders
  private readonly limitesEditables = {
    ancho: { min: 5, max: 80 },
    alto: { min: 5, max: 80 },
    rotX: { min: -90, max: 90 },
    rotY: { min: -180, max: 180 },
    rotZ: { min: -180, max: 180 },
  } as const;

  // Mientras se escribe: aplica el valor solo si ya es un número dentro del rango
  editarValor(event: Event, campo: CampoEditable): void {
    const entrada = event.target as HTMLInputElement;
    const valor = parseFloat(entrada.value);
    const { min, max } = this.limitesEditables[campo];

    if (Number.isNaN(valor) || valor < min || valor > max) return;

    this.aplicarValor(campo, valor);
  }

  // Al terminar (Enter, salir del campo o usar las flechas): corrige y deja el valor final
  confirmarValor(event: Event, campo: CampoEditable): void {
    const entrada = event.target as HTMLInputElement;
    const { min, max } = this.limitesEditables[campo];

    let valor = parseFloat(entrada.value);

    // Campo vacío o inválido: vuelve al valor actual
    if (Number.isNaN(valor)) {
      valor = this.valorActual(campo);
    }

    // Dentro del rango y con máximo 2 decimales
    valor = +Math.min(Math.max(valor, min), max).toFixed(2);

    entrada.value = String(valor);
    this.aplicarValor(campo, valor);
  }

  private valorActual(campo: CampoEditable): number {
    switch (campo) {
      case 'ancho': return this.porcentajeAncho();
      case 'alto': return this.porcentajeAlto();
      default: return this.rotacion()[campo];
    }
  }

  private aplicarValor(campo: CampoEditable, valor: number): void {
    if (campo === 'ancho') {
      this.cambiarAncho(valor);
    } else if (campo === 'alto') {
      this.cambiarAlto(valor);
    } else {
      this.cambiarRotacion(campo, valor);
    }
  }

  iniciarRedimension(
    event: PointerEvent,
    a: AccesorioColocado,
    esquina: 'nw' | 'ne' | 'sw' | 'se'
  ): void {
    event.preventDefault();
    event.stopPropagation(); // evita que se active el arrastre del accesorio

    const handle = event.currentTarget as HTMLElement;
    const visor = handle.closest('.visor') as HTMLElement;
    if (!visor) return;

    const rect = visor.getBoundingClientRect();

    // Estado inicial en píxeles
    const anchoIni = (a.ancho / 100) * rect.width;
    const altoIni = (a.alto / 100) * rect.height;
    const izqIni = (a.x / 100) * rect.width;
    const arrIni = (a.y / 100) * rect.height;
    const proporcion = anchoIni / altoIni;

    const haciaEste = esquina.includes('e');
    const haciaSur = esquina.includes('s');

    // La esquina opuesta se queda fija
    const anclaX = haciaEste ? izqIni : izqIni + anchoIni;
    const anclaY = haciaSur ? arrIni : arrIni + altoIni;

    const inicioX = event.clientX;
    const inicioY = event.clientY;

    // Límites: mínimo 5%, máximo 80% (igual que los sliders) y sin salirse del visor
    const minAncho = rect.width * 0.05;
    const espacioX = haciaEste ? rect.width - anclaX : anclaX;
    const espacioY = haciaSur ? rect.height - anclaY : anclaY;
    const maxAlto = Math.min(espacioY, rect.height * 0.8);
    const maxAncho = Math.min(espacioX, rect.width * 0.8, maxAlto * proporcion);

    handle.setPointerCapture(event.pointerId);

    const mover = (e: PointerEvent) => {
      const dx = (e.clientX - inicioX) * (haciaEste ? 1 : -1);
      const dy = (e.clientY - inicioY) * (haciaSur ? 1 : -1);

      // Combina ambos ejes para que la diagonal se sienta natural
      let nuevoAncho = anchoIni + (dx + dy * proporcion) / 2;
      nuevoAncho = Math.max(minAncho, Math.min(nuevoAncho, maxAncho));
      const nuevoAlto = nuevoAncho / proporcion;

      const nuevoIzq = haciaEste ? anclaX : anclaX - nuevoAncho;
      const nuevoArr = haciaSur ? anclaY : anclaY - nuevoAlto;

      const ancho = +((nuevoAncho / rect.width) * 100).toFixed(2);
      const alto = +((nuevoAlto / rect.height) * 100).toFixed(2);
      const x = +((nuevoIzq / rect.width) * 100).toFixed(2);
      const y = +((nuevoArr / rect.height) * 100).toFixed(2);

      this.accesoriosColocados.update(lista =>
        lista.map(i => (i.id === a.id ? { ...i, x, y, ancho, alto } : i))
      );

      // Mantener sliders sincronizados
      this.porcentajeAncho.set(+ancho.toFixed(1));
      this.porcentajeAlto.set(+alto.toFixed(1));
    };

    const soltar = () => {
      handle.removeEventListener('pointermove', mover);
      handle.removeEventListener('pointerup', soltar);
      handle.removeEventListener('pointercancel', soltar);
    };

    handle.addEventListener('pointermove', mover);
    handle.addEventListener('pointerup', soltar);
    handle.addEventListener('pointercancel', soltar);
  }

  // Elimina todas las excepciones del accesorio (al desmarcar su check) y lo saca de las ubicaciones fijas
  eliminarPorTipo(accesorioId: number): void {
    this.accesoriosColocados()
      .filter(a => a.accesorioId === accesorioId)
      .forEach(a => this.eliminarAccesorio(a));

    if (this.vistaId() === accesorioId) this.vistaId.set(null);

    this.configUbicaciones.update(c =>
      Object.fromEntries(
        Object.entries(c).map(([id, cfg]) => [id, cfg.fijoId === accesorioId ? { ...cfg, fijoId: null } : cfg])
      ) as Record<number, ConfigUbicacion>
    );
  }

  // Desde la tarjeta: quita la excepción del accesorio en la ubicación activa
  quitarExcepcion(accesorioId: number): void {
    const excepcion = this.excepcionDe(accesorioId);
    if (excepcion) this.eliminarAccesorio(excepcion);
  }

  // Desde la tarjeta: selecciona la excepción para ajustarla
  seleccionarDeLista(accesorioId: number): void {
    const excepcion = this.excepcionDe(accesorioId);

    if (excepcion) {
      this.vistaId.set(accesorioId);
      this.seleccionarAccesorio(excepcion);
    }
  }

  eliminarAccesorio(a: AccesorioColocado): void {
    this.accesoriosColocados.update(lista => lista.filter(i => i.id !== a.id));

    // Si era el seleccionado, limpiar la selección y los controles
    if (this.accesorioSeleccionadoId() === a.id) {
      this.accesorioSeleccionadoId.set(null);
      this.rotacion.set({ rotX: 0, rotY: 0, rotZ: 0 });
      this.espejo.set(false);
    }
  }
}
