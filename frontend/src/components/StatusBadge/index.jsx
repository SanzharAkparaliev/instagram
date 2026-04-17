export default function StatusBadge({ isLead, isProcessed }) {
  if (isProcessed) return <span className="badge badge-processed">✓ Обработан</span>;
  if (isLead)      return <span className="badge badge-lead">◉ Лид</span>;
  return               <span className="badge badge-new">· Новый</span>;
}

export function ParserStatusBadge({ status }) {
  const map = {
    idle:    { cls: 'badge-idle',    label: 'Idle' },
    parsing: { cls: 'badge-parsing', label: '⟳ Парсинг' },
    banned:  { cls: 'badge-banned',  label: '✕ Бан' },
    error:   { cls: 'badge-banned',  label: '! Ошибка' },
  };
  const s = map[status] || map.idle;
  return <span className={`badge ${s.cls}`}>{s.label}</span>;
}
