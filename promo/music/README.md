# promo/music ── 動画に敷く曲

オーナーがダウンロードして渡したもの（2026-09-30）。ファイル名はダウンロードした時のもの（作者名-曲名-番号）から、頭に付いていた受け取りの番号を外しただけ。

出どころはファイル名の形から Pixabay Music と見ている（オーナーに確認中）。Pixabay のライセンスなら、動画に使ってよく、クレジットは要らない。別のサイトだった場合は、この表を直す。

| ファイル | 長さ | 作者（名前から） | 使った動画 |
|---|---|---|---|
| `atlasaudio-music-background-606270.mp3` | 2:10 | atlasaudio | ― |
| `echoes_of_lumen-vlog-background-music-596303.mp3` | 0:57 | echoes_of_lumen | `promo/keyboard/keyboard-reddit.mp4` |
| `sigmamusicart-background-music-inspiring-525840.mp3` | 2:07 | sigmamusicart | `promo/draw/draw-tools.mp4` |
| `sub_clair-background-music-550483.mp3` | 2:11 | sub_clair | `promo/words/words-make.mp4` |
| `verclub_music-background-music-571037.mp3` | 2:54 | verclub_music | `promo/words/words-use.mp4` |

使い方: `tools/video/scripts.mjs` の台本に `music: 'ファイル名'` と書くと、`tools/video/rec.mjs` がタップ音の下に小さく敷き、最後の 2 秒でフェードアウトさせる。
