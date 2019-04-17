
import Typography from 'typography';

const typography = new Typography({
  baseFontSize: '18px',
  baseLineHeight: 1.6,
  headerFontFamily: [
    'Helvetica', 'sans-serif',
  ],
  headerGrayHue: 'cool',
  headerWeight: 'normal',
  bodyFontFamily: [
    'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell',
    'Fira Sans', 'Droid Sans', 'georgia', 'serif',
  ],
  bodyGrayHue: 'warm'
});

if (process.env.NODE_ENV !== `production`) {
  typography.injectStyles();
}

export default typography;
