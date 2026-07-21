<script>
  import { onMount } from "svelte";

  export let path = "";

  const SUPABASE_URL = "https://kqrgodqvyjpkdaziteej.supabase.co";
  const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtxcmdvZHF2eWpwa2Rheml0ZWVqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ1OTU2NDEsImV4cCI6MjEwMDE3MTY0MX0.On0SRY81w8ivcmHwkuZsjAzE4mqDtnlSQjhjXTVrYx0";
  const DEDUP_MINUTES = 30;

  let count = null;
  let error = false;

  onMount(async () => {
    if (!path) return;
    try {
      const storageKey = "pv_" + encodeURIComponent(path);
      const stored = localStorage.getItem(storageKey);
      const now = Date.now();
      let shouldIncrement = true;

      if (stored) {
        const lastView = parseInt(stored, 10);
        if (now - lastView < DEDUP_MINUTES * 60 * 1000) {
          shouldIncrement = false;
        }
      }

      if (shouldIncrement) {
        const res = await fetch(SUPABASE_URL + "/rest/v1/rpc/increment_view", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: SUPABASE_KEY,
            Authorization: "Bearer " + SUPABASE_KEY,
          },
          body: JSON.stringify({ page_path: path }),
        });
        const data = await res.json();
        count = typeof data === "number" ? data : (data?.[0]?.increment_view ?? data);
        localStorage.setItem(storageKey, now.toString());
      } else {
        const res = await fetch(
          SUPABASE_URL + "/rest/v1/page_views?path=eq." + encodeURIComponent(path) + "&select=count",
          {
            headers: { apikey: SUPABASE_KEY, Authorization: "Bearer " + SUPABASE_KEY },
          }
        );
        const data = await res.json();
        count = data?.[0]?.count ?? 0;
      }
    } catch {
      error = true;
    }
  });
</script>

{#if error}
  <span>--</span>
{:else if count !== null}
  <span>{count.toLocaleString()}</span>
{:else}
  <span>...</span>
{/if}
