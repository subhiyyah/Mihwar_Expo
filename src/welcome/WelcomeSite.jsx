import { useEffect, useRef, useState } from 'react'
import Brand from './Brand'
import FigmaAsset from './FigmaAsset'
import FeaturePreview from './FeaturePreview'
import api from '../api'
import { usePortal } from '../portal/state'
import './welcome.css'

const copy = {
  ar: { title: 'إكسبو 2030 يبدأ من محور', body: 'خريطة ذكية، وطلبات من مطاعم المعرض، وجواز إكسبو يسجّل وجهاتك. منصة واحدة للزوار والتجار والإدارة.', start: 'ابدأ التجربة', hint: 'اضغط للبدء، ثم مرّر للأسفل', choose: 'اختر تجربتك', last: 'الخطوة الأخيرة', chooseBody: 'اختر نوع حسابك لتنتقل مباشرة إلى صفحة الدخول.', visitor: 'الزائر', merchant: 'التاجر', visitorDesc: 'الخريطة وجواز إكسبو والطلبات', merchantDesc: 'الطلبات والمنيو والمحفظة', email: 'البريد الإلكتروني', password: 'كلمة المرور', login: 'دخول', visitorTitle: 'تسجيل الدخول', merchantTitle: 'دخول المؤسسة', subtitle: 'بالبريد الإلكتروني وكلمة المرور.', merchantSubtitle: 'بالبريد وكلمة المرور المسجّلين للمنشأة.', back: 'العودة لاختيار التجربة', submitting: 'جارٍ تسجيل الدخول…', failure: 'تعذّر تسجيل الدخول. تأكدي من تشغيل الباك إند وحاولي مرة أخرى.', success: 'تم تسجيل الدخول بنجاح.', preview: 'معاينة الواجهة السابقة', unsupported: 'استعادة كلمة المرور والدخول عبر Apple أو Google غير متاحة حاليًا.' },
  en: { title: 'Expo 2030 starts with Mihwar', body: 'A smart map, orders from Expo restaurants, and a digital passport recording your destinations. One platform for visitors, merchants, and administrators.', start: 'Start experience', hint: 'Start, then scroll down', choose: 'Choose your experience', last: 'The final step', chooseBody: 'Choose your account type to continue to sign in.', visitor: 'Visitor', merchant: 'Merchant', visitorDesc: 'Maps, Expo passport, and orders', merchantDesc: 'Orders, menus, and wallet', email: 'Email address', password: 'Password', login: 'Sign in', visitorTitle: 'Sign in', merchantTitle: 'Merchant sign in', subtitle: 'With your email address and password.', merchantSubtitle: 'Use the email and password registered for your business.', back: 'Back to account selection', submitting: 'Signing in…', failure: 'Unable to sign in. Check that the backend is running and try again.', success: 'Signed in successfully.', preview: 'Previous interface preview', unsupported: 'Password recovery and Apple or Google sign-in are currently unavailable.' }
}

function LogoStory({ english }) {
  const section = useRef(null)
  const [progress, setProgress] = useState(0)
  useEffect(() => {
    let request = 0
    const update = () => { cancelAnimationFrame(request); request = requestAnimationFrame(() => {
      if (!section.current) return
      const box = section.current.getBoundingClientRect()
      setProgress(Math.max(0, Math.min(1, -box.top / (box.height - innerHeight))))
    }) }
    update(); addEventListener('scroll', update, { passive: true }); addEventListener('resize', update)
    return () => { cancelAnimationFrame(request); removeEventListener('scroll', update); removeEventListener('resize', update) }
  }, [])
  const spread = Math.sin(progress * Math.PI)
  const step = Math.min(4, Math.floor(progress * 5))
  const titles = english ? ['Five rings around one axis', 'Your journey starts here', 'Services that stay with you', 'All of Expo, together', 'One connected experience'] : ['خمس حلقات حول محور واحد', 'رحلتك تبدأ من هنا', 'خدمات ترافقك', 'إكسبو كاملًا', 'تجربة واحدة متكاملة']
  const labels = english ? ['Seamless payments', 'Smart navigation', 'Digital identity', 'Healthcare', 'Continuous evolution'] : ['الدفع السلس', 'التنقل الذكي', 'الهوية الرقمية', 'الرعاية الصحية', 'التطور المستمر']
  return <section id="logo-story" className="logo-story" ref={section} aria-label={english ? 'Mihwar symbol' : 'رمز محور'}>
    <div className="logo-story-sticky">
      <ol className="story-rail">{labels.map((label, i) => <li key={label} className={i === step ? 'is-current' : ''}>{label}<span /></li>)}</ol>
      <div className="logo-art" aria-hidden="true" style={{ '--spread': spread }}>
        <div className="logo-layer layer-outer"><span className="outer-depth"><FigmaAsset src="/figma/logo-imgDepthWalls2.svg" /></span><span className="outer-faces"><FigmaAsset src="/figma/logo-imgFaces2.svg" /></span></div>
        <div className="logo-layer layer-middle"><span className="middle-depth"><FigmaAsset src="/figma/logo-imgDepthWalls1.svg" /></span><span className="middle-faces"><FigmaAsset src="/figma/logo-imgFaces1.svg" /></span></div>
        <div className="logo-layer layer-core"><span className="core-depth"><FigmaAsset src="/figma/logo-imgDepthWalls.svg" /></span><span className="core-faces"><FigmaAsset src="/figma/logo-imgFaces.svg" /></span></div>
      </div>
      <div className="story-caption"><p className="expo-eyebrow">{labels[step]}</p><h2>{titles[step]}</h2><p>{english ? 'Five connected pillars, with the visitor at their centre.' : 'خمس حلقات متكاملة، والزائر هو المحور الذي يجمعها.'}</p></div>
    </div>
  </section>
}

