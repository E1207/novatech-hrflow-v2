import React from 'react'
import { render, screen } from '@testing-library/react'
import Login from '../components/Login'

describe('LoginForm', () => {
  test('affiche le formulaire de connexion', () => {
    render(<Login />)
    expect(screen.getByRole('heading', { name: 'HRFlow' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Connexion' })).toBeInTheDocument()
  })

  test('affiche les champs email et mot de passe', () => {
    render(<Login />)
    expect(screen.getByPlaceholderText('Email')).toHaveAttribute('type', 'email')
    expect(screen.getByPlaceholderText('Mot de passe')).toHaveAttribute('type', 'password')
  })
})
