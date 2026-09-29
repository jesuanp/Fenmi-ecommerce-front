import React from 'react';
import { SIZE_GUIDES, MEASURE_STEPS } from '@/data/sizeGuides';

const CLS = 'atdvxcgqxeuoxy3vqdaigenblock279308auwqrd8';

export default function SizeGuideSection({ slug }) {
  const guide = SIZE_GUIDES[slug];
  if (!guide) return null;

  return (
    <div className={`ai-size-chart-${CLS}`}>
      <p className={`ai-size-chart-eyebrow-${CLS}`}>Tallas</p>
      <h2 className={`ai-size-chart-heading-${CLS}`}>Encuentra tu talla perfecta</h2>
      <p className={`ai-size-chart-subtext-${CLS}`}>
        Si estás entre dos tallas, elige la mayor. El tejido 4-way stretch se adapta a tu cuerpo.
      </p>

      <table className={`ai-size-chart-table-${CLS}`}>
        <thead>
          <tr>
            <th>Talla</th>
            <th>Busto</th>
            <th>Cintura</th>
            <th>Cadera</th>
          </tr>
        </thead>
        <tbody>
          {guide.sizes.map((s) => (
            <tr key={s.label}>
              <td className={`ai-size-col-${CLS}`}>{s.label}</td>
              <td>{s.bust}</td>
              <td>{s.waist}</td>
              <td>{s.hip}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className={`ai-size-chart-guide-${CLS}`}>
        <h4 className={`ai-size-chart-guide-heading-${CLS}`}>¿Cómo tomar tus medidas?</h4>
        <ul className={`ai-size-chart-guide-list-${CLS}`}>
          {MEASURE_STEPS.map((m) => (
            <li key={m.title}>
              <span>{m.icon}</span>
              <span>
                <p>
                  <strong>{m.title}:</strong> {m.text}
                </p>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}