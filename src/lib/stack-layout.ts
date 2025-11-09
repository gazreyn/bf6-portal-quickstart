type Size = { width: number; height: number };
export type StackItem<T = string> = {
  id?: T;
  size: Size;
  grow?: number; // proportional share of leftover space along the main axis
};
type SlackAlign = "start" | "center" | "end" | "stretch";

type StackLayoutOptions = {
  direction?: "vertical" | "horizontal"; // default vertical
  gap?: number;                           // space between items in a line
  crossGap?: number;                      // space between lines
  padding?: number | { top?: number; right?: number; bottom?: number; left?: number };
  align?: SlackAlign;                     // cross axis alignment inside a line
  wrap?: "nowrap" | "wrap";               // default nowrap
  containerWidth?: number | "auto";       // authoritative when direction=horizontal
  containerHeight?: number | "auto";      // authoritative when direction=vertical
  roundPixels?: boolean;                  // default true
};

export type StackFrame<T = string> = { id?: T; x: number; y: number; width: number; height: number };
export type StackLayoutResult<T = string> = { container: Size; frames: StackFrame<T>[]; maxItemsFit: number };

export function stackLayout<T = string>(items: StackItem<T>[], opts: StackLayoutOptions = {}): StackLayoutResult<T> {
  const {
    direction = "vertical",
    gap = 0,
    crossGap = 0,
    padding = 0,
    align = "start",
    wrap = "nowrap",
    containerWidth = "auto",
    containerHeight = "auto",
    roundPixels = true,
  } = opts;

  const norm = items;

  const pad = typeof padding === "number"
    ? { top: padding, right: padding, bottom: padding, left: padding }
    : { top: 0, right: 0, bottom: 0, left: 0, ...padding };

  const isVert = direction === "vertical";
  const getMain = (s: Size) => (isVert ? s.height : s.width);
  const getCross = (s: Size) => (isVert ? s.width : s.height);

  const providedMain =
    isVert
      ? (typeof containerHeight === "number" ? containerHeight : undefined)
      : (typeof containerWidth === "number" ? containerWidth : undefined);

  const contentMaxMain =
    providedMain != null
      ? Math.max(0, providedMain - (isVert ? pad.top + pad.bottom : pad.left + pad.right))
      : Infinity;

  type Line = { items: { idx: number; size: Size }[]; main: number; cross: number };
  const lines: Line[] = [];
  let current: Line = { items: [], main: 0, cross: 0 };

  const pushLine = () => {
    if (current.items.length) lines.push(current);
    current = { items: [], main: 0, cross: 0 };
  };

  for (let i = 0; i < norm.length; i++) {
    const size = norm[i].size;
    const m = getMain(size);
    const c = getCross(size);
    const nextMain = current.items.length ? current.main + gap + m : m;

    if (wrap === "wrap" && nextMain > contentMaxMain && current.items.length) {
      pushLine();
      current.items.push({ idx: i, size });
      current.main = m;
      current.cross = Math.max(current.cross, c);
    } else {
      current.items.push({ idx: i, size });
      current.main = nextMain;
      current.cross = Math.max(current.cross, c);
    }
  }
  pushLine();

  const maxMainAcross = lines.reduce((m, ln) => Math.max(m, ln.main), 0);
  const totalCross = lines.reduce((s, ln) => s + ln.cross, 0) + Math.max(0, lines.length - 1) * crossGap;

  const padMainStart = isVert ? pad.top : pad.left;
  const padMainEnd = isVert ? pad.bottom : pad.right;
  const padCrossStart = isVert ? pad.left : pad.top;
  const padCrossEnd = isVert ? pad.right : pad.bottom;

  const autoMain = padMainStart + padMainEnd + maxMainAcross;
  const autoCross = padCrossStart + padCrossEnd + totalCross;

  const finalWidth =
    typeof containerWidth === "number"
      ? containerWidth
      : (isVert ? autoCross : autoMain);

  const finalHeight =
    typeof containerHeight === "number"
      ? containerHeight
      : (isVert ? autoMain : autoCross);

  const px = (n: number) => (roundPixels ? Math.round(n) : n);

  const frames: StackFrame<T>[] = new Array(norm.length);
  let crossLineOffset = padCrossStart;
  const constrainedMain = Number.isFinite(contentMaxMain) ? contentMaxMain : undefined;

  for (const line of lines) {
    const lineCross = line.cross;
    const lineGrowTotal = line.items.reduce((sum, { idx }) => sum + (norm[idx].grow ?? 0), 0);
    const extraMain = lineGrowTotal > 0 && constrainedMain != null
      ? Math.max(0, constrainedMain - line.main)
      : 0;
    let cursor = padMainStart;

    for (const { idx, size } of line.items) {
      const item = norm[idx];
      const growShare = lineGrowTotal > 0 ? (item.grow ?? 0) / lineGrowTotal : 0;
      const itemMain = getMain(size) + extraMain * growShare;
      const itemCross = getCross(size);

      const crossSpace = Math.max(0, lineCross - itemCross);
      let crossOffset = 0;
      let w = isVert ? itemCross : itemMain;
      let h = isVert ? itemMain : itemCross;

      if (align === "center") crossOffset = crossSpace / 2;
      else if (align === "end") crossOffset = crossSpace;
      else if (align === "stretch") {
        if (isVert) w = lineCross;
        else h = lineCross;
        crossOffset = 0;
      }

      const mainPos = cursor;
      const crossPos = crossLineOffset + crossOffset;

      const x = isVert ? px(crossPos) : px(mainPos);
      const y = isVert ? px(mainPos) : px(crossPos);

  frames[idx] = { id: item.id, x, y, width: px(w), height: px(h) };
      cursor += itemMain + gap;
    }

    crossLineOffset += lineCross + crossGap;
  }

  const containerWidthPx = px(finalWidth);
  const containerHeightPx = px(finalHeight);
  const eps = 1e-6;
  let maxItemsFit = 0;

  for (let i = 0; i < frames.length; i++) {
    const frame = frames[i];
    if (!frame) break;

    const fits =
      frame.x >= -eps &&
      frame.y >= -eps &&
      frame.x + frame.width <= containerWidthPx + eps &&
      frame.y + frame.height <= containerHeightPx + eps;

    if (!fits) break;
    maxItemsFit = i + 1;
  }

  return {
    container: { width: containerWidthPx, height: containerHeightPx },
    frames,
    maxItemsFit,
  };
}