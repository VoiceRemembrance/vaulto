import { useEffect, useMemo, useState } from 'react';
import { Archive, ArchiveRestore, Plus, Save } from 'lucide-react';

function toDraft(settings) {
  return (settings.categories || []).map((category, index) => ({
    id: category.id ?? null,
    localKey: category.id ?? `local-${index}`,
    name: category.name || '',
    percentage: String(category.percentage ?? 0),
    category_type: category.category_type || 'expense',
    active: category.active !== false,
  }));
}

export default function SettingsPage({ settings, onSave, onDirtyChange }) {
  const [draft, setDraft] = useState(() => toDraft(settings));
  const [newName, setNewName] = useState('');
  const [newPercentage, setNewPercentage] = useState('0');
  const [newType, setNewType] = useState('expense');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const pristine = useMemo(() => JSON.stringify(toDraft(settings)), [settings]);
  const serializedDraft = JSON.stringify(draft);
  const dirty = serializedDraft !== pristine;
  const active = draft.filter(category => category.active);
  const total = active.reduce((sum, category) => {
    const value = Number(category.percentage);
    return sum + (Number.isFinite(value) ? value : 0);
  }, 0);
  const inputsValid = draft.every(category => {
    const value = category.percentage;
    return category.name.trim().length > 0
      && category.name.trim().length <= 80
      && value !== ''
      && Number.isFinite(Number(value))
      && Number(value) >= 0
      && Number(value) <= 100;
  });
  const names = draft.map(category => category.name.trim().toLocaleLowerCase());
  const namesUnique = new Set(names).size === names.length;
  const canSave = dirty && active.length > 0 && inputsValid && namesUnique && Math.abs(total - 100) < 0.000001;
  const archived = draft.filter(category => !category.active);

  useEffect(() => {
    setDraft(toDraft(settings));
    setMessage('');
    setError('');
  }, [settings]);

  useEffect(() => {
    onDirtyChange(dirty);
    return () => onDirtyChange(false);
  }, [dirty, onDirtyChange]);

  function update(localKey, field, value) {
    setDraft(current => current.map(category =>
      category.localKey === localKey ? { ...category, [field]: value } : category,
    ));
    setMessage('');
    setError('');
  }

  function addCategory(event) {
    event.preventDefault();
    const name = newName.trim();
    if (!name || name.length > 80 || !Number.isFinite(Number(newPercentage))
      || Number(newPercentage) < 0 || Number(newPercentage) > 100) {
      setError('Enter a category name and an allocation between 0 and 100%.');
      return;
    }
    if (draft.some(category => category.name.trim().toLocaleLowerCase() === name.toLocaleLowerCase())) {
      setError('Category names must be unique, ignoring letter case.');
      return;
    }
    setDraft(current => [...current, {
      id: null,
      localKey: `new-${Date.now()}-${Math.random()}`,
      name,
      percentage: newPercentage,
      category_type: newType,
      active: true,
    }]);
    setNewName('');
    setNewPercentage('0');
    setMessage('');
    setError('');
  }

  async function save(event) {
    event.preventDefault();
    if (!active.length || !inputsValid || !namesUnique || Math.abs(total - 100) >= 0.000001) {
      setError(!namesUnique
        ? 'Category names must be unique, ignoring letter case.'
        : 'Enter valid category names and percentages that total exactly 100%.');
      return;
    }
    setSaving(true);
    setMessage('');
    setError('');
    try {
      await onSave(draft.map(({ id, name, percentage, category_type, active: isActive }) => ({
        id,
        name: name.trim(),
        percentage: Number(percentage),
        category_type,
        active: isActive,
      })));
      setMessage('Your categories and allocations have been saved.');
    } catch (saveError) {
      setError(saveError.message || 'Unable to save your categories.');
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
          <p>Create and manage the categories in your personal allocation plan.</p>
        </div>
      </div>
      <form className="settings-form" onSubmit={save}>
        <section className="settings-card">
          <div className="settings-heading">
            <div><small>PERSONALIZE YOUR PLAN</small><h2>Allocation categories</h2></div>
            <span className={`settings-total ${Math.abs(total - 100) < 0.000001 ? 'valid' : 'invalid'}`}>
              Total <b>{Number.isFinite(total) ? Number(total.toFixed(2)) : 0}%</b>
            </span>
          </div>
          <p className="settings-description">Add as many categories as you need. Active allocations must total exactly 100% before saving.</p>
          <div className="settings-fields">
            {active.map(category => (
              <div className="settings-category" key={category.localKey}>
                <label className="settings-field">
                  <span>Category name</span>
                  <input
                    type="text"
                    maxLength="80"
                    value={category.name}
                    onChange={event => update(category.localKey, 'name', event.target.value)}
                    aria-label={`${category.name || 'Category'} name`}
                  />
                </label>
                <label className="settings-field">
                  <span>Allocation percentage</span>
                  <div className="settings-number">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      inputMode="decimal"
                      value={category.percentage}
                      onChange={event => update(category.localKey, 'percentage', event.target.value)}
                      aria-label={`${category.name || 'Category'} percentage`}
                    />
                    <b>%</b>
                  </div>
                </label>
                <label className="settings-field">
                  <span>Calculation type</span>
                  <select
                    value={category.category_type}
                    onChange={event => update(category.localKey, 'category_type', event.target.value)}
                    aria-label={`${category.name || 'Category'} type`}
                  >
                    <option value="expense">Expense budget</option>
                    <option value="contribution">Savings / contribution target</option>
                  </select>
                </label>
                <button
                  type="button"
                  className="category-state"
                  onClick={() => update(category.localKey, 'active', false)}
                  aria-label={`Archive ${category.name}`}
                ><Archive size={15}/> Archive</button>
              </div>
            ))}
            {!active.length && <p className="empty settings-empty">Add a category to start building your allocation.</p>}
          </div>
          {!inputsValid && <p className="settings-hint error">Names are required and percentages must be between 0 and 100.</p>}
          {!namesUnique && <p className="settings-hint error">Category names must be unique, ignoring letter case.</p>}
          {active.length > 0 && inputsValid && Math.abs(total - 100) >= 0.000001 && (
            <p className="settings-hint error">Adjust active allocations so the total is exactly 100%.</p>
          )}
        </section>

        <section className="settings-card">
          <div className="settings-heading">
            <div><small>GROW YOUR PLAN</small><h2>Add a category</h2></div>
          </div>
          <p className="settings-description">New categories start at 0%. Adjust active percentages to keep the total at 100%.</p>
          <div className="settings-add-row">
            <label className="settings-field">Name
              <input value={newName} maxLength="80" onChange={event => setNewName(event.target.value)} placeholder="Category name"/>
            </label>
            <label className="settings-field">Allocation
              <div className="settings-number"><input type="number" min="0" max="100" step="0.01" value={newPercentage} onChange={event => setNewPercentage(event.target.value)}/><b>%</b></div>
            </label>
            <label className="settings-field">Type
              <select value={newType} onChange={event => setNewType(event.target.value)}>
                <option value="expense">Expense budget</option>
                <option value="contribution">Savings / contribution target</option>
              </select>
            </label>
            <button type="button" className="primary" onClick={addCategory}><Plus size={15}/> Add category</button>
          </div>
        </section>

        {archived.length > 0 && <section className="settings-card">
          <div className="settings-heading">
            <div><small>HIDDEN FROM NEW ENTRIES</small><h2>Archived categories</h2></div>
          </div>
          <div className="archived-list">
            {archived.map(category => <div className="archived-row" key={category.localKey}>
              <div><b>{category.name}</b><small>{category.percentage}% · {category.category_type === 'expense' ? 'Expense budget' : 'Contribution target'}</small></div>
              <button type="button" className="category-state" onClick={() => update(category.localKey, 'active', true)}><ArchiveRestore size={15}/> Restore</button>
            </div>)}
          </div>
        </section>}

        {error && <p className="error settings-alert" role="alert">{error}</p>}
        {message && <p className="settings-success" role="status">{message}</p>}
        <div className="settings-actions">
          <button className="primary" disabled={!canSave || saving}>
            <Save size={15}/>{saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
