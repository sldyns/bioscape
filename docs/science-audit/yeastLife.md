# yeastLife scientific audit - Phase A

All 4 entries covered; root yeast. Verdicts: 4 confirmed_issue. Findings: 7 P1, 0 P2. Product/model/test files unchanged; no browser operated. Evidence is code/formula analysis plus opened authoritative sources, not visual acceptance.

Primary articles were read through official Europe PMC fullTextXML; PLOS, ChEBI and SIB ENZYME were opened.

## yeastBudding - confirmed_issue

S. cerevisiae vegetative budding, one replication, closed mitosis, cytokinesis and mother-daughter separation. No extra control.

Checked:

- Read entries, all bilingual stages/intro/legend and update intervals, layeredCutaway and nuclearAnatomy. Mother-bud connection precedes separation; nuclear envelope does not globally disassemble.
- Genome markers change from four to eight and end four per daughter; symbolic chromosome sets, not a literal yeast chromosome count. Cell growth, spindle, nuclear partition and septum stages traced separately.

### yeastLife-01 / P1

Code: `src/processes/modules/yeastLife/yeastBuddingProcess.js`, 100-104, 147-175; anatomy.js:89-105.

Septum is CircleGeometry(0.43), displayed after p=0.76 and scaled by closing from its center outward. Neck radius only depends on growth and stays 0.43 after p=0.4. The contractile ring shrinks while the plasma-membrane aperture stays open; layeredCutaway copies this unchanged profile.

The primary septum grows inward from the neck circumference with membrane ingression. A central solid disk growing outward reverses cytokinesis topology; the thin-disk disclaimer does not correct the motion.

Fix: Use an annular septum with fixed outer rim and shrinking inner opening. Drive plasma-membrane ingression from the same closure variable, sealing each daughter before separation.

Verification invariant: Sample p=0.74,0.78,0.82,0.86: septum starts at the rim; central opening progressively closes; membrane and septum leading edges stay attached; both daughter cytoplasms are enclosed at separation.

