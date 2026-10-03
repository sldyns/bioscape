<div align="center">

# BioScape

### A closer look at life.

Explore biological structures and processes in three dimensions.

<a href="https://sldyns.github.io/bioscape/">Explore BioScape ↗</a> · <a href="README.zh-CN.md">简体中文</a>

</div>

https://github.com/user-attachments/assets/aef051f6-ff7b-4f08-ac92-f0a5da6f4082

## Explore the microscopic world

The homepage brings nine model types and 84 processes together. Rotate the live preview, browse the model collection, or search for a process in either language. Return home at any point and continue from your saved scene.

<table>
<tr>
<td width="33%" align="center"><a href="https://sldyns.github.io/bioscape/#/cell"><img src="docs/media/animal-cell.jpg" alt="Animal cell" width="300" /></a><br/><strong>Animal cell</strong></td>
<td width="33%" align="center"><a href="https://sldyns.github.io/bioscape/#/plant"><img src="docs/media/plant-cell.jpg" alt="Plant cell" width="300" /></a><br/><strong>Plant cell</strong></td>
<td width="33%" align="center"><a href="https://sldyns.github.io/bioscape/#/bacterium"><img src="docs/media/bacterium.jpg" alt="Bacterium" width="300" /></a><br/><strong>Bacterium</strong></td>
</tr>
<tr>
<td width="33%" align="center"><a href="https://sldyns.github.io/bioscape/#/yeast"><img src="docs/media/yeast.jpg" alt="Yeast" width="300" /></a><br/><strong>Yeast</strong></td>
<td width="33%" align="center"><a href="https://sldyns.github.io/bioscape/#/paramecium"><img src="docs/media/paramecium.jpg" alt="Paramecium" width="300" /></a><br/><strong>Paramecium</strong></td>
<td width="33%" align="center"><a href="https://sldyns.github.io/bioscape/#/phage"><img src="docs/media/phage.jpg" alt="Bacteriophage" width="300" /></a><br/><strong>Bacteriophage</strong></td>
</tr>
</table>

## From the whole, to within

Open a cell, enter an organelle, and follow its structures down to the molecular scale. Rotate, cut away or take apart a model to see how its components fit together.

![Explore an animal cell in the English interface](docs/media/en/structures.jpg)

## Follow the process

Watch transcription unfold, trace energy through photosynthesis, or follow a growing peptide chain. Move through the steps, pause at a detail, and return to the structures that make it possible.

![Transcription — extend along the template](docs/media/en/transcription.jpg)

## Connect and compare

Enter related processes directly from a structure, return to its saved view, and resume the process where you left off. Mature human erythrocytes, representative myelinated multipolar neurons and skeletal muscle fibres also have explorable parts.

Open **Compare** to select two models. Rotate, zoom and reset each independently; whole, cutaway, exploded and label controls are also separate. Bilingual comparison notes explain each model's scope; the two views are fitted separately, without a common physical scale.

![Side-by-side structure comparison](docs/media/exploration/comparison.jpg)

## Take the view with you

**Studio** creates landscape, portrait and square compositions, with 1920 or 2560 pixel long-edge PNGs and short orbit, disassembly or process videos. Images support transparent backgrounds; videos use MP4 or WebM according to browser support. Labels and titles are optional. Exports retain the BioScape project mark and teaching context, without an author-name watermark.

**Share** saves the model, viewing angle, display settings and process progress, including both comparison panes. Links use the current site address; local links require access to that local server.

<details>
<summary><strong>Scientific context</strong></summary>

Models carry their own explanations and references. Geometry, proportions and timing are teaching simplifications; experimental structures are attributed separately. See the [scientific review](docs/science-audit/acceptance/README.md) and [validation scope](docs/science-audit/acceptance/VALIDATION.md).

</details>

## Development

```sh
npm ci
npm run dev
```

Run `npm run check` before publishing. Node.js 22.12+ is required.

[Contributing](.github/CONTRIBUTING.md) · [Documentation](docs/README.md) · [Making the films](scripts/media/README.md)

---

Created by **[Kun Qian](https://sldyns.github.io/)** · © 2026

[Noncommercial license](LICENSE). Commercial use requires [written permission](mailto:kunqian@stu.pku.edu.cn). [Third-party notices](docs/legal/THIRD_PARTY_NOTICES.md).

The website footer opens the project introduction and full license, with a commercial contact link. When sharing exported images or videos, retain the project and author credit, author homepage and applicable license notices in the caption, video description or credits.
