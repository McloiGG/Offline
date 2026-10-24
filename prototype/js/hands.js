window.OFFLINE_HANDS = String.raw`<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" id="handsSvg" viewBox="0 0 800 400" data-hands="idle" preserveAspectRatio="xMidYMax meet">
  <title>Player hand positions - six base poses</title>
  <!--
    Skin base: #c69c7b   Skin shade: #a67b5d   Skin highlight: #dfb897   Nail: #ead3be
    Cuff: #f6f6f8 with grey fold line #a9a9b3
    Cable: #3a3d43, stroke width 9, round caps (matches the printer sprite cable)
    Each pose is a 800x400 cell. Hands enter from the bottom edge, wrists are the pivot points.
    Ids inside a pose are prefixed with the pose name (idle-, hover-, reach-, press-, pull-, plug-)
    so the sheet stays valid. Every element also carries a shared class (right-hand, right-forearm,
    left-hand, left-forearm, right-finger-index, cable-grip) for global recolouring.
  -->

  <style>
    /* Transitions, state switching and animation hooks only. Fills and strokes are attributes. */
    @keyframes hands-idle-breathe { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-2px); } }
    @keyframes hands-press-dip { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(3px); } }
    @keyframes hands-reach-extend { from { transform: translateX(0); } to { transform: translateX(8px); } }
    @keyframes hands-pull-tension { from { transform: rotate(-3deg); } to { transform: rotate(0deg); } }
    @keyframes hands-plug-guide { from { transform: translateY(0); } to { transform: translateY(-6px); } }

    #hands-idle { animation: hands-idle-breathe 3s ease-in-out infinite; }
    #hands-press.play #press-right-finger-index { animation: hands-press-dip 0.15s ease-in 1; }
    #hands-reach.play { animation: hands-reach-extend 0.2s ease-out 1 forwards; }
    #hands-pull-cable { transform-box: fill-box; transform-origin: 70% 100%; }
    #hands-pull-cable.play { animation: hands-pull-tension 0.3s ease-in-out 1; }
    #hands-plug-in.play { animation: hands-plug-guide 0.4s ease-in 1 forwards; }

    /* Game mode: set data-hands="idle|hover|reach|press|pull-cable|plug-in" on the root svg,
       and set the viewBox to "0 0 800 400". The sheet layout and labels are switched off. */
    .hand-position { transition: opacity 0.1s linear; }
    svg[data-hands] .hand-cell { transform: none; }
    svg[data-hands] .sheet-only { display: none; }
    svg[data-hands] .hand-position { opacity: 0; }
    svg[data-hands="idle"] #hands-idle,
    svg[data-hands="hover"] #hands-hover,
    svg[data-hands="reach"] #hands-reach,
    svg[data-hands="press"] #hands-press,
    svg[data-hands="pull-cable"] #hands-pull-cable,
    svg[data-hands="plug-in"] #hands-plug-in { opacity: 1; }
  </style>

  <defs>
    <clipPath id="cell-clip"><rect x="0" y="0" width="800" height="400"/></clipPath>
    <linearGradient id="grad-sleeve" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#fafafc"/>
      <stop offset="1" stop-color="#dcdce4"/>
    </linearGradient>
    <filter id="blur-shadow" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="9"/></filter>

    <!-- Forearm with sleeve and cuff. Origin at the wrist, arm runs down the +y axis. -->
    <g id="def-forearm">
      <path d="M-38 58 L38 58 L48 300 L-48 300 Z" fill="url(#grad-sleeve)" stroke="#d6d6dc" stroke-width="1"/>
      <path d="M-33 22 L33 22 L36 56 L-36 56 Z" fill="#f6f6f8" stroke="#d6d6dc" stroke-width="1"/>
      <path d="M-35 56 L35 56" fill="none" stroke="#a9a9b3" stroke-width="3" stroke-linecap="round"/>
      <path d="M-30 -2 L30 -2 L27 26 L-27 26 Z" fill="#c69c7b"/>
      <path d="M21 -2 L30 -2 L27 26 L22 26 Z" fill="#a67b5d"/>
    </g>

    <!-- Palm, right hand, back of hand toward the viewer, fingers point to -y. -->
    <g id="def-palm">
      <path d="M-30 -2 Q-38 -30 -37 -62 Q-36 -72 -26 -72 L26 -72 Q36 -72 37 -62 Q38 -30 30 -2 Z" fill="#c69c7b"/>
      <path d="M24 -2 Q36 -30 34 -64 Q36 -66 37 -62 Q38 -30 30 -2 Z" fill="#a67b5d"/>
      <ellipse cx="-6" cy="-54" rx="20" ry="11" fill="#dfb897" opacity="0.55"/>
    </g>

    <!-- Thumb, base at the origin, points to -y. -->
    <g id="def-thumb">
      <rect x="-9" y="-46" width="18" height="52" rx="9" fill="#c69c7b"/>
      <rect x="3" y="-40" width="6" height="44" rx="3" fill="#a67b5d"/>
      <ellipse cx="-2" cy="-14" rx="4" ry="9" fill="#dfb897" opacity="0.6"/>
      <rect x="-5" y="-44" width="10" height="9" rx="2.5" fill="#ead3be"/>
    </g>

    <!-- Loosely curled finger. Origin at the knuckle line. -->
    <g id="def-finger-curl">
      <rect x="-8" y="-26" width="16" height="34" rx="8" fill="#c69c7b"/>
      <rect x="3" y="-16" width="5" height="22" rx="2.5" fill="#a67b5d"/>
      <rect x="-8" y="-26" width="16" height="9" rx="4.5" fill="#a67b5d"/>
      <ellipse cx="-1" cy="2" rx="5" ry="4" fill="#dfb897" opacity="0.7"/>
    </g>

    <!-- Extended fingers. Origin at the knuckle line, tips at -length. -->
    <g id="def-finger-index-ext">
      <rect x="-8" y="-60" width="16" height="66" rx="8" fill="#c69c7b"/>
      <rect x="3" y="-52" width="5" height="52" rx="2.5" fill="#a67b5d"/>
      <rect x="-5" y="-57" width="10" height="8" rx="2" fill="#ead3be"/>
      <ellipse cx="-1" cy="-4" rx="5" ry="4" fill="#dfb897" opacity="0.7"/>
    </g>
    <g id="def-finger-middle-ext">
      <rect x="-8" y="-68" width="16" height="74" rx="8" fill="#c69c7b"/>
      <rect x="3" y="-60" width="5" height="60" rx="2.5" fill="#a67b5d"/>
      <rect x="-5" y="-65" width="10" height="8" rx="2" fill="#ead3be"/>
      <ellipse cx="-1" cy="-4" rx="5" ry="4" fill="#dfb897" opacity="0.7"/>
    </g>
    <g id="def-finger-ring-ext">
      <rect x="-8" y="-62" width="16" height="68" rx="8" fill="#c69c7b"/>
      <rect x="3" y="-54" width="5" height="54" rx="2.5" fill="#a67b5d"/>
      <rect x="-5" y="-59" width="10" height="8" rx="2" fill="#ead3be"/>
      <ellipse cx="-1" cy="-4" rx="5" ry="4" fill="#dfb897" opacity="0.7"/>
    </g>
    <g id="def-finger-pinky-ext">
      <rect x="-8" y="-48" width="16" height="54" rx="8" fill="#c69c7b"/>
      <rect x="3" y="-40" width="5" height="40" rx="2.5" fill="#a67b5d"/>
      <rect x="-5" y="-45" width="10" height="8" rx="2" fill="#ead3be"/>
      <ellipse cx="-1" cy="-4" rx="5" ry="4" fill="#dfb897" opacity="0.7"/>
    </g>
    <g id="def-index-point">
      <rect x="-8" y="-76" width="16" height="82" rx="8" fill="#c69c7b"/>
      <rect x="3" y="-68" width="5" height="68" rx="2.5" fill="#a67b5d"/>
      <rect x="-5" y="-73" width="10" height="8" rx="2" fill="#ead3be"/>
      <ellipse cx="-1" cy="-4" rx="5" ry="4" fill="#dfb897" opacity="0.7"/>
      <ellipse cx="-1" cy="-36" rx="5" ry="4" fill="#dfb897" opacity="0.5"/>
    </g>

    <!-- Composite hands -->
    <g id="def-hand-curled">
      <use xlink:href="#def-palm"/>
      <use xlink:href="#def-thumb" transform="translate(-33 -16) rotate(-40)"/>
      <use xlink:href="#def-finger-curl" transform="translate(-27 -70)"/>
      <use xlink:href="#def-finger-curl" transform="translate(-9 -72)"/>
      <use xlink:href="#def-finger-curl" transform="translate(9 -71)"/>
      <use xlink:href="#def-finger-curl" transform="translate(27 -66)"/>
    </g>
    <g id="def-hand-ext">
      <use xlink:href="#def-palm"/>
      <use xlink:href="#def-thumb" transform="translate(-33 -16) rotate(-34)"/>
      <use xlink:href="#def-finger-index-ext" transform="translate(-27 -72)"/>
      <use xlink:href="#def-finger-middle-ext" transform="translate(-9 -72)"/>
      <use xlink:href="#def-finger-ring-ext" transform="translate(9 -72)"/>
      <use xlink:href="#def-finger-pinky-ext" transform="translate(27 -72)"/>
    </g>
    <g id="def-hand-fist-base">
      <use xlink:href="#def-palm"/>
      <use xlink:href="#def-thumb" transform="translate(-33 -16) rotate(-40)"/>
      <use xlink:href="#def-finger-curl" transform="translate(-9 -72)"/>
      <use xlink:href="#def-finger-curl" transform="translate(9 -71)"/>
      <use xlink:href="#def-finger-curl" transform="translate(27 -66)"/>
    </g>
  </defs>

  <g id="sheet-background" class="sheet-only">
    <rect x="0" y="0" width="2400" height="800" fill="#e4e4e6"/>
    <g stroke="#c4c4c9" stroke-width="1.5">
      <line x1="800" y1="0" x2="800" y2="800"/>
      <line x1="1600" y1="0" x2="1600" y2="800"/>
      <line x1="0" y1="400" x2="2400" y2="400"/>
    </g>
  </g>

  <!-- ===================== 1. IDLE ===================== -->
  <g class="hand-cell" transform="translate(0 0)" clip-path="url(#cell-clip)">
    <g id="hands-idle" class="hand-position">
      <g id="idle-left-forearm" class="left-forearm" transform="translate(290 300) rotate(4) scale(-1 1)"><use xlink:href="#def-forearm"/></g>
      <g id="idle-left-hand" class="left-hand" transform="translate(290 300) rotate(4) scale(-1 1)"><use xlink:href="#def-hand-curled"/></g>
      <g id="idle-right-forearm" class="right-forearm" transform="translate(510 300) rotate(-4)"><use xlink:href="#def-forearm"/></g>
      <g id="idle-right-hand" class="right-hand" transform="translate(510 300) rotate(-4)">
        <use xlink:href="#def-hand-curled"/>
        <g id="idle-right-finger-index" class="right-finger-index"></g>
      </g>
    </g>
  </g>

  <!-- ===================== 2. HOVER ===================== -->
  <g class="hand-cell" transform="translate(800 0)" clip-path="url(#cell-clip)">
    <g id="hands-hover" class="hand-position">
      <g id="hover-shadow" class="hand-shadow" fill="#2e2a26" opacity="0.22" filter="url(#blur-shadow)">
        <ellipse cx="300" cy="250" rx="46" ry="70"/>
        <ellipse cx="510" cy="250" rx="46" ry="70"/>
      </g>
      <g id="hover-left-forearm" class="left-forearm" transform="translate(284 276) rotate(5) scale(-1 1)"><use xlink:href="#def-forearm"/></g>
      <g id="hover-left-hand" class="left-hand" transform="translate(284 276) rotate(5) scale(-1 1)"><use xlink:href="#def-hand-ext"/></g>
      <g id="hover-right-forearm" class="right-forearm" transform="translate(516 276) rotate(-5)"><use xlink:href="#def-forearm"/></g>
      <g id="hover-right-hand" class="right-hand" transform="translate(516 276) rotate(-5)">
        <use xlink:href="#def-hand-ext"/>
        <g id="hover-right-finger-index" class="right-finger-index"></g>
      </g>
    </g>
  </g>

  <!-- ===================== 3. REACH ===================== -->
  <g class="hand-cell" transform="translate(1600 0)" clip-path="url(#cell-clip)">
    <g id="hands-reach" class="hand-position">
      <g id="reach-left-forearm" class="left-forearm" transform="translate(290 300) rotate(4) scale(-1 1)"><use xlink:href="#def-forearm"/></g>
      <g id="reach-left-hand" class="left-hand" transform="translate(290 300) rotate(4) scale(-1 1)"><use xlink:href="#def-hand-curled"/></g>
      <g id="reach-right-forearm" class="right-forearm" transform="translate(540 240) rotate(-9)"><use xlink:href="#def-forearm"/></g>
      <g id="reach-right-hand" class="right-hand" transform="translate(540 240) rotate(-9)">
        <use xlink:href="#def-hand-fist-base"/>
        <g id="reach-right-finger-index" class="right-finger-index" transform="translate(-27 -72)"><use xlink:href="#def-index-point"/></g>
      </g>
    </g>
  </g>

  <!-- ===================== 4. PRESS ===================== -->
  <g class="hand-cell" transform="translate(0 400)" clip-path="url(#cell-clip)">
    <g id="hands-press" class="hand-position">
      <g id="press-left-forearm" class="left-forearm" transform="translate(290 300) rotate(4) scale(-1 1)"><use xlink:href="#def-forearm"/></g>
      <g id="press-left-hand" class="left-hand" transform="translate(290 300) rotate(4) scale(-1 1)"><use xlink:href="#def-hand-curled"/></g>
      <g id="press-right-forearm" class="right-forearm" transform="translate(540 252) rotate(-9)"><use xlink:href="#def-forearm"/></g>
      <g id="press-right-hand" class="right-hand" transform="translate(540 252) rotate(-9)">
        <use xlink:href="#def-hand-fist-base"/>
        <g id="press-right-finger-index" class="right-finger-index">
          <g transform="translate(-27 -72)">
            <rect x="-8" y="-42" width="16" height="48" rx="8" fill="#c69c7b"/>
            <rect x="3" y="-36" width="5" height="40" rx="2.5" fill="#a67b5d"/>
            <ellipse cx="-1" cy="-4" rx="5" ry="4" fill="#dfb897" opacity="0.7"/>
            <g transform="translate(0 -40) rotate(6)">
              <rect x="-8" y="-22" width="16" height="28" rx="8" fill="#b88c6c"/>
              <rect x="3" y="-18" width="5" height="22" rx="2.5" fill="#a67b5d"/>
              <rect x="-5" y="-21" width="10" height="7" rx="2" fill="#ead3be"/>
            </g>
            <path d="M-7 -40 L7 -40" fill="none" stroke="#a67b5d" stroke-width="2" stroke-linecap="round"/>
          </g>
        </g>
      </g>
    </g>
  </g>

  <!-- ===================== 5. PULL CABLE ===================== -->
  <g class="hand-cell" transform="translate(800 400)" clip-path="url(#cell-clip)">
    <g id="hands-pull-cable" class="hand-position">
      <g id="pull-left-forearm" class="left-forearm" transform="translate(250 290) rotate(8) scale(-1 1)"><use xlink:href="#def-forearm"/></g>
      <g id="pull-left-hand" class="left-hand" transform="translate(250 290) rotate(8) scale(-1 1)"><use xlink:href="#def-hand-ext"/></g>
      <g id="pull-right-forearm" class="right-forearm" transform="translate(560 300) rotate(-14)"><use xlink:href="#def-forearm"/></g>
      <g id="pull-right-hand" class="right-hand" transform="translate(560 300) rotate(-14)">
        <use xlink:href="#def-palm"/>
        <use xlink:href="#def-thumb" transform="translate(-33 -16) rotate(-40)"/>
      </g>
      <g id="pull-cable-grip" class="cable-grip" transform="translate(560 300) rotate(-14)">
        <path d="M-80 -77 L60 -77 C110 -77 130 -40 128 20 C126 70 140 110 150 150" transform="translate(0 5)" fill="none" stroke="#2e2a26" stroke-width="9" stroke-linecap="round" opacity="0.25"/>
        <path d="M-80 -77 L60 -77 C110 -77 130 -40 128 20 C126 70 140 110 150 150" fill="none" stroke="#3a3d43" stroke-width="9" stroke-linecap="round"/>
        <path d="M-80 -77 L60 -77 C110 -77 130 -40 128 20 C126 70 140 110 150 150" transform="translate(-1.5 -2)" fill="none" stroke="#6a6e76" stroke-width="2" stroke-linecap="round" opacity="0.6"/>
        <rect x="-128" y="-82" width="10" height="3" rx="1.5" fill="#b9bdc4"/>
        <rect x="-128" y="-74" width="10" height="3" rx="1.5" fill="#b9bdc4"/>
        <rect x="-120" y="-88" width="42" height="22" rx="4" fill="#2c2e33" stroke="#16181b" stroke-width="1.5"/>
        <rect x="-116" y="-86" width="34" height="3" rx="1.5" fill="#ffffff" opacity="0.2"/>
        <rect x="-80" y="-84" width="12" height="14" rx="3" fill="#3a3d43"/>
      </g>
      <g id="pull-right-fingers-wrap" class="right-fingers-wrap" transform="translate(560 300) rotate(-14)">
        <use xlink:href="#def-finger-curl" transform="translate(-9 -72)"/>
        <use xlink:href="#def-finger-curl" transform="translate(9 -71)"/>
        <use xlink:href="#def-finger-curl" transform="translate(27 -66)"/>
        <g id="pull-right-finger-index" class="right-finger-index"><use xlink:href="#def-finger-curl" transform="translate(-27 -70)"/></g>
      </g>
    </g>
  </g>

  <!-- ===================== 6. PLUG IN ===================== -->
  <g class="hand-cell" transform="translate(1600 400)" clip-path="url(#cell-clip)">
    <g id="hands-plug-in" class="hand-position">
      <g id="plug-left-forearm" class="left-forearm" transform="translate(250 290) rotate(8) scale(-1 1)"><use xlink:href="#def-forearm"/></g>
      <g id="plug-left-hand" class="left-hand" transform="translate(250 290) rotate(8) scale(-1 1)"><use xlink:href="#def-hand-ext"/></g>
      <g id="plug-right-forearm" class="right-forearm" transform="translate(560 310) rotate(-24)"><use xlink:href="#def-forearm"/></g>
      <g id="plug-right-hand" class="right-hand" transform="translate(560 310) rotate(-24)">
        <use xlink:href="#def-palm"/>
        <use xlink:href="#def-finger-curl" transform="translate(-9 -72)"/>
        <use xlink:href="#def-finger-curl" transform="translate(9 -71)"/>
        <use xlink:href="#def-finger-curl" transform="translate(27 -66)"/>
      </g>
      <g id="plug-cable-grip" class="cable-grip" transform="translate(560 310) rotate(-24)">
        <path d="M-3 -76 C20 -60 50 -50 70 -20 C85 0 100 40 96 90 C94 130 110 150 118 170" transform="translate(0 5)" fill="none" stroke="#2e2a26" stroke-width="9" stroke-linecap="round" opacity="0.25"/>
        <path d="M-3 -76 C20 -60 50 -50 70 -20 C85 0 100 40 96 90 C94 130 110 150 118 170" fill="none" stroke="#3a3d43" stroke-width="9" stroke-linecap="round"/>
        <path d="M-3 -76 C20 -60 50 -50 70 -20 C85 0 100 40 96 90 C94 130 110 150 118 170" transform="translate(-1.5 -2)" fill="none" stroke="#6a6e76" stroke-width="2" stroke-linecap="round" opacity="0.6"/>
        <rect x="-11" y="-136" width="4" height="10" rx="1" fill="#b9bdc4"/>
        <rect x="-1" y="-136" width="4" height="10" rx="1" fill="#b9bdc4"/>
        <rect x="-14" y="-128" width="22" height="52" rx="4" fill="#2c2e33" stroke="#16181b" stroke-width="1.5"/>
        <rect x="-11" y="-126" width="4" height="46" rx="2" fill="#ffffff" opacity="0.2"/>
        <rect x="-10" y="-80" width="14" height="10" rx="3" fill="#3a3d43"/>
      </g>
      <g id="plug-right-pinch" class="right-pinch" transform="translate(560 310) rotate(-24)">
        <use xlink:href="#def-thumb" transform="translate(-33 -16) rotate(22)"/>
        <g id="plug-right-finger-index" class="right-finger-index" transform="translate(-27 -72)">
          <rect x="-8" y="-34" width="16" height="40" rx="8" fill="#c69c7b"/>
          <rect x="3" y="-28" width="5" height="32" rx="2.5" fill="#a67b5d"/>
          <ellipse cx="-1" cy="-4" rx="5" ry="4" fill="#dfb897" opacity="0.7"/>
          <g transform="translate(0 -32) rotate(110)">
            <rect x="-8" y="-26" width="16" height="30" rx="8" fill="#b88c6c"/>
            <rect x="3" y="-22" width="5" height="24" rx="2.5" fill="#a67b5d"/>
            <rect x="-5" y="-25" width="10" height="8" rx="2" fill="#ead3be"/>
          </g>
        </g>
      </g>
    </g>
  </g>

  <g id="sheet-labels" class="sheet-only" font-family="'Segoe UI', 'Helvetica Neue', Arial, sans-serif" font-size="20" font-weight="600" letter-spacing="4" fill="#5a5a62">
    <text x="24" y="36">HANDS-IDLE</text>
    <text x="824" y="36">HANDS-HOVER</text>
    <text x="1624" y="36">HANDS-REACH</text>
    <text x="24" y="436">HANDS-PRESS</text>
    <text x="824" y="436">HANDS-PULL-CABLE</text>
    <text x="1624" y="436">HANDS-PLUG-IN</text>
  </g>
</svg>
`;
