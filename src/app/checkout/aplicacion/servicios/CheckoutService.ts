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
    ciudad: string;
    direccion: string;
    referencia: string;

    // Datos de facturación (por ahora solo diseño: no cambia nada)
    facturacion: 'mismos' | 'otros';

    // Número de contacto
    contacto: 'mismo' | 'otro';
    contactoPais: string;    // código ISO del país (EC, CO, US...)
    contactoNumero: string;

    // Pantalla de pago
    metodoPago: 'transferencia' | 'payphone';
}

const VACIO: DatosCheckout = {
    nombre: '', tipoDoc: 'cedula', cedula: '', celular: '', correo: '', provincia: '', ciudad: '', direccion: '', referencia: '',
    facturacion: 'mismos',
    contacto: 'mismo', contactoPais: 'EC', contactoNumero: '',
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