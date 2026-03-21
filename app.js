/* =====================================================
   SusCalc — app.js
   Window Manager + Calculator Logic
   ===================================================== */

/* =====================================================
   WINDOW MANAGER
   ===================================================== */
class WindowManager {
  constructor() {
    this.zBase = 100;
    this.zTop  = this.zBase;
    this.windows = [];

    document.querySelectorAll('.xp-window').forEach(el => this.register(el));
    this.buildTaskbar();
    this.buildStartMenu();
    this.bindStartButton();

    document.getElementById('desktop').addEventListener('mousedown', () => {
      document.getElementById('start-menu').classList.remove('open');
    });
  }

  register(el) {
    const id    = el.id;
    const title = el.dataset.title || 'Window';
    const icon  = el.dataset.icon  || '🪟';

    const bar = document.createElement('div');
    bar.className = 'title-bar';
    bar.innerHTML = `
      <span class="title-bar-icon">${icon}</span>
      <span class="title-bar-text">${title}</span>
      <div class="title-bar-buttons">
        <div class="tb-btn minimize" title="Minimize">_</div>
      </div>
    `;
    el.prepend(bar);

    const win = { id, el, title, icon, minimized: false, closed: false };
    this.windows.push(win);

    el.addEventListener('mousedown', (e) => {
      if (!e.target.classList.contains('tb-btn')) this.focus(win);
    });

    bar.addEventListener('mousedown', (e) => {
      if (e.target.classList.contains('tb-btn')) return;
      this.startDrag(e, el);
    });

    bar.querySelector('.tb-btn.minimize').addEventListener('click', () => this.minimize(win));

    if (el.dataset.startHidden === 'true') {
      this.close(win);
    } else if (this.windows.length === 1) {
      this.focus(win);
    }
    return win;
  }

  focus(win) {
    if (win.closed) return;
    if (win.minimized) {
      win.minimized = false;
      win.el.classList.remove('minimized');
      win.el.style.opacity = '1';
      win.el.style.transform = '';
      win.el.style.pointerEvents = '';
    }
    this.zTop++;
    win.el.style.zIndex = this.zTop;
    this.windows.forEach(w => { w.el.classList.remove('focused'); w.el.classList.add('unfocused'); });
    win.el.classList.add('focused');
    win.el.classList.remove('unfocused');
    this.refreshTaskbar();
  }

  minimize(win) {
    win.minimized = true;
    win.el.classList.add('minimized');
    win.el.style.opacity = '0';
    win.el.style.transform = 'scale(0.85) translateY(30px)';
    win.el.style.pointerEvents = 'none';
    win.el.style.transition = 'opacity 0.18s, transform 0.18s';
    this.refreshTaskbar();
    const visible = this.windows.filter(w => !w.minimized && !w.closed && w !== win);
    if (visible.length) this.focus(visible[visible.length - 1]);
  }

  close(win) {
    win.closed = true;
    win.el.style.transition = 'opacity 0.15s, transform 0.15s';
    win.el.style.opacity = '0';
    win.el.style.transform = 'scale(0.9)';
    win.el.style.pointerEvents = 'none';
    setTimeout(() => { win.el.style.display = 'none'; }, 160);
    this.refreshTaskbar();
  }

  open(win) {
    if (win.closed) {
      win.closed = false;
      win.el.style.display = '';
      win.el.style.opacity = '';
      win.el.style.transform = '';
      win.el.style.pointerEvents = '';
      win.el.style.transition = '';
    }
    this.focus(win);
    document.getElementById('start-menu').classList.remove('open');
  }

  toggle(win) {
    if (win.closed) { this.open(win); return; }
    if (win.minimized) { this.focus(win); return; }
    const isFocused = parseInt(win.el.style.zIndex) === this.zTop;
    isFocused ? this.minimize(win) : this.focus(win);
  }

