/* prettier-ignore-start */

/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as auth from "../auth.js";
import type * as badHabits from "../badHabits.js";
import type * as cohereActions from "../cohereActions.js";
import type * as elevenLabsActions from "../elevenLabsActions.js";
import type * as failures from "../failures.js";
import type * as http from "../http.js";
import type * as langchainAction from "../langchainAction.js";
import type * as settings from "../settings.js";
import type * as users from "../users.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  badHabits: typeof badHabits;
  cohereActions: typeof cohereActions;
  elevenLabsActions: typeof elevenLabsActions;
  failures: typeof failures;
  http: typeof http;
  langchainAction: typeof langchainAction;
  settings: typeof settings;
  users: typeof users;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

/* prettier-ignore-end */
