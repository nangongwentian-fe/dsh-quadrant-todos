/**
 * Host half of the quadrant todo bundle.
 *
 * The first version keeps every task in the Web client, so the Host plugin has
 * no services, tools, or stored state yet; it exists so the bundle has a
 * mountable row and so a later version can grow a Host store behind the same
 * patch entry without renaming the package.
 */
export function apply() {}
