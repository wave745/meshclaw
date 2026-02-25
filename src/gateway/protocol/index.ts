import AjvPkg, { type ErrorObject } from "ajv";
import {
  ConnectParamsSchema,
  RequestFrameSchema,
  ResponseFrameSchema,
  EventFrameSchema,
  ErrorCodes,
  errorShape,
  type ConnectParams,
  type RequestFrame,
  type ResponseFrame,
  type EventFrame,
  ConfigGetParamsSchema,
  ConfigSetParamsSchema,
} from "./schema.js";

const ajv = new (AjvPkg as any)({
  allErrors: true,
  strict: false,
  removeAdditional: false,
});

export const validateConnectParams = ajv.compile<ConnectParams>(ConnectParamsSchema);
export const validateRequestFrame = ajv.compile<RequestFrame>(RequestFrameSchema);
export const validateResponseFrame = ajv.compile<ResponseFrame>(ResponseFrameSchema);
export const validateEventFrame = ajv.compile<EventFrame>(EventFrameSchema);
export const validateConfigGetParams = ajv.compile(ConfigGetParamsSchema);
export const validateConfigSetParams = ajv.compile(ConfigSetParamsSchema);

export function formatValidationErrors(errors: ErrorObject[] | null | undefined) {
  if (!errors?.length) {
    return "unknown validation error";
  }
  return ajv.errorsText(errors, { separator: "; " });
}

export {
  ErrorCodes,
  errorShape,
};
