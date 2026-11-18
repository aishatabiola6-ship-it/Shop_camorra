"""
Adisa ♥  —  a little love letter written in Python.

Scenes:
  1. "Ko si obirin mon ni ta"   (typed out, letter by letter)
  2. "Adisa, forgive me"
  3. A few soft love lines
  4. A big heart built entirely out of the name "Adisa"

Run:  python adisa_heart.py
Needs only the Python standard library (tkinter).
Press Esc to close, R to replay.
"""

import math
import random
import tkinter as tk
import tkinter.font as tkfont

# ---------------------------------------------------------------- settings
WIDTH, HEIGHT = 1000, 800
BG = "#000000"
NAME = "Adisa"
FONT_FAMILY = "Helvetica"

OPENING_LINE = "Ko si obirin mon ni ta"
APOLOGY_LINE = "Adisa, forgive me"
LOVE_LINES = [
    "Mo nifẹ rẹ  ♥",
    "Olólùfẹ mi, you are my peace",
    "Every road I walk leads back to you",
    "You are my today and all my tomorrows",
    "My heart only knows one name...",
]

# shades of red / pink for the heart words
HEART_COLORS = ["#ff2b4a", "#ff4d6d", "#e01e37", "#ff6b81", "#ff1744", "#ff3b5c"]

# ---------------------------------------------------------------- helpers


def hex_to_rgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def blend(c1, c2, t):
    """Mix colour c1 -> c2 by t (0..1)."""
    a, b = hex_to_rgb(c1), hex_to_rgb(c2)
    return "#%02x%02x%02x" % tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))


def heart_outline(cx, cy, scale, n=400):
    """Parametric heart: x = 16 sin³t, y = 13 cos t - 5 cos 2t - 2 cos 3t - cos 4t."""
    pts = []
    for i in range(n):
        t = 2 * math.pi * i / n
        x = 16 * math.sin(t) ** 3
        y = 13 * math.cos(t) - 5 * math.cos(2 * t) - 2 * math.cos(3 * t) - math.cos(4 * t)
        pts.append((cx + x * scale, cy - y * scale))
    return pts


def inside_polygon(px, py, poly):
    """Ray-casting point-in-polygon test."""
    inside = False
    j = len(poly) - 1
    for i in range(len(poly)):
        xi, yi = poly[i]
        xj, yj = poly[j]
        if (yi > py) != (yj > py) and px < (xj - xi) * (py - yi) / (yj - yi) + xi:
            inside = not inside
        j = i
    return inside


# ---------------------------------------------------------------- the show


