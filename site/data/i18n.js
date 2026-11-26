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

/* ======================================================================== */
/*  The remaining nine sections                                              */
/* ======================================================================== */
Object.assign(window.MIM_EN, {

  /* ---- shared across sections ---- */
  "المهنة": "Occupation",
  "الرمز": "Code",
  "الفئة": "Category",
  "القطاعات": "Sectors",
  "المستوى": "Level",
  "الوصف": "Description",
  "السنة": "Year",
  "الجهة": "Institution",
  "المسار": "Track",
  "المؤهل": "Qualification",
  "التخصص": "Specialization",
  "النسبة": "Rate",
  "ملخص الفترة": "Summary for the period",
  "العربية": "العربية",
  "التبديل إلى العربية": "Switch to Arabic",
  "أغسطس 2026": "August 2026",
  "المرحلة المتوسطة": "Intermediate stage",

  /* ---- المهن ---- */
  "بحث بالاسم العربي أو الإنجليزي أو الرمز أو التخصص…":
    "Search by Arabic or English name, code, or specialization…",
  "من 921 صفًا في المصدر. تكرار رمز المهنة يعني أن للمهنة تخصصات مهنية، وتُعرض داخل صفحة المهنة لا بجانبها.":
    "From 921 rows in the source. A repeated occupation code means the occupation has vocational specializations, which are shown inside its page rather than beside it.",

  /* ---- العاملون في سوق العمل ---- */
  "جدول العاملين": "Workforce table",
  "صفّه بنوع المهنة ومستوى المهارة، ورتّبه بالضغط على رأس أي عمود · اضغط صفًا لفتح صفحة المهنة":
    "Filter by occupation type and skill level, sort by clicking any column heading, and click a row to open the occupation",
  "تصدير جدول العاملين (CSV)": "Export workforce table (CSV)",
  "التوطين حسب فئة المهنة": "Saudization by occupation category",
  "توزيع المهن حسب نسبة التوطين": "Occupations by Saudization rate",
  "طول الشريط عدد الوظائف في الشريحة، وبين القوسين عدد المهن":
    "Bar length is the number of posts in the band; the bracket gives the number of occupations",
  "التوطين حسب القطاع الصناعي": "Saudization by industrial sector",
  "المهنة الواحدة قد تخدم أكثر من قطاع فتُحتسب في كلٍّ منها":
    "An occupation may serve more than one sector and is counted in each",
  "أكبر المهن توظيفًا": "Largest occupations by employment",
  "بترتيب مجموع العمالة": "Ranked by total workforce",
  "أكبر أعداد العاملين غير السعوديين": "Largest non-Saudi workforces",
  "بترتيب عدد الوظائف التي يشغلها غير سعوديين": "Ranked by posts held by non-Saudis",
  "التوطين حسب مستوى المؤهل المطلوب": "Saudization by required qualification level",
  "المستوى بحسب التصنيف السعودي للمهن، من قائمة المهن المعتمدة":
    "Level per the Saudi occupational classification, from the approved occupation list",
  "التوطين حسب المجموعة الرئيسية": "Saudization by major group",
  "تصنيف المهن الرئيسي": "Principal occupational classification",

  /* ---- بيانات العاملين ---- */
  "تصدير بيانات العاملين (CSV)": "Export workforce data (CSV)",
  "توزيع العاملين على القطاعات الاقتصادية": "Workers by economic sector",
  "المنشأة الواحدة قد تعمل في أكثر من قطاع فتُحتسب عمالتها في كلٍّ منها، ولذلك يزيد مجموع الأشرطة على إجمالي العاملين · بين القوسين عدد المنشآت":
    "An establishment may operate in more than one sector and its workers are counted in each, so the bars sum to more than the total workforce · the bracket gives the number of establishments",
  "توزيع العاملين على المجموعات الرئيسية": "Workers by major occupational group",
  "التصنيف السعودي الموحّد للمهن": "Saudi Standard Classification of Occupations",
  "توزيع العاملين على المناطق الإدارية": "Workers by administrative region",
  "بين القوسين عدد المنشآت في المنطقة": "The bracket gives the number of establishments in the region",
  "بين القوسين عدد المنشآت": "The bracket gives the number of establishments",
  "إحصائيات العاملين حسب حجم المنشأة": "Workers by establishment size",
  "إحصائيات العاملين حسب نطاق المنشأة": "Workers by Nitaqat band",
  "نطاقات برنامج نطاقات · بين القوسين عدد المنشآت":
    "Nitaqat programme bands · the bracket gives the number of establishments",
  "توزيع العاملين حسب مستوى المهارة": "Workers by skill level",
  "مستوى المهارة كما ورد في المصدر، و«غير مصنف» فئة قائمة فيه لا تقدير لها":
    "Skill level as the source records it; “Unclassified” is a category of its own there, not an estimate",
  "توزيع العاملين حسب تصنيف المهن": "Workers by occupation classification",
  "أساسية وأساسية داعمة وداعمة · و«غير مصنف» مهن خارج إطار قطاع الصناعة والتعدين":
    "Core, core-supporting and supporting · “Unclassified” are occupations outside the industry and mining framework",
  "جدول العاملين حسب المهنة": "Workforce by occupation",
  "ابحث بالاسم أو الرمز، صفّه بالمجموعة أو التصنيف أو المهارة، ورتّب بالضغط على رأس أي عمود":
    "Search by name or code, filter by group, classification or skill, and sort by clicking any column heading",
  "ابحث عن مهنة أو رمز": "Search for an occupation or code",
  "ابحث عن مهنة": "Search for an occupation",
  "كل العاملين المسجّلين في المنشآت الصناعية: 1,701 مهنة في 15,017 منشأة. المصدر بيانات المركز الوطني للمعلومات عن أغسطس 2026.":
    "All workers recorded in industrial establishments: 1,701 occupations across 15,017 establishments. Source: National Information Center data for August 2026.",

  /* ---- العرض والطلب ---- */
  "بحث في المهن…": "Search occupations…",
  "جدول العرض والطلب": "Supply and demand table",
  "تصدير الجدول (CSV)": "Export table (CSV)",
  "العرض مقابل الطلب في أكبر المهن": "Supply against demand in the largest occupations",
  "الشريط الكامل مجموع العمالة والمملوء منه السعوديون · الرقم المقابل خريجو التخصصات المرتبطة":
    "The full bar is the total workforce and the filled part is Saudis · the figure opposite is graduates of the linked specializations",
  "العرض والطلب حسب القطاع": "Supply and demand by sector",
  "مجموع كل قطاع ضمن التصفية": "Each sector's total within the current filter",
  "العاملون غير السعوديين مقابل العرض السنوي": "Non-Saudi workers against annual supply",
  "المهن المرتبطة فقط": "Linked occupations only",
  "العاملون": "Workers",
  "العرض (خريجون)": "Supply (graduates)",
  "المؤهل المطلوب": "Required qualification",
  "خريج لكل فرصة": "Graduates per post",

  /* ---- المناطق ---- */
  "خريطة المناطق": "Regions map",
  "اضغط منطقة لعرض بياناتها، ومن داخلها يمكنك مقارنتها بأخرى · الأغمق أكثر خريجين":
    "Click a region for its figures, and compare it with another from inside · darker means more graduates",
  "ترتيب المناطق": "Regions ranked",
  "أعداد الخريجين حسب منطقة الجهة التعليمية، من مصدري المهني والتقني والجامعات.":
    "Graduate counts by the region of the educating institution, from the vocational and university sources.",
  "تصدير كل المناطق (CSV)": "Export all regions (CSV)",
  "المتوظفون من الخريجين": "Employed, of the graduates",
  "في مصدرها، فلا تظهر هنا؛ ووضع رقم وطني على بطاقة منطقة يُقرأ على أنه رقمها.":
    "in their source, so they are not shown here; a national figure on a region card would be read as that region's own.",

  /* ---- الإطار الوطني للمؤهلات ---- */
  "مستويات الإطار الوطني للمؤهلات": "National Qualifications Framework levels",
  "عدد المهن والخريجين المسكّنين في كل مستوى": "Occupations and graduates placed at each level",
  "المؤهلات المسكّنة": "Qualifications placed",
  "المهن حسب المستوى": "Occupations by level",
  "الخريجون حسب المستوى": "Graduates by level",
  "دبلوم عال": "Higher diploma",
  "دبلوم مشارك": "Associate diploma",

  /* ---- البيانات ---- */
  "جدول البيانات الكامل": "Full data table",

  /* ---- التخصصات ---- */
  "بحث في التخصصات المهنية…": "Search vocational specializations…",
  "بحث في كل التخصصات الجامعية…": "Search all university specializations…"
});

