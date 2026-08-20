"""Extract the animal photos from the flat Guardian carousel mocks.

Each carousel slide in Figma ("Placeholder for HeroCarousel") is a single flat
image with the badges, cards and headline baked into the pixels. To keep the
same animals while rebuilding the overlays as real components, we crop the
regions of those images that contain nothing but photo.

Boxes are left, top, right, bottom in the 1086x1448 source exported by Figma.
Run with the sources in .figma-refs/raw/ as comp1.png, comp2.png and comp3.png.
"""
from PIL import Image
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW = os.path.join(ROOT, ".figma-refs", "raw")
OUT = os.path.join(ROOT, "public", "assets")

JOBS = [
    ("comp1.png", (283, 0, 1086, 778), 720, "guardian-urgent.jpg"),
    ("comp3.png", (0, 0, 570, 975), 570, "guardian-reports.jpg"),
    ("comp1.png", (596, 805, 699, 908), 103, "guardian-milo.jpg"),
    ("comp2.png", (790, 648, 988, 815), 198, "guardian-luna.jpg"),
    ("comp3.png", (628, 340, 773, 509), 145, "guardian-report-luna.jpg"),
    ("comp3.png", (628, 598, 773, 767), 145, "guardian-report-milo.jpg"),
    ("comp3.png", (628, 849, 773, 1018), 145, "guardian-report-rocky.jpg"),
]

for source, box, max_width, name in JOBS:
    image = Image.open(os.path.join(RAW, source)).convert("RGB")
    crop = image.crop(box)
    if crop.size[0] > max_width:
        height = round(crop.size[1] * max_width / crop.size[0])
        crop = crop.resize((max_width, height), Image.LANCZOS)
    crop.save(os.path.join(OUT, name), quality=88, optimize=True)
    print(f"{name}: {crop.size[0]}x{crop.size[1]} from {source} {box}")
