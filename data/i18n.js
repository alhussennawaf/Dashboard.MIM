/* English for the dashboard.
 *
 * Arabic stays the source of truth everywhere in the code: filters, chart
 * categories and table cells are all compared against the Arabic the source
 * files carry, and 91 places in index.html test those values directly. So
 * nothing here is applied to data. This file is read at the moment text is
 * drawn, and never before.
 *
 * `phrases` is keyed by the exact Arabic as it is written in the page or in
 * the data, whitespace normalised. A key that is missing simply shows its
 * Arabic, so an untranslated string is visible rather than blank.
 *
 * Translations follow Saudi usage: the occupational groups are the titles of
 * التصنيف السعودي الموحد للمهن, the regions are the thirteen administrative
 * regions as the Kingdom names them in English, and the sectors are the
 * ministry's own. Occupation names are not here: all 921 carry an English
 * name in the master sheet, which the page reads directly.
 */
window.MIM_EN = {

  /* ---- sections ---- */
  "نظرة عامة": "Overview",
  "التخصصات المهنية": "Vocational Specializations",
  "التخصصات الجامعية": "University Specializations",
  "المهن": "Occupations",
  "العاملون في سوق العمل": "Labour Market Workforce",
  "بيانات العاملين": "Workforce Data",
  "العرض والطلب": "Supply and Demand",
  "المناطق": "Regions",
  "الإطار الوطني للمؤهلات": "National Qualifications Framework",
  "البيانات": "Data",

  /* ---- masthead and global controls ---- */
  "خريجو التعليم المهني والجامعي في تخصصات قطاع الصناعة والتعدين":
    "Vocational and University Graduates in Industry and Mining Specializations",
  "وزارة الصناعة والثروة المعدنية": "Ministry of Industry and Mineral Resources",
  "سنة التخرج": "Graduation year",
  "الترتيب حسب": "Rank by",
  "الخريجون": "Graduates",
  "المتوظفون": "Employed",
  "تخطَّ إلى المحتوى": "Skip to content",
  "روابط عامة": "General links",
  "سياسة الخصوصية": "Privacy Policy",
  "الشروط والأحكام": "Terms and Conditions",

  /* ---- overview ---- */
  "نطاق البيانات:": "Data scope:",
  "نطاق البيانات": "Data scope",
  "إجمالي الخريجين": "Total graduates",
  "خريجو التعليم المهني والتقني": "Vocational and technical graduates",
  "خريجو الجامعات": "University graduates",
  "المهن المشمولة": "Occupations covered",
  "(المهن الأساسية والأساسية الداعمة)": "(core and core-supporting occupations)",
  "التخصصات": "Specializations",
  "الخريجون حسب سنة التخرج": "Graduates by graduation year",
  "المهني والتقني مقابل الجامعي": "Vocational and technical against university",
  "التوزيع حسب الجنس": "Distribution by gender",
  "الخريجون والمتوظفون منهم": "Graduates, and the employed among them",
  "حسب مستوى الإطار الوطني للمؤهلات": "By National Qualifications Framework level",
  "التوزيع الجغرافي": "Geographic distribution",
  "المناطق الإدارية": "Administrative regions",
  "أعلى التخصصات المهنية": "Leading vocational specializations",
  "أعلى التخصصات الجامعية": "Leading university specializations",
  "Top vocational specializations": "Ranked by graduates",
  "Top university specializations": "Ranked by graduates",
  "خريجو المهني والتقني": "Vocational and technical graduates",
  "متوظفو المهني والتقني": "Employed, vocational and technical",
  "متوظفو الجامعات": "Employed, university",
  "توزيع الخريجين على مستويات الإطار الوطني للمؤهلات (رسم بياني)":
    "Graduates across National Qualifications Framework levels (chart)",

  /* ---- words that recur across the page ---- */
  "غير متوفر": "Not available",
  "غير مصنّف": "Unclassified",
  "غير مصنف": "Unclassified",
  "(غير مصنف)": "(unclassified)",
  "غير مسجّلة": "Not recorded",
  "لا يوجد": "None",
  "نسبة التوظيف": "Employment rate",
  "نسبة التوطين": "Saudization rate",
  "مجموع العمالة": "Total workforce",
  "مجموع العاملين": "Total workers",
  "إجمالي العاملين": "Total workers",
  "العاملون السعوديون": "Saudi workers",
  "سعوديون": "Saudis",
  "غير سعوديين": "Non-Saudis",
  "عاملون غير سعوديون": "Non-Saudi workers",
  "عدد المهارات": "Number of skills",
  "المنشآت": "Establishments",
  "الإناث": "Women",
  "إعادة تعيين": "Reset",
  "مسح الفلاتر": "Clear filters",
  "مسح": "Clear",
  "جارٍ التصدير…": "Exporting…",
  "بطاقة PNG": "PNG card",
  "بطاقة 16:9": "16:9 card",

  /* ---- gender, nationality, and the controlled vocabularies ---- */
  "ذكر": "Male",
  "أنثى": "Female",
  "سعودي": "Saudi",
  "غير سعودي": "Non-Saudi",
  "الجنسية": "Nationality",
  "الجنس": "Gender",
  "المنطقة": "Region",
  "المدينة": "City",
  "الحجم": "Size",
  "النطاق": "Nitaqat band",
  "الحالة": "Status",
  "عالية": "High",
  "متوسطة": "Medium",
  "منخفضة": "Low",
  "مهارات عالية": "High skill",
  "مهارات متوسطة": "Medium skill",
  "مستوى المهارة": "Skill level",
  "أساسية": "Core",
  "أساسية داعمة": "Core supporting",
  "داعمة": "Supporting",
  "نوع المهنة": "Occupation type",
  "تصنيف المهنة": "Occupation classification",
  "كبيرة": "Large",
  "صغيرة": "Small",
  "متناهية الصغر": "Micro",
  "اخضر": "Green",
  "اخضر منخفض": "Low green",
  "اخضر متوسط": "Medium green",
  "اخضر مرتفع": "High green",
  "اخضر صغير (فئة أ)": "Small green (category A)",
  "بلاتيني": "Platinum",
  "احمر": "Red",
  "احمر صغير (فئة أ)": "Small red (category A)",
  "مستبعد": "Excluded",
  "( غير مصنف )": "(unclassified)",
  "الإنتاج": "In production",
  "الإنشاء": "Under construction",
  "متوقف": "Halted",

  /* ---- التصنيف السعودي الموحد للمهن: the major groups ---- */
  "المديرون": "Managers",
  "الاختصاصيّون": "Professionals",
  "الفنيّون والاختصاصيّون المساعدون": "Technicians and Associate Professionals",
  "عاملو الدعم المكتبي": "Clerical Support Workers",
  "عاملو الخدمات والمبيعات": "Service and Sales Workers",
  "العاملون المهرة في الزراعة والغابات ومزارع الأسماك":
    "Skilled Agricultural, Forestry and Fishery Workers",
  "عاملو الحرف ومن يرتبط بهم": "Craft and Related Trades Workers",
  "مشغّلو المصانع والآلات وعاملو التجميع": "Plant and Machine Operators and Assemblers",
  "المهن الأولية": "Elementary Occupations",
  "العاملون في القوات المسلحة": "Armed Forces Occupations",
  "المجموعة الرئيسية": "Major group",
  "المجموعة الفرعية": "Sub-major group",
  "المجموعة الثانوية": "Minor group",
  "الوحدة": "Unit group",

  /* ---- the thirteen administrative regions ---- */
  "منطقة الرياض": "Riyadh Region",
  "المنطقة الشرقية": "Eastern Region",
  "منطقة مكة المكرمة": "Makkah Region",
  "منطقة المدينة المنورة": "Madinah Region",
  "منطقة القصيم": "Qassim Region",
  "منطقة عسير": "Asir Region",
  "منطقة تبوك": "Tabuk Region",
  "منطقة حائل": "Hail Region",
  "منطقة جيزان": "Jazan Region",
  "منطقة نجران": "Najran Region",
  "منطقة الجوف": "Al-Jouf Region",
  "منطقة الحدود الشمالية": "Northern Borders Region",
  "منطقة الباحه": "Al-Baha Region",
  "الرياض": "Riyadh",
  "الشرقية": "Eastern Region",
  "مكة المكرمة": "Makkah",
  "المدينة المنورة": "Madinah",
  "القصيم": "Qassim",
  "عسير": "Asir",
  "تبوك": "Tabuk",
  "حائل": "Hail",
  "جيزان": "Jazan",
  "نجران": "Najran",
  "الجوف": "Al-Jouf",
  "الحدود الشمالية": "Northern Borders",
  "الباحة": "Al-Baha",
  "الباحه": "Al-Baha",

  /* ---- the ministry's industrial sectors ---- */
  "السيارات": "Automotive",
  "الطيران": "Aviation",
  "الصناعات البحرية": "Maritime Industries",
  "الآلات والمعدات": "Machinery and Equipment",
  "الكيماويات": "Chemicals",
  "مواد البناء": "Building Materials",
  "المعادن": "Metals",
  "التعدين": "Mining",
  "الأجهزة الطبية": "Medical Devices",
  "الأدوية": "Pharmaceuticals",
  "الأغذية": "Food",
  "الطاقة المتجددة": "Renewable Energy",
  "صناعات تحويلية أخرى": "Other Manufacturing",
  "القطاع": "Sector",
  "القطاع الصناعي": "Industrial sector",

  /* ---- qualifications and framework levels ---- */
  "بكالوريوس": "Bachelor's",
  "ماجستير": "Master's",
  "دكتوراه": "Doctorate",
  "دبلوم": "Diploma",
  "دبلوم عالي": "Higher diploma",
  "دبلوم متوسط": "Intermediate diploma",
  "دبلوم معاهد ثانوي صناعي": "Industrial secondary institute diploma",
  "زمالة": "Fellowship",
  "ثانوي صناعي": "Industrial secondary",
  "مستوى المؤهل": "Qualification level",
  "مستوى الإطار": "Framework level",
  "بكالوريوس أو ما يعادلها": "Bachelor's or equivalent",
  "المستوى ١": "Level 1",
  "المستوى ٢": "Level 2",
  "المستوى ٣": "Level 3",
  "المستوى ٤": "Level 4",
  "المستوى ٥": "Level 5",

  /* ---- vocational tracks ---- */
  "الكلية التقنية": "Technical College",
  "معاهد الشراكات الاستراتيجية": "Strategic Partnership Institutes",
  "الكليات التقنية العالمية": "International Technical Colleges",
  "نوع الجهة التعليمية": "Type of institution"
};

