import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { usePageTitle } from '@/hooks/usePageTitle';

const TABS = [
  { id: 'privacy', label: 'Privacidad' },
  { id: 'terms', label: 'Términos y condiciones' },
  { id: 'shipping', label: 'Envíos y devoluciones' }
];

export default function PoliciesPage() {
  const [searchParams] = useSearchParams();
  const active = searchParams.get('t') || 'privacy';
  const tab = TABS.find((x) => x.id === active) ? active : 'privacy';
  usePageTitle('Políticas');

  return (
    <article className="policy">
      <h1 className="page-title" style={{ marginBottom: 12 }}>Políticas</h1>

      <nav className="policy-tabs" aria-label="Secciones de políticas">
        {TABS.map((x) => (
          <a
            key={x.id}
            className={'policy-tab' + (x.id === tab ? ' active' : '')}
            href={`/policies?t=${x.id}`}
          >
            {x.label}
          </a>
        ))}
      </nav>

      {tab === 'privacy' && <Privacy />}
      {tab === 'terms' && <Terms />}
      {tab === 'shipping' && <Shipping />}
    </article>
  );
}

function Block({ eyebrow, h, children }) {
  return (
    <section className="policy-block">
      {eyebrow && <p className="policy-block-eyebrow">{eyebrow}</p>}
      <h2>{h}</h2>
      {children}
    </section>
  );
}

function P({ children }) {
  return <p>{children}</p>;
}
function UL({ items }) {
  return (
    <ul>
      {items.map((it, i) => (
        <li key={i}>{it}</li>
      ))}
    </ul>
  );
}

function ContactLine() {
  return (
    <p className="policy-contact">
      Para consultas, escríbenos por <strong>WhatsApp (+57 301 855 7535)</strong> o al correo{' '}
      <strong>fenmistore@gmail.com</strong>.
    </p>
  );
}

function Privacy() {
  return (
    <>
      <div className="policy-intro">
        <p>
          En <strong>FENMI</strong> entendemos la privacidad como parte de la confianza.{' '}
          <strong>Esta política explica qué información recopilamos, por qué y cómo la protejemos.</strong>{' '}
          Al usar nuestra tienda aceptas los términos descritos aquí.
        </p>
        <ContactLine />
      </div>

      <Block eyebrow="01" h="Información que recopilamos">
        <P>
          Recopilamos únicamente la información necesaria para operar la tienda y procesar tus pedidos:
        </P>
        <UL
          items={[
            'Datos de cuenta: nombre, apellido, correo electrónico y teléfono que registras al crear tu cuenta.',
            'Datos del pedido: dirección de envío, ciudad, departamento y código postal.',
            'Datos de interacción: carrito, lista de favoritos, reseñas y consultas de contacto.',
            'Datos de pago: solo los procesados de forma segura por nuestra pasarela. No almacenamos los números de tarjeta.',
            'Datos técnicos básicos: dirección IP y tipo de dispositivo, para seguridad y prevención de fraude.'
          ]}
        />
      </Block>

      <Block eyebrow="02" h="Cómo usamos tus datos">
        <P>Usamos tu información para:</P>
        <UL
          items={[
            'Procesar y enviar tus pedidos a toda Colombia comprar.',
            'Comunicarte el estado de tus pedidos (por correo y WhatsApp).',
            'Confirmar y gestionar cambios o devoluciones.',
            'Mejorar la experiencia de la tienda y ofrecerte soporte.',
            'Cumplir obligaciones legales y prevenir fraude.'
          ]}
        />
      </Block>

      <Block eyebrow="03" h="Base legal y conservación">
        <P>
          Al crear una cuenta aceptas esta política. Conservamos tus datos durante el tiempo necesario para
          mantener tu cuenta, el historial de pedidos y cumplir obligaciones fiscales, y los eliminamos cuando
          ya no son necesarios o cuando lo solicitas.
        </P>
      </Block>

      <Block eyebrow="04" h="Compartir con terceros">
        <P>No vendemos tus datos. Solo compartimos lo estrictamente necesario con:</P>
        <UL
          items={[
            'La pasarela de pagos, para procesar y verificar tu compra.',
            'El operador logístico, para entregar tu pedido.',
            'La plataforma de hosting y correo, para operar el servicio.'
          ]}
        />
      </Block>

      <Block eyebrow="05" h="Derechos del titular">
        <P>
          Tienes derecho a acceder, corregir, eliminar o trasladar tus datos personales. Puedes ejercerlos
          escribiendo a <strong>fenmistore@gmail.com</strong> o por WhatsApp; te responderemos lo antes posible.
        </P>
      </Block>

      <Block eyebrow="06" h="Seguridad">
        <P>
          Tus contraseñas se guardan cifradas y tu sesión se protege con tokens seguros. Aplicamos medidas
          técnicas y organizativas razonables para evitar accesos no autorizados, usos indebidos o pérdidas.
        </P>
      </Block>

      <Block eyebrow="07" h="Cambios en esta política">
        <P>
          Podremos actualizar esta política para reflejar mejoras o cambios legales. Si hay cambios
          importantes, te lo notificaremos por correo; la versión vigente siempre estará disponible aquí.
        </P>
      </Block>
    </>
  );
}

