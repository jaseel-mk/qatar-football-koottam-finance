import logo from '../../../assets/brand/qfk-logo.png?inline';

interface CrestProps {
  size?: number;
  className?: string;
}

export function QFKCrest({ size = 80, className }: CrestProps) {
  // Inline the shared Finance asset so downloaded posters retain the logo.
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className}
      role="img" aria-label="QFK logo" xmlns="http://www.w3.org/2000/svg">
      <image href={logo} width="100" height="100" preserveAspectRatio="xMidYMid meet" />
    </svg>
  );
}
