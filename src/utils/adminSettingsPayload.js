export function buildAdminSettingsUpdate(section, settings, currentServer = {}) {
  if (!section?.key) throw new Error('Sección de configuración inválida');
  if (section.id === 'portada') {
    return {
      home: {
        ...(currentServer.home || {}),
        heroImage: settings.home?.heroImage || null,
        heroImageVertical: settings.home?.heroImageVertical || null
      }
    };
  }
  if (section.id === 'bloques') {
    return {
      home: {
        ...(currentServer.home || {}),
        blocks: settings.home?.blocks || []
      }
    };
  }
  return { [section.key]: settings[section.key] || {} };
}

export function getAdminSettingsEditableValue(section, value = {}) {
  if (section?.id === 'portada') return {
    heroImage: value.heroImage || '',
    heroImageVertical: value.heroImageVertical || ''
  };
  if (section?.id === 'bloques') return value.blocks || [];
  return value;
}

export function hasAdminSettingsChanges(section, settings, baseline) {
  if (!section) return false;
  const current = settings?.[section.key] || {};
  const previous = baseline?.[section.key] || {};
  return JSON.stringify(getAdminSettingsEditableValue(section, current)) !== JSON.stringify(getAdminSettingsEditableValue(section, previous));
}
