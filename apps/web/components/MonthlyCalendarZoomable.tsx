"use client";

import {
  PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { CalendarData } from "../types/calendar";

type Props = {
  calendar: CalendarData;
};

type Camera = {
  scale: number;
  x: number;
  y: number;
};

type Point = {
  x: number;
  y: number;
};

const MIN_SCALE = 1;
const MAX_SCALE = 10;
const SCALE_STEP = 0.25;
const SLOT_MINUTES = 15;
const DEFAULT_OPEN_MINUTE = 9 * 60;
const DEFAULT_CLOSE_MINUTE = 18 * 60;

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

function toMinutes(time: string) {
  const [hour, minute] = time.split(":").map(Number);
  return hour * 60 + minute;
}

function getMonthCellCount(year: number, month: number) {
  const firstDay = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  return Math.ceil((firstDay + daysInMonth) / 7) * 7;
}

function createMonthCells(year: number, month: number) {
  const firstDay = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const count = getMonthCellCount(year, month);

  return Array.from({ length: count }, (_, index) => {
    const day = index - firstDay + 1;
    return day >= 1 && day <= daysInMonth ? day : null;
  });
}

function getBusinessWindow(calendar: CalendarData, dayOfWeek: number) {
  const businessHour = calendar.businessHours.find(
    (item) => item.dayOfWeek === dayOfWeek,
  );

  if (!businessHour || businessHour.isClosed) {
    return null;
  }

  return {
    start: toMinutes(businessHour.openTime),
    end: toMinutes(businessHour.closeTime),
  };
}

function isAvailable(
  calendar: CalendarData,
  staffId: string,
  year: number,
  month: number,
  day: number,
  minuteOfDay: number,
) {
  const slotStart = new Date(
    year,
    month - 1,
    day,
    Math.floor(minuteOfDay / 60),
    minuteOfDay % 60,
  );
  const slotEnd = new Date(slotStart.getTime() + SLOT_MINUTES * 60_000);
  const dayOfWeek = slotStart.getDay();
  const businessWindow = getBusinessWindow(calendar, dayOfWeek);

  if (
    !businessWindow ||
    minuteOfDay < businessWindow.start ||
    minuteOfDay + SLOT_MINUTES > businessWindow.end
  ) {
    return false;
  }

  const schedule = calendar.staffSchedules.find(
    (item) => item.staffId === staffId && item.dayOfWeek === dayOfWeek,
  );

  if (!schedule) {
    return false;
  }

  const scheduleStart = toMinutes(schedule.startTime);
  const scheduleEnd = toMinutes(schedule.endTime);

  if (
    minuteOfDay < scheduleStart ||
    minuteOfDay + SLOT_MINUTES > scheduleEnd
  ) {
    return false;
  }

  return !calendar.blockedRanges.some((range) => {
    if (range.staffId !== staffId) {
      return false;
    }

    const blockedStart = new Date(range.startDateTime);
    const blockedEnd = new Date(range.endDateTime);
    return blockedStart < slotEnd && blockedEnd > slotStart;
  });
}

function distance(first: Point, second: Point) {
  return Math.hypot(second.x - first.x, second.y - first.y);
}

function midpoint(first: Point, second: Point): Point {
  return {
    x: (first.x + second.x) / 2,
    y: (first.y + second.y) / 2,
  };
}

export default function MonthlyCalendarZoomable({ calendar }: Props) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const activePointers = useRef(new Map<number, Point>());
  const gestureRef = useRef<{
    camera: Camera;
    distance: number;
    midpoint: Point;
  } | null>(null);

  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });
  const [camera, setCamera] = useState<Camera>({ scale: 1, x: 0, y: 0 });
  const [dragOrigin, setDragOrigin] = useState<{
    pointer: Point;
    camera: Camera;
  } | null>(null);

  const monthCells = useMemo(
    () => createMonthCells(calendar.year, calendar.month),
    [calendar.year, calendar.month],
  );

  const weekCount = monthCells.length / 7;
  const monthName = useMemo(
    () =>
      new Intl.DateTimeFormat("en-US", {
        month: "long",
        year: "numeric",
      }).format(new Date(calendar.year, calendar.month - 1, 1)),
    [calendar.month, calendar.year],
  );

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) {
      return;
    }

    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setViewportSize({ width, height });
    });

    observer.observe(viewport);
    return () => observer.disconnect();
  }, []);

  const canvasWidth = Math.max(1, viewportSize.width);
  const weekdayHeaderHeight = Math.max(28, viewportSize.height * 0.06);
  const canvasHeight = Math.max(1, viewportSize.height);
  const dayWidth = canvasWidth / 7;
  const dayHeight = Math.max(
    1,
    (canvasHeight - weekdayHeaderHeight) / weekCount,
  );

  const constrainCamera = useCallback(
    (next: Camera): Camera => {
      const scaledWidth = canvasWidth * next.scale;
      const scaledHeight = canvasHeight * next.scale;
      const minimumX = Math.min(0, viewportSize.width - scaledWidth);
      const minimumY = Math.min(0, viewportSize.height - scaledHeight);

      return {
        scale: clamp(next.scale, MIN_SCALE, MAX_SCALE),
        x: clamp(next.x, minimumX, 0),
        y: clamp(next.y, minimumY, 0),
      };
    },
    [canvasHeight, canvasWidth, viewportSize.height, viewportSize.width],
  );

  useEffect(() => {
    setCamera((current) => constrainCamera(current));
  }, [constrainCamera]);

  const zoomAround = useCallback(
    (nextScale: number, focalPoint?: Point) => {
      setCamera((current) => {
        const scale = clamp(nextScale, MIN_SCALE, MAX_SCALE);
        const focal = focalPoint ?? {
          x: viewportSize.width / 2,
          y: viewportSize.height / 2,
        };
        const contentX = (focal.x - current.x) / current.scale;
        const contentY = (focal.y - current.y) / current.scale;

        return constrainCamera({
          scale,
          x: focal.x - contentX * scale,
          y: focal.y - contentY * scale,
        });
      });
    },
    [constrainCamera, viewportSize.height, viewportSize.width],
  );

  const resetCamera = useCallback(() => {
    setCamera({ scale: 1, x: 0, y: 0 });
  }, []);

  const localPoint = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    return {
      x: event.clientX - bounds.left,
      y: event.clientY - bounds.top,
    };
  }, []);

  const onPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      event.currentTarget.setPointerCapture(event.pointerId);
      const point = localPoint(event);
      activePointers.current.set(event.pointerId, point);

      const points = [...activePointers.current.values()];
      if (points.length === 2) {
        gestureRef.current = {
          camera,
          distance: distance(points[0], points[1]),
          midpoint: midpoint(points[0], points[1]),
        };
        setDragOrigin(null);
      } else if (points.length === 1 && camera.scale > 1) {
        setDragOrigin({ pointer: point, camera });
      }
    },
    [camera, localPoint],
  );

  const onPointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (!activePointers.current.has(event.pointerId)) {
        return;
      }

      const point = localPoint(event);
      activePointers.current.set(event.pointerId, point);
      const points = [...activePointers.current.values()];

      if (points.length === 2 && gestureRef.current) {
        const start = gestureRef.current;
        const currentDistance = distance(points[0], points[1]);
        const currentMidpoint = midpoint(points[0], points[1]);
        const nextScale = clamp(
          start.camera.scale * (currentDistance / start.distance),
          MIN_SCALE,
          MAX_SCALE,
        );
        const contentX = (start.midpoint.x - start.camera.x) / start.camera.scale;
        const contentY = (start.midpoint.y - start.camera.y) / start.camera.scale;

        setCamera(
          constrainCamera({
            scale: nextScale,
            x: currentMidpoint.x - contentX * nextScale,
            y: currentMidpoint.y - contentY * nextScale,
          }),
        );
        return;
      }

      if (points.length === 1 && dragOrigin && camera.scale > 1) {
        setCamera(
          constrainCamera({
            ...dragOrigin.camera,
            x: dragOrigin.camera.x + point.x - dragOrigin.pointer.x,
            y: dragOrigin.camera.y + point.y - dragOrigin.pointer.y,
          }),
        );
      }
    },
    [camera.scale, constrainCamera, dragOrigin, localPoint],
  );

  const finishPointer = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    activePointers.current.delete(event.pointerId);
    const points = [...activePointers.current.values()];

    if (points.length < 2) {
      gestureRef.current = null;
    }

    if (points.length === 1) {
      setDragOrigin((current) => ({
        pointer: points[0],
        camera: current?.camera ?? camera,
      }));
    } else {
      setDragOrigin(null);
    }
  }, [camera]);

  const renderedDayWidth = dayWidth * camera.scale;
  const renderedDayHeight = dayHeight * camera.scale;
  const renderedTimelineHeight = Math.max(1, (dayHeight - 38) * camera.scale);
  const quarterHourHeight = renderedTimelineHeight / 36;
  const staffWidth =
    calendar.staffs.length > 0
      ? Math.max(1, (dayWidth - 18) / calendar.staffs.length) * camera.scale
      : 0;

  const showFullStaffNames = staffWidth >= 48;
  const showHourlyLabels = quarterHourHeight >= 4;
  const showQuarterHourLines = quarterHourHeight >= 18;

  const timeLabels = showHourlyLabels
    ? [9, 10, 11, 12, 13, 14, 15, 16, 17]
    : [9, 11, 13, 15, 17];

  return (
    <section className="flex min-h-0 flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold">{monthName}</h2>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => zoomAround(camera.scale - SCALE_STEP)}
            className="h-9 w-9 rounded border border-gray-300 bg-white text-lg"
            aria-label="Zoom out"
          >
            -
          </button>

          <input
            aria-label="Calendar zoom"
            type="range"
            min={MIN_SCALE}
            max={MAX_SCALE}
            step="0.01"
            value={camera.scale}
            onChange={(event) => zoomAround(Number(event.target.value))}
            className="w-36"
          />

          <button
            type="button"
            onClick={() => zoomAround(camera.scale + SCALE_STEP)}
            className="h-9 w-9 rounded border border-gray-300 bg-white text-lg"
            aria-label="Zoom in"
          >
            +
          </button>

          <button
            type="button"
            onClick={resetCamera}
            className="rounded border border-gray-300 bg-white px-3 py-2 text-sm"
          >
            Reset
          </button>

          <output className="w-14 text-right text-sm text-gray-600">
            {camera.scale.toFixed(2)}x
          </output>
        </div>
      </div>

      <div
        ref={viewportRef}
        className="relative h-[calc(100dvh-220px)] min-h-[520px] w-full overflow-hidden rounded-xl border border-gray-200 bg-white select-none"
        style={{ touchAction: "none" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={finishPointer}
        onPointerCancel={finishPointer}
      >
        <div
          className="absolute left-0 top-0 will-change-transform"
          style={{
            width: `${canvasWidth}px`,
            height: `${canvasHeight}px`,
            transformOrigin: "0 0",
            transform: `translate3d(${camera.x}px, ${camera.y}px, 0) scale(${camera.scale})`,
          }}
        >
          <div
            className="grid grid-cols-7 bg-gray-100 text-center font-medium"
            style={{ height: `${weekdayHeaderHeight}px` }}
          >
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
              (weekday) => (
                <div
                  key={weekday}
                  className="flex items-center justify-center border-b border-r border-gray-200 text-[10px]"
                >
                  {weekday}
                </div>
              ),
            )}
          </div>

          <div
            className="grid grid-cols-7"
            style={{ height: `${canvasHeight - weekdayHeaderHeight}px` }}
          >
            {monthCells.map((day, cellIndex) => (
              <div
                key={cellIndex}
                className="relative overflow-hidden border-b border-r border-gray-200 bg-white p-1"
                style={{
                  width: `${dayWidth}px`,
                  height: `${dayHeight}px`,
                }}
              >
                {day !== null && (
                  <>
                    <div className="h-5 text-[10px] font-semibold">{day}</div>

                    {calendar.staffs.length === 0 ? (
                      <p className="mt-2 text-center text-[8px] text-gray-400">
                        No staff
                      </p>
                    ) : (
                      <div className="absolute inset-x-1 bottom-1 top-6">
                        <div
                          className="grid h-4"
                          style={{
                            gridTemplateColumns: `18px repeat(${calendar.staffs.length}, minmax(0, 1fr))`,
                          }}
                        >
                          <div />
                          {calendar.staffs.map((staff) => (
                            <div
                              key={staff.id}
                              title={staff.displayName}
                              className="truncate px-px text-center text-[7px] font-semibold"
                            >
                              {showFullStaffNames
                                ? staff.displayName
                                : staff.displayName.slice(0, 3)}
                            </div>
                          ))}
                        </div>

                        <div
                          className="relative grid"
                          style={{
                            height: "calc(100% - 16px)",
                            gridTemplateColumns: `18px repeat(${calendar.staffs.length}, minmax(0, 1fr))`,
                          }}
                        >
                          <div className="relative text-[6px] text-gray-500">
                            {timeLabels.map((hour) => {
                              const top = ((hour * 60 - DEFAULT_OPEN_MINUTE) /
                                (DEFAULT_CLOSE_MINUTE - DEFAULT_OPEN_MINUTE)) *
                                100;
                              return (
                                <span
                                  key={hour}
                                  className="absolute left-0 -translate-y-1/2"
                                  style={{ top: `${top}%` }}
                                >
                                  {String(hour).padStart(2, "0")}
                                </span>
                              );
                            })}
                          </div>

                          {calendar.staffs.map((staff) => {
                            const slots = Array.from({ length: 36 }, (_, index) => {
                              const minute = DEFAULT_OPEN_MINUTE + index * SLOT_MINUTES;
                              return isAvailable(
                                calendar,
                                staff.id,
                                calendar.year,
                                calendar.month,
                                day,
                                minute,
                              );
                            });

                            return (
                              <div
                                key={`${day}-${staff.id}`}
                                className="relative mx-px flex min-w-0 flex-col overflow-hidden border-x border-gray-100"
                              >
                                {slots.map((available, index) => (
                                  <div
                                    key={index}
                                    className={available ? "flex-1 bg-white" : "flex-1 bg-gray-300"}
                                    style={
                                      showQuarterHourLines
                                        ? { borderBottom: "1px solid rgb(229 231 235)" }
                                        : undefined
                                    }
                                  />
                                ))}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        {camera.scale > 1 && (
          <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/70 px-3 py-1 text-xs text-white">
            Drag to pan
          </div>
        )}
      </div>

      <p className="text-xs text-gray-500">
        Pinch to zoom on touch devices. Drag to pan when enlarged.
      </p>
    </section>
  );
}
