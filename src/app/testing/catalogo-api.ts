// Respuestas de ejemplo de la API pública de Laravel, solo para las pruebas (no entra en la página).
export const precioApi = (base: number, final = base) => ({
  currency: 'USD', base_cents: base, final_cents: final, discount_cents: base - final,
  discount_percent: base > final ? 10 : 0, badge: base > final ? '10% OFF' : null,
});

export const RESUMEN_CATEGORIAS_API = [
  { slug: 'profesiones-y-hobbies', name: 'Profesiones y Hobbies', url: '/profesiones-y-hobbies', short_description: 'Profesiones, oficios y pasiones.', image: 'http://api/media/p.webp', subcategories: [] },
  { slug: 'amor', name: 'Amor', url: '/amor', short_description: null, image: null, subcategories: [] },
  { slug: 'amistad', name: 'Amistad', url: '/amistad', short_description: null, image: null, subcategories: [] },
  { slug: 'familia', name: 'Familia', url: '/familia', short_description: null, image: null, subcategories: [] },
];

export const productoListadoApi = (slug: string, name = slug, extra = {}) => ({
  sku: `JDS-${slug}`, slug, name, image: `http://api/media/${slug}.webp`, price: precioApi(2150), available: true,
  category: { slug: 'amor', name: 'Amor' }, subcategory: null, search_terms: [] as string[], ...extra,
});
