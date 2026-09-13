/* ============================================================================
   React Bits interface layer — mount point
   ----------------------------------------------------------------------------
   The dashboard in index.html is plain ES5 and owns every byte of data logic:
   the fact tables, the aggregation, the ECharts figures, the routing. Nothing
   of that moves into React. What moves is the *chrome*: the masthead, the
   navigation, the KPI tiles, the reveals — rendered with components from
   React Bits (https://reactbits.dev, MIT + Commons Clause, see
   ui/reactbits/LICENSE.md), mounted as islands into markup the dashboard has
   already written.

   The bridge is one attribute. Any element the dashboard emits as

       <div data-rb="SpotlightCard" data-rb-props='{"tone":"voc"}'> … </div>

   is taken over by the named component on hydrate(); whatever HTML the element
   already held is adopted as that component's children, so a React Bits
   wrapper can wrap markup React never rendered.

   Colour is not decided here. Every value the components receive is read from
   the CSS custom properties in assets/brand.css at runtime (see readBrand),
   so the palette stays the one the brand guidelines set, and changing a token
   there changes the animation with it.
   ========================================================================== */

import { StrictMode, createElement as h, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';

import Aurora from './reactbits/Aurora/Aurora.jsx';
import GooeyNav from './reactbits/GooeyNav/GooeyNav.jsx';
import SpotlightCard from './reactbits/SpotlightCard/SpotlightCard.jsx';
import CountUp from './reactbits/CountUp/CountUp.jsx';
import SplitText from './reactbits/SplitText/SplitText.jsx';
import ShinyText from './reactbits/ShinyText/ShinyText.jsx';
import GradientText from './reactbits/GradientText/GradientText.jsx';
import StarBorder from './reactbits/StarBorder/StarBorder.jsx';
import ClickSpark from './reactbits/ClickSpark/ClickSpark.jsx';
import AnimatedContent from './reactbits/AnimatedContent/AnimatedContent.jsx';
import FadeContent from './reactbits/FadeContent/FadeContent.jsx';
import Magnet from './reactbits/Magnet/Magnet.jsx';
import GlareHover from './reactbits/GlareHover/GlareHover.jsx';

import './mim.css';

/* ---------------------------------------------------------------------------
   Brand tokens
   The components take colours as plain strings, so they have to be resolved
   from the stylesheet rather than passed as var(). Read once, after the
   stylesheet has applied, and cached — assets/brand.css is static.
   -------------------------------------------------------------------------- */
let brandCache = null;
function readBrand() {
  if (brandCache) return brandCache;
  const cs = getComputedStyle(document.documentElement);
  const tok = (name, fallback) => (cs.getPropertyValue(name).trim() || fallback);
  brandCache = {
    purple: tok('--mim-purple', '#413258'),
    purpleLight: tok('--mim-purple-300', '#B197CC'),
    purpleGlow: tok('--mim-gradient-purple-from', '#825DEC'),
    blue: tok('--mim-blue', '#1AD9C7'),
    blueDeep: tok('--mim-blue-700', '#0E8E9A'),
    pink: tok('--mim-pink', '#BFA19F'),
    greyLight: tok('--mim-grey-light', '#E6E6E6'),
    greyMedium: tok('--mim-grey-medium', '#B3B3B3'),
    greyDark: tok('--mim-grey-dark', '#666666'),
    ink: tok('--mim-grey-darkest', '#1A1A1A')
  };
  return brandCache;
}

/* A visitor who has asked their system to stop animating gets the finished
   state, not the journey. Every component below is given a still variant. */
const reducedMotion =
  typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/* CountUp's props for one figure. At reduced motion the count does not run,
   and a counter that never runs shows the number it started from — so the
   start is moved to the finish and the reader gets the figure, not a zero. */
function counting(value, delay) {
  return reducedMotion
    ? { to: value, from: value, startWhen: false, separator: ',' }
    : { to: value, from: 0, delay: delay || 0, duration: 2.2, separator: ',' };
}

/* ---------------------------------------------------------------------------
   Adopt — hand existing DOM to a React parent
   React cannot take ownership of nodes it did not create, but it can be handed
   a host element to append them to. The host is display:contents, so a React
   Bits wrapper adds behaviour to the dashboard's own markup without adding a
   box that would break the surrounding grid.
   -------------------------------------------------------------------------- */
function Adopt({ node }) {
  const hostRef = useRef(null);
  useEffect(() => {
    const host = hostRef.current;
    if (host && node && node.parentNode !== host) host.appendChild(node);
  }, [node]);
  return h('div', { ref: hostRef, className: 'rb-adopt' });
}

/* ---------------------------------------------------------------------------
   Composed islands
   Each of these is a thin arrangement of React Bits components with the props
   this dashboard needs. They exist so index.html can ask for "a KPI tile"
   rather than restating a dozen animation parameters at every call site.
   -------------------------------------------------------------------------- */

/* The band under the masthead. Aurora is the only full-bleed animation on the
   page; it sits behind the darkest brand grey at low amplitude so the purple
   and teal stay accents, which is the ratio the guidelines set on p.34. */
/* Off-screen WebGL still burns a frame budget, so the aurora is mounted only
   while the band it lives in is actually on screen. Crossing that line is rare
   — the band is the top of the page — so the context is built and lost a
   handful of times a session, not per frame. */
function useOnScreen(ref) {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver !== 'function') return;
    const io = new IntersectionObserver(
      entries => setVisible(entries[0].isIntersecting),
      { rootMargin: '120px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref]);
  return visible;
}

function Hero({ eyebrow, headline, total, employed, years, occupations, majors, labels, compact }) {
  const b = readBrand();
  const ref = useRef(null);
  const onScreen = useOnScreen(ref);
  return h(
    'div',
    { className: 'hero-inner' + (compact ? ' is-compact' : ''), ref },
    reducedMotion || !onScreen
      ? null
      : h(
          'div',
          { className: 'hero-aurora', 'aria-hidden': 'true' },
          h(Aurora, {
            colorStops: [b.purple, b.blue, b.purpleGlow],
            amplitude: 0.85,
            blend: 0.62,
            speed: 0.35
          })
        ),
    h(
      'div',
      { className: 'hero-copy' },
      compact ? null : h(ShinyText, {
        text: eyebrow,
        className: 'hero-eyebrow',
        speed: 6,
        color: b.greyMedium,
        shineColor: b.blue,
        spread: 90
      }),
      compact ? null : h(
        GradientText,
        {
          className: 'hero-headline',
          colors: [b.blue, b.purpleLight, b.pink, b.blue],
          animationSpeed: 14,
          yoyo: false
        },
        headline
      ),
      h(
        'div',
        { className: 'hero-figures' },
        h(
          'div',
          { className: 'hero-figure is-lead' },
          h('div', { className: 'hero-figure-value' }, h(CountUp, counting(total))),
          h('div', { className: 'hero-figure-label' }, labels.total)
        ),
        h(
          'div',
          { className: 'hero-figure' },
          h('div', { className: 'hero-figure-value' }, h(CountUp, counting(employed, 0.15))),
          h('div', { className: 'hero-figure-label' }, labels.employed)
        ),
        h(
          'div',
          { className: 'hero-figure' },
          h('div', { className: 'hero-figure-value' }, h(CountUp, counting(occupations, 0.3))),
          h('div', { className: 'hero-figure-label' }, labels.occupations)
        ),
        h(
          'div',
          { className: 'hero-figure' },
          h('div', { className: 'hero-figure-value' }, h(CountUp, counting(majors, 0.45))),
          h('div', { className: 'hero-figure-label' }, labels.majors)
        ),
        h(
          'div',
          { className: 'hero-period' },
          h(
            StarBorder,
            {
              as: 'div',
              color: b.blue,
              speed: reducedMotion ? '0s' : '7s',
              thickness: 2,
              backgroundColor: 'rgba(26,26,26,.55)',
              textColor: '#fff',
              borderColor: 'rgba(255,255,255,.16)'
            },
            years
          )
        )
      )
    )
  );
}

/* The section navigation. GooeyNav keeps its own idea of which item is lit,
   which is right while it is the thing being clicked and wrong the moment a
   card elsewhere on the page changes the route — so the index is mirrored in
   from the router on every render. */
function Nav({ items, activeIndex }) {
  const b = readBrand();
  return h(
    'div',
    {
      className: 'nav-gooey',
      style: {
        '--color-1': b.blue,
        '--color-2': b.purpleLight,
        '--color-3': b.pink,
        '--color-4': b.purpleGlow
      }
    },
    h(GooeyNav, {
      items: items.map(it => ({
        href: it.href,
        label: h(
          'span',
          { className: 'nav-label' },
          it.label,
          it.count ? h('span', { className: 'nav-count' }, it.count) : null
        )
      })),
      activeIndex,
      particleCount: reducedMotion ? 0 : 12,
      particleDistances: [72, 8],
      particleR: 88,
      animationTime: 520,
      timeVariance: 260
    })
  );
}

/* A KPI tile: the spotlight follows the pointer in brand purple, the figure
   counts up once when it scrolls into view. */
function Kpi({ label, value, raw, sub, tone }) {
  const b = readBrand();
  const spotlight =
    tone === 'uni' ? 'rgba(26, 217, 199, .20)'
      : tone === 'voc' ? 'rgba(130, 93, 236, .20)'
        : 'rgba(65, 50, 88, .14)';
  return h(
    SpotlightCard,
    { className: 'kpi' + (tone ? ' is-' + tone : ''), spotlightColor: spotlight },
    h('div', { className: 'label' }, label),
    h(
      'div',
      { className: 'value' },
      raw !== undefined && raw !== null
        ? raw
        : h(CountUp, Object.assign(counting(value), reducedMotion ? {} : { duration: 1.6 }))
    ),
    h('div', { className: 'sub' }, sub || '')
  );
}

/* ---------------------------------------------------------------------------
   Registry
   Anything named here can be asked for from index.html by data-rb.
   -------------------------------------------------------------------------- */
const REGISTRY = {
  /* React Bits, unchanged */
  Aurora, GooeyNav, SpotlightCard, CountUp, SplitText, ShinyText, GradientText,
  StarBorder, ClickSpark, AnimatedContent, FadeContent, Magnet, GlareHover,
  /* arrangements of the above */
  Hero, Nav, Kpi
};

/* A handful of props are colours, and a colour is a brand token, not a hex the
   caller should be retyping. "@purple" resolves to whatever assets/brand.css
   currently says --mim-purple is. Arrays are walked too: several components
   take a list of stops rather than a single colour. */
function resolveToken(v) {
  const b = readBrand();
  if (typeof v === 'string') return v.charAt(0) === '@' ? (b[v.slice(1)] || v) : v;
  if (Array.isArray(v)) return v.map(resolveToken);
  return v;
}
function resolveProps(props) {
  const out = {};
  Object.keys(props).forEach(k => { out[k] = resolveToken(props[k]); });
  return out;
}

/* Reveal-on-scroll is the one effect applied by the dozen, and at reduced
   motion it must collapse to "already there" rather than "never arrives" —
   AnimatedContent and FadeContent both start from opacity 0. */
function revealProps(name, props) {
  if (!reducedMotion) return props;
  if (name === 'AnimatedContent') {
    return Object.assign({}, props, { distance: 0, duration: 0.01, initialOpacity: 1, scale: 1 });
  }
  if (name === 'FadeContent') {
    return Object.assign({}, props, { duration: 1, blur: false, initialOpacity: 1 });
  }
  if (name === 'SplitText') {
    return Object.assign({}, props, { duration: 0.01, delay: 0, from: { opacity: 1, y: 0 } });
  }
  return props;
}

/* ---------------------------------------------------------------------------
   Roots
   Shell roots (the masthead, the hero, the navigation, the click spark) are
   mounted once and live for the session. View roots belong to whatever the
   router last painted into <main> and are unmounted before it is repainted,
   so a React tree never outlives the markup it was attached to.
   -------------------------------------------------------------------------- */
const shellRoots = new Map();
const viewRoots = [];
const permanentRoots = [];

function render(el, name, props, children) {
  const Comp = REGISTRY[name];
  if (!Comp) { console.warn('[reactbits] unknown component:', name); return null; }
  const root = createRoot(el);
  /* Synchronous on purpose: hydrate() returns to ES5 code that immediately
     looks its own nodes up by id and hands them to ECharts. Were the adoption
     still queued, those nodes would be briefly detached and the charts would
     measure a zero-sized box. */
  flushSync(() => {
    root.render(h(StrictMode, null, h(Comp, resolveProps(revealProps(name, props)), children)));
  });
  return root;
}

function readProps(el) {
  const raw = el.getAttribute('data-rb-props');
  if (!raw) return {};
  try { return JSON.parse(raw); } catch (e) {
    console.warn('[reactbits] bad data-rb-props on', el, e);
    return {};
  }
}

/* Components that render a `text` prop rather than children. For these the
   element's own text is the source — the sentence is in the HTML, where a
   reader without JavaScript and a crawler both still find it, and the
   component is handed a copy rather than the markup being emptied into an
   attribute. */
const TEXT_PROP = { SplitText: 1, ShinyText: 1 };

/* Take every [data-rb] inside `container` and hand it to its component. The
   element's existing children, if any, are detached first and adopted back in
   as React children, which is what lets a wrapper wrap dashboard markup. */
function hydrate(container, permanent) {
  const scope = container || document;
  const targets = Array.prototype.slice.call(scope.querySelectorAll('[data-rb]'));
  targets.forEach(el => {
    if (el.__rbRoot) return;
    const name = el.getAttribute('data-rb');
    const props = readProps(el);
    if (TEXT_PROP[name] && props.text === undefined) {
      props.text = el.textContent.trim();
      el.textContent = '';
    }
    let adopted = null;
    if (el.firstChild) {
      adopted = document.createDocumentFragment();
      while (el.firstChild) adopted.appendChild(el.firstChild);
    }
    const root = render(el, name, props, adopted ? h(Adopt, { node: adopted }) : null);
    if (!root) return;
    el.__rbRoot = root;
    (permanent ? permanentRoots : viewRoots).push({ el, root });
  });
}

/* Called by the router before it repaints <main>. */
function unmountView() {
  while (viewRoots.length) {
    const entry = viewRoots.pop();
    try { entry.root.unmount(); } catch (e) { /* already gone with its markup */ }
    entry.el.__rbRoot = null;
  }
}

/* A shell island is addressed by key so it can be re-rendered with new props
   — the hero's figures follow the year filter — without being torn down. */
function shell(key, el, name, props) {
  const Comp = REGISTRY[name];
  if (!Comp || !el) return;
  let entry = shellRoots.get(key);
  if (!entry) {
    entry = { root: createRoot(el), Comp };
    shellRoots.set(key, entry);
  }
  entry.root.render(h(Comp, resolveProps(revealProps(name, props))));
}

/* ---------------------------------------------------------------------------
   Click spark
   ClickSpark wraps its children and listens on the wrapper. Wrapping the whole
   document in a React root is not on the table here, so it is mounted as a
   fixed, click-through overlay and fed the page's real clicks. Only trusted
   events are forwarded; the synthetic one dispatched below would otherwise
   bubble back and spark itself forever.
   -------------------------------------------------------------------------- */
function mountClickSpark() {
  if (reducedMotion) return;
  const layer = document.createElement('div');
  layer.className = 'rb-spark-layer';
  layer.setAttribute('aria-hidden', 'true');
  document.body.appendChild(layer);
  const b = readBrand();
  createRoot(layer).render(
    h(ClickSpark, { sparkColor: b.blue, sparkSize: 9, sparkRadius: 17, sparkCount: 8, duration: 420 })
  );
  document.addEventListener('click', e => {
    if (!e.isTrusted) return;
    const host = layer.firstElementChild;
    if (!host) return;
    host.dispatchEvent(new MouseEvent('click', {
      bubbles: true, cancelable: true, clientX: e.clientX, clientY: e.clientY
    }));
  }, true);
}

/* ------------------------------- public API ------------------------------ */
window.MIMUI = {
  hydrate,
  /* For islands in the page shell — the masthead, the notice bar — which the
     router must never take down with the view it repaints. */
  hydrateOnce: el => hydrate(el, true),
  unmountView,
  shell,
  brand: readBrand,
  reducedMotion,
  ready: true
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mountClickSpark);
} else {
  mountClickSpark();
}

document.dispatchEvent(new CustomEvent('mimui:ready'));
