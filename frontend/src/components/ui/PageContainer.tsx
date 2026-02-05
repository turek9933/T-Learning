export function PageContainer({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center container">
      {children}
    </div>
  );
}