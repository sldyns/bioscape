"""Build directory previews from reviewed, browser-rendered model screenshots.

Usage: python3 scripts/build-rendered-thumbnails.py /path/to/reviewed-captures
Each <id>.png needs a matching JSON containing the DOM-observed studio bounds.
Requires Pillow; screenshots are captured separately through the browser tool.
"""
import json
import sys
from pathlib import Path
from PIL import Image, ImageChops

captures = Path(sys.argv[1])
output = Path(__file__).resolve().parent.parent / 'public/process-thumbnails/rendered'
output.mkdir(parents=True, exist_ok=True)
for source in sorted(captures.glob('*.png')):
    rect = json.loads(source.with_suffix('.json').read_text())
    image = Image.open(source).convert('RGB')
    image = image.crop((round(rect['x']), round(rect['y']),
                        round(rect['x'] + rect['width']), round(rect['y'] + rect['height'])))
    background = image.getpixel((0, 0))
    difference = ImageChops.difference(image, Image.new('RGB', image.size, background))
    mask = difference.convert('L').point(lambda value: 255 if value > 10 else 0)
    bounds = mask.getbbox()
    if not bounds:
        raise ValueError(f'Empty model preview: {source.stem}')
    # Preserve every meaningful visible feature. Normalized breathing room gives
    # wide molecular scenes and tall organisms a consistent square card.
    left, top, right, bottom = bounds
    pad = 12
    image = image.crop((max(0, left-pad), max(0, top-pad),
                        min(image.width, right+pad), min(image.height, bottom+pad)))
    image.thumbnail((576, 576), Image.Resampling.LANCZOS)
    if max(image.size) < 576:
        ratio = 576 / max(image.size)
        image = image.resize((round(image.width*ratio), round(image.height*ratio)), Image.Resampling.LANCZOS)
    card = Image.new('RGB', (640, 640), background)
    card.paste(image, ((640-image.width)//2, (640-image.height)//2))
    card.save(output / f'{source.stem}.webp', quality=91, method=6)
print(f'{len(list(captures.glob("*.png")))} model renders written to {output}')
