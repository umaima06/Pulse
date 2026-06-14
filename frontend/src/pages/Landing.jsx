import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import LanguageSwitcher from '../components/LanguageSwitcher'
import { apiUrl } from '../config/api'
import VoiceAgent from '../components/VoiceAgent'

/* ── Glow blob ── */
const Glow = ({ color, x='50%', y='40%', w=600, h=350 }) => (
  <div aria-hidden style={{
    position:'absolute', left:x, top:y, transform:'translate(-50%,-50%)',
    width:w, height:h, borderRadius:'50%',
    background:`radial-gradient(ellipse, ${color} 0%, transparent 70%)`,
    pointerEvents:'none', zIndex:0
  }}/>
)

/* ── Firefly ── */
const Firefly = ({ style }) => (
  <motion.div aria-hidden
    style={{ position:'absolute', width:5, height:5, borderRadius:'50%',
      background:'#6ee7b7', boxShadow:'0 0 10px 3px #6ee7b766', ...style, zIndex:1 }}
    animate={{ y:[0,-40,0], opacity:[0,0.85,0], x:[0,10,-6,0] }}
    transition={{ duration:6+Math.random()*5, repeat:Infinity, ease:'easeInOut', delay:Math.random()*5 }}
  />
)

export default function Landing() {
  const [people,setPeople]         = useState(0)
  const [volunteers,setVolunteers] = useState(0)
  const [resolved,setResolved]     = useState(0)
  const [events,setEvents]         = useState([])
  const [activeStep,setActiveStep] = useState(0)
  const [videoErr,setVideoErr]     = useState(false)
  const { t } = useTranslation()

  useEffect(()=>{
    let p=0,v=0,r=0
    const id=setInterval(()=>{
      p+=Math.floor(Math.random()*50); v+=Math.floor(Math.random()*3); r+=Math.floor(Math.random()*2)
      setPeople(p); setVolunteers(v); setResolved(r)
    },1500); return ()=>clearInterval(id)
  },[])

  useEffect(()=>{
    const msgs=['Flood alert · Hyderabad','Food request · Mumbai','Medical emergency · Delhi','Volunteer dispatched · Bangalore','Crisis cluster · Chennai']
    const id=setInterval(()=>setEvents(p=>[msgs[Math.floor(Math.random()*msgs.length)],...p.slice(0,4)]),2500)
    return ()=>clearInterval(id)
  },[])

  useEffect(()=>{
    const id=setInterval(()=>setActiveStep(s=>(s+1)%4),3000)
    return ()=>clearInterval(id)
  },[])

  const flies = Array.from({length:12},(_,i)=>({ left:`${5+(i*7.3)%88}%`, top:`${8+(i*11.7)%80}%` }))

  const steps=[
    {step:'01',titleKey:'step1_title',descKey:'step1_desc',icon:'📱',accent:'#059669'},
    {step:'02',titleKey:'step2_title',descKey:'step2_desc',icon:'🤖',accent:'#7c3aed'},
    {step:'03',titleKey:'step3_title',descKey:'step3_desc',icon:'📍',accent:'#d97706'},
    {step:'04',titleKey:'step4_title',descKey:'step4_desc',icon:'🚀',accent:'#059669'},
  ]

  /* ── shared section style ── */
  const sec = (bg, pt=80) => ({
    minHeight:'100vh', display:'flex', flexDirection:'column',
    justifyContent:'center', position:'relative', overflow:'hidden', background:bg,
    padding:`${pt}px 0`
  })

  return (
    <div style={{ fontFamily:"'Inter',sans-serif", color:'#1a1a1a' }}>

      {/* ── NAVBAR ── */}
      <nav style={{
        position:'fixed', top:0, left:0, right:0, zIndex:100,
        padding:'12px 32px', display:'flex', flexDirection:'column',
        background:'#96A78D', backdropFilter:'blur(16px)',
        borderBottom:'1px solid rgba(0,0,0,0.08)'
      }}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <span style={{fontWeight:900,fontSize:'1.3rem',letterSpacing:'-0.04em',color:'#fff'}}>⚡ {t('brand')}</span>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <Link to="/get-started" style={{color:'rgba(255,255,255,0.85)',fontSize:'0.875rem',padding:'6px 14px',textDecoration:'none',fontWeight:500}}>{t('nav_login')}</Link>
            <Link to="/get-started" style={{background:'rgba(0,0,0,0.18)',color:'#fff',fontWeight:700,fontSize:'0.875rem',padding:'9px 20px',borderRadius:10,border:'1px solid rgba(255,255,255,0.25)',textDecoration:'none'}}>
              {t('nav_get_started')}
            </Link>
          </div>
        </div>
        <div style={{marginTop:8,display:'flex',justifyContent:'center'}}><LanguageSwitcher/></div>
      </nav>

      {/* ══════════════════════════════════
          SECTION 1 — HERO
          bg: dark forest (video behind it)
      ══════════════════════════════════ */}
      <section style={{...sec('#0d1f17', 0), paddingTop:90, color:'#fff'}}>
        {!videoErr ? (
          <video autoPlay muted loop playsInline onError={()=>setVideoErr(true)}
            style={{position:'absolute',inset:0,width:'100%',height:'100%',
              objectFit:'cover',filter:'brightness(0.28) saturate(1.3)',zIndex:0}}>
            <source src="/pulse-hero.mp4" type="video/mp4"/>
          </video>
        ):(
          <div style={{position:'absolute',inset:0,zIndex:0,
            background:'radial-gradient(ellipse 100% 70% at 50% 30%, #0d3326 0%, #060e09 100%)'}}/>
        )}
        <Glow color="rgba(110,231,183,0.12)" x="50%" y="38%" w={800} h={450}/>
        <div style={{position:'absolute',inset:0,zIndex:1,pointerEvents:'none',overflow:'hidden'}}>
          {flies.map((p,i)=><Firefly key={i} style={p}/>)}
        </div>

        <div style={{position:'relative',zIndex:2,maxWidth:860,margin:'0 auto',padding:'70px 32px 60px',textAlign:'center'}}>
          <motion.div initial={{opacity:0,y:-10}} animate={{opacity:1,y:0}} transition={{duration:0.6}}
            style={{display:'inline-flex',alignItems:'center',gap:8,marginBottom:24,
              padding:'6px 18px',borderRadius:999,
              background:'rgba(239,68,68,0.18)',border:'1px solid rgba(239,68,68,0.4)',
              color:'#fca5a5',fontSize:'0.72rem',fontWeight:700,letterSpacing:'0.06em'}}>
            <span style={{width:7,height:7,borderRadius:'50%',background:'#f87171',
              display:'inline-block',animation:'pulse 2s infinite'}}/>
            {t('hero_badge')}
          </motion.div>

          <motion.h1 initial={{opacity:0,y:28}} animate={{opacity:1,y:0}} transition={{duration:0.7,delay:0.15}}
            style={{fontSize:'clamp(2.8rem,7vw,5.2rem)',fontWeight:900,lineHeight:1.06,
              letterSpacing:'-0.04em',margin:'0 0 22px',color:'#fff'}}>
            {t('hero_title1')}<br/>
            <span style={{background:'linear-gradient(90deg,#6ee7b7,#34d399,#a7f3d0)',
              WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>
              {t('hero_title2')}
            </span>
          </motion.h1>

          <motion.p initial={{opacity:0}} animate={{opacity:1}} transition={{delay:0.35}}
            style={{color:'rgba(255,255,255,0.65)',fontSize:'1.1rem',lineHeight:1.75,
              maxWidth:560,margin:'0 auto 40px'}}>
            {t('hero_desc')}
          </motion.p>
{/* IVR callout */}
<div style={{display:'flex',alignItems:'center',gap:12,margin:'20px auto 0',
  padding:'12px 20px',borderRadius:14,
  background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.12)',
  maxWidth:340}}>
  <span style={{fontSize:'1.4rem'}}>📞</span>
  <div style={{textAlign:'left'}}>
    <p style={{color:'rgba(255,255,255,0.85)',fontSize:'0.8rem',fontWeight:600,margin:0}}>
      Field workers — call from any phone
    </p>
    <p style={{color:'#6ee7b7',fontFamily:'monospace',fontSize:'0.85rem',
      fontWeight:700,margin:'2px 0 0'}}>+12603466138</p>
    <p style={{color:'rgba(255,255,255,0.35)',fontSize:'0.68rem',margin:'2px 0 0'}}>
      Hindi · Telugu · Tamil · English
    </p>
  </div>
</div>

{/* Divider */}
<div style={{display:'flex',alignItems:'center',gap:10,margin:'16px auto 0',maxWidth:320}}>
  <div style={{flex:1,height:1,background:'rgba(255,255,255,0.1)'}}/> 
  <span style={{color:'rgba(255,255,255,0.3)',fontSize:'0.68rem'}}>or demo via browser</span>
  <div style={{flex:1,height:1,background:'rgba(255,255,255,0.1)'}}/>
</div>

{/* Voice Agent */}
<div style={{marginTop:8,display:'flex',justifyContent:'center'}}>
  <VoiceAgent />
</div>
          <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:0.5}}
            style={{display:'flex',gap:12,flexWrap:'wrap',justifyContent:'center'}}>
            <Link to="/get-started"
              style={{height:52,background:'#059669',color:'#fff',fontWeight:700,
                padding:'0 32px',borderRadius:14,display:'flex',alignItems:'center',
                textDecoration:'none',fontSize:'1rem',
                boxShadow:'0 0 32px rgba(5,150,105,0.45)'}}>
              {t('nav_get_started')}
            </Link>
            <button onClick={()=>document.getElementById('problem')?.scrollIntoView({behavior:'smooth'})}
              style={{height:52,border:'1px solid rgba(255,255,255,0.18)',
                background:'rgba(255,255,255,0.06)',color:'rgba(255,255,255,0.8)',
                padding:'0 32px',borderRadius:14,cursor:'pointer',fontSize:'1rem',fontWeight:500}}>
              {t('how_btn')}
            </button>
          </motion.div>
        </div>

        <motion.div animate={{y:[0,10,0]}} transition={{repeat:Infinity,duration:2.5}}
          style={{position:'absolute',bottom:28,left:'50%',transform:'translateX(-50%)',
            zIndex:2,display:'flex',flexDirection:'column',alignItems:'center',gap:4,cursor:'pointer'}}
          onClick={()=>document.getElementById('problem')?.scrollIntoView({behavior:'smooth'})}>
          <span style={{color:'rgba(255,255,255,0.25)',fontSize:'0.65rem',letterSpacing:'0.12em'}}>SCROLL</span>
          <div style={{width:1,height:36,background:'linear-gradient(to bottom,#6ee7b7,transparent)'}}/>
        </motion.div>
      </section>

      {/* ══════════════════════════════════
          SECTION 2 — PROBLEM
          bg: warm cream / beige
      ══════════════════════════════════ */}
      <section id="problem" style={sec('#faf8f4')}>
        <Glow color="rgba(239,68,68,0.06)" x="50%" y="35%" w={700} h={380}/>
        <div style={{position:'relative',zIndex:1,maxWidth:860,margin:'0 auto',padding:'0 32px',textAlign:'center'}}>
          <motion.p initial={{opacity:0}} whileInView={{opacity:1}} viewport={{once:true}}
            style={{color:'#dc2626',fontWeight:700,fontSize:'0.72rem',letterSpacing:'0.2em',
              textTransform:'uppercase',marginBottom:16}}>The Crisis</motion.p>

          <motion.h2 initial={{opacity:0,y:24}} whileInView={{opacity:1,y:0}} viewport={{once:true}}
            style={{fontSize:'clamp(2rem,5vw,3.6rem)',fontWeight:900,letterSpacing:'-0.03em',
              lineHeight:1.1,marginBottom:20,color:'#111'}}>
            {t('problem_title1')}
            <span style={{color:'#dc2626'}}> {t('problem_title2')}</span>
          </motion.h2>

          <motion.p initial={{opacity:0}} whileInView={{opacity:1}} viewport={{once:true}} transition={{delay:0.1}}
            style={{color:'#6b7280',fontSize:'1.05rem',lineHeight:1.8,maxWidth:580,margin:'0 auto 48px'}}>
            {t('problem_desc')}
          </motion.p>

          <div style={{display:'flex',flexWrap:'wrap',gap:14,justifyContent:'center',marginBottom:56}}>
            {[
              {n:'4–6h',  l:'manual dispatch time'},
              {n:'78%',   l:'communicate in regional languages'},
              {n:'40%',   l:'volunteer hours wasted'},
              {n:'3.3M',  l:'NGOs with no coordination software'},
            ].map((s,i)=>(
              <motion.div key={i} initial={{opacity:0,scale:0.88}} whileInView={{opacity:1,scale:1}}
                viewport={{once:true}} transition={{delay:i*0.07}}
                style={{border:'1px solid rgba(220,38,38,0.2)',borderRadius:14,
                  background:'#fff',padding:'14px 24px',textAlign:'center',
                  boxShadow:'0 2px 12px rgba(0,0,0,0.06)'}}>
                <p style={{color:'#dc2626',fontWeight:900,fontSize:'1.6rem',lineHeight:1}}>{s.n}</p>
                <p style={{color:'#9ca3af',fontSize:'0.7rem',marginTop:4}}>{s.l}</p>
              </motion.div>
            ))}
          </div>

          <motion.div initial={{opacity:0,y:20}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{delay:0.25}}>
            <p style={{color:'#9ca3af',fontSize:'0.9rem',marginBottom:10}}>{t('built_sub')}</p>
            <p style={{fontSize:'clamp(1.8rem,4vw,2.8rem)',fontWeight:900,letterSpacing:'-0.03em',color:'#111'}}>
              {t('built_title')}&nbsp;
              <span style={{color:'#059669'}}>{t('brand')}</span>
            </p>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════
          SECTION 3 — LIVE IMPACT
          bg: soft white-green
      ══════════════════════════════════ */}
      <section style={sec('#f0faf5')}>
        <Glow color="rgba(5,150,105,0.07)" x="50%" y="40%" w={650} h={350}/>
        <div style={{position:'relative',zIndex:1,maxWidth:860,margin:'0 auto',padding:'0 32px'}}>
          <motion.p initial={{opacity:0}} whileInView={{opacity:1}} viewport={{once:true}}
            style={{color:'#059669',fontWeight:700,fontSize:'0.72rem',letterSpacing:'0.2em',
              textTransform:'uppercase',marginBottom:12,textAlign:'center'}}>Right Now</motion.p>
          <motion.h2 initial={{opacity:0,y:20}} whileInView={{opacity:1,y:0}} viewport={{once:true}}
            style={{fontSize:'clamp(1.8rem,4vw,3rem)',fontWeight:900,letterSpacing:'-0.03em',
              marginBottom:40,textAlign:'center',color:'#111'}}>
            {t('live_impact')}
          </motion.h2>

          {/* big counter card */}
          <motion.div initial={{opacity:0,y:24}} whileInView={{opacity:1,y:0}} viewport={{once:true}}
            style={{border:'1px solid rgba(5,150,105,0.18)',borderRadius:24,
              background:'#fff',padding:'36px 40px',marginBottom:18,
              boxShadow:'0 4px 32px rgba(5,150,105,0.08)'}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:8,marginBottom:32}}>
              <span style={{width:8,height:8,borderRadius:'50%',background:'#059669',
                animation:'pulse 2s infinite',display:'inline-block'}}/>
              <p style={{color:'#9ca3af',fontSize:'0.8rem',fontWeight:500}}>Live · updating every 1.5s</p>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:24,textAlign:'center'}}>
              {[{val:people.toLocaleString(),label:t('people_reached'),c:'#059669'},
                {val:volunteers,label:t('volunteers_deployed'),c:'#047857'},
                {val:resolved,label:t('crises_resolved'),c:'#0284c7'}
              ].map((x,i)=>(
                <div key={i}>
                  <p style={{fontSize:'3.4rem',fontWeight:900,color:x.c,lineHeight:1}}>{x.val}</p>
                  <p style={{color:'#9ca3af',fontSize:'0.8rem',marginTop:6}}>{x.label}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* 3 stat cards */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))',gap:14,marginBottom:18}}>
            {[{v:'30s',l:t('stat1_label'),c:'#059669'},{v:'100%',l:t('stat2_label'),c:'#d97706'},{v:'0',l:t('stat3_label'),c:'#0284c7'}].map((s,i)=>(
              <motion.div key={i} initial={{opacity:0,y:16}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{delay:i*0.1}}
                style={{border:'1px solid rgba(0,0,0,0.07)',borderRadius:18,
                  background:'#fff',padding:'26px 16px',textAlign:'center',
                  boxShadow:'0 2px 16px rgba(0,0,0,0.05)'}}>
                <p style={{fontSize:'2.8rem',fontWeight:900,color:s.c,lineHeight:1}}>{s.v}</p>
                <p style={{color:'#9ca3af',fontSize:'0.78rem',marginTop:6}}>{s.l}</p>
              </motion.div>
            ))}
          </div>

          {/* live feed */}
          <motion.div initial={{opacity:0}} whileInView={{opacity:1}} viewport={{once:true}} transition={{delay:0.2}}
            style={{border:'1px solid rgba(0,0,0,0.07)',borderRadius:18,
              background:'#fff',padding:'22px 28px',boxShadow:'0 2px 16px rgba(0,0,0,0.04)'}}>
            <p style={{color:'#9ca3af',fontSize:'0.7rem',fontWeight:700,letterSpacing:'0.15em',
              textTransform:'uppercase',marginBottom:14}}>Live Feed</p>
            <AnimatePresence>
              {events.map((e,i)=>(
                <motion.div key={e+i} initial={{opacity:0,x:-14}} animate={{opacity:1,x:0}} exit={{opacity:0}}
                  style={{display:'flex',alignItems:'center',gap:10,padding:'9px 0',
                    borderBottom:i<events.length-1?'1px solid #f3f4f6':'none'}}>
                  <span style={{width:6,height:6,borderRadius:'50%',background:'#059669',flexShrink:0}}/>
                  <p style={{color:'#374151',fontSize:'0.875rem',margin:0}}>{e}</p>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════
          SECTION 4 — HOW IT WORKS
          bg: light warm grey
      ══════════════════════════════════ */}
      <section id="how" style={sec('#f7f5f2')}>
        <Glow color="rgba(124,58,237,0.05)" x="60%" y="30%" w={500} h={300}/>
        <div style={{position:'relative',zIndex:1,maxWidth:800,margin:'0 auto',padding:'0 32px'}}>
          <motion.p initial={{opacity:0}} whileInView={{opacity:1}} viewport={{once:true}}
            style={{color:'#7c3aed',fontWeight:700,fontSize:'0.72rem',letterSpacing:'0.2em',
              textTransform:'uppercase',marginBottom:12,textAlign:'center'}}>The Pipeline</motion.p>
          <motion.h2 initial={{opacity:0,y:20}} whileInView={{opacity:1,y:0}} viewport={{once:true}}
            style={{fontSize:'clamp(1.8rem,4vw,3rem)',fontWeight:900,letterSpacing:'-0.03em',
              marginBottom:8,textAlign:'center',color:'#111'}}>
            {t('how_title')}
          </motion.h2>
          <motion.p initial={{opacity:0}} whileInView={{opacity:1}} viewport={{once:true}}
            style={{color:'#9ca3af',textAlign:'center',marginBottom:36}}>{t('how_sub')}</motion.p>

          <div style={{display:'flex',flexDirection:'column',gap:10}}>
            {steps.map((item,i)=>(
              <motion.div key={item.step}
                initial={{opacity:0,x:-20}} whileInView={{opacity:1,x:0}} viewport={{once:true}} transition={{delay:i*0.08}}
                onClick={()=>setActiveStep(i)}
                style={{
                  border:`1.5px solid ${activeStep===i ? item.accent : 'rgba(0,0,0,0.08)'}`,
                  borderRadius:16,
                  background: activeStep===i ? '#fff' : 'rgba(255,255,255,0.6)',
                  padding:'18px 22px',cursor:'pointer',
                  transition:'all 0.3s ease',
                  boxShadow: activeStep===i ? `0 4px 24px ${item.accent}22` : '0 1px 6px rgba(0,0,0,0.04)',
                  display:'flex',alignItems:'flex-start',gap:18
                }}>
                <span style={{fontSize:'1.7rem',flexShrink:0,marginTop:2}}>{item.icon}</span>
                <div style={{flex:1,minWidth:0}}>
                  <p style={{fontWeight:700,margin:0,
                    color: activeStep===i ? item.accent : '#111'}}>{t(item.titleKey)}</p>
                  <AnimatePresence>
                    {activeStep===i&&(
                      <motion.p initial={{opacity:0,height:0}} animate={{opacity:1,height:'auto'}} exit={{opacity:0,height:0}}
                        style={{color:'#6b7280',fontSize:'0.875rem',margin:'6px 0 0',lineHeight:1.65}}>
                        {t(item.descKey)}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>
                <span style={{fontWeight:900,fontSize:'1.3rem',color:item.accent,opacity:0.3,flexShrink:0}}>{item.step}</span>
              </motion.div>
            ))}
          </div>

          <div style={{display:'flex',justifyContent:'center',gap:8,marginTop:24}}>
            {steps.map((_,i)=>(
              <button key={i} onClick={()=>setActiveStep(i)} style={{
                width:activeStep===i?28:8, height:8, borderRadius:999,
                background:activeStep===i?'#059669':'rgba(0,0,0,0.15)',
                border:'none',cursor:'pointer',transition:'all 0.3s ease'
              }}/>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════
          SECTION 5 — WHY PULSE
          bg: white
      ══════════════════════════════════ */}
      <section style={sec('#ffffff')}>
        <Glow color="rgba(5,150,105,0.05)" x="30%" y="50%" w={500} h={350}/>
        <div style={{position:'relative',zIndex:1,maxWidth:1000,margin:'0 auto',padding:'0 32px'}}>
          <motion.p initial={{opacity:0}} whileInView={{opacity:1}} viewport={{once:true}}
            style={{color:'#d97706',fontWeight:700,fontSize:'0.72rem',letterSpacing:'0.2em',
              textTransform:'uppercase',marginBottom:12,textAlign:'center'}}>Why It Works</motion.p>
          <motion.h2 initial={{opacity:0,y:20}} whileInView={{opacity:1,y:0}} viewport={{once:true}}
            style={{fontSize:'clamp(1.8rem,4vw,3rem)',fontWeight:900,letterSpacing:'-0.03em',
              marginBottom:48,textAlign:'center',color:'#111'}}>
            {t('why_title')}
          </motion.h2>

          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))',gap:20}}>
            {[
              {titleKey:'why1_title',descKey:'why1_desc',icon:'🧠',accent:'#059669',border:'rgba(5,150,105,0.18)'},
              {titleKey:'why2_title',descKey:'why2_desc',icon:'🗣️',accent:'#d97706',border:'rgba(217,119,6,0.18)'},
              {titleKey:'why3_title',descKey:'why3_desc',icon:'⚡',accent:'#0284c7',border:'rgba(2,132,199,0.18)'},
            ].map((item,i)=>(
              <motion.div key={i}
                initial={{opacity:0,y:24}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{delay:i*0.1}}
                whileHover={{y:-5,boxShadow:`0 8px 32px ${item.accent}18`}}
                style={{border:`1px solid ${item.border}`,borderRadius:22,
                  background:'#fff',padding:'32px 28px',cursor:'pointer',
                  boxShadow:'0 2px 16px rgba(0,0,0,0.05)',transition:'all 0.35s ease'}}>
                <span style={{fontSize:'2.2rem',display:'block',marginBottom:16}}>{item.icon}</span>
                <p style={{fontWeight:700,color:'#111',marginBottom:10,fontSize:'1rem'}}>{t(item.titleKey)}</p>
                <p style={{color:'#6b7280',fontSize:'0.875rem',lineHeight:1.7,margin:0}}>{t(item.descKey)}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════
          SECTION 6 — CTA + FOOTER
          bg: deep emerald (dark but intentional)
      ══════════════════════════════════ */}
      <section style={{...sec('#052e1c'), color:'#fff'}}>
        <Glow color="rgba(110,231,183,0.12)" x="50%" y="40%" w={700} h={400}/>
        <div style={{position:'relative',zIndex:1,maxWidth:800,margin:'0 auto',
          padding:'0 32px 40px',textAlign:'center'}}>
          <motion.p initial={{opacity:0}} whileInView={{opacity:1}} viewport={{once:true}}
            style={{color:'#6ee7b7',fontWeight:700,fontSize:'0.72rem',letterSpacing:'0.2em',
              textTransform:'uppercase',marginBottom:12}}>Join the Mission</motion.p>
          <motion.h2 initial={{opacity:0,y:24}} whileInView={{opacity:1,y:0}} viewport={{once:true}}
            style={{fontSize:'clamp(2rem,5vw,3.4rem)',fontWeight:900,letterSpacing:'-0.03em',
              lineHeight:1.1,marginBottom:16,color:'#fff'}}>
            {t('cta_title')}
          </motion.h2>
          <motion.p initial={{opacity:0}} whileInView={{opacity:1}} viewport={{once:true}} transition={{delay:0.12}}
            style={{color:'rgba(255,255,255,0.6)',fontSize:'1.05rem',maxWidth:520,
              margin:'0 auto 40px',lineHeight:1.75}}>
            {t('cta_sub')}
          </motion.p>

          <motion.div initial={{opacity:0,y:16}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{delay:0.22}}
            style={{display:'flex',gap:14,justifyContent:'center',flexWrap:'wrap',marginBottom:40}}>
            <Link to="/get-started"
              style={{background:'#6ee7b7',color:'#052e1c',fontWeight:800,
                padding:'15px 38px',borderRadius:14,textDecoration:'none',fontSize:'1rem'}}>
              {t('cta_btn1')}
            </Link>
            <Link to="/get-started"
              style={{border:'1px solid rgba(255,255,255,0.2)',background:'rgba(255,255,255,0.06)',
                color:'rgba(255,255,255,0.8)',padding:'15px 38px',borderRadius:14,
                textDecoration:'none',fontSize:'1rem'}}>
              {t('cta_btn2')}
            </Link>
          </motion.div>

          <motion.div initial={{opacity:0}} whileInView={{opacity:1}} viewport={{once:true}} transition={{delay:0.32}}
            style={{display:'flex',flexWrap:'wrap',justifyContent:'center',gap:10,marginBottom:56}}>
            {['SDG 11.5 · Disaster Response','SDG 1.5 · Climate Resilience','SDG 3.8 · Healthcare Access'].map((b,i)=>(
              <span key={i} style={{fontSize:'0.68rem',fontWeight:700,letterSpacing:'0.05em',
                padding:'5px 14px',borderRadius:999,
                border:'1px solid rgba(110,231,183,0.3)',color:'#6ee7b7',
                background:'rgba(110,231,183,0.08)'}}>
                {b}
              </span>
            ))}
          </motion.div>

          <div style={{borderTop:'1px solid rgba(255,255,255,0.08)',paddingTop:24}}>
            <p style={{color:'rgba(255,255,255,0.25)',fontSize:'0.82rem'}}>{t('footer')}</p>
          </div>
        </div>
      </section>

    </div>
  )
}