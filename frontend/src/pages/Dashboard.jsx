import React, { useEffect, useMemo, useState } from 'react'
import { apiGet, apiPatch, apiPost, getToken, getUser } from '../lib/api'

const empty = null

function JsonBox({ value }) {
  if (!value) return <div className="pill muted">Aucun résultat</div>
  return <pre className="mono">{JSON.stringify(value, null, 2)}</pre>
}

function Field({ label, children }) {
  return (
    <label className="stack" style={{ gap: 6 }}>
      <span className="small muted">{label}</span>
      {children}
    </label>
  )
}

export default function Dashboard() {
  const token = getToken()
  const user = useMemo(() => getUser(), [])

  const [selectedTab, setSelectedTab] = useState('overview')
  const [conges, setConges] = useState(empty)
  const [verifyResult, setVerifyResult] = useState(empty)
  const [paieResult, setPaieResult] = useState(empty)
  const [heuresSupResult, setHeuresSupResult] = useState(empty)
  const [debugConges, setDebugConges] = useState(empty)
  const [candidats, setCandidats] = useState(empty)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const [congesForm, setCongesForm] = useState({
    dateDebut: '2026-09-01',
    dateFin: '2026-09-03',
    motif: 'Repos',
  })
  const [paieForm, setPaieForm] = useState({
    employeeId: String(user.id || 1),
    mois: '1',
    annee: '2026',
  })
  const [heuresSupForm, setHeuresSupForm] = useState({
    employeeId: String(user.id || 1),
    heures: '10',
  })
  const [candidateForm, setCandidateForm] = useState({
    nom: 'Doe',
    prenom: 'Jane',
    email: 'jane.doe@example.com',
    poste: 'Développeuse',
    cv: null,
  })
  const [candidateStatusForm, setCandidateStatusForm] = useState({
    id: '',
    statut: 'accepte',
  })

  const resetNotice = () => {
    setMessage('')
    setError('')
  }

  const fail = (e) => {
    console.error(e)
    setError(e.response?.data?.error || e.message || 'Erreur inconnue')
    setMessage('')
  }

  const loadConges = async () => {
    resetNotice()
    try {
      const { data } = await apiGet(`/conges/solde/${user.id}`)
      setConges(data)
      setMessage('Solde congés chargé')
    } catch (e) {
      fail(e)
    }
  }

  const loadVerify = async () => {
    resetNotice()
    try {
      const { data } = await apiPost('/auth/verify', { token })
      setVerifyResult(data)
      setMessage('JWT validé')
    } catch (e) {
      fail(e)
    }
  }

  const loadCandidates = async () => {
    resetNotice()
    try {
      const { data } = await apiGet('/recrutement/candidats')
      setCandidats(data)
      setMessage('Candidats chargés')
    } catch (e) {
      fail(e)
    }
  }

  const loadDebugConges = async () => {
    resetNotice()
    try {
      const { data } = await apiGet('/conges/debug/all')
      setDebugConges(data)
      setMessage('Debug congés chargé')
    } catch (e) {
      fail(e)
    }
  }

  const calculatePaie = async () => {
    resetNotice()
    try {
      const { data } = await apiPost('/paie/calculer', {
        employeeId: Number(paieForm.employeeId),
        mois: Number(paieForm.mois),
        annee: Number(paieForm.annee),
      })
      setPaieResult(data)
      setMessage('Bulletin calculé')
    } catch (e) {
      fail(e)
    }
  }

  const calculateHours = async () => {
    resetNotice()
    try {
      const { data } = await apiPost('/paie/heures-sup', {
        employeeId: Number(heuresSupForm.employeeId),
        heures: Number(heuresSupForm.heures),
      })
      setHeuresSupResult(data)
      setMessage('Heures supplémentaires calculées')
    } catch (e) {
      fail(e)
    }
  }

  const createConges = async (e) => {
    e.preventDefault()
    resetNotice()
    try {
      const { data } = await apiPost('/conges/demande', {
        employeeId: Number(user.id || 1),
        dateDebut: congesForm.dateDebut,
        dateFin: congesForm.dateFin,
        motif: congesForm.motif,
      })
      setConges(data)
      setMessage('Demande de congés créée')
    } catch (err) {
      fail(err)
    }
  }

  const createCandidate = async (e) => {
    e.preventDefault()
    resetNotice()
    try {
      const formData = new FormData()
      formData.append('nom', candidateForm.nom)
      formData.append('prenom', candidateForm.prenom)
      formData.append('email', candidateForm.email)
      formData.append('poste', candidateForm.poste)
      if (candidateForm.cv) formData.append('cv', candidateForm.cv)
      const { data } = await apiPost('/recrutement/candidat', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setMessage('Candidature créée')
      setCandidats(prev => [data, ...(Array.isArray(prev) ? prev : [])])
    } catch (err) {
      fail(err)
    }
  }

  const updateCandidateStatus = async (e) => {
    e.preventDefault()
    resetNotice()
    try {
      await apiPatch(`/recrutement/candidat/${candidateStatusForm.id}/statut`, {
        statut: candidateStatusForm.statut,
      })
      setMessage('Statut candidat mis à jour')
      loadCandidates()
    } catch (err) {
      fail(err)
    }
  }

  const logout = () => {
    localStorage.removeItem('hrflow_token')
    localStorage.removeItem('hrflow_user')
    window.location.href = '/'
  }

  useEffect(() => {
    if (!token) {
      window.location.href = '/'
      return
    }
    loadVerify()
    loadConges()
    loadCandidates()
    loadDebugConges()
    calculatePaie()
    calculateHours()
  }, [])

  return (
    <div className="app-shell">
      <div className="hero">
        <div className="toolbar" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div className="kicker">HRFlow — demo opérationnelle</div>
            <h1 className="title">Bonjour {user.email}</h1>
            <p className="subtitle">Tout tester depuis le front : auth, congés, paie, recrutement et endpoints support.</p>
          </div>
          <button className="button danger" onClick={logout}>Déconnexion</button>
        </div>
      </div>

      <div className="grid">
        <section className="card">
          <div className="kicker">Vue d’ensemble</div>
          <div className="stack">
            <div className="pill">Utilisateur : {user.email}</div>
            <div className="pill">ID : {user.id || 'n/a'}</div>
            <div className="pill">Token : {token ? 'présent' : 'absent'}</div>
            <div className="toolbar">
              <button className="button primary" onClick={() => setSelectedTab('overview')}>Résumé</button>
              <button className="button" onClick={() => setSelectedTab('conges')}>Congés</button>
              <button className="button" onClick={() => setSelectedTab('paie')}>Paie</button>
              <button className="button" onClick={() => setSelectedTab('recrutement')}>Recrutement</button>
              <button className="button" onClick={() => setSelectedTab('ops')}>Support</button>
            </div>
            {message && <div className="pill" style={{ color: 'var(--ok)' }}>{message}</div>}
            {error && <div className="pill" style={{ color: 'var(--danger)' }}>{error}</div>}
          </div>
        </section>

        <section className="card">
          <div className="kicker">Auth</div>
          <div className="stack">
            <button className="button success" onClick={loadVerify}>Vérifier le JWT</button>
            <JsonBox value={verifyResult} />
          </div>
        </section>

        <section className="card">
          <div className="kicker">Congés</div>
          <div className="stack">
            <button className="button primary" onClick={loadConges}>Recharger le solde</button>
            <JsonBox value={conges} />
          </div>
        </section>

        <section className="card">
          <div className="kicker">Support / debug</div>
          <div className="stack">
            <button className="button warn" onClick={loadDebugConges}>Voir le debug congés</button>
            <JsonBox value={debugConges} />
          </div>
        </section>
      </div>

      <div className="grid" style={{ marginTop: 18 }}>
        <section className="card">
          <div className="kicker">Congés — créer une demande</div>
          <form className="stack" onSubmit={createConges}>
            <div className="row">
              <Field label="Date début">
                <input className="input" type="date" value={congesForm.dateDebut} onChange={e => setCongesForm({ ...congesForm, dateDebut: e.target.value })} />
              </Field>
              <Field label="Date fin">
                <input className="input" type="date" value={congesForm.dateFin} onChange={e => setCongesForm({ ...congesForm, dateFin: e.target.value })} />
              </Field>
            </div>
            <Field label="Motif">
              <input className="input" value={congesForm.motif} onChange={e => setCongesForm({ ...congesForm, motif: e.target.value })} />
            </Field>
            <button className="button primary" type="submit">Créer la demande</button>
          </form>
          <div style={{ marginTop: 12 }}><JsonBox value={conges} /></div>
        </section>

        <section className="card">
          <div className="kicker">Paie — calcul bulletin</div>
          <div className="stack">
            <div className="row">
              <Field label="Salarié ID">
                <input className="input" value={paieForm.employeeId} onChange={e => setPaieForm({ ...paieForm, employeeId: e.target.value })} />
              </Field>
              <Field label="Mois">
                <input className="input" value={paieForm.mois} onChange={e => setPaieForm({ ...paieForm, mois: e.target.value })} />
              </Field>
              <Field label="Année">
                <input className="input" value={paieForm.annee} onChange={e => setPaieForm({ ...paieForm, annee: e.target.value })} />
              </Field>
            </div>
            <button className="button success" onClick={calculatePaie}>Calculer le bulletin</button>
            <JsonBox value={paieResult} />
          </div>
        </section>

        <section className="card">
          <div className="kicker">Paie — heures sup</div>
          <div className="stack">
            <div className="row">
              <Field label="Salarié ID">
                <input className="input" value={heuresSupForm.employeeId} onChange={e => setHeuresSupForm({ ...heuresSupForm, employeeId: e.target.value })} />
              </Field>
              <Field label="Heures">
                <input className="input" value={heuresSupForm.heures} onChange={e => setHeuresSupForm({ ...heuresSupForm, heures: e.target.value })} />
              </Field>
            </div>
            <button className="button warn" onClick={calculateHours}>Calculer les heures sup</button>
            <JsonBox value={heuresSupResult} />
          </div>
        </section>

        <section className="card">
          <div className="kicker">Recrutement — candidatures</div>
          <div className="stack">
            <button className="button primary" onClick={loadCandidates}>Rafraîchir la liste</button>
            <JsonBox value={candidats} />
          </div>
        </section>
      </div>

      <div className="grid" style={{ marginTop: 18 }}>
        <section className="card">
          <div className="kicker">Recrutement — créer un candidat</div>
          <form className="stack" onSubmit={createCandidate}>
            <div className="row">
              <Field label="Nom">
                <input className="input" value={candidateForm.nom} onChange={e => setCandidateForm({ ...candidateForm, nom: e.target.value })} />
              </Field>
              <Field label="Prénom">
                <input className="input" value={candidateForm.prenom} onChange={e => setCandidateForm({ ...candidateForm, prenom: e.target.value })} />
              </Field>
            </div>
            <Field label="Email">
              <input className="input" value={candidateForm.email} onChange={e => setCandidateForm({ ...candidateForm, email: e.target.value })} />
            </Field>
            <Field label="Poste">
              <input className="input" value={candidateForm.poste} onChange={e => setCandidateForm({ ...candidateForm, poste: e.target.value })} />
            </Field>
            <Field label="CV">
              <input className="input" type="file" onChange={e => setCandidateForm({ ...candidateForm, cv: e.target.files?.[0] || null })} />
            </Field>
            <button className="button success" type="submit">Créer la candidature</button>
          </form>
        </section>

        <section className="card">
          <div className="kicker">Recrutement — changer le statut</div>
          <form className="stack" onSubmit={updateCandidateStatus}>
            <Field label="ID candidat">
              <input className="input" value={candidateStatusForm.id} onChange={e => setCandidateStatusForm({ ...candidateStatusForm, id: e.target.value })} />
            </Field>
            <Field label="Statut">
              <select className="select" value={candidateStatusForm.statut} onChange={e => setCandidateStatusForm({ ...candidateStatusForm, statut: e.target.value })}>
                <option value="recu">recu</option>
                <option value="accepte">accepte</option>
                <option value="refuse">refuse</option>
                <option value="en_cours">en_cours</option>
              </select>
            </Field>
            <button className="button primary" type="submit">Mettre à jour</button>
          </form>
        </section>

        <section className="card">
          <div className="kicker">Support</div>
          <div className="stack">
            <button className="button warn" onClick={() => apiPost('/paie/migrate', {}).then(() => setMessage('Migration paie lancée')).catch(fail)}>Lancer la migration paie</button>
            <button className="button" onClick={loadDebugConges}>Recharger le debug congés</button>
            <button className="button" onClick={loadVerify}>Re-vérifier le JWT</button>
          </div>
        </section>
      </div>

      <div className="grid" style={{ marginTop: 18 }}>
        <section className="card">
          <div className="kicker">Candidats</div>
          <JsonBox value={candidats} />
        </section>
        <section className="card">
          <div className="kicker">Paie</div>
          <JsonBox value={paieResult || heuresSupResult} />
        </section>
      </div>
    </div>
  )
}