  startDrag(e, el) {
    e.preventDefault();
    const rect    = el.getBoundingClientRect();
    const desktop = document.getElementById('desktop').getBoundingClientRect();
    const offX = e.clientX - rect.left;
    const offY = e.clientY - rect.top;
    const onMove = (e) => {
      let x = Math.max(-rect.width + 60, Math.min(e.clientX - offX - desktop.left, desktop.width - 60));
      let y = Math.max(0, Math.min(e.clientY - offY - desktop.top, desktop.height - 32));
      el.style.left = x + 'px';
      el.style.top  = y + 'px';
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }

  buildTaskbar() {
    const bar = document.getElementById('taskbar-windows');
    bar.innerHTML = '';
    this.windows.forEach(win => {
      const btn = document.createElement('button');
      btn.className = 'taskbar-win-btn';
      btn.dataset.winId = win.id;
      btn.title = win.title;
      btn.innerHTML = `${win.icon} <span>${win.title}</span>`;
      btn.addEventListener('click', (e) => { e.stopPropagation(); this.toggle(win); });
      win.taskbarBtn = btn;
      bar.appendChild(btn);
    });
    this.refreshTaskbar();
  }

  refreshTaskbar() {
    this.windows.forEach(win => {
      if (!win.taskbarBtn) return;
      win.taskbarBtn.classList.remove('active', 'minimized-btn');
      if (win.closed) { win.taskbarBtn.style.opacity = '0.45'; }
      else if (win.minimized) { win.taskbarBtn.classList.add('minimized-btn'); win.taskbarBtn.style.opacity = ''; }
      else {
        win.taskbarBtn.style.opacity = '';
        if (parseInt(win.el.style.zIndex) === this.zTop) win.taskbarBtn.classList.add('active');
      }
    });
  }

  buildStartMenu() {
    const list = document.getElementById('startMenuItems');
    list.innerHTML = '';
    this.windows.forEach(win => {
      const item = document.createElement('div');
      item.className = 'start-menu-item';
      item.innerHTML = `<span class="menu-icon">${win.icon}</span><span class="menu-label">${win.title}</span>`;
      item.addEventListener('click', () => this.open(win));
      list.appendChild(item);
    });
  }

  bindStartButton() {
    document.getElementById('startBtn').addEventListener('click', (e) => {
      e.stopPropagation();
      document.getElementById('start-menu').classList.toggle('open');
    });
  }
}

/* =====================================================
   CALCULATOR
   ===================================================== */

const AVERAGES = {
  showerMinutes:      8,
  redMeat:            5,
  carMiles:           230,
  flights:            6,
  fashion:            5,
  electricity:        120,
  water:              50,
  shopping:           200,
  aiSearches:         20
};

const FACTORS = {
  shower:      (v) => v * 365 * 0.10,
  meat:        (v) => v * 52  * 6.9,
  car:         (v) => v * 52  * 0.404,
  flight:      (v) => v * 190.0,
  fashion:     (v) => v * 12  * 8.0,
  electricity: (v) => v * 12  * 2.27,
  water:       (v) => v * 12  * 0.10,
  shopping:    (v) => v * 12  * 0.231,
  ai:          (v) => v * 365 * 0.00114
};

const RECOMMENDATIONS = {
  shower:      'Try cutting your shower by 2 min — saves ~36 kg CO2/yr.',
  meat:        'One meatless day/week saves ~156 kg CO2/yr.',
  car:         'Carpooling or public transit a few days/week makes a big difference.',
  flight:      'One fewer short-haul flight saves ~255 kg CO2. Consider train travel.',
  fashion:     'Buy second-hand or swap clothes instead of buying new.',
  electricity: 'Switch to LED bulbs, unplug idle devices, and consider a renewable energy plan.',
  water:       'Fix leaks, install low-flow fixtures, and shorten outdoor watering cycles.',
  shopping:    'Buy secondhand, repair instead of replace, and avoid impulse purchases.',
  ai:          'Batch your AI queries, use lighter models when possible, and prefer cached results.'
};

const CATEGORY_NAMES = {
  shower: 'Showers', meat: 'Red Meat',
  car: 'Car Travel', flight: 'Flights', fashion: 'Fast Fashion',
  electricity: 'Electricity', water: 'Water', shopping: 'Shopping', ai: 'AI Searches'
};

const FIELDS = [
  { key: 'shower',      sliderId: 'showerMinutes', numId: 'showerMinutesNum', unit: 'min/day',    avgKey: 'showerMinutes' },
  { key: 'meat',        sliderId: 'redMeat',        numId: 'redMeatNum',       unit: 'meals/wk',   avgKey: 'redMeat'       },
  { key: 'car',         sliderId: 'carMiles',       numId: 'carMilesNum',      unit: 'mi/wk',      avgKey: 'carMiles'      },
  { key: 'flight',      sliderId: 'flights',        numId: 'flightsNum',       unit: 'flights/yr', avgKey: 'flights'       },
  { key: 'fashion',     sliderId: 'fashion',        numId: 'fashionNum',       unit: 'items/mo',   avgKey: 'fashion'       },
  { key: 'electricity', sliderId: 'electricity',    numId: 'electricityNum',   unit: '$/mo',       avgKey: 'electricity'   },
  { key: 'water',       sliderId: 'water',          numId: 'waterNum',         unit: '$/mo',       avgKey: 'water'         },
  { key: 'shopping',    sliderId: 'shopping',       numId: 'shoppingNum',      unit: '$/mo',       avgKey: 'shopping'      },
  { key: 'ai',          sliderId: 'aiSearches',     numId: 'aiSearchesNum',    unit: 'searches/day', avgKey: 'aiSearches'  }
];

let currentMode = 'slider';

function getFieldValue(field) {
  const id = currentMode === 'slider' ? field.sliderId : field.numId;
  return parseFloat(document.getElementById(id).value) || 0;
}

function setFieldValue(field, value) {
  const slider = document.getElementById(field.sliderId);
  const num    = document.getElementById(field.numId);
  const clamped = Math.min(Math.max(value, parseFloat(slider.min)), parseFloat(slider.max));
  slider.value = clamped;
  num.value    = value;
  updateSliderLabel(slider, field.unit);
  updatePillSelection(field.sliderId, value);
}

function updateSliderLabel(slider, unit) {
  const wrap = slider.closest('.slider-wrap');
  if (wrap) wrap.querySelector('.slider-val').textContent = `${slider.value} ${unit}`;
}

function updatePillSelection(fieldId, value) {
  document.querySelectorAll(`.preset-pills[data-field="${fieldId}"] .pill`).forEach(p => {
    p.classList.toggle('selected', parseFloat(p.dataset.value) === parseFloat(value));
  });
}

function setInputMode(mode) {
  currentMode = mode;
  document.querySelectorAll('.toggle-opt').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.mode === mode);
  });
  document.querySelectorAll('.slider-wrap').forEach(el => {
    el.style.display = mode === 'slider' ? '' : 'none';
  });
  document.querySelectorAll('.precise-wrap').forEach(el => {
    el.style.display = mode === 'number' ? '' : 'none';
  });
}

