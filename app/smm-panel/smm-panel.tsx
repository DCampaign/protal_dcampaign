'use client';

import { useCallback, useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import Link from 'next/link';
import { ArrowUpRight, Boxes, CheckCheck, ChevronRight, CircleHelp, ClipboardList, LayoutDashboard, LockKeyhole, LogOut, PlugZap, Plus, RefreshCw, Search, ShoppingBag } from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import type { PanelData, Provider, Service } from '@/lib/smm/types';
import styles from './smm.module.css';

const tabs = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'new', label: 'New order', icon: Plus },
  { id: 'services', label: 'Services', icon: Boxes },
  { id: 'orders', label: 'Orders', icon: ClipboardList },
  { id: 'providers', label: 'API providers', icon: PlugZap },
] as const;
type Tab = typeof tabs[number]['id'];
const empty: PanelData = { providers: [], services: [], orders: [] };
const title: Record<Tab, string> = { overview: 'Your social workspace.', new: 'Create an order.', services: 'Find the right service.', orders: 'Every order. In one place.', providers: 'Connect your providers.' };
function Card({ children, className = '' }: { children: ReactNode; className?: string }) { return <div className={`${styles.card} ${className}`}>{children}</div>; }

export function SmmPanel() {
  const [tab, setTab] = useState<Tab>('overview');
  const [data, setData] = useState<PanelData>(empty);
  const [auth, setAuth] = useState<'loading' | 'login' | 'ready'>('loading');
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [storageReady, setStorageReady] = useState(false);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [serviceId, setServiceId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [link, setLink] = useState('');
  const [review, setReview] = useState(false);
  const orderId = useRef<string | null>(null);
  const [editing, setEditing] = useState<Provider | null>(null);
  const [page, setPage] = useState(1);
  const selected = data.services.find(s => s.id === serviceId);
  const categories = Array.from(new Set(data.services.map(s => s.category))).sort();
  const filtered = data.services.filter(s => (category === 'all' || s.category === category) && `${s.name} ${s.remote_id} ${s.category}`.toLowerCase().includes(search.toLowerCase()));
  const orderServices = data.services.filter(s => s.type.toLowerCase() === 'default' && (category === 'all' || s.category === category) && `${s.name} ${s.remote_id} ${s.category}`.toLowerCase().includes(search.toLowerCase()));
  const completed = data.orders.filter(o => o.status.toLowerCase() === 'completed').length;
  const active = data.orders.filter(o => ['pending', 'processing', 'in progress', 'submitting'].includes(o.status.toLowerCase())).length;

  const load = useCallback(async () => {
    try {
      const response = await fetch('/api/smm', { cache: 'no-store' });
      const result = await response.json();
      if (response.status === 401) { setAuth('login'); setData(empty); setStorageReady(false); return; }
      setAuth('ready');
      if (!response.ok) { setStorageReady(false); setError(result.error ?? 'Unable to load panel.'); return; }
      setData(result as PanelData); setStorageReady(true);
    } catch { setError('Unable to connect. Please try again.'); setAuth('login'); }
  }, []);
  // load() awaits the network before updating state; this hydrates the private workspace.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(); }, [load]);

  async function action(body: object) {
    if (busyRef.current) return false;
    busyRef.current = true; setBusy(true); setError(''); setNotice('');
    try {
      const response = await fetch('/api/smm', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? 'Request failed.');
      setNotice(result.message); await load(); return true;
    } catch (err) { setError(err instanceof Error ? err.message : 'Connection lost. Check Orders before resubmitting.'); return false; }
    finally { busyRef.current = false; setBusy(false); }
  }
  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError('');
    const form = new FormData(event.currentTarget);
    try {
      const client = createSupabaseBrowserClient();
      if (!client) throw new Error('Authentication is not configured.');
      const result = await client.auth.signInWithPassword({ email: String(form.get('email')), password: String(form.get('password')) });
      if (result.error) throw new Error('Check your email and password.');
      const response = await fetch('/api/smm', { cache: 'no-store' });
      if (response.status === 401) throw new Error('An active admin or super admin account is required.');
      await load();
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to sign in.'); }
    finally { setBusy(false); }
  }
  function choose(service: Service) { setServiceId(service.id); setQuantity(String(service.min)); setReview(false); orderId.current = null; setTab('new'); }
  function switchTab(next: Tab) { setTab(next); setSearch(''); setPage(1); setReview(false); }

  if (auth === 'loading') return <section className={styles.root}><p role="status" className={styles.loading}>Loading your workspace…</p></section>;
  if (auth === 'login') return <section className={styles.root}><div className={styles.loginGrid}><div><p className={styles.kicker}>DCAMPAIGN SMM PANEL</p><h1 className={styles.loginTitle}>More control.<br /><span>Every social order.</span></h1><p className={styles.intro}>Your services, providers, and delivery updates. Connected in one focused workspace.</p><div className={styles.loginFeatures}>{[[Boxes, 'One service catalog'], [ClipboardList, 'Clear order tracking'], [PlugZap, 'Your choice of provider']].map(([Icon, label]) => { const Component = Icon as typeof Boxes; return <div key={String(label)}><Component size={20} /><span>{String(label)}</span></div>; })}</div></div><Card><LockKeyhole className={styles.orange} size={28} /><p className={styles.kicker}>ADMIN WORKSPACE</p><h2>Sign in to SMM Panel.</h2><p className={styles.muted}>Use your existing DCampaign administrator account.</p><form onSubmit={login} className={styles.form}><label>Email address<input type="email" name="email" autoComplete="username" required placeholder="Your work email" /></label><label>Password<input name="password" type="password" autoComplete="current-password" required placeholder="Enter your password" /></label>{error && <p role="alert" className={styles.message}>{error}</p>}<button className={styles.primary} disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}<ChevronRight size={17} /></button><Link href="/client/forgot-password" className={styles.textLink}>Forgot password?</Link></form></Card></div></section>;

  return <section className={styles.root}>
    <div className={styles.topline}><Link href="/">Workspace</Link><ChevronRight size={14} /><span>SMM Panel</span><span className={styles.adminBadge}><LockKeyhole size={12} />Administrator</span></div>
    <div className={styles.heading}><div><p className={styles.kicker}>SOCIAL MEDIA MANAGEMENT</p><h1>{title[tab]}</h1><p className={styles.muted}>Connect services. Manage delivery. Keep everything moving.</p></div><button className={styles.primary} onClick={() => switchTab('new')}><Plus size={17} />New order</button></div>
    <div className={styles.workspace}>
      <aside className={styles.sidebar}><p className={styles.navLabel}>WORKSPACE</p><nav aria-label="SMM workspace">{tabs.map(({ id, label, icon: Icon }) => <button key={id} aria-current={tab === id ? 'page' : undefined} className={tab === id ? styles.selected : ''} onClick={() => switchTab(id)}><Icon size={18} />{label}{id === 'orders' && <span>{data.orders.length}</span>}</button>)}</nav><div className={styles.sidebarBottom}><Link href="/support"><CircleHelp size={17} />Help & support</Link><button onClick={async () => { await createSupabaseBrowserClient()?.auth.signOut(); setAuth('login'); setData(empty); }}><LogOut size={17} />Sign out</button></div></aside>
      <div className={styles.content}>
        {(error || notice) && <div role={error ? 'alert' : 'status'} className={styles.message}>{error || notice}<button aria-label="Dismiss message" onClick={() => { setError(''); setNotice(''); }}>×</button></div>}
        {!storageReady && <Card><h2>Finish workspace setup</h2><p className={styles.muted}>The interface is ready. Your administrator needs to apply the SMM database migration before providers and orders can be saved.</p><button className={styles.secondary} onClick={() => { setError(''); void load(); }}>Check connection</button></Card>}
        {tab === 'overview' && <>
          <div className={styles.stats}>{[[Boxes, 'Available services', data.services.length], [ShoppingBag, 'Recent orders', data.orders.length], [RefreshCw, 'In progress', active], [CheckCheck, 'Completed', completed]].map(([Icon, label, value]) => { const Component = Icon as typeof Boxes; return <Card key={String(label)}><Component size={18} className={styles.orange} /><strong>{Number(value).toLocaleString()}</strong><span>{String(label)}</span></Card>; })}</div>
          <Card className={styles.feature}><div><p className={styles.kicker}>YOUR NEXT MOVE</p><h2>{data.providers.length ? 'Ready for your next order?' : 'Your providers. Your panel.'}</h2><p>Connect a provider, bring in its service catalog, and manage your orders from here.</p><button className={styles.primary} onClick={() => switchTab(data.providers.length ? 'services' : 'providers')}>{data.providers.length ? 'Explore services' : 'Connect a provider'}<ArrowUpRight size={17} /></button></div><div className={styles.featureIcon}><PlugZap size={58} strokeWidth={1} /></div></Card>
          <div className={styles.twoColumns}><Card><div className={styles.cardTitle}><h2>Latest orders</h2><button className={styles.textLink} onClick={() => switchTab('orders')}>View all <ArrowUpRight size={14} /></button></div>{data.orders.length ? data.orders.slice(0, 4).map(o => <div className={styles.listRow} key={o.id}><div><strong>{data.services.find(s => s.id === o.service_id)?.name ?? 'Service order'}</strong><small>{o.quantity.toLocaleString()} units · #{o.remote_id ?? o.id.slice(0, 8)}</small></div><span className={styles.badge}>{o.status}</span></div>) : <Empty icon={<ClipboardList size={28} />} title="A clean slate." text="Your orders and delivery updates will appear here." />}</Card><Card><h2>Getting started</h2>{[['01', 'Connect your API', 'Add a provider endpoint and API key.'], ['02', 'Sync the service catalog', 'Review categories, prices, and limits.'], ['03', 'Place and track orders', 'Review every order before submitting.']].map(([n, t, d]) => <div key={n} className={styles.step}><span>{n}</span><div><strong>{t}</strong><p>{d}</p></div></div>)}</Card></div>
          <p className={styles.caption}>Order metrics cover the latest 100 orders. Prices use each provider’s account currency.</p>
        </>}
        {tab === 'services' && <Card><div className={styles.cardTitle}><div><h2>Service catalog</h2><p className={styles.muted}>{data.services.length} imported services</p></div><button className={styles.secondary} onClick={() => switchTab('providers')}><RefreshCw size={15} />Sync services</button></div><div className={styles.filters}><label className={styles.search}><Search size={17} /><input aria-label="Search services" placeholder="Search services or ID…" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} /></label><select aria-label="Filter category" value={category} onChange={e => { setCategory(e.target.value); setPage(1); }}><option value="all">All categories</option>{categories.map(c => <option key={c}>{c}</option>)}</select></div>{filtered.length ? <><div className={styles.tableWrap}><table><thead><tr><th>Service</th><th>Rate / 1,000</th><th>Min–Max</th><th><span className="sr-only">Action</span></th></tr></thead><tbody>{filtered.slice((page - 1) * 10, page * 10).map(s => <tr key={s.id}><td><strong>{s.name}</strong><small>{s.category} · #{s.remote_id} · {data.providers.find(p => p.id === s.provider_id)?.name}</small></td><td>{Number(s.rate).toFixed(4)}<small>Provider currency</small></td><td>{s.min.toLocaleString()}–{s.max.toLocaleString()}</td><td><button className={styles.secondary} disabled={s.type.toLowerCase() !== 'default'} onClick={() => choose(s)}>{s.type.toLowerCase() === 'default' ? 'Order' : 'Custom adapter needed'}</button></td></tr>)}</tbody></table></div><div className={styles.pagination}><button disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</button><span>Page {page} of {Math.ceil(filtered.length / 10)}</span><button disabled={page * 10 >= filtered.length} onClick={() => setPage(page + 1)}>Next</button></div></> : <Empty icon={<Boxes size={28} />} title={data.services.length ? 'No matching services' : 'Connect your first catalog'} text={data.services.length ? 'Try another search or category.' : 'Add an API provider and sync to see its services here.'} />}</Card>}
        {tab === 'new' && <div className={styles.orderGrid}><Card><p className={styles.kicker}>ORDER DETAILS</p><h2>{review ? 'Review your order' : 'What would you like to order?'}</h2><form className={styles.form} onSubmit={async e => { e.preventDefault(); if (!selected) return; if (!review) { setReview(true); return; } orderId.current ??= crypto.randomUUID(); const success = await action({ action: 'order', id: orderId.current, serviceId, link, quantity: Number(quantity), confirmed: true }); if (success) { setReview(false); orderId.current = null; setTab('orders'); setLink(''); } }}><label>Search services<div className={styles.search}><Search size={17} /><input aria-label="Search order services" placeholder="Search services" value={search} disabled={review || busy} onChange={e => { setSearch(e.target.value); setServiceId(''); setQuantity(''); }} /></div></label><label>Category<select required value={category} disabled={review || busy} onChange={e => { setCategory(e.target.value); setServiceId(''); setQuantity(''); }}><option value="all">All categories</option>{categories.map(c => <option key={c}>{c}</option>)}</select></label><label>Service<select required value={serviceId} disabled={review || busy} onChange={e => { setServiceId(e.target.value); const s = data.services.find(s => s.id === e.target.value); setQuantity(s ? String(s.min) : ''); orderId.current = null; }}><option value="">Choose a service</option>{orderServices.map(s => <option value={s.id} key={s.id}>{s.remote_id} — {s.name}</option>)}</select></label><label>Link<input required type="url" placeholder="https://…" value={link} disabled={review || busy} onChange={e => { setLink(e.target.value); orderId.current = null; }} /></label><label>Quantity<input required type="number" min={selected?.min ?? 1} max={selected?.max} step="1" placeholder="Enter quantity" value={quantity} disabled={review || busy} onChange={e => { setQuantity(e.target.value); orderId.current = null; }} /></label>{selected && <p className={styles.caption}>Minimum {selected.min.toLocaleString()} · Maximum {selected.max.toLocaleString()}</p>}{review && <p className={styles.message}>Confirming sends a live order to {data.providers.find(p => p.id === selected?.provider_id)?.name}. The provider may deduct its charge from your balance.</p>}{!review && search && !orderServices.length && <p className={styles.caption}>No matching services found. Try another search.</p>}<button disabled={busy || !storageReady || !selected} className={styles.primary}>{busy ? 'Submitting…' : review ? 'Confirm & place order' : 'Review order'}<ChevronRight size={17} /></button>{review && <button type="button" disabled={busy} className={styles.textLink} onClick={() => setReview(false)}>Back to edit</button>}</form></Card><Card><h2>Order summary</h2><dl className={styles.summary}><dt>Provider</dt><dd>{data.providers.find(p => p.id === selected?.provider_id)?.name ?? '—'}</dd><dt>Service</dt><dd>{selected?.name ?? 'Not selected'}</dd><dt>Quantity</dt><dd>{quantity || '—'}</dd><dt>Rate per 1,000</dt><dd>{selected ? Number(selected.rate).toFixed(4) : '—'}</dd></dl><div className={styles.total}><span>Estimated charge</span><strong>{selected && Number(quantity) > 0 ? (selected.rate * Number(quantity) / 1000).toFixed(4) : '0.0000'}</strong><small>In the provider’s account currency. Final charge is set by the provider.</small></div><p className={styles.caption}>Check the target link and service details carefully. Orders cannot be automatically reversed from this panel.</p></Card></div>}
        {tab === 'orders' && <Card><div className={styles.cardTitle}><h2>Order history</h2><button className={styles.secondary} onClick={() => void load()}><RefreshCw size={15} />Reload</button></div><label className={styles.search}><Search size={17} /><input aria-label="Search orders" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search order ID, link, or status…" /></label>{data.orders.length ? <div className={styles.tableWrap}><table><thead><tr><th>Order / Service</th><th>Quantity</th><th>Status</th><th>Updated status</th></tr></thead><tbody>{data.orders.filter(o => `${o.id} ${o.remote_id ?? ''} ${o.link} ${o.status}`.toLowerCase().includes(search.toLowerCase())).map(o => <tr key={o.id}><td><strong>#{o.remote_id ?? o.id.slice(0, 8)}</strong><small>{data.services.find(s => s.id === o.service_id)?.name}</small><a href={o.link} target="_blank" rel="noopener noreferrer" className={styles.targetLink}>{o.link}</a><small>{new Date(o.created_at).toLocaleString()}</small></td><td>{o.quantity.toLocaleString()}<small>Est. {Number(o.cost).toFixed(4)}</small></td><td><span className={styles.badge}>{o.status}</span></td><td><button className={styles.secondary} disabled={busy || !o.remote_id} onClick={() => void action({ action: 'refresh', orderId: o.id })}>Refresh</button></td></tr>)}</tbody></table></div> : <Empty icon={<ShoppingBag size={28} />} title="No orders yet" text="Choose a service to create your first order." />}<p className={styles.caption}>Latest 100 orders. Refresh retrieves the current status from the provider. “Needs review” orders must be checked in the provider account before retrying.</p></Card>}
        {tab === 'providers' && <><div className={styles.twoColumns}><Card><p className={styles.kicker}>PROVIDER CONNECTION</p><h2>{editing ? `Update ${editing.name}` : 'Add an API provider'}</h2><p className={styles.muted}>Connect a standard SMM API using its endpoint and private key.</p><form key={editing?.id ?? 'new'} className={styles.form} onSubmit={async e => { e.preventDefault(); const form = e.currentTarget; const values = new FormData(form); const success = await action({ action: 'provider', ...(editing ? { id: editing.id } : {}), name: String(values.get('name')), endpoint: String(values.get('endpoint')), key: String(values.get('key')) }); if (success) { form.reset(); setEditing(null); } }}><label>Provider name<input name="name" defaultValue={editing?.name} required minLength={2} maxLength={80} placeholder="Name your provider" /></label><label>API endpoint<input type="url" name="endpoint" defaultValue={editing?.endpoint} readOnly={Boolean(editing)} required placeholder="https://provider.example/api/v2" /></label><label>{editing ? 'Replacement API key' : 'API key'}<input name="key" type="password" autoComplete="new-password" required maxLength={2048} placeholder="Paste your provider API key" /></label><p className={styles.caption}><LockKeyhole size={13} /> Keys are encrypted and never displayed after saving.</p><button className={styles.primary} disabled={busy || !storageReady}>{busy ? 'Saving…' : editing ? 'Update credentials' : 'Save provider'}<PlugZap size={16} /></button>{editing && <button type="button" className={styles.textLink} onClick={() => setEditing(null)}>Cancel update</button>}</form></Card><Card><h2>How the connection works</h2><div className={styles.step}><span>01</span><div><strong>Add your provider</strong><p>Use the exact endpoint and key from your provider’s API documentation.</p></div></div><div className={styles.step}><span>02</span><div><strong>Sync available services</strong><p>Import names, categories, rates, and order limits.</p></div></div><div className={styles.step}><span>03</span><div><strong>Check balance and place orders</strong><p>Your provider account pays for delivery. This panel does not hold a wallet.</p></div></div><div className={styles.message}>Supports form-encoded APIs with services, balance, add, and status actions. Custom authentication and non-standard order types need a provider adapter.</div></Card></div><Card><h2>Connected providers <span className={styles.muted}>({data.providers.length})</span></h2>{data.providers.length ? data.providers.map(p => <div className={styles.providerRow} key={p.id}><div><strong>{p.name}</strong><small>{p.endpoint}</small></div><div className={styles.actions}><button disabled={busy} className={styles.secondary} onClick={() => void action({ action: 'sync', providerId: p.id })}>Sync services</button><button disabled={busy} className={styles.secondary} onClick={() => void action({ action: 'balance', providerId: p.id })}>Balance</button><button disabled={busy} className={styles.textLink} onClick={() => setEditing(p)}>Update key</button></div></div>) : <Empty icon={<PlugZap size={28} />} title="No providers connected" text="Add your first provider using the form above." />}</Card></>}
      </div>
    </div>
  </section>;
}

function Empty({ icon, title, text }: { icon: ReactNode; title: string; text: string }) { return <div className={styles.empty}><span>{icon}</span><h3>{title}</h3><p>{text}</p></div>; }
