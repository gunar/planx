import { unstable_createMuiStrictModeTheme } from "@material-ui/core/styles";
import { TransitionFunction, unstable_useTransition } from "react";
import { unstable_createRoot } from "react-dom";

/**
 * Typing hacks for experimental concurrent mode features in React
 */

export const createRoot = unstable_createRoot;

export const useTransition: () => [
  (fn: TransitionFunction) => void,
  boolean
] = unstable_useTransition;

export const createMuiStrictModeTheme = unstable_createMuiStrictModeTheme;
