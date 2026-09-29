import React, { useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import * as maplibregl from 'maplibre-gl'
import type { Map as MapInstance } from 'maplibre-gl'
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'
import { Protocol } from 'pmtiles'
import { ArrowLeftRight, Layers, MapPin, Plus, Minus, RotateCcw, Info, X, ExternalLink, Copy, Check } from 'lucide-react'
import 'maplibre-gl/dist/maplibre-gl.css'
import './style.css'

const HISTORIC = 'https://makina-pmtiles.s3.fr-par.scw.cloud/tolosa-1680.pmtiles'
maplibregl.setWorkerUrl(workerUrl)
const protocol = new Protocol()
maplibregl.addProtocol('pmtiles', protocol.tile)
type Mode = 'split' | 'overlay' | 'modern' | 'historic'
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
  return p.has('lon') && lon > 1.405 && lon < 1.48 && lat > 43.575 && lat < 43.635 && z >= 15 && z <= 20
    ? { center: [lon, lat] as [number, number], zoom: z } : { center: places[0].center, zoom: 16.7 }
}
function App() {
  const modernEl = useRef<HTMLDivElement>(null), oldEl = useRef<HTMLDivElement>(null)
  const map = useRef<MapInstance | null>(null)
  const [mode, setMode] = useState<Mode>('split')
  const [opacity, setOpacity] = useState(65), [split, setSplit] = useState(50)
  const [peek, setPeek] = useState(false), [sources, setSources] = useState(false)
  const [ready, setReady] = useState({ modern: false, historic: false })
  const [errors, setErrors] = useState<string[]>([])
  const [coords, setCoords] = useState('43.59768° N · 1.44954° E')
  const [copied, setCopied] = useState(false)
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
      const options = { ...initialView(), minZoom: 15, maxZoom: 20, maxBounds: [[1.405, 43.575], [1.48, 43.635]] as [[number, number], [number, number]], pitchWithRotate: false, dragRotate: false, touchPitch: false, attributionControl: false as const }
      modern = new maplibregl.Map({ ...options, container: modernEl.current, style: 'https://tiles.openfreemap.org/styles/positron' })
      historic = new maplibregl.Map({ ...options, container: oldEl.current, interactive: false, style: { version: 8, sources: { history: { type: 'raster', url: `pmtiles://${HISTORIC}`, tileSize: 256, attribution: 'Toulouse Métropole · Makina Corpus' } }, layers: [{ id: 'paper', type: 'background', paint: { 'background-color': '#ead9b2' } }, { id: 'history', type: 'raster', source: 'history', paint: { 'raster-fade-duration': 0 } }] } })
    } catch { setErrors(['Браузер не смог запустить карту. Проверьте поддержку WebGL и аппаратное ускорение.']); return }
    map.current = modern
    modern.touchZoomRotate.disableRotation()
    const sync = () => historic.jumpTo({ center: modern.getCenter(), zoom: modern.getZoom(), bearing: 0, pitch: 0 })
    modern.on('move', sync)
    modern.on('moveend', () => { const c = modern.getCenter(); history.replaceState(null, '', `#lon=${c.lng.toFixed(6)}&lat=${c.lat.toFixed(6)}&z=${modern.getZoom().toFixed(2)}`) })
    modern.on('mousemove', e => setCoords(`${e.lngLat.lat.toFixed(5)}° N · ${e.lngLat.lng.toFixed(5)}° E`))
    modern.addControl(new maplibregl.ScaleControl({ maxWidth: 120, unit: 'metric' }), 'bottom-left')
    for (const [kind, instance] of [['modern', modern], ['historic', historic]] as const) {
      instance.on('idle', () => setReady(s => ({ ...s, [kind]: true })))
      instance.on('error', e => { console.error(kind, e.error); setErrors(s => [...new Set([...s, kind === 'modern' ? 'Не удалось загрузить часть современной карты. Проверьте интернет и обновите страницу.' : 'Не удалось загрузить часть карты 1680 года. Проверьте интернет и обновите страницу.'])]) })
    }
    const resize = new ResizeObserver(() => { modern.resize(); historic.resize(); sync() })
    resize.observe(modernEl.current)
    return () => { resize.disconnect(); modern.remove(); historic.remove(); map.current = null }
  }, [])
  useEffect(() => {
    const down = (e: KeyboardEvent) => { if (e.code === 'Space' && !(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLButtonElement)) { e.preventDefault(); setPeek(true) } if(e.key === 'Escape') setSources(false) }
    const up = (e: KeyboardEvent) => { if (e.code === 'Space') setPeek(false) }
    const blur = () => setPeek(false)
    window.addEventListener('keydown', down); window.addEventListener('keyup', up); window.addEventListener('blur', blur)
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); window.removeEventListener('blur', blur) }
  }, [])
  const visibleMode = peek ? 'modern' : mode
  const go = (index: number) => map.current?.flyTo({ ...places[index], duration: 1000, essential: true })
  const copy = async () => { try { await navigator.clipboard.writeText(location.href); setCopied(true); setTimeout(() => setCopied(false), 2000) } catch { setErrors(s => [...s, 'Скопируйте адрес страницы из адресной строки.']) } }
  return <main>
    <div className="map" ref={modernEl} aria-label="Современная карта Тулузы" />
    <div className="map historic-map" ref={oldEl} aria-label="Историческая карта Тулузы 1680 года" style={{ opacity: visibleMode === 'modern' ? 0 : visibleMode === 'overlay' ? opacity / 100 : 1, clipPath: visibleMode === 'split' ? `inset(0 ${100 - split}% 0 0)` : 'none' }} />
    <header className="masthead"><a className="brand" href="/" aria-label="Toulouse сквозь время"><span className="brand-icon"><Layers size={22}/></span><span>Toulouse<span className="brand-sub">СКВОЗЬ ВРЕМЯ</span></span></a><div className="header-right"><span className="edition">ИНТЕРАКТИВНЫЙ АТЛАС · 01</span><button className="source-button" onClick={() => setSources(true)}><Info size={17}/> <span>О картах</span></button></div></header>
    <section className="intro"><div className="eyebrow">ОДИН ГОРОД. ДВЕ ЭПОХИ.</div><h1>Здесь было<br/><em>другое время.</em></h1><p>Передвигайте карту. Сравнивайте улицы.<br/>Находите следы старой Тулузы.</p><div className="place-select"><MapPin size={16}/><select aria-label="Перейти к месту" defaultValue="0" onChange={e => go(Number(e.target.value))}>{places.map((p, i) => <option key={p.name} value={i}>{p.name}</option>)}</select></div></section>
    {visibleMode === 'split' && <><div className="epoch-label old-label">1680 <span>ИСТОРИЧЕСКИЙ КАДАСТР</span></div><div className="epoch-label new-label"><span>СОВРЕМЕННАЯ КАРТА</span> Сегодня</div><div className="divider" style={{ left: `${split}%` }}><div className="divider-handle" role="slider" tabIndex={0} aria-label="Граница сравнения карт" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(split)} onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId) }} onPointerMove={e => { if (e.currentTarget.hasPointerCapture(e.pointerId)) setSplit(Math.max(0, Math.min(100, e.clientX / window.innerWidth * 100))) }} onKeyDown={e => { if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) { e.preventDefault(); setSplit(s => e.key === 'Home' ? 0 : e.key === 'End' ? 100 : Math.max(0, Math.min(100, s + (e.key === 'ArrowLeft' ? -2 : 2)))) } }}><ArrowLeftRight size={21}/></div></div></>}
    <div className="zoom-controls"><button aria-label="Приблизить" onClick={() => map.current?.zoomIn()}><Plus size={20}/></button><button aria-label="Отдалить" onClick={() => map.current?.zoomOut()}><Minus size={20}/></button><div/><button aria-label="Вернуться к Rue Ninau" onClick={() => go(0)}><RotateCcw size={18}/></button></div>
    <section className="control-panel" aria-label="Сравнение карт"><div className="panel-top"><span className="panel-title">Путешествие во времени</span><span className="live-state"><i className={ready.modern && ready.historic ? 'loaded' : ''}/>{ready.modern && ready.historic ? 'Карты загружены' : 'Загружаем карты…'}</span></div><div className="mode-buttons">{([['split', 'Шторка', <ArrowLeftRight size={16}/>], ['overlay', 'Наложение', <Layers size={16}/>], ['historic', '1680', null], ['modern', 'Сегодня', null]] as const).map(([key, title, icon]) => <button key={key} aria-pressed={mode === key} className={mode === key ? 'active' : ''} onClick={() => setMode(key)}>{icon}{title}</button>)}</div><div className="slider-row"><span>{mode === 'overlay' ? 'Прозрачность' : '1680'}</span><input aria-label={mode === 'overlay' ? 'Непрозрачность исторической карты' : 'Положение шторки'} type="range" min="0" max="100" value={mode === 'overlay' ? opacity : split} disabled={mode === 'modern' || mode === 'historic'} onChange={e => mode === 'overlay' ? setOpacity(Number(e.target.value)) : setSplit(Number(e.target.value))}/><span>{mode === 'overlay' ? `${opacity}%` : 'Сегодня'}</span></div><div className="panel-bottom"><span><kbd>Пробел</kbd> удерживайте, чтобы увидеть настоящее</span><button onClick={copy} aria-label="Скопировать ссылку на место">{copied ? <Check size={16}/> : <Copy size={16}/>}</button></div></section>
    {errors.length > 0 && <div className="error-toast" role="alert">{errors.map(e => <p key={e}>{e}</p>)}<button onClick={() => location.reload()}>Повторить загрузку</button><button aria-label="Закрыть сообщение" onClick={() => setErrors([])}><X size={16}/></button></div>}
    <footer><span className="coordinates">{coords}</span><span>1680: <a href="https://tolosa1680.makina-corpus.com/" target="_blank" rel="noreferrer">Makina Corpus</a> / <a href="https://data.toulouse-metropole.fr/explore/dataset/parcellaire-de-1680/" target="_blank" rel="noreferrer">Toulouse Métropole</a> <b>·</b> <a href="https://openfreemap.org/" target="_blank" rel="noreferrer">OpenFreeMap</a> © <a href="https://openmaptiles.org/" target="_blank" rel="noreferrer">OpenMapTiles</a> © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a></span></footer>
    {sources && <div className="modal-backdrop" onClick={() => setSources(false)}><section className="source-modal" role="dialog" aria-modal="true" aria-label="О картах и точности" onClick={e => e.stopPropagation()}><button autoFocus className="close-modal" aria-label="Закрыть источники" onClick={() => setSources(false)}><X/></button><div className="eyebrow">ИСТОЧНИКИ И ТОЧНОСТЬ</div><h2>Два взгляда на Тулузу</h2><h3>Около 1680 года</h3><p>Карта Makina Corpus по историческому кадастру Toulouse Métropole. Это современная отрисовка исторических данных, а не оригинальный архивный скан. Используем готовые географически привязанные тайлы без дополнительного растяжения.</p><a href="https://tolosa1680.makina-corpus.com/" target="_blank" rel="noreferrer">Открыть карту-источник <ExternalLink size={14}/></a><h3>Современный город</h3><p>Векторная карта OpenFreeMap на основе OpenStreetMap. Дата обновления отдельных объектов различается; это не съёмка города на определённый день.</p><h3>Как читать несовпадения</h3><p>Они могут отражать изменения города или погрешности исторической реконструкции. Численная точность и контрольные точки исходной привязки не опубликованы вместе с тайлами. Совпадение каждого здания не гарантируется. За пределами исторического покрытия старые данные отсутствуют.</p><h3>Использование данных</h3><p>Официальный каталог указывает Licence Ouverte v2.0 для кадастрового набора. Отдельные условия оформления и хостинга тайлов Makina Corpus не подтверждены: эта версия предназначена для личной проверки концепции. Перед публичным запуском необходимо уточнить их или подготовить собственный слой из открытых данных.</p><a href="https://data.toulouse-metropole.fr/explore/dataset/parcellaire-de-1680/information/" target="_blank" rel="noreferrer">Официальный каталог <ExternalLink size={14}/></a></section></div>}
  </main>
}
createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>)
