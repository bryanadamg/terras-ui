#!/usr/bin/env node
'use strict';

// Proves a tokens.css refactor changes nothing: resolves every --terras-* token
// to its final value under each theme scope, in the working tree and at a git
// ref, and fails on any difference. Also fails on a var() that could resolve
// against the wrong scope (see checkScopes).
//
//   node tools/check-tokens.js          # compare with HEAD
//   node tools/check-tokens.js main     # compare with another ref
//
// Added tokens are listed but allowed; changed or removed ones fail.

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const FILE = 'src/tokens/tokens.css';
const ROOT = ':root';
// What a component can find itself under: no theme class, or one of the two.
const SCOPES = [[ROOT], [ROOT, '.ui-style-classic'], [ROOT, '.ui-style-blueprint']];

function parse(css) {
    const blocks = {};
    const clean = css.replace(/\/\*[\s\S]*?\*\//g, '');
    for (const m of clean.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
        const sel = m[1].trim();
        if (blocks[sel]) throw new Error('selector declared twice: ' + sel);
        blocks[sel] = {};
        for (const d of m[2].matchAll(/--terras-([a-z0-9-]+)\s*:\s*([^;]+);/g)) {
            blocks[sel][d[1]] = d[2].trim().replace(/\s+/g, ' ');
        }
    }
    return blocks;
}

const REF = /var\(\s*--terras-([a-z0-9-]+)\s*(?:,\s*([^()]*(?:\([^()]*\)[^()]*)*))?\)/;

function resolve(name, decls, seen = []) {
    if (seen.includes(name)) throw new Error('cycle: ' + seen.concat(name).join(' -> '));
    let v = decls[name];
    if (v === undefined) return undefined;
    for (let m; (m = v.match(REF));) {
        const inner = resolve(m[1], decls, seen.concat(name));
        const sub = inner !== undefined ? inner : m[2] !== undefined ? m[2].trim() : null;
        if (sub === null) throw new Error('--terras-' + name + ' references undefined --terras-' + m[1]);
        v = v.replace(m[0], sub);
    }
    return v.toLowerCase();
}

function resolveAll(blocks) {
    const out = {};
    for (const scope of SCOPES) {
        const decls = Object.assign({}, ...scope.map((s) => blocks[s] || {}));
        for (const name of Object.keys(decls)) {
            let v;
            try { v = resolve(name, decls); } catch (e) { v = '<invalid: ' + e.message + '>'; }
            out[scope.join(' ') + ' --terras-' + name] = v;
        }
    }
    return out;
}

// A custom property resolves its var()s on the element that declares it, then
// inherits the result. erp sets .ui-style-classic on nested elements (e.g.
// ModalWrapper's body), so a :root token pointing at a classic token would be
// resolved at <html>, outside the theme. Rule: :root may only reference :root;
// a theme block may reference itself or :root.
function checkScopes(blocks) {
    const errors = [];
    for (const [sel, decls] of Object.entries(blocks)) {
        for (const [name, value] of Object.entries(decls)) {
            for (const m of value.matchAll(new RegExp(REF.source, 'g'))) {
                const ok = (blocks[sel] && m[1] in blocks[sel]) || (sel !== ROOT && m[1] in blocks[ROOT]);
                if (!ok) errors.push(sel + ' --terras-' + name + ' references --terras-' + m[1] + ', which is not in ' + (sel === ROOT ? ':root' : 'this block or :root'));
            }
        }
    }
    return errors;
}

const ref = process.argv[2] || 'HEAD';
const cwd = path.resolve(__dirname, '..');
const before = parse(execFileSync('git', ['show', ref + ':' + FILE], { cwd, encoding: 'utf8' }));
const after = parse(fs.readFileSync(path.join(cwd, FILE), 'utf8'));

const errors = checkScopes(after);
const a = resolveAll(before);
const b = resolveAll(after);
const added = [];
for (const k of Object.keys(a)) {
    if (!(k in b)) errors.push('removed: ' + k);
    else if (a[k] !== b[k]) errors.push('changed: ' + k + '\n    ' + ref + ': ' + a[k] + '\n    now: ' + b[k]);
}
for (const k of Object.keys(b)) if (!(k in a)) added.push(k);

const refs = Object.values(after).reduce((n, d) => n + Object.values(d).filter((v) => REF.test(v)).length, 0);
console.log('tokens.css vs ' + ref + ': ' + Object.keys(a).length + ' resolved values compared, ' + refs + ' declarations use var()');
if (added.length) console.log('added (' + added.length + '):\n  ' + added.join('\n  '));
if (errors.length) {
    console.error('FAIL (' + errors.length + '):\n  ' + errors.join('\n  '));
    process.exit(1);
}
console.log('OK: every token resolves to the same value as at ' + ref);
