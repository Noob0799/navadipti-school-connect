"use client";

import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#1D4E89", contrastText: "#FFFFFF" },
    secondary: { main: "#0F8B6D", contrastText: "#FFFFFF" },
    success: { main: "#2A9461" },
    warning: { main: "#F2A900" },
    error: { main: "#C8413B" },
    background: { default: "#F2F6F3", paper: "#FFFFFF" },
    text: { primary: "#16302A", secondary: "#58706A" },
    divider: "#D8E4DE",
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: "var(--font-body), system-ui, sans-serif",
    h1: { fontFamily: "var(--font-display), system-ui, sans-serif", fontWeight: 800 },
    h2: { fontFamily: "var(--font-display), system-ui, sans-serif", fontWeight: 800 },
    h3: { fontFamily: "var(--font-display), system-ui, sans-serif", fontWeight: 700 },
    button: { textTransform: "none", fontWeight: 700 },
  },
});
