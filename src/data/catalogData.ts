export interface CatalogSubCategory {
  id: string;
  name: string;
}

export interface CatalogCategory {
  id: string;
  name: string;
  iconName?: string;
  badge?: string;
  subcategories?: CatalogSubCategory[];
}

// Special Seasonal / Featured Collections
export const FEATURED_COLLECTIONS: { id: string; name: string; icon: string; badgeColor: string }[] = [
  { id: 'Arzon narxlar kafolati', name: 'Arzon narxlar kafolati', icon: 'Tag', badgeColor: 'bg-emerald-500' },
  { id: 'Trendli kuz', name: 'Trendli kuz', icon: 'Flame', badgeColor: 'bg-amber-500' },
  { id: 'Kuzgi kolleksiya', name: 'Kuzgi kolleksiya', icon: 'Sparkles', badgeColor: 'bg-orange-500' },
  { id: 'Maktab chegirmalari', name: 'Maktab chegirmalari', icon: 'BookOpen', badgeColor: 'bg-rose-500' },
];

// Complete Marketplace Catalog Categories & Subcategories
export const FULL_CATALOG: CatalogCategory[] = [
  {
    id: 'Mebel',
    name: 'Mebel',
    iconName: 'Home',
    subcategories: [
      { id: 'Yotoqxona mebeli', name: 'Yotoqxona mebeli' },
      { id: 'Mehmonxona mebeli', name: 'Mehmonxona mebeli' },
      { id: 'Oshxona mebellari', name: 'Oshxona mebellari' },
      { id: 'Ofis mebeli', name: 'Ofis mebeli' },
      { id: 'Stol va stullar', name: 'Stol va stullar' },
      { id: 'Shkaflar va javonlar', name: 'Shkaflar va javonlar' }
    ]
  },
  {
    id: 'Turizm, baliq ovi va ovchilik',
    name: 'Turizm, baliq ovi va ovchilik',
    iconName: 'Compass',
    subcategories: [
      { id: 'Palatkalar va uxlash qoplari', name: 'Palatkalar va uxlash qoplari' },
      { id: 'Baliq ovi anjomlari', name: 'Baliq ovi anjomlari' },
      { id: 'Ovchilik buyumlari', name: 'Ovchilik buyumlari' },
      { id: 'Sayyohlik idishlari va fonarlar', name: 'Sayyohlik idishlari va fonarlar' }
    ]
  },
  {
    id: 'Elektronika',
    name: 'Elektronika',
    iconName: 'Smartphone',
    subcategories: [
      { id: 'Smartfonlar va telefonlar', name: 'Smartfonlar va telefonlar' },
      { id: 'Noutbuklar va kompyuterlar', name: 'Noutbuklar va kompyuterlar' },
      { id: 'Planshetlar', name: 'Planshetlar' },
      { id: 'Aqlli soatlar va bilaguzuklar', name: 'Aqlli soatlar va bilaguzuklar' },
      { id: 'Quloqchinlar va audio', name: 'Quloqchinlar va audio' },
      { id: 'Aksessuarlar va g\'iloflar', name: 'Aksessuarlar va g\'iloflar' }
    ]
  },
  {
    id: 'Maishiy texnika',
    name: 'Maishiy texnika',
    iconName: 'Tv',
    subcategories: [
      { id: 'Muzlatgichlar', name: 'Muzlatgichlar' },
      { id: 'Kir yuvish mashinalari', name: 'Kir yuvish mashinalari' },
      { id: 'Changyutgichlar', name: 'Changyutgichlar' },
      { id: 'Konditsionerlar', name: 'Konditsionerlar' },
      { id: 'Mikroto\'lqinli pechlar', name: 'Mikroto\'lqinli pechlar' },
      { id: 'Televizorlar', name: 'Televizorlar' }
    ]
  },
  {
    id: 'Kiyim',
    name: 'Kiyim',
    iconName: 'Shirt',
    subcategories: [
      { id: 'Ayollar kiyimi', name: 'Ayollar kiyimi' },
      { id: 'Erkaklar kiyimi', name: 'Erkaklar kiyimi' },
      { id: 'Bolalar kiyimi', name: 'Bolalar kiyimi' },
      { id: 'Sport kiyimlari', name: 'Sport kiyimlari' },
      { id: 'Kuzgi va qishki kurtkalar', name: 'Kuzgi va qishki kurtkalar' }
    ]
  },
  {
    id: 'Poyabzallar',
    name: 'Poyabzallar',
    iconName: 'Footprints',
    subcategories: [
      { id: 'Erkaklar poyabzali', name: 'Erkaklar poyabzali' },
      { id: 'Ayollar poyabzali', name: 'Ayollar poyabzali' },
      { id: 'Krossovkalar va kedalar', name: 'Krossovkalar va kedalar' },
      { id: 'Bolalar poyabzali', name: 'Bolalar poyabzali' },
      { id: 'Kuzgi botinkalar', name: 'Kuzgi botinkalar' }
    ]
  },
  {
    id: 'Aksessuarlar',
    name: 'Aksessuarlar',
    iconName: 'Watch',
    subcategories: [
      { id: 'Qo\'l soatlari', name: 'Qo\'l soatlari' },
      { id: 'Ko\'zoynaklar va optika', name: 'Ko\'zoynaklar va optika' },
      { id: 'Sumkalar va ryukzaklar', name: 'Sumkalar va ryukzaklar' },
      { id: 'Zargarlik va taqinchoqlar', name: 'Zargarlik va taqinchoqlar' },
      { id: 'Kamarlar va hamyonlar', name: 'Kamarlar va hamyonlar' }
    ]
  },
  {
    id: 'Goʻzallik va parvarish',
    name: 'Goʻzallik va parvarish',
    iconName: 'Sparkles',
    subcategories: [
      { id: 'Atirlar va parfyumeriya', name: 'Atirlar va parfyumeriya' },
      { id: 'Yuz parvarishi', name: 'Yuz parvarishi' },
      { id: 'Soch parvarishi', name: 'Soch parvarishi' },
      { id: 'Makiyaj va pardoz', name: 'Makiyaj va pardoz' },
      { id: 'Tana parvarishi', name: 'Tana parvarishi' }
    ]
  },
  {
    id: 'Salomatlik',
    name: 'Salomatlik',
    iconName: 'HeartPulse',
    subcategories: [
      { id: 'Vitaminlar va BAA', name: 'Vitaminlar va BAA' },
      { id: 'Tibbiy jihozlar va tonometrlar', name: 'Tibbiy jihozlar va tonometrlar' },
      { id: 'Massajorlar', name: 'Massajorlar' },
      { id: 'Ortopediya', name: 'Ortopediya' }
    ]
  },
  {
    id: 'Uy-roʻzgʻor buyumlari',
    name: 'Uy-roʻzgʻor buyumlari',
    iconName: 'Utensils',
    subcategories: [
      { id: 'Oshxona idishlari', name: 'Oshxona idishlari' },
      { id: 'Tozalash buyumlari', name: 'Tozalash buyumlari' },
      { id: 'Tekstil va choyshablar', name: 'Tekstil va choyshablar' },
      { id: 'Dekor va bezaklar', name: 'Dekor va bezaklar' }
    ]
  },
  {
    id: 'Qurilish va taʼmirlash',
    name: 'Qurilish va taʼmirlash',
    iconName: 'Wrench',
    subcategories: [
      { id: 'Elektr asboblar', name: 'Elektr asboblar' },
      { id: 'Kalitlar va otvyotkalar', name: 'Kalitlar va otvyotkalar' },
      { id: 'Slesarlik asboblari', name: 'Slesarlik asboblari' },
      { id: 'Kesish va arralash asboblari', name: 'Kesish va arralash asboblari' },
      { id: 'O\'lchov asboblari', name: 'O\'lchov asboblari' },
      { id: 'Lazer sath o\'lchagichlar', name: 'Lazer sath o\'lchagichlar' }
    ]
  },
  {
    id: 'Qurilish-pardoz materiallari',
    name: 'Qurilish-pardoz materiallari',
    iconName: 'Layers',
    subcategories: [
      { id: 'Pol uchun qoplamalar', name: 'Pol uchun qoplamalar' },
      { id: 'Oʻzi yopishadigan plyonka', name: 'Oʻzi yopishadigan plyonka' },
      { id: 'Plitka va keramogranit', name: 'Plitka va keramogranit' },
      { id: 'Osma shiplar va qismlar', name: 'Osma shiplar va qismlar' },
      { id: 'Gulqog\'ozlar (Oboi)', name: 'Gulqog\'ozlar (Oboi)' }
    ]
  },
  {
    id: 'Santexnika',
    name: 'Santexnika',
    iconName: 'Droplets',
    subcategories: [
      { id: 'Oshxona moykalar va komponentlar', name: 'Oshxona moykalar va komponentlar' },
      { id: 'Dush uskunalari', name: 'Dush uskunalari' },
      { id: 'Santexnika armatura va aksessuarlar', name: 'Santexnika armatura va aksessuarlar' },
      { id: 'Hojatxonalar va o\'rnatish', name: 'Hojatxonalar va o\'rnatish' },
      { id: 'Kranlar va aralashtirgichlar', name: 'Kranlar va aralashtirgichlar' }
    ]
  },
  {
    id: 'Yoritish',
    name: 'Yoritish',
    iconName: 'Lightbulb',
    subcategories: [
      { id: 'Yoritish uchun aksessuarlar', name: 'Yoritish uchun aksessuarlar' },
      { id: 'Svetodiod tasmasi', name: 'Svetodiod tasmasi' },
      { id: 'Lampochkalar', name: 'Lampochkalar' },
      { id: 'Projektorlar', name: 'Projektorlar' },
      { id: 'Lyustralar va plafonlar', name: 'Lyustralar va plafonlar' }
    ]
  },
  {
    id: 'Elektrika',
    name: 'Elektrika',
    iconName: 'Zap',
    subcategories: [
      { id: 'Rozetkalar, vilkalar va o\'chirgichlar', name: 'Rozetkalar, vilkalar va o\'chirgichlar' },
      { id: 'Batareyalar', name: 'Batareyalar' },
      { id: 'To\'lqinli kuchlanish himoyachilari', name: 'To\'lqinli kuchlanish himoyachilari' },
      { id: 'Tarmoq filtrlar, ajratgichlar va uzaytirgichlar', name: 'Tarmoq filtrlar, ajratgichlar va uzaytirgichlar' },
      { id: 'Kabellar va simlar', name: 'Kabellar va simlar' }
    ]
  },
  {
    id: 'Uy va bogʻ uchun suv taʼminoti',
    name: 'Uy va bogʻ uchun suv taʼminoti',
    iconName: 'Droplet',
    subcategories: [
      { id: 'Nasoslar', name: 'Nasoslar' },
      { id: 'Sifonlar', name: 'Sifonlar' },
      { id: 'Truboprovod', name: 'Truboprovod' },
      { id: 'Suvni tozalash va filtrlash', name: 'Suvni tozalash va filtrlash' },
      { id: 'Sug\'orish shlanglari', name: 'Sug\'orish shlanglari' }
    ]
  },
  {
    id: 'Materiallar va jihozlar',
    name: 'Materiallar va jihozlar',
    iconName: 'Package',
    subcategories: [
      { id: 'Qurilish tasmalari', name: 'Qurilish tasmalari' },
      { id: 'Izolyatsiya lentalari', name: 'Izolyatsiya lentalari' },
      { id: 'Abraziv moddalar', name: 'Abraziv moddalar' },
      { id: 'Drellar, o\'ymakorlar va shurup buragichlar uchun', name: 'Drellar, o\'ymakorlar va shurup buragichlar uchun' }
    ]
  },
  {
    id: 'Qurilish uskunalari',
    name: 'Qurilish uskunalari',
    iconName: 'Truck',
    subcategories: [
      { id: 'Generatorlar', name: 'Generatorlar' },
      { id: 'Kompressorlar', name: 'Kompressorlar' },
      { id: 'Boshqa qurilish uskunalari', name: 'Boshqa qurilish uskunalari' },
      { id: 'Qurilish changyutgichlari', name: 'Qurilish changyutgichlari' },
      { id: 'Beton qorgichlar', name: 'Beton qorgichlar' }
    ]
  },
  {
    id: 'Mahkamlagichlar va armatura',
    name: 'Mahkamlagichlar va armatura',
    iconName: 'Anchor',
    subcategories: [
      { id: 'Furnitura', name: 'Furnitura' },
      { id: 'Burchaklar va ushlagichlar', name: 'Burchaklar va ushlagichlar' },
      { id: 'Mixlar', name: 'Mixlar' },
      { id: 'Shuruplar va samorezlar', name: 'Shuruplar va samorezlar' },
      { id: 'Dyubellar va ankerlar', name: 'Dyubellar va ankerlar' }
    ]
  },
  {
    id: 'Shaxsiy himoya vositalari',
    name: 'Shaxsiy himoya vositalari',
    iconName: 'Shield',
    subcategories: [
      { id: 'Qurilish koʻzoynaklari', name: 'Qurilish koʻzoynaklari' },
      { id: 'Xavfsizlik uskunalari', name: 'Xavfsizlik uskunalari' },
      { id: 'Himoya niqoblari', name: 'Himoya niqoblari' },
      { id: 'Himoya qoʻlqoplari', name: 'Himoya qoʻlqoplari' },
      { id: 'Kaskalar va jiletlar', name: 'Kaskalar va jiletlar' }
    ]
  },
  {
    id: 'Isitish',
    name: 'Isitish',
    iconName: 'Flame',
    subcategories: [
      { id: 'Sochiq quritgichlar', name: 'Sochiq quritgichlar' },
      { id: 'Radiator bog\'lovchilar', name: 'Radiator bog\'lovchilar' },
      { id: 'Radiatorlar', name: 'Radiatorlar' },
      { id: 'Issiq pollar', name: 'Issiq pollar' },
      { id: 'Kotyollar va pechlar', name: 'Kotyollar va pechlar' }
    ]
  },
  {
    id: 'Ventilyatsiya',
    name: 'Ventilyatsiya',
    iconName: 'Wind',
    subcategories: [
      { id: 'Havoni tortuvchi ventilyatorlar', name: 'Havoni tortuvchi ventilyatorlar' },
      { id: 'Kanalli ventilyatorlar', name: 'Kanalli ventilyatorlar' },
      { id: 'Shamollatish panjaralari va revizion lyuklar', name: 'Shamollatish panjaralari va revizion lyuklar' },
      { id: 'Shamollatish moslamalari', name: 'Shamollatish moslamalari' },
      { id: 'Havo kanallari va butlovchi qismlar', name: 'Havo kanallari va butlovchi qismlar' }
    ]
  },
  {
    id: 'Bo\'yoq va lak materiallari',
    name: 'Bo\'yoq va lak materiallari',
    iconName: 'Paintbrush',
    subcategories: [
      { id: 'Bo\'yash va pardozlash uchun asboblar', name: 'Bo\'yash va pardozlash uchun asboblar' },
      { id: 'Yelim va germetikalar', name: 'Yelim va germetikalar' },
      { id: 'Aerozol bo\'yoqlari', name: 'Aerozol bo\'yoqlari' },
      { id: 'Bo‘yoqlar', name: 'Bo‘yoqlar' },
      { id: 'Gruntovka va laklar', name: 'Gruntovka va laklar' }
    ]
  },
  {
    id: 'Qurilish materiallari',
    name: 'Qurilish materiallari',
    iconName: 'Hammer',
    subcategories: [
      { id: 'Tom yopma va aksessuarlar', name: 'Tom yopma va aksessuarlar' },
      { id: 'Qurilish aralashmalari', name: 'Qurilish aralashmalari' },
      { id: 'Yomg\'ir suv tizimlari', name: 'Yomg\'ir suv tizimlari' },
      { id: 'Qoplama materiallar', name: 'Qoplama materiallar' },
      { id: 'Gipsokarton va profillar', name: 'Gipsokarton va profillar' }
    ]
  },
  {
    id: 'Tayyor uylar, hammomlar va garajlar',
    name: 'Tayyor uylar, hammomlar va garajlar',
    iconName: 'Warehouse',
    subcategories: [
      { id: 'Tayyor sauna va hammomlar', name: 'Tayyor sauna va hammomlar' },
      { id: 'Tayyor uylar', name: 'Tayyor uylar' },
      { id: 'Modulli konstruktsiyalar', name: 'Modulli konstruktsiyalar' },
      { id: 'Garajlar va bostirmalar', name: 'Garajlar va bostirmalar' }
    ]
  },
  {
    id: 'Avtotovarlar',
    name: 'Avtotovarlar',
    iconName: 'Car',
    subcategories: [
      { id: 'Avtoelektronika va videoregistratorlar', name: 'Avtoelektronika va videoregistratorlar' },
      { id: 'Moylar va suyuqliklar', name: 'Moylar va suyuqliklar' },
      { id: 'G\'iloflar va poliklar', name: 'G\'iloflar va poliklar' },
      { id: 'Avtokosmetika', name: 'Avtokosmetika' }
    ]
  },
  {
    id: 'Bolalar tovarlari',
    name: 'Bolalar tovarlari',
    iconName: 'Baby',
    subcategories: [
      { id: 'O\'yinchoqlar', name: 'O\'yinchoqlar' },
      { id: 'Aravachalar va avtokreslolar', name: 'Aravachalar va avtokreslolar' },
      { id: 'Tagliklar va gigiyena', name: 'Tagliklar va gigiyena' }
    ]
  },
  {
    id: 'Xobbi va ijod',
    name: 'Xobbi va ijod',
    iconName: 'Palette',
    subcategories: [
      { id: 'Rasm chizish to\'plamlari', name: 'Rasm chizish to\'plamlari' },
      { id: 'Qo\'l mehnati va to\'qish', name: 'Qo\'l mehnati va to\'qish' },
      { id: 'Musiqa asboblari', name: 'Musiqa asboblari' }
    ]
  },
  {
    id: 'Sport va hordiq',
    name: 'Sport va hordiq',
    iconName: 'Dumbbell',
    subcategories: [
      { id: 'Trenajyorlar va gantellar', name: 'Trenajyorlar va gantellar' },
      { id: 'Velosipedlar va samokatlar', name: 'Velosipedlar va samokatlar' },
      { id: 'To\'plar va o\'yin anjomlari', name: 'To\'plar va o\'yin anjomlari' }
    ]
  },
  {
    id: 'Oziq-ovqat mahsulotlari',
    name: 'Oziq-ovqat mahsulotlari',
    iconName: 'Apple',
    subcategories: [
      { id: 'Choy, kofe va ichimliklar', name: 'Choy, kofe va ichimliklar' },
      { id: 'Shirinliklar va shokoladlar', name: 'Shirinliklar va shokoladlar' },
      { id: 'Konservalar va ziravorlar', name: 'Konservalar va ziravorlar' }
    ]
  },
  {
    id: 'Maishiy kimyoviy moddalar',
    name: 'Maishiy kimyoviy moddalar',
    iconName: 'Sparkle',
    subcategories: [
      { id: 'Kir yuvish kukunlari va gellar', name: 'Kir yuvish kukunlari va gellar' },
      { id: 'Idish yuvish vositalari', name: 'Idish yuvish vositalari' },
      { id: 'Tozalovchi vositalar', name: 'Tozalovchi vositalar' }
    ]
  },
  {
    id: 'Kanselyariya tovarlari',
    name: 'Kanselyariya tovarlari',
    iconName: 'PenTool',
    subcategories: [
      { id: 'Daftarlar va bloknotlar', name: 'Daftarlar va bloknotlar' },
      { id: 'Ruchkalar va qalamlar', name: 'Ruchkalar va qalamlar' },
      { id: 'Maktab sumkalari', name: 'Maktab sumkalari' }
    ]
  },
  {
    id: 'Hayvonlar uchun tovarlar',
    name: 'Hayvonlar uchun tovarlar',
    iconName: 'Dog',
    subcategories: [
      { id: 'Itlar va mushuklar uchun ozuqa', name: 'Itlar va mushuklar uchun ozuqa' },
      { id: 'Aksessuarlar va o\'yinchoqlar', name: 'Aksessuarlar va o\'yinchoqlar' },
      { id: 'Kataklar va uychalar', name: 'Kataklar va uychalar' }
    ]
  },
  {
    id: 'Kitoblar',
    name: 'Kitoblar',
    iconName: 'Book',
    subcategories: [
      { id: 'Badiiy adabiyot', name: 'Badiiy adabiyot' },
      { id: 'Biznes va psixologiya', name: 'Biznes va psixologiya' },
      { id: 'Bolalar kitoblari', name: 'Bolalar kitoblari' },
      { id: 'Darsliklar va lug\'atlar', name: 'Darsliklar va lug\'atlar' }
    ]
  },
  {
    id: 'Dacha, bogʻ va tomorqa',
    name: 'Dacha, bogʻ va tomorqa',
    iconName: 'Sprout',
    subcategories: [
      { id: 'Bog\'dorchilik asboblari', name: 'Bog\'dorchilik asboblari' },
      { id: 'O\'g\'itlar va urug\'lar', name: 'O\'g\'itlar va urug\'lar' },
      { id: 'Dacha mebeli va gamaklar', name: 'Dacha mebeli va gamaklar' }
    ]
  },
  {
    id: 'Reabilitatsiya uchun subsidiyalangan mahsulotlar',
    name: 'Reabilitatsiya uchun subsidiyalangan mahsulotlar',
    iconName: 'Accessibility',
    subcategories: [
      { id: 'Nogironlar aravachalari', name: 'Nogironlar aravachalari' },
      { id: 'Qo\'ltiqtayoqlar va hassalar', name: 'Qo\'ltiqtayoqlar va hassalar' },
      { id: 'Eshitish apparatlari', name: 'Eshitish apparatlari' }
    ]
  }
];