/* Phrases the page builds around a number. Each rule is tried in order
   against a whole text run, and the first that matches rewrites it, so a
   count keeps its place in an English sentence rather than being glued to a
   translated noun in Arabic word order. */
window.MIM_EN_PATTERNS = [
  [/^([\d,]+) مهنة · ([\d,]+) منشأة · (.+)$/,
   function (m) { return m[1] + " occupations · " + m[2] + " establishments · " + m[3]; }],
  [/^([\d,]+) من ([\d,]+) مهنة$/,
   function (m) { return m[1] + " of " + m[2] + " occupations"; }],
  [/^([\d,]+) من ([\d,]+)$/, function (m) { return m[1] + " of " + m[2]; }],
  [/^([\d,]+) مهنة · ([\d,]+) منها لها عرض مرتبط$/,
   function (m) { return m[1] + " occupations · " + m[2] + " with linked supply"; }],
  [/^([\d,]+) مهنة$/, function (m) { return m[1] + " occupations"; }],
  [/^([\d,]+) منشأة$/, function (m) { return m[1] + " establishments"; }],
  [/^([\d,]+) جامعة$/, function (m) { return m[1] + " universities"; }],
  [/^([\d,]+) عاملة$/, function (m) { return m[1] + " women"; }],
  [/^خلال (\d+) سنوات$/, function (m) { return "across " + m[1] + " years"; }],
  [/^نسبة التوطين (.+)$/, function (m) { return "Saudization " + m[1]; }],
  [/^نسبة التوظيف (.+)$/, function (m) { return "Employment rate " + m[1]; }],
  [/^Vocational · (.+) من الإجمالي$/, function (m) { return "Vocational · " + m[1] + " of the total"; }],
  [/^University · (.+) من الإجمالي · ([\d,]+) جامعة$/,
   function (m) { return "University · " + m[1] + " of the total · " + m[2] + " universities"; }],
  [/^(.+) من مجموع العاملين$/, function (m) { return m[1] + " of all workers"; }],
  [/^([\d,]+) مهني · ([\d,]+) جامعي في العلوم والهندسة$/,
   function (m) { return m[1] + " vocational · " + m[2] + " university, science and engineering"; }],
  [/^منشأة بها عمالة مسجّلة$/, function () { return "establishments with recorded workers"; }],
  [/^غير متأثر بالتصفية الحالية$/, function () { return "not affected by the current filter"; }],
  [/^وظائف قائمة$/, function () { return "filled posts"; }]
];

