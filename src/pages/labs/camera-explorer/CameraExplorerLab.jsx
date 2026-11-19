import Card from '../../../components/Card.jsx'
import Button from '../../../components/Button.jsx'
import ProgressBar from '../../../components/ProgressBar.jsx'
import StatusBadge from '../../../components/StatusBadge.jsx'
import { useAuth } from '../../../auth.jsx'
import useLabState from './useLabState.js'
import MissionStage from './stages/MissionStage.jsx'
import ExploreStage from './stages/ExploreStage.jsx'
import PartsStage from './stages/PartsStage.jsx'
import SpecsStage from './stages/SpecsStage.jsx'
import DatasheetStage from './stages/DatasheetStage.jsx'
import SelectionStage from './stages/SelectionStage.jsx'
import DecisionStage from './stages/DecisionStage.jsx'
import ReflectionStage from './stages/ReflectionStage.jsx'
import {
  MISSION_CODE,
  MISSION_TITLE,
  LAB_TAGLINE,
  STAGE_TITLES,
  CAMERAS,
  SCENARIO,
  getActivities,
} from './labData.js'
import './camera-explorer.css'

function Completion({ state }) {
  const cam = CAMERAS.find((c) => c.id === state.selection)
  return (
    <Card className="completion card--accent">
      <h2>{MISSION_CODE} selesai</h2>
      <p className="completion__lead">
        Kamu telah menyelesaikan {MISSION_TITLE}. Ringkasan keputusanmu:
      </p>
      <dl className="completion__summary">
        <div>
          <dt>Kebutuhan robot</dt>
          <dd>{SCENARIO.text}</dd>
        </div>
        <div>
          <dt>Kamera yang dipilih</dt>
          <dd>
            {cam.name} (FOV {cam.specs.FOV}, {cam.specs.Resolution}, {cam.specs.FPS} FPS)
          </dd>
        </div>
        <div>
          <dt>Keputusan teknisi</dt>
          <dd>{state.decision === 'YES' ? 'Sesuai dengan kebutuhan misi' : 'Belum sesuai dengan kebutuhan misi'}</dd>
        </div>
      </dl>
    </Card>
  )
}

// Komponen ini sekarang ditanam di halaman P13 Camera (bukan halaman Virtual Lab).
export default function CameraExplorerLab() {
  const { user } = useAuth()
  const { state, update } = useLabState(user.username)

  const activities = getActivities(state)
  const doneCount = activities.filter((a) => a.done).length
  const total = activities.length
  const percent = Math.round((doneCount / total) * 100)
  const firstOpen = activities.findIndex((a) => !a.done)
  const maxIndex = firstOpen === -1 ? total - 1 : firstOpen
  const current = Math.min(state.stage, maxIndex)
  const allDone = doneCount === total
  const status =
    doneCount === 0 ? 'Belum dimulai' : allDone ? 'Selesai' : 'Sedang dipelajari'

  function goTo(i) {
    if (i <= maxIndex) update({ stage: i })
  }

  const stageProps = { state, update, goTo }
  const stages = [
    <MissionStage
      key="mission"
      state={state}
      onStart={() => update({ started: true, stage: 1 })}
    />,
    <ExploreStage key="explore" {...stageProps} />,
    <PartsStage key="parts" {...stageProps} />,
    <SpecsStage key="specs" {...stageProps} />,
    <DatasheetStage key="datasheet" {...stageProps} />,
    <SelectionStage key="selection" {...stageProps} />,
    <DecisionStage key="decision" {...stageProps} />,
    <ReflectionStage key="reflection" {...stageProps} />,
  ]

  const canNext = current < total - 1 && activities[current].done

  return (
    <div className="page lab1 lab1--embedded" style={{ padding: 0, maxWidth: 'none' }}>
      <section className="hero viewfinder">
        <div className="hero__text">
          <div className="lab1__badges">
            <span className="badge badge--info">SIMULASI</span>
            <StatusBadge status={status} />
          </div>
          <h1>Camera Explorer</h1>
          <p>{LAB_TAGLINE}</p>
        </div>
        <div className="hero__progress">
          <span className="hero__mission">
            {MISSION_CODE} · {MISSION_TITLE}
          </span>
          <ProgressBar value={percent} label="Progress lab" size="lg" />
        </div>
      </section>

      <div className="lab-layout">
        <div className="lab-main">
          <Card className="stage">
            <div className="stage__head">
              <span className="stage__no">
                Tahap {current + 1} dari {total}
              </span>
              <h2>{STAGE_TITLES[current]}</h2>
            </div>

            {stages[current]}

            <div className="stage__nav">
              <Button
                variant="secondary"
                disabled={current === 0}
                onClick={() => goTo(current - 1)}
              >
                Sebelumnya
              </Button>
              {current < total - 1 && (
                <Button
                  disabled={!canNext}
                  onClick={() => goTo(current + 1)}
                  title={canNext ? undefined : 'Selesaikan tahap ini terlebih dahulu'}
                >
                  Lanjut: {STAGE_TITLES[current + 1]}
                </Button>
              )}
            </div>
          </Card>

          {allDone && <Completion state={state} />}
        </div>

        <aside className="tracker" aria-label="Progress tracker">
          <h2>Progress Tracker</h2>
          <p className="tracker__count">
            {doneCount} / {total} activities completed
          </p>
          <ProgressBar value={percent} size="md" />
          <ol className="tracker__list">
            {activities.map((a, i) => {
              const locked = i > maxIndex
              return (
                <li key={a.id}>
                  <button
                    type="button"
                    className={`tracker__item${i === current ? ' is-current' : ''}${
                      a.done ? ' is-done' : ''
                    }`}
                    disabled={locked}
                    aria-current={i === current ? 'step' : undefined}
                    onClick={() => goTo(i)}
                  >
                    <span className="tracker__dot" aria-hidden="true">
                      {a.done ? '✓' : i + 1}
                    </span>
                    <span className="tracker__label">{a.label}</span>
                    {a.detail && !a.done && <span className="tracker__detail">{a.detail}</span>}
                  </button>
                </li>
              )
            })}
          </ol>
        </aside>
      </div>
    </div>
  )
}
