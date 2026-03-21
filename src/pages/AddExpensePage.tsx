import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, MapPin, IndianRupee, Tag, FileText, Check } from 'lucide-react';
import { ExpenseCategory } from '@/lib/types';
import { toast } from 'sonner';

const categories: ExpenseCategory[] = ['Fuel', 'Food', 'Toll', 'Hotel', 'Transport', 'Misc'];

export default function AddExpensePage() {
  const navigate = useNavigate();
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<ExpenseCategory | ''>('');
  const [description, setDescription] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);

  const canSubmit = amount && category && photo;

  const handlePhotoCapture = () => {
    // Demo: simulate photo capture
    setPhoto('/placeholder.svg');
    toast.success('Bill photo captured');
  };

  const handleSubmit = () => {
    if (!canSubmit) {
      if (!photo) toast.error('Bill photo is mandatory!');
      if (!category) toast.error('Select a category');
      if (!amount) toast.error('Enter an amount');
      return;
    }
    toast.success('Expense submitted successfully!');
    navigate('/dashboard');
  };

  return (
    <div className="pb-24 px-4 pt-4">
      <h2 className="text-lg font-bold text-foreground mb-5 animate-fade-up">Add Expense</h2>

      <div className="space-y-4 animate-fade-up stagger-1">
        {/* Amount */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Amount *</label>
          <div className="flex items-center gap-2 bg-card rounded-xl px-4 py-3.5 border border-border shadow-sm">
            <IndianRupee className="w-5 h-5 text-muted-foreground" />
            <input
              type="number"
              placeholder="0"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="flex-1 bg-transparent text-2xl font-bold text-foreground outline-none placeholder:text-muted-foreground/40 tabular-nums"
              autoFocus
            />
          </div>
        </div>

        {/* Category */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Category *</label>
          <div className="grid grid-cols-3 gap-2">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`py-2.5 rounded-xl text-sm font-medium transition-all active:scale-95 ${
                  category === cat
                    ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                    : 'bg-card border border-border text-foreground'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Description</label>
          <div className="flex items-start gap-2 bg-card rounded-xl px-4 py-3 border border-border shadow-sm">
            <FileText className="w-4 h-4 text-muted-foreground mt-0.5" />
            <textarea
              placeholder="Brief description..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={2}
              className="flex-1 bg-transparent text-sm text-foreground outline-none resize-none placeholder:text-muted-foreground/50"
            />
          </div>
        </div>

        {/* Photo Upload */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Bill Photo * (Mandatory)</label>
          {photo ? (
            <div className="relative bg-card rounded-xl border border-border p-3 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-lg bg-success/10 flex items-center justify-center">
                  <Check className="w-8 h-8 text-success" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Photo captured</p>
                  <button onClick={() => setPhoto(null)} className="text-xs text-destructive mt-0.5">Remove</button>
                </div>
              </div>
            </div>
          ) : (
            <button
              onClick={handlePhotoCapture}
              className="w-full flex flex-col items-center gap-2 bg-card rounded-xl border-2 border-dashed border-border p-6 active:scale-[0.98] transition-transform"
            >
              <Camera className="w-8 h-8 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Tap to capture bill photo</span>
            </button>
          )}
        </div>

        {/* Location */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-card rounded-xl px-4 py-3 border border-border">
          <MapPin className="w-4 h-4 text-primary" />
          <span>Location: 30.0869° N, 78.2676° E (auto-captured)</span>
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className={`w-full py-4 rounded-xl font-semibold text-base transition-all active:scale-[0.98] shadow-lg ${
            canSubmit
              ? 'bg-primary text-primary-foreground shadow-primary/25'
              : 'bg-muted text-muted-foreground cursor-not-allowed shadow-none'
          }`}
        >
          Submit Expense
        </button>
      </div>
    </div>
  );
}
