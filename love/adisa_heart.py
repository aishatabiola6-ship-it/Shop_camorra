"""
Adisa ♥  —  a little love letter written in Python.

Scenes:
  0. A pink envelope with a heart wax seal — click it to open
  1. "Ko si obirin mon ni ta"            (typed out, letter by letter)
  2. "...or will your mom still go to ASALATU to find a wife for you"
     (letters drop in, and a crying face cries a fountain of tears 😭)
  3. "Adisa, forgive me"
  4. A few soft love lines
  5. "The only person you deserve is MEEEEEEE!!!"  (very, very aggressive)
  6. A big heart built entirely out of the name "Adisa"
  7. "I LOVE YOU ADISA" written in fire by a spark
  8. A glowing lotus blooming inside a sparkly orb
  9. A magic blue heart over a glowing pool that melts and rebuilds forever

Run:  python adisa_heart.py
Needs only the Python standard library (tkinter).
Press Esc to close, R to replay, S to skip straight to the fire, lotus and magic heart.
"""

import colorsys
import math
import random
import time
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

NIGHT = "#2b0d26"      # plum sky behind the envelope
PAPER = "#fff8f1"      # letter paper
HAND_FONTS = ["Segoe Script", "Segoe Print", "Bradley Hand", "Snell Roundhand",
              "Comic Sans MS", "URW Chancery L", "Z003"]
LOTUS_CAPTION = "you make everything bloom, Adisa"
FIRE_COLORS = ["#ff3b00", "#ff5a00", "#ff7b00", "#ff9a1a", "#ffb84d", "#e62e00", "#ff4500"]

# tiny 5x7 pixel font used to write words in fire
FONT5x7 = {
    "A": [".###.", "#...#", "#...#", "#####", "#...#", "#...#", "#...#"],
    "B": ["####.", "#...#", "#...#", "####.", "#...#", "#...#", "####."],
    "C": [".####", "#....", "#....", "#....", "#....", "#....", ".####"],
    "D": ["####.", "#...#", "#...#", "#...#", "#...#", "#...#", "####."],
    "E": ["#####", "#....", "#....", "####.", "#....", "#....", "#####"],
    "F": ["#####", "#....", "#....", "####.", "#....", "#....", "#...."],
    "G": [".####", "#....", "#....", "#.###", "#...#", "#...#", ".###."],
    "H": ["#...#", "#...#", "#...#", "#####", "#...#", "#...#", "#...#"],
    "I": ["#####", "..#..", "..#..", "..#..", "..#..", "..#..", "#####"],
    "J": ["..###", "...#.", "...#.", "...#.", "...#.", "#..#.", ".##.."],
    "K": ["#...#", "#..#.", "#.#..", "##...", "#.#..", "#..#.", "#...#"],
    "L": ["#....", "#....", "#....", "#....", "#....", "#....", "#####"],
    "M": ["#...#", "##.##", "#.#.#", "#.#.#", "#...#", "#...#", "#...#"],
    "N": ["#...#", "##..#", "#.#.#", "#..##", "#...#", "#...#", "#...#"],
    "O": [".###.", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."],
    "P": ["####.", "#...#", "#...#", "####.", "#....", "#....", "#...."],
    "Q": [".###.", "#...#", "#...#", "#...#", "#.#.#", "#..#.", ".##.#"],
    "R": ["####.", "#...#", "#...#", "####.", "#.#..", "#..#.", "#...#"],
    "S": [".####", "#....", "#....", ".###.", "....#", "....#", "####."],
    "T": ["#####", "..#..", "..#..", "..#..", "..#..", "..#..", "..#.."],
    "U": ["#...#", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."],
    "V": ["#...#", "#...#", "#...#", "#...#", "#...#", ".#.#.", "..#.."],
    "W": ["#...#", "#...#", "#...#", "#.#.#", "#.#.#", "##.##", "#...#"],
    "X": ["#...#", "#...#", ".#.#.", "..#..", ".#.#.", "#...#", "#...#"],
    "Y": ["#...#", "#...#", ".#.#.", "..#..", "..#..", "..#..", "..#.."],
    "Z": ["#####", "....#", "...#.", "..#..", ".#...", "#....", "#####"],
    "!": ["..#..", "..#..", "..#..", "..#..", "..#..", ".....", "..#.."],
}

# ---------------------------------------------------------------- helpers


def hex_to_rgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def blend(c1, c2, t):
    """Mix colour c1 -> c2 by t (0..1)."""
    a, b = hex_to_rgb(c1), hex_to_rgb(c2)
    return "#%02x%02x%02x" % tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))


