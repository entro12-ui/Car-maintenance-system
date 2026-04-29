/** HillMaster-style File menu — same sidebar pattern as Maintenance / Setup. */
export const FILE_MENU = [
  { slug: 'company-setup', label: 'Company Setup', path: '/company-setup' },
  { slug: 'gl-account-no-setup', label: 'GL AccountNo Setup', path: '/gl-account-setup' },
  { slug: 'estimation-letter-setup', label: 'Estimation Letter Setup' },
]

export function fileMenuPath(itemOrSlug) {
  if (typeof itemOrSlug === 'object' && itemOrSlug?.path) return itemOrSlug.path
  const slug = typeof itemOrSlug === 'object' ? itemOrSlug.slug : itemOrSlug
  return `/file/${slug}`
}
