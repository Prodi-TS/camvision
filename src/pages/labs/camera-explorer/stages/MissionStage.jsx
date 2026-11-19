import Button from '../../../../components/Button.jsx'
import Icon from '../../../../components/Icon.jsx'
import { MISSION_CODE, MISSION_TITLE, MISSION_BRIEF, MISSION_TASKS } from '../labData.js'

export default function MissionStage({ state, onStart }) {
  return (
    <div className="mission-card viewfinder">
      <div className="mission-card__tag">
        <Icon name="target" size={18} />
        <span>
          {MISSION_CODE} · {MISSION_TITLE}
        </span>
      </div>
      <p className="mission-card__brief">{MISSION_BRIEF}</p>

      <div className="mission-card__tasks">
        <h3>Tugas teknisi</h3>
        <ol>
          {MISSION_TASKS.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ol>
      </div>

      {state.started ? (
        <p className="mission-card__started">Misi sudah dimulai. Lanjutkan ke Explore Camera.</p>
      ) : (
        <Button onClick={onStart}>Mulai Misi</Button>
      )}
    </div>
  )
}
