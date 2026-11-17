import { TestBed } from '@angular/core/testing';
import { PedidoPendienteRecordadoService } from './PedidoPendienteRecordadoService';

describe('PedidoPendienteRecordadoService', () => {
    beforeEach(() => localStorage.clear());

    it('recuerda número y token, y los recupera al volver', () => {
        TestBed.inject(PedidoPendienteRecordadoService).recordar('JDS-1', 't'.repeat(64));
        TestBed.resetTestingModule();

        const nuevo = TestBed.inject(PedidoPendienteRecordadoService);
        expect(nuevo.pedido()).toBeNull();   // hasta el primer render no se lee (así servidor y cliente coinciden)
        nuevo.restaurar();
        expect(nuevo.pedido()?.numero).toBe('JDS-1');
    });

    it('no guarda datos personales', () => {
        TestBed.inject(PedidoPendienteRecordadoService).recordar('JDS-1', 'abc');

        expect(Object.keys(JSON.parse(localStorage.getItem('jds_pedido_pendiente')!)).sort()).toEqual(['guardado', 'numero', 'token']);
    });

    it('lo guardado hace más de 30 días se descarta', () => {
        localStorage.setItem('jds_pedido_pendiente', JSON.stringify({ numero: 'JDS-1', token: 'abc', guardado: '2020-01-01T00:00:00Z' }));
        const s = TestBed.inject(PedidoPendienteRecordadoService);
        s.restaurar();

        expect(s.pedido()).toBeNull();
        expect(localStorage.getItem('jds_pedido_pendiente')).toBeNull();
    });

    it('olvidar borra el aviso', () => {
        const s = TestBed.inject(PedidoPendienteRecordadoService);
        s.recordar('JDS-1', 'abc');
        s.olvidar();

        expect(s.pedido()).toBeNull();
        expect(localStorage.getItem('jds_pedido_pendiente')).toBeNull();
    });

    it('datos dañados no rompen nada', () => {
        localStorage.setItem('jds_pedido_pendiente', '{no es json');
        const s = TestBed.inject(PedidoPendienteRecordadoService);
        s.restaurar();

        expect(s.pedido()).toBeNull();
    });
});
