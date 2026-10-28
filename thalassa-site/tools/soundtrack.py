import numpy as np, wave
SR=48000; DUR=60.75; N=int(SR*DUR); B=0.75
rng=np.random.default_rng(3)
t=np.arange(N)/SR
L=np.zeros(N); R=np.zeros(N)
def fft_filter(x, lo=None, hi=None):
    X=np.fft.rfft(x); f=np.fft.rfftfreq(len(x),1/SR); g=np.ones_like(f)
    if lo: g*=1/(1+(lo/np.maximum(f,1))**4)
    if hi: g*=1/(1+(f/hi)**4)
    return np.fft.irfft(X*g,len(x))
def add(sig, at, pan=0.0, gain=1.0):
    i=int(at*SR); 
    if i>=N: return
    s=sig[:N-i]*gain
    L[i:i+len(s)]+=s*np.sqrt(0.5*(1-pan)); R[i:i+len(s)]+=s*np.sqrt(0.5*(1+pan))
def env(n, a, d):
    e=np.ones(n); ai=int(a*SR); di=int(d*SR)
    if ai: e[:ai]=np.linspace(0,1,ai)
    if di: e[-di:]*=np.linspace(1,0,di)
    return e
def hz(m): return 440*2**((m-69)/12)
# ---- surf (brown noise, slow swells)
def brown(n):
    X=np.fft.rfft(rng.standard_normal(n)); f=np.fft.rfftfreq(n,1/SR); X/=np.maximum(f,20)**0.95
    X*=1/(1+(f/900)**2); y=np.fft.irfft(X,n); return y/np.abs(y).max()
surfL=brown(N); surfR=brown(N)
sw=0.55+0.45*np.sin(2*np.pi*0.085*t-1.2)
surf_level=0.16*np.interp(t,[0,1.5,13,17,58,60.75],[0,1,1,0.55,0.55,0.0])
L+=surfL*sw*surf_level; R+=surfR*np.roll(sw,SR)*surf_level
# ---- music bus
mus=np.zeros((2,N))
chords=[[57,64,68,71,76],[54,61,64,69,73],[50,57,61,66,69],[52,59,64,66,71]]  # Amaj9, F#m9, Dmaj9, Esus
roots=[45,42,38,40]
def pad_note(f, dur):
    n=int(dur*SR); tt=np.arange(n)/SR
    s=sum(a*np.sin(2*np.pi*f*k*tt+rng.random()*6) for k,a in [(1,1),(2,.35),(3,.12),(4,.05)])
    s+= .6*np.sin(2*np.pi*f*1.003*tt)
    return s*env(n,1.4,1.6)*(0.85+0.15*np.sin(2*np.pi*0.2*tt))
