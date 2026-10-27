/* Coordinate — shared project data (classic script: defines globals used by index.html and the ES modules). */
// Three round residential towers. x/y = centre on the site plan, r = radius (scene px).
// Block A floors come from api.coordinate.ge; B and C are read off the official renders — please confirm with the developer.
const BLOCKS = [
  {id:"A", floors:31, x:-120, y:  50, r:58},
  {id:"B", floors:18, x:  10, y:-110, r:56},
  {id:"C", floors:14, x: 140, y: -20, r:56},
];
// Layout types (block A, from api.coordinate.ge). `id` = position on the floor (apt 1803 → "03").
// rooms = bedrooms + living room. floors = [first,last] floor with this layout. plan2d / plan3d = images in plans/.
const LAYOUTS = [
  {id:"09",  rooms:"2", area:62.6,  floors:[3,28],  bedrooms:1, living:51, balcony:11.6, plan2d:"plans/09-2d.png",  plan3d:"plans/09-3d.webp"},
  {id:"05",  rooms:"2", area:64.7,  floors:[3,28],  bedrooms:1, living:52.3, balcony:12.4, plan2d:"plans/05-2d.png",  plan3d:"plans/05-3d.webp"},
  {id:"01",  rooms:"2", area:65.3,  floors:[3,28],  bedrooms:1, living:53.5, balcony:11.8, plan2d:"plans/01-2d.png",  plan3d:"plans/01-3d.webp"},
  {id:"07",  rooms:"2", area:68.9,  floors:[3,28],  bedrooms:1, living:54.9, balcony:14, plan2d:"plans/07-2d.png",  plan3d:"plans/07-3d.webp"},
  {id:"06",  rooms:"3", area:85.8,  floors:[3,28],  bedrooms:2, living:63.1, balcony:22.7, plan2d:"plans/06-2d.png",  plan3d:"plans/06-3d.webp"},
  {id:"02",  rooms:"3", area:87.7,  floors:[3,28],  bedrooms:2, living:67.6, balcony:20, plan2d:"plans/02-2d.png",  plan3d:"plans/02-3d.webp"},
  {id:"04",  rooms:"3", area:92.2,  floors:[3,28],  bedrooms:2, living:72.6, balcony:19.6, plan2d:"plans/04-2d.png",  plan3d:"plans/04-3d.webp"},
  {id:"03",  rooms:"3", area:101.7, floors:[3,28],  bedrooms:2, living:81.9, balcony:19.8, plan2d:"plans/03-2d.png",  plan3d:"plans/03-3d.webp"},
  {id:"08",  rooms:"4", area:125.3, floors:[3,28],  bedrooms:3, living:96.2, balcony:29.1, plan2d:"plans/08-2d.png",  plan3d:"plans/08-3d.webp"},
  {id:"ph2", rooms:"6", area:391.6, floors:[29,30], bedrooms:5, living:268.1, balcony:123.5, plan2d:"plans/ph2-2d.png", plan3d:"plans/ph2-3d.webp"},
  {id:"ph1", rooms:"5", area:401.3, floors:[29,30], bedrooms:4, living:278.4, balcony:122.9, plan2d:"plans/ph1-2d.png", plan3d:"plans/ph1-3d.webp"},
];
// Apartment-level availability: data/apartments.json (snapshot) — refreshed live from api.coordinate.ge when reachable.
const COORD_API="https://api.coordinate.ge/api/";
window.COORD={BLOCKS,LAYOUTS,API:COORD_API};
