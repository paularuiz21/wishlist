import { categoryStyle } from '../lib/categories'

export default function CategoryChip({ category }) {
  const { bg, fg } = categoryStyle(category)
  return (
    <span className="chip" style={{ background: bg, color: fg }}>
      {category}
    </span>
  )
}
