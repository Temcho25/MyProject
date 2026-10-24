// Official renders and drone photos of Orientiri Lisi.
// Sources: orientiri.ge (home page banners and gallery album /gallery/5) and the developer's
// presentation "Orientiri-ppt-GEO 15.04.2026" (higher-resolution copies of the same renders).
// Files in public/media/ are WebP copies at 960, 1500/1600 and full width.
export const media = {
  "hero": {
    "src": "/media/hero-1600.webp",
    "srcset": "/media/hero-960.webp 960w, /media/hero-1600.webp 1600w, /media/hero-2560.webp 2560w",
    "width": 2560,
    "height": 1440,
    "alt": {
      "ka": "ორიენტირი ლისის ხედი ზემოდან, უკან ლისის ტბა",
      "en": "Aerial view of Orientiri Lisi with Lisi Lake behind"
    }
  },
  "closing": {
    "src": "/media/closing-1600.webp",
    "srcset": "/media/closing-960.webp 960w, /media/closing-1600.webp 1600w, /media/closing-2560.webp 2560w",
    "width": 2560,
    "height": 1440,
    "alt": {
      "ka": "უბნის შესასვლელი საღამოს",
      "en": "The neighbourhood entrance at night"
    }
  },
  "photos": [
    {
      "src": "/media/lake-aerial-1600.webp",
      "srcset": "/media/lake-aerial-960.webp 960w, /media/lake-aerial-1600.webp 1600w, /media/lake-aerial-2553.webp 2553w",
      "width": 2553,
      "height": 1436,
      "alt": {
        "ka": "უბანი და ლისის ტბა ზემოდან",
        "en": "The neighbourhood and Lisi Lake from above"
      }
    },
    {
      "src": "/media/entrance-1600.webp",
      "srcset": "/media/entrance-960.webp 960w, /media/entrance-1600.webp 1600w, /media/entrance-2553.webp 2553w",
      "width": 2553,
      "height": 1441,
      "alt": {
        "ka": "მთავარი შესასვლელი შლაგბაუმით",
        "en": "The main entrance with its barrier gate"
      }
    },
    {
      "src": "/media/street-1600.webp",
      "srcset": "/media/street-960.webp 960w, /media/street-1600.webp 1600w, /media/street-2560.webp 2560w",
      "width": 2560,
      "height": 1434,
      "alt": {
        "ka": "უბნის ქუჩა ერთიანი ღობეებით და ტროტუარით",
        "en": "A street in the neighbourhood with uniform fences and sidewalk"
      }
    },
    {
      "src": "/media/pools-1500.webp",
      "srcset": "/media/pools-960.webp 960w, /media/pools-1500.webp 1500w",
      "width": 1500,
      "height": 844,
      "alt": {
        "ka": "კერძო სახლები აუზებით, ხედი ზემოდან",
        "en": "Private houses with pools, seen from above"
      }
    },
    {
      "src": "/media/drone-site-1600.webp",
      "srcset": "/media/drone-site-960.webp 960w, /media/drone-site-1600.webp 1600w, /media/drone-site-2560.webp 2560w",
      "width": 2560,
      "height": 1440,
      "alt": {
        "ka": "პროექტი რეალურ ადგილზე: დრონის ფოტო, ლისის ტბა და თბილისი",
        "en": "The project on the real site: drone photo with Lisi Lake and Tbilisi"
      }
    },
    {
      "src": "/media/avenue-1500.webp",
      "srcset": "/media/avenue-960.webp 960w, /media/avenue-1500.webp 1500w",
      "width": 1500,
      "height": 844,
      "alt": {
        "ka": "ქუჩა ტბისკენ",
        "en": "The street leading towards the lake"
      }
    },
    {
      "src": "/media/fence-1500.webp",
      "srcset": "/media/fence-960.webp 960w, /media/fence-1500.webp 1500w",
      "width": 1500,
      "height": 844,
      "alt": {
        "ka": "ნაკვეთის ღობე, ჭიშკარი და შესასვლელი კარი",
        "en": "A plot fence with gate and entrance door"
      }
    },
    {
      "src": "/media/night-1500.webp",
      "srcset": "/media/night-960.webp 960w, /media/night-1500.webp 1500w",
      "width": 1500,
      "height": 844,
      "alt": {
        "ka": "უბნის ქუჩა ღამით",
        "en": "The street at night"
      }
    },
    {
      "src": "/media/crossing-1500.webp",
      "srcset": "/media/crossing-960.webp 960w, /media/crossing-1500.webp 1500w",
      "width": 1500,
      "height": 844,
      "alt": {
        "ka": "ქუჩა ფეხით მოსიარულეთა გადასასვლელით",
        "en": "The street with a pedestrian crossing"
      }
    },
    {
      "src": "/media/drone-lake-1600.webp",
      "srcset": "/media/drone-lake-960.webp 960w, /media/drone-lake-1600.webp 1600w, /media/drone-lake-2555.webp 2555w",
      "width": 2555,
      "height": 1437,
      "alt": {
        "ka": "ტერიტორია და ლისის ტბა, დრონის ფოტო",
        "en": "The site and Lisi Lake, drone photo"
      }
    }
  ]
};

// The first four photos play in the pinned "views" scene; the rest form the grid below it.
media.reel = media.photos.slice(0, 4);
media.grid = media.photos.slice(4);
