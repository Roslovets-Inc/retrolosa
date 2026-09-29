// Updating a share link is optional. Browsers (notably Safari) rate-limit
// History API writes; a failed URL update must never unmount the application.
export function replaceViewUrl(hash: string) {
  if (location.hash === hash) return
  try {
    history.replaceState(null, '', hash)
  } catch (error) {
    if (!(error instanceof DOMException && error.name === 'SecurityError')) {
      console.warn('Could not update the map link', error)
    }
  }
}
