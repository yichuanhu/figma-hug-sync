const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const ensureTrailingSemicolon = (style: string) => {
  const trimmed = style.trim();
  return trimmed && !trimmed.endsWith(';') ? `${trimmed};` : trimmed;
};

const normalizeForeignObjectStyle = (style: string) => {
  let normalizedStyle = ensureTrailingSemicolon(style);

  const backdropFilterMatch = normalizedStyle.match(/backdrop-filter\s*:\s*([^;]+);?/i);

  if (backdropFilterMatch && !/-webkit-backdrop-filter\s*:/i.test(normalizedStyle)) {
    normalizedStyle += `-webkit-backdrop-filter:${backdropFilterMatch[1]};`;
  }

  if (!/background-color\s*:/i.test(normalizedStyle)) {
    normalizedStyle += 'background-color:rgba(255,255,255,0.16);';
  }

  if (!/border\s*:/i.test(normalizedStyle)) {
    normalizedStyle += 'border:1px solid rgba(255,255,255,0.28);';
  }

  if (!/box-shadow\s*:/i.test(normalizedStyle)) {
    normalizedStyle += 'box-shadow:inset 0 1px 0 rgba(255,255,255,0.36);';
  }

  return normalizedStyle;
};

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

  scopedSvg = scopedSvg.replace(/<foreignObject([\s\S]*?)<div([^>]*?)style="([^"]*)"([^>]*)><\/div><\/foreignObject>/g, (_, foreignObjectAttrs: string, beforeStyle: string, style: string, afterStyle: string) => {
    const normalizedStyle = normalizeForeignObjectStyle(style);
    return `<foreignObject${foreignObjectAttrs}<div${beforeStyle}style="${normalizedStyle}"${afterStyle}></div></foreignObject>`;
  });

  return scopedSvg.replace(
    /<svg\b/,
    '<svg class="center-entry-inline-svg" aria-hidden="true" focusable="false"'
  );
};