function initCalcControls() {
  FIELDS.forEach(field => {
    const slider = document.getElementById(field.sliderId);
    if (!slider) return;

    updateSliderLabel(slider, field.unit);
    updatePillSelection(field.sliderId, slider.value);

    slider.addEventListener('input', () => {
      updateSliderLabel(slider, field.unit);
      document.getElementById(field.numId).value = slider.value;
      updatePillSelection(field.sliderId, slider.value);
    });

    const num = document.getElementById(field.numId);
    if (num) {
      num.addEventListener('input', () => {
        const v = parseFloat(num.value) || 0;
        const clamped = Math.min(Math.max(v, parseFloat(slider.min)), parseFloat(slider.max));
        slider.value = clamped;
        updateSliderLabel(slider, field.unit);
        updatePillSelection(field.sliderId, v);
      });
    }
  });

  document.querySelectorAll('.pill').forEach(pill => {
    pill.addEventListener('click', () => {
      const val     = parseFloat(pill.dataset.value);
      const fieldId = pill.closest('.preset-pills').dataset.field;
      const field   = FIELDS.find(f => f.sliderId === fieldId);
      if (field) setFieldValue(field, val);
    });
  });

  document.querySelectorAll('.toggle-opt').forEach(btn => {
    btn.addEventListener('click', () => setInputMode(btn.dataset.mode));
  });

  document.getElementById('btnReset').addEventListener('click', () => {
    FIELDS.forEach(f => setFieldValue(f, 0));
    clearResults();
  });

  document.getElementById('btnAverage').addEventListener('click', () => {
    FIELDS.forEach(f => setFieldValue(f, AVERAGES[f.avgKey]));
    clearResults();
  });

  const form = document.getElementById('susCalcForm');
  if (form) form.addEventListener('submit', (e) => { e.preventDefault(); calculate(); });

}

function clearResults() {
  document.getElementById('status').textContent = '';
  document.getElementById('results').style.display = 'none';
}

async function calculate() {
  const statusDiv  = document.getElementById('status');
  const resultsDiv = document.getElementById('results');
  statusDiv.textContent = '⏳ Calculating your carbon footprint...';
  resultsDiv.style.display = 'none';

  const payload = {
    showerMinutesPerDay:    getFieldValue(FIELDS.find(f => f.key === 'shower')),
    redMeatMealsPerWeek:    getFieldValue(FIELDS.find(f => f.key === 'meat')),
    carMilesPerWeek:        getFieldValue(FIELDS.find(f => f.key === 'car')),
    flightsPerYear:         getFieldValue(FIELDS.find(f => f.key === 'flight')),
    fashionItemsPerMonth:   getFieldValue(FIELDS.find(f => f.key === 'fashion')),
    monthlyElectricityBill: getFieldValue(FIELDS.find(f => f.key === 'electricity')),
    monthlyWaterBill:       getFieldValue(FIELDS.find(f => f.key === 'water')),
    monthlyShoppingSpend:   getFieldValue(FIELDS.find(f => f.key === 'shopping')),
    aiSearchesPerDay:       getFieldValue(FIELDS.find(f => f.key === 'ai'))
  };

  try {
    const response = await fetch('/calculate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      statusDiv.textContent = '❌ ' + (data.error || 'Something went wrong.');
      return;
    }

    document.getElementById('showerCO2').textContent       = data.showerCO2.toFixed(2);
    document.getElementById('meatCO2').textContent         = data.meatCO2.toFixed(2);
    document.getElementById('carCO2').textContent          = data.carCO2.toFixed(2);
    document.getElementById('flightCO2').textContent       = data.flightCO2.toFixed(2);
    document.getElementById('fashionCO2').textContent      = data.fashionCO2.toFixed(2);
    document.getElementById('electricityCO2').textContent  = data.electricityCO2.toFixed(2);
    document.getElementById('waterCO2').textContent        = data.waterCO2.toFixed(2);
    document.getElementById('shoppingCO2').textContent     = data.shoppingCO2.toFixed(2);
    document.getElementById('aiCO2').textContent           = data.aiCO2.toFixed(2);
    document.getElementById('totalCO2').textContent        = data.totalCO2.toFixed(2);
    document.getElementById('totalTons').textContent       = (data.totalCO2 / 1000).toFixed(3);
    document.getElementById('biggestCategory').textContent = data.biggestCategory;
    document.getElementById('recommendation').textContent  = data.recommendation;

    statusDiv.textContent = '✅ Calculation complete!';
    resultsDiv.style.display = 'block';

    // Build the histogram from the returned data
    updateHistogram(data);

  } catch (err) {
    statusDiv.textContent = err;
  }
}


