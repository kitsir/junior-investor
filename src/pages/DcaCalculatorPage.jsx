import { useState, useEffect } from 'react'
import { Calculator, Sparkles, TrendingUp, DollarSign, Calendar, User, ArrowRight } from 'lucide-react'
import { fmt } from '../utils/formatters.js'

function MetricCard({ title, value, sub, highlight = false }) {
  return (
    <div className={`card p-6 relative overflow-hidden transition-all ${highlight ? 'bg-gradient-to-br from-primary/10 to-primary/5 border-primary/30 shadow-[0_0_30px_rgba(59,130,246,0.15)]' : ''}`}>
      {highlight && (
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-[50px] rounded-full pointer-events-none" />
      )}
      <div className="text-[12px] font-bold text-tertiary uppercase tracking-widest mb-2">{title}</div>
      <div className={`text-3xl font-extrabold tracking-tight ${highlight ? 'text-primary' : 'text-ink'}`}>
        {value}
      </div>
      {sub && (
        <div className="text-[13px] text-secondary mt-2 font-medium">{sub}</div>
      )}
    </div>
  )
}

function InputRow({ icon: Icon, label, value, onChange, min, max, step = 1, prefix, suffix }) {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <label className="flex items-center gap-2 text-[14px] font-bold text-ink">
          <div className="w-8 h-8 rounded-lg bg-surface flex items-center justify-center border border-color text-secondary">
            <Icon size={16} />
          </div>
          {label}
        </label>
        <div className="flex items-center text-[18px] font-extrabold text-primary bg-primary-bg px-3 py-1 rounded-lg border border-primary/20 focus-within:border-primary">
          {prefix}
          <input
            type="number"
            value={value === 0 ? '' : value}
            onChange={(e) => {
              let v = e.target.value === '' ? 0 : Number(e.target.value);
              onChange(v);
            }}
            onBlur={() => {
              if (value < min) onChange(min);
              if (value > max) onChange(max);
            }}
            className="bg-transparent border-none outline-none text-primary font-extrabold w-20 text-right"
            style={{ MozAppearance: 'textfield' }}
          />
          {suffix}
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-primary"
        style={{ background: 'var(--primary-bg)', opacity: 0.8 }}
      />
      <div className="flex justify-between text-[11px] font-bold text-tertiary mt-2">
        <span>{prefix}{min.toLocaleString()}{suffix}</span>
        <span>{prefix}{max.toLocaleString()}{suffix}</span>
      </div>
    </div>
  )
}

export default function DcaCalculatorPage() {
  const [monthly, setMonthly] = useState(5000)
  const [years, setYears] = useState(10)
  const [rate, setRate] = useState(8)
  const [age, setAge] = useState(25)

  // Calculations
  const [results, setResults] = useState({ principal: 0, futureValue: 0, interest: 0 })

  useEffect(() => {
    // Formula: FV = P * (((1 + r/n)^(nt) - 1) / (r/n))
    // P = monthly, r = rate/100, n = 12, t = years
    const P = monthly
    const r = rate / 100
    const n = 12
    const t = years

    const principal = P * n * t
    let futureValue = 0

    if (r === 0) {
      futureValue = principal
    } else {
      futureValue = P * ((Math.pow(1 + r/n, n * t) - 1) / (r/n))
    }

    setResults({
      principal,
      futureValue,
      interest: futureValue - principal
    })
  }, [monthly, years, rate])

  // Simple visualizer bars
  const total = results.futureValue
  const principalPct = total > 0 ? (results.principal / total) * 100 : 0
  const interestPct = total > 0 ? (results.interest / total) * 100 : 0

  return (
    <div className="w-full max-w-5xl mx-auto py-10 px-4 md:px-0 pb-32">
      
      <div className="flex flex-col items-center text-center mb-12 animate-fade-in">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#10B981] to-[#059669] flex items-center justify-center shadow-lg shadow-emerald-500/30 mb-6">
          <Calculator size={32} color="#fff" strokeWidth={1.5} />
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-ink tracking-tight mb-4">
          DCA Calculator
        </h1>
        <p className="text-lg text-secondary max-w-xl mx-auto">
          ออกแบบอนาคตทางการเงินของคุณด้วยพลังของ "ดอกเบี้ยทบต้น" (Compound Interest) จำลองผลลัพธ์การลงทุนรายเดือนระยะยาว
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-8">
        
        {/* Controls */}
        <div className="card p-6 md:p-8 relative overflow-hidden animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="text-[13px] font-bold text-ink uppercase tracking-wider mb-8 flex items-center gap-2">
            <TrendingUp size={16} className="text-primary" /> กำหนดแผนการลงทุน
          </div>

          <InputRow 
            icon={DollarSign} label="เงินลงทุนต่อเดือน (THB)" 
            value={monthly} onChange={setMonthly} 
            min={1000} max={100000} step={1000} 
            prefix="฿" suffix="" 
          />
          <InputRow 
            icon={Calendar} label="ระยะเวลาลงทุน (ปี)" 
            value={years} onChange={setYears} 
            min={1} max={50} step={1} 
            prefix="" suffix=" ปี" 
          />
          <InputRow 
            icon={Sparkles} label="ผลตอบแทนคาดหวังต่อปี (%)" 
            value={rate} onChange={setRate} 
            min={0} max={25} step={0.5} 
            prefix="" suffix="%" 
          />
          <InputRow 
            icon={User} label="อายุเริ่มลงทุน (ปัจจุบัน)" 
            value={age} onChange={setAge} 
            min={15} max={70} step={1} 
            prefix="" suffix=" ปี" 
          />
        </div>

        {/* Results */}
        <div className="flex flex-col gap-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          
          <MetricCard 
            title="มูลค่าพอร์ตในอนาคต (Future Value)" 
            value={`฿${results.futureValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} 
            sub={`มูลค่าสุทธิเมื่อคุณอายุ ${age + years} ปี`}
            highlight={true}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <MetricCard 
              title="เงินต้นทั้งหมด (Principal)" 
              value={`฿${results.principal.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} 
              sub={`ทะยอยลงทุนเดือนละ ${monthly.toLocaleString()} บาท`}
            />
            <MetricCard 
              title="กำไรดอกเบี้ยทบต้น (Interest)" 
              value={`+ ฿${results.interest.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} 
              sub="พลังมหัศจรรย์ของดอกเบี้ยทบต้น"
            />
          </div>

          {/* Visualizer */}
          <div className="card p-6 md:p-8">
            <div className="text-[13px] font-bold text-ink uppercase tracking-wider mb-6">สัดส่วนพอร์ตการลงทุน</div>
            
            <div className="h-6 rounded-full overflow-hidden flex mb-6 bg-divider">
              <div 
                style={{ width: `${principalPct}%`, background: 'var(--text-tertiary)', transition: 'width 0.5s ease-out' }} 
                title="เงินต้น"
              />
              <div 
                style={{ width: `${interestPct}%`, background: 'var(--primary)', transition: 'width 0.5s ease-out' }} 
                title="กำไรทบต้น"
              />
            </div>
            
            <div className="flex justify-between text-[13px] font-semibold">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-tertiary" />
                <span className="text-secondary">เงินต้น ({principalPct.toFixed(1)}%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary" />
                <span className="text-primary font-bold">กำไร ({interestPct.toFixed(1)}%)</span>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  )
}
