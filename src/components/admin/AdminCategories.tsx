import { useState, useMemo } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Tags, TrendingUp, Plus, X, Layers, Hash, Fuel, UtensilsCrossed, Building, CircleDollarSign, Bus, PackageOpen, Sparkles, GripVertical } from 'lucide-react';

const CATEGORY_THEME: Record<string, { bg: string; text: string; border: string; light: string; icon: typeof Fuel }> = {
  Fuel:      { bg: 'bg-blue-500',    text: 'text-blue-600',    border: 'border-blue-200', light: 'bg-blue-50',    icon: Fuel },
  Food:      { bg: 'bg-emerald-500', text: 'text-emerald-600', border: 'border-emerald-200', light: 'bg-emerald-50', icon: UtensilsCrossed },
  Hotel:     { bg: 'bg-violet-500',  text: 'text-violet-600',  border: 'border-violet-200', light: 'bg-violet-50',  icon: Building },
  Toll:      { bg: 'bg-orange-500',  text: 'text-orange-600',  border: 'border-orange-200', light: 'bg-orange-50',  icon: CircleDollarSign },
  Transport: { bg: 'bg-cyan-500',    text: 'text-cyan-600',    border: 'border-cyan-200', light: 'bg-cyan-50',    icon: Bus },
  Misc:      { bg: 'bg-rose-500',    text: 'text-rose-600',    border: 'border-rose-200', light: 'bg-rose-50',    icon: PackageOpen },
};

const DEFAULT_THEME = { bg: 'bg-slate-600', text: 'text-slate-600', border: 'border-slate-200', light: 'bg-slate-50', icon: Tags };

function formatCurrency(n: number) {
  return '₹' + n.toLocaleString('en-IN');
}