/* The shell: the masthead title, the hero, and the notice bar. The hero is a
   React island whose text arrives as props, so these are looked up before it
   renders rather than after. */
Object.assign(window.MIM_EN, {
  "مسار الكفاءات الوطنية إلى قطاع الصناعة والتعدين":
    "The national talent pathway into the industry and mining sector",
  "إحصاءات الخريجين · GRADUATE STATISTICS": "GRADUATE STATISTICS",
  "إجمالي الخريجين · Graduates": "Total graduates",
  "المتوظفون · Employed": "Employed",
  "المهن · Occupations": "Occupations",
  "التخصصات · Specializations": "Specializations",
  "لا يستخدم هذا الموقع ملفات ارتباط (Cookies)، ولا يجمع بيانات شخصية. تُقاس الزيارات بخدمة إحصاء لا تتعقّب الزائر.":
    "This site sets no cookies and collects no personal data. Visits are counted by an analytics service that does not track the visitor.",
  "حسنًا": "Got it",
  "جارٍ تحميل البيانات…": "Loading data…"
});

/* Spellings the sources differ on, and the series the trend chart names. */
Object.assign(window.MIM_EN, {
  "جازان": "Jazan",
  "منطقة جازان": "Jazan Region",
  "خريجو المهني والتقني": "Vocational and technical graduates",
  "متوظفو المهني والتقني": "Employed, vocational and technical",
  "خريجو الجامعات": "University graduates",
  "متوظفو الجامعات": "Employed, university"
});

/* Qualification names the framework cannot place on one level. */
Object.assign(window.MIM_EN, {
  "أخرى": "Other",
  "غير محدد": "Unspecified"
});