/* =====================================================
   ECO HISTOGRAM
   ===================================================== */

/* Minor-change alternatives used for the green bars */
const ALT_DELTAS = {
  shower:      { label: 'Shower',      icon: '🚿', altDesc: '−2 min/day',       factor: (v) => Math.max(0, v - 2) * 365 * 0.10 },
  meat:        { label: 'Red Meat',    icon: '🥩', altDesc: '−1 meal/week',      factor: (v) => Math.max(0, v - 1) * 52 * 6.9   },
  car:         { label: 'Car',         icon: '🚗', altDesc: '−20% miles',        factor: (v) => v * 0.8 * 52 * 0.404            },
  flight:      { label: 'Flights',     icon: '✈️', altDesc: '−1 flight/yr',      factor: (v) => Math.max(0, v - 1) * 190.0      },
  fashion:     { label: 'Fashion',     icon: '👕', altDesc: '−2 items/month',    factor: (v) => Math.max(0, v - 2) * 12 * 8.0   },
  electricity: { label: 'Electricity', icon: '⚡', altDesc: '−10% bill',         factor: (v) => v * 0.9 * 12 * 2.27             },
  water:       { label: 'Water',       icon: '💧', altDesc: '−10% bill',         factor: (v) => v * 0.9 * 12 * 0.10            },
  shopping:    { label: 'Shopping',    icon: '🛍️', altDesc: '−20% spend',        factor: (v) => v * 0.8 * 12 * 0.231            },
  ai:          { label: 'AI',          icon: '🤖', altDesc: '−25% searches',     factor: (v) => v * 0.75 * 365 * 0.00114        }
};

/* Map backend response keys → field keys */
const DATA_KEYS = {
  shower: 'showerCO2', meat: 'meatCO2', car: 'carCO2', flight: 'flightCO2', fashion: 'fashionCO2'
};

function updateHistogram(data) {
  const histoEl = document.getElementById('histogram');
  histoEl.style.display = 'block';

  // Read current input values
  const inputs = {
    shower:      getFieldValue(FIELDS.find(f => f.key === 'shower')),
    meat:        getFieldValue(FIELDS.find(f => f.key === 'meat')),
    car:         getFieldValue(FIELDS.find(f => f.key === 'car')),
    flight:      getFieldValue(FIELDS.find(f => f.key === 'flight')),
    fashion:     getFieldValue(FIELDS.find(f => f.key === 'fashion')),
    electricity: getFieldValue(FIELDS.find(f => f.key === 'electricity')),
    water:       getFieldValue(FIELDS.find(f => f.key === 'water')),
    shopping:    getFieldValue(FIELDS.find(f => f.key === 'shopping')),
    ai:          getFieldValue(FIELDS.find(f => f.key === 'ai'))
  };

  // Current CO2 from backend response
  const current = {
    shower:      data.showerCO2,
    meat:        data.meatCO2,
    car:         data.carCO2,
    flight:      data.flightCO2,
    fashion:     data.fashionCO2,
    electricity: data.electricityCO2,
    water:       data.waterCO2,
    shopping:    data.shoppingCO2,
    ai:          data.aiCO2
  };

  // Alt CO2 calculated locally from input values
  const alt = {};
  Object.keys(ALT_DELTAS).forEach(k => {
    alt[k] = ALT_DELTAS[k].factor(inputs[k]);
  });

  const totalCurrent = Object.values(current).reduce((a, b) => a + b, 0);
  const totalAlt     = Object.values(alt).reduce((a, b) => a + b, 0);
  const saving       = totalCurrent - totalAlt;

  // Update saving badge
  document.getElementById('histoSaving').textContent =
    saving > 0 ? `💚 Save ~${fmtKg(saving)} with small changes` : '';

  // Build the new vertical bar chart
  const maxCat = Math.max(...Object.values(current), 1);
  buildBarChart(current, alt, inputs, maxCat);

  // Init toggle
  initHistoToggle();
}

function fmtKg(v) {
  return v >= 1000
    ? (v / 1000).toFixed(2) + ' t'
    : Math.round(v) + ' kg';
}

