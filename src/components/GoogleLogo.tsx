interface GoogleLogoProps {
  className?: string;
}

export default function GoogleLogo({ className = "h-[18px] w-[18px]" }: GoogleLogoProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.4c-.2 1.3-.8 2.3-1.7 3.1l3 2.3c1.8-1.6 2.8-4 2.8-6.9 0-.7-.1-1.4-.2-2H12Z"
      />
      <path
        fill="#34A853"
        d="M12 21c2.6 0 4.8-.9 6.4-2.5l-3-2.3c-.8.6-1.9 1-3.4 1-2.6 0-4.7-1.7-5.4-4.1l-3.1 2.4C5.2 18.8 8.3 21 12 21Z"
      />
      <path
        fill="#4A90E2"
        d="M6.6 13.1c-.2-.6-.3-1.2-.3-1.9s.1-1.3.3-1.9l-3.1-2.4C2.9 8 2.5 9.5 2.5 11.2s.4 3.2 1 4.4l3.1-2.5Z"
      />
      <path
        fill="#FBBC05"
        d="M12 5.1c1.4 0 2.6.5 3.6 1.4l2.7-2.7C16.8 2.4 14.6 1.5 12 1.5 8.3 1.5 5.2 3.7 3.5 6.8l3.1 2.4c.7-2.4 2.8-4.1 5.4-4.1Z"
      />
    </svg>
  );
}
