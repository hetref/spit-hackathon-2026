# Landing Page Design System

This design document provides all the context needed to recreate or expand upon the "MoneyHub" inspired landing page theme across the rest of the application.

## 1. Typography

The design heavily relies on the versatile **Inter** font family (via `next/font/google`), utilizing extreme font weights and tight tracking for headers to create a modern, high-impact look without relying on custom display fonts.

*   **Primary Headings (H1, Large Stats):**
    *   Class setup: `font-black uppercase tracking-tighter leading-[0.95]`
    *   Usage: Main hero headline ("BEST SOLUTION FOR YOUR BUSINESS"), huge numerical callouts ("87,000", "70%", "$234.98K").
*   **Secondary Headings (H2, H3):**
    *   Class setup: `font-bold` (or `font-semibold` on dark bg)
    *   Usage: Section titles ("Protect your investments..."), card titles ("Credit card", "Secure your assets precisely").
*   **Body Text:**
    *   Class setup: `text-gray-400 font-light` on dark, `text-gray-500 font-medium` on light.
    *   Usage: Subheaders, paragraph text, small card descriptions.
*   **Microcopy & Badges:**
    *   Class setup: `text-[10px]` or `text-[11px]`, `font-bold uppercase tracking-widest` or `tracking-[0.2em]`
    *   Usage: "TRUSTED BY THE BEST", "NEW USERS", "IN PROCESS".

## 2. Color Palette

The contrast strategy relies on deep, near-black greens paired with high-visibility neon yellow.

### Dark Theme (Hero & Dark Cards)
*   **Hero Background Gradient:** `from-[#0b1411] via-[#0f211d] to-[#0c1a16]` (Deep forest/emerald near-black)
*   **Dark Card Solid Background:** `bg-[#0f1917]`
*   **Faint Background Grid:** `bg-[linear-gradient(rgba(255,255,255,0.2)_1px,transparent_1px)]` acting at 10% opacity.

### Light Theme (Middle & Bottom Sections)
*   **Off-White Background:** `bg-[#fcfdfc]` for the middle section, `bg-[#f2f4f2]` for the bottom card section.
*   **White Element Backgrounds:** Pure `bg-white` for cards and floating badges.
*   **Light Card Borders:** `border-gray-100`

### Accents & Highlights
*   **Primary Neon Yellow:** Solid `bg-[#d3ff4a]`, Hover `bg-[#c0eb3f]`, Text `text-[#d3ff4a]`
*   **Neon Text Default:** `text-[#0a1512]` (Very dark green, almost black) is used when text sits *on top* of the yellow.
*   **Secondary Muted Greens / Blues:**
    *   Feature Card 1 (Credit Card): `bg-[#8bc4b1]`
    *   Feature Card 2 (Management): `bg-[#9ad4bf]`
    *   Feature Card 3 (Application): `bg-[#5d6a66]`
    *   Bright Cyan (in Logo cluster): `bg-[#00e5ff]`

## 3. Visual Components & Styling Tricks

*   **Buttons:**
    *   *Primary CTA:* Pill-shaped (`rounded-full`), padded (`px-8 py-3.5`), Neon Yellow background, bold dark text.
    *   *Secondary CTA:* `bg-white/10 backdrop-blur-md border border-white/20`, white text, with a solid white circle icon placeholder.
*   **Cards:** 
    *   Intensive rounding. The main cards use `rounded-[2rem]` (32px radius).
    *   Feature layout cards use smaller `rounded-[14px]`.
    *   Overlapping floating cards (like the balance card) use intense drop shadows `shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)]` and slight rotational transforms (`-rotate-2`) to break the grid.
*   **Graphic Placeholders:**
    *   Since raw images of people or complex 3D charts aren't used, CSS block construction handles the mock graphics.
    *   Bar charts are simulated using overlapping div heights with flex-end alignment.
    *   The "Donut Chart" is simulated with an absolute inset border (`border-[14px]`) on a rounded circle, with a second inset border rotated `-45deg` holding a `transparent` top/right border structure to mimic a 70% fill arc.

## 4. Usage Rules for Future Pages

When applying this UI theme to future pages in the application:
1. Always maintain the strict font weighting (Black + tracking-tighter for impact, medium/light for body text).
2. Avoid standard primary blues/reds/purples. Stick to the monochromatic grayscale spectrum, the deep dark green (`#0f1917`), and the `d3ff4a` neon pop.
3. Don't use sharp square boxes. Everything large needs a tight radius (`rounded-3xl` or `rounded-[2rem]`).
4. Micro-badges (New Users, Review Stars) should float on absolute positioning across column boundaries.
