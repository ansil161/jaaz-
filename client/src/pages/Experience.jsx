import { useCallback, useEffect, useRef, useState } from 'react'
import {
  gamingChannels,
  gamingDefaults,
  getRoom,
  rooms,
  theatreChannels,
  theatreDefaults,
  theatreHotspots,
  theatreStory,
} from '../data/experience'
import { ScrollTrigger } from '../lib/useGsap'
import { useRoomConfig } from '../lib/useRoomConfig'
import { Lines } from '../components/ui/Motion'

import Threshold from '../components/experience/Threshold'
import HouseMap from '../components/experience/HouseMap'
import HouseRail from '../components/experience/HouseRail'
import Chapter, { SpecReadout } from '../components/experience/Chapter'
import RoomStage from '../components/experience/RoomStage'
import Reel from '../components/experience/Reel'
import Configurator from '../components/experience/Configurator'
import Hotspots from '../components/experience/Hotspots'
import InfoPanel from '../components/experience/InfoPanel'
import RoomStory from '../components/experience/RoomStory'
import { ArrayOverlay, ScreenOverlay } from '../components/experience/Overlays'
import Compare from '../components/experience/Compare'
import TimeOfDay from '../components/experience/TimeOfDay'
import SpeakerLab from '../components/experience/SpeakerLab'
import SceneDeck from '../components/experience/SceneDeck'
import ProductGallery from '../components/experience/ProductGallery'
import MaterialLab from '../components/experience/MaterialLab'
import Lifestyle from '../components/experience/Lifestyle'
import Footer from '../components/sections/Footer'

/* ============================================================
   THE JAAZ EXPERIENCE CENTRE

   ENTER → EXPLORE → EXPERIENCE → CONFIGURE → COMPARE → TOUCH →
   DISCOVER → DESIGN, laid out as one continuous walk through a
   single house rather than as a set of product sections.

   WHAT THIS PAGE OWNS, AND WHAT IT DOES NOT

   It owns exactly two things: WHERE YOU ARE in the house, and how
   you get somewhere else. Every other piece of state — which
   speaker is selected, which scene is running, which material is
   open, where the compare seam sits — belongs to the section that
   can actually see it. A page that held all of it would re-render
   nine rooms because someone opened a material sample.

   The chapters alternate `lead` between type-first and
   stage-first. That alternation is doing real work: the
   stage-first chapters land on the beats where the visitor moves
   outside or steps back to look at the whole house, so the change
   of rhythm coincides with a change of place.
   ============================================================ */

/** Scroll to a room's chapter, through Lenis if it is driving. */
function useTravel() {
  return useCallback((id) => {
    const el = document.getElementById(id)
    if (!el) return
    const y = el.getBoundingClientRect().top + window.scrollY - 16
    /* Lenis owns the scroll on this site, so it is asked first;
       the native path is the fallback for reduced-motion sessions
       where Lenis is never started. */
    if (window.__lenis) window.__lenis.scrollTo(y, { duration: 1.2 })
    else window.scrollTo({ top: y, behavior: 'smooth' })
  }, [])
}

/**
 * Which room the visitor is currently standing in.
 *
 * Read from the chapters themselves rather than from a scroll
 * position, so it stays correct through a resize, a pinned
 * section and an image that decoded late and moved everything
 * below it. The band is the middle of the viewport: a room counts
 * as "yours" when it is what you are looking AT, not when its
 * first pixel appears.
 */
function useCurrentRoom() {
  const [activeId, setActiveId] = useState(rooms[0].id)
  /* The rail only exists once the house does. */
  const [inHouse, setInHouse] = useState(false)

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return

    const seen = new Map()
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) seen.set(e.target.id, e.intersectionRatio)
        let best = null
        let bestRatio = 0
        for (const [id, ratio] of seen) {
          if (ratio > bestRatio) {
            best = id
            bestRatio = ratio
          }
        }
        if (best) setActiveId(best)
      },
      { rootMargin: '-35% 0px -35% 0px', threshold: [0, 0.25, 0.5, 0.75, 1] },
    )

    for (const room of rooms) {
      const el = document.getElementById(room.id)
      if (el) io.observe(el)
    }
    /* Separate observer, because this one watches a section the
       rooms list does not contain and answers a different
       question: not "which room", but "are we past the door". */
    const plan = document.getElementById('plan')
    let planIo
    if (plan) {
      planIo = new IntersectionObserver(
        ([e]) => setInHouse(e.isIntersecting || e.boundingClientRect.top < 0),
        { threshold: 0 },
      )
      planIo.observe(plan)
    }

    return () => {
      io.disconnect()
      planIo?.disconnect()
    }
  }, [])

  return { activeId, inHouse }
}

/* ------------------------------------------------------------
   THE PLAN
   ------------------------------------------------------------ */
function ThePlan({ activeId, onSelect }) {
  return (
    <section
      id="plan"
      aria-label="The house"
      className="relative scroll-mt-24 border-t border-white/10 bg-ink-2 py-20 sm:py-28"
    >
      <div className="shell-wide">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <Lines as="h2" className="t-display max-w-3xl text-pure" stagger={0.1}>
            <span className="block">Nine spaces,</span>
            <span className="block">
              one <em className="italic-display text-cove">house.</em>
            </span>
          </Lines>
          <p className="t-body max-w-sm shrink-0 text-mist lg:pb-2">
            Every room below is the same property, engineered as one system. Choose where to go
            first.
          </p>
        </div>

        <HouseMap activeId={activeId} onSelect={onSelect} className="mt-14" />
      </div>
    </section>
  )
}

/* ------------------------------------------------------------
   03 THE HOME THEATRE — the fully configured room
   ------------------------------------------------------------ */
