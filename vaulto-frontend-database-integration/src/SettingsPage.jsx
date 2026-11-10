import { useEffect, useMemo, useState } from 'react';
import { ArrowUpRight, RotateCcw, Save } from 'lucide-react';
import { DEFAULT_SETTINGS } from './settings.js';

const CATEGORIES = [
  ['expense', 'Guilt-free Expense'],
  ['savings', 'Savings'],
  ['investment', 'Investments'],
  ['emergency', 'Emergency Fund'],
];

function toDraft(settings) {
  return Object.fromEntries(
    Object.keys(DEFAULT_SETTINGS).map(key => [key, String(settings[key])]),
  );
}

export default function SettingsPage({ settings, onSave, onRestore, onDirtyChange }) {
  const [draft, setDraft] = useState(() => toDraft(settings));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const pristine = useMemo(() => toDraft(settings), [settings]);
  const dirty = Object.keys(draft).some(key => draft[key] !== pristine[key]);
  const total = CATEGORIES.reduce((sum, [id]) => {
    const value = Number(draft[`${id}_percentage`]);
    return sum + (Number.isFinite(value) ? value : 0);
  }, 0);
  const inputsValid = CATEGORIES.every(([id]) => {
    const value = draft[`${id}_percentage`];
    return value !== '' && Number.isFinite(Number(value)) && Number(value) >= 0 && Number(value) <= 100;
  });
  const namesValid = CATEGORIES.every(([id]) => {
    const name = draft[`${id}_name`]?.trim() ?? '';
    return name.length > 0 && name.length <= 40;
  });
  const canSave = dirty && inputsValid && namesValid && Math.abs(total - 100) < 0.000001;

  useEffect(() => {
    setDraft(toDraft(settings));
    setMessage('');
    setError('');
  }, [settings]);

  useEffect(() => {
    onDirtyChange(dirty);
    return () => onDirtyChange(false);
  }, [dirty, onDirtyChange]);

  function update(key, value) {
    setDraft(current => ({ ...current, [key]: value }));
    setMessage('');
    setError('');
  }

  async function save(event) {
    event.preventDefault();
    if (!inputsValid || !namesValid || Math.abs(total - 100) >= 0.000001) {
      setError('Enter four valid percentages that total exactly 100%, and non-empty category names up to 40 characters.');
      return;
    }
    setSaving(true);
    setMessage('');
    setError('');
    try {
      await onSave({
        ...Object.fromEntries(CATEGORIES.map(([id]) => [
          `${id}_percentage`,
          Number(draft[`${id}_percentage`]),
        ])),
        ...Object.fromEntries(CATEGORIES.map(([id]) => [
          `${id}_name`,
          draft[`${id}_name`].trim(),
        ])),
      });
      setMessage('Your allocation settings have been saved.');
    } catch (saveError) {
      setError(saveError.message || 'Unable to save your settings.');
    } finally {
      setSaving(false);
    }
  }

  async function restoreDefaults() {
    if (dirty && !window.confirm('Discard your unsaved changes and restore the default settings?')) return;
    setSaving(true);
    setMessage('');
    setError('');
    try {
      await onRestore();
      setMessage('Default allocation settings restored.');
    } catch (restoreError) {
      setError(restoreError.message || 'Unable to restore the default settings.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="content settings-content">
      <div className="welcome">
        <div>
          <span className="eyebrow dark">YOUR MONEY, YOUR PLAN</span>
          <h1>Allocation <em>settings.</em></h1>
          <p>Choose how your income is divided and name each category your way.</p>
        </div>
      </div>
      <form className="settings-form" onSubmit={save}>
        <section className="settings-card">
          <div className="settings-heading">
            <div><small>PERSONALIZE YOUR PLAN</small><h2>Allocation percentages</h2></div>
            <span className={`settings-total ${Math.abs(total - 100) < 0.000001 ? 'valid' : 'invalid'}`}>
              Total <b>{Number.isFinite(total) ? Number(total.toFixed(2)) : 0}%</b>
            </span>
          </div>
          <p className="settings-description">The four percentages must add up to exactly 100%.</p>
          <div className="settings-fields">
            {CATEGORIES.map(([id, defaultName]) => (
              <label className="settings-field" key={id}>
                <span>{settings[`${id}_name`] || defaultName}</span>
                <div className="settings-number">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    inputMode="decimal"
                    value={draft[`${id}_percentage`]}
                    onChange={event => update(`${id}_percentage`, event.target.value)}
                    aria-label={`${settings[`${id}_name`] || defaultName} percentage`}
                  />
                  <b>%</b>
                </div>
              </label>
            ))}
          </div>
          {!inputsValid && <p className="settings-hint error">Each percentage must be between 0 and 100.</p>}
          {inputsValid && Math.abs(total - 100) >= 0.000001 && (
            <p className="settings-hint error">Adjust the percentages so the total is exactly 100%.</p>
          )}
        </section>

        <section className="settings-card">
          <div className="settings-heading">
            <div><small>KEEP THEIR FINANCIAL MEANING</small><h2>Category names</h2></div>
          </div>
          <p className="settings-description">Renaming changes only what you see; existing transactions stay in their original categories.</p>
          <div className="settings-fields">
            {CATEGORIES.map(([id, defaultName]) => (
              <label className="settings-field" key={id}>
                <span>Display name <small>· default: {defaultName}</small></span>
                <input
                  type="text"
                  maxLength="40"
                  value={draft[`${id}_name`]}
                  onChange={event => update(`${id}_name`, event.target.value)}
                  aria-label={`${defaultName} category name`}
                />
              </label>
            ))}
          </div>
          {!namesValid && <p className="settings-hint error">Names cannot be empty and must be 40 characters or fewer.</p>}
        </section>
        {error && <p className="error settings-alert" role="alert">{error}</p>}
        {message && <p className="settings-success" role="status">{message}</p>}
        <div className="settings-actions">
          <button type="button" className="cancel" onClick={restoreDefaults} disabled={saving}>
            <RotateCcw size={15}/> Restore defaults
          </button>
          <button className="primary" disabled={!canSave || saving}>
            <Save size={15}/>{saving ? 'Saving…' : 'Save changes'}<ArrowUpRight size={15}/>
          </button>
        </div>
      </form>
    </div>
  );
}