function Vision({ english }) {
  const pillars = english
    ? ['Seamless payments', 'Smart navigation', 'Digital identity', 'Healthcare', 'Continuous evolution']
    : ['الدفع السلس', 'التنقل الذكي', 'الهوية الرقمية', 'الرعاية الصحية', 'التطور المستمر']
  return <section className="expo-vision" aria-labelledby="vision-title">
    <p className="expo-eyebrow">{english ? 'OUR VISION' : 'رؤيتنا'}</p>
    <h2 id="vision-title">{english ? 'Five rings. One connected experience.' : 'خمس حلقات حول محور واحد'}</h2>
    <p className="vision-description">{english ? 'Mihwar brings payments, navigation, digital identity and healthcare together around the visitor, continuously evolving to make every visit easier and more connected.' : 'يرمز شعار «محور» إلى خمس حلقات تتكامل حول الزائر، تجمع الدفع والتنقل والهوية الرقمية والرعاية الصحية، وتستمر في التطور لتقديم تجربة أسهل وأكثر ترابطًا.'}</p>
    <ul className="vision-pillars">{pillars.map((pillar, index) => <li key={pillar}><span aria-hidden="true">{index + 1}</span>{pillar}</li>)}</ul>
  </section>
}

function Features() {
  const [healthShown, setHealthShown] = useState(false)
  const [passportOpen, setPassportOpen] = useState(false)
  const viewport = useRef(null)
  const [scale, setScale] = useState(1)
  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => setScale(Math.min(1, entry.contentRect.width / 1440)))
    observer.observe(viewport.current)
    return () => observer.disconnect()
  }, [])
  return <section ref={viewport} className="expo-features" style={{ '--card-scale': Math.min(1, (scale * 1440 - 40) / 433) }} aria-label="ميزات محور">
    <div className="features-desktop" style={{ height: 900 * scale }}><div className="features-canvas" style={{ transform: `scale(${scale})` }}>
      <FeaturePreview healthShown={healthShown} passportOpen={passportOpen} onHealthToggle={() => setHealthShown(v => !v)} onPassportToggle={() => setPassportOpen(v => !v)} />
    </div></div>
  </section>
}

