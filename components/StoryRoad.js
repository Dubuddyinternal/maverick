/* The story in the "Start earning" band: a student walks a dotted road,
   finds Maverick, films a video, and gets paid to UPI. One 12 s CSS loop
   (globals.css, .sr-*); it stays still for people who turn motion off. */
export default function StoryRoad() {
  return (
    <div className="sr" aria-hidden="true">
      <svg viewBox="0 0 1200 270">
        <path d="M20 232H1180" stroke="#fff" strokeWidth="6" strokeLinecap="round" strokeDasharray="1 16" fill="none" />

        {/* 1 · a laptop showing the site */}
        <g className="sr-s1">
          <rect className="sr-w" x="150" y="96" width="160" height="100" rx="10" />
          <path className="sr-w" d="M132 214h196l-14-18H146z" />
          <rect x="162" y="108" width="136" height="76" rx="5" fill="#FDEFEA" />
          <text x="230" y="134" textAnchor="middle" fontSize="13" fontWeight="800" fill="#0F0F0F">maverick.dubuddy.in</text>
          <rect x="190" y="146" width="80" height="24" rx="12" fill="#F1684C" />
          <text x="230" y="163" textAnchor="middle" fontSize="12" fontWeight="800" fill="#fff">Start earning</text>
        </g>
        <g className="sr-bang">
          <circle cx="402" cy="96" r="18" fill="#F1684C" />
          <text x="402" y="104" textAnchor="middle" fontSize="24" fontWeight="800" fill="#fff">!</text>
        </g>

        {/* 2 · recording */}
        <g className="sr-rec">
          <circle cx="672" cy="150" r="8" fill="#F1684C" />
          <text x="686" y="156" fontSize="18" fontWeight="800" fill="#fff">REC</text>
        </g>

        {/* 3 · a phone and the credit notification */}
        <g className="sr-s3">
          <rect className="sr-w" x="1040" y="96" width="70" height="124" rx="14" />
          <rect x="1050" y="112" width="50" height="92" rx="6" fill="#FDEFEA" />
          <text x="1075" y="166" textAnchor="middle" fontSize="22" fontWeight="800" fill="#1E9E6A">₹50</text>
        </g>
        <g className="sr-toast">
          <rect x="900" y="22" width="270" height="56" rx="16" fill="#fff" />
          <circle cx="928" cy="50" r="15" fill="#1E9E6A" />
          <path d="M921 50l5 5 10-11" stroke="#fff" strokeWidth="3.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <text x="952" y="45" fontSize="15" fontWeight="800" fill="#0F0F0F">₹50 credited to your UPI</text>
          <text x="952" y="64" fontSize="12.5" fill="#6B615C">Maverick · just now</text>
        </g>
        <g className="sr-coin">
          <circle cx="1020" cy="120" r="10" fill="#F5C342" />
          <circle cx="1128" cy="110" r="8" fill="#F5C342" />
          <circle cx="1000" cy="160" r="7" fill="#F5C342" />
        </g>

        {/* the student */}
        <g className="sr-walker">
          <g transform="translate(0 26)">
            <g className="sr-bob">
              <circle className="sr-w" cx="0" cy="118" r="17" fill="#0F0F0F" />
              <path className="sr-w" d="M-22 172c0-22 10-34 22-34s22 12 22 34" />
              <path className="sr-c" d="M-14 104l14-8 14 8-14 6z" fill="#F1684C" />
              <g className="sr-cam">
                <rect x="18" y="140" width="30" height="20" rx="4" fill="#F1684C" />
                <circle cx="33" cy="150" r="6" fill="#0F0F0F" />
                <path className="sr-w" d="M12 150h8" />
              </g>
            </g>
            <path className="sr-w sr-legA" d="M-6 172l0 34" />
            <path className="sr-w sr-legB" d="M6 172l0 34" />
          </g>
        </g>

        {/* the three steps, under the road */}
        <circle cx="210" cy="258" r="11" fill="#F1684C" />
        <text x="210" y="263" textAnchor="middle" fontSize="13" fontWeight="800" fill="#fff">1</text>
        <text className="sr-step" x="228" y="266">find Maverick</text>
        <circle cx="560" cy="258" r="11" fill="#F1684C" />
        <text x="560" y="263" textAnchor="middle" fontSize="13" fontWeight="800" fill="#fff">2</text>
        <text className="sr-step" x="578" y="266">film your video</text>
        <circle cx="910" cy="258" r="11" fill="#F1684C" />
        <text x="910" y="263" textAnchor="middle" fontSize="13" fontWeight="800" fill="#fff">3</text>
        <text className="sr-step" x="928" y="266">get paid to UPI</text>
      </svg>
    </div>
  );
}