export default function AdminCategories() {
  const categoriesRaw = useQuery(api.categories.list) ?? [];
  const allExpenses = useQuery(api.expenses.list) ?? [];
  const createCategory = useMutation(api.categories.create);
  const updateCategory = useMutation(api.categories.update);
  const removeCategory = useMutation(api.categories.remove);

  const [newSub, setNewSub] = useState<Record<string, string>>({});
  const [newCat, setNewCat] = useState('');
  const [expandedCat, setExpandedCat] = useState<string | null>(null);

  // Build subCategories map from Convex data
  const subCategories: Record<string, string[]> = {};
  categoriesRaw.forEach(c => { subCategories[c.name] = c.subCategories || []; });

  const expenses = allExpenses;

  const categoryStats = useMemo(() => {
    const map: Record<string, { amount: number; count: number }> = {};
    expenses.filter(e => e.status !== 'rejected').forEach(e => {
      if (!map[e.category]) map[e.category] = { amount: 0, count: 0 };
      map[e.category].amount += e.amount;
      map[e.category].count++;
    });
    return map;
  }, [expenses]);

  const totalSpent = Object.values(categoryStats).reduce((s, v) => s + v.amount, 0);
  const allCategories = Object.keys(subCategories);

  const handleAddSub = async (cat: string) => {
    if (!newSub[cat] || !newSub[cat].trim()) return;
    const catDoc = categoriesRaw.find(c => c.name === cat);
    if (!catDoc) return;
    await updateCategory({ id: catDoc._id, subCategories: [...(catDoc.subCategories || []), newSub[cat].trim()] });
    setNewSub(prev => ({ ...prev, [cat]: '' }));
  };

  const handleRemoveSub = async (cat: string, sub: string) => {
    const catDoc = categoriesRaw.find(c => c.name === cat);
    if (!catDoc) return;
    await updateCategory({ id: catDoc._id, subCategories: (catDoc.subCategories || []).filter(s => s !== sub) });
  };

  const handleAddCategory = async () => {
    if (!newCat.trim()) return;
    const catName = newCat.trim();
    if (subCategories[catName]) return;
    await createCategory({ name: catName, subCategories: [] });
    setNewCat('');
  };

  const handleRemoveCategory = async (cat: string) => {
    const catDoc = categoriesRaw.find(c => c.name === cat);
    if (!catDoc) return;
    await removeCategory({ id: catDoc._id });
    if (expandedCat === cat) setExpandedCat(null);
  };

  const getTheme = (cat: string) => CATEGORY_THEME[cat] || DEFAULT_THEME;

  return (
    <div className="space-y-8 font-sans">

      {/* ========== HEADER ========== */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Categories & Subcategories</h2>
          <p className="text-xs font-semibold text-slate-500 mt-0.5">Manage spending categories and assign subcategories for staff expense entries.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-slate-100 px-4 py-2 rounded-xl shadow-inner border border-slate-200/50 flex items-center gap-2 text-xs font-bold text-slate-600">
            <Tags className="w-3.5 h-3.5 text-slate-400" />
            {allCategories.length} Categories
          </div>
        </div>
      </div>

      {/* ========== SPENDING OVERVIEW STRIP ========== */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-orange-400" /> Spending Distribution
          </h3>
          <span className="text-xs font-bold text-slate-400">Total: <span className="text-slate-700">{formatCurrency(totalSpent)}</span></span>
        </div>

        {/* Stacked bar */}
        <div className="flex h-4 rounded-full overflow-hidden bg-slate-100 mb-4">
          {allCategories.map(cat => {
            const stats = categoryStats[cat];
            if (!stats || stats.amount === 0) return null;
            const pct = (stats.amount / totalSpent) * 100;
            const theme = getTheme(cat);
            return (
              <div
                key={cat}
                className={`${theme.bg} transition-all duration-700 relative group cursor-pointer first:rounded-l-full last:rounded-r-full`}
                style={{ width: `${pct}%` }}
                title={`${cat}: ${formatCurrency(stats.amount)} (${pct.toFixed(1)}%)`}
              >
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 hidden group-hover:block bg-slate-800 text-white text-[10px] font-bold px-2 py-1 rounded-lg whitespace-nowrap z-10 shadow-lg">
                  {cat}: {pct.toFixed(1)}%
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend chips */}
        <div className="flex flex-wrap gap-2">
          {allCategories.map(cat => {
            const stats = categoryStats[cat];
            const pct = stats && totalSpent > 0 ? ((stats.amount / totalSpent) * 100).toFixed(1) : '0.0';
            const theme = getTheme(cat);
            return (
              <div key={cat} className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600">
                <div className={`w-2.5 h-2.5 rounded-sm ${theme.bg}`} />
                {cat} <span className="text-slate-400">({pct}%)</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========== ADD NEW CATEGORY ========== */}
      <div className="bg-gradient-to-r from-orange-50 via-amber-50 to-yellow-50 rounded-2xl border border-orange-100 p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center shadow-sm shadow-orange-200">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Create New Category</h3>
              <p className="text-[10px] font-bold text-slate-500">Add a new expense category for your team.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Category name..."
              value={newCat}
              onChange={e => setNewCat(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddCategory()}
              className="bg-white border border-orange-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-800 outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-300 transition-all placeholder:text-slate-400 w-52"
            />
            <button
              onClick={handleAddCategory}
              disabled={!newCat.trim()}
              className="bg-orange-500 text-white rounded-xl px-5 py-2.5 flex items-center gap-1.5 hover:bg-orange-600 transition-all active:scale-95 text-sm font-bold shadow-sm shadow-orange-200 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4" /> Add
            </button>
          </div>
        </div>
      </div>

      {/* ========== CATEGORY CARDS GRID ========== */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {allCategories.map(cat => {
          const theme = getTheme(cat);
          const stats = categoryStats[cat];
          const subs = subCategories[cat] || [];
          const isExpanded = expandedCat === cat;
          const Icon = theme.icon;
          const pct = stats && totalSpent > 0 ? ((stats.amount / totalSpent) * 100) : 0;

          return (
            <div
              key={cat}
              className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all hover:shadow-md ${isExpanded ? 'border-slate-300 ring-1 ring-slate-200' : 'border-slate-100'}`}
            >
              {/* Card Header */}
              <div
                className="p-5 cursor-pointer"
                onClick={() => setExpandedCat(isExpanded ? null : cat)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-xl ${theme.bg} flex items-center justify-center text-white shadow-sm`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-[15px] font-bold text-slate-800">{cat}</h3>
                      <p className="text-[11px] font-bold text-slate-400 mt-0.5">{subs.length} subcategories</p>
                    </div>
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); handleRemoveCategory(cat); }}
                    className="p-1.5 rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-all"
                    title="Delete category"
                  >
                    <X className="w-4 h-4" strokeWidth={2.5} />
                  </button>
                </div>

                {/* Stats Row */}
                <div className="flex items-center gap-4 mb-3">
                  <div className="flex-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Spent</p>
                    <p className="text-lg font-black text-slate-800 tabular-nums">{formatCurrency(stats?.amount || 0)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Entries</p>
                    <p className="text-lg font-black text-slate-800 tabular-nums">{stats?.count || 0}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Share</p>
                    <p className={`text-lg font-black tabular-nums ${theme.text}`}>{pct.toFixed(1)}%</p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${theme.bg} transition-all duration-700`} style={{ width: `${Math.min(pct, 100)}%` }} />
                </div>

                {/* Subcategory chips preview */}
                {subs.length > 0 && !isExpanded && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {subs.slice(0, 4).map(sub => (
                      <span key={sub} className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${theme.light} ${theme.text} ${theme.border}`}>
                        {sub}
                      </span>
                    ))}
                    {subs.length > 4 && (
                      <span className="text-[10px] font-bold text-slate-400 px-2 py-0.5">+{subs.length - 4} more</span>
                    )}
                  </div>
                )}
              </div>

              {/* Expanded: Subcategory Management */}
              {isExpanded && (
                <div className="border-t border-slate-100 bg-slate-50/50 px-5 py-4 space-y-3">
                  <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                    <Layers className="w-3.5 h-3.5 text-slate-400" /> Subcategories
                  </h4>

                  {/* Subcategory list */}
                  {subs.length === 0 ? (
                    <p className="text-xs text-slate-400 font-medium italic py-2">No subcategories defined yet. Add one below.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {subs.map((sub, idx) => (
                        <div key={sub} className="flex items-center justify-between bg-white rounded-xl px-3.5 py-2.5 border border-slate-100 group hover:border-slate-200 transition-colors">
                          <div className="flex items-center gap-2.5">
                            <span className="text-[10px] font-black text-slate-300 w-5 tabular-nums">{idx + 1}.</span>
                            <Hash className={`w-3 h-3 ${theme.text} opacity-50`} />
                            <span className="text-[13px] font-bold text-slate-700">{sub}</span>
                          </div>
                          <button
                            onClick={() => handleRemoveSub(cat, sub)}
                            className="p-1 rounded-md text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-all opacity-0 group-hover:opacity-100"
                          >
                            <X className="w-3.5 h-3.5" strokeWidth={2.5} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add subcategory input */}
                  <div className="flex gap-2 mt-2">
                    <input
                      type="text"
                      placeholder={`Add subcategory to ${cat}...`}
                      value={newSub[cat] || ''}
                      onChange={e => setNewSub({ ...newSub, [cat]: e.target.value })}
                      onKeyDown={e => e.key === 'Enter' && handleAddSub(cat)}
                      className="flex-1 bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-slate-200 focus:border-slate-300 transition-all placeholder:text-slate-400"
                    />
                    <button
                      onClick={() => handleAddSub(cat)}
                      disabled={!newSub[cat]?.trim()}
                      className={`${theme.bg} text-white rounded-xl px-4 flex items-center justify-center hover:opacity-90 transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed`}
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {allCategories.length === 0 && (
        <div className="bg-white p-12 rounded-2xl border border-slate-100 shadow-sm text-center">
          <Tags className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-lg font-bold text-slate-800 mb-1">No Categories Yet</p>
          <p className="text-sm text-slate-500 font-semibold">Create your first expense category above to get started.</p>
        </div>
      )}
    </div>
  );
}
