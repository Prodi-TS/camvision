import Card from '../components/Card.jsx'
import PageHeader from '../components/PageHeader.jsx'
import Icon from '../components/Icon.jsx'
import ProfileInputs from '../components/ProfileInputs.jsx'
import { student as defaults } from '../data/learningData.js'
import useProfile from '../data/useProfile.js'
import { useAuth } from '../auth.jsx'

export default function Profile() {
  const { user } = useAuth()
  const [profile, update] = useProfile(user.username)

  const fields = [
    ['Username', user.username],
    ['Program Keahlian', defaults.program],
    ['Konsentrasi', defaults.konsentrasi],
    ['Status', user.role],
  ]

  return (
    <div className="page">
      <PageHeader
        title="Profil"
        description="Isi nama, NIS, dan kelasmu. Isiannya dipakai di portofolio dan tersimpan di browser ini."
        icon="user"
      />
      <Card>
        <div className="profile">
          <div className="profile__avatar">
            <Icon name="user" size={40} />
          </div>
          <div style={{ flex: 1, minWidth: 0, display: 'grid', gap: 18 }}>
            <ProfileInputs profile={profile} onChange={update} />
            <p className="hint" style={{ margin: 0 }}>
              Data hanya tersimpan di browser dan akun ini. Pakai komputer yang sama saat membuat portofolio.
            </p>
            <dl className="profile__list">
              {fields.map(([label, value]) => (
                <div key={label} className="profile__row">
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </Card>
    </div>
  )
}
