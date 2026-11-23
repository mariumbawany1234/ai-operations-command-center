"""
Abuse protection for the public demo.

Pure Python (no FastAPI imports) so it can be unit-tested on its own.
"""

import os
import time
from collections import defaultdict, deque
from datetime import datetime, timezone


def env_int(name, default):

    """Read an integer environment variable; fall back on bad values."""

    try:
        return int(os.getenv(name, default))
    except (TypeError, ValueError):
        return default


def client_ip(forwarded_for, client_host):

    """
    Best-effort client IP.

    Behind a proxy (Render, Vercel) the socket address is the proxy's,
    so the real client is the first entry of X-Forwarded-For.
    This header can be spoofed, which is why DailyCap exists as a
    backstop that no client can bypass.
    """

    if forwarded_for:

        first = forwarded_for.split(",")[0].strip()

        if first:
            return first

    return client_host or "unknown"


class RateLimiter:

    """Sliding-window limiter: at most `limit` hits per `window` seconds per key."""

    def __init__(self, limit, window_seconds, clock=time.monotonic):

        self.limit = limit
        self.window = window_seconds
        self.clock = clock
        self._hits = defaultdict(deque)

    def check(self, key):

        """Record a hit. Returns (allowed, retry_after_seconds)."""

        now = self.clock()

        hits = self._hits[key]

        while hits and now - hits[0] >= self.window:
            hits.popleft()

        if len(hits) >= self.limit:

            retry_after = int(self.window - (now - hits[0])) + 1

            return False, max(retry_after, 1)

        hits.append(now)

        self._prune(now)

        return True, 0

    def _prune(self, now):

        """Drop idle keys so memory cannot grow without bound."""

        if len(self._hits) < 1000:
            return

        for key in list(self._hits):

            hits = self._hits[key]

            if not hits or now - hits[-1] >= self.window:
                del self._hits[key]


class DailyCap:

    """Global per-UTC-day budget for analyses."""

    def __init__(self, limit, today=None):

        self.limit = limit
        self._today = today or (lambda: datetime.now(timezone.utc).date())
        self._day = self._today()
        self._count = 0

    def try_consume(self):

        day = self._today()

        if day != self._day:
            self._day = day
            self._count = 0

        if self._count >= self.limit:
            return False

        self._count += 1

        return True