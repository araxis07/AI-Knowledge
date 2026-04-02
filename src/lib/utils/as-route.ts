import type { Route } from "next";

export function asRoute(value: string): Route {
  return value as Route;
}
