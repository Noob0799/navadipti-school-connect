"use client";

import { createTheme } from "@mui/material/styles";

const LINE = "#D8E4DE";
const MUTED = "#58706A";
const BG = "#F2F6F3";
const INFO = "#58706A";

export const theme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#1D4E89", contrastText: "#FFFFFF" },
    secondary: { main: "#0F8B6D", contrastText: "#FFFFFF" },
    success: { main: "#2A9461", contrastText: "#FFFFFF" },
    warning: { main: "#F2A900", contrastText: "#16302A" },
    error: { main: "#C8413B", contrastText: "#FFFFFF" },
    background: { default: BG, paper: "#FFFFFF" },
    text: { primary: "#16302A", secondary: MUTED },
    divider: LINE,
  },
  shape: { borderRadius: 10 },
  typography: {
    fontFamily: "var(--font-body), system-ui, sans-serif",
    fontSize: 15,
    body1: { fontSize: 15, lineHeight: 1.55 },
    body2: { fontSize: 13, lineHeight: 1.5 },
    h1: { fontFamily: "var(--font-display), system-ui, sans-serif", fontWeight: 800, fontSize: 30, lineHeight: 1.1 },
    h2: { fontFamily: "var(--font-display), system-ui, sans-serif", fontWeight: 800 },
    h3: { fontFamily: "var(--font-display), system-ui, sans-serif", fontWeight: 700, fontSize: 17, lineHeight: 1.3 },
    button: { textTransform: "none", fontWeight: 700 },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: { border: `1px solid ${LINE}`, boxShadow: "none", borderRadius: 14 },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: { borderRadius: 14 },
      },
    },
    MuiTableContainer: {
      styleOverrides: {
        root: { border: `1px solid ${LINE}`, borderRadius: 14 },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          backgroundColor: "#EEF4F0",
          "& .MuiTableCell-root": {
            fontSize: 12,
            fontWeight: 700,
            color: MUTED,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: { borderColor: LINE, padding: "10px 12px", overflowWrap: "anywhere" },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          "&:last-of-type .MuiTableCell-root": { borderBottom: 0 },
        },
      },
    },
    MuiTableBody: {
      styleOverrides: {
        root: {
          "& .MuiTableRow-root:hover": { backgroundColor: BG },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: "#FFFFFF",
          "& .MuiOutlinedInput-notchedOutline": { borderColor: "#C3D3CC" },
          "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#8FAAA0" },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: { padding: "9px 16px" },
        sizeSmall: { padding: "6px 12px" },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 700,
          fontSize: 12,
          height: 22,
          borderRadius: 6,
          backgroundColor: INFO,
          color: "#FFFFFF",
        },
        colorSuccess: { backgroundColor: "#2A9461", color: "#FFFFFF" },
        colorWarning: { backgroundColor: "#F2A900", color: "#16302A" },
        colorError: { backgroundColor: "#C8413B", color: "#FFFFFF" },
      },
    },
  },
});
