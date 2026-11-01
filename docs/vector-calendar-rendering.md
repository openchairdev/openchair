# OpenChair Vector Calendar: Crisp Rendering Rules

## 1. Purpose

The OpenChair calendar is a continuously zoomable monthly appointment calendar.

Customers must be able to:

- See the entire month at the initial scale
- Compare days, staff, and availability
- Zoom continuously into appointment details
- Pan across an enlarged calendar
- Select an exact 15-minute appointment time
- Read all text clearly at every scale

The calendar must remain visually stable while zooming. Zoom changes the space available for calendar data, not the apparent size or weight of presentation elements.

---

## 2. Core rendering principle

Separate the calendar into two rendering layers:

```text
Fixed calendar viewport
├── SVG geometry layer
└── HTML label layer
```

### SVG geometry layer

The SVG layer renders:

- Month grid
- Day-cell geometry
- Staff-column boundaries
- Time-grid lines
- Available regions
- Unavailable regions
- Appointment selection regions
- Selected appointment outlines

### HTML label layer

The HTML overlay renders:

- Month title
- Weekday names
- Date numbers
- Staff names
- Time labels
- Booking instructions

This separation is mandatory.

SVG geometry may use non-uniform horizontal and vertical scaling. Text must never inherit that scaling.

---

## 3. Fixed viewport

The calendar is viewed through a fixed portrait viewport.

Recommended mobile aspect ratio:

```text
Width : Height = 3 : 4
```

Example:

```text
390 × 520
```

The viewport must not grow when the customer zooms.

```text
Zooming must not create:
- Browser horizontal scrollbars
- Browser vertical scrollbars
- A larger document layout
- Distant controls outside the visible viewport
```

Calendar movement happens inside the viewport through camera changes.

---

## 4. Zoom behavior

Zoom is continuous.

```ts
scale: number;
```

Valid intermediate values include:

```text
1.00
1.13
1.76
3.82
7.45
9.93
```

There are no separate month, week, or day views.

The customer always interacts with the same monthly calendar surface.

### Zoom may change

- Distance between day boundaries
- Distance between staff-column boundaries
- Vertical height of time slots
- Physical size of appointment hit targets
- Amount of detail shown
- Portion of the month visible through the camera

### Zoom must not change

- Font size
- Font proportions
- Divider thickness
- Header-row physical height
- Calendar viewport dimensions
- Color meaning

---

## 5. Non-uniform calendar scaling

Horizontal and vertical calendar density should not scale at the same rate.

The calendar contains:

```text
Horizontal:
Usually 1–5 staff members
Maximum approximately 10 staff members

Vertical:
Approximately 36–40 fifteen-minute time slots
Potentially more for longer business hours
```

Therefore:

```text
Horizontal scale:
Restrained

Vertical scale:
Stronger
```

Vertical expansion is more important because customers must accurately select an appointment time.

Text must remain outside this non-uniform scaling system.

---

## 6. Typography rules

All text is rendered in the HTML overlay using final screen-space sizes.

Recommended maximum font sizes:

```ts
const FONT_SIZE = {
  month: 16,
  weekday: 14,
  date: 14,
  staff: 12,
  time: 11,
} as const;
```

These are physical display sizes.

At every zoom amount:

```text
Month title remains 16px maximum
Weekday remains 14px maximum
Date remains 14px maximum
Staff name remains 12px maximum
Time label remains 11px maximum
```

Zoom changes label position and visibility, not glyph shape or size.

### Prohibited text rendering

Do not apply calendar camera transforms directly to text.

Avoid:

```text
Non-uniform SVG scaling of text
Inverse SVG text transforms
Scaled text snapshots
Horizontally stretched glyphs
Vertically stretched glyphs
```

### Label positioning

Convert logical scene coordinates into screen coordinates:

```ts
function sceneToScreen(
  scenePoint: Point,
  camera: Camera,
  viewport: Size,
): Point {
  return {
    x:
      ((scenePoint.x - camera.x) /
        camera.width) *
      viewport.width,

    y:
      ((scenePoint.y - camera.y) /
        camera.height) *
      viewport.height,
  };
}
```

Render labels as absolutely positioned HTML elements.

---

## 7. Header-row sizing

Header rows must stop growing once they can display their content comfortably.

Recommended maximum physical heights:

```ts
const ROW_HEIGHT = {
  month: 24,
  weekday: 22,
  date: 20,
  staff: 20,
} as const;
```

The general rule is:

```text
Maximum row height
=
Maximum font size
+
Top padding
+
Bottom padding
```

After reaching that height, additional zoom must not make the row taller.

Only the appointment grid should continue expanding.

---

## 8. Divider rendering

Divider thickness must remain physically constant at every camera scale.

