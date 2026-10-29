# Offline soundtrack for the reel: pad + arpeggio + event-synced chimes/whooshes. Writes 48 kHz stereo WAV.
import json, sys, numpy as np, wave
SR=48000; DUR=float(sys.argv[1]); ev=json.load(open(sys.argv[2])); out=sys.argv[3]
N=int(SR*DUR); t=np.arange(N)/SR
L=np.zeros(N); R=np.zeros(N)
def note(f): return 440*2**((f-69)/12)
def env_adsr(n,a,d,s,r,total):
    e=np.zeros(n); A=int(a*SR); D=int(d*SR); Rr=int(r*SR); S=max(0,int(total*SR)-A-D)
    seg=np.concatenate([np.linspace(0,1,A,endpoint=False),np.linspace(1,s,D,endpoint=False),np.full(S,s),np.linspace(s,0,Rr)])
    e[:min(n,len(seg))]=seg[:n]; return e
def add(sig,start,pan=0.0,gain=1.0):
    i=int(start*SR); j=min(N,i+len(sig)); 
    if i>=N: return
    s=sig[:j-i]*gain; L[i:j]+=s*np.sqrt((1-pan)/2); R[i:j]+=s*np.sqrt((1+pan)/2)
# --- Pad: chords change on visual events
chords=[(0,[45,52,55,59,60]),(ev['casesStart'],[41,48,52,55,60]),(ev['svcStart'],[48,55,59,62,64]),(ev.get('labStart',ev['svcStart']+8),[41,48,53,57,64]),(ev['appStart'],[43,50,55,59,62]),(ev['contact'],[45,52,57,59,64])]
chords.sort(key=lambda c:c[0])
for k,(st,ns) in enumerate(chords):
    en=chords[k+1][0] if k+1<len(chords) else DUR
    dur=en-st+1.5; n=int(dur*SR); tt=np.arange(n)/SR
    e=env_adsr(n,1.2 if k else 2.5,0.5,0.85,1.5,dur-1.5)
    for idx,m in enumerate(ns):
        f=note(m); 
        for det,pan in ((-0.07,-0.5),(0.07,0.5)):
            ph=np.random.rand()*6.28
            w=np.sin(2*np.pi*f*(1+det/100)*tt+ph)+0.25*np.sin(2*np.pi*2*f*tt+ph)+0.08*np.sin(2*np.pi*3*f*tt)
            trem=1+0.08*np.sin(2*np.pi*0.18*tt+idx)
            add(w*e*trem,st,pan,0.018 if idx else 0.03)
# --- Arpeggio plucks (8ths, 100 bpm) once scrolling starts, follows the chord
step=60/100/2
def pluck(f,dur=0.9,bright=1.0):
    n=int(dur*SR); tt=np.arange(n)/SR
    e=np.exp(-tt*5.5)*np.minimum(1,tt*400)
    return e*(np.sin(2*np.pi*f*tt)+0.35*bright*np.sin(2*np.pi*2*f*tt)*np.exp(-tt*9)+0.12*np.sin(2*np.pi*3*f*tt)*np.exp(-tt*14))
tcur=ev['scrollStart']; i=0
while tcur<DUR-0.6:
    ch=[c for c in chords if c[0]<=tcur][-1][1]
    pat=[0,2,4,3,1,4,2,3]
    m=ch[pat[i%8]]+12
    g=0.05 if tcur<ev['contact'] else 0.05*max(0,1-(tcur-ev['contact'])/2.5)
    add(pluck(note(m)),tcur,np.sin(i*1.3)*0.4,g)
    tcur+=step; i+=1
# --- Event SFX
def chime(f):
    n=int(2.6*SR); tt=np.arange(n)/SR; s=np.zeros(n)
    for mult,amp,dec in ((1,1,1.6),(2.01,0.35,3.2),(3.02,0.15,5),(4.1,0.06,7)):
        s+=amp*np.sin(2*np.pi*f*mult*tt)*np.exp(-tt*dec)
    return s*np.minimum(1,tt*300)
def whoosh(dur=0.9,lo=300,hi=2600):
    n=int(dur*SR); noise=np.random.randn(n); tt=np.arange(n)/SR
    # moving one-pole lowpass/highpass approximation
    fc=lo*(hi/lo)**np.sin(np.pi*tt/dur)
    a=np.exp(-2*np.pi*fc/SR); y=np.zeros(n); prev=0
    for k in range(n): prev=(1-a[k])*noise[k]+a[k]*prev; y[k]=prev
    e=np.sin(np.pi*tt/dur)**2
    return y*e
def thud(f0=80,dur=0.8):
    n=int(dur*SR); tt=np.arange(n)/SR; f=f0*np.exp(-tt*3)
    return np.sin(2*np.pi*np.cumsum(f)/SR)*np.exp(-tt*5)
add(chime(note(81)),ev['dotLand'],0.2,0.10)                     # dot lands in the hero
add(thud(70,0.6),ev['dotLand'],0,0.12)
for tt_ in ev['whoosh']: add(whoosh(),tt_-0.35,0,0.05)
notes=[69,72,76,79]
for k,tt_ in enumerate(ev['chapters']): add(chime(note(notes[k%4]+12)),tt_,(-0.3,0.3,-0.2,0.2)[k%4],0.085)
add(thud(60,1.2),ev['svcStart'],0,0.14)
for tt_ in ev.get('extraChimes',[]): add(chime(note(88)),tt_,0.25,0.07)
if 'labStart' in ev: add(thud(58,1.2),ev['labStart'],0,0.12)
add(chime(note(69)),ev['contact'],0,0.12); add(chime(note(76)),ev['contact']+0.05,0.3,0.06); add(thud(55,1.5),ev['contact'],0,0.16)
# --- Master: fade in/out, soft limiter, normalise to -1 dBFS
fade=np.ones(N); fi=int(0.4*SR); fo=int(2.2*SR); fade[:fi]=np.linspace(0,1,fi); fade[-fo:]=np.linspace(1,0,fo)
st=np.stack([L,R],1)*fade[:,None]
st=np.tanh(st*1.6)/1.6
st*=10**(-1/20)/np.max(np.abs(st))
pcm=(st*32767).astype('<i2')
w=wave.open(out,'wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes()); w.close()
print('peak dBFS', 20*np.log10(np.max(np.abs(st))), 'rms dBFS', 20*np.log10(np.sqrt(np.mean(st**2))))
