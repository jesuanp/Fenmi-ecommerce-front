// Tablas de tallas por producto (fuente: SECCIONES/07-tabla-tallas.html de cada producto).
// Si un producto no aparece aquí, no se muestra la tabla (solo la guía de medidas genérica).

export const SIZE_GUIDES = {
  'cloudline-set': {
    sizes: [
      { label: 'M', bust: '86 – 91 cm', waist: '68 – 73 cm', hip: '92 – 97 cm' },
      { label: 'L', bust: '92 – 97 cm', waist: '74 – 79 cm', hip: '98 – 103 cm' },
      { label: 'XL', bust: '98 – 104 cm', waist: '80 – 86 cm', hip: '104 – 110 cm' }
    ]
  },
  'balance': {
    sizes: [
      { label: 'XS', bust: '80 cm', waist: '58 cm', hip: '88 cm' },
      { label: 'S', bust: '85 cm', waist: '63 cm', hip: '93 cm' },
      { label: 'M', bust: '90 cm', waist: '68 cm', hip: '98 cm' }
    ]
  },
  'bloom-jumpsuit': {
    sizes: [
      { label: 'S', bust: '82 – 86 cm', waist: '62 – 66 cm', hip: '88 – 92 cm' },
      { label: 'M', bust: '87 – 91 cm', waist: '67 – 71 cm', hip: '93 – 97 cm' },
      { label: 'L', bust: '92 – 96 cm', waist: '72 – 76 cm', hip: '98 – 102 cm' }
    ]
  },
  'force-jumpsuit': {
    sizes: [
      { label: 'S', bust: '80 – 86 cm', waist: '61 – 66 cm', hip: '86 – 92 cm' },
      { label: 'M', bust: '87 – 92 cm', waist: '67 – 72 cm', hip: '93 – 98 cm' },
      { label: 'L', bust: '93 – 98 cm', waist: '73 – 78 cm', hip: '99 – 104 cm' }
    ]
  },
  'moon-jumpsuit': {
    sizes: [
      { label: 'S', bust: '80 – 86 cm', waist: '61 – 66 cm', hip: '86 – 92 cm' },
      { label: 'M', bust: '87 – 92 cm', waist: '67 – 72 cm', hip: '93 – 98 cm' },
      { label: 'L', bust: '93 – 98 cm', waist: '73 – 78 cm', hip: '99 – 104 cm' }
    ]
  },
  'inspire-jumpsuit': {
    sizes: [
      { label: 'S', bust: '80 – 86 cm', waist: '61 – 66 cm', hip: '86 – 92 cm' },
      { label: 'M', bust: '87 – 92 cm', waist: '67 – 72 cm', hip: '93 – 98 cm' },
      { label: 'L', bust: '93 – 98 cm', waist: '73 – 78 cm', hip: '99 – 104 cm' }
    ]
  },
  'eclipse-jumpsuit': {
    sizes: [
      { label: 'M', bust: '87 – 92 cm', waist: '67 – 72 cm', hip: '93 – 98 cm' },
      { label: 'L', bust: '93 – 98 cm', waist: '73 – 78 cm', hip: '99 – 104 cm' }
    ]
  },
  'lunar-set': {
    sizes: [
      { label: 'S', bust: '82 – 86 cm', waist: '62 – 66 cm', hip: '88 – 92 cm' },
      { label: 'M', bust: '87 – 91 cm', waist: '67 – 71 cm', hip: '93 – 97 cm' },
      { label: 'L', bust: '92 – 97 cm', waist: '72 – 77 cm', hip: '98 – 103 cm' },
      { label: 'XL', bust: '98 – 103 cm', waist: '78 – 83 cm', hip: '104 – 109 cm' }
    ]
  },
  'midnight-flow-set': {
    sizes: [
      { label: 'S', bust: '82 – 86 cm', waist: '62 – 66 cm', hip: '88 – 92 cm' },
      { label: 'M', bust: '87 – 91 cm', waist: '67 – 71 cm', hip: '93 – 97 cm' },
      { label: 'L', bust: '92 – 97 cm', waist: '72 – 77 cm', hip: '98 – 103 cm' }
    ]
  },
  'tenis-dress': {
    sizes: [
      { label: 'S', bust: '82 – 86 cm', waist: '62 – 66 cm', hip: '88 – 92 cm' },
      { label: 'M', bust: '87 – 92 cm', waist: '67 – 72 cm', hip: '93 – 98 cm' }
    ]
  },
  'tennis-muse': {
    sizes: [
      { label: 'S', bust: '82 – 86 cm', waist: '62 – 66 cm', hip: '88 – 92 cm' }
    ]
  }
};

// Guía de cómo tomar medidas (genérica para todos los productos).
export const MEASURE_STEPS = [
  { icon: '📏', title: 'Busto', text: 'mide la parte más ancha del pecho con los brazos relajados' },
  { icon: '📏', title: 'Cintura', text: 'mide la parte más estrecha de tu torso' },
  { icon: '📏', title: 'Cadera', text: 'mide la parte más ancha de tus caderas' }
];