class LoveLetter:
    def __init__(self, root):
        self.root = root
        root.title("For Adisa ♥")
        root.configure(bg=BG)
        self.canvas = tk.Canvas(root, width=WIDTH, height=HEIGHT, bg=BG,
                                highlightthickness=0)
        self.canvas.pack(fill="both", expand=True)
        root.bind("<Escape>", lambda e: root.destroy())
        root.bind("<r>", lambda e: self.start())
        self.job = None
        self.start()

    # ---- scheduling helpers -------------------------------------------
    def after(self, ms, fn):
        self.job = self.root.after(ms, fn)

    def fade(self, item, start, end, steps=20, delay=30, done=None):
        def step(i=0):
            self.canvas.itemconfig(item, fill=blend(start, end, i / steps))
            if i < steps:
                self.after(delay, lambda: step(i + 1))
            elif done:
                done()
        step()

    # ---- scene control -------------------------------------------------
    def start(self):
        if self.job:
            self.root.after_cancel(self.job)
        self.canvas.delete("all")
        self.after(600, self.scene_opening)

    # Scene 1: typewriter
    def scene_opening(self):
        item = self.canvas.create_text(WIDTH / 2, HEIGHT / 2, text="",
                                       fill="#ff4d6d",
                                       font=(FONT_FAMILY, 40, "bold"))

        def type_char(i=0):
            cursor = "|" if i < len(OPENING_LINE) else ""
            self.canvas.itemconfig(item, text=OPENING_LINE[:i] + cursor)
            if i < len(OPENING_LINE):
                self.after(110, lambda: type_char(i + 1))
            else:
                self.after(2200, lambda: self.fade(
                    item, "#ff4d6d", BG,
                    done=lambda: self.after(300, self.scene_apology)))
        type_char()

    # Scene 2: apology
    def scene_apology(self):
        self.canvas.delete("all")
        item = self.canvas.create_text(WIDTH / 2, HEIGHT / 2, text=APOLOGY_LINE,
                                       fill=BG, font=(FONT_FAMILY, 54, "bold"))
        self.fade(item, BG, "#ff2b4a", steps=30, delay=40,
                  done=lambda: self.after(2500, lambda: self.fade(
                      item, "#ff2b4a", BG,
                      done=lambda: self.after(300, lambda: self.scene_love(0)))))

    # Scene 3: love lines, one after another
    def scene_love(self, idx):
        self.canvas.delete("all")
        if idx >= len(LOVE_LINES):
            self.after(300, self.scene_heart)
            return
        item = self.canvas.create_text(WIDTH / 2, HEIGHT / 2, text=LOVE_LINES[idx],
                                       fill=BG, font=(FONT_FAMILY, 34, "italic"))
        self.fade(item, BG, "#ff8fa3", steps=20, delay=35,
                  done=lambda: self.after(1500, lambda: self.fade(
                      item, "#ff8fa3", BG, steps=15,
                      done=lambda: self.scene_love(idx + 1))))

    # Scene 4: the heart made of "Adisa"
    def scene_heart(self):
        self.canvas.delete("all")
        words = self.layout_heart()
        random.shuffle(words)
        # reveal roughly from the bottom tip upward feels nice, but random
        # sparkle looks closer to the video — keep it random.

        def reveal(i=0):
            if i < len(words):
                item, color = words[i]
                self.canvas.itemconfig(item, state="normal")
                self.fade(item, BG, color, steps=6, delay=25)
                self.after(18, lambda: reveal(i + 1))
            else:
                self.after(800, lambda: self.heartbeat(words))
        reveal()

    def layout_heart(self):
        """Pack as many 'Adisa' words as fit inside the heart shape."""
        cx, cy = WIDTH / 2, HEIGHT / 2 - 10
        scale = min(WIDTH, HEIGHT) / 37          # heart is ~34 units tall
        poly = heart_outline(cx, cy, scale)
        min_x = min(p[0] for p in poly); max_x = max(p[0] for p in poly)
        min_y = min(p[1] for p in poly); max_y = max(p[1] for p in poly)
        placed_boxes = []
        words = []
        pad = 2

        def fits(box):
            x1, y1, x2, y2 = box
            pts = [(x1, y1), (x2, y1), (x1, y2), (x2, y2),
                   ((x1 + x2) / 2, y1), ((x1 + x2) / 2, y2)]
            if not all(inside_polygon(x, y, poly) for x, y in pts):
                return False
            for bx1, by1, bx2, by2 in placed_boxes:
                if x1 < bx2 + pad and x2 > bx1 - pad and y1 < by2 + pad and y2 > by1 - pad:
                    return False
            return True

        fonts = {}

        def measure(size, weight):
            key = (size, weight)
            if key not in fonts:
                f = tkfont.Font(family=FONT_FAMILY, size=size, weight=weight)
                fonts[key] = (f.measure(NAME), f.metrics("ascent") + f.metrics("descent"))
            return fonts[key]

        def place(x, y, size, weight):
            w, h = measure(size, weight)
            box = (x - w / 2, y - h / 2, x + w / 2, y + h / 2)
            if not fits(box):
                return None
            placed_boxes.append(box)
            item = self.canvas.create_text(x, y, text=NAME, fill=BG, state="hidden",
                                           font=(FONT_FAMILY, size, weight))
            words.append((item, random.choice(HEART_COLORS)))
            return w

        # 1) walk the heart row by row, laying words side by side
        row_h = 23
        y = min_y + 8
        while y < max_y:
            x = min_x
            while x < max_x:
                size = random.choice([9, 10, 11, 12, 13, 14, 15, 16, 18])
                weight = random.choice(["bold", "bold", "normal"])
                w, _ = measure(size, weight)
                jitter = random.uniform(-2, 2)
                if place(x + w / 2, y + jitter, size, weight):
                    x += w + random.uniform(5, 12)
                else:
                    x += 3
            y += row_h

        # 2) sprinkle tiny ones into any gaps left over
        for _ in range(3000):
            place(random.uniform(min_x, max_x), random.uniform(min_y, max_y),
                  random.choice([7, 8, 9]), "normal")
        return words

    def heartbeat(self, words, beat=0):
        """Gently pulse the heart's colour, forever."""
        bright = beat % 2 == 0
        for item, color in words:
            self.canvas.itemconfig(item, fill=blend(color, "#ffffff", 0.35) if bright else color)
        self.after(180 if bright else 700, lambda: self.heartbeat(words, beat + 1))


if __name__ == "__main__":
    root = tk.Tk()
    root.geometry(f"{WIDTH}x{HEIGHT}")
    LoveLetter(root)
    root.mainloop()
