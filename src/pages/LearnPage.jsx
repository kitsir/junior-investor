import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  BookOpen, ArrowDown, ChevronDown, ChevronUp,
  LineChart, Building2, Calculator, Wallet, 
  Activity, ArrowRight, ShieldCheck, AlertCircle, 
  Globe2, PieChart, Coins
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

const TERMS = [
  { 
    term: 'Stock / Equity', 
    en: 'หุ้น (สัดส่วนความเป็นเจ้าของ)', 
    icon: Building2, 
    desc: 'หุ้นคือตราสารทุนที่แสดงถึง "ความเป็นเจ้าของ" ในบริษัทนั้นๆ เมื่อคุณซื้อหุ้น คุณจะกลายเป็นผู้ถือหุ้น (Shareholder) ซึ่งมีสิทธิในทรัพย์สินและกำไรของบริษัทตามสัดส่วนที่คุณถืออยู่\n\nหากบริษัทเติบโตและทำกำไรได้ดี มูลค่าของบริษัทจะเพิ่มขึ้น ทำให้ราคาหุ้นในตลาดปรับตัวสูงขึ้นตามไปด้วย คุณจะได้รับผลตอบแทนในรูปแบบของ "ส่วนต่างราคา (Capital Gain)" หรือรับปันผล (Dividend)', 
    example: 'หากคุณซื้อหุ้น AAPL (Apple) 1 หุ้น หมายความว่าคุณคือหนึ่งในเจ้าของบริษัท Apple แม้จะเป็นเพียงสัดส่วนที่เล็กมากก็ตาม' 
  },
  { 
    term: 'Market Cap', 
    en: 'มูลค่าตลาดรวมของบริษัท (Market Capitalization)', 
    icon: PieChart, 
    desc: 'Market Cap คือมูลค่ารวมทั้งหมดของบริษัทที่ประเมินจากตลาดหลักทรัพย์ คำนวณได้จากการนำ "ราคาหุ้นปัจจุบัน" มาคูณกับ "จำนวนหุ้นทั้งหมด" ที่จดทะเบียนในตลาด\n\nตัวชี้วัดนี้ช่วยให้เราแบ่งขนาดของบริษัทได้ เช่น Large-cap (บริษัทขนาดใหญ่ มีความมั่นคงสูง), Mid-cap (บริษัทขนาดกลาง มีโอกาสเติบโต), และ Small-cap (บริษัทขนาดเล็ก ความเสี่ยงสูงแต่โอกาสเติบโตแบบก้าวกระโดดก็สูง)', 
    example: 'บริษัท Apple มีหุ้นทั้งหมด 15 พันล้านหุ้น หุ้นละ $200 ดังนั้น Market Cap = 15B * $200 = 3 ล้านล้านดอลลาร์ (3 Trillion USD)' 
  },
  { 
    term: 'P/E Ratio', 
    en: 'อัตราส่วนราคาต่อกำไร (Price to Earnings)', 
    icon: Calculator, 
    desc: 'P/E ย่อมาจาก Price-to-Earnings Ratio คืออัตราส่วนเปรียบเทียบระหว่าง "ราคาหุ้น" กับ "กำไรต่อหุ้น (EPS)" เป็นตัวชี้วัดพื้นฐานที่นักลงทุนใช้ดูว่า หุ้นตัวนั้นมีความถูกหรือแพงแค่ไหนเมื่อเทียบกับความสามารถในการทำกำไร\n\n- P/E สูง: นักลงทุนคาดหวังการเติบโตในอนาคต จึงยอมซื้อแพง\n- P/E ต่ำ: หุ้นอาจจะมีราคาถูก (Undervalued) หรือบริษัทอาจหมดความน่าสนใจไปแล้ว', 
    example: 'บริษัท A ราคาหุ้น 100 บาท ทำกำไรได้ปีละ 4 บาท/หุ้น (P/E = 25) หมายความว่า หากบริษัททำกำไรได้เท่าเดิมไปตลอด คุณต้องถือหุ้น 25 ปีถึงจะคืนทุน' 
  },
  { 
    term: 'Dividend', 
    en: 'เงินปันผล (Dividend Yield)', 
    icon: Coins, 
    desc: 'เงินปันผลคือส่วนแบ่งกำไรที่บริษัทนำมาแจกจ่ายให้กับผู้ถือหุ้น (ปกติจะจ่ายทุกไตรมาส หรือทุกปี) บริษัทที่จ่ายปันผลสม่ำเสมอมักจะเป็นบริษัทขนาดใหญ่ที่เติบโตเต็มที่แล้ว (Mature Company) และมีกระแสเงินสดที่แข็งแกร่ง\n\nนักลงทุนสาย VI (Value Investor) มักจะชอบหุ้นปันผล เพราะเป็นเหมือนกระแสเงินสด (Passive Income) ที่เข้ากระเป๋าอย่างต่อเนื่องโดยไม่ต้องขายหุ้นทิ้ง', 
    example: 'คุณลงทุน $10,000 ในหุ้น JNJ ที่มี Dividend Yield 3% ต่อปี คุณจะได้รับเงินสดเข้าบัญชีปีละ $300' 
  },
  { 
    term: 'Beta (β)', 
    en: 'ความผันผวนเทียบกับตลาด (Volatility Metric)', 
    icon: Activity, 
    desc: 'Beta เป็นค่าสถิติที่วัดความผันผวนของราคาหุ้นตัวหนึ่ง เทียบกับดัชนีตลาดโดยรวม (เช่น S&P 500)\n\n- Beta = 1 : หุ้นแกว่งตัวเท่ากับตลาด\n- Beta > 1 : หุ้นผันผวนแรงกว่าตลาด (เช่น หุ้นกลุ่มเทคโนโลยี ถ้าตลาดขึ้น 1% หุ้นนี้อาจขึ้น 1.5%)\n- Beta < 1 : หุ้นผันผวนน้อยกว่าตลาด (เช่น หุ้นกลุ่มสาธารณูปโภค โตช้าแต่มั่นคง ลดความเสี่ยงในช่วงตลาดขาลงได้ดี)', 
    example: 'หุ้น TSLA มีค่า Beta ที่ 2.0 แปลว่าถ้าตลาดหุ้นร่วง 5% ในหนึ่งวัน หุ้น TSLA มีแนวโน้มจะร่วงแรงถึง 10%' 
  },
  { 
    term: 'Free Cash Flow', 
    en: 'กระแสเงินสดอิสระ (FCF)', 
    icon: Wallet, 
    desc: 'กระแสเงินสดอิสระ (FCF) คือเงินสดสุทธิที่บริษัทสร้างได้ หลังจากหักค่าใช้จ่ายในการดำเนินงานและการลงทุนในสินทรัพย์ถาวร (CAPEX) ไปแล้ว\n\nFCF เป็นหนึ่งในตัวชี้วัดที่สำคัญที่สุดในการดูสุขภาพทางการเงินของบริษัท เพราะเงินสดก้อนนี้สามารถนำไป จ่ายปันผล, ซื้อหุ้นคืน, นำไปชำระหนี้, หรือต่อยอดธุรกิจใหม่ๆ โดยไม่ต้องกู้ยืม บริษัทที่มีกำไรทางบัญชี แต่ไม่มีเงินสดอิสระ มักจะล้มละลายได้ในยามวิกฤต', 
    example: 'บริษัท Tech ยักษ์ใหญ่มักมี FCF เป็นบวกหลักหมื่นล้านดอลลาร์ ทำให้สามารถนำเงินสดไปเทคโอเวอร์บริษัทคู่แข่งได้ทันที' 
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
          <div className="mt-16 text-tertiary flex flex-col items-center gap-2">
            <span className="text-[13px] font-semibold tracking-wider uppercase">เลื่อนเพื่ออ่านเนื้อหา</span>
            <ArrowDown size={20} className="animate-bounce" />
          </div>
        </div>
      </div>

      {/* ── Section 1: Terminology ──────────────────────────────────────── */}
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

      {/* ── Section 2: Technicals ───────────────────────────────────────── */}
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

      {/* ── Section 3: Asset Classes ────────────────────────────────────── */}
      <FadeSection>
        <SectionLabel>Chapter 3</SectionLabel>
        <SectionTitle>Understanding Asset Classes (ประเภทของสินทรัพย์)</SectionTitle>
        <p className="text-[16px] text-secondary mb-10 max-w-3xl leading-relaxed">
          สินทรัพย์แต่ละประเภทมาพร้อมกับความเสี่ยงและผลตอบแทนที่ต่างกัน การจัดพอร์ตแบบผสมผสาน (Asset Allocation) จะช่วยให้ทนทานต่อทุกสภาวะเศรษฐกิจและลดความเสี่ยงจากการขาดทุนหนัก
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card p-8 transition-transform hover:-translate-y-1">
            <div className="w-12 h-12 rounded-xl bg-red-500/10 text-[#EF4444] flex items-center justify-center mb-6">
              <LineChart size={24} />
            </div>
            <h3 className="text-lg font-bold text-ink mb-2">Individual Stocks (หุ้นรายตัว)</h3>
            <div className="text-[13px] font-semibold text-[#EF4444] mb-6">High Risk • High Potential Reward</div>
            <ul className="space-y-3 mb-8">
              <li className="text-[14px] text-secondary flex items-start gap-2"><span className="text-ink font-bold">•</span> มีโอกาสทำกำไรได้สูงแบบไม่จำกัด</li>
              <li className="text-[14px] text-secondary flex items-start gap-2"><span className="text-ink font-bold">•</span> โฟกัสการลงทุนในบริษัทที่คุณเชื่อมั่น</li>
              <li className="text-[14px] text-secondary flex items-start gap-2"><span className="text-ink font-bold">•</span> ต้องใช้เวลาศึกษาปัจจัยพื้นฐานอย่างหนัก</li>
              <li className="text-[14px] text-secondary flex items-start gap-2"><span className="text-ink font-bold">•</span> ความผันผวนสูงมาก และมีสิทธิเงินต้นสูญหายหากบริษัทล้มละลาย</li>
            </ul>
          </div>

          <div className="card p-8 border border-primary/30 relative overflow-hidden transition-transform hover:-translate-y-1">
            <div className="absolute top-0 right-0 px-3 py-1 bg-primary text-white text-[10px] font-bold uppercase tracking-wider rounded-bl-lg">แนะนำสำหรับมือใหม่</div>
            <div className="w-12 h-12 rounded-xl bg-primary-bg text-primary flex items-center justify-center mb-6">
              <Globe2 size={24} />
            </div>
            <h3 className="text-lg font-bold text-ink mb-2">ETFs & Index Funds</h3>
            <div className="text-[13px] font-semibold text-primary mb-6">Moderate Risk • Steady Long-term Growth</div>
            <ul className="space-y-3 mb-8">
              <li className="text-[14px] text-secondary flex items-start gap-2"><span className="text-primary font-bold">•</span> กระจายความเสี่ยงทันที เพราะซื้อ 1 กองทุนเท่ากับได้ถือหุ้นหลายร้อยตัว</li>
              <li className="text-[14px] text-secondary flex items-start gap-2"><span className="text-primary font-bold">•</span> ค่าธรรมเนียมการบริหารต่ำมาก (Expense Ratios ต่ำ)</li>
              <li className="text-[14px] text-secondary flex items-start gap-2"><span className="text-primary font-bold">•</span> เติบโตตามทิศทางของตลาดหุ้นโดยรวมในระยะยาว</li>
              <li className="text-[14px] text-secondary flex items-start gap-2"><span className="text-primary font-bold">•</span> เหมาะสำหรับการลงทุนแบบ DCA และสาย Passive</li>
            </ul>
          </div>

          <div className="card p-8 transition-transform hover:-translate-y-1">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-[#10B981] flex items-center justify-center mb-6">
              <Building2 size={24} />
            </div>
            <h3 className="text-lg font-bold text-ink mb-2">Bonds (พันธบัตร/ตราสารหนี้)</h3>
            <div className="text-[13px] font-semibold text-[#10B981] mb-6">Low Risk • Capital Preservation</div>
            <ul className="space-y-3 mb-8">
              <li className="text-[14px] text-secondary flex items-start gap-2"><span className="text-ink font-bold">•</span> ให้ผลตอบแทนเป็นดอกเบี้ยรับที่สม่ำเสมอและคาดเดาได้</li>
              <li className="text-[14px] text-secondary flex items-start gap-2"><span className="text-ink font-bold">•</span> เป็นเบาะรองรับแรงกระแทกในช่วงที่ตลาดหุ้นเกิดวิกฤต</li>
              <li className="text-[14px] text-secondary flex items-start gap-2"><span className="text-ink font-bold">•</span> ปกป้องเงินต้นได้ดีเยี่ยม ปลอดภัยกว่าหุ้น</li>
              <li className="text-[14px] text-secondary flex items-start gap-2"><span className="text-ink font-bold">•</span> ผลตอบแทนในระยะยาวอาจเอาชนะอัตราเงินเฟ้อไม่ได้</li>
            </ul>
          </div>
        </div>
      </FadeSection>

      {/* ── Section 4: The S&P 500 ──────────────────────────────────────── */}
      <FadeSection>
        <SectionLabel>Chapter 4</SectionLabel>
        <SectionTitle>The Core of Investing: ดัชนี S&P 500</SectionTitle>
        
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3">
            <p className="text-[16px] text-secondary mb-8 leading-relaxed">
              <strong>S&P 500 (Standard and Poor's 500)</strong> คือดัชนีตลาดหุ้นที่ติดตามผลการดำเนินงานของบริษัทยักษ์ใหญ่ 500 แห่งที่จดทะเบียนในตลาดหลักทรัพย์สหรัฐอเมริกา (ทั้ง NYSE และ NASDAQ) 
              ดัชนีนี้เปรียบเสมือนภาพสะท้อนเศรษฐกิจของสหรัฐฯ และโลกใบนี้ และได้รับการยอมรับจาก วอร์เรน บัฟเฟตต์ ว่าเป็นเครื่องมือการลงทุนที่ดีที่สุดสำหรับคนส่วนใหญ่
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
              <h4 className="text-[15px] font-bold text-ink mb-4">กองทุน ETF ยอดนิยมที่อ้างอิงดัชนี S&P 500</h4>
              <div className="flex flex-wrap gap-3">
                {[
                  { t: 'VOO', desc: 'บริหารโดย Vanguard, ค่าธรรมเนียม 0.03%' },
                  { t: 'SPY', desc: 'บริหารโดย SPDR, สภาพคล่องสูงที่สุดในโลก' },
                  { t: 'IVV', desc: 'บริหารโดย iShares (BlackRock)' }
                ].map(etf => (
                  <button
                    key={etf.t}
                    onClick={() => navigate(`/stock/${etf.t}`)}
                    className="flex flex-col items-start px-5 py-3 bg-surface border border-color rounded-xl hover:border-primary transition-colors cursor-pointer w-full sm:w-auto"
                  >
                    <span className="text-[16px] font-bold text-primary mb-1">{etf.t}</span>
                    <span className="text-[12px] text-secondary">{etf.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          <div className="lg:col-span-2">
            <div className="card p-6 h-full flex flex-col justify-center">
              <div className="text-[13px] font-bold text-ink uppercase tracking-wider mb-6">Top Constituents by Weight (บริษัทที่มีสัดส่วนสูงสุด)</div>
              <div className="flex flex-col gap-4">
                {SP500_HOLDINGS.map(h => (
                  <HoldingBar key={h.ticker} {...h} color="#3B82F6" />
                ))}
              </div>
            </div>
          </div>
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
              นำความรู้ที่คุณได้เรียนรู้ ไปปรับใช้จริง! เริ่มต้นด้วยการทดลองคำนวณการเติบโตแบบ DCA หรือแวะเข้าไปดูวิธีการจัดพอร์ตของเหล่านักลงทุนระดับโลก
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate('/dca-calculator')}
                className="px-8 py-4 bg-primary hover:bg-blue-600 text-white rounded-full font-bold text-[15px] transition-colors border-none cursor-pointer flex items-center justify-center gap-2"
              >
                คำนวณแผน DCA <ArrowRight size={18} />
              </button>
              <button
                onClick={() => navigate('/investors')}
                className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white rounded-full font-bold text-[15px] transition-colors border border-white/10 cursor-pointer"
              >
                แอบดูพอร์ตนักลงทุน
              </button>
            </div>
          </div>
        </div>
      </FadeSection>

    </div>
  )
}
