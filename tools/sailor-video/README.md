# Sailor elastic recovery video

Source for `assets/sailor-elastic-recovery.mp4`, the 56 s animation on the
Sailor project page (`projects/sailor-llm.html`): a walkthrough of how Sailor
recovers from a spot preemption, followed by a results scene.

- `anim.py`: the whole animation, drawn frame by frame with pycairo and piped to ffmpeg.
  - Colours: the palette block at the top, matched to the site's `style.css`.
  - Captions: `CAPS`.
  - Results scene: `draw_results`.

## Requirements

- Python 3 with `pycairo` (`pip install pycairo`; on macOS this needs `brew install cairo pkgconf`)
- `ffmpeg`
- The Inter font (Regular and Bold) installed. On macOS the script registers
  `~/Library/Fonts/Inter-*.ttf` itself, because cairo doesn't always see newly
  installed fonts; without Inter it silently falls back to another font.

## Render

Run from this folder:

```bash
python3 anim.py still 13 24 52            # preview frames at those seconds, as PNGs
python3 anim.py render 0 1680 out.mp4     # full video (1680 frames at 30 fps)
```

Then update the page assets:

```bash
ffmpeg -i out.mp4 -c copy -movflags +faststart ../../assets/sailor-elastic-recovery.mp4
ffmpeg -ss 24 -i out.mp4 -frames:v 1 -vf scale=1280:-1 -q:v 4 ../../assets/sailor-elastic-recovery-poster.jpg
```

## Numbers used

- Goodput: 3× the baseline (2.87× in the paper)
- Reconfiguration time (1.5B parameters, 8 nodes, single GCP region): distributed
  group init 10 s, DeepSpeed started 26 s, snapshot recovered 16 s, 52 s in total
