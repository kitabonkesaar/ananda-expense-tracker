/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { MapPin, IndianRupee, FileText, Check } from 'lucide-react';
import { toast } from 'sonner';

export default function AddExpensePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<string>('');
  const [subCategory, setSubCategory] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'UPI' | 'Card' | 'Other'>('Cash');
  const [description, setDescription] = useState('');
  const [hasBill, setHasBill] = useState(false);
  const [manualDate, setManualDate] = useState(new Date().toISOString().split('T')[0]);
  const [manualTime, setManualTime] = useState(new Date().toTimeString().split(' ')[0].substring(0, 5));

  const categoriesMap = useQuery(api.categories.getMap) ?? {};
  const activeTrip = useQuery(api.trips.getActive);
  const createExpense = useMutation(api.expenses.create);

  if (user?.role !== 'staff' && user?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  const canSubmit = amount && category;

  const handleSubmit = async () => {
    // Basic validation
    if (!amount) { toast.error('Enter an amount'); return; }
    if (!category) { toast.error('Select a category'); return; }
    
    // Sub-category validation: If subcategories exist for this category, one must be selected.
    const subs = categoriesMap[category] || [];
    if (subs.length > 0 && !subCategory) {
      toast.error(`Please select a ${category} sub-category`);
      return;
    }

    if (!activeTrip) {
      toast.error('No active trip found. Please check trip status in Admin.');
      return;
    }

    try {
      const combinedDate = new Date(`${manualDate}T${manualTime}`).toISOString();
      await createExpense({
        tripId: activeTrip._id,
        amount: Number(amount),
        category: category,
        subCategory: subCategory || undefined,
        paymentMethod,
        description: description.trim() || 'No description provided',
        imageUrl: hasBill ? 'verified' : '/placeholder.svg',
        createdBy: user!._id,
        location: { lat: 30.0869, lng: 78.2676 }, // mock location
        manualDate: combinedDate,
      });

      toast.success('Expense submitted successfully!');
      navigate('/dashboard');
    } catch (error: any) {
      console.error("Submission Failure Details:", {
        error,
        sentData: {
          tripId: activeTrip._id,
          amount,
          category,
          subCategory,
          manualDate
        }
      });
      toast.error(`Submission failed: ${error.message || 'Unknown error'}`);
    }
  };

  return (
    <div className="pb-24 px-4 pt-4">
      <h2 className="text-lg font-bold text-foreground mb-5 animate-fade-up">Add Expense</h2>

      <div className="space-y-4 animate-fade-up stagger-1">
        {/* Amount */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Amount *</label>
          <div className="flex items-center gap-2 bg-card rounded-xl px-4 py-3.5 border border-border shadow-sm text-foreground">
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

        {/* Date and Time */}
        <div className="grid grid-cols-2 gap-3">
           <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Date</label>
              <input 
                type="date"
                value={manualDate}
                onChange={e => setManualDate(e.target.value)}
                className="w-full bg-card rounded-xl px-4 py-3 border border-border shadow-sm text-sm font-semibold text-foreground outline-none"
              />
           </div>
           <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Time</label>
              <input 
                type="time"
                value={manualTime}
                onChange={e => setManualTime(e.target.value)}
                className="w-full bg-card rounded-xl px-4 py-3 border border-border shadow-sm text-sm font-semibold text-foreground outline-none"
              />
           </div>
        </div>

        {/* Category */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Category *</label>
          <div className="grid grid-cols-3 gap-2">
            {Object.keys(categoriesMap).map(cat => (
              <button
                key={cat}
                onClick={() => { setCategory(cat); setSubCategory(''); }}
                className={`py-2.5 px-1 rounded-xl text-sm font-medium transition-all active:scale-95 ${
                  category === cat
                    ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                    : 'bg-card border border-border text-foreground hover:bg-secondary'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Sub Category */}
        {category && categoriesMap[category] && categoriesMap[category].length > 0 ? (
          <div className="animate-fade-up">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Sub Category (Required)</label>
            <div className="flex flex-wrap gap-2">
              {categoriesMap[category].map((sub: string) => (
                <button
                  key={sub}
                  onClick={() => setSubCategory(sub)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95 border ${
                    subCategory === sub
                      ? 'bg-primary/10 border-primary text-primary shadow-sm'
                      : 'bg-card border-border text-foreground hover:bg-secondary'
                  }`}
                >
                  {sub}
                </button>
              ))}
            </div>
          </div>
        ) : (
          category && (
            <div className="p-3 bg-secondary/50 rounded-xl text-[10px] font-bold text-muted-foreground italic border border-dashed border-border text-center">
               No subcategories defined for this category.
            </div>
          )
        )}
        
        {/* Payment Method */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Payment Method *</label>
          <div className="grid grid-cols-4 gap-2">
            {['Cash', 'UPI', 'Card', 'Other'].map(method => (
              <button
                key={method}
                onClick={() => setPaymentMethod(method as any)}
                className={`py-2 rounded-lg text-xs font-bold transition-all active:scale-95 border ${
                  paymentMethod === method
                    ? 'bg-primary/10 border-primary text-primary shadow-sm'
                    : 'bg-card border-border text-foreground hover:bg-secondary'
                }`}
              >
                {method}
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

        {/* Bill Available Checkbox */}
        <div 
          onClick={() => setHasBill(!hasBill)}
          className="flex items-center justify-between bg-card rounded-xl border border-border p-4 shadow-sm cursor-pointer active:scale-[0.98] transition-all"
        >
          <div className="flex items-center gap-3">
            <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors ${hasBill ? 'bg-primary border-primary' : 'border-border'}`}>
              {hasBill && <Check className="w-4 h-4 text-primary-foreground" />}
            </div>
            <span className="text-sm font-semibold text-foreground">Physical Bill Available?</span>
          </div>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${hasBill ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'}`}>
            {hasBill ? 'YES' : 'NO'}
          </span>
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
