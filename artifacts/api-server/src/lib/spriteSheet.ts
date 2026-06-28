import sharp from "sharp";

/** A single extracted frame from a sprite sheet. */
export interface SheetFrame {
  index: number;
  row: number;
  col: number;
  buffer: Buffer;
}

export interface SliceOptions {
  rows: number;
  cols: number;
  /** Outer padding around the whole sheet, in pixels. */
  margin?: number;
  /** Gutter between adjacent cells, in pixels. */
  spacing?: number;
}

export interface SliceResult {
  frames: SheetFrame[];
  frameWidth: number;
  frameHeight: number;
  rows: number;
  cols: number;
  sheetWidth: number;
  sheetHeight: number;
}

/**
 * Upper bound on decoded source pixels. Generated sheets are <= ~1536px per side
 * (~2.4MP); this 64MP ceiling bounds memory/CPU if a larger or legacy image ever
 * reaches this path, so an unbounded decode can't exhaust the server.
 */
const MAX_SHEET_PIXELS = 64_000_000;

/**
 * Slice a sprite sheet into a deterministic rows x cols grid of PNG frames.
 *
 * The grid is explicit (caller-supplied) rather than auto-detected: AI-generated
 * sheets do not have reliable, machine-readable cell boundaries, so honest,
 * predictable slicing comes from an explicit grid the caller controls. Each
 * frame is emitted as PNG to preserve any transparency in the source.
 */
export async function sliceSheet(source: Buffer, opts: SliceOptions): Promise<SliceResult> {
  const margin = Math.max(0, Math.floor(opts.margin ?? 0));
  const spacing = Math.max(0, Math.floor(opts.spacing ?? 0));
  const rows = Math.floor(opts.rows);
  const cols = Math.floor(opts.cols);

  if (rows < 1 || cols < 1) {
    throw new Error("rows and cols must be at least 1");
  }

  const base = sharp(source, { failOn: "none", limitInputPixels: MAX_SHEET_PIXELS });
  const meta = await base.metadata();
  const sheetWidth = meta.width ?? 0;
  const sheetHeight = meta.height ?? 0;
  if (!sheetWidth || !sheetHeight) {
    throw new Error("Could not read source image dimensions");
  }
  if (sheetWidth * sheetHeight > MAX_SHEET_PIXELS) {
    throw new Error("Source image is too large to slice");
  }

  const frameWidth = Math.floor((sheetWidth - 2 * margin - (cols - 1) * spacing) / cols);
  const frameHeight = Math.floor((sheetHeight - 2 * margin - (rows - 1) * spacing) / rows);
  if (frameWidth <= 0 || frameHeight <= 0) {
    throw new Error("Grid is too fine for the source image dimensions");
  }

  const frames: SheetFrame[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const left = margin + c * (frameWidth + spacing);
      const top = margin + r * (frameHeight + spacing);
      // Clamp to image bounds to avoid sharp extract_area errors from rounding.
      const width = Math.min(frameWidth, sheetWidth - left);
      const height = Math.min(frameHeight, sheetHeight - top);
      if (width <= 0 || height <= 0) continue;
      const buffer = await base
        .clone()
        .extract({ left, top, width, height })
        .png()
        .toBuffer();
      frames.push({ index: r * cols + c, row: r, col: c, buffer });
    }
  }

  return { frames, frameWidth, frameHeight, rows, cols, sheetWidth, sheetHeight };
}