function Theatre() {
  const room = getRoom('theatre')
  const { selection, onChange, slot, grade, screen, array, specs } = useRoomConfig(
    theatreChannels,
    theatreDefaults,
    room,
  )

  const [spotId, setSpotId] = useState(null)
  const [beatId, setBeatId] = useState(theatreStory[0].id)
  const beat = theatreStory.find((b) => b.id === beatId) ?? theatreStory[0]
  const spot = theatreHotspots.find((s) => s.id === spotId)

  /* The two annotation layers are mutually exclusive. Hotspots
     are sized in screen pixels and would scale with the frame, so
     they are only mounted while the camera is at rest — and a
     docked info panel describing the wide shot while the camera
     has pushed into the ceiling is worse than no panel at all. */
  const moving = beat.scale !== 1

  return (
    <Chapter
      room={room}
      lead="type"
      stage={
        <div className="relative">
          <RoomStage
            slot={slot}
            alt={room.alt}
            grade={grade}
            focus={beat.focus}
            scale={beat.scale}
            ratio={16 / 9}
            priority
          >
            <ScreenOverlay screen={screen} anchor="theatre" />
            <ArrayOverlay ids={array ?? []} />
            {!moving && (
              <Hotspots spots={theatreHotspots} activeId={spotId} onSelect={setSpotId} />
            )}
          </RoomStage>

          {spot && !moving && (
            <div className="pointer-events-none mt-6 sm:absolute sm:bottom-6 sm:left-6 sm:mt-0 sm:max-w-sm">
              <InfoPanel key={spot.id} spot={spot} onClose={() => setSpotId(null)} />
            </div>
          )}
        </div>
      }
    >
      <RoomStory
        beats={theatreStory}
        activeId={beatId}
        onSelect={setBeatId}
        className="mt-8 border-t border-white/10 pt-7"
      />

      <Configurator
        channels={theatreChannels}
        selection={selection}
        onChange={onChange}
        layout="rail"
        title="Configure the cinema"
        className="mt-12 border-t border-white/10 pt-10"
      />

      <SpecReadout specs={specs} className="mt-10" />

      {!spot && !moving && (
        <p className="t-label mt-6 text-[0.52rem] text-ash">
          Select a point on the room to read it
        </p>
      )}
    </Chapter>
  )
}

/* ------------------------------------------------------------
   05 GAMING — the same machinery, a different room
   ------------------------------------------------------------ */
function Gaming() {
  const room = getRoom('gaming')
  const { selection, onChange, slot, grade, screen, array, specs } = useRoomConfig(
    gamingChannels,
    gamingDefaults,
    room,
  )

  return (
    <Chapter
      room={room}
      lead="type"
      stage={
        <RoomStage slot={slot} alt={room.alt} grade={grade} ratio={16 / 9}>
          <ScreenOverlay screen={screen} anchor="gaming" />
          <ArrayOverlay ids={array ?? []} />
        </RoomStage>
      }
    >
      <Configurator
        channels={gamingChannels}
        selection={selection}
        onChange={onChange}
        layout="rail"
        title="Configure the gaming suite"
        className="mt-10 border-t border-white/10 pt-10"
      />

      <SpecReadout specs={specs} className="mt-10" />
    </Chapter>
  )
}

/* ------------------------------------------------------------ */
export default function Experience() {
  const travel = useTravel()
  const { activeId, inHouse } = useCurrentRoom()
  const settled = useRef(false)

  /* Chapters change height as plates decode and as sections open
     their panels, which moves every trigger below them. One
     refresh once the page has actually settled is worth more than
     a refresh on every one of those events. */
  useEffect(() => {
    if (settled.current) return
    settled.current = true
    const id = window.setTimeout(() => ScrollTrigger.refresh(), 900)
    return () => window.clearTimeout(id)
  }, [])

  return (
    <>
      <Threshold onEnter={() => travel('theatre')} onExplore={() => travel('plan')} />

      <ThePlan activeId={activeId} onSelect={travel} />
      <HouseRail activeId={activeId} onSelect={travel} visible={inHouse} />

      {/* 01 · The entrance. A moment, not a room to configure —
          the house is arrived at, and then it opens. */}
      <Chapter
        room={getRoom('entrance')}
        lead="stage"
        stage={
          <Reel
            slot={getRoom('entrance').reel}
            still={getRoom('entrance').slot}
            alt={getRoom('entrance').alt}
            ratio={21 / 9}
          />
        }
      />

      {/* 02 · Living. Stage-first: the visitor has just come
          through the door and the room should arrive before any
          words do. */}
      <Chapter
        room={getRoom('living')}
        lead="stage"
        stage={
          <Reel
            slot={getRoom('living').reel}
            still={getRoom('living').slot}
            alt={getRoom('living').alt}
            ratio={21 / 9}
          />
        }
      />

      <Theatre />

      <Compare />

      {/* 04 · Outdoor. */}
      <Chapter
        room={getRoom('outdoor')}
        lead="type"
        stage={<TimeOfDay room={getRoom('outdoor')} />}
      />

      <Gaming />

      {/* 06 · Premium audio. */}
      <Chapter
        room={getRoom('listening')}
        lead="type"
        stage={<SpeakerLab room={getRoom('listening')} />}
      />

      {/* 07 · Smart home. */}
      <Chapter room={getRoom('control')} lead="type" stage={<SceneDeck />} />

      {/* 08 · Products. */}
      <Chapter room={getRoom('gallery')} lead="type" stage={<ProductGallery />} />

      {/* 09 · Materials. */}
      <Chapter room={getRoom('materials')} lead="type" stage={<MaterialLab />} />

      <Lifestyle />
      <Footer />
    </>
  )
}
