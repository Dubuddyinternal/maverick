/* The doodle beside the demo videos: a phone playing a video, a clapperboard
   and a hand-written nudge. Drawn in the home page's line style. */
export default function DemoDoodle() {
  return (
    <div className="dd" aria-hidden="true">
      <svg viewBox="0 0 440 470">
        <g className="dd-float">
          <rect className="dd-ink" x="70" y="70" width="170" height="300" rx="26" transform="rotate(-8 155 220)" fill="#fff" />
          <g transform="rotate(-8 155 220)">
            <rect x="88" y="104" width="134" height="214" rx="10" fill="#FDEFEA" />
            <circle cx="155" cy="210" r="34" fill="#F1684C" />
            <path d="M146 194l26 16-26 16z" fill="#fff" />
            <path className="dd-ink" d="M135 88h40" />
            <path d="M104 290h70" stroke="#0F0F0F" strokeWidth="4" strokeLinecap="round" />
            <path d="M104 290h34" stroke="#F1684C" strokeWidth="4" strokeLinecap="round" />
          </g>
        </g>
        <g className="dd-float2">
          <path className="dd-ink" d="M270 300l120-24 14 70-120 24z" fill="#fff" />
          <path className="dd-ink" d="M266 280l120-24 4 20-120 24z" fill="#0F0F0F" />
          <path d="M290 276l10 18M322 270l10 18M354 264l10 18" stroke="#fff" strokeWidth="4" strokeLinecap="round" />
          <path className="dd-ink" d="M300 320l60-12" />
        </g>
        <path className="dd-twinkle" d="M330 120l8 18 18 8-18 8-8 18-8-18-18-8 18-8z" fill="#F1684C" />
        <path className="dd-twinkle" style={{ animationDelay: '.8s' }} d="M40 380l5 11 11 5-11 5-5 11-5-11-11-5 11-5z" fill="#3599FF" />
        <circle className="dd-twinkle" style={{ animationDelay: '1.4s' }} cx="380" cy="200" r="6" fill="#1E9E6A" />
        <path className="dd-ink" d="M250 440c40-6 80-30 110-62" strokeDasharray="2 12" />
        <path className="dd-ink" d="M352 384l10-8 2 13" />
        <text x="30" y="40" className="dd-hand" transform="rotate(-4 30 40)">
          watch one, then film yours
        </text>
        <path className="dd-ink" d="M300 52c40 6 70 30 84 70" stroke="#F1684C" />
        <path d="M384 122l-12-6m12 6l2-13" stroke="#F1684C" strokeWidth="4" strokeLinecap="round" fill="none" />
      </svg>
    </div>
  );
}
