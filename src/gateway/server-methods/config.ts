import {
  loadConfig,
  readConfigFileSnapshot,
  writeConfigFile,
} from "../../config/config.js";
import {
  validateConfigGetParams,
  validateConfigSetParams,
} from "../protocol/index.js";
import type { GatewayRequestHandlers } from "./types.js";
import { assertValidParams } from "./validation.js";

export const configHandlers: GatewayRequestHandlers = {
  "config.get": async ({ params, respond }) => {
    if (!assertValidParams(params, validateConfigGetParams, "config.get", respond)) {
      return;
    }
    const snapshot = await readConfigFileSnapshot();
    respond(true, snapshot.config, undefined);
  },
  "config.set": async ({ params, respond }) => {
    if (!assertValidParams(params, validateConfigSetParams, "config.set", respond)) {
      return;
    }
    const newConfig = (params as any).config;
    if (!newConfig) {
      respond(false, undefined, { code: "invalid_params", message: "config required" });
      return;
    }
    await writeConfigFile(newConfig);
    respond(true, { ok: true, config: newConfig }, undefined);
  },
};
