declare const __BUILD_SHA__: string

/** Short git SHA baked in at build time (see vite.config + CI). */
export const buildSha =
  typeof __BUILD_SHA__ !== 'undefined' && __BUILD_SHA__ !== 'local'
    ? __BUILD_SHA__.slice(0, 7)
    : 'dev'

export const buildFeaturesLabel =
  'PDF invoice · Excel toolbar · secondary admins · cell merge'
