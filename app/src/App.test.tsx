import { render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import App from './App'

it('renderiza o título e um botão do sistema de design', () => {
  render(<App />)
  expect(screen.getByRole('heading', { name: 'Scua Logon' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Provisório' })).toBeInTheDocument()
})
