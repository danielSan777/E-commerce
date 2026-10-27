import {
  Component, OnInit, OnDestroy, signal, ViewChild, ElementRef, HostListener,
  computed,
  inject,
  output,
  PLATFORM_ID
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TextoCanvas } from '../../../../shared/directivas/texto-canvas';
import { ExcepcionGuardada, Geometria, UbicacionGuardada } from '../../../dominio/ubicaciones';
import Swal from 'sweetalert2';
import { isPlatformBrowser, NgTemplateOutlet } from '@angular/common';

export type IdPestana = 'nombre' | 'lentes' | 'accesorios' | 'marco' | 'dedicatoria';

export interface Pestana {
  id: IdPestana;
  titulo: string;
  subtitulo?: string;
  icono: string; // clase de Bootstrap Icons
  ayuda: string;
}

// Lo que se entrega al pulsar "Guardar y continuar"
export interface ConfiguracionPersonalizada {
  accesorios: AccesorioColocado[];
  nombre: string;
  colorLentes: string;
  dedicatoria: string;       // frase de la tarjeta dedicatoria
  fotoDedicatoria: File | null; // foto de la tarjeta dedicatoria
  textoMarco: string;        // texto del marco dorado (alternativa a la foto)
  fotoMarco: File | null;    // foto del marco dorado (alternativa al texto)
}

@Component({
  imports: [FormsModule,
    TextoCanvas,
    NgTemplateOutlet],
  selector: 'app-personalizador',
  styleUrl: './personalizador.css',
  templateUrl: './personalizador.html',
})

export class Personalizador implements OnDestroy {


  accesoriosSeleccionados = signal<AccesorioColocado[]>([]);

  // Ubicaciones configuradas en el editor (estado, prioridad, capa, valores por defecto)
  ubicaciones = signal<UbicacionGuardada[]>([]);

  // Excepciones: valores propios de un accesorio en una ubicación
  excepciones = signal<ExcepcionGuardada[]>([]);

  // Accesorios disponibles para el cliente (los marcados en el editor)
  catalogo = signal<Accesorio[]>([]);

  colorSeleccionado = 'negro';

  @ViewChild('canvasLentes')
  canvasLentes!: ElementRef<HTMLCanvasElement>;

  private imagenLentes = new Image();

  @ViewChild('visor')
  visor!: ElementRef<HTMLDivElement>;

  @ViewChild('marco')
  marcoRef?: ElementRef<HTMLElement>;

  nombreCliente = signal('');

  // true cuando el accesorio de texto está agregado al visor
  hayTexto = computed(() =>
    this.accesoriosSeleccionados().some(a => a.tipo === 'texto')
  );

  private siguienteId = 1;

  private platformId = inject(PLATFORM_ID);

  private anfitrion = inject(ElementRef<HTMLElement>);



  @ViewChild('canvasLentes')
  set canvasLentesRef(
    referencia: ElementRef<HTMLCanvasElement> | undefined
  ) {
    if (referencia) {

      const lentes = this.accesoriosSeleccionados()
        .find(accesorio => accesorio.accesorioId === 1);

      if (lentes) {

        this.dibujarLentes(
          referencia.nativeElement,
          lentes.ancho,
          lentes.alto
        );
      }

    }
  }



  async ngOnInit(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) return;

