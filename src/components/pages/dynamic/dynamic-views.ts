const SUPABASE_URL = "https://kqrgodqvyjpkdaziteej.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtxcmdvZHF2eWpwa2Rheml0ZWVqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ1OTU2NDEsImV4cCI6MjEwMDE3MTY0MX0.On0SRY81w8ivcmHwkuZsjAzE4mqDtnlSQjhjXTVrYx0";
const DEDUP_MINUTES = 30;

export function initAllDynamicViews(container: HTMLElement) {
  const spans = container.querySelectorAll<HTMLElement>(".dy-pv-text[data-path]");
  if (spans.length === 0) return;

  const paths: string[] = [];
  const needIncrement: string[] = [];
  const now = Date.now();

  spans.forEach((span) => {
    const viewPath = span.dataset.path;
    if (!viewPath) return;
    paths.push(viewPath);

    const storageKey = "pv_" + encodeURIComponent(viewPath);
    const stored = localStorage.getItem(storageKey);
    if (!stored || now - parseInt(stored, 10) >= DEDUP_MINUTES * 60 * 1000) {
      needIncrement.push(viewPath);
    }
  });

  const doFetch = async () => {
    try {
      // 1. Batch increment all paths that need it (must do before fetching counts)
      for (const p of needIncrement) {
        try {
          await fetch(SUPABASE_URL + "/rest/v1/rpc/increment_view", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              apikey: SUPABASE_KEY,
              Authorization: "Bearer " + SUPABASE_KEY,
            },
            body: JSON.stringify({ page_path: p }),
          });
          const storageKey = "pv_" + encodeURIComponent(p);
          localStorage.setItem(storageKey, now.toString());
        } catch { /* individual increment failed, continue */ }
      }

      // 2. Batch fetch all counts in one query
      if (paths.length === 0) return;
      const encoded = paths.map((p) => encodeURIComponent(p)).join(",");
      const res = await fetch(
        SUPABASE_URL + "/rest/v1/page_views?path=in.(" + encoded + ")&select=path,count",
        {
          headers: { apikey: SUPABASE_KEY, Authorization: "Bearer " + SUPABASE_KEY },
        }
      );
      if (!res.ok) throw new Error("fetch failed");

      const data: { path: string; count: number }[] = await res.json();

      // 3. Build lookup map and update DOM
      const countMap = new Map<string, number>();
      for (const row of data) {
        countMap.set(row.path, row.count);
      }

      spans.forEach((span) => {
        const viewPath = span.dataset.path;
        if (!viewPath) return;
        span.textContent = String(countMap.get(viewPath) ?? 0);
      });
    } catch {
      spans.forEach((span) => { span.textContent = "--"; });
    }
  };

  void doFetch();
}
