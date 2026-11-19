import { useState } from 'react'
import { useAuth } from '../auth.jsx'
import Icon from '../components/Icon.jsx'
import { DEMO_ACCOUNT } from '../data/accounts.js'

export default function Login() {
  const { login } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    if (!username.trim() || !password) {
      setError('Isi username dan password terlebih dahulu.')
      return
    }
    if (!login(username, password)) {
      setError('Username atau password salah. Periksa kembali penulisannya.')
    }
  }

  return (
    <div className="login">
      <section className="login__intro viewfinder">
        <div className="login__logo">
          <Icon name="eye" size={28} />
        </div>
        <h1>Lab Maya Penglihatan Robot</h1>
        <p>Belajar melihat, memahami, menguji, dan mengoptimalkan penglihatan robot.</p>
      </section>

      <section className="login__panel">
        <form className="login__form" onSubmit={handleSubmit} noValidate>
          <h2>Masuk</h2>
          <p className="login__lead">Masukkan username dan password yang sudah diberikan.</p>

          <label className="field">
            <span>Username</span>
            <input
              name="username"
              type="text"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck="false"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value)
                if (error) setError('')
              }}
              aria-invalid={error ? 'true' : 'false'}
              aria-describedby={error ? 'login-error' : undefined}
              autoFocus
            />
          </label>

          <label className="field">
            <span>Password</span>
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                if (error) setError('')
              }}
              aria-invalid={error ? 'true' : 'false'}
              aria-describedby={error ? 'login-error' : undefined}
            />
          </label>

          {error && (
            <p id="login-error" className="field-error" role="alert">
              {error}
            </p>
          )}

          <button type="submit" className="btn btn--primary login__submit">
            Masuk
          </button>

          <div className="login__demo">
            <p className="login__demo-title">Ingin mencoba tanpa akun?</p>
            <p className="login__demo-text">
              Pakai akun contoh: username <code>{DEMO_ACCOUNT.username}</code>, password{' '}
              <code>{DEMO_ACCOUNT.password}</code>.
            </p>
            <button
              type="button"
              className="btn btn--secondary"
              onClick={() => {
                setUsername(DEMO_ACCOUNT.username)
                setPassword(DEMO_ACCOUNT.password)
                setError('')
              }}
            >
              Isi otomatis
            </button>
            <p className="login__demo-text">Data akun contoh hanya tersimpan di browser yang dipakai.</p>
          </div>

          <p className="login__note">
            Pengecekan login masih dilakukan di browser, belum di server.
          </p>
        </form>
      </section>
    </div>
  )
}
