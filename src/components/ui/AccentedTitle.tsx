export default function AccentedTitle({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  const words = text.split(" ");
  const last = words.pop() ?? "";
  return (
    <span className={className}>
      {words.join(" ")} <em className="italic">{last}</em>
    </span>
  );
}
