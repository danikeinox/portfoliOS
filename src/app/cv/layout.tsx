export default function CvLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-0 overflow-y-auto overscroll-y-contain cv-route">
      {children}
    </div>
  );
}
