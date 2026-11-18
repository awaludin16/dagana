import '@testing-library/jest-dom/vitest'

import { configure } from '@testing-library/react'

// Keep async assertions stable when the full suite runs in parallel workers.
configure({ asyncUtilTimeout: 5000 })

// jsdom tidak menyediakan API pointer capture / scrollIntoView yang dipakai Radix saat menu dibuka.
if (!Element.prototype.hasPointerCapture) {
  Element.prototype.hasPointerCapture = () => false
  Element.prototype.setPointerCapture = () => {}
  Element.prototype.releasePointerCapture = () => {}
}
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {}
}