/* Sentences the page assembles around a figure. */
window.MIM_EN_PATTERNS.push(
  [/^(\d+) تخصص مهني$/, function (m) {
    return m[1] + (m[1] === "1" ? " vocational specialization" : " vocational specializations"); }],
  [/^(.+): ([\d,]+) خريجًا$/, function (m) {
    return window.MIM_T(m[1]) + ": " + m[2] + " graduates"; }],
  [/^([\d,]+) مهنة · لقطة حالية بلا سنة ولا منطقة$/, function (m) {
    return m[1] + " occupations · current snapshot, no year and no region"; }],
  [/^يعرض أول ([\d,]+) من ([\d,]+)\. حدّد البحث أكثر\.$/, function (m) {
    return "Showing the first " + m[1] + " of " + m[2] + ". Narrow the search."; }],
  [/^يعرض ([\d,]+) من ([\d,]+) صفًا مصدريًا ضمن السنوات المحددة، مرتبة تنازليًا حسب عدد الخريجين\.$/,
   function (m) {
    return "Showing " + m[1] + " of " + m[2] + " source rows within the selected years, " +
           "ordered by graduates, highest first."; }],
  [/^([\d,]+) occupations · ([\d,]+) establishments · (.+)$/, function (m) {
    return m[1] + " occupations · " + m[2] + " establishments · " + window.MIM_T(m[3]); }],
  [/^(.+) حسب المنطقة$/, function (m) { return window.MIM_T(m[1]) + " by region"; }]
);

/* Exact phrases that must beat a looser pattern, and two spellings the
   sources differ on. A key is matched before any pattern is tried. */
Object.assign(window.MIM_EN, {
  "نسبة التوظيف حسب المنطقة": "Employment rate by region",
  "نسبة التوطين حسب المنطقة": "Saudization rate by region",
  "عاملون غير سعوديين": "Non-Saudi workers",
  "المنطقة (العرض فقط)": "Region (supply only)"
});

