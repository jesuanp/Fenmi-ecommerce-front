import React from 'react';

export default function AdminPageHeading({ kicker, title, description, action }) {
  return (
    <div className="admin-page-heading">
      <div>
        {kicker && <div className="admin-eyebrow">{kicker}</div>}
        <h1 className="admin-title">{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {action && <div className="admin-page-heading-action">{action}</div>}
    </div>
  );
}
