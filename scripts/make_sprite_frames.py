"""
Generates 7 halftoned sprite frames from a single source line-art image.
Usage: python make_sprite_frames.py <source.png> <output_dir>
"""
import sys, os
from PIL import Image, ImageDraw

BG = (13, 12, 10)
DOT = (232, 224, 201)
SIZE = 420
CELL = 6

# eye/mouth coords are calibrated to one specific source image.
# recalibrate these if the source art changes.
LEFT_EYE = (136, 172)
RIGHT_EYE = (218, 170)
MOUTH = (183, 196)


def make_frame(src, scale_y=1.0, shift_y=0, mouth_open=False, blink=False):
    im = src.copy()
    if scale_y != 1.0:
        new_h = int(SIZE * scale_y)
        resized = im.resize((SIZE, new_h), Image.LANCZOS)
        canvas = Image.new('RGB', (SIZE, SIZE), (255, 255, 255))
        canvas.paste(resized, (0, SIZE - new_h))  # anchor bottom (feet stay planted)
        im = canvas
    if shift_y != 0:
        canvas = Image.new('RGB', (SIZE, SIZE), (255, 255, 255))
        canvas.paste(im, (0, shift_y))
        im = canvas

    d = ImageDraw.Draw(im)
    if blink:
        skin = (250, 244, 232)
        for ex, ey in (LEFT_EYE, RIGHT_EYE):
            d.ellipse([ex - 11, ey - 11, ex + 11, ey + 11], fill=skin)
            d.line([ex - 7, ey, ex + 7, ey], fill=(30, 22, 15), width=3)
    if mouth_open:
        mx, my = MOUTH
        d.ellipse([mx - 10, my - 7, mx + 10, my + 8], fill=(25, 18, 12))
    return im


def halftone(im):
    gray = im.convert('L')
    cols, rows = SIZE // CELL, SIZE // CELL
    grid = gray.resize((cols, rows), Image.BOX).load()

    out = Image.new('RGBA', (SIZE, SIZE), (0, 0, 0, 0))
    draw = ImageDraw.Draw(out)
    max_r = CELL / 2 * 0.95

    for gy in range(rows):
        for gx in range(cols):
            b = grid[gx, gy]
            t = (1 - b / 255) ** 0.8  # darker source = bigger dot
            r = max_r * t
            if r < 0.4:
                continue
            cx, cy = gx * CELL + CELL / 2, gy * CELL + CELL / 2
            draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(*DOT, 255))
    return out


FRAME_SPECS = {
    'idle1': dict(scale_y=1.0,   shift_y=0),
    'idle2': dict(scale_y=0.985, shift_y=0),
    'idle3': dict(scale_y=1.015, shift_y=0),
    'blink': dict(scale_y=1.0,   shift_y=0, blink=True),
    'talk1': dict(scale_y=1.0,   shift_y=-3),
    'talk2': dict(scale_y=1.0,   shift_y=-3, mouth_open=True),
    'talk3': dict(scale_y=0.99,  shift_y=-1, mouth_open=True),
}


def main():
    if len(sys.argv) != 3:
        print("usage: python make_sprite_frames.py <source.png> <output_dir>")
        sys.exit(1)

    src_path, out_dir = sys.argv[1], sys.argv[2]
    os.makedirs(out_dir, exist_ok=True)

    src = Image.open(src_path).convert('RGB').resize((SIZE, SIZE), Image.LANCZOS)

    for name, spec in FRAME_SPECS.items():
        frame = make_frame(src, **spec)
        ht = halftone(frame)
        out_path = os.path.join(out_dir, f'{name}.png')
        ht.save(out_path)
        print(f'wrote {out_path}')


if __name__ == '__main__':
    main()
