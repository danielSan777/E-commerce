import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subscription, finalize } from 'rxjs';
import { AvisosService } from '../../../../shared/componentes/avisos/AvisosService';
import { FormsModule } from '@angular/forms';
import { Meta, Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { CategoriasAdminService } from '../../../aplicacion/servicios/CategoriasAdminService';
import { ProductosAdminService } from '../../../aplicacion/servicios/ProductosAdminService';
import { centavosADolares } from '../../../aplicacion/dinero';
import { CategoriaAdmin } from '../../../dominio/interfaces/categoria-admin';
import { ProductoAdmin } from '../../../dominio/interfaces/producto-admin';
import { ErrorApi } from '../../../../cuenta/dominio/interfaces/sesion';

// Lista de productos del panel, con búsqueda por nombre/SKU y filtro por categoría. Todo viene de Laravel.
@Component({
  selector: 'app-admin-productos',
  imports: [FormsModule, RouterLink],
  templateUrl: './productos.html',
  styleUrl: './productos.css',
})
export class AdminProductos implements OnInit {
  private productosApi = inject(ProductosAdminService);
  private categoriasApi = inject(CategoriasAdminService);
  private destroyRef = inject(DestroyRef);
  /** Búsqueda en curso: si se pide otra, la anterior se cancela para que no pise a la nueva. */
  private busqueda?: Subscription;

  productos = signal<ProductoAdmin[]>([]);
  categorias = signal<CategoriaAdmin[]>([]);
  cargando = signal(true);
  error = signal('');
  aviso = signal('');
  private avisos = inject(AvisosService);
  porEliminar = signal<string | null>(null);

  texto = '';
  categoria = '';

  readonly dolares = centavosADolares;

  constructor() {
    inject(Title).setTitle('Productos | Panel de Jardín de Sele');
    inject(Meta).updateTag({ name: 'robots', content: 'noindex, nofollow' });
  }

  ngOnInit(): void {
    this.cargarCategorias();
    this.cargar();
  }

  private cargarCategorias(): void {
    // Si falla, el filtro queda sin opciones; el listado igual funciona.
    this.categoriasApi.listar().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: lista => this.categorias.set(lista),
      error: () => undefined,
    });
  }

  cargar(): void {
    this.busqueda?.unsubscribe();
    this.cargando.set(true);
    this.error.set('');
    this.busqueda = this.productosApi.listar(this.categoria, this.texto).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.cargando.set(false)),
    ).subscribe({
      next: lista => this.productos.set(lista),
      error: (e: ErrorApi) => this.error.set(e.message),
    });
  }

  buscar(evento: Event): void {
    evento.preventDefault();
    this.aviso.set('');
    this.cargar();
  }

  pedirEliminar(sku: string): void {
    this.aviso.set('');
    this.porEliminar.set(sku);
  }

  eliminar(sku: string): void {
    this.porEliminar.set(null);
    this.productosApi.eliminar(sku).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.aviso.set('Producto eliminado.');
        this.avisos.exito('Producto eliminado.');
        this.cargar();
      },
      error: (e: ErrorApi) => this.error.set(e.message),
    });
  }
}
