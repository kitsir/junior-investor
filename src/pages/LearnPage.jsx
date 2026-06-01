import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BookOpen, ArrowDown, ChevronDown, ChevronUp,
  LineChart, Building2, Calculator, Wallet,
  Activity, ArrowRight, ShieldCheck, AlertCircle,
  Globe2, PieChart, Coins, TrendingUp, BarChart2,
  Brain, Clock, DollarSign, Scale
} from 'lucide-react'

// ─── Scroll fade-in hook ────────────────────────────────────────────────────
function useFadeIn() {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { el.style.opacity = '1'; el.style.transform = 'translateY(0)' } },
      { threshold: 0.12 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return ref
}

function FadeSection({ children, className = '' }) {
  const ref = useFadeIn()
  return (
    <div
      ref={ref}
      className={`mb-20 ${className}`}
      style={{
        opacity: 0,
        transform: 'translateY(32px)',
        transition: 'opacity 0.7s ease, transform 0.7s ease',
      }}
    >
      {children}
    </div>
  )
}

function SectionLabel({ children }) {
  return (
    <div className="text-[12px] font-bold tracking-widest uppercase text-primary mb-3">
      {children}
    </div>
  )
}

function SectionTitle({ children }) {
  return (
    <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-ink mb-6">
      {children}
    </h2>
  )
}

