export const ADMIN_SETTINGS_SECTIONS = [
  { id: 'general', label: 'Datos de la tienda', shortLabel: 'Tienda', icon: 'store', key: 'storeGeneral', description: 'Nombre comercial, correo de contacto, teléfono y WhatsApp.' },
  { id: 'portada', label: 'Portada e imágenes', shortLabel: 'Portada', icon: 'image', key: 'home', description: 'Imágenes principales de escritorio y móvil.' },
  { id: 'bloques', label: 'Secciones de inicio', shortLabel: 'Bloques de inicio', icon: 'panels', key: 'home', description: 'Contenido y orden de las secciones de la página principal.' },
  { id: 'envios', label: 'Envíos y tarifas', shortLabel: 'Envíos', icon: 'truck', key: 'shipping', description: 'Transportadoras, destinos, tarifas y entrega a domicilio.' },
  { id: 'pagos', label: 'Cuentas de pago', shortLabel: 'Pagos', icon: 'credit-card', key: 'bankAccounts', description: 'Datos de Nequi y Bancolombia para pagos manuales.' },
  { id: 'politicas', label: 'Políticas legales', shortLabel: 'Políticas', icon: 'file-text', key: 'policies', description: 'Privacidad, términos y condiciones, devoluciones y envíos.' },
  { id: 'footer', label: 'Pie de página', shortLabel: 'Pie de página', icon: 'panel-bottom', key: 'footer', description: 'Texto de la marca, copyright y enlaces del footer.' },
  { id: 'redes', label: 'Redes sociales', shortLabel: 'Redes sociales', icon: 'share', key: 'social', description: 'Enlaces oficiales para conectar con tu comunidad.' },
  { id: 'seo', label: 'SEO y buscadores', shortLabel: 'SEO', icon: 'search', key: 'seo', description: 'Título y descripción que ayudan a presentar la tienda.' }
];

export const getAdminSettingsSection = (id) => ADMIN_SETTINGS_SECTIONS.find((section) => section.id === id);
