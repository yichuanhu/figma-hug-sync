#!/usr/bin/env node
// 扫描 src/ 下所有 sharing.assetSupply.* 引用，并校验 zh-CN / en i18n 是否齐全。
// 缺失时以非零退出码报错，可用于构建/CI。
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'src');
const LOCALES = {
  'zh-CN': path.join(ROOT, 'public/i18n/zh-CN.json'),
  en: path.join(ROOT, 'public/i18n/en.json'),
};
const PREFIX = 'sharing.assetSupply.';

// 已知动态后缀 -> 枚举值（与代码保持同步）
const DYNAMIC_ENUMS = {
  'sharing.assetSupply.tabs.': ['published', 'pending_publish', 'draft', 'pending_approval', 'rejected'],
  'sharing.assetSupply.status.': ['PUBLISHED', 'ARCHIVED', 'DRAFT', 'PENDING_PUBLISH', 'PENDING_APPROVAL', 'REJECTED', 'UNLISTED'],
  'sharing.assetSupply.source.': ['NATIVE', 'DEV_CENTER'],
  'sharing.assetSupply.type.': ['WORKFLOW', 'KNOWLEDGE'],
  'sharing.assetSupply.lifecycle.': ['archive', 'unlist', 'withdraw', 'delete', 'recover'],
  'sharing.assetSupply.newAsset.': ['workflow', 'knowledge'],
};

function walk(dir, out = []) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const s = fs.statSync(p);
    if (s.isDirectory()) walk(p, out);
    else if (/\.(tsx?|jsx?)$/.test(name)) out.push(p);
  }
  return out;
}

function collectKeys() {
  const staticRe = /sharing\.assetSupply\.[a-zA-Z0-9_.]+/g;
  const dynRe = /`(sharing\.assetSupply\.[a-zA-Z0-9_.]*?)\$\{/g;
  const keys = new Set();
  for (const file of walk(SRC)) {
    const txt = fs.readFileSync(file, 'utf8');
    for (const m of txt.matchAll(staticRe)) {
      let k = m[0];
      if (k.endsWith('.')) continue;
      keys.add(k);
    }
    for (const m of txt.matchAll(dynRe)) {
      const prefix = m[1];
      const enums = DYNAMIC_ENUMS[prefix];
      if (!enums) {
        console.warn(`⚠️  发现未登记的动态前缀：${prefix}（${path.relative(ROOT, file)}），请在 DYNAMIC_ENUMS 中补充。`);
        continue;
      }
      for (const v of enums) keys.add(prefix + v);
    }
  }
  return [...keys].sort();
}

function getByPath(obj, dotPath) {
  return dotPath.split('.').reduce((o, k) => (o == null ? o : o[k]), obj);
}

const keys = collectKeys();
console.log(`扫描到 ${keys.length} 个 ${PREFIX}* key。`);

let missing = 0;
for (const [locale, file] of Object.entries(LOCALES)) {
  const json = JSON.parse(fs.readFileSync(file, 'utf8'));
  const miss = keys.filter((k) => typeof getByPath(json, k) !== 'string');
  if (miss.length) {
    missing += miss.length;
    console.error(`\n❌ [${locale}] 缺失 ${miss.length} 个 key：`);
    for (const k of miss) console.error('   - ' + k);
  } else {
    console.log(`✅ [${locale}] 全部存在`);
  }
}

if (missing > 0) {
  console.error(`\n共缺失 ${missing} 个翻译，请在 public/i18n/*.json 补齐。`);
  process.exit(1);
}
