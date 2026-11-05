import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { SearchableSelect } from '@/components/SearchableSelect'

const options = [
  { id: '31', name: 'DKI JAKARTA' },
  { id: '32', name: 'JAWA BARAT' },
]

describe('SearchableSelect', () => {
  it('filters options and selects the searched result', () => {
    const onChange = vi.fn()

    render(
      <SearchableSelect
        id="province"
        label="Provinsi"
        value={null}
        options={options}
        isLoading={false}
        onChange={onChange}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Provinsi' }))
    fireEvent.change(screen.getByLabelText('Cari provinsi'), { target: { value: 'jawa' } })

    expect(screen.queryByText('DKI JAKARTA')).not.toBeInTheDocument()

    const option = screen.getByRole('option', { name: /JAWA BARAT/ })
    fireEvent.click(within(option).getByRole('button'))

    expect(onChange).toHaveBeenCalledWith(options[1])
  })
})
