// Texto oficial de los términos y condiciones (entregado por Josué). NO se edita a mano: cuando exista Laravel,
// este contenido viene de la tabla `policies` con su versión y fecha. `**negrita**` marca el texto resaltado.
export interface ClausulaTerminos { numero: string | null; titulo: string | null; texto: string; lista: string[]; }
export interface CapituloTerminos { numero: number; titulo: string; items: ClausulaTerminos[]; }

export const TITULO_TERMINOS = "Términos y condiciones de Jardín de Sele";

export const CAPITULOS_TERMINOS: CapituloTerminos[] = [
    {
        "numero": 1,
        "titulo": "Información del vendedor",
        "items": [
            {
                "numero": null,
                "titulo": null,
                "texto": "Jardín de Sele es una marca de Josué De Santis Alvarado, con RUC 0930247994001, con domicilio en Guayaquil, Ecuador.",
                "lista": []
            },
            {
                "numero": null,
                "titulo": null,
                "texto": "Canales de atención:",
                "lista": [
                    "WhatsApp: 0999283765",
                    "Correo: ayuda@jardindesele.com"
                ]
            }
        ]
    },
    {
        "numero": 2,
        "titulo": "Nuestros productos",
        "items": [
            {
                "numero": "2.1",
                "titulo": "Elaboración",
                "texto": "Nuestras macetas se elaboran con impresión 3D multicolor, utilizando filamento de bioplástico PLA+. Algunas partes pueden ser pintadas a mano. Por esta razón, el producto final puede variar ligeramente respecto de las fotografías, **en especial en la posición y el tamaño exacto de los accesorios.**",
                "lista": []
            },
            {
                "numero": "2.2",
                "titulo": "Uso en interiores",
                "texto": "Las macetas están pensadas para uso en interiores. Su exposición a la intemperie puede provocar daños en ellas.",
                "lista": []
            },
            {
                "numero": "2.3",
                "titulo": "La planta",
                "texto": "La planta es natural, por lo que su forma, tamaño y color pueden variar. Al tratarse de un ser vivo, no cuenta con garantía. El cliente entiende que la planta requiere cuidados mínimos para mantenerse en buen estado.",
                "lista": []
            },
            {
                "numero": "2.4",
                "titulo": "Detalles adicionales",
                "texto": "En los pedidos podemos incluir detalles adicionales sin costo, como stickers, tarjetas de agradecimiento o toppers. Jardín de Sele se reserva el derecho de cambiarlos o modificarlos según la demanda y la disponibilidad. Su inclusión, forma y colores no son obligatorios ni tienen que ser iguales en todos los pedidos.",
                "lista": []
            }
        ]
    },
    {
        "numero": 3,
        "titulo": "Personalización",
        "items": [
            {
                "numero": "3.1",
                "titulo": "Errores ortográficos",
                "texto": "Si el nombre, la frase del marco o la dedicatoria tienen un error ortográfico evidente, Jardín de Sele podrá corregirlo.",
                "lista": []
            },
            {
                "numero": "3.2",
                "titulo": "Dudas o información incompleta",
                "texto": "Si el texto es ambiguo o falta información, nos comunicaremos al número de contacto que el cliente registró en su pedido para confirmarlo.",
                "lista": []
            },
            {
                "numero": "3.3",
                "titulo": "Sin respuesta a tiempo",
                "texto": "Si no recibimos la confirmación a tiempo para la producción, la dedicatoria podrá no enviarse o reemplazarse por una tarjeta con un mensaje estándar. En el caso de los marcos aplica la misma regla.",
                "lista": []
            },
            {
                "numero": "3.4",
                "titulo": "Cambios",
                "texto": "Una vez creado el pedido, el cliente no puede modificar su contenido.",
                "lista": []
            }
        ]
    },
    {
        "numero": 4,
        "titulo": "Precios y formas de pago",
        "items": [
            {
                "numero": "4.1",
                "titulo": "Precios",
                "texto": "Los precios están expresados en dólares de los Estados Unidos. El costo de envío se muestra antes de confirmar el pago.",
                "lista": []
            },
            {
                "numero": "4.2",
                "titulo": "Pago con tarjeta",
                "texto": "Se procesa a través de PayPhone y tiene un recargo del 6%, que se muestra antes de pagar. Jardín de Sele no tiene acceso a los datos de la tarjeta.",
                "lista": []
            },
            {
                "numero": "4.3",
                "titulo": "Pago por transferencia",
                "texto": "El cliente tiene 12 horas desde la creación del pedido para pagar y enviar el comprobante, a través de la web o por WhatsApp. Si el pago no se recibe en ese plazo, el pedido se cancela.",
                "lista": []
            },
            {
                "numero": "4.4",
                "titulo": "Confirmación",
                "texto": "El pedido queda confirmado cuando el pago ha sido aprobado o validado.",
                "lista": []
            }
        ]
    },
    {
        "numero": 5,
        "titulo": "Envíos y tiempos de entrega",
        "items": [
            {
                "numero": "5.1",
                "titulo": "Transportista",
                "texto": "Todos los envíos se realizan a través de Servientrega, un servicio externo a Jardín de Sele. Por ahora no se realizan envíos desde la web a Galápagos ni a algunas zonas de difícil acceso; para estos casos, el cliente puede consultarnos por WhatsApp.",
                "lista": []
            },
            {
                "numero": "5.2",
                "titulo": "Costo de envío",
                "texto": "Depende del destino y se muestra antes de pagar. El envío es gratis en pedidos de 2 macetas o más, sean iguales o diferentes, lleven o no complementos.",
                "lista": []
            },
            {
                "numero": "5.3",
                "titulo": "Ventanas de entrega",
                "texto": "Al comprar, el cliente ve la fecha estimada de su pedido. Una vez despachado, Servientrega lo entrega en una ventana de 24 a 48 horas en las ciudades principales, y de hasta 72 horas en ciudades más remotas y en la Amazonía.",
                "lista": []
            },
            {
                "numero": "5.4",
                "titulo": "Día y hora de entrega",
                "texto": "Jardín de Sele no puede garantizar un día ni una hora exacta de entrega. Servientrega entrega según el destino y en el horario que ellos establecen.",
                "lista": []
            },
            {
                "numero": "5.5",
                "titulo": "Recomendación para regalos",
                "texto": "Si el pedido es para una fecha especial, recomendamos elegir la entrega de forma que el último día de la ventana sea, como máximo, el día anterior a esa fecha.",
                "lista": []
            },
            {
                "numero": "5.6",
                "titulo": "Fechas de eventos y demoras",
                "texto": "Jardín de Sele no se hace responsable si el pedido llega después de la fecha u hora de un evento, ni por demoras ajenas a su control. En estos casos no se aceptan devoluciones ni reembolsos de ningún tipo.",
                "lista": []
            },
            {
                "numero": "5.7",
                "titulo": "Dirección y recepción",
                "texto": "El cliente es responsable de registrar una dirección y un número de contacto correctos, y de que haya alguien para recibir el pedido. Si la entrega no se concreta por una dirección equivocada o porque nadie recibió, esto queda fuera de la responsabilidad de Jardín de Sele. Cuando esté a nuestro alcance, podremos ayudar a gestionar el caso con Servientrega como parte de nuestro servicio, sin que esto sea una obligación.",
                "lista": []
            }
        ]
    },
    {
        "numero": 6,
        "titulo": "Pedidos dañados o equivocados",
        "items": [
            {
                "numero": "6.1",
                "titulo": "Plazo para reclamar",
                "texto": "El cliente tiene 24 horas, desde la hora en que Servientrega registra el pedido como entregado, para reportarlo por WhatsApp (0999283765) o al correo ayuda@jardindesele.com.",
                "lista": []
            },
            {
                "numero": "6.2",
                "titulo": "Evidencia",
                "texto": "El reclamo debe incluir fotos y videos claros del problema. Si el producto llegó roto, recomendamos grabar la apertura de la caja: mientras más clara sea la evidencia de que llegó así y no fue manipulado después, más fácil será resolver el caso a favor del cliente.",
                "lista": []
            },
            {
                "numero": "6.3",
                "titulo": "Revisión",
                "texto": "Con la evidencia, Jardín de Sele revisará el caso y dará respuesta al cliente.",
                "lista": []
            },
            {
                "numero": "6.4",
                "titulo": "Reembolso",
                "texto": "Si el reclamo procede, se reembolsa el valor de las macetas afectadas. Si todo el pedido resultó afectado, se reembolsa el total pagado, incluido el envío. Por ejemplo, si se pagaron $50 por dos macetas y ambas llegaron rotas, se devuelven los $50; si solo una llegó rota, se devuelve el valor de esa maceta.",
                "lista": []
            },
            {
                "numero": "6.5",
                "titulo": "Accesorios y complementos",
                "texto": "Si lo dañado es un accesorio desprendido o un complemento que puede repararse o reponerse de forma razonable, Jardín de Sele enviará el repuesto y cubrirá el costo de su envío.",
                "lista": []
            }
        ]
    },
    {
        "numero": 7,
        "titulo": "Cancelaciones",
        "items": [
            {
                "numero": "7.1",
                "titulo": "Antes de entrar a producción",
                "texto": "El cliente puede cancelar su pedido hasta el cierre del ciclo de producción del día en que lo hizo: las 20:00 de lunes a viernes y las 16:00 los sábados. Por ejemplo, un pedido hecho a las 10:00 puede cancelarse hasta las 20:00 de ese mismo día. En este caso:",
                "lista": [
                    "Si pagó por transferencia, se reembolsa el 100% de lo pagado.",
                    "Si pagó con tarjeta, se reembolsa lo pagado menos el 6% de la transacción."
                ]
            },
            {
                "numero": "7.2",
                "titulo": "Pedido en producción",
                "texto": "Una vez que el pedido entró a producción, es decir, a partir del siguiente día de producción, la cancelación tiene un reembolso del 50% del valor pagado, sin importar la forma de pago. En este caso no se entrega ningún producto.",
                "lista": []
            },
            {
                "numero": "7.3",
                "titulo": "Pedido enviado",
                "texto": "Cuando el pedido ya fue entregado a Servientrega, no puede cancelarse.",
                "lista": []
            }
        ]
    },
    {
        "numero": 8,
        "titulo": "Devoluciones y reembolsos",
        "items": [
            {
                "numero": "8.1",
                "titulo": "Devoluciones",
                "texto": "Al tratarse de productos personalizados y con una planta viva, no se aceptan devoluciones por cambio de opinión ni porque el producto no haya sido del agrado del cliente. Tampoco se aceptan por demoras o fechas de eventos, según lo indicado en el capítulo 5.",
                "lista": []
            },
            {
                "numero": "8.2",
                "titulo": "Plazo de reembolso",
                "texto": "Los reembolsos que correspondan se procesan en un plazo de 24 horas laborables. Si el pago fue con tarjeta, se reembolsa a la misma tarjeta, y el tiempo en que el valor se refleja depende del banco del cliente. Si fue por transferencia, se reembolsa a la cuenta que el cliente indique.",
                "lista": []
            }
        ]
    },
    {
        "numero": 9,
        "titulo": "Datos del cliente",
        "items": [
            {
                "numero": "9.1",
                "titulo": "Conservación",
                "texto": "Jardín de Sele conservará de forma segura, en su base de datos de clientes, la información que el cliente proporciona en su pedido: nombre, cédula o RUC, dirección, número de celular y correo electrónico.",
                "lista": []
            },
            {
                "numero": "9.2",
                "titulo": "Uso",
                "texto": "El correo electrónico y el número de celular pudiesen ser utilizados para dar información sobre un pedido en curso o para compartir información de valor sobre nuestros productos y servicios.",
                "lista": []
            },
            {
                "numero": "9.3",
                "titulo": "Terceros",
                "texto": "Los datos solo se comparten con quienes intervienen en el pedido, como la plataforma de pago y Servientrega.",
                "lista": []
            },
            {
                "numero": "9.4",
                "titulo": "Actualización o eliminación",
                "texto": "El cliente puede solicitar la actualización o eliminación de sus datos escribiendo a ayuda@jardindesele.com.",
                "lista": []
            }
        ]
    },
    {
        "numero": 10,
        "titulo": "Aceptación",
        "items": [
            {
                "numero": null,
                "titulo": null,
                "texto": "Al marcar la casilla \"Acepto los términos y condiciones de Jardín de Sele\" antes de pagar, el cliente declara haber leído y aceptado este documento. Estos términos se rigen por las leyes de la República del Ecuador.",
                "lista": []
            }
        ]
    }
];
