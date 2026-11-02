import { Component, afterNextRender, computed, inject, signal } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { CarritoService } from '../../../../carrito/aplicacion/servicios/CarritoService';
import { CheckoutService, DatosCheckout } from '../../../aplicacion/servicios/CheckoutService';
import { UbicacionesService } from '../../../aplicacion/servicios/UbicacionesService';
import { ECUADOR, Pais, PaisesService } from '../../../aplicacion/servicios/PaisesService';
import {
  correoValido, documentoValido, normalizar, soloDigitos, telefonoValido
} from '../../../dominio/validaciones/validaciones';

type Lista = 'provincia' | 'ciudad' | 'pais' | 'fProvincia' | 'fCiudad';

@Component({
  selector: 'app-envio-facturacion',
  imports: [RouterLink],
  templateUrl: './envio-facturacion.html',
  styleUrl: './envio-facturacion.css',
})
export class EnvioFacturacion {

  // ===== EDITABLES =====
  readonly RUTA_VOLVER = '/carrito';
  readonly RUTA_PAGO = '/checkout/pago';   // "Continuar a pago"
  readonly LOGO = '/logo_sin_fondo.png';

  private checkout = inject(CheckoutService);
  private ubicaciones = inject(UbicacionesService);
  private paisesApi = inject(PaisesService);
  private router = inject(Router);
  private document = inject(DOCUMENT);

  datos = this.checkout.datos;
  cantidadCarrito = inject(CarritoService).cantidad;

  // ----- Provincias y ciudades (API) -----
  provincias = signal<string[]>([]);
  ciudades = signal<string[]>([]);
  cargandoProvincias = signal(false);
  cargandoCiudades = signal(false);
  errorProvincias = signal(false);
  errorCiudades = signal(false);
  private pedidoCiudades = 0; // para ignorar respuestas viejas si el cliente cambia de provincia rápido

  // Ciudades de la provincia de facturación (otros datos de facturación)
  fCiudades = signal<string[]>([]);
  cargandoFCiudades = signal(false);
  errorFCiudades = signal(false);
  private pedidoFCiudades = 0;

  // ----- Países del número de contacto (API) -----
  paises = signal<Pais[]>([ECUADOR]);

  paisContacto = computed(() =>
    this.paises().find(p => p.codigo === this.datos().contactoPais) ?? ECUADOR
  );

  // ----- Listas desplegables con buscador -----
  abierta = signal<Lista | null>(null);
  consulta = signal('');
  activo = signal(0);

  opcionesProvincia = computed(() => this.filtrar(this.provincias(), this.consulta()));
  opcionesCiudad = computed(() => this.filtrar(this.ciudades(), this.consulta()));
  opcionesFProvincia = computed(() => this.filtrar(this.provincias(), this.consulta()));
  opcionesFCiudad = computed(() => this.filtrar(this.fCiudades(), this.consulta()));
  opcionesPais = computed(() => {
    const q = normalizar(this.consulta().trim().replace(/^\+/, ''));
    const todos = this.paises();
    if (!q) return todos;
    return todos.filter(p => normalizar(p.nombre).includes(q) || p.prefijo.replace('+', '').startsWith(q));
  });

  // ----- Validación -----
  intento = signal(false);
  private tocados = signal<ReadonlySet<string>>(new Set());

  errores = computed<Record<string, string>>(() => {
    const d = this.datos();
    const e: Record<string, string> = {};

    if (d.nombre.trim().length < 3) e['nombre'] = 'Escribe tu nombre completo';
    if (!documentoValido(d.tipoDoc, d.cedula)) {
      e['cedula'] = d.tipoDoc === 'ruc'
        ? 'Ingresa un RUC válido de 13 dígitos'
        : 'Ingresa una cédula válida de 10 dígitos';
    }
    if (!telefonoValido(d.celular, '+593')) e['celular'] = 'Escribe un celular válido. Ej. 099 123 4567';
    if (!correoValido(d.correo)) e['correo'] = 'Ingresa un correo válido';
    if (!d.provincia) e['provincia'] = 'Elige una provincia';
    if (!d.ciudad) e['ciudad'] = 'Elige una ciudad';
    if (d.direccion.trim().length < 5) e['direccion'] = 'Escribe tu dirección completa';

    // Otros datos de facturación: los mismos campos del envío, menos la referencia
    if (d.facturacion === 'otros') {
      if (d.fNombre.trim().length < 3) e['fNombre'] = 'Escribe el nombre o razón social';
      if (!documentoValido(d.fTipoDoc, d.fCedula)) {
        e['fCedula'] = d.fTipoDoc === 'ruc'
          ? 'Ingresa un RUC válido de 13 dígitos'
          : 'Ingresa una cédula válida de 10 dígitos';
      }
      if (!telefonoValido(d.fCelular, '+593')) e['fCelular'] = 'Escribe un celular válido. Ej. 099 123 4567';
      if (!correoValido(d.fCorreo)) e['fCorreo'] = 'Ingresa un correo válido';
      if (!d.fProvincia) e['fProvincia'] = 'Elige una provincia';
      if (!d.fCiudad) e['fCiudad'] = 'Elige una ciudad';
      if (d.fDireccion.trim().length < 5) e['fDireccion'] = 'Escribe la dirección de facturación';
    }

    if (d.contacto === 'otro' && !telefonoValido(d.contactoNumero, this.paisContacto().prefijo)) {
      e['telefono'] = this.paisContacto().prefijo === '+593'
        ? 'Escribe un celular válido. Ej. 099 123 4567'
        : 'Escribe un número válido';
    }

    return e;
  });

