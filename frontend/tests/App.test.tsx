import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from '../src/App'

// Simple test to ensure the frontend renders change when frontpage is created
describe('App', () => {
  it('renders without crashing', () => {
    render(<App />)
    expect(
      screen.getByRole('heading', { name: /get started/i })
    ).toBeInTheDocument()
  })
})
