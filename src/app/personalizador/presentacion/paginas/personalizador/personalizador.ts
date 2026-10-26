import {
  Component, OnInit, signal, ViewChild, ElementRef,
  computed,
  inject,
  PLATFORM_ID
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TextoCanvas } from '../../../../shared/directivas/texto-canvas';
import { ExcepcionGuardada, Geometria, UbicacionGuardada } from '../../../dominio/ubicaciones';
import Swal from 'sweetalert2';
import { isPlatformBrowser } from '@angular/common';

@Component({
  imports: [FormsModule,
    TextoCanvas],
  selector: 'app-personalizador',
  styleUrl: './personalizador.css',
  templateUrl: './personalizador.html',
})

export class Personalizador {


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

      // Abrir la primera categoría para mostrar los checks.
      this.categoriaActual.set(this.categorias()[0] ?? '');

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