/* Stat tiles and the two series the supply and regions charts name. */
Object.assign(window.MIM_EN, {
  "مهن بلا سعوديين": "Occupations with no Saudis",
  "مهن يشغلها سعوديون": "Fully Saudized occupations",
  "مهن توطينها كامل": "Fully Saudized occupations",
  "متوسط التوطين للمهنة": "Average Saudization per occupation",
  "غير مرجّح بالحجم": "Unweighted by size",
  "القطاعات الصناعية": "Industrial sectors",
  "قد تخدم المهنة أكثر من قطاع": "An occupation may serve more than one sector",
  "الطلب: إجمالي العاملين": "Demand: total workers",
  "العرض: الخريجون المرتبطون": "Supply: linked graduates",
  "تغطية الربط": "Linkage coverage",
  "خريجون لكل وظيفة غير مشغولة بسعودي": "Graduates per post not held by a Saudi",
  "الطلب المغطّى بالربط": "Demand covered by linkage",
  "عرض بلا تكرار ÷ فرص المهن المرتبطة":
    "Deduplicated supply ÷ posts in the linked occupations",
  "الخريجون المرتبطون": "Linked graduates",
  "منهم خريجو الجامعات": "of which university graduates",
  "بلا سعوديين": "No Saudis",
  "أقل من ١٠٪": "Under 10%",
  "١٠٪ – ٢٥٪": "10% – 25%",
  "٢٥٪ – ٥٠٪": "25% – 50%",
  "٥٠٪ – ٧٥٪": "50% – 75%",
  "٧٥٪ فأعلى": "75% and above",
  "آخر تحديث الربع الثالث 2026.": "Last updated Q3 2026.",
  "بيانات العاملين في المهن الأساسية والأساسية الداعمة ضمن المهارات العالية والمتوسطة. لا يشمل المهن الأساسية والأساسية الداعمة للمهارات الدنيا، ولا يشمل المهن الداعمة. (الربع الثالث 2026)":
    "Workers in core and core-supporting occupations at high and medium skill. It excludes core and core-supporting occupations at low skill, and excludes supporting occupations. (Q3 2026)"
});

window.MIM_EN_PATTERNS.push(
  [/^([\d,]+) وظيفة يشغلها غير سعوديين$/, function (m) {
    return m[1] + " posts held by non-Saudis"; }],
  [/^([\d,]+) وظيفة بنسبة صفر$/, function (m) { return m[1] + " posts at zero"; }],
  [/^([\d,]+) وظيفة بنسبة ١٠٠٪$/, function (m) { return m[1] + " posts at 100%"; }],
  [/^([\d,]+) وظيفة$/, function (m) { return m[1] + " posts"; }],
  [/^([\d,]+) مهنة ضمن التصفية$/, function (m) {
    return m[1] + " occupations within the filter"; }],
  [/^([\d,]+) تخصصًا مميزًا · محسوب مرة واحدة دون تكرار$/, function (m) {
    return m[1] + " distinct specializations · counted once, without duplication"; }],
  [/^([\d,]+) مهنة بلا تخصص مرتبط$/, function (m) {
    return m[1] + " occupations with no linked specialization"; }],
  [/^(.+) من وظائف التصفية$/, function (m) { return m[1] + " of the posts in the filter"; }],
  [/^(.+) \(([\d,]+) مهنة\)$/, function (m) {
    return window.MIM_T(m[1]) + " (" + m[2] + " occupations)"; }],
  [/^(أساسية داعمة|أساسية|داعمة) · (مهارات عالية|مهارات متوسطة)$/, function (m) {
    return window.MIM_T(m[1]) + " · " + window.MIM_T(m[2]); }],
  [/^من ([\d,]+) قطاعًا فرعيًا$/, function (m) { return "of " + m[1] + " sub-sectors"; }],
  [/^([\d,]+) مهام رئيسية$/, function (m) { return m[1] + " main tasks"; }]
);

Object.assign(window.MIM_EN, {
  "نطاق الصفحة:": "Page scope:",
  "مرتب تنازليًا حسب عدد العاملين غير السعوديين · «غير مرتبط» تعني أن مجال المهنة التعليمي لا يقابله تخصص جامعي بالاسم نفسه · عمود العرض هو حوض الخريجين الذي تسحب منه المهنة، وقد تتشارك فيه عدة مهن فلا يصح جمعه عموديًا":
    "Ordered by non-Saudi workers, highest first · “Not linked” means the occupation's education field has no university specialization of the same name · the supply column is the pool of graduates the occupation draws on, and several occupations may share one, so it cannot be added down",
  "غير مرتبط": "Not linked"
});