Sources: [evidence](https://journals.plos.org/plosgenetics/article?id=10.1371/journal.pgen.1006195)

### yeastLife-02 / P1

Code: `src/processes/modules/yeastLife/yeastBuddingProcess.js`, 179-206; stage at 0.34, lines 301-305.

SPB centers are (left/right,0,0.04), whereas NE extends to left-0.36 and right+0.36 and has substantial radius at each SPB x. Radius-0.08 pole spheres therefore sit inside the nucleus rather than crossing its membrane.

Both stage languages explicitly describe membrane-embedded SPBs; actual geometry puts their organizing centers in nucleoplasm.

Fix: Compute SPB anchors from the NE surface and normal; place the central plaque through the envelope and attach spindle ends on the nuclear face.

Verification invariant: Across spindle-visible frames, central plaques intersect NE, spindle ends touch plaques and intranuclear spindle remains inside the envelope.

Sources: [evidence](https://www.ebi.ac.uk/europepmc/webservices/rest/PMC2080914/fullTextXML)

Limits: Code/formula audit; no browser or full-angle visual acceptance. Generic chromatin detail is not an experimentally reconstructed chromosome.

Opened sources:

- [Timely Endocytosis of Cytokinetic Enzymes Prevents Premature Spindle Breakage during Mitotic Exit (2016; primary research)](https://journals.plos.org/plosgenetics/article?id=10.1371/journal.pgen.1006195): Opened PLOS full text: centripetal primary-septum deposition coordinated with actomyosin ring constriction; live-cell cytokinetic-enzyme and spindle observations.
- [Nuclear fusion during yeast mating occurs by a three-step pathway (2007; primary electron tomography)](https://www.ebi.ac.uk/europepmc/webservices/rest/PMC2080914/fullTextXML): Read official full-text XML. Cell fusion precedes congression by cytoplasmic microtubules; outer NE, inner NE and SPB fusion occur sequentially. Figure 3 and central-plaque analysis locate SPBs within the NE.

## yeastFermentation - confirmed_issue

S. cerevisiae cytosolic alcoholic fermentation. One glucose -> two pyruvate -> two acetaldehyde + two CO2 -> two ethanol, two NADH/NAD+ cycles and net two glycolytic ATP. Anaerobic or aerobic high-glucose controls.

Checked:

- Traced all bilingual stages, both conditions, carbon bonds, oxygen markers, cofactor recycling and ATP appearance. Six carbon markers are conserved into four ethanol carbons plus two CO2 carbons; decarboxylation precedes reduction.
- Two ATP appear at glycolysis and no new ATP at PDC/ADH. Two NADH markers lose reducing equivalents and return as NAD+. Aerobic control adds environmental O2 without disabling the explicitly high-glucose fermentation branch, consistent with Crabtree physiology.
- Charge/redox reference reactions checked: pyruvate anion + H+ -> acetaldehyde + CO2; acetaldehyde + NADH + H+ -> ethanol + NAD+. The model omits most H, charges, water and phosphate species, so only carbon and reducing-equivalent bookkeeping is represented, not full atom/charge balance.
- proteinPocket is generic decorative secondary structure, not a sourced enzyme reconstruction; no structural accuracy claim is certified.

### yeastLife-03 / P1

Code: `src/processes/modules/yeastLife/yeastFermentationProcess.js`, 163-190; stage 0 and carbon-skeleton legend.

All six green carbon spheres are connected by six rods using next=(i+1)%6 at p=0, producing an all-carbon six-membered ring. Text says the display tracks carbon only and is not a complete ring structure, but actual bonds and the carbon-skeleton legend still assert cyclic C-C connectivity.

Glucose has no cyclic six-carbon skeleton. Glucopyranose has a ring oxygen and an exocyclic carbon; open-chain glucose also lacks a closing C6-C1 bond. This adds a false bond rather than merely omitting H/O.

Fix: Use an open six-carbon chain or unbonded carbon-count markers; alternatively show five C plus O in the ring and exocyclic C6, preserving downstream carbon mapping.

Verification invariant: Initial adjacency graph must not contain a six-carbon cycle. If pyranose is used, exactly one ring atom is O and C6 is outside. Final carbon counts remain 4 in ethanol plus 2 in CO2.

Sources: [evidence](https://www.ebi.ac.uk/chebi/CHEBI:4167)

Limits: Not a complete atom/charge-balanced animation; NAD gold mark is a reducing-equivalent symbol, not a literal complete H trajectory. TPP/Mg/Zn and molecular active-site structures are not certified. No browser operated.

Opened sources:

- [ChEBI:4167 D-glucopyranose](https://www.ebi.ac.uk/chebi/CHEBI:4167): Opened official entry. SMILES OC[C@H]1OC(O)[C@H](O)[C@@H](O)[C@@H]1O has five ring carbons, one ring oxygen and exocyclic C6; formula C6H12O6.
- [SIB ENZYME EC 4.1.1.1 pyruvate decarboxylase](https://enzyme.expasy.org/EC/4.1.1.1): Opened official reaction: 2-oxocarboxylate + H+ = aldehyde + CO2.
- [SIB ENZYME EC 1.1.1.1 alcohol dehydrogenase](https://enzyme.expasy.org/EC/1.1.1.1): Opened official reversible reaction supporting aldehyde + NADH + H+ -> alcohol + NAD+.
- [Analysis of the yeast short-term Crabtree effect and its origin (primary research)](https://www.ebi.ac.uk/europepmc/webservices/rest/PMC4240471/fullTextXML): Read official full-text XML: glucose-pulse experiments show rapid aerobic ethanol formation in Saccharomyces.

## yeastMating - confirmed_issue

S. cerevisiae a/alpha haploids: pheromone recognition, polarization, plasmogamy, congression, karyogamy, diploid zygote. Same-type a/a control excludes mating-type switching.

Checked:

- Checked all bilingual stages and both partner values. same sets q=0 and blocks projection/fusion/congression; both haploid genome sets remain. Default sequence labels and final 2n label broadly correct.
- Eight genome markers remain rather than duplicating at fusion; four per haploid are symbolic. Surface and layered wall/PM evolve into an open neck, but nuclear geometry conflicts with its timing and dimensions.
- Inspected nuclearAnatomy: each nucleus adds separate NE and three chromatin strands; real visible nucleus count differs from metadata during the transition.

### yeastLife-04 / P1

Code: `src/processes/modules/yeastLife/yeastMatingProcess.js`, 171-188; matingSurface 28-40.

Microtubules become visible at q>0.28, run from nuclear center nx to x=0, and SPBs are placed at nx. Cell opening remains zero until q=0.49. At q around 0.35 the rods cross NE, intact plasma membrane/wall and the extracellular gap.

Congression uses cytoplasmic microtubules from membrane-embedded SPBs. Pre-fusion microtubules may orient toward the projection but cannot cross intact cell boundaries to the partner.

Fix: Anchor SPBs in NE and start microtubules on the cytoplasmic face. Keep pre-fusion microtubules within their own cell; allow cross-neck interactions and congression only when cytoplasm is physically continuous.

Verification invariant: At q=0.3,0.4,0.48 every microtubule point lies within its cell cytoplasm without crossing NE. Cross-cell microtubules occur only after a continuous passage exists; same-type control never bridges cells.

Sources: [evidence](https://www.ebi.ac.uk/europepmc/webservices/rest/PMC2080914/fullTextXML)

### yeastLife-05 / P1

Code: `src/processes/modules/yeastLife/yeastMatingProcess.js`, 76-86, 179-183, 217-222; matingSurface 34; anatomy.js:160-185.

At q=0.82-0.86 both parental nuclei and a new diploid nucleus are visible, each with its own envelope/chromatin. Parents then disappear. Final nuclear y/z radius is 0.59 but the cell neck at x=0 has outer radius 0.39 and PM radius about 0.355, so the nuclear envelope protrudes through the retained back-side cell boundary too.

Nuclear fusion establishes continuity between two existing envelopes; it does not create a third nucleus then remove the parents. An intact nucleus cannot extend outside intact plasma membrane.

Fix: Morph contacting parental envelopes into one connected nuclear compartment without adding a third independent nucleus. Expand/remodel the zygote neck or locate the fused nucleus within a sufficiently large cell body to preserve containment.

Verification invariant: Dense samples q=0.77-0.92 transition from two nuclear spaces to one, never three or added chromatin. At every stage all NE points remain within the PM, including the retained back side.

Sources: [evidence](https://www.ebi.ac.uk/europepmc/webservices/rest/PMC2080914/fullTextXML)

Limits: No browser acceptance. The containment error is not inferred from the intentional front viewing cutaway; it also exists on retained surface. Signaling proteins and motor atomic structures are outside scope.

Opened sources:

- [Nuclear fusion during yeast mating occurs by a three-step pathway (2007; primary electron tomography)](https://www.ebi.ac.uk/europepmc/webservices/rest/PMC2080914/fullTextXML): Read official full-text XML. Cell fusion precedes congression by cytoplasmic microtubules; outer NE, inner NE and SPB fusion occur sequentially. Figure 3 and central-plaque analysis locate SPBs within the NE.

## yeastSporulation - confirmed_issue

S. cerevisiae a/alpha diploid under nitrogen starvation and nonfermentable carbon, representative four-spore program: one S phase, MI, MII, prospore enclosure and wall maturation. Rich control off.

Checked:

- Checked all bilingual stages, nutrient control and helper surfaces. rich fixes q=0 and suppresses the meiotic/spore program. Single replication precedes homolog segregation at MI and sister segregation at MII; one homolog pair and one exchange event are explicitly symbolic.
- Four final nuclei and spores stay inside the ascus. Prospore membranes genuinely grow as cups, rather than closed shells appearing at once. Nuclear-envelope connectedness and the identities of the two membrane faces are nevertheless wrong.
- Distinguished nuclear envelope from prospore double membrane and inspected wallAnatomy nesting. Four spores are explicitly representative, not universal for all strains and nutrient states.

### yeastLife-06 / P1

Code: `src/processes/modules/yeastLife/yeastSporulationProcess.js`, dividingEnvelope 10-47; 118-132, 266-275.

At q=0.48 early NE is hidden and replaced by two separate closed longitudinal surfaces at x=-0.88 and +0.88. Each transverse radius is at most 0.64, leaving a gap; MII spindles elongate within separate nuclei.

Budding-yeast meiotic divisions initially share a continuous nuclear envelope. Four nuclear lobes form during MII and partition late; the model instead teaches complete nuclear fission after MI.

Fix: Retain a common nuclear envelope/nucleoplasmic connection after MI and through MII lobe formation, with two intranuclear spindles; partition only during completion of MII and coordinated enclosure.

Verification invariant: At q=0.45,0.50,0.60 the represented nuclear lumen remains one connected compartment; four closed nuclear compartments appear only after MII completion. Check real topology, not metadata count.

Sources: [evidence](https://www.ebi.ac.uk/europepmc/webservices/rest/PMC2132592/fullTextXML)

### yeastLife-07 / P1

Code: `src/processes/modules/yeastLife/yeastSporulationProcess.js`, 68-77, 147-161, 300-320; anatomy.js wallAnatomy.

Outer membranes have radius 0.64 and remain visible for all q>0.59. membraneInner is copied at factor 0.947 (radius 0.606), then hidden at q>=0.85. Walls appear after q=0.84 and scale to 0.68; helper wall shells do not maintain the identity of the original inner membrane.

The inner prospore membrane must persist as spore plasma membrane, whereas the outer membrane is lost during wall maturation. The tracked surfaces show the reverse fate and do not constrain initial wall deposition between the two membranes.

Fix: Keep the same inner bilayer as mature spore PM; deposit early wall in the intermembrane lumen; remove outer membrane later and add outer chitosan/dityrosine layers. Maintain explicit nested surfaces.

Verification invariant: Trace the same inner membrane object across closure/maturation and retain it around cytoplasm. Early wall lies between the two membranes. Outer membrane is later removed; final order is NE, spore cytoplasm/PM, wall, all within ascus.

Sources: [evidence](https://www.ebi.ac.uk/europepmc/webservices/rest/PMC2132592/fullTextXML), [evidence](https://www.ebi.ac.uk/europepmc/webservices/rest/PMC3744438/fullTextXML)

Limits: No browser operation or all-angle acceptance. Exact molecular structures and strain-dependent spore number are not certified; fixed four-spore example is already scoped and is not reported as a new defect.

Opened sources:

- [Prospore Membrane Formation Defines a Developmentally Regulated Branch of the Secretory Pathway in Yeast (1998; primary research)](https://www.ebi.ac.uk/europepmc/webservices/rest/PMC2132592/fullTextXML): Read official full-text XML. Introduction and EM Figure 1: both meiotic divisions initially share a continuous intact NE; four nuclear lobes form in MII, then partition. Inner prospore membrane becomes spore PM, wall initially forms between the two membranes.
- [A Highly Redundant Gene Network Controls Assembly of the Outer Spore Wall in S. cerevisiae (2013; primary research)](https://www.ebi.ac.uk/europepmc/webservices/rest/PMC3744438/fullTextXML): Read official full-text XML, Figure 1: mannans/beta-glucans deposited between membranes; outer membrane disappears; chitosan and dityrosine layers form externally.
