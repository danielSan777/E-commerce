import { Injectable, signal } from '@angular/core';

// Todo lo que el cliente escribe en la pantalla "Envío y facturación".
// Las pantallas siguientes (pago, confirmación) leen de aquí.
export interface DatosCheckout {
    // Información de envío
    nombre: string;
    tipoDoc: 'cedula' | 'ruc';
    cedula: string;           // número del documento (cédula o RUC según tipoDoc)
    celular: string;
    correo: string;
    provincia: string;
    canton: string;
    localidad: string;        // opcional (La Aurora, La Joya y Villa Club en Daule)
    direccion: string;
    referencia: string;

    // Datos de facturación
    facturacion: 'mismos' | 'otros';
    // Solo se piden (y validan) cuando facturacion === 'otros'
    fNombre: string;
    fTipoDoc: 'cedula' | 'ruc';
    fCedula: string;
    fCelular: string;
    fCorreo: string;
    fProvincia: string;
    fCanton: string;
    fDireccion: string;

    // Número de contacto
    contacto: 'mismo' | 'otro';
    contactoNumero: string;

    // Pantalla de pago
    metodoPago: 'transferencia' | 'payphone';
}

const VACIO: DatosCheckout = {
    nombre: '', tipoDoc: 'cedula', cedula: '', celular: '', correo: '', provincia: '', canton: '', localidad: '', direccion: '', referencia: '',
    facturacion: 'mismos',
    fNombre: '', fTipoDoc: 'cedula', fCedula: '', fCelular: '', fCorreo: '', fProvincia: '', fCanton: '', fDireccion: '',
    contacto: 'mismo', contactoNumero: '',
    metodoPago: 'transferencia',
};

@Injectable({ providedIn: 'root' })
export class CheckoutService {

    // sessionStorage (no localStorage): son datos personales y se borran al cerrar la pestaña
    private readonly CLAVE = 'checkout-jardin-de-sele';

    readonly datos = signal<DatosCheckout>({ ...VACIO });

    actualizar(parche: Partial<DatosCheckout>): void {
        this.datos.update(d => ({ ...d, ...parche }));
        this.persistir();
    }

    // Se llama ya en el navegador (después del primer render) para que el servidor y el cliente pinten lo mismo
    restaurar(): void {
        try {
            if (typeof sessionStorage === 'undefined') return;
            const guardado = JSON.parse(sessionStorage.getItem(this.CLAVE) ?? 'null');
            if (guardado && typeof guardado === 'object') {
                this.datos.set({ ...VACIO, ...guardado });
            }
        } catch {
            // datos dañados o almacenamiento bloqueado: se empieza en blanco
        }
    }

    private persistir(): void {
        try {
            if (typeof sessionStorage === 'undefined') return;
            sessionStorage.setItem(this.CLAVE, JSON.stringify(this.datos()));
        } catch {
            // sin espacio o bloqueado: el formulario sigue funcionando mientras la página esté abierta
        }
    }
}