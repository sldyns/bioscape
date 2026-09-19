// Explicit metadata imports keep the directory independent of Three.js.
import { entries as genome } from "./modules/genome/entries.js";
import { entries as regulation } from "./modules/regulation/entries.js";
import { entries as chromatin } from "./modules/chromatin/entries.js";
import { entries as rna } from "./modules/rna/entries.js";
import { entries as translation } from "./modules/translation/entries.js";
import { entries as turnover } from "./modules/turnover/entries.js";
import { entries as energy } from "./modules/energy/entries.js";
import { entries as membrane } from "./modules/membrane/entries.js";
import { entries as traffic } from "./modules/traffic/entries.js";
import { entries as division } from "./modules/division/entries.js";
import { entries as signals } from "./modules/signals/entries.js";
import { entries as neurons } from "./modules/neurons/entries.js";
import { entries as plantWater } from "./modules/plantWater/entries.js";
import { entries as plantGrowth } from "./modules/plantGrowth/entries.js";
import { entries as plantSignals } from "./modules/plantSignals/entries.js";
import { entries as plantConnections } from "./modules/plantConnections/entries.js";
import { entries as operons } from "./modules/operons/entries.js";
import { entries as bacterialCore } from "./modules/bacterialCore/entries.js";
import { entries as bacterialSignals } from "./modules/bacterialSignals/entries.js";
import { entries as yeastLife } from "./modules/yeastLife/entries.js";
import { entries as parameciumLife } from "./modules/parameciumLife/entries.js";
import { entries as phageLife } from "./modules/phageLife/entries.js";
export const extensionEntries = [
  ...genome,
  ...regulation,
  ...chromatin,
  ...rna,
  ...translation,
  ...turnover,
  ...energy,
  ...membrane,
  ...traffic,
  ...division,
  ...signals,
  ...neurons,
  ...plantWater,
  ...plantGrowth,
  ...plantSignals,
  ...plantConnections,
  ...operons,
  ...bacterialCore,
  ...bacterialSignals,
  ...yeastLife,
  ...parameciumLife,
  ...phageLife,
];
