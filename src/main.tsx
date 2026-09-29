import React, { useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import * as maplibregl from 'maplibre-gl'
import type { Map as MapInstance } from 'maplibre-gl'
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'
import { Protocol } from 'pmtiles'
import { ArrowLeftRight, Layers, MapPin, Plus, Minus, RotateCcw, Info, X, ExternalLink, Share2, Check, Navigation } from 'lucide-react'
import { useLocation } from './useLocation'
import 'maplibre-gl/dist/maplibre-gl.css'
import './style.css'
import './compact.css'
import overviewCoordinates from './history-overview.json'
import overview1830 from './history-overview-1830.json'
import flood1875 from './flood-1875.json'

const YEARS = ['1680', '1830', '1875', '1954'] as const
type Year = typeof YEARS[number]
const initialYear = (): Year => {
  const value = new URLSearchParams(location.hash.slice(1)).get('year')
  return YEARS.includes(value as Year) ? value as Year : '1680'
}
const IGN_SOURCE = 'https://data.geopf.fr/wmts?SERVICE=WMTS&VERSION=1.0.0&REQUEST=GetCapabilities'
const FLOOD_SOURCE = 'https://mapasmilhaud.com/mapas-urbanos/plano-de-las-inundaciones-de-toulouse-1875/'
const sourceUrl = (year: Year) => year === '1875' ? FLOOD_SOURCE : year === '1954' ? IGN_SOURCE : year === '1680' ? 'https://tolosa1680.makina-corpus.com/' : 'https://tolosa.makina-corpus.com/'
const TODAY = new Date().getFullYear()
const initialTime = () => {
  const value = Number(new URLSearchParams(location.hash.slice(1)).get('time'))
  return Number.isFinite(value) && value >= 1680 && value <= TODAY ? value : Number(initialYear())
}
function historicalStyle(year: Year): maplibregl.StyleSpecification {
  const style: maplibregl.StyleSpecification = { version: 8, sources: {}, layers: [] }
  for (const period of ['1680', '1830'] as const) {
    style.sources['overview-' + period] = { type: 'image', url: period === '1680' ? '/history-overview.png' : '/history-overview-1830.png', coordinates: (period === '1680' ? overviewCoordinates : overview1830) as [[number, number], [number, number], [number, number], [number, number]] }
    style.sources['history-' + period] = { type: 'raster', url: 'pmtiles://https://makina-pmtiles.s3.fr-par.scw.cloud/tolosa-' + period + '.pmtiles', tileSize: 256, attribution: 'Toulouse Métropole · Makina Corpus' }
    style.layers.push(
      { id: 'overview-' + period, type: 'raster', source: 'overview-' + period, maxzoom: 15, paint: { 'raster-opacity': period === year ? 1 : 0, 'raster-opacity-transition': { duration: 0 }, 'raster-fade-duration': 0 } },
      { id: 'history-' + period, type: 'raster', source: 'history-' + period, minzoom: 15, paint: { 'raster-opacity': period === year ? 1 : 0, 'raster-opacity-transition': { duration: 0 }, 'raster-fade-duration': 0 } }
    )
  }
  style.sources['overview-1875'] = { type: 'image', url: '/flood-1875/overview.webp', coordinates: flood1875.coordinates as [[number, number], [number, number], [number, number], [number, number]] }
  style.sources['history-1875'] = {
    type: 'raster', tileSize: 256, minzoom: 14, maxzoom: 17,
    bounds: flood1875.bounds as [number, number, number, number],
    tiles: [location.origin + '/flood-1875/{z}/{x}/{y}.webp'],
    attribution: 'Archives municipales de Toulouse · 20 Fi 45 · Sirven / La Dépêche',
  }
  for (const kind of ['overview', 'history'] as const) style.layers.push({
    id: kind + '-1875', type: 'raster', source: kind + '-1875',
    ...(kind === 'overview' ? { maxzoom: 14 } : { minzoom: 14 }),
    paint: { 'raster-opacity': year === '1875' ? 1 : 0, 'raster-opacity-transition': { duration: 0 }, 'raster-fade-duration': 0 },
  })
  style.sources['history-1954'] = {
    type: 'raster', tileSize: 256, minzoom: 6, maxzoom: 16,
    bounds: [1.23852, 43.5618, 1.55128, 43.7247],
    tiles: ['https://data.geopf.fr/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=ORTHOIMAGERY.EDUGEO.TOULOUSE1954&STYLE=normal&FORMAT=image/png&TILEMATRIXSET=PM_6_16&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}'],
    attribution: 'IGN · Edugéo · Toulouse 1954',
  }
  style.layers.push({ id: 'history-1954', type: 'raster', source: 'history-1954', paint: { 'raster-opacity': year === '1954' ? 1 : 0, 'raster-opacity-transition': { duration: 0 }, 'raster-fade-duration': 0 } })
  return style
}
maplibregl.setWorkerUrl(workerUrl)
const protocol = new Protocol()
maplibregl.addProtocol('pmtiles', protocol.tile)
type Mode = 'split' | 'overlay' | 'modern' | 'historic' | 'time'
function initialMode(): Mode {
  const value = new URLSearchParams(location.hash.slice(1)).get('mode')
  return ['split', 'overlay', 'modern', 'historic', 'time'].includes(value ?? '') ? value as Mode : 'split'
}
function initialPercent(key: string, fallback: number) {
  const raw = new URLSearchParams(location.hash.slice(1)).get(key)
  const value = Number(raw)
  return raw !== null && Number.isFinite(value) && value >= 0 && value <= 100 ? value : fallback
}
const places = [
  { name: 'Rue Ninau', center: [1.44954, 43.597678] as [number, number], zoom: 17.3 },
  { name: 'Saint-Étienne', center: [1.448962, 43.599782] as [number, number], zoom: 17 },
  { name: 'Saintes-Scarbes', center: [1.448734, 43.598128] as [number, number], zoom: 18 },
  { name: 'Montoulieu', center: [1.450186, 43.596732] as [number, number], zoom: 17.5 },
  { name: 'Saint-Cyprien', center: [1.4315, 43.599] as [number, number], zoom: 15.6 },
  { name: 'Tout le centre', center: [1.442, 43.602] as [number, number], zoom: 15 },
]
function initialView() {
  const p = new URLSearchParams(location.hash.slice(1))
  const lon = Number(p.get('lon')), lat = Number(p.get('lat')), z = Number(p.get('z'))
  return p.has('lon') && Number.isFinite(lon) && lon >= -180 && lon <= 180 && Number.isFinite(lat) && lat > -85 && lat < 85 && z >= 2 && z <= 20
    ? { center: [lon, lat] as [number, number], zoom: z } : { center: places[0].center, zoom: 16.7 }
}
function initialEnabled(): Year[] {
  const value = new URLSearchParams(location.hash.slice(1)).get('layers')
  return value === null ? [...YEARS] : YEARS.filter(year => value.split(',').includes(year))
}
function App() {
  const modernEl = useRef<HTMLDivElement>(null), oldEl = useRef<HTMLDivElement>(null)
  const map = useRef<MapInstance | null>(null)
  const historicMap = useRef<MapInstance | null>(null)
  const [enabled, setEnabled] = useState<Year[]>(initialEnabled)
  const [epochsOpen, setEpochsOpen] = useState(false)
  const [year, setYear] = useState<Year>(() => enabled.includes(initialYear()) ? initialYear() : enabled[0] ?? '1680')
  const yearRef = useRef(year)
  const locationMaps = useRef<MapInstance[]>([])
  const geo = useLocation(locationMaps)
  const [mode, setMode] = useState<Mode>(initialMode)
  const [time, setTime] = useState(() => Math.max(Number(enabled[0] ?? TODAY), initialTime()))
  const timelinePointer = useRef(false)
  const [opacity, setOpacity] = useState(() => initialPercent('opacity', 65)), [split, setSplit] = useState(() => initialPercent('split', 50))
  const [compareHeld, setCompareHeld] = useState(false)
  const [peek, setPeek] = useState(false), [sources, setSources] = useState(false)
  const [ready, setReady] = useState({ modern: false, historic: false })
  const [errors, setErrors] = useState<string[]>([])
  const [coords, setCoords] = useState('43.59768° N · 1.44954° E')
  const [copied, setCopied] = useState(false)
  const [shareFallback, setShareFallback] = useState('')
  const [placesOpen, setPlacesOpen] = useState(false)
  useEffect(() => {
    if (!sources) return
    const trap = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return
      const items = document.querySelectorAll<HTMLElement>('.source-modal button, .source-modal a')
      const first = items[0], last = items[items.length - 1]
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
    }
    window.addEventListener('keydown', trap)
    return () => { window.removeEventListener('keydown', trap); document.querySelector<HTMLButtonElement>('.source-button')?.focus() }
  }, [sources])
  useEffect(() => {
    if (!modernEl.current || !oldEl.current) return
    let modern: MapInstance, historic: MapInstance
    try {
      const options = { ...initialView(), minZoom: 2, maxZoom: 20, pitchWithRotate: false, dragRotate: false, touchPitch: false, attributionControl: false as const }
      modern = new maplibregl.Map({ ...options, container: modernEl.current, style: 'https://tiles.openfreemap.org/styles/positron' })
      historic = new maplibregl.Map({ ...options, container: oldEl.current, interactive: false, style: historicalStyle(yearRef.current) })
    } catch { setErrors(['Impossible de démarrer la carte. Vérifiez WebGL et l’accélération matérielle.']); return }
    map.current = modern
    historicMap.current = historic
    locationMaps.current = [modern, historic]
    modern.touchZoomRotate.disableRotation()
    const sync = () => historic.jumpTo({ center: modern.getCenter(), zoom: modern.getZoom(), bearing: 0, pitch: 0 })
    modern.on('move', sync)
    modern.on('mousemove', e => setCoords(`${e.lngLat.lat.toFixed(5)}° N · ${e.lngLat.lng.toFixed(5)}° E`))
    modern.addControl(new maplibregl.ScaleControl({ maxWidth: 120, unit: 'metric' }), 'bottom-left')
    for (const [kind, instance] of [['modern', modern], ['historic', historic]] as const) {
      instance.on('idle', () => setReady(s => ({ ...s, [kind]: true })))
      instance.on('error', e => { console.error(kind, e.error); setErrors(s => [...new Set([...s, kind === 'modern' ? 'Chargement incomplet de la carte actuelle. Vérifiez la connexion et rechargez la page.' : 'Chargement incomplet de la carte historique. Vérifiez la connexion et rechargez la page.'])]) })
    }
    const resize = new ResizeObserver(() => { modern.resize(); historic.resize(); sync() })
    resize.observe(modernEl.current)
    return () => { resize.disconnect(); modern.remove(); historic.remove(); map.current = null; historicMap.current = null; locationMaps.current = [] }
  }, [])
  useEffect(() => {
    const down = (e: KeyboardEvent) => { if (e.code === 'Space' && !(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLButtonElement)) { e.preventDefault(); setPeek(true) } if(e.key === 'Escape') { setSources(false); setPlacesOpen(false); setEpochsOpen(false); setShareFallback('') } }
    const up = (e: KeyboardEvent) => { if (e.code === 'Space') setPeek(false) }
    const blur = () => { setPeek(false); setCompareHeld(false) }
    window.addEventListener('keydown', down); window.addEventListener('keyup', up); window.addEventListener('blur', blur)
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); window.removeEventListener('blur', blur) }
  }, [])
  useEffect(() => {
    const historical = historicMap.current
    if (!historical) return
    const apply = () => {
      if (!historical.getLayer('history-1680')) return
      const dates = [...enabled.map(Number), TODAY]
      const index = Math.min(dates.length - 2, Math.max(0, dates.findIndex((date, i) => i < dates.length - 1 && time < dates[i + 1])))
      const start = time === TODAY ? dates[dates.length - 2] ?? TODAY : dates[index]
      const end = time === TODAY ? TODAY : dates[index + 1]
      const fraction = end === start ? 1 : (time - start) / (end - start)
      for (const period of YEARS) {
        const value = !enabled.includes(period) ? 0 : mode !== 'time' ? (period === year ? 1 : 0)
          : Number(period) === start ? (end === TODAY ? 1 - fraction : 1)
          : Number(period) === end ? fraction : 0
        for (const kind of ['overview', 'history']) {
          const id = kind + '-' + period
          if (historical.getLayer(id)) historical.setPaintProperty(id, 'raster-opacity', value)
        }
      }
    }
    apply()
    historical.on('style.load', apply)
    return () => { historical.off('style.load', apply) }
  }, [mode, time, year, enabled])
  const dates = [...enabled.map(Number), TODAY]
  const lower = dates.filter(date => date <= time).at(-1)!
  const upper = dates.find(date => date > time) ?? TODAY
  const dateLabel = (date: number) => date === TODAY ? 'Actuel' : String(date)
  const timeLabel = dates.includes(time) ? (time === 1875 ? '1875 · Inondation' : dateLabel(time)) : `${dateLabel(lower)} → ${dateLabel(upper)} · ${Math.round((time - lower) / (upper - lower) * 100)}%`
  const changeYear = (next: Year) => {
    if (next === year) return
    yearRef.current = next
    setYear(next)
    setErrors([])
  }
  const toggleEpoch = (value: Year) => {
    const next = YEARS.filter(y => y === value ? !enabled.includes(y) : enabled.includes(y))
    setEnabled(next)
    if (!next.includes(year) && next.length) changeYear(next.reduce((a, b) => Math.abs(Number(a) - Number(year)) <= Math.abs(Number(b) - Number(year)) ? a : b))
    setTime(t => Math.max(Number(next[0] ?? TODAY), t))
  }
  const visibleMode = enabled.length === 0 ? 'modern' : compareHeld ? 'overlay' : peek ? 'modern' : mode
  const go = (index: number) => map.current?.flyTo({ ...places[index], duration: 1000, essential: true })
  const share = async () => {
    const center = map.current?.getCenter()
    const view = initialView()
    const params = new URLSearchParams({
      lon: (center?.lng ?? view.center[0]).toFixed(6),
      lat: (center?.lat ?? view.center[1]).toFixed(6),
      z: (map.current?.getZoom() ?? view.zoom).toFixed(2),
      year, layers: enabled.join(','), mode, time: String(time),
      opacity: String(opacity), split: String(split),
    })
    const url = new URL(location.href)
    url.hash = params.toString()
    setShareFallback('')
    if (navigator.share) {
      try { await navigator.share({ title: 'Toulouse · Au fil du temps', url: url.href }); return }
      catch (error) { if (error instanceof DOMException && error.name === 'AbortError') return }
    }
    try {
      await navigator.clipboard.writeText(url.href)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2500)
    } catch { setShareFallback(url.href) }
  }
  return <main tabIndex={-1}>
    <div className="map" ref={modernEl} aria-label="Carte actuelle de Toulouse" />
    <div className="map historic-map" ref={oldEl} aria-label={mode === 'time' ? 'Cartes historiques sur la frise' : `Carte historique de Toulouse en ${year}`} style={{ opacity: enabled.length === 0 ? 0 : compareHeld ? 0.2 : visibleMode === 'modern' ? 0 : visibleMode === 'overlay' ? opacity / 100 : 1, clipPath: visibleMode === 'split' ? `inset(0 ${100 - split}% 0 0)` : 'none' }} />
    <header className="masthead">
      <a className="brand" href="/" aria-label="Toulouse au fil du temps"><Layers size={20}/><span>Toulouse</span></a>
      <div className="header-right"><div className="epochs-menu">
        <button className="places-button" aria-expanded={epochsOpen} aria-controls="epochs-popover" onClick={() => { setEpochsOpen(v => !v); setPlacesOpen(false) }}><Layers size={17}/>Époques</button>
        {epochsOpen && <><button className="epochs-dismiss" tabIndex={-1} aria-label="Fermer le choix des époques" onClick={() => setEpochsOpen(false)}/><div id="epochs-popover" className="epochs-popover" role="group" aria-label="Époques visibles">{YEARS.map(value => <label key={value}><input type="checkbox" checked={enabled.includes(value)} onChange={() => toggleEpoch(value)}/><span>{value}</span><small>{value === '1875' ? 'Inondation' : value === '1954' ? 'Vue aérienne' : 'Cadastre'}</small></label>)}<p>Les époques décochées sont ignorées par la frise.</p></div></>}
      </div><div className="places-menu">
        <button className="places-button" aria-expanded={placesOpen} aria-controls="places-popover" onClick={() => { setPlacesOpen(v => !v); setEpochsOpen(false) }}><MapPin size={17}/>Lieux</button>
        {placesOpen && <><button className="places-dismiss" tabIndex={-1} aria-label="Fermer le choix du lieu" onClick={() => setPlacesOpen(false)}/><div id="places-popover" className="places-popover"><select autoFocus aria-label="Aller à un lieu" defaultValue="" onChange={e => { go(Number(e.target.value)); setPlacesOpen(false) }}><option value="" disabled>Choisir un lieu</option>{places.map((p, i) => <option key={p.name} value={i}>{p.name}</option>)}</select></div></>}
      </div><button className="header-icon" onClick={share} aria-label="Partager la vue" title={copied ? "Lien copié" : "Partager la vue"}>{copied ? <Check size={17}/> : <Share2 size={17}/>}</button>{copied && <span className="sr-only" aria-live="polite">Lien copié</span>}<button className="source-button header-icon" onClick={() => setSources(true)} aria-label="À propos des cartes" title="À propos des cartes"><Info size={18}/></button></div>
    </header>
    {visibleMode === 'split' && <><div className="epoch-label old-label">{year === '1875' ? '1875 · Inondation' : year} <span>{year === '1954' ? 'VUE AÉRIENNE' : 'CADASTRE HISTORIQUE'}</span></div><div className="epoch-label new-label"><span>CARTE ACTUELLE</span> Actuel</div><div className="divider" style={{ left: `${split}%` }}><div className="divider-handle" role="slider" tabIndex={0} aria-label="Limite de comparaison" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(split)} onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId) }} onPointerMove={e => { if (e.currentTarget.hasPointerCapture(e.pointerId)) setSplit(Math.max(0, Math.min(100, e.clientX / window.innerWidth * 100))) }} onKeyDown={e => { if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) { e.preventDefault(); setSplit(s => e.key === 'Home' ? 0 : e.key === 'End' ? 100 : Math.max(0, Math.min(100, s + (e.key === 'ArrowLeft' ? -2 : 2)))) } }}><ArrowLeftRight size={21}/></div></div></>}
    <button className="compare-hold" aria-label="Maintenir pour comparer avec la carte actuelle" aria-pressed={compareHeld} title="Maintenez pour lire les rues actuelles"
      onPointerDown={e => { if (e.button !== 0 || !e.isPrimary) return; e.preventDefault(); e.currentTarget.focus(); e.currentTarget.setPointerCapture(e.pointerId); setCompareHeld(true) }}
      onPointerUp={() => setCompareHeld(false)} onPointerCancel={() => setCompareHeld(false)} onLostPointerCapture={() => setCompareHeld(false)}
      onBlur={() => setCompareHeld(false)} onContextMenu={e => e.preventDefault()}
      onKeyDown={e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); setCompareHeld(true) } if (e.key === 'Escape') setCompareHeld(false) }}
      onKeyUp={e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); setCompareHeld(false) } }}
    ><Layers size={17}/><span>Repères</span></button>
    <div className="zoom-controls"><button className={geo.status !== 'off' ? 'location-active' : ''} aria-label={geo.status === 'off' ? 'Me localiser' : 'Désactiver la localisation'} title={geo.status === 'off' ? 'Me localiser' : 'Désactiver la localisation'} aria-pressed={geo.status !== 'off'} onClick={geo.toggle}><Navigation size={19} fill={geo.status === 'following' ? 'currentColor' : 'none'}/></button><div/><button aria-label="Zoom avant" onClick={() => map.current?.zoomIn()}><Plus size={20}/></button><button aria-label="Zoom arrière" onClick={() => map.current?.zoomOut()}><Minus size={20}/></button><div/><button aria-label="Revenir rue Ninau" onClick={() => go(0)}><RotateCcw size={18}/></button></div>
    <section className="control-panel" aria-label="Comparaison des cartes"><span className="sr-only">{ready.modern && ready.historic ? 'Cartes chargées' : 'Chargement des cartes…'}</span>{!(ready.modern && ready.historic) && <span className="loading-dot" title="Chargement des cartes…"/>}{mode !== 'time' && mode !== 'modern' && <div className="year-selector"><div role="group" aria-label="Époque historique">{enabled.map(value => <button key={value} aria-label={`Carte de ${value}`} aria-pressed={year === value} className={year === value ? 'selected' : ''} onClick={() => changeYear(value)}>{value}</button>)}</div></div>}<div className="mode-buttons">{([['time', 'Frise', null], ['split', 'Rideau', null], ['overlay', 'Superposer', null], ['historic', year, null], ['modern', 'Actuel', null]] as const).map(([key, title, icon]) => <button key={key} aria-pressed={mode === key} className={mode === key ? 'active' : ''} onClick={() => setMode(key)}>{icon}{title}</button>)}</div>{mode === 'time' ? <div className="timeline"><div className="timeline-value" aria-live="polite" title="Transition entre cartes, pas une reconstitution des années intermédiaires">{timeLabel}</div><input key={dates.join(",")} aria-label="Voyage dans le temps" aria-valuetext={timeLabel} type="range" min={dates[0]} max={TODAY} disabled={!enabled.length} step="1" value={time} onPointerDown={() => { timelinePointer.current = true }} onPointerUp={() => { timelinePointer.current = false }} onPointerCancel={() => { timelinePointer.current = false }} onBlur={() => { timelinePointer.current = false }} onKeyDown={() => { timelinePointer.current = false }} onChange={e => {
          const value = Number(e.target.value)
          // A small magnetic zone for fingers/mouse; keyboard retains one-year steps.
          const snap = timelinePointer.current ? dates.find(date => Math.abs(date - value) <= (TODAY - dates[0]) * 0.02) : undefined
          setTime(snap ?? value)
        }}/><div className="timeline-ticks">{dates.map((date, i) => <button key={date} style={i === 0 ? { left: 0 } : i === dates.length - 1 ? { right: 0, left: 'auto' } : { left: ((date - dates[0]) / (TODAY - dates[0]) * 100) + '%', transform: 'translateX(-50%)' }} onClick={() => setTime(date)}>{dateLabel(date)}</button>)}</div></div> : (mode === 'overlay' || mode === 'split') && <div className="slider-row"><span>{mode === 'overlay' ? '' : year}</span><input aria-label={mode === 'overlay' ? 'Opacité de la carte historique' : 'Position du rideau'} type="range" min="0" max="100" value={mode === 'overlay' ? opacity : split} onChange={e => mode === 'overlay' ? setOpacity(Number(e.target.value)) : setSplit(Number(e.target.value))}/><span>{mode === 'overlay' ? `${opacity}%` : 'Actuel'}</span></div>}</section>
    {(geo.message || geo.status === 'locating') && <div className="location-notice" role="status"><span>{geo.message || 'Localisation en cours…'}</span><button aria-label="Masquer le message de localisation" onClick={geo.dismiss}><X size={14}/></button></div>}
    {errors.length > 0 && <div className="error-toast" role="alert">{errors.map(e => <p key={e}>{e}</p>)}<button onClick={() => location.reload()}>Recharger</button><button aria-label="Fermer le message" onClick={() => setErrors([])}><X size={16}/></button></div>}
    <footer><span className="coordinates">{coords}</span><span>{mode === 'time' || year === '1680' || year === '1830' ? <><a href={sourceUrl(year === '1680' ? '1680' : '1830')} target="_blank" rel="noreferrer">Makina Corpus</a> / <a href="https://data.toulouse-metropole.fr/" target="_blank" rel="noreferrer">Toulouse Métropole</a></> : null}{(mode === 'time' || year === '1875') && <>{mode === 'time' ? ' · ' : ''}<a href={FLOOD_SOURCE} target="_blank" rel="noreferrer">Archives Toulouse · 1875</a></>}{mode === 'time' ? ' · ' : ''}{(mode === 'time' || year === '1954') && <a href="https://www.ign.fr/" target="_blank" rel="noreferrer">© IGN · 1954</a>} <b>·</b> <a href="https://openfreemap.org/" target="_blank" rel="noreferrer">OpenFreeMap</a> © <a href="https://openmaptiles.org/" target="_blank" rel="noreferrer">OpenMapTiles</a> © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a></span></footer>
    {shareFallback && <div className="modal-backdrop" onClick={() => setShareFallback('')}><section className="source-modal share-modal" role="dialog" aria-modal="true" aria-label="Partager la vue" onClick={e => e.stopPropagation()}><button className="close-modal" aria-label="Fermer le partage" onClick={() => setShareFallback('')}><X/></button><h2>Partager la vue</h2><p>Copiez ce lien pour retrouver cette vue de la carte.</p><input autoFocus readOnly aria-label="Lien de partage" value={shareFallback} onFocus={e => e.currentTarget.select()}/></section></div>}
    {sources && <div className="modal-backdrop" onClick={() => setSources(false)}><section className="source-modal" role="dialog" aria-modal="true" aria-label="Cartes et précision" onClick={e => e.stopPropagation()}><button autoFocus className="close-modal" aria-label="Fermer les sources" onClick={() => setSources(false)}><X/></button><div className="eyebrow">SOURCES ET PRÉCISION</div><h2>Cartes de Toulouse</h2>{year === '1875' ? <><h3>Inondation des 23–24 juin 1875</h3><p>Plan original Sirven / La Dépêche, Archives municipales de Toulouse, 20 Fi 45. Numérisation disponible sur Mapas Milhaud. Le bleu indique les zones inondées ; le rouge, les maisons écroulées.</p><p>Le plan a été calé manuellement sur 15 repères. Sur trois points de contrôle indépendants, les écarts sont de 14 à 27 m. La précision diminue aux bords. Ce document historique ne décrit pas le risque actuel d’inondation.</p></> : year === '1954' ? <><h3>Vue aérienne de 1954</h3><p>Photographie aérienne en noir et blanc fournie par IGN / Edugéo, déjà géoréférencée. À fort zoom, les pixels du cliché deviennent visibles. Hors couverture, la carte actuelle reste affichée.</p></> : <><h3>{year === '1680' ? 'Vers 1680' : 'Cadastre de 1830'}</h3><p>Carte réalisée par Makina Corpus à partir du cadastre historique de Toulouse Métropole. Il s’agit d’un dessin actuel de données historiques, et non d’un scan d’archive. Les tuiles géoréférencées sont utilisées sans déformation supplémentaire.</p></>}<a href={sourceUrl(year)} target="_blank" rel="noreferrer">Ouvrir la carte source <ExternalLink size={14}/></a><h3>Utilisation</h3><p>Sur ordinateur, maintenez la barre d’espace pour afficher la carte actuelle. Maintenez « Repères » pour lire les rues actuelles avec une légère superposition historique. Relâchez pour revenir à la vue précédente. « Lieux » permet de rejoindre un quartier. « Partager » crée un lien vers la vue actuelle, avec les époques et les réglages choisis.</p><h3>Mode « Frise »</h3><p>La frise mélange les cartes sélectionnées dans « Époques » et la carte actuelle. Les sources disponibles sont les cadastres de 1680 et 1830, le plan d’inondation de 1875 et la vue aérienne de 1954. Les positions intermédiaires sont des transitions visuelles, pas des reconstitutions de ces années.</p><a href={sourceUrl('1680')} target="_blank" rel="noreferrer">Source 1680</a> · <a href={sourceUrl('1830')} target="_blank" rel="noreferrer">Source 1830</a> · <a href={FLOOD_SOURCE} target="_blank" rel="noreferrer">Source 1875</a> · <a href={IGN_SOURCE} target="_blank" rel="noreferrer">Source 1954 · IGN / Edugéo</a><h3>La ville actuelle</h3><p>Carte vectorielle OpenFreeMap issue d’OpenStreetMap. La date de mise à jour varie selon les objets ; ce n’est pas une photographie de la ville à une date précise.</p><h3>Comprendre les écarts</h3><p>Les écarts peuvent refléter les transformations de la ville ou les imprécisions des documents historiques. Pour les cadastres de 1680 et 1830, la précision et les points de calage ne sont pas publiés avec les tuiles. La concordance de chaque bâtiment n’est pas garantie. Les données anciennes sont absentes hors de leur couverture.</p><h3>Réutilisation des données</h3><p>Le catalogue officiel indique la Licence Ouverte v2.0 pour les données cadastrales. Les conditions propres au rendu et à l’hébergement des tuiles Makina Corpus restent à confirmer. Cette version sert à une exploration personnelle du concept ; une diffusion publique nécessiterait de clarifier ces conditions ou de produire une couche à partir des données ouvertes.</p><a href={`https://data.toulouse-metropole.fr/explore/dataset/parcellaire-de-${year === '1680' ? '1680' : '1830'}/information/`} target="_blank" rel="noreferrer">Catalogue officiel <ExternalLink size={14}/></a></section></div>}
  </main>
}
createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>)