function buildBarChart(current, alt, inputs, maxCat) {
  const grid = document.getElementById('histoGrid');

  // ── Remove any previously injected legend / tooltip siblings ──────────
  const oldTooltip = document.getElementById('barTooltipPanel');
  if (oldTooltip) oldTooltip.remove();
  grid.innerHTML = '';

  // ── Inject chart styles once ──────────────────────────────────────────
  if (!document.getElementById('barChartStyles')) {
    const style = document.createElement('style');
    style.id = 'barChartStyles';
    style.textContent = `
      .histo-detail-grid {
        display: flex !important;
        flex-direction: row !important;
        align-items: flex-end !important;
        justify-content: space-around !important;
        gap: 8px !important;
        height: 180px !important;
        padding: 24px 4px 0 !important;
        position: relative !important;
        box-sizing: border-box !important;
      }
      .bar-col {
        display: flex;
        flex-direction: column;
        align-items: center;
        flex: 1;
        min-width: 0;
        height: 100%;
        position: relative;
        cursor: pointer;
      }
      .bar-area {
        flex: 1;
        width: 100%;
        display: flex;
        align-items: flex-end;
        justify-content: center;
        position: relative;
        height: 100%;
      }
      /* Stack wrapper: both bars sit in here, bottom-aligned */
      .bar-stack {
        position: relative;
        width: 70%;
        display: flex;
        align-items: flex-end;
        height: 100%;
      }
      /* Full-height dark green bar (current CO₂) */
      .bar-current {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        border-radius: 5px 5px 0 0;
        background: linear-gradient(180deg, #22c55e 0%, #16a34a 100%);
        box-shadow: 0 0 10px rgba(34,197,94,0.3);
        transition: height 0.6s cubic-bezier(.22,1,.36,1);
        height: 0;
      }
      /* Light green overlay on top — shows the saving slice */
      .bar-saving {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        border-radius: 5px 5px 0 0;
        background: linear-gradient(180deg, #dcfce7 0%, #86efac 100%);
        box-shadow: 0 0 8px rgba(134,239,172,0.5);
        transition: height 0.6s cubic-bezier(.22,1,.36,1) 0.08s;
        height: 0;
        opacity: 0.88;
      }
      /* kg label sitting above the full bar */
      .bar-kg-label {
        position: absolute;
        bottom: calc(100% + 4px);
        left: 50%;
        transform: translateX(-50%);
        font-size: 9.5px;
        font-weight: 700;
        color: #1a1a1a;
        white-space: nowrap;
        pointer-events: none;
        text-shadow: 0 1px 3px rgba(0,0,0,0);
      }
      .bar-footer {
        padding-top: 5px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1px;
        flex-shrink: 0;
      }
      .bar-icon  { font-size: 15px; line-height: 1.2; }
      .bar-label {
        font-size: 8.5px;
        font-weight: 600;
        color: rgba(0,0,0,1);
        text-transform: uppercase;
        letter-spacing: 0.05em;
        text-align: center;
      }
      .bar-legend {
        display: flex;
        gap: 14px;
        justify-content: center;
        margin-bottom: 4px;
        font-size: 11px;
        color: rgba(255,255,255,0.6);
      }
      .bar-legend-chip { display: flex; align-items: center; gap: 5px; }
      .bar-legend-swatch {
        width: 11px; height: 11px; border-radius: 2px;
      }
      .bar-legend-swatch.current { background: #22c55e; }
      .bar-legend-swatch.saving  { background: #86efac; }
      .bar-tooltip {
        display: none;
        background: rgba(10,30,10,0.93);
        border: 1px solid rgba(74,222,128,0.35);
        border-radius: 8px;
        padding: 10px 14px;
        margin-top: 8px;
        font-size: 12px;
        color: #d1fae5;
        line-height: 1.65;
      }
      .bar-tooltip.open { display: block; }
      .bar-tooltip-title { font-weight: 700; color: #4ade80; font-size: 13px; margin-bottom: 4px; }
      .bar-tooltip-row   { display: flex; justify-content: space-between; gap: 16px; }
      .bar-tooltip-saving { margin-top: 6px; color: #bbf7d0; font-weight: 600; }
      .bar-col:hover .bar-current { filter: brightness(1.1); }
    `;
    document.head.appendChild(style);
  }

  // ── Shared tooltip below chart ────────────────────────────────────────
  const tooltipEl = document.createElement('div');
  tooltipEl.id = 'barTooltipPanel';
  tooltipEl.className = 'bar-tooltip';
  grid.parentNode.appendChild(tooltipEl);

  let activeCol = null;
  const CHART_H = 180 - 24; // total height minus top padding = usable px

  // ── Build one column per category ─────────────────────────────────────
  Object.keys(ALT_DELTAS).forEach(key => {
    const meta   = ALT_DELTAS[key];
    const youVal = current[key];
    const altVal = alt[key];
    const saved  = Math.max(0, youVal - altVal);

    // px heights based on usable area
    const pxCurrent = Math.round((youVal / maxCat) * CHART_H * 0.95);
    const pxSaving  = youVal > 0 ? Math.round((saved / youVal) * pxCurrent) : 0;

    const col = document.createElement('div');
    col.className = 'bar-col';
    col.innerHTML = `
      <div class="bar-area">
        <div class="bar-stack">
          <div class="bar-current" data-px="${pxCurrent}">
            <span class="bar-kg-label">${fmtKg(youVal)}</span>
          </div>
          <div class="bar-saving"  data-px="${pxSaving}"></div>
        </div>
      </div>
      <div class="bar-footer">
        <span class="bar-icon">${meta.icon}</span>
        <span class="bar-label">${meta.label}</span>
      </div>
    `;

    col.addEventListener('click', () => {
      if (activeCol === col) {
        tooltipEl.classList.remove('open');
        activeCol = null;
        return;
      }
      activeCol = col;
      tooltipEl.className = 'bar-tooltip open';
      tooltipEl.innerHTML = `
        <div class="bar-tooltip-title">${meta.icon} ${meta.label}</div>
        <div class="bar-tooltip-row"><span>Your current</span><strong>${fmtKg(youVal)} CO₂/yr</strong></div>
        <div class="bar-tooltip-row"><span>With ${meta.altDesc}</span><strong>${fmtKg(altVal)} CO₂/yr</strong></div>
        ${saved > 0
          ? `<div class="bar-tooltip-saving">💚 Save ~${fmtKg(saved)} CO₂/yr with this one change</div>`
          : `<div class="bar-tooltip-saving" style="color:#86efac">✅ Already at minimum!</div>`}
      `;
    });

    grid.appendChild(col);
  });

  // ── Animate in after paint ─────────────────────────────────────────────
  requestAnimationFrame(() => requestAnimationFrame(() => {
    grid.querySelectorAll('.bar-current').forEach(el => {
      el.style.height = el.dataset.px + 'px';
    });
    grid.querySelectorAll('.bar-saving').forEach(el => {
      el.style.height = el.dataset.px + 'px';
    });
  }));
}

