const dayKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

export function activityDays(transactions, now = new Date()) {
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(now);
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - 6 + index);
    return { key: dayKey(date), label: index === 6 ? 'Today' : date.toLocaleDateString('en', { weekday: 'short' }), payments: 0, deposits: 0 };
  });
  for (const tx of transactions) {
    const at = tx.time ? new Date(tx.time) : tx.block_time ? new Date(tx.block_time * 1000) : null;
    if (!at || Number.isNaN(at.getTime())) continue;
    const day = days.find(item => item.key === dayKey(at));
    if (!day) continue;
    if (/transfer|payment/i.test(tx.kind)) day.payments++;
    else if (/deposit/i.test(tx.kind)) day.deposits++;
  }
  return days;
}
