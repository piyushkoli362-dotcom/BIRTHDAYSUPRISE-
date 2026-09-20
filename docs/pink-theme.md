# Pink Vrindavan refresh

The platform keeps its existing routes, accounts, uploads and birthday data. Only the flagship theme and shared creator interface receive the rose/cream refresh. Names, dates, letters and memories remain live data, never baked into the art.

## Background artwork

Asset: `public/themes/vrindavan-pink.webp` (1536 × 1024).

Created with the built-in image generation tool, using the user-supplied pink Radha–Krishna reference; optimized to WebP for mobile delivery. Original user artwork remains unchanged.

Final generation prompt:

> Create a text-free cinematic website BACKGROUND ART asset based on the attached reference image (style and deity depiction reference only). Landscape 1536x1024. Depict respectful, beautifully detailed Radha and Krishna seated together on the LEFT third by a lotus pond in dreamy Vrindavan, Krishna with flute, pink flowers and hanging vines framing top and bottom, pink lanterns, distant temple on far right, warm moon above and fireflies, lilac dusk and pastel pink rose-gold palette. Keep deity figures naturally still. The RIGHT half should be quiet softly lit lilac-pink sky and water with ample negative space for live HTML text. Rich depth, premium painterly realism. NO words, NO letters, NO names, NO buttons, NO UI, NO navigation, NO cards, NO photos on clothesline, NO cake, NO screenshot layout. Just the uninterrupted atmospheric scene. Preserve the reference's pink romantic moonlit Vrindavan mood.

## Upload regression

The Next proxy buffers request bodies with a default 10 MB limit. Its limit is now 25 MB; the upload endpoint independently bounds multipart requests at 21 MB and uploaded files at 20 MB, before existing media validation. Browser uploads send native FormData without manually overriding its multipart boundary. The browser suite includes an 11 MB WAV upload.
