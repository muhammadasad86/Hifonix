import './fallback.css';

/**
 * Shown when WebGL2 is unavailable. Keeps the brand promise and routes
 * visitors straight to the real catalogue (live hifonix.co.uk URLs).
 */
export function Fallback() {
  return (
    <main className="fallback">
      <p className="fallback__mark">HIFONIX</p>
      <div className="fallback__media" role="img" aria-label="Storefront image placeholder">
        <span>Storefront image · placeholder</span>
      </div>
      <p className="eyebrow">396 Birmingham Road · Sutton Coldfield</p>
      <h1 className="headline">Elevated Audio Realism</h1>
      <p className="lede">
        Your device can’t display the 3D studio, but the full collection is a click away.
      </p>
      <nav className="fallback__links" aria-label="Collections">
        <a href="https://hifonix.co.uk/list/hi-fi/">Explore Hi-Fi</a>
        <a href="https://hifonix.co.uk/list/headphones/">Explore Head-Fi</a>
      </nav>
      <p className="fallback__contact">
        <a href="tel:+441213825444">0121 382 5444</a> · Demonstrations by appointment
      </p>
    </main>
  );
}
