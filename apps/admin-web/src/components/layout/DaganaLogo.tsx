import daganaLogo from "../../../../../design-system/dagana/dagana-logo.png";

export function DaganaLogo() {
  return (
    <img
      src={daganaLogo}
      alt="Dagana"
      width={112}
      height={36}
      className="h-9 w-28 object-cover object-center"
    />
  );
}
