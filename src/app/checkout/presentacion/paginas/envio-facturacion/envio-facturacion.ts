import { Component, afterNextRender, computed, inject, signal } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { CarritoService } from '../../../../carrito/aplicacion/servicios/CarritoService';
import { CheckoutService, DatosCheckout } from '../../../aplicacion/servicios/CheckoutService';
import { UbicacionesService } from '../../../aplicacion/servicios/UbicacionesService';
import {
  correoValido, documentoValido, normalizar, soloDigitos, telefonoValido
} from '../../../dominio/validaciones/validaciones';
import { envioDisponible, MENSAJE_SIN_ENVIO } from '../../../dominio/validaciones/envio';
import { buscarProvincia } from '../../../dominio/ubicaciones';

type Lista = 'provincia' | 'canton' | 'fProvincia' | 'fCanton';

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
  private router = inject(Router);
  private document = inject(DOCUMENT);

  datos = this.checkout.datos;
  cantidadCarrito = inject(CarritoService).cantidad;

  // ----- Provincias y cantones (archivo del INEC dentro del proyecto) -----
  provincias = this.ubicaciones.provincias();
  cantones = computed(() => this.ubicaciones.cantones(this.datos().provincia));
  fCantones = computed(() => this.ubicaciones.cantones(this.datos().fProvincia));

  // ----- Listas desplegables con buscador -----
  abierta = signal<Lista | null>(null);
  consulta = signal('');
  activo = signal(0);

  opcionesProvincia = computed(() => this.filtrar(this.provincias, this.consulta()));
  opcionesCanton = computed(() => this.filtrar(this.cantones(), this.consulta()));
  opcionesFProvincia = computed(() => this.filtrar(this.provincias, this.consulta()));
  opcionesFCanton = computed(() => this.filtrar(this.fCantones(), this.consulta()));

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
    else if (buscarProvincia(d.provincia)?.codigo === '20') e['provincia'] = MENSAJE_SIN_ENVIO;
    if (!d.canton) e['canton'] = 'Elige un cantón';
    else if (!envioDisponible(d.provincia, d.canton)) e['canton'] = MENSAJE_SIN_ENVIO;
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
      if (!d.fCanton) e['fCanton'] = 'Elige un cantón';
      if (d.fDireccion.trim().length < 5) e['fDireccion'] = 'Escribe la dirección de facturación';
    }

    if (d.contacto === 'otro' && !telefonoValido(d.contactoNumero, '+593')) {
      e['telefono'] = 'Escribe un celular válido. Ej. 099 123 4567';
    }

    return e;
  });

  constructor() {
    // Solo en el navegador: así el servidor y el cliente pintan lo mismo en el primer render
    afterNextRender(() => {
      this.checkout.restaurar();
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

  // ===== Listas desplegables =====
  abrir(lista: Lista): void {
    if (lista === 'canton' && !this.datos().provincia) return;
    if (lista === 'fCanton' && !this.datos().fProvincia) return;
    this.abierta.set(lista);
    this.consulta.set('');
    this.activo.set(0);
  }

  cerrar(lista: Lista): void {
    if (this.abierta() === lista) this.abierta.set(null);
    this.tocar(lista);
  }

  escribirBusqueda(lista: Lista, texto: string): void {
    if (this.abierta() !== lista) this.abierta.set(lista);
    this.consulta.set(texto);
    this.activo.set(0);
  }

  // Lo que se ve en el campo: lo que se está buscando o, si no se abrió, lo ya elegido
  textoCampo(lista: Lista): string {
    return this.abierta() === lista ? this.consulta() : this.datos()[lista];
  }

  opciones(lista: Lista): readonly string[] {
    return lista === 'provincia' ? this.opcionesProvincia()
      : lista === 'canton' ? this.opcionesCanton()
        : lista === 'fProvincia' ? this.opcionesFProvincia()
          : this.opcionesFCanton();
  }

  elegirProvincia(nombre: string): void {
    if (nombre !== this.datos().provincia) this.checkout.actualizar({ provincia: nombre, canton: '' });
    this.abierta.set(null);
    this.tocar('provincia');
  }

  elegirCanton(nombre: string): void {
    this.checkout.actualizar({ canton: nombre });
    this.abierta.set(null);
    this.tocar('canton');
  }

  elegirFProvincia(nombre: string): void {
    if (nombre !== this.datos().fProvincia) this.checkout.actualizar({ fProvincia: nombre, fCanton: '' });
    this.abierta.set(null);
    this.tocar('fProvincia');
  }

  elegirFCanton(nombre: string): void {
    this.checkout.actualizar({ fCanton: nombre });
    this.abierta.set(null);
    this.tocar('fCanton');
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
        if (lista === 'provincia') this.elegirProvincia(opcion);
        else if (lista === 'canton') this.elegirCanton(opcion);
        else if (lista === 'fProvincia') this.elegirFProvincia(opcion);
        else this.elegirFCanton(opcion);
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