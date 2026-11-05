import * as media from "mediabunny";
import { installVideoEncoderWorker } from "./videoEncoderRuntime.js";

installVideoEncoderWorker(self, media);
