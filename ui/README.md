# Interface layer

The dashboard's data logic — the fact tables, the aggregation, the ECharts
figures, the routing — is plain ES5 and lives in `index.html`. None of it is in
here. What is in here is the **chrome**: the masthead title, the aurora band,
the section navigation, the KPI tiles, the reveals — built with components from
[React Bits](https://reactbits.dev) and mounted into the markup the dashboard
has already written.

```
ui/
  index.jsx        the bridge: registry, hydration, the composed islands
  mim.css          React Bits, restated in the ministry's palette
  reactbits/       the vendored components, as published
```

## How a component reaches the page

One attribute. Anything `index.html` emits as

```html
<div data-rb="AnimatedContent" data-rb-props='{"distance":34}'>
  <section class="card">…</section>
</div>
```

is taken over by that component on `MIMUI.hydrate()`. The element's existing
children are detached and adopted back in as the component's React children,
through a `display:contents` host — so a React Bits wrapper can wrap markup
React never rendered, without adding a box that breaks the grid around it.

Two consequences are deliberate:

* **The finished thing is in the markup first.** A KPI tile carries its real
  figure; the masthead carries a real `<h1>`. The component replaces what is
  there rather than filling a blank, so a reader whose browser never runs
  `assets/reactbits.js` gets the dashboard as it was before this layer existed,
  and a crawler reads the sentences.
* **Hydration runs last.** The views look their own nodes up by id and hand them
  to ECharts; hydrating re-parents those nodes. The router therefore hydrates
  only after every view function has returned, and the render itself is wrapped
  in `flushSync`, so a chart never measures a detached box.

`MIMUI.shell(key, …)` is the other half: the masthead band and the navigation
are mounted once and re-rendered with new props, never torn down, so the aurora
keeps its WebGL context and the navigation's blob is not interrupted by the
repaint underneath it.

## Colour

Nothing here invents a colour. Components take colours as plain strings, so the
tokens in `assets/brand.css` are read from the computed style at runtime and
passed in; in `data-rb-props` a value of `"@purple"` resolves to whatever
`--mim-purple` currently is. Change the token, and the aurora, the pill and the
gradient headline change with it.

The usage ratio from the brand guidelines (p.34 — greys carrying the layout,
purple and teal as accent) survives the redesign: the aurora is capped at 42%
opacity over the darkest brand grey, and every other saturated element is a
pill, a rule or a figure.

## Motion

`prefers-reduced-motion` is honoured component by component, not by a blanket
`animation: none`: the aurora and the click spark are not mounted at all, the
reveals collapse to "already there" rather than "never arrives", and the
counters are started at their final value so a reader sees the figure instead
of a zero.

## Components used

| Component | Where |
|---|---|
| `Aurora` | the band under the masthead |
| `GooeyNav` | the section navigation |
| `SpotlightCard` | every KPI tile |
| `CountUp` | every KPI and hero figure |
| `SplitText` | the masthead title (split by **word** — Arabic is cursive and splitting a word into glyphs severs the joins) |
| `ShinyText` | the masthead's English line, the hero eyebrow |
| `GradientText` | the hero headline, every detail-page heading |
| `StarBorder` | the period badge |
| `ClickSpark` | the whole page |
| `AnimatedContent` | every chart and content card |
| `FadeContent` | the browse lists, the footer note |
| `Magnet` | the privacy notice's button |
| `GlareHover` | the specialization tiles |

## Building

```
npm install
npm run build        # -> assets/reactbits.js, assets/reactbits.css
```

The outputs are **committed**, exactly as `assets/echarts.min.js` is: Cloudflare
serves the repository, there is no build step in the deploy, and `index.html`
has to keep working when it is opened straight off a disk. `node_modules` is not
committed and is not needed to serve the site — only to rebuild that pair of
files. Re-run after any change under `ui/`, and commit what changes.

## Licence

The components under `reactbits/` are © David Haz, MIT with a Commons Clause —
see `reactbits/LICENSE.md`. That licence permits their use and modification as
part of an application, website or product, and forbids selling or
redistributing the components themselves. This is the former.

The two files that were modified from upstream carry a `LOCAL CHANGE` comment at
the point of the change, so the copies stay diffable:

* `GooeyNav` — accepts a controlled `activeIndex`, because the dashboard's
  router, not the navigation, is the authority on which section is open.

Everything else is upstream verbatim; every other difference between React Bits'
look and this dashboard's is stated in `mim.css` instead.
