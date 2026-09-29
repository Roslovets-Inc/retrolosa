import { useCallback, useEffect, useRef, useState } from 'react'
import { Marker, type Map } from 'maplibre-gl'

// Browser geolocation only; no separate location service or backend.
export function useLocation(maps: React.RefObject<Map[]>) {
  const [status, setStatus] = useState<'off' | 'locating' | 'following'>('off')
  const [message, setMessage] = useState('')
  const watch = useRef<number | null>(null)
  const generation = useRef(0)
  const markers = useRef<Marker[]>([])
  const stop = useCallback(() => {
    generation.current++
    if (watch.current !== null) navigator.geolocation?.clearWatch(watch.current)
    watch.current = null
    markers.current.forEach(marker => marker.remove())
    markers.current = []
    setStatus('off')
  }, [])
  useEffect(() => stop, [stop])
  const toggle = () => {
    if (watch.current !== null) { stop(); setMessage(''); return }
    if (!navigator.geolocation) { setMessage('Этот браузер не поддерживает геопозицию.'); return }
    if (!maps.current.length) return
    setMessage(''); setStatus('locating')
    const request = ++generation.current
    watch.current = navigator.geolocation.watchPosition(position => {
      if (request !== generation.current) return
      const { longitude: lon, latitude: lat, accuracy } = position.coords
      if (lon < 1.405 || lon > 1.48 || lat < 43.575 || lat > 43.635) {
        stop(); setMessage('Ты сейчас за пределами центра Тулузы, который охватывает эта карта.'); return
      }
      if (!markers.current.length) {
        markers.current = maps.current.map(map => {
          const el = document.createElement('div')
          el.className = 'location-dot'
          el.setAttribute('role', 'img')
          el.setAttribute('aria-label', 'Моё местоположение')
          return new Marker({ element: el }).setLngLat([lon, lat]).addTo(map)
        })
      }
      markers.current.forEach(marker => {
        marker.getElement().style.opacity = '1'
        marker.setLngLat([lon, lat])
        marker.getElement().title = `Моё местоположение · точность около ${Math.round(accuracy)} м`
      })
      setStatus('following')
      setMessage(`Геопозиция включена · точность около ${Math.round(accuracy)} м`)
      maps.current[0]?.easeTo({ center: [lon, lat], duration: 600 })
    }, error => {
      if (request !== generation.current) return
      if (error.code === 1) {
        stop()
        setMessage('Разреши доступ к геопозиции в настройках браузера и нажми «Найти меня» ещё раз.')
      } else {
        // A temporary GPS loss must not cancel the watch; it can recover on its own.
        setStatus('locating')
        markers.current.forEach(marker => { marker.getElement().style.opacity = '0.4'; marker.getElement().title = 'Последнее известное положение — ждём новый сигнал' })
        setMessage('Ждём сигнал геопозиции. Бледная точка — последнее известное положение. Для остановки нажми стрелку.')
      }
    }, { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 })
  }
  return { status, message, toggle, dismiss: () => setMessage('') }
}