  constructor() {
    // Solo en el navegador: así el servidor y el cliente pintan lo mismo en el primer render
    afterNextRender(() => {
      this.checkout.restaurar();

      this.cargarProvincias();
      if (this.datos().provincia) this.cargarCiudades(this.datos().provincia);
      if (this.datos().fProvincia) this.cargarFCiudades(this.datos().fProvincia);

      this.paisesApi.paises()
        .then(lista => this.paises.set(lista))
        .catch(() => this.paises.set([ECUADOR])); // sin internet: queda solo Ecuador (+593)
    });
  }

  // ===== Campos de texto =====
  escribir(campo: keyof DatosCheckout, valor: string): void {
    this.checkout.actualizar({ [campo]: valor } as Partial<DatosCheckout>);
  }

  // Cédula y teléfono: solo números
  escribirNumero(campo: keyof DatosCheckout, input: HTMLInputElement): void {
    const limpio = soloDigitos(input.value);
    if (input.value !== limpio) input.value = limpio;
    this.escribir(campo, limpio);
  }

  // Al cambiar entre cédula y RUC se recorta el número si ya no cabe
  cambiarTipoDoc(tipo: string): void {
    const t: 'cedula' | 'ruc' = tipo === 'ruc' ? 'ruc' : 'cedula';
    const maximo = t === 'ruc' ? 13 : 10;
    this.checkout.actualizar({ tipoDoc: t, cedula: this.datos().cedula.slice(0, maximo) });
  }

  // Igual que cambiarTipoDoc, para el documento de facturación
  cambiarFTipoDoc(tipo: string): void {
    const t: 'cedula' | 'ruc' = tipo === 'ruc' ? 'ruc' : 'cedula';
    const maximo = t === 'ruc' ? 13 : 10;
    this.checkout.actualizar({ fTipoDoc: t, fCedula: this.datos().fCedula.slice(0, maximo) });
  }

  tocar(campo: string): void {
    if (this.tocados().has(campo)) return;
    this.tocados.update(s => new Set(s).add(campo));
  }

  // El error se muestra al salir del campo o al intentar continuar
  verError(campo: string): string {
    return this.intento() || this.tocados().has(campo) ? (this.errores()[campo] ?? '') : '';
  }

  // ===== API: provincias y ciudades =====
  cargarProvincias(): void {
    this.cargandoProvincias.set(true);
    this.errorProvincias.set(false);

    this.ubicaciones.provincias()
      .then(lista => this.provincias.set(lista))
      .catch(() => this.errorProvincias.set(true))
      .finally(() => this.cargandoProvincias.set(false));
  }

  cargarCiudades(provincia: string): void {
    const pedido = ++this.pedidoCiudades;
    this.ciudades.set([]);
    this.cargandoCiudades.set(true);
    this.errorCiudades.set(false);

    this.ubicaciones.ciudades(provincia)
      .then(lista => { if (pedido === this.pedidoCiudades) this.ciudades.set(lista); })
      .catch(() => { if (pedido === this.pedidoCiudades) this.errorCiudades.set(true); })
      .finally(() => { if (pedido === this.pedidoCiudades) this.cargandoCiudades.set(false); });
  }

  cargarFCiudades(provincia: string): void {
    const pedido = ++this.pedidoFCiudades;
    this.fCiudades.set([]);
    this.cargandoFCiudades.set(true);
    this.errorFCiudades.set(false);

    this.ubicaciones.ciudades(provincia)
      .then(lista => { if (pedido === this.pedidoFCiudades) this.fCiudades.set(lista); })
      .catch(() => { if (pedido === this.pedidoFCiudades) this.errorFCiudades.set(true); })
      .finally(() => { if (pedido === this.pedidoFCiudades) this.cargandoFCiudades.set(false); });
  }

  reintentarFCiudades(): void {
    const provincia = this.datos().fProvincia;
    if (provincia) this.cargarFCiudades(provincia);
  }

  reintentarCiudades(): void {
    const provincia = this.datos().provincia;
    if (provincia) this.cargarCiudades(provincia);
  }

  // ===== Listas desplegables =====
  abrir(lista: Lista): void {
    if (lista === 'ciudad' && !this.datos().provincia) return;
    if (lista === 'fCiudad' && !this.datos().fProvincia) return;
    this.abierta.set(lista);
    this.consulta.set('');
    this.activo.set(0);
  }

