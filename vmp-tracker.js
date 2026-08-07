const VMPTracker = {
    _key: 'vmp_activity_log',
    _MAX_ENTRIES: 2000,

    _log(type, data = {}) {
        const log = JSON.parse(localStorage.getItem(this._key) || '[]');
        const session = JSON.parse(localStorage.getItem('vmp_session') || 'null');
        log.push({
            id: Date.now() + Math.random().toString(36).slice(2, 6),
            type: type,
            email: session ? session.email : 'anonyme',
            restaurant: session ? (session.restaurant || '') : '',
            timestamp: new Date().toISOString(),
            page: location.pathname.split('/').pop() || 'index.html',
            userAgent: navigator.userAgent,
            ...data
        });
        if (log.length > this._MAX_ENTRIES) {
            log.splice(0, log.length - this._MAX_ENTRIES);
        }
        localStorage.setItem(this._key, JSON.stringify(log));
    },

    trackPageView() {
        this._log('page_view');
        const views = JSON.parse(localStorage.getItem('vmp_page_views') || '{}');
        const page = location.pathname.split('/').pop() || 'index.html';
        views[page] = (views[page] || 0) + 1;
        localStorage.setItem('vmp_page_views', JSON.stringify(views));
    },

    trackLogin(email) {
        this._log('login', { email: email });
    },

    trackRegister(email, name, restaurant) {
        this._log('register', { email, name, restaurant });
    },

    trackLogout() {
        this._log('logout');
    },

    trackScan(dishName) {
        this._log('scan', { dish: dishName });
    },

    trackScanComplete(dishName) {
        this._log('scan_complete', { dish: dishName });
    },

    trackSubscription(plan, amount) {
        this._log('subscription', { plan, amount });
    },

    trackAdminLogin() {
        this._log('admin_login');
    },

    trackAction(action, details = {}) {
        this._log('action', { action, ...details });
    },

    getAll() {
        return JSON.parse(localStorage.getItem(this._key) || '[]');
    },

    getPageViews() {
        return JSON.parse(localStorage.getItem('vmp_page_views') || '{}');
    },

    getByType(type) {
        return this.getAll().filter(e => e.type === type);
    },

    getToday() {
        const today = new Date().toISOString().slice(0, 10);
        return this.getAll().filter(e => e.timestamp.startsWith(today));
    },

    getThisWeek() {
        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return this.getAll().filter(e => new Date(e.timestamp) >= weekAgo);
    },

    getUniqueVisitors() {
        const all = this.getAll();
        const emails = new Set(all.map(e => e.email).filter(e => e !== 'anonyme'));
        return emails.size;
    },

    getUniqueVisitorsToday() {
        const today = new Date().toISOString().slice(0, 10);
        const all = this.getAll().filter(e => e.timestamp.startsWith(today));
        const emails = new Set(all.map(e => e.email).filter(e => e !== 'anonyme'));
        return emails.size;
    },

    clearOldEntries(daysToKeep = 90) {
        const cutoff = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);
        const log = this.getAll().filter(e => new Date(e.timestamp) >= cutoff);
        localStorage.setItem(this._key, JSON.stringify(log));
    }
};

document.addEventListener('DOMContentLoaded', function() {
    VMPTracker.trackPageView();
});

(function() {
    const _origPush = history.pushState;
    history.pushState = function() {
        _origPush.apply(this, arguments);
        VMPTracker.trackPageView();
    };
    const _origReplace = history.replaceState;
    history.replaceState = function() {
        _origReplace.apply(this, arguments);
    };
    window.addEventListener('popstate', function() {
        VMPTracker.trackPageView();
    });
})();

const _origConsoleError = console.error;
console.error = function() {
    VMPTracker.trackAction('console_error', { message: arguments[0] });
    _origConsoleError.apply(console, arguments);
};
