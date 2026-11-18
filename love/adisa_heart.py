"""
Adisa ♥  —  a little love letter written in Python.

Scenes:
  1. "Ko si obirin mon ni ta"            (typed out, letter by letter)
  2. "...or will your mom still go to ASALATU to find a wife for you"
     (letters drop in, and a crying face cries a fountain of tears 😭)
  3. "Adisa, forgive me"
  4. A few soft love lines
  5. "The only person you deserve is MEEEEEEE!!!"  (very, very aggressive)
  6. A big heart built entirely out of the name "Adisa"

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
ASALATU_TOP = "...or will your mom still go to"
ASALATU_WORD = "ASALATU"
ASALATU_BOTTOM = "to find a wife for you?"
APOLOGY_LINE = "Adisa, forgive me"
LOVE_LINES = [
    "Mo nifẹ rẹ  ♥",
    "Olólùfẹ mi, you are my peace",
    "Every road I walk leads back to you",
    "You are my today and all my tomorrows",
]
DESERVE_LINE = "The only person you deserve is"
ME_E_COUNT = 8                      # how many E's in MEEEEEEEE
ME_SHOUTS = ["ME", "MEEE", "me!!", "MEEEEE", "MINE", "ME!!!", "meee"]

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
        self.gen = 0
        self.start()

    # ---- scheduling helpers -------------------------------------------
    def after(self, ms, fn):
        """Like root.after, but callbacks from a previous run are ignored."""
        gen = self.gen
        self.root.after(ms, lambda: fn() if gen == self.gen else None)

    def fade(self, item, start, end, steps=20, delay=30, done=None):
        def step(i=0):
            self.canvas.itemconfig(item, fill=blend(start, end, i / steps))
            if i < steps:
                self.after(delay, lambda: step(i + 1))
            elif done:
                done()
        step()

    def typewrite(self, item, text, delay=90, done=None):
        def step(i=0):
            cursor = "|" if i < len(text) else ""
            self.canvas.itemconfig(item, text=text[:i] + cursor)
            if i < len(text):
                self.after(delay, lambda: step(i + 1))
            elif done:
                done()
        step()

    def clear(self):
        self.canvas.delete("all")
        self.canvas.config(bg=BG)

    # ---- scene control -------------------------------------------------
    def start(self):
        self.gen += 1
        self.clear()
        self.after(600, self.scene_opening)

    # Scene 1: typewriter ------------------------------------------------
    def scene_opening(self):
        item = self.canvas.create_text(WIDTH / 2, HEIGHT / 2, text="",
                                       fill="#ff4d6d",
                                       font=(FONT_FAMILY, 40, "bold"))
        self.typewrite(item, OPENING_LINE, delay=110,
                       done=lambda: self.after(1800, lambda: self.fade(
                           item, "#ff4d6d", BG,
                           done=lambda: self.after(300, self.scene_asalatu))))

    # Scene 2: Asalatu + crying face ---------------------------------------
    def scene_asalatu(self):
        self.clear()
        c = self.canvas
        top = c.create_text(WIDTH / 2, 110, text=ASALATU_TOP, fill=BG,
                            font=(FONT_FAMILY, 30, "italic"))
        self.fade(top, BG, "#ffb3c1", steps=15, delay=30,
                  done=lambda: self.after(200, lambda: self.drop_letters(
                      ASALATU_WORD, 210,
                      done=lambda: self.after(200, bottom_line))))

        def bottom_line():
            bot = c.create_text(WIDTH / 2, 305, text=ASALATU_BOTTOM, fill=BG,
                                font=(FONT_FAMILY, 30, "italic"))
            self.fade(bot, BG, "#ffb3c1", steps=15, delay=30,
                      done=lambda: self.crying_face(WIDTH / 2, 560, 115,
                                                    seconds=4.5,
                                                    done=self.scene_apology))

    def drop_letters(self, word, target_y, done=None):
        """Each letter falls from the sky and bounces into place."""
        size = 78
        font = tkfont.Font(family=FONT_FAMILY, size=size, weight="bold")
        total = font.measure(word) + 8 * (len(word) - 1)
        x = WIDTH / 2 - total / 2
        letters = []
        for ch in word:
            w = font.measure(ch)
            shadow = self.canvas.create_text(x + w / 2 + 5, -80, text=ch,
                                             fill="#0b5d1e",
                                             font=(FONT_FAMILY, size, "bold"))
            main = self.canvas.create_text(x + w / 2, -85, text=ch,
                                           fill="#ffd54f",
                                           font=(FONT_FAMILY, size, "bold"))
            letters.append((shadow, main))
            x += w + 8

        def fall(i):
            if i >= len(letters):
                if done:
                    self.after(250, done)
                return
            shadow, main = letters[i]
            state = {"y": -85.0, "v": 0.0, "bounces": 0}

            def tick():
                state["v"] += 3.2
                state["y"] += state["v"]
                if state["y"] >= target_y:
                    state["y"] = target_y
                    state["v"] = -state["v"] * 0.45
                    state["bounces"] += 1
                for item, dx, dy in ((shadow, 5, 5), (main, 0, 0)):
                    x0 = self.canvas.coords(item)[0]
                    self.canvas.coords(item, x0, state["y"] + dy)
                if state["bounces"] < 3:
                    self.after(16, tick)
                else:
                    self.canvas.coords(main, self.canvas.coords(main)[0], target_y)
                    self.canvas.coords(shadow, self.canvas.coords(shadow)[0], target_y + 5)
            tick()
            self.after(110, lambda: fall(i + 1))
        fall(0)

    def crying_face(self, cx, cy, r, seconds, done):
        """A sobbing face with two fountains of tears. 😭"""
        c = self.canvas
        tag = "face"
        c.create_oval(cx - r, cy - r, cx + r, cy + r, fill="#ffcc33",
                      outline="#e6a700", width=4, tags=tag)
        # squeezed-shut eyes (∩ shapes) and worried brows
        for side in (-1, 1):
            ex = cx + side * r * 0.42
            ey = cy - r * 0.18
            c.create_arc(ex - r * 0.2, ey - r * 0.12, ex + r * 0.2, ey + r * 0.16,
                         start=0, extent=180, style="arc", width=7,
                         outline="#5a3200", tags=tag)
            c.create_line(ex - side * r * 0.22, ey - r * 0.40,
                          ex + side * r * 0.18, ey - r * 0.26,
                          width=7, fill="#5a3200", capstyle="round", tags=tag)
        mouth = c.create_oval(cx - r * 0.42, cy + r * 0.2, cx + r * 0.42,
                              cy + r * 0.72, fill="#4a1c00", outline="", tags=tag)
        tongue = c.create_oval(cx - r * 0.25, cy + r * 0.5, cx + r * 0.25,
                               cy + r * 0.72, fill="#ff6f7d", outline="", tags=tag)

        tears = []
        end_frame = int(seconds * 1000 / 30)

        def frame(n=0):
            # sob: the whole face bobs and the mouth wobbles
            bob = 6 if (n // 4) % 2 == 0 else -6
            c.move(tag, 0, bob if n % 4 == 0 else 0)
            fy = c.coords(mouth)[1]
            wob = r * (0.5 + 0.08 * math.sin(n / 1.5))
            c.coords(mouth, cx - r * 0.42, fy, cx + r * 0.42, fy + wob)
            c.coords(tongue, cx - r * 0.25, fy + wob - r * 0.22,
                     cx + r * 0.25, fy + wob)
            face_y = c.coords(tag)[1] + r  # centre after bobbing
            # spawn tears from the outer corner of each eye
            if n < end_frame:
                for side in (-1, 1):
                    for _ in range(2):
                        tx = cx + side * r * 0.6
                        ty = face_y - r * 0.12
                        s = random.uniform(5, 9)
                        t = c.create_oval(tx - s, ty - s, tx + s, ty + s * 1.4,
                                          fill=random.choice(["#4fc3f7", "#29b6f6", "#81d4fa"]),
                                          outline="")
                        tears.append([t, side * random.uniform(5, 11),
                                      random.uniform(-9, -4)])
            # move tears with gravity
            for tear in tears[:]:
                item, vx, vy = tear
                tear[2] = vy + 0.9
                c.move(item, vx, tear[2])
                if c.coords(item)[1] > HEIGHT + 20:
                    c.delete(item)
                    tears.remove(tear)
            if n < end_frame or tears:
                self.after(30, lambda: frame(n + 1))
            else:
                self.after(300, done)
        frame()

    # Scene 3: apology ----------------------------------------------------
    def scene_apology(self):
        self.clear()
        item = self.canvas.create_text(WIDTH / 2, HEIGHT / 2, text=APOLOGY_LINE,
                                       fill=BG, font=(FONT_FAMILY, 54, "bold"))
        self.fade(item, BG, "#ff2b4a", steps=30, delay=40,
                  done=lambda: self.after(2500, lambda: self.fade(
                      item, "#ff2b4a", BG,
                      done=lambda: self.after(300, lambda: self.scene_love(0)))))

    # Scene 4: love lines, one after another -------------------------------
    def scene_love(self, idx):
        self.clear()
        if idx >= len(LOVE_LINES):
            self.after(300, self.scene_me)
            return
        item = self.canvas.create_text(WIDTH / 2, HEIGHT / 2, text=LOVE_LINES[idx],
                                       fill=BG, font=(FONT_FAMILY, 34, "italic"))
        self.fade(item, BG, "#ff8fa3", steps=20, delay=35,
                  done=lambda: self.after(1500, lambda: self.fade(
                      item, "#ff8fa3", BG, steps=15,
                      done=lambda: self.scene_love(idx + 1))))

    # Scene 5: MEEEEEEEE --------------------------------------------------
    def scene_me(self):
        self.clear()
        c = self.canvas
        line = c.create_text(WIDTH / 2, 230, text="", fill="#ffb3c1",
                             font=(FONT_FAMILY, 36, "bold"))
        base = (WIDTH / 2, 460)
        shadow = c.create_text(base[0] + 7, base[1] + 7, text="", fill="#5c0011")
        main = c.create_text(*base, text="", fill="#ff1744")

        def fit_size(text, start=170):
            size = start
            while size > 20:
                if tkfont.Font(family=FONT_FAMILY, size=size,
                               weight="bold").measure(text) <= WIDTH * 0.9:
                    return size
                size -= 4
            return size

        def set_word(text, size):
            for item in (shadow, main):
                c.itemconfig(item, text=text, font=(FONT_FAMILY, size, "bold"))

        def shake(amount):
            dx, dy = random.uniform(-amount, amount), random.uniform(-amount, amount)
            c.coords(main, base[0] + dx, base[1] + dy)
            c.coords(shadow, base[0] + dx + 7, base[1] + dy + 7)
            c.coords(line, WIDTH / 2 + dx * 0.4, 230 + dy * 0.4)

        # build the word up one E at a time, getting louder each step
        def grow(n=0):
            word = "M" + "E" * n
            size = min(60 + n * 12, fit_size(word + "!!!"))
            set_word(word, size)
            c.config(bg="#4a0010")
            self.after(60, lambda: c.config(bg=BG))
            jiggle(n * 2.5 + 3, 5)
            if n < ME_E_COUNT:
                self.after(190 if n else 500, lambda: grow(n + 1))
            else:
                self.after(250, slam)

        def jiggle(amount, times):
            if times > 0:
                shake(amount)
                self.after(30, lambda: jiggle(amount, times - 1))
            else:
                shake(0)

        def slam():
            word = "M" + "E" * ME_E_COUNT + "!!!"
            set_word(word, fit_size(word))
            c.itemconfig(main, fill="#ffffff")
            rampage(0)

        particles = []

        def rampage(n):
            shake(22)
            c.config(bg="#8b0000" if n % 4 < 2 else "#1a0005")
            c.itemconfig(main, fill="#ffffff" if n % 4 < 2 else "#ff1744")
            # throw little "ME"s out of the screen
            for _ in range(1 + n % 2):
                ang = random.uniform(0, 2 * math.pi)
                spd = random.uniform(10, 22)
                p = c.create_text(*base, text=random.choice(ME_SHOUTS),
                                  fill=random.choice(["#ffffff", "#ff1744", "#ffb3c1", "#ff8a80"]),
                                  font=(FONT_FAMILY, random.randint(14, 34), "bold"))
                c.tag_lower(p, shadow)
                particles.append([p, math.cos(ang) * spd, math.sin(ang) * spd])
            for part in particles[:]:
                item, vx, vy = part
                c.move(item, vx, vy)
                x, y = c.coords(item)
                if not (-100 < x < WIDTH + 100 and -100 < y < HEIGHT + 100):
                    c.delete(item)
                    particles.remove(part)
            if n < 80:
                self.after(30, lambda: rampage(n + 1))
            else:
                self.after(400, calm_down)

        def calm_down():
            self.clear()
            note = c.create_text(WIDTH / 2, HEIGHT / 2, text="*clears throat*  ...anyway",
                                 fill=BG, font=(FONT_FAMILY, 26, "italic"))
            self.fade(note, BG, "#9e9e9e", steps=15, delay=40,
                      done=lambda: self.after(1200, lambda: self.fade(
                          note, "#9e9e9e", BG, steps=12,
                          done=lambda: self.after(300, self.scene_heart))))

        self.typewrite(line, DESERVE_LINE, delay=70,
                       done=lambda: self.after(700, grow))

    # Scene 6: the heart made of "Adisa" -----------------------------------
    def scene_heart(self):
        self.clear()
        words = self.layout_heart()
        random.shuffle(words)

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
