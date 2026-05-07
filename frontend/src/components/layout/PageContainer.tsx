export function PageContainer({
  children,
  sidebar = true
}: {
  children: React.ReactNode;
  sidebar?: boolean;
}) {
  return (
    <div className={`
    flex flex-col items-center justify-center container py-6
    ${sidebar ? "pb-22 md:pb-6" : ""}`
    }>
      {children}
    </div>
  );
}