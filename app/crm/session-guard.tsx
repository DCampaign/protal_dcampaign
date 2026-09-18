'use client';

import { useEffect } from 'react';

const IDLE_LIMIT_MS = 30 * 60 * 1000;
const SESSION_LIMIT_MS = 8 * 60 * 60 * 1000;
const SESSION_STARTED_KEY = 'dcampaign-crm-session-started';

/** End the CRM session when the user leaves the CRM document. */
export function CrmSessionGuard() {
  useEffect(() => {
    const started = Number(sessionStorage.getItem(SESSION_STARTED_KEY)) || Date.now();
    sessionStorage.setItem(SESSION_STARTED_KEY, String(started));
    let lastActivity = Date.now();
    let loggedOut = false;
    const logout = () => {
      if (loggedOut) return;
      loggedOut = true;
      const body = new Blob([], { type: 'application/json' });
      navigator.sendBeacon('/api/crm/logout', body);
      window.location.assign('/crm/login?error=session_expired');
    };
    const activity = () => { lastActivity = Date.now(); };
    const events = ['pointerdown', 'keydown', 'touchstart', 'scroll'] as const;
    events.forEach(event => window.addEventListener(event, activity, { passive: true }));
    const timer = window.setInterval(() => {
      const now = Date.now();
      if (now - lastActivity >= IDLE_LIMIT_MS || now - started >= SESSION_LIMIT_MS) logout();
    }, 60_000);
    return () => {
      window.clearInterval(timer);
      events.forEach(event => window.removeEventListener(event, activity));
    };
  }, []);

  return null;
}
