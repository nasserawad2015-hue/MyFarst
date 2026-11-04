/*
 * البطاقات المدمجة.
 * الأجزاء التي يجب إكمالها توضع بين {{ و }}.
 * يمكن كتابة أكثر من إجابة صحيحة مفصولة بـ |  مثال: {{..<|...}}
 */
const BUILTIN_CARDS = [
  // ───────────── Swift ─────────────
  {
    id: 'sw-let-var', lang: 'swift',
    title: 'الثوابت والمتغيرات',
    note: 'let لقيمة لا تتغير، و var لقيمة يمكن تعديلها.',
    code: String.raw`{{let}} name = "سارة"     // ثابت
{{var}} score = 0         // متغير
score += 10`
  },
  {
    id: 'sw-types', lang: 'swift',
    title: 'تحديد نوع البيانات صراحةً',
    note: 'نكتب النوع بعد النقطتين.',
    code: String.raw`let age: {{Int}} = 25
let price: {{Double}} = 9.99
let isActive: {{Bool}} = true
let city: {{String}} = "الرياض"`
  },
  {
    id: 'sw-interp', lang: 'swift',
    title: 'إدراج قيمة داخل نص (String Interpolation)',
    note: 'نستخدم شرطة مائلة عكسية ثم أقواس.',
    code: String.raw`let name = "علي"
print("مرحبًا {{\(name)}}!")`
  },
  {
    id: 'sw-if', lang: 'swift',
    title: 'الجملة الشرطية if / else',
    note: '',
    code: String.raw`let temp = 30
{{if}} temp > 25 {
    print("الجو حار")
} {{else if}} temp > 15 {
    print("الجو معتدل")
} {{else}} {
    print("الجو بارد")
}`
  },
  {
    id: 'sw-switch', lang: 'swift',
    title: 'جملة switch',
    note: 'يجب أن تغطي switch كل الحالات، لذلك نستخدم default.',
    code: String.raw`{{switch}} grade {
{{case}} "A":
    print("ممتاز")
case "B", "C":
    print("جيد")
{{default}}:
    print("حاول مجددًا")
}`
  },
  {
    id: 'sw-for', lang: 'swift',
    title: 'حلقة for-in مع نطاق',
    note: '... نطاق مغلق يشمل الطرفين، و ..< يستثني الطرف الأخير.',
    code: String.raw`{{for}} i {{in}} 1{{...}}5 {
    print(i)        // 1 2 3 4 5
}
for i in 0{{..<}}3 {
    print(i)        // 0 1 2
}`
  },
  {
    id: 'sw-while', lang: 'swift',
    title: 'حلقة while و repeat-while',
    note: 'repeat-while تنفّذ مرة واحدة على الأقل.',
    code: String.raw`var n = 3
{{while}} n > 0 {
    n -= 1
}
{{repeat}} {
    n += 1
} while n < 3`
  },
  {
    id: 'sw-array', lang: 'swift',
    title: 'المصفوفات (Array)',
    note: '',
    code: String.raw`var fruits: [{{String}}] = ["تفاح", "موز"]
fruits.{{append}}("عنب")
print(fruits.{{count}})       // 3
print(fruits[{{0}}])         // تفاح`
  },
  {
    id: 'sw-dict', lang: 'swift',
    title: 'القواميس (Dictionary)',
    note: 'المفتاح ثم النقطتان ثم نوع القيمة.',
    code: String.raw`var ages: [String{{:}} Int] = ["علي": 30]
ages["منى"] = 27
for ({{name}}, age) in ages {
    print("\(name): \(age)")
}`
  },
  {
    id: 'sw-func', lang: 'swift',
    title: 'تعريف دالة تُرجع قيمة',
    note: 'السهم -> يحدد نوع القيمة المُرجعة.',
    code: String.raw`{{func}} greet(name: String) {{->}} String {
    {{return}} "أهلًا \(name)"
}
let msg = greet({{name}}: "ليلى")`
  },
  {
    id: 'sw-func-label', lang: 'swift',
    title: 'تسمية المعاملات وإخفاؤها',
    note: 'الشرطة السفلية _ تُلغي اسم المعامل عند الاستدعاء.',
    code: String.raw`func add({{_}} a: Int, {{to}} b: Int) -> Int {
    return a + b
}
add(2, to: 3)`
  },
  {
    id: 'sw-optional', lang: 'swift',
    title: 'فك الاختياري (Optional Binding)',
    note: '',
    code: String.raw`var email: String{{?}} = nil

{{if let}} mail = email {
    print(mail)
}

func send() {
    {{guard}} let mail = email {{else}} { return }
    print(mail)
}`
  },
  {
    id: 'sw-nil-coalesce', lang: 'swift',
    title: 'القيمة الافتراضية للاختياري',
    note: 'عامل دمج nil يعطي قيمة بديلة إن كانت القيمة nil.',
    code: String.raw`let input: String? = nil
let user = input {{??}} "ضيف"
let len = input{{?}}.count     // Optional Chaining`
  },
  {
    id: 'sw-struct', lang: 'swift',
    title: 'الهيكل (struct) والدالة المعدِّلة',
    note: 'الدالة التي تعدّل خصائص struct تحتاج mutating.',
    code: String.raw`{{struct}} Counter {
    var value = 0
    {{mutating}} func increment() {
        value += 1
    }
}`
  },
  {
    id: 'sw-class', lang: 'swift',
    title: 'الصنف (class) والمُهيّئ',
    note: '',
    code: String.raw`{{class}} Person {
    var name: String
    {{init}}(name: String) {
        {{self}}.name = name
    }
}
class Student{{:}} Person { }`
  },
  {
    id: 'sw-enum', lang: 'swift',
    title: 'التعداد (enum)',
    note: '',
    code: String.raw`{{enum}} Direction {
    {{case}} north, south, east, west
}
let d: Direction = {{.}}north`
  },
  {
    id: 'sw-protocol', lang: 'swift',
    title: 'البروتوكولات (protocol)',
    note: '',
    code: String.raw`{{protocol}} Drawable {
    func draw()
}
struct Circle: {{Drawable}} {
    func draw() { print("⭕️") }
}`
  },
  {
    id: 'sw-extension', lang: 'swift',
    title: 'الامتداد (extension)',
    note: 'نضيف وظائف لنوع موجود.',
    code: String.raw`{{extension}} Int {
    var squared: Int {
        return {{self}} * self
    }
}
print(4.squared)   // 16`
  },
  {
    id: 'sw-closures', lang: 'swift',
    title: 'map و filter مع الإغلاقات',
    note: '$0 يمثل العنصر الحالي.',
    code: String.raw`let nums = [1, 2, 3, 4]
let doubled = nums.{{map}} { {{$0}} * 2 }
let evens = nums.{{filter}} { $0 % 2 == 0 }
let total = nums.{{reduce}}(0, +)`
  },
  {
    id: 'sw-errors', lang: 'swift',
    title: 'معالجة الأخطاء',
    note: '',
    code: String.raw`enum LoginError: {{Error}} { case wrongPassword }

func login() {{throws}} { throw LoginError.wrongPassword }

{{do}} {
    {{try}} login()
} {{catch}} {
    print(error)
}`
  },
  {
    id: 'sw-async', lang: 'swift',
    title: 'البرمجة غير المتزامنة async / await',
    note: '',
    code: String.raw`func loadData() {{async}} throws -> Data {
    let url = URL(string: "https://example.com")!
    let (data, _) = try {{await}} URLSession.shared.data(from: url)
    return data
}`
  },
  {
    id: 'sw-swiftui-view', lang: 'swift',
    title: 'أول واجهة SwiftUI',
    note: '',
    code: String.raw`import {{SwiftUI}}

struct ContentView: {{View}} {
    var body: {{some}} View {
        Text("مرحبًا بالعالم")
    }
}`
  },
  {
    id: 'sw-swiftui-state', lang: 'swift',
    title: 'الحالة @State في SwiftUI',
    note: '',
    code: String.raw`struct CounterView: View {
    {{@State}} private var count = 0
    var body: some View {
        {{VStack}}(spacing: 12) {
            Text("العدد: \(count)")
            {{Button}}("زد") { count += 1 }
        }
    }
}`
  },
  {
    id: 'sw-swiftui-binding', lang: 'swift',
    title: 'ربط الحقل بالحالة ($ Binding)',
    note: '',
    code: String.raw`@State private var name = ""
@State private var isOn = false

TextField("اسمك", text: {{$}}name)
Toggle("تفعيل", isOn: {{$isOn}})`
  },
  {
    id: 'sw-swiftui-list', lang: 'swift',
    title: 'القائمة List و ForEach',
    note: '',
    code: String.raw`let items = ["Swift", "HTML", "CSS"]

{{List}} {
    {{ForEach}}(items, {{id}}: \.self) { item in
        Text(item)
    }
}`
  },
  {
    id: 'sw-swiftui-modifiers', lang: 'swift',
    title: 'المعدِّلات (Modifiers) في SwiftUI',
    note: '',
    code: String.raw`Text("عنوان")
    .{{font}}(.title)
    .{{foregroundColor}}(.blue)
    .{{padding}}()`
  },

  // ───────────── HTML ─────────────
  {
    id: 'ht-skeleton', lang: 'html',
    title: 'هيكل صفحة HTML عربية',
    note: 'lang للغة و dir لاتجاه الكتابة.',
    code: String.raw`{{<!DOCTYPE html>}}
<html {{lang}}="ar" {{dir}}="rtl">
<{{head}}>
  <title>صفحتي</title>
</head>
<{{body}}>
</body>
</html>`
  },
  {
    id: 'ht-meta', lang: 'html',
    title: 'وسوم meta الأساسية',
    note: 'الترميز، وتهيئة العرض للجوال.',
    code: String.raw`<meta {{charset}}="UTF-8">
<meta name="{{viewport}}" content="width=device-width, initial-scale=1.0">
<meta name="{{description}}" content="وصف الصفحة لمحركات البحث">`
  },
  {
    id: 'ht-headings', lang: 'html',
    title: 'العناوين والفقرات',
    note: '',
    code: String.raw`<{{h1}}>العنوان الرئيسي</h1>
<h2>عنوان فرعي</h2>
<{{p}}>هذه فقرة فيها <{{strong}}>نص عريض</strong> و <{{em}}>نص مائل</em>.</p>
<{{br}}>`
  },
  {
    id: 'ht-link', lang: 'html',
    title: 'الروابط',
    note: 'target="_blank" يفتح الرابط في تبويب جديد.',
    code: String.raw`<a {{href}}="https://developer.apple.com" {{target}}="_blank">
  موقع أبل للمطورين
</a>
<a href="{{mailto}}:me@example.com">راسلني</a>`
  },
  {
    id: 'ht-img', lang: 'html',
    title: 'الصور',
    note: 'alt نص بديل مهم لإمكانية الوصول.',
    code: String.raw`<{{img}} {{src}}="cat.jpg" {{alt}}="قطة نائمة" width="300">`
  },
  {
    id: 'ht-lists', lang: 'html',
    title: 'القوائم المرتبة وغير المرتبة',
    note: '',
    code: String.raw`<{{ul}}>
  <{{li}}>Swift</li>
  <li>HTML</li>
</ul>

<{{ol}}>
  <li>الخطوة الأولى</li>
</ol>`
  },
  {
    id: 'ht-table', lang: 'html',
    title: 'الجداول',
    note: 'tr صف، th خلية عنوان، td خلية بيانات.',
    code: String.raw`<{{table}}>
  <{{thead}}>
    <{{tr}}><{{th}}>اللغة</th><th>الاستخدام</th></tr>
  </thead>
  <tbody>
    <tr><{{td}}>Swift</td><td>تطبيقات iOS</td></tr>
  </tbody>
</table>`
  },
  {
    id: 'ht-form', lang: 'html',
    title: 'النموذج (form)',
    note: '',
    code: String.raw`<form {{action}}="/send" {{method}}="post">
  <{{label}} {{for}}="email">البريد</label>
  <input type="{{email}}" id="email" name="email" {{required}}>
  <button type="{{submit}}">إرسال</button>
</form>`
  },
  {
    id: 'ht-inputs', lang: 'html',
    title: 'أنواع حقول الإدخال',
    note: '',
    code: String.raw`<input type="{{password}}" placeholder="كلمة المرور">
<input type="{{checkbox}}" checked> أوافق
<input type="{{radio}}" name="g" value="m"> ذكر
<input type="number" {{min}}="1" {{max}}="10">
<input type="text" {{placeholder}}="اكتب هنا">`
  },
  {
    id: 'ht-select', lang: 'html',
    title: 'القائمة المنسدلة ومربع النص',
    note: '',
    code: String.raw`<{{select}} name="city">
  <{{option}} value="ryd">الرياض</option>
  <option value="jed" {{selected}}>جدة</option>
</select>

<{{textarea}} rows="4">ملاحظاتك</textarea>`
  },
  {
    id: 'ht-semantic', lang: 'html',
    title: 'الوسوم الدلالية (Semantic)',
    note: '',
    code: String.raw`<{{header}}>
  <{{nav}}>القائمة</nav>
</header>
<{{main}}>
  <{{article}}>مقال</article>
  <{{aside}}>جانبي</aside>
</main>
<{{footer}}>© 2026</footer>`
  },
  {
    id: 'ht-css-js', lang: 'html',
    title: 'ربط ملفات CSS و JavaScript',
    note: 'defer يؤجّل تنفيذ السكربت حتى تحميل الصفحة.',
    code: String.raw`<{{link}} {{rel}}="stylesheet" href="style.css">
<script {{src}}="app.js" {{defer}}></script>
<{{style}}>
  body { font-family: sans-serif; }
</style>`
  },
  {
    id: 'ht-class-id', lang: 'html',
    title: 'الخصائص class و id و data',
    note: 'id فريد في الصفحة، و class يمكن تكراره.',
    code: String.raw`<div {{class}}="card active" {{id}}="main">
  <span {{data-}}price="25">السعر</span>
</div>`
  },
  {
    id: 'ht-div-span', lang: 'html',
    title: 'الحاويات الكتلية والسطرية',
    note: 'div كتلي يبدأ بسطر جديد، و span سطري.',
    code: String.raw`<{{div}} class="box">
  نص فيه <{{span}} class="red">كلمة ملونة</span>
</div>`
  },
  {
    id: 'ht-media', lang: 'html',
    title: 'الفيديو والصوت',
    note: '',
    code: String.raw`<{{video}} src="intro.mp4" {{controls}} width="400"></video>
<{{audio}} src="sound.mp3" controls {{autoplay}} muted></audio>`
  },
  {
    id: 'ht-comment', lang: 'html',
    title: 'التعليقات في HTML',
    note: '',
    code: String.raw`{{<!--}} هذا تعليق لا يظهر في الصفحة {{-->}}
<p>هذا نص ظاهر</p>`
  },
  {
    id: 'ht-iframe', lang: 'html',
    title: 'تضمين صفحة أو خريطة (iframe)',
    note: '',
    code: String.raw`<{{iframe}} src="https://example.com" width="600" height="400"
        {{title}}="صفحة مضمّنة" {{loading}}="lazy"></iframe>`
  },
  {
    id: 'ht-figure', lang: 'html',
    title: 'الشكل مع تعليق (figure)',
    note: '',
    code: String.raw`<{{figure}}>
  <img src="chart.png" alt="رسم بياني">
  <{{figcaption}}>نمو المستخدمين في 2026</figcaption>
</figure>`
  },
  {
    id: 'ht-details', lang: 'html',
    title: 'محتوى قابل للطي',
    note: 'بدون أي JavaScript.',
    code: String.raw`<{{details}}>
  <{{summary}}>ما هو HTML؟</summary>
  <p>لغة ترميز لبناء صفحات الويب.</p>
</details>`
  }
];
