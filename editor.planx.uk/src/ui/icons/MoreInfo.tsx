import SvgIcon, { SvgIconProps } from "@material-ui/core/SvgIcon";
import React from "react";

export default function MoreInfoIcon(props: SvgIconProps) {
  return (
    <SvgIcon {...props}>
      <g opacity="0.3">
        <circle cx="12" cy="12" r="11.5" stroke="black" fill="none" />
        <path
          d="M10.9899 13.9318H12.2683V13.8679C12.2896 12.5469 12.6305 11.9716 13.568 11.3857C14.5055 10.8157 15.0595 9.99538 15.0595 8.81818C15.0595 7.15625 13.845 5.94176 11.97 5.94176C10.2442 5.94176 8.87522 7.0071 8.79532 8.81818H10.1377C10.2176 7.56108 11.0965 7.04972 11.97 7.04972C12.9715 7.04972 13.7811 7.71023 13.7811 8.75426C13.7811 9.60121 13.2964 10.2085 12.6732 10.5866C11.6291 11.2205 11.0059 11.8384 10.9899 13.8679V13.9318ZM11.6717 17.0852C12.1991 17.0852 12.6305 16.6538 12.6305 16.1264C12.6305 15.5991 12.1991 15.1676 11.6717 15.1676C11.1444 15.1676 10.7129 15.5991 10.7129 16.1264C10.7129 16.6538 11.1444 17.0852 11.6717 17.0852Z"
          fill="black"
        />
      </g>
    </SvgIcon>
  );
}