function Terms() {
  return (
    <>
      <div className="policy-intro">
        <p>
          Estos términos regulan el uso de la tienda FENMI y la compra de productos.{' '}
          <strong>Al completar un pedido aceptas las condiciones descritas a continuación.</strong>
        </p>
        <ContactLine />
      </div>

      <Block eyebrow="01" h="Aceptación y alcance">
        <P>
          Esta tienda envía a todo el territorio de Colombia. Los precios se muestran en pesos
          colombianos (COP) e incluyen el IVA. El uso de la tienda implica la aceptación de estos términos.
        </P>
      </Block>

      <Block eyebrow="02" h="Cuentas">
        <UL
          items={[
            'Para comprar y gestionar pedidos puedes crear una cuenta con tu correo y una contraseña segura.',
            'Debes mantener tus credenciales en secreto y eres responsable de la actividad que realices con ellas.',
            'Nos reservamos el derecho de bloquear cuentas en caso de uso indebido o actividad fraudulenta.'
          ]}
        />
      </Block>

      <Block eyebrow="03" h="Productos y disponibilidad">
        <P>
          Las imágenes y descripciones buscan representar fielmente cada prenda. El stock se administra por
          talla y color, por lo que un producto puede agotarse durante tu compra. Si una talla no tiene
          inventario, aparece como no disponible.
        </P>
      </Block>

      <Block eyebrow="04" h="Precios y pagos">
        <P>
          Podrás pagar con tarjeta y, cuando esté disponible, en cuotas con las opciones habilitadas en el
          pago. La confirmación del pago se realiza de forma segura por la pasarela antes de procesar tu pedido.
        </P>
      </Block>

      <Block eyebrow="05" h="Pedidos">
        <P>
          Al confirmar tu pedido recibirás un número de orden y te notificaremos por correo y WhatsApp su
          estado. Puedes cancelar un pedido pendiente de pago desde tu cuenta; una vez pagado, gestionamos
          cambios por los canales de soporte.
        </P>
      </Block>

      <Block eyebrow="06" h="Envíos">
        <P>
          Enviamos a toda Colombia, con un tiempo estimado de 2 a 3 días hábiles según la ciudad. El envío
          es <strong>gratis en compras superiores a $300.000</strong>; el costo de envío se calcula al
          confirmar tu pedido.
        </P>
      </Block>

      <Block eyebrow="07" h="Cambios y devoluciones">
        <UL
          items={[
            'Tienes hasta 5 días calendario después de recibir tu pedido para solicitar un cambio.',
            'La prenda debe estar sin uso, sin lavar y con sus etiquetas originales.',
            'Si el producto llegó con algún defecto de fábrica, contáctanos dentro de los 3 días; asumimos el costo del envío.',
            'Para gestionarlo, escríbenos por WhatsApp con tu número de pedido.'
          ]}
        />
      </Block>

      <Block eyebrow="08" h="Responsabilidad">
        <P>
          No nos hacemos responsables por daños derivados de un uso o lavado incorrecto del producto, o por
          la pérdida de datos ocasionada por compartir tus credenciales con terceros.
        </P>
      </Block>

      <Block eyebrow="09" h="Reseñas y contenido">
        <P>
          Agradecemos tus reseñas; nos ayudan a mejorar. Nos reservamos el derecho de moderar el contenido
          publicado para mantener un espacio respetuoso y útil.
        </P>
      </Block>

      <Block eyebrow="10" h="Propiedad intelectual y contacto">
        <P>
          La marca FENMI y los contenidos de la tienda son de nuestra propiedad. Para consultas, reclamos o
          sugerencias, contáctanos por WhatsApp o por correo.
        </P>
      </Block>
    </>
  );
}

function Shipping() {
  return (
    <>
      <div className="policy-intro">
        <p>
          Te contamos cómo funcionan nuestros envíos, cambios y devoluciones de forma clara.{' '}
          <strong>Queremos que tu experiencia sea sencilla y sin sorpresas.</strong>
        </p>
        <ContactLine />
      </div>

      <Block eyebrow="01" h="Envíos">
        <UL
          items={[
            'Cubrimos todo el territorio de Colombia.',
            'El tiempo estimado de entrega es de 2 a 3 días hábiles, según tu ciudad.',
            'El envío es gratis en compras superiores a $300.000.',
            'Recibirás la confirmación y el seguimiento de tu pedido por correo y WhatsApp.'
          ]}
        />
      </Block>

      <Block eyebrow="02" h="Cambios">
        <UL
          items={[
            'Puedes solicitar un cambio dentro de los 5 días hábiles después de recibir tu pedido.',
            'La prenda debe estar sin uso, sin lavar y con sus etiquetas originales.',
            'Indícanos por WhatsApp tu número de pedido y la talla o color que deseas.'
          ]}
        />
      </Block>

      <Block eyebrow="03" h="Devoluciones y defectos">
        <UL
          items={[
            'Si tu prenda llega con un defecto de fábrica, contáctanos dentro de los 3 días siguientes a la entrega.',
            'En ese caso, asumimos el costo del envío de la devolución.',
            'No se aceptan devoluciones por cambios de talla si la prenda presenta signos de uso o lavado.'
          ]}
        />
      </Block>

      <Block eyebrow="04" h="Pago seguro">
        <P>
          Todos los pagos se procesan a través de una pasarela segura. No almacenamos los datos de tu
          tarjeta en nuestros servidores.
        </P>
      </Block>
    </>
  );
}