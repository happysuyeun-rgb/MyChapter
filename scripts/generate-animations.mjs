/**
 * text-to-lottie (Bodymovin) format generator for MyChapter animations.
 * Run: node scripts/generate-animations.mjs
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT_DIR = join(__dirname, '../src/assets/animations')

const FR = 60

function hex(hexColor) {
  const h = hexColor.replace('#', '')
  return [
    parseInt(h.slice(0, 2), 16) / 255,
    parseInt(h.slice(2, 4), 16) / 255,
    parseInt(h.slice(4, 6), 16) / 255,
    1,
  ]
}

const GREEN = hex('#3B6D11')
const GREEN_MID = hex('#639922')
const GREEN_LIGHT = hex('#EAF3DE')

function comp({ w, h, op, layers }) {
  return {
    v: '5.7.0',
    fr: FR,
    ip: 0,
    op,
    w,
    h,
    nm: 'MyChapter',
    ddd: 0,
    assets: [],
    layers,
  }
}

function animProp(value) {
  if (value && typeof value === 'object' && 'a' in value && 'k' in value) {
    return value
  }
  return { a: 0, k: value }
}

function layerTransform({
  pos = [0, 0, 0],
  anchor = [0, 0, 0],
  scale = [100, 100, 100],
  rotation = 0,
  opacity = 100,
  animatedScale,
  animatedOpacity,
}) {
  return {
    o: animatedOpacity ?? animProp(opacity),
    r: animProp(rotation),
    p: animProp(pos),
    a: animProp(anchor),
    s: animatedScale ?? animProp(scale),
  }
}

function groupTransform() {
  return {
    ty: 'tr',
    p: { a: 0, k: [0, 0] },
    a: { a: 0, k: [0, 0] },
    s: { a: 0, k: [100, 100] },
    r: { a: 0, k: 0 },
    o: { a: 0, k: 100 },
  }
}

function shapeLayer({ name, ip, op, ks, shapes }) {
  return {
    ty: 4,
    nm: name,
    sr: 1,
    st: 0,
    ip,
    op,
    hd: false,
    ddd: 0,
    bm: 0,
    hasMask: false,
    ao: 0,
    ks,
    ef: [],
    shapes,
    ind: 1,
  }
}

function easeInOutKeyframes(t0, t1, v0, v1) {
  return [
    { t: t0, s: [v0], i: { x: [0.42], y: [0] }, o: { x: [0.58], y: [1] } },
    { t: t1, s: [v1] },
  ]
}

function easeOutKeyframes(t0, t1, v0, v1) {
  return [
    { t: t0, s: [v0], i: { x: [0], y: [0] }, o: { x: [0.58], y: [1] } },
    { t: t1, s: [v1] },
  ]
}

function linearKeyframes(t0, t1, v0, v1) {
  return [
    { t: t0, s: [v0], i: { x: [0], y: [0] }, o: { x: [1], y: [1] } },
    { t: t1, s: [v1] },
  ]
}

function holdThenKeyframes(t0, t1, t2, v0, v1) {
  return [
    { t: t0, s: [v0], i: { x: [1], y: [1] }, o: { x: [0], y: [0] } },
    { t: t1, s: [v0], i: { x: [0.42], y: [0] }, o: { x: [0.58], y: [1] } },
    { t: t2, s: [v1] },
  ]
}

/** 1. checkmark-complete — 80×80, 1.8s, play once */
function buildCheckmarkComplete() {
  const w = 80
  const h = 80
  const cx = 40
  const cy = 40
  const op = 108 // 1.8s

  const circleGroup = {
    ty: 'gr',
    nm: 'circle',
    it: [
      {
        ty: 'el',
        p: { a: 0, k: [0, 0] },
        s: { a: 0, k: [64, 64] },
      },
      {
        ty: 'st',
        c: { a: 0, k: GREEN },
        o: { a: 0, k: 100 },
        w: { a: 0, k: 3.5 },
        lc: 2,
        lj: 2,
        ml: 4,
      },
      {
        ty: 'tm',
        s: { a: 0, k: 0 },
        e: {
          a: 1,
          k: easeInOutKeyframes(0, 48, 0, 100),
        },
        o: { a: 0, k: 0 },
        m: 1,
      },
      groupTransform(),
    ],
  }

  const checkGroup = {
    ty: 'gr',
    nm: 'check',
    it: [
      {
        ty: 'sh',
        ks: {
          a: 0,
          k: {
            c: false,
            v: [
              [-12, 4],
              [-4, 12],
              [14, -10],
            ],
            i: [
              [0, 0],
              [0, 0],
              [0, 0],
            ],
            o: [
              [0, 0],
              [0, 0],
              [0, 0],
            ],
          },
        },
      },
      {
        ty: 'st',
        c: { a: 0, k: GREEN },
        o: { a: 0, k: 100 },
        w: { a: 0, k: 3.5 },
        lc: 2,
        lj: 2,
        ml: 4,
      },
      {
        ty: 'tm',
        s: { a: 0, k: 0 },
        e: {
          a: 1,
          k: easeOutKeyframes(48, 90, 0, 100),
        },
        o: { a: 0, k: 0 },
        m: 1,
      },
      groupTransform(),
    ],
  }

  return comp({
    w,
    h,
    op,
    layers: [
      shapeLayer({
        name: 'checkmark',
        ip: 0,
        op,
        ks: layerTransform({
          pos: [cx, cy, 0],
          anchor: [0, 0, 0],
          animatedScale: {
            a: 1,
            k: [
              { t: 0, s: [100, 100, 100], i: { x: [0.5], y: [1] }, o: { x: [0.5], y: [0] } },
              { t: 90, s: [100, 100, 100], i: { x: [0.5], y: [1] }, o: { x: [0.5], y: [0] } },
              { t: 96, s: [108, 108, 100], i: { x: [0.5], y: [1] }, o: { x: [0.5], y: [0] } },
              { t: 102, s: [96, 96, 100], i: { x: [0.5], y: [1] }, o: { x: [0.5], y: [0] } },
              { t: 108, s: [100, 100, 100] },
            ],
          },
        }),
        shapes: [circleGroup, checkGroup],
      }),
    ],
  })
}

