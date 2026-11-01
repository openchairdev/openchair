"use client";

import {
  PointerEvent as ReactPointerEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { CalendarData } from "../types/calendar";

type Props = {
  calendar: CalendarData;
};

type Point = {
  x: number;
  y: number;
};

type Size = {
  width: number;
  height: number;
};

type Camera = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type MonthCell = {
  day: number | null;
  column: number;
  row: number;
};

type BlockedInterval = {
  startMinute: number;
  endMinute: number;
};

type AppointmentSelection = {
  day: number;
  staffId: string;
  startMinute: number;
};

const SCENE_WIDTH = 700;
const DAY_WIDTH = SCENE_WIDTH / 7;

const BASE_MONTH_HEADER_HEIGHT = 56;
const BASE_WEEKDAY_HEADER_HEIGHT = 30;
const BASE_DATE_HEADER_HEIGHT = 18;
const BASE_STAFF_HEADER_HEIGHT = 16;

const MONTH_HEADER_MAX_HEIGHT_PIXELS = 24;
const WEEKDAY_HEADER_MAX_HEIGHT_PIXELS = 22;
const DATE_HEADER_MAX_HEIGHT_PIXELS = 20;
const STAFF_HEADER_MAX_HEIGHT_PIXELS = 20;

const TIME_AXIS_COMPACT_WIDTH_PIXELS = 18;
const TIME_AXIS_HOURLY_WIDTH_PIXELS = 34;
const TIME_AXIS_FULL_WIDTH_PIXELS = 48;

const TIME_LABEL_FONT_SIZE_PIXELS = 11;
const STAFF_NAME_FONT_SIZE_PIXELS = 12;
const DAY_DATE_FONT_SIZE_PIXELS = 14;
const MONTH_TITLE_FONT_SIZE_PIXELS = 16;
const WEEKDAY_FONT_SIZE_PIXELS = 14;

const MAX_QUARTER_HOUR_HEIGHT_PIXELS = 48;
const MAX_STAFF_COLUMN_WIDTH_PIXELS = 48;

const TIME_LABEL_GAP_FACTOR = 1.55;

const TIME_EDGE_PADDING_PIXELS = TIME_LABEL_FONT_SIZE_PIXELS / 2 + 3;

const BOOKING_TARGET_SIZE_PIXELS = 48;
const MINUTES_PER_SLOT = 15;
const GRID_DIVIDER_SIZE_PIXELS = 1;

const DEFAULT_DISPLAY_START_MINUTE = 9 * 60;
const DEFAULT_DISPLAY_END_MINUTE = 18 * 60;

const HORIZONTAL_ZOOM_POWER = 0.35;
const VERTICAL_ZOOM_POWER = 1;
const MAX_GESTURE_SCALE = 12;

const COLORS = {
  background: "#ffffff",
  unavailable: "#d1d5db",
  grid: "#d1d5db",
  subtleGrid: "#e5e7eb",
  header: "#f8fafc",
  text: "#111827",
  mutedText: "#6b7280",
  today: "#111827",
  bookingReadyGrid: "#86efac",
  bookingReadyText: "#15803d",
  bookingReadyBackground: "#f0fdf4",
};

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

function toMinutes(time: string): number {
  const [hour, minute] = time.split(":").map(Number);

  return hour * 60 + minute;
}

function formatMinute(minute: number): string {
  const hour = Math.floor(minute / 60);
  const remainder = minute % 60;

  return `${String(hour).padStart(2, "0")}:${String(remainder).padStart(
    2,
    "0",
  )}`;
}

function localDate(
  year: number,
  month: number,
  day: number,
  minuteOfDay = 0,
): Date {
  return new Date(
    year,
    month - 1,
    day,
    Math.floor(minuteOfDay / 60),
    minuteOfDay % 60,
    0,
    0,
  );
}

function dateKey(year: number, month: number, day: number): string {
  return [
    year,
    String(month).padStart(2, "0"),
    String(day).padStart(2, "0"),
  ].join("-");
}

function intervalsOverlap(
  leftStart: Date,
  leftEnd: Date,
  rightStart: Date,
  rightEnd: Date,
): boolean {
  return leftStart < rightEnd && leftEnd > rightStart;
}

function createMonthCells(year: number, month: number): MonthCell[] {
  const firstDay = new Date(year, month - 1, 1).getDay();

  const daysInMonth = new Date(year, month, 0).getDate();

  const cellCount = Math.ceil((firstDay + daysInMonth) / 7) * 7;

  return Array.from({ length: cellCount }, (_, index) => {
    const day = index - firstDay + 1;

    return {
      day: day >= 1 && day <= daysInMonth ? day : null,
      column: index % 7,
      row: Math.floor(index / 7),
    };
  });
}

function getBusinessHoursForDay(calendar: CalendarData, dayOfWeek: number) {
  return calendar.businessHours.find((item) => item.dayOfWeek === dayOfWeek);
}

function getStaffScheduleForDay(
  calendar: CalendarData,
  staffId: string,
  dayOfWeek: number,
) {
  return calendar.staffSchedules.find(
    (item) => item.staffId === staffId && item.dayOfWeek === dayOfWeek,
  );
}

function getBlockedIntervals(
  calendar: CalendarData,
  staffId: string,
  year: number,
  month: number,
  day: number,
  businessStartMinute: number,
  businessEndMinute: number,
): BlockedInterval[] {
  const dayStart = localDate(year, month, day, businessStartMinute);

  const dayEnd = localDate(year, month, day, businessEndMinute);

  return calendar.blockedRanges
    .filter((range) => {
      if (range.staffId !== staffId) {
        return false;
      }

      return intervalsOverlap(
        new Date(range.startDateTime),
        new Date(range.endDateTime),
        dayStart,
        dayEnd,
      );
    })
    .map((range) => {
      const rangeStart = new Date(range.startDateTime);

      const rangeEnd = new Date(range.endDateTime);

      const startMinute = clamp(
        rangeStart.getHours() * 60 + rangeStart.getMinutes(),
        businessStartMinute,
        businessEndMinute,
      );

      const endMinute = clamp(
        rangeEnd.getHours() * 60 + rangeEnd.getMinutes(),
        businessStartMinute,
        businessEndMinute,
      );

      return {
        startMinute,
        endMinute,
      };
    })
    .filter((interval) => interval.endMinute > interval.startMinute);
}

function distance(first: Point, second: Point): number {
  return Math.hypot(second.x - first.x, second.y - first.y);
}

function midpoint(first: Point, second: Point): Point {
  return {
    x: (first.x + second.x) / 2,
    y: (first.y + second.y) / 2,
  };
}

function viewportToScene(point: Point, viewport: Size, camera: Camera): Point {
  return {
    x: camera.x + (point.x / viewport.width) * camera.width,
    y: camera.y + (point.y / viewport.height) * camera.height,
  };
}

function sceneToScreen(point: Point, viewport: Size, camera: Camera): Point {
  return {
    x: ((point.x - camera.x) / camera.width) * viewport.width,
    y: ((point.y - camera.y) / camera.height) * viewport.height,
  };
}

function clampCamera(
  camera: Camera,
  scene: Size,
  minimumCameraWidth = DAY_WIDTH,
  minimumCameraHeight = Math.min(scene.height, 44),
): Camera {
  const width = clamp(camera.width, minimumCameraWidth, scene.width);

  const height = clamp(camera.height, minimumCameraHeight, scene.height);

  return {
    x: clamp(camera.x, 0, Math.max(0, scene.width - width)),

    y: clamp(camera.y, 0, Math.max(0, scene.height - height)),

    width,
    height,
  };
}

export default function VectorMonthlyCalendar({ calendar }: Props) {
  const monthCells = useMemo(
    () => createMonthCells(calendar.year, calendar.month),
    [calendar.year, calendar.month],
  );

  const weekCount = monthCells.length / 7;
  const weekHeight = 170;

  const scene = useMemo<Size>(
    () => ({
      width: SCENE_WIDTH,
      height:
        BASE_MONTH_HEADER_HEIGHT +
        BASE_WEEKDAY_HEADER_HEIGHT +
        weekCount * weekHeight,
    }),
    [weekCount],
  );

  const initialCamera = useMemo<Camera>(
    () => ({
      x: 0,
      y: 0,
      width: scene.width,
      height: scene.height,
    }),
    [scene],
  );

  const [camera, setCamera] = useState<Camera>(initialCamera);

  const [selection, setSelection] = useState<AppointmentSelection | null>(null);

  const svgRef = useRef<SVGSVGElement | null>(null);

  const [viewportSize, setViewportSize] = useState<Size | null>(null);

  const activePointers = useRef(new Map<number, Point>());

  const gestureStart = useRef<{
    camera: Camera;
    points: Map<number, Point>;
    distance?: number;
  } | null>(null);

  useEffect(() => {
    const svg = svgRef.current;

    if (!svg) {
      return;
    }

    const updateViewportSize = () => {
      const rect = svg.getBoundingClientRect();

      if (rect.width <= 0 || rect.height <= 0) {
        return;
      }

      setViewportSize({
        width: rect.width,
        height: rect.height,
      });
    };

    updateViewportSize();

    const resizeObserver = new ResizeObserver(updateViewportSize);

    resizeObserver.observe(svg);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  const monthTitle = useMemo(
    () =>
      new Intl.DateTimeFormat("en-US", {
        month: "long",
        year: "numeric",
      }).format(new Date(calendar.year, calendar.month - 1, 1)),
    [calendar.month, calendar.year],
  );

  const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const openBusinessHours = calendar.businessHours.filter(
    (businessHour) =>
      !businessHour.isClosed &&
      toMinutes(businessHour.closeTime) > toMinutes(businessHour.openTime),
  );

  const displayStartMinute =
    openBusinessHours.length > 0
      ? Math.min(
          ...openBusinessHours.map((businessHour) =>
            toMinutes(businessHour.openTime),
          ),
        )
      : DEFAULT_DISPLAY_START_MINUTE;

  const displayEndMinute =
    openBusinessHours.length > 0
      ? Math.max(
          ...openBusinessHours.map((businessHour) =>
            toMinutes(businessHour.closeTime),
          ),
        )
      : DEFAULT_DISPLAY_END_MINUTE;

  const displayTotalMinutes = Math.max(
    MINUTES_PER_SLOT,
    displayEndMinute - displayStartMinute,
  );

  const getViewportSize = (): Size => {
    if (viewportSize) {
      return viewportSize;
    }

    return {
      width: 1,
      height: 1,
    };
  };

  const minimumCameraWidth = DAY_WIDTH;

  const getMinimumCameraHeight = (viewport: Size): number => {
    const baseTimelineHeight =
      weekHeight - BASE_DATE_HEADER_HEIGHT - BASE_STAFF_HEADER_HEIGHT;

    const quarterHourSlotCount = Math.max(
      1,

      Math.ceil(displayTotalMinutes / MINUTES_PER_SLOT),
    );

    const cameraHeightForMaximumSlot =
      (baseTimelineHeight * viewport.height) /
      (quarterHourSlotCount * MAX_QUARTER_HOUR_HEIGHT_PIXELS);

    return clamp(cameraHeightForMaximumSlot, 44, weekHeight);
  };

  const zoomAroundPoint = (
    currentCamera: Camera,
    viewportPoint: Point,
    gestureRatio: number,
  ): Camera => {
    const viewport = getViewportSize();

    const minimumCameraHeight = getMinimumCameraHeight(viewport);

    const focalScenePoint = viewportToScene(
      viewportPoint,
      viewport,
      currentCamera,
    );

    const boundedRatio = clamp(
      gestureRatio,
      1 / MAX_GESTURE_SCALE,
      MAX_GESTURE_SCALE,
    );

    const nextWidth =
      currentCamera.width / Math.pow(boundedRatio, HORIZONTAL_ZOOM_POWER);

    const nextHeight =
      currentCamera.height / Math.pow(boundedRatio, VERTICAL_ZOOM_POWER);

    const nextCamera = {
      x: focalScenePoint.x - (viewportPoint.x / viewport.width) * nextWidth,
      y: focalScenePoint.y - (viewportPoint.y / viewport.height) * nextHeight,
      width: nextWidth,
      height: nextHeight,
    };

    return clampCamera(
      nextCamera,
      scene,
      minimumCameraWidth,
      minimumCameraHeight,
    );
  };

  const zoomBy = (ratio: number) => {
    const viewport = getViewportSize();

    setCamera((current) =>
      zoomAroundPoint(
        current,
        {
          x: viewport.width / 2,
          y: viewport.height / 2,
        },
        ratio,
      ),
    );
  };

  const resetCamera = () => {
    setCamera(initialCamera);
  };

  const handlePointerDown = (event: ReactPointerEvent<SVGSVGElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);

    activePointers.current.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    });

    const points = new Map(activePointers.current);

    const pointValues = Array.from(points.values());

    gestureStart.current = {
      camera,
      points,
      distance:
        pointValues.length >= 2
          ? distance(pointValues[0], pointValues[1])
          : undefined,
    };
  };

  const handlePointerMove = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (!activePointers.current.has(event.pointerId) || !gestureStart.current) {
      return;
    }

    activePointers.current.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    });

    const viewport = getViewportSize();
    const currentPoints = Array.from(activePointers.current.values());

    const startPoints = Array.from(gestureStart.current.points.values());

    if (
      currentPoints.length >= 2 &&
      startPoints.length >= 2 &&
      gestureStart.current.distance
    ) {
      const currentDistance = distance(currentPoints[0], currentPoints[1]);

      const ratio = currentDistance / gestureStart.current.distance;

      const currentMidpoint = midpoint(currentPoints[0], currentPoints[1]);

      const svgRect = svgRef.current?.getBoundingClientRect();

      setCamera(
        zoomAroundPoint(
          gestureStart.current.camera,
          {
            x: currentMidpoint.x - (svgRect?.left ?? 0),
            y: currentMidpoint.y - (svgRect?.top ?? 0),
          },
          ratio,
        ),
      );

      return;
    }

    if (currentPoints.length === 1 && startPoints.length === 1) {
      const deltaX = currentPoints[0].x - startPoints[0].x;

      const deltaY = currentPoints[0].y - startPoints[0].y;

      const sceneDeltaX =
        (deltaX / viewport.width) * gestureStart.current.camera.width;

      const sceneDeltaY =
        (deltaY / viewport.height) * gestureStart.current.camera.height;

      const minimumCameraHeight = getMinimumCameraHeight(viewport);

      setCamera(
        clampCamera(
          {
            ...gestureStart.current.camera,

            x: gestureStart.current.camera.x - sceneDeltaX,

            y: gestureStart.current.camera.y - sceneDeltaY,
          },

          scene,
          minimumCameraWidth,
          minimumCameraHeight,
        ),
      );
    }
  };

  const handlePointerEnd = (event: ReactPointerEvent<SVGSVGElement>) => {
    activePointers.current.delete(event.pointerId);

    if (activePointers.current.size === 0) {
      gestureStart.current = null;
      return;
    }

    const points = new Map(activePointers.current);

    const pointValues = Array.from(points.values());

    gestureStart.current = {
      camera,
      points,
      distance:
        pointValues.length >= 2
          ? distance(pointValues[0], pointValues[1])
          : undefined,
    };
  };

  if (!viewportSize) {
    return (
      <section className="mx-auto w-full max-w-[900px]">
        <div className="mb-3">
          <h2 className="text-xl font-semibold text-gray-900">{monthTitle}</h2>

          <p className="text-sm text-gray-500">Loading calendar...</p>
        </div>

        <div className="aspect-[3/4] w-full rounded-xl border border-gray-300 bg-white shadow-sm">
          <svg
            ref={svgRef}
            className="h-full w-full"
            aria-label={`${monthTitle} appointment availability calendar`}
          />
        </div>
      </section>
    );
  }

  const renderedSceneWidth = (scene.width / camera.width) * 100;

  const renderedSceneHeight = (scene.height / camera.height) * 100;

  const approximateZoom = Math.max(
    renderedSceneWidth / 100,
    renderedSceneHeight / 100,
  );

  const currentViewportSize = viewportSize;

  const sceneUnitsPerPixelX = camera.width / currentViewportSize.width;

  const sceneUnitsPerPixelY = camera.height / currentViewportSize.height;

  const verticalDividerWidth = GRID_DIVIDER_SIZE_PIXELS * sceneUnitsPerPixelX;

  const horizontalDividerHeight =
    GRID_DIVIDER_SIZE_PIXELS * sceneUnitsPerPixelY;

  const monthHeaderHeight = Math.min(
    BASE_MONTH_HEADER_HEIGHT,
    MONTH_HEADER_MAX_HEIGHT_PIXELS * sceneUnitsPerPixelY,
  );

  const weekdayHeaderHeight = Math.min(
    BASE_WEEKDAY_HEADER_HEIGHT,
    WEEKDAY_HEADER_MAX_HEIGHT_PIXELS * sceneUnitsPerPixelY,
  );

  const monthTitleFontSize = MONTH_TITLE_FONT_SIZE_PIXELS * sceneUnitsPerPixelY;

  const weekdayFontSize = WEEKDAY_FONT_SIZE_PIXELS * sceneUnitsPerPixelY;

  const bookingTimelineContentHeight =
    weekHeight -
    Math.min(
      BASE_DATE_HEADER_HEIGHT,
      DATE_HEADER_MAX_HEIGHT_PIXELS * sceneUnitsPerPixelY,
    ) -
    Math.min(
      BASE_STAFF_HEADER_HEIGHT,
      STAFF_HEADER_MAX_HEIGHT_PIXELS * sceneUnitsPerPixelY,
    );

  const bookingTimelineHeight = Math.max(
    bookingTimelineContentHeight -
      TIME_EDGE_PADDING_PIXELS * sceneUnitsPerPixelY * 2,
    1,
  );

  const bookingQuarterHourHeight =
    ((bookingTimelineHeight / camera.height) * viewportSize.height) /
    Math.max(1, displayTotalMinutes / MINUTES_PER_SLOT);

  const bookingTimeLabelStep =
    bookingQuarterHourHeight * 2 >=
    TIME_LABEL_FONT_SIZE_PIXELS * TIME_LABEL_GAP_FACTOR
      ? 30
      : bookingQuarterHourHeight * 4 >=
          TIME_LABEL_FONT_SIZE_PIXELS * TIME_LABEL_GAP_FACTOR
        ? 60
        : 120;

  const bookingTimeAxisWidthPixels =
    bookingTimeLabelStep <= 60 ? TIME_AXIS_FULL_WIDTH_PIXELS : 24;

  const bookingTimeAxisWidth = Math.min(
    bookingTimeAxisWidthPixels * sceneUnitsPerPixelX,
    DAY_WIDTH * 0.45,
  );

  const bookingStaffColumnWidth =
    ((DAY_WIDTH - bookingTimeAxisWidth) /
      Math.max(calendar.staffs.length, 1) /
      camera.width) *
    viewportSize.width;

  const bookingReady =
    bookingQuarterHourHeight >= BOOKING_TARGET_SIZE_PIXELS &&
    bookingStaffColumnWidth >= BOOKING_TARGET_SIZE_PIXELS;

  return (
    <section className="mx-auto w-full max-w-[900px]">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">{monthTitle}</h2>

          <p
            className={
              bookingReady
                ? "text-sm font-medium text-green-700"
                : "text-sm text-gray-500"
            }
          >
            {bookingReady
              ? "Ready to book: tap a white 15-minute time slot."
              : "Pinch or use + to zoom in. White is available; gray is unavailable."}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => zoomBy(1 / 1.25)}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          >
            −
          </button>

          <span className="min-w-16 text-center text-sm text-gray-600">
            {approximateZoom.toFixed(2)}×
          </span>

          <button
            type="button"
            onClick={() => zoomBy(1.25)}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          >
            +
          </button>

          <button
            type="button"
            onClick={resetCamera}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          >
            Reset
          </button>
        </div>
      </div>

      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl border border-gray-300 bg-white shadow-sm">
        <svg
          ref={svgRef}
          viewBox={`${camera.x} ${camera.y} ${camera.width} ${camera.height}`}
          preserveAspectRatio="none"
          className="h-full w-full touch-none select-none [&_text]:hidden"
          role="img"
          aria-label={`${monthTitle} appointment availability calendar`}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerEnd}
          onPointerCancel={handlePointerEnd}
        >
          <rect
            x={0}
            y={0}
            width={scene.width}
            height={scene.height}
            fill={COLORS.background}
          />

          <rect
            x={0}
            y={0}
            width={scene.width}
            height={monthHeaderHeight}
            fill={COLORS.header}
          />

          <text
            x={scene.width / 2}
            y={monthHeaderHeight / 2}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={monthTitleFontSize}
            fontWeight={700}
            fill={COLORS.text}
            pointerEvents="none"
          >
            {monthTitle}
          </text>

          {weekdayLabels.map((label, index) => {
            const x = index * DAY_WIDTH;

            return (
              <g key={label}>
                <rect
                  x={x}
                  y={monthHeaderHeight}
                  width={DAY_WIDTH}
                  height={weekdayHeaderHeight}
                  fill={COLORS.header}
                />

                <text
                  x={x + DAY_WIDTH / 2}
                  y={monthHeaderHeight + weekdayHeaderHeight / 2}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={weekdayFontSize}
                  fontWeight={600}
                  fill={COLORS.text}
                  pointerEvents="none"
                >
                  {label}
                </text>
              </g>
            );
          })}

          {monthCells.map((cell, cellIndex) => {
            const day = cell.day;
            const x = cell.column * DAY_WIDTH;
            const y =
              monthHeaderHeight + weekdayHeaderHeight + cell.row * weekHeight;

            if (day === null) {
              return (
                <rect
                  key={cellIndex}
                  x={x}
                  y={y}
                  width={DAY_WIDTH}
                  height={weekHeight}
                  fill="#f9fafb"
                />
              );
            }

            const date = localDate(calendar.year, calendar.month, day);

            const dayOfWeek = date.getDay();

            const businessHour = getBusinessHoursForDay(calendar, dayOfWeek);

            const isBusinessClosed = !businessHour || businessHour.isClosed;

            const actualBusinessStartMinute =
              businessHour && !businessHour.isClosed
                ? toMinutes(businessHour.openTime)
                : displayStartMinute;

            const actualBusinessEndMinute =
              businessHour && !businessHour.isClosed
                ? toMinutes(businessHour.closeTime)
                : displayStartMinute;

            const businessStartMinute = displayStartMinute;
            const businessEndMinute = displayEndMinute;

            const localSceneUnitsPerPixelX = camera.width / viewportSize.width;

            const localSceneUnitsPerPixelY =
              camera.height / viewportSize.height;

            const localDateHeaderHeight = Math.min(
              BASE_DATE_HEADER_HEIGHT,
              DATE_HEADER_MAX_HEIGHT_PIXELS * localSceneUnitsPerPixelY,
            );

            const localStaffHeaderHeight = Math.min(
              BASE_STAFF_HEADER_HEIGHT,
              STAFF_HEADER_MAX_HEIGHT_PIXELS * localSceneUnitsPerPixelY,
            );

            const timelineContentTop =
              y + localDateHeaderHeight + localStaffHeaderHeight;

            const timelineContentHeight =
              weekHeight - localDateHeaderHeight - localStaffHeaderHeight;

            const staffCount = Math.max(calendar.staffs.length, 1);

            const timelineEdgePadding =
              TIME_EDGE_PADDING_PIXELS * localSceneUnitsPerPixelY;

            const timelineTop = timelineContentTop + timelineEdgePadding;

            const timelineHeight = Math.max(
              timelineContentHeight - timelineEdgePadding * 2,
              1,
            );

            const renderedTimelineHeight =
              (timelineHeight / camera.height) * viewportSize.height;

            const totalBusinessMinutes = displayTotalMinutes;

            const quarterHourSlotCount = Math.max(
              1,

              totalBusinessMinutes / MINUTES_PER_SLOT,
            );

            const quarterHourHeight =
              renderedTimelineHeight / quarterHourSlotCount;

            const minimumTimeLabelGapPixels =
              TIME_LABEL_FONT_SIZE_PIXELS * TIME_LABEL_GAP_FACTOR;

            const timeLabelStep =
              quarterHourHeight * 2 >= minimumTimeLabelGapPixels
                ? 30
                : quarterHourHeight * 4 >= minimumTimeLabelGapPixels
                  ? 60
                  : 120;

            const desiredTimeAxisWidthPixels =
              timeLabelStep <= 60 ? TIME_AXIS_FULL_WIDTH_PIXELS : 24;

            const timeAxisWidth = Math.min(
              desiredTimeAxisWidthPixels * localSceneUnitsPerPixelX,

              DAY_WIDTH * 0.45,
            );

            const localTimeLabelFontSize =
              TIME_LABEL_FONT_SIZE_PIXELS * localSceneUnitsPerPixelY;

            const staffContentWidth = DAY_WIDTH - timeAxisWidth;

            const staffWidth = staffContentWidth / staffCount;

            const renderedStaffWidth =
              (staffWidth / camera.width) * viewportSize.width;

            const showFullStaffNames = renderedStaffWidth >= 44;

            const canSelectAppointment =
              quarterHourHeight >= BOOKING_TARGET_SIZE_PIXELS &&
              renderedStaffWidth >= BOOKING_TARGET_SIZE_PIXELS;

            const timeAxisClipId = `time-axis-${calendar.year}-${calendar.month}-${day}`;

            const timeLabels: number[] = [];

            for (
              let minute = displayStartMinute;
              minute <= displayEndMinute;
              minute += timeLabelStep
            ) {
              timeLabels.push(minute);
            }

            if (timeLabels[timeLabels.length - 1] !== displayEndMinute) {
              timeLabels.push(displayEndMinute);
            }

            const timeGridMinutes: number[] = [];

            for (
              let minute = displayStartMinute;
              minute <= displayEndMinute;
              minute += MINUTES_PER_SLOT
            ) {
              timeGridMinutes.push(minute);
            }

            if (
              timeGridMinutes[timeGridMinutes.length - 1] !== displayEndMinute
            ) {
              timeGridMinutes.push(displayEndMinute);
            }

            return (
              <g key={dateKey(calendar.year, calendar.month, day)}>
                <defs>
                  <clipPath id={timeAxisClipId}>
                    <rect
                      x={x}
                      y={timelineContentTop}
                      width={timeAxisWidth}
                      height={timelineContentHeight}
                    />
                  </clipPath>
                </defs>

                <rect
                  x={x}
                  y={y}
                  width={DAY_WIDTH}
                  height={weekHeight}
                  fill={COLORS.background}
                />

                <text
                  x={x + 4 * localSceneUnitsPerPixelX}
                  y={y + localDateHeaderHeight / 2}
                  dominantBaseline="middle"
                  fontSize={
                    DAY_DATE_FONT_SIZE_PIXELS * localSceneUnitsPerPixelY
                  }
                  fontWeight={700}
                  fill={COLORS.text}
                  pointerEvents="none"
                >
                  {day}
                </text>

                {calendar.staffs.map((staff, staffIndex) => {
                  const staffX = x + timeAxisWidth + staffIndex * staffWidth;

                  const schedule = getStaffScheduleForDay(
                    calendar,
                    staff.id,
                    dayOfWeek,
                  );

                  const scheduleStartMinute = schedule
                    ? toMinutes(schedule.startTime)
                    : businessStartMinute;

                  const scheduleEndMinute = schedule
                    ? toMinutes(schedule.endTime)
                    : businessStartMinute;

                  const blockedIntervals = getBlockedIntervals(
                    calendar,
                    staff.id,
                    calendar.year,
                    calendar.month,
                    day,
                    businessStartMinute,
                    businessEndMinute,
                  );

                  const staffLabelX = staffX + staffWidth / 2;

                  const staffLabelY =
                    y + localDateHeaderHeight + localStaffHeaderHeight / 2;

                  return (
                    <g key={`${day}-${staff.id}`}>
                      <rect
                        x={staffX + 0.6}
                        y={timelineTop}
                        width={Math.max(staffWidth - 1.2, 0)}
                        height={timelineHeight}
                        fill={COLORS.background}
                      />

                      {!isBusinessClosed &&
                        actualBusinessStartMinute > displayStartMinute && (
                          <rect
                            x={staffX + 0.6}
                            y={timelineTop}
                            width={Math.max(staffWidth - 1.2, 0)}
                            height={
                              ((actualBusinessStartMinute -
                                displayStartMinute) /
                                displayTotalMinutes) *
                              timelineHeight
                            }
                            fill={COLORS.unavailable}
                          />
                        )}

                      {!isBusinessClosed &&
                        actualBusinessEndMinute < displayEndMinute && (
                          <rect
                            x={staffX + 0.6}
                            y={
                              timelineTop +
                              ((actualBusinessEndMinute - displayStartMinute) /
                                displayTotalMinutes) *
                                timelineHeight
                            }
                            width={Math.max(staffWidth - 1.2, 0)}
                            height={
                              ((displayEndMinute - actualBusinessEndMinute) /
                                displayTotalMinutes) *
                              timelineHeight
                            }
                            fill={COLORS.unavailable}
                          />
                        )}

                      {(isBusinessClosed || !schedule) && (
                        <rect
                          x={staffX + 0.6}
                          y={timelineTop}
                          width={Math.max(staffWidth - 1.2, 0)}
                          height={timelineHeight}
                          fill={COLORS.unavailable}
                        />
                      )}

                      {!isBusinessClosed &&
                        schedule &&
                        scheduleStartMinute > businessStartMinute && (
                          <rect
                            x={staffX + 0.6}
                            y={timelineTop}
                            width={Math.max(staffWidth - 1.2, 0)}
                            height={
                              ((scheduleStartMinute - businessStartMinute) /
                                totalBusinessMinutes) *
                              timelineHeight
                            }
                            fill={COLORS.unavailable}
                          />
                        )}

                      {!isBusinessClosed &&
                        schedule &&
                        scheduleEndMinute < businessEndMinute && (
                          <rect
                            x={staffX + 0.6}
                            y={
                              timelineTop +
                              ((scheduleEndMinute - businessStartMinute) /
                                totalBusinessMinutes) *
                                timelineHeight
                            }
                            width={Math.max(staffWidth - 1.2, 0)}
                            height={
                              ((businessEndMinute - scheduleEndMinute) /
                                totalBusinessMinutes) *
                              timelineHeight
                            }
                            fill={COLORS.unavailable}
                          />
                        )}

                      {!isBusinessClosed &&
                        schedule &&
                        blockedIntervals.map((interval, intervalIndex) => (
                          <rect
                            key={intervalIndex}
                            x={staffX + 0.6}
                            y={
                              timelineTop +
                              ((interval.startMinute - businessStartMinute) /
                                totalBusinessMinutes) *
                                timelineHeight
                            }
                            width={Math.max(staffWidth - 1.2, 0)}
                            height={
                              ((interval.endMinute - interval.startMinute) /
                                totalBusinessMinutes) *
                              timelineHeight
                            }
                            fill={COLORS.unavailable}
                          />
                        ))}

                      {canSelectAppointment &&
                        !isBusinessClosed &&
                        schedule &&
                        Array.from(
                          {
                            length: Math.ceil(
                              totalBusinessMinutes / MINUTES_PER_SLOT,
                            ),
                          },
                          (_, slotIndex) =>
                            businessStartMinute + slotIndex * MINUTES_PER_SLOT,
                        ).map((slotStartMinute) => {
                          const slotEndMinute =
                            slotStartMinute + MINUTES_PER_SLOT;

                          const insideSchedule =
                            slotStartMinute >= scheduleStartMinute &&
                            slotEndMinute <= scheduleEndMinute;

                          const blocked = blockedIntervals.some(
                            (interval) =>
                              interval.startMinute < slotEndMinute &&
                              interval.endMinute > slotStartMinute,
                          );

                          if (!insideSchedule || blocked) {
                            return null;
                          }

                          const slotY =
                            timelineTop +
                            ((slotStartMinute - businessStartMinute) /
                              totalBusinessMinutes) *
                              timelineHeight;

                          const slotHeight =
                            (MINUTES_PER_SLOT / totalBusinessMinutes) *
                            timelineHeight;

                          const selected =
                            selection?.day === day &&
                            selection.staffId === staff.id &&
                            selection.startMinute === slotStartMinute;

                          return (
                            <rect
                              key={`slot-${slotStartMinute}`}
                              x={staffX + 0.6}
                              y={slotY}
                              width={Math.max(staffWidth - 1.2, 0)}
                              height={slotHeight}
                              fill={
                                selected
                                  ? "rgba(37, 99, 235, 0.2)"
                                  : "transparent"
                              }
                              stroke={selected ? "#2563eb" : "transparent"}
                              strokeWidth={selected ? 1 : 0}
                              vectorEffect="non-scaling-stroke"
                              style={{
                                cursor: "pointer",
                              }}
                              onClick={(event) => {
                                event.stopPropagation();
                                setSelection({
                                  day,
                                  staffId: staff.id,
                                  startMinute: slotStartMinute,
                                });
                              }}
                            >
                              <title>
                                {`${staff.displayName}, ${dateKey(
                                  calendar.year,
                                  calendar.month,
                                  day,
                                )} ${formatMinute(slotStartMinute)}`}
                              </title>
                            </rect>
                          );
                        })}

                      <rect
                        x={staffX - verticalDividerWidth / 2}
                        y={y + localDateHeaderHeight}
                        width={verticalDividerWidth}
                        height={weekHeight - localDateHeaderHeight}
                        fill={COLORS.subtleGrid}
                        pointerEvents="none"
                      />

                      <text
                        x={staffLabelX}
                        y={staffLabelY}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fontSize={
                          STAFF_NAME_FONT_SIZE_PIXELS * localSceneUnitsPerPixelY
                        }
                        fontWeight={600}
                        fill={COLORS.text}
                        pointerEvents="none"
                      >
                        {showFullStaffNames
                          ? staff.displayName
                          : staff.displayName.substring(0, 3)}
                      </text>
                    </g>
                  );
                })}

                {timeGridMinutes.map((minute) => {
                  const ratio =
                    (minute - displayStartMinute) / displayTotalMinutes;

                  const gridY = timelineTop + ratio * timelineHeight;

                  const isHour = minute % 60 === 0;
                  const isHalfHour = minute % 30 === 0;

                  return (
                    <rect
                      key={`time-grid-${minute}`}
                      x={x + timeAxisWidth}
                      y={gridY - horizontalDividerHeight / 2}
                      width={DAY_WIDTH - timeAxisWidth}
                      height={horizontalDividerHeight}
                      fill={
                        canSelectAppointment
                          ? COLORS.bookingReadyGrid
                          : isHour
                            ? COLORS.grid
                            : COLORS.subtleGrid
                      }
                      opacity={
                        canSelectAppointment
                          ? isHour
                            ? 0.95
                            : isHalfHour
                              ? 0.72
                              : 0.5
                          : isHour
                            ? 1
                            : isHalfHour
                              ? 0.72
                              : 0.42
                      }
                      pointerEvents="none"
                    />
                  );
                })}

              </g>
            );
          })}

          <g fill={COLORS.grid} pointerEvents="none">
            <rect
              x={0}
              y={monthHeaderHeight - horizontalDividerHeight / 2}
              width={scene.width}
              height={horizontalDividerHeight}
            />

            <rect
              x={0}
              y={
                monthHeaderHeight +
                weekdayHeaderHeight -
                horizontalDividerHeight / 2
              }
              width={scene.width}
              height={horizontalDividerHeight}
            />

            {Array.from({ length: 8 }, (_, columnIndex) => {
              const dividerX = columnIndex * DAY_WIDTH;

              return (
                <rect
                  key={`month-column-${columnIndex}`}
                  x={dividerX - verticalDividerWidth / 2}
                  y={monthHeaderHeight}
                  width={verticalDividerWidth}
                  height={weekdayHeaderHeight + weekCount * weekHeight}
                />
              );
            })}

            {Array.from({ length: weekCount + 1 }, (_, rowIndex) => {
              const dividerY =
                monthHeaderHeight + weekdayHeaderHeight + rowIndex * weekHeight;

              return (
                <rect
                  key={`month-row-${rowIndex}`}
                  x={0}
                  y={dividerY - horizontalDividerHeight / 2}
                  width={scene.width}
                  height={horizontalDividerHeight}
                />
              );
            })}
          </g>
        </svg>

        <div
          className="pointer-events-none absolute inset-0 overflow-hidden"
          aria-hidden="true"
        >
          {(() => {
            const point = sceneToScreen(
              { x: scene.width / 2, y: monthHeaderHeight / 2 },
              viewportSize,
              camera,
            );

            return (
              <span
                className="absolute whitespace-nowrap font-bold text-gray-900"
                style={{
                  left: point.x,
                  top: point.y,
                  fontSize: MONTH_TITLE_FONT_SIZE_PIXELS,
                  transform: "translate(-50%, -50%)",
                }}
              >
                {monthTitle}
              </span>
            );
          })()}

          {weekdayLabels.map((label, index) => {
            const point = sceneToScreen(
              {
                x: index * DAY_WIDTH + DAY_WIDTH / 2,
                y: monthHeaderHeight + weekdayHeaderHeight / 2,
              },
              viewportSize,
              camera,
            );

            return (
              <span
                key={`weekday-${label}`}
                className="absolute whitespace-nowrap font-semibold text-gray-900"
                style={{
                  left: point.x,
                  top: point.y,
                  fontSize: WEEKDAY_FONT_SIZE_PIXELS,
                  transform: "translate(-50%, -50%)",
                }}
              >
                {label}
              </span>
            );
          })}

          {monthCells.map((cell, cellIndex) => {
            const day = cell.day;
            if (day === null) return null;

            const x = cell.column * DAY_WIDTH;
            const y =
              monthHeaderHeight + weekdayHeaderHeight + cell.row * weekHeight;
            const localSceneUnitsPerPixelX = camera.width / viewportSize.width;
            const localSceneUnitsPerPixelY =
              camera.height / viewportSize.height;
            const localDateHeaderHeight = Math.min(
              BASE_DATE_HEADER_HEIGHT,
              DATE_HEADER_MAX_HEIGHT_PIXELS * localSceneUnitsPerPixelY,
            );
            const localStaffHeaderHeight = Math.min(
              BASE_STAFF_HEADER_HEIGHT,
              STAFF_HEADER_MAX_HEIGHT_PIXELS * localSceneUnitsPerPixelY,
            );
            const timelineContentTop =
              y + localDateHeaderHeight + localStaffHeaderHeight;
            const timelineContentHeight =
              weekHeight - localDateHeaderHeight - localStaffHeaderHeight;
            const timelineEdgePadding =
              TIME_EDGE_PADDING_PIXELS * localSceneUnitsPerPixelY;
            const timelineTop = timelineContentTop + timelineEdgePadding;
            const timelineHeight = Math.max(
              timelineContentHeight - timelineEdgePadding * 2,
              1,
            );
            const renderedTimelineHeight =
              (timelineHeight / camera.height) * viewportSize.height;
            const quarterHourSlotCount = Math.max(
              1,
              displayTotalMinutes / MINUTES_PER_SLOT,
            );
            const quarterHourHeight =
              renderedTimelineHeight / quarterHourSlotCount;
            const minimumTimeLabelGapPixels =
              TIME_LABEL_FONT_SIZE_PIXELS * TIME_LABEL_GAP_FACTOR;
            const timeLabelStep =
              quarterHourHeight * 2 >= minimumTimeLabelGapPixels
                ? 30
                : quarterHourHeight * 4 >= minimumTimeLabelGapPixels
                  ? 60
                  : 120;
            const desiredTimeAxisWidthPixels =
              timeLabelStep <= 60 ? TIME_AXIS_FULL_WIDTH_PIXELS : 24;
            const timeAxisWidth = Math.min(
              desiredTimeAxisWidthPixels * localSceneUnitsPerPixelX,
              DAY_WIDTH * 0.45,
            );
            const staffCount = Math.max(calendar.staffs.length, 1);
            const staffWidth = (DAY_WIDTH - timeAxisWidth) / staffCount;
            const renderedStaffWidth =
              (staffWidth / camera.width) * viewportSize.width;
            const showFullStaffNames = renderedStaffWidth >= 44;
            const canSelectAppointment =
              quarterHourHeight >= BOOKING_TARGET_SIZE_PIXELS &&
              renderedStaffWidth >= BOOKING_TARGET_SIZE_PIXELS;
            const datePoint = sceneToScreen(
              {
                x: x + 4 * localSceneUnitsPerPixelX,
                y: y + localDateHeaderHeight / 2,
              },
              viewportSize,
              camera,
            );
            const timeLabels: number[] = [];
            for (
              let minute = displayStartMinute;
              minute <= displayEndMinute;
              minute += timeLabelStep
            ) {
              timeLabels.push(minute);
            }
            if (timeLabels[timeLabels.length - 1] !== displayEndMinute) {
              timeLabels.push(displayEndMinute);
            }

            return (
              <div key={`labels-${cellIndex}`}>
                <span
                  className="absolute font-bold text-gray-900"
                  style={{
                    left: datePoint.x,
                    top: datePoint.y,
                    fontSize: DAY_DATE_FONT_SIZE_PIXELS,
                    transform: "translate(0, -50%)",
                  }}
                >
                  {day}
                </span>

                {calendar.staffs.map((staff, staffIndex) => {
                  const point = sceneToScreen(
                    {
                      x:
                        x +
                        timeAxisWidth +
                        staffIndex * staffWidth +
                        staffWidth / 2,
                      y: y + localDateHeaderHeight + localStaffHeaderHeight / 2,
                    },
                    viewportSize,
                    camera,
                  );

                  return (
                    <span
                      key={`staff-label-${day}-${staff.id}`}
                      className="absolute overflow-hidden text-ellipsis whitespace-nowrap text-center font-semibold text-gray-900"
                      style={{
                        left: point.x,
                        top: point.y,
                        width: Math.max(renderedStaffWidth - 4, 0),
                        fontSize: STAFF_NAME_FONT_SIZE_PIXELS,
                        transform: "translate(-50%, -50%)",
                      }}
                    >
                      {showFullStaffNames
                        ? staff.displayName
                        : staff.displayName.substring(0, 3)}
                    </span>
                  );
                })}

                {timeLabels.map((minute) => {
                  const ratio =
                    (minute - displayStartMinute) / displayTotalMinutes;
                  const point = sceneToScreen(
                    {
                      x: x + timeAxisWidth / 2,
                      y: timelineTop + ratio * timelineHeight,
                    },
                    viewportSize,
                    camera,
                  );
                  const label =
                    timeLabelStep >= 120
                      ? String(Math.floor(minute / 60)).padStart(2, "0")
                      : formatMinute(minute);

                  return (
                    <span
                      key={`time-label-${day}-${minute}`}
                      className={
                        canSelectAppointment
                          ? "absolute whitespace-nowrap text-center font-medium text-green-700"
                          : "absolute whitespace-nowrap text-center text-gray-500"
                      }
                      style={{
                        left: point.x,
                        top: point.y,
                        width: desiredTimeAxisWidthPixels,
                        fontSize: TIME_LABEL_FONT_SIZE_PIXELS,
                        transform: "translate(-50%, -50%)",
                      }}
                    >
                      {label}
                    </span>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
