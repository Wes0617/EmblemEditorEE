# Scanner Guide and Examples

Emblem Editor Expanded & Enhanced

------------------------------------------------------------------------------------------------------------------------

The _Scanner_ will convert the bitmap from a 16x16, 32x32, 64x64 or 128x128 PNG into pseudo-pixels in the Emblem Editor.
The new pixels will be added on top of the existing layers.

Transparent pixels will be discarded, and, because of how the conversion process works, very dim pixels may be discarded
too. These dim pixels don't produce appreciable results given that the emblems are so small. For this reason they
shouldn't be added to the canvas in the first place, but if you do, the importer will ignore them for you.

Large 128x128 images will give the best quality, but they also use a lot of layers. So, make sure to use 128x128 for
lines, contours, text, etc. Instead, 16x16 and 32x32 should be used to "fill" large solid areas. For optimal results,
you will need to use separate passes of different resolutions.
Check out the [Import / Export Examples](./readme-import.md) for some high quality examples.

------------------------------------------------------------------------------------------------------------------------

[e1]: ./readme-scanner/example-1.png
[e2]: ./readme-scanner/example-2.png
[e3]: ./readme-scanner/example-3.png
[e4]: ./readme-scanner/example-4.png

[r4]: ./readme-scanner/result-4.jpg

Download these images and try to use them with the _Scanner_.

| Size    | Layer Count | Image (Right-click, Save Image as…) | Result       | Description                             |
|---------|-------------|-------------------------------------|--------------|-----------------------------------------|
| 32x32   | 136 / ~800  | ![][e1]                             | N/A          | Hello World text "pixelated".           |
| 128x128 | 724 / ~800  | ![][e2]                             | N/A          | Hello World antialiased.                |
| 128x128 | 516 / ~800  | ![][e3]                             | N/A          | Random lines.                           |
| 32x32   | 784 / ~800  | ![][e4]                             | [Result][r4] | Low-resolution "kekw" emoji.            |
