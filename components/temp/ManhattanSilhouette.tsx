/** Stylized Manhattan skyline silhouette for banner backgrounds */
export function ManhattanSilhouette() {
  return (
    <svg
      className="manhattan-skyline"
      viewBox="0 0 1584 240"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      preserveAspectRatio="xMidYMax slice"
    >
      <path
        fill="currentColor"
        d="M0 240V200h48V168h24v32h36V140h20v60h32V120h16v80h40V96h12v24h8V72h20v48h28V88h14v32h22V64h10v56h18V52h8v44h24V180h16V100h6v80h20V76h8v64h26V112h10v48h20V84h12v56h30V60h14v100h22V128h8v52h18V72h10v68h24V140h12v40h20V96h14v84h28V116h8v64h32V80h10v80h22V148h12v52h26V92h8v68h30V124h14v76h24V88h10v72h28V156h16v44h22V104h12v76h34V72h8v88h20V132h10v68h32V96h14v84h26V64h12v96h24V148h8v52h22V80h10v80h28V112h16v68h20V76h12v104h30V140h14v60h18V92h8v88h24V168h12v32h20V120h10v80h32V88h14v92h26V152h8v48h22V100h12v80h36V72h10v108h24V136h16v64h28V84h8v96h30V160h12v40h24V112h14v88h22V76h10v104h26V144h8v56h20V68h12v92h32V128h10v72h28V96h16v84h24V180h12v60h18V124h8v76h22V88h14v92h30V152h10v48h26V104h12v76h34V72h8v108h20V140h16v100h28V96h14v84h32V168h12v32h40V200h24v40h48v40H0Z"
      />
      {/* One World Trade - slender spire */}
      <path
        fill="currentColor"
        d="M892 240V72h28l14 48 14-48h28v168h-24v-52h-56v52h-24Z"
      />
      {/* Empire State - stepped crown */}
      <path
        fill="currentColor"
        d="M520 240V132h32l8 24 8-24h8l6 18 6-18h8l8 24 8-24h32v108h-20v-40h-12v40h-20v-48h-16v48h-20v-56h-12v56h-20Z"
      />
      {/* Chrysler-style taper */}
      <path
        fill="currentColor"
        d="M648 240V156l20-24 20 24v24l-12 16 12 20v44h-40Z"
      />
    </svg>
  );
}
