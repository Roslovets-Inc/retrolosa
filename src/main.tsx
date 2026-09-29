import React, { useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import * as maplibregl from 'maplibre-gl'
import type { Map as MapInstance } from 'maplibre-gl'
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'
import { Protocol } from 'pmtiles'
import { ArrowLeftRight, Layers, MapPin, Plus, Minus, RotateCcw, Info, X, ExternalLink, Copy, Check, Navigation } from 'lucide-react'
import { useLocation } from './useLocation'
import { replaceViewUrl } from './viewUrl'
import 'maplibre-gl/dist/maplibre-gl.css'
import './style.css'
import './compact.css'
import overviewCoordinates from './history-overview.json'
import overview1830 from './history-overview-1830.json'

const YEARS = ['1680', '1830', '1954'] as const
type Year = typeof YEARS[number]
const initialYear = (): Year => {
  const value = new URLSearchParams(location.hash.slice(1)).get('year')
  return YEARS.includes(value as Year) ? value as Year : '1680'
}
const IGN_SOURCE = 'https://data.geopf.fr/wmts?SERVICE=WMTS&VERSION=1.0.0&REQUEST=GetCapabilities'
const sourceUrl = (year: Year) => year === '1954' ? IGN_SOURCE : year === '1680' ? 'https://tolosa1680.makina-corpus.com/' : 'https://tolosa.makina-corpus.com/'
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
const places = [
  { name: 'Rue Ninau', center: [1.44954, 43.597678] as [number, number], zoom: 17.3 },
  { name: 'Saint-Étienne', center: [1.448962, 43.599782] as [number, number], zoom: 17 },
  { name: 'Saintes-Scarbes', center: [1.448734, 43.598128] as [number, number], zoom: 18 },
  { name: 'Montoulieu', center: [1.450186, 43.596732] as [number, number], zoom: 17.5 },
  { name: 'Весь центр', center: [1.442, 43.602] as [number, number], zoom: 15 },
]
function initialView() {
  const p = new URLSearchParams(location.hash.slice(1))
  const lon = Number(p.get('lon')), lat = Number(p.get('lat')), z = Number(p.get('z'))
  return p.has('lon') && Number.isFinite(lon) && lon >= -180 && lon <= 180 && Number.isFinite(lat) && lat > -85 && lat < 85 && z >= 2 && z <= 20
    ? { center: [lon, lat] as [number, number], zoom: z } : { center: places[0].center, zoom: 16.7 }
}
function App() {
  const modernEl = useRef<HTMLDivElement>(null), oldEl = useRef<HTMLDivElement>(null)
  const map = useRef<MapInstance | null>(null)
  const historicMap = useRef<MapInstance | null>(null)
  const [year, setYear] = useState<Year>(initialYear)
  const yearRef = useRef(year)
  const locationMaps = useRef<MapInstance[]>([])
  const geo = useLocation(locationMaps)
  const [mode, setMode] = useState<Mode>(() => new URLSearchParams(location.hash.slice(1)).get('mode') === 'time' ? 'time' : 'split')
  const [time, setTime] = useState(initialTime)
  const modeRef = useRef(mode), timeRef = useRef(time)
  modeRef.current = mode; timeRef.current = time
  const [opacity, setOpacity] = useState(65), [split, setSplit] = useState(50)
  const [peek, setPeek] = useState(false), [sources, setSources] = useState(false)
  const [ready, setReady] = useState({ modern: false, historic: false })
  const [errors, setErrors] = useState<string[]>([])
  const [coords, setCoords] = useState('43.59768° N · 1.44954° E')
  const [copied, setCopied] = useState(false)
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
    } catch { setErrors(['Браузер не смог запустить карту. Проверьте поддержку WebGL и аппаратное ускорение.']); return }
    map.current = modern
    historicMap.current = historic
    locationMaps.current = [modern, historic]
    modern.touchZoomRotate.disableRotation()
    const sync = () => historic.jumpTo({ center: modern.getCenter(), zoom: modern.getZoom(), bearing: 0, pitch: 0 })
    modern.on('move', sync)
    modern.on('moveend', () => { const c = modern.getCenter(); replaceViewUrl(`#lon=${c.lng.toFixed(6)}&lat=${c.lat.toFixed(6)}&z=${modern.getZoom().toFixed(2)}&year=${yearRef.current}${modeRef.current === 'time' ? '&mode=time&time=' + timeRef.current : ''}`) })
    modern.on('mousemove', e => setCoords(`${e.lngLat.lat.toFixed(5)}° N · ${e.lngLat.lng.toFixed(5)}° E`))
    modern.addControl(new maplibregl.ScaleControl({ maxWidth: 120, unit: 'metric' }), 'bottom-left')
    for (const [kind, instance] of [['modern', modern], ['historic', historic]] as const) {
      instance.on('idle', () => setReady(s => ({ ...s, [kind]: true })))
      instance.on('error', e => { console.error(kind, e.error); setErrors(s => [...new Set([...s, kind === 'modern' ? 'Не удалось загрузить часть современной карты. Проверьте интернет и обновите страницу.' : 'Не удалось загрузить часть исторической карты. Проверьте интернет и обновите страницу.'])]) })
    }
    const resize = new ResizeObserver(() => { modern.resize(); historic.resize(); sync() })
    resize.observe(modernEl.current)
    return () => { resize.disconnect(); modern.remove(); historic.remove(); map.current = null; historicMap.current = null; locationMaps.current = [] }
  }, [])
  useEffect(() => {
    const down = (e: KeyboardEvent) => { if (e.code === 'Space' && !(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLButtonElement)) { e.preventDefault(); setPeek(true) } if(e.key === 'Escape') { setSources(false); setPlacesOpen(false) } }
    const up = (e: KeyboardEvent) => { if (e.code === 'Space') setPeek(false) }
    const blur = () => setPeek(false)
    window.addEventListener('keydown', down); window.addEventListener('keyup', up); window.addEventListener('blur', blur)
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); window.removeEventListener('blur', blur) }
  }, [])
  useEffect(() => {
    const historical = historicMap.current
    if (!historical) return
    const apply = () => {
      if (!historical.getLayer('history-1680')) return
      const dates = [1680, 1830, 1954, TODAY]
      const index = Math.min(dates.length - 2, Math.max(0, dates.findIndex((date, i) => i < dates.length - 1 && time < dates[i + 1])))
      const start = time === TODAY ? 1954 : dates[index]
      const end = time === TODAY ? TODAY : dates[index + 1]
      const fraction = (time - start) / (end - start)
      for (const period of YEARS) {
        const value = mode !== 'time' ? (period === year ? 1 : 0)
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
  }, [mode, time, year])
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const params = new URLSearchParams(location.hash.slice(1))
      if (mode === 'time') { params.set('mode', 'time'); params.set('time', String(time)) }
      else { params.delete('mode'); params.delete('time') }
      replaceViewUrl('#' + params.toString())
    }, 400)
    return () => window.clearTimeout(timer)
  }, [mode, time])
  const dates = [1680, 1830, 1954, TODAY]
  const lower = dates.filter(date => date <= time).at(-1)!
  const upper = dates.find(date => date > time) ?? TODAY
  const dateLabel = (date: number) => date === TODAY ? 'Сегодня' : String(date)
  const timeLabel = dates.includes(time) ? dateLabel(time) : `${dateLabel(lower)} → ${dateLabel(upper)} · ${Math.round((time - lower) / (upper - lower) * 100)}%`
  const changeYear = (next: Year) => {
    if (next === year) return
    yearRef.current = next
    setYear(next)
    setErrors([])
    const params = new URLSearchParams(location.hash.slice(1))
    params.set('year', next)
    replaceViewUrl('#' + params.toString())
  }
  const visibleMode = peek ? 'modern' : mode
  const go = (index: number) => map.current?.flyTo({ ...places[index], duration: 1000, essential: true })
  const copy = async () => { try { await navigator.clipboard.writeText(location.href); setCopied(true); setTimeout(() => setCopied(false), 2000) } catch { setErrors(s => [...s, 'Скопируйте адрес страницы из адресной строки.']) } }
  return <main tabIndex={-1}>
    <div className="map" ref={modernEl} aria-label="Современная карта Тулузы" />
    <div className="map historic-map" ref={oldEl} aria-label={mode === 'time' ? 'Исторические карты на временной шкале' : `Историческая карта Тулузы ${year} года`} style={{ opacity: visibleMode === 'modern' ? 0 : visibleMode === 'overlay' ? opacity / 100 : 1, clipPath: visibleMode === 'split' ? `inset(0 ${100 - split}% 0 0)` : 'none' }} />
    <header className="masthead">
      <a className="brand" href="/" aria-label="Toulouse сквозь время"><Layers size={20}/><span>Toulouse</span></a>
      <div className="header-right"><div className="places-menu">
        <button className="places-button" aria-expanded={placesOpen} aria-controls="places-popover" onClick={() => setPlacesOpen(v => !v)}><MapPin size={17}/>Места</button>
        {placesOpen && <><button className="places-dismiss" tabIndex={-1} aria-label="Закрыть выбор места" onClick={() => setPlacesOpen(false)}/><div id="places-popover" className="places-popover"><select autoFocus aria-label="Перейти к месту" defaultValue="" onChange={e => { go(Number(e.target.value)); setPlacesOpen(false) }}><option value="" disabled>Выбрать место</option>{places.map((p, i) => <option key={p.name} value={i}>{p.name}</option>)}</select></div></>}
      </div><button className="header-icon" onClick={copy} aria-label="Скопировать ссылку на место" title="Скопировать ссылку">{copied ? <Check size={17}/> : <Copy size={17}/>}</button><button className="source-button header-icon" onClick={() => setSources(true)} aria-label="О картах" title="О картах"><Info size={18}/></button></div>
    </header>
    {visibleMode === 'split' && <><div className="epoch-label old-label">{year} <span>{year === '1954' ? 'АЭРОФОТОСЪЁМКА' : 'ИСТОРИЧЕСКИЙ КАДАСТР'}</span></div><div className="epoch-label new-label"><span>СОВРЕМЕННАЯ КАРТА</span> Сегодня</div><div className="divider" style={{ left: `${split}%` }}><div className="divider-handle" role="slider" tabIndex={0} aria-label="Граница сравнения карт" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(split)} onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId) }} onPointerMove={e => { if (e.currentTarget.hasPointerCapture(e.pointerId)) setSplit(Math.max(0, Math.min(100, e.clientX / window.innerWidth * 100))) }} onKeyDown={e => { if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) { e.preventDefault(); setSplit(s => e.key === 'Home' ? 0 : e.key === 'End' ? 100 : Math.max(0, Math.min(100, s + (e.key === 'ArrowLeft' ? -2 : 2)))) } }}><ArrowLeftRight size={21}/></div></div></>}
    <div className="zoom-controls"><button className={geo.status !== 'off' ? 'location-active' : ''} aria-label={geo.status === 'off' ? 'Найти меня' : 'Выключить геопозицию'} title={geo.status === 'off' ? 'Найти меня' : 'Выключить геопозицию'} aria-pressed={geo.status !== 'off'} onClick={geo.toggle}><Navigation size={19} fill={geo.status === 'following' ? 'currentColor' : 'none'}/></button><div/><button aria-label="Приблизить" onClick={() => map.current?.zoomIn()}><Plus size={20}/></button><button aria-label="Отдалить" onClick={() => map.current?.zoomOut()}><Minus size={20}/></button><div/><button aria-label="Вернуться к Rue Ninau" onClick={() => go(0)}><RotateCcw size={18}/></button></div>
    <section className="control-panel" aria-label="Сравнение карт"><span className="sr-only">{ready.modern && ready.historic ? 'Карты загружены' : 'Загружаем карты…'}</span>{!(ready.modern && ready.historic) && <span className="loading-dot" title="Загружаем карты…"/>}{mode !== 'time' && mode !== 'modern' && <div className="year-selector"><div role="group" aria-label="Исторический период">{YEARS.map(value => <button key={value} aria-label={`Карта ${value} года`} aria-pressed={year === value} className={year === value ? 'selected' : ''} onClick={() => changeYear(value)}>{value}</button>)}</div></div>}<div className="mode-buttons">{([['time', 'Время', null], ['split', 'Шторка', null], ['overlay', 'Наложение', null], ['historic', year, null], ['modern', 'Сегодня', null]] as const).map(([key, title, icon]) => <button key={key} aria-pressed={mode === key} className={mode === key ? 'active' : ''} onClick={() => setMode(key)}>{icon}{title}</button>)}</div>{mode === 'time' ? <div className="timeline"><div className="timeline-value" aria-live="polite" title="Смешивание карт, не реконструкция промежуточных лет">{timeLabel}</div><input aria-label="Путешествие по времени" aria-valuetext={timeLabel} type="range" min="1680" max={TODAY} step="1" value={time} onChange={e => setTime(Number(e.target.value))}/><div className="timeline-ticks"><button onClick={() => setTime(1680)}>1680</button><button style={{ left: ((1830 - 1680) / (TODAY - 1680) * 100) + '%' }} onClick={() => setTime(1830)}>1830</button><button style={{ left: ((1954 - 1680) / (TODAY - 1680) * 100) + '%', transform: 'translateX(-50%)' }} onClick={() => setTime(1954)}>1954</button><button onClick={() => setTime(TODAY)}>Сегодня</button></div></div> : (mode === 'overlay' || mode === 'split') && <div className="slider-row"><span>{mode === 'overlay' ? '' : year}</span><input aria-label={mode === 'overlay' ? 'Непрозрачность исторической карты' : 'Положение шторки'} type="range" min="0" max="100" value={mode === 'overlay' ? opacity : split} onChange={e => mode === 'overlay' ? setOpacity(Number(e.target.value)) : setSplit(Number(e.target.value))}/><span>{mode === 'overlay' ? `${opacity}%` : 'Сегодня'}</span></div>}</section>
    {(geo.message || geo.status === 'locating') && <div className="location-notice" role="status"><span>{geo.message || 'Определяем твоё местоположение…'}</span><button aria-label="Скрыть сообщение о геопозиции" onClick={geo.dismiss}><X size={14}/></button></div>}
    {errors.length > 0 && <div className="error-toast" role="alert">{errors.map(e => <p key={e}>{e}</p>)}<button onClick={() => location.reload()}>Повторить загрузку</button><button aria-label="Закрыть сообщение" onClick={() => setErrors([])}><X size={16}/></button></div>}
    <footer><span className="coordinates">{coords}</span><span>{mode === 'time' || year !== '1954' ? <><a href={sourceUrl(year === '1954' ? '1830' : year)} target="_blank" rel="noreferrer">Makina Corpus</a> / <a href="https://data.toulouse-metropole.fr/" target="_blank" rel="noreferrer">Toulouse Métropole</a></> : null}{mode === 'time' ? ' · ' : ''}{(mode === 'time' || year === '1954') && <a href="https://www.ign.fr/" target="_blank" rel="noreferrer">© IGN · 1954</a>} <b>·</b> <a href="https://openfreemap.org/" target="_blank" rel="noreferrer">OpenFreeMap</a> © <a href="https://openmaptiles.org/" target="_blank" rel="noreferrer">OpenMapTiles</a> © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a></span></footer>
    {sources && <div className="modal-backdrop" onClick={() => setSources(false)}><section className="source-modal" role="dialog" aria-modal="true" aria-label="О картах и точности" onClick={e => e.stopPropagation()}><button autoFocus className="close-modal" aria-label="Закрыть источники" onClick={() => setSources(false)}><X/></button><div className="eyebrow">ИСТОЧНИКИ И ТОЧНОСТЬ</div><h2>Карты Тулузы</h2>{year === '1954' ? <><h3>Аэрофотосъёмка 1954 года</h3><p>Историческая чёрно-белая съёмка Тулузы из IGN / Edugéo. Используем готовый географически привязанный слой. При сильном приближении видны пиксели исходного снимка; за пределами покрытия остаётся современная карта.</p></> : <><h3>{year === '1680' ? 'Около 1680 года' : 'Кадастр 1830 года'}</h3><p>Карта Makina Corpus по историческому кадастру Toulouse Métropole. Это современная отрисовка исторических данных, а не оригинальный архивный скан. Используем готовые географически привязанные тайлы без дополнительного растяжения.</p></>}<a href={sourceUrl(year)} target="_blank" rel="noreferrer">Открыть карту-источник <ExternalLink size={14}/></a><h3>Управление</h3><p>На компьютере удерживай пробел, чтобы временно увидеть современную карту. Кнопка «Места» открывает переходы к кварталам.</p><h3>Режим «Время»</h3><p>Ползунок смешивает четыре источника: 1680, 1830, аэрофотосъёмку 1954 года и современную карту. Промежуточные положения показывают переход между картами, а не достоверный вид города в промежуточном году.</p><a href={sourceUrl('1680')} target="_blank" rel="noreferrer">Источник 1680</a> · <a href={sourceUrl('1830')} target="_blank" rel="noreferrer">Источник 1830</a> · <a href={IGN_SOURCE} target="_blank" rel="noreferrer">Источник 1954 · IGN / Edugéo</a><h3>Современный город</h3><p>Векторная карта OpenFreeMap на основе OpenStreetMap. Дата обновления отдельных объектов различается; это не съёмка города на определённый день.</p><h3>Как читать несовпадения</h3><p>Они могут отражать изменения города или погрешности исторической реконструкции. Численная точность и контрольные точки исходной привязки не опубликованы вместе с тайлами. Совпадение каждого здания не гарантируется. За пределами исторического покрытия старые данные отсутствуют.</p><h3>Использование данных</h3><p>Официальный каталог указывает Licence Ouverte v2.0 для кадастрового набора. Отдельные условия оформления и хостинга тайлов Makina Corpus не подтверждены: эта версия предназначена для личной проверки концепции. Перед публичным запуском необходимо уточнить их или подготовить собственный слой из открытых данных.</p><a href={`https://data.toulouse-metropole.fr/explore/dataset/parcellaire-de-${year === '1954' ? '1830' : year}/information/`} target="_blank" rel="noreferrer">Официальный каталог <ExternalLink size={14}/></a></section></div>}
  </main>
}
createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>)
