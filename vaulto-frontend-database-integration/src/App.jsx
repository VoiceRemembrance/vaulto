import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api, saveToken, getToken, clearToken } from './api.js';
import SettingsPage from './SettingsPage.jsx';
import { DEFAULT_SETTINGS, getBuckets } from './settings.js';
import './settings.css';
import {
  ArrowDownLeft, ArrowUpRight, Bell, CalendarDays, ChartNoAxesCombined, Check,
  Eye, EyeOff, IndianRupee, LayoutDashboard, LogOut, Menu, Plus,
  Settings, ShieldCheck, ShoppingBag, Sparkles, Trash2, Wallet, X,
} from 'lucide-react';
import {
  Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';

const monthKey = (date = new Date()) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
const money = value => new Intl.NumberFormat('en-IN', {
  style: 'currency', currency: 'INR', maximumFractionDigits: 0,
}).format(Number(value) || 0);
const monthLabel = key => {
  const [year, month] = key.split('-').map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
};
const currentMonth = monthKey();

async function loadCategorySettings() {
  const [activeCategories, archivedCategories] = await Promise.all([api.categories(), api.archivedCategories()]);
  return {
    categories: [...activeCategories, ...archivedCategories]
      .sort((left, right) => left.sort_order - right.sort_order),
  };
}

function totals(entries, month) {
  const result = {};
  entries.filter(entry => entry.month === month).forEach(entry => {
    result[entry.bucket] = (result[entry.bucket] || 0) + (entry.direction === 'remove' ? -entry.amount : entry.amount);
  });
  return result;
}

function Brand() {
  return <div className="brand"><span className="brand-icon"><Wallet size={19}/></span>Vaulto</div>;
}

function Auth({ done }) {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      const result = mode === 'register'
        ? await api.register({ name: name.trim(), email: email.trim(), password })
        : await api.login({ email: email.trim(), password });
      saveToken(result.access_token);
      await done(result.user);
    } catch (requestError) {
      setError(requestError.message || 'Unable to connect to Vaulto. Check that the backend is running.');
    } finally {
      setBusy(false);
    }
  }

  async function guest() {
    setError('');
    setBusy(true);
    try {
      const result = await api.guest();
      saveToken(result.access_token);
      await done(result.user);
    } catch (requestError) {
      setError(requestError.message || 'Unable to connect to Vaulto. Check that the backend is running.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth">
      <section className="auth-visual">
        <Brand/>
        <div className="hero-copy">
          <span className="eyebrow">YOUR MONEY, WITH A PLAN</span>
          <h1>Make room for<br/><em>what matters.</em></h1>
          <p>A calmer way to manage your money. Give every rupee a purpose, without losing sight of the bigger picture.</p>
        </div>
        <div className="preview">
          <div className="preview-top">Your monthly money plan <span>On track</span></div>
          <b>₹20,000</b><small>monthly income</small>
          <div className="split"><i/></div>
          <div className="preview-legend">A personal plan that grows with you</div>
        </div>
        <small className="visual-foot">A little clarity goes a long way.</small>
      </section>
      <section className="auth-panel">
        <div className="auth-inner">
          <div className="mobile-brand"><Brand/></div>
          <span className="eyebrow dark">WELCOME TO VAULTO</span>
          <h2>{mode === 'login' ? 'Good to see you.' : 'Start your money journey.'}</h2>
          <p className="muted">{mode === 'login' ? 'Sign in to pick up where you left off.' : 'Create an account and give your money a direction.'}</p>
          <div className="tabs">
            <button className={mode === 'login' ? 'active' : ''} onClick={() => { setMode('login'); setError(''); }}>Log in</button>
            <button className={mode === 'register' ? 'active' : ''} onClick={() => { setMode('register'); setError(''); }}>Register</button>
          </div>
          <form onSubmit={submit}>
            {mode === 'register' && <label>Your name<input required minLength="2" maxLength="80" value={name} onChange={event => setName(event.target.value)} placeholder="Your name"/></label>}
            <label>Email address<input required type="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="you@example.com"/></label>
            <label>Password
              <div className="password">
                <input required minLength={mode === 'register' ? 8 : 1} type={showPassword ? 'text' : 'password'} value={password} onChange={event => setPassword(event.target.value)} placeholder={mode === 'register' ? 'At least 8 characters' : 'Your password'}/>
                <button type="button" onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={17}/> : <Eye size={17}/>}</button>
              </div>
            </label>
            {mode === 'login' && <div className="forgot">Forgot password?</div>}
            {error && <p className="error" role="alert">{error}</p>}
            <button className="primary wide" disabled={busy}>{busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'} <ArrowUpRight size={16}/></button>
          </form>
          <div className="or"><span>or continue with</span></div>
          <button className="guest" onClick={guest} disabled={busy}>Continue as guest <ArrowUpRight size={16}/></button>
          <p className="fine">Your account is securely stored in the Vaulto database.</p>
        </div>
      </section>
    </div>
  );
}

function Sidebar({ page, setPage, user, logout, open, setOpen }) {
  const navigate = nextPage => {
    setPage(nextPage);
    setOpen(false);
  };
  return <>
    <div className={open ? 'scrim show' : 'scrim'} onClick={() => setOpen(false)}/>
    <aside className={open ? 'sidebar opened' : 'sidebar'}>
      <Brand/>
      <div className="nav-label">WORKSPACE</div>
      <button className={page === 'overview' ? 'nav active' : 'nav'} onClick={() => navigate('overview')}><LayoutDashboard size={18}/>Overview</button>
      <button className={page === 'analytics' ? 'nav active' : 'nav'} onClick={() => navigate('analytics')}><ChartNoAxesCombined size={18}/>Analytics <span className="new">NEW</span></button>
      <button className={page === 'settings' ? 'nav active' : 'nav'} onClick={() => navigate('settings')}><Settings size={18}/>Settings</button>
      <div className="side-tip"><Sparkles size={19}/><b>Small steps add up.</b><p>Give every rupee a job and make progress feel simple.</p></div>
      <div className="profile">
        <div className="avatar">{user.name[0].toUpperCase()}</div>
        <div><b>{user.name}</b><small>{user.is_guest ? 'Guest account' : user.email}</small></div>
        <button onClick={logout} title="Sign out"><LogOut size={16}/></button>
      </div>
      <small className="version">PAISA PILOT · PREVIEW 1.0</small>
    </aside>
  </>;
}

function Header({ page, setOpen, user }) {
  const pageName = { overview: 'Overview', analytics: 'Analytics', settings: 'Settings' }[page];
  return <header className="topbar">
    <button className="hamb" onClick={() => setOpen(true)}><Menu/></button>
    <div className="crumb">Workspace / <b>{pageName}</b></div>
    <div className="top-right">
      <span><CalendarDays size={15}/> {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
      <button className="bell"><Bell size={18}/></button>
      <div className="avatar">{user.name[0].toUpperCase()}</div>
    </div>
  </header>;
}

function Ring({ value, color }) {
  const circumference = 2 * Math.PI * 35;
  return <div className="ring"><svg viewBox="0 0 84 84">
    <circle cx="42" cy="42" r="35" className="ring-bg"/>
    <circle cx="42" cy="42" r="35" className="ring-val" style={{ stroke: color, strokeDasharray: circumference, strokeDashoffset: circumference * (1 - Math.min(100, value) / 100) }}/>
  </svg><div><b>{Math.round(value)}%</b><small>of goal</small></div></div>;
}

function BucketCard({ bucket, income, target, total, add, remove, canCreate }) {
  const done = Math.max(0, total);
  const progress = target ? done / target * 100 : 0;
  const remaining = Math.max(0, target - done);
  const Icon = bucket.Icon;
  return <article className={`bucket ${bucket.tint}`}>
    <div className="bucket-top"><span className="bucket-icon"><Icon size={19}/></span><span className="allocation">{bucket.pct}% of income</span></div>
    <h3>{bucket.name}</h3>
    <div className="bucket-numbers"><div><strong>{money(done)}</strong><small>of {money(target)} recommended</small></div><Ring value={progress} color={bucket.color}/></div>
    <div className="track"><i style={{ width: `${Math.min(100, progress)}%`, background: bucket.color }}/></div>
    <div className="bucket-foot"><span>{remaining ? `${money(remaining)} to go` : 'Monthly target reached'}</span><b>{Math.round(progress)}%</b></div>
    <div className="bucket-buttons"><button disabled={!canCreate} onClick={() => add(bucket, 'add')}><Plus size={14}/> Add entry</button><button disabled={!canCreate} onClick={() => remove(bucket, 'remove')}><ArrowDownLeft size={14}/> Remove</button></div>
  </article>;
}

function EntryModal({ bucket, mode, close, save }) {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const Icon = bucket.Icon;
  return <div className="modal-bg" onMouseDown={close}>
    <div className="modal" onMouseDown={event => event.stopPropagation()}>
      <div className="modal-head"><div className={`bucket-icon ${bucket.tint}`}><Icon size={19}/></div><div><h3>{mode === 'remove' ? 'Record a removal' : 'Add a new entry'}</h3><small>{bucket.name}</small></div><button className="close" onClick={close}><X/></button></div>
      <form onSubmit={event => {
        event.preventDefault();
        if (!title.trim() || Number(amount) <= 0) { setError('Enter a description and an amount greater than zero.'); return; }
        save({ title: title.trim(), amount: Number(amount), date, note, categoryId: bucket.id, direction: mode });
      }}>
        <label>Description<input autoFocus value={title} onChange={event => setTitle(event.target.value)} placeholder="e.g. Monthly contribution"/></label>
        <label>Amount (₹)<div className="amount"><IndianRupee size={16}/><input type="number" min="1" step="1" value={amount} onChange={event => setAmount(event.target.value)} placeholder="0"/></div></label>
        <label>Date<input type="date" value={date} onChange={event => setDate(event.target.value)}/></label>
        <label>Note <small>(optional)</small><textarea rows="2" value={note} onChange={event => setNote(event.target.value)} placeholder="Add a little context..."/></label>
        {error && <p className="error">{error}</p>}
        <div className="modal-actions"><button type="button" className="cancel" onClick={close}>Cancel</button><button className="primary">{mode === 'remove' ? 'Record removal' : 'Save entry'} <ArrowUpRight size={15}/></button></div>
      </form>
    </div>
  </div>;
}

function Overview({ data, buckets, month, onMonthChange, onSetIncome, open, del, onOpenSettings, busy, error }) {
  const income = Number(data.income[month] || 0);
  const monthSummary = data.monthSummary;
  const monthBuckets = monthSummary?.historical_configuration_available
    ? getBuckets({ categories: monthSummary.categories })
    : [];
  const availableIds = new Set(buckets.map(bucket => String(bucket.id)));
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(income));
  const [savingIncome, setSavingIncome] = useState(false);
  const recent = data.entries.filter(entry => entry.month === month && entry.bucket !== 'income')
    .slice().sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 6);
  return <div className="content">
    <div className="welcome"><div><span className="eyebrow dark">YOUR FINANCIAL SNAPSHOT</span><h1>Money looks better<br/><em>in balance.</em></h1><p>A clear view of where your money goes — and where it can take you.</p></div><label className="month-pill analytics-month"><CalendarDays size={15}/><input aria-label="Select dashboard month" type="month" value={month} onChange={event => onMonthChange(event.target.value)}/></label></div>
    {error && <p className="error" role="alert">{error}</p>}
    <section className="income-card"><div>
      <span className="income-label"><Wallet size={16}/> MONTHLY INCOME</span>
      {editing ? <div className="income-edit">₹<input type="number" min="0" value={value} onChange={event => setValue(event.target.value)}/><button disabled={savingIncome} onClick={async () => { setSavingIncome(true); const saved = await onSetIncome(Math.max(0, Number(value) || 0), month); setSavingIncome(false); if (saved) setEditing(false); }}><Check size={16}/></button><button onClick={() => setEditing(false)}><X size={16}/></button></div> : <div className="income-number">{money(income)} <button onClick={() => { setValue(String(income)); setEditing(true); }}>Edit income <ArrowUpRight size={13}/></button></div>}
      <p>Your income is the starting point for this month's money plan.</p>
    </div><div className="income-stats"><div><small>Allocated so far</small><b>{money(monthBuckets.reduce((sum, bucket) => sum + Math.max(0, bucket.actual_amount || 0), 0))}</b></div><i/><div><small>Plan distribution</small><b>{monthBuckets.reduce((sum, bucket) => sum + bucket.pct, 0)}%</b></div></div><span className="rupee-art">₹</span></section>
    <div className="section-title"><div><small>YOUR PERSONAL ALLOCATION PLAN</small><h2>Your monthly buckets</h2><p>Recommended amounts based on your income. Track each contribution below.</p></div><span className="recommend"><Sparkles size={14}/> Recommended split</span></div>
    {!monthSummary?.historical_configuration_available && (buckets.length
      ? <div className="empty">Allocation history is unavailable for this month.</div>
      : <div className="empty category-setup-empty">Create your first allocation categories in Settings to start your plan.<br/><button className="primary" onClick={onOpenSettings}>Set up categories <ArrowUpRight size={14}/></button></div>)}
    <div className="bucket-grid">{monthBuckets.map(bucket => <BucketCard
      key={bucket.id}
      bucket={bucket}
      income={income}
      target={Number(bucket.allocated_amount || 0)}
      total={Number(bucket.actual_amount || 0)}
      add={open}
      remove={open}
      canCreate={month === currentMonth && availableIds.has(String(bucket.id))}
    />)}</div>
    {monthSummary?.expense_variance !== null && monthSummary?.expense_variance !== undefined && <div className={`surplus-card ${monthSummary.expense_status}`}>
      <div><small>MONTHLY EXPENSE POSITION</small><b>{monthSummary.expense_status === 'balanced' ? 'Expense budget balanced' : monthSummary.expense_status === 'surplus' ? 'Expense budget surplus' : 'Expense budget deficit'}</b></div>
      <strong>{monthSummary.expense_status === 'balanced' ? money(0) : money(Math.abs(monthSummary.expense_variance))}</strong>
    </div>}
    <div className="section-title recent-title"><div><small>YOUR LATEST ACTIVITY</small><h2>Recent entries</h2></div><span className="entry-count">{data.entries.filter(entry => entry.month === month && entry.bucket !== 'income').length} entries this month</span></div>
    <div className="entries">{busy ? <div className="empty">Loading your financial records…</div> : recent.length ? recent.map(entry => {
      const bucket = buckets.find(item => String(item.id) === String(entry.bucket));
      const Icon = bucket?.Icon || ShoppingBag;
      return <div className="entry" key={entry.id}><span className={`entry-icon ${bucket?.tint || 'peach'}`}><Icon size={17}/></span><div className="entry-desc"><b>{entry.title}</b><small>{entry.categoryName || bucket?.name || 'Archived category'} · {new Date(entry.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</small></div><strong className={entry.direction === 'remove' ? 'removed' : ''}>{entry.direction === 'remove' ? '−' : '+'}{money(entry.amount)}</strong><button onClick={() => del(entry.id)} title="Delete entry"><Trash2 size={15}/></button></div>;
    }) : <div className="empty">No entries yet. Add your first transaction to start tracking.</div>}</div>
    <p className="disclaimer"><ShieldCheck size={14}/> Planning guideline, not financial advice. Contribution categories track additions and removals, not market returns.</p>
  </div>;
}

function Analytics() {
  const [month, setMonth] = useState(currentMonth);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    api.analytics(month).then(result => {
      if (active) setReport(result);
    }).catch(requestError => {
      if (active) setError(requestError.message || 'Unable to load monthly analytics.');
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [month]);

  const categories = report?.categories || [];
  const monthHasActivity = categories.some(category => Number(category.actual_amount) !== 0)
    || Number(report?.income || 0) !== 0;
  const statusLabel = category => {
    if (category.status === 'balanced') return `Balanced · ${money(0)}`;
    if (category.category_type === 'expense') {
      return category.status === 'surplus'
        ? `Surplus · ${money(category.variance_amount)}`
        : `Deficit · ${money(Math.abs(category.variance_amount))}`;
    }
    return category.status === 'above_target'
      ? `Surplus · ${money(category.variance_amount)}`
      : `Deficit · ${money(Math.abs(category.variance_amount))}`;
  };

  return <div className="content">
    <div className="welcome">
      <div><span className="eyebrow dark">YOUR MONEY, OVER TIME</span><h1>See the bigger <em>picture.</em></h1><p>Review your category targets and activity for any month.</p></div>
      <label className="month-pill analytics-month"><CalendarDays size={15}/><input aria-label="Select analytics month" type="month" value={month} onChange={event => setMonth(event.target.value)}/></label>
    </div>
    {error && <p className="error" role="alert">{error}</p>}
    <section className="chart-card">
      <div className="chart-head"><div><small>MONTHLY BREAKDOWN · {monthLabel(month)}</small><h2>Where your money goes</h2><p>Actual amounts compared with this month's saved targets.</p></div><span className="chart-tag">INR · ₹</span></div>
      {loading ? <div className="empty">Loading your monthly report…</div>
        : !report?.historical_configuration_available ? <div className="empty">Category configuration is unavailable for {monthLabel(month)}. No historical allocation snapshot was recorded for this month.</div>
          : <div className="chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={categories} margin={{ top: 10, right: 10, left: 0, bottom: 6 }}>
            <CartesianGrid strokeDasharray="3 5" vertical={false} stroke="#e9edf2"/>
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#8993a4', fontSize: 11 }}/>
            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#8993a4', fontSize: 11 }} tickFormatter={value => value >= 1000 ? `₹${value / 1000}k` : `₹${value}`} width={55}/>
            <Tooltip formatter={value => money(value)}/>
            <Legend iconType="circle"/>
            <Bar dataKey="actual_amount" name="Actual" fill="#56b9a6" radius={[4, 4, 0, 0]}/>
            <Bar dataKey="allocated_amount" name="Budget / target" fill="#8b82e8" radius={[4, 4, 0, 0]}/>
          </BarChart></ResponsiveContainer></div>}
    </section>
    <section className="chart-card monthly-table-card">
      <div className="chart-head"><div><small>CATEGORY SUMMARY</small><h2>{monthLabel(month)} · category-wise</h2><p>Contribution categories show actual additions less withdrawals.</p></div></div>
      {!loading && report?.historical_configuration_available && <>
        <div className="monthly-table-wrap"><table className="monthly-table">
          <thead><tr><th>Category</th><th>Amount Added</th><th>Surplus / Deficit</th></tr></thead>
          <tbody>{categories.map(category => <tr key={category.id}>
            <td>{category.name}</td>
            <td>{money(category.actual_amount)}</td>
            <td className={category.status === 'deficit' || category.status === 'underfunded' ? 'negative' : category.status === 'balanced' ? '' : 'positive'}>{statusLabel(category)}</td>
          </tr>)}</tbody>
        </table></div>
        {!monthHasActivity && <p className="monthly-empty">No transactions recorded for this month. Targets and zero amounts are shown above.</p>}
      </>}
      {!loading && !report?.historical_configuration_available && <div className="empty">The category summary is unavailable because no configuration snapshot exists for this month.</div>}
      {loading && <div className="empty">Loading your category summary…</div>}
    </section>
    <div className="analytics-note"><ShieldCheck size={18}/><div><b>How these numbers work</b><p>Expense categories compare spending with allocated budgets. Savings and investment categories compare recorded contributions with targets; investment returns are not tracked.</p></div></div>
    <p className="disclaimer">Analytics are calculated from your saved monthly category configuration and transactions.</p>
  </div>;
}

export default function App() {
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [data, setData] = useState({ income: {}, entries: [], targets: {}, monthSummary: null });
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [page, setPage] = useState('overview');
  const [modal, setModal] = useState(null);
  const [menu, setMenu] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [settingsDirty, setSettingsDirty] = useState(false);
  const financialLoadId = useRef(0);
  const buckets = useMemo(() => getBuckets(settings), [settings]);

  async function loadFinancialData(month = selectedMonth) {
    const loadId = ++financialLoadId.current;
    setBusy(true);
    setError('');
    try {
      const [summary, records] = await Promise.all([api.summary(month), api.transactions()]);
      const entries = records.map(record => {
        const date = new Date(record.transaction_date);
        return {
          id: record.id,
          bucket: record.category_id === null ? record.category : String(record.category_id),
          categoryName: record.category_name,
          categoryType: record.category_type,
          direction: record.direction,
          amount: Number(record.amount),
          title: record.description,
          date: record.transaction_date,
          month: monthKey(date),
        };
      });
      const income = {};
      for (const record of records) {
        if (record.category === 'income' && record.category_id === null) {
          const month = monthKey(new Date(record.transaction_date));
          income[month] = (income[month] || 0) + (record.direction === 'remove' ? -Number(record.amount) : Number(record.amount));
        }
      }
      income[month] = Number(summary.income) || 0;
      if (loadId !== financialLoadId.current) return;
      setData({ income, entries, targets: summary.allocation_targets, monthSummary: summary });
    } catch (requestError) {
      if (loadId === financialLoadId.current) setError(requestError.message || 'Unable to load your financial data.');
    } finally {
      if (loadId === financialLoadId.current) setBusy(false);
    }
  }

  async function loadSettings() {
    setError('');
    setSettings(await loadCategorySettings());
    setSettingsLoaded(true);
    await loadFinancialData();
  }

  useEffect(() => {
    let active = true;
    const token = getToken();
    if (!token) { setAuthChecked(true); return () => { active = false; }; }
    api.me().then(async currentUser => {
      if (!active) return;
      setUser(currentUser);
      try {
        const savedSettings = await loadCategorySettings();
        if (!active) return;
        setSettings(savedSettings);
        setSettingsLoaded(true);
        await loadFinancialData();
      } catch (requestError) {
        if (active) setError(requestError.message || 'Unable to load your settings.');
      }
    }).catch(() => {
      if (active) { clearToken(); setUser(null); }
    }).finally(() => { if (active) setAuthChecked(true); });
    return () => { active = false; };
  }, []);

  async function handleAuth(currentUser) {
    setUser(currentUser);
    setError('');
    try {
      setSettings(await loadCategorySettings());
      setSettingsLoaded(true);
      await loadFinancialData();
    } catch (requestError) {
      setError(requestError.message || 'Unable to load your settings.');
    }
  }

  async function retrySettings() {
    try {
      await loadSettings();
    } catch (requestError) {
      setError(requestError.message || 'Unable to load your settings.');
    }
  }

  async function logout() {
    if (settingsDirty && !window.confirm('You have unsaved settings. Sign out and discard them?')) return;
    clearToken();
    setUser(null);
    setSettings(DEFAULT_SETTINGS);
    setSettingsLoaded(false);
    setSettingsDirty(false);
    setSelectedMonth(currentMonth);
    setData({ income: {}, entries: [], targets: {}, monthSummary: null });
    setError('');
  }

  function navigate(nextPage) {
    if (nextPage !== page && settingsDirty && !window.confirm('Discard your unsaved settings changes?')) return;
    setPage(nextPage);
  }

  const onSettingsDirtyChange = useCallback(dirty => setSettingsDirty(dirty), []);
  useEffect(() => {
    if (!settingsDirty) return undefined;
    const warn = event => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [settingsDirty]);

  async function saveSettings(payload) {
    await api.saveCategoryConfiguration(payload);
    const saved = await loadCategorySettings();
    setSettings(saved);
    await loadFinancialData(selectedMonth);
    return saved;
  }

  async function saveEntry(entry) {
    setError('');
    try {
      await api.createTransaction({ category_id: entry.categoryId, direction: entry.direction, amount: entry.amount, description: entry.title, transaction_date: entry.date });
      setModal(null);
      await loadFinancialData();
    } catch (requestError) {
      setError(requestError.message || 'Unable to save this transaction.');
    }
  }

  async function deleteEntry(id) {
    setError('');
    try {
      await api.deleteTransaction(id);
      await loadFinancialData();
    } catch (requestError) {
      setError(requestError.message || 'Unable to delete this transaction.');
    }
  }

  async function setIncome(nextIncome, month = selectedMonth) {
    const previous = Number(data.income[month] || 0);
    const difference = nextIncome - previous;
    if (!difference) return true;
    try {
      await api.createTransaction({
        category: 'income',
        direction: difference > 0 ? 'add' : 'remove',
        amount: Math.abs(difference),
        description: difference > 0 ? 'Monthly income added' : 'Monthly income adjustment',
        transaction_date: `${month}-01`,
      });
      await loadFinancialData(month);
      return true;
    } catch (requestError) {
      setError(requestError.message || 'Unable to update income.');
      return false;
    }
  }

  if (!authChecked) return <div className="auth"><section className="auth-panel"><div className="auth-inner"><Brand/><p className="muted">Connecting securely to Vaulto…</p></div></section></div>;
  if (!user) return <Auth done={handleAuth}/>;
  if (!settingsLoaded) return <div className="auth"><section className="auth-panel"><div className="auth-inner"><Brand/><h2>Loading your settings</h2>{error && <p className="error" role="alert">{error}</p>}<button className="primary" onClick={retrySettings}>Retry <ArrowUpRight size={15}/></button></div></section></div>;

  return <div className="app">
    <Sidebar page={page} setPage={navigate} user={user} logout={logout} open={menu} setOpen={setMenu}/>
    <main>
      <Header page={page} setOpen={setMenu} user={user}/>
      {error && page !== 'overview' && <p className="error app-error" role="alert">{error}</p>}
      {page === 'overview' && <Overview data={data} buckets={buckets} month={selectedMonth} onMonthChange={month => { if (/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) { setSelectedMonth(month); loadFinancialData(month); } }} onSetIncome={setIncome} open={(bucket, mode) => setModal({ bucket, mode })} del={deleteEntry} onOpenSettings={() => setPage('settings')} busy={busy} error={error}/>}
      {page === 'analytics' && <Analytics/>}
      {page === 'settings' && <SettingsPage settings={settings} onSave={saveSettings} onDirtyChange={onSettingsDirtyChange}/>}
    </main>
    {modal && <EntryModal bucket={modal.bucket} mode={modal.mode} close={() => setModal(null)} save={saveEntry}/>}
  </div>;
}
