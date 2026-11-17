import { TestBed } from '@angular/core/testing';
import { PedidoPendienteRecordadoService } from './PedidoPendienteRecordadoService';

const futuro = new Date(Date.now() + 3600_000).toISOString();

describe('PedidoPendienteRecordadoService', () => {
    beforeEach(() => localStorage.clear());

    it('recuerda número, token y vencimiento, y los recupera al volver', () => {
        TestBed.inject(PedidoPendienteRecordadoService).recordar({ numero: 'JDS-1', token: 't'.repeat(64), vence: futuro });
        TestBed.resetTestingModule();

        const nuevo = TestBed.inject(PedidoPendienteRecordadoService);
        expect(nuevo.pedido()).toBeNull();   // hasta el primer render no se lee (así servidor y cliente coinciden)
        nuevo.restaurar();
        expect(nuevo.pedido()?.numero).toBe('JDS-1');
    });

    it('no guarda datos personales', () => {
        TestBed.inject(PedidoPendienteRecordadoService).recordar({ numero: 'JDS-1', token: 'abc', vence: futuro });

        expect(Object.keys(JSON.parse(localStorage.getItem('jds_pedido_pendiente')!)).sort()).toEqual(['numero', 'token', 'vence']);
    });

    it('un pedido vencido se descarta', () => {
        localStorage.setItem('jds_pedido_pendiente', JSON.stringify({ numero: 'JDS-1', token: 'abc', vence: '2020-01-01T00:00:00Z' }));
        const s = TestBed.inject(PedidoPendienteRecordadoService);
        s.restaurar();

        expect(s.pedido()).toBeNull();
        expect(localStorage.getItem('jds_pedido_pendiente')).toBeNull();
    });

    it('olvidar borra el aviso', () => {
        const s = TestBed.inject(PedidoPendienteRecordadoService);
        s.recordar({ numero: 'JDS-1', token: 'abc', vence: futuro });
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
