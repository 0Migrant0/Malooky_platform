const floatingGlyphs = [
  { char: "م", left: "8%", top: "18vh", tone: "warm" },
  { char: "ع", left: "88%", top: "36vh", tone: "cool" },
  { char: "ن", left: "15%", top: "60vh", tone: "warm" },
  { char: "ل", left: "81%", top: "78vh", tone: "cool" },
];

const strokes = [
  { d: "M-54 205C21 188 53 83 119 76C179 69 116 196 183 196C243 196 255 22 327 24C391 26 327 213 403 214C462 214 481 137 546 119", cls: "ambient-stroke ambient-stroke-one" },
  { d: "M-72 326C18 315 68 244 132 248C188 252 183 336 252 328C326 320 313 229 395 237C457 243 457 315 536 300", cls: "ambient-stroke ambient-stroke-two" },
  { d: "M-18 83C28 71 42 34 74 20M485 381C528 358 553 350 590 344", cls: "ambient-stroke ambient-stroke-three" },
  { d: "M111 371C156 355 171 321 205 323C237 325 245 359 278 358", cls: "ambient-stroke ambient-stroke-four" },
];

export default function CalligraffitiAtmosphere() {
  return (
    <div className="calligraffiti-atmosphere" aria-hidden="true">
      <svg className="ambient-calligraphy" viewBox="0 0 540 420" preserveAspectRatio="none">
        <defs>
          <linearGradient id="ambient-ink" x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#8B8585" />
            <stop offset=".48" stopColor="#514C4C" />
            <stop offset="1" stopColor="#A7A1A1" />
          </linearGradient>
        </defs>
        {strokes.map((stroke) => <path key={stroke.cls} d={stroke.d} className={stroke.cls} />)}
        <circle className="ambient-dot ambient-dot-one" cx="105" cy="150" r="3" />
        <circle className="ambient-dot ambient-dot-two" cx="438" cy="83" r="2.2" />
        <circle className="ambient-dot ambient-dot-three" cx="362" cy="348" r="2.6" />
      </svg>
      {floatingGlyphs.map((glyph) => (
        <span
          key={glyph.char}
          className={`ambient-floating-glyph ambient-floating-glyph-${glyph.tone}`}
          style={{ left: glyph.left, top: glyph.top }}
        >
          {glyph.char}
        </span>
      ))}
      <span className="ambient-seal">م</span>
    </div>
  );
}
