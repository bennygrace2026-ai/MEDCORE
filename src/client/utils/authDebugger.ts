/**
 * Authentication Flow Debugger
 * Captures, formats, and logs the full Supabase response payload and
 * environment diagnostics for failed login attempts across every role
 * (Student, Admin, Super Admin) directly into the browser DevTools console.
 */

export interface AuthDebugOptions {
  role: 'Student' | 'Admin' | 'Super Admin';
  email: string;
  httpStatus?: number;
  rawResponseText?: string;
  responsePayload?: any;
  error?: any;
}

export function logAuthFailureDebug(options: AuthDebugOptions) {
  const { role, email, httpStatus, responsePayload, error } = options;
  const timestamp = new Date().toISOString();

  // Expose the raw debug record on the window object for immediate DevTools inspection
  if (typeof window !== 'undefined') {
    (window as any).__LAST_AUTH_DEBUG__ = {
      role,
      email,
      httpStatus,
      responsePayload,
      error,
      timestamp
    };
  }

  // Distinct color styling for Chrome/Firefox/Safari DevTools Console
  const badgeStyle = 'background: #dc2626; color: #ffffff; font-weight: 800; font-size: 11px; padding: 3px 8px; border-radius: 4px;';
  const roleStyle = 'background: #1e293b; color: #38bdf8; font-weight: 700; font-size: 11px; padding: 3px 6px; border-radius: 4px; margin-left: 4px;';
  const headerStyle = 'color: #ef4444; font-weight: 700; font-size: 13px;';

  console.group(
    `%c[AUTH FLOW DEBUGGER]%c ${role.toUpperCase()} %c Login Attempt Failed (${httpStatus ? 'HTTP ' + httpStatus : 'Network/Script Exception'})`,
    badgeStyle,
    roleStyle,
    headerStyle
  );

  console.warn(`[Auth Debugger] Detailed diagnosis for ${role} login (${email}) at ${timestamp}:`);

  // 1. High-Level Summary Table
  console.table({
    Role: role,
    TargetEmail: email,
    HTTPStatus: httpStatus || 'N/A (Failed before HTTP response)',
    ServerErrorMessage: responsePayload?.error || error?.message || 'Unknown error',
    DatabaseEngine: responsePayload?.debugPayload?.database?.engine || 'Pending / Unknown',
    SupabaseConfigured: responsePayload?.debugPayload?.supabase?.isConfigured ? 'YES' : 'NO',
    DeploymentPlatform: responsePayload?.debugPayload?.deploymentEnvironment?.platform || 'Local / Standard Node'
  });

  // 2. Full Supabase Response Payload
  if (responsePayload?.debugPayload?.supabase) {
    console.group('%c▶ Supabase Response Payload & Client Inspection', 'color: #10b981; font-weight: bold;');
    console.log('Supabase Client Config:', {
      isConfigured: responsePayload.debugPayload.supabase.isConfigured,
      url: responsePayload.debugPayload.supabase.url,
      hasAnonKey: responsePayload.debugPayload.supabase.hasAnonKey
    });
    console.log('Full Supabase Query / Auth Payload:', responsePayload.debugPayload.supabase.response || 'No direct query response');
    console.groupEnd();
  }

  // 3. Database Engine Diagnostics
  if (responsePayload?.debugPayload?.database) {
    console.group('%c▶ Database Engine Diagnostics', 'color: #3b82f6; font-weight: bold;');
    console.log('Engine Type:', responsePayload.debugPayload.database.engine);
    console.log('Postgres Connected:', responsePayload.debugPayload.database.isPostgres);
    console.log('Schema Initialized:', responsePayload.debugPayload.database.isSchemaInitialized);
    console.log('Drizzle Query Status:', responsePayload.debugPayload.database.drizzleStatus);
    if (responsePayload.debugPayload.database.errorDetails) {
      console.error('Database Error Details:', responsePayload.debugPayload.database.errorDetails);
    }
    console.groupEnd();
  }

  // 4. Cloud Deployment Environment Inspection
  if (responsePayload?.debugPayload?.deploymentEnvironment) {
    console.group('%c▶ Cloud Deployment Environment', 'color: #8b5cf6; font-weight: bold;');
    console.log('Environment Settings:', responsePayload.debugPayload.deploymentEnvironment);
    console.groupEnd();
  }

  // 5. Full Raw Response Body
  console.group('%c▶ Raw Server Response JSON', 'color: #f59e0b; font-weight: bold;');
  console.log(responsePayload || error);
  console.groupEnd();

  // 6. Actionable Deployment Troubleshooting Guide
  console.group('%c▶ Deployment Troubleshooting Action Items', 'color: #06b6d4; font-weight: bold;');
  if (httpStatus === 401) {
    console.info('👉 401 Unauthorized: The credentials did not match or the email is not registered.');
    console.info('   Default credentials: password "chimuanya2001" for:');
    console.info('   - Super Admin: bennygrace2026@gmail.com');
    console.info('   - Faculty Admin: admin@medcore.com');
    console.info('   - Student: student@medcore.com');
  } else if (httpStatus === 403) {
    console.info('👉 403 Forbidden: Role verification mismatch or account suspended.');
    console.info('   Ensure you are using the corresponding portal:');
    console.info('   - Super Admin Portal: /admin/super-login');
    console.info('   - Admin Portal: /admin/login');
    console.info('   - Student Portal: /login');
  } else if (!httpStatus || httpStatus >= 500) {
    console.info('👉 500 Server Error / Network Failure:');
    console.info('   1. Check your deployment environment variables on Vercel / Netlify:');
    console.info('      - SUPABASE_DATABASE_URL or DATABASE_URL');
    console.info('      - SUPABASE_URL and SUPABASE_ANON_KEY');
    console.info('   2. Verify that public.users and public.students tables are provisioned.');
    console.info('   3. Run live diagnostic anytime in console via: window.__MEDCORE_AUTH_DEBUGGER__.diagnose()');
  }
  console.groupEnd();

  console.info('%c💡 Tip: Inspect window.__LAST_AUTH_DEBUG__ in console for the interactive JS object.', 'color: #94a3b8; font-style: italic;');
  console.groupEnd();
}

// Global utility for on-demand diagnostics right from the browser console
if (typeof window !== 'undefined') {
  (window as any).__MEDCORE_AUTH_DEBUGGER__ = {
    diagnose: async () => {
      console.log('%c[MEDCORE AUDIT] Running live server & database diagnostic...', 'background: #2563eb; color: #fff; padding: 4px 8px; font-weight: bold;');
      try {
        const res = await fetch('/api/auth/diagnostic');
        const data = await res.json();
        console.log('%c[MEDCORE AUDIT RESULT]', 'color: #10b981; font-weight: bold;', data);
        return data;
      } catch (err: any) {
        console.error('%c[MEDCORE AUDIT FAILED]', 'color: #ef4444; font-weight: bold;', err.message);
        return { error: err.message };
      }
    },
    testLogin: async (email: string, password: string, role?: string) => {
      console.log(`%c[MEDCORE AUDIT] Testing login for ${email} (${role || 'STUDENT'})...`, 'background: #2563eb; color: #fff; padding: 4px 8px; font-weight: bold;');
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, expectedRole: role })
        });
        const data = await res.json();
        console.log(`%c[MEDCORE AUDIT RESPONSE] Status ${res.status}:`, 'color: #10b981; font-weight: bold;', data);
        return { status: res.status, data };
      } catch (err: any) {
        console.error('%c[MEDCORE AUDIT FAILED]', 'color: #ef4444; font-weight: bold;', err.message);
        return { error: err.message };
      }
    }
  };
}
