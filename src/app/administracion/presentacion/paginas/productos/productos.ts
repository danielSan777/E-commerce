import { Component, OnInit, inject, signal } from '@angular/core';
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
    void this.cargarCategorias();
    void this.cargar();
  }

  private async cargarCategorias(): Promise<void> {
    try {
      this.categorias.set(await this.categoriasApi.listar());
    } catch { /* el filtro queda sin opciones; el listado igual funciona */ }
  }

  async cargar(): Promise<void> {
    this.cargando.set(true);
    this.error.set('');
    try {
      this.productos.set(await this.productosApi.listar(this.categoria, this.texto));
    } catch (e) {
      this.error.set((e as ErrorApi).message);
    } finally {
      this.cargando.set(false);
    }
  }

  buscar(evento: Event): void {
    evento.preventDefault();
    this.aviso.set('');
    void this.cargar();
  }

  pedirEliminar(sku: string): void {
    this.aviso.set('');
    this.porEliminar.set(sku);
  }

  async eliminar(sku: string): Promise<void> {
    this.porEliminar.set(null);
    try {
      await this.productosApi.eliminar(sku);
      this.aviso.set('Producto eliminado.');
      this.avisos.exito('Producto eliminado.');
      await this.cargar();
    } catch (e) {
      this.error.set((e as ErrorApi).message);
    }
  }
}
