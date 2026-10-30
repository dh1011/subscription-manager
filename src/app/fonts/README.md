# Local application fonts

Poppins and Montserrat are bundled so production builds and font loading do not
depend on Google Fonts availability or its CSS/font URL format. The layout uses
`next/font/local`, retaining the existing CSS variables, normal weights and swap
display behavior. Full upstream character coverage is retained (not just Latin).

Source: [google/fonts at 6157dfaa640ca5738b4d1a7070fe389c3036d7fc](https://github.com/google/fonts/tree/6157dfaa640ca5738b4d1a7070fe389c3036d7fc/ofl).

- `poppins/Poppins-{Light,Regular,Medium,SemiBold,Bold}.woff2`: upstream
  `ofl/poppins/Poppins-{Light,Regular,Medium,SemiBold,Bold}.ttf` (weights 300–700).
- `montserrat/Montserrat.woff2`: upstream `ofl/montserrat/Montserrat[wght].ttf`,
  a variable font; the application uses weights 400–700.

The upstream TrueType files were converted to WOFF2 using FontTools with Brotli
compression, without subsetting or changing glyphs. Both families are licensed
under SIL Open Font License 1.1; their original notices are in the adjacent
`poppins/OFL.txt` and `montserrat/OFL.txt` files. Keep those notices with the fonts.

To update, fetch the files from a reviewed upstream commit, retain the license
notices, and convert each with `fontTools.ttLib.TTFont`: set `flavor = 'woff2'` and
save. Update this provenance, then verify an offline production build and browser
font loading for every configured weight.
