import { useMe } from '@/hooks/useMe'

export function UserInfo() {
  const { data } = useMe()
  if (!data) return null
  return (
    <div className="hidden sm:flex flex-col items-end">
      <span className="text-xs font-medium leading-none">{data.name}</span>
      <span className="text-[10px] text-muted-foreground leading-none">{data.email}</span>
    </div>
  )
}