// ─── Accordion Term ─────────────────────────────────────────────────────────
function AccordionTerm({ term, en, icon: Icon, desc, example }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="card overflow-hidden transition-colors hover:border-primary/50">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 text-left bg-transparent border-none cursor-pointer"
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-primary-bg flex items-center justify-center shrink-0 text-primary">
            <Icon size={20} />
          </div>
          <div>
            <div className="text-[16px] font-bold text-ink">{term}</div>
            <div className="text-[12px] text-tertiary">{en}</div>
          </div>
        </div>
        <div className="text-tertiary">
          {open ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>
      </button>
      {open && (
        <div className="px-5 pb-5 pt-1 border-t border-color mt-2 animate-fade-in">
          <p className="text-[14px] text-secondary leading-relaxed mb-4 mt-3 whitespace-pre-line">
            {desc}
          </p>
          {example && (
            <div className="text-[13px] text-primary bg-primary-bg px-4 py-3 rounded-xl border border-primary/20">
              <span className="font-bold mr-2">ตัวอย่าง (Example):</span> {example}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function HoldingBar({ ticker, name, weight, color }) {
  const navigate = useNavigate()
  return (
    <div
      className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
      onClick={() => navigate(`/stock/${ticker}`)}
    >
      <span className="text-[12px] font-extrabold text-secondary w-12 shrink-0">{ticker}</span>
      <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'var(--divider)' }}>
        <div style={{ width: `${Math.min(weight * 8, 100)}%`, height: '100%', background: color, borderRadius: 99, transition: 'width 1s ease' }} />
      </div>
      <span className="text-[12px] font-bold text-secondary w-10 text-right shrink-0">{weight}%</span>
      <span className="text-[12px] text-tertiary min-w-[100px] hidden md:block">{name}</span>
    </div>
  )
}

const SP500_HOLDINGS = [
  { ticker: 'NVDA', name: 'NVIDIA', weight: 6.5 },
  { ticker: 'AAPL', name: 'Apple', weight: 6.3 },
  { ticker: 'MSFT', name: 'Microsoft', weight: 6.1 },
  { ticker: 'AMZN', name: 'Amazon', weight: 3.7 },
  { ticker: 'META', name: 'Meta', weight: 2.7 },
  { ticker: 'AVGO', name: 'Broadcom', weight: 2.1 },
  { ticker: 'GOOGL', name: 'Alphabet', weight: 2.0 },
]

const NDX100_HOLDINGS = [
  { ticker: 'NVDA', name: 'NVIDIA', weight: 8.9 },
  { ticker: 'AAPL', name: 'Apple', weight: 8.2 },
  { ticker: 'MSFT', name: 'Microsoft', weight: 7.9 },
  { ticker: 'AMZN', name: 'Amazon', weight: 5.1 },
  { ticker: 'AVGO', name: 'Broadcom', weight: 4.8 },
  { ticker: 'META', name: 'Meta Platforms', weight: 4.6 },
  { ticker: 'TSLA', name: 'Tesla', weight: 3.6 },
  { ticker: 'GOOGL', name: 'Alphabet A', weight: 2.8 },
]

const TERMS = [
  {
    term: 'Stock / Equity', en: 'หุ้น (สัดส่วนความเป็นเจ้าของ)', icon: Building2,
    desc: 'หุ้นคือตราสารทุนที่แสดงถึง "ความเป็นเจ้าของ" ในบริษัทนั้นๆ เมื่อคุณซื้อหุ้น คุณจะกลายเป็นผู้ถือหุ้น (Shareholder) ซึ่งมีสิทธิในทรัพย์สินและกำไรของบริษัทตามสัดส่วนที่คุณถืออยู่\n\nหากบริษัทเติบโตและทำกำไรได้ดี มูลค่าของบริษัทจะเพิ่มขึ้น ทำให้ราคาหุ้นในตลาดปรับตัวสูงขึ้นตามไปด้วย คุณจะได้รับผลตอบแทนในรูปแบบของ "ส่วนต่างราคา (Capital Gain)" หรือรับปันผล (Dividend)',
    example: 'หากคุณซื้อหุ้น AAPL (Apple) 1 หุ้น หมายความว่าคุณคือหนึ่งในเจ้าของบริษัท Apple แม้จะเป็นเพียงสัดส่วนที่เล็กมากก็ตาม'
  },
  {
    term: 'Market Cap', en: 'มูลค่าตลาดรวมของบริษัท (Market Capitalization)', icon: PieChart,
    desc: 'Market Cap คือมูลค่ารวมทั้งหมดของบริษัทที่ประเมินจากตลาดหลักทรัพย์ คำนวณได้จากการนำ "ราคาหุ้นปัจจุบัน" มาคูณกับ "จำนวนหุ้นทั้งหมด"\n\nแบ่งขนาดบริษัทได้เป็น:\n- Mega-cap: มากกว่า $200B (เช่น Apple, Microsoft)\n- Large-cap: $10B–$200B (มั่นคง เหมาะลงทุนระยะยาว)\n- Mid-cap: $2B–$10B (โอกาสเติบโตดี ความเสี่ยงปานกลาง)\n- Small-cap: $300M–$2B (เสี่ยงสูง แต่โตได้แบบก้าวกระโดด)',
    example: 'Apple มีหุ้นทั้งหมด 15 พันล้านหุ้น ราคาหุ้นละ $200 → Market Cap = $3 Trillion (3 ล้านล้านดอลลาร์)'
  },
  {
    term: 'P/E Ratio', en: 'อัตราส่วนราคาต่อกำไร (Price to Earnings)', icon: Calculator,
    desc: 'P/E ย่อมาจาก Price-to-Earnings Ratio คืออัตราส่วนเปรียบเทียบระหว่าง "ราคาหุ้น" กับ "กำไรต่อหุ้น (EPS)"\n\n- P/E สูง: นักลงทุนคาดหวังการเติบโตในอนาคต จึงยอมซื้อแพง\n- P/E ต่ำ: หุ้นอาจมีราคาถูก (Undervalued) หรือบริษัทเติบโตช้า\n\nค่า P/E เฉลี่ยของ S&P 500 อยู่ที่ประมาณ 20-25x ใช้เปรียบเทียบกับบริษัทในกลุ่มอุตสาหกรรมเดียวกันจะแม่นยำกว่า',
    example: 'บริษัท A ราคาหุ้น $100, ทำกำไร EPS $4/ปี → P/E = 25x หมายความว่าคุณจ่าย $25 ต่อกำไร $1'
  },
  {
    term: 'EPS (Earnings Per Share)', en: 'กำไรต่อหุ้น', icon: DollarSign,
    desc: 'EPS คือกำไรสุทธิของบริษัทหารด้วยจำนวนหุ้นทั้งหมดที่อยู่ในตลาด เป็นตัวชี้วัดที่แสดงว่าบริษัทสร้างกำไรได้เท่าไหร่ต่อหุ้น 1 หุ้น\n\n- Trailing EPS: กำไรจริงจาก 12 เดือนที่ผ่านมา\n- Forward EPS: กำไรที่นักวิเคราะห์คาดการณ์ใน 12 เดือนข้างหน้า\n\nEPS ที่เติบโตต่อเนื่องทุกไตรมาส (YoY) คือสัญญาณที่นักลงทุนสายปัจจัยพื้นฐานมองหา',
    example: 'บริษัทมีกำไรสุทธิ $10 พันล้าน มีหุ้นอยู่ 1 พันล้านหุ้น → EPS = $10 ต่อหุ้น'
  },
  {
    term: 'ROE (Return on Equity)', en: 'ผลตอบแทนต่อส่วนทุน', icon: TrendingUp,
    desc: 'ROE คือตัวชี้วัดว่า บริษัทสามารถนำส่วนทุนของผู้ถือหุ้นไปสร้างกำไรได้มีประสิทธิภาพแค่ไหน คำนวณจาก กำไรสุทธิ ÷ ส่วนทุนผู้ถือหุ้น\n\nROE ที่ดีมักอยู่ที่ 15% ขึ้นไป บริษัทชั้นนำอย่าง Apple, Microsoft มักมี ROE สูงกว่า 100% เพราะมีกำไรมหาศาลและซื้อหุ้นคืน (Buyback) มาก',
    example: 'บริษัทมีกำไร $20M ส่วนทุน $100M → ROE = 20% หมายความว่าทุก $1 ที่ผู้ถือหุ้นลงทุน บริษัทสร้างกำไรได้ $0.20'
  },
  {
    term: 'Dividend', en: 'เงินปันผล (Dividend Yield)', icon: Coins,
    desc: 'เงินปันผลคือส่วนแบ่งกำไรที่บริษัทนำมาแจกจ่ายให้กับผู้ถือหุ้น บริษัทที่จ่ายปันผลสม่ำเสมอมักจะเป็นบริษัทขนาดใหญ่ที่เติบโตเต็มที่แล้ว (Mature Company) มีกระแสเงินสดแข็งแกร่ง\n\nDividend Yield = เงินปันผลต่อปี ÷ ราคาหุ้น × 100%\n\nนักลงทุนสาย Passive Income นิยมหุ้นปันผลสูง เช่น Coca-Cola, Johnson & Johnson, Realty Income',
    example: 'คุณลงทุน $10,000 ในหุ้น JNJ ที่มี Dividend Yield 3% ต่อปี คุณจะได้รับเงินสด $300/ปี โดยไม่ต้องขายหุ้น'
  },
  {
    term: 'Debt to Equity Ratio', en: 'อัตราส่วนหนี้สินต่อส่วนทุน (D/E)', icon: Scale,
    desc: 'D/E Ratio วัดว่าบริษัทพึ่งพาเงินกู้มากแค่ไหนเทียบกับส่วนทุนของผู้ถือหุ้น\n\n- D/E ต่ำ: บริษัทใช้ทุนตัวเองเป็นหลัก ความเสี่ยงต่ำ\n- D/E สูง: บริษัทกู้ยืมมาก อาจเสี่ยงหากดอกเบี้ยขึ้นหรือยอดขายลด\n\nค่าปกติอยู่ที่ 1-2x แต่แตกต่างกันมากตามอุตสาหกรรม (สาธารณูปโภคมักมี D/E สูงตามธรรมชาติ)',
    example: 'บริษัทมีหนี้ $200M ส่วนทุน $100M → D/E = 2.0 หมายความว่ากู้มา $2 ต่อส่วนทุน $1'
  },
  {
    term: 'Beta (β)', en: 'ความผันผวนเทียบกับตลาด (Volatility Metric)', icon: Activity,
    desc: 'Beta วัดความผันผวนของราคาหุ้นเทียบกับดัชนีตลาดโดยรวม (S&P 500)\n\n- Beta = 1: หุ้นแกว่งตัวเท่ากับตลาด\n- Beta > 1: หุ้นผันผวนแรงกว่าตลาด (เช่น TSLA ≈ 2.0)\n- Beta < 1: หุ้นผันผวนน้อยกว่าตลาด (เช่น JNJ ≈ 0.5)\n\nหุ้น Beta สูงเหมาะกับนักลงทุนที่รับความเสี่ยงได้ หุ้น Beta ต่ำเหมาะกับนักลงทุนสายระมัดระวัง',
    example: 'TSLA มี Beta 2.0 ถ้าตลาดร่วง 5% หุ้น TSLA มีแนวโน้มร่วงถึง 10%'
  },
  {
    term: 'Free Cash Flow', en: 'กระแสเงินสดอิสระ (FCF)', icon: Wallet,
    desc: 'FCF คือเงินสดสุทธิที่บริษัทสร้างได้หลังหักค่าใช้จ่ายดำเนินงานและการลงทุนในสินทรัพย์ถาวร (CAPEX)\n\nFCF บอกสุขภาพทางการเงินที่แท้จริง เพราะบริษัทอาจรายงานกำไรทางบัญชีที่ดีแต่ไม่มีเงินสดจริง บริษัทที่มี FCF สูงสามารถจ่ายปันผล ซื้อหุ้นคืน ชำระหนี้ หรือเทคโอเวอร์คู่แข่งได้',
    example: 'Apple มี FCF ~$100B ต่อปี นำมาใช้ซื้อหุ้นคืน (Buyback) ~$90B ต่อปี ซึ่งช่วยเพิ่มมูลค่าให้ผู้ถือหุ้นอย่างต่อเนื่อง'
  },
]

export default function LearnPage() {
  const navigate = useNavigate()

  return (
    <div className="w-full max-w-6xl mx-auto py-10 px-4 md:px-0 pb-32">

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <div className="text-center py-20 px-6 card bg-gradient-to-br from-surface to-primary-bg/30 border border-color mb-20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary opacity-5 blur-[120px] rounded-full pointer-events-none" />
        <div className="relative z-10">
          <div className="w-20 h-20 rounded-3xl mx-auto mb-8 bg-gradient-to-br from-[#3B82F6] to-[#2563EB] flex items-center justify-center shadow-lg shadow-blue-500/30">
            <BookOpen size={36} color="#fff" strokeWidth={1.5} />
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold text-ink tracking-tight mb-6">
            Investment Education
          </h1>
          <p className="text-lg md:text-xl text-secondary max-w-2xl mx-auto leading-relaxed">
            เริ่มต้นปูพื้นฐานการลงทุนให้แน่น เข้าใจตลาดหุ้นตั้งแต่หลักการพื้นฐานไปจนถึงกลไกตลาด เพื่อให้คุณสามารถวิเคราะห์และตัดสินใจลงทุนด้วยความมั่นใจ
          </p>
          {/* Chapter index */}
          <div className="flex flex-wrap justify-center gap-3 mt-10">
            {['คำศัพท์พื้นฐาน','S/R Levels','Asset Classes','S&P 500','NASDAQ 100','จิตวิทยาการลงทุน'].map((c,i) => (
              <span key={c} className="text-[12px] font-semibold px-3 py-1 rounded-full bg-primary/10 text-primary">
                Ch.{i+1} {c}
              </span>
            ))}
          </div>
          <div className="mt-10 text-tertiary flex flex-col items-center gap-2">
            <span className="text-[13px] font-semibold tracking-wider uppercase">เลื่อนเพื่ออ่านเนื้อหา</span>
            <ArrowDown size={20} className="animate-bounce" />
          </div>
        </div>
      </div>

      {/* ── Ch.1: Terminology ──────────────────────────────────────────── */}
      <FadeSection>
        <SectionLabel>Chapter 1</SectionLabel>
        <SectionTitle>Essential Terminology (คำศัพท์พื้นฐานที่ต้องรู้)</SectionTitle>
        <p className="text-[16px] text-secondary mb-10 max-w-3xl leading-relaxed">
          การเข้าใจภาษาของโลกการเงิน (Wall Street) คือก้าวแรกที่สำคัญที่สุด คำศัพท์เหล่านี้จะปรากฏให้คุณเห็นเสมอเวลาที่อ่านข่าวสาร หรือวิเคราะห์งบการเงิน
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {TERMS.map(t => <AccordionTerm key={t.term} {...t} />)}
        </div>
      </FadeSection>

      {/* ── Ch.2: S/R ──────────────────────────────────────────────────── */}
      <FadeSection>
        <SectionLabel>Chapter 2</SectionLabel>
        <SectionTitle>Market Mechanics: Support & Resistance</SectionTitle>
        <p className="text-[16px] text-secondary mb-10 max-w-3xl leading-relaxed">
          ปัจจัยพื้นฐาน (Fundamentals) จะบอกเราว่า "ควรซื้อหุ้นตัวไหน" แต่การวิเคราะห์ทางเทคนิค (Technicals) จะช่วยบอกเราว่า "ควรซื้อตอนไหน" แนวรับและแนวต้านคือพื้นฐานสำคัญที่สุดในการดูกราฟราคา
        </p>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="card p-8 border-l-4 border-l-[#10B981]">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-[#10B981] flex items-center justify-center mb-6">
              <ShieldCheck size={28} />
            </div>
            <h3 className="text-xl font-bold text-ink mb-4">Support Level (แนวรับ)</h3>
            <p className="text-[15px] text-secondary leading-relaxed mb-6">
              แนวรับคือ โซนราคาด้านล่างที่หุ้นมักจะตกลงมาแล้วไม่ผ่านลงไปง่ายๆ เพราะเมื่อราคาลงมาถึงจุดนี้ จะมีแรงซื้อ (Demand) เข้ามาพยุงราคาเอาไว้ เป็นจุดที่นักลงทุนหลายคนมองว่า "ราคาถูกและน่าสะสม"
            </p>
            <div className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 p-4 rounded-xl text-[14px] font-semibold">
              กลยุทธ์: การเข้าซื้อหุ้นที่ใกล้แนวรับ จะช่วยให้มีความเสี่ยง (Downside Risk) ที่ต่ำกว่า
            </div>
          </div>
          <div className="card p-8 border-l-4 border-l-[#EF4444]">
            <div className="w-12 h-12 rounded-xl bg-red-500/10 text-[#EF4444] flex items-center justify-center mb-6">
              <AlertCircle size={28} />
            </div>
            <h3 className="text-xl font-bold text-ink mb-4">Resistance Level (แนวต้าน)</h3>
            <p className="text-[15px] text-secondary leading-relaxed mb-6">
              แนวต้านคือ โซนราคาด้านบนที่หุ้นพยายามจะทะลุขึ้นไปแต่ไม่สำเร็จ เพราะเมื่อราคาขึ้นมาถึงจุดนี้ จะมีแรงขายทำกำไร (Supply) ออกมากดดัน เป็นจุดที่คนมองว่า "ราคาเริ่มแพงไปแล้ว"
            </p>
            <div className="bg-red-500/10 text-red-700 dark:text-red-400 p-4 rounded-xl text-[14px] font-semibold">
              กลยุทธ์: แนวต้านมักจะเป็นโซนที่นักลงทุนสายเก็งกำไรใช้สำหรับ "ขายทำกำไร" หรือลดสัดส่วนการถือครอง
            </div>
          </div>
        </div>
      </FadeSection>

      {/* ── Ch.3: Asset Classes ─────────────────────────────────────────── */}
      <FadeSection>
        <SectionLabel>Chapter 3</SectionLabel>
        <SectionTitle>Understanding Asset Classes (ประเภทของสินทรัพย์)</SectionTitle>
        <p className="text-[16px] text-secondary mb-10 max-w-3xl leading-relaxed">
          สินทรัพย์แต่ละประเภทมาพร้อมกับความเสี่ยงและผลตอบแทนที่ต่างกัน การจัดพอร์ตแบบผสมผสาน (Asset Allocation) จะช่วยให้ทนทานต่อทุกสภาวะเศรษฐกิจ
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card p-8 transition-transform hover:-translate-y-1">
            <div className="w-12 h-12 rounded-xl bg-red-500/10 text-[#EF4444] flex items-center justify-center mb-6">
              <LineChart size={24} />
            </div>
            <h3 className="text-lg font-bold text-ink mb-2">Individual Stocks (หุ้นรายตัว)</h3>
            <div className="text-[13px] font-semibold text-[#EF4444] mb-6">High Risk · High Potential Reward</div>
            <ul className="space-y-3">
              <li className="text-[14px] text-secondary flex items-start gap-2"><span className="text-ink font-bold">•</span> มีโอกาสทำกำไรได้สูงแบบไม่จำกัด</li>
              <li className="text-[14px] text-secondary flex items-start gap-2"><span className="text-ink font-bold">•</span> โฟกัสบริษัทที่คุณเชื่อมั่นและศึกษามาแล้ว</li>
              <li className="text-[14px] text-secondary flex items-start gap-2"><span className="text-ink font-bold">•</span> ต้องใช้เวลาศึกษาปัจจัยพื้นฐานอย่างลึก</li>
              <li className="text-[14px] text-secondary flex items-start gap-2"><span className="text-ink font-bold">•</span> ความผันผวนสูง มีสิทธิเงินต้นหายหากบริษัทล้มเหลว</li>
            </ul>
          </div>
          <div className="card p-8 border border-primary/30 relative overflow-hidden transition-transform hover:-translate-y-1">
            <div className="absolute top-0 right-0 px-3 py-1 bg-primary text-white text-[10px] font-bold uppercase tracking-wider rounded-bl-lg">แนะนำสำหรับมือใหม่</div>
            <div className="w-12 h-12 rounded-xl bg-primary-bg text-primary flex items-center justify-center mb-6">
              <Globe2 size={24} />
            </div>
            <h3 className="text-lg font-bold text-ink mb-2">ETFs & Index Funds</h3>
            <div className="text-[13px] font-semibold text-primary mb-6">Moderate Risk · Steady Long-term Growth</div>
            <ul className="space-y-3">
              <li className="text-[14px] text-secondary flex items-start gap-2"><span className="text-primary font-bold">•</span> กระจายความเสี่ยงทันที ซื้อ 1 กองทุน = ถือหุ้นหลายร้อยตัว</li>
              <li className="text-[14px] text-secondary flex items-start gap-2"><span className="text-primary font-bold">•</span> ค่าธรรมเนียมการบริหารต่ำมาก (Expense Ratio ต่ำ)</li>
              <li className="text-[14px] text-secondary flex items-start gap-2"><span className="text-primary font-bold">•</span> เติบโตตามทิศทางตลาดหุ้นในระยะยาว</li>
              <li className="text-[14px] text-secondary flex items-start gap-2"><span className="text-primary font-bold">•</span> เหมาะกับ DCA และสาย Passive Investing</li>
            </ul>
          </div>
          <div className="card p-8 transition-transform hover:-translate-y-1">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-[#10B981] flex items-center justify-center mb-6">
              <Building2 size={24} />
            </div>
            <h3 className="text-lg font-bold text-ink mb-2">Bonds (พันธบัตร)</h3>
            <div className="text-[13px] font-semibold text-[#10B981] mb-6">Low Risk · Capital Preservation</div>
            <ul className="space-y-3">
              <li className="text-[14px] text-secondary flex items-start gap-2"><span className="text-ink font-bold">•</span> ให้ผลตอบแทนเป็นดอกเบี้ยรับที่สม่ำเสมอ</li>
              <li className="text-[14px] text-secondary flex items-start gap-2"><span className="text-ink font-bold">•</span> เบาะรองรับแรงกระแทกเมื่อตลาดหุ้นวิกฤต</li>
              <li className="text-[14px] text-secondary flex items-start gap-2"><span className="text-ink font-bold">•</span> ปกป้องเงินต้นได้ดี ปลอดภัยกว่าหุ้น</li>
              <li className="text-[14px] text-secondary flex items-start gap-2"><span className="text-ink font-bold">•</span> ผลตอบแทนระยะยาวอาจสู้เงินเฟ้อไม่ได้</li>
            </ul>
          </div>
        </div>
      </FadeSection>

      {/* ── Ch.4: S&P 500 ───────────────────────────────────────────────── */}
      <FadeSection>
        <SectionLabel>Chapter 4</SectionLabel>
        <SectionTitle>ดัชนีหุ้นโลก: S&P 500</SectionTitle>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3">
            <p className="text-[16px] text-secondary mb-8 leading-relaxed">
              <strong>S&P 500 (Standard and Poor's 500)</strong> คือดัชนีที่ติดตามบริษัทยักษ์ใหญ่ 500 แห่งในสหรัฐอเมริกา (NYSE + NASDAQ) ครอบคลุมทุกอุตสาหกรรม ตั้งแต่ Technology, Healthcare, Financials, Consumer ฯลฯ ถือเป็นดัชนีที่สะท้อนภาพรวมเศรษฐกิจสหรัฐฯ และโลกได้ดีที่สุด
            </p>
            <div className="grid grid-cols-2 gap-4 mb-8">
              {[
                ['Average Annual Return', '~10% (ย้อนหลัง 50 ปี)'],
                ['Total Market Cap', '$40+ Trillion'],
                ['Number of Constituents', '503 หุ้นชั้นนำ'],
                ['Inception Year', '1957'],
              ].map(([k, v]) => (
                <div key={k} className="card p-5 transition-colors hover:border-primary/40">
                  <div className="text-[11px] font-bold text-tertiary uppercase tracking-wider mb-2">{k}</div>
                  <div className="text-xl font-extrabold text-ink">{v}</div>
                </div>
              ))}
            </div>
            <div className="bg-primary-bg border border-primary/20 rounded-2xl p-6">
              <h4 className="text-[15px] font-bold text-ink mb-4">ETF ยอดนิยมที่อ้างอิง S&P 500</h4>
              <div className="flex flex-wrap gap-3">
                {[
                  { t: 'VOO', desc: 'Vanguard, ค่าธรรมเนียม 0.03%' },
                  { t: 'SPY', desc: 'SPDR, สภาพคล่องสูงสุดในโลก' },
                  { t: 'IVV', desc: 'iShares (BlackRock)' },
                ].map(etf => (
                  <button key={etf.t} onClick={() => navigate(`/stock/${etf.t}`)}
                    className="flex flex-col items-start px-5 py-3 bg-surface border border-color rounded-xl hover:border-primary transition-colors cursor-pointer w-full sm:w-auto">
                    <span className="text-[16px] font-bold text-primary mb-1">{etf.t}</span>
                    <span className="text-[12px] text-secondary">{etf.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="lg:col-span-2">
            <div className="card p-6 h-full flex flex-col justify-center">
              <div className="text-[13px] font-bold text-ink uppercase tracking-wider mb-6">Top Holdings by Weight</div>
              <div className="flex flex-col gap-4">
                {SP500_HOLDINGS.map(h => <HoldingBar key={h.ticker} {...h} color="#3B82F6" />)}
              </div>
            </div>
          </div>
        </div>
      </FadeSection>

      {/* ── Ch.5: NASDAQ 100 ────────────────────────────────────────────── */}
      <FadeSection>
        <SectionLabel>Chapter 5</SectionLabel>
        <SectionTitle>ดัชนีหุ้นเทคโนโลยี: NASDAQ 100</SectionTitle>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3">
            <p className="text-[16px] text-secondary mb-8 leading-relaxed">
              <strong>NASDAQ 100 (NDX)</strong> คือดัชนีที่ประกอบด้วยบริษัทที่ใหญ่ที่สุด 100 แห่งจาก NASDAQ Stock Exchange ส่วนใหญ่เป็นบริษัทในกลุ่ม Technology, Biotech, และ Consumer Discretionary ที่เน้นการเติบโตสูง
            </p>
            <p className="text-[16px] text-secondary mb-8 leading-relaxed">
              เปรียบเทียบกับ S&P 500: NASDAQ 100 มีความผันผวนสูงกว่า แต่ก็ให้ผลตอบแทนที่ดีกว่าในช่วงตลาดขาขึ้น ช่วง 10 ปีที่ผ่านมา NASDAQ 100 ให้ผลตอบแทนเฉลี่ยประมาณ 18-20% ต่อปี
            </p>
            <div className="grid grid-cols-2 gap-4 mb-8">
              {[
                ['Average Annual Return', '~18% (10 ปีที่ผ่านมา)'],
                ['Sector Focus', 'Technology (60%+)'],
                ['Number of Constituents', '100 บริษัทชั้นนำ'],
                ['Founded', '1985 (NASDAQ)'],
              ].map(([k, v]) => (
                <div key={k} className="card p-5 transition-colors hover:border-purple-400/40">
                  <div className="text-[11px] font-bold text-tertiary uppercase tracking-wider mb-2">{k}</div>
                  <div className="text-xl font-extrabold text-ink">{v}</div>
                </div>
              ))}
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-800/30 rounded-2xl p-6">
              <h4 className="text-[15px] font-bold text-ink mb-4">ETF ยอดนิยมที่อ้างอิง NASDAQ 100</h4>
              <div className="flex flex-wrap gap-3">
                {[
                  { t: 'QQQ', desc: 'Invesco, สภาพคล่องสูงสุด, ค่าธรรมเนียม 0.20%' },
                  { t: 'QQQM', desc: 'Invesco Mini, เหมาะสำหรับ DCA, 0.15%' },
                  { t: 'TQQQ', desc: 'ProShares 3x Leveraged (ความเสี่ยงสูงมาก)' },
                ].map(etf => (
                  <button key={etf.t} onClick={() => navigate(`/stock/${etf.t}`)}
                    className="flex flex-col items-start px-5 py-3 bg-surface border border-color rounded-xl hover:border-purple-400 transition-colors cursor-pointer w-full sm:w-auto">
                    <span className="text-[16px] font-bold text-purple-600 mb-1">{etf.t}</span>
                    <span className="text-[12px] text-secondary">{etf.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="lg:col-span-2">
            <div className="card p-6 h-full flex flex-col justify-center">
              <div className="text-[13px] font-bold text-ink uppercase tracking-wider mb-6">Top Holdings by Weight</div>
              <div className="flex flex-col gap-4">
                {NDX100_HOLDINGS.map(h => <HoldingBar key={h.ticker} {...h} color="#8B5CF6" />)}
              </div>
            </div>
          </div>
        </div>

        {/* S&P500 vs NASDAQ comparison */}
        <div className="mt-10 card p-8">
          <h3 className="text-xl font-bold text-ink mb-6">S&P 500 vs NASDAQ 100 — เลือกอันไหนดี?</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 rounded-xl bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/30">
              <div className="text-[14px] font-bold text-blue-600 mb-3">✅ เลือก S&P 500 (VOO/SPY) ถ้า...</div>
              <ul className="space-y-2">
                {['ต้องการการกระจายความเสี่ยงทุกอุตสาหกรรม', 'รับความผันผวนได้ปานกลาง', 'ลงทุนระยะยาว 10+ ปี สาย Conservative', 'เพิ่งเริ่มต้นลงทุน'].map(t => (
                  <li key={t} className="text-[13px] text-secondary flex items-start gap-2"><span className="text-blue-500">→</span>{t}</li>
                ))}
              </ul>
            </div>
            <div className="p-5 rounded-xl bg-purple-50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-800/30">
              <div className="text-[14px] font-bold text-purple-600 mb-3">✅ เลือก NASDAQ 100 (QQQ/QQQM) ถ้า...</div>
              <ul className="space-y-2">
                {['เชื่อมั่นในการเติบโตของเทคโนโลยีระยะยาว', 'รับความผันผวนสูงได้ (อาจร่วง 30-40% ในช่วง Bear Market)', 'ต้องการ Upside สูงกว่า S&P 500', 'มีกรอบเวลาลงทุน 5+ ปี'].map(t => (
                  <li key={t} className="text-[13px] text-secondary flex items-start gap-2"><span className="text-purple-500">→</span>{t}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </FadeSection>

      {/* ── Ch.6: Psychology ────────────────────────────────────────────── */}
      <FadeSection>
        <SectionLabel>Chapter 6</SectionLabel>
        <SectionTitle>จิตวิทยาการลงทุน (Investment Psychology)</SectionTitle>
        <p className="text-[16px] text-secondary mb-10 max-w-3xl leading-relaxed">
          นักลงทุนที่ประสบความสำเร็จส่วนใหญ่ไม่ได้ฉลาดที่สุด แต่พวกเขา "ควบคุมอารมณ์" ได้ดีที่สุด การทำความเข้าใจกับดักทางจิตวิทยาที่พบบ่อยจะช่วยให้คุณตัดสินใจได้อย่างมีเหตุผลมากขึ้น
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { icon: Brain, color: '#EF4444', bg: 'bg-red-50 dark:bg-red-900/10', border: 'border-red-200', title: 'FOMO (Fear of Missing Out)', desc: 'ความกลัวที่จะพลาดโอกาส ทำให้นักลงทุนตัดสินใจซื้อตอนราคาขึ้นสูงแล้ว เพราะเห็นคนอื่นทำกำไร วิธีแก้: มีแผนการลงทุนที่ชัดเจนและยึดตาม ไม่ไล่ราคา' },
            { icon: Activity, color: '#F59E0B', bg: 'bg-amber-50 dark:bg-amber-900/10', border: 'border-amber-200', title: 'Loss Aversion (กลัวขาดทุน)', desc: 'จิตวิทยาพบว่าความเจ็บปวดจากการขาดทุน $100 รู้สึกแรงกว่าความยินดีจากการได้กำไร $100 ถึง 2 เท่า ทำให้นักลงทุนถือหุ้นขาดทุนนานเกินไป หรือขายหุ้นดีเร็วเกินไป' },
            { icon: BarChart2, color: '#8B5CF6', bg: 'bg-purple-50 dark:bg-purple-900/10', border: 'border-purple-200', title: 'Overconfidence Bias', desc: 'นักลงทุนมักมั่นใจในตัวเองมากเกินไป คิดว่าตนเองสามารถเลือกหุ้นที่ดีกว่าตลาดได้ งานวิจัยพบว่านักลงทุนส่วนบุคคลส่วนใหญ่ได้ผลตอบแทนต่ำกว่า Index Fund ในระยะยาว' },
            { icon: Clock, color: '#10B981', bg: 'bg-emerald-50 dark:bg-emerald-900/10', border: 'border-emerald-200', title: 'Time in Market > Timing the Market', desc: 'ไม่มีใครสามารถทายจังหวะตลาดได้อย่างสม่ำเสมอ การลงทุนระยะยาวอย่างต่อเนื่อง (DCA) มักชนะการพยายามหา "จุดต่ำสุด" เสมอ Warren Buffett กล่าวว่า "Time in the market beats timing the market"' },
            { icon: ShieldCheck, color: '#3B82F6', bg: 'bg-blue-50 dark:bg-blue-900/10', border: 'border-blue-200', title: 'Herd Mentality (ตามฝูงชน)', desc: 'แนวโน้มที่จะทำตามสิ่งที่คนส่วนใหญ่ทำ ซื้อเพราะทุกคนซื้อ ขายเพราะทุกคนขาย ซึ่งมักทำให้ซื้อแพงและขายถูก Warren Buffett กล่าวว่า "กลัวเมื่อคนอื่นโลภ โลภเมื่อคนอื่นกลัว"' },
            { icon: TrendingUp, color: '#F97316', bg: 'bg-orange-50 dark:bg-orange-900/10', border: 'border-orange-200', title: 'Dollar-Cost Averaging (DCA)', desc: 'การลงทุนด้วยจำนวนเงินเท่ากันทุกๆ ช่วงเวลา (เช่น ทุกเดือน) โดยไม่สนใจราคาตลาดในขณะนั้น วิธีนี้จะลดต้นทุนเฉลี่ยโดยอัตโนมัติ และป้องกันการตัดสินใจตามอารมณ์' },
          ].map(({ icon: Icon, color, bg, border, title, desc }) => (
            <div key={title} className={`card p-7 border ${border} ${bg} transition-transform hover:-translate-y-1`}>
              <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-5" style={{ background: color + '20', color }}>
                <Icon size={22} />
              </div>
              <h4 className="text-[16px] font-bold text-ink mb-3">{title}</h4>
              <p className="text-[13px] text-secondary leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </FadeSection>

      {/* ── CTA ─────────────────────────────────────────────────────────────── */}
      <FadeSection className="mt-10">
        <div className="card p-12 text-center bg-gradient-to-br from-[#1E293B] to-[#0F172A] border-none shadow-2xl relative overflow-hidden transition-transform hover:-translate-y-1">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary opacity-20 blur-[100px] rounded-full pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#10B981] opacity-20 blur-[100px] rounded-full pointer-events-none" />
          <div className="relative z-10">
            <h2 className="text-4xl font-extrabold text-white tracking-tight mb-4">
              พร้อมที่จะสร้างพอร์ตการลงทุนแล้วหรือยัง?
            </h2>
            <p className="text-[16px] text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed">
              นำความรู้ที่คุณได้เรียนรู้ไปปรับใช้จริง เริ่มต้นด้วยการทดลองคำนวณการเติบโตแบบ DCA หรือแวะดูวิธีจัดพอร์ตของเหล่านักลงทุนระดับโลก
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button onClick={() => navigate('/dca-calculator')}
                className="px-8 py-4 bg-primary hover:bg-blue-600 text-white rounded-full font-bold text-[15px] transition-colors border-none cursor-pointer flex items-center justify-center gap-2">
                คำนวณแผน DCA <ArrowRight size={18} />
              </button>
              <button onClick={() => navigate('/investors')}
                className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white rounded-full font-bold text-[15px] transition-colors border border-white/10 cursor-pointer">
                แอบดูพอร์ตนักลงทุน
              </button>
              <button onClick={() => navigate('/')}
                className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white rounded-full font-bold text-[15px] transition-colors border border-white/10 cursor-pointer">
                ดูราคาหุ้น Live
              </button>
            </div>
          </div>
        </div>
      </FadeSection>

    </div>
  )
}
