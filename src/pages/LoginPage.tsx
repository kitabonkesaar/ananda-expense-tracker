import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Phone, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');

  const handleSendOtp = () => {
    if (phone.length >= 4) setStep('otp');
  };

  const handleVerify = () => {
    login(phone);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-background">
      <div className="w-full max-w-sm animate-fade-up">
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/20">
            <span className="text-primary-foreground font-extrabold text-xl">AR</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground leading-tight">Ananda Rath</h1>
          <p className="text-sm text-muted-foreground mt-1">Expense Manager</p>
        </div>

        <div className="bg-card rounded-2xl p-6 shadow-lg shadow-foreground/5 border border-border">
          {step === 'phone' ? (
            <>
              <label className="text-sm font-medium text-foreground block mb-2">Phone Number</label>
              <div className="flex items-center gap-2 bg-secondary rounded-xl px-3 py-3 mb-4">
                <Phone className="w-5 h-5 text-muted-foreground shrink-0" />
                <span className="text-sm text-muted-foreground">+91</span>
                <input
                  type="tel"
                  placeholder="98765 43210"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="flex-1 bg-transparent text-foreground text-sm outline-none placeholder:text-muted-foreground"
                  autoFocus
                />
              </div>
              <button
                onClick={handleSendOtp}
                className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-3.5 rounded-xl font-semibold text-sm active:scale-[0.98] transition-transform shadow-md shadow-primary/25"
              >
                Send OTP <ArrowRight className="w-4 h-4" />
              </button>
              <p className="text-xs text-muted-foreground text-center mt-4">
                Demo: Enter any number or leave blank to login as admin
              </p>
            </>
          ) : (
            <>
              <label className="text-sm font-medium text-foreground block mb-2">Enter OTP</label>
              <div className="flex gap-2 mb-4 justify-center">
                {[0, 1, 2, 3].map(i => (
                  <input
                    key={i}
                    type="text"
                    maxLength={1}
                    value={otp[i] || ''}
                    onChange={e => {
                      const val = otp.split('');
                      val[i] = e.target.value;
                      setOtp(val.join(''));
                      if (e.target.value && e.target.nextElementSibling) {
                        (e.target.nextElementSibling as HTMLInputElement).focus();
                      }
                    }}
                    className="w-12 h-14 text-center text-xl font-bold bg-secondary rounded-xl text-foreground outline-none focus:ring-2 focus:ring-primary transition-shadow"
                    autoFocus={i === 0}
                  />
                ))}
              </div>
              <button
                onClick={handleVerify}
                className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-3.5 rounded-xl font-semibold text-sm active:scale-[0.98] transition-transform shadow-md shadow-primary/25"
              >
                Verify & Login <ArrowRight className="w-4 h-4" />
              </button>
              <button onClick={() => setStep('phone')} className="w-full text-sm text-muted-foreground mt-3 py-2">
                ← Change number
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
