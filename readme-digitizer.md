# Digitizer

Emblem Editor Expanded & Enhanced

------------------------------------------------------------------------------------------------------------------------

The digitizer converts a 16x16, 32x32, 64x64 or 128x128 PNG into "pixels" in the Emblem Editor.
The digitizer always adds layers on top of the existing image. Transparent pixels are discared.

128x128 images give the best quality, but they also use a lot of layers. Therefore, use 128x128 for lines, contours,
text, etc., and lower resolutions to fill large areas of the canvas.

Check out the [Import examples](./readme-import.md) for more complex examples.

Download these images and try to use them with the Digitizer.

------------------------------------------------------------------------------------------------------------------------

[e1]: ./readme-digitizer/example-1.png
[e2]: ./readme-digitizer/example-2.png
[e3]: ./readme-digitizer/example-3.png
[e4]: ./readme-digitizer/example-4.png

[r4]: ./readme-digitizer/result-4.jpg

| Size    | Layer Count | Image (Right-click, Save Image as…) | Result       | Description                             |
|---------|-------------|-------------------------------------|--------------|-----------------------------------------|
| 32x32   | 136 / ~830  | ![][e1]                             | N/A          | Hello World text "pixelated".           |
| 128x128 | 724 / ~830  | ![][e2]                             | N/A          | Hello World antialiased.                |
| 128x128 | 516 / ~830  | ![][e3]                             | N/A          | Random lines.                           |
| 32x32   | 784 / ~830  | ![][e4]                             | [Result][r4] | Low-resolution "kekw" emoji.            |
