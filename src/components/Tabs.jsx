export default function Tabs({ active, onChange }) {
  const tabs = [
    { value: 'active', label: 'Wishlist' },
    { value: 'purchased', label: 'Comprados' },
  ]
  return (
    <div className="tabs">
      {tabs.map((t) => (
        <button
          key={t.value}
          className={`tab ${active === t.value ? 'active' : ''}`}
          onClick={() => onChange(t.value)}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}