/** 2. book-open — 100×80, 2s, play once */
function buildBookOpen() {
  const w = 100
  const h = 80
  const op = 120
  const cx = 50
  const cy = 44

  const coverGroup = {
    ty: 'gr',
    nm: 'cover',
    it: [
      {
        ty: 'rc',
        p: { a: 0, k: [0, 0] },
        s: { a: 0, k: [56, 72] },
        r: { a: 0, k: 3 },
      },
      { ty: 'fl', c: { a: 0, k: GREEN_LIGHT }, o: { a: 0, k: 100 } },
      groupTransform(),
    ],
  }

  const leftPageGroup = {
    ty: 'gr',
    nm: 'left-page',
    it: [
      {
        ty: 'rc',
        p: { a: 0, k: [-14, 0] },
        s: { a: 0, k: [28, 68] },
        r: { a: 0, k: 2 },
      },
      { ty: 'fl', c: { a: 0, k: GREEN }, o: { a: 0, k: 100 } },
      {
        ty: 'tr',
        p: { a: 0, k: [0, 0] },
        a: { a: 0, k: [14, 0] },
        s: { a: 0, k: [100, 100] },
        r: {
          a: 1,
          k: holdThenKeyframes(0, 30, 72, 0, -55),
        },
        o: { a: 0, k: 100 },
      },
    ],
  }

  const rightPageGroup = {
    ty: 'gr',
    nm: 'right-page',
    it: [
      {
        ty: 'rc',
        p: { a: 0, k: [14, 0] },
        s: { a: 0, k: [28, 68] },
        r: { a: 0, k: 2 },
      },
      { ty: 'fl', c: { a: 0, k: GREEN }, o: { a: 0, k: 100 } },
      {
        ty: 'tr',
        p: { a: 0, k: [0, 0] },
        a: { a: 0, k: [-14, 0] },
        s: { a: 0, k: [100, 100] },
        r: {
          a: 1,
          k: holdThenKeyframes(0, 48, 90, 0, 55),
        },
        o: { a: 0, k: 100 },
      },
    ],
  }

  const glowGroup = {
    ty: 'gr',
    nm: 'glow',
    it: [
      {
        ty: 'el',
        p: { a: 0, k: [0, 0] },
        s: { a: 0, k: [90, 90] },
      },
      { ty: 'fl', c: { a: 0, k: [...GREEN_LIGHT.slice(0, 3), 0.6] }, o: { a: 0, k: 100 } },
      {
        ty: 'tr',
        p: { a: 0, k: [0, 0] },
        a: { a: 0, k: [0, 0] },
        s: { a: 0, k: [100, 100] },
        r: { a: 0, k: 0 },
        o: {
          a: 1,
          k: [
            { t: 0, s: [0], i: { x: [0.5], y: [1] }, o: { x: [0.5], y: [0] } },
            { t: 90, s: [0], i: { x: [0.5], y: [1] }, o: { x: [0.5], y: [0] } },
            { t: 105, s: [40], i: { x: [0.5], y: [1] }, o: { x: [0.5], y: [0] } },
            { t: 120, s: [0] },
          ],
        },
      },
    ],
  }

  return comp({
    w,
    h,
    op,
    layers: [
      shapeLayer({
        name: 'book',
        ip: 0,
        op,
        ks: layerTransform({
          pos: [cx, cy, 0],
          anchor: [0, 0, 0],
          animatedScale: {
            a: 1,
            k: [
              { t: 0, s: [0, 0, 100], i: { x: [0.42], y: [0] }, o: { x: [0.58], y: [1] } },
              { t: 30, s: [100, 100, 100] },
              { t: 120, s: [100, 100, 100] },
            ],
          },
        }),
        shapes: [glowGroup, coverGroup, leftPageGroup, rightPageGroup],
      }),
    ],
  })
}