/* ======================================================================== */
/*  University specializations                                              */
/*  The four levels the Ministry of Education reports against (general,      */
/*  narrow, detailed, specialization), and the 88 majors beneath them.       */
/* ======================================================================== */
Object.assign(window.MIM_EN, {
  /* general */
  "العلوم الطبيعية والرياضيات والإحصاء": "Natural Sciences, Mathematics and Statistics",
  "الهندسة والتصنيع والبناء": "Engineering, Manufacturing and Construction",
  /* narrow */
  "العلوم البيولوجية والعلوم المتصلة بها": "Biological and Related Sciences",
  "الهندسة والحرف الهندسية": "Engineering and Engineering Trades",
  "العلوم الفيزيائية": "Physical Sciences",
  "الرياضيات والإحصاء": "Mathematics and Statistics",
  "التصنيع والمعالجة": "Manufacturing and Processing",
  "البيئة": "Environment",
  "الهندسة المعمارية والبناء": "Architecture and Construction",
  "برامج ومؤهلات متعددة التخصصات تتضمن الهندسة والتصنيع والبناء":
    "Inter-disciplinary programmes involving engineering, manufacturing and construction",
  "برامج غير محددة في الهندسة والتصنيع والبناء":
    "Engineering, manufacturing and construction, not further defined",
  "برامج أخرى في العلوم الطبيعية والرياضيات والإحصاء غير مصنفة في مكان آخر":
    "Natural sciences, mathematics and statistics not elsewhere classified",
  /* detailed */
  "علم الأحياء البيولوجيا": "Biology",
  "الهندسة والمعالجات الكيميائية": "Chemical Engineering and Processes",
  "برامج أخرى في الهندسة والحرف الهندسية غير مصنفة في مكان آخر":
    "Engineering and engineering trades not elsewhere classified",
  "علوم الأرض": "Earth Sciences",
  "الكهرباء والطاقة": "Electricity and Energy",
  "الإلكترونيات والأتمتة": "Electronics and Automation",
  "الصناعات الغذائية": "Food Processing",
  "علوم البيئة": "Environmental Sciences",
  "الميكانيك والحرف المعدنية": "Mechanics and Metal Trades",
  "البناء والهندسة المدنية": "Building and Civil Engineering",
  "الهندسة المعمارية وتخطيط المدن": "Architecture and Town Planning",
  "النسيج الملابس، الأحذية، الجلود": "Textiles, Clothing, Footwear and Leather",
  "السيارات والسفن والطائرات": "Motor Vehicles, Ships and Aircraft",
  "المناجم والتنقيب": "Mining and Extraction",
  "تقنية حماية البيئة": "Environmental Protection Technology",
  "البيئة الطبيعية والحياة البرية": "Natural Environment and Wildlife",
  "برامج غير محددة في العلوم الفيزيائية": "Physical sciences, not further defined",
  "برامج غير محددة في الهندسة المعمارية والبناء":
    "Architecture and construction, not further defined",
  "برامج أخرى في العلوم الفيزيائية غير مصنفة في مكان آخر":
    "Physical sciences not elsewhere classified",
  /* the 88 majors */
  "الأحياء العامة": "General Biology",
  "الهندسة الكيميائية": "Chemical Engineering",
  "الفيزياء": "Physics",
  "الرياضيات": "Mathematics",
  "الأحياء الدقيقة": "Microbiology",
  "الهندسة الصناعية والنظم": "Industrial and Systems Engineering",
  "الفلك": "Astronomy",
  "الهندسة الطبية الحيوية": "Biomedical Engineering",
  "نظم المعلومات الجغرافية": "Geographic Information Systems",
  "هندسة الطاقة": "Energy Engineering",
  "الهندسة الكهربائية": "Electrical Engineering",
  "هندسة الحاسب الآلي": "Computer Engineering",
  "التغذية وعلوم الأطعمة": "Nutrition and Food Science",
  "العلوم البيئية": "Environmental Science",
  "الهندسة الميكانيكية": "Mechanical Engineering",
  "الهندسة المدنية": "Civil Engineering",
  "علوم صحة البيئة": "Environmental Health Science",
  "الإحصاء": "Statistics",
  "الجيوفيزياء": "Geophysics",
  "الكيمياء": "Chemistry",
  "علوم الحيوان": "Zoology",
  "الجغرافيا": "Geography",
  "الهندسة المعمارية": "Architectural Engineering",
  "الملابس والنسيج": "Clothing and Textiles",
  "هندسة الطيران": "Aeronautical Engineering",
  "هندسة وإدارة التشييد": "Construction Engineering and Management",
  "هندسة النقل": "Transport Engineering",
  "هندسة الإلكترونيات": "Electronics Engineering",
  "تقنية هندسة الحاسب الآلي": "Computer Engineering Technology",
  "التخطيط الحضري والإقليمي": "Urban and Regional Planning",
  "الإدارة الهندسية": "Engineering Management",
  "الفيزياء الطبية": "Medical Physics",
  "هندسة الشبكات": "Network Engineering",
  "هندسة التعدين": "Mining Engineering",
  "التقنية الحيوية": "Biotechnology",
  "تقنية الهندسة الكهربائية": "Electrical Engineering Technology",
  "فيزياء الحالة المكثفة": "Condensed Matter Physics",
  "علم الأحياء الجزيئية والخلوية": "Molecular and Cell Biology",
  "علوم النبات": "Botany",
  "تقنية هندسة المساحة": "Surveying Engineering Technology",
  "هندسة نظم التحكم والقياس": "Control and Instrumentation Engineering",
  "هندسة الإنشاءات": "Structural Engineering",
  "الكيمياء الصناعية": "Industrial Chemistry",
  "الفيزياء الكيميائية": "Chemical Physics",
  "المفصليات والطفيليات": "Arthropods and Parasitology",
  "تقنية الهندسة الصناعية": "Industrial Engineering Technology",
  "الجيوماتكس": "Geomatics",
  "فيزياء البصريات": "Optical Physics",
  "علم الأدوية": "Pharmacology",
  "هندسة المساحة": "Surveying Engineering",
  "بحوث العمليات الرياضية": "Operations Research",
  "هندسة المواد": "Materials Engineering",
  "علم السموم": "Toxicology",
  "الجيولوجيا": "Geology",
  "الكيمياء غير العضوية": "Inorganic Chemistry",
  "تقنية الهندسة الميكانيكية": "Mechanical Engineering Technology",
  "المساحة البحرية": "Hydrographic Surveying",
  "الهندسة البيئية": "Environmental Engineering",
  "حماية البيئة": "Environmental Protection",
  "العمارة": "Architecture",
  "الهندسة النووية": "Nuclear Engineering",
  "هندسة التصنيع الغذائي": "Food Manufacturing Engineering",
  "العلوم الاكتوارية": "Actuarial Science",
  "الكيمياء العضوية": "Organic Chemistry",
  "الهندسة البحرية": "Marine Engineering",
  "تقنية الهندسة الكيميائية": "Chemical Engineering Technology",
  "تقنية هندسة النفط والغاز الطبيعي": "Oil and Natural Gas Engineering Technology",
  "الفيزياء النووية": "Nuclear Physics",
  "الأدلة الجنائية": "Forensic Science",
  "الكيمياء التحليلية": "Analytical Chemistry",
  "الكيمياء الفيزيائية": "Physical Chemistry",
  "تقنية هندسة الإنشاءات": "Structural Engineering Technology",
  "الأرصاد": "Meteorology",
  "علم الوراثة": "Genetics",
  "تخصص غير محدد في العلوم الفيزيائية": "Physical sciences, specialization not defined",
  "علوم وإدارة موارد المياه": "Water Resources Science and Management",
  "تقنية الهندسة النووية": "Nuclear Engineering Technology",
  "تخصص غير محدد في الهندسة والتصنيع والبناء":
    "Engineering, manufacturing and construction, specialization not defined",
  "هنـدسـة النفط والغاز الطبيعي": "Oil and Natural Gas Engineering",
  "تقنية هندسة الأجهزة الطبية": "Medical Devices Engineering Technology",
  "علم وتقنية النانو": "Nanoscience and Nanotechnology",
  "تقنية هندسة الطاقة": "Energy Engineering Technology",
  "تخصص غير محدد في الهندسة المعمارية والبناء":
    "Architecture and construction, specialization not defined",
  "تخصصات أخرى في العلوم الفيزيائية غير مصنفة في مكان آخر":
    "Other physical sciences not elsewhere classified",
  "تخصصات أخرى في العلوم الطبيعية والرياضيات والإحصاء غير مصنفة في مكان آخر":
    "Other natural sciences, mathematics and statistics not elsewhere classified",
  "المحركات والمركبات": "Engines and Vehicles"
});
Object.assign(window.MIM_EN, { "الكيمياء الحيوية": "Biochemistry" });