def hsl(h, s, l):
    """CSS-style hsl (degrees, %, %) -> '#rrggbb'."""
    r, g, b = colorsys.hls_to_rgb((h % 360) / 360, min(1, l / 100), min(1, s / 100))
    return "#%02x%02x%02x" % (int(r * 255), int(g * 255), int(b * 255))


def heart_point(t):
    x = 16 * math.sin(t) ** 3
    y = 13 * math.cos(t) - 5 * math.cos(2 * t) - 2 * math.cos(3 * t) - math.cos(4 * t)
    return x, y


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
        root.bind("<s>", lambda e: self.skip_to_magic())
        self.canvas.bind("<Button-1>", lambda e: self.open_envelope())
        root.bind("<Return>", lambda e: self.open_envelope())
        root.bind("<space>", lambda e: self.open_envelope())
        families = set(tkfont.families())
        self.hand = next((f for f in HAND_FONTS if f in families), FONT_FAMILY)
        self.gen = 0
        self.waiting_click = False
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
        self.after(200, self.scene_envelope)

    def skip_to_magic(self):
        """Press S: jump straight to the fire words, lotus and magic heart."""
        self.gen += 1
        self.waiting_click = False
        self.clear()
        self.after(100, self.scene_fire)

    # Scene 0: the envelope ------------------------------------------------
    def scene_envelope(self):
        c = self.canvas
        self.clear()
        c.config(bg=NIGHT)
        self.floaters = []
        for _ in range(20):
            f = c.create_text(random.uniform(0, WIDTH), random.uniform(0, HEIGHT), text="♥",
                              fill=random.choice(["#5e1f52", "#7a2a63", "#93346f"]),
                              font=(FONT_FAMILY, random.randint(10, 26)))
            self.floaters.append((f, random.uniform(0.5, 1.6)))
        ew, eh = 440, 293
        x0, y0 = WIDTH / 2 - ew / 2, HEIGHT / 2 - eh / 2 - 20
        self.env_box = (x0, y0, ew, eh)
        c.create_rectangle(x0, y0, x0 + ew, y0 + eh, fill="#e58aa0", outline="", tags="env")
        self.env_letter = c.create_rectangle(x0 + 30, y0 + 20, x0 + ew - 30, y0 + eh - 14,
                                             fill=PAPER, outline="", tags=("env", "rise"))
        c.create_text(WIDTH / 2, y0 + 62, text="♥", fill="#e3123f",
                      font=(FONT_FAMILY, 22), tags=("env", "rise"))
        c.create_polygon(x0, y0, WIDTH / 2, y0 + eh * 0.56, x0 + ew, y0, x0 + ew, y0 + eh,
                         x0, y0 + eh, fill="#f8c9d3", outline="", tags=("env", "pocket"))
        c.create_polygon(x0, y0 + eh, WIDTH / 2, y0 + eh * 0.5, x0 + ew, y0 + eh,
                         fill="#f3b5c3", outline="", tags=("env", "pocket"))
        self.env_flap = c.create_polygon(x0, y0, x0 + ew, y0, WIDTH / 2, y0 + eh * 0.6,
                                         fill="#f1a9ba", outline="#e58aa0", tags="env")
        c.create_text(WIDTH / 2, y0 + eh * 0.86, text="For Adisa ♥", fill="#3d1733",
                      font=(self.hand, 24, "bold"), tags=("env", "pocket"))
        sx, sy = WIDTH / 2, y0 + eh * 0.6
        c.create_oval(sx - 32, sy - 32, sx + 32, sy + 32, fill="#e3123f", outline="#8f0726",
                      width=3, tags=("env", "seal"))
        self.seal_heart = c.create_text(sx, sy, text="♥", fill="#ffd9e1",
                                        font=(FONT_FAMILY, 24), tags=("env", "seal"))
        self.hint = c.create_text(WIDTH / 2, y0 + eh + 70, text="click the seal to open ♥",
                                  fill="#f8c9d3", font=(FONT_FAMILY, 14, "bold"))
        c.create_text(WIDTH / 2, HEIGHT - 24, text="press S anytime to skip to the magic ✨",
                      fill="#93346f", font=(FONT_FAMILY, 11, "bold"))
        self.waiting_click = True

        def idle(n=0):
            if not self.waiting_click:
                return
            for f, sp in self.floaters:
                c.move(f, math.sin(n / 20 + sp * 5) * 0.4, -sp)
                if c.coords(f)[1] < -20:
                    c.coords(f, random.uniform(0, WIDTH), HEIGHT + 20)
            c.move("env", 0, math.sin(n / 12) * 0.6)
            c.itemconfig(self.seal_heart, font=(FONT_FAMILY, 30 if n % 22 in (0, 1, 2, 6, 7) else 24))
            c.itemconfig(self.hint, fill=blend("#f8c9d3", NIGHT, 0.5 + 0.5 * math.sin(n / 8)))
            self.after(40, lambda: idle(n + 1))
        idle()

    def open_envelope(self):
        if not self.waiting_click:
            return
        self.waiting_click = False
        c = self.canvas
        c.delete(self.hint)
        bx0, by0, bx1, by1 = c.coords(self.env_letter)
        x0, y0 = bx0 - 30, by0 - 20          # envelope corner after bobbing
        ew, eh = self.env_box[2], self.env_box[3]

        def pop_seal(k=0):
            if k < 8:
                c.scale("seal", WIDTH / 2, y0 + eh * 0.6, 0.75, 0.75)
                self.after(30, lambda: pop_seal(k + 1))
            else:
                c.delete("seal")
                flip()

        def flip(k=0):
            tip = y0 + eh * 0.6 * math.cos(math.pi * k / 18)
            c.coords(self.env_flap, x0, y0, x0 + ew, y0, WIDTH / 2, tip)
            if k == 9:
                c.tag_lower(self.env_flap, self.env_letter)
            if k < 18:
                self.after(25, lambda: flip(k + 1))
            else:
                rise()

        def rise(k=0):
            c.move("rise", 0, -eh * 0.6 / 24)
            for f, sp in self.floaters:
                c.move(f, 0, -sp)
            if k < 24:
                self.after(25, lambda: rise(k + 1))
            else:
                self.after(350, unfold)

        start_box = []

        def unfold(k=0):
            if k == 0:
                c.delete("pocket")
                c.delete(self.env_flap)
                c.tag_raise(self.env_letter)
                start_box[:] = c.coords(self.env_letter)
            sx0, sy0, sx1, sy1 = start_box
            t = 1 - (1 - k / 20) ** 3
            c.coords(self.env_letter, sx0 * (1 - t), sy0 * (1 - t),
                     sx1 + (WIDTH - sx1) * t, sy1 + (HEIGHT - sy1) * t)
            if k < 20:
                self.after(25, lambda: unfold(k + 1))
            else:
                fade_out()

        def fade_out(k=0):
            col = blend(PAPER, BG, k / 16)
            c.itemconfig(self.env_letter, fill=col)
            c.config(bg=col)
            if k < 16:
                self.after(35, lambda: fade_out(k + 1))
            else:
                self.clear()
                self.after(400, self.scene_opening)

        pop_seal()

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
        """Pulse the heart's colour a few times, then the night show starts."""
        bright = beat % 2 == 0
        for item, color in words:
            self.canvas.itemconfig(item, fill=blend(color, "#ffffff", 0.35) if bright else color)
        if beat >= 10:
            self.after(600, self.scene_fire)
            return
        self.after(180 if bright else 700, lambda: self.heartbeat(words, beat + 1))

    # Scene 7: love in fire --------------------------------------------------
    def scene_fire(self):
        self.clear()
        c = self.canvas
        lines = ["I LOVE YOU", NAME.upper()]
        sub = 2                                   # each font pixel = 2x2 sparks
        cols = max(len(line) for line in lines) * 6 - 1
        pitch = min(WIDTH * 0.9 / (cols * sub), 10)
        line_h = 7 * sub * pitch
        gap = line_h * 0.5
        top = HEIGHT / 2 - (len(lines) * line_h + (len(lines) - 1) * gap) / 2
        per_line = []
        for li, line in enumerate(lines):
            left = WIDTH / 2 - (len(line) * 6 - 1) * sub * pitch / 2
            dots = []
            for ci, ch in enumerate(line):
                for row, bits in enumerate(FONT5x7.get(ch, [])):
                    for col, bit in enumerate(bits):
                        if bit != "#":
                            continue
                        for sy in range(sub):
                            for sx in range(sub):
                                dots.append((left + ((ci * 6 + col) * sub + sx) * pitch,
                                             top + li * (line_h + gap) + (row * sub + sy) * pitch))
            dots.sort()
            per_line.append(dots)

        write_frames, pause_frames = 70, 10
        lit = []          # (glow, dot)
        embers = []
        spark_glow = c.create_oval(-50, -50, -40, -40, fill="#ff7a1a", outline="")
        spark = c.create_oval(-50, -50, -40, -40, fill="#fff3c4", outline="")
        dw, dh = pitch * 0.4, pitch * 0.26
        end_frame = len(lines) * (write_frames + pause_frames) + 80

        written = [0] * len(per_line)

        def frame(n=0):
            sp = None
            for li, dots in enumerate(per_line):
                start = li * (write_frames + pause_frames)
                shown = int(min(1, max(0, (n - start) / write_frames)) * len(dots))
                while written[li] < shown:
                    x, y = dots[written[li]]
                    written[li] += 1
                    g = c.create_rectangle(x - dw - 2, y - dh - 2, x + dw + 2, y + dh + 2,
                                           fill="#4a0c00", outline="")
                    d = c.create_rectangle(x - dw, y - dh, x + dw, y + dh, fill="#fff3c4", outline="")
                    lit.append((g, d, li))
                if 0 < shown < len(dots):
                    sp = dots[shown - 1]
            # flicker
            for g, d, _ in random.sample(lit, min(len(lit), 90)):
                c.itemconfig(d, fill=random.choice(FIRE_COLORS))
            if sp:
                x, y = sp
                c.coords(spark_glow, x - 16, y - 16, x + 16, y + 16)
                c.coords(spark, x - 6, y - 6, x + 6, y + 6)
                for _ in range(3):
                    e = c.create_oval(x - 1.5, y - 1.5, x + 1.5, y + 1.5, fill="#ffe08a", outline="")
                    embers.append([e, random.uniform(-7, 7), random.uniform(-6, 0), 1.0, True])
            else:
                c.coords(spark, -50, -50, -40, -40)
                c.coords(spark_glow, -50, -50, -40, -40)
            # a few embers drifting up from the lit letters
            if lit and random.random() < 0.6:
                _, d, _ = random.choice(lit)
                x1, y1, x2, y2 = c.coords(d)
                e = c.create_oval(x1, y1, x1 + 3, y1 + 3, fill="#ff8a1a", outline="")
                embers.append([e, random.uniform(-0.6, 0.6), random.uniform(-2.2, -1), 1.0, False])
            for em in embers[:]:
                item, vx, vy, life, falls = em
                em[2] = vy + (0.55 if falls else -0.02)
                em[3] = life - (0.045 if falls else 0.02)
                c.move(item, vx, em[2])
                if em[3] <= 0:
                    c.delete(item)
                    embers.remove(em)
                elif em[3] < 0.5:
                    c.itemconfig(item, fill="#c43a00")
            if n < end_frame:
                self.after(30, lambda: frame(n + 1))
            else:
                fade_out()

        def fade_out(k=0):
            for g, d, _ in lit:
                c.itemconfig(d, fill=blend("#ff5a00", BG, k / 14))
                c.itemconfig(g, fill=blend("#4a0c00", BG, k / 14))
            if k < 14:
                self.after(40, lambda: fade_out(k + 1))
            else:
                self.after(300, self.scene_lotus)
        frame()

    # Scene 8: lotus blooming in a glowing orb ------------------------------
    def scene_lotus(self):
        self.clear()
        c = self.canvas
        R = HEIGHT * 0.25
        cx, by = WIDTH / 2, HEIGHT * 0.53
        RO = R * 1.55
        ocy = by - R * 0.35
        dot = lambda x, y, col, s=2: c.create_rectangle(x, y, x + s, y + s, fill=col, outline="")
        hidden = lambda item: c.itemconfig(item, state="hidden")

        # orb outline, rings and sparkles
        orb = [dot(cx + math.cos(a) * RO, ocy + math.sin(a) * RO, "#6f63b8")
               for a in (random.uniform(0, 2 * math.pi) for _ in range(260))]
        rings = [[dot(0, 0, "#4a417f", 2) for _ in range(70)] for _ in range(3)]
        stars = []
        for _ in range(70):
            a, r = random.uniform(0, 2 * math.pi), math.sqrt(random.random()) * RO
            stars.append(dot(cx + math.cos(a) * r, ocy + math.sin(a) * r, "#cfc4ff"))

        # stem (quadratic curve from the bottom up to the flower)
        stem = []
        sx, sy = cx + R * 0.12, HEIGHT * 0.99
        for _ in range(170):
            u = random.random()
            x = (1 - u) ** 2 * sx + 2 * (1 - u) * u * (cx - R * 0.15) + u * u * cx
            y = (1 - u) ** 2 * sy + 2 * (1 - u) * u * ((sy + by) / 2) + u * u * by
            item = dot(x + random.uniform(-1.5, 1.5), y, "#6f8cff")
            hidden(item)
            stem.append((item, u))

        # petals: three layers fanned out from the base
        petals = []
        for n, spread, L, w, h, l in ((7, 84, 1.0, 0.28, 248, 58),
                                      (5, 58, 0.92, 0.31, 262, 64),
                                      (3, 30, 0.76, 0.35, 282, 72)):
            for i in range(n):
                a = math.radians(-spread + 2 * spread * i / (n - 1))
                for _ in range(95):
                    t = random.random() ** 0.75
                    edge = random.random() < 0.45
                    s = random.choice((-1, 1)) if edge else random.uniform(-1, 1)
                    hw = w * R * math.sin(math.pi * t ** 0.8)
                    col = hsl(h + random.uniform(-7, 7) + t * 12, 95, l + (14 if edge else 0) - (1 - t) * 8)
                    item = dot(cx, by, col, 2.6 if edge else 2)
                    hidden(item)
                    petals.append((item, s * hw, -t * L * R, a, 2.6 if edge else 2))
        centre = []
        for _ in range(70):
            a, r = random.uniform(0, 2 * math.pi), random.random() * R * 0.16
            item = dot(cx + math.cos(a) * r, by - R * 0.12 + math.sin(a) * r * 0.6, "#ffd98a")
            hidden(item)
            centre.append(item)
        glow = [c.create_oval(cx - R * s, by - R * 0.15 - R * s * 0.7, cx + R * s, by - R * 0.15 + R * s * 0.7,
                              fill=col, outline="", state="hidden")
                for s, col in ((0.16, "#3a1450"), (0.09, "#8a3a8f"))]
        for g in glow:
            c.tag_lower(g)
        caption = c.create_text(cx, min(ocy + RO + 42, HEIGHT - 30), text=LOTUS_CAPTION,
                                fill=BG, font=(self.hand, 24, "bold"))

        stem_frames, bloom_frames, hold_frames = 40, 100, 80
        ease = lambda x: 1 - (1 - min(1, max(0, x))) ** 3

        def frame(n=0):
            T = n * 0.03
            # rings slowly turning
            for k, ring in enumerate(rings):
                rot = k * 1.05 + T * 0.25
                for i, item in enumerate(ring):
                    th = i / len(ring) * 2 * math.pi
                    x, y = math.cos(th) * RO, math.sin(th) * RO * 0.3
                    px = cx + x * math.cos(rot) - y * math.sin(rot)
                    py = ocy + x * math.sin(rot) + y * math.cos(rot)
                    c.coords(item, px, py, px + 2, py + 2)
            # twinkle
            for item in random.sample(stars, 8) + random.sample(orb, 12):
                c.itemconfig(item, state=random.choice(("normal", "normal", "hidden")))
            # stem grows
            g = ease(n / stem_frames)
            for item, u in stem:
                if u <= g:
                    c.itemconfig(item, state="normal")
            # bloom
            if n >= stem_frames * 0.8:
                e = ease((n - stem_frames * 0.8) / bloom_frames)
                if e < 1 or n == int(stem_frames * 0.8 + bloom_frames) + 1:
                    scale, spread = 0.14 + 0.86 * e, 0.1 + 0.9 * e
                    for item, lx, ly, a, sz in petals:
                        aa = a * spread
                        x = cx + (lx * math.cos(aa) - ly * math.sin(aa)) * scale
                        y = by + (lx * math.sin(aa) + ly * math.cos(aa)) * scale
                        c.coords(item, x, y, x + sz, y + sz)
                        c.itemconfig(item, state="normal")
                for gl in glow:
                    c.itemconfig(gl, state="normal" if e > 0.3 else "hidden")
                if e > 0.6:
                    for item in centre:
                        c.itemconfig(item, state="normal")
                for item, *_ in random.sample(petals, 25):
                    c.itemconfig(item, state=random.choice(("normal", "normal", "hidden")))
                if e >= 1:
                    k = n - (stem_frames * 0.8 + bloom_frames)
                    c.itemconfig(caption, fill=blend(BG, "#ffd3ea", min(1, k / 20)))
            if n < stem_frames * 0.8 + bloom_frames + hold_frames:
                self.after(30, lambda: frame(n + 1))
            else:
                scatter()

        def scatter(k=0):
            for item, *_ in petals:
                c.move(item, random.uniform(-6, 6), random.uniform(-6, 6))
            if k % 3 == 0:
                for item in c.find_all():
                    if c.type(item) == "rectangle" and random.random() < 0.25:
                        c.itemconfig(item, state="hidden")
            c.itemconfig(caption, fill=blend("#ffd3ea", BG, k / 18))
            if k < 18:
                self.after(40, lambda: scatter(k + 1))
            else:
                self.after(250, self.scene_magic_heart)
        frame()

    # Scene 9: magic heart over a glowing pool --------------------------------
    def scene_magic_heart(self):
        self.clear()
        c = self.canvas
        S = HEIGHT * 0.45 / 29
        cx = WIDTH / 2
        cy = HEIGHT * 0.37 - 2.5 * S
        top, bottom = cy - 12 * S, cy + 17 * S
        pool_y, prx, pry = bottom + 4.5 * S, 12 * S, 2 * S

        # glowing pool: stacked ovals from dark to bright fake a glow
        for s, col in ((1.7, "#03142c"), (1.45, "#05264f"), (1.25, "#0a3f7c"), (1.05, "#1263b0"),
                       (0.85, "#2189e0"), (0.65, "#4fb2f7"), (0.45, "#9adcff"), (0.25, "#e2f7ff")):
            c.create_oval(cx - prx * s, pool_y - pry * s * 1.6, cx + prx * s, pool_y + pry * s * 1.6,
                          fill=col, outline="")

        def in_pool():
            a, r = random.uniform(0, 2 * math.pi), math.sqrt(random.random())
            return cx + math.cos(a) * prx * r, pool_y + math.sin(a) * pry * r

        parts = []
        for _ in range(1100):
            t, r = random.uniform(0, 2 * math.pi), random.random() ** 0.35
            hx, hy = heart_point(t)
            home_y = cy - hy * r * S
            x, y = in_pool()
            col = "#eaffff" if random.random() < 0.18 else hsl(random.uniform(190, 215), 100, random.uniform(55, 80))
            sz = random.choice((2, 2.5, 2.5, 3))
            item = c.create_rectangle(x, y, x + sz, y + sz, fill=col, outline="")
            parts.append({
                "item": item, "sz": sz, "hx": hx * r * S, "hy": home_y,
                "z": random.uniform(-0.5, 0.5) * 7 * S * (1.1 - r),
                "x": x, "y": y, "vy": 0.0, "fallen": False,
                "k": random.uniform(1.6, 4.6), "delay": random.uniform(0, 1.1),
                "mdelay": (1 - (home_y - top) / (bottom - top)) * 1.1 + random.uniform(0, 0.35),
                "g": random.uniform(0.6, 1.4), "ph": random.uniform(0, 6.28),
            })
        swirl = []
        for _ in range(70):
            item = c.create_rectangle(0, 0, 2, 2, fill="#8fe6ff", outline="")
            swirl.append([item, random.uniform(0, 6.28), random.uniform(0.3, 1.0), random.uniform(0.4, 1.4)])
        risers = []
        for _ in range(26):
            item = c.create_rectangle(0, 0, 2, 2, fill="#bff0ff", outline="")
            risers.append([item, random.random(), random.uniform(0.25, 0.7), random.uniform(-1, 1)])

        label_y = min(pool_y + pry + 60, HEIGHT - 70)
        for dx, dy in ((-2, 0), (2, 0), (0, -2), (0, 2)):
            c.create_text(cx + dx, label_y + dy, text=NAME + " ♥", fill="#0f4f8f", font=(self.hand, 40, "bold"))
        c.create_text(cx, label_y, text=NAME + " ♥", fill="#e4f7ff", font=(self.hand, 40, "bold"))
        c.create_text(cx, HEIGHT - 22, text="press R to read it again ♥", fill="#3b6c8f",
                      font=(FONT_FAMILY, 12, "bold"))

        CYCLE, FORM, MELT, REST = 10, 2.6, 6.6, 8.6
        state = {"cycle": 0, "t0": time.perf_counter(), "last": time.perf_counter(), "frames": 0}

        def frame(n=0):
            now = time.perf_counter()
            dt = min(0.06, now - state["last"])
            state["last"] = now
            state["frames"] = n
            T = now - state["t0"]
            cyc, ct = int(T // CYCLE), T % CYCLE
            if cyc != state["cycle"]:
                state["cycle"] = cyc
                for p in parts:
                    p["fallen"], p["vy"] = False, 0.0
            phi = math.sin(T * 0.7) * 0.45
            cp, spn = math.cos(phi), math.sin(phi)
            for p in parts:
                tx = cx + p["hx"] * cp + p["z"] * spn + math.sin(T * 2 + p["ph"]) * 1.2
                ty = p["hy"] + math.cos(T * 1.7 + p["ph"]) * 1.2
                if ct < MELT + p["mdelay"] or ct > REST + 0.6:
                    if ct > p["delay"] or ct > REST:
                        f = min(1, p["k"] * dt)
                        p["x"] += (tx - p["x"]) * f
                        p["y"] += (ty - p["y"]) * f
                elif not p["fallen"]:
                    p["vy"] += 900 * p["g"] * dt
                    p["x"] += math.sin(p["ph"] * 7) * 25 * dt
                    p["y"] += p["vy"] * dt
                    if p["y"] >= pool_y - pry * 0.5:
                        p["fallen"] = True
                        x, y = in_pool()
                        p["x"], p["y"] = cx + (p["x"] - cx) * 0.4 + (x - cx) * 0.6, y
                s = p["sz"]
                c.coords(p["item"], p["x"], p["y"], p["x"] + s, p["y"] + s)
            for sw in swirl:
                sw[1] += sw[3] * dt
                x = cx + math.cos(sw[1]) * prx * sw[2]
                y = pool_y + math.sin(sw[1]) * pry * sw[2]
                c.coords(sw[0], x, y, x + 2, y + 2)
            for r in risers:
                r[1] = (r[1] + r[2] * dt) % 1
                x = cx + r[3] * prx * 0.5 * (1 - r[1])
                y = pool_y - (pool_y - bottom + 2 * S) * r[1]
                c.coords(r[0], x, y, x + 2, y + 2)
            for p in random.sample(parts, 40):
                c.itemconfig(p["item"], state=random.choice(("normal", "normal", "hidden")))
            self.after(16, lambda: frame(n + 1))
        self.magic_state = state
        frame()


if __name__ == "__main__":
    root = tk.Tk()
    root.geometry(f"{WIDTH}x{HEIGHT}")
    LoveLetter(root)
    root.mainloop()
