import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { api, saveToken, getToken, clearToken } from './api.js';
import SettingsPage from './SettingsPage.jsx';
import { DEFAULT_SETTINGS, getBuckets } from './settings.js';
import { AnimatedValue, ToastBanner, useCardSpotlight } from './components/InteractiveEffects.jsx';
import './settings.css';
import {
  ArrowDownLeft, ArrowUpRight, Bell, CalendarDays, ChartNoAxesCombined, Check,
  ChevronDown, Eye, EyeOff, IndianRupee, LayoutDashboard, LogOut, Menu, Plus,
  PiggyBank, ReceiptText, Settings, ShieldCheck, ShoppingBag, Sparkles, TrendingUp,
  Trash2, Wallet, X,
} from 'lucide-react';
import {
  Area, AreaChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer,
  Tooltip, XAxis, YAxis,
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

function totals(entries, month) {
  const result = { expense: 0, savings: 0, investment: 0, emergency: 0 };
  entries.filter(entry => entry.month === month).forEach(entry => {
    result[entry.bucket] += entry.direction === 'remove' ? -entry.amount : entry.amount;
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
    <div className="auth page-stage">
      <section className="auth-visual">
        <div className="nexora-hero-bg" aria-hidden="true">
          <div className="nexora-sphere-wrap">
            <div className="nexora-sphere"/>
            <div className="nexora-ring nexora-ring-1"/>
            <div className="nexora-ring nexora-ring-2"/>
            <span className="nexora-node nexora-node-1"/>
            <span className="nexora-node nexora-node-2"/>
          </div>
        </div>
        <Brand/>
        <div className="hero-copy">
          <span className="eyebrow-pill"><i className="eyebrow-dot" aria-hidden="true"/> STUDENT POCKET ACCOUNTABILITY</span>
          <h1>Make room for<br/><em>what matters.</em></h1>
          <p>A sharper way to manage your pocket money. Give every rupee a clear purpose, without losing sight of your goals.</p>
        </div>
        <div className="preview spotlight-card">
          <div className="preview-top">
            <div>
              <small>MONTHLY PLAN BASE</small>
              <b>₹20,000</b>
            </div>
            <span className="preview-status">On track</span>
          </div>
          <div className="split"><i/><i/><i/><i/></div>
          <div className="preview-metrics">
            <div><strong>5%</strong><small>Spend</small></div>
            <div><strong>25%</strong><small>Save</small></div>
            <div><strong>25%</strong><small>Invest</small></div>
            <div><strong>45%</strong><small>Protect</small></div>
          </div>
        </div>
        <small className="visual-foot">Built for student financial clarity.</small>
      </section>
      <section className="auth-panel">
        <div className="auth-inner spotlight-card">
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
                <button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={17}/> : <Eye size={17}/>}</button>
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
      <button className={page === 'analytics' ? 'nav active' : 'nav'} onClick={() => navigate('analytics')}><ChartNoAxesCombined size={18}/>Analytics</button>
      <button className={page === 'settings' ? 'nav active' : 'nav'} onClick={() => navigate('settings')}><Settings size={18}/>Settings</button>
      <div className="side-tip spotlight-card">
        <Sparkles size={19}/>
        <b>Accountability Pays Off</b>
        <p>Give every rupee a job and track your student pocket money effortlessly.</p>
      </div>
      <div className="profile">
        <div className="avatar">{user.name[0].toUpperCase()}</div>
        <div><b>{user.name}</b><small>{user.is_guest ? 'Guest account' : user.email}</small></div>
        <button onClick={logout} title="Sign out" aria-label="Sign out"><LogOut size={16}/></button>
      </div>
      <small className="version">VAULTO · STUDENT PILOT 1.0</small>
    </aside>
  </>;
}

function Header({ page, setOpen, user, data, buckets, onOpenSettings }) {
  const [pulseOpen, setPulseOpen] = useState(false);
  const pulseRef = useRef(null);
  const pageName = { overview: 'Overview', analytics: 'Analytics', settings: 'Settings' }[page];

  useEffect(() => {
    if (!pulseOpen) return undefined;
    const onPointerDown = event => {
      if (pulseRef.current && !pulseRef.current.contains(event.target)) setPulseOpen(false);
    };
    const onKeyDown = event => {
      if (event.key === 'Escape') setPulseOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [pulseOpen]);

  const pulse = useMemo(() => {
    const income = Number(data.income[currentMonth] || 0);
    const currentTotals = totals(data.entries, currentMonth);
    const allocated = buckets.reduce((sum, bucket) => sum + Math.max(0, currentTotals[bucket.id]), 0);
    const goalsReached = buckets.filter(bucket => {
      const target = Number(data.targets[bucket.id] || 0);
      return target > 0 && Math.max(0, currentTotals[bucket.id]) >= target;
    }).length;
    const unallocated = Math.max(0, income - allocated);
    const score = income > 0 ? Math.min(100, Math.round((allocated / income) * 100)) : 0;
    const monthEntries = data.entries.filter(entry => entry.month === currentMonth && entry.bucket !== 'income').length;
    return { income, allocated, unallocated, goalsReached, score, monthEntries };
  }, [data, buckets]);

  return <header className="topbar">
    <button className="hamb" aria-label="Open navigation" onClick={() => setOpen(true)}><Menu/></button>
    <div className="crumb">Workspace / <b>{pageName}</b></div>
    <div className="top-right">
      <span className="date-chip"><CalendarDays size={15}/> {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
      <div className="pulse-anchor" ref={pulseRef}>
        <button
          className={pulseOpen ? 'bell active' : 'bell'}
          onClick={() => setPulseOpen(openState => !openState)}
          aria-label="Accountability pulse notifications"
          aria-expanded={pulseOpen}
          title="Accountability Pulse"
        >
          <Bell size={18}/>
          {pulse.monthEntries > 0 && <i className="bell-dot" aria-hidden="true"/>}
        </button>
        {pulseOpen && (
          <div className="helios-popover pulse-popover" role="dialog" aria-label="Accountability Pulse">
            <div className="popover-head">
              <div>
                <small>ACCOUNTABILITY PULSE</small>
                <h4>Pocket Money Health</h4>
              </div>
              <span className="pulse-badge">{pulse.score}% tracked</span>
            </div>
            <div className="pulse-metrics">
              <div>
                <small>Goals reached</small>
                <b>{pulse.goalsReached} / {buckets.length}</b>
              </div>
              <div>
                <small>Unallocated left</small>
                <b>{money(pulse.unallocated)}</b>
              </div>
              <div>
                <small>Entries logged</small>
                <b>{pulse.monthEntries}</b>
              </div>
            </div>
            <div className="pulse-bar">
              <i style={{ width: `${pulse.score}%` }}/>
            </div>
            <p className="pulse-note">
              {pulse.income === 0
                ? 'Set your monthly pocket money on Overview to unlock personalized accountability milestones.'
                : pulse.goalsReached === buckets.length
                  ? 'Every monthly bucket reached its target. Outstanding discipline!'
                  : `${money(pulse.allocated)} allocated out of ${money(pulse.income)} this month.`}
            </p>
            <button
              type="button"
              className="popover-cta"
              onClick={() => { setPulseOpen(false); onOpenSettings(); }}
            >
              Customize split <ArrowUpRight size={14}/>
            </button>
          </div>
        )}
      </div>
      <div className="avatar" title={user.name}>{user.name[0].toUpperCase()}</div>
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

function BucketCard({ bucket, target, total, add, remove, onInspect }) {
  const done = Math.max(0, total);
  const progress = target ? done / target * 100 : 0;
  const remaining = Math.max(0, target - done);
  const Icon = bucket.Icon;
  return <article
    className={`bucket spotlight-card ${bucket.tint}`}
    onClick={() => onInspect(bucket)}
    role="button"
    tabIndex={0}
    onKeyDown={event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        onInspect(bucket);
      }
    }}
  >
    <div className="bucket-top"><span className="bucket-icon"><Icon size={19}/></span><span className="allocation">{bucket.pct}% of income</span></div>
    <h3>{bucket.name}</h3>
    <div className="bucket-numbers"><div><strong><AnimatedValue value={done} format={money}/></strong><small>of {money(target)} recommended</small></div><Ring value={progress} color={bucket.color}/></div>
    <div className="track"><i style={{ width: `${Math.min(100, progress)}%`, background: bucket.color, color: bucket.color }}/></div>
    <div className="bucket-foot"><span>{remaining ? `${money(remaining)} to go` : 'Monthly target reached'}</span><b>{Math.round(progress)}%</b></div>
    <div className="bucket-buttons" onClick={event => event.stopPropagation()}>
      <button onClick={() => add(bucket, 'add')}><Plus size={14}/> Add entry</button>
      <button onClick={() => remove(bucket, 'remove')}><ArrowDownLeft size={14}/> Remove</button>
    </div>
  </article>;
}

const QUICK_AMOUNTS = [100, 250, 500, 1000];

function EntryModal({ bucket, mode, close, save }) {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const Icon = bucket.Icon;

  useEffect(() => {
    const onKeyDown = event => { if (event.key === 'Escape') close(); };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [close]);

  return createPortal(<div className="modal-bg" onMouseDown={close}>
    <div className="modal modal-pop" role="dialog" aria-modal="true" aria-label={mode === 'remove' ? 'Record a removal' : 'Add a new entry'} onMouseDown={event => event.stopPropagation()}>
      <div className="modal-head"><div className={`bucket-icon ${bucket.tint}`}><Icon size={19}/></div><div><h3>{mode === 'remove' ? 'Record a removal' : 'Add a new entry'}</h3><small>{bucket.name}</small></div><button className="close" aria-label="Close dialog" onClick={close}><X/></button></div>
      <form onSubmit={event => {
        event.preventDefault();
        if (!title.trim() || Number(amount) <= 0) { setError('Enter a description and an amount greater than zero.'); return; }
        save({ title: title.trim(), amount: Number(amount), date, note, bucket: bucket.id, direction: mode });
      }}>
        <label>Description<input autoFocus value={title} onChange={event => setTitle(event.target.value)} placeholder="e.g. Monthly contribution"/></label>
        <label>Amount (₹)<div className="amount"><IndianRupee size={16}/><input type="number" min="1" step="1" value={amount} onChange={event => setAmount(event.target.value)} placeholder="0"/></div></label>
        <div className="quick-chips" aria-label="Quick amount presets">
          {QUICK_AMOUNTS.map(preset => (
            <button
              key={preset}
              type="button"
              className="quick-chip"
              onClick={() => setAmount(current => String((Number(current) || 0) + preset))}
            >
              +₹{preset.toLocaleString('en-IN')}
            </button>
          ))}
        </div>
        <label>Date<input type="date" value={date} onChange={event => setDate(event.target.value)}/></label>
        <label><span>Note <small>(optional)</small></span><textarea rows="2" value={note} onChange={event => setNote(event.target.value)} placeholder="Add a little context..."/></label>
        {error && <p className="error">{error}</p>}
        <div className="modal-actions"><button type="button" className="cancel" onClick={close}>Cancel</button><button className="primary">{mode === 'remove' ? 'Record removal' : 'Save entry'} <ArrowUpRight size={15}/></button></div>
      </form>
    </div>
  </div>, document.body);
}

function BucketInspectorModal({ bucket, target, total, entries, close, onAction, onDelete }) {
  const Icon = bucket.Icon;
  const done = Math.max(0, total);
  const progress = target ? (done / target) * 100 : 0;
  const remaining = Math.max(0, target - done);
  const today = new Date();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const daysLeft = Math.max(1, daysInMonth - today.getDate() + 1);
  const dailyPace = remaining / daysLeft;

  useEffect(() => {
    const onKeyDown = event => { if (event.key === 'Escape') close(); };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [close]);

  return createPortal(
    <div className="modal-bg" onMouseDown={close}>
      <div className="modal modal-pop inspector-modal" role="dialog" aria-modal="true" aria-label={`${bucket.name} inspector`} onMouseDown={event => event.stopPropagation()}>
        <div className="modal-head">
          <div className={`bucket-icon ${bucket.tint}`}><Icon size={19}/></div>
          <div>
            <h3>{bucket.name}</h3>
            <small>{bucket.pct}% monthly allocation · {entries.length} {entries.length === 1 ? 'entry' : 'entries'} this month</small>
          </div>
          <button className="close" aria-label="Close inspector" onClick={close}><X/></button>
        </div>

        <div className="inspector-hero">
          <div>
            <small>CURRENT BALANCE</small>
            <strong>{money(done)}</strong>
            <p>{remaining ? `${money(remaining)} remaining of ${money(target)} goal` : `Goal of ${money(target)} reached!`}</p>
          </div>
          <Ring value={progress} color={bucket.color}/>
        </div>

        <div className="inspector-stats">
          <div>
            <small>Recommended target</small>
            <b>{money(target)}</b>
          </div>
          <div>
            <small>Daily pace ({daysLeft}d left)</small>
            <b>{remaining ? `${money(Math.ceil(dailyPace))}/day` : 'On target'}</b>
          </div>
        </div>

        <div className="inspector-list-head">
          <small>THIS MONTH IN {bucket.name.toUpperCase()}</small>
        </div>
        <div className="inspector-entries">
          {entries.length ? entries.map(entry => (
            <div className="inspector-row" key={entry.id}>
              <div>
                <b>{entry.title}</b>
                <small>{new Date(entry.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</small>
              </div>
              <strong className={entry.direction === 'remove' ? 'removed' : ''}>
                {entry.direction === 'remove' ? '−' : '+'}{money(entry.amount)}
              </strong>
              <button type="button" onClick={() => onDelete(entry.id)} title="Delete entry" aria-label={`Delete ${entry.title}`}>
                <Trash2 size={14}/>
              </button>
            </div>
          )) : <div className="empty">No entries recorded in this bucket yet.</div>}
        </div>

        <div className="modal-actions inspector-actions">
          <button type="button" className="cancel" onClick={() => { close(); onAction(bucket, 'remove'); }}>
            <ArrowDownLeft size={15}/> Remove
          </button>
          <button type="button" className="primary" onClick={() => { close(); onAction(bucket, 'add'); }}>
            <Plus size={15}/> Add entry
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function EntryDetailModal({ entry, bucket, income, close, onDelete }) {
  const Icon = bucket.Icon;
  const share = income > 0 ? ((entry.amount / income) * 100).toFixed(1) : '0.0';

  useEffect(() => {
    const onKeyDown = event => { if (event.key === 'Escape') close(); };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [close]);

  return createPortal(
    <div className="modal-bg" onMouseDown={close}>
      <div className="modal modal-pop receipt-modal" role="dialog" aria-modal="true" aria-label="Transaction snapshot" onMouseDown={event => event.stopPropagation()}>
        <div className="modal-head">
          <div className={`bucket-icon ${bucket.tint}`}><Icon size={19}/></div>
          <div>
            <h3>Transaction snapshot</h3>
            <small>{bucket.name}</small>
          </div>
          <button className="close" aria-label="Close transaction details" onClick={close}><X/></button>
        </div>

        <div className="receipt-amount">
          <span className="receipt-pill">
            <ReceiptText size={13}/> {entry.direction === 'remove' ? 'Removal recorded' : 'Contribution logged'}
          </span>
          <strong className={entry.direction === 'remove' ? 'removed' : ''}>
            {entry.direction === 'remove' ? '−' : '+'}{money(entry.amount)}
          </strong>
          <p>{entry.title}</p>
        </div>

        <div className="receipt-grid">
          <div>
            <small>Date</small>
            <b>{new Date(entry.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</b>
          </div>
          <div>
            <small>Share of pocket money</small>
            <b>{share}%</b>
          </div>
          <div>
            <small>Bucket</small>
            <b>{bucket.name}</b>
          </div>
          <div>
            <small>Type</small>
            <b>{entry.direction === 'remove' ? 'Debit / Removal' : 'Credit / Allocation'}</b>
          </div>
        </div>

        <div className="modal-actions">
          <button type="button" className="cancel" onClick={close}>Close</button>
          <button
            type="button"
            className="danger-btn"
            onClick={() => { onDelete(entry.id); close(); }}
          >
            <Trash2 size={14}/> Delete entry
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function Overview({ data, buckets, onSetIncome, open, del, busy, error, user }) {
  const income = Number(data.income[currentMonth] || 0);
  const currentTotals = totals(data.entries, currentMonth);
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(income));
  const [savingIncome, setSavingIncome] = useState(false);
  const [monthSummaryOpen, setMonthSummaryOpen] = useState(false);
  const [inspectBucket, setInspectBucket] = useState(null);
  const [inspectEntry, setInspectEntry] = useState(null);
  const monthRef = useRef(null);

  useEffect(() => {
    if (!monthSummaryOpen) return undefined;
    const onPointerDown = event => {
      if (monthRef.current && !monthRef.current.contains(event.target)) setMonthSummaryOpen(false);
    };
    const onKeyDown = event => {
      if (event.key === 'Escape') setMonthSummaryOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [monthSummaryOpen]);

  const monthEntries = data.entries
    .filter(entry => entry.month === currentMonth && entry.bucket !== 'income')
    .slice()
    .sort((a, b) => new Date(b.date) - new Date(a.date));
  const recent = monthEntries.slice(0, 6);
  const allocatedTotal = buckets.reduce((sum, bucket) => sum + Math.max(0, currentTotals[bucket.id]), 0);
  const unallocated = Math.max(0, income - allocatedTotal);
  const firstName = user?.name?.split(' ')[0] || 'there';

  return <div className="content">
    <div className="welcome">
      <div>
        <span className="eyebrow-pill"><i className="eyebrow-dot" aria-hidden="true"/> YOUR FINANCIAL SNAPSHOT</span>
        <h1>Welcome, <em>{firstName}</em></h1>
        <p>A clear view of where your pocket money goes — and how every rupee builds your future.</p>
      </div>
      <div className="month-anchor" ref={monthRef}>
        <button
          type="button"
          className={monthSummaryOpen ? 'month-pill active' : 'month-pill'}
          onClick={() => setMonthSummaryOpen(openState => !openState)}
          aria-expanded={monthSummaryOpen}
        >
          <CalendarDays size={15}/>
          {new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
          <ChevronDown size={14} className={monthSummaryOpen ? 'rotated' : ''}/>
        </button>
        {monthSummaryOpen && (
          <div className="helios-popover month-popover" role="dialog" aria-label="Monthly summary">
            <div className="popover-head">
              <div>
                <small>MONTHLY BRIEF</small>
                <h4>{new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</h4>
              </div>
              <span className="pulse-badge">{monthEntries.length} logs</span>
            </div>
            <div className="month-popover-rows">
              <div><span>Pocket money</span><b>{money(income)}</b></div>
              <div><span>Allocated</span><b className="gain-text">{money(allocatedTotal)}</b></div>
              <div><span>Unallocated</span><b>{money(unallocated)}</b></div>
            </div>
          </div>
        )}
      </div>
    </div>

    {error && <p className="error" role="alert">{error}</p>}

    <section className="income-card spotlight-card"><div>
      <span className="income-label"><Wallet size={16}/> MONTHLY INCOME</span>
      {editing ? <div className="income-edit">₹<input type="number" min="0" value={value} onChange={event => setValue(event.target.value)}/><button disabled={savingIncome} onClick={async () => { setSavingIncome(true); const saved = await onSetIncome(Math.max(0, Number(value) || 0)); setSavingIncome(false); if (saved) setEditing(false); }}><Check size={16}/></button><button onClick={() => setEditing(false)}><X size={16}/></button></div> : <div className="income-number"><AnimatedValue value={income} format={money}/> <button onClick={() => { setValue(String(income)); setEditing(true); }}>Edit income <ArrowUpRight size={13}/></button></div>}
      <p>Your income is the starting point for this month's pocket money plan.</p>
    </div><div className="income-stats"><div><small>Allocated so far</small><b><AnimatedValue value={allocatedTotal} format={money}/></b></div></div><span className="rupee-art">$</span></section>

    <div className="section-title"><div><small>YOUR PERSONAL ALLOCATION PLAN</small><h2>Your monthly buckets</h2><p>Recommended amounts based on your income. Click any card to inspect details or log an entry.</p></div></div>
    <div className="bucket-grid">{buckets.map(bucket => <BucketCard key={bucket.id} bucket={bucket} income={income} target={Number(data.targets[bucket.id] || 0)} total={currentTotals[bucket.id]} add={open} remove={open} onInspect={setInspectBucket}/>)}</div>

    <div className="section-title recent-title"><div><small>YOUR LATEST ACTIVITY</small><h2>Recent entries</h2></div><span className="entry-count">{monthEntries.length} entries this month</span></div>
    <div className="entries spotlight-card">{busy ? <div className="empty">Loading your financial records…</div> : recent.length ? recent.map(entry => {
      const bucket = buckets.find(item => item.id === entry.bucket);
      if (!bucket) return null;
      const Icon = bucket.Icon;
      return <div
        className="entry"
        key={entry.id}
        onClick={() => setInspectEntry({ entry, bucket })}
        role="button"
        tabIndex={0}
        onKeyDown={event => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            setInspectEntry({ entry, bucket });
          }
        }}
      >
        <span className={`entry-icon ${bucket.tint}`}><Icon size={17}/></span>
        <div className="entry-desc">
          <b>{entry.title}</b>
          <small>{bucket.name} · {new Date(entry.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</small>
        </div>
        <strong className={entry.direction === 'remove' ? 'removed' : ''}>{entry.direction === 'remove' ? '−' : '+'}{money(entry.amount)}</strong>
        <button onClick={event => { event.stopPropagation(); del(entry.id); }} title="Delete entry" aria-label={`Delete ${entry.title}`}><Trash2 size={15}/></button>
      </div>;
    }) : <div className="empty">No entries yet. Add your first transaction to start tracking.</div>}</div>
    <p className="disclaimer"><ShieldCheck size={14}/> Planning guideline, not financial advice. {buckets.find(bucket => bucket.id === 'investment')?.name} values show contributions only — not market returns.</p>

    {inspectBucket && (
      <BucketInspectorModal
        bucket={inspectBucket}
        target={Number(data.targets[inspectBucket.id] || 0)}
        total={currentTotals[inspectBucket.id]}
        entries={monthEntries.filter(entry => entry.bucket === inspectBucket.id)}
        close={() => setInspectBucket(null)}
        onAction={open}
        onDelete={del}
      />
    )}
    {inspectEntry && (
      <EntryDetailModal
        entry={inspectEntry.entry}
        bucket={inspectEntry.bucket}
        income={income}
        close={() => setInspectEntry(null)}
        onDelete={del}
      />
    )}
  </div>;
}

function Analytics({ data, buckets }) {
  const rows = useMemo(() => {
    const keys = new Set([...Object.keys(data.income), ...data.entries.map(entry => entry.month)]);
    if (!keys.size) keys.add(currentMonth);
    return [...keys].sort().slice(-6).map(key => {
      const monthTotals = totals(data.entries, key);
      return {
        month: monthLabel(key),
        income: Number(data.income[key] || 0),
        expense: Math.max(0, monthTotals.expense),
        savings: Math.max(0, monthTotals.savings),
        investment: Math.max(0, monthTotals.investment),
        emergency: Math.max(0, monthTotals.emergency),
      };
    });
  }, [data]);
  const average = key => rows.reduce((sum, row) => sum + row[key], 0) / (rows.length || 1);
  const categoryName = id => buckets.find(bucket => bucket.id === id)?.name || id;
  const averages = [
    ['expense', categoryName('expense'), ShoppingBag, 'peach'],
    ['savings', categoryName('savings'), PiggyBank, 'mint'],
    ['investment', categoryName('investment'), TrendingUp, 'lavender'],
  ];

  const tooltipStyle = {
    background: '#0E0E11',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    borderRadius: 12,
    color: '#ffffff',
    boxShadow: '0 18px 44px rgba(0, 0, 0, 0.72), 0 0 24px rgba(230, 46, 45, 0.12)',
  };

  return <div className="content">
    <div className="welcome"><div><span className="eyebrow-pill"><i className="eyebrow-dot" aria-hidden="true"/> YOUR MONEY, OVER TIME</span><h1>See the bigger <em>picture.</em></h1><p>Patterns become clearer when you look beyond a single month.</p></div><div className="month-pill"><CalendarDays size={15}/>Last {rows.length} months<ChevronDown size={14}/></div></div>
    <div className="averages">{averages.map(([key, label, Icon, tint]) => <div className="average spotlight-card" key={key}><span className={`average-icon ${tint}`}><Icon size={18}/></span><small>{label}</small><b><AnimatedValue value={average(key)} format={money}/></b><em>Monthly average</em></div>)}</div>
    <section className="chart-card spotlight-card"><div className="chart-head"><div><small>MONTHLY BREAKDOWN</small><h2>Where your money goes</h2><p>Actual tracked amounts, month by month.</p></div><span className="chart-tag">INR · ₹</span></div>
      <div className="chart"><ResponsiveContainer width="100%" height="100%"><AreaChart data={rows} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}><defs><linearGradient id="ex" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#EF3B3A" stopOpacity=".28"/><stop offset="100%" stopColor="#EF3B3A" stopOpacity="0"/></linearGradient><linearGradient id="sv" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#22C55E" stopOpacity=".22"/><stop offset="100%" stopColor="#22C55E" stopOpacity="0"/></linearGradient><linearGradient id="inv" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#F59E0B" stopOpacity=".2"/><stop offset="100%" stopColor="#F59E0B" stopOpacity="0"/></linearGradient></defs><CartesianGrid strokeDasharray="3 5" vertical={false} stroke="rgba(255, 255, 255, 0.06)"/><XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#8e8e98', fontSize: 12 }}/><YAxis axisLine={false} tickLine={false} tick={{ fill: '#8e8e98', fontSize: 12 }} tickFormatter={value => value >= 1000 ? `₹${value / 1000}k` : `₹${value}`} width={58}/><Tooltip formatter={value => money(value)} cursor={{ stroke: '#EF3B3A', strokeDasharray: '4 4' }} contentStyle={tooltipStyle} labelStyle={{ color: '#f4f4f6', marginBottom: 6, fontWeight: 600 }} itemStyle={{ color: '#e4e4e7' }}/><Legend iconType="circle" wrapperStyle={{ color: '#a1a1aa', fontSize: 12, paddingTop: 12 }}/><Area type="monotone" dataKey="expense" name={categoryName('expense')} stroke="#EF3B3A" fill="url(#ex)" strokeWidth={2.4} activeDot={{ r: 5, fill: '#FF5B5A', stroke: '#09090b', strokeWidth: 2 }}/><Area type="monotone" dataKey="savings" name={categoryName('savings')} stroke="#22C55E" fill="url(#sv)" strokeWidth={2.4} activeDot={{ r: 5, fill: '#4ADE80', stroke: '#09090b', strokeWidth: 2 }}/><Area type="monotone" dataKey="investment" name={categoryName('investment')} stroke="#F59E0B" fill="url(#inv)" strokeWidth={2.4} activeDot={{ r: 5, fill: '#FBBF24', stroke: '#09090b', strokeWidth: 2 }}/></AreaChart></ResponsiveContainer></div>
    </section>
    <section className="chart-card spotlight-card"><div className="chart-head"><div><small>INCOME & RESERVES</small><h2>Your monthly income</h2><p>Income and {categoryName('emergency').toLowerCase()} contributions.</p></div></div>
      <div className="chart short"><ResponsiveContainer width="100%" height="100%"><LineChart data={rows}><CartesianGrid strokeDasharray="3 5" vertical={false} stroke="rgba(255, 255, 255, 0.06)"/><XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#8e8e98', fontSize: 12 }}/><YAxis axisLine={false} tickLine={false} tick={{ fill: '#8e8e98', fontSize: 12 }} tickFormatter={value => value >= 1000 ? `₹${value / 1000}k` : `₹${value}`} width={58}/><Tooltip formatter={value => money(value)} cursor={{ stroke: '#EF3B3A', strokeDasharray: '4 4' }} contentStyle={tooltipStyle} labelStyle={{ color: '#f4f4f6', marginBottom: 6, fontWeight: 600 }} itemStyle={{ color: '#e4e4e7' }}/><Legend iconType="circle" wrapperStyle={{ color: '#a1a1aa', fontSize: 12, paddingTop: 12 }}/><Line type="monotone" dataKey="income" name="Income" stroke="#EF3B3A" strokeWidth={2.5} dot={{ r: 3, fill: '#EF3B3A' }} activeDot={{ r: 6, fill: '#FF5B5A', stroke: '#09090b', strokeWidth: 2 }}/><Line type="monotone" dataKey="emergency" name={categoryName('emergency')} stroke="#E4E4E7" strokeWidth={2.2} dot={{ r: 3, fill: '#E4E4E7' }} activeDot={{ r: 5, fill: '#ffffff', stroke: '#09090b', strokeWidth: 2 }}/></LineChart></ResponsiveContainer></div>
    </section>
    <div className="analytics-note spotlight-card"><ShieldCheck size={18}/><div><b>How these numbers work</b><p>Monthly averages use months with saved income or activity. {categoryName('savings')}, {categoryName('investment')} and {categoryName('emergency').toLowerCase()} are net contributions after removals. {categoryName('investment')} profit or loss is excluded.</p></div></div>
    <p className="disclaimer">Analytics are calculated from transactions retrieved from your Vaulto account.</p>
  </div>;
}

export default function App() {
  useCardSpotlight();

  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [data, setData] = useState({ income: {}, entries: [], targets: {} });
  const [page, setPage] = useState('overview');
  const [modal, setModal] = useState(null);
  const [menu, setMenu] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [settingsDirty, setSettingsDirty] = useState(false);
  const [toast, setToast] = useState(null);
  const toastTimerRef = useRef(null);
  const buckets = useMemo(() => getBuckets(settings), [settings]);

  const showToast = useCallback((title, subtitle = '', tone = 'success') => {
    setToast({ title, subtitle, tone });
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToast(null), 3200);
  }, []);

  useEffect(() => () => {
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
  }, []);

  async function loadFinancialData() {
    setBusy(true);
    setError('');
    try {
      const [summary, records] = await Promise.all([api.summary(currentMonth), api.transactions()]);
      const entries = records.map(record => {
        const date = new Date(record.transaction_date);
        return { id: record.id, bucket: record.category, direction: record.direction, amount: Number(record.amount), title: record.description, date: record.transaction_date, month: monthKey(date) };
      });
      const income = {};
      for (const record of records) {
        if (record.category === 'income') {
          const month = monthKey(new Date(record.transaction_date));
          income[month] = (income[month] || 0) + (record.direction === 'remove' ? -Number(record.amount) : Number(record.amount));
        }
      }
      income[currentMonth] = Number(summary.income) || 0;
      setData({ income, entries, targets: summary.allocation_targets });
    } catch (requestError) {
      setError(requestError.message || 'Unable to load your financial data.');
    } finally {
      setBusy(false);
    }
  }

  async function loadSettings() {
    setError('');
    const savedSettings = await api.settings();
    setSettings(savedSettings);
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
        const savedSettings = await api.settings();
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
      const savedSettings = await api.settings();
      setSettings(savedSettings);
      setSettingsLoaded(true);
      await loadFinancialData();
      showToast(`Welcome back, ${currentUser.name.split(' ')[0]}`, 'Your pocket money dashboard is ready.', 'sparkle');
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
    setData({ income: {}, entries: [], targets: {} });
    setError('');
  }

  function navigate(nextPage) {
    if (nextPage !== page && settingsDirty && !window.confirm('Discard your unsaved settings changes?')) return;
    setPage(nextPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const onSettingsDirtyChange = useCallback(dirty => setSettingsDirty(dirty), []);
  useEffect(() => {
    if (!settingsDirty) return undefined;
    const warn = event => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [settingsDirty]);

  async function saveSettings(payload) {
    const saved = await api.updateSettings(payload);
    setSettings(saved);
    await loadFinancialData();
    showToast('Plan updated', 'Your allocation split is now active.', 'sparkle');
    return saved;
  }

  async function restoreSettings() {
    const saved = await saveSettings(DEFAULT_SETTINGS);
    showToast('Defaults restored', 'Your buckets are back to the recommended split.');
    return saved;
  }

  async function saveEntry(entry) {
    setError('');
    try {
      await api.createTransaction({ category: entry.bucket, direction: entry.direction, amount: entry.amount, description: entry.title, transaction_date: entry.date });
      setModal(null);
      await loadFinancialData();
      showToast(
        entry.direction === 'remove' ? 'Removal recorded' : 'Entry logged',
        `${entry.title} · ${money(entry.amount)}`,
        'sparkle',
      );
    } catch (requestError) {
      setError(requestError.message || 'Unable to save this transaction.');
    }
  }

  async function deleteEntry(id) {
    setError('');
    try {
      await api.deleteTransaction(id);
      await loadFinancialData();
      showToast('Entry removed', 'Your monthly totals have been recalculated.');
    } catch (requestError) {
      setError(requestError.message || 'Unable to delete this transaction.');
    }
  }

  async function setIncome(nextIncome) {
    const previous = Number(data.income[currentMonth] || 0);
    const difference = nextIncome - previous;
    if (!difference) return true;
    try {
      await api.createTransaction({
        category: 'income',
        direction: difference > 0 ? 'add' : 'remove',
        amount: Math.abs(difference),
        description: difference > 0 ? 'Monthly income added' : 'Monthly income adjustment',
        transaction_date: new Date().toISOString().slice(0, 10),
      });
      await loadFinancialData();
      showToast('Monthly income updated', `New monthly target base: ${money(nextIncome)}`, 'sparkle');
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
      <Header page={page} setOpen={setMenu} user={user} data={data} buckets={buckets} onOpenSettings={() => navigate('settings')}/>
      {error && page !== 'overview' && <p className="error app-error" role="alert">{error}</p>}
      <div key={page} className="page-stage">
        {page === 'overview' && <Overview data={data} buckets={buckets} onSetIncome={setIncome} open={(bucket, mode) => setModal({ bucket, mode })} del={deleteEntry} busy={busy} error={error} user={user}/>}
        {page === 'analytics' && <Analytics data={data} buckets={buckets}/>}
        {page === 'settings' && <SettingsPage settings={settings} onSave={saveSettings} onRestore={restoreSettings} onDirtyChange={onSettingsDirtyChange}/>}
      </div>
    </main>
    {modal && <EntryModal bucket={modal.bucket} mode={modal.mode} close={() => setModal(null)} save={saveEntry}/>}
    <ToastBanner toast={toast} onDismiss={() => setToast(null)}/>
  </div>;
}