    try {
      const respuesta = await fetch('/configuracion-producto.json');

      if (!respuesta.ok) {
        throw new Error('No se pudo cargar configuracion-producto.json');
      }

      const guardado = await respuesta.json();

      this.ubicaciones.set((guardado.ubicaciones ?? []) as UbicacionGuardada[]);
      this.excepciones.set((guardado.excepciones ?? []) as ExcepcionGuardada[]);
      this.catalogo.set((guardado.catalogo ?? []) as Accesorio[]);

      this.agregarPorDefecto();

      // Abrir la primera categoría de la pestaña "Accesorios" (sin Moda ni Personalización).
      this.categoriaActual.set(this.categoriasAccesorios()[0] ?? this.categorias()[0] ?? '');

    } catch (error) {
      console.error('Error al cargar la configuración:', error);
    }
  }

  // ==========================================
  // UBICACIONES: valores por defecto + excepciones
  // ==========================================

  private ubicacion(ubicacionId: number): UbicacionGuardada | undefined {
    return this.ubicaciones().find(u => u.id === ubicacionId);
  }

  // Valores con los que se dibuja un accesorio en una ubicación:
  // su excepción si la tiene; si no, los valores de la ubicación
  geometria(accesorioId: number, ubicacionId: number): Geometria | null {
    const excepcion = this.excepciones().find(
      e => e.accesorioId === accesorioId && e.ubicacionId === ubicacionId
    );

    return excepcion ?? this.ubicacion(ubicacionId)?.preset ?? null;
  }

  // Orden de capa de una ubicación (mayor = más al frente)
  capaDe(ubicacionId: number | undefined): number {
    return (ubicacionId !== undefined ? this.ubicacion(ubicacionId)?.capa : undefined) ?? 1;
  }

  // true si el accesorio es el elemento fijo de alguna ubicación (no se quita ni se reemplaza)
  esFijo(accesorioId: number): boolean {
    return this.ubicaciones().some(u => u.estado === 'fija' && u.fijoId === accesorioId);
  }

  // Motivo por el que una ubicación no se puede elegir para un accesorio ('' = disponible)
  motivoNoDisponible(ubicacion: UbicacionGuardada, accesorio: Accesorio): string {
    if (ubicacion.estado === 'deshabilitada') return 'deshabilitada';
    if (ubicacion.estado === 'fija') return 'ocupada por un elemento fijo';
    const categoria = accesorio.categoria ?? 'Otros';
    if (ubicacion.categorias && !ubicacion.categorias.includes(categoria)) return 'categoría no permitida';
    if (ubicacion.excluidas?.includes(categoria)) return 'categoría no permitida';
    if (!this.geometria(accesorio.id, ubicacion.id)) return 'sin valores definidos';
    return '';
  }

  // Accesorio que hay ahora en una ubicación
  private ocupante(ubicacionId: number): AccesorioColocado | undefined {
    return this.accesoriosSeleccionados().find(s => s.ubicacionId === ubicacionId);
  }

  // Ubicación donde se pone el accesorio al agregarlo (el cliente NO la elige):
  // 1) la primera ubicación libre según la prioridad configurada en el editor
  // 2) si todas están ocupadas, reemplaza al accesorio que lleva más tiempo puesto
  destino(accesorio: Accesorio): number | null {
    const candidatas = this.ubicaciones()
      .filter(u => this.motivoNoDisponible(u, accesorio) === '')
      .sort((a, b) => a.prioridad - b.prioridad);

    const libre = candidatas.find(u => !this.ocupante(u.id));
    if (libre) return libre.id;

    // El id crece con cada accesorio puesto: el id menor es el más antiguo
    const masAntiguo = candidatas
      .map(u => this.ocupante(u.id))
      .filter((o): o is AccesorioColocado => !!o)
      .sort((a, b) => a.id - b.id)[0];

    return masAntiguo?.ubicacionId ?? null;
  }

  // Arma el accesorio para dibujarlo en una ubicación (con sus valores o los de la ubicación)
  private construir(accesorio: Accesorio, ubicacionId: number): AccesorioColocado | null {
    const g = this.geometria(accesorio.id, ubicacionId);
    if (!g) return null;

    return {
      id: this.siguienteId++,
      ubicacionId,
      accesorioId: accesorio.id,
      nombre: accesorio.nombre,
      imagen: accesorio.imagen,
      tipo: accesorio.tipo ?? 'imagen',
      texto: accesorio.texto,
      categoria: accesorio.categoria,
      x: g.x,
      y: g.y,
      ancho: g.ancho,
      alto: g.alto,
      rotX: g.rotX,
      rotY: g.rotY,
      rotZ: g.rotZ,
      espejo: g.espejo,
    };
  }

  // ==========================================
  // CUÁNTOS ACCESORIOS SE CUENTAN
  // ==========================================

  // Hasta este número se agrega sin preguntar; el siguiente (el 4.º, al centro) pide confirmación
  private readonly ACCESORIOS_SIN_PREGUNTAR = 3;

  // Solo cuentan los accesorios que no son de "Personalización" (el nombre no cuenta)
  private cuenta(accesorio: { categoria?: string }): boolean {
    return (accesorio.categoria ?? 'Otros') !== 'Personalización';
  }

  // Cuántos accesorios que cuentan hay puestos (los elementos fijos no cuentan)
  cantidadContada(): number {
    return this.accesoriosSeleccionados().filter(
      a => this.cuenta(a) && !this.esFijo(a.accesorioId)
    ).length;
  }

  // Pone el accesorio en su destino. Si ahí había otro accesorio, lo reemplaza.
  private colocar(accesorio: Accesorio): void {
    const ubicacionId = this.destino(accesorio);
    if (ubicacionId === null) return;

    const nuevo = this.construir(accesorio, ubicacionId);
    if (!nuevo) return;

    this.accesoriosSeleccionados.update(lista => [
      ...lista.filter(s => s.ubicacionId !== ubicacionId),
      nuevo
    ]);
    this.invalidarPorCategoria(accesorio.categoria);
  }

  // Botón "Agregar". Si va a ser el cuarto accesorio (el del centro), antes se pregunta.
  async agregarAccesorio(accesorio: Accesorio): Promise<void> {
    if (this.esFijo(accesorio.id) || this.estaSeleccionado(accesorio.id)) return;

    // Si el lugar donde iría ya está ocupado, el accesorio REEMPLAZA a otro: no se suma un
    // accesorio más, así que no hay nada que preguntar. (Ej.: 3 accesorios en pies y centro,
    // la cabeza vacía, y el nuevo no es de Moda: no puede ir en la cabeza, reemplaza a uno.)
    const destinoId = this.destino(accesorio);
    const reemplazaOtro = destinoId !== null && !!this.ocupante(destinoId);

    const esCuarto = this.cuenta(accesorio)
      && this.cantidadContada() === this.ACCESORIOS_SIN_PREGUNTAR
      && !reemplazaOtro;

    if (esCuarto) {
      // Se dice la ubicación real que quedó disponible (derecha, izquierda, centro...)
      const nombreDestino = destinoId !== null ? this.ubicacion(destinoId)?.nombre : undefined;

      const respuesta = await Swal.fire({
        title: '¿Desea agregar un cuarto accesorio?',
        text: /* nombreDestino ? `Se colocará en: ${nombreDestino}.` : '' */"",
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Sí, agregar',
        cancelButtonText: 'No',
        // Si el personalizador está dentro de un modal, la pregunta se dibuja dentro de ese modal
        // (si no, queda detrás de él) y siempre por encima
        target: this.contenedorDePregunta(),
        didOpen: () => {
          const contenedor = Swal.getContainer();
          if (contenedor) contenedor.style.zIndex = '99999';
        }
      });

      if (!respuesta.isConfirmed) return;

      // Por si mientras tanto cambió algo
      if (this.estaSeleccionado(accesorio.id)) return;
    }

    this.colocar(accesorio);
  }


  // ==========================================
  // PANEL NUEVO: contador, categorías y tarjetas
  // ==========================================

  // "Accesorio X de 3": cuántos accesorios (que cuentan) lleva puestos
  readonly maximoAccesorios = 3;

  cantidadAccesorios = computed(() =>
    this.accesoriosSeleccionados().filter(
      a => this.cuenta(a) && !this.esFijo(a.accesorioId)
    ).length
  );

  // Segmentos de la barra de progreso (3, o más si agregó un cuarto)
  segmentos = computed(() =>
    Array.from({ length: Math.max(this.maximoAccesorios, this.cantidadAccesorios()) }, (_, i) => i)
  );

  // ==========================================
  // PESTAÑAS: Nombre · Lentes / Gafas · Accesorios · Marco dorado · Dedicatoria
  // ==========================================

  private readonly CATEGORIA_MODA = 'Moda';
  private readonly CATEGORIA_PERSONALIZACION = 'Personalización';

  readonly pestanas: Pestana[] = [
    {
      id: 'nombre', titulo: 'Nombre', icono: 'bi-person',
      ayuda: 'Escribe el nombre que aparecerá en tu maceta.'
    },
    {
      id: 'lentes', titulo: 'Lentes / Gafas', icono: 'bi-eyeglasses',
      ayuda: 'Elige el accesorio de moda para tu maceta.'
    },
    {
      id: 'accesorios', titulo: 'Accesorios', icono: 'bi-gift',
      ayuda: `Elige hasta ${this.maximoAccesorios} complementos para personalizar tu maceta.`
    },
    {
      id: 'marco', titulo: 'Marco dorado', subtitulo: 'Foto o frase', icono: 'bi-image',
      ayuda: 'Escribe un texto o sube una foto. Solo puedes elegir una de las dos.'
    },
    {
      id: 'dedicatoria', titulo: 'Tarjeta dedicatoria', subtitulo: 'Foto y frase', icono: 'bi-card-text',
      ayuda: 'Sube una foto y escribe una frase. Necesitas las dos.'
    },
  ];

  pestana = signal<IdPestana>('accesorios');

  pestanaActual = computed(() =>
    this.pestanas.find(p => p.id === this.pestana()) ?? this.pestanas[2]
  );

  // En celular las opciones salen de abajo hacia arriba como una hoja (ver el CSS).
  // En pantallas medias y grandes el panel se ve siempre en su lugar.
  hojaAbierta = signal(false);

  // Distancia desde arriba donde empieza la hoja: justo debajo de la imagen del visor,
  // así la hoja ocupa todo el alto que queda hasta abajo de la pantalla
  hojaTop = signal(300);

  // true mientras la hoja baja y desaparece (animación de cierre)
  hojaCerrando = signal(false);

  // true si al abrir la hoja se añadió una entrada al historial (para el botón "atrás" del celular)
  private entradaHistorial = false;

  private esCelular(): boolean {
    return typeof window !== 'undefined' && window.matchMedia('(max-width: 767.98px)').matches;
  }

  private abrirHoja(): void {
    const marco = this.marcoRef?.nativeElement;
    if (marco && typeof window !== 'undefined') {
      const bajoImagen = Math.round(marco.getBoundingClientRect().bottom + 8);
      this.hojaTop.set(Math.min(bajoImagen, Math.round(window.innerHeight * 0.55)));
    }

    // En celular, el botón "atrás" debe cerrar la hoja y no salir de la pantalla
    if (!this.hojaAbierta() && this.esCelular() && !this.entradaHistorial) {
      history.pushState({ ...(history.state ?? {}), hojaPersonalizador: true }, '');
      this.entradaHistorial = true;
    }

    this.hojaCerrando.set(false);
    this.hojaAbierta.set(true);
  }

  // Cierra la hoja con su animación de bajada
  private ocultarHoja(): void {
    if (!this.hojaAbierta()) return;

    this.hojaAbierta.set(false);
    this.cancelarReemplazo();

    this.hojaCerrando.set(true);
    setTimeout(() => this.hojaCerrando.set(false), 260);
  }

  // X, fondo oscuro o "Continuar"
  cerrarHoja(): void {
    this.ocultarHoja();

    // Quita la entrada del historial que se añadió al abrir (así "atrás" no queda de más)
    if (this.entradaHistorial) {
      this.entradaHistorial = false;
      history.back();
    }
  }

  // Botón "atrás" del celular: baja la hoja y se queda en el personalizador
  @HostListener('window:popstate')
  alPulsarAtras(): void {
    if (!this.hojaAbierta()) return;

    this.entradaHistorial = false;
    this.ocultarHoja();
  }

  elegirPestana(id: IdPestana): void {
    this.cancelarReemplazo();
    this.errorPanel.set('');
    this.pestana.set(id);
    this.abrirHoja();

    // En "Accesorios" la categoría elegida debe ser una de sus categorías
    if (id === 'accesorios' && !this.categoriasAccesorios().includes(this.categoriaActual())) {
      this.categoriaActual.set(this.categoriasAccesorios()[0] ?? '');
    }
  }

  // ==========================================
  // CONTINUAR: guarda lo elegido en cada opción y la pone en azul
  // ==========================================

  guardadas = signal<ReadonlySet<IdPestana>>(new Set());
  errorPanel = signal('');

  estaGuardada(id: IdPestana): boolean {
    return this.guardadas().has(id);
  }

  // Si el cliente cambia algo de una opción ya guardada, deja de estar guardada
  private invalidarGuardado(id: IdPestana): void {
    if (!this.guardadas().has(id)) return;

    this.guardadas.update(conjunto => {
      const nuevo = new Set(conjunto);
      nuevo.delete(id);
      return nuevo;
    });
  }

  private invalidarPorCategoria(categoria: string | undefined): void {
    const c = categoria ?? 'Otros';
    this.invalidarGuardado(
      c === this.CATEGORIA_MODA ? 'lentes' : c === this.CATEGORIA_PERSONALIZACION ? 'nombre' : 'accesorios'
    );
  }

  // Mensaje de error si la opción todavía no se puede guardar ('' = todo bien)
  private errorDePestana(id: IdPestana): string {
    const lista = this.accesoriosSeleccionados();

    switch (id) {
      case 'nombre':
        if (!this.hayTexto()) return 'Primero elige el nombre en la lista.';
        return this.nombreCliente().trim() ? '' : 'Escribe tu nombre para continuar.';

      case 'lentes':
        // Opcional: se puede continuar con o sin lentes
        return '';

      case 'accesorios':
        return lista.some(a => {
          const c = a.categoria ?? 'Otros';
          return c !== this.CATEGORIA_MODA && c !== this.CATEGORIA_PERSONALIZACION && !this.esFijo(a.accesorioId);
        }) ? '' : 'Elige al menos un accesorio para continuar.';

      case 'marco':
        return this.textoMarco().trim() || this.fotoMarcoArchivo
          ? '' : 'Escribe un texto o sube una foto para continuar.';

      case 'dedicatoria': {
        const hayFoto = !!this.fotoTarjetaArchivo;
        const hayFrase = this.dedicatoria().trim().length > 0;
        if (!hayFoto && !hayFrase) return 'Sube una foto y escribe una frase para continuar.';
        if (!hayFoto) return 'Falta la foto: la tarjeta lleva una foto y una frase.';
        if (!hayFrase) return 'Falta la frase: la tarjeta lleva una foto y una frase.';
        return '';
      }
    }
  }

  // Botón "Continuar" de cada opción
  continuarPestana(): void {
    const id = this.pestana();
    const error = this.errorDePestana(id);

    if (error) {
      this.errorPanel.set(error);
      return;
    }

    this.errorPanel.set('');
    this.guardadas.update(conjunto => new Set(conjunto).add(id));
    this.cerrarHoja();
  }

  cambiarNombre(texto: string): void {
    this.nombreCliente.set(texto);
    this.errorPanel.set('');
    this.invalidarGuardado('nombre');
  }

  // Categorías de la pestaña "Accesorios": todas menos Moda (va en "Lentes / Gafas")
  // y Personalización (va en "Nombre")
  categoriasAccesorios = computed(() =>
    this.categorias().filter(c => c !== this.CATEGORIA_MODA && c !== this.CATEGORIA_PERSONALIZACION)
  );

  // Pestaña "Lentes / Gafas": accesorios de tipo Moda
  accesoriosModa = computed(() =>
    this.catalogo().filter(a => (a.categoria ?? 'Otros') === this.CATEGORIA_MODA)
  );

  // Pestaña "Nombre": accesorios de Personalización (el texto con el nombre)
  accesoriosPersonalizacion = computed(() =>
    this.catalogo().filter(a => (a.categoria ?? 'Otros') === this.CATEGORIA_PERSONALIZACION)
  );

  // Icono de cada categoría (Bootstrap Icons). Se puede editar o ampliar.
  private readonly iconosCategoria: Record<string, string> = {
    Hobbies: 'bi-stopwatch',
    Deportes: 'bi-dribbble',
    Mascotas: 'bi-heart',
    Animales: 'bi-heart',
    Objetos: 'bi-box-seam',
  };

  iconoCategoria(categoria: string): string {
    return this.iconosCategoria[categoria] ?? 'bi-tag';
  }

  // Texto de estado de una tarjeta (se usa como título y para lectores de pantalla)
  etiquetaTarjeta(accesorio: Accesorio): string {
    if (this.esFijo(accesorio.id)) return 'Fijo';
    if (this.puedeReemplazarCon(accesorio.id)) return 'Reemplazar';
    if (this.noDisponible(accesorio)) return 'No disponible';
    if (this.estaSeleccionado(accesorio.id)) return 'Agregado';
    return 'Agregar';
  }

  // Valida un archivo de imagen ('' = correcto)
  private errorDeImagen(archivo: File): string {
    if (!archivo.type.startsWith('image/')) return 'Elige un archivo de imagen.';
    if (archivo.size > this.maxMbFoto * 1024 * 1024) return `La imagen no debe pesar más de ${this.maxMbFoto} MB.`;
    return '';
  }

  readonly maxMbFoto = 5;

  // ----- Marco dorado: un texto (hasta 60 caracteres) O una foto, no las dos -----
  readonly maxTextoMarco = 60;
  textoMarco = signal('');

  fotoMarcoUrl = signal<string | null>(null);
  fotoMarcoNombre = signal('');
  errorFotoMarco = signal('');
  private fotoMarcoArchivo: File | null = null;

  escribirTextoMarco(evento: Event): void {
    this.textoMarco.set((evento.target as HTMLTextAreaElement).value.slice(0, this.maxTextoMarco));
    this.errorPanel.set('');
    if (!this.textoMarco().trim()) this.errorFotoMarco.set('');
    this.invalidarGuardado('marco');
  }

  // Botón "Elegir foto": si ya hay texto escrito, no deja subir la foto
  pedirFotoMarco(input: HTMLInputElement): void {
    if (this.textoMarco().trim()) {
      this.errorFotoMarco.set('Primero borra tu mensaje de arriba para subir la foto.');
      return;
    }

    this.errorFotoMarco.set('');
    input.click();
  }

  elegirFotoMarco(evento: Event): void {
    const input = evento.target as HTMLInputElement;
    const archivo = input.files?.[0];
    if (!archivo) return;

    if (this.textoMarco().trim()) {
      this.errorFotoMarco.set('Primero borra tu mensaje de arriba para subir la foto.');
      input.value = '';
      return;
    }

    const error = this.errorDeImagen(archivo);
    if (error) {
      this.errorFotoMarco.set(error);
      input.value = '';
      return;
    }

    this.errorFotoMarco.set('');
    this.errorPanel.set('');
    this.liberarFotoMarco();
    this.fotoMarcoArchivo = archivo;
    this.fotoMarcoUrl.set(URL.createObjectURL(archivo));
    this.fotoMarcoNombre.set(archivo.name);
    this.invalidarGuardado('marco');
  }

  quitarFotoMarco(input: HTMLInputElement): void {
    this.liberarFotoMarco();
    this.fotoMarcoArchivo = null;
    this.fotoMarcoUrl.set(null);
    this.fotoMarcoNombre.set('');
    this.errorFotoMarco.set('');
    input.value = '';
    this.invalidarGuardado('marco');
  }

  private liberarFotoMarco(): void {
    const actual = this.fotoMarcoUrl();
    if (actual) URL.revokeObjectURL(actual);
  }

  // ----- Tarjeta dedicatoria: una foto Y una frase (hasta 200 caracteres) -----
  readonly maxDedicatoria = 200;
  dedicatoria = signal('');

  fotoTarjetaUrl = signal<string | null>(null);
  fotoTarjetaNombre = signal('');
  errorFotoTarjeta = signal('');
  private fotoTarjetaArchivo: File | null = null;

  escribirDedicatoria(evento: Event): void {
    this.dedicatoria.set((evento.target as HTMLTextAreaElement).value.slice(0, this.maxDedicatoria));
    this.errorPanel.set('');
    this.invalidarGuardado('dedicatoria');
  }

  elegirFotoTarjeta(evento: Event): void {
    const input = evento.target as HTMLInputElement;
    const archivo = input.files?.[0];
    if (!archivo) return;

    const error = this.errorDeImagen(archivo);
    if (error) {
      this.errorFotoTarjeta.set(error);
      input.value = '';
      return;
    }

    this.errorFotoTarjeta.set('');
    this.errorPanel.set('');
    this.liberarFotoTarjeta();
    this.fotoTarjetaArchivo = archivo;
    this.fotoTarjetaUrl.set(URL.createObjectURL(archivo));
    this.fotoTarjetaNombre.set(archivo.name);
    this.invalidarGuardado('dedicatoria');
  }

  quitarFotoTarjeta(input: HTMLInputElement): void {
    this.liberarFotoTarjeta();
    this.fotoTarjetaArchivo = null;
    this.fotoTarjetaUrl.set(null);
    this.fotoTarjetaNombre.set('');
    this.errorFotoTarjeta.set('');
    input.value = '';
    this.invalidarGuardado('dedicatoria');
  }

  private liberarFotoTarjeta(): void {
    const actual = this.fotoTarjetaUrl();
    if (actual) URL.revokeObjectURL(actual);
  }

  // ==========================================
  // ZOOM DEL VISOR: botones + / −, rueda del mouse y pellizco con los dedos
  // ==========================================
  // Se escala todo el visor (foto + accesorios), así los accesorios siguen en su sitio.

  readonly zoomMin = 1;
  readonly zoomMax = 3;

  zoom = signal(1);
  panX = signal(0);   // desplazamiento en px (solo cuando hay zoom)
  panY = signal(0);
  gesto = signal(false); // true mientras se arrastra o se pellizca (sin transición)

  transformVisor = computed(() =>
    `translate(${this.panX()}px, ${this.panY()}px) scale(${this.zoom()})`
  );

  private punteros = new Map<number, { x: number; y: number }>();
  private distanciaPrevia = 0;
  private centroPrevio = { x: 0, y: 0 };
  private inicioToque = { x: 0, y: 0 };
  private huboMovimiento = false;

  // Fija zoom y desplazamiento, sin dejar que la foto se salga del marco
  private fijarZoom(marco: HTMLElement, z: number, x: number, y: number): void {
    if (z <= 1.001) {
      this.zoom.set(1);
      this.panX.set(0);
      this.panY.set(0);
      return;
    }

    const visor = this.visor?.nativeElement;
    const ancho = visor?.offsetWidth ?? marco.clientWidth;
    const alto = visor?.offsetHeight ?? marco.clientHeight;
    const maxX = Math.max(0, (ancho * z - marco.clientWidth) / 2);
    const maxY = Math.max(0, (alto * z - marco.clientHeight) / 2);

    this.zoom.set(z);
    this.panX.set(Math.min(maxX, Math.max(-maxX, x)));
    this.panY.set(Math.min(maxY, Math.max(-maxY, y)));
  }

  private limitarZoom(z: number): number {
    return Math.min(this.zoomMax, Math.max(this.zoomMin, z));
  }

  // Cambia el zoom manteniendo fijo el punto (px, py), medido desde el centro del marco
  private zoomAlrededor(marco: HTMLElement, nuevoZoom: number, px: number, py: number): void {
    const z0 = this.zoom();
    const z1 = this.limitarZoom(nuevoZoom);
    if (z1 === z0) return;

    const ux = (px - this.panX()) / z0;
    const uy = (py - this.panY()) / z0;
    this.fijarZoom(marco, z1, px - ux * z1, py - uy * z1);
  }

  acercar(marco: HTMLElement): void {
    this.zoomAlrededor(marco, this.zoom() * 1.4, 0, 0);
  }

  alejar(marco: HTMLElement): void {
    this.zoomAlrededor(marco, this.zoom() / 1.4, 0, 0);
  }

  // Rueda del mouse (o pellizco del touchpad): acerca o aleja donde está el cursor
  ruedaZoom(evento: WheelEvent, marco: HTMLElement): void {
    evento.preventDefault();

    const r = marco.getBoundingClientRect();
    const px = evento.clientX - (r.left + r.width / 2);
    const py = evento.clientY - (r.top + r.height / 2);
    const delta = evento.deltaMode === 1 ? evento.deltaY * 16 : evento.deltaY;

    this.zoomAlrededor(marco, this.zoom() * Math.exp(-delta * 0.0015), px, py);
  }

  // Centro del marco y medidas de los dedos puestos (para el pellizco)
  private medirPunteros(marco: HTMLElement): { distancia: number; x: number; y: number } {
    const r = marco.getBoundingClientRect();
    const [a, b] = [...this.punteros.values()];

    return {
      distancia: Math.hypot(a.x - b.x, a.y - b.y),
      x: (a.x + b.x) / 2 - (r.left + r.width / 2),
      y: (a.y + b.y) / 2 - (r.top + r.height / 2),
    };
  }

  iniciarGesto(evento: PointerEvent, marco: HTMLElement): void {
    if ((evento.target as HTMLElement).closest('.zoom-controles')) return;
    if (evento.pointerType === 'mouse' && evento.button !== 0) return;

    this.punteros.set(evento.pointerId, { x: evento.clientX, y: evento.clientY });

    if (this.punteros.size === 1) {
      this.inicioToque = { x: evento.clientX, y: evento.clientY };
      this.huboMovimiento = false;
    }

    if (this.punteros.size === 2) {
      const m = this.medirPunteros(marco);
      this.distanciaPrevia = m.distancia;
      this.centroPrevio = { x: m.x, y: m.y };
      this.huboMovimiento = true;
      this.gesto.set(true);
    }
  }

  moverGesto(evento: PointerEvent, marco: HTMLElement): void {
    const puntero = this.punteros.get(evento.pointerId);
    if (!puntero) return;

    const anteriorX = puntero.x;
    const anteriorY = puntero.y;
    puntero.x = evento.clientX;
    puntero.y = evento.clientY;

    // Dos dedos: pellizco (zoom) y desplazamiento a la vez
    if (this.punteros.size >= 2) {
      const m = this.medirPunteros(marco);

      if (this.distanciaPrevia > 0) {
        const z0 = this.zoom();
        const z1 = this.limitarZoom(z0 * m.distancia / this.distanciaPrevia);
        const ux = (this.centroPrevio.x - this.panX()) / z0;
        const uy = (this.centroPrevio.y - this.panY()) / z0;
        this.fijarZoom(marco, z1, m.x - ux * z1, m.y - uy * z1);
      }

      this.distanciaPrevia = m.distancia;
      this.centroPrevio = { x: m.x, y: m.y };
      return;
    }

    // Un dedo o el mouse: arrastrar la foto, solo si hay zoom
    if (this.zoom() <= 1) return;

    if (!this.huboMovimiento) {
      const lejos = Math.hypot(evento.clientX - this.inicioToque.x, evento.clientY - this.inicioToque.y);
      if (lejos < 5) return; // todavía es un toque, no un arrastre

      this.huboMovimiento = true;
      this.gesto.set(true);
      try { marco.setPointerCapture(evento.pointerId); } catch { /* no pasa nada */ }
    }

    this.fijarZoom(
      marco,
      this.zoom(),
      this.panX() + (evento.clientX - anteriorX),
      this.panY() + (evento.clientY - anteriorY)
    );
  }

  terminarGesto(evento: PointerEvent, marco: HTMLElement): void {
    if (!this.punteros.delete(evento.pointerId)) return;

    if (this.punteros.size < 2) this.distanciaPrevia = 0;
    if (this.punteros.size > 0) return;

    this.gesto.set(false);

    // Si fue un arrastre o un pellizco, el "clic" que sigue no debe seleccionar un accesorio
    if (this.huboMovimiento) {
      const bloquear = (e: Event) => e.stopPropagation();
      marco.addEventListener('click', bloquear, true);
      setTimeout(() => marco.removeEventListener('click', bloquear, true));
    }

    this.huboMovimiento = false;
  }

  // Botón "Guardar y continuar": entrega todo lo elegido a quien use este componente
  readonly guardar = output<ConfiguracionPersonalizada>();

  continuar(): void {
    this.guardar.emit({
      accesorios: this.accesoriosSeleccionados(),
      nombre: this.nombreCliente(),
      colorLentes: this.colorSeleccionado,
      dedicatoria: this.dedicatoria(),
      fotoDedicatoria: this.fotoTarjetaArchivo,
      textoMarco: this.textoMarco(),
      fotoMarco: this.fotoMarcoArchivo,
    });
  }

  ngOnDestroy(): void {
    if (this.entradaHistorial && history.state?.hojaPersonalizador) history.back();
    this.liberarFotoMarco();
    this.liberarFotoTarjeta();
  }

  cantidadEnCategoria(categoria: string): number {
    return this.catalogo().filter(a => (a.categoria ?? 'Otros') === categoria).length;
  }

  // Elemento donde se dibuja la pregunta: el modal que contiene al personalizador (o el body)
  private contenedorDePregunta(): HTMLElement {
    const host = this.anfitrion.nativeElement as HTMLElement;
    return (host.closest(
      'dialog, .modal, [role="dialog"], mat-dialog-container, .cdk-overlay-pane'
    ) as HTMLElement | null) ?? document.body;
  }

  // ----- Categorías: se desplazan arrastrando con el mouse o con la rueda -----
  private arrastrandoCategorias = false;
  private huboArrastre = false;
  private inicioX = 0;
  private inicioScroll = 0;

  iniciarArrastre(evento: PointerEvent, lista: HTMLElement): void {
    if (evento.pointerType !== 'mouse') return; // en táctil el desplazamiento ya es nativo
    this.arrastrandoCategorias = true;
    this.huboArrastre = false;
    this.inicioX = evento.clientX;
    this.inicioScroll = lista.scrollLeft;
  }

  arrastrarCategorias(evento: PointerEvent, lista: HTMLElement): void {
    if (!this.arrastrandoCategorias) return;
    const desplazado = evento.clientX - this.inicioX;
    if (Math.abs(desplazado) > 5) this.huboArrastre = true;
    lista.scrollLeft = this.inicioScroll - desplazado;
  }

  terminarArrastre(): void {
    this.arrastrandoCategorias = false;
  }

  // La rueda del mouse mueve la lista de lado
  ruedaCategorias(evento: WheelEvent, lista: HTMLElement): void {
    if (lista.scrollWidth <= lista.clientWidth || Math.abs(evento.deltaX) > Math.abs(evento.deltaY)) return;
    const antes = lista.scrollLeft;
    lista.scrollLeft += evento.deltaY;
    if (lista.scrollLeft !== antes) evento.preventDefault();
  }

  elegirCategoria(categoria: string): void {
    if (this.huboArrastre) { this.huboArrastre = false; return; } // fue un arrastre, no un clic
    this.categoriaActual.set(categoria);
  }

  // true si el accesorio no se puede poner (sin ubicación) y todavía no está puesto
  noDisponible(accesorio: Accesorio): boolean {
    return !this.esFijo(accesorio.id)
      && !this.estaSeleccionado(accesorio.id)
      && this.destino(accesorio) === null;
  }

  // Clic en una tarjeta: reemplaza (si hay uno elegido para reemplazar), quita o agrega.
  // Al agregar el cuarto accesorio, agregarAccesorio hace la pregunta.
  async pulsarTarjeta(accesorio: Accesorio): Promise<void> {
    if (this.esFijo(accesorio.id)) return;

    if (this.puedeReemplazarCon(accesorio.id)) {
      this.reemplazarPor(accesorio);
      return;
    }

    if (this.estaSeleccionado(accesorio.id)) {
      this.quitarAccesorio(accesorio.id);
      return;
    }

    if (this.noDisponible(accesorio)) return;

    await this.agregarAccesorio(accesorio);
  }

  quitarAccesorio(id: number): void {
    // Los elementos fijos no se quitan
    if (this.esFijo(id)) return;

    if (this.reemplazoDe() === id) this.reemplazoDe.set(null);

    this.invalidarPorCategoria(this.accesoriosSeleccionados().find(a => a.accesorioId === id)?.categoria);

    this.accesoriosSeleccionados.update(lista =>
      lista.filter(accesorio => accesorio.accesorioId !== id)
    );
  }


  estaSeleccionado(accesorioId: number): boolean {

    return this.accesoriosSeleccionados()
      .some(a => a.accesorioId === accesorioId);

  }


  // ==========================================
  // REEMPLAZAR UN ACCESORIO YA PUESTO
  // ==========================================

  // Accesorio puesto que el cliente eligió para reemplazar (clic en el visor o botón de la tarjeta)
  reemplazoDe = signal<number | null>(null);

  puestoSeleccionado = computed(() =>
    this.accesoriosSeleccionados().find(a => a.accesorioId === this.reemplazoDe())
  );

  nombreUbicacion(ubicacionId: number | undefined): string {
    return ubicacionId === undefined ? '' : this.ubicacion(ubicacionId)?.nombre ?? '';
  }

  // Con qué se puede reemplazar el accesorio seleccionado: los accesorios que su ubicación admite
  // (pies y centro: ni Moda ni Personalización; Cabeza: solo Moda; Base: solo Personalización).
  // Esas reglas vienen de las categorías permitidas de cada ubicación en el editor.
  // Si el accesorio ya está puesto en otro lugar, los dos intercambian sus lugares
  // (solo si el seleccionado también está permitido en el lugar del otro).
  opcionesReemplazo = computed(() => {
    const puesto = this.puestoSeleccionado();
    const ubicacion = puesto?.ubicacionId !== undefined ? this.ubicacion(puesto.ubicacionId) : undefined;

    if (!puesto || !ubicacion) return [];

    const accesorioPuesto = this.catalogo().find(x => x.id === puesto.accesorioId);

    return this.catalogo().filter(a => {
      if (a.id === puesto.accesorioId || this.esFijo(a.id)) return false;
      if (this.motivoNoDisponible(ubicacion, a) !== '') return false;

      const otro = this.accesoriosSeleccionados().find(s => s.accesorioId === a.id);
      if (!otro) return true;

      const ubicacionOtro = otro.ubicacionId !== undefined ? this.ubicacion(otro.ubicacionId) : undefined;
      return !!accesorioPuesto && !!ubicacionOtro
        && this.motivoNoDisponible(ubicacionOtro, accesorioPuesto) === '';
    });
  });

  // Selecciona (o deselecciona) un accesorio puesto para reemplazarlo
  seleccionarPuesto(accesorioId: number): void {
    if (this.esFijo(accesorioId) || !this.estaSeleccionado(accesorioId)) return;

    this.reemplazoDe.update(actual => (actual === accesorioId ? null : accesorioId));

    // Muestra su tarjeta en el panel, en un punto donde se vea
    if (this.reemplazoDe() === accesorioId) {
      // En celular, abre la hoja con la pestaña a la que pertenece el accesorio
      const puesto = this.accesoriosSeleccionados().find(a => a.accesorioId === accesorioId);
      const categoria = puesto?.categoria ?? 'Otros';
      if (categoria !== this.CATEGORIA_PERSONALIZACION) {
        if (categoria === this.CATEGORIA_MODA) {
          this.pestana.set('lentes');
        } else {
          this.pestana.set('accesorios');
          this.categoriaActual.set(categoria);
        }
        this.abrirHoja();
      }

      setTimeout(() =>
        document.getElementById('tarjeta-' + accesorioId)
          ?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      );
    }
  }

  cancelarReemplazo(): void {
    this.reemplazoDe.set(null);
  }

  contorno(accesorioId: number): string {
    return this.reemplazoDe() === accesorioId ? '2px dashed #0d6efd' : 'none';
  }

  // true si el accesorio de la tarjeta puede reemplazar al puesto seleccionado
  puedeReemplazarCon(accesorioId: number): boolean {
    return this.opcionesReemplazo().some(a => a.id === accesorioId);
  }

  // Botón "Reemplazar" de la tarjeta: el accesorio de la tarjeta toma la ubicación del
  // seleccionado (con los valores de esa ubicación). Si ya estaba puesto en otro lugar,
  // el seleccionado pasa a ese lugar (intercambian).
  reemplazarPor(nuevo: Accesorio): void {
    const puesto = this.puestoSeleccionado();

    if (!puesto || puesto.ubicacionId === undefined || !this.puedeReemplazarCon(nuevo.id)) return;

    const colocado = this.construir(nuevo, puesto.ubicacionId);
    if (!colocado) return;

    const otro = this.accesoriosSeleccionados().find(s => s.accesorioId === nuevo.id);
    let intercambiado: AccesorioColocado | null = null;

    if (otro?.ubicacionId !== undefined) {
      const accesorioPuesto = this.catalogo().find(a => a.id === puesto.accesorioId);
      intercambiado = accesorioPuesto ? this.construir(accesorioPuesto, otro.ubicacionId) : null;
      if (!intercambiado) return;
    }

    this.accesoriosSeleccionados.update(lista => [
      ...lista.filter(s => s.ubicacionId !== puesto.ubicacionId && s.ubicacionId !== otro?.ubicacionId),
      colocado,
      ...(intercambiado ? [intercambiado] : [])
    ]);

    this.invalidarPorCategoria(nuevo.categoria);
    this.cancelarReemplazo();
  }


  dibujarLentes(canvas: HTMLCanvasElement, ancho: number,
    alto: number): void {
    const visor = canvas.closest('.visor') as HTMLElement;
    if (!visor) return;
    const anchoPx = visor.clientWidth * ancho / 100;
    const altoPx = visor.clientHeight * alto / 100;


    const contexto = canvas.getContext('2d');



    if (!contexto) return;

    this.imagenLentes.onload = () => {
      canvas.width = anchoPx;
      canvas.height = altoPx;

      contexto.clearRect(0, 0, canvas.width, canvas.height);

      contexto.drawImage(
        this.imagenLentes,
        0,
        0,
        canvas.width,
        canvas.height
      );

      // Aplicar el color sin pintar el fondo transparente
      contexto.globalCompositeOperation = 'source-atop';
      contexto.fillStyle = this.colorSeleccionado === 'negro' ? '#000000' : '#795548';
      contexto.fillRect(0, 0, canvas.width, canvas.height);

      contexto.globalCompositeOperation = 'source-over';


    };

    this.imagenLentes.onerror = () => {
      console.error('No se pudo cargar la imagen de los lentes');
    };

    this.imagenLentes.src = '/accesorios/lentes.png';
  }


  cambiarColorLentes(color: string): void {

    this.colorSeleccionado = color;
    this.invalidarGuardado('lentes');

    // Si los lentes no están en el visor, solo se recuerda el color:
    // se aplicará cuando se agreguen (dibujarLentes lo lee)
    if (!this.canvasLentes) return;

    const canvas = this.canvasLentes.nativeElement as HTMLCanvasElement;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    // Redibujar la imagen original
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(this.imagenLentes, 0, 0, canvas.width, canvas.height);

    // Aplicar el color sin pintar el fondo transparente
    ctx.globalCompositeOperation = 'source-atop';
    ctx.fillStyle = color === 'negro' ? '#000000' : '#795548';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.globalCompositeOperation = 'source-over';
  }

  hayLentes = computed(() =>
    this.accesoriosSeleccionados().some(
      a => a.accesorioId === 1
    )
  );


  // ==========================================
  // CATEGORÍAS Y CHECKS
  // ==========================================

  // Categoría elegida en la lista desplegable ('' = ninguna)
  categoriaActual = signal('');

  // Categorías disponibles (sin repetir, en el orden en que aparecen)
  categorias = computed(() =>
    [...new Set(this.catalogo().map(a => a.categoria ?? 'Otros'))]
  );

  // Accesorios de la categoría elegida
  accesoriosDeCategoria = computed(() =>
    this.catalogo().filter(a => (a.categoria ?? 'Otros') === this.categoriaActual())
  );

  // Ids marcados con el check (de todas las categorías), en el orden en que se marcaron
  idsMarcados = signal<number[]>([]);

  // Accesorios marcados: son las tarjetas que se muestran con Agregar / Quitar
  accesoriosMarcados = computed(() =>
    this.idsMarcados()
      .map(id => this.catalogo().find(a => a.id === id))
      .filter((a): a is Accesorio => !!a)
  );

  estaMarcado(accesorioId: number): boolean {
    return this.idsMarcados().includes(accesorioId);
  }

  // Check marcado = aparece la tarjeta; desmarcado = desaparece y se quita del visor
  alternarMarcado(accesorio: Accesorio, marcado: boolean): void {
    if (marcado) {
      this.idsMarcados.update(ids =>
        ids.includes(accesorio.id) ? ids : [...ids, accesorio.id]
      );
    } else {
      this.quitarAccesorio(accesorio.id);
      this.idsMarcados.update(ids => ids.filter(i => i !== accesorio.id));
    }
  }


  // Rotación y modo espejo (de la ubicación o de la excepción; si no tiene, queda normal)
  transformar(a: AccesorioColocado): string {
    const espejo = a.espejo ? ' scaleX(-1)' : '';
    return `perspective(600px) rotateX(${a.rotX ?? 0}deg) rotateY(${a.rotY ?? 0}deg) rotateZ(${a.rotZ ?? 0}deg)${espejo}`;
  }


  private agregarPorDefecto(): void {
    // 1) Los elementos fijos del producto salen siempre puestos
    const fijos: AccesorioColocado[] = [];

    for (const u of this.ubicaciones()) {
      if (u.estado !== 'fija' || !u.fijoId) continue;

      const accesorio = this.catalogo().find(a => a.id === u.fijoId);
      const nuevo = accesorio ? this.construir(accesorio, u.id) : null;

      if (nuevo) fijos.push(nuevo);
    }

    this.accesoriosSeleccionados.set(fijos);

    // 2) Al iniciar salen puestos los accesorios que no necesitan pregunta: hasta 3 que
    // cuentan (izquierda, derecha y cabeza) más los de Personalización (el nombre).
    // El cuarto accesorio (centro) lo agrega el cliente y se le pregunta.
    for (const accesorio of this.catalogo()) {
      if (this.esFijo(accesorio.id)) continue;
      if (this.cuenta(accesorio) && this.cantidadContada() >= this.ACCESORIOS_SIN_PREGUNTAR) continue;

      const ubicacionId = this.destino(accesorio);
      if (ubicacionId === null || this.ocupante(ubicacionId)) continue;

      this.colocar(accesorio);
    }

    // Sus checks salen marcados y sus tarjetas visibles desde el inicio
    this.idsMarcados.set(this.accesoriosSeleccionados().map(a => a.accesorioId));
  }






}