import { useEffect, useState } from 'react'
import './App.css'
import api from './api'
import { getMapNodes, getRoute } from './services/navigationService'



function Logo({ large = false }) {
  return (
      <div className={`m-logo ${large ? 'm-logo-large' : ''}`}>
        <img src="/figma/visitor-login-imgMihwarSymbol.svg" alt="علامة محور" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
      </div>
  )
}

function App({ userId = 1 }) {
  const USER_ID = userId
  const [activeSection, setActiveSection] = useState('dashboard')

  const [destinations, setDestinations] = useState([])
  const [mapNodes, setMapNodes] = useState([])
  const [destinationsLoading, setDestinationsLoading] = useState(true)
  const [mapLoading, setMapLoading] = useState(true)

  const [selectedStartNodeId, setSelectedStartNodeId] = useState('')
  const [selectedEndNodeId, setSelectedEndNodeId] = useState('')
  const [mapPickMode, setMapPickMode] = useState('')
  const [route, setRoute] = useState(null)
  const [routeLoading, setRouteLoading] = useState(false)
  const [error, setError] = useState('')

  // Digital Passport state
  const [passportVisits, setPassportVisits] = useState([])
  const [passportLoading, setPassportLoading] = useState(false)
  const [passportError, setPassportError] = useState('')
  const [passportLoaded, setPassportLoaded] = useState(false)
  const [passportPage, setPassportPage] = useState(0)

  useEffect(() => {
    const loadDestinations = async () => {
      try {
        const response = await api.get('/destinations')
        const data = Array.isArray(response.data) ? response.data : []

        setDestinations(data)
      } catch (err) {
        console.error(err)
        setError('Could not load destinations. Check the backend.')
      } finally {
        setDestinationsLoading(false)
      }
    }

    const loadMapNodes = async () => {
      try {
        const data = await getMapNodes()
        const nodes = Array.isArray(data) ? data : []
        setMapNodes(nodes)

        // Use Main Entrance as the default start when it exists.
        const mainEntrance = nodes.find(
            (node) => node.name?.trim().toLowerCase() === 'main entrance'
        )

        if (mainEntrance) {
          setSelectedStartNodeId(String(mainEntrance.id))
        }
      } catch (err) {
        console.error(err)
        setError('Could not load map locations. Check the backend.')
      } finally {
        setMapLoading(false)
      }
    }

    loadDestinations()
    loadMapNodes()
  }, [])

  const navigateTo = (section) => {
    setActiveSection(section)
    setError('')

    if (section === 'passport') {
      loadPassport()
    }
  }

  const clearRoute = () => {
    setRoute(null)
    setError('')
  }

  const selectedStartNode = mapNodes.find(
      (node) => String(node.id) === selectedStartNodeId
  )

  const selectedEndNode = mapNodes.find(
      (node) => String(node.id) === selectedEndNodeId
  )

  const selectedDestination = destinations.find(
      (item) =>
          String(item.id) === String(
              selectedEndNode?.destination?.id ??
              selectedEndNode?.destinationId ??
              ''
          )
  )

  const handleMapNodePick = (node) => {
    if (mapPickMode === 'start') {
      setSelectedStartNodeId(String(node.id))
    } else {
      // Clicking a map point selects it as the destination.
      setSelectedEndNodeId(String(node.id))
    }

    setMapPickMode('')
    setVisitMessage('')
    clearRoute()
  }

  // Fetch the real visit records from Spring Boot.
  const loadPassport = async () => {
    try {
      setPassportLoading(true)
      setPassportError('')

      const response = await api.get(
          `/user-destination-progress/user/${USER_ID}/passport`
      )

      const records = Array.isArray(response.data)
          ? response.data
          : []

      setPassportVisits(records)
      setPassportLoaded(true)
      setPassportPage(0)
    } catch (err) {
      console.error('Passport request failed:', err)

      setPassportError(
          err.response?.data?.message ||
          'Could not load your Digital Passport. Please try again.'
      )
    } finally {
      setPassportLoading(false)
    }
  }

  const [visitLoading, setVisitLoading] = useState(false)
  const [visitMessage, setVisitMessage] = useState('')

  const handleMarkVisited = async () => {
    const destinationId =
        selectedEndNode?.destination?.id ??
        selectedEndNode?.destinationId

    if (!destinationId) {
      setVisitMessage(
          'This map point is not linked to a destination.'
      )
      return
    }

    try {
      setVisitLoading(true)
      setVisitMessage('')

      await api.post('/user-destination-progress/visit', {
        userId: USER_ID,
        destinationId: Number(destinationId),
      })

      setVisitMessage('Visit recorded successfully!')

      await loadPassport()
    } catch (err) {
      console.error('Failed to record visit:', err)

      setVisitMessage(
          err.response?.data?.message ||
          'Could not record this visit. Please try again.'
      )
    } finally {
      setVisitLoading(false)
    }
  }

  const handleFindRoute = async () => {
    setRoute(null)
    setError('')

    if (!selectedStartNodeId) {
      setError('Please select a starting point from the list or map.')
      return
    }

    if (!selectedEndNodeId) {
      setError('Please choose a destination by clicking a point on the map.')
      return
    }

    if (String(selectedStartNodeId) === String(selectedEndNodeId)) {
      setError('The starting point and destination must be different.')
      return
    }

    try {
      setRouteLoading(true)

      const data = await getRoute(
          Number(selectedStartNodeId),
          Number(selectedEndNodeId)
      )

      if (!Array.isArray(data?.points) || data.points.length === 0) {
        throw new Error('No route was returned by the backend.')
      }

      if (
          !data.points.every(
              (point) =>
                  Number.isFinite(Number(point.x)) &&
                  Number.isFinite(Number(point.y))
          )
      ) {
        throw new Error('The route coordinates are invalid.')
      }

      setRoute(data)
    } catch (err) {
      console.error(err)
      setError(
          err.response?.data?.message ||
          err.message ||
          'Could not calculate the route.'
      )
    } finally {
      setRouteLoading(false)
    }
  }

  const pageInfo = {
    dashboard: ['Dashboard', 'Your Expo experience starts here.'],
    identity: ['Digital Identity', 'Your visitor identity in one place.'],
    map: ['Smart Interactive Map', 'Explore Expo Riyadh with ease.'],
    passport: ['Digital Passport', 'Your Expo visitor passport services.'],
    wallet: ['Digital Wallet', 'Your wallet and payment services.'],
  }

  const renderMap = () => (
      <section className="section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">EXPLORE EXPO RIYADH</span>
            <h2>Smart Interactive Map</h2>
            <p>Choose your starting point and destination.</p>
          </div>
          <span className="map-tag">EXPO MAP</span>
        </div>

        <div className="map-card">
          <div className="map-controls">
            <label htmlFor="start-node-select">Starting point</label>
            <select
                id="start-node-select"
                value={selectedStartNodeId}
                onChange={(event) => {
                  setSelectedStartNodeId(event.target.value)
                  clearRoute()
                }}
                disabled={mapLoading || mapNodes.length === 0}
            >
              <option value="">Select a starting point</option>
              {mapNodes.map((node) => (
                  <option key={node.id} value={String(node.id)}>
                    {node.name || `Map point ${node.id}`}
                  </option>
              ))}
            </select>

            <div className="map-pick-actions">
              <button
                  type="button"
                  className={`map-pick-btn ${mapPickMode === 'start' ? 'active' : ''}`}
                  onClick={() => setMapPickMode(mapPickMode === 'start' ? '' : 'start')}
                  disabled={mapLoading || mapNodes.length === 0}
              >
                {mapPickMode === 'start' ? 'Click a start point on the map…' : 'Pick start on map'}
              </button>
              <button
                  type="button"
                  className={`map-pick-btn ${mapPickMode === 'end' ? 'active' : ''}`}
                  onClick={() => setMapPickMode(mapPickMode === 'end' ? '' : 'end')}
                  disabled={mapLoading || mapNodes.length === 0}
              >
                {mapPickMode === 'end' ? 'Click a destination on the map…' : 'Pick destination on map'}
              </button>
            </div>

            <div className="map-selection-summary">
              <p><strong>Start:</strong> {selectedStartNode?.name || 'Not selected'}</p>
              <p><strong>Destination:</strong> {selectedEndNode?.name || 'Click a point on the map'}</p>
            </div>

            <div className="map-buttons">
              <button
                  className="map-action-btn"
                  onClick={handleFindRoute}
                  disabled={mapLoading || routeLoading || !selectedStartNodeId || !selectedEndNodeId}
              >
                {routeLoading ? 'Finding route...' : 'Find Route →'}
              </button>
              {(route || selectedEndNodeId) && (
                  <button
                      className="map-clear-btn"
                      onClick={() => {
                        clearRoute()
                        setSelectedEndNodeId('')
                        setMapPickMode('')
                      }}
                  >
                    Clear route / destination
                  </button>
              )}
            </div>

            {(destinationsLoading || mapLoading) && (
                <p className="map-status">Loading map information...</p>
            )}
            {mapPickMode && (
                <p className="map-status" role="status">
                  {mapPickMode === 'start'
                      ? 'Click any marked point on the map to set the starting point.'
                      : 'Click any marked point on the map to set the destination.'}
                </p>
            )}
            {error && <p className="map-error" role="alert">{error}</p>}

            {route && (
                <div className="map-route-info">
                  <strong>Route found</strong>
                  <p>{selectedStartNode?.name || 'Start'} → {selectedEndNode?.name || 'Destination'}</p>
                  {route.totalDistance != null && <p>Distance: {route.totalDistance}</p>}
                </div>
            )}
          </div>

          <div className="map-image-container">
            <img src="/Expo%20MockMap.jpg" alt="Expo Riyadh map" />

            {route && (
                <svg
                    className="map-route-svg"
                    viewBox="0 0 1000 1000"
                    preserveAspectRatio="none"
                    aria-label="Calculated route"
                >
                  <polyline
                      className="map-route-line"
                      points={route.points
                          .map((point) => `${Number(point.x) * 1000},${Number(point.y) * 1000}`)
                          .join(' ')}
                  />
                  {route.points.map((point, index) => (
                      <circle
                          key={`${point.nodeId ?? point.name}-${index}`}
                          cx={Number(point.x) * 1000}
                          cy={Number(point.y) * 1000}
                          r={index === 0 || index === route.points.length - 1 ? 12 : 7}
                          className={
                            index === 0
                                ? 'map-route-point map-route-start'
                                : index === route.points.length - 1
                                    ? 'map-route-point map-route-end'
                                    : 'map-route-point'
                          }
                      />
                  ))}
                </svg>
            )}

            {mapNodes.length > 0 && (
                <svg
                    className={`map-node-pick-svg ${mapPickMode ? 'is-picking' : ''}`}
                    viewBox="0 0 1000 1000"
                    preserveAspectRatio="none"
                    aria-label="Choose a starting point or destination"
                >
                  {mapNodes
                      .filter(
                          (node) =>
                              Number.isFinite(Number(node.x)) &&
                              Number.isFinite(Number(node.y))
                      )
                      .map((node) => {
                        const isStart =
                            String(node.id) === selectedStartNodeId

                        const isEnd =
                            String(node.id) === selectedEndNodeId

                        const x = Number(node.x) * 1000
                        const y = Number(node.y) * 1000

                        return (
                            <g
                                key={node.id}
                                className="map-node-pick"
                                role="button"
                                tabIndex={0}
                                aria-label={`Select ${
                                    node.name || `map point ${node.id}`
                                }`}
                                onClick={() => handleMapNodePick(node)}
                                onKeyDown={(event) => {
                                  if (
                                      event.key === 'Enter' ||
                                      event.key === ' '
                                  ) {
                                    event.preventDefault()
                                    handleMapNodePick(node)
                                  }
                                }}
                            >
                              <title>
                                {node.name || `Map point ${node.id}`}
                              </title>

                              <circle
                                  className={`map-node-hit-area ${
                                      isStart ? 'map-node-selected-start' : ''
                                  } ${
                                      isEnd ? 'map-node-selected-end' : ''
                                  }`}
                                  cx={x}
                                  cy={y}
                                  r={mapPickMode ? 22 : 13}
                              />

                              <circle
                                  className={`map-node-dot ${
                                      isStart ? 'map-node-dot-start' : ''
                                  } ${
                                      isEnd ? 'map-node-dot-end' : ''
                                  }`}
                                  cx={x}
                                  cy={y}
                                  r={isStart || isEnd ? 8 : 5}
                              />
                            </g>
                        )
                      })}
                </svg>
            )}
          </div>

          <div className="map-overlay">
            <span className="map-pin">⌖</span>

            <div>
              <strong>
                {route
                    ? `Route to ${
                        selectedEndNode?.name ||
                        selectedDestination?.name ||
                        'destination'
                    }`
                    : 'Explore Expo Riyadh'}
              </strong>

              <p>
                {route
                    ? 'Your route is displayed on the map.'
                    : 'Find pavilions, services, and destinations.'}
              </p>
            </div>
          </div>
          <div className="destination-details">
            <span className="eyebrow">DESTINATION DETAILS</span>

            <h3>
              {selectedDestination?.name ||
                  selectedEndNode?.destinationName ||
                  selectedEndNode?.name ||
                  'Select a destination'}
            </h3>

            <p>
              {selectedDestination?.description ||
                  'No description is available for this destination yet.'}
            </p>

            <button
                type="button"
                className="map-action-btn"
                onClick={handleMarkVisited}
                disabled={visitLoading || !selectedDestination}
            >
              {visitLoading ? 'Recording visit...' : '✓ Mark as Visited'}
            </button>

            {visitMessage && (
                <p className="visit-feedback" role="status">
                  {visitMessage}
                </p>
            )}
          </div>
        </div>
      </section>
  )

  const renderDashboard = () => (
      <>
        <section className="welcome-card">
          <div className="welcome-content">
            <span className="eyebrow">YOUR EXPO, ALL IN ONE</span>
            <h2>Your journey starts here.</h2>
            <p>
              Discover destinations, navigate Expo Riyadh, and access
              your visitor services in one convenient place.
            </p>

            <button
                className="primary-btn"
                onClick={() => navigateTo('map')}
            >
              Explore the map <span>→</span>
            </button>
          </div>

          <div className="welcome-art" aria-hidden="true">
            <Logo large />
            <span className="art-star star-one">✦</span>
            <span className="art-star star-two">✧</span>
          </div>
        </section>

        <section className="section">
          <div className="section-heading">
            <div>
              <h2>Explore our services</h2>
              <p>Everything you need for your Expo visit.</p>
            </div>
            <span className="section-count">04 SERVICES</span>
          </div>

          <div className="feature-grid">
            <button
                className="feature-card"
                onClick={() => navigateTo('identity')}
            >
              <span className="feature-icon purple">◎</span>
              <span className="feature-arrow">↗</span>
              <h3>Digital Identity</h3>
              <p>Your visitor identity in one convenient place.</p>
              <span className="feature-link">
              Explore identity <span>→</span>
            </span>
            </button>

            <button
                className="feature-card"
                onClick={() => navigateTo('map')}
            >
              <span className="feature-icon blue">⌖</span>
              <span className="feature-arrow">↗</span>
              <h3>Smart Interactive Map</h3>
              <p>Discover destinations and find your route.</p>
              <span className="feature-link">
              Open map <span>→</span>
            </span>
            </button>

            <button
                className="feature-card"
                onClick={() => navigateTo('passport')}
            >
              <span className="feature-icon orange">▤</span>
              <span className="feature-arrow">↗</span>
              <h3>Digital Passport</h3>
              <p>Your Expo visitor passport services.</p>
              <span className="feature-link">
              View passport <span>→</span>
            </span>
            </button>

            <button
                className="feature-card"
                onClick={() => navigateTo('wallet')}
            >
              <span className="feature-icon green">◈</span>
              <span className="feature-arrow">↗</span>
              <h3>Digital Wallet</h3>
              <p>Manage your wallet and Expo payments.</p>
              <span className="feature-link">
              Open wallet <span>→</span>
            </span>
            </button>
          </div>
        </section>

        <section className="section">
          <div className="section-heading">
            <div>
              <h2>Discover Expo</h2>
              <p>Start exploring the Expo grounds.</p>
            </div>

            <button
                className="text-action"
                onClick={() => navigateTo('map')}
            >
              View map →
            </button>
          </div>

          <button
              className="map-preview-card"
              onClick={() => navigateTo('map')}
          >
            <img
                src="/Expo%20MockMap.jpg"
                alt="Expo Riyadh map preview"
            />

            <div className="map-preview-caption">
              <span className="map-pin">⌖</span>

              <div>
                <strong>Expo Riyadh Interactive Map</strong>
                <p>Find pavilions, services, and routes.</p>
              </div>

              <span className="map-arrow">→</span>
            </div>
          </button>
        </section>
      </>
  )
  // Digital Passport with two visit stamps per page.
  const renderPassport = () => {
    const uniqueVisits = new Map()

    passportVisits
        .filter(
            (visit) => visit.status?.toUpperCase() === 'VISITED'
        )
        .filter((visit) => visit.destination?.id != null)
        .forEach((visit) => {
          const id = String(visit.destination.id)
          const existing = uniqueVisits.get(id)

          const currentDate = new Date(
              visit.visitedAt || visit.createdAt || 0
          )

          const existingDate = existing
              ? new Date(existing.visitedAt || existing.createdAt || 0)
              : null

          if (!existing || currentDate >= existingDate) {
            uniqueVisits.set(id, visit)
          }
        })

    const orderedVisits = [...uniqueVisits.values()].sort(
        (a, b) =>
            new Date(a.visitedAt || a.createdAt || 0) -
            new Date(b.visitedAt || b.createdAt || 0)
    )

    const visitedCount = orderedVisits.length
    const visitsPerPage = 2
    const pageCount = Math.max(
        1,
        Math.ceil(visitedCount / visitsPerPage)
    )

    const safePage = Math.min(passportPage, pageCount - 1)

    const pageVisits = orderedVisits.slice(
        safePage * visitsPerPage,
        safePage * visitsPerPage + visitsPerPage
    )

    const progress = destinations.length
        ? Math.min(
            100,
            Math.round((visitedCount / destinations.length) * 100)
        )
        : 0

    const formatVisitDate = (value) => {
      if (!value) return 'DATE UNAVAILABLE'

      const date = new Date(value)

      if (Number.isNaN(date.getTime())) {
        return 'DATE UNAVAILABLE'
      }

      return date
          .toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })
          .toUpperCase()
    }

    const renderStamp = (visit, index) => {
      if (!visit) {
        return (
            <div
                className="passport-stamp-slot passport-stamp-empty"
                key={`empty-${index}`}
            >
              <div className="passport-empty-stamp-mark">✦</div>
              <strong>YOUR NEXT ADVENTURE</strong>
              <span>
              This space is waiting for a new visit.
            </span>
              <small>MIHWAR · EXPO RIYADH</small>
            </div>
        )
      }

      const destination = visit.destination
      const stampNumber = safePage * visitsPerPage + index + 1

      return (
          <article
              className={`passport-stamp-slot passport-stamp-${index + 1}`}
              key={visit.id ?? destination.id}
          >
            <div className="passport-stamp-topline">
              <span>EXPO RIYADH</span>
              <span>
              VISIT {String(stampNumber).padStart(2, '0')}
            </span>
            </div>

            <div className="passport-stamp-main">
              <div
                  className="passport-stamp-seal"
                  aria-hidden="true"
              >
                <span className="passport-seal-ring">MIHWAR</span>
                <strong>✦</strong>
                <small>VISITED</small>
              </div>

              <div className="passport-stamp-details">
              <span className="passport-stamp-label">
                DESTINATION
              </span>

                <h4>
                  {destination.name ?? 'Unknown destination'}
                </h4>

                <span className="passport-stamp-type">
                {destination.type ?? 'EXPO DESTINATION'}
              </span>

                <div className="passport-stamp-date-row">
                  <span>DATE</span>
                  <strong>
                    {formatVisitDate(
                        visit.visitedAt || visit.createdAt
                    )}
                  </strong>
                </div>
              </div>
            </div>

            <div className="passport-stamp-footer">
              <span>SAUDI ARABIA</span>
              <span>STATUS: VISITED</span>
            </div>

            <div
                className="passport-stamp-watermark"
                aria-hidden="true"
            >
              م
            </div>
          </article>
      )
    }

    return (
        <section className="section passport-section">
          <div className="section-heading passport-heading">
            <div>
              <span className="eyebrow">YOUR EXPO JOURNEY</span>
              <h2>Digital Passport</h2>
              <p>
                Collect a visit stamp for every destination you explore.
              </p>
            </div>

            <button
                className="passport-refresh-btn"
                onClick={loadPassport}
                disabled={passportLoading}
            >
              {passportLoading ? 'Refreshing...' : '↻ Refresh'}
            </button>
          </div>

          {passportError && (
              <div className="map-error" role="alert">
                <p>{passportError}</p>
                <button
                    className="map-clear-btn"
                    onClick={loadPassport}
                    disabled={passportLoading}
                >
                  Try again
                </button>
              </div>
          )}

          <div className="passport-hero-card">
            <div className="passport-hero-content">
            <span className="passport-kicker">
              KINGDOM OF SAUDI ARABIA · EXPO RIYADH
            </span>

              <h3>Your journey, one stamp at a time.</h3>

              <p>
                Keep your Expo memories together in your MIHWAR visitor
                passport.
              </p>

              <div className="passport-user-chip">
              <span className="passport-user-avatar">
                {String(USER_ID).padStart(2, '0')}
              </span>

                <span>
                <strong>Expo Test Visitor</strong>
                <small>Test visitor · ID {USER_ID}</small>
              </span>
              </div>
            </div>

            <div className="passport-hero-mark" aria-hidden="true">
              <Logo large />
              <span>EXPO RIYADH</span>
            </div>
          </div>

          <div className="passport-stats-grid">
            <article className="passport-stat-card">
              <span className="passport-stat-icon purple">✦</span>
              <span className="passport-stat-label">
              Places visited
            </span>
              <strong>
                {passportLoading ? '—' : visitedCount}
              </strong>
              <small>Unique destinations</small>
            </article>

            <article className="passport-stat-card">
              <span className="passport-stat-icon blue">⌖</span>
              <span className="passport-stat-label">
              Available destinations
            </span>
              <strong>
                {destinationsLoading ? '—' : destinations.length}
              </strong>
              <small>Active Expo destinations</small>
            </article>

            <article className="passport-stat-card passport-progress-stat">
              <span className="passport-stat-icon orange">◔</span>
              <span className="passport-stat-label">
              Journey progress
            </span>
              <strong>
                {passportLoading || destinationsLoading
                    ? '—'
                    : `${progress}%`}
              </strong>

              <div className="passport-progress-track">
                <span style={{ width: `${progress}%` }} />
              </div>

              <small>Based on unique visited destinations</small>
            </article>
          </div>

          <div className="passport-pages-heading">
            <div>
              <span className="eyebrow">YOUR STAMP COLLECTION</span>
              <h3>Passport pages</h3>
              <p>Each page holds two visit stamps.</p>
            </div>

            <span className="passport-page-counter">
            PAGE {String(safePage + 1).padStart(2, '0')} /{' '}
              {String(pageCount).padStart(2, '0')}
          </span>
          </div>

          <div className="passport-book-wrap">
            <div
                className="passport-book-spine"
                aria-hidden="true"
            />

            <div className="passport-book-page">
              <div className="passport-page-header">
                <div>
                <span className="passport-page-eyebrow">
                  KINGDOM OF SAUDI ARABIA
                </span>
                  <h3>VISITOR PASSPORT</h3>
                </div>

                <div className="passport-page-emblem">
                  <Logo />
                </div>
              </div>

              <div className="passport-page-rule">
                <span>MIHWAR · EXPO RIYADH</span>
                <span>VISIT RECORDS</span>
              </div>

              {passportLoading ? (
                  <div className="passport-page-message">
                    <span className="passport-loader" />
                    <strong>Preparing your passport...</strong>
                  </div>
              ) : passportError ? (
                  <div className="passport-page-message">
                    <strong>Passport unavailable</strong>
                    <p>
                      Refresh the page to try loading your visit stamps again.
                    </p>
                  </div>
              ) : visitedCount === 0 ? (
                  <div className="passport-page-message">
                    <div className="passport-empty-stamp-mark">✦</div>
                    <strong>Your first stamp goes here</strong>
                    <p>
                      Once a visit is recorded, its stamp will appear on this
                      page.
                    </p>
                  </div>
              ) : (
                  <div className="passport-stamps-grid">
                    {[0, 1].map((index) =>
                        renderStamp(pageVisits[index], index)
                    )}
                  </div>
              )}

              <div className="passport-page-footer">
              <span>
                THIS PASSPORT IS A DIGITAL EXPO VISIT RECORD
              </span>
                <span>
                NO. {String(USER_ID).padStart(6, '0')}
              </span>
              </div>

              <div className="passport-page-number">
                {String(safePage + 1).padStart(2, '0')}
              </div>
            </div>
          </div>

          <div className="passport-pagination">
            <button
                className="passport-page-btn"
                onClick={() =>
                    setPassportPage((page) => Math.max(0, page - 1))
                }
                disabled={safePage === 0 || passportLoading}
            >
              ← Previous page
            </button>

            <div className="passport-pagination-status">
              <strong>
                Page {safePage + 1} of {pageCount}
              </strong>
              <span>
              {visitedCount} visit{visitedCount === 1 ? '' : 's'} · 2
              stamps per page
            </span>
            </div>

            <button
                className="passport-page-btn passport-next-btn"
                onClick={() =>
                    setPassportPage((page) =>
                        Math.min(pageCount - 1, page + 1)
                    )
                }
                disabled={
                    safePage >= pageCount - 1 || passportLoading
                }
            >
              Next page →
            </button>
          </div>

          <p className="passport-demo-note">
            Development preview · Visit records are loaded from the backend
            for test user ID {USER_ID}.
          </p>
        </section>
    )
  }
  const renderPlaceholder = (title, description) => (
      <section className="section">
        <div className="section-heading">
          <div>
            <h2>{title}</h2>
            <p>{description}</p>
          </div>
        </div>

        <div className="service-placeholder">
          <Logo large />
          <h3>{title}</h3>
          <p>
            This section is awaiting backend integration.
            User-dependent features have not been connected yet.
          </p>
          <button
              className="map-action-btn"
              onClick={() => navigateTo('dashboard')}
          >
            Back to dashboard
          </button>
        </div>
      </section>
  )

  return (
      <div className="app-layout">
        <aside className="sidebar">
          <button
              className="brand brand-button"
              onClick={() => navigateTo('dashboard')}
          >
            <Logo />
            <span>
            <strong>
              محور <span className="brand-english">MIHWAR</span>
            </strong>
            <small>YOUR EXPO, ALL IN ONE</small>
          </span>
          </button>

          <p className="menu-label">MAIN MENU</p>

          <nav className="navigation">
            {[
              ['dashboard', '⌂', 'Dashboard'],
              ['identity', '◎', 'Digital Identity'],
              ['map', '⌖', 'Interactive Map'],
              ['passport', '▤', 'Digital Passport'],
              ['wallet', '◈', 'Digital Wallet'],
            ].map(([id, icon, label]) => (
                <button
                    key={id}
                    className={`nav-link ${
                        activeSection === id ? 'active' : ''
                    }`}
                    onClick={() => navigateTo(id)}
                >
                  <span>{icon}</span>
                  {label}
                </button>
            ))}
          </nav>

          <div className="sidebar-bottom">
            <div className="help-card">
              <span>✦</span>
              <strong>Need some help?</strong>
              <p>
                Explore MIHWAR services to make your Expo visit easier.
              </p>
              <button onClick={() => navigateTo('map')}>
                Explore the map →
              </button>
            </div>
            <small className="copyright">© MIHWAR 2026</small>
          </div>
        </aside>

        <main className="main-content">
          <header className="topbar">
            <div>
            <span className="breadcrumb">
              MIHWAR / {pageInfo[activeSection][0]}
            </span>
              <h1>{pageInfo[activeSection][0]}</h1>
              <p className="subtitle">
                {pageInfo[activeSection][1]}
              </p>
            </div>

            <div className="profile">
              <span className="avatar">M</span>
              <span>
              <strong>Expo Visitor</strong>
              <small>Welcome to MIHWAR</small>
            </span>
            </div>
          </header>

          {activeSection === 'dashboard' && renderDashboard()}
          {activeSection === 'map' && renderMap()}

          {activeSection === 'identity' &&
              renderPlaceholder(
                  'Digital Identity',
                  'Your visitor identity and essential information.'
              )}

          {activeSection === 'passport' && renderPassport()}

          {activeSection === 'wallet' &&
              renderPlaceholder(
                  'Digital Wallet',
                  'Your wallet and payment services.'
              )}

          <footer className="page-footer">
            <span>© 2026 MIHWAR. All rights reserved.</span>
            <span>Your Expo, All in One.</span>
          </footer>
        </main>
      </div>
  )
}

export default App