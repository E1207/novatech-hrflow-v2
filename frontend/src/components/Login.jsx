import React, { useState } from 'react'
import axios from 'axios'
import { API_URL } from '../lib/api'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const { data } = await axios.post(`${API_URL}/auth/login`, { email, password })
      localStorage.setItem('hrflow_token', data.token)
      localStorage.setItem('hrflow_user', JSON.stringify(data.user))
      window.location.href = '/dashboard'
    } catch (err) {
      setError('Identifiants invalides')
      console.error('Login error:', err.response?.data)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app-shell" style={{ display: 'grid', placeItems: 'center' }}>
      <div className="card" style={{ maxWidth: 560, width: '100%' }}>
        <h1 className="title" style={{ fontSize: 40 }}>HRFlow</h1>
        <p className="subtitle">Connexion pour tester toute la plateforme en quelques clics.</p>

        <form onSubmit={handleLogin} className="stack" style={{ marginTop: 20 }}>
          <input className="input" type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
          <input className="input" type="password" placeholder="Mot de passe" value={password} onChange={e => setPassword(e.target.value)} />
          {error && <div className="pill error" style={{ color: 'var(--danger)' }}>{error}</div>}
          <button className="button primary" type="submit" disabled={loading}>
            {loading ? 'Connexion...' : 'Connexion'}
          </button>
        </form>

        <div className="mono" style={{ marginTop: 16 }}>
          Compte de démo : smoke-test@hrflow.local / Demo1234!
        </div>
      </div>
    </div>
  )
}
