import { OpenClawSchema } from "./zod-schema.js";
import type { OpenClawConfig, ConfigValidationIssue } from "./types.js";

export function validateConfigObjectRaw(
  raw: unknown,
): { ok: true; config: OpenClawConfig } | { ok: false; issues: ConfigValidationIssue[] } {
  const validated = OpenClawSchema.safeParse(raw);
  if (!validated.success) {
    return {
      ok: false,
      issues: validated.error.issues.map((iss) => ({
        path: iss.path.join("."),
        message: iss.message,
      })),
    };
  }
  return {
    ok: true,
    config: validated.data as OpenClawConfig,
  };
}

export function validateConfigObject(
  raw: unknown,
): { ok: true; config: OpenClawConfig } | { ok: false; issues: ConfigValidationIssue[] } {
  return validateConfigObjectRaw(raw);
}

export function validateConfigObjectWithPlugins(raw: unknown):
  | {
    ok: true;
    config: OpenClawConfig;
    warnings: ConfigValidationIssue[];
  }
  | {
    ok: false;
    issues: ConfigValidationIssue[];
    warnings: ConfigValidationIssue[];
  } {
  const base = validateConfigObject(raw);
  if (!base.ok) {
    return { ok: false, issues: base.issues, warnings: [] };
  }
  return { ok: true, config: base.config, warnings: [] };
}

export function validateConfigObjectRawWithPlugins(raw: unknown):
  | {
    ok: true;
    config: OpenClawConfig;
    warnings: ConfigValidationIssue[];
  }
  | {
    ok: false;
    issues: ConfigValidationIssue[];
    warnings: ConfigValidationIssue[];
  } {
  return validateConfigObjectWithPlugins(raw);
}