/** 3. confetti-burst — 200×200, 2s, play once */
function buildConfettiBurst() {
  const w = 200
  const h = 200
  const cx = 100
  const cy = 100
  const op = 120
  const colors = [GREEN, GREEN_MID, GREEN_LIGHT]
  const particles = Array.from({ length: 12 }, (_, i) => {
    const angle = (i / 12) * Math.PI * 2 + 0.2
    const speed = 55 + (i % 3) * 18
    const dx = Math.cos(angle) * speed
    const dy = Math.sin(angle) * speed - 20
    const endX = dx * 1.6
    const endY = dy * 1.6 + 80
    const color = colors[i % 3]
    const size = 6 + (i % 4) * 2
    const rotEnd = (i % 2 === 0 ? 1 : -1) * (180 + i * 30)

    return shapeLayer({
      name: `confetti-${i}`,
      ip: 0,
      op,
      ks: layerTransform({
        pos: {
          a: 1,
          k: [
            { t: 0, s: [cx, cy, 0], i: { x: [0.2], y: [1] }, o: { x: [0.8], y: [0] } },
            { t: 30, s: [cx + dx, cy + dy, 0], i: { x: [0.5], y: [1] }, o: { x: [0.5], y: [0] } },
            { t: 120, s: [cx + endX, cy + endY, 0] },
          ],
        },
        anchor: [0, 0, 0],
        animatedOpacity: {
          a: 1,
          k: [
            { t: 0, s: [100], i: { x: [0.5], y: [1] }, o: { x: [0.5], y: [0] } },
            { t: 60, s: [100], i: { x: [0.5], y: [1] }, o: { x: [0.5], y: [0] } },
            { t: 120, s: [0] },
          ],
        },
      }),
      shapes: [
        {
          ty: 'gr',
          nm: 'piece',
          it: [
            {
              ty: 'rc',
              p: { a: 0, k: [0, 0] },
              s: { a: 0, k: [size, size * (i % 2 === 0 ? 1.6 : 1)] },
              r: { a: 0, k: 1 },
            },
            { ty: 'fl', c: { a: 0, k: color }, o: { a: 0, k: 100 } },
            {
              ty: 'tr',
              p: { a: 0, k: [0, 0] },
              a: { a: 0, k: [0, 0] },
              s: { a: 0, k: [100, 100] },
              r: {
                a: 1,
                k: linearKeyframes(0, 120, 0, rotEnd),
              },
              o: { a: 0, k: 100 },
            },
          ],
        },
      ],
    })
  })

  return comp({ w, h, op, layers: particles })
}