/* ======================================================================== */
/*  Vocational specializations                                              */
/*  256 of the 336 already carry an English name in the source, from the     */
/*  international and strategic-partnership tracks. These are the other 80.  */
/* ======================================================================== */
Object.assign(window.MIM_EN, {
  "الدعم الفني للحاسب": "Computer Technical Support",
  "ميكانيكا السيارات": "Automotive Mechanics",
  "التشييد": "Construction",
  "خياطة وانتاج الملابس": "Sewing and Garment Production",
  "إدارة الفعاليات": "Event Management",
  "الكهرباء الصناعية": "Industrial Electricity",
  "اللحام": "Welding",
  "التبريد وتكييف الهواء": "Refrigeration and Air Conditioning",
  "الحاسب الآلي": "Computing",
  "إنتاج كيميائي": "Chemical Production",
  "الإدارة العامة": "Public Administration",
  "القوى الكهربائية": "Electrical Power",
  "العناية بالبشرة والمكياج": "Skincare and Make-up",
  "الإدارة المكتبية": "Office Administration",
  "العناية بالشعر وتسريحه": "Hair Care and Styling",
  "المحاسبة": "Accounting",
  "التسويق": "Marketing",
  "الإنشاءات المعمارية": "Architectural Construction",
  "المراقبة المعمارية": "Architectural Inspection",
  "إدارة الموارد البشرية": "Human Resources Management",
  "إدارة أنظمة الشبكات": "Network Systems Administration",
  "تشغيل آلات الإنتاج": "Production Machine Operation",
  "تشغيل آلات التحكم الرقمي بالحاسب CNC": "CNC Machine Operation",
  "الإنتاج الميكانيكي": "Mechanical Production",
  "تصميم الأزياء": "Fashion Design",
  "صيانة الأجهزة الذكية": "Smart Device Maintenance",
  "التأمين": "Insurance",
  "السلامة والصحة المهنية": "Occupational Safety and Health",
  "قوى وآلات كهربائية": "Electrical Power and Machines",
  "الفندقة": "Hotel Operations",
  "إدارة المستودعات": "Warehouse Management",
  "الوسائط المتعددة وتقنيات الويب": "Multimedia and Web Technologies",
  "الكهرباء الإنشائية": "Construction Electrical",
  "اتصالات": "Telecommunications",
  "المساحة": "Surveying",
  "برمجيات الحاسب": "Computer Software",
  "الإلكترونيات الصناعية والتحكم": "Industrial Electronics and Control",
  "المختبرات الكيميائية": "Chemical Laboratories",
  "شبكات الحاسب": "Computer Networks",
  "الإلكترونيات": "Electronics",
  "التزيين النسائي- التجميل": "Women's Beauty and Cosmetology",
  "الألآت والمعدات الكهربائية": "Electrical Machines and Equipment",
  "هندسة مدنية تطبيقية": "Applied Civil Engineering",
  "دعم أنظمة شبكات الحاسب": "Computer Network Systems Support",
  "الأمن السيبراني": "Cybersecurity",
  "صيانة الآلات الميكانيكية": "Mechanical Machinery Maintenance",
  "أجهزة و آلات دقيقة": "Precision Instruments and Machines",
  "السفر والسياحة": "Travel and Tourism",
  "خدمة الطعام": "Food Service",
  "الطباعة الآلية": "Machine Printing",
  "التجارة الالكترونية": "E-Commerce",
  "تصنيع غذائي": "Food Manufacturing",
  "الارشاد السياحي": "Tourist Guidance",
  "محركات ومركبات": "Engines and Vehicles",
  "سلامة الاغذية": "Food Safety",
  "التطبيقات المكتبية وصيانة الحاسب الآلي للمعوقين سمعياً":
    "Office Applications and Computer Maintenance for the Hearing Impaired",
  "إدارة الخدمات اللوجستية": "Logistics Services Management",
  "التصميم و التجهيز الطباعي": "Print Design and Prepress",
  "المعدات الثقيلة": "Heavy Equipment",
  "كهرباء وإلكترونيات السيارات": "Automotive Electrical and Electronics",
  "التمديدات الصحية": "Plumbing",
  "الصفائح المعدنية": "Sheet Metal",
  "الإنشاءات المدنية": "Civil Construction",
  "تشكيل و تركيب الألمنيوم والـUpvc": "Aluminium and uPVC Forming and Installation",
  "النجارة العامة": "General Carpentry",
  "المراقبة المدنية": "Civil Inspection",
  "تقنية الأجهزة الطبية": "Medical Devices Technology",
  "الرسم المعماري": "Architectural Drafting",
  "غير محدد": "Not specified",
  "إنتاج الطعام": "Food Production",
  "التصوير الضوئي - الفوتوغرافي": "Photography",
  "التجليد": "Bookbinding",
  "تقنية الميكاترونيكس": "Mechatronics Technology",
  "إنتاج الدواجن": "Poultry Production",
  "خدمات الحج والعمرة": "Hajj and Umrah Services",
  "تقنية التصميم الداخلي": "Interior Design Technology",
  "إدارة الضيافة": "Hospitality Management",
  "المصاعد الكهربائية": "Electric Elevators"
});

