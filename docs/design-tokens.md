# Design tokens — provenance

Every value below comes from the reference APK's own resources (decoded
privately in the workspace, never committed) or from density-calibrated
measurement of a real device screenshot. No more eyeballing.

## Calibration

- Reference screenshot: 1080 × 2340 px phone capture.
- Anchor: bottom-nav icons are `24dp` vectors in the APK (`home_icon.xml`,
  `selelcted_home_icon.xml`) and measure 63 px in the capture.
- Therefore **density = 2.625**, screen = **411 dp** wide. Every px measured in
  the capture divides by 2.625 to give exact dp (= CSS px at scale 1).

## Typeface

- Family: **Reddit Sans** — identified by render-comparing the APK's bundled
  font files against the screenshot; the APK ships RedditSans Regular/Medium/
  SemiBold/Bold (+ Poppins/Raleway/Roboto for other surfaces).
- Self-hosted woff2 (Regular/Medium/SemiBold/Bold/ExtraBold) from the official
  `reddit/redditsans` repository, **SIL OFL 1.1** (see `src/assets/fonts/OFL.txt`).
  Nothing was copied from the APK.
- Weights in use: 400 body, 500 medium labels, 600 semibold, 700 bold headings,
  800 extrabold figures.

## Brand colours (from vector drawables in the APK)

| Token            | Hex       | Source                                  |
|------------------|-----------|------------------------------------------|
| Brand purple     | `#5A4BDA` | fillColor across brand vectors           |
| Nav/icon idle    | `#7B7F86` | `home_icon.xml` strokeColor              |
| Nav icon stroke  | 1.5       | `home_icon.xml` strokeWidth              |
| Streak gold set  | `#F7E7BA` / `#EEC161` / `#C29821` | gold family in vectors   |
| Hairlines/greys  | `#DFDEDC`, `#F3F3F3`, `#F8F8F8` | grey family in vectors    |
| Ink              | `#1B2124` | selected-state fills                     |

## Measured geometry (dp = CSS px)

| Element                    | Value      | How measured                        |
|----------------------------|------------|--------------------------------------|
| Attendance donut outer     | 194        | purple-pixel bbox ÷ 2.625            |
| Donut ring stroke          | 16         | radial run of purple ÷ 2.625         |
| Donut centre figure        | ~44 sp     | digit cap-height 31.6 dp ÷ 0.72      |
| "Average attendance"       | ~13 sp     | ascender-descender 12.2 dp           |
| Heading calendar icon      | ~20 dp     | bbox ÷ 2.625 (44dp variant exists for large surfaces) |
| Bottom-nav icons           | 24 dp      | vector `android:width`               |
| Week chips                 | ~40 dp     | capture bbox ÷ 2.625                 |
| Batch pill height          | ~36 dp     | capture bbox ÷ 2.625                 |
| Week day pill              | 32×34 dp, radius 10 dp, border 1.5 dp, dot 5 dp | coloured-pill bboxes ÷ 2.625 (2026-11-01 capture) |
| Week column pitch          | ~54.7 dp (7 columns, 18 dp side margins) | pill-centre spacing ÷ 2.625 |
| Gate-times callout         | 48 dp tall, slate border, 12 dp caret under the selected column | row scan ÷ 2.625 |
| Selected week column       | 1.5 dp slate ring around letter+pill | border scan |

Light-theme mapping of the dark capture's pill hues: present `#7CBF94/#EDF7F0/#34A853`,
absent `#D9938C/#FAEEEC/#C4534F`, today `#8B7FE8/#F0EEFC/#5A4BDA`,
no-class `#DCDBD7/#F5F5F3/#9CA3AF`; ring + callout chrome `#9BAABC`.

## Rule going forward

New UI work reads tokens from this file (or the APK decode in the private
workspace), never from a compressed screenshot by eye. Residuals are closed
with the screenshot diff loop: same-width capture of our build vs reference,
region offsets computed, corrected in one pass.
