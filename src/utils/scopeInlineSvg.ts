const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const scopeInlineSvg = (svg: string, scope: string) => {
  if (!svg) {
    return '';
  }

  const normalizedScope = scope.replace(/[^a-zA-Z0-9_-]/g, '-');
  const idMap = new Map<string, string>();

  let scopedSvg = svg.trim().replace(/\bid="([^"]+)"/g, (_, id: string) => {
    const scopedId = `${normalizedScope}__${id}`;
    idMap.set(id, scopedId);
    return `id="${scopedId}"`;
  });

  idMap.forEach((scopedId, originalId) => {
    const escapedId = escapeRegExp(originalId);

    scopedSvg = scopedSvg
      .replace(new RegExp(`url\\(#${escapedId}\\)`, 'g'), `url(#${scopedId})`)
      .replace(new RegExp(`(["'])#${escapedId}(["'])`, 'g'), `$1#${scopedId}$2`);
  });

  return scopedSvg.replace(
    /<svg\b/,
    '<svg class="center-entry-inline-svg" aria-hidden="true" focusable="false"'
  );
};
