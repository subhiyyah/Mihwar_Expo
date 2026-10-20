import FigmaAsset from './FigmaAsset'

export default function Brand({ light = false, large = false }) {
  const prefix = light ? 'visitor-login' : 'welcome'
  return <span className={`expo-brand ${large ? 'expo-brand-large' : ''}`} role="img" aria-label="محور — mihwar">
    <span className="brand-word"><FigmaAsset src={`/figma/${prefix}-imgMihwarWordmark.svg`} /></span>
    <span className="brand-latin"><FigmaAsset src={`/figma/${prefix}-imgMihwarLatin.svg`} /></span>
    <span className="brand-symbol"><FigmaAsset src={`/figma/${prefix}-imgMihwarSymbol.svg`} /></span>
  </span>
}