/* The education fields the occupation records point at. */
Object.assign(window.MIM_EN, {
  "التسيير والإدارة": "Management and Administration",
  "برامج الهندسة والحرف الهندسية": "Engineering and Engineering Trades Programmes",
  "برامج الهندسة والتصنيع والبناء": "Engineering, Manufacturing and Construction Programmes",
  "برامج التصنيع والمعالجة": "Manufacturing and Processing Programmes",
  "تصميم وإدارة قواعد البيانات والشبكات": "Database and Network Design and Administration",
  "تطوير وتحليل البرمجيات والتطبيقات": "Software and Applications Development and Analysis",
  "برامج أخرى في تقنية الاتصالات والمعلومات غير مصنفة في مكان آخر":
    "Information and communication technologies not elsewhere classified",
  "المواد (الزجاج، الورق، البلاستيك، الخشب)": "Materials (glass, paper, plastic, wood)",
  "برامج متعددة التخصصات تتضمن الهندسة والتصنيع والبناء":
    "Inter-disciplinary programmes involving engineering, manufacturing and construction",
  "الكهرباء و الطاقة": "Electricity and Energy",
  "الصحة والسلامة المهنية": "Occupational Health and Safety",
  "حماية الأفراد والملكية": "Protection of Persons and Property",
  "الصيدلة": "Pharmacy",
  "علم الأحياء (البيولوجيا)": "Biology",
  "المنسوجات (ملابس، أحذية، جلود)": "Textiles (clothing, footwear, leather)",
  "النسيج (الملابس، الأحذية، الجلود)": "Textiles (clothing, footwear, leather)",
  "برامج أخرى في الزراعة غير مصنفة في مكان آخر": "Agriculture not elsewhere classified",
  "الموضة والتصميم الداخلي والصناعي": "Fashion, Interior and Industrial Design",
  "المحاسبة والضرائب": "Accounting and Taxation",
  "الأدب وعلوم اللغات": "Literature and Linguistics",
  "التشخيص الطبي وتقنية العلاج": "Medical Diagnostic and Treatment Technology",
  "الإلمام بالقراءة والكتابة والحساب": "Literacy and Numeracy",
  "تنمية المهارات والتنمية الشخصية": "Skills and Personal Development"
});

/* The ministry's sectors as the Center's extract writes them: a code, a
   dash, then the name. The whole string is the key so the code stays put. */
Object.assign(window.MIM_EN, {
  "1 - الأجهزة والمستلزمات الطبية": "1 - Medical Devices and Supplies",
  "2 - الادوية": "2 - Pharmaceuticals",
  "3 - الاستزراع المائي": "3 - Aquaculture",
  "4 - الأغذية": "4 - Food",
  "5 - الالات والمعدات": "5 - Machinery and Equipment",
  "6 - السيارات": "6 - Automotive",
  "7 - الصناعات البحرية": "7 - Maritime Industries",
  "8 - الطيران": "8 - Aviation",
  "9 - العسكرية": "9 - Military",
  "10 - الكيماويات الأساسية والمتوسطة": "10 - Basic and Intermediate Chemicals",
  "11 - الكيماويات المتخصصة": "11 - Specialty Chemicals",
  "12 - صناعة المعادن": "12 - Metals Manufacturing",
  "13 - مصادر الطاقة المتجددة": "13 - Renewable Energy Sources",
  "14 - منتجات البلاستيك والمطاط": "14 - Plastic and Rubber Products",
  "15 - منتجات تكرير النفط": "15 - Refined Petroleum Products",
  "16 - مواد البناء": "16 - Building Materials",
  "99 - القطاعات أخرى": "99 - Other Sectors"
});

