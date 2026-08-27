/** Temporary tester conveniences for the public dev build. Disable before release. */
export const BETA_TESTING = true;

/** In beta, selectors/navigation ignore progression locks without mutating the real save. */
export const betaAllowsLevelAccess = (): boolean => BETA_TESTING;