export default function WelcomeSite({ onPreview, onVisitorLogin, onMerchantLogin }) {
  const { language, setLanguage } = usePortal()
  const [route, setRoute] = useState(() => location.hash === '#merchant-login' ? 'merchant' : location.hash === '#visitor-login' ? 'visitor' : 'landing')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(null)
  const [showBrand, setShowBrand] = useState(false)
  const isEnglish = language === 'en'
  const t = copy[language]
  useEffect(() => {
    const sync = () => { setRoute(location.hash === '#merchant-login' ? 'merchant' : location.hash === '#visitor-login' ? 'visitor' : 'landing'); setError(''); setSuccess(null) }
    addEventListener('hashchange', sync)
    return () => removeEventListener('hashchange', sync)
  }, [])
  useEffect(() => {
    document.documentElement.lang = language
    document.title = language === 'ar' ? 'محور | إكسبو 2030' : 'Mihwar | Expo 2030'
    document.documentElement.classList.add('expo-site-active')
    return () => { document.documentElement.classList.remove('expo-site-active') }
  }, [language])
  useEffect(() => {
    const update = () => setShowBrand(scrollY > innerHeight * .65)
    update(); addEventListener('scroll', update, { passive: true })
    return () => removeEventListener('scroll', update)
  }, [])
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      if (route === 'landing' && location.hash === '#choose') document.getElementById('choose')?.scrollIntoView()
      else if (route !== 'landing') scrollTo({ top: 0, behavior: 'instant' })
    })
    return () => cancelAnimationFrame(frame)
  }, [route])
  const isLogin = route !== 'landing'
  const goChoose = () => { location.hash = 'choose' }
  async function submit(event) {
    event.preventDefault(); setError(''); setSuccess(null); setBusy(true)
    const form = new FormData(event.currentTarget)
    try {
      const { data } = await api.post(`/auth/login/${route === 'merchant' ? 'restaurant' : 'user'}`, { email: String(form.get('email')).trim(), password: form.get('password') })
      if (!Number.isInteger(data.id) || data.id <= 0) throw new Error('Invalid account response')
      setSuccess(data)
      if (route === 'merchant') onMerchantLogin(data)
      else onVisitorLogin(data)
    } catch (err) { setError(err.response?.data?.message || t.failure) }
    finally { setBusy(false) }
  }
  return <div className={`expo-site ${isLogin ? 'expo-light' : ''}`} dir={isEnglish ? 'ltr' : 'rtl'}>
    <header className={`expo-header ${isLogin ? 'expo-public-header' : ''}`}>
      <nav aria-label={isEnglish ? 'Main navigation' : 'التنقل الرئيسي'}>
        <button type="button" className="expo-language" onClick={() => setLanguage(isEnglish ? 'ar' : 'en')}>{isEnglish ? 'العربية' : 'English'}</button>
        <a href={isLogin ? (route === 'merchant' ? '#visitor-login' : '#merchant-login') : '#choose'}>{isLogin ? (route === 'merchant' ? t.visitor : t.merchant) : t.choose}</a>
      </nav>
      <a href="#home" className={isLogin ? 'header-brand' : `header-brand landing-header-brand ${showBrand ? '' : 'brand-hidden'}`} aria-label={isEnglish ? 'Home' : 'الرئيسية'}><Brand light={isLogin} />{isLogin && route === 'merchant' && <span className="merchant-heading">{isEnglish ? 'Merchant portal' : 'بوابة التاجر'}</span>}</a>
    </header>
    {!isLogin ? <>
      <section id="home" className="expo-welcome">
        <div className="welcome-atmos" aria-hidden="true"><span className="glow-one" /><span className="glow-two" /><span className="welcome-orbits"><FigmaAsset src="/figma/welcome-imgOrbitRings.svg" /></span></div>
        <div className="expo-welcome-content"><Brand large /><p className="expo-eyebrow">{isEnglish ? 'EXPO 2030 · RIYADH' : 'إكسبو 2030 · الرياض'}</p><h1>{t.title}</h1><p className="welcome-body">{t.body}</p>
          <a className="expo-start" href="#logo-story"><span>{t.start}</span><span className="start-arrow"><FigmaAsset src="/figma/welcome-imgIconArrowDown.svg" /></span></a><p className="welcome-hint">{t.hint}</p>
        </div>
      </section>
      <LogoStory english={isEnglish} /><Vision english={isEnglish} /><Features />
      <section id="choose" className="expo-choose"><p className="expo-eyebrow">{t.last}</p><h2>{t.choose}</h2><p className="choose-body">{t.chooseBody}</p>
        <div className="role-cards" dir="ltr">{['visitor','merchant'].map(role => <a href={`#${role}-login`} className="role-card" key={role} dir={isEnglish ? 'ltr' : 'rtl'}><span className="role-icon"><FigmaAsset src={`/figma/choose-${role === 'merchant' ? 'imgIcon' : 'imgIcon2'}.svg`} /></span><span className="role-arrow"><FigmaAsset src="/figma/choose-imgIcon1.svg" /></span><h3>{t[role]}</h3><span className="role-alt">{role === 'visitor' ? 'Visitor' : 'Merchant'}</span><p>{t[role+'Desc']}</p></a>)}</div>
        <button className="existing-preview" type="button" onClick={onPreview}>{t.preview}</button>
      </section>
    </> : <main className="login-body"><form className={`expo-login-card ${route === 'merchant' ? 'merchant-login-card' : ''}`} onSubmit={submit}>
      <h1>{route === 'merchant' ? t.merchantTitle : t.visitorTitle}</h1><p>{route === 'merchant' ? t.merchantSubtitle : t.subtitle}</p>
      <label htmlFor="login-email">{t.email}<input id="login-email" name="email" type="email" autoComplete="username" dir="ltr" required maxLength={150} disabled={busy} /></label>
      <label htmlFor="login-password">{t.password}<input id="login-password" name="password" type="password" autoComplete="current-password" required disabled={busy} /></label>
      <button className="expo-login-submit" disabled={busy || !!success}>{busy ? t.submitting : t.login}</button>
      {error && <p className="expo-error" role="alert">{error}</p>}
      {success && <div className="expo-success" role="status"><p>{t.success}</p>{route === 'visitor' && <button type="button" onClick={() => onVisitorLogin(success)}>{t.preview}</button>}</div>}
      <p className="login-note"><a href={route === 'merchant' ? '#merchant-register' : '#visitor-register'}>{isEnglish ? 'Create account' : 'إنشاء حساب جديد'}</a> · <a href="#admin-login">{isEnglish ? 'Admin' : 'دخول الإدارة'}</a></p><p className="login-note">{t.unsupported}</p><button type="button" className="login-back" onClick={goChoose}>{t.back}</button>
    </form></main>}
  </div>
}