/* A sector or band drawn with its establishment count beside it. */
window.MIM_EN_PATTERNS.push(
  [/^(.+?)\s+\(([\d,]+) منشأة\)$/, function (m) {
    return window.MIM_T(m[1]) + "  (" + m[2] + " establishments)"; }],
  [/^(.+?)\s+\(عرض ([\d,]+)\)$/, function (m) {
    return window.MIM_T(m[1]) + "  (supply " + m[2] + ")"; }]
);

/* ======================================================================== */
/*  Occupations in بيانات العاملين that the master sheet does not carry      */
/*  521 of the 1,701 take their English from the master sheet. These are     */
/*  the rest, ordered as they were written: by the workers behind them.      */
/* ======================================================================== */
Object.assign(window.MIM_EN, {
  "مندوب مبيعات": "Sales Representative",
  "سائق شاحنة ثقيلة": "Heavy Truck Driver",
  "أخصائي تسويق": "Marketing Specialist",
  "عامل تنظيف مكاتب ومنشآت": "Office and Facility Cleaner",
  "مساعد إداري": "Administrative Assistant",
  "سائق شاحنة صغيرة": "Light Truck Driver",
  "محاسب": "Accountant",
  "حارس أمن": "Security Guard",
  "مندوب مشتريات": "Purchasing Representative",
  "عامل مطبخ": "Kitchen Worker",
  "أخصائي مبيعات": "Sales Specialist",
  "بائع": "Salesperson",
  "مدخل بيانات": "Data Entry Clerk",
  "عامل مخزن": "Warehouse Worker",
  "سائق سيارة": "Car Driver",
  "عامل نظافة شوارع": "Street Cleaner",
  "عامل تعبئة رفوف": "Shelf Stacker",
  "أخصائي خدمة عملاء": "Customer Service Specialist",
  "نادل": "Waiter",
  "موظف صندوق محاسبة": "Cashier Accountant",
  "عامل عادي": "General Labourer",
  "قهوجي": "Coffee Server",
  "عامل تنظيف أسطح مباني": "Building Surface Cleaner",
  "مدير عام": "General Manager",
  "كاتب موارد بشرية": "Human Resources Clerk",
  "عامل كاونتر مأكولات ومشروبات": "Food and Beverage Counter Attendant",
  "سائق حافلة": "Bus Driver",
  "أخصائي عمليات موارد بشرية": "Human Resources Operations Specialist",
  "سائق شاحنة بمقطورة": "Articulated Truck Driver",
  "أخصائي إداري": "Administrative Specialist",
  "مُنظّف نوافذ": "Window Cleaner",
  "دهّان": "Painter",
  "مركب أنابيب": "Pipe Fitter",
  "موظف استقبال": "Receptionist",
  "كاتب علاقات حكومية": "Government Relations Clerk",
  "مدير إداري": "Administrative Manager",
  "عامل مهن فريدة": "Specialised Trades Worker",
  "سباك": "Plumber",
  "صائغ": "Goldsmith",
  "كاتب بيانات عملاء": "Customer Data Clerk",
  "مدير مبيعات": "Sales Manager",
  "فني تكرير نفط": "Oil Refining Technician",
  "محصل": "Collections Clerk",
  "عامل تنظيف مستشفيات": "Hospital Cleaner",
  "عامل تنظيف أدوات مطبخ": "Kitchen Utensil Cleaner",
  "مدير عمليات موارد بشرية": "Human Resources Operations Manager",
  "مراقب خدمات عامة": "General Services Supervisor",
  "أخصائي علاقات عامة": "Public Relations Specialist",
  "مدير تسويق": "Marketing Manager",
  "عامل زراعي": "Agricultural Worker",
  "سكرتير": "Secretary",
  "خيّاط ملابس رجالية": "Men's Tailor",
  "كاتب استعلامات": "Enquiries Clerk",
  "منسق منتجات": "Product Coordinator",
  "سائق سيارة أجرة": "Taxi Driver",
  "كاتب استعلامات مركز خدمة عملاء": "Call Centre Enquiries Clerk",
  "مشرف مكتب": "Office Supervisor",
  "مُشغِّل آلة طباعة": "Printing Machine Operator",
  "صيدلي": "Pharmacist",
  "مليّس": "Plasterer",
  "كاتب اتصال": "Communications Clerk",
  "مراقب حركة مركبات": "Vehicle Movement Controller",
  "مبلط": "Tiler",
  "محلل نظم المعلومات": "Information Systems Analyst",
  "محاسب تكاليف": "Cost Accountant",
  "مدير علاقات عامة": "Public Relations Manager",
  "سائق شاحنة رفع قمامة": "Refuse Truck Driver",
  "مهندس إدارة مشاريع": "Project Management Engineer",
  "مأمور سنترال": "Switchboard Operator",
  "عامل تشطيبات طباعة وتجليد": "Print Finishing and Binding Worker",
  "أمين صندوق": "Cashier",
  "أخصائي تحليل مالي": "Financial Analysis Specialist",
  "مشرف تنظيف وتدبير": "Cleaning and Housekeeping Supervisor",
  "أخصائي دعم فني": "Technical Support Specialist",
  "أخصائي قانوني": "Legal Specialist",
  "فني نظم حاسب آلي": "Computer Systems Technician",
  "كاتب حسابات": "Accounts Clerk",
  "كاتب مراسلات": "Correspondence Clerk",
  "مدير إدارة مشاريع": "Project Management Director",
  "أخصائي إدارة خدمات": "Services Management Specialist",
  "رئيس تنفيذي": "Chief Executive",
  "كاتب رواتب": "Payroll Clerk",
  "فني اطفاء": "Firefighting Technician",
  "مشرف مدخلي البيانات": "Data Entry Supervisor",
  "أخصائي علوم حاسب آلي": "Computer Science Specialist",
  "فني آبار نفط وغاز": "Oil and Gas Well Technician",
  "كاتب حفظ ملفات": "Filing Clerk",
  "أخصائي إدارة مشاريع": "Project Management Specialist",
  "وسيط سلع": "Commodities Broker",
  "بائع مأكولات ومشروبات": "Food and Beverage Seller",
  "مساعد حسابات": "Accounts Assistant",
  "مشرف موقع إنشائي": "Construction Site Supervisor",
  "عامل غسيل ملابس": "Laundry Worker",
  "مدير مالي": "Finance Manager",
  "مراقب متجر": "Store Supervisor",
  "محلل بيانات": "Data Analyst",
  "مشغل آلات إنتاج نفط وغاز": "Oil and Gas Production Machine Operator",
  "عامل تدبير فندقي": "Hotel Housekeeping Worker",
  "بائع مجوهرات": "Jewellery Seller",
  "إطفائي": "Firefighter",
  "مشغل محطة تحلية مياه": "Desalination Plant Operator",
  "مشرف مسكن": "Accommodation Supervisor",
  "مصمم جرافيك": "Graphic Designer",
  "مدير فرع": "Branch Manager",
  "مراسل": "Messenger",
  "كاتب بريدي": "Postal Clerk",
  "مهندس معماري": "Architect",
  "سائق دراجة نارية": "Motorcycle Driver",
  "مراقب كاميرات أمنية": "Security Camera Monitor",
  "سكرتير تنفيذي": "Executive Secretary",
  "مهندس نفط وغاز": "Oil and Gas Engineer",
  "فني عمليات تقنية معلومات": "IT Operations Technician",
  "فني شبكات تقنية معلومات": "IT Network Technician",
  "أخصائي تغذية": "Nutrition Specialist",
  "مصمم إعلان": "Advertising Designer",
  "بائع أثاث": "Furniture Seller",
  "فني دعم تقنية معلومات": "IT Support Technician",
  "أخصائي عقود": "Contracts Specialist",
  "مدير خدمات أطعمة ومشروبات": "Food and Beverage Services Manager",
  "مراجع داخلي": "Internal Auditor",
  "كاتب تدقيق بيانات": "Data Verification Clerk",
  "مشرف إنشاء مباني": "Building Construction Supervisor",
  "أخصائي توظيف": "Recruitment Specialist",
  "بائع ملابس جاهزة": "Ready-made Clothing Seller",
  "عامل تركيب خطوط الاتصالات وتقنية المعلومات": "Telecommunications and IT Line Installer",
  "كاتب سجل": "Records Clerk",
  "كاتب عمليات نقل": "Transport Operations Clerk",
  "مدير خدمة العملاء": "Customer Service Manager",
  "كاتب شكاوى": "Complaints Clerk",
  "أخصائي استشارات أعمال": "Business Consulting Specialist",
  "أخصائي مبيعات منتجات صناعية": "Industrial Products Sales Specialist",
  "مستثمر": "Investor",
  "طبيب بيطري": "Veterinarian",
  "محلل قاعدة بيانات": "Database Analyst",
  "جامع بيانات": "Data Collector",
  "مجبس": "Gypsum Worker",
  "ضابط أمن": "Security Officer",
  "مدير حسابات": "Accounts Manager",
  "بائع مواد انشائية": "Building Materials Seller",
  "مدير تطوير موارد بشرية": "Human Resources Development Manager",
  "أخصائي تطوير إداري": "Administrative Development Specialist",
  "كاتب تأمين": "Insurance Clerk",
  "فني تصميم داخلي": "Interior Design Technician",
  "أخصائي تدريب وتطوير موارد بشرية": "HR Training and Development Specialist",
  "بائع هاتفي": "Telephone Salesperson",
  "أخصائي تجاري": "Commercial Specialist",
  "بائع عطور": "Perfume Seller",
  "فني علاج وظيفي": "Occupational Therapy Technician",
  "عامل سفلتة": "Asphalt Worker",
  "عامل دراجة نقل": "Delivery Rider",
  "مدير تخطيط وتطوير": "Planning and Development Manager",
  "فني تجهيز طباعة": "Prepress Technician",
  "عامل نظافة حدائق": "Garden Cleaner",
  "أخصائي مراقبة موارد بشرية": "Human Resources Monitoring Specialist",
  "مراقب مالي": "Financial Controller",
  "رسام معماري": "Architectural Draughtsman",
  "محضر أطعمة باردة": "Cold Food Preparer",
  "عامل تنظيف مركبات": "Vehicle Cleaner",
  "أخصائي رقابة عمليات": "Operations Control Specialist"
});