Do not rely on ordinary SVG strokes for critical grid dividers under non-uniform scaling.

Render ordinary dividers as filled rectangles.

### Divider constant

```ts
const GRID_DIVIDER_SIZE_PIXELS = 1;
```

### Convert physical thickness to scene units

```ts
const verticalDividerWidth =
  GRID_DIVIDER_SIZE_PIXELS *
  sceneUnitsPerPixelX;

const horizontalDividerHeight =
  GRID_DIVIDER_SIZE_PIXELS *
  sceneUnitsPerPixelY;
```

### Vertical divider

```tsx
<rect
  x={
    dividerX -
    verticalDividerWidth / 2
  }
  y={dividerTop}
  width={verticalDividerWidth}
  height={dividerHeight}
  fill={COLORS.grid}
  pointerEvents="none"
/>
```

### Horizontal divider

```tsx
<rect
  x={dividerLeft}
  y={
    dividerY -
    horizontalDividerHeight / 2
  }
  width={dividerWidth}
  height={horizontalDividerHeight}
  fill={COLORS.grid}
  pointerEvents="none"
/>
```

This guarantees:

```text
1.00× → 1px
3.00× → 1px
9.93× → 1px
```

Only the space between dividers changes.

---

## 9. Avoid double-painted boundaries

Each shared boundary must be drawn once.

Do not give every adjacent cell its own complete border. Two neighboring cell borders can paint the same line twice and make it look heavier.

Use this structure:

```text
Cell rectangles:
Fill only

Dedicated grid layer:
Draw shared horizontal and vertical boundaries once
```

The same rule applies to:

- Month boundaries
- Weekday boundaries
- Week-row boundaries
- Day-column boundaries
- Staff-column boundaries
- Time-axis boundaries

---

## 10. Time-grid rules

Grid lines and time labels are independent.

### Grid lines

Render a horizontal grid line every 15 minutes:

```text
09:00
09:15
09:30
09:45
10:00
...
```

### Labels

Labels may be less frequent:

```text
Compressed:
09, 11, 13, 15, 17, 18

Readable:
09:00, 10:00, 11:00, ...

Detailed:
09:00, 09:30, 10:00, 10:30, ...
```

Labels for `:15` and `:45` are not required. Customers can infer those times from the quarter-hour grid.

### Line emphasis

Recommended hierarchy:

```text
Hour line:
Strongest

Half-hour line:
Medium

Quarter-hour line:
Lightest
```

All remain constant in physical thickness.

Visual emphasis should come from color or opacity, not changing stroke width during zoom.

---

## 11. Shared display timeline

Every day in the month must use the same visual time axis.

Example:

```text
Display range:
09:00–18:00
```

This range remains visible for:

- Open weekdays
- Shorter Saturdays
- Closed Sundays
- Business closure days
- Staff-unscheduled days

### Closed day

Render the complete timeline as unavailable gray, but retain the time labels.

### Short business day

Example:

```text
Saturday business hours:
09:00–17:00
```

Render:

```text
09:00–17:00:
According to staff schedule and bookings

17:00–18:00:
Unavailable gray
```

This keeps time-grid spacing mathematically consistent across days.

---

## 12. Timeline padding

Reserve physical space above the opening label and below the closing label.

```ts
const TIME_LABEL_FONT_SIZE_PIXELS = 11;

const TIME_EDGE_PADDING_PIXELS =
  TIME_LABEL_FONT_SIZE_PIXELS / 2 +
  3;
```

The timeline should be:

```text
Top padding
Opening label and line
Appointment grid
Closing label and line
Bottom padding
```

Do not move the first or last label independently. Independent label clamping distorts the apparent distance between the first or last hour and adjacent hours.

All lines must remain at their mathematically correct positions.

---

## 13. Proportional availability

Time intervals are rendered according to actual duration.

For a business day:

```text
09:00–18:00
Total: 540 minutes
```

Blocked segment:

```text
13:00–15:00
Duration: 120 minutes
```

Calculate:

```ts
const topRatio =
  (blockedStartMinute -
    displayStartMinute) /
  displayTotalMinutes;

const heightRatio =
  (blockedEndMinute -
    blockedStartMinute) /
  displayTotalMinutes;
```

Then:

```ts
const blockedTop =
  timelineTop +
  topRatio * timelineHeight;

const blockedHeight =
  heightRatio * timelineHeight;
```

A two-hour blocked interval must appear four times taller than a 30-minute appointment.

---

## 14. Availability colors

Use a simple binary customer-facing model:

```text
White:
Available

Gray:
Unavailable
```

Unavailable may internally mean:

- Existing appointment
- Staff time off
- Business closure
- Outside business hours
- Outside staff schedule
- Past date or time

