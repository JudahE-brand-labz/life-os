'use client'

import type { CharacterState } from '@/lib/character'

export type { CharacterState }

interface Props {
  state: CharacterState
  size: 'sm' | 'md'
  onClick?: () => void
}

function Cell({ x, y, color }: { x: number; y: number; color: string }) {
  return <rect x={x * 2} y={y * 2} width={2} height={2} fill={color} />
}

const P = {
  skin:  '#E8C49A',
  skinD: '#D4A876',
  hair:  '#3D2B1F',
  shirt: '#CC785C',
  shirtD:'#A85C40',
  pants: '#2D3748',
  eyes:  '#1A1A2E',
  zzz:   '#94A3B8',
  star:  '#FCD34D',
  sweat: '#60A5FA',
}

function IdleBody() {
  return (
    <>
      <Cell x={6} y={2} color={P.hair} /><Cell x={7} y={2} color={P.hair} /><Cell x={8} y={2} color={P.hair} /><Cell x={9} y={2} color={P.hair} />
      <Cell x={5} y={3} color={P.hair} /><Cell x={6} y={3} color={P.skin} /><Cell x={7} y={3} color={P.skin} /><Cell x={8} y={3} color={P.skin} /><Cell x={9} y={3} color={P.skin} /><Cell x={10} y={3} color={P.hair} />
      <Cell x={5} y={4} color={P.skin} /><Cell x={6} y={4} color={P.eyes} /><Cell x={7} y={4} color={P.skin} /><Cell x={8} y={4} color={P.skin} /><Cell x={9} y={4} color={P.eyes} /><Cell x={10} y={4} color={P.skin} />
      <Cell x={5} y={5} color={P.skin} /><Cell x={6} y={5} color={P.skin} /><Cell x={7} y={5} color={P.skin} /><Cell x={8} y={5} color={P.skin} /><Cell x={9} y={5} color={P.skin} /><Cell x={10} y={5} color={P.skin} />
      <Cell x={6} y={6} color={P.skin} /><Cell x={7} y={6} color={P.skinD} /><Cell x={8} y={6} color={P.skinD} /><Cell x={9} y={6} color={P.skin} />
      <Cell x={5} y={7} color={P.shirt} /><Cell x={6} y={7} color={P.shirt} /><Cell x={7} y={7} color={P.shirt} /><Cell x={8} y={7} color={P.shirt} /><Cell x={9} y={7} color={P.shirt} /><Cell x={10} y={7} color={P.shirt} />
      <Cell x={5} y={8} color={P.shirt} /><Cell x={6} y={8} color={P.shirt} /><Cell x={7} y={8} color={P.shirt} /><Cell x={8} y={8} color={P.shirt} /><Cell x={9} y={8} color={P.shirt} /><Cell x={10} y={8} color={P.shirt} />
      <Cell x={5} y={9} color={P.shirtD}/><Cell x={6} y={9} color={P.shirt} /><Cell x={7} y={9} color={P.shirt} /><Cell x={8} y={9} color={P.shirt} /><Cell x={9} y={9} color={P.shirt} /><Cell x={10} y={9} color={P.shirtD}/>
      <Cell x={3} y={7} color={P.skin} /><Cell x={4} y={7} color={P.shirt} />
      <Cell x={3} y={8} color={P.skin} /><Cell x={4} y={8} color={P.shirtD}/>
      <Cell x={11} y={7} color={P.shirt} /><Cell x={12} y={7} color={P.skin} />
      <Cell x={11} y={8} color={P.shirtD}/><Cell x={12} y={8} color={P.skin} />
      <Cell x={6} y={10} color={P.pants}/><Cell x={7} y={10} color={P.pants}/><Cell x={8} y={10} color={P.pants}/><Cell x={9} y={10} color={P.pants}/>
      <Cell x={6} y={11} color={P.pants}/><Cell x={7} y={11} color={P.pants}/><Cell x={8} y={11} color={P.pants}/><Cell x={9} y={11} color={P.pants}/>
      <Cell x={6} y={12} color={P.skinD}/><Cell x={7} y={12} color={P.pants}/><Cell x={8} y={12} color={P.pants}/><Cell x={9} y={12} color={P.skinD}/>
    </>
  )
}

function MouthIdle()     { return <><Cell x={7} y={5} color={P.skinD} /><Cell x={8} y={5} color={P.skinD} /></> }
function MouthSmile()    { return <><Cell x={6} y={5} color={P.skinD} /><Cell x={7} y={5} color={P.skinD} /><Cell x={8} y={5} color={P.skinD} /><Cell x={9} y={5} color={P.skinD} /></> }
function MouthWorried()  { return <><Cell x={7} y={6} color={P.skinD} /><Cell x={8} y={6} color={P.skinD} /></> }
function MouthSleeping() { return <Cell x={7} y={5} color={P.skinD} /> }

export default function ShawnCharacter({ state, size, onClick }: Props) {
  const px = size === 'sm' ? 24 : 40
  const animClass =
    state === 'celebrating' ? 'shawn-bounce' :
    state === 'concerned'   ? 'shawn-shake'  :
    state === 'sleeping'    ? ''             : 'shawn-float'

  return (
    <svg
      width={px}
      height={px}
      viewBox="0 0 32 32"
      style={{ imageRendering: 'pixelated', cursor: onClick ? 'pointer' : 'default' }}
      className={animClass}
      onClick={onClick}
      aria-label={`Shawn — ${state}`}
    >
      <IdleBody />
      {(state === 'idle' || state === 'working') && <MouthIdle />}
      {state === 'celebrating' && <MouthSmile />}
      {state === 'concerned'   && <MouthWorried />}
      {state === 'sleeping'    && <MouthSleeping />}
      {state === 'celebrating' && (
        <>
          <Cell x={2}  y={1} color={P.star} /><Cell x={13} y={0} color={P.star} />
          <Cell x={1}  y={4} color={P.star} /><Cell x={14} y={3} color={P.star} />
        </>
      )}
      {state === 'concerned' && <Cell x={11} y={3} color={P.sweat} />}
      {state === 'sleeping' && (
        <>
          <Cell x={11} y={1} color={P.zzz} /><Cell x={12} y={2} color={P.zzz} />
          <Cell x={11} y={3} color={P.zzz} /><Cell x={12} y={3} color={P.zzz} />
          <Cell x={13} y={0} color={P.zzz} /><Cell x={14} y={1} color={P.zzz} />
          <Cell x={13} y={2} color={P.zzz} /><Cell x={14} y={2} color={P.zzz} />
        </>
      )}
    </svg>
  )
}