/** 4. book-stack — 60×80, 3s loop */
function buildBookStack() {
  const w = 60
  const h = 80
  const op = 180 // 3s loop
  const shades = [
    hex('#2A5009'),
    hex('#3B6D11'),
    hex('#639922'),
    hex('#7CB332'),
  ]

  const books = shades.map((color, i) => {
    const delay = Math.round(i * 0.3 * FR) // 18 frames apart
    const land = delay + 24
    const bounceUp = land + 6
    const settle = land + 12
    const yBase = 28 - i * 6
    const xOffset = (i - 1.5) * 2

    return shapeLayer({
      name: `book-${i + 1}`,
      ip: 0,
      op,
      ks: layerTransform({
        pos: [30 + xOffset, yBase, 0],
        anchor: [0, 0, 0],
        animatedScale: {
          a: 1,
          k: [
            { t: 0, s: [0, 0, 100], i: { x: [0.5], y: [1] }, o: { x: [0.5], y: [0] } },
            { t: delay, s: [0, 0, 100], i: { x: [0.5], y: [1] }, o: { x: [0.5], y: [0] } },
            { t: land, s: [100, 100, 100], i: { x: [0.5], y: [1] }, o: { x: [0.5], y: [0] } },
            { t: bounceUp, s: [104, 96, 100], i: { x: [0.5], y: [1] }, o: { x: [0.5], y: [0] } },
            { t: settle, s: [100, 100, 100] },
            { t: op, s: [100, 100, 100] },
          ],
        },
        animatedOpacity: {
          a: 1,
          k: [
            { t: 0, s: [0], i: { x: [0.5], y: [1] }, o: { x: [0.5], y: [0] } },
            { t: delay, s: [0], i: { x: [0.5], y: [1] }, o: { x: [0.5], y: [0] } },
            { t: delay + 1, s: [100] },
            { t: op, s: [100] },
          ],
        },
      }),
      shapes: [
        {
          ty: 'gr',
          nm: 'book-body',
          it: [
            {
              ty: 'rc',
              p: { a: 0, k: [0, 0] },
              s: { a: 0, k: [36, 10] },
              r: { a: 0, k: 1.5 },
            },
            { ty: 'fl', c: { a: 0, k: color }, o: { a: 0, k: 100 } },
            groupTransform(),
          ],
        },
      ],
    })
  })

  return comp({ w, h, op, layers: books.reverse() })
}

mkdirSync(OUT_DIR, { recursive: true })

const files = {
  'checkmark-complete.json': buildCheckmarkComplete(),
  'book-open.json': buildBookOpen(),
  'confetti-burst.json': buildConfettiBurst(),
  'book-stack.json': buildBookStack(),
}

for (const [name, data] of Object.entries(files)) {
  const path = join(OUT_DIR, name)
  writeFileSync(path, JSON.stringify(data, null, 2))
  console.log(`✓ ${path}`)
}