  cerrar(lista: Lista): void {
    if (this.abierta() === lista) this.abierta.set(null);
    this.tocar(lista === 'pais' ? 'telefono' : lista);
  }

  // Botón del código telefónico: abre la lista y deja el cursor en el buscador
  alternarPais(): void {
    if (this.abierta() === 'pais') {
      this.cerrar('pais');
      return;
    }
    this.abrir('pais');
    setTimeout(() => this.document.querySelector<HTMLInputElement>('.buscar-pais')?.focus());
  }

  escribirBusqueda(lista: Lista, texto: string): void {
    if (this.abierta() !== lista) this.abierta.set(lista);
    this.consulta.set(texto);
    this.activo.set(0);
  }

  // Lo que se ve en el campo: lo que se está buscando o, si no se abrió, lo ya elegido
  textoCampo(lista: 'provincia' | 'ciudad' | 'fProvincia' | 'fCiudad'): string {
    return this.abierta() === lista ? this.consulta() : this.datos()[lista];
  }

  opciones(lista: Lista): readonly string[] | readonly Pais[] {
    return lista === 'provincia' ? this.opcionesProvincia()
      : lista === 'ciudad' ? this.opcionesCiudad()
        : lista === 'fProvincia' ? this.opcionesFProvincia()
          : lista === 'fCiudad' ? this.opcionesFCiudad()
            : this.opcionesPais();
  }

  elegirProvincia(nombre: string): void {
    if (nombre !== this.datos().provincia) {
      this.checkout.actualizar({ provincia: nombre, ciudad: '' });
      this.cargarCiudades(nombre);
    }
    this.abierta.set(null);
    this.tocar('provincia');
  }

  elegirCiudad(nombre: string): void {
    this.checkout.actualizar({ ciudad: nombre });
    this.abierta.set(null);
    this.tocar('ciudad');
  }

  elegirFProvincia(nombre: string): void {
    if (nombre !== this.datos().fProvincia) {
      this.checkout.actualizar({ fProvincia: nombre, fCiudad: '' });
      this.cargarFCiudades(nombre);
    }
    this.abierta.set(null);
    this.tocar('fProvincia');
  }

  elegirFCiudad(nombre: string): void {
    this.checkout.actualizar({ fCiudad: nombre });
    this.abierta.set(null);
    this.tocar('fCiudad');
  }

  elegirPais(pais: Pais): void {
    this.checkout.actualizar({ contactoPais: pais.codigo });
    this.abierta.set(null);
  }

  teclado(evento: KeyboardEvent, lista: Lista): void {
    const total = this.opciones(lista).length;

    switch (evento.key) {
      case 'ArrowDown':
        evento.preventDefault();
        if (this.abierta() !== lista) { this.abrir(lista); return; }
        this.activo.set(Math.min(total - 1, this.activo() + 1));
        this.mostrarActivo();
        break;
      case 'ArrowUp':
        evento.preventDefault();
        this.activo.set(Math.max(0, this.activo() - 1));
        this.mostrarActivo();
        break;
      case 'Enter': {
        if (this.abierta() !== lista) return;
        evento.preventDefault();
        const opcion = this.opciones(lista)[this.activo()];
        if (opcion === undefined) return;
        if (lista === 'provincia') this.elegirProvincia(opcion as string);
        else if (lista === 'ciudad') this.elegirCiudad(opcion as string);
        else if (lista === 'fProvincia') this.elegirFProvincia(opcion as string);
        else if (lista === 'fCiudad') this.elegirFCiudad(opcion as string);
        else this.elegirPais(opcion as Pais);
        break;
      }
      case 'Escape':
        if (this.abierta() === lista) {
          evento.preventDefault();
          this.abierta.set(null);
        }
        break;
    }
  }

  // Si la opción activa queda fuera de la vista de la lista, la desplaza
  private mostrarActivo(): void {
    setTimeout(() => this.document.querySelector('.opcion.activa')?.scrollIntoView?.({ block: 'nearest' }));
  }

  // ===== Continuar =====
  continuar(): void {
    this.intento.set(true);

    if (Object.keys(this.errores()).length) {
      // Lleva al cliente al primer campo con error
      setTimeout(() => {
        const campo = this.document.querySelector<HTMLElement>('[aria-invalid="true"]');
        campo?.scrollIntoView?.({ block: 'center', behavior: 'smooth' });
        campo?.focus({ preventScroll: true });
      });
      return;
    }

    this.router.navigateByUrl(this.RUTA_PAGO);
  }

  // Sin tildes, mayúsculas ni orden: "g" encuentra Guayaquil, "guayaquil" y "Guáyaquil". Primero las que empiezan igual.
  private filtrar(lista: string[], consulta: string): string[] {
    const q = normalizar(consulta.trim());
    if (!q) return lista;

    const empiezan: string[] = [];
    const contienen: string[] = [];
    for (const item of lista) {
      const n = normalizar(item);
      if (n.startsWith(q)) empiezan.push(item);
      else if (n.includes(q)) contienen.push(item);
    }
    return [...empiezan, ...contienen];
  }

}