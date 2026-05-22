/** Loads Google AdSense once when VITE_ADSENSE_CLIENT is set (Netlify env). */
export function AdSenseScript() {
  const client = import.meta.env.VITE_ADSENSE_CLIENT as string | undefined;
  if (!client?.startsWith("ca-pub-")) return null;

  return (
    <script
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${client}`}
      crossOrigin="anonymous"
    />
  );
}