for bar in range(0,81,8):
    ch=chords[(bar//8)%4]; st=bar*B; d=8*B+1.2
    for i,m in enumerate(ch):
        s=pad_note(hz(m),d)*0.022
        i0=int(st*SR); s=s[:max(0,N-i0)]; p=[-.35,.35,-.2,.2,0][i]
        mus[0,i0:i0+len(s)]+=s*np.sqrt(1-p)*.7; mus[1,i0:i0+len(s)]+=s*np.sqrt(1+p)*.7
# plucks (kalimba-like) from beat 17, arpeggio 8ths
def pluck(f, dur=1.6):
    n=int(dur*SR); tt=np.arange(n)/SR
    s=np.sin(2*np.pi*f*tt)*np.exp(-tt*3.2)+0.3*np.sin(2*np.pi*f*2.01*tt)*np.exp(-tt*6)+0.08*np.sin(2*np.pi*f*4.2*tt)*np.exp(-tt*14)
    s[:60]*=np.linspace(0,1,60); return s
pat=[0,2,4,3,1,3,4,2]
for eighth in range(17*2, 78*2):
    bt=eighth/2; ch=chords[(int(bt)//8)%4]
    if 29<=bt<31 or 68<=bt<71: continue
    m=ch[pat[eighth%8]]+12; v=0.05*(1.0 if eighth%2==0 else 0.65)*np.interp(bt,[17,19,74,78],[0,1,1,0.4])
    s=pluck(hz(m)); i0=int(bt*B*SR); s=s[:max(0,N-i0)]*v; pn=np.sin(eighth*1.7)*0.5
    mus[0,i0:i0+len(s)]+=s*np.sqrt(1-pn); mus[1,i0:i0+len(s)]+=s*np.sqrt(1+pn)
# bass from beat 17
for bar in range(16,80,4):
    bt=bar; ch_i=(bt//8)%4; f=hz(roots[ch_i]); n=int(4*B*SR); tt=np.arange(n)/SR
    s=np.sin(2*np.pi*f*tt)*env(n,0.06,0.5)*np.exp(-tt*0.35)*0.09*np.interp(bt,[16,20,76,80],[0,1,1,0])
    i0=int(bt*B*SR); s=s[:max(0,N-i0)]; mus[:,i0:i0+len(s)]+=s
# reverb on music bus
ir_n=int(2.8*SR); irt=np.arange(ir_n)/SR
for c in range(2):
    ir=rng.standard_normal(ir_n)*np.exp(-irt*2.2); ir=fft_filter(ir,hi=6000); ir/=np.sqrt((ir**2).sum())
    M=len(mus[c])+ir_n; sz=1<<int(np.ceil(np.log2(M)))
    wet=np.fft.irfft(np.fft.rfft(mus[c],sz)*np.fft.rfft(ir,sz),sz)[:N]
    ref=np.sqrt((((mus[0]+mus[1])/2)**2).mean()); wet*=ref/np.sqrt((wet**2).mean())
    mus[c]=mus[c]*0.75+wet*0.45
L+=mus[0]; R+=mus[1]
# percussion: shaker 8ths + soft kick (beats 41–68)
def noise_hit(dur, lo, hi, dec):
    n=int(dur*SR); x=fft_filter(rng.standard_normal(n),lo,hi); return x/np.abs(x).max()*np.exp(-np.arange(n)/SR*dec)
for e in range(41*2, 68*2):
    bt=e/2
    if 59<=bt<60: continue
    add(noise_hit(0.12,5000,12000,40), bt*B, pan=0.35 if e%2 else -0.35, gain=0.022 if e%2 else 0.014)
for bt in range(41,68):
    if bt%2: continue
    n=int(0.5*SR); tt=np.arange(n)/SR; fr=50+60*np.exp(-tt*30)
    k=np.sin(2*np.pi*np.cumsum(fr)/SR)*np.exp(-tt*7)*0.16; add(k, bt*B)
# ---- SFX
def whoosh(dur, peak, up=True, g=0.18, lo=300, hi=5000):
    n=int(dur*SR); x=rng.standard_normal(n); a=fft_filter(x,lo,hi*0.4); b=fft_filter(x,lo*3,hi)
    pos=np.arange(n)/n; e=np.where(pos<peak, (pos/peak)**2, np.exp(-(pos-peak)/(1-peak)*5))
    mixk=pos if up else 1-pos
    s=(a*(1-mixk)+b*mixk); s/=np.abs(s).max(); return s*e*g
def chime(f, dur=2.5, g=0.07):
    n=int(dur*SR); tt=np.arange(n)/SR
    s=sum(a*np.sin(2*np.pi*f*r*tt)*np.exp(-tt*d) for r,a,d in [(1,1,1.6),(2.76,.4,3),(5.4,.2,5),(8.9,.08,8)])
    s[:40]*=np.linspace(0,1,40); return s*g
# title shimmer (letters rise)
add(whoosh(2.2,0.75,True,0.07,2000,12000),0.25,0)
# tide: big wave swell + crash
add(whoosh(4.2,0.62,True,0.26,120,3500),5.6,-0.2)
add(noise_hit(2.6,400,9000,1.6)*0.16,8.2,0.15)
add(chime(hz(81),3.0,0.035),9.0,0.3)
# scene transitions on beats
for bt,pan in [(17,-.3),(23,.3),(29,-.3),(39,.3),(41,-.3),(51,.3),(59,-.3),(68,.3),(71,-.2),(75,.2)]:
    add(whoosh(1.1,0.7,True,0.09,300,7000),bt*B-0.75,pan)
# 800 counter ticks, accelerating, then chime
ticks=np.cumsum(np.linspace(0.16,0.045,60))
for i,tk in enumerate(ticks):
    at=13.3+tk
    if at>16.35: break
    add(chime(hz(96),0.08,0.012),at,np.sin(i))
add(chime(hz(88),3.2,0.07),22*B,0)
# lights on at night (sparkles)
for i in range(9): add(chime(hz(84+[0,4,7,11,12,16,19,23,24][i]),1.6,0.02),36*B+i*0.09,np.sin(i*2))
# floor hovers + select
for k,bt in enumerate([42,43,44,45,46]): add(chime(hz(79-k*2),0.7,0.04),bt*B,0.2)
add(chime(hz(76),2.2,0.06),47.5*B,0); add(chime(hz(83),2.2,0.04),47.5*B+0.09,0)
# ring card passes
for bt in range(52,59): add(whoosh(0.5,0.5,True,0.05,800,9000),bt*B-0.2,(bt%2)*0.8-0.4)
# drone shutters
for bt in [61,62.5,64,65.5,67]:
    add(noise_hit(0.05,2000,9000,90)*0.06,bt*B,0.3); add(noise_hit(0.06,1500,7000,80)*0.04,bt*B+0.07,0.3)
# outro bell
add(chime(hz(69),4.5,0.06),78*B,0); add(chime(hz(76),4.5,0.035),78*B+0.12,0.2)
# master: fade, gentle limiter, normalize
fade=np.interp(t,[0,0.8,DUR-2.5,DUR],[0,1,1,0])
L*=fade; R*=fade
def lim(x): return np.tanh(x*1.4)/1.4
bal=np.sqrt((L**2).mean()/(R**2).mean()); L/=np.sqrt(bal); R*=np.sqrt(bal)
L=lim(L); R=lim(R); pk=max(np.abs(L).max(),np.abs(R).max()); L*=0.89/pk; R*=0.89/pk
rms=np.sqrt(((L**2+R**2)/2).mean()); print('peak dBFS', 20*np.log10(0.89), 'rms dBFS', round(20*np.log10(rms),1))
out=(np.stack([L,R],1)*32767).astype(np.int16)
with wave.open('soundtrack.wav','wb') as w: w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(out.tobytes())
