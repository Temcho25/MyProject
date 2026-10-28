# Atskoba portfolio — motion storyboard

One idea runs through the whole site: **assembly** (აწყობა = "to assemble").
The logo is built from three pieces. The site opens by assembling it, takes it apart
as you scroll into the work, and assembles a final sentence for the contact call.

Section numbers are never shown on the page (no 01 / 02 / 03).

## Logo
Options: monogram in a circle · isometric cube · stacked "A" blocks · **split "A" from three bars** · bracket wordmark.
Chosen: a split "A" — two leaning legs with an open apex and an ember crossbar.
It reads as a letter, as a building frame, and as parts waiting to be joined.

## Loader
Options: percent counter · stroke draw · **pieces slide in and snap** · blur-to-sharp · curtain only.
Chosen: the three SVG pieces slide in from three directions and snap, with a thin progress line.
Exit: a curtain lifts and the WebGL logo continues from the same position.

## Hero
Options: video reel · particle text · **3D logo with glass/metal materials + kinetic headline** · scroll-scrubbed image sequence · cursor-reactive mesh.
Chosen: the extruded logo floats in a foggy space with bokeh particles (depth layers: particles
front/back, logo middle, type in front). The camera drifts constantly and follows the cursor.
Headline letters rise in with blur. On scroll the pieces separate, the camera pushes through
the open apex and the headline letters scatter in depth with motion blur.

## Manifesto
Options: typewriter · **word-by-word light-up while scrolling** · marquee · split screen · pinned quote.
Chosen: large text whose words light up with the scroll position, accent words in ember.

## Featured work (cinematic scenes)
Options: grid · **3D-tilted frame that straightens and grows** · fullscreen swap · hover cards · WebGL planes.
Chosen: each project lives in a scene. The live-site preview video starts tilted back in
perspective, rotates flat and grows; title characters rise; tags slide in; a link opens the
live site. Scenes alternate left/right so the camera rhythm changes.

## More work (horizontal depth rail)
Options: list · masonry · **cover-flow rail with rotateY by distance** · slider · carousel dots.
Chosen: a pinned horizontal rail. Cards rotate and blur depending on their distance from the
centre and skew with scroll velocity (motion blur).

## Capabilities
Options: icon grid · **two counter-moving marquees + reveal list** · tabs · accordion · orbit.
Chosen: marquees that skew and blur with scroll speed, then a list where each line wipes in.

## Process
Options: timeline · **path that draws itself through four steps** · cards · video · stepper.
Chosen: an SVG line draws through Discover → Direct → Build → Launch (words, no numbers).

## Index of other sites
Options: grid · **list with an image that follows the cursor** · table · tag cloud.
Chosen: a list; on desktop a preview follows the cursor with inertia, on phones it is hidden.

## Contact
Options: form · **giant kinetic sentence that assembles** · calendar · map.
Chosen: "Let's assemble yours" — words fly in from depth and snap like the logo did.

## Sound
Ambient pad + soft UI ticks and a whoosh on scene changes, generated with WebAudio.
Off by default (browsers block autoplay); one toggle in the header.
