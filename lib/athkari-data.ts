export interface Dhikr {
  id: string;
  text: string;
  target: number;
  current: number;
  virtue: string;
  icon?: string;
  is_active?: boolean;
  sort_order?: number;
}

export interface DhikrGroup {
  id: string;
  name: string;
  icon: string;
  adhkar: Dhikr[];
  is_active?: boolean;
  sort_order?: number;
}

export interface DailyStats {
  day: string;
  count: number;
  total: number;
}

export const DEFAULT_GROUPS: DhikrGroup[] = [
  {
    id: "morning",
    name: "أذكار الصباح",
    icon: "sun",
    adhkar: [
      {
        id: "m1",
        text: "سُبْحَانَ اللهِ وَبِحَمْدِهِ",
        target: 33,
        current: 0,
        virtue:
          "قال رسول الله ﷺ: من قال سبحان الله وبحمده في يوم مائة مرة حُطّت خطاياه وإن كانت مثل زبد البحر.",
      },
      {
        id: "m2",
        text: "الحَمْدُ لِلَّهِ",
        target: 33,
        current: 0,
        virtue:
          "الحمد لله تملأ الميزان، وسبحان الله والحمد لله تملآن ما بين السماوات والأرض.",
      },
      {
        id: "m3",
        text: "اللَّهُ أَكْبَرُ",
        target: 33,
        current: 0,
        virtue:
          "التكبير من أحب الكلام إلى الله. قال ﷺ: أحب الكلام إلى الله أربع: سبحان الله، والحمد لله، ولا إله إلا الله، والله أكبر.",
      },
      {
        id: "m4",
        text: "لَا إِلٰهَ إِلَّا اللهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ المُلْكُ وَلَهُ الحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ",
        target: 10,
        current: 0,
        virtue:
          "من قالها عشر مرات كان كمن أعتق أربعة أنفس من ولد إسماعيل.",
      },
    ],
  },
  {
    id: "after-fajr",
    name: "بعد صلاة الفجر",
    icon: "sunrise",
    adhkar: [
      {
        id: "f1",
        text: "أَسْتَغْفِرُ اللهَ",
        target: 3,
        current: 0,
        virtue: "الاستغفار سبب لمغفرة الذنوب وسعة الرزق.",
      },
      {
        id: "f2",
        text: "اللَّهُمَّ أَنْتَ السَّلَامُ وَمِنْكَ السَّلَامُ تَبَارَكْتَ يَا ذَا الجَلَالِ وَالإِكْرَامِ",
        target: 1,
        current: 0,
        virtue:
          "كان النبي ﷺ إذا سلّم من الصلاة قال هذا الذكر.",
      },
      {
        id: "f3",
        text: "سُبْحَانَ اللهِ",
        target: 33,
        current: 0,
        virtue: "التسبيح من أحب الكلام إلى الله سبحانه وتعالى.",
      },
    ],
  },
  {
    id: "evening",
    name: "أذكار المساء",
    icon: "moon",
    adhkar: [
      {
        id: "e1",
        text: "أَعُوذُ بِكَلِمَاتِ اللهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ",
        target: 3,
        current: 0,
        virtue:
          "من قالها حين يمسي ثلاث مرات لم تضره حمة تلك الليلة.",
      },
      {
        id: "e2",
        text: "بِسْمِ اللهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الأَرْضِ وَلَا فِي السَّمَاءِ وَهُوَ السَّمِيعُ العَلِيمُ",
        target: 3,
        current: 0,
        virtue: "من قالها ثلاث مرات لم تصبه فجأة بلاء.",
      },
      {
        id: "e3",
        text: "اللَّهُمَّ بِكَ أَمْسَيْنَا وَبِكَ أَصْبَحْنَا وَبِكَ نَحْيَا وَبِكَ نَمُوتُ وَإِلَيْكَ المَصِيرُ",
        target: 1,
        current: 0,
        virtue: "ذكر المساء المأثور عن النبي ﷺ.",
      },
    ],
  },
  {
    id: "after-prayer",
    name: "بعد الصلاة",
    icon: "mosque",
    adhkar: [
      {
        id: "p1",
        text: "سُبْحَانَ اللهِ",
        target: 33,
        current: 0,
        virtue: "التسبيح بعد كل صلاة ثلاثاً وثلاثين.",
      },
      {
        id: "p2",
        text: "الحَمْدُ لِلَّهِ",
        target: 33,
        current: 0,
        virtue: "التحميد بعد كل صلاة ثلاثاً وثلاثين.",
      },
      {
        id: "p3",
        text: "اللَّهُ أَكْبَرُ",
        target: 34,
        current: 0,
        virtue: "التكبير بعد كل صلاة أربعاً وثلاثين.",
      },
    ],
  },
];

export const WEEKLY_STATS: DailyStats[] = [
  { day: "سبت", count: 180, total: 250 },
  { day: "أحد", count: 250, total: 250 },
  { day: "إثنين", count: 200, total: 250 },
  { day: "ثلاثاء", count: 120, total: 250 },
  { day: "أربعاء", count: 230, total: 250 },
  { day: "خميس", count: 190, total: 250 },
  { day: "جمعة", count: 245, total: 250 },
];

export const MOST_READ = [
  { name: "سُبْحَانَ اللهِ وَبِحَمْدِهِ", count: 1254 },
  { name: "الحَمْدُ لِلَّهِ", count: 998 },
  { name: "اللَّهُ أَكْبَرُ", count: 876 },
  { name: "لَا إِلٰهَ إِلَّا اللهُ", count: 540 },
  { name: "أَسْتَغْفِرُ اللهَ", count: 430 },
];
