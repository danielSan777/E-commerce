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
import { isPlatformBrowser, NgTemplateOutlet } from '@angular/common';

export type IdPestana = 'nombre' | 'lentes' | 'accesorios' | 'dedicatoria';

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
  colorGafas: string;           // color de las gafas (accesorio 5): negro, cafe o dorado
  dedicatoria: string;          // mensaje de la tarjeta de dedicatoria
  fotoDedicatoria: File | null; // foto de la tarjeta (opcional)
  textoMarco: string;           // frase del marco (solo si eligió el accesorio 4)
  fotoMarco: File | null;       // foto del marco (solo si eligió el accesorio 3)
  sinTarjeta: boolean;          // "No deseo tarjeta de dedicatoria"
  tarjetaPorWhatsapp: boolean;  // "Prefiero enviar mi tarjeta por WhatsApp"
  fotoMarcoPorWhatsapp: boolean; // marco con foto (accesorio 3): "enviar la foto de mi marco por WhatsApp"
  fraseMarcoPorWhatsapp: boolean; // marco con frase (accesorio 4): "enviar mi frase por WhatsApp"
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

  colorSeleccionado = 'negro';   // color de los lentes (accesorio 1)
  colorGafas = 'negro';          // color de las gafas (accesorio 5)

  private readonly ID_LENTES = 1;
  private readonly ID_GAFAS = 5;

  // Colores disponibles (los lentes usan negro y cafe; las gafas tambien dorado)
  private readonly COLORES: Record<string, string> = {
    negro: '#000000',
    cafe: '#795548',
    dorado: '#d4af37',
  };

  @ViewChild('canvasLentes')
  canvasLentes!: ElementRef<HTMLCanvasElement>;

  private imagenLentes = new Image();

  @ViewChild('visor')
  visor!: ElementRef<HTMLDivElement>;

  // Caja de "accesorios seleccionados" (arriba de la lista de Accesorios)
  @ViewChild('chips')
  chips?: ElementRef<HTMLElement>;

  nombreCliente = signal('');

  // true cuando el accesorio de texto está agregado al visor
  hayTexto = computed(() =>
    this.accesoriosSeleccionados().some(a => a.tipo === 'texto')
  );

  private siguienteId = 1;

  private platformId = inject(PLATFORM_ID);




  @ViewChild('canvasLentes')
  set canvasLentesRef(
    referencia: ElementRef<HTMLCanvasElement> | undefined
  ) {
    if (referencia) {

      // Lentes (id 1) o gafas (id 5): los dos se dibujan en un canvas para poder cambiarles el color
      const lentes = this.accesoriosSeleccionados()
        .find(accesorio => accesorio.accesorioId === this.ID_LENTES || accesorio.accesorioId === this.ID_GAFAS);

      if (lentes) {

        this.dibujarLentes(
          referencia.nativeElement,
          lentes.ancho,
          lentes.alto,
          lentes.accesorioId,
          lentes.imagen
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
      // La categoria se normaliza (sin espacios y con la primera letra en mayuscula)
      // para que "moda" cuente igual que "Moda"
      const normalizar = (c?: string) => {
        const t = c?.trim();
        return t ? t.charAt(0).toUpperCase() + t.slice(1) : t;
      };
      this.catalogo.set(
        ((guardado.catalogo ?? []) as Accesorio[]).map(a => ({ ...a, categoria: normalizar(a.categoria) }))
      );

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

  // ----- Límite: solo cuentan 2 accesorios -----
  // NO cuentan: los de categoría Moda (lentes), el nombre (Personalización) ni los elementos fijos.
  private cuenta(accesorio: { categoria?: string }): boolean {
    const c = accesorio.categoria ?? 'Otros';
    return c !== 'Moda' && c !== 'Personalización';
  }

  // Cuántos accesorios que cuentan hay puestos
  cantidadContada(): number {
    return this.accesoriosSeleccionados().filter(
      a => this.cuenta(a) && !this.esFijo(a.accesorioId)
    ).length;
  }

  // true si ya hay 2 accesorios que cuentan y este también contaría (hay que quitar uno)
  private limiteAlcanzado(accesorio: { id: number; categoria?: string }): boolean {
    return this.cuenta(accesorio)
      && !this.esFijo(accesorio.id)
      && this.cantidadContada() >= this.maximoAccesorios;
  }

  // ----- Accesorios que no se pueden elegir juntos: el 3 y el 4 -----
  private readonly ID_MARCO_FOTO = 3;   // marco con foto
  private readonly ID_MARCO_FRASE = 4;  // marco con frase

  private companeroExcluyente(id: number): number | null {
    if (id === this.ID_MARCO_FOTO) return this.ID_MARCO_FRASE;
    if (id === this.ID_MARCO_FRASE) return this.ID_MARCO_FOTO;
    return null;
  }

  // true si el accesorio no se puede elegir porque ya está elegido su opuesto (3 ↔ 4)
  private choca(accesorio: { id: number }, ignorarId?: number): boolean {
    const otro = this.companeroExcluyente(accesorio.id);
    return otro !== null && otro !== ignorarId && this.estaSeleccionado(otro);
  }

  // Pone el accesorio en su destino. Si ahí había otro accesorio, lo reemplaza.
  private colocar(accesorio: Accesorio): void {
    const ubicacionId = this.destino(accesorio);
    if (ubicacionId === null) return;

    const nuevo = this.construir(accesorio, ubicacionId);
    if (!nuevo) return;

    const desplazado = this.ocupante(ubicacionId);

    this.accesoriosSeleccionados.update(lista => [
      ...lista.filter(s => s.ubicacionId !== ubicacionId),
      nuevo
    ]);

    this.invalidarPorAccesorio(accesorio);
    if (desplazado) {
      this.invalidarPorAccesorio({ id: desplazado.accesorioId, categoria: desplazado.categoria });
    }
  }

  // Agregar un accesorio. Ya no hay pregunta del cuarto accesorio: el límite es 2
  // y, para elegir otro, primero hay que quitar uno.
  async agregarAccesorio(accesorio: Accesorio): Promise<void> {
    if (this.esFijo(accesorio.id) || this.estaSeleccionado(accesorio.id)) return;
    if (this.choca(accesorio) || this.limiteAlcanzado(accesorio)) return;

    this.colocar(accesorio);
  }


  // ==========================================
  // PANEL NUEVO: contador, categorías y tarjetas
  // ==========================================

  // "0/2 elegidos": cuántos accesorios (que cuentan) lleva puestos
  readonly maximoAccesorios = 2;   // EDITABLE: cuántos accesorios pueden elegirse

  cantidadAccesorios = computed(() =>
    this.accesoriosSeleccionados().filter(
      a => this.cuenta(a) && !this.esFijo(a.accesorioId)
    ).length
  );

  // Accesorios que cuentan para el límite (los que se muestran arriba con su X para quitarlos)
  accesoriosElegidos = computed(() =>
    this.accesoriosSeleccionados().filter(
      a => this.cuenta(a) && !this.esFijo(a.accesorioId)
    )
  );

  // Segmentos de la barra de progreso (3, o más si agregó un cuarto)
  segmentos = computed(() =>
    Array.from({ length: Math.max(this.maximoAccesorios, this.cantidadAccesorios()) }, (_, i) => i)
  );

  // ==========================================
  // PESTAÑAS: Nombre · Lentes / Gafas · Accesorios · Dedicatoria / Marcos
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
      id: 'accesorios', titulo: 'Accesorios', subtitulo: `Hasta ${this.maximoAccesorios}`, icono: 'bi-gift',
      ayuda: `Selecciona hasta ${this.maximoAccesorios} complementos.`
    },
    {
      id: 'dedicatoria', titulo: 'Dedicatoria / Marcos', icono: 'bi-card-text',
      ayuda: 'Completa la información de tu tarjeta y marco.'
    },
  ];

  pestana = signal<IdPestana>('accesorios');

  pestanaActual = computed(() =>
    this.pestanas.find(p => p.id === this.pestana()) ?? this.pestanas[2]
  );

  // En celular las opciones salen de abajo hacia arriba como una hoja (ver el CSS).
  // En pantallas medias y grandes el panel se ve siempre en su lugar.
  hojaAbierta = signal(false);

  // true mientras la hoja baja y desaparece (animación de cierre)
  hojaCerrando = signal(false);

  // true si al abrir la hoja se añadió una entrada al historial (para el botón "atrás" del celular)
  private entradaHistorial = false;

  private esCelular(): boolean {
    return typeof window !== 'undefined' && window.matchMedia('(max-width: 767.98px)').matches;
  }

  private abrirHoja(): void {
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
    this.avisoLimite.set(false);
    this.cancelarReemplazo();
    this.marcoPendiente.set(null);

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
    this.avisoLimite.set(false);
    this.cancelarReemplazo();
    this.marcoPendiente.set(null);
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

  // Cambió un accesorio: la opción a la que pertenece deja de estar guardada.
  // Los accesorios 3 y 4 cambian la sección 3 de "Dedicatoria / Marcos".
  private invalidarPorAccesorio(accesorio: { id: number; categoria?: string }): void {
    this.invalidarPorCategoria(accesorio.categoria);
    if (accesorio.id === this.ID_MARCO_FOTO || accesorio.id === this.ID_MARCO_FRASE) {
      this.marcoWhatsapp.set(false);
      this.invalidarGuardado('dedicatoria');
    }
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
        // Obligatorio: hay que elegir los 2 accesorios
        return this.cantidadAccesorios() >= this.maximoAccesorios
          ? ''
          : `Debes elegir ${this.maximoAccesorios} accesorios para continuar.`;

      case 'dedicatoria':
        // 1) mensaje de la tarjeta
        if (this.tarjetaObligatoria() && !this.dedicatoria().trim()) {
          return 'Escribe el mensaje para la tarjeta de dedicatoria.';
        }
        // 3) marco con foto (accesorio 3) o con frase (accesorio 4)
        if (this.hayMarcoFoto() && !this.marcoWhatsapp() && !this.fotoMarcoArchivo) {
          return 'Sube la foto para tu marco.';
        }
        if (this.hayMarcoFrase() && !this.marcoWhatsapp() && !this.textoMarco().trim()) {
          return 'Escribe la frase para tu marco.';
        }
        return '';
    }
  }

  // Botón "Aceptar" de cada opción
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
  // La primera es "Todos" (todos los accesorios de esta pestaña juntos)
  private readonly TODOS = 'Todos';

  categoriasAccesorios = computed(() => [
    this.TODOS,
    ...this.categorias().filter(c => c !== this.CATEGORIA_MODA && c !== this.CATEGORIA_PERSONALIZACION)
  ]);

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
    Todos: 'bi-box',
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
    if (this.noDisponible(accesorio)) {
      if (this.choca(accesorio)) return 'Ya tienes un marco: toca para reemplazarlo por este';
      if (this.limiteAlcanzado(accesorio)) {
        return `Máximo ${this.maximoAccesorios} accesorios: quita uno para elegir este`;
      }
      return 'No disponible';
    }
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

  // ==========================================
  // DEDICATORIA / MARCOS
  // ==========================================
  // 1) Mensaje de la tarjeta (obligatorio)
  // 2) Foto de la tarjeta (opcional)
  // 3) Solo aparece si eligió el accesorio 3 (foto para el marco) o el 4 (frase para el marco)
  // Al final: opciones adicionales (sin tarjeta / enviar por WhatsApp)

  readonly maxNombre = 30;        // EDITABLE: caracteres del nombre del visor
  readonly maxDedicatoria = 250;  // EDITABLE: caracteres del mensaje de la tarjeta
  readonly maxTextoMarco = 60;    // EDITABLE: caracteres de la frase del marco

  hayMarcoFoto = computed(() =>
    this.accesoriosSeleccionados().some(a => a.accesorioId === this.ID_MARCO_FOTO)
  );

  hayMarcoFrase = computed(() =>
    this.accesoriosSeleccionados().some(a => a.accesorioId === this.ID_MARCO_FRASE)
  );

  // ----- 1) Mensaje de la tarjeta -----
  dedicatoria = signal('');

  escribirDedicatoria(evento: Event): void {
    this.dedicatoria.set((evento.target as HTMLTextAreaElement).value.slice(0, this.maxDedicatoria));
    this.cambioDedicatoria();
  }

  // ----- 2) Foto de la tarjeta (opcional) -----
  fotoTarjetaUrl = signal<string | null>(null);
  fotoTarjetaNombre = signal('');
  errorFotoTarjeta = signal('');
  private fotoTarjetaArchivo: File | null = null;

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
    this.liberarFotoTarjeta();
    this.fotoTarjetaArchivo = archivo;
    this.fotoTarjetaUrl.set(URL.createObjectURL(archivo));
    this.fotoTarjetaNombre.set(archivo.name);
    this.cambioDedicatoria();
  }

  quitarFotoTarjeta(input: HTMLInputElement): void {
    this.liberarFotoTarjeta();
    this.fotoTarjetaArchivo = null;
    this.fotoTarjetaUrl.set(null);
    this.fotoTarjetaNombre.set('');
    this.errorFotoTarjeta.set('');
    input.value = '';
    this.cambioDedicatoria();
  }

  private liberarFotoTarjeta(): void {
    const actual = this.fotoTarjetaUrl();
    if (actual) URL.revokeObjectURL(actual);
  }

  // ----- 3a) Marco con foto (accesorio 3) -----
  fotoMarcoUrl = signal<string | null>(null);
  fotoMarcoNombre = signal('');
  errorFotoMarco = signal('');
  private fotoMarcoArchivo: File | null = null;

  elegirFotoMarco(evento: Event): void {
    const input = evento.target as HTMLInputElement;
    const archivo = input.files?.[0];
    if (!archivo) return;

    const error = this.errorDeImagen(archivo);
    if (error) {
      this.errorFotoMarco.set(error);
      input.value = '';
      return;
    }

    this.errorFotoMarco.set('');
    this.liberarFotoMarco();
    this.fotoMarcoArchivo = archivo;
    this.fotoMarcoUrl.set(URL.createObjectURL(archivo));
    this.fotoMarcoNombre.set(archivo.name);
    this.cambioDedicatoria();
  }

  quitarFotoMarco(input: HTMLInputElement): void {
    this.liberarFotoMarco();
    this.fotoMarcoArchivo = null;
    this.fotoMarcoUrl.set(null);
    this.fotoMarcoNombre.set('');
    this.errorFotoMarco.set('');
    input.value = '';
    this.cambioDedicatoria();
  }

  private liberarFotoMarco(): void {
    const actual = this.fotoMarcoUrl();
    if (actual) URL.revokeObjectURL(actual);
  }

  // ----- 3b) Marco con frase (accesorio 4) -----
  textoMarco = signal('');

  escribirTextoMarco(evento: Event): void {
    this.textoMarco.set((evento.target as HTMLTextAreaElement).value.slice(0, this.maxTextoMarco));
    this.cambioDedicatoria();
  }

  // ----- Opciones adicionales -----
  sinTarjeta = signal(false);       // No deseo tarjeta de dedicatoria
  tarjetaWhatsapp = signal(false);  // Enviaré mi tarjeta por WhatsApp
  marcoWhatsapp = signal(false);    // Enviaré la foto (accesorio 3) o la frase (accesorio 4) de mi marco por WhatsApp

  // El mensaje de la tarjeta es obligatorio, salvo que no quiera tarjeta o la envíe por WhatsApp
  tarjetaObligatoria = computed(() => !this.sinTarjeta() && !this.tarjetaWhatsapp());

  alternarSinTarjeta(): void {
    const marcada = !this.sinTarjeta();
    this.sinTarjeta.set(marcada);
    if (marcada) this.tarjetaWhatsapp.set(false); // no pueden ir las dos a la vez
    this.cambioDedicatoria();
  }

  alternarTarjetaWhatsapp(): void {
    const marcada = !this.tarjetaWhatsapp();
    this.tarjetaWhatsapp.set(marcada);
    if (marcada) this.sinTarjeta.set(false);
    this.cambioDedicatoria();
  }

  alternarMarcoWhatsapp(): void {
    this.marcoWhatsapp.update(v => !v);
    this.cambioDedicatoria();
  }

  // Cualquier cambio en esta pestaña: quita el error y deja de estar "guardada" (azul)
  private cambioDedicatoria(): void {
    this.errorPanel.set('');
    this.invalidarGuardado('dedicatoria');
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
    // Hay que tener los 2 accesorios elegidos: si no, abre Accesorios y avisa
    if (this.cantidadAccesorios() < this.maximoAccesorios) {
      this.elegirPestana('accesorios');
      this.errorPanel.set(`Debes elegir ${this.maximoAccesorios} accesorios para continuar.`);
      return;
    }

    this.guardar.emit({
      accesorios: this.accesoriosSeleccionados(),
      nombre: this.nombreCliente(),
      colorLentes: this.colorSeleccionado,
      colorGafas: this.colorGafas,
      dedicatoria: this.dedicatoria(),
      fotoDedicatoria: this.fotoTarjetaArchivo,
      textoMarco: this.hayMarcoFrase() ? this.textoMarco() : '',
      fotoMarco: this.hayMarcoFoto() ? this.fotoMarcoArchivo : null,
      sinTarjeta: this.sinTarjeta(),
      tarjetaPorWhatsapp: this.tarjetaWhatsapp(),
      fotoMarcoPorWhatsapp: this.hayMarcoFoto() && this.marcoWhatsapp(),
      fraseMarcoPorWhatsapp: this.hayMarcoFrase() && this.marcoWhatsapp(),
    });
  }

  ngOnDestroy(): void {
    clearTimeout(this.temporizadorVibrar);
    if (this.entradaHistorial && history.state?.hojaPersonalizador) history.back();
    this.liberarFotoMarco();
    this.liberarFotoTarjeta();
  }

  cantidadEnCategoria(categoria: string): number {
    return this.catalogo().filter(a => (a.categoria ?? 'Otros') === categoria).length;
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

  // true si el accesorio no se puede elegir y todavía no está puesto:
  // sin ubicación, el opuesto (3 ↔ 4) ya está elegido, o ya hay 2 accesorios
  noDisponible(accesorio: Accesorio): boolean {
    return !this.esFijo(accesorio.id)
      && !this.estaSeleccionado(accesorio.id)
      && !this.puedeReemplazarCon(accesorio.id)
      && (this.destino(accesorio) === null
        || this.choca(accesorio)
        || this.limiteAlcanzado(accesorio));
  }

  // true si el accesorio solo está bloqueado porque ya hay 2 elegidos (hay que quitar uno).
  // Esa tarjeta se puede tocar: no agrega nada, solo avisa haciendo vibrar los elegidos.
  soloPorLimite(accesorio: Accesorio): boolean {
    return this.noDisponible(accesorio)
      && this.limiteAlcanzado(accesorio)
      && !this.choca(accesorio)
      && this.destino(accesorio) !== null;
  }

  // true si el accesorio solo está bloqueado porque ya hay elegido su opuesto (marco 3 ↔ 4).
  // Esa tarjeta se puede tocar: pregunta si se quiere reemplazar el marco.
  soloPorChoque(accesorio: Accesorio): boolean {
    return this.noDisponible(accesorio)
      && this.choca(accesorio)
      && this.destino(accesorio) !== null;
  }

  // Tarjeta bloqueada pero que se puede tocar (para avisar o preguntar)
  tocable(accesorio: Accesorio): boolean {
    return this.soloPorLimite(accesorio) || this.soloPorChoque(accesorio);
  }

  // Marco que el cliente quiere elegir teniendo ya el otro: espera "Reemplazar" o "Cancelar"
  marcoPendiente = signal<Accesorio | null>(null);

  // Solo se muestra mientras el otro marco siga elegido
  marcoPendienteActivo = computed(() => {
    const pendiente = this.marcoPendiente();
    return pendiente && this.choca(pendiente) ? pendiente : null;
  });

  // Id del último marco (3 o 4) de la lista: el aviso de reemplazo sale debajo de él
  ultimoMarcoId(lista: Accesorio[] | null | undefined): number | null {
    const marcos = (lista ?? []).filter(a => a.id === this.ID_MARCO_FOTO || a.id === this.ID_MARCO_FRASE);
    return marcos.length ? marcos[marcos.length - 1].id : null;
  }

  private preguntarReemplazoMarco(accesorio: Accesorio): void {
    this.marcoPendiente.set(accesorio);

    setTimeout(() =>
      document.getElementById('aviso-marco')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 60);
  }

  cancelarMarco(): void {
    this.marcoPendiente.set(null);
  }

  // "Reemplazar": quita el marco que había y pone el nuevo
  reemplazarMarco(): void {
    const nuevo = this.marcoPendiente();
    this.marcoPendiente.set(null);
    if (!nuevo) return;

    const otro = this.companeroExcluyente(nuevo.id);
    if (otro !== null) this.quitarAccesorio(otro);

    void this.agregarAccesorio(nuevo);
  }

  // Efecto de aviso: la caja de accesorios elegidos se pone roja y vibra
  vibrando = signal(false);
  private temporizadorVibrar: ReturnType<typeof setTimeout> | undefined;

  // true desde que intentó elegir un tercer accesorio hasta que quita uno (muestra el mensaje rojo)
  avisoLimite = signal(false);

  avisarLimite(): void {
    this.avisoLimite.set(true);
    clearTimeout(this.temporizadorVibrar);
    this.vibrando.set(false); // se apaga un instante para que la animación se repita

    this.chips?.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    this.temporizadorVibrar = setTimeout(() => {
      this.vibrando.set(true);
      this.temporizadorVibrar = setTimeout(() => this.vibrando.set(false), 700);
    }, 30);
  }

  // Clic en una tarjeta: reemplaza (si hay uno elegido para reemplazar), quita o agrega.
  async pulsarTarjeta(accesorio: Accesorio): Promise<void> {
    if (this.esFijo(accesorio.id)) return;

    this.marcoPendiente.set(null);

    if (this.puedeReemplazarCon(accesorio.id)) {
      this.reemplazarPor(accesorio);
      return;
    }

    if (this.estaSeleccionado(accesorio.id)) {
      this.quitarAccesorio(accesorio.id);
      return;
    }

    // Ya hay un marco (3 ↔ 4) y se toca el otro: se pregunta si se quiere reemplazar
    if (this.soloPorChoque(accesorio)) {
      this.preguntarReemplazoMarco(accesorio);
      return;
    }

    // Ya hay 2 accesorios: NO se agrega un tercero, solo se avisa
    if (this.soloPorLimite(accesorio)) {
      this.avisarLimite();
      return;
    }

    if (this.noDisponible(accesorio)) return;

    await this.agregarAccesorio(accesorio);
  }

  quitarAccesorio(id: number): void {
    // Los elementos fijos no se quitan
    if (this.esFijo(id)) return;

    this.avisoLimite.set(false);
    if (this.reemplazoDe() === id) this.reemplazoDe.set(null);
    if (this.marcoPendiente() && this.companeroExcluyente(this.marcoPendiente()!.id) === id) {
      this.marcoPendiente.set(null);
    }

    const quitado = this.accesoriosSeleccionados().find(a => a.accesorioId === id);
    if (quitado) this.invalidarPorAccesorio({ id, categoria: quitado.categoria });

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
      if (this.choca(a, puesto.accesorioId)) return false; // 3 y 4 no pueden ir juntos
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

    this.invalidarPorAccesorio(nuevo);
    this.invalidarPorAccesorio({ id: puesto.accesorioId, categoria: puesto.categoria });
    this.cancelarReemplazo();
  }


  // Dibuja lentes o gafas en su canvas y les aplica el color elegido
  dibujarLentes(canvas: HTMLCanvasElement, ancho: number,
    alto: number, accesorioId: number = this.ID_LENTES,
    imagen: string = 'accesorios/lentes.png'): void {
    const visor = canvas.closest('.visor') as HTMLElement;
    if (!visor) return;
    const anchoPx = visor.clientWidth * ancho / 100;
    const altoPx = visor.clientHeight * alto / 100;

    const contexto = canvas.getContext('2d');

    if (!contexto) return;

    const imagenNueva = new Image();

    imagenNueva.onload = () => {
      this.imagenLentes = imagenNueva;
      canvas.width = anchoPx;
      canvas.height = altoPx;

      this.pintar(contexto, canvas, imagenNueva, this.colorDe(accesorioId));
    };

    imagenNueva.onerror = () => {
      console.error('No se pudo cargar la imagen de los lentes o las gafas');
    };

    imagenNueva.src = '/' + imagen.replace(/^\//, '');
  }

  // Color (en hexadecimal) que le toca a lentes o gafas
  private colorDe(accesorioId: number): string {
    const nombre = accesorioId === this.ID_GAFAS ? this.colorGafas : this.colorSeleccionado;
    return this.COLORES[nombre] ?? this.COLORES['negro'];
  }

  // Dibuja la imagen original y le aplica el color sin pintar el fondo transparente
  private pintar(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement,
    imagen: HTMLImageElement, color: string): void {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(imagen, 0, 0, canvas.width, canvas.height);

    ctx.globalCompositeOperation = 'source-atop';
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.globalCompositeOperation = 'source-over';
  }

  // Redibuja lo que hay puesto (lentes o gafas) con otro color
  private repintar(color: string): void {
    // Si no hay lentes ni gafas en el visor, solo se recuerda el color:
    // se aplicara cuando se agreguen (dibujarLentes lo lee)
    if (!this.canvasLentes) return;

    const canvas = this.canvasLentes.nativeElement as HTMLCanvasElement;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    this.pintar(ctx, canvas, this.imagenLentes, color);
  }

  cambiarColorLentes(color: string): void {
    this.colorSeleccionado = color;
    this.invalidarGuardado('lentes');
    this.repintar(this.COLORES[color] ?? this.COLORES['negro']);
  }

  cambiarColorGafas(color: string): void {
    this.colorGafas = color;
    this.invalidarGuardado('lentes');
    this.repintar(this.COLORES[color] ?? this.COLORES['negro']);
  }

  hayLentes = computed(() =>
    this.accesoriosSeleccionados().some(
      a => a.accesorioId === this.ID_LENTES
    )
  );

  hayGafas = computed(() =>
    this.accesoriosSeleccionados().some(
      a => a.accesorioId === this.ID_GAFAS
    )
  );

  // true si hay algo de Moda puesto (lentes o gafas). Si no, la opcion "Nada" sale marcada.
  hayModa = computed(() =>
    this.accesoriosSeleccionados().some(
      a => (a.categoria ?? 'Otros') === this.CATEGORIA_MODA && !this.esFijo(a.accesorioId)
    )
  );

  // Opcion "Nada": quita los lentes o las gafas
  quitarModa(): void {
    this.accesoriosSeleccionados()
      .filter(a => (a.categoria ?? 'Otros') === this.CATEGORIA_MODA && !this.esFijo(a.accesorioId))
      .forEach(a => this.quitarAccesorio(a.accesorioId));
  }


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
  accesoriosDeCategoria = computed(() => {
    const actual = this.categoriaActual();

    return this.catalogo().filter(a => {
      const c = a.categoria ?? 'Otros';
      return actual === this.TODOS
        ? c !== this.CATEGORIA_MODA && c !== this.CATEGORIA_PERSONALIZACION
        : c === actual;
    });
  });

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

    // 2) Al iniciar salen puestos los accesorios por defecto: hasta 2 que cuentan
    // (más los de Moda y el nombre, que no cuentan). El 3 y el 4 nunca salen juntos.
    for (const accesorio of this.catalogo()) {
      if (this.esFijo(accesorio.id)) continue;
      if (this.limiteAlcanzado(accesorio) || this.choca(accesorio)) continue;

      const ubicacionId = this.destino(accesorio);
      if (ubicacionId === null || this.ocupante(ubicacionId)) continue;

      this.colocar(accesorio);
    }

    // Sus checks salen marcados y sus tarjetas visibles desde el inicio
    this.idsMarcados.set(this.accesoriosSeleccionados().map(a => a.accesorioId));
  }






}