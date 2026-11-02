import '@testing-library/jest-dom/vitest'

import { configure } from '@testing-library/react'

// Keep async assertions stable when the full suite runs in parallel workers.
configure({ asyncUtilTimeout: 3000 })