Customers do not need private details about why another time is unavailable.

Do not expose:

- Customer identity
- Phone number
- Email
- Appointment notes
- Service details for another customer

---

## 15. Booking activation

Exact appointment tapping must not be enabled while targets are too small.

Recommended minimum booking target:

```ts
const BOOKING_TARGET_SIZE_PIXELS = 48;
```

A slot becomes selectable only when both dimensions satisfy:

```ts
const canSelectAppointment =
  quarterHourHeight >=
    BOOKING_TARGET_SIZE_PIXELS &&
  renderedStaffWidth >=
    BOOKING_TARGET_SIZE_PIXELS;
```

Before that point:

- Customers may zoom
- Customers may pan
- Availability stays visible
- Exact slot hit areas remain disabled

This prevents accidental selection of nearby times.

---

## 16. Booking-readiness feedback

Customers must know when exact time selection is available.

Do not rely only on an internal boolean.

### Before selection is enabled

Show:

```text
Pinch or use + to zoom in and choose an exact appointment time.
```

Use:

- Neutral gray grid
- Neutral time labels

### When selection becomes enabled

Show:

```text
Ready to book: tap a white 15-minute time slot.
```

Use:

- Pale green 15-minute grid
- Dark green time labels
- Text instruction as a non-color cue

Suggested colors:

```ts
const COLORS = {
  bookingReadyGrid: "#86efac",
  bookingReadyText: "#15803d",
  bookingReadyBackground: "#f0fdf4",
};
```

Only the appointment timeline should change color.

Keep these neutral:

- Month boundary
- Weekday boundary
- Day boundary
- Staff boundary

---

## 17. Grid-only zoom rule

The final zoom rule is:

```text
Zoom expands:
- Day-cell spacing
- Staff-column spacing
- Time-slot spacing
- Appointment hit targets

Zoom does not expand:
- Text
- Header rows
- Divider thickness
- Viewport
```

Adhering to this rule prevents nearly all visual distortion discovered during the prototype.

---

## 18. Camera behavior

The viewport is fixed. The vector calendar is viewed through a camera.

```ts
type Camera = {
  x: number;
  y: number;
  width: number;
  height: number;
};
```

Zoom modifies the camera’s visible logical area.

Pan modifies:

```ts
camera.x;
camera.y;
```

The camera must not alter the physical viewport.

### Initial camera measurement

Do not calculate physical geometry before the SVG viewport has a real size.

Use `ResizeObserver` and store:

```ts
viewportSize: Size | null;
```

Render a lightweight loading SVG until viewport measurement is available.

This prevents invalid initial geometry such as:

```text
1 × 1 fallback viewport
```

which previously produced a black initial calendar.

---

## 19. Camera focal point

Pinch zoom must preserve the logical point beneath the customer’s fingers.

Process:

1. Convert pinch midpoint from viewport coordinates to scene coordinates.
2. Calculate the new camera width and height.
3. Recalculate `camera.x` and `camera.y` so the focal scene point remains under the midpoint.
4. Clamp the camera to the scene.

This produces map-like zoom behavior.

---

## 20. Zoom limits

Maximum useful zoom is reached when:

```text
15-minute slot height = 48px
Staff-column width = at least 48px
```

Further enlargement provides no booking benefit.

Horizontal and vertical camera limits may be different because:

```text
Staff columns need modest enlargement.
Time slots need strong enlargement.
```

At maximum zoom:

- Exact 15-minute tapping is comfortable
- Text remains fixed
- Grid lines remain fixed
- The user pans through the enlarged schedule
- No cell needs to become larger than the viewport

---

## 21. Required rendering order

Use this visual order:

```text
1. Calendar background
2. Cell fills
3. Availability backgrounds
4. Unavailable overlays
5. Dedicated grid layer
6. Appointment hit targets
7. Selection highlight
8. HTML label overlay
```

The HTML label overlay must be visually above all SVG geometry.

It should use:

```css
pointer-events: none;
```

so it does not block calendar gestures or appointment selection.

---

## 22. Final architecture

```text
Calendar API data
↓
Normalized availability
↓
Logical vector calendar scene
↓
SVG geometry layer
├── Grid
├── Availability
├── Unavailability
└── Selection targets
↓
Fixed HTML label overlay
├── Month
├── Weekdays
├── Dates
├── Staff
└── Time
↓
Fixed portrait viewport
↓
Continuous camera zoom and pan
```

## Final invariant

A correct OpenChair calendar must satisfy:

```text
At every scale:

Text remains crisp.
Text dimensions remain stable.
Dividers remain the same thickness.
Header rows remain the same physical height.
Time intervals remain proportional.
Only grid spacing and appointment targets grow.
```
