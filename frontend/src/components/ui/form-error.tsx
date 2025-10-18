export function FormError({
  id,
  children,
}: {
  id?: string;
  children?: React.ReactNode;
}) {
  if (!children) return null;
  return (
    <p id={id} className="mt-1 text-sm text-destructive">
      {children}
    </p>
  );
}