function initHistoToggle() {
  const toggle  = document.getElementById('histoToggle');
  const detail  = document.getElementById('histoDetail');

  // Remove old listener by cloning
  const fresh = toggle.cloneNode(true);
  toggle.parentNode.replaceChild(fresh, toggle);

  document.getElementById('histoToggle').addEventListener('click', () => {
    const open = detail.style.display === 'block';
    detail.style.display = open ? 'none' : 'block';
    document.getElementById('histoChevron').classList.toggle('open', !open);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  window.wm = new WindowManager();
  initCalcControls();
  initFieldTips();
});




/* =====================================================
   FALLING ITEMS + DUAL BIN SYSTEM
   ===================================================== */

const TRASH_ITEMS = [
  { emoji:'📄', label:'Paper',          type:'recycle' },
  { emoji:'📦', label:'Cardboard',      type:'recycle' },
  { emoji:'📬', label:'Mail',           type:'recycle' },
  { emoji:'🥫', label:'Tin Can',        type:'recycle' },
  { emoji:'🍶', label:'Glass Jar',      type:'recycle' },
  { emoji:'🧴', label:'Plastic Bottle', type:'recycle' },
  { emoji:'🥛', label:'Milk Carton',    type:'recycle' },
  { emoji:'🧃', label:'Juice Carton',   type:'recycle' },
  { emoji:'🍺', label:'Beer Can',       type:'recycle' },
  { emoji:'📰', label:'Newspaper',      type:'recycle' },
  { emoji:'🫙', label:'Mason Jar',      type:'recycle' },
  { emoji:'🍕', label:'Pizza Box',      type:'trash'   },
  { emoji:'🧻', label:'Used Napkin',    type:'trash'   },
  { emoji:'🛍️', label:'Plastic Bag',    type:'trash'   },
  { emoji:'🍔', label:'Food Wrapper',   type:'trash'   },
  { emoji:'☕', label:'Wax Cup',        type:'trash'   },
  { emoji:'🍟', label:'Greasy Fry Box', type:'trash'   },
  { emoji:'🧊', label:'Styrofoam',      type:'trash'   },
  { emoji:'🍬', label:'Candy Wrapper',  type:'trash'   },
  { emoji:'🪥', label:'Toothpaste Tube',type:'trash'   },
  { emoji:'🍿', label:'Popcorn Bag',    type:'trash'   },
];

let recycleCount = 0;
let trashCount   = 0;
let missedCount  = 0;
const MAX_ITEMS  = 8;
const activeItems = [];

function spawnFallingItem() {
  const zone = document.getElementById('falling-zone');
  if (!zone || activeItems.length >= MAX_ITEMS) return;

  const def  = TRASH_ITEMS[Math.floor(Math.random() * TRASH_ITEMS.length)];
  const size = 28 + Math.random() * 14;            // 28-42px
  const dur  = 7 + Math.random() * 6;              // 7-13s fall
  const wobble = (Math.random() - 0.5) * 40;       // horizontal drift px

  const el = document.createElement('div');
  el.className = 'fall-item';
  el.dataset.type = def.type;
  el.style.cssText = [
    `right: ${10 + Math.random() * 140}px`,        // cluster top-right
    `top: -60px`,
    `font-size: ${size}px`,
    `--dur: ${dur}s`,
    `--wobble: ${wobble}px`,
    `animation-delay: 0s`,
  ].join(';');
  el.innerHTML =
    `<span class="fi-emoji">${def.emoji}</span>` +
    `<span class="fi-label">${def.label}</span>`;
  el.title = def.label;

  makeDraggable(el, def);
  zone.appendChild(el);
  activeItems.push(el);

  el.addEventListener('animationend', () => {
    if (el.parentNode && !el.dataset.caught) {
      missedCount++;
      updateCounter();
    }
    el.remove();
    const i = activeItems.indexOf(el);
    if (i > -1) activeItems.splice(i, 1);
  }, { once: true });
}

function makeDraggable(el, def) {
  let ox, oy, startL, startT, dragging = false;

  el.addEventListener('mousedown', (e) => {
    e.stopPropagation();
    dragging = true;
    ox = e.clientX; oy = e.clientY;

    // Snapshot rendered position
    const r = el.getBoundingClientRect();
    const deskR = document.getElementById('desktop').getBoundingClientRect();
    startL = r.left - deskR.left;
    startT = r.top  - deskR.top;

    // Freeze animation, switch to free positioning
    el.style.animation = 'none';
    el.style.position  = 'absolute';
    el.style.right     = 'auto';
    el.style.left      = startL + 'px';
    el.style.top       = startT + 'px';
    el.style.zIndex    = 9000;
    el.classList.add('fi-dragging');

    const bins = document.querySelectorAll('.desktop-bin');

    const onMove = (mv) => {
      el.style.left = (startL + mv.clientX - ox) + 'px';
      el.style.top  = (startT + mv.clientY - oy) + 'px';
      bins.forEach(bin => {
        const br = bin.getBoundingClientRect();
        const over = mv.clientX >= br.left && mv.clientX <= br.right &&
                     mv.clientY >= br.top  && mv.clientY <= br.bottom;
        bin.classList.toggle('bin-hover-correct', over && bin.dataset.type === def.type);
        bin.classList.toggle('bin-hover-wrong',   over && bin.dataset.type !== def.type);
      });
    };

    const onUp = (up) => {
      dragging = false;
      el.classList.remove('fi-dragging');
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      bins.forEach(b => b.classList.remove('bin-hover-correct','bin-hover-wrong'));

      let dropped = false;
      bins.forEach(bin => {
        const br = bin.getBoundingClientRect();
        if (up.clientX >= br.left && up.clientX <= br.right &&
            up.clientY >= br.top  && up.clientY <= br.bottom) {
          dropped = true;
          const correct = bin.dataset.type === def.type;
          flyToBin(el, bin, def, correct);
        }
      });

      if (!dropped) {
        // Resume falling from current position
        el.style.animation = '';
        el.style.right     = 'auto';
        const curTop = parseInt(el.style.top);
        const desktop = document.getElementById('desktop');
        const remaining = (desktop.offsetHeight - curTop) / desktop.offsetHeight;
        el.style.setProperty('--dur', (remaining * 8) + 's');
        el.style.animation = 'fallDown var(--dur) linear forwards';
      }
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  });
}

function flyToBin(el, bin, def, correct) {
  el.dataset.caught = '1';
  const br   = bin.getBoundingClientRect();
  const deskR = document.getElementById('desktop').getBoundingClientRect();
  el.style.transition = 'left .22s ease-in, top .22s ease-in, transform .22s, opacity .22s';
  el.style.left    = (br.left + br.width/2  - deskR.left - 20) + 'px';
  el.style.top     = (br.top  + br.height/2 - deskR.top  - 20) + 'px';
  el.style.transform = 'rotate(540deg) scale(0)';
  el.style.opacity   = '0';

  bin.classList.add(correct ? 'bin-shake' : 'bin-shake-wrong');
  setTimeout(() => bin.classList.remove('bin-shake','bin-shake-wrong'), 450);
  showFeedback(bin, correct);

  setTimeout(() => {
    el.remove();
    const i = activeItems.indexOf(el);
    if (i > -1) activeItems.splice(i, 1);
    if (correct) {
      if (def.type === 'recycle') { recycleCount++; updateBinCount('recycle-count', recycleCount); }
      else                        { trashCount++;   updateBinCount('trash-count',   trashCount);   }
    } else {
      missedCount++;
      updateCounter();
    }
  }, 240);
}

function showFeedback(bin, correct) {
  const fb = document.createElement('div');
  fb.className = 'bin-feedback ' + (correct ? 'fb-correct' : 'fb-wrong');
  fb.textContent = correct ? '✓ Correct!' : '✗ Wrong bin!';
  bin.appendChild(fb);
  setTimeout(() => fb.remove(), 1100);
}

function updateBinCount(id, n) {
  const el = document.getElementById(id);
  if (el) el.textContent = n > 0 ? `${n} item${n !== 1 ? 's' : ''}` : '';
}

function updateCounter() {
  const num   = document.getElementById('trash-counter-num');
  const label = document.getElementById('trash-counter-label');
  const icon  = document.getElementById('trash-counter-icon');
  if (num)   num.textContent   = missedCount;
  if (label) label.textContent = missedCount < 5 ? ' missed' : missedCount < 15 ? ' missed — tidy up!' : ' missed — help!';
  if (icon)  icon.textContent  = missedCount > 10 ? '🗑️' : '♻️';
  const c = document.getElementById('trash-counter');
  if (c) {
    c.classList.toggle('counter-warning', missedCount >= 5);
    c.classList.toggle('counter-danger',  missedCount >= 15);
  }
}

function initBins() {
  setTimeout(function tick() {
    spawnFallingItem();
    setTimeout(tick, 4000 + Math.random() * 3000);
  }, 3500);

  document.getElementById('recycle-bin').addEventListener('dblclick', () => {
    recycleCount = 0; updateBinCount('recycle-count', 0);
  });
  document.getElementById('trash-bin').addEventListener('dblclick', () => {
    trashCount = 0; updateBinCount('trash-count', 0);
  });
}


/* =====================================================
   FIELD HELP TOOLTIP (JS-driven, no blur)
   ===================================================== */
const TIP_TEXT = {
  shower:      'Count total minutes per shower each day.\nAverage: ~8 min/day.\nHot water heating is the main CO₂ source.\nA 2-min cut saves ~36 kg CO₂/yr.',
  meat:        'Count meals containing beef, lamb, or pork.\nBeef emits ~27 kg CO₂ per kg of meat.\nChicken & fish are NOT counted here.\nOne meatless day/wk saves ~156 kg CO₂/yr.',
  car:         'Total miles driven in any personal vehicle.\nPetrol cars emit ~0.21 kg CO₂ per mile.\nInclude commute, errands & weekend trips.\nUS average: ~230 miles/week.',
  flight:      'Count each one-way leg as 1 flight.\nA return trip = 2 flights.\nAvg ~255 kg CO₂ per short-haul flight.\nLong-haul flights emit significantly more.',
  fashion:     'New clothing from fast-fashion brands\n(Zara, H&M, Shein, Primark, etc).\nEach item ≈ 7 kg CO₂ to produce & ship.\nSecond-hand & clothes swaps = 0 emissions.',
  electricity: 'Enter your average monthly electricity bill.\nUS average: ~$120/month.\nThe CO₂ depends on your grid\'s energy mix.\nSwitching to renewables cuts this to near zero.',
  water:       'Enter your average monthly water bill.\nUS average: ~$50/month.\nWater treatment & heating adds CO₂.\nFix leaks & use low-flow fixtures to save.',
  shopping:    'Total monthly spend on goods & services.\nIncludes online orders, household items, etc.\nEvery $1 spent ≈ 0.0007 kg CO₂ embedded.\nBuying secondhand cuts this impact significantly.',
  ai:          'Count all AI queries per day (ChatGPT, Claude, etc).\nEach AI query uses ~0.003 kg CO₂.\nBatching questions into one prompt saves energy.\nSimpler searches use far less compute.'
};

function initFieldTips() {
  const box = document.getElementById('field-tip-box');
  if (!box) return;

  document.querySelectorAll('.field-help[data-tip-key]').forEach(btn => {
    const key = btn.dataset.tipKey;

    btn.addEventListener('mouseenter', () => {
      const text = TIP_TEXT[key];
      if (!text) return;
      box.textContent = text;
      box.style.display = 'block';
      positionTip(btn, box);
    });

    btn.addEventListener('mouseleave', () => {
      box.style.display = 'none';
    });

    // Also hide if button scrolls away
    btn.addEventListener('mousemove', () => positionTip(btn, box));
  });
}

function positionTip(btn, box) {
  const r   = btn.getBoundingClientRect();
  const bw  = box.offsetWidth  || 240;
  const bh  = box.offsetHeight || 80;
  const pad = 8;

  let left = r.right + pad;
  let top  = r.top;

  // Flip left if not enough room on right
  if (left + bw > window.innerWidth - pad) left = r.left - bw - pad;
  // Keep inside bottom
  if (top + bh > window.innerHeight - pad) top = window.innerHeight - bh - pad;
  if (top < pad) top = pad;

  box.style.left = left + 'px';
  box.style.top  = top  + 'px';
}

document.addEventListener('DOMContentLoaded', () => { initBins(); });
