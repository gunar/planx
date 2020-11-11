import IconButton from "@material-ui/core/IconButton";
import Menu from "@material-ui/core/Menu";
import MenuItem from "@material-ui/core/MenuItem";
import MoreVert from "@material-ui/icons/MoreVert";
import React, { useState } from "react";

interface Props {
  className?: string;
  items: Array<{
    label: string;
    disabled?: boolean;
    error?: boolean;
    onClick: () => void;
  }>;
}

const SimpleMenu: React.FC<Props> = ({ items, ...restProps }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  return (
    <div {...restProps}>
      <IconButton
        color="inherit"
        onClick={(ev) => {
          setAnchorEl(ev.currentTarget);
        }}
      >
        <MoreVert />
      </IconButton>
      <Menu
        id="long-menu"
        anchorEl={anchorEl}
        keepMounted
        open={Boolean(anchorEl)}
        onClose={() => {
          setAnchorEl(null);
        }}
      >
        {items.map((item, index) => (
          <MenuItem
            key={index}
            style={item.error ? { color: "red" } : {}}
            disabled={item.disabled}
            onClick={() => {
              item.onClick();
              setAnchorEl(null);
            }}
          >
            {item.label}
          </MenuItem>
        ))}
      </Menu>
    </div>
  );
};

export default SimpleMenu